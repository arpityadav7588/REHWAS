import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UpgradePrompt } from './UpgradePrompt';
import { UpgradeModal } from './UpgradeModal';

/**
 * FEATURE GATING PSYCHOLOGY:
 * 
 * 1. THE DEMO EFFECT: By showing the user where a feature "should" be, we create a sense 
 *    of potential. It's like a store demo where you can touch the product but can't take it home.
 * 
 * 2. CURIOSITY GAP: The semi-transparent blurred background hints at the value inside, 
 *    triggering the user's desire to "reveal" the full tool.
 * 
 * 3. FRICTION-LESS DISCOVERY: Instead of hiding pro features, showing them gated ensures 
 *    the user knows the platform is more powerful than it currently appears.
 * 
 * 4. LOSS AVERSION: Once a user relies on the free tier, the desire to "upgrade" to avoid 
 *    missing out on the full efficiency of the product (P&L, agreements) becomes a strong motivator.
 */

interface FeatureGateProps {
  feature: string;
  requiredPlan: 'starter' | 'pro' | 'business';
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({ 
  feature, 
  requiredPlan, 
  children,
  fallback 
}) => {
  const { hasPlan } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const canAccess = hasPlan(requiredPlan);

  if (canAccess) {
    return <>{children}</>;
  }

  // If a specific fallback is provided (like a disabled button), use it
  if (fallback) {
    return (
      <>
        <div onClick={() => setIsModalOpen(true)} className="cursor-pointer">
          {fallback}
        </div>
        <UpgradeModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          targetPlan={requiredPlan === 'starter' ? 'pro' : requiredPlan as any} 
        />
      </>
    );
  }

  // Default behavior: Show the full UpgradePrompt overlay
  return (
    <>
      <UpgradePrompt 
        feature={feature} 
        requiredPlan={requiredPlan === 'starter' ? 'pro' : requiredPlan as any}
        onUpgrade={() => setIsModalOpen(true)}
      />
      <UpgradeModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        targetPlan={requiredPlan === 'starter' ? 'pro' : requiredPlan as any} 
      />
    </>
  );
};
