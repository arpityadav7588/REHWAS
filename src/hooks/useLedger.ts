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
      .select()
      .single();
      
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

  return {
    loading,
    fetchLedger,
    markPaid,
    updateLedgerEntry,
    createLedgerEntries,
    getMonthlyTotal
  };
};
