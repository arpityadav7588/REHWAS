import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Room } from '@/types';
import { RoomCard } from './RoomCard';
import { Clock, Zap } from 'lucide-react';

/**
 * Creates a custom div icon for room markers.
 * @param rentAmount Current rent amount of the room.
 * @param commuteTime Optional travel time to show in commute mode.
 */
const createPriceIcon = (rentAmount: number, commuteTime?: number) => {
  const priceK = (rentAmount / 1000).toFixed(1) + 'k';
  return L.divIcon({
    className: 'custom-price-marker',
    html: `
      <div class="flex flex-col items-center gap-1 group/marker">
        ${commuteTime ? `
          <div class="bg-indigo-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm animate-in zoom-in-50 duration-300">
            ${commuteTime}m
          </div>
        ` : ''}
        <div class="bg-emerald-600 group-hover/marker:bg-emerald-500 text-white font-extrabold text-xs px-2.5 py-1.5 rounded-full shadow-lg border-[3px] border-white text-center whitespace-nowrap transition-all transform hover:scale-110" style="box-shadow: 0 4px 10px rgba(16, 185, 129, 0.4);">
          ₹${priceK}
        </div>
      </div>
    `,
    iconSize: [60, 60],
    iconAnchor: [30, 30],
    popupAnchor: [0, -30]
  });
};

/**
 * Component to auto-resize Leaflet map when container resizes.
 */
function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    if (!container) return;

    // Use ResizeObserver to detect when the map container actually gets a size
    // (e.g. when switching from 'list' view to 'map' view on mobile)
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });

    observer.observe(container);
    
    // Initial call
    map.invalidateSize();

    return () => observer.disconnect();
  }, [map]);
  return null;
}

/**
 * Component to auto-center map when rooms change
 */
function MapAutoCenter({ rooms }: { rooms: Room[] }) {
  const map = useMap();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const container = map.getContainer();
    if (!container) return;

    const observer = new ResizeObserver(() => {
      const hasSize = container.clientHeight > 0 && container.clientWidth > 0;
      setIsVisible(hasSize);
    });

    observer.observe(container);
    // Set initial state
    setIsVisible(container.clientHeight > 0 && container.clientWidth > 0);

    return () => observer.disconnect();
  }, [map]);

  useEffect(() => {
    // Only animate if the map is visible and rooms exist
    if (!isVisible) return;

    const validRooms = rooms.filter(r => 
      r &&
      typeof r.latitude === 'number' && 
      typeof r.longitude === 'number' && 
      !isNaN(r.latitude) && 
      !isNaN(r.longitude) &&
      r.latitude !== 0 && r.longitude !== 0
    );

    if (validRooms.length > 0) {
      try {
        if (validRooms.length === 1) {
          const lat = validRooms[0].latitude;
          const lng = validRooms[0].longitude;
          if (!isNaN(lat) && !isNaN(lng)) {
            map.flyTo([lat, lng], 14, { duration: 1.5 });
          }
        } else {
          const bounds = L.latLngBounds(validRooms.map(r => [r.latitude, r.longitude]));
          if (bounds && bounds.isValid()) {
            map.flyToBounds(bounds, { padding: [50, 50], duration: 1.5 });
          }
        }
      } catch (err) {
        console.warn('Map animation failed:', err);
      }
    }
  }, [rooms, map, isVisible]);
  return null;
}

interface MapViewProps {
  rooms: Room[];
  heatmapActive?: boolean;
}

/**
 * Component to manage the Rent Price Heatmap overlays.
 * WHAT IT DOES: Groups rooms by locality, calculates averages, and draws circles on the map.
 */
function HeatmapLayer({ rooms, active }: { rooms: Room[], active: boolean }) {
  const map = useMap();
  const circleLayersRef = React.useRef<L.Layer[]>([]);

  useEffect(() => {
    // 1. Cleanup existing layers
    circleLayersRef.current.forEach(layer => layer.remove());
    circleLayersRef.current = [];

    if (!active || rooms.length === 0) return;

    // 2. Group by locality
    const localityMap = new Map<string, { lat: number[], lng: number[], rent: number[] }>();
    
    rooms.forEach(room => {
      const loc = room.locality || 'Unknown';
      if (!localityMap.has(loc)) {
        localityMap.set(loc, { lat: [], lng: [], rent: [] });
      }
      const data = localityMap.get(loc)!;
      data.lat.push(room.latitude);
      data.lng.push(room.longitude);
      data.rent.push(room.rent_amount);
    });

    // 3. Create circles for each locality
    localityMap.forEach((data, locality) => {
      const avgLat = data.lat.reduce((a, b) => a + b, 0) / data.lat.length;
      const avgLng = data.lng.reduce((a, b) => a + b, 0) / data.lng.length;
      const avgRent = data.rent.reduce((a, b) => a + b, 0) / data.rent.length;

      if (isNaN(avgLat) || isNaN(avgLng)) return;

      let color = '#22C55E'; // Green
      let tier = 'Budget zone';
      if (avgRent > 20000) { color = '#EF4444'; tier = 'Luxury'; }
      else if (avgRent > 14000) { color = '#F97316'; tier = 'Premium'; }
      else if (avgRent > 8000) { color = '#F59E0B'; tier = 'Mid-range'; }

      const circle = L.circle([avgLat, avgLng], {
        radius: 800,
        fillColor: color,
        fillOpacity: 0.35,
        stroke: false,
      })
      .bindTooltip(`
        <div class="px-3 py-2 bg-slate-900 text-white rounded-xl shadow-xl border border-white/10">
          <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">${locality}</p>
          <p class="text-sm font-black whitespace-nowrap italic">Avg ₹${Math.round(avgRent).toLocaleString()}/mo</p>
          <p class="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">${data.rent.length} verified listings • ${tier}</p>
        </div>
      `, { sticky: true, className: 'heatmap-tooltip', opacity: 0.95 });

      circle.addTo(map);
      circleLayersRef.current.push(circle);
    });

    /**
     * @cleanup Logic:
     * Storing circle references in a ref allows us to remove them cleanly from the map
     * when the 'active' toggle is switched off or rooms change, preventing layer leakage.
     */
    return () => {
      circleLayersRef.current.forEach(layer => layer.remove());
      circleLayersRef.current = [];
    };
  }, [rooms, active, map]);

  return null;
}

