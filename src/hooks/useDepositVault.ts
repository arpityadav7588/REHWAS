import { useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

/**
 * useDepositVault Hook
 * 
 * WHAT IT DOES: Manages the lifecycle of security deposits—from initiation to release.
 * 
 * ANALOGY: Like an escrow service in a property deal—the bank (REHWAS) holds the funds 
 * until both parties satisfy their contractual conditions (signing the move-in report).
 */
export function useDepositVault() {
  const [loading, setLoading] = useState(false);

  /**
   * initiateDeposit
   * WHAT IT DOES: Creates a Razorpay order and opens the payment gateway.
   * 
   * PAYMENT VERIFICATION ANALOGY: Like a tamper-evident seal on medicine—if someone 
   * changes even one character of the payment details, the seal breaks and we reject it.
   */
  const initiateDeposit = async (params: {
    tenantId: string;
    landlordId: string;
    roomId: string;
    amount: number;
  }) => {
    setLoading(true);
    try {
      // 1. Create Order via Edge Function
      const { data: orderData, error: orderError } = await supabase.functions.invoke('create-deposit-order', {
        body: {
          tenant_id: params.tenantId,
          landlord_id: params.landlordId,
          room_id: params.roomId,
          amount: params.amount
        }
      });

      if (orderError) throw orderError;

      // 2. Open Razorpay Checkout
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        document.body.appendChild(script);
        
        script.onload = () => {
          const options = {
            key: orderData.key,
            order_id: orderData.order_id,
            amount: orderData.amount,
            currency: 'INR',
            name: 'REHWAS Deposit Vault',
            description: 'Security deposit — held securely by REHWAS',
            image: '/logo.png', // Official Rehwas Logo
            theme: { color: '#10B981' },
            handler: async (response: any) => {
              try {
                // 3. Verify Payment
                const { error: verifyError } = await supabase.functions.invoke('verify-deposit-payment', {
                  body: {
                    ...response,
                    escrow_id: orderData.escrow_id
                  }
                });

                if (verifyError) throw verifyError;

                toast.success(`₹${params.amount.toLocaleString('en-IN')} secured in REHWAS Vault 🔒`);
                resolve(orderData.escrow_id);
              } catch (err: any) {
                toast.error('Payment verification failed');
                reject(err);
              }
            },
            modal: { 
              ondismiss: () => {
                setLoading(false);
                reject('Payment cancelled');
              } 
            }
          };
          const rzp = new (window as any).Razorpay(options);
          rzp.open();
        };
      });

    } catch (err: any) {
      console.error('Deposit initiation error:', err);
      toast.error(err.message || 'Failed to initiate deposit');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * releaseDeposit
   * WHAT IT DOES: Transfers the held funds to the landlord's linked account.
   * 
   * RELEASE ANALOGY: Like a delivery app—the money is only released to the 
   * restaurant after the customer confirms "order received" (Move-in report signed).
   */
  const releaseDeposit = async (escrowId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('release-deposit', {
        body: { escrow_id: escrowId }
      });

      if (error) throw error;

      toast.success("Deposit released to landlord's account! 🏦");
      return data;
    } catch (err: any) {
      console.error('Release error:', err);
      toast.error(err.message || 'Failed to release deposit');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * disputeDeposit
   * WHAT IT DOES: Pauses the escrow release and marks the deposit as "disputed".
   * 
   * DISPUTE ANALOGY: Like pulling the emergency brake on a train—it stops all 
   * automated processes until a human (customer support) reviews the case.
   */
  const disputeDeposit = async (escrowId: string, reason: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('deposit_escrow')
        .update({ 
          status: 'disputed',
          dispute_reason: reason,
          disputed_at: new Date().toISOString()
        })
        .eq('id', escrowId);

      if (error) throw error;

      toast.success("Dispute raised. REHWAS Trust Team notified. 🛡️");
    } catch (err: any) {
      console.error('Dispute error:', err);
      toast.error(err.message || 'Failed to raise dispute');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    initiateDeposit,
    releaseDeposit,
    disputeDeposit,
    loading
  };
}
