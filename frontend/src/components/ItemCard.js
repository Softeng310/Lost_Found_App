import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Badge from './ui/Badge';
import { ShieldCheck, MapPin } from './ui/icons';
import { cardStyles } from '../lib/utils';

// Constants for better maintainability
const PLACEHOLDER_IMAGE = '/placeholder.svg';
const IMAGE_ALT_PREFIX = 'Image of';

// Utility function to format date
const formatDate = (dateString) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Unknown date';
    }
    
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  } catch (error) {
    console.warn('Error formatting date:', error);
    return 'Unknown date';
  }
};

// Utility function to get status color
const getStatusColor = (status) => {
  const statusColors = {
    lost: 'bg-red-100 text-red-700 border-red-200',
    found: 'bg-green-100 text-green-700 border-green-200'
  };
  return statusColors[status.toLowerCase()] || 'bg-gray-100 text-gray-700 border-gray-200';
};

const ItemCard = ({ item }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Handle image load success
  const handleImageLoad = useCallback(() => {
    setImageLoading(false);
    setImageError(false);
  }, []);

  // Handle image load error
  const handleImageError = useCallback(() => {
    setImageError(true);
    setImageLoading(false);
  }, []);

  // Get the image source
  const imageSrc = imageError ? PLACEHOLDER_IMAGE : (item.imageUrl || PLACEHOLDER_IMAGE);
  const imageAlt = `${IMAGE_ALT_PREFIX} ${item.title}`;

  // Get status display text
  const statusText = item.kind ? item.kind.charAt(0).toUpperCase() + item.kind.slice(1) : 'Unknown';

  return (
    <Link 
      to={`/items/${item.id}`}
      className="block bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200 flex flex-col h-full"
    >
      {/* Image Section */}
      <div className="relative h-48 bg-gray-200 flex-shrink-0">
        {imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        )}
        <img
          src={imageSrc}
          alt={imageAlt}
          className={`w-full h-full object-cover ${imageLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      </div>

      {/* Location and Date - Full width under image */}
      <div className="flex items-center gap-3 text-xs text-gray-500 px-4 py-2 border-b border-gray-100 flex-shrink-0">
        <span className="flex items-center gap-1.5 flex-1 min-w-0">
          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="truncate">{item.location || 'Unknown location'}</span>
        </span>
        <span className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="flex-shrink-0">🕒</span>
          <span>{formatDate(item.date)}</span>
        </span>
      </div>

      {/* Content Section */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Title */}
        <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-1">
          {item.title}
        </h3>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-3 line-clamp-2 flex-grow">
          {item.description || 'No description available'}
        </p>

        {/* Status and Category Tags - Stick to bottom */}
        <div className="flex flex-wrap gap-2 mt-auto">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(item.kind)}`}>
            {statusText}
          </span>
          {item.category && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
              {item.category}
            </span>
          )}
          {item.reporter?.trust && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">
              ✓ Verified
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

ItemCard.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string,
    description: PropTypes.string,
    location: PropTypes.string,
    date: PropTypes.string,
    imageUrl: PropTypes.string,
    kind: PropTypes.string,
    category: PropTypes.string,
    reporter: PropTypes.shape({
      trust: PropTypes.bool
    })
  }).isRequired
};

export default ItemCard;
