/**
 * FEATURE_GATES
 * @description Centralized map of premium features and their required minimum plans.
 */
export const FEATURE_GATES = {
  // Original List
  pl_dashboard: { plan: 'pro', label: 'P&L Dashboard' },
  itr_export: { plan: 'business', label: 'ITR Export' },
  rent_agreement: { plan: 'pro', label: 'Rent Agreement Generator' },
  three_d_preview: { plan: 'pro', label: 'AI 3D Room Preview' },
  team_seats: { plan: 'business', label: 'Team Members' },
  api_access: { plan: 'business', label: 'API Access' },
  white_label: { plan: 'business', label: 'White-label Portal' },
  deposit_vault: { plan: 'starter', label: 'Deposit Vault' },
  rent_receipt: { plan: 'pro', label: 'Rent Receipt Generator' },
  move_in_report: { plan: 'pro', label: 'Move-in Photo Report' },
  vacancy_boost: { plan: 'starter', label: 'Listing Boost' },
  
  // Additional keys found in codebase
  late_fees: { plan: 'pro', label: 'Automated Late Fees' },
  receipt_generator: { plan: 'pro', label: 'Rent Receipt Generator' },
  urja_splitter: { plan: 'pro', label: 'Urja Utility Splitter' },
  export_pdf: { plan: 'pro', label: 'PDF Export' },
  pdf_receipts: { plan: 'pro', label: 'Digital PDF Receipts' }
} as const;

export type FeatureKey = keyof typeof FEATURE_GATES;
