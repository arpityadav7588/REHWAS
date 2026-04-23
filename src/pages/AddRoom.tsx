import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  CheckCircle2, ChevronLeft, ChevronRight, 
  X, MapPin, Loader2, UploadCloud, ShieldAlert, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import { FeatureGate } from '@/components/FeatureGate';
import { RoomLimitGate } from '@/components/RoomLimitGate';
import { UpgradeModal } from '@/components/UpgradeModal';

// Fix for default Leaflet marker icon not showing in React Leaflet
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

const CITIES = ['Bengaluru', 'Pune', 'Mumbai', 'Delhi', 'Hyderabad'];
const ROOM_TYPES = ['1BHK', '2BHK', 'PG', 'Studio'];
const GENDER_PREFS = ['Any', 'Male Only', 'Female Only'];
const AMENITIES_LIST = [
  "WiFi", "RO Water", "AC", "Power Backup", "24hr Security", "CCTV", "Parking", "Gym", 
  "Lift", "Gas Pipeline", "Washing Machine", "Cooking Allowed", "Pet Friendly",
  "Geyser", "Inverter", "Modular Kitchen", "Balcony"
];

// Helper component for map clicks
const LocationMarker = ({ position, setPosition }: { position: L.LatLng, setPosition: (pos: L.LatLng) => void }) => {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });
  return position ? (
    <Marker 
      position={position} 
      draggable={true}
      eventHandlers={{ dragend: (e) => setPosition(e.target.getLatLng()) }}
    />
  ) : null;
};

/**
 * Add Room Page Component.
 * WHAT IT DOES: Provides a 4-step wizard for landlords to list a new property. Handles form state, map geolocation, and photo uploads.
 * ANALOGY: Filling out a detailed property listing form with a built-in map and photo album compiler.
 */
