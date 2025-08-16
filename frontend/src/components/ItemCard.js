import React from 'react';
import { Link } from 'react-router-dom';
import Badge from './ui/Badge';
import { ShieldCheck } from './ui/icons';

const ItemCard = ({ item }) => {
  return (
    <Link to={`/items/${item.id}`} className="block">
      <div className="rounded-lg border-0 bg-white text-gray-900 shadow-sm hover:shadow-lg transition-all duration-200 h-full group">
        <div className="p-6 pt-0 p-4">
          <div className="flex gap-4">
            {/* Item Image */}
            <img
              src={item.imageUrl || "/placeholder.svg"}
              alt={item.title}
              width={96}
              height={96}
              className="rounded-lg border border-gray-200 object-cover aspect-square flex-shrink-0 group-hover:border-gray-300 transition-colors"
            />
            
            {/* Item Details */}
            <div className="flex-1 min-w-0">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge variant="secondary" className="capitalize bg-gray-100 text-gray-600 border-gray-200 text-xs font-medium">
                  {item.kind}
                </Badge>
                <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium">
                  {item.category}
                </Badge>
                {item.reporter.trust && (
                  <Badge variant="outline" className="gap-1 border-gray-300 text-gray-600 text-xs font-medium">
                    <ShieldCheck />
                    Trusted
                  </Badge>
                )}
              </div>
              
              {/* Title */}
              <div className="font-semibold truncate text-gray-900 text-sm mb-1">
                {item.title}
              </div>
              
              {/* Description */}
              <div className="text-xs text-gray-500 truncate mb-2 leading-relaxed">
                {item.description}
              </div>
              
              {/* Location and Date */}
              <div className="text-xs text-gray-400 truncate">
                {`${item.location.name} · ${new Date(item.date).toLocaleDateString()}`}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ItemCard;
