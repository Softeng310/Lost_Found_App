import React, { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Default center: University of Auckland
const DEFAULT_CENTER = [-36.8524, 174.7691];
const DEFAULT_ZOOM = 16;

// Component to handle map clicks and update marker position
const LocationMarker = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position ? (
    <Marker position={position}>
      <Popup>
        Selected Location
        <br />
        Lat: {position[0].toFixed(4)}, Lng: {position[1].toFixed(4)}
      </Popup>
    </Marker>
  ) : null;
};

LocationMarker.propTypes = {
  position: PropTypes.arrayOf(PropTypes.number),
  setPosition: PropTypes.func.isRequired
};

/**
 * MapPicker Component
 * Allows users to select a location by clicking on the map
 * 
 * @param {Object} props
 * @param {Function} props.onLocationSelect - Callback function when location is selected
 * @param {Array} props.initialPosition - Initial marker position [lat, lng]
 */
const MapPicker = ({ onLocationSelect, initialPosition = null }) => {
  const [position, setPosition] = useState(initialPosition);
  const [mapCenter] = useState(initialPosition || DEFAULT_CENTER);

  // Update parent component when position changes
  useEffect(() => {
    if (position && onLocationSelect) {
      onLocationSelect({
        latitude: position[0],
        longitude: position[1]
      });
    }
  }, [position, onLocationSelect]);

  const handlePositionChange = useCallback((newPosition) => {
    setPosition(newPosition);
  }, []);

  return (
    <div className="w-full">
      <div className="mb-2">
        <h3 className="block font-semibold mb-2">
          Select Location on Map
        </h3>
        <p className="text-sm text-gray-600 mb-2">
          Click on the map to drop a pin where the item was lost/found
        </p>
      </div>
      
      <div className="border-2 border-gray-300 rounded-lg overflow-hidden hover:border-emerald-400 transition-colors">
        <MapContainer
          center={mapCenter}
          zoom={DEFAULT_ZOOM}
          style={{ height: '300px', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={position} setPosition={handlePositionChange} />
        </MapContainer>
      </div>
      
      {position && (
        <div className="mt-2 text-sm text-gray-600">
          <span className="font-medium">Selected coordinates:</span> 
          {' '}Lat: {position[0].toFixed(4)}, Lng: {position[1].toFixed(4)}
        </div>
      )}
    </div>
  );
};

MapPicker.propTypes = {
  onLocationSelect: PropTypes.func,
  initialPosition: PropTypes.arrayOf(PropTypes.number)
};

export default MapPicker;

