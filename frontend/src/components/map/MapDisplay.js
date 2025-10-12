import React from 'react';
import PropTypes from 'prop-types';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

/**
 * MapDisplay Component
 * Displays a small, non-interactive map with a marker
 * Used in cards and preview sections
 * 
 * @param {Object} props
 * @param {number} props.latitude - Latitude coordinate
 * @param {number} props.longitude - Longitude coordinate
 * @param {string} props.locationName - Name of the location to display in popup
 * @param {string} props.height - Height of the map (default: '150px')
 * @param {number} props.zoom - Zoom level (default: 15)
 */
const MapDisplay = ({ 
  latitude, 
  longitude, 
  locationName = 'Location',
  height = '150px',
  zoom = 15
}) => {
  if (!latitude || !longitude) {
    return (
      <div 
        className="bg-gray-100 border border-gray-300 rounded-lg flex items-center justify-center text-gray-500 text-sm"
        style={{ height }}
      >
        Location not available
      </div>
    );
  }

  const position = [latitude, longitude];

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <MapContainer
        center={position}
        zoom={zoom}
        style={{ height, width: '100%' }}
        scrollWheelZoom={false}
        dragging={false}
        zoomControl={false}
        doubleClickZoom={false}
        touchZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position}>
          <Popup>{locationName}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

MapDisplay.propTypes = {
  latitude: PropTypes.number,
  longitude: PropTypes.number,
  locationName: PropTypes.string,
  height: PropTypes.string,
  zoom: PropTypes.number
};

export default MapDisplay;

