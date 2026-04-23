import React, { useEffect, useState } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine,
  Area,
  AreaChart
} from 'recharts';
import { supabase } from '@/lib/supabase';
import { format, parseISO } from 'date-fns';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface RentHistoryPoint {
  month: string;
  avg_rent: number;
  listing_count: number;
}

interface Props {
  locality: string;
  city: string;
  roomType: string;
  currentRent: number;
}

/**
 * RentHistoryChart Component
 * WHAT IT DOES: Visualizes local rent market trends using a 12-month line chart.
 * 
 * @param {ResponsiveContainer} ResponsiveContainer - An analogy: It's like a stretchy photo frame 
 * that automatically expands or shrinks to fit any wall size (or screen size) perfectly.
 */
export const RentHistoryChart: React.FC<Props> = ({ locality, city, roomType, currentRent }) => {
  const [data, setData] = useState<RentHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: rpcData, error } = await supabase.rpc('get_locality_rent_history', {
          p_locality: locality,
          p_city: city,
          p_room_type: roomType
        });

        if (error) throw error;
        
        // Format months for display
        const formattedData = (rpcData || []).map((item: any) => ({
          ...item,
          displayMonth: format(parseISO(`${item.month}-01`), 'MMM')
        }));
        
        setData(formattedData);
      } catch (err) {
        console.error('Error fetching rent history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [locality, city, roomType]);

  if (loading) {
    return (
      <div className="w-full h-[200px] bg-gray-50 rounded-2xl animate-pulse flex items-end justify-between p-4 gap-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-gray-200 rounded-t-lg w-full" style={{ height: `${Math.random() * 60 + 20}%` }}></div>
        ))}
      </div>
    );
  }

  if (data.length < 2) {
    return (
      <div className="bg-gray-50 rounded-2xl p-8 text-center border border-dashed border-gray-200">
        <p className="text-gray-500 font-bold">Not enough local market data yet</p>
        <p className="text-xs text-gray-400 mt-1">Trends appear once more listings are added in {locality}</p>
      </div>
    );
  }

  // Calculate Insights
  const firstAvg = (data[0].avg_rent + (data[1]?.avg_rent || data[0].avg_rent) + (data[2]?.avg_rent || data[0].avg_rent)) / 3;
  const lastAvg = (data[data.length-1].avg_rent + (data[data.length-2]?.avg_rent || data[data.length-1].avg_rent) + (data[data.length-3]?.avg_rent || data[data.length-1].avg_rent)) / 3;
  
  const pctChange = ((lastAvg - firstAvg) / firstAvg) * 100;
  const isRising = pctChange > 5;
  const isFalling = pctChange < -5;

  const currencyFormatter = (value: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

  return (
    <div className="space-y-4">
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis 
              dataKey="displayMonth" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }}
              dy={10}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }}
              tickFormatter={(value) => `₹${value/1000}k`}
              width={35}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-3 rounded-xl shadow-xl border border-gray-100 font-sans">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{format(parseISO(`${data.month}-01`), 'MMMM yyyy')}</p>
                      <p className="text-sm font-black text-gray-900">{currencyFormatter(data.avg_rent)} <span className="text-gray-400 font-bold">avg</span></p>
                      <p className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-1">{data.listing_count} listings</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine 
              y={currentRent} 
              stroke="#6366f1" 
              strokeDasharray="4 4" 
              label={{ 
                position: 'right', 
                value: `This listing: ₹${currentRent.toLocaleString()}`, 
                fill: '#6366f1', 
                fontSize: 9, 
                fontWeight: 'bold',
                dy: -10
              }} 
            />
            <Line 
              type="monotone" 
              dataKey="avg_rent" 
              stroke="#10B981" 
              strokeWidth={3}
              dot={{ r: 4, fill: '#fff', stroke: '#10B981', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: '#10B981', stroke: '#fff', strokeWidth: 2 }}
              animationDuration={1500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className={`flex items-center gap-2 p-3 rounded-xl text-sm font-bold ${isRising ? 'bg-emerald-50 text-emerald-700' : isFalling ? 'bg-amber-50 text-amber-700' : 'bg-gray-50 text-gray-600'}`}>
        {isRising ? <TrendingUp size={18} /> : isFalling ? <TrendingDown size={18} /> : <Minus size={18} />}
        <span>
          {isRising 
            ? `Rents in ${locality} have risen ~${Math.round(pctChange)}% this year` 
            : isFalling 
              ? `Rents in ${locality} have fallen ~${Math.abs(Math.round(pctChange))}% this year` 
              : `Rents in ${locality} have been stable this year (<5% change)`}
        </span>
      </div>
    </div>
  );
};
