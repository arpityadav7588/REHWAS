import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Moon, ThumbsUp, ChevronLeft, ChevronRight, 
  Play, ShieldCheck, User, Info, Loader2 
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

interface NightVideo {
  id: string;
  video_url: string;
  uploader_type: string;
  recorded_at: string;
  description: string;
  upvotes: number;
  created_at: string;
}

interface Props {
  roomId: string;
  onUploadClick: () => void;
  isLoggedIn: boolean;
}

/**
 * NightViewPlayer Component
 * 
 * WHAT IT DOES: Displays user-generated night videos of the street for a specific room.
 * 
 * ANALOGY:
 * This is like a "Photo Album" vs a "Document". Instead of pasting a single photo in 
 * the room's description, we have a separate album that can grow with multiple 
 * contributions from the community.
 * 
 * UPVOTES ANALOGY:
 * Like StackOverflow upvotes. The community collectively decides which videos are the 
 * most useful/truthful, naturally bubbling the "Verified Safety" signals to the top.
 */
export const NightViewPlayer: React.FC<Props> = ({ roomId, onUploadClick, isLoggedIn }) => {
  const [videos, setVideos] = useState<NightVideo[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<string | null>(null);

  useEffect(() => {
    fetchVideos();
  }, [roomId]);

  const fetchVideos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('street_night_videos')
      .select('*')
      .eq('room_id', roomId)
      .eq('is_approved', true)
      .order('upvotes', { ascending: false })
      .order('created_at', { ascending: false });

    if (!error && data) {
      setVideos(data);
    }
    setLoading(false);
  };

  const handleUpvote = async (videoId: string) => {
    if (voting) return;
    setVoting(videoId);
    
    try {
      const { data, error } = await supabase.rpc('increment_video_upvotes', {
        video_id: videoId
      });

      if (error) {
        // Fallback if RPC doesn't exist
        const video = videos.find(v => v.id === videoId);
        if (video) {
          const { error: updateError } = await supabase
            .from('street_night_videos')
            .update({ upvotes: (video.upvotes || 0) + 1 })
            .eq('id', videoId);
          if (updateError) throw updateError;
        }
      }

      setVideos(prev => prev.map(v => 
        v.id === videoId ? { ...v, upvotes: (v.upvotes || 0) + 1 } : v
      ));
      toast.success('Thanks for your feedback! 👍');
    } catch (err) {
      toast.error('Failed to upvote');
    } finally {
      setVoting(null);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-64 bg-slate-900 rounded-[2.5rem] flex items-center justify-center">
        <Loader2 className="text-slate-700 animate-spin" size={32} />
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-8 text-center flex flex-col items-center">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
          <Moon className="text-slate-300" size={32} />
        </div>
        <h4 className="text-xl font-black text-slate-900 mb-2">No night view yet</h4>
        <p className="text-sm font-bold text-slate-500 max-w-xs mb-8">
          Be the first to share what this area looks like at night — it helps women tenants make safer decisions.
        </p>
        {isLoggedIn ? (
          <button 
            onClick={onUploadClick}
            className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-800 active:scale-95 transition-all shadow-xl shadow-slate-900/10"
          >
            Upload Night View
          </button>
        ) : (
          <p className="text-xs font-black text-primary uppercase tracking-widest">Login to share a night view</p>
        )}
      </div>
    );
  }

  const activeVideo = videos[activeIdx];

  return (
    <div className="bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl relative border border-white/5 group">
      {/* HEADER BADGE */}
      <div className="absolute top-6 left-6 z-10 flex items-center gap-2">
        <div className="bg-emerald-500 text-white px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg">
          <Moon size={12} className="fill-white" /> Night View
        </div>
        <div className="bg-white/10 backdrop-blur-md text-white/70 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">
          {videos.length} Video{videos.length > 1 ? 's' : ''}
        </div>
      </div>

      {/* MAIN PLAYER */}
      <div className="aspect-video relative bg-black">
        <video 
          key={activeVideo.id}
          src={activeVideo.video_url} 
          controls 
          className="w-full h-full object-cover"
        />
      </div>

      {/* FOOTER METADATA */}
      <div className="p-8 bg-slate-900">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                <User size={14} className="text-slate-400" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {activeVideo.uploader_type.replace('_', ' ')} • Recorded {format(parseISO(activeVideo.recorded_at), 'MMM yyyy')}
              </p>
            </div>
            {activeVideo.description && (
              <p className="text-white font-bold text-sm leading-relaxed mb-4">
                "{activeVideo.description}"
              </p>
            )}
            <div className="flex items-center gap-4">
               <button 
                 onClick={() => handleUpvote(activeVideo.id)}
                 disabled={!!voting}
                 className="flex items-center gap-2 bg-emerald-500/10 text-emerald-500 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-all active:scale-95 border border-emerald-500/20"
               >
                 {voting === activeVideo.id ? <Loader2 className="animate-spin" size={14} /> : <ThumbsUp size={14} />}
                 Helpful ({activeVideo.upvotes})
               </button>
               {isLoggedIn && (
                 <button 
                   onClick={onUploadClick}
                   className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors"
                 >
                   Add Another +
                 </button>
               )}
            </div>
          </div>

          {/* CAROUSEL CONTROLS */}
          {videos.length > 1 && (
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setActiveIdx(prev => (prev - 1 + videos.length) % videos.length)}
                className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-all border border-white/5"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="flex gap-1.5">
                {videos.map((_, i) => (
                  <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === activeIdx ? 'bg-emerald-500 w-4' : 'bg-slate-700'}`}></div>
                ))}
              </div>
              <button 
                onClick={() => setActiveIdx(prev => (prev + 1) % videos.length)}
                className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-all border border-white/5"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
