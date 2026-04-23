import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

/**
 * @hook useSubscription
 * @description
 * Manages landlord subscription state and payment flows via Razorpay.
 * 
 * What a feature gate is:
 * Analogy: Like a velvet rope at a club — you can see what's inside, 
 * but you need the right membership to enter.
 */
export const useSubscription = () => {
  const { profile } = useAuth();
  const [subscription, setSubscription] = useState<any>(null);
  const [currentRoomCount, setCurrentRoomCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;

    const fetchData = async () => {
      setLoading(true);
      
      // Fetch subscription details
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('landlord_id', profile.id)
        .maybeSingle();
      
      setSubscription(subData);
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', profile.id)
        .single();

      // Fetch current room count
      const { count } = await supabase
        .from('rooms')
        .select('*', { count: 'exact', head: true })
        .eq('landlord_id', profile.id);
      
      setCurrentRoomCount(count || 0);
      setLoading(false);
    };

    fetchData();
  }, [profile?.id]);

  const plan = profile?.plan || 'starter';
  const status = subscription?.status || 'active'; // Default to active for starter
  
  const trialEndsAt = subscription?.trial_ends_at ? new Date(subscription.trial_ends_at) : null;
  const isOnTrial = status === 'trialing' && !!trialEndsAt && trialEndsAt > new Date();
  
  const trialDaysLeft = trialEndsAt 
    ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const roomLimits: Record<string, number> = {
    starter: 3,
    pro: 15,
    business: Infinity
  };

  const roomLimit = roomLimits[plan] || 3;

  /**
   * @function hasPlan
   * @description Checks if the current user has at least the required plan level.
   * 
   * Why hasPlan uses an array index comparison instead of ===:
   * Analogy: Like checking if you're on the 3rd floor or higher — 
   * floors 3, 4, 5, 6 all count as "at least 3rd floor".
   */
  const hasPlan = (requiredPlan: string) => {
    const planOrder = ['starter', 'pro', 'business'];
    return planOrder.indexOf(plan) >= planOrder.indexOf(requiredPlan);
  };

  const subscribe = async (targetPlan: 'pro' | 'business', cycle: 'monthly' | 'annual') => {
    if (!profile) {
      toast.error('Please login to subscribe');
      return;
    }

    const loadingToast = toast.loading(`Preparing your ${targetPlan} subscription...`);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: {
          landlord_id: profile.id,
          plan: targetPlan,
          billing_cycle: cycle
        }
      });

      if (error) throw error;

      toast.dismiss(loadingToast);
      
      if (data.short_url) {
        window.open(data.short_url, '_blank');
        toast.success('Complete payment in the new window');
      } else {
        throw new Error('Subscription URL not found');
      }
    } catch (err: any) {
      toast.dismiss(loadingToast);
      console.error('Subscription error:', err);
      toast.error(err.message || 'Failed to create subscription');
    }
  };

  const cancel = async () => {
    toast.success('Subscription management is currently handled via your dashboard.');
  };

  return {
    plan,
    status,
    isOnTrial,
    trialDaysLeft,
    roomLimit,
    currentRoomCount,
    hasPlan,
    subscribe,
    cancel,
    loading,
    periodEnd: subscription?.current_period_end,
    monthlyAgreementsUsed: subscription?.monthly_agreements_used || 0
  };
};
