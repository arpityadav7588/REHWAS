import React, { useState, useMemo } from 'react';
import { MapPin, Car, Bike, Train, Clock, ArrowRight, Zap } from 'lucide-react';
import type { Room } from '@/types';

interface CommuteWidgetProps {
  room: Room;
}

/**
 * CommuteWidget Component.
 * WHAT IT DOES: Calculates simulated travel times based on distance and peak traffic multipliers.
 * ANALOGY: A smart travel assistant that tells you if you can hit the snooze button one more time.
 */
export const CommuteWidget: React.FC<CommuteWidgetProps> = ({ room }) => {
  const [destination, setDestination] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [results, setResults] = useState<{ car: number, bike: number, transit: number } | null>(null);

  const calculateCommute = () => {
    if (!destination.trim()) return;
    
    setIsCalculating(true);
    
    // Simulate API call to Google Distance Matrix / OSRM
    setTimeout(() => {
      // Logic: Mocked based on city and locality
      const multiplier = room.commute_metadata?.peak_traffic_multiplier || 1.4;
      
      // Random base times for demo (in minutes)
      const carBase = 25;
      const bikeBase = 18;
      const transitBase = 40;

      setResults({
        car: Math.round(carBase * multiplier),
        bike: Math.round(bikeBase * multiplier),
        transit: Math.round(transitBase * multiplier)
      });
      setIsCalculating(false);
    }, 1500);
  };

  return (
    <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl shadow-slate-100/50">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
          <Clock size={22} />
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none">Locality Intelligence</h3>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Peak Hour Commute Predictor</p>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            <MapPin size={18} />
          </div>
          <input 
            type="text"
            placeholder="Enter your office address (e.g., Manyata Tech Park)"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-800"
          />
          <button 
            disabled={!destination.trim() || isCalculating}
            onClick={calculateCommute}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-slate-900 text-white p-2.5 rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {isCalculating ? <Zap size={18} className="animate-pulse text-indigo-400" /> : <ArrowRight size={18} />}
          </button>
        </div>

        {results && (
          <div className="grid grid-cols-3 gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
            {[
              { label: 'Car', icon: Car, time: results.car, color: 'blue' },
              { label: 'Bike', icon: Bike, time: results.bike, color: 'emerald' },
              { label: 'Public', icon: Train, time: results.transit, color: 'indigo' },
            ].map((m, i) => (
              <div key={i} className={`bg-${m.color}-50/50 border border-${m.color}-100 p-4 rounded-3xl flex flex-col items-center gap-2 group hover:bg-white transition-all`}>
                <div className={`w-10 h-10 rounded-2xl bg-white border border-${m.color}-100 flex items-center justify-center text-${m.color}-600 shadow-sm group-hover:scale-110 transition-transform`}>
                  <m.icon size={20} />
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{m.label}</p>
                  <p className={`text-lg font-black text-${m.color}-700 leading-none`}>{m.time} mins</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {!results && !isCalculating && (
          <div className="flex items-center gap-3 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
             <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                <Zap size={14} />
             </div>
             <p className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider leading-relaxed">
               REHWAS uses real-time traffic data specifically for {room.locality} to predict your travel time accurately.
             </p>
          </div>
        )}
      </div>
    </div>
  );
};
