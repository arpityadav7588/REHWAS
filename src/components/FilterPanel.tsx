import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * FilterPanel component for filtering rooms.
 * WHAT IT DOES: Renders a form with various filters (city, rent, type, etc.) and updates URL search params on submit.
 */
export const FilterPanel = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [city, setCity] = useState(searchParams.get('city') || 'Bengaluru');
  const [minRent, setMinRent] = useState(searchParams.get('min_rent') || '');
  const [maxRent, setMaxRent] = useState(searchParams.get('max_rent') || '');
  const [roomType, setRoomType] = useState(searchParams.get('room_type') || 'All');
  const [furnished, setFurnished] = useState(searchParams.get('furnished') || 'Any');
  const [gender, setGender] = useState(searchParams.get('gender') || 'Any');

  useEffect(() => {
    setCity(searchParams.get('city') || 'Bengaluru');
    setMinRent(searchParams.get('min_rent') || '');
    setMaxRent(searchParams.get('max_rent') || '');
    setRoomType(searchParams.get('room_type') || 'All');
    setFurnished(searchParams.get('furnished') || 'Any');
    setGender(searchParams.get('gender') || 'Any');
  }, [searchParams]);

  /**
   * Handles form submission to update URL search parameters.
   * @param e Form event
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (minRent) params.set('min_rent', minRent);
    if (maxRent) params.set('max_rent', maxRent);
    if (roomType !== 'All') params.set('room_type', roomType);
    if (furnished !== 'Any') params.set('furnished', furnished);
    if (gender !== 'Any') params.set('gender', gender);
    
    setSearchParams(params);
  };

  /**
   * Resets all filters by clearing URL search parameters.
   */
  const handleReset = () => {
    setSearchParams(new URLSearchParams());
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-5 bg-white rounded-2xl shadow-sm border border-gray-100">
      <div>
        <label className="block text-sm font-semibold mb-2 text-gray-700">City</label>
        <select value={city} onChange={(e) => setCity(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-100 focus:border-green-500 outline-none transition-all cursor-pointer text-base">
          <option value="Bengaluru">Bengaluru</option>
          <option value="Pune">Pune</option>
          <option value="Mumbai">Mumbai</option>
          <option value="Delhi">Delhi</option>
        </select>
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-sm font-semibold mb-2 text-gray-700">Min Rent</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
            <input type="number" value={minRent} onChange={(e) => setMinRent(e.target.value)} className="w-full p-2.5 pl-8 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-100 focus:border-green-500 outline-none transition-all text-base" placeholder="0" />
          </div>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-semibold mb-2 text-gray-700">Max Rent</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
            <input type="number" value={maxRent} onChange={(e) => setMaxRent(e.target.value)} className="w-full p-2.5 pl-8 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-100 focus:border-green-500 outline-none transition-all text-base" placeholder="50000" />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2 text-gray-700">Room Type</label>
        <div className="flex flex-wrap gap-2">
          {['All', '1BHK', '2BHK', 'PG', 'Studio'].map(type => (
            <label key={type} className="flex items-center gap-1.5 cursor-pointer select-none">
              <input type="radio" name="roomType" value={type} checked={roomType === type} onChange={() => setRoomType(type)} className="w-4 h-4 text-green-600 focus:ring-green-500 accent-green-600" />
              <span className="text-sm text-gray-800">{type}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2 text-gray-700">Furnished</label>
        <div className="flex bg-gray-100 p-1.5 rounded-xl">
          {['Any', 'Furnished', 'Unfurnished'].map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setFurnished(opt)}
              className={`flex-1 text-sm py-1.5 rounded-lg font-medium transition-all ${furnished === opt ? 'bg-white shadow text-gray-900 pointer-events-none' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2 text-gray-700">Gender Preference</label>
         <div className="flex flex-wrap gap-4">
          {['Any', 'Male Only', 'Female Only'].map(opt => (
            <label key={opt} className="flex items-center gap-1.5 cursor-pointer select-none">
              <input type="radio" name="gender" value={opt} checked={gender === opt} onChange={() => setGender(opt)} className="w-4 h-4 text-green-600 focus:ring-green-500 accent-green-600" />
              <span className="text-sm text-gray-800">{opt}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 mt-3">
        <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 min-h-[44px] rounded-xl shadow-sm transition-colors active:scale-[0.98]">
          Search Rooms
        </button>
        <button type="button" onClick={handleReset} className="w-full text-center text-gray-500 hover:text-gray-800 font-medium text-sm py-2 min-h-[44px] transition-colors underline decoration-gray-300 underline-offset-4 flex items-center justify-center">
          Reset Filters
        </button>
      </div>
    </form>
  );
};