export default function AddRoom() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();

  // Protect route for Landlords only
  useEffect(() => {
    if (profile && profile.role === 'tenant') {
      toast.error('Only landlords can add rooms');
      navigate('/discover');
    }
  }, [profile, navigate]);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [newRoomId, setNewRoomId] = useState<string | null>(null);
  
  // Form State
  const [form, setForm] = useState({
    title: '',
    room_type: '',
    rent_amount: '',
    city: 'Bengaluru',
    locality: '',
    address: '',
    available_from: new Date().toISOString().split('T')[0],
    gender_preference: 'Any',
    description: '',
    furnished: false,
    amenities: [] as string[],
    floor_number: '',
    total_floors: '',
    latitude: 12.9716, // Default to Bengaluru
    longitude: 77.5946,
    late_fee_pct: 5,
  });

  // Photo State
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Night View Video State
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);


  // Derive coordinates for Leaflet
  const mapPosition = L.latLng(form.latitude, form.longitude);

  // File handling
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const validFiles = selectedFiles.filter(f => ['image/jpeg', 'image/png', 'image/webp'].includes(f.type));
      
      if (validFiles.length !== selectedFiles.length) {
        toast.error('Only JPG, PNG and WebP are allowed');
      }

      if (files.length + validFiles.length > 8) {
        toast.error('Maximum 8 photos allowed');
        return;
      }

      const newFiles = [...files, ...validFiles];
      setFiles(newFiles);
      
      // Generate previews
      const newPreviews = validFiles.map(file => URL.createObjectURL(file));
      setPreviews([...previews, ...newPreviews]);
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = ['video/mp4', 'video/quicktime', 'video/webm'];
      
      if (!validTypes.includes(file.type)) {
        toast.error('Only MP4, MOV, and WebM are allowed');
        return;
      }

      if (file.size > 50 * 1024 * 1024) {
        toast.error('Video must be less than 50MB');
        return;
      }

      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const removeVideo = () => {
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoFile(null);
    setVideoPreview(null);
  };

  const removePhoto = (index: number) => {

    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);

    const newPreviews = [...previews];
    URL.revokeObjectURL(newPreviews[index]); // Free memory
    newPreviews.splice(index, 1);
    setPreviews(newPreviews);
  };

  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const handleDragStart = (idx: number) => setDraggedIdx(idx);
  
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  
  const handleDrop = (idx: number) => {
    if (draggedIdx === null || draggedIdx === idx) return;

    const newFiles = [...files];
    const draggedFile = newFiles[draggedIdx];
    newFiles.splice(draggedIdx, 1);
    newFiles.splice(idx, 0, draggedFile);
    setFiles(newFiles);

    const newPreviews = [...previews];
    const draggedPreview = newPreviews[draggedIdx];
    newPreviews.splice(draggedIdx, 1);
    newPreviews.splice(idx, 0, draggedPreview);
    setPreviews(newPreviews);
    
    setDraggedIdx(null);
  };

  /**
   * Retrieves the user's current GPS location.
   * WHAT IT DOES: Prompts the browser for location and updates the map pin.
   * ANALOGY: Asking your phone "Where am I right now?" and placing a pin there safely.
   */
  const handleUseMyLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setForm(prev => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }));
          toast.success('Location updated!');
        },
        () => {
          toast.error('Could not get your location. Please check browser permissions.');
        }
      );
    }
  };

  const validateStep1 = () => {
    const errs = [];
    if (!form.title.trim()) errs.push("- Title is required");
    if (!form.room_type) errs.push("- Room type is required");
    if (!form.rent_amount) errs.push("- Monthly rent is required");
    if (!form.city) errs.push("- City is required");
    if (!form.locality.trim()) errs.push("- Locality is required");
    
    setErrors(errs);
    return errs.length === 0;
  };

  const validateStep2 = () => {
    const errs = [];
    if (!form.description.trim()) errs.push("- Description is required");
    if (form.amenities.length === 0) errs.push("- Please select at least one amenity (mandatory)");
    
    setErrors(errs);
    return errs.length === 0;
  };

  const goNext = () => {
    setErrors([]);
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep(prev => Math.min(prev + 1, 4));
  };

  const goPrev = () => {
    setErrors([]);
    setStep(prev => Math.max(prev - 1, 1));
  };

  /**
   * Submits the complete form data.
   * WHAT IT DOES: Uploads images to Supabase storage, then inserts the property record into the database.
   * ANALOGY: Handing over all your paperwork and developed photos to the clerk to finalize your listing.
   */
  const handleSubmit = async () => {
    if (files.length === 0) {
      setErrors(['- Please upload at least 1 photo']);
      return;
    }
    if (!user) return;

    setLoading(true);
    setErrors([]);
    const uploadedUrls: string[] = [];
    let completed = 0;

    // 1. Upload photos
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('room-photos')
        .upload(fileName, file);

      if (error) {
        toast.error(`Failed to upload ${file.name}`);
        setLoading(false);
        return;
      }

      if (data) {
        const { data: publicUrlData } = supabase.storage
          .from('room-photos')
          .getPublicUrl(fileName);
        uploadedUrls.push(publicUrlData.publicUrl);
      }
      
      completed++;
      setUploadProgress(Math.round((completed / files.length) * 100));
    }

    // 1.5 Upload Night View Video
    let streetVideoUrl = null;
    if (videoFile) {
      const fileExt = videoFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-night-view.${fileExt}`;
      
      const { data: vData, error: vError } = await supabase.storage
          .from('room-videos')
          .upload(fileName, videoFile);

      if (vError) {
        toast.error('Failed to upload video');
      } else if (vData) {
        const { data: vPublicUrl } = supabase.storage
          .from('room-videos')
          .getPublicUrl(fileName);
        streetVideoUrl = vPublicUrl.publicUrl;
      }
    }

    // 2. Insert Room
    // 1. Validate required fields
    const finalDescription = `${form.description}\n\nGender Preference: ${form.gender_preference}\nFloor: ${form.floor_number} of ${form.total_floors}`;

    const { data: dbData, error: dbError } = await (supabase as any)
      .from('rooms')
      .insert({
        landlord_id: user.id,
        title: form.title,
        room_type: form.room_type,
        rent_amount: parseInt(form.rent_amount),
        city: form.city,
        locality: form.locality,
        address: form.address,
        available: true,
        amenities: form.amenities,
        photos: uploadedUrls,
        street_video_url: streetVideoUrl,
        furnished: form.furnished,
        latitude: form.latitude,
        longitude: form.longitude,
        late_fee_pct: form.late_fee_pct,
        description: finalDescription
      })
      .select()
      .single();

    setLoading(false);

    if (dbError) {
      toast.error('Database error. Could not publish room.');
      console.error(dbError);
    } else {
      toast.success('Your room is live! 🎉');
      setNewRoomId(dbData.id);
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-brand/10 text-brand rounded-full flex items-center justify-center mx-auto mb-8">
           <CheckCircle2 className="w-12 h-12" />
        </div>
        <h1 className="text-4xl font-black text-dark mb-4 tracking-tight">Your Property is Live!</h1>
        <p className="text-lg text-slate-500 mb-10 max-w-md mx-auto">
          Congratulations! Your room in <span className="font-bold text-dark">{form.locality}</span> is now visible to thousands of potential tenants.
        </p>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm mb-10 text-left flex gap-4 items-center">
            <img src={previews[0]} className="w-20 h-20 rounded-2xl object-cover" alt="Preview" />
            <div>
              <h3 className="font-bold text-dark line-clamp-1">{form.title}</h3>
              <p className="text-brand font-black text-lg">₹{parseInt(form.rent_amount).toLocaleString()}</p>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{form.city} • {form.room_type}</p>
            </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={() => navigate(`/room/${newRoomId}`)}
            className="px-8 py-4 bg-brand text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            View Listing <ChevronRight className="w-5 h-5" />
          </button>
          <button 
            onClick={() => navigate('/dashboard')}
            className="px-8 py-4 bg-white text-dark font-bold rounded-2xl shadow border border-slate-200 hover:border-brand hover:text-brand transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }



  return (
    <RoomLimitGate>
      <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6">

      
      {/* Progress Indicator */}
      <div className="mb-8 md:mb-10 relative">
        {/* Desktop Progress */}
        <div className="hidden md:flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 z-0 rounded-full"></div>
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-brand z-0 rounded-full transition-all duration-300"
            style={{ width: `${((step - 1) / 3) * 100}%` }}
          ></div>
          
          {['Basic Info', 'Amenities', 'Location', 'Photos'].map((label, idx) => {
            const stepNum = idx + 1;
            const isActive = step === stepNum;
            const isCompleted = step > stepNum;
            
            return (
              <div key={label} className="relative z-10 flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                  isActive ? 'bg-brand text-white shadow-lg ring-4 ring-emerald-50' : 
                  isCompleted ? 'bg-brand text-white' : 'bg-white text-slate-400 border-2 border-slate-200'
                }`}>
                  {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : stepNum}
                </div>
                <span className={`text-xs font-semibold ${isActive || isCompleted ? 'text-dark' : 'text-slate-400'}`}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Mobile Progress */}
        <div className="md:hidden flex flex-col items-center w-full">
           <span className="text-sm font-bold text-slate-500 tracking-widest uppercase">Step {step} of 4: {['Basic Info', 'Amenities', 'Location', 'Photos'][step - 1]}</span>
           <div className="w-full bg-slate-100 h-2 mt-3 rounded-full overflow-hidden">
               <div className="bg-brand h-full transition-all duration-300" style={{ width: `${(step / 4) * 100}%` }}></div>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-10">
        
        {/* Error Display */}
        {errors.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm font-medium">
            <p className="mb-2 font-bold flex items-center gap-2">Please fix the following:</p>
            {errors.map(err => <div key={err}>{err}</div>)}
          </div>
        )}

        {/* STEP 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <h2 className="text-2xl font-bold text-dark mb-1">Basic Details</h2>
              <p className="text-slate-500 text-sm">Let's start with the core information of your property.</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Room Title</label>
                <input 
                  type="text" 
                  value={form.title}
                  onChange={(e) => setForm({...form, title: e.target.value})}
                  placeholder="e.g. Furnished 1BHK near Metro"
                  className="w-full px-4 py-3 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand outline-none text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">Room Type</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {ROOM_TYPES.map(type => (
                    <button
                      key={type}
                      onClick={() => setForm({...form, room_type: type})}
                      className={`py-3 min-h-[44px] rounded-xl font-bold border-2 transition-all ${
                        form.room_type === type ? 'border-brand bg-emerald-50 text-brand' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Monthly Rent (₹)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
                    <input 
                      type="number" 
                      value={form.rent_amount}
                      onChange={(e) => setForm({...form, rent_amount: e.target.value})}
                      placeholder="15000"
                      className="w-full pl-10 pr-4 py-3 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand outline-none text-base"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">City</label>
                  <select 
                    value={form.city}
                    onChange={(e) => setForm({...form, city: e.target.value})}
                    className="w-full px-4 py-3 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand outline-none appearance-none font-semibold text-dark text-base"
                  >
                    {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Locality / Area</label>
                <input 
                  type="text" 
                  value={form.locality}
                  onChange={(e) => setForm({...form, locality: e.target.value})}
                  placeholder="e.g. Koramangala 5th Block"
                  className="w-full px-4 py-3 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand outline-none text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Full Address</label>
                <textarea 
                  value={form.address}
                  onChange={(e) => setForm({...form, address: e.target.value})}
                  className="w-full px-4 py-3 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand outline-none min-h-[100px] text-base"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Available From</label>
                  <input 
                    type="date" 
                    value={form.available_from}
                    onChange={(e) => setForm({...form, available_from: e.target.value})}
                    className="w-full px-4 py-3 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand outline-none font-medium text-base"
                  />
                </div>
              </div>


              <FeatureGate 
                feature="late_fees" 
                requiredPlan="pro"
                fallback={
                  <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl opacity-70 cursor-not-allowed group relative">
                    <div className="flex justify-between items-center">
                       <div>
                         <label className="block text-sm font-bold text-slate-500 mb-1">Late Fee Percentage</label>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Automatic charge after 5 days</p>
                       </div>
                       <div className="text-xl font-black text-slate-400">5%</div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 rounded-2xl">
                       <p className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                         <Sparkles size={14} /> Upgrade to Pro to enable
                       </p>
                    </div>
                  </div>
                }
              >
                <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-2xl">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <label className="block text-sm font-bold text-indigo-900 mb-1">Late Fee Percentage</label>
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Applied automatically after 5 days</p>
                    </div>
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-indigo-200">
                      <input 
                        type="number"
                        min="0"
                        max="20"
                        value={form.late_fee_pct}
                        onChange={(e) => setForm({...form, late_fee_pct: parseInt(e.target.value) || 0})}
                        className="w-12 text-lg font-black text-indigo-600 outline-none"
                      />
                      <span className="text-lg font-black text-indigo-400">%</span>
                    </div>
                  </div>
                  <p className="text-[10px] font-medium text-indigo-600/60 leading-tight">
                    * REHWAS will automatically add this fee to the ledger and notify the tenant if rent is unpaid 5 days past due date.
                  </p>
                </div>
              </FeatureGate>

            </div>
          </div>
        )}

        {/* STEP 2: Amenities */}
        {step === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <h2 className="text-2xl font-bold text-dark mb-1">Amenities & Details</h2>
              <p className="text-slate-500 text-sm">Tell tenants what makes your property special.</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                <textarea 
                  value={form.description}
                  onChange={(e) => setForm({...form, description: e.target.value})}
                  placeholder="Describe the room, neighborhood, what's nearby..."
                  className="w-full px-4 py-3 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand outline-none min-h-[120px] text-base resize-y"
                ></textarea>
              </div>

              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-slate-50">
                <div>
                  <div className="font-bold text-dark">Fully Furnished</div>
                  <div className="text-xs text-slate-500">Does it include beds, sofa, appliances?</div>
                </div>
                <button 
                  onClick={() => setForm({...form, furnished: !form.furnished})}
                  className={`w-14 h-8 rounded-full transition-colors relative ${form.furnished ? 'bg-brand' : 'bg-slate-300'}`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-all ${form.furnished ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>

              <FeatureGate 
                feature="3d_preview" 
                requiredPlan="pro"
                fallback={
                  <div className="flex items-center justify-between p-4 border border-amber-100 rounded-xl bg-amber-50/30 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
                        <Sparkles size={20} />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          AI 3D Room Preview 
                          <span className="bg-amber-100 text-amber-700 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Pro</span>
                        </div>
                        <div className="text-xs text-slate-500">Enable virtual walkthroughs for this room</div>
                      </div>
                    </div>
                    <div className="w-14 h-8 rounded-full bg-slate-200 relative p-1">
                      <div className="w-6 h-6 bg-white rounded-full" />
                    </div>
                  </div>
                }
              >
                <div className="flex items-center justify-between p-4 border border-emerald-100 rounded-xl bg-emerald-50/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">AI 3D Room Preview</div>
                      <div className="text-xs text-slate-500">Enable virtual walkthroughs for this room</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => toast.success('AI 3D Preview enabled!')}
                    className="w-14 h-8 rounded-full bg-emerald-500 relative p-1"
                  >
                    <div className="w-6 h-6 bg-white rounded-full absolute right-1" />
                  </button>
                </div>
              </FeatureGate>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Floor Number</label>
                  <input 
                    type="number" 
                    value={form.floor_number}
                    onChange={(e) => setForm({...form, floor_number: e.target.value})}
                    placeholder="e.g. 2"
                    className="w-full px-4 py-3 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand outline-none text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Total Floors</label>
                  <input 
                    type="number" 
                    value={form.total_floors}
                    onChange={(e) => setForm({...form, total_floors: e.target.value})}
                    placeholder="e.g. 5"
                    className="w-full px-4 py-3 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand outline-none text-base"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">Amenities</label>
                <div className="flex flex-wrap gap-2">
                  {AMENITIES_LIST.map(amenity => {
                    const isSelected = form.amenities.includes(amenity);
                    return (
                      <button
                        key={amenity}
                        onClick={() => {
                          setForm(prev => ({
                            ...prev,
                            amenities: isSelected 
                              ? prev.amenities.filter(a => a !== amenity)
                              : [...prev.amenities, amenity]
                          }))
                        }}
                        className={`px-4 py-2 min-h-[44px] md:min-h-0 rounded-full text-sm font-semibold transition-all border ${
                          isSelected 
                            ? 'bg-brand text-white border-brand shadow-sm' 
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {amenity}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Location */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <h2 className="text-2xl font-bold text-dark mb-1">Pin Location</h2>
              <p className="text-slate-500 text-sm">Click anywhere on the map to pin your room's exact location.</p>
            </div>

            <button 
              onClick={handleUseMyLocation}
              className="text-brand font-bold flex items-center gap-2 hover:text-emerald-700 transition-colors"
            >
              <MapPin className="w-5 h-5" /> Use my current location
            </button>

            <div className="h-[250px] md:h-[400px] w-full rounded-2xl overflow-hidden border-2 border-slate-200 shadow-inner z-0 relative">
              <MapContainer 
                center={mapPosition} 
                zoom={13} 
                className="h-full w-full outline-none"
                style={{ background: '#e5e7eb' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker 
                  position={mapPosition} 
                  setPosition={(pos) => setForm(prev => ({...prev, latitude: pos.lat, longitude: pos.lng}))} 
                />
              </MapContainer>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center text-sm font-medium text-slate-600">
              <span>Latitude: {form.latitude.toFixed(5)}</span>
              <span>Longitude: {form.longitude.toFixed(5)}</span>
            </div>
          </div>
        )}

        {/* STEP 4: Photos */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <h2 className="text-2xl font-bold text-dark mb-1">Upload Photos</h2>
              <p className="text-slate-500 text-sm">The first photo will be your cover image. Max 8 photos.</p>
            </div>

            <div className="relative border-2 border-dashed border-slate-300 rounded-3xl p-10 text-center hover:border-brand transition-colors bg-slate-50 cursor-pointer overflow-hidden">
              <input 
                type="file" 
                multiple 
                accept=".jpg,.jpeg,.png,.webp"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <UploadCloud className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <div className="text-dark font-bold text-lg mb-1">Click to upload or drag & drop</div>
              <div className="text-slate-500 text-sm">JPG, PNG, WebP up to 5MB</div>
            </div>

            {previews.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                {previews.map((src, idx) => (
                  <div 
                    key={idx} 
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(idx)}
                    className={`relative group aspect-square rounded-2xl overflow-hidden border cursor-move transition-all ${
                      draggedIdx === idx ? 'opacity-50 border-brand scale-95' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <img src={src} className="w-full h-full object-cover pointer-events-none" alt={`Preview ${idx + 1}`} />
                    {idx === 0 && (
                      <div className="absolute top-2 left-2 bg-brand text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide">
                        Cover
                      </div>
                    )}
                    <button 
                      onClick={() => removePhoto(idx)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 md:p-1.5 rounded-full md:opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 min-w-[32px] min-h-[32px] md:min-w-0 md:min-h-0 shadow-md flex items-center justify-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {loading && uploadProgress > 0 && (
              <div className="mt-6">
                <div className="flex justify-between text-sm font-bold text-dark mb-2">
                  <span>Uploading photos...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-brand h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              </div>
            )}

            <hr className="border-slate-100 my-8" />

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-dark">Night-time Street View (Optional but recommended)</h3>
                <p className="text-slate-500 text-xs mt-1">
                  Record a 15–60 second video at night showing: the street outside, building entrance, lighting, and nearby landmarks. 
                  Listings with night videos get 3x more tenant inquiries.
                </p>
              </div>

              {!videoPreview ? (
                <div className="relative border-2 border-dashed border-slate-300 rounded-3xl p-8 text-center hover:border-brand transition-colors bg-slate-50 cursor-pointer overflow-hidden group">
                  <input 
                    type="file" 
                    accept="video/mp4,video/quicktime,video/webm"
                    onChange={handleVideoChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-3 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                    <span className="material-symbols-outlined">video_library</span>
                  </div>
                  <div className="text-dark font-bold text-sm">Upload Night View Video</div>
                  <div className="text-slate-400 text-[10px] uppercase font-bold mt-1 tracking-wider">MP4, MOV, WEBM up to 50MB</div>
                </div>
              ) : (
                <div className="relative rounded-3xl overflow-hidden border border-slate-200 aspect-video bg-black group">
                  <video src={videoPreview} className="w-full h-full" controls />
                  <button 
                    onClick={removeVideo}
                    className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-xl z-20"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-white/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span> Preview
                  </div>
                </div>
              )}

              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-3">
                <span className="material-symbols-outlined text-amber-600">lightbulb</span>
                <p className="text-xs text-amber-800 font-medium leading-relaxed">
                  <strong>Best time to record:</strong> 8–10 PM on a weekday. 
                  Walk slowly and narrate: "This is the main gate, security guard is present 24/7..."
                </p>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Navigation Footer */}
      <div className="mt-8 flex justify-between items-center">
        <button 
          onClick={goPrev}
          disabled={step === 1 || loading}
          className="px-6 py-3 min-h-[44px] font-bold text-slate-500 hover:text-dark disabled:opacity-30 flex items-center gap-2 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" /> Back
        </button>
        
        {step < 4 ? (
          <button 
            onClick={goNext}
            className="px-8 py-3 min-h-[44px] bg-brand text-white font-bold rounded-xl shadow-sm hover:shadow active:scale-95 transition-all flex items-center gap-2"
          >
            Next Step <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="px-8 py-3 min-h-[44px] bg-brand text-white font-bold rounded-xl shadow-md hover:bg-emerald-600 active:scale-95 transition-all flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /> Save & Publish</>}
          </button>
        )}
      </div>

      </div>
    </RoomLimitGate>
  );
}
