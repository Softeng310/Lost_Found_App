import { db } from './config';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

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
      posts.push({
        id: doc.id,
        ...doc.data()
      });
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
    const itemsRef = collection(db, 'items');
    const q = query(itemsRef, where('claimedBy', '==', doc(db, 'users', userId)));
    const querySnapshot = await getDocs(q);
    
    const claims = [];
    querySnapshot.forEach((doc) => {
      claims.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return claims;
  } catch (error) {
    console.error('Error fetching user claims:', error);
    throw error;
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
 * Format Firestore timestamp for display
 * @param {Object} timestamp - Firestore timestamp
 * @returns {string} Formatted date string
 */
export function formatTimestamp(timestamp) {
  if (!timestamp) return 'Unknown date';
  
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short', 
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return 'Unknown date';
  }
}