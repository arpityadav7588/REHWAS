/**
 * ITR CALCULATION ENGINE
 * 
 * WHAT IT DOES: Calculates Income from House Property per Indian tax law 
 * and formats it for ITR Schedule HP.
 * 
 * ANALOGY: Like a CA's worksheet — it shows the raw numbers AND the 
 * legally mandated deductions so only the net taxable income is what 
 * your CA files with the government.
 */

export interface ScheduleHPProperty {
  propertyAddress: string;
  locality: string;
  city: string;
  tenantName: string;
  
  // Raw income
  annualRentReceived: number;     // sum of paid rent in FY
  
  // Deductions (Section 24)
  municipalTaxPaid: number;       // from expenses category='tax'
  netAnnualValue: number;         // annualRentReceived - municipalTaxPaid
  standardDeduction: number;      // 30% of NAV (automatic by law)
  interestOnLoan: number;         // from expenses category='loan_interest'
  
  // Final
  incomeFromHP: number;           // NAV - standardDeduction - interestOnLoan
}

/**
 * getFYBounds
 * 
 * WHAT IT DOES: Returns the start and end dates for a given Financial Year (FY).
 * FY in India runs from April 1st to March 31st of the following year.
 */
export function getFYBounds(fy: string): { start: Date; end: Date } {
  // Expected format: "FY 2025-26"
  const match = fy.match(/\d{4}/);
  if (!match) return { start: new Date(), end: new Date() };
  
  const year = parseInt(match[0]);
  return {
    start: new Date(year, 3, 1), // April 1st
    end: new Date(year + 1, 2, 31, 23, 59, 59) // March 31st
  };
}

/**
 * calculateScheduleHP
 * 
 * WHAT IT DOES: Applies the math for Section 24 of the Income Tax Act.
 * 
 * STANDARD DEDUCTION ANALOGY: The government assumes you spent 30% of your rent 
 * on property upkeep—so you automatically get to deduct it without 
 * even submitting receipts, by law.
 */
export function calculateScheduleHP(
  annualRent: number,
  municipalTax: number,
  loanInterest: number
): Omit<ScheduleHPProperty, 'propertyAddress' | 'locality' | 'city' | 'tenantName' | 'annualRentReceived'> {
  const netAnnualValue = annualRent - municipalTax;
  const standardDeduction = Math.round(netAnnualValue * 0.30);
  const incomeFromHP = netAnnualValue - standardDeduction - loanInterest;
  
  return { 
    municipalTaxPaid: municipalTax, 
    netAnnualValue, 
    standardDeduction, 
    interestOnLoan: loanInterest, 
    incomeFromHP 
  };
}

/**
 * getAYLabel
 * 
 * AY vs FY ANALOGY: FY 2025-26 is when you EARNED the money, 
 * AY 2026-27 is when you FILE the tax return (Assessment Year) — always one year after.
 */
export function getAYLabel(fy: string): string {
  const match = fy.match(/\d{4}/);
  if (!match) return 'AY Unknown';
  const startYear = parseInt(match[0]);
  return `AY ${startYear + 1}-${String(startYear + 2).slice(2)}`;
}

/**
 * getFinancialYear
 * Returns the current financial year based on current date
 */
export function getFinancialYear() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed, 0 = Jan, 3 = April
  
  if (month >= 3) {
    return { label: `FY ${year}-${(year + 1).toString().slice(-2)}`, year };
  } else {
    return { label: `FY ${year - 1}-${year.toString().slice(-2)}`, year: year - 1 };
  }
}
