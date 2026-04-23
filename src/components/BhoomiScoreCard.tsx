import React from 'react';
import { calculateBhoomiScore, BhoomiInput } from '@/lib/bhoomiScore';
import { 
  ShieldCheck, Info, ArrowRight, CheckCircle2, 
  HelpCircle, AlertCircle, TrendingUp 
} from 'lucide-react';

interface Props {
  input: BhoomiInput;
  isOwner?: boolean;
}

/**
 * BhoomiScoreCard Component
 * 
 * WHAT IT DOES: Displays a multi-pillar trust breakdown for a room listing.
 * 
 * ANALOGY:
 * Like a credit score report. Instead of just seeing "750", you see exactly how
 * your on-time payments, credit history, and depth of accounts contribute to the final number.
 */
export const BhoomiScoreCard: React.FC<Props> = ({ input, isOwner = false }) => {
  const result = calculateBhoomiScore(input);

  const ProgressBar = ({ label, current, max, color }: { label: string, current: number, max: number, color: string }) => (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
        <span>{label}</span>
        <span className="text-slate-900">{current}/{max}</span>
      </div>
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <div 
          className="h-full transition-all duration-1000 ease-out" 
          style={{ width: `${(current / max) * 100}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
      {/* HEADER ROW */}
      <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
        <div>
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
            Bhoomi Score <TrendingUp size={14} className="text-slate-400" />
          </h3>
          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tight">Trust & Asset Intelligence</p>
        </div>
        <div 
          className="w-16 h-16 rounded-2xl flex flex-col items-center justify-center shadow-xl shadow-opacity-20 border-2"
          style={{ borderColor: `${result.gradeColor}20`, backgroundColor: `${result.gradeColor}05` }}
        >
          <span className="text-[10px] font-black uppercase tracking-tighter mb-0.5" style={{ color: result.gradeColor }}>Grade</span>
          <span className="text-2xl font-black leading-none" style={{ color: result.gradeColor }}>{result.grade}</span>
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* SCORE BAR (5-segment progress) */}
        <div className="flex gap-2 h-3">
          {[1, 2, 3, 4, 5].map((segment) => {
            const gradeMap = { 'A+': 5, 'A': 4, 'B+': 3, 'B': 2, 'C': 1 };
            const isActive = segment <= gradeMap[result.grade];
            return (
              <div 
                key={segment}
                className={`flex-1 rounded-full transition-all duration-500 ${isActive ? '' : 'bg-slate-100'}`}
                style={{ backgroundColor: isActive ? result.gradeColor : undefined }}
              />
            );
          })}
        </div>

        {/* BREAKDOWN PILLARS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ProgressBar 
            label="Landlord KYC" 
            current={result.breakdown.kycScore} 
            max={30} 
            color={result.gradeColor} 
          />
          <ProgressBar 
            label="Property Info" 
            current={result.breakdown.propertyScore} 
            max={30} 
            color={result.gradeColor} 
          />
          <ProgressBar 
            label="Community" 
            current={result.breakdown.communityScore} 
            max={40} 
            color={result.gradeColor} 
          />
        </div>

        {/* STRENGTHS */}
        <div className="pt-2">
          <div className="flex flex-wrap gap-2">
            {result.strengths.map((strength, i) => (
              <div 
                key={i} 
                className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100"
              >
                <CheckCircle2 size={12} />
                {strength}
              </div>
            ))}
          </div>
        </div>

        {/* IMPROVEMENTS (Owner only) */}
        {isOwner && result.improvements.length > 0 && (
          <div className="pt-6 border-t border-slate-100 animate-in slide-in-from-bottom-2 duration-500">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <HelpCircle size={12} /> How to improve your score:
            </h4>
            <div className="flex flex-wrap gap-2">
              {result.improvements.map((improvement, i) => (
                <button 
                  key={i}
                  className="group flex items-center gap-1.5 bg-slate-50 text-slate-500 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all border border-slate-100"
                >
                  {improvement}
                  <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
