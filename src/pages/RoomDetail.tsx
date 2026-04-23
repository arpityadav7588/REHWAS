import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { Room } from '@/types';
import toast from 'react-hot-toast';
import { RoomCard } from '@/components/RoomCard';
import { 
  X, Loader2, FileText, MapPin, Zap, Moon, ShieldCheck, Lock, Info, Check
} from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { format, parseISO } from 'date-fns';
import { useDepositVault } from '../hooks/useDepositVault';
import { ChatWindow } from '@/components/ChatWindow';
import { CommuteWidget } from '@/components/CommuteWidget';
import { TenantRentScore } from '@/components/TenantRentScore';
import { RentHistoryChart } from '@/components/RentHistoryChart';



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
  const [moveInReport, setMoveInReport] = useState<any>(null);
  const [galleryMode, setGalleryMode] = useState<'photos' | 'night_view'>('photos');
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const { initiateDeposit, loading: depositLoading } = useDepositVault();

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
      } else {
        setRoom(data as RoomWithLandlord);
        
        // Check for completed move-in reports associated with this room
        const { data: reportData } = await supabase
          .from('move_in_reports')
          .select('id, created_at, report_status')
          .eq('room_id', id)
          .eq('report_status', 'completed')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
          
        if (reportData) setMoveInReport(reportData);
      }
      
      // Instantly fetch similar local properties in parallel logically
      if (data) {
        const { data: similar } = await supabase
          .from('rooms')
          .select('*')
          .eq('city', data.city)
          .eq('room_type', data.room_type)
          .eq('available', true)
          .neq('id', data.id)
          .limit(3);
          
        if (similar) setSimilarRooms(similar);
      }
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
    
    if (!room) return;

    const { error } = await supabase.from('messages').insert([{
      room_id: room.id,
      sender_id: profile.id,
      receiver_id: room.landlord_id,
      content,
    }]).select().single();

    if (!error) {
      // Create notification for the landlord
      await supabase.from('notifications').insert([{
        user_id: room.landlord_id,
        type: 'visit_request',
        title: `${profile.full_name} requested a visit`,
        body: `${profile.full_name} wants to visit ${room.title} on ${visitDate} at ${visitTime.split(' (')[0]}`,
        link: `/dashboard#tenants` // Navigating to a place where they manage visits
      }]);
    }

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
          </div>

          {/* GALLERY TABS */}
          <div className="flex gap-4 px-4 mt-6">
            <button 
              onClick={() => setGalleryMode('photos')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${galleryMode === 'photos' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white text-gray-400 hover:bg-gray-50'}`}
            >
              <span className="material-symbols-outlined text-[18px]">photo_library</span>
              Photos ({room.photos?.length || 0})
            </button>
            <button 
              onClick={() => setGalleryMode('night_view')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${galleryMode === 'night_view' ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'bg-white text-gray-400 hover:bg-gray-50'}`}
            >
              <Moon size={16} className={galleryMode === 'night_view' ? 'fill-emerald-400 text-emerald-400' : ''} />
              Night View
            </button>
          </div>

          {/* Overlapping Thumbnails (only for photos mode) */}
          {galleryMode === 'photos' ? (
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
          ) : (
            <div className="px-4 -mt-12 relative z-10">
              <div className="bg-slate-900 rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden aspect-video max-w-2xl mx-auto flex flex-col relative group">
                {room.street_video_url ? (
                  <>
                    <video 
                      src={room.street_video_url} 
                      className="w-full h-full object-cover"
                      controls
                      poster="/night-poster-placeholder.jpg"
                    />
                    <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
                      <div className="bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-white/20">
                        <Moon size={12} className="fill-emerald-400 text-emerald-400" /> Night View
                      </div>
                      {room.profiles?.kyc_verified && (
                        <div className="bg-emerald-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-emerald-400/50">
                          <ShieldCheck size={12} /> Verified by REHWAS
                        </div>
                      )}
                    </div>
                    <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-sm text-white/70 px-3 py-1 rounded-lg text-[9px] font-bold">
                      Recorded at night by landlord • {format(parseISO(room.created_at), 'MMM yyyy')}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                      <Moon size={32} className="text-slate-500" />
                    </div>
                    <h4 className="text-white font-black text-lg mb-2">No night view available</h4>
                    <p className="text-slate-400 text-sm max-w-xs mb-6">Ask the landlord for a walkthrough video of the street at night.</p>
                    <button 
                      onClick={() => {
                        setIsChatOpen(true);
                        // The ChatWindow component should handle the initial message if we pass it, 
                        // but here we'll just open the chat.
                        toast.success('Chat opened! Ask the landlord for a video.');
                      }}
                      className="bg-white text-slate-900 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-400 transition-colors"
                    >
                      Request Night View
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        <div className="max-w-4xl mx-auto px-4 lg:px-0">
          {/* 3. ROOM HEADER */}
          <section className="mt-8 flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex-1">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">{room.title}</h1>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-emerald-100 shadow-sm">
                    <Zap size={14} className="fill-emerald-500" /> Verified Host
                  </div>
                  {moveInReport && (
                    <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-indigo-100 shadow-sm">
                      <FileText size={14} className="text-indigo-500" /> Move-in Report Filed • {format(parseISO(moveInReport.created_at), 'MMM yyyy')}
                    </div>
                  )}
                  <p className="text-gray-400 font-bold text-xs uppercase tracking-widest flex items-center gap-1 ml-1"><MapPin size={14}/> {room.locality}, {room.city}</p>
                </div>
              </div>

              {/* BHOOMI SCORE (Asset Trust Score) */}
              {room.bhoomi_score && (
                <div className="bg-slate-900 border-2 border-emerald-500/20 p-5 rounded-[2.5rem] flex flex-col items-center justify-center min-w-[160px] shadow-2xl shadow-emerald-500/10 hover:scale-105 transition-all relative overflow-hidden group">
                  <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-1 relative z-10">Bhoomi Score</span>
                  <div className="flex flex-col items-center relative z-10">
                    <span className="text-4xl font-black text-white tracking-tighter leading-none">
                      {room.bhoomi_score}
                    </span>
                    <div className="flex gap-1 mt-2">
                      {[1, 2, 3, 4].map(s => (
                        <div key={s} className={`h-1 w-4 rounded-full ${room.bhoomi_score && room.bhoomi_score > (300 + s*150) ? 'bg-emerald-500' : 'bg-slate-700'}`}></div>
                      ))}
                    </div>
                    <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Asset Trust Index</p>
                  </div>
                </div>
              )}
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
              <CommuteWidget room={room} />

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

              {/* LOCAL MARKET TRENDS */}
              <section className="bg-white p-6 md:p-8 rounded-3xl shadow-[0_4px_40px_rgba(0,0,0,0.03)] border border-surface-container-low">
                <div className="flex flex-col gap-1 mb-6">
                  <h3 className="font-headline font-bold text-xl text-on-surface">Local Market Trends</h3>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-tight">
                    Average {room.room_type} rent in {room.locality} over 12 months
                  </p>
                </div>
                <RentHistoryChart 
                  locality={room.locality}
                  city={room.city}
                  roomType={room.room_type}
                  currentRent={room.rent_amount}
                />
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

              {/* Reviews Section */}
              <section className="bg-white p-6 md:p-8 rounded-3xl shadow-[0_4px_40px_rgba(0,0,0,0.03)] border border-surface-container-low">
                <h3 className="font-headline font-bold text-xl text-on-surface mb-6">Reviews</h3>
                <div className="flex flex-col items-center py-10 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-200">
                    <span className="material-symbols-outlined text-[32px]">rate_review</span>
                  </div>
                  <p className="text-slate-500 font-bold">No reviews yet</p>
                  <p className="text-slate-400 text-sm">Be the first to review this property after your stay.</p>
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
                  {profile?.role === 'tenant' && (
                    <div className="mb-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 animate-in fade-in slide-in-from-top-2">
                       <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Your Reputation</div>
                       <TenantRentScore tenantId={profile.id} compact />
                    </div>
                  )}
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

              {/* DEPOSIT VAULT SECTION (Desktop Sidebar) */}
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-8 overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[5rem] -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 text-indigo-600 mb-4">
                    <Lock size={20} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Secure Deposit Vault</span>
                  </div>
                  
                  <div className="mb-6">
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Total Security Deposit</p>
                    <div className="flex items-end gap-2">
                      <h3 className="text-4xl font-black text-indigo-600 tracking-tighter">₹{(room.rent_amount * 3).toLocaleString()}</h3>
                      <span className="text-slate-400 text-sm font-bold mb-1.5">(3 mo)</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => setIsDepositModalOpen(true)}
                    className="w-full bg-white border-2 border-indigo-600 text-indigo-600 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 hover:text-white shadow-lg shadow-indigo-100 active:scale-95 transition-all mb-6 flex items-center justify-center gap-2"
                  >
                    <Lock size={16} /> Pay Deposit Securely
                  </button>

                  <div className="flex justify-between items-center px-1">
                    <div className="flex flex-col items-center gap-1">
                      <ShieldCheck size={14} className="text-emerald-500" />
                      <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Protected</span>
                    </div>
                    <div className="w-px h-6 bg-slate-100"></div>
                    <div className="flex flex-col items-center gap-1">
                      <Check size={14} className="text-blue-500" />
                      <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Escrowed</span>
                    </div>
                    <div className="w-px h-6 bg-slate-100"></div>
                    <div className="flex flex-col items-center gap-1">
                      <Info size={14} className="text-indigo-400" />
                      <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Refundable</span>
                    </div>
                  </div>
                </div>
              </div>
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
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Security Deposit</p>
              <p className="text-xl font-black text-indigo-600 tracking-tighter leading-none">₹{(room.rent_amount * 3).toLocaleString()}</p>
            </div>
            <button 
              onClick={() => setIsDepositModalOpen(true)}
              className="flex-[2] bg-indigo-600 text-white h-14 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Lock size={16} /> Pay Deposit
            </button>
          </div>
          
          <div className="flex justify-between items-center px-1 py-1 border-t border-slate-50 mt-1">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-outline-variant uppercase tracking-widest">Rent</span>
              <span className="text-base font-headline font-extrabold text-primary leading-none">₹{room.rent_amount?.toLocaleString()}<span className="text-[10px] text-on-surface-variant font-medium">/mo</span></span>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="text-xs font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1.5"
            >
              Book Visit &rarr;
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

       <DepositVaultModal 
         isOpen={isDepositModalOpen} 
         onClose={() => setIsDepositModalOpen(false)} 
         amount={room.rent_amount * 3} 
         room={room}
         profile={profile}
         initiateDeposit={initiateDeposit}
         processing={depositLoading}
       />

    </div>
  );
}

/**
 * DEPOSIT VAULT (ESCROW) EXPLANATION:
 * WHAT IT IS: A neutral third-party holding mechanism for sensitive funds.
 * ANALOGY: REHWAS is like a trusted friend who holds the car keys during a trade 
 * until both the buyer and seller are satisfied with the transaction. 
 * This prevents "Deposit Scams" where landlords vanish after taking cash, 
 * and also protects landlords from damage disputes.
 * 
 * @function DepositVaultModal
 * @description
 * What Razorpay Route is:
 * Analogy: Like an ESCROW service where a bank holds funds between a buyer and seller 
 * during a property deal. The money is "locked" until both parties fulfill their contract.
 */
function DepositVaultModal({ 
  isOpen, 
  onClose, 
  amount, 
  room, 
  profile, 
  initiateDeposit,
  processing 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  amount: number;
  room: any;
  profile: any;
  initiateDeposit: any;
  processing: boolean;
}) {
  if (!isOpen) return null;

  const handlePay = async () => {
    if (!profile) {
      toast.error('Please login to pay deposit');
      return;
    }
    
    await initiateDeposit({
      tenantId: profile.id,
      landlordId: room.landlord_id,
      roomId: room.id,
      amount: amount
    });
    
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose}></div>
      <div className="bg-white w-full max-w-lg rounded-[32px] md:rounded-[3rem] overflow-hidden relative shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-8 md:p-10">
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
                <Lock size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight">Deposit Vault</h3>
                <p className="text-slate-500 font-medium text-sm">REHWAS Escrow Protection</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-8 mb-10">
            {[
              { step: '01', title: 'Secure Payment', desc: `You pay ₹${amount.toLocaleString()} into the REHWAS Vault via Razorpay.` },
              { step: '02', title: 'Held in Escrow', desc: 'REHWAS holds the funds safely. The landlord cannot touch this yet.' },
              { step: '03', title: 'Released on Move-in', desc: "Once you move in and both sign the inspection report, funds are released to the landlord." }
            ].map((s, i) => (
              <div key={i} className="flex gap-6">
                <div className="text-4xl font-black text-indigo-100 tracking-tighter">{s.step}</div>
                <div>
                  <h4 className="font-black text-slate-900 mb-1">{s.title}</h4>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-amber-50 border border-amber-100 p-6 rounded-[2.5rem] mb-8">
            <h4 className="font-black text-amber-900 text-sm uppercase tracking-widest mb-2 flex items-center gap-2">
              <ShieldCheck size={16} /> Dispute Protection
            </h4>
            <p className="text-amber-800/70 text-sm font-medium leading-relaxed">
              Disagreements? REHWAS reviews your signed Move-in Photo Report to make a fair decision within 5 working days.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button 
              onClick={handlePay}
              disabled={processing}
              className={`w-full py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-100 active:scale-95 transition-all flex items-center justify-center gap-2 ${processing ? 'bg-indigo-400 cursor-not-allowed text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
            >
              {processing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>Secure My Deposit — ₹{amount.toLocaleString()}</>
              )}
            </button>
            <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Digital Receipt Issued Instantly
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * @breakpoints used: 
 * `lg:` - applies desktop layouts (e.g. static lg:sticky for booking panel).
 * `md:` - converts full-screen sliding modals into central padded popups.
 */
