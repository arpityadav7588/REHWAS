import { Link } from 'react-router-dom';
import type { Room } from '@/types';
import { MapPin, BedDouble, ShieldCheck, Wifi, Tv, Wind, Zap, Moon } from 'lucide-react';
import { VacantRoomCTA } from './EmptyState';


/**
 * Props for the RoomCard component
 */
interface RoomCardProps {
  room: Room;
  compact?: boolean;
}

/**
 * RoomCard component displays room details in a card format.
 * WHAT IT DOES: Shows a photo, price, title, and other details. Can be compacted for map popups.
 */
export const RoomCard: React.FC<RoomCardProps> = ({ room, compact = false }) => {
  const imageUrl = room.photos && room.photos.length > 0 ? room.photos[0] : 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80';
  
  if (compact) {
    return (
      <div className="w-[220px] overflow-hidden rounded-xl bg-white flex flex-col group shadow-lg">
        <div className="h-28 w-full relative overflow-hidden bg-gray-200">
          <img src={imageUrl} alt={room.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          {room.available && (
            <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 text-green-700 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              Available
            </div>
          )}
        </div>
        <div className="p-3 flex flex-col gap-1.5">
          <h4 className="font-bold text-sm text-gray-900 line-clamp-1" title={room.title}>{room.title}</h4>
          <p className="font-extrabold text-green-700 text-base">₹{room.rent_amount.toLocaleString()}</p>
          <Link to={`/room/${room.id}`} className="mt-1 text-center font-semibold text-xs bg-green-50 text-green-700 py-2 rounded-lg hover:bg-green-600 hover:text-white transition-colors">
            View Details
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row bg-white rounded-[20px] shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group relative">
      <div className="sm:w-2/5 h-56 sm:h-auto relative overflow-hidden bg-gray-200">
        <img src={imageUrl} alt={room.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
        {room.available && (
          <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 text-green-700 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Available Now
          </div>
        )}
        {(room.street_video_url || (room.street_night_videos && room.street_night_videos.length > 0)) && (
          <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 text-white shadow-xl border border-white/20">
            <Moon size={12} className="fill-emerald-400 text-emerald-400" /> Night View
          </div>
        )}
        {room.boosted_until && new Date(room.boosted_until) > new Date() && (
          <div className="absolute top-16 right-4 bg-amber-400/95 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 text-amber-950 shadow-xl border border-amber-200">
            <Zap size={12} className="fill-amber-900 text-amber-900" /> Featured ⚡
          </div>
        )}
      </div>
      <div className="p-5 flex flex-col flex-1 gap-3 justify-between bg-white">
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-start gap-4">
            <h3 className="text-xl font-extrabold text-gray-900 leading-tight group-hover:text-green-700 transition-colors">{room.title}</h3>
            <div className="flex flex-col items-end">
              <p className="font-black text-2xl text-green-600 whitespace-nowrap">₹{room.rent_amount.toLocaleString()}</p>
              <span className="text-xs font-medium text-gray-400">per month</span>
            </div>
          </div>
          <p className="text-gray-500 text-sm flex items-center gap-1.5 font-medium">
            <MapPin size={16} className="text-green-600" />
            {room.locality}, {room.city}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-1">
          <span className="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold ring-1 ring-blue-100">{room.room_type}</span>
          <span className="px-3 py-1 rounded-lg bg-violet-50 text-violet-700 text-xs font-bold ring-1 ring-violet-100">
            {room.furnished ? 'Furnished' : 'Unfurnished'}
          </span>
          <span className={`px-3 py-1 rounded-lg text-xs font-bold ring-1 flex items-center gap-1 ${room.bhoomi_score && room.bhoomi_score > 750 ? 'bg-green-50 text-emerald-700 ring-green-100' : 'bg-gray-50 text-gray-500 ring-gray-100'}`}>
            <ShieldCheck size={14} className={room.bhoomi_score && room.bhoomi_score > 750 ? 'text-emerald-500' : 'text-gray-400'} />
            {room.bhoomi_score && room.bhoomi_score > 750 ? 'Verified listing' : 'Basic listing'}
          </span>
        </div>

        <div className="flex items-center justify-between mt-3 pt-4 border-t border-gray-100/80">
          <div className="flex gap-2">
            {room.amenities.slice(0, 4).map((am, i) => {
              const lower = am.toLowerCase();
              let Icon = Zap;
              if (lower.includes('wifi') || lower.includes('internet')) Icon = Wifi;
              else if (lower.includes('tv')) Icon = Tv;
              else if (lower.includes('ac') || lower.includes('air')) Icon = Wind;
              else if (lower.includes('bed')) Icon = BedDouble;
              
              return (
                <div key={i} className="p-2 bg-gray-50 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-xl transition-colors ring-1 ring-gray-100 group/icon" title={am}>
                  <Icon size={16} className="group-hover/icon:scale-110 transition-transform" />
                </div>
              );
            })}
            {room.amenities.length > 4 && (
              <div className="p-2 flex items-center justify-center text-xs font-bold text-gray-500 bg-gray-50 rounded-xl ring-1 ring-gray-100 pointer-events-none">
                +{room.amenities.length - 4}
              </div>
            )}
          </div>
          <Link to={`/room/${room.id}`} className="text-sm font-bold text-green-600 hover:text-white hover:bg-green-600 px-4 py-2 rounded-xl border-2 border-green-600 transition-all flex items-center gap-1.5 shadow-sm overflow-hidden group/btn">
             View Room <span className="group-hover/btn:translate-x-1 transition-transform">&rarr;</span>
          </Link>
        </div>

        {room.available && (
          <VacantRoomCTA roomId={room.id} roomName={room.title} />
        )}
      </div>
    </div>
  );
};

