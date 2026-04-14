import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useRooms } from '@/hooks/useRooms';
import { FilterPanel } from '@/components/FilterPanel';
import { MapView } from '@/components/MapView';
import { RoomCard } from '@/components/RoomCard';
import { Search, Map as MapIcon, List as ListIcon, X } from 'lucide-react';

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
  const [searchParams] = useSearchParams();
  const { rooms, fetchRooms, loading } = useRooms();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

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
            
            <div className="flex flex-col gap-5 pb-20 md:pb-4">
              <div className="flex justify-between items-end mb-1 px-1">
                <h2 className="text-lg font-bold text-gray-800">Results</h2>
                <button 
                  onClick={() => setShowFiltersMobile(true)} 
                  className="md:hidden flex items-center justify-center gap-1 min-h-[44px] text-green-700 font-bold bg-green-50 border border-green-200 px-4 rounded-xl shadow-sm text-sm"
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
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center text-gray-500 bg-gray-50 rounded-[20px] border-2 border-gray-100 border-dashed">
                  <div className="w-24 h-24 bg-white shadow-sm rounded-full flex items-center justify-center mb-5 relative">
                    <MapIcon size={40} className="text-gray-300" />
                    <Search size={20} className="text-green-500 absolute bottom-3 right-3 bg-white rounded-full" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">No rooms left</h3>
                  <p className="text-gray-500 max-w-[250px]">We couldn't find any rooms matching your exact filters.</p>
                  <button 
                    onClick={() => setSearchParams(new URLSearchParams())}
                    className="mt-6 font-bold text-green-600 bg-green-50 px-6 py-2.5 rounded-xl hover:bg-green-100 transition-colors"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel (Map) */}
        <div className={`flex-1 h-full bg-gray-100 relative ${viewMode === 'list' ? 'hidden md:block' : 'block'}`}>
          {/* Subtle inset shadow over map */}
          <div className="absolute inset-0 pointer-events-none shadow-[inset_10px_0_20px_-10px_rgba(0,0,0,0.05)] z-[400] md:block hidden"></div>
          <MapView rooms={filteredRooms} />
        </div>
      </div>
    </div>
  );
}
