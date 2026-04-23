import React, { useEffect, useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ReferenceLine 
} from 'recharts';
import { supabase } from '@/lib/supabase';
import { TrendingUp, TrendingDown, Minus, Info, BarChart2 } from 'lucide-react';

interface RentDataPoint {
  month: string;
  avg_rent: number;
  listing_count: number;
  min_rent: number;
  max_rent: number;
}

interface Props {
  city: string;
  locality: string;
  roomType: string;
  currentRent: number;
}

/**
 * RentHistoryChart Component
 * 
 * WHAT IT DOES: Shows a 12-month area chart of average rent prices in a locality.
 * 
 * DESIGN RATIONALE:
 * Uses an AreaChart instead of a simple LineChart to create a sense of "volume" 
 * and stability. The green fill implies a healthy market ecosystem.
 * 
 * ANALOGIES:
 * 1. ResponsiveContainer: Like a stretchy photo frame that automatically expands 
 *    or shrinks to fit any wall size (or screen size) perfectly.
 * 2. ReferenceLine: Like a ruler laid across a graph to compare this listing's 
 *    rent against the market average line.
 * 3. Market Position Algorithm: Like a price tag scanner at Big Bazaar that tells you 
 *    "this is 15% cheaper than the same item at the store next door."
 */
export const RentHistoryChart: React.FC<Props> = ({ city, locality, roomType, currentRent }) => {
  const [data, setData] = useState<RentDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: rpcData, error } = await supabase.rpc('get_locality_rent_history', {
        p_city: city,
        p_locality: locality,
        p_room_type: roomType
      });

      if (!error && rpcData) {
        setData(rpcData);
      }
      setLoading(false);
    };

    fetchData();
  }, [city, locality, roomType]);

  if (loading) {
    return (
      <div className="w-full h-[200px] flex items-end justify-between gap-2 p-4 bg-slate-50 rounded-2xl animate-pulse">
        {[40, 60, 45, 70, 55, 80].map((h, i) => (
          <div key={i} className="flex-1 bg-slate-200 rounded-t-lg" style={{ height: `${h}%` }}></div>
        ))}
      </div>
    );
  }

  if (!data || data.length < 3) {
    return (
      <div className="w-full h-[200px] flex flex-col items-center justify-center text-center p-8 bg-slate-50 border border-dashed border-slate-200 rounded-3xl">
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm">
          <BarChart2 className="text-slate-300" size={24} />
        </div>
        <h4 className="text-sm font-black text-slate-800 mb-1">Not enough local data yet</h4>
        <p className="text-[10px] font-bold text-slate-400 max-w-[200px] leading-tight">
          REHWAS is building the price database for {locality}. Trends appear once more listings are added.
        </p>
      </div>
    );
  }

  // Transform data for recharts
  const chartData = data.map(d => ({
    month: new Date(d.month + '-01').toLocaleDateString('en-IN', { month: 'short' }),
    avgRent: d.avg_rent,
    minRent: d.min_rent,
    maxRent: d.max_rent,
    fullMonth: d.month
  }));

  // Derive Market Position
  const lastMonthAvg = data[data.length - 1]?.avg_rent || 0;
  const priceDiff = ((currentRent - lastMonthAvg) / lastMonthAvg) * 100;
  
  const marketLabel =
    priceDiff <= -10 ? { label: 'Great Deal', color: '#10B981', bg: 'bg-emerald-50', emoji: '🎯' } :
    priceDiff <= 5   ? { label: 'Fair Price', color: '#64748B', bg: 'bg-slate-50', emoji: '✓' } :
                       { label: 'Above Market', color: '#F59E0B', bg: 'bg-amber-50', emoji: '⚠️' };

  // Price Trend
  const firstThreeAvg = (data[0].avg_rent + (data[1]?.avg_rent || 0) + (data[2]?.avg_rent || 0)) / 3;
  const lastThreeAvg = (data[data.length-1].avg_rent + (data[data.length-2]?.avg_rent || 0) + (data[data.length-3]?.avg_rent || 0)) / 3;
  const trendPct = ((lastThreeAvg - firstThreeAvg) / firstThreeAvg) * 100;
  
  const trendLabel =
    trendPct > 5  ? `📈 Rents rising ~${Math.round(trendPct)}% this year` :
    trendPct < -5 ? `📉 Rents falling ~${Math.round(Math.abs(trendPct))}% this year` :
                    `📊 Rents stable this year`;

  return (
    <div className="space-y-6">
      {/* Market Position Badge */}
      <div className={`inline-flex flex-col ${marketLabel.bg} p-4 rounded-2xl border border-white shadow-sm`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">{marketLabel.emoji}</span>
          <span className="text-base font-black uppercase tracking-tight" style={{ color: marketLabel.color }}>
            {marketLabel.label}
          </span>
        </div>
        <p className="text-[11px] font-bold text-slate-500">
          ₹{Math.abs(Math.round(priceDiff))}% {priceDiff <= 0 ? 'below' : 'above'} the area average
        </p>
      </div>

      {/* Chart */}
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis 
              dataKey="month" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fontWeights: 'bold', fill: '#64748B' }} 
              dy={10}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`}
              tick={{ fontSize: 11, fontWeights: 'bold', fill: '#64748B' }}
              width={45}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-white p-3 rounded-xl shadow-xl border border-slate-100 font-sans">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{d.fullMonth}</p>
                      <p className="text-sm font-black text-slate-900">₹{d.avgRent.toLocaleString('en-IN')}</p>
                      <p className="text-[10px] font-bold text-emerald-600">Average Market Rent</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="avgRent"
              stroke="#10B981"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorRent)"
              dot={{ r: 4, fill: '#fff', stroke: '#10B981', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: '#10B981', stroke: '#fff', strokeWidth: 2 }}
            />
            <ReferenceLine
              y={currentRent}
              stroke="#F59E0B"
              strokeDasharray="4 4"
              strokeWidth={2}
              label={{ 
                value: 'This listing', 
                position: 'right', 
                fontSize: 10, 
                fontWeight: '900', 
                fill: '#F59E0B',
                className: 'uppercase tracking-tighter'
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Trend Insight */}
      <div className="flex items-center gap-2 text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
        <Info size={14} className="text-slate-400" />
        <p className="text-[13px] font-bold">
          {trendLabel} in {locality}
        </p>
      </div>
    </div>
  );
};
