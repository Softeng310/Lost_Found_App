/**
 * Centralized Firestore Data Normalization Service
 * 
 * This service provides a single source of truth for transforming Firestore documents
 * into consistent JavaScript objects. It handles:
 * - Firestore Timestamp conversions
 * - Field name reconciliation (e.g., imageURL vs imageUrl)
 * - Multiple date field variations
 * - Type coercion and defaults
 * 
 * Benefits:
 * - Easier debugging with preserved _raw data
 * - Consistent data shape across the app
 * - Single place to update when Firestore schema changes
 */

/**
 * Normalize a Firestore Timestamp to ISO string or null
 * Handles multiple timestamp formats from Firestore
 * 
 * @param {*} value - Firestore Timestamp, Date, or timestamp object
 * @returns {string|null} ISO date string or null
 */
export const normalizeTimestamp = (value) => {
  if (!value) return null;
  
  // Firestore Timestamp object with toDate() method
  if (value.toDate && typeof value.toDate === 'function') {
    try {
      return value.toDate().toISOString();
    } catch (e) {
      console.warn('Failed to convert Firestore Timestamp:', e);
      return null;
    }
  }
  
  // Already a Date object
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value.toISOString();
  }
  
  // Firestore snapshot with .seconds property
  if (value.seconds !== undefined) {
    try {
      return new Date(value.seconds * 1000).toISOString();
    } catch (e) {
      console.warn('Failed to convert Firestore seconds:', e);
      return null;
    }
  }
  
  // String timestamp
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }
  
  // Number timestamp (milliseconds)
  if (typeof value === 'number') {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }
  
  return null;
};

/**
 * Extract a date from a document by checking multiple possible field names
 * Firestore documents often have inconsistent date field naming
 * 
 * @param {Object} doc - Firestore document data
 * @param {string[]} fieldNames - Array of field names to check in order
 * @returns {string|null} ISO date string or null
 */
export const extractDate = (doc, fieldNames = ['date', 'createdAt', 'created_at', 'timestamp', 'dateCreated']) => {
  for (const field of fieldNames) {
    if (doc[field]) {
      const normalized = normalizeTimestamp(doc[field]);
      if (normalized) return normalized;
    }
  }
  return null;
};

/**
 * Normalize an item document (lost/found items)
 * 
 * Reconciles field name variations:
 * - type/category for item category
 * - status/kind for lost/found
 * - imageURL/imageUrl/image for image URLs
 * - Multiple date field variations
 * 
 * @param {Object} data - Raw Firestore document data
 * @param {string} id - Document ID
 * @returns {Object} Normalized item object
 */
export const normalizeItem = (data, id) => {
  if (!data) {
    console.warn('normalizeItem received null/undefined data for id:', id);
    return null;
  }

  return {
    id,
    // Core fields
    title: data.title || '',
    description: data.description || '',
    
    // Reconcile field name variations
    category: data.type || data.category || '',
    kind: (data.status || data.kind || 'lost').toLowerCase(),
    imageUrl: data.imageURL || data.imageUrl || data.image || '',
    location: data.location || '',
    
    // Dates - check multiple possible field names
    date: extractDate(data),
    
    // Claims data (new system)
    claimed: Boolean(data.claimed),
    claimedAt: normalizeTimestamp(data.claimedAt),
    claimedBy: data.claimedBy || null,
    
    // User reference
    user: data.user || null,
    userId: data.userId || data.user?.id || null,
    
    // Contact information for reporter
    contactName: data.contactName || null,
    contactEmail: data.contactEmail || null,
    contactPhone: data.contactPhone || null,
    
    // Legacy status field (kept for backward compatibility)
    status: data.status || data.kind || 'lost',
    
    // Preserve original for debugging
    _raw: data
  };
};

/**
 * Normalize a user document
 * 
 * @param {Object} data - Raw Firestore document data
 * @param {string} id - Document ID
 * @returns {Object} Normalized user object
 */
export const normalizeUser = (data, id) => {
  if (!data) {
    console.warn('normalizeUser received null/undefined data for id:', id);
    return null;
  }

  return {
    id,
    name: data.name || data.displayName || '',
    email: data.email || '',
    profilePic: data.profilePic || data.photoURL || null,
    createdAt: extractDate(data, ['createdAt', 'created_at', 'joinedAt']),
    
    // Preserve original
    _raw: data
  };
};

/**
 * Normalize a conversation document
 * 
 * @param {Object} data - Raw Firestore document data
 * @param {string} id - Document ID
 * @returns {Object} Normalized conversation object
 */
export const normalizeConversation = (data, id) => {
  if (!data) {
    console.warn('normalizeConversation received null/undefined data for id:', id);
    return null;
  }

  return {
    id,
    participants: data.participants || [],
    itemId: data.itemId || null,
    lastMessage: data.lastMessage || '',
    lastMessageTime: normalizeTimestamp(data.lastMessageTime),
    lastMessageSender: data.lastMessageSender || null,
    createdAt: extractDate(data),
    
    // Preserve original
    _raw: data
  };
};

/**
 * Normalize a message document
 * 
 * @param {Object} data - Raw Firestore document data
 * @param {string} id - Document ID
 * @returns {Object} Normalized message object
 */
export const normalizeMessage = (data, id) => {
  if (!data) {
    console.warn('normalizeMessage received null/undefined data for id:', id);
    return null;
  }

  return {
    id,
    conversationId: data.conversationId || '',
    senderId: data.senderId || '',
    senderName: data.senderName || 'Unknown',
    text: data.text || '',
    timestamp: normalizeTimestamp(data.timestamp),
    
    // Preserve original
    _raw: data
  };
};

/**
 * Normalize an announcement document
 * 
 * @param {Object} data - Raw Firestore document data
 * @param {string} id - Document ID
 * @returns {Object} Normalized announcement object
 */
export const normalizeAnnouncement = (data, id) => {
  if (!data) {
    console.warn('normalizeAnnouncement received null/undefined data for id:', id);
    return null;
  }

  return {
    id,
    title: data.title || '',
    message: data.message || data.content || '',
    category: data.category || 'general',
    priority: data.priority || 'normal',
    createdAt: extractDate(data),
    expiresAt: normalizeTimestamp(data.expiresAt),
    author: data.author || null,
    
    // Preserve original
    _raw: data
  };
};

/**
 * Helper to get a displayable timestamp string from normalized data
 * 
 * @param {Object} item - Normalized item with date field
 * @returns {string} Formatted date string or 'Unknown date'
 */
export const getDisplayDate = (item) => {
  if (!item.date) return 'Unknown date';
  
  try {
    const date = new Date(item.date);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (e) {
    console.warn('Failed to format date:', e);
    return 'Unknown date';
  }
};
