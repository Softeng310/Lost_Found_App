import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Badge from './ui/Badge';
import { ShieldCheck } from './ui/icons';
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
    <Link to={`/items/${item.id}`} className="block group">
      <div className={`${cardStyles.hover} h-full transition-all duration-200 hover:scale-[1.02]`}>
        <div className="p-6">
          <div className="flex gap-4">
            {/* Item Image */}
            <div className="relative">
              <div className="w-24 h-24 rounded-lg border border-gray-200 overflow-hidden bg-gray-100 flex-shrink-0 group-hover:border-emerald-300 transition-colors">
                {imageLoading && (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
                  </div>
                )}
                <img
                  src={imageSrc}
                  alt={imageAlt}
                  className={`object-cover w-full h-full transition-opacity duration-200 ${
                    imageLoading ? 'opacity-0' : 'opacity-100'
                  }`}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />
              </div>
              {item.reporter?.trust && (
                <div className="absolute -top-2 -right-2">
                  <Badge 
                    variant="outline" 
                    className="gap-1 border-emerald-300 text-emerald-700 bg-emerald-50 text-xs font-medium px-2 py-1"
                  >
                    <ShieldCheck className="h-3 w-3" />
                    Trusted
                  </Badge>
                </div>
              )}
            </div>
            
            {/* Item Details */}
            <div className="flex-1 min-w-0">
              {/* Status and Category Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge 
                  className={`capitalize text-xs font-medium border ${getStatusColor(statusText)}`}
                >
                  {statusText}
                </Badge>
                <Badge 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium capitalize"
                >
                  {item.category || 'Uncategorized'}
                </Badge>
              </div>
              
              {/* Title */}
              <h3 className="font-semibold text-gray-900 text-sm mb-2 leading-tight line-clamp-2 group-hover:text-emerald-700 transition-colors">
                {item.title || 'Untitled Item'}
              </h3>
              
              {/* Description */}
              <p className="text-xs text-gray-600 mb-3 leading-relaxed line-clamp-2">
                {item.description || 'No description provided'}
              </p>
              
              {/* Location and Date */}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="truncate">
                  📍 {item.location || 'Unknown location'}
                </span>
                <span className="text-gray-400">•</span>
                <span className="truncate">
                  🕒 {formatDate(item.date)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ItemCard;
