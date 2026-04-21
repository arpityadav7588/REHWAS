import { usePlan } from '@/hooks/usePlan';
import { useAuth } from '@/hooks/useAuth';
import { IndianRupee, Zap, AlertTriangle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * PlanStatusBanner Component.
 * 
 * WHAT IT DOES: Displays a persistent status bar for users on the Free plan or in a Trial.
 * ANALOGY: Like a low-fuel light in a car, it gently reminds you of your limits and helps you take action before you stall.
 */
export const PlanStatusBanner = () => {
  const { user } = useAuth();
  const { isFreePlan, roomsUsed, roomsLimit, daysLeftInTrial, plan } = usePlan();

  if (!user || (!isFreePlan && !daysLeftInTrial)) return null;

  const isLimitReached = roomsUsed >= roomsLimit;
  const progress = Math.min((roomsUsed / roomsLimit) * 100, 100);

  // Progress Bar Color
  let progressColor = 'bg-emerald-500';
  if (roomsUsed === 2) progressColor = 'bg-amber-500';
  if (isLimitReached) progressColor = 'bg-red-500';

  return (
    <div className={`sticky top-20 z-40 w-full transition-colors duration-300 ${isLimitReached ? 'bg-amber-50 border-b border-amber-100' : 'bg-slate-900 text-white'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Left: Status & Progress */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {isLimitReached ? (
              <AlertTriangle className="w-5 h-5 text-amber-600 animate-pulse" />
            ) : (
              <IndianRupee className={`w-4 h-4 ${isFreePlan ? 'text-slate-400' : 'text-amber-400'}`} />
            )}
            <span className={`text-xs font-black uppercase tracking-widest ${isLimitReached ? 'text-amber-900' : 'text-slate-300'}`}>
              {isLimitReached 
                ? '⚠️ Room limit reached. Upgrade for unlimited listings.' 
                : `Plan: ${plan} — ${roomsUsed} rooms used of ${roomsLimit}`}
            </span>
          </div>

          {!isLimitReached && isFreePlan && (
            <div className="hidden sm:block w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${progressColor}`} 
                style={{ width: `${progress}%` }} 
              />
            </div>
          )}

          {daysLeftInTrial !== null && daysLeftInTrial > 0 && (
            <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/20 rounded-full border border-amber-500/30">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-tighter">
                {daysLeftInTrial} days left in trial
              </span>
            </div>
          )}
        </div>

        {/* Right: CTA */}
        <Link 
          to="/pricing" 
          className={`flex items-center gap-2 px-5 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-lg
            ${isLimitReached 
              ? 'bg-amber-600 text-white hover:bg-amber-700 shadow-amber-200' 
              : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/20'}
          `}
        >
          <Zap className="w-3 h-3 fill-current" />
          Upgrade to Pro →
        </Link>
      </div>
    </div>
  );
};
