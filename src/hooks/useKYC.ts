import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import type { Profile } from '@/types';
import toast from 'react-hot-toast';

/**
 * useKYC Hook.
 * WHAT IT DOES: Simulates an Aadhaar-linked KYC verification flow.
 * ANALOGY: A digital notary service that checks your documents and vouches for your identity.
 */
export const useKYC = () => {
  const { profile, refreshProfile } = useAuth();
  const [isVerifying, setIsVerifying] = useState(false);

  /**
   * Simulates the Aadhaar verification process.
   * In a real app, this would redirect to a provider like Digio or HyperVerge.
   */
  const startVerification = async (aadhaarLast4: string) => {
    if (!profile) return;
    
    setIsVerifying(true);
    
    // 1. Simulate API delay for Aadhaar verification
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 2. Validate format (mock)
    if (aadhaarLast4.length !== 4) {
      toast.error('Invalid Aadhaar format. Need last 4 digits.');
      setIsVerifying(false);
      return;
    }

    // 3. Update profile state in Supabase
    const { error } = await supabase
      .from('profiles')
      .update({ 
        kyc_status: 'verified',
        kyc_verified: true, // legacy field
        aadhaar_hash: `****-****-${aadhaarLast4}`
      } as Partial<Profile>)
      .eq('id', profile.id);

    setIsVerifying(false);

    if (error) {
      toast.error('Verification failed. Please try again.');
    } else {
      toast.success('Identity Verified! Welcome to the Trusted Circle 🛡️');
      refreshProfile(); // Sync global auth state
    }
  };

  return {
    isVerifying,
    startVerification,
    kycStatus: profile?.kyc_status || 'none'
  };
};
