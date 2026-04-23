import React, { useState } from 'react';
import { Star, X, Loader2, MessageSquare } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

interface Props {
  roomId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
}

/**
 * ReviewForm Component
 * 
 * WHAT IT DOES: Allows tenants to submit a star rating and text review for a property.
 * 
 * ANALOGY: Like leaving a review on Amazon—it's a structured piece of feedback that 
 * helps other buyers (tenants) make a decision and impacts the seller's (landlord's) rating.
 */
export const ReviewForm: React.FC<Props> = ({ roomId, isOpen, onClose, onSuccess, userId }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('room_reviews')
        .insert({
          room_id: roomId,
          reviewer_id: userId,
          rating,
          review_text: text,
          verified_tenant: true // Logic could be more complex later
        });

      if (error) throw error;

      toast.success('Review submitted! Recomputing Bhoomi Score...');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Review Error:', err);
      toast.error(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300" 
        onClick={onClose}
      />
      
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 border border-slate-100">
        <div className="p-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                Post a Review <MessageSquare size={20} className="text-indigo-500" />
              </h2>
              <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Share your experience</p>
            </div>
            <button 
              onClick={onClose}
              className="p-3 bg-slate-50 text-slate-400 rounded-full hover:bg-slate-900 hover:text-white transition-all"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* STAR RATING */}
            <div className="flex flex-col items-center gap-4 bg-slate-50/50 p-8 rounded-3xl border border-dashed border-slate-200">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rate your stay</span>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                    className="transition-all transform hover:scale-125"
                  >
                    <Star 
                      size={36} 
                      className={`${
                        (hover || rating) >= star 
                          ? 'fill-amber-400 text-amber-400' 
                          : 'text-slate-200'
                      } transition-colors`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-sm font-black text-slate-900 h-5">
                {rating === 1 && "Poor"}
                {rating === 2 && "Fair"}
                {rating === 3 && "Good"}
                {rating === 4 && "Great"}
                {rating === 5 && "Excellent!"}
              </span>
            </div>

            {/* TEXT REVIEW */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">
                Review Details (Optional)
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="How was the locality? Is the landlord responsive?"
                maxLength={300}
                className="w-full h-32 bg-slate-50 border-none rounded-3xl p-6 text-sm font-medium focus:ring-2 focus:ring-slate-900 transition-all resize-none"
              />
              <div className="text-[10px] font-bold text-slate-400 text-right pr-4">
                {text.length}/300
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || rating === 0}
              className="w-full h-16 bg-slate-900 text-white rounded-full font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-slate-900/20"
            >
              {submitting ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                "Post Review"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
