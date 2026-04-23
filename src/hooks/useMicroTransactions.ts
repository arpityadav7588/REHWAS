import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';
import toast from 'react-hot-toast';

/**
 * @hook useMicroTransactions
 * @description
 * Manages one-time "micro-transaction" payments for premium features.
 * 
 * What a micro-transaction is vs subscription:
 * Analogy: A subscription is like a gym membership (recurring access), 
 * while a micro-transaction is like paying for a single yoga class or a personal training session (pay-per-use).
 */
export const useMicroTransactions = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);

  /**
   * @function initiateBoost
   * @description Starts the Razorpay payment flow to boost a listing for 7 days.
   */
  const initiateBoost = async (roomId: string) => {
    if (!profile) return;
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-boost-payment', {
        body: { room_id: roomId, landlord_id: profile.id }
      });

      if (error) throw error;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: "INR",
        name: "REHWAS",
        description: "Listing Boost (7 Days)",
        order_id: data.order_id,
        handler: async (response: any) => {
          const verifyToast = toast.loading('Verifying payment...');
          const { error: confirmError } = await supabase.functions.invoke('confirm-boost', {
            body: { 
              room_id: roomId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature
            }
          });

          toast.dismiss(verifyToast);
          if (confirmError) {
            toast.error('Payment verification failed. Please contact support.');
          } else {
            toast.success('Listing boosted successfully! ⚡');
            window.location.reload(); // Refresh to show badge
          }
        },
        prefill: {
          name: profile.full_name,
          contact: profile.phone
        },
        theme: { color: "#10b981" }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      console.error('Boost error:', err);
      toast.error(err.message || 'Failed to initiate boost');
    } finally {
      setLoading(false);
    }
  };

  /**
   * @function initiateAgreementPayment
   * @description Handles payment for a single rent agreement generation.
   */
  const initiateAgreementPayment = async (agreementData: any) => {
    if (!profile) return;
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-agreement-payment', {
        body: { landlord_id: profile.id, agreement_data: agreementData }
      });

      if (error) throw error;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: "INR",
        name: "REHWAS",
        description: "Rent Agreement Generation",
        order_id: data.order_id,
        handler: async (response: any) => {
          const verifyToast = toast.loading('Finalizing agreement...');
          const { data: genData, error: genError } = await supabase.functions.invoke('generate-agreement', {
            body: { 
              payment_id: response.razorpay_payment_id,
              agreement_data: agreementData 
            }
          });

          toast.dismiss(verifyToast);
          if (genError) {
            toast.error('Failed to generate agreement. Please contact support.');
          } else {
            // Trigger download/print
            const blob = new Blob([genData.html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const win = window.open(url, '_blank');
            if (win) win.print();
            toast.success('Agreement generated successfully! 📄');
          }
        },
        prefill: {
          name: profile.full_name,
          contact: profile.phone
        },
        theme: { color: "#4f46e5" }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      console.error('Agreement error:', err);
      toast.error(err.message || 'Failed to process agreement');
    } finally {
      setLoading(false);
    }
  };

  return { initiateBoost, initiateAgreementPayment, loading };
};
