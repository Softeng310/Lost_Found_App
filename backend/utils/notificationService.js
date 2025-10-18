const admin = require('firebase-admin');

async function checkAndCreateNotifications(newItem) {
  try {
    const db = admin.firestore();
    
    // Get all notification preferences
    const prefsSnapshot = await db.collection('notificationPreferences').get();
    
    for (const prefDoc of prefsSnapshot.docs) {
      const prefs = prefDoc.data();
      const userId = prefDoc.id;
      
      // Skip if it's the user's own post
      if (userId === newItem.reportedBy) continue;
      
      let shouldNotify = false;
      let matchReason = '';
      
      // Check category match
      if (prefs.categories && prefs.categories.includes(newItem.category)) {
        shouldNotify = true;
        matchReason = `Category: ${newItem.category}`;
      }
      
      // Check keyword match
      if (prefs.keywords && prefs.keywords.length > 0) {
        const itemText = `${newItem.title} ${newItem.description}`.toLowerCase();
        const matchedKeyword = prefs.keywords.find(keyword => 
          itemText.includes(keyword.toLowerCase())
        );
        
        if (matchedKeyword) {
          shouldNotify = true;
          matchReason = matchReason 
            ? `${matchReason}, Keyword: ${matchedKeyword}`
            : `Keyword: ${matchedKeyword}`;
        }
      }
      
      // Create notification if match found
      if (shouldNotify) {
        await db.collection('notifications').add({
          userId: userId,
          itemId: newItem.id,
          type: newItem.type,
          title: `New ${newItem.type} item matches your interests`,
          message: `${newItem.title} - ${matchReason}`,
          itemData: {
            title: newItem.title,
            category: newItem.category,
            location: newItem.location,
            imageUrl: newItem.imageUrl
          },
          read: false,
          createdAt: new Date().toISOString()
        });
      }
    }
  } catch (error) {
    console.error('Error creating notifications:', error);
  }
}

module.exports = { checkAndCreateNotifications };