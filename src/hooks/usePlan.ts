import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { differenceInDays, parseISO } from 'date-fns';

/**
 * usePlan Hook.
 * 
 * WHAT IT DOES: Centralizes all SaaS plan logic, room limits, and feature gating.
 * ANALOGY: Like a concierge who knows exactly what your membership card allows you to access.
 */
export const usePlan = () => {
  const { profile } = useAuth();

  const plan = profile?.plan || 'free';
  const trialEndsAt = profile?.trial_ends_at;
  const roomsUsed = profile?.rooms_count || 0;

  const isFreePlan = plan === 'free';
  const isProPlan = plan === 'pro';
  const isBusinessPlan = plan === 'business';

  const roomsLimit = useMemo(() => {
    if (isFreePlan) return 3;
    return Infinity;
  }, [isFreePlan]);

  const daysLeftInTrial = useMemo(() => {
    if (!trialEndsAt) return null;
    const days = differenceInDays(parseISO(trialEndsAt), new Date());
    return days > 0 ? days : 0;
  }, [trialEndsAt]);

  /**
   * Checks if a user has access to a specific feature based on their plan.
   * FEATURE GATING ANALOGY: Like a cinema where the lobby is free, but you need a ticket (plan) to see the film.
   */
  const canAccess = (feature: string): boolean => {
    switch (feature) {
      case 'pdf_receipts':
      case 'urja_splitter':
      case 'estate_dossier':
      case 'ai_buddy_50':
        return isProPlan || isBusinessPlan;
      case 'pl_dashboard':
      case 'itr_export':
      case 'esign':
      case 'pg_module':
      case 'ai_buddy_unlimited':
      case 'multi_landlord':
        return isBusinessPlan;
      default:
        return true;
    }
  };

  return {
    plan,
    trialEndsAt,
    isFreePlan,
    isProPlan,
    isBusinessPlan,
    roomsUsed,
    roomsLimit,
    daysLeftInTrial,
    canAccess
  };
};
