import { clsx } from 'clsx';

/**
 * Utility function to conditionally join classNames
 * @param  {...any} inputs - Class names or objects
 * @returns {string} - Combined className string
 */
export function cn(...inputs) {
  return clsx(inputs);
}

/**
 * Normalizes Firestore item data to a consistent UI model
 * @param {Object} data - Raw Firestore document data
 * @param {string} id - Document ID
 * @returns {Object} Normalized item object
 */
export const normalizeFirestoreItem = (data, id) => {
  const imageUrl = data.imageUrl || data.imageURL || '/placeholder.svg';
  const kindRaw = data.kind || data.status || '';
  const typeRaw = data.category || data.type || '';
  const category = String(typeRaw).toLowerCase() === 'accessories'
    ? 'accessory'
    : String(typeRaw).toLowerCase();
  const postedBy = data.postedBy;
  
  let reporter = data.reporter;
  if (!reporter) {
    if (postedBy && typeof postedBy === 'object' && postedBy.id) {
      reporter = { name: postedBy.id, trust: false };
    } else if (typeof postedBy === 'string') {
      const parts = postedBy.split('/');
      reporter = { name: parts[parts.length - 1] || 'Unknown', trust: false };
    } else {
      reporter = { name: 'Unknown', trust: false };
    }
  }

  return {
    id: id || data.id,
    kind: String(kindRaw || '').toLowerCase(),
    category,
    title: String(data.title || ''),
    description: String(data.description || ''),
    imageUrl,
    date: data.date?.toDate
      ? data.date.toDate().toISOString()
      : (data.date || new Date().toISOString()),
    location: data.location || 'Unknown',
    reporter,
  };
};

/**
 * Common button style classes to reduce duplication
 */
export const buttonStyles = {
  base: "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background h-10 py-2 px-4",
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary: "border border-input hover:bg-accent hover:text-accent-foreground",
  ghost: "hover:bg-accent hover:text-accent-foreground"
};

/**
 * Common card style classes to reduce duplication
 */
export const cardStyles = {
  base: "rounded-lg border-0 bg-white text-gray-900 shadow-sm",
  hover: "rounded-lg border-0 bg-white text-gray-900 shadow-sm hover:shadow-lg transition-all duration-200"
};

