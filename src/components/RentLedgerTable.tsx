import React, { useState } from 'react';
import type { RentLedger } from '@/types';
import { format, subMonths } from 'date-fns';
import { Printer, CheckCircle, AlertCircle, Clock, X } from 'lucide-react';
import toast from 'react-hot-toast';

export interface RentLedgerExtended extends RentLedger {
  tenants?: {
    id: string;
    room_id: string;
    profiles?: {
      full_name: string;
      phone: string;
    } | null;
  } | null;
}

interface RentLedgerTableProps {
  ledgerEntries: RentLedgerExtended[];
  onUpdate: (id: string, updates: Partial<RentLedger>) => Promise<{ error: Error | null }>;
}

/**
 * RentLedgerTable component.
 * WHAT IT DOES: Renders a matrix of tenants by generated months to track rent payments easily. Allows printing formatted ledgers.
 */
export const RentLedgerTable: React.FC<RentLedgerTableProps> = ({ ledgerEntries, onUpdate }) => {
  const [selectedCell, setSelectedCell] = useState<RentLedgerExtended | null>(null);
  const [editAmount, setEditAmount] = useState<string>('');
  const [editUtility, setEditUtility] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<'cash' | 'upi' | 'bank'>('cash');
  const [updating, setUpdating] = useState(false);
  const [lastPaidId, setLastPaidId] = useState<string | null>(null);

  // Generate last 6 months starting from current month
  const months = Array.from({ length: 6 }).map((_, i) => format(subMonths(new Date(), i), 'MMM yyyy'));

  // Group entries by tenant
  const tenantMap = new Map<string, { tenantName: string, entries: Record<string, RentLedgerExtended> }>();
  
  ledgerEntries.forEach(entry => {
    const tId = entry.tenant_id;
    if (!tenantMap.has(tId)) {
      tenantMap.set(tId, {
        tenantName: entry.tenants?.profiles?.full_name || 'Unknown Tenant',
        entries: {}
      });
    }
    tenantMap.get(tId)!.entries[entry.month] = entry;
  });

  const handleCellClick = (entry: RentLedgerExtended) => {
    setSelectedCell(entry);
    setEditAmount(entry.amount.toString());
    setEditUtility((entry.utility_amount || 0).toString());
    setEditNotes(entry.notes || '');
    setPaymentMode(entry.payment_mode || 'upi');
    setLastPaidId(null);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSaveModal = async () => {
    if (!selectedCell) return;
    setUpdating(true);
    const amountNum = parseFloat(editAmount);
    const utilityNum = parseFloat(editUtility);
    
    const { error } = await onUpdate(selectedCell.id, {
      amount: isNaN(amountNum) ? selectedCell.amount : amountNum,
      utility_amount: isNaN(utilityNum) ? (selectedCell.utility_amount || 0) : utilityNum,
      notes: editNotes
    });
    
    setUpdating(false);
    if (error) {
      toast.error('Failed to update ledger');
    } else {
      toast.success('Ledger updated successfully');
      setSelectedCell(null);
    }
  };

  const handleMarkPaid = async () => {
    if (!selectedCell) return;
    setUpdating(true);
    const { error } = await onUpdate(selectedCell.id, {
      status: 'paid',
      paid_on: format(new Date(), 'yyyy-MM-dd'),
      payment_mode: paymentMode,
      notes: editNotes
    });
    setUpdating(false);
    if (error) {
      toast.error('Failed to mark as paid');
    } else {
      toast.success('Rent marked as paid ✅');
      setLastPaidId(selectedCell.id);
      // Don't close modal immediately so they can download receipt
    }
  };

  const openReceipt = (id: string) => {
    window.open(`/receipt/${id}`, '_blank');
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center mb-2 no-print">
        <h3 className="text-xl font-bold text-gray-900">KhataBook View</h3>
        <button 
          onClick={handlePrint}
          className="flex items-center justify-center gap-2 min-h-[44px] bg-white hover:bg-gray-50 text-gray-700 font-bold px-4 py-2 rounded-xl border-2 border-gray-200 shadow-sm transition-all"
        >
          <Printer size={18} /> Export PDF
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-x-auto print:shadow-none print:border-none print:w-full ledger-print-container">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="p-4 md:p-5 font-bold text-gray-500 bg-gray-50 border-b border-gray-200 sticky left-0 z-10 w-48 shadow-[inset_-1px_0_0_rgba(0,0,0,0.05)] print:bg-transparent">
                Tenant
              </th>
              {months.map(month => (
                <th key={month} className="p-4 md:p-5 font-bold text-gray-700 bg-gray-50 border-b border-gray-200 whitespace-nowrap min-w-[140px] text-center print:bg-transparent">
                  {month}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from(tenantMap.values()).length === 0 ? (
              <tr>
                <td colSpan={7} className="p-10 text-center text-gray-500 font-medium">
                  No rent records found yet.
                </td>
              </tr>
            ) : (
              Array.from(tenantMap.values()).map(({ tenantName, entries }, idx) => (
                <tr key={idx} className="group hover:bg-green-50/20 transition-colors border-b border-gray-100 last:border-0 print:break-inside-avoid">
                  <td className="p-4 md:p-5 font-bold text-gray-900 bg-white sticky left-0 z-10 shadow-[inset_-1px_0_0_rgba(0,0,0,0.05)] group-hover:bg-green-50/20 print:shadow-none print:bg-transparent">
                    {tenantName}
                  </td>
                  {months.map(month => {
                    const entry = entries[month];
                    // Simulate utility and arrears for the "Advanced Khata" experience
                    const utility = entry?.utility_amount || 0;
                    const isTotalUnpaid = entry?.status !== 'paid';
                    
                    return (
                      <td key={month} className="p-2 md:p-3 print:p-1 text-center">
                        {entry ? (
                          <div 
                            onClick={() => handleCellClick(entry)}
                            className={`p-3 rounded-[1.5rem] border-2 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all hover:scale-[1.05] active:scale-95 no-print-bg shadow-sm hover:shadow-md
                              ${entry.status === 'paid' ? 'bg-emerald-50 border-emerald-100 hover:border-emerald-300' : 
                                entry.status === 'partial' ? 'bg-orange-50 border-orange-100 hover:border-orange-300' : 
                                'bg-rose-50 border-rose-100 hover:border-rose-300'}`}
                          >
                            <div className="flex flex-col items-center">
                               <span className={`text-[10px] font-black uppercase tracking-widest ${entry.status === 'paid' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                 {entry.status}
                               </span>
                               <span className="text-lg font-black text-dark">₹{(entry.amount + utility).toLocaleString()}</span>
                            </div>
                            
                            {(utility > 0 || isTotalUnpaid) && (
                              <div className="flex flex-wrap justify-center gap-1 mt-1">
                                 <div className="bg-white/60 text-[9px] px-1.5 py-0.5 rounded-md font-bold text-slate-500 border border-slate-100">Rent: {entry.amount}</div>
                                 {utility > 0 && (
                                   <div className="bg-indigo-50 text-[9px] px-1.5 py-0.5 rounded-md font-bold text-indigo-600 border border-indigo-100">Util: {utility}</div>
                                 )}
                              </div>
                            )}
                            
                            {entry.status === 'paid' && (
                               <CheckCircle size={14} className="text-emerald-500 mt-1" />
                            )}
                          </div>
                        ) : (
                          <div className="p-4 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100 text-gray-300 text-[10px] font-black uppercase tracking-widest no-print-bg">
                            N/A
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .ledger-print-container, .ledger-print-container * { visibility: visible; }
          .ledger-print-container { position: absolute; left: 0; top: 0; width: 100% !important; margin: 0; padding: 0; }
          .no-print { display: none !important; }
          .no-print-bg { background-color: transparent !important; box-shadow: none !important; border: 1px solid #e5e7eb !important; }
        }
      `}</style>

      {/* CELL MODAL */}
      {selectedCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity no-print" onClick={() => setSelectedCell(null)}></div>
          
          <div className="bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-200 no-print">
            <div className="p-6 md:p-8 flex flex-col gap-6">
              
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-black text-gray-900">{selectedCell.month} Rent</h3>
                  <p className="text-gray-500 font-medium">{tenantMap.get(selectedCell.tenant_id)?.tenantName}</p>
                </div>
                <button onClick={() => setSelectedCell(null)} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 transition-colors bg-gray-50">
                  <X size={20} />
                </button>
              </div>

              <div className="flex flex-col gap-5">
                {/* Visual Status Indicator */}
                <div className={`p-4 rounded-2xl flex items-center gap-3 border ${selectedCell.status === 'paid' ? 'bg-green-50 border-green-200 text-green-800' : selectedCell.status === 'partial' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                   {selectedCell.status === 'paid' ? <CheckCircle size={28} className="text-green-500" /> : selectedCell.status === 'partial' ? <Clock size={28} className="text-yellow-500" /> : <AlertCircle size={28} className="text-red-500" />}
                   <div>
                     <p className="font-bold text-sm uppercase tracking-wide opacity-80">Current Status</p>
                     <p className="font-black text-lg capitalize">{selectedCell.status}</p>
                   </div>
                </div>

                <div>
                   <label className="block text-sm font-bold text-gray-700 mb-2">Amount (₹)</label>
                   <input 
                     type="number"
                     value={editAmount}
                     onChange={(e) => setEditAmount(e.target.value)}
                     className="w-full px-4 py-3 min-h-[44px] bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all font-bold text-gray-900 text-base"
                   />
                </div>

                <div>
                   <label className="block text-sm font-bold text-gray-700 mb-2">Utility Bill (₹)</label>
                   <input 
                     type="number"
                     value={editUtility}
                     onChange={(e) => setEditUtility(e.target.value)}
                     className="w-full px-4 py-3 min-h-[44px] bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all font-bold text-indigo-900 text-base"
                   />
                </div>

                 <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Notes <span className="text-gray-400 font-medium">(Optional)</span></label>
                    <input 
                      type="text"
                      placeholder="e.g., Paid via UPI"
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      className="w-full px-4 py-3 min-h-[44px] bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all font-medium text-gray-800 text-base"
                    />
                 </div>

                 <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Payment Mode</label>
                    <select 
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value as any)}
                      className="w-full px-4 py-3 min-h-[44px] bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 outline-none transition-all font-bold text-gray-900 text-base appearance-none"
                    >
                      <option value="upi">UPI / Online</option>
                      <option value="cash">Cash</option>
                      <option value="bank">Bank Transfer</option>
                    </select>
                 </div>

                 <div className="mt-2 flex flex-col gap-3">
                    {lastPaidId ? (
                      <button 
                        onClick={() => openReceipt(lastPaidId)}
                        className="w-full bg-slate-900 text-white font-bold py-3.5 min-h-[44px] rounded-xl shadow-lg active:scale-[0.98] transition-all flex justify-center items-center gap-2 animate-in zoom-in-90 duration-300"
                      >
                        <Printer size={18} /> Download Receipt 🧾
                      </button>
                    ) : (
                      <>
                        {selectedCell.status !== 'paid' && (
                          <button 
                            onClick={handleMarkPaid}
                            disabled={updating}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 min-h-[44px] rounded-xl shadow-md shadow-green-600/20 active:scale-[0.98] transition-all flex justify-center items-center gap-2"
                          >
                            {updating ? 'Updating...' : <><CheckCircle size={18} /> Mark as Paid</>}
                          </button>
                        )}
                        {selectedCell.status === 'paid' && (
                          <button 
                            onClick={() => openReceipt(selectedCell.id)}
                            className="w-full bg-slate-100 text-slate-700 font-bold py-3 min-h-[44px] rounded-xl hover:bg-slate-200 transition-all flex justify-center items-center gap-2 border border-slate-200"
                          >
                            <Printer size={16} /> View Receipt 🧾
                          </button>
                        )}
                      </>
                    )}
                    <button 
                      onClick={handleSaveModal}
                      disabled={updating}
                      className="w-full bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 font-bold py-3 min-h-[44px] rounded-xl active:scale-[0.98] transition-all"
                    >
                      {updating ? 'Saving...' : 'Save Changes'}
                    </button>
                 </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};
