'use client';
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, Briefcase, TrendingUp, ArrowUpRight, Activity } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color, trend }) => (
  <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-4 group">
    <div className={`p-2.5 rounded-lg ${color} bg-opacity-10 transition-colors group-hover:bg-opacity-20`}>
      <Icon className={color.replace('bg-', 'text-')} size={20} />
    </div>
    <div className="flex-1">
      <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">{title}</p>
      <div className="flex items-baseline gap-2">
        <h3 className="text-lg font-bold text-slate-900 tracking-tight">{value}</h3>
        {trend && (
          <span className="flex items-center text-green-500 text-[10px] font-bold">
            <ArrowUpRight size={10} className="mr-0.5" />
            {trend}
          </span>
        )}
      </div>
    </div>
  </div>
);

const AdminDashboard = () => {
  const { user } = useAuth();

  const stats = [
    { title: 'Total Team Members', value: '12', icon: Users, color: 'bg-blue-500', trend: '+2.5%' },
    { title: 'Active Projects', value: '8', icon: Briefcase, color: 'bg-orange-500', trend: '+12%' },
    { title: 'Sales Pipeline', value: '$45.2k', icon: TrendingUp, color: 'bg-green-500', trend: '+8.4%' },
    { title: 'Productivity', value: '94%', icon: Activity, color: 'bg-purple-500', trend: '+3.1%' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-end pb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Hi, {user?.name.split(' ')[0]} <span className="text-brand-primary">!</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-0.5">
            Dashboard overview for <span className="text-brand-primary font-bold">{user?.companyId?.name}</span>
          </p>
        </div>
        <button className="bg-brand-primary hover:bg-brand-hover text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-brand-shadow flex items-center gap-2 active:scale-95">
            <span>+ Create Project</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity / Team Table Placeholder */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/60 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900">Recent Pulse</h3>
            <span className="text-brand-primary text-xs font-bold uppercase tracking-widest cursor-pointer hover:underline underline-offset-4">Live feed</span>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-lg transition-all cursor-pointer border border-transparent hover:border-slate-100 group">
                <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold text-sm group-hover:scale-105 transition-transform">
                  {String.fromCharCode(64 + i)}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-[13px] font-bold text-slate-900 truncate">Project Alpha task completed</p>
                  <p className="text-[10px] text-slate-400 font-medium">2 hours ago · James Miller</p>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md text-[9px] font-bold uppercase tracking-widest">
                    Completed
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions / Summary Card */}
        <div className="bg-[#0f172a] rounded-xl p-6 text-white relative overflow-hidden shadow-xl">
             <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/20 rounded-full blur-2xl -mr-16 -mt-16"></div>
             <h3 className="text-xs font-bold uppercase tracking-[0.2em] mb-6 relative z-10 text-slate-400">Quick Portal</h3>
             <div className="space-y-3 relative z-10">
                <button className="w-full text-left p-3.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-all group">
                    <p className="text-xs font-bold text-slate-100 group-hover:text-white transition-colors">Add Team Member</p>
                    <p className="text-[10px] text-slate-500">Invite new users instantly</p>
                </button>
                <button className="w-full text-left p-3.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-all group">
                    <p className="text-xs font-bold text-slate-100 group-hover:text-white transition-colors">View Reports</p>
                    <p className="text-[10px] text-slate-500">Weekly project insights</p>
                </button>
                <button className="w-full py-3 rounded-lg bg-brand-primary/10 border border-brand-primary/20 text-brand-primary hover:bg-brand-primary/20 transition-all active:scale-[0.98]">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-center">Master Settings</p>
                </button>
             </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
