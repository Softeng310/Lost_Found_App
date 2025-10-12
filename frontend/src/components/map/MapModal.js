import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { X } from '../ui/icons';

// Fix for default marker icons in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

/**
 * MapModal Component
 * Full-screen modal displaying an interactive map
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Callback to close the modal
 * @param {number} props.latitude - Latitude coordinate
 * @param {number} props.longitude - Longitude coordinate
 * @param {string} props.locationName - Name of the location
 * @param {string} props.title - Title to display in the modal header
 */
const MapModal = ({ 
  isOpen, 
  onClose, 
  latitude, 
  longitude, 
  locationName = 'Location',
  title = 'Item Location'
}) => {
  // Prevent body scroll when modal is open and manage z-index
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
    } else {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('modal-open');
    }
    
    return () => {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  // Handle escape key press
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const position = [latitude, longitude];

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div 
        className="relative w-full h-full max-w-6xl max-h-[90vh] m-4 bg-white rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-white">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-600 mt-1">
              {locationName} • Lat: {latitude.toFixed(4)}, Lng: {longitude.toFixed(4)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close map"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Map */}
        <div className="w-full h-[calc(100%-80px)] relative leaflet-modal">
          <MapContainer
            center={position}
            zoom={16}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
            className="leaflet-modal"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={position}>
              <Popup>
                <div className="font-medium">{locationName}</div>
                <div className="text-xs text-gray-600 mt-1">
                  Lat: {latitude.toFixed(4)}, Lng: {longitude.toFixed(4)}
                </div>
              </Popup>
            </Marker>
          </MapContainer>
        </div>

        {/* Footer with instructions */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-white border-t">
          <p className="text-xs text-gray-600 text-center">
            Use your mouse/trackpad to pan and zoom. Click the marker for details.
          </p>
        </div>
      </div>
    </div>
  );
};

MapModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  latitude: PropTypes.number.isRequired,
  longitude: PropTypes.number.isRequired,
  locationName: PropTypes.string,
  title: PropTypes.string
};

export default MapModal;

