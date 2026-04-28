'use client';
import React from 'react';
import { ChevronRight, Target, Activity, Users } from 'lucide-react';

export const StatCard = React.memo(({ title, value, icon: Icon }) => (
  <div className="bg-white/70 backdrop-blur-xl rounded-xl p-4 border border-slate-200/60 flex flex-col gap-3 shadow-[0_4px_25px_rgba(0,0,0,0.03)] h-full transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
    <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm" 
      style={{background: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(99,102,241,0.2) 100%)'}}>
      <Icon size={18} className="text-violet-600" />
    </div>
    <div>
      <h3 className="text-[15px] font-black text-slate-900 tracking-tight leading-none">{value}</h3>
      <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-slate-400 mt-2">{title}</p>
    </div>
  </div>
));

export const FeaturedMetricCard = React.memo(({ value, subLabel }) => (
  <div className="bg-[#1a1f3a] rounded-xl p-7 relative overflow-hidden flex flex-col justify-between h-full shadow-xl" style={{background: 'linear-gradient(135deg, #1e2a5e 0%, #2d1b69 50%, #1a1035 100%)'}}>
    <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-2xl blur-3xl -mr-16 -mt-16" />
    <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/10 rounded-2xl blur-3xl -ml-16 -mb-16" />
    <div className="relative z-10">
      <div className="flex justify-between items-start mb-8">
        <div className="w-10 h-10 bg-white/10 rounded-xl border border-white/10 flex items-center justify-center shadow-lg">
           <Target size={20} color="white" />
        </div>
        <span className="flex items-center gap-1.5 bg-emerald-500/15 text-emerald-400 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border border-emerald-500/20 shadow-sm">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
          18 MONTHS DATA
        </span>
      </div>
      <h2 className="text-4xl font-black text-white tracking-tighter mb-1 leading-none">{value}</h2>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">{subLabel}</p>
    </div>
    <div className="relative z-10 mt-10 flex items-center gap-2 text-slate-400 hover:text-white transition-colors cursor-pointer group">
      <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
      <span className="text-[10px] font-black uppercase tracking-[0.2em]">View Detailed Analytics →</span>
    </div>
  </div>
));

export const TeamPulseItem = React.memo(({ member, onClick }) => (
  <div 
    onClick={() => onClick(member)}
    className="px-5 py-4 hover:bg-slate-50 flex items-center justify-between group cursor-pointer border-b border-slate-100 last:border-0"
  >
    <div className="flex items-center gap-3.5">
      <div className="relative shrink-0">
        <img src={member.profilePic} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow" />
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
      </div>
      <div>
        <h4 className="text-sm font-bold text-slate-900">{member.name}</h4>
        <p className="text-[11px] text-slate-400 font-medium">{member.email}</p>
      </div>
    </div>
    <div className="text-right shrink-0">
      <div className="flex items-center gap-1.5 justify-end mb-1">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Active Now</span>
      </div>
      <p className="text-[10px] font-semibold text-violet-500 group-hover:underline">View Pipeline →</p>
    </div>
  </div>
));

export const LeaderboardItem = ({ name, value, percentage }) => (
  <div className="bg-[#1e1b4b]/40 border border-white/5 rounded-xl p-3.5 mb-3 last:mb-0 shadow-sm group hover:bg-[#1e1b4b]/60 transition-all">
    <div className="flex justify-between items-center mb-2.5">
      <span className="text-[11px] font-black text-white/90 uppercase tracking-widest">{name}</span>
      <span className="text-[11px] font-extrabold text-white">₹{value.toLocaleString()}</span>
    </div>
    <div className="relative h-1 bg-white/5 rounded-full overflow-hidden">
      <div 
        className="absolute inset-y-0 left-0 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.6)]" 
        style={{ 
          width: `${Math.max(percentage, 5)}%`,
          background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)'
        }} 
      />
    </div>
  </div>
);

export const MonthCard = ({ month, data, onClick, user }) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const [year, monthNum] = month.split('-');
  const monthName = months[parseInt(monthNum) - 1];

  return (
    <div 
      onClick={onClick}
      className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group"
    >
      <h4 className="text-lg font-bold text-slate-900 mb-3 group-hover:text-brand-primary transition-colors">{monthName}</h4>
      <div className="space-y-2">
        <div className="flex justify-between text-[11px] font-bold">
          <span className="text-slate-400 uppercase tracking-wider">
            {user?.role === 'sales-team' ? 'My Revenue' : 'Revenue'}
          </span>
          <span className="text-slate-900">₹{data?.revenue?.toLocaleString() || 0}</span>
        </div>
        <div className="flex justify-between text-[11px] font-bold">
          <span className="text-emerald-500 uppercase tracking-wider">
            {user?.role === 'sales-team' ? 'My Received' : 'Received'}
          </span>
          <span className="text-emerald-600">₹{data?.received?.toLocaleString() || 0}</span>
        </div>
        <div className="flex justify-between text-[11px] font-bold">
          <span className="text-slate-400 uppercase tracking-wider">Available Leads</span>
          <span className="text-slate-900">{data?.available || 0}</span>
        </div>
        <div className="flex justify-between text-[11px] font-bold">
          <span className="text-slate-400 uppercase tracking-wider">
            {user?.role === 'sales-team' ? 'My Converted' : 'Converted'}
          </span>
          <span className="text-slate-900">{data?.converted || 0}</span>
        </div>
      </div>
    </div>
  );
};
