import { useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

/**
 * @hook useDepositVault
 * @description
 * What a Supabase Edge Function is:
 * Analogy: A mini server that only wakes up when you call it, then goes back to sleep — 
 * like a restaurant waiter who only comes to your table when you wave, instead of standing there all night.
 */
export function useDepositVault() {
  const [loading, setLoading] = useState(false);

  /**
   * @function initiateDeposit
   * @description 
   * Loads the Razorpay checkout script and initiates the escrow payment flow.
   * 
   * What Razorpay Route is:
   * Analogy: Like an ESCROW service where a bank holds funds between a buyer and seller 
   * during a property deal. The money is "locked" until both parties fulfill their contract.
   */
  const initiateDeposit = async (params: {
    tenantId: string;
    landlordId: string;
    roomId: string;
    amount: number;
  }) => {
    setLoading(true);
    try {
      // 1. Call create-deposit-order Edge Function
      const { data: orderData, error: orderError } = await supabase.functions.invoke('create-deposit-order', {
        body: {
          tenant_id: params.tenantId,
          landlord_id: params.landlordId,
          room_id: params.roomId,
          amount: params.amount
        }
      });

      if (orderError) throw orderError;

      // 2. Load Razorpay checkout script dynamically
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);

      return new Promise((resolve, reject) => {
        script.onload = () => {
          const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID,
            amount: orderData.amount,
            currency: orderData.currency,
            name: "REHWAS Deposit Vault",
            description: "Securing your rental deposit",
            order_id: orderData.order_id,
            handler: async (response: any) => {
              try {
                // 3. On payment success: call verify-deposit-payment Edge Function
                const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-deposit-payment', {
                  body: {
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    escrow_id: orderData.escrow_id
                  }
                });

                if (verifyError) throw verifyError;

                toast.success(`₹${params.amount.toLocaleString()} secured in REHWAS Vault! 🔒`);
                resolve(verifyData);
              } catch (err: any) {
                toast.error('Payment verification failed');
                reject(err);
              }
            },
            prefill: {
              name: "",
              email: "",
              contact: ""
            },
            theme: {
              color: "#4F46E5"
            }
          };

          const rzp = new (window as any).Razorpay(options);
          rzp.open();
        };
        script.onerror = () => {
          toast.error('Failed to load payment gateway');
          reject(new Error('Script load error'));
        };
      });

    } catch (err: any) {
      console.error('Deposit initiation error:', err);
      toast.error(err.message || 'Failed to initiate deposit');
    } finally {
      setLoading(false);
    }
  };

  /**
   * @function releaseDeposit
   * @description Releases the escrowed funds to the landlord.
   * 
   * What Razorpay Route (Transfers) is:
   * Analogy: Like a "Release of Funds" authorization in a construction project. 
   * The bank only moves the money after the architect signs off that the work is correct.
   */
  const releaseDeposit = async (escrowId: string) => {
    setLoading(true);
    try {
      // 1. Verify that move_in_reports record exists and both parties have signed
      // (This check should also be enforced on the backend, but we'll check frontend first for UX)
      const { data: report, error: reportError } = await supabase
        .from('move_in_reports')
        .select('tenant_signed_at, landlord_signed_at')
        .eq('escrow_id', escrowId)
        .single();

      if (reportError) throw new Error('Could not find inspection report');
      if (!report.tenant_signed_at || !report.landlord_signed_at) {
        throw new Error('Move-in report must be signed by both parties first');
      }

      // 2. Call release-deposit Edge Function
      const { data, error } = await supabase.functions.invoke('release-deposit', {
        body: { escrow_id: escrowId }
      });

      if (error) throw error;

      toast.success("Deposit released to landlord's account! 🏦");
      return data;
    } catch (err: any) {
      console.error('Release error:', err);
      toast.error(err.message || 'Failed to release deposit');
    } finally {
      setLoading(false);
    }
  };

  return {
    initiateDeposit,
    releaseDeposit,
    loading
  };
}
