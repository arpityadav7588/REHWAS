import { useState, useEffect } from 'react';
import { X, Sparkles, AlertCircle, ArrowRight, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { UpgradeModal } from './UpgradeModal';

/**
 * PlanBanner Component
 * 
 * CONVERSION PSYCHOLOGY:
 * The trial banner is like a hotel checkout warning — it doesn't annoy, 
 * it just makes the deadline real. By surfacing limits (rooms, trials) 
 * at the exact moment of interaction, we create "Just-in-Time" urgency.
 * 
 * DESIGN PRINCIPLES:
 * 1. High Visibility: Using distinct colors (Amber/Red/Green) for different states.
 * 2. Clear Path: Every banner has a primary CTA that leads to value.
 * 3. Respectful: Dismissible for 24 hours to prevent "Banner Blindness."
 */
export const PlanBanner = () => {
  const { profile, plan, isOnTrial, trialDaysLeft } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [bannerType, setBannerType] = useState<string | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const roomsCount = profile?.rooms_count || 0;
  const isStarter = plan === 'starter';

  useEffect(() => {
    // Determine which banner to show based on priority
    let type = null;
    
    // TYPE 1: Trial expiring (highest priority)
    if (isOnTrial && trialDaysLeft <= 7) {
      type = 'trial_expiring';
    } 
    // TYPE 5: Trial expired (downgraded)
    else if (profile?.trial_ends_at && !isOnTrial && isStarter) {
      type = 'trial_expired';
    } 
    else if (isStarter && roomsCount >= 3) {
      type = 'limit_reached';
    } 
    else if (isStarter && roomsCount === 2) {
      type = 'near_limit';
    } 
    else if (isOnTrial && trialDaysLeft > 7) {
      type = 'trial_active';
    }

    if (type) {
      const dismissedUntil = localStorage.getItem(`dismissed_banner_${type}`);
      const isDismissed = dismissedUntil && new Date().getTime() < parseInt(dismissedUntil);
      
      if (!isDismissed) {
        setBannerType(type);
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    } else {
      setIsVisible(false);
    }
  }, [profile, plan, isOnTrial, trialDaysLeft, roomsCount, isStarter]);

  const handleDismiss = () => {
    if (bannerType) {
      const tomorrow = new Date().getTime() + (24 * 60 * 60 * 1000);
      localStorage.setItem(`dismissed_banner_${bannerType}`, tomorrow.toString());
      setIsVisible(false);
    }
  };

  if (!isVisible || !bannerType) return null;

  const config = {
    trial_expiring: {
      bg: 'bg-amber-500',
      icon: <AlertCircle className="w-5 h-5 text-white" />,
      text: `Your Pro trial ends in ${trialDaysLeft} days. Add a payment method to keep access.`,
      cta: <Link to="/settings" className="bg-white text-amber-600 px-4 py-1.5 rounded-lg text-xs font-black hover:bg-slate-50 transition-all">Upgrade Now</Link>
    },
    trial_expired: {
      bg: 'bg-red-600',
      icon: <Zap className="w-5 h-5 text-white" />,
      text: 'Your Pro trial has ended. Some features are now locked.',
      cta: <Link to="/pricing" className="bg-white text-red-600 px-4 py-1.5 rounded-lg text-xs font-black hover:bg-slate-50 transition-all flex items-center gap-1">Add Payment to Restore <ArrowRight size={12} /></Link>
    },
    limit_reached: {
      bg: 'bg-red-600',
      icon: <AlertCircle className="w-5 h-5 text-white" />,
      text: "You've reached your 3-room limit. Upgrade to Pro to add more rooms.",
      cta: <button onClick={() => setIsUpgradeModalOpen(true)} className="bg-white text-red-600 px-4 py-1.5 rounded-lg text-xs font-black hover:bg-slate-50 transition-all">Upgrade to Pro</button>
    },
    near_limit: {
      bg: 'bg-amber-500',
      icon: <Zap className="w-5 h-5 text-white" />,
      text: "You're using 2 of 3 free rooms. Upgrade to Pro for up to 15 rooms.",
      cta: <Link to="/pricing" className="text-white hover:underline text-xs font-black flex items-center gap-1">See Pro plan <ArrowRight size={12} /></Link>
    },
    trial_active: {
      bg: 'bg-emerald-600',
      icon: <Sparkles className="w-5 h-5 text-white" />,
      text: `You're on a Pro trial — ${trialDaysLeft} days remaining. Explore all features free.`,
      cta: <Link to="/pricing" className="text-white hover:underline text-xs font-black flex items-center gap-1">See what's included <ArrowRight size={12} /></Link>
    }
  };

  const currentConfig = config[bannerType as keyof typeof config];
  if (!currentConfig) return null;

  return (
    <>
      <div className={`${currentConfig.bg} px-6 py-3 rounded-2xl shadow-xl shadow-slate-900/10 flex items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-300 mb-6`}>
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">{currentConfig.icon}</div>
          <p className="text-sm font-black text-white tracking-tight">{currentConfig.text}</p>
        </div>
        <div className="flex items-center gap-4">
          {currentConfig.cta}
          <button onClick={handleDismiss} className="text-white/60 hover:text-white transition-colors p-1">
            <X size={18} />
          </button>
        </div>
      </div>

      <UpgradeModal 
        isOpen={isUpgradeModalOpen} 
        onClose={() => setIsUpgradeModalOpen(false)} 
        targetPlan="pro"
      />
    </>
  );
};
