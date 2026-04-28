'use client';
import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Cell,
  Legend
} from 'recharts';
import { TrendingUp, Activity } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200 p-3 rounded-xl shadow-2xl shadow-indigo-500/10">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 mb-1 last:mb-0">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <p className="text-xs font-bold text-slate-900">
              {entry.name}: <span className="font-black">{entry.value.toLocaleString()}</span>
            </p>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const SalesAnalytics = ({ stats, user }) => {
  // Memoize data transformation to avoid recalculating on every parent render
  const monthlyData = React.useMemo(() => {
    return stats?.months?.map(m => {
      const [year, month] = m._id.split('-');
      const date = new Date(year, parseInt(month) - 1);
      const label = date.toLocaleString('default', { month: 'short' });
      
      return {
        name: label,
        revenue: m.revenue || 0,
        leads: m.leads || 0,
        converted: m.converted || 0,
        received: m.received || 0
      };
    }) || [];
  }, [stats?.months]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
      
      {/* Revenue Flow - Neon Sunset Style */}
      <div className="bg-white/70 backdrop-blur-xl rounded-[24px] p-5 border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-[250px] flex flex-col relative overflow-hidden group">
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-[40px] animate-pulse" />
        
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_4px_15px_rgba(99,102,241,0.3)]">
              <TrendingUp size={14} className="text-white" />
            </div>
            <div>
              <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Revenue Flow</h3>
              <p className="text-sm font-black text-slate-900 tracking-tight">₹{stats?.total?.revenue?.toLocaleString() || 0}</p>
            </div>
          </div>
          <div className="bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
             <span className="text-[9px] font-black text-emerald-600 tracking-tight">+12%</span>
          </div>
        </div>
        
        <div className="flex-1 w-full relative z-10" style={{ minWidth: 0, minHeight: 0 }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <AreaChart data={monthlyData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="neonGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
                <linearGradient id="fillGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.1}/>
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="0" vertical={false} stroke="#E2E8F0" opacity={0.2} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} dy={10}/>
              <YAxis hide={true} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke="url(#neonGradient)" strokeWidth={4} fill="url(#fillGradient)" animationDuration={500} dot={false} activeDot={{ r: 6, fill: '#fff', stroke: '#6366f1', strokeWidth: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Conversion - Vibrant Cyan/Emerald */}
      <div className="bg-white/70 backdrop-blur-xl rounded-[24px] p-5 border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-[250px] flex flex-col relative overflow-hidden group">
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-cyan-500/10 rounded-full blur-[40px]" />
        
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center shadow-[0_4px_15px_rgba(6,182,212,0.3)]">
              <Activity size={14} className="text-white" />
            </div>
            <div>
              <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Efficiency</h3>
              <p className="text-sm font-black text-slate-900 tracking-tight">{stats?.total?.conversionRate || 0}% Success</p>
            </div>
          </div>
          <div className="flex gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          </div>
        </div>

        <div className="flex-1 w-full relative z-10" style={{ minWidth: 0, minHeight: 0 }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <BarChart data={monthlyData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }} barGap={12}>
              <CartesianGrid strokeDasharray="0" vertical={false} stroke="#E2E8F0" opacity={0.2} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} dy={10}/>
              <YAxis hide={true} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.02)' }} />
              <Bar dataKey="leads" name="Leads" fill="#818cf8" radius={[10, 10, 10, 10]} barSize={8} animationDuration={500} />
              <Bar dataKey="converted" name="Converted" fill="#06b6d4" radius={[10, 10, 10, 10]} barSize={8} className="drop-shadow-[0_0_10px_rgba(6,182,212,0.3)]" animationDuration={800} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default SalesAnalytics;
