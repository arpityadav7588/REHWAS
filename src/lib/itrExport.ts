import ExcelJS from 'exceljs';
import { supabase } from '@/lib/supabase';
import { format, startOfYear, endOfYear, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

/**
 * ITR Export Utility for REHWAS
 * 
 * WHAT IT IS: 
 * A specialized tool that converts rental income and property expenses 
 * into a format compatible with Indian Income Tax Return (ITR) Schedule HP.
 * 
 * ANALOGY: 
 * Think of Schedule HP as a specific folder in your tax file where the 
 * government wants to see your house property details. This utility 
 * automatically organizes your "receipts" into that folder.
 */

export interface ScheduleHPProperty {
  id: string;
  propertyAddress: string;
  cityState: string;
  pinCode: string;
  isLetOut: boolean;
  annualRent: number;           // Gross rent received
  municipalTaxPaid: number;      // Deduction under Section 23
  netAnnualValue: number;        // Rent - Taxes
  standardDeduction: number;     // 30% of NAV (Sec 24a)
  interestOnLoan: number;        // Deduction under Section 24(b)
  incomeFromHP: number;          // Final taxable amount
  tenantName: string;
}

export interface ITRData {
  assessmentYear: string;
  financialYear: string;
  landlordName: string;
  properties: ScheduleHPProperty[];
  totalIncomeFromHP: number;
}

/**
 * Calculates Indian Financial Year (April to March)
 * Analogy: While the calendar year starts in Jan, the tax year in India 
 * starts when spring begins (April), like a separate "work clock".
 */
export function getFinancialYear(date: Date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed, April is 3

  let fyStart, fyEnd, label, ay;

  if (month >= 3) { // April or later
    fyStart = new Date(year, 3, 1);
    fyEnd = new Date(year + 1, 2, 31);
    label = `FY ${year}-${(year + 1).toString().slice(-2)}`;
    ay = `AY ${year + 1}-${(year + 2).toString().slice(-2)}`;
  } else { // Jan, Feb, Mar
    fyStart = new Date(year - 1, 3, 1);
    fyEnd = new Date(year, 2, 31);
    label = `FY ${year - 1}-${year.toString().slice(-2)}`;
    ay = `AY ${year}-${(year + 1).toString().slice(-2)}`;
  }

  return { start: fyStart, end: fyEnd, label, ay };
}

/**
 * Core function to generate the ITR Excel Export.
 */
export async function generateITRExport(landlordId: string, landlordName: string, fyLabel: string): Promise<Blob> {
  const { start, end, ay } = getFinancialYearFromLabel(fyLabel);

  // 1. Fetch Rooms/Properties
  const { data: rooms } = await supabase
    .from('rooms')
    .select('*')
    .eq('landlord_id', landlordId);

  // 2. Fetch Rent Ledger (only paid entries within FY)
  const { data: ledger } = await supabase
    .from('rent_ledger')
    .select('*, tenants(room_id, profiles(full_name))')
    .eq('landlord_id', landlordId)
    .eq('status', 'paid');
    
  // 3. Fetch Expenses within FY
  const { data: expenses } = await supabase
    .from('expenses')
    .select('*')
    .eq('landlord_id', landlordId)
    .gte('expense_date', start.toISOString())
    .lte('expense_date', end.toISOString());

  // Filter ledger by date (month string to date conversion)
  const fyLedger = (ledger || []).filter(entry => {
    const entryDate = new Date(entry.month); // Assuming 'MMM yyyy' works or it's a date
    return isWithinInterval(entryDate, { start, end });
  });

  // Map data to Schedule HP structure
  const properties: ScheduleHPProperty[] = (rooms || []).map(room => {
    const propertyLedger = fyLedger.filter(l => l.tenants?.room_id === room.id || l.room_id === room.id);
    const propertyExpenses = (expenses || []).filter(e => e.room_id === room.id);

    const annualRent = propertyLedger.reduce((sum, l) => sum + (l.amount || 0), 0);
    const municipalTaxPaid = propertyExpenses
      .filter(e => e.category === 'tax')
      .reduce((sum, e) => sum + (e.amount || 0), 0);
    
    const interestOnLoan = propertyExpenses
      .filter(e => e.category === 'loan_interest')
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    const nav = Math.max(0, annualRent - municipalTaxPaid);
    const stdDeduction = Math.round(nav * 0.30);
    const incomeFromHP = nav - stdDeduction - interestOnLoan;

    return {
      id: room.id,
      propertyAddress: room.address || room.locality,
      cityState: `${room.city}, India`,
      pinCode: '000000', // Placeholder
      isLetOut: true,
      annualRent,
      municipalTaxPaid,
      netAnnualValue: nav,
      standardDeduction: stdDeduction,
      interestOnLoan,
      incomeFromHP,
      tenantName: propertyLedger[0]?.tenants?.profiles?.full_name || 'N/A'
    };
  });

  const totalIncome = properties.reduce((sum, p) => sum + p.incomeFromHP, 0);

  // --- BUILD EXCEL ---
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'REHWAS';
  workbook.lastModifiedBy = 'REHWAS';
  workbook.created = new Date();

  // SHEET 1: Summary
  const summarySheet = workbook.addWorksheet('Schedule HP Summary');
  summarySheet.columns = [
    { header: 'Property Address', key: 'address', width: 40 },
    { header: 'Annual Rent (A)', key: 'rent', width: 15 },
    { header: 'Municipal Taxes (B)', key: 'tax', width: 18 },
    { header: 'Net Annual Value (C = A-B)', key: 'nav', width: 22 },
    { header: 'Std Deduction 30% (D)', key: 'std', width: 20 },
    { header: 'Interest on Loan (E)', key: 'interest', width: 18 },
    { header: 'Income from HP (C-D-E)', key: 'income', width: 20 },
  ];

  // Header Styling
  summarySheet.getRow(1).font = { bold: true, size: 12 };
  summarySheet.insertRow(1, ['REHWAS — Income from House Property Statement']);
  summarySheet.insertRow(2, [`Assessment Year: ${ay} | Financial Year: ${fyLabel} | Landlord: ${landlordName}`]);
  summarySheet.insertRow(3, []);
  summarySheet.getRow(1).font = { bold: true, size: 16, color: { argb: 'FF10B981' } };

  properties.forEach(p => {
    summarySheet.addRow({
      address: p.propertyAddress,
      rent: p.annualRent,
      tax: p.municipalTaxPaid,
      nav: p.netAnnualValue,
      std: p.standardDeduction,
      interest: p.interestOnLoan,
      income: p.incomeFromHP
    });
  });

  summarySheet.addRow([]);
  const totalRow = summarySheet.addRow({
    address: 'TOTAL INCOME FROM HOUSE PROPERTY',
    income: totalIncome
  });
  totalRow.font = { bold: true };
  totalRow.getCell('income').fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFECFDF5' }
  };

  summarySheet.addRow([]);
  summarySheet.addRow(['* Standard deduction of 30% applied automatically per Section 24(a) of Income Tax Act.']);
  summarySheet.addRow(['* Generated by REHWAS | Verify with your Chartered Accountant before filing.']);

  // SHEET 2: Ledger
  const ledgerSheet = workbook.addWorksheet('Monthly Rent Ledger');
  ledgerSheet.columns = [
    { header: 'Date/Month', key: 'month', width: 15 },
    { header: 'Property', key: 'property', width: 30 },
    { header: 'Tenant', key: 'tenant', width: 20 },
    { header: 'Rent Amount', key: 'amount', width: 15 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Paid On', key: 'paid_on', width: 15 },
  ];
  fyLedger.forEach(l => {
    ledgerSheet.addRow({
      month: l.month,
      property: (rooms || []).find(r => r.id === (l.tenants?.room_id || l.room_id))?.title || 'N/A',
      tenant: l.tenants?.profiles?.full_name || 'N/A',
      amount: l.amount,
      status: l.status,
      paid_on: l.paid_on || '-'
    });
  });

  // SHEET 3: Expenses
  const expenseSheet = workbook.addWorksheet('Expenses Register');
  expenseSheet.columns = [
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Category', key: 'cat', width: 15 },
    { header: 'Property', key: 'prop', width: 30 },
    { header: 'Amount', key: 'amt', width: 12 },
    { header: 'Description', key: 'desc', width: 40 },
  ];
  (expenses || []).forEach(e => {
    expenseSheet.addRow({
      date: format(new Date(e.expense_date), 'dd MMM yyyy'),
      cat: e.category,
      prop: (rooms || []).find(r => r.id === e.room_id)?.title || 'General',
      amt: e.amount,
      desc: e.description
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/**
 * Helper to parse FY Label (e.g. "FY 2025-26") back to dates
 */
function getFinancialYearFromLabel(label: string) {
  const match = label.match(/FY (\d{4})/);
  if (!match) return getFinancialYear();
  
  const startYear = parseInt(match[1]);
  const start = new Date(startYear, 3, 1);
  const end = new Date(startYear + 1, 2, 31);
  const ay = `AY ${startYear + 1}-${(startYear + 2).toString().slice(-2)}`;
  
  return { start, end, ay };
}
