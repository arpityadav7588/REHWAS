import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useRooms } from '@/hooks/useRooms';
import { FilterPanel } from '@/components/FilterPanel';
import { MapView } from '@/components/MapView';
import { RoomCard } from '@/components/RoomCard';
import { EmptyState } from '@/components/EmptyState';
import { Search, X } from 'lucide-react';

/**
 * Discover Page
 * WHAT IT DOES: Allows tenants to browse, filter, and view rooms on lists and maps.
 */
/**
 * @breakpoints used: 
 * `md:` - switches map/list view panel to side-by-side mode.
 * `md:hidden` - hides mobile tabs and filter drawer buttons on desktop.
 */
export default function Discover() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { rooms, fetchRooms, loading } = useRooms();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);
  const [heatmapActive, setHeatmapActive] = useState(false);

  // Extract filters from URL
  const filtersUrl = useMemo(() => {
    return {
      city: searchParams.get('city') || undefined,
      max_rent: searchParams.get('max_rent') ? Number(searchParams.get('max_rent')) : undefined,
      room_type: searchParams.get('room_type') && searchParams.get('room_type') !== 'All' ? searchParams.get('room_type') as any : undefined,
    };
  }, [searchParams]);

  useEffect(() => {
    fetchRooms(filtersUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersUrl.city, filtersUrl.max_rent, filtersUrl.room_type]);

  // Client-side filtering
  const filteredRooms = useMemo(() => {
    let result = rooms;
    
    // Search query filter (title or locality)
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r => 
        r.title.toLowerCase().includes(q) || 
        r.locality.toLowerCase().includes(q) ||
        r.city.toLowerCase().includes(q)
      );
    }
    
    // Furnished filter (client side)
    const furnishedParam = searchParams.get('furnished');
    if (furnishedParam && furnishedParam !== 'Any') {
      const isFurn = furnishedParam === 'Furnished';
      result = result.filter(r => r.furnished === isFurn);
    }
    
    // Min rent filter
    const minRentParam = searchParams.get('min_rent');
    if (minRentParam) {
      result = result.filter(r => r.rent_amount >= Number(minRentParam));
    }

    // Night view filter
    const nightViewParam = searchParams.get('has_night_view');
    if (nightViewParam === 'true') {
      result = result.filter(r => r.street_video_url !== null && r.street_video_url !== undefined);
    }
    
    return result;
  }, [rooms, searchQuery, searchParams]);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-[#fafafa]">
      {/* Mobile top nav / tabs */}
      <div className="md:hidden flex bg-white border-b border-gray-200 shadow-sm z-20 shrink-0">
        <button 
          onClick={() => setViewMode('list')}
          className={`flex-1 min-h-[44px] py-3 text-base font-bold flex items-center justify-center gap-2 transition-colors ${viewMode === 'list' ? 'text-green-600 border-b-4 border-green-600 bg-green-50/30' : 'text-gray-500 hover:bg-gray-50 border-b-4 border-transparent'}`}
        >
          📋 List
        </button>
        <button 
          onClick={() => setViewMode('map')}
          className={`flex-1 min-h-[44px] py-3 text-base font-bold flex items-center justify-center gap-2 transition-colors ${viewMode === 'map' ? 'text-green-600 border-b-4 border-green-600 bg-green-50/30' : 'text-gray-500 hover:bg-gray-50 border-b-4 border-transparent'}`}
        >
          🗺️ Map
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Panel */}
        <div className={`w-full md:w-[400px] xl:w-[450px] shrink-0 flex flex-col bg-white h-full border-r border-gray-200 z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)] ${viewMode === 'map' ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-5 border-b border-gray-100 shrink-0 flex flex-col gap-4 bg-white/80 backdrop-blur-md">
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Discover</h1>
              <p className="text-gray-500 text-sm font-medium mt-1">
                {loading ? 'Finding the best places...' : `${filteredRooms.length} amazing rooms found ${filtersUrl.city ? `in ${filtersUrl.city}` : ''}`}
              </p>
            </div>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" size={20} />
              <input 
                type="text" 
                placeholder="Search by locality, area, or keywords..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all outline-none text-gray-800 placeholder-gray-400 font-medium shadow-inner"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 md:p-5 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
            <div className="hidden md:block mb-6">
              <FilterPanel />
            </div>

            {/* Mobile Filter Drawer */}
            {showFiltersMobile && (
              <div className="fixed inset-0 z-[60] bg-gray-900/40 backdrop-blur-sm md:hidden flex flex-col justify-end">
                <div className="bg-white rounded-t-3xl w-full p-4 overflow-y-auto max-h-[85vh] shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-xl">Filters</h3>
                    <button onClick={() => setShowFiltersMobile(false)} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 font-bold"><X size={20}/></button>
                  </div>
                  <FilterPanel />
                </div>
              </div>
            )}
            
            <div className="flex flex-col gap-8 pb-20 md:pb-4">
              <div className="flex justify-between items-end mb-1 px-1">
                <h2 className="text-lg font-bold text-gray-800">Available Rooms</h2>
                <button 
                  onClick={() => setShowFiltersMobile(true)} 
                  className="md:hidden flex items-center justify-center gap-1 min-h-[44px] text-brand font-bold bg-emerald-50 border border-emerald-200 px-4 rounded-xl shadow-sm text-sm"
                >
                  Filters
                </button>
              </div>
              
              {loading ? (
                // Skeletons
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="animate-pulse flex flex-col sm:flex-row bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                    <div className="sm:w-2/5 bg-gray-200 h-48 sm:h-auto"></div>
                    <div className="flex-1 p-5 space-y-4">
                      <div className="h-5 bg-gray-200 rounded-md w-3/4"></div>
                      <div className="h-8 bg-gray-200 rounded-md w-1/3"></div>
                      <div className="h-4 bg-gray-200 rounded-md w-1/2"></div>
                      <div className="flex gap-2 pt-2">
                         <div className="h-7 bg-gray-200 rounded-md w-16"></div>
                         <div className="h-7 bg-gray-200 rounded-md w-20"></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : filteredRooms.length > 0 ? (
                filteredRooms.map(room => (
                  <RoomCard key={room.id} room={room} />
                ))
              ) : (
                <EmptyState 
                  illustration="magnifying-glass"
                  title="No rooms found in this area"
                  description="Try adjusting your filters or expanding to nearby localities."
                  ctaLabel="Reset all filters"
                  ctaOnClick={() => setSearchParams(new URLSearchParams())}
                  secondary={{ label: "Browse all of Bengaluru →", href: "/discover?city=Bengaluru" }}
                />
              )}

              {/* Unique Updates: The Pulse & Coming Soon */}
              <div className="mt-6 pt-10 border-t border-slate-100">
                {/* THE PULSE: Neighborhood Board */}
                <div className="mb-10">
                   <div className="flex items-center gap-2 mb-6">
                      <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-rose-200">
                         <span className="material-symbols-outlined text-[18px]">emergency_share</span>
                      </div>
                      <h3 className="text-sm font-black text-dark uppercase tracking-widest">The Pulse: Local Tips</h3>
                   </div>
                   
                   <div className="relative group overflow-hidden">
                      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
                         {[
                           { area: 'HSR Layout', tip: 'The 3rd Sector park is great for evening walks. Avoid the main road traffic at 6pm.', color: 'emerald' },
                           { area: 'Indiranagar', tip: 'Great cafes, but water bills can be high in Sector 4. Check the borewell status.', color: 'indigo' },
                           { area: 'Whitefield', tip: 'Best to live within 2km of the Metro station to avoid the Silk Board crawl.', color: 'orange' },
                           { area: 'Koramangala', tip: 'Sector 3 is quieter and has better drainage during monsoon.', color: 'blue' }
                         ].map((p, i) => (
                           <div key={i} className={`min-w-[240px] snap-start bg-${p.color}-50/50 p-5 rounded-3xl border border-${p.color}-100 flex flex-col justify-between hover:bg-white transition-all`}>
                              <div>
                                 <p className={`text-[10px] font-black text-${p.color}-600 uppercase tracking-tighter mb-2`}>{p.area}</p>
                                 <p className="text-xs font-bold text-slate-600 leading-relaxed italic">"{p.tip}"</p>
                              </div>
                              <div className="mt-4 flex items-center gap-2">
                                 <div className={`w-1.5 h-1.5 rounded-full bg-${p.color}-500 animate-ping`}></div>
                                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verified Resident</span>
                              </div>
                           </div>
                         ))}
                      </div>
                      {/* Gradient Fade for scroll */}
                      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
                   </div>
                </div>

                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Coming Soon</h3>
                
                {/* Feature Pulse Banner */}
                <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 to-blue-500 rounded-[2rem] p-8 mb-8 shadow-xl shadow-indigo-100">
                   <div className="relative z-10">
                      <div className="bg-white/20 backdrop-blur-md w-fit px-3 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-tighter mb-4">Under Development</div>
                      <h4 className="text-white font-black text-xl leading-tight mb-2">Verified Tenant Profiles</h4>
                      <p className="text-indigo-100 text-sm font-medium">Boost your trust score and get instant move-ins with Aadhaar-linked verification.</p>
                   </div>
                   <div className="absolute -right-4 -bottom-4 opacity-10 rotate-12 scale-150">
                      <Search size={120} className="text-white" />
                   </div>
                </div>

                {/* Cities Scroll */}
                <div>
                   <div className="flex justify-between items-center mb-4">
                      <h4 className="font-bold text-dark">Cities Adding Soon</h4>
                      <div className="h-1 w-12 bg-slate-200 rounded-full"></div>
                   </div>
                   <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
                      {[
                        { name: 'Hyderabad', img: 'https://images.unsplash.com/photo-1599933023573-0949d2110c71?w=300&q=80' },
                        { name: 'NCR', img: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=300&q=80' },
                        { name: 'Chennai', img: 'https://images.unsplash.com/photo-1582512353193-c744170ea939?w=300&q=80' }
                      ].map(city => (
                        <div key={city.name} className="min-w-[140px] snap-start">
                           <div className="h-32 rounded-2xl overflow-hidden mb-2 relative group grayscale hover:grayscale-0 transition-all cursor-default">
                              <img src={city.img} className="w-full h-full object-cover" alt={city.name} />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                 <span className="text-white text-[10px] font-black uppercase tracking-widest bg-black/40 backdrop-blur-sm px-2 py-1 rounded-md mb-2">Waitlist</span>
                              </div>
                           </div>
                           <p className="font-bold text-slate-700 text-sm">{city.name}</p>
                        </div>
                      ))}
                   </div>
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* Right Panel (Map) */}
        <div className={`flex-1 h-full bg-gray-100 relative ${viewMode === 'list' ? 'hidden md:block' : 'block'}`}>
          {/* Subtle inset shadow over map */}
          <div className="absolute inset-0 pointer-events-none shadow-[inset_10px_0_20px_-10px_rgba(0,0,0,0.05)] z-[400] md:block hidden"></div>
          
          {/* Heatmap Toggle Overlay */}
          <div className="absolute top-4 right-4 z-[400]">
             <button 
               onClick={() => setHeatmapActive(!heatmapActive)}
               className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl transition-all border-2 ${heatmapActive ? 'bg-orange-500 text-white border-orange-400' : 'bg-white text-slate-600 border-white hover:border-orange-100'}`}
             >
               <span className={`${heatmapActive ? 'animate-bounce' : ''}`}>🔥</span>
               {heatmapActive ? 'Heatmap: On' : 'Show Price Heat'}
             </button>
          </div>

          <MapView rooms={filteredRooms} heatmapActive={heatmapActive} />
        </div>
      </div>
    </div>
  );
}
