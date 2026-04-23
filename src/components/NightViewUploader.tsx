import React, { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { 
  X, Upload, Video, Calendar, User, 
  MessageSquare, Loader2, CheckCircle2, AlertCircle 
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  roomId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * NightViewUploader Component
 * 
 * WHAT IT DOES: Allows tenants and landlords to upload user-generated night videos.
 * 
 * ANALOGY:
 * This is like a "Community Watch" program. The platform provides the street, 
 * but the residents provide the lighting checks and security updates that make it safe.
 * 
 * UGC (User-Generated Content): Like Google Maps reviews. REHWAS provides the infrastructure,
 * but the ground-truth data comes from people who actually stand on that street at 9 PM.
 */
export const NightViewUploader: React.FC<Props> = ({ roomId, isOpen, onClose, onSuccess }) => {
  const { profile } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [recordedAt, setRecordedAt] = useState(new Date().toISOString().split('T')[0]);
  const [uploaderType, setUploaderType] = useState<'tenant' | 'past_tenant' | 'landlord'>('tenant');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (selected.size > 100 * 1024 * 1024) {
        toast.error('File size exceeds 100MB limit');
        return;
      }
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !profile) return;

    setUploading(true);
    setProgress(10);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${roomId}/${Date.now()}-${profile.id}.${fileExt}`;
      const filePath = `${fileName}`;

      // 1. Upload to Storage
      const { error: storageError, data: storageData } = await supabase.storage
        .from('street_night_videos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (storageError) throw storageError;
      setProgress(60);

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('street_night_videos')
        .getPublicUrl(filePath);

      // 3. Insert into Database
      const { error: dbError } = await supabase
        .from('street_night_videos')
        .insert({
          room_id: roomId,
          uploaded_by: profile.id,
          uploader_type: uploaderType,
          video_url: publicUrl,
          recorded_at: recordedAt,
          description: description,
          is_approved: true // Auto-approved for MVP
        });

      if (dbError) throw dbError;

      setProgress(100);
      toast.success('Thanks! Your night view is now live 🌙');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error(err.message || 'Failed to upload video');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-white w-full max-w-xl rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                Share a Night View 🌙
              </h2>
              <p className="text-sm font-bold text-slate-500 mt-1">
                Short video (15–60 sec) of the street and lighting
              </p>
            </div>
            <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleUpload} className="space-y-6">
            {/* UPLOAD ZONE */}
            {!file ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-4 border-dashed border-slate-100 rounded-[2rem] p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary/20 hover:bg-slate-50 transition-all group"
              >
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="text-slate-300 group-hover:text-primary transition-colors" size={32} />
                </div>
                <p className="text-sm font-black text-slate-600 uppercase tracking-widest">Tap to Upload Video</p>
                <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-tighter">MP4, MOV, WEBM (Max 100MB)</p>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  accept="video/*"
                  onChange={handleFileChange}
                />
              </div>
            ) : (
              <div className="relative rounded-[2rem] overflow-hidden bg-slate-900 aspect-video group">
                <video src={previewUrl!} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    type="button"
                    onClick={() => { setFile(null); setPreviewUrl(null); }}
                    className="bg-white text-slate-900 px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest"
                  >
                    Change Video
                  </button>
                </div>
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                  <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2 border border-white/10">
                    <Video size={12} /> {file.name} ({(file.size / (1024 * 1024)).toFixed(1)}MB)
                  </div>
                </div>
              </div>
            )}

            {/* METADATA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                  When was this recorded?
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input 
                    type="date"
                    required
                    value={recordedAt}
                    onChange={(e) => setRecordedAt(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm text-slate-700 focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                  Who are you?
                </label>
                <select 
                  value={uploaderType}
                  onChange={(e) => setUploaderType(e.target.value as any)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm text-slate-700 focus:ring-4 focus:ring-primary/10 outline-none transition-all appearance-none"
                >
                  <option value="tenant">Current Tenant</option>
                  <option value="past_tenant">Past Tenant</option>
                  <option value="landlord">Landlord</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                Optional Note (Max 150 chars)
              </label>
              <div className="relative">
                <MessageSquare className="absolute left-4 top-4 text-slate-300" size={16} />
                <textarea 
                  rows={3}
                  maxLength={150}
                  placeholder="e.g. Street light is broken on the left. Guard is friendly."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm text-slate-700 focus:ring-4 focus:ring-primary/10 outline-none transition-all resize-none"
                />
              </div>
            </div>

            {/* ACTION */}
            <div className="pt-2">
              <button 
                type="submit"
                disabled={!file || uploading}
                className={`w-full h-14 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-2 ${
                  !file || uploading 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' 
                  : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-95 shadow-slate-900/20'
                }`}
              >
                {uploading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Uploading {progress}%
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    Post Night View
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* PROGRESS BAR */}
        {uploading && (
          <div className="h-1.5 w-full bg-slate-100 relative overflow-hidden">
            <div 
              className="absolute h-full bg-primary transition-all duration-500 ease-out" 
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
