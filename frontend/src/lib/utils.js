import { clsx } from 'clsx';

/**
 * Utility function to conditionally join classNames
 * @param {...any} inputs - Class names or objects
 * @returns {string} - Combined className string
 */
export function cn(...inputs) {
  return clsx(inputs);
}

// Constants for better maintainability
const DEFAULT_IMAGE_URL = '/placeholder.svg';
const DEFAULT_LOCATION = 'Unknown';
const DEFAULT_REPORTER = { name: 'Unknown', trust: false };

/**
 * Normalizes Firestore item data to a consistent UI model
 * @param {Object} data - Raw Firestore document data
 * @param {string} id - Document ID
 * @returns {Object} Normalized item object
 */
export const normalizeFirestoreItem = (data, id) => {
  try {
    // Handle image URL with fallbacks
    const imageUrl = data.imageURL || data.imageUrl || DEFAULT_IMAGE_URL;
    
    // Normalize status/kind
    const kindRaw = data.kind || data.status || '';
    const kind = String(kindRaw).toLowerCase();
    
    // Normalize category/type
    const typeRaw = data.category || data.type || '';
    const category = normalizeCategory(String(typeRaw).toLowerCase());
    
    // Handle reporter information
    const reporter = normalizeReporter(data.reporter, data.postedBy);
    
    // Normalize date
    const date = normalizeDate(data.date);
    
    // Normalize location
    const location = data.location || DEFAULT_LOCATION;

    return {
      id: id || data.id || '',
      kind,
      category,
      title: String(data.title || '').trim(),
      description: String(data.description || '').trim(),
      imageUrl,
      date,
      location,
      reporter,
    };
  } catch (error) {
    console.error('Error normalizing Firestore item:', error);
    // Return a safe fallback object
    return {
      id: id || '',
      kind: 'unknown',
      category: 'other',
      title: 'Error loading item',
      description: 'This item could not be loaded properly.',
      imageUrl: DEFAULT_IMAGE_URL,
      date: new Date().toISOString(),
      location: DEFAULT_LOCATION,
      reporter: DEFAULT_REPORTER,
    };
  }
};

/**
 * Normalizes category names for consistency
 * @param {string} category - Raw category string
 * @returns {string} Normalized category
 */
const normalizeCategory = (category) => {
  const categoryMap = {
    'accessories': 'accessory',
    'keys/cards': 'keys-cards',
    'wallets': 'wallet',
    'documents': 'document',
    'stationery': 'stationery',
    'electronics': 'electronics',
    'clothing': 'clothing',
    'other': 'other'
  };
  
  return categoryMap[category] || category;
};

/**
 * Normalizes reporter information
 * @param {Object|undefined} reporter - Reporter object
 * @param {Object|string|undefined} postedBy - Posted by reference
 * @returns {Object} Normalized reporter object
 */
const normalizeReporter = (reporter, postedBy) => {
  if (reporter && typeof reporter === 'object') {
    return {
      name: reporter.name || 'Unknown',
      trust: Boolean(reporter.trust)
    };
  }
  
  // Handle postedBy reference
  if (postedBy) {
    if (typeof postedBy === 'object' && postedBy.id) {
      return { name: postedBy.id, trust: false };
    } else if (typeof postedBy === 'string') {
      const parts = postedBy.split('/');
      const name = parts[parts.length - 1] || 'Unknown';
      return { name, trust: false };
    }
  }
  
  return DEFAULT_REPORTER;
};

/**
 * Normalizes date values
 * @param {any} dateValue - Date value from Firestore
 * @returns {string} ISO date string
 */
const normalizeDate = (dateValue) => {
  try {
    if (dateValue?.toDate && typeof dateValue.toDate === 'function') {
      // Firestore Timestamp
      return dateValue.toDate().toISOString();
    } else if (dateValue instanceof Date) {
      // JavaScript Date
      return dateValue.toISOString();
    } else if (typeof dateValue === 'string') {
      // String date
      const parsed = new Date(dateValue);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    } else if (typeof dateValue === 'number') {
      // Timestamp number
      const parsed = new Date(dateValue);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    }
    
    // Fallback to current date
    return new Date().toISOString();
  } catch (error) {
    console.warn('Error normalizing date:', error);
    return new Date().toISOString();
  }
};

/**
 * Common button style classes to reduce duplication
 */
export const buttonStyles = {
  base: "inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background h-10 py-2 px-4",
  primary: "bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-sm",
  secondary: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100",
  ghost: "text-gray-700 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200",
  outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100",
  destructive: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm"
};

/**
 * Common card style classes to reduce duplication
 */
export const cardStyles = {
  base: "rounded-lg border border-gray-200 bg-white text-gray-900 shadow-sm",
  hover: "rounded-lg border border-gray-200 bg-white text-gray-900 shadow-sm hover:shadow-lg hover:border-emerald-300 transition-all duration-200",
  interactive: "rounded-lg border border-gray-200 bg-white text-gray-900 shadow-sm hover:shadow-md hover:border-emerald-300 hover:scale-[1.02] transition-all duration-200 cursor-pointer"
};

/**
 * Common input style classes
 */
export const inputStyles = {
  base: "w-full border rounded-lg px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1",
  default: "border-gray-300 focus:border-emerald-500",
  error: "border-red-300 focus:border-red-500 focus:ring-red-500",
  success: "border-emerald-300 focus:border-emerald-500"
};

/**
 * Common spacing utilities
 */
export const spacing = {
  xs: 'space-y-1',
  sm: 'space-y-2',
  md: 'space-y-4',
  lg: 'space-y-6',
  xl: 'space-y-8'
};

/**
 * Common text utilities
 */
export const textStyles = {
  h1: 'text-3xl font-bold text-gray-900',
  h2: 'text-2xl font-semibold text-gray-900',
  h3: 'text-xl font-semibold text-gray-900',
  h4: 'text-lg font-medium text-gray-900',
  body: 'text-base text-gray-700',
  small: 'text-sm text-gray-600',
  caption: 'text-xs text-gray-500'
};

/**
 * Debounce function for performance optimization
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for performance optimization
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Safe JSON parse with fallback
 * @param {string} jsonString - JSON string to parse
 * @param {any} fallback - Fallback value if parsing fails
 * @returns {any} Parsed JSON or fallback
 */
export function safeJsonParse(jsonString, fallback = null) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn('Failed to parse JSON:', error);
    return fallback;
  }
}

/**
 * Format file size in human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

