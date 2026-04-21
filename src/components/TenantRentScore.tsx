import React, { useEffect, useState } from 'react';
import { useRentScore } from '@/hooks/useRentScore';
import { 
  Award, TrendingUp, Calendar, CheckCircle2, AlertCircle, Info
} from 'lucide-react';

interface TenantRentScoreProps {
  tenantId: string; // This corresponds to the profileId of the tenant
  compact?: boolean;
}

/**
 * TenantRentScore Component
 * WHAT IT DOES: Displays the proprietary REHWAS Rent Health Score for a tenant.
 * ANALOGY: A credit score specifically designed for renters, showing landlords how reliable they are.
 */
export const TenantRentScore: React.FC<TenantRentScoreProps> = ({ tenantId, compact = false }) => {
  const { loading, calculateScore } = useRentScore();
  const [scoreData, setScoreData] = useState<any>(null);

  useEffect(() => {
    const fetchScore = async () => {
      const data = await calculateScore(tenantId);
      setScoreData(data);
    };
    fetchScore();
  }, [tenantId, calculateScore]);

  if (loading || !scoreData) {
    return (
      <div className={compact ? "animate-pulse h-6 w-20 bg-gray-100 rounded-lg" : "animate-pulse p-6 bg-white rounded-3xl border border-gray-100 h-64"}>
      </div>
    );
  }

  const { grade, percentage, totalMonths, onTimeMonths, lateMonths, history } = scoreData;

  // Visual configuration based on grade
  const getConfig = () => {
    switch (grade) {
      case 'A+': return { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Excellent Payer', sub: 'Top 5% of Tenants' };
      case 'A':  return { color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100', label: 'Good Payer', sub: 'Highly Reliable' };
      case 'B+': return { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Average Payer', sub: 'Consistently Paying' };
      case 'B':  return { color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100', label: 'Fair Payer', sub: 'Pattern of delays' };
      case 'C':  return { color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100', label: 'Needs Work', sub: 'Significant delays' };
      default:   return { color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200', label: 'New Tenant', sub: 'Building Score' };
    }
  };

  const config = getConfig();

  if (compact) {
    return (
      <div className="group relative inline-block">
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${config.bg} ${config.border} ${config.color} text-[10px] font-black uppercase tracking-widest shadow-sm transition-all hover:scale-105 cursor-help`}>
          {grade === 'A+' ? <Award size={12} /> : <TrendingUp size={12} />}
          {grade} Payer {grade === 'A+' && '★'}
        </div>
        
        {/* Simple CSS Tooltip */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-slate-900 text-white text-[10px] p-2 rounded-lg shadow-xl z-50">
          <p className="font-bold mb-1">Rent Health Score</p>
          <p className="opacity-80">Based on {totalMonths} months of payment history on REHWAS.</p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-slate-100 shadow-xl shadow-slate-100/50 relative overflow-hidden group">
      {/* Background Accent */}
      <div className={`absolute top-0 right-0 w-64 h-64 ${config.bg} blur-[100px] opacity-30 -mr-32 -mt-32 transition-colors`}></div>
      
      <div className="relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div className="flex items-center gap-6">
            <div className={`w-24 h-24 md:w-28 md:h-28 rounded-[2.5rem] ${config.bg} ${config.border} border-2 flex items-center justify-center text-5xl md:text-6xl font-black ${config.color} shadow-lg shadow-black/5`}>
              {grade === 'New — Building Score' ? 'NEW' : grade}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className={`text-2xl font-black tracking-tight ${config.color}`}>{config.label}</h3>
                {grade === 'A+' && <Award className="text-emerald-600" size={24} />}
              </div>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">{config.sub}</p>
            </div>
          </div>
          
          <div className="text-right">
             <div className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-1">{percentage}%</div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">On-Time Payment Score</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 bg-slate-50 rounded-full mb-8 overflow-hidden p-0.5 border border-slate-100">
           <div 
             className={`h-full rounded-full bg-gradient-to-r from-slate-200 to-current ${config.color} transition-all duration-1000 ease-out`}
             style={{ width: `${percentage}%` }}
           ></div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {[
            { label: 'History', value: `${totalMonths} Mo`, icon: Calendar },
            { label: 'On-Time', value: onTimeMonths, icon: CheckCircle2, color: 'text-emerald-500' },
            { label: 'Late', value: lateMonths, icon: AlertCircle, color: 'text-amber-500' },
          ].map((stat, i) => (
            <div key={i} className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className={`w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm ${stat.color || 'text-slate-600'}`}>
                <stat.icon size={20} />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{stat.label}</p>
                <div className="font-black text-slate-900">{stat.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* History Mini-Chart */}
        <div className="mb-10">
          <div className="flex justify-between items-center mb-4 px-1">
            <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <TrendingUp size={14} /> 12-Month Reliability Velocity
            </h4>
            <div className="flex gap-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> On-Time</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Late</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400"></span> Unpaid</span>
            </div>
          </div>
          
          <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex flex-wrap justify-center items-center gap-4">
             {history.length > 0 ? (
               [...history].reverse().map((entry: any, i: number) => {
                 let dotColor = 'bg-slate-200';
                 if (entry.timingStatus === 'on-time') dotColor = 'bg-emerald-500 ring-4 ring-emerald-500/20';
                 else if (entry.timingStatus === 'late') dotColor = 'bg-amber-500 ring-4 ring-amber-500/20';
                 else if (entry.timingStatus === 'unpaid') dotColor = 'bg-red-400 ring-4 ring-red-400/20';
                 
                 return (
                   <div key={i} className="group relative flex flex-col items-center gap-2">
                      <div className={`w-4 h-4 rounded-full ${dotColor} transition-transform group-hover:scale-125`}></div>
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity absolute top-6 whitespace-nowrap bg-slate-900 text-white px-1.5 py-0.5 rounded">
                        {entry.month}
                      </span>
                   </div>
                 );
               })
             ) : (
               <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No payment records yet</div>
             )}
          </div>
        </div>

        {/* Footer Disclaimer */}
        <div className="flex items-start gap-4 p-5 bg-indigo-50 border border-indigo-100 rounded-3xl animate-in fade-in slide-in-from-bottom-2">
           <Info className="text-indigo-500 shrink-0 mt-0.5" size={20} />
           <p className="text-[11px] font-medium text-indigo-900/70 leading-relaxed">
             This score is calculated from <strong className="text-indigo-900 font-black tracking-tight underline decoration-indigo-200 underline-offset-2">verified rent payment data</strong> on REHWAS. It is computed algorithmically based on your direct UPI/Bank interactions and <strong className="text-indigo-900 font-black">cannot be edited by anyone</strong>, including landlords.
           </p>
        </div>
      </div>
    </div>
  );
};
