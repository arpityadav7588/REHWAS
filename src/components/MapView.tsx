import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Room } from '@/types';
import { RoomCard } from './RoomCard';

/**
 * Creates a custom div icon for room markers.
 * @param rentAmount Current rent amount of the room.
 */
const createPriceIcon = (rentAmount: number) => {
  const priceK = (rentAmount / 1000).toFixed(1) + 'k';
  return L.divIcon({
    className: 'custom-price-marker',
    html: `<div class="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-2.5 py-1.5 rounded-full shadow-lg border-[3px] border-white text-center whitespace-nowrap transition-colors transform hover:scale-110" style="box-shadow: 0 4px 10px rgba(16, 185, 129, 0.4);">₹${priceK}</div>`,
    iconSize: [48, 30],
    iconAnchor: [24, 15],
    popupAnchor: [0, -15]
  });
};

/**
 * Component to auto-resize Leaflet map when container resizes.
 */
function MapResizer() {
  const map = useMap();
  useEffect(() => {
    // Invalidate size on mount and after a short delay to handle transitions
    map.invalidateSize();
    setTimeout(() => map.invalidateSize(), 300);
  }, [map]);
  return null;
}

/**
 * Component to auto-center map when rooms change
 */
function MapAutoCenter({ rooms }: { rooms: Room[] }) {
  const map = useMap();
  useEffect(() => {
    const validRooms = rooms.filter(r => r.latitude && r.longitude);
    if (validRooms.length > 0) {
      if (validRooms.length === 1) {
        map.flyTo([validRooms[0].latitude, validRooms[0].longitude], 14, { duration: 1.5 });
      } else {
        const bounds = L.latLngBounds(validRooms.map(r => [r.latitude, r.longitude]));
        map.flyToBounds(bounds, { padding: [50, 50], duration: 1.5 });
      }
    }
  }, [rooms, map]);
  return null;
}

interface MapViewProps {
  rooms: Room[];
}

/**
 * MapView component to display rooms on a Leaflet map.
 * WHAT IT DOES: Renders a map with custom markers for each room based on latitude and longitude.
 */
export const MapView: React.FC<MapViewProps> = ({ rooms }) => {
  const defaultCenter: [number, number] = [12.9716, 77.5946]; // Bengaluru
  const validRooms = rooms.filter(r => r.latitude && r.longitude);

  if (validRooms.length === 0 && rooms.length > 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-400 p-6 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-xl font-bold text-gray-500 mb-1">Map is empty</p>
        <p className="text-sm">None of the matching rooms have geolocation data to display.</p>
      </div>
    );
  }

  // Adjust center if there are rooms
  const center = validRooms.length > 0 ? [validRooms[0].latitude, validRooms[0].longitude] as [number, number] : defaultCenter;

  return (
    <div className="w-full h-full z-0 relative bg-[#e5e3df]">
      <MapContainer 
        center={center} 
        zoom={12} 
        zoomControl={false}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <MapResizer />
        <MapAutoCenter rooms={validRooms} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="map-tiles"
        />
        {validRooms.map(room => (
          <Marker 
            key={room.id} 
            position={[room.latitude, room.longitude]}
            icon={createPriceIcon(room.rent_amount)}
          >
            <Popup className="room-popup group/popup" autoPanPadding={[50, 50]}>
              <RoomCard room={room} compact />
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Global styles for the leafleft popup to remove its default padding and style cleanly */}
      <style>{`
        .leaflet-popup-content-wrapper { padding: 0 !important; overflow: hidden; border-radius: 16px !important; box-shadow: 0 10px 25px rgba(0,0,0,0.15) !important; background: transparent !important; }
        .leaflet-popup-content { margin: 0 !important; width: auto !important; }
        .leaflet-popup-tip-container { display: none; }
        .room-popup .leaflet-popup-close-button { color: #fff !important; top: 8px !important; right: 8px !important; width: 24px !important; height: 24px !important; background: rgba(0,0,0,0.5) !important; border-radius: 50%; font-size: 16px !important; display: flex !important; justify-content: center; align-items: center; z-index: 100; transition: background 0.2s; padding: 0 !important; font-weight: normal !important; filter: backdrop-blur(4px); }
        .room-popup .leaflet-popup-close-button:hover { background: rgba(0,0,0,0.8) !important; color: white !important; }
        .leaflet-control-attribution { background: rgba(255,255,255,0.7) !important; backdrop-filter: blur(4px); border-top-left-radius: 8px; font-weight: 500; font-size: 10px !important; }
        .map-tiles { filter: contrast(1.05) brightness(1.02) saturate(1.1); }
      `}</style>
    </div>
  );
};
