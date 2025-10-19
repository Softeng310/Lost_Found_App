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
    querySnapshot.forEach((docSnapshot) => {
      const itemData = docSnapshot.data();
      
      // Only include items that are not resolved (exclude closed posts)
      if (itemData.status?.toLowerCase() !== 'resolved') {
        posts.push({
          id: docSnapshot.id,
          ...itemData,
          // Normalize: if kind is missing, use status field as fallback
          kind: itemData.kind || (itemData.status?.toLowerCase() === 'found' || itemData.status?.toLowerCase() === 'lost' ? itemData.status : undefined)
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
 * Fetch items from claims collection
 * @param {string} userId - The user's UID
 * @returns {Promise<Array>} Array of claimed items from claims collection
 */
async function fetchFromClaimsCollection(userId) {
  const claimsRef = collection(db, 'claims');
  const claimsQuery = query(claimsRef, where('user_id', '==', doc(db, 'users', userId)));
  const claimsSnapshot = await getDocs(claimsQuery);
  
  console.log('Found claims in claims collection:', claimsSnapshot.size);
  
  if (claimsSnapshot.size === 0) {
    return [];
  }
  
  const claimedItems = [];
  
  for (const claimDoc of claimsSnapshot.docs) {
    const claimData = claimDoc.data();
    const itemData = await fetchItemFromClaim(claimDoc, claimData);
    
    if (itemData) {
      claimedItems.push(itemData);
    }
  }
  
  return claimedItems;
}

/**
 * Fetch individual item from claim document
 * @param {Object} claimDoc - Claim document
 * @param {Object} claimData - Claim data
 * @returns {Promise<Object|null>} Item data or null
 */
async function fetchItemFromClaim(claimDoc, claimData) {
  try {
    const itemRef = claimData.item_id;
    if (!itemRef) {
      return null;
    }
    
    const itemDoc = await getDoc(itemRef);
    if (!itemDoc.exists()) {
      return null;
    }
    
    return {
      id: itemDoc.id,
      ...itemDoc.data(),
      claimId: claimDoc.id,
      claimData: claimData
    };
  } catch (itemError) {
    console.warn('Error fetching item for claim:', claimDoc.id, itemError);
    return null;
  }
}

/**
 * Fetch items with claimedBy field
 * @param {string} userId - The user's UID
 * @returns {Promise<Array>} Array of items with claimedBy field
 */
async function fetchItemsWithClaimedBy(userId) {
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
  
  return fallbackClaims;
}

/**
 * Check if user has claim in claims array
 * @param {Object} itemData - Item data
 * @param {string} userId - The user's UID
 * @returns {Object|null} User claim or null
 */
function findUserClaimInArray(itemData, userId) {
  if (!itemData.claims || !Array.isArray(itemData.claims)) {
    return null;
  }
  
  return itemData.claims.find(claim => 
    claim.user_id && claim.user_id.path === `users/${userId}`
  );
}

/**
 * Fetch claims from subcollection
 * @param {Object} itemDoc - Item document reference
 * @param {string} userId - The user's UID
 * @returns {Promise<Array>} Array of user claims from subcollection
 */
async function fetchClaimsFromSubcollection(itemDoc, userId) {
  try {
    const claimsSubRef = collection(itemDoc.ref, 'claims');
    const userClaimQuery = query(claimsSubRef, where('user_id', '==', doc(db, 'users', userId)));
    const userClaimSnapshot = await getDocs(userClaimQuery);
    
    if (userClaimSnapshot.size === 0) {
      return [];
    }
    
    return userClaimSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (subError) {
    console.warn('Subcollection access failed:', subError.message);
    return [];
  }
}

/**
 * Search all items for claims array or subcollection
 * @param {string} userId - The user's UID
 * @returns {Promise<Array>} Array of claimed items
 */
async function searchAllItemsForClaims(userId) {
  console.log('Checking all items for claims array...');
  const itemsRef = collection(db, 'items');
  const allItemsSnapshot = await getDocs(itemsRef);
  
  const claimedItems = [];
  
  for (const itemDoc of allItemsSnapshot.docs) {
    const itemData = itemDoc.data();
    
    // Check claims array
    const userClaim = findUserClaimInArray(itemData, userId);
    if (userClaim) {
      claimedItems.push({
        id: itemDoc.id,
        ...itemData,
        userClaim: userClaim
      });
      continue; // Skip subcollection check if found in array
    }
    
    // Check claims subcollection
    const userClaims = await fetchClaimsFromSubcollection(itemDoc, userId);
    if (userClaims.length > 0) {
      claimedItems.push({
        id: itemDoc.id,
        ...itemData,
        userClaims: userClaims
      });
    }
  }
  
  console.log('Found items with claims:', claimedItems.length);
  return claimedItems;
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
      const claimedItems = await fetchFromClaimsCollection(userId);
      if (claimedItems.length > 0) {
        return claimedItems;
      }
    } catch (claimsError) {
      console.log('Claims collection approach failed:', claimsError);
    }
    
    // Method 2: Try to find items with claimedBy field
    try {
      console.log('Trying items with claimedBy field...');
      const fallbackClaims = await fetchItemsWithClaimedBy(userId);
      if (fallbackClaims.length > 0) {
        return fallbackClaims;
      }
    } catch (fallbackError) {
      console.log('ClaimedBy approach failed:', fallbackError);
    }
    
    // Method 3: Check all items and look for claims array/subcollection
    try {
      const claimedItems = await searchAllItemsForClaims(userId);
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
 * Get default date format options
 * @returns {Object} Date format options
 */
function getDefaultDateFormat() {
  return {
    year: 'numeric',
    month: 'short', 
    day: 'numeric'
  };
}

/**
 * Get fallback formatted date
 * @returns {string} Current date formatted
 */
function getFallbackFormattedDate() {
  return new Date().toLocaleDateString('en-US', getDefaultDateFormat());
}

/**
 * Convert timestamp to Date object
 * @param {*} timestamp - Various timestamp formats
 * @returns {Date} Date object
 */
function parseTimestampToDate(timestamp) {
  // Handle Firestore Timestamp objects
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    console.log('Using Firestore toDate()');
    return timestamp.toDate();
  }
  
  // Handle Firebase Timestamp with seconds property
  if (timestamp.seconds) {
    console.log('Using Firebase seconds:', timestamp.seconds);
    return new Date(timestamp.seconds * 1000);
  }
  
  // Handle milliseconds timestamp
  if (typeof timestamp === 'number') {
    console.log('Using number timestamp:', timestamp);
    return new Date(timestamp);
  }
  
  // Handle regular Date objects or date strings
  console.log('Using regular Date constructor');
  return new Date(timestamp);
}

/**
 * Format Firestore timestamp for display
 * @param {Object} timestamp - Firestore timestamp
 * @returns {string} Formatted date string
 */
export function formatTimestamp(timestamp) {
  console.log('formatTimestamp called with:', timestamp, typeof timestamp);
  
  // Early return for missing timestamp
  if (!timestamp) {
    console.log('No timestamp provided, using fallback');
    return getFallbackFormattedDate();
  }
  
  try {
    const date = parseTimestampToDate(timestamp);
    
    // Early return for invalid date
    if (isNaN(date.getTime())) {
      console.warn('Invalid timestamp, using current date:', timestamp);
      return getFallbackFormattedDate();
    }
    
    const formatted = date.toLocaleDateString('en-US', getDefaultDateFormat());
    console.log('Formatted timestamp:', formatted);
    return formatted;
    
  } catch (error) {
    console.error('Error formatting timestamp, using current date:', error, timestamp);
    return getFallbackFormattedDate();
  }
}

/**
 * Update an item in Firestore
 * @param {string} itemId - The item's document ID
 * @param {Object} updateData - The data to update
 * @returns {Promise<void>}
 */
export async function updateItem(itemId, updateData) {
  try {
    const itemRef = doc(db, 'items', itemId);
    
    // Add updatedAt timestamp
    const dataToUpdate = {
      ...updateData,
      updatedAt: new Date()
    };
    
    await updateDoc(itemRef, dataToUpdate);
    console.log('Item updated successfully:', itemId);
  } catch (error) {
    console.error('Error updating item:', error);
    throw error;
  }
}

/**
 * Update user's UPI in Firestore
 * @param {string} userId - The user's UID
 * @param {string} upi - The UPI to save
 * @returns {Promise<void>}
 */
export async function updateUserUpi(userId, upi) {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      upi: upi,
      updatedAt: new Date()
    });
    console.log('User UPI updated successfully:', userId, upi);
  } catch (error) {
    console.error('Error updating user UPI:', error);
    throw error;
  }
}

/**
 * Generate and save a random 4-digit verification code to Firestore
 * @param {string} userId - The user's UID
 * @returns {Promise<string>} The generated code
 */
export async function generateAndSaveVerificationCode(userId) {
  try {
    // Generate random 4-digit code
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      verificationCode: code,
      codeGeneratedAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('Verification code saved to Firestore:', code);
    return code;
  } catch (error) {
    console.error('Error saving verification code:', error);
    throw error;
  }
}