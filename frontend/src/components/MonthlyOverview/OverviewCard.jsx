'use client';
import React from 'react';
import { ArrowUpRight } from 'lucide-react';

const OverviewCard = ({ title, value, icon: Icon, color, trend, delay }) => (
  <div 
    className={`bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 group relative overflow-hidden animate-in fade-in slide-in-from-bottom-4`}
    style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
  >
    {/* Decorative Background Blob */}
    <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-[0.03] group-hover:opacity-[0.06] transition-opacity ${color}`} />
    
    <div className="flex justify-between items-start mb-4 relative z-10">
      <div className={`p-3 rounded-2xl ${color} bg-opacity-10 text-slate-900 group-hover:scale-110 transition-transform duration-500`}>
        <Icon className={color.replace('bg-', 'text-')} size={22} strokeWidth={2.5} />
      </div>
      {trend && (
        <span className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-extrabold rounded-lg border border-emerald-100/50 uppercase tracking-tight">
          <ArrowUpRight size={10} strokeWidth={3} />
          {trend}
        </span>
      )}
    </div>
    
    <div className="relative z-10">
      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">{title}</p>
      <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none">
        {value}
      </h3>
    </div>

    {/* Subtle bottom accent */}
    <div className={`absolute bottom-0 left-0 h-1 w-0 group-hover:w-full transition-all duration-700 ${color}`} />
  </div>
);

export default OverviewCard;
