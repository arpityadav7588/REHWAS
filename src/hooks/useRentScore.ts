import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { parse, isBefore, startOfMonth, addDays, isValid } from 'date-fns';

/**
 * Custom hook to calculate the Tenant Rent Health Score.
 * WHAT IT DOES: Analyzes a tenant's payment history across all their tenancies on REHWAS to compute a reliability grade.
 * ANALOGY: Like a school attendance record — being present is good, but being present on time is better.
 */
export const useRentScore = () => {
  const [loading, setLoading] = useState(false);

  /**
   * Calculates the score for a specific tenant profile.
   * @param profileId The ID of the tenant's profile.
   */
  const calculateScore = useCallback(async (profileId: string) => {
    setLoading(true);
    try {
      // 1. Fetch all tenant records (leases) for this profile
      const { data: tenantLeases, error: tErr } = await supabase
        .from('tenants')
        .select('id')
        .eq('tenant_profile_id', profileId);

      if (tErr) throw tErr;
      if (!tenantLeases || tenantLeases.length === 0) {
        return { grade: 'New — Building Score', percentage: 0, totalMonths: 0, onTimeMonths: 0, lateMonths: 0, unpaidMonths: 0, history: [] };
      }

      const leaseIds = tenantLeases.map(l => l.id);

      // 2. Fetch all rent_ledger entries for these leases
      const { data: ledger, error: lErr } = await supabase
        .from('rent_ledger')
        .select('*')
        .in('tenant_id', leaseIds)
        .order('month', { ascending: false });

      if (lErr) throw lErr;
      if (!ledger || ledger.length === 0) {
        return { grade: 'New — Building Score', percentage: 0, totalMonths: 0, onTimeMonths: 0, lateMonths: 0, unpaidMonths: 0, history: [] };
      }

      // 3. Process records and filter out future months
      const now = new Date();
      const processedHistory = ledger.map(entry => {
        // Parse the month string (e.g., "Jul 2025")
        const entryDate = parse(entry.month, 'MMM yyyy', new Date());
        const isFuture = isBefore(now, startOfMonth(entryDate));
        
        // 7th of the month cutoff
        const cutoffDate = addDays(startOfMonth(entryDate), 6); // 1st + 6 days = 7th
        
        let status: 'on-time' | 'late' | 'unpaid' | 'future' = 'unpaid';
        
        if (isFuture) {
          status = 'future';
        } else if (entry.status === 'paid' && entry.paid_on) {
          const paidDate = new Date(entry.paid_on);
          if (isValid(paidDate) && isBefore(paidDate, addDays(cutoffDate, 1))) {
            status = 'on-time';
          } else {
            status = 'late';
          }
        } else {
          // If past the 7th and not paid, it's already "not on time"
          // However, for the history dots, we distinguish between late (eventually paid) and unpaid.
          status = entry.status === 'paid' ? 'late' : 'unpaid';
        }

        return {
          ...entry,
          isFuture,
          timingStatus: status,
          entryDate
        };
      });

      // Filter for scoring: only count entries where the 7th of the month has passed
      const scoringEntries = processedHistory.filter(e => !e.isFuture);
      
      const totalMonths = scoringEntries.length;
      if (totalMonths < 3) {
        return { 
          grade: 'New — Building Score', 
          percentage: 0, 
          totalMonths, 
          onTimeMonths: scoringEntries.filter(e => e.timingStatus === 'on-time').length,
          lateMonths: scoringEntries.filter(e => e.timingStatus === 'late').length,
          unpaidMonths: scoringEntries.filter(e => e.timingStatus === 'unpaid').length,
          history: processedHistory.slice(0, 12)
        };
      }

      const onTimeMonths = scoringEntries.filter(e => e.timingStatus === 'on-time').length;
      const lateMonths = scoringEntries.filter(e => e.timingStatus === 'late').length;
      const unpaidMonths = scoringEntries.filter(e => e.timingStatus === 'unpaid').length;
      
      const percentage = Math.round((onTimeMonths / totalMonths) * 100);

      // Grade Lookup
      let grade: 'A+' | 'A' | 'B+' | 'B' | 'C' = 'C';
      if (percentage >= 95) grade = 'A+';
      else if (percentage >= 85) grade = 'A';
      else if (percentage >= 70) grade = 'B+';
      else if (percentage >= 50) grade = 'B';
      else grade = 'C';

      return {
        grade,
        percentage,
        totalMonths,
        onTimeMonths,
        lateMonths,
        unpaidMonths,
        history: processedHistory.slice(0, 12) // Last 12 entries for the chart
      };
    } catch (err) {
      console.error('Error calculating rent score:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    calculateScore
  };
};