/**
 * MapView component to display rooms on a Leaflet map.
 */
export const MapView: React.FC<MapViewProps> = ({ rooms, heatmapActive = false }) => {
  const [commuteMode, setCommuteMode] = useState(false);
  const defaultCenter: [number, number] = [12.9716, 77.5946]; // Bengaluru
  const validRooms = rooms.filter(r => 
    r &&
    typeof r.latitude === 'number' && 
    typeof r.longitude === 'number' && 
    !isNaN(r.latitude) && 
    !isNaN(r.longitude)
  );

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

  const center = validRooms.length > 0 ? [validRooms[0].latitude, validRooms[0].longitude] as [number, number] : defaultCenter;

  return (
    <div className="w-full h-full z-0 relative bg-[#e5e3df]">
      {/* Floating Toggle Controls */}
      <div className="absolute top-4 left-4 z-[400] flex flex-col gap-2">
         <button 
           onClick={() => setCommuteMode(!commuteMode)}
           className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all border-2 ${commuteMode ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-white text-slate-600 border-white hover:border-indigo-100'}`}
         >
           {commuteMode ? <Zap size={14} className="animate-pulse" /> : <Clock size={14} />}
           {commuteMode ? 'Commute: Active' : 'Commute View'}
         </button>
      </div>

      {/* HEATMAP LEGEND */}
      {heatmapActive && (
        <div className="absolute bottom-6 left-6 z-[400] animate-in slide-in-from-left duration-300">
           <div className="bg-white/95 backdrop-blur-md p-4 rounded-3xl shadow-2xl border border-white flex flex-col gap-3">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-1">Rent Heat Legend</p>
              <div className="flex flex-col gap-2">
                {[
                  { color: '#22C55E', label: 'Under ₹8k', sub: 'Budget zone' },
                  { color: '#F59E0B', label: '₹8k–14k', sub: 'Mid-range' },
                  { color: '#F97316', label: '₹14k–20k', sub: 'Premium' },
                  { color: '#EF4444', label: 'Above ₹20k', sub: 'Luxury' }
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }}></div>
                    <div>
                      <p className="text-[10px] font-black text-slate-900 leading-none">{item.label}</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
           </div>
        </div>
      )}

      <MapContainer 
        center={center} 
        zoom={12} 
        zoomControl={false}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <MapResizer />
        <MapAutoCenter rooms={validRooms} />
        <HeatmapLayer rooms={validRooms} active={heatmapActive} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="map-tiles"
        />
        {validRooms.map(room => {
          const officeLoc = { lat: 12.9716, lng: 77.5946 };
          const dist = Math.sqrt(Math.pow(room.latitude - officeLoc.lat, 2) + Math.pow(room.longitude - officeLoc.lng, 2)) * 100;
          const travelTime = Math.round(15 + (dist * 2));

          return (
            <Marker 
              key={room.id} 
              position={[room.latitude, room.longitude]}
              icon={createPriceIcon(room.rent_amount, commuteMode ? travelTime : undefined)}
              opacity={heatmapActive ? 0.4 : 1}
            >
              <Popup className="room-popup group/popup" autoPanPadding={[50, 50]}>
                <RoomCard room={room} compact />
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      
      <style>{`
        .leaflet-popup-content-wrapper { padding: 0 !important; overflow: hidden; border-radius: 16px !important; box-shadow: 0 10px 25px rgba(0,0,0,0.15) !important; background: transparent !important; }
        .leaflet-popup-content { margin: 0 !important; width: auto !important; }
        .leaflet-popup-tip-container { display: none; }
        .room-popup .leaflet-popup-close-button { color: #fff !important; top: 8px !important; right: 8px !important; width: 24px !important; height: 24px !important; background: rgba(0,0,0,0.5) !important; border-radius: 50%; font-size: 16px !important; display: flex !important; justify-content: center; align-items: center; z-index: 100; transition: background 0.2s; padding: 0 !important; font-weight: normal !important; filter: backdrop-blur(4px); }
        .room-popup .leaflet-popup-close-button:hover { background: rgba(0,0,0,0.8) !important; color: white !important; }
        .leaflet-control-attribution { background: rgba(255,255,255,0.7) !important; backdrop-filter: blur(4px); border-top-left-radius: 8px; font-weight: 500; font-size: 10px !important; }
        .map-tiles { filter: contrast(1.05) brightness(1.02) saturate(1.1); }
        .heatmap-tooltip { background: transparent !important; border: none !important; box-shadow: none !important; padding: 0 !important; }
        .heatmap-tooltip .leaflet-tooltip-tip { display: none; }
        .custom-price-marker { transition: opacity 0.5s ease-in-out; }
      `}</style>
    </div>
  );
};
