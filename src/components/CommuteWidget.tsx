import { useState } from 'react';
import { 
  MapPin, Clock, ArrowRight, Loader2, AlertTriangle, 
  Car, Bike, Bus, Train, ExternalLink, Map, Zap 
} from 'lucide-react';
import type { Room } from '@/types';
import { useCommute } from '@/hooks/useCommute';

interface CommuteWidgetProps {
  room: Room;
}

/**
 * CommuteWidget Component.
 * 
 * WHAT IT DOES: 
 * Calculates real driving distances and times between the room and a 
 * user-specified destination (office/college) using OSRM and OSM data.
 * 
 * ANALOGY: 
 * It's like having a local guide who knows exactly how long it takes 
 * to get to the office, even during Bangalore's infamous peak hour traffic.
 */
export const CommuteWidget: React.FC<CommuteWidgetProps> = ({ room }) => {
  const [destination, setDestination] = useState('');
  const { 
    drivingMins, 
    peakMins, 
    distanceKm, 
    officeCoords, 
    loading, 
    error, 
    calculateCommute 
  } = useCommute();

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim()) return;
    
    // Trigger the real-world calculation via OSRM & Nominatim
    calculateCommute(room.latitude || 0, room.longitude || 0, destination);
  };

  // Google Maps link for deep-linking
  const googleMapsUrl = officeCoords 
    ? `https://www.google.com/maps/dir/${room.latitude},${room.longitude}/${officeCoords.lat},${officeCoords.lng}`
    : '#';

  const hasResults = distanceKm > 0 && !loading;

  return (
    <section className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-[0_4px_40px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden relative group">
      {/* Accent Background Blobs */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-[4rem] -mr-8 -mt-8 transition-transform group-hover:scale-110 -z-0"></div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
            <Clock size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none">Calculate your commute</h3>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1.5">Locality Intelligence • Real-time Routing</p>
          </div>
        </div>

        <form onSubmit={handleCalculate} className="mb-6">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <MapPin size={20} />
            </div>
            <input 
              type="text"
              placeholder="e.g. Manyata Tech Park, Bengaluru"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full pl-12 pr-32 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-800 placeholder:text-slate-300 shadow-inner"
            />
            <button 
              type="submit"
              disabled={!destination.trim() || loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>Calculate <ArrowRight size={14} /></>
              )}
            </button>
          </div>
        </form>

        {loading && (
          <div className="py-8 flex flex-col items-center justify-center animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
              <Loader2 size={32} className="text-indigo-600 animate-spin" />
            </div>
            <p className="text-slate-500 font-bold text-sm tracking-tight">Calculating route...</p>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Fetching real traffic data</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 animate-in shake-in duration-300">
            <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={18} />
            <div>
              <p className="text-red-900 font-black text-[11px] uppercase tracking-widest mb-0.5">Calculation Error</p>
              <p className="text-red-700/70 text-sm font-medium leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {hasResults && (
          <div className="animate-in slide-in-from-top-4 fade-in duration-500">
            {/* Primary Result Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-emerald-50/50 border border-emerald-100 p-6 rounded-[2rem] relative overflow-hidden group/card transition-all hover:bg-white shadow-sm">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/card:opacity-20 transition-opacity">
                  <Car size={48} />
                </div>
                <p className="text-emerald-700 font-black text-[10px] uppercase tracking-[0.2em] mb-2">Normal traffic</p>
                <div className="flex items-end gap-2">
                  <h4 className="text-3xl font-black text-emerald-900 tracking-tighter leading-none">{drivingMins} min</h4>
                  <span className="text-emerald-600/60 font-bold mb-1 text-sm">· {distanceKm} km</span>
                </div>
                <p className="text-emerald-700/50 text-[10px] font-bold uppercase tracking-widest mt-2">by car/bike</p>
              </div>

              <div className="bg-amber-50/50 border border-amber-100 p-6 rounded-[2rem] relative overflow-hidden group/card transition-all hover:bg-white shadow-sm">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/card:opacity-20 transition-opacity">
                  <AlertTriangle size={48} />
                </div>
                <p className="text-amber-700 font-black text-[10px] uppercase tracking-[0.2em] mb-2 flex items-center gap-1.5">
                  <AlertTriangle size={12} /> Peak hours (8–10 AM)
                </p>
                <h4 className="text-3xl font-black text-amber-900 tracking-tighter leading-none">{peakMins} min</h4>
                <p className="text-amber-700/50 text-[10px] font-bold uppercase tracking-widest mt-2">Traffic buffer applied (1.4x)</p>
              </div>
            </div>

            {/* Transport Alternatives */}
            <div className="bg-slate-50 rounded-[2rem] border border-slate-100 p-5 mb-6">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-1">Transport Alternatives</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { 
                    label: 'Metro', 
                    icon: Train, 
                    value: `~${Math.round(distanceKm * 3)} min`,
                    show: distanceKm < 15 
                  },
                  { 
                    label: 'Bus', 
                    icon: Bus, 
                    value: `~${Math.round(distanceKm * 5)} min`,
                    show: true 
                  },
                  { 
                    label: 'Bike', 
                    icon: Bike, 
                    value: `${drivingMins} min`,
                    show: true 
                  },
                  { 
                    label: 'Auto/Cab', 
                    icon: Map, 
                    value: `₹${Math.round(distanceKm * 15 + 30)}`,
                    show: true 
                  }
                ].filter(t => t.show).map((t, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-2xl border border-slate-100 flex flex-col items-center gap-1 text-center transition-transform hover:scale-105">
                    <t.icon size={16} className="text-slate-400 mb-1" />
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{t.label}</p>
                    <p className="text-xs font-black text-slate-900 leading-none">{t.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <a 
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-4 bg-white border border-slate-200 rounded-2xl text-slate-600 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-colors group/link"
            >
              <ExternalLink size={14} className="group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
              View in Google Maps &rarr;
            </a>
          </div>
        )}

        {!hasResults && !loading && !error && (
          <div className="flex items-center gap-4 p-5 bg-indigo-50/50 rounded-3xl border border-indigo-100/50">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-sm">
              <Zap size={18} className="fill-indigo-500" />
            </div>
            <div>
              <p className="text-[11px] font-black text-indigo-900 uppercase tracking-widest leading-none mb-1">Commute Intelligence</p>
              <p className="text-indigo-800/60 text-xs font-medium leading-relaxed">
                REHWAS uses OSRM real-time routing to predict travel times for {room.locality}.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
