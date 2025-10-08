import { db } from './config';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';

/**
 * Fetch user's posted items from Firestore
 * @param {string} userId - The user's UID
 * @returns {Promise<Array>} Array of user's posted items
 */
export async function getUserPosts(userId) {
  try {
    const itemsRef = collection(db, 'items');
    const q = query(itemsRef, where('postedBy', '==', doc(db, 'users', userId)));
    const querySnapshot = await getDocs(q);
    
    const posts = [];
    querySnapshot.forEach((doc) => {
      const itemData = doc.data();
      // Only include items that are not resolved (exclude closed posts)
      if (itemData.status?.toLowerCase() !== 'resolved') {
        posts.push({
          id: doc.id,
          ...itemData
        });
      }
    });
    
    return posts;
  } catch (error) {
    console.error('Error fetching user posts:', error);
    throw error;
  }
}

/**
 * Fetch items claimed by the user
 * @param {string} userId - The user's UID
 * @returns {Promise<Array>} Array of items claimed by the user
 */
export async function getUserClaims(userId) {
  try {
    console.log('Fetching claims for user:', userId);
    
    // Method 1: Try to fetch from claims collection
    try {
      const claimsRef = collection(db, 'claims');
      const claimsQuery = query(claimsRef, where('user_id', '==', doc(db, 'users', userId)));
      const claimsSnapshot = await getDocs(claimsQuery);
      
      console.log('Found claims in claims collection:', claimsSnapshot.size);
      
      if (claimsSnapshot.size > 0) {
        const claimedItems = [];
        
        // For each claim, fetch the corresponding item
        for (const claimDoc of claimsSnapshot.docs) {
          const claimData = claimDoc.data();
          console.log('Processing claim:', claimDoc.id, claimData);
          
          try {
            // Get the item reference from the claim
            const itemRef = claimData.item_id;
            if (itemRef) {
              const itemDoc = await getDoc(itemRef);
              if (itemDoc.exists()) {
                claimedItems.push({
                  id: itemDoc.id,
                  ...itemDoc.data(),
                  claimId: claimDoc.id,
                  claimData: claimData
                });
              }
            }
          } catch (itemError) {
            console.warn('Error fetching item for claim:', claimDoc.id, itemError);
          }
        }
        
        return claimedItems;
      }
    } catch (claimsError) {
      console.log('Claims collection approach failed:', claimsError);
    }
    
    // Method 2: Try to find items with claimedBy field
    try {
      console.log('Trying items with claimedBy field...');
      const itemsRef = collection(db, 'items');
      const itemsQuery = query(itemsRef, where('claimedBy', '==', doc(db, 'users', userId)));
      const itemsSnapshot = await getDocs(itemsQuery);
      
      console.log('Found items with claimedBy:', itemsSnapshot.size);
      
      const fallbackClaims = [];
      itemsSnapshot.forEach((doc) => {
        fallbackClaims.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      if (fallbackClaims.length > 0) {
        return fallbackClaims;
      }
    } catch (fallbackError) {
      console.log('ClaimedBy approach failed:', fallbackError);
    }
    
    // Method 3: Check all items and look for claims array/subcollection
    try {
      console.log('Checking all items for claims array...');
      const itemsRef = collection(db, 'items');
      const allItemsSnapshot = await getDocs(itemsRef);
      
      const claimedItems = [];
      
      for (const itemDoc of allItemsSnapshot.docs) {
        const itemData = itemDoc.data();
        
        // Check if item has claims array
        if (itemData.claims && Array.isArray(itemData.claims)) {
          const userClaim = itemData.claims.find(claim => 
            claim.user_id && claim.user_id.path === `users/${userId}`
          );
          
          if (userClaim) {
            claimedItems.push({
              id: itemDoc.id,
              ...itemData,
              userClaim: userClaim
            });
          }
        }
        
        // Also check for claims subcollection
        try {
          const claimsSubRef = collection(itemDoc.ref, 'claims');
          const userClaimQuery = query(claimsSubRef, where('user_id', '==', doc(db, 'users', userId)));
          const userClaimSnapshot = await getDocs(userClaimQuery);
          
          if (userClaimSnapshot.size > 0) {
            claimedItems.push({
              id: itemDoc.id,
              ...itemData,
              userClaims: userClaimSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            });
          }
        } catch (subError) {
          // Subcollection doesn't exist or access denied, skip
        }
      }
      
      console.log('Found items with claims:', claimedItems.length);
      return claimedItems;
      
    } catch (allItemsError) {
      console.error('All items approach failed:', allItemsError);
    }
    
    // If all methods fail, return empty array
    console.log('All claim fetching methods failed, returning empty array');
    return [];
    
  } catch (error) {
    console.error('Error fetching user claims:', error);
    return [];
  }
}

/**
 * Get user profile data
 * @param {string} userId - The user's UID  
 * @returns {Promise<Object>} User profile data
 */
export async function getUserProfile(userId) {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return {
        id: userSnap.id,
        ...userSnap.data()
      };
    } else {
      throw new Error('User not found');
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
}

/**
 * Update item status (close/resolve item)
 * @param {string} itemId - The item ID to update
 * @param {string} newStatus - The new status ('resolved', 'closed', etc.)
 * @returns {Promise<void>}
 */
export async function updateItemStatus(itemId, newStatus) {
  try {
    const itemRef = doc(db, 'items', itemId);
    await updateDoc(itemRef, {
      status: newStatus,
      updatedAt: new Date()
    });
    console.log('Item status updated successfully:', itemId, newStatus);
  } catch (error) {
    console.error('Error updating item status:', error);
    throw error;
  }
}

/**
 * Format Firestore timestamp for display
 * @param {Object} timestamp - Firestore timestamp
 * @returns {string} Formatted date string
 */
export function formatTimestamp(timestamp) {
  console.log('formatTimestamp called with:', timestamp, typeof timestamp);
  
  // If no timestamp provided, return fallback
  if (!timestamp) {
    console.log('No timestamp provided, using fallback');
    return new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short', 
      day: 'numeric'
    });
  }
  
  try {
    let date;
    
    // Handle Firestore Timestamp objects
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      console.log('Using Firestore toDate()');
      date = timestamp.toDate();
    }
    // Handle Firebase Timestamp with seconds property
    else if (timestamp.seconds) {
      console.log('Using Firebase seconds:', timestamp.seconds);
      date = new Date(timestamp.seconds * 1000);
    }
    // Handle milliseconds timestamp
    else if (typeof timestamp === 'number') {
      console.log('Using number timestamp:', timestamp);
      date = new Date(timestamp);
    }
    // Handle regular Date objects or date strings
    else {
      console.log('Using regular Date constructor');
      date = new Date(timestamp);
    }
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid timestamp, using current date:', timestamp);
      return new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short', 
        day: 'numeric'
      });
    }
    
    const formatted = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short', 
      day: 'numeric'
    });
    
    console.log('Formatted timestamp:', formatted);
    return formatted;
    
  } catch (error) {
    console.error('Error formatting timestamp, using current date:', error, timestamp);
    return new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short', 
      day: 'numeric'
    });
  }
}