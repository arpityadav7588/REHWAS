import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Expense, PLSummary } from '@/types';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

/**
 * usePL Hook — Financial Intelligence Layer.
 * WHAT IT DOES: Aggregates income from the rent ledger and compares it against property expenses.
 * ANALOGY: This is like a Chartered Accountant's (CA) ledger book that computes the actual 'Take Home' profit after all repairs and taxes.
 */
export const usePL = () => {
  const [loading, setLoading] = useState(false);

  /**
   * Fetches the P&L Summary for the last X months.
   * @param landlordId The landlord's unique ID.
   * @param monthCount Number of months to calculate history for (default 6).
   */
  const fetchPLData = useCallback(async (landlordId: string, monthCount: number = 6) => {
    setLoading(true);
    
    // 1. Generate month strings (e.g., "Jan 2026")
    const monthLabels: string[] = [];
    const rawDates: Date[] = [];
    for (let i = monthCount - 1; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      monthLabels.push(format(d, 'MMM yyyy'));
      rawDates.push(d);
    }

    try {
      // 2. Fetch Income (Paid Rent Ledger entries)
      const { data: incomeData } = await supabase
        .from('rent_ledger')
        .select('amount, utility_amount, month')
        .eq('landlord_id', landlordId)
        .eq('status', 'paid')
        .in('month', monthLabels);

      // 3. Fetch Expenses (Property-wide and room-specific)
      // We calculate date ranges for the expenses table
      const startDate = startOfMonth(rawDates[0]).toISOString();
      const endDate = endOfMonth(rawDates[rawDates.length - 1]).toISOString();
      
      const { data: expenseData } = await supabase
        .from('expenses')
        .select('*')
        .eq('landlord_id', landlordId)
        .gte('expense_date', startDate)
        .lte('expense_date', endDate);

      // 4. Aggregate by month
      const summary: PLSummary[] = monthLabels.map(label => {
        const monthIncome = (incomeData || [])
          .filter(i => i.month === label)
          .reduce((sum, i) => sum + (i.amount || 0) + (i.utility_amount || 0), 0);

        const monthExpenses = (expenseData || [])
          .filter(e => format(new Date(e.expense_date), 'MMM yyyy') === label)
          .reduce((sum, e) => sum + Number(e.amount || 0), 0);

        return {
          month: label,
          income: monthIncome,
          expenses: monthExpenses,
          net: monthIncome - monthExpenses
        };
      });

      setLoading(false);
      return { summary, rawExpenses: expenseData || [] };
    } catch (err) {
      console.error('PL Aggregation Error:', err);
      setLoading(false);
      return { summary: [], rawExpenses: [] };
    }
  }, []);

  /**
   * Records a new expense in the digital ledger.
   * @param data The expense details.
   */
  const addExpense = async (data: Omit<Expense, 'id' | 'created_at'>) => {
    setLoading(true);
    const { error } = await supabase
      .from('expenses')
      .insert([data]);
    
    setLoading(false);
    return { error };
  };

  /**
   * Removes an expense record.
   */
  const deleteExpense = async (id: string) => {
    setLoading(true);
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);
    
    setLoading(false);
    return { error };
  };

  return {
    loading,
    fetchPLData,
    addExpense,
    deleteExpense
  };
};
