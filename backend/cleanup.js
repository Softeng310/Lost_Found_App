const admin = require('firebase-admin');

// Initialize Firebase if not already initialized
if (!admin.apps.length) {
  const path = require('path');
  const serviceAccountPath = path.join(__dirname, 'firebase-service-account.json');
  
  try {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://lost-no-more-3b0d6-default-rtdb.firebaseio.com',
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'lost-no-more-3b0d6.appspot.com'
    });
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
  }
}

const db = admin.firestore();

/**
 * Auto-cleanup function to delete conversations for items marked as found 24 hours ago
 * This function should be called periodically (e.g., every hour)
 */
const autoCleanupFoundItems = async () => {
  try {
    console.log('🧹 Starting auto-cleanup of found items...');
    
    const twentyFourHoursAgo = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() - 24 * 60 * 60 * 1000)
    );

    // Find items that were marked as found 24+ hours ago
    const foundItemsQuery = db.collection('items')
      .where('status', '==', 'found')
      .where('foundDate', '<=', twentyFourHoursAgo);

    const foundItemsSnapshot = await foundItemsQuery.get();
    
    if (foundItemsSnapshot.empty) {
      console.log('✅ No items found for cleanup');
      return { cleaned: 0, items: [] };
    }

    const itemIds = [];
    let conversationsDeleted = 0;
    let messagesDeleted = 0;

    foundItemsSnapshot.forEach(doc => {
      itemIds.push(doc.id);
    });

    console.log(`🔍 Found ${itemIds.length} items marked as found 24+ hours ago`);

    // Process each item
    for (const itemId of itemIds) {
      try {
        // Find conversations for this item
        const conversationsQuery = db.collection('conversations').where('itemId', '==', itemId);
        const conversationsSnapshot = await conversationsQuery.get();
        
        if (conversationsSnapshot.empty) {
          continue;
        }

        // Create a batch for efficient deletion
        const batch = db.batch();
        
        for (const conversationDoc of conversationsSnapshot.docs) {
          const conversationId = conversationDoc.id;
          
          // Find and delete all messages for this conversation
          const messagesQuery = db.collection('messages').where('conversationId', '==', conversationId);
          const messagesSnapshot = await messagesQuery.get();
          
          messagesSnapshot.forEach(messageDoc => {
            batch.delete(messageDoc.ref);
            messagesDeleted++;
          });
          
          // Delete the conversation
          batch.delete(conversationDoc.ref);
          conversationsDeleted++;
        }
        
        // Execute the batch
        await batch.commit();
        
      } catch (itemError) {
        console.error(`❌ Error processing item ${itemId}:`, itemError);
      }
    }

    console.log(`✅ Cleanup completed: ${conversationsDeleted} conversations and ${messagesDeleted} messages deleted`);
    
    return {
      cleaned: itemIds.length,
      items: itemIds,
      conversationsDeleted,
      messagesDeleted
    };
    
  } catch (error) {
    console.error('❌ Error in auto cleanup:', error);
    throw error;
  }
};

/**
 * Cleanup conversations that are older than 7 days regardless of item status
 * This prevents orphaned conversations from accumulating
 */
const cleanupOldConversations = async () => {
  try {
    console.log('🧹 Starting cleanup of old conversations...');
    
    const sevenDaysAgo = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );

    const oldConversationsQuery = db.collection('conversations')
      .where('createdAt', '<=', sevenDaysAgo);

    const oldConversationsSnapshot = await oldConversationsQuery.get();
    
    if (oldConversationsSnapshot.empty) {
      console.log('✅ No old conversations found for cleanup');
      return { cleaned: 0 };
    }

    let conversationsDeleted = 0;
    let messagesDeleted = 0;
    
    // Create a batch for efficient deletion
    const batch = db.batch();
    
    for (const conversationDoc of oldConversationsSnapshot.docs) {
      const conversationId = conversationDoc.id;
      
      // Find and delete all messages for this conversation
      const messagesQuery = db.collection('messages').where('conversationId', '==', conversationId);
      const messagesSnapshot = await messagesQuery.get();
      
      messagesSnapshot.forEach(messageDoc => {
        batch.delete(messageDoc.ref);
        messagesDeleted++;
      });
      
      // Delete the conversation
      batch.delete(conversationDoc.ref);
      conversationsDeleted++;
    }
    
    // Execute the batch
    await batch.commit();
    
    console.log(`✅ Old conversations cleanup completed: ${conversationsDeleted} conversations and ${messagesDeleted} messages deleted`);
    
    return {
      cleaned: conversationsDeleted,
      messagesDeleted
    };
    
  } catch (error) {
    console.error('❌ Error in old conversations cleanup:', error);
    throw error;
  }
};

/**
 * Run both cleanup functions
 */
const runFullCleanup = async () => {
  try {
    console.log('🚀 Starting full cleanup process...');
    
    const foundItemsResult = await autoCleanupFoundItems();
    const oldConversationsResult = await cleanupOldConversations();
    
    const totalResult = {
      timestamp: new Date().toISOString(),
      foundItemsCleanup: foundItemsResult,
      oldConversationsCleanup: oldConversationsResult,
      totalConversationsDeleted: foundItemsResult.conversationsDeleted + oldConversationsResult.cleaned,
      totalMessagesDeleted: foundItemsResult.messagesDeleted + oldConversationsResult.messagesDeleted
    };
    
    console.log('🎉 Full cleanup completed:', totalResult);
    
    return totalResult;
    
  } catch (error) {
    console.error('❌ Error in full cleanup:', error);
    throw error;
  }
};

// Export functions
module.exports = {
  autoCleanupFoundItems,
  cleanupOldConversations,
  runFullCleanup
};

// If this file is run directly, execute the cleanup
if (require.main === module) {
  runFullCleanup()
    .then((result) => {
      console.log('✅ Cleanup script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Cleanup script failed:', error);
      process.exit(1);
    });
}