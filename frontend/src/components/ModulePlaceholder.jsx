'use client';
import React from 'react';
import { LayoutTemplate, Sliders, Clock, Users, BarChart2, BarChart3, FileStack, Zap } from 'lucide-react';

const ModulePlaceholder = ({ title, icon: Icon }) => {
  return (
    <div className="p-8 bg-[#fdfdff] min-h-screen flex flex-col items-center justify-center text-center">
      <div className="w-20 h-20 bg-violet-50 rounded-3xl flex items-center justify-center text-violet-600 mb-6 border border-violet-100 shadow-sm animate-bounce">
        <Icon size={40} />
      </div>
      <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-3">{title}</h1>
      <p className="text-slate-500 max-w-md mx-auto mb-8 font-medium">
        This premium module is currently being optimized for your operations. 
        Advanced project management features will be available here shortly.
      </p>
      
      <div className="flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-xl text-white text-xs font-bold uppercase tracking-widest">
        <Zap size={14} className="text-amber-400 fill-amber-400" />
        Coming Soon in V2.0
      </div>
    </div>
  );
};

export default ModulePlaceholder;
