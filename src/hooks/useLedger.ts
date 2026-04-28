import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { RentLedger } from '@/types';

/**
 * Custom hook to manage Rent Ledger data.
 * WHAT IT DOES: Provides functions to fetch and manage monthly rent payment statuses for tenants.
 * ANALOGY: A digital ledger book where the landlord tracks who has paid the rent and who hasn't.
 */
export const useLedger = () => {
  const [loading, setLoading] = useState(false);

  /**
   * Fetches all ledger entries for a specific landlord.
   * WHAT IT DOES: Pulls all rent records associated with the landlord's ID.
   * @param landlordId The ID of the landlord to fetch records for.
   */
  const fetchLedger = useCallback(async (landlordId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('rent_ledger')
      .select('*, tenants(room_id, tenant_profile_id, profiles(full_name, phone))')
      .eq('landlord_id', landlordId)
      .order('month', { ascending: false });
    
    setLoading(false);
    return { data, error };
  }, []);

  /**
   * Marks a specific ledger entry as paid.
   * WHAT IT DOES: Updates an unpaid or partial rent record to 'paid' status.
   * @param ledgerId The ID of the specific rent_ledger row.
   * @param amount The finalized amount paid.
   * @param date Date it was paid.
   * @param notes Optional reference notes.
   */
  const markPaid = async (ledgerId: string, amount: number, date: string, notes?: string) => {
    setLoading(true);
    const payload: Partial<RentLedger> = {
      status: 'paid',
      amount,
      paid_on: date
    };
    if (notes !== undefined) payload.notes = notes;

    const { data, error } = await supabase
      .from('rent_ledger')
      .update(payload)
      .eq('id', ledgerId)
      .select('*, tenants(room_id, tenant_profile_id, profiles(full_name))')
      .single();

    if (!error && data) {
      const ledger = data as any;
      const tenantProfileId = ledger.tenants.tenant_profile_id;

      // Create notification for the tenant
      await supabase.from('notifications').insert([{
        user_id: tenantProfileId,
        type: 'rent_paid',
        title: `Rent confirmed for ${ledger.month}`,
        body: `Your rent of ₹${amount.toLocaleString()} has been confirmed by your landlord.`,
        link: `/profile` // Tenants can see their receipts in profile usually
      }]);

      // Trigger Tenant CV recalculation (Async, don't block UI)
      supabase.functions.invoke('compute-tenant-cv', {
        body: { profileId: tenantProfileId }
      }).catch(err => console.error('Failed to trigger CV computation:', err));
    }
      
    setLoading(false);
    return { data, error };
  };

  /**
   * Updates a ledger entry's amount or note without marking it completely paid.
   */
  const updateLedgerEntry = async (ledgerId: string, payload: Partial<RentLedger>) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('rent_ledger')
      .update(payload)
      .eq('id', ledgerId)
      .select()
      .single();
      
    setLoading(false);
    return { data, error };
  };

  /**
   * Creates future unpaid ledger entries for a new tenant.
   * WHAT IT DOES: Bulk inserts placeholder unpaid rows for the next 6 months to track their dues.
   * @param tenantId The ID of the tenant.
   * @param landlordId The ID of the landlord.
   * @param amount The monthly rent amount.
   * @param months Array of formatted month strings (e.g., 'Jul 2025').
   */
  const createLedgerEntries = async (tenantId: string, landlordId: string, amount: number, months: string[]) => {
    setLoading(true);
    const entries = months.map(month => ({
      tenant_id: tenantId,
      landlord_id: landlordId,
      month,
      amount,
      status: 'unpaid' as const
    }));

    const { data, error } = await supabase
      .from('rent_ledger')
      .insert(entries)
      .select();
      
    setLoading(false);
    return { data, error };
  };

  /**
   * Gets the total rent collected by the landlord for a specific month.
   * WHAT IT DOES: Sums up all 'paid' entries for the ongoing month.
   * @param landlordId The ID of the landlord.
   * @param month The month string to filter by (e.g. 'Jul 2025').
   */
  const getMonthlyTotal = async (landlordId: string, month: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('rent_ledger')
      .select('amount')
      .eq('landlord_id', landlordId)
      .eq('month', month)
      .eq('status', 'paid');
      
    setLoading(false);
    
    if (error) return { total: 0, error };
    
    const total = data.reduce((sum, row) => sum + (row.amount || 0), 0);
    return { total, error: null };
  };

  /**
   * Applies a utility bill split across multiple tenants for a specific month.
   * 
   * WHAT IT DOES: 
   * Calculates a per-tenant share of multiple bill categories (Electricity, Water, Maintenance, etc.)
   * and updates their ledger records in a single batch.
   * 
   * WHY WE STORE utility_amount SEPARATELY:
   * Analogy: Like a restaurant bill that separates "Food" from "Service Charge" or "VAT". 
   * It allows landlords and tenants to clearly see what portion of the payment is for fixed rent 
   * versus variable usage-based costs. This transparency prevents disputes during reconciliation.
   */
  const applySplit = async (
    landlordId: string, 
    month: string, 
    billItems: { label: string; amount: number; enabled: boolean }[], 
    tenantIds: string[]
  ) => {
    setLoading(true);
    if (tenantIds.length === 0) {
      setLoading(false);
      return { error: new Error('No tenants selected') };
    }

    // Calculate total bill from all enabled categories
    const totalToSplit = billItems
      .filter(item => item.enabled)
      .reduce((sum, item) => sum + (item.amount || 0), 0);

    const perTenantAmount = Math.round(totalToSplit / tenantIds.length);

    const { error } = await supabase
      .from('rent_ledger')
      .update({ utility_amount: perTenantAmount })
      .eq('landlord_id', landlordId)
      .eq('month', month)
      .in('tenant_id', tenantIds);
    
    setLoading(false);
    return { error, totalToSplit, perTenantAmount };
  };

  /**
   * @deprecated Use applySplit instead for multi-category support.
   */
  const applyBulkUtilityBill = async (landlordId: string, month: string, totalAmount: number, tenantIds: string[]) => {
    return applySplit(
      landlordId, 
      month, 
      [{ label: 'Electricity', amount: totalAmount, enabled: true }], 
      tenantIds
    );
  };

  /**
   * Calculates the Bhoomi Score for a specific tenant based on their ledger history.
   * WHAT IT DOES: Analyzes past payments and computes a numeric score (300-900).
   * ANALOGY: A credit rating bureau calculating your credit score based on loan repayments.
   */
  const calculateBhoomiScore = async (tenantProfileId: string) => {
    // 1. Fetch all ledger entries for this profile across all properties
    const { data: history } = await supabase
      .from('rent_ledger')
      .select('status, amount')
      .eq('tenant_profile_id', tenantProfileId); // Assuming we added this field or join

    if (!history) return 400;

    let score = 400; // Base score
    history.forEach(entry => {
      if (entry.status === 'paid') score += 15;
      else if (entry.status === 'unpaid') score -= 10;
    });

    // 2. Clamp between 300 and 900
    const finalScore = Math.min(Math.max(score, 300), 900);

    // 3. Update profile
    await supabase
      .from('profiles')
      .update({ bhoomi_score: finalScore })
      .eq('id', tenantProfileId);

    return finalScore;
  };

  return {
    loading,
    fetchLedger,
    markPaid,
    updateLedgerEntry,
    createLedgerEntries,
    getMonthlyTotal,
    applyBulkUtilityBill,
    applySplit,
    calculateBhoomiScore
  };
};
