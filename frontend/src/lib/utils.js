import { clsx } from 'clsx';

/**
 * Combine multiple class names conditionally
 * Useful for applying classes based on props or state
 * @param {...any} inputs - Class names, objects, or arrays
 * @returns {string} - Combined className string
 */
export function cn(...inputs) {
  return clsx(inputs);
}

// Default values for when data is missing or invalid
const DEFAULT_IMAGE_URL = '/placeholder.svg';
const DEFAULT_LOCATION = 'Unknown';
const DEFAULT_REPORTER = { name: 'Unknown', trust: false };

/**
 * Clean up Firestore data to match our UI expectations
 * Handles different field names and data formats from various sources
 * @param {Object} data - Raw document data from Firestore
 * @param {string} id - Document ID (optional)
 * @returns {Object} Normalized item object ready for the UI
 */
export const normalizeFirestoreItem = (data, id) => {
  try {
    // ...existing code...
    const imageUrl = data.imageURL || data.imageUrl || DEFAULT_IMAGE_URL;
    const kindRaw = data.kind || data.status || '';
    const kind = String(kindRaw).toLowerCase();
    const typeRaw = data.category || data.type || '';
    const category = normalizeCategory(String(typeRaw).toLowerCase());
    const reporter = normalizeReporter(data.reporter, data.postedBy);
    const date = normalizeDate(data.date);
    const location = data.location || DEFAULT_LOCATION;
    const coordinates = data.coordinates || null;

    // Claim fields
    const claimed = Boolean(data.claimed);
    const claimedAt = data.claimedAt ? normalizeDate(data.claimedAt) : null;
    const claimedBy = data.claimedBy || null;

    return {
      id: id || data.id || '',
      kind,
      category,
      title: String(data.title || '').trim(),
      description: String(data.description || '').trim(),
      imageUrl,
      date,
      location,
      coordinates,
      reporter,
      claimed,
      claimedAt,
      claimedBy,
    };
  } catch (error) {
    console.error('Error normalizing Firestore item:', error);
    // Return a safe fallback so the UI doesn't crash
    return {
      id: id || '',
      kind: 'unknown',
      category: 'other',
      title: 'Error loading item',
      description: 'This item could not be loaded properly.',
      imageUrl: DEFAULT_IMAGE_URL,
      date: new Date().toISOString(),
      location: DEFAULT_LOCATION,
      coordinates: null,
      reporter: DEFAULT_REPORTER,
    };
  }
};

/**
 * Map category names to consistent values
 * Handles variations like 'accessories' vs 'accessory'
 * @param {string} category - Raw category string
 * @returns {string} Normalized category name
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
 * Extract reporter information from various data formats
 * Handles both direct user objects and Firestore document references
 * @param {Object|undefined} reporter - Direct reporter object
 * @param {Object|string|undefined} postedBy - Firestore reference or user ID
 * @returns {Object} Normalized reporter object with name and trust status
 */
const normalizeReporter = (reporter, postedBy) => {
  // If we have a direct reporter object, use it
  if (reporter && typeof reporter === 'object') {
    return {
      name: reporter.name || 'Unknown',
      trust: Boolean(reporter.trust)
    };
  }
  
  // Handle postedBy reference - could be a Firestore doc ref or user ID
  if (postedBy) {
    if (typeof postedBy === 'object' && postedBy.id) {
      return { name: postedBy.id, trust: false };
    } else if (typeof postedBy === 'string') {
      // Extract user ID from path like 'users/abc123'
      const parts = postedBy.split('/');
      const name = parts[parts.length - 1] || 'Unknown';
      return { name, trust: false };
    }
  }
  
  return DEFAULT_REPORTER;
};

/**
 * Convert various date formats to ISO strings
 * Handles Firestore timestamps, Date objects, strings, and numbers
 * @param {any} dateValue - Date value from Firestore or form
 * @returns {string} ISO date string for consistent display
 */
const normalizeDate = (dateValue) => {
  try {
    // Handle Firestore Timestamp objects
    if (dateValue?.toDate && typeof dateValue.toDate === 'function') {
      return dateValue.toDate().toISOString();
    } else if (dateValue instanceof Date) {
      // Handle JavaScript Date objects
      return dateValue.toISOString();
    } else if (typeof dateValue === 'string') {
      // Handle string dates
      const parsed = new Date(dateValue);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    } else if (typeof dateValue === 'number') {
      // Handle timestamp numbers (milliseconds since epoch)
      const parsed = new Date(dateValue);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    }
    
    // Fallback to current date if parsing fails
    return new Date().toISOString();
  } catch (error) {
    console.warn('Error normalizing date:', error);
    return new Date().toISOString();
  }
};

/**
 * Pre-built button styles to reduce duplication
 * Each variant has its own color scheme and hover states
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
 * Card styling options for different use cases
 * Includes hover effects and interactive states
 */
export const cardStyles = {
  base: "rounded-lg border border-gray-200 bg-white text-gray-900 shadow-sm",
  hover: "rounded-lg border border-gray-200 bg-white text-gray-900 shadow-sm hover:shadow-lg hover:border-emerald-300 transition-all duration-200",
  interactive: "rounded-lg border border-gray-200 bg-white text-gray-900 shadow-sm hover:shadow-md hover:border-emerald-300 hover:scale-[1.02] transition-all duration-200 cursor-pointer"
};

/**
 * Input field styling for forms
 * Includes focus states and error handling
 */
export const inputStyles = {
  base: "w-full border rounded-lg px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1",
  default: "border-gray-300 focus:border-emerald-500",
  error: "border-red-300 focus:border-red-500 focus:ring-red-500",
  success: "border-emerald-300 focus:border-emerald-500"
};

/**
 * Common spacing utilities for consistent layouts
 * Use these instead of hardcoded spacing values
 */
export const spacing = {
  xs: 'space-y-1',
  sm: 'space-y-2',
  md: 'space-y-4',
  lg: 'space-y-6',
  xl: 'space-y-8'
};

/**
 * Typography styles for consistent text appearance
 * Helps maintain visual hierarchy across the app
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
 * Delay function execution to improve performance
 * Useful for search inputs and other frequent events
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
 * Limit function execution rate
 * Useful for scroll events and other high-frequency actions
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
 * Safely parse JSON strings without crashing
 * Returns fallback value if parsing fails
 * @param {string} jsonString - JSON string to parse
 * @param {any} fallback - Value to return if parsing fails
 * @returns {any} Parsed JSON or fallback value
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
 * Convert file size in bytes to human-readable format
 * Shows sizes like "2.5 MB" instead of raw bytes
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size with units
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

