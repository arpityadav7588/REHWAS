import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { Room } from '@/types';
import toast from 'react-hot-toast';
import { RoomCard } from '@/components/RoomCard';
import { 
  MapPin, ShieldCheck, Wifi, Tv, Wind, Zap, BedDouble, 
  Share2, MessageCircle, Calendar, ShieldAlert, Check, X
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { format, parseISO } from 'date-fns';
import { ChatWindow } from '@/components/ChatWindow';

// Create a simple custom marker for the mini-map
const customMarkerIcon = L.divIcon({
  className: 'custom-map-marker',
  html: `<div class="bg-green-600 w-5 h-5 rounded-full border-[3px] border-white shadow-md"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

/**
 * Helper to get the correct icon for an amenity
 */
const getAmenityIcon = (am: string) => {
  const lower = am.toLowerCase();
  if (lower.includes('wifi') || lower.includes('internet')) return Wifi;
  if (lower.includes('tv')) return Tv;
  if (lower.includes('ac') || lower.includes('air')) return Wind;
  if (lower.includes('bed')) return BedDouble;
  return Zap;
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
  const [room, setRoom] = useState<any>(null); // Extended Room with 'profiles' attached (landlord data)
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
    } catch (err) {
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
  const avgRange = room.room_type === '1BHK' ? '12k–16k' : room.room_type === '2BHK' ? '18k–25k' : room.room_type === 'Studio' ? '10k–14k' : '6k-10k';
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-[#fafafa] pb-24">
      {/* Top Gallery Layout */}
      <div className="bg-black/5">
        <div className="max-w-6xl mx-auto md:p-6 lg:p-8 flex flex-col gap-3">
          {/* Main Hero Shot */}
          <div className="w-full h-[300px] md:h-[450px] lg:h-[500px] bg-gray-900 md:rounded-3xl overflow-hidden relative shadow-lg">
            {room.photos && room.photos.length > 0 ? (
              <img 
                src={room.photos[activePhotoIdx]} 
                alt={`${room.title} image`} 
                className="w-full h-full object-cover transition-opacity duration-300" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">No photos available</div>
            )}
            
            {/* Photo Counter Badge */}
            {room.photos && room.photos.length > 0 && (
              <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white font-bold text-sm px-3 py-1.5 rounded-full shadow-lg">
                {activePhotoIdx + 1} / {room.photos.length}
              </div>
            )}
          </div>
          
          {/* Thumbnail Gallery Wrapper */}
          {room.photos && room.photos.length > 1 && (
            <div className="flex gap-3 overflow-x-auto px-4 md:px-0 pb-2 scrollbar-none snap-x">
              {room.photos.map((url: string, idx: number) => (
                <button 
                  key={idx}
                  onClick={() => setActivePhotoIdx(idx)}
                  className={`relative w-24 h-24 shrink-0 rounded-2xl overflow-hidden snap-start transition-all ${idx === activePhotoIdx ? 'ring-4 ring-green-500 scale-95' : 'ring-1 ring-gray-200 hover:opacity-80'}`}
                >
                  <img src={url} alt={`Thumbnail ${idx+1}`} className="w-full h-full object-cover" />
                  {idx !== activePhotoIdx && <div className="absolute inset-0 bg-black/10"></div>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 pt-8">
        {/* ROOM HEADER ROW */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-10 pb-8 border-b border-gray-200/80">
          <div className="flex flex-col gap-3 flex-1">
            <div className="flex flex-col">
               <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight leading-tight">{room.title}</h1>
               <div className="flex items-center gap-2 mt-2 text-gray-500 font-semibold">
                 <MapPin size={18} className="text-green-600" />
                 <span>{room.locality}, {room.city}</span>
               </div>
            </div>
            
            {/* Badges Flow */}
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-sm font-bold ring-1 ring-green-100 flex items-center gap-1.5">
                {room.available ? <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> : null}
                {room.available ? 'Available Now' : 'Unavailable'}
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-sm font-bold ring-1 ring-blue-100">{room.room_type}</span>
              <span className="px-3 py-1.5 rounded-lg bg-violet-50 text-violet-700 text-sm font-bold ring-1 ring-violet-100">
                {room.furnished ? 'Furnished' : 'Unfurnished'}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end gap-4 md:min-w-[200px]">
            <div className="text-left sm:text-right md:text-right">
              <h2 className="text-4xl font-extrabold text-green-600 tracking-tight">₹{room.rent_amount.toLocaleString()}</h2>
              <p className="text-gray-400 font-medium">per month</p>
            </div>
            <button 
              onClick={handleShare}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 font-bold hover:bg-gray-50 hover:border-gray-300 transition-all ml-auto md:ml-0"
            >
              <Share2 size={18} />
              Share Link
            </button>
          </div>
        </div>

        {/* 2-COLUMN MAIN CONTENT DECK */}
        <div className="flex flex-col lg:flex-row gap-12 relative">
          
          {/* L. COLUMN: Details */}
          <div className="flex-1 flex flex-col gap-10">
            {/* Description */}
            <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4">About this property</h3>
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap font-medium">{room.description}</p>
            </section>

            {/* Quick stats grid */}
            <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
               {[
                 { label: 'Available From', value: 'Ready to move', highlight: true },
                 { label: 'Deposit', value: `₹${(room.rent_amount * 2).toLocaleString()}`, highlight: false },
                 { label: 'Gender', value: room.gender_preference || 'Any', highlight: false },
                 { label: 'Floor', value: 'Ground floor', highlight: false }, // Harcoded since DB doesn't have floor property currently
               ].map((stat, i) => (
                 <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 flex flex-col items-center justify-center text-center">
                   <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{stat.label}</p>
                   <p className={`text-base font-bold ${stat.highlight ? 'text-green-600 cursor-default' : 'text-gray-800'}`}>{stat.value}</p>
                 </div>
               ))}
            </section>

            {/* Amenities Grid */}
            <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Top Amenities</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {room.amenities.map((am: string, i: number) => {
                  const Icon = getAmenityIcon(am);
                  return (
                    <div key={i} className="flex flex-col items-center justify-center text-center p-4 bg-gray-50 rounded-2xl hover:bg-green-50 hover:text-green-700 transition-colors group">
                      <Icon size={28} className="text-gray-500 group-hover:text-green-600 mb-3 transition-colors" />
                      <span className="font-bold text-gray-700 group-hover:text-green-700">{am}</span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Address & Static Map Location Box */}
            <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Location</h3>
              <p className="text-gray-500 font-medium mb-6 flex items-start gap-2">
                 <MapPin size={18} className="text-gray-400 mt-0.5 shrink-0" />
                 <span>{room.address || `${room.locality}, ${room.city}`}</span>
              </p>
              
              <div className="h-64 w-full rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 relative pointer-events-none">
                 {room.latitude && room.longitude ? (
                   <MapContainer 
                     center={[room.latitude, room.longitude]} 
                     zoom={14} 
                     zoomControl={false}
                     dragging={false} scrollWheelZoom={false}
                     style={{ height: '100%', width: '100%' }}
                   >
                     <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" className="filter contrast-100 saturate-50" />
                     <Marker position={[room.latitude, room.longitude]} icon={customMarkerIcon} />
                   </MapContainer>
                 ) : (
                   <div className="flex h-full items-center justify-center text-gray-400 font-medium">Map location not available</div>
                 )}
                 {/* Visual glass overlay to show it's non-interactive */}
                 <div className="absolute inset-0 z-20 shadow-[inset_0px_0px_20px_rgba(0,0,0,0.05)]"></div>
              </div>
            </section>
          </div>

          {/* R. COLUMN: Sticky Side Panel */}
          <div className="w-full lg:w-[380px] shrink-0 mt-8 lg:mt-0">
             <div className="static lg:sticky top-6 flex flex-col gap-6">
                
                {/* Landlord Card */}
                <div className="bg-white rounded-3xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-2xl shrink-0 overflow-hidden">
                       {room.profiles?.avatar_url ? (
                         <img src={room.profiles.avatar_url} alt="Landlord Avatar" className="w-full h-full object-cover" />
                       ) : (
                         room.profiles?.full_name?.charAt(0).toUpperCase() || 'L'
                       )}
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-gray-900 leading-tight">{room.profiles?.full_name || 'Landlord'}</h4>
                      <p className="text-sm font-medium text-gray-500 mt-1">
                        Member since {room.profiles?.created_at ? format(parseISO(room.profiles.created_at), 'MMM yyyy') : '2023'}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-3 mb-6">
                    {room.profiles?.kyc_verified ? (
                       <>
                         <div className="p-2 bg-green-100 rounded-full text-green-600"><Check size={20} /></div>
                         <div>
                           <p className="font-bold text-gray-900 text-sm">KYC Verified Landlord</p>
                           <p className="text-xs text-gray-500 font-medium">Identity verified by REHWAS</p>
                         </div>
                       </>
                    ) : (
                       <>
                         <div className="p-2 bg-orange-100 rounded-full text-orange-600"><ShieldAlert size={20} /></div>
                         <div>
                           <p className="font-bold text-orange-900 text-sm">Unverified Landlord</p>
                           <p className="text-xs text-orange-700/80 font-medium">Identity not fully reviewed</p>
                         </div>
                       </>
                    )}
                  </div>

                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={() => setIsModalOpen(true)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl shadow-md shadow-green-600/20 transition-all flex justify-center items-center gap-2 transform active:scale-95"
                    >
                      <Calendar size={18} /> Book a Visit
                    </button>
                    {/* Chat button essentially acts as a placeholder for navigation to message flows */}
                    <button 
                      onClick={() => setIsChatOpen(true)}
                      className="w-full bg-white hover:bg-gray-50 text-gray-700 font-bold py-3.5 rounded-xl border-2 border-gray-200 transition-all flex justify-center items-center gap-2 transform active:scale-95"
                    >
                      <MessageCircle size={18} /> Chat with Landlord
                    </button>
                  </div>
                </div>

                {/* Algorithmic Context Pane */}
                <div className="bg-blue-50/50 rounded-3xl p-6 border border-blue-100/50 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-10">
                     <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                   </div>
                   <h4 className="text-blue-900 font-bold text-sm tracking-wide uppercase mb-2">Price Context</h4>
                   <p className="text-blue-800 font-medium">📍 Avg {room.room_type} in {room.locality}:</p>
                   <p className="text-2xl font-black text-blue-900 mt-1">₹{avgRange}/mo</p>
                </div>

                {/* Safety Warning */}
                <div className="flex bg-orange-50 items-start gap-4 p-5 rounded-3xl text-orange-800 font-medium text-sm leading-relaxed border border-orange-100/50">
                  <ShieldAlert size={24} className="text-orange-500 shrink-0 mt-0.5" />
                  <p><strong>Safety Tip:</strong> Never pay any security deposit or token amount without visiting the property in person and verifying documents.</p>
                </div>
             </div>
          </div>
        </div>

        {/* RELATED / SIMILAR PROPERTIES LAYER */}
        {similarRooms.length > 0 && (
          <div className="mt-20 pt-10 border-t border-gray-200/50">
            <h2 className="text-2xl font-black text-gray-900 mb-8">More rooms in {room.locality}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {similarRooms.map(r => (
                 <RoomCard key={r.id} room={r} />
               ))}
            </div>
          </div>
        )}
      </div>

      {/* BOOK A VISIT MODAL PORTAL (Rendered inline for ease of DOM state scoping) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
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
                    className="w-full px-4 py-3 min-h-[44px] bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all font-medium text-gray-800 text-base"
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
                        className={`py-3 px-2 min-h-[44px] rounded-xl text-center text-xs font-bold border-2 transition-all ${visitTime === slot ? 'bg-green-50 border-green-500 text-green-700 shadow-sm' : 'border-gray-100 bg-white text-gray-500 hover:bg-gray-50'}`}
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
                    className="w-full px-4 py-3 min-h-[44px] bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all font-medium text-gray-800 resize-none text-base"
                  ></textarea>
                </div>

                <div className="mt-auto md:mt-2 text-center pt-2 border-t border-gray-100">
                  <button 
                    type="submit" 
                    disabled={sendingRequest}
                    className={`w-full font-bold py-4 min-h-[44px] rounded-xl shadow-md transition-all flex items-center justify-center gap-2 ${sendingRequest ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white shadow-green-600/20 active:scale-[0.98]'}`}
                  >
                    {sendingRequest ? (
                      <><div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div> Sending...</>
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
        <div className="fixed inset-0 z-[100] flex justify-end">
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
