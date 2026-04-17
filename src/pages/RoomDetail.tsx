import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { Room } from '@/types';
import toast from 'react-hot-toast';
import { RoomCard } from '@/components/RoomCard';
import { 
  X, Loader2
} from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { format, parseISO } from 'date-fns';
import { ChatWindow } from '@/components/ChatWindow';

interface RoomWithLandlord extends Room {
  profiles: {
    full_name: string;
    avatar_url?: string;
    created_at: string;
    kyc_verified: boolean;
  };
}

// Create a simple custom marker for the mini-map

const customMarkerIcon = L.divIcon({
  className: 'custom-map-marker',
  html: `<div class="bg-primary w-5 h-5 rounded-full border-[3px] border-white shadow-md"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

/**
 * Helper to get the correct Material Symbol name for an amenity
 */
const getAmenitySymbol = (am: string) => {
  const lower = am.toLowerCase();
  if (lower.includes('wifi') || lower.includes('internet')) return 'wifi';
  if (lower.includes('ro water') || lower.includes('water')) return 'water_drop';
  if (lower.includes('ac') || lower.includes('air')) return 'ac_unit';
  if (lower.includes('backup') || lower.includes('power')) return 'electric_bolt';
  if (lower.includes('security')) return 'security';
  if (lower.includes('cctv') || lower.includes('video')) return 'videocam';
  if (lower.includes('bed')) return 'bed';
  if (lower.includes('parking')) return 'local_parking';
  if (lower.includes('gym')) return 'fitness_center';
  if (lower.includes('lift')) return 'elevator';
  if (lower.includes('kitchen')) return 'kitchen';
  if (lower.includes('washing')) return 'local_laundry_service';
  return 'star';
};


/**
 * RoomDetail component.
 * WHAT IT DOES: Displays an intricate, fully comprehensive profile page for a rental room. Includes photos, landlord info, amenities, map context, and booking modal.
 */
export default function RoomDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  // State
  const [room, setRoom] = useState<RoomWithLandlord | null>(null); // Extended Room with 'profiles' attached (landlord data)
  const [loading, setLoading] = useState(true);

  const [similarRooms, setSimilarRooms] = useState<Room[]>([]);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('Morning (9-12)');
  const [visitMessage, setVisitMessage] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);
  
  // Chat Drawer State
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    
    /**
     * Formally loads all room data, landlord details, and contextual similar rooms.
     */
    const loadData = async () => {
      setLoading(true);
      // Fetch room and join with the profiles table for landlord info
      const { data, error } = await supabase
        .from('rooms')
        .select('*, profiles(full_name, avatar_url, created_at, kyc_verified)')
        .eq('id', id)
        .single();
        
      if (error || !data) {
        toast.error('Room not found');
        navigate('/discover');
        return;
      }
      
      setRoom(data);
      
      // Instantly fetch similar local properties in parallel logically
      const { data: similar } = await supabase
        .from('rooms')
        .select('*')
        .eq('city', data.city)
        .eq('room_type', data.room_type)
        .eq('available', true)
        .neq('id', data.id)
        .limit(3);
        
      if (similar) setSimilarRooms(similar);
      setLoading(false);
    };
    
    loadData();
    // Scroll to top on id change
    window.scrollTo(0, 0);
  }, [id, navigate]);

  /**
   * Generates a link to the current listing and dumps it directly to clipboard.
   */
  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied! 📋');
    } catch {
      toast.error('Failed to copy link');
    }
  };


  /**
   * Finalizes formatting the user's visit request schedule and messages the landlord over the internal DB.
   */
  const handleBookVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) {
      toast.error('Please login to book a visit.');
      navigate('/login');
      return;
    }
    
    // Prevent Sundays
    const d = new Date(visitDate);
    if (d.getDay() === 0) {
      toast.error('Visits are not allowed on Sundays.');
      return;
    }

    setSendingRequest(true);
    const content = `Visit request for ${visitDate} - ${visitTime}. ${visitMessage}`;
    
    const { error } = await supabase.from('messages').insert([{
      room_id: room.id,
      sender_id: profile.id,
      receiver_id: room.landlord_id,
      content,
    }]);

    setSendingRequest(false);
    if (error) {
      toast.error('Failed to send request. Try again later.');
    } else {
      toast.success('Visit request sent! The landlord will contact you. 📅');
      setIsModalOpen(false);
      setVisitDate('');
      setVisitMessage('');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!room) return null;

  // Derive static price context logically
  const avgRange = room.room_type === '1BHK' ? '12k–16k' : room.room_type === '2BHK' ? '18k–25k' : room.room_type === 'Studio' ? '10k–14k' : '6k–10k';
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface antialiased pb-32">
      {/* 1. TOP APP BAR (Glassmorphism) */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl shadow-sm flex items-center justify-between px-4 h-16 border-b border-surface-container">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="material-symbols-outlined text-primary active:scale-95 transition-transform"
          >
            arrow_back
          </button>
          <h1 className="font-headline font-bold text-lg text-primary">Room Details</h1>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleShare}
            className="material-symbols-outlined text-primary active:scale-95 transition-transform"
          >
            share
          </button>
        </div>
      </header>

      <main className="pt-16">
        {/* 2. PHOTO GALLERY (Intentional Asymmetry) */}
        <section className="relative">
          <div className="w-full h-[350px] md:h-[500px] overflow-hidden">
            {room.photos && room.photos.length > 0 ? (
              <img 
                src={room.photos[activePhotoIdx]} 
                alt={room.title}
                className="w-full h-full object-cover transition-opacity duration-300"
              />
            ) : (
              <div className="w-full h-full bg-surface-container flex items-center justify-center text-on-surface-variant font-medium">
                No Photos Available
              </div>
            )}
            
            {/* Floating Index Badge */}
            <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold tracking-wider">
              {activePhotoIdx + 1} / {room.photos?.length || 0}
            </div>
          </div>

          {/* Overlapping Thumbnails */}
          <div className="flex gap-3 px-4 -mt-12 relative z-10 overflow-x-auto hide-scrollbar snap-x">
            {room.photos?.map((url: string, idx: number) => (
              <button
                key={idx}
                onClick={() => setActivePhotoIdx(idx)}
                className={`min-w-[100px] h-20 rounded-xl overflow-hidden ring-4 transition-all snap-start ${
                  idx === activePhotoIdx ? 'ring-primary shadow-xl scale-95' : 'ring-white shadow-lg opacity-80'
                }`}
              >
                <img src={url} className="w-full h-full object-cover" alt={`Thumb ${idx}`} />
              </button>
            ))}
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 lg:px-0">
          {/* 3. ROOM HEADER */}
          <section className="mt-8 flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex-1">
                <h2 className="font-headline font-extrabold text-3xl md:text-4xl text-on-surface leading-tight tracking-tight">
                  {room.title}
                </h2>
                <div className="flex items-center gap-1 text-on-surface-variant font-medium mt-1">
                  <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>location_on</span>
                  <span>{room.locality}, {room.city}</span>
                </div>
              </div>

              {/* BHOOMI SCORE (Asset Trust Score) */}
              <div className="bg-white/40 backdrop-blur-xl border-2 border-primary/20 p-5 rounded-[2rem] flex flex-col items-center justify-center min-w-[140px] shadow-lg shadow-primary/5 hover:scale-105 transition-all">
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Bhoomi Score</span>
                <div className="text-4xl font-black text-dark tracking-tighter">
                  {(() => {
                    let score = 70;
                    if (room.furnished) score += 10;
                    score += (room.amenities?.length || 0) * 2;
                    if (room.profiles?.kyc_verified) score += 10;
                    const grade = score > 90 ? 'A+' : score > 80 ? 'A' : score > 70 ? 'B+' : 'B';
                    return (
                      <div className="flex flex-col items-center">
                         <span>{grade}</span>
                         <div className="flex gap-0.5 mt-1">
                            {[1, 2, 3, 4, 5].map(s => (
                              <div key={s} className={`h-1 w-3 rounded-full ${s <= (score/20) ? 'bg-brand' : 'bg-slate-200'}`}></div>
                            ))}
                         </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            <div className="flex items-baseline gap-1 mt-2">
              <span className="font-headline font-extrabold text-4xl text-primary">
                ₹{room.rent_amount?.toLocaleString()}
              </span>
              <span className="text-on-surface-variant font-medium text-lg">/ month</span>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider">
                {room.room_type}
              </span>
              <span className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1 border border-emerald-100">
                {room.furnished ? 'Furnished' : 'Unfurnished'}
                <span className="material-symbols-outlined text-[14px]">check</span>
              </span>
              <span className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1 border border-emerald-100">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                {room.available ? 'Available Now' : 'Unavailable'}
              </span>
            </div>
          </section>

          {/* 4. DETAILS GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-10">
            {/* L: Details & Amenities */}
            <div className="lg:col-span-2 flex flex-col gap-8">
              {/* About */}
              <section className="bg-white p-6 md:p-8 rounded-3xl shadow-[0_4px_40px_rgba(0,0,0,0.03)] border border-surface-container-low">
                <h3 className="font-headline font-bold text-xl text-on-surface mb-4">About this property</h3>
                <p className="text-on-surface-variant leading-relaxed whitespace-pre-wrap font-medium text-base">
                  {room.description}
                </p>
              </section>

              {/* COMMUTE COMPATIBILITY (Dynamic Score) */}
              <section className="bg-gradient-to-br from-indigo-50 to-white p-6 md:p-8 rounded-3xl shadow-[0_4px_40px_rgba(30,58,138,0.03)] border border-indigo-100/50">
                <div className="flex items-center gap-3 mb-6">
                   <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                      <span className="material-symbols-outlined text-[20px]">directions_car</span>
                   </div>
                   <h3 className="font-headline font-bold text-xl text-dark">Commute Compatibility</h3>
                </div>

                <div className="space-y-6">
                   <div className="relative group">
                      <input 
                        type="text" 
                        placeholder="Enter your workplace e.g. Manyata Tech Park"
                        className="w-full pl-12 pr-4 py-4 bg-white border-2 border-indigo-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all font-bold text-dark placeholder-slate-300"
                        onChange={(e) => {
                          const val = e.target.value;
                          const resultEl = document.getElementById('commute-result');
                          if (val.length > 3) {
                            // A stable mock calculation based on locality name and destiny
                            const hash = (val.length + room.locality.length) % 45;
                            const time = 15 + hash;
                            if (resultEl) resultEl.innerHTML = `<span class="text-indigo-600">${time} mins</span> during peak hours`;
                          } else if (resultEl) {
                            resultEl.innerHTML = 'Enter destination to calculate';
                          }
                        }}
                      />
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 group-focus-within:text-indigo-600 transition-colors">
                        near_me
                      </span>
                   </div>
                   <div className="p-4 bg-white rounded-2xl border border-indigo-100 flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                         <span className="material-symbols-outlined">schedule</span>
                      </div>
                      <p id="commute-result" className="text-sm font-bold text-slate-500">
                        Enter destination to calculate
                      </p>
                   </div>
                </div>
              </section>

              {/* Amenities */}
              <section className="bg-white p-6 md:p-8 rounded-3xl shadow-[0_4px_40px_rgba(0,0,0,0.03)] border border-surface-container-low">
                <h3 className="font-headline font-bold text-xl text-on-surface mb-6">Premium Amenities</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {room.amenities?.map((am: string, i: number) => (
                    <div key={i} className="flex items-center gap-3 group">
                      <div className="w-12 h-12 rounded-2xl bg-surface-container-low flex items-center justify-center group-hover:bg-primary/5 transition-colors">
                        <span className="material-symbols-outlined text-primary text-[24px]">
                          {getAmenitySymbol(am)}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-on-surface-variant group-hover:text-on-surface transition-colors">{am}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Location (Mini Map) */}
              <section className="bg-white p-6 md:p-8 rounded-3xl shadow-[0_4px_40px_rgba(0,0,0,0.03)] border border-surface-container-low overflow-hidden">
                <h3 className="font-headline font-bold text-xl text-on-surface mb-2">Location</h3>
                <p className="text-on-surface-variant font-medium mb-6 flex items-start gap-2">
                  <span className="material-symbols-outlined text-outline mt-0.5">map</span>
                  <span>{room.address || `${room.locality}, ${room.city}`}</span>
                </p>
                <div className="h-64 rounded-2xl overflow-hidden border border-surface-container relative grayscale-[0.2] saturate-[0.8]">
                  {room.latitude && room.longitude ? (
                    <MapContainer 
                      center={[room.latitude, room.longitude]} 
                      zoom={14} 
                      zoomControl={false}
                      dragging={false} 
                      scrollWheelZoom={false}
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" className="opacity-80" />
                      <Marker position={[room.latitude, room.longitude]} icon={customMarkerIcon} />
                    </MapContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center bg-surface-container text-outline font-medium">Map Unavailable</div>
                  )}
                  <div className="absolute inset-0 bg-primary/5 pointer-events-none"></div>
                </div>
              </section>
            </div>

            {/* R: Context & Landlord */}
            <div className="flex flex-col gap-6">
              {/* Landlord Card */}
              <section className="bg-white p-6 rounded-3xl shadow-[0px_10px_40px_rgba(30,41,59,0.04)] border border-surface-container-low">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-white font-headline font-bold text-xl overflow-hidden ring-4 ring-primary/5">
                    {room.profiles?.avatar_url ? (
                      <img src={room.profiles.avatar_url} className="w-full h-full object-cover" alt="Avatar" />
                    ) : (
                      room.profiles?.full_name?.charAt(0).toUpperCase() || 'L'
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-headline font-bold text-on-surface truncate">
                      {room.profiles?.full_name || 'Landlord'}
                    </h4>
                    <p className="text-xs font-semibold text-on-surface-variant mt-0.5">
                      Member since {room.profiles?.created_at ? format(parseISO(room.profiles.created_at), 'MMM yyyy') : '2024'}
                    </p>
                  </div>
                </div>

                {room.profiles?.kyc_verified && (
                  <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 flex items-center gap-3 mb-6">
                    <span className="material-symbols-outlined text-primary text-[24px]">verified_user</span>
                    <div>
                      <p className="text-xs font-extrabold text-on-primary-container">Verified Identity</p>
                      <p className="text-[10px] text-primary/70 font-bold uppercase tracking-tight">Vetted by REHWAS</p>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="w-full h-12 bg-white border-2 border-primary text-primary font-headline font-bold rounded-xl hover:bg-emerald-50 transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                    Book a Visit
                  </button>
                  <button 
                    onClick={() => setIsChatOpen(true)}
                    className="w-full h-12 bg-surface-container-high text-on-surface font-headline font-bold rounded-xl hover:bg-surface-container-highest transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">chat_bubble</span>
                    Chat with Landlord
                  </button>
                </div>
              </section>

              {/* Price Context */}
              <section className="bg-tertiary-container/10 p-5 rounded-3xl border border-tertiary-container/20">
                <h4 className="font-headline font-bold text-on-tertiary-container text-xs tracking-wide uppercase mb-2">Market Watch</h4>
                <p className="text-on-tertiary-container font-medium text-sm">
                  Average {room.room_type} in {room.locality}:
                </p>
                <p className="text-2xl font-black text-on-tertiary-container mt-1">₹{avgRange}</p>
                <div className="mt-3 flex items-center gap-2 text-primary font-bold text-xs bg-white/50 w-fit px-2 py-1 rounded-lg">
                  <span className="material-symbols-outlined text-[14px]">trending_up</span>
                  Competitive Listing
                </div>
              </section>

              {/* Safety Tip */}
              <section className="flex items-start gap-4 p-5 bg-surface-container-low rounded-3xl border border-outline-variant/10">
                <span className="material-symbols-outlined text-outline">shield</span>
                <p className="text-xs font-semibold text-on-surface-variant leading-relaxed">
                  <strong className="text-on-surface">Safety Tip:</strong> Never pay a security deposit without visiting in person.
                </p>
              </section>
            </div>
          </div>
        </div>

        {/* RELATED / SIMILAR PROPERTIES LAYER */}
        {similarRooms.length > 0 && (
          <div className="max-w-4xl mx-auto px-4 lg:px-0 mt-20 pt-10 border-t border-surface-container">
            <h2 className="font-headline font-black text-2xl text-on-surface mb-8">More rooms in {room.locality}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {similarRooms.map(r => (
                 <RoomCard key={r.id} room={r} />
               ))}
            </div>
          </div>
        )}
      </main>

      {/* 5. STICKY BOTTOM BAR (Mobile Focused) */}
      <footer className="fixed bottom-0 w-full z-50 bg-white/95 backdrop-blur-xl px-4 py-4 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)] border-t border-surface-container md:hidden">
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center px-1 mb-1">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-outline-variant uppercase tracking-widest">Starting at</span>
              <span className="text-xl font-headline font-extrabold text-primary">₹{room.rent_amount?.toLocaleString()}<span className="text-xs text-on-surface-variant font-medium">/mo</span></span>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-6 h-12 bg-primary text-white font-headline font-bold rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all"
            >
              Book Visit
            </button>
          </div>
        </div>
      </footer>

      {/* BOOK A VISIT MODAL PORTAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)}></div>
          
          <div className="bg-white w-full h-[90vh] md:h-auto md:max-w-lg rounded-t-[32px] md:rounded-[32px] overflow-hidden shadow-2xl relative z-10 animate-in slide-in-from-bottom md:zoom-in-95 duration-200 flex flex-col">
            <div className="p-6 md:p-8 flex flex-col gap-6 overflow-y-auto flex-1">
              
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black text-gray-900">Request a Visit</h3>
                <button onClick={() => setIsModalOpen(false)} className="bg-gray-100 hover:bg-gray-200 p-2 rounded-full text-gray-500 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleBookVisit} className="flex flex-col gap-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Select Date</label>
                  <input 
                    type="date" 
                    required
                    min={today}
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                    className="w-full px-4 py-3 min-h-[44px] bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium text-gray-800 text-base"
                  />
                  <p className="text-xs text-gray-400 mt-2 font-medium">Please note visits cannot be scheduled on Sundays.</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Preferred Time Window</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['Morning (9-12)', 'Afternoon (12-4)', 'Evening (4-7)'].map(slot => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setVisitTime(slot)}
                        className={`py-3 px-2 min-h-[44px] rounded-xl text-center text-xs font-bold border-2 transition-all ${visitTime === slot ? 'bg-emerald-50 border-primary text-primary shadow-sm' : 'border-gray-100 bg-white text-gray-500 hover:bg-gray-50'}`}
                      >
                        {slot.split(' (')[0]}<br/>
                        <span className="font-medium text-[10px] opacity-80">({slot.split('(')[1]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Message <span className="font-normal text-gray-400">(Optional)</span></label>
                  <textarea 
                    rows={3}
                    placeholder="Hello! I'm interested in renting this place..."
                    value={visitMessage}
                    onChange={(e) => setVisitMessage(e.target.value)}
                    className="w-full px-4 py-3 min-h-[44px] bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium text-gray-800 resize-none text-base"
                  ></textarea>
                </div>

                <div className="mt-auto md:mt-2 text-center pt-2 border-t border-gray-100">
                  <button 
                    type="submit" 
                    disabled={sendingRequest}
                    className={`w-full font-bold py-4 min-h-[44px] rounded-xl shadow-md transition-all flex items-center justify-center gap-2 ${sendingRequest ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-primary hover:bg-emerald-700 text-white shadow-primary/20 active:scale-[0.98]'}`}
                  >
                    {sendingRequest ? (
                      <><Loader2 className="animate-spin h-5 w-5" /> Sending...</>
                    ) : (
                      'Send Request'
                    )}
                  </button>
                </div>
              </form>

            </div>
          </div>
        </div>
      )}

      {/* CHAT DRAWER */}
      {isChatOpen && (
        <div className="fixed inset-0 z-[110] flex justify-end">
           {/* Backdrop */}
           <div 
             className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
             onClick={() => setIsChatOpen(false)}
           ></div>
           
           {/* Slide-In Menu */}
           <div className="relative w-full max-w-md h-full bg-white shadow-2xl animate-in slide-in-from-right duration-300 pointer-events-auto flex flex-col">
              <ChatWindow 
                roomId={room.id}
                otherUserId={room.landlord_id}
                otherUserName={room.profiles?.full_name || 'Landlord'}
                onClose={() => setIsChatOpen(false)}
              />
           </div>
        </div>
      )}

    </div>
  );
}

/**
 * @breakpoints used: 
 * `lg:` - applies desktop layouts (e.g. static lg:sticky for booking panel).
 * `md:` - converts full-screen sliding modals into central padded popups.
 */
