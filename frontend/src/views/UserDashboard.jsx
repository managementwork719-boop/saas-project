'use client';
import React, { useState, useEffect } from 'react';
import PersonalPipeline from '../components/PersonalPipeline';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart3, 
  Clock, 
  LayoutDashboard,
  Calendar,
  Zap,
  TrendingUp,
  Activity,
  Target,
  MoreVertical,
  X,
  Search,
  Phone,
  Mail
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Skeleton, AnalyticsSkeleton } from '../components/Skeleton';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const PerformanceOverviewHub = React.memo(({ rawFollowUps, rawConverted, rawNotConverted, counts }) => {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = React.useState(now.getMonth());
  const [showMonthPicker, setShowMonthPicker] = React.useState(false);
  const [showAllFollowUps, setShowAllFollowUps] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');

  const STAGE_COLORS = {
    'New Leads':     '#818cf8',
    'Follow Up':     '#f59e0b',
    'Closed Won':    '#f43f5e',
    'Not Converted': '#fb7185',
  };
  const DEFAULT_COLORS = ['#818cf8', '#f59e0b', '#f43f5e', '#fb7185', '#10b981', '#06b6d4'];

  const priorityStyle = {
    high:   { label: 'HIGH',   bg: 'bg-rose-100',    text: 'text-rose-600' },
    medium: { label: 'MEDIUM', bg: 'bg-amber-100',   text: 'text-amber-600' },
    low:    { label: 'LOW',    bg: 'bg-emerald-100', text: 'text-emerald-600' },
  };

  const year = now.getFullYear();
  
  const { monthFollowUps, monthConverted, monthNotConverted, stageData, donutTotal, pipelineTrend, allFollowUps } = React.useMemo(() => {
    const mFU = rawFollowUps.filter(l => {
      const d = new Date(l.createdAt);
      return d.getFullYear() === year && d.getMonth() === selectedMonth;
    });
    const mConv = rawConverted.filter(l => {
      const d = new Date(l.updatedAt || l.createdAt);
      return d.getFullYear() === year && d.getMonth() === selectedMonth;
    });
    const mNotConv = rawNotConverted.filter(l => {
      const d = new Date(l.updatedAt || l.createdAt);
      return d.getFullYear() === year && d.getMonth() === selectedMonth;
    });

    const sMap = {
      'New Leads': 0,
      'Follow Up': 0,
      'Closed Won': mConv.length,
      'Not Converted': mNotConv.length
    };

    mFU.forEach(l => {
      if (l.nextFollowUp) sMap['Follow Up']++;
      else sMap['New Leads']++;
    });

    const sData = Object.keys(sMap)
      .map(k => ({ name: k, value: sMap[k] }))
      .filter(d => d.value > 0);

    const rTotal = mFU.length + mConv.length + mNotConv.length;

    const daysInMonth = new Date(year, selectedMonth + 1, 0).getDate();
    const dMap = {};
    [...rawFollowUps, ...rawConverted, ...rawNotConverted].forEach(l => {
      const d = new Date(l.createdAt);
      if (d.getFullYear() === year && d.getMonth() === selectedMonth) {
        dMap[d.getDate()] = (dMap[d.getDate()] || 0) + 1;
      }
    });
    const pTrend = Array.from({ length: daysInMonth }, (_, i) => ({
      name: `${i + 1}`,
      value: dMap[i + 1] || 0,
    }));

    const aFU = rawFollowUps
      .filter(l => {
        if (!l.nextFollowUp) return false;
        const d = new Date(l.nextFollowUp);
        const isInSelectedMonth = d.getFullYear() === year && d.getMonth() === selectedMonth;
        const isOverdue = d < now;
        return isInSelectedMonth || isOverdue;
      })
      .sort((a, b) => new Date(a.nextFollowUp) - new Date(b.nextFollowUp))
      .map(l => ({
        name: l.name, email: l.email, phone: l.phone,
        nextFollowUp: l.nextFollowUp, priority: l.priority || 'medium', status: l.status,
        overdue: new Date(l.nextFollowUp) < now
      }));

    return { 
      monthFollowUps: mFU, 
      monthConverted: mConv, 
      monthNotConverted: mNotConv, 
      stageData: sData, 
      donutTotal: rTotal, 
      pipelineTrend: pTrend, 
      allFollowUps: aFU 
    };
  }, [selectedMonth, rawFollowUps, rawConverted, rawNotConverted, year]);

  const filteredFollowUps = React.useMemo(() => 
    allFollowUps.filter(f => 
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (f.email && f.email.toLowerCase().includes(searchTerm.toLowerCase()))
    ), [allFollowUps, searchTerm]);

  const upcomingFollowUps = React.useMemo(() => allFollowUps.slice(0, 5), [allFollowUps]);

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Target size={18} /></div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 leading-none">Sales Pipeline Overview</h2>
              <p className="text-[10px] font-medium text-slate-400 mt-0.5">Track your pipeline performance in real-time</p>
            </div>
          </div>
          <div className="relative">
            <button onClick={() => setShowMonthPicker(p => !p)}
              className="flex items-center gap-2 border border-slate-200 px-3 py-1.5 rounded-2xl text-[11px] font-bold text-slate-600 cursor-pointer hover:bg-slate-50 transition-all">
              {MONTH_NAMES[selectedMonth]} {year}
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            {showMonthPicker && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2 grid grid-cols-3 gap-1 w-44">
                {MONTH_NAMES.map((m, i) => (
                  <button key={m} onClick={() => { setSelectedMonth(i); setShowMonthPicker(false); }}
                    className={`px-2 py-1.5 rounded-2xl text-[10px] font-bold uppercase tracking-wide transition-all ${i === selectedMonth ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
          {/* COL 1: Lead Stages */}
          <div className="lg:col-span-3 p-6 flex flex-col gap-4">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">Lead Stages</p>
            <div className="flex items-center gap-4">
              <div className="relative shrink-0 w-[120px] h-[120px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stageData.length ? stageData : [{ name: 'No Data', value: 1 }]}
                      innerRadius={38} outerRadius={54} paddingAngle={stageData.length > 1 ? 3 : 0}
                      dataKey="value" startAngle={90} endAngle={-270}>
                      {stageData.length
                        ? stageData.map((entry, i) => <Cell key={i} fill={STAGE_COLORS[entry.name] || DEFAULT_COLORS[i % DEFAULT_COLORS.length]} strokeWidth={0} />)
                        : <Cell fill="#e2e8f0" strokeWidth={0} />}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 8px 20px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: '700' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-black text-slate-900 leading-none">{donutTotal === 0 ? 0 : donutTotal}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">Total Leads</span>
                </div>
              </div>
              <div className="flex flex-col gap-2.5 flex-1">
                {stageData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-xl shrink-0" style={{ background: STAGE_COLORS[d.name] || DEFAULT_COLORS[i % DEFAULT_COLORS.length] }} />
                      <span className="text-[10px] font-semibold text-slate-600 truncate">{d.name}</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap">{d.value} ({Math.round((d.value / donutTotal) * 100)}%)</span>
                  </div>
                ))}
                {stageData.length === 0 && <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">No data for {MONTH_NAMES[selectedMonth]}</p>}
              </div>
            </div>
          </div>

          {/* COL 2: Pipeline Trend */}
          <div className="lg:col-span-5 p-6 flex flex-col">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-4">Pipeline Trend — {MONTH_NAMES[selectedMonth]} {year}</p>
            <div className="flex-1 min-h-[140px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={pipelineTrend} margin={{ top: 10, right: 10, left: 5, bottom: 0 }}>
                  <defs>
                    <linearGradient id="pipelineGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#818cf8" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#818cf8" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 600 }} dy={8} tickFormatter={(val) => [1,8,15,22,29].includes(parseInt(val)) ? val : ''} />
                  <YAxis hide allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 8px 20px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: '700', backgroundColor: 'white' }} itemStyle={{ color: '#6366f1' }} formatter={(val) => [`${val} Leads`, 'Leads']} labelFormatter={(label) => `${MONTH_NAMES[selectedMonth]} ${label}`} />
                  <Area type="monotone" dataKey="value" stroke="#818cf8" strokeWidth={2.5} fill="url(#pipelineGradient)" dot={{ r: 3, fill: '#818cf8', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#6366f1', strokeWidth: 0 }} animationDuration={800} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* COL 3: Upcoming Follow-Ups */}
          <div className="lg:col-span-4 p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">Upcoming Follow-Ups</p>
              <button onClick={() => setShowAllFollowUps(true)} className="text-[10px] font-bold text-indigo-500 hover:underline">View All</button>
            </div>
            <div className="space-y-3 flex-1 overflow-auto">
              {upcomingFollowUps.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-6 opacity-30">
                  <Clock size={22} className="text-slate-400 mb-2" /><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">None for {MONTH_NAMES[selectedMonth]}</p>
                </div>
              ) : upcomingFollowUps.map((fu, i) => {
                const ps = priorityStyle[fu.priority?.toLowerCase()] || priorityStyle.medium;
                const dateObj = new Date(fu.nextFollowUp);
                return (
                  <div key={i} className="flex items-center justify-between gap-3 group hover:bg-slate-50 rounded-2xl p-1.5 transition-all -mx-1.5">
                    <div className="flex items-center gap-3">
                      <span className={`${ps.bg} ${ps.text} text-[8px] font-black px-2 py-0.5 rounded-xl uppercase tracking-wider`}>
                        {fu.overdue ? 'OVERDUE' : ps.label}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-slate-900 leading-tight">{fu.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium truncate max-w-[120px]">{fu.phone || fu.email || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="text-right">
                          <p className="text-xs font-black text-slate-800 leading-none">{dateObj.getDate()}</p>
                          <p className="text-[9px] font-bold text-slate-400 leading-none mt-0.5">{dateObj.toLocaleString('default', { month: 'short' }).toUpperCase()}</p>
                       </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {showAllFollowUps && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowAllFollowUps(false)} />
          <div className="relative bg-white w-full max-w-2xl max-h-[85vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Monthly Follow-Ups</h3>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">{MONTH_NAMES[selectedMonth]} {year}</p>
              </div>
              <button onClick={() => setShowAllFollowUps(false)} className="p-2 hover:bg-slate-200 rounded-2xl text-slate-400"><X size={20} /></button>
            </div>
            <div className="px-8 py-4 bg-white border-b border-slate-50">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-2.5 pl-10 pr-4 text-xs focus:outline-none focus:border-indigo-500 transition-all" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-8 pt-4 space-y-4">
              {filteredFollowUps.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-40"><Activity size={40} className="text-slate-300 mb-4" /><p className="text-sm font-bold text-slate-400">No follow-ups found</p></div>
              ) : filteredFollowUps.map((fu, i) => {
                const ps = priorityStyle[fu.priority?.toLowerCase()] || priorityStyle.medium;
                const d = new Date(fu.nextFollowUp);
                return (
                  <div key={i} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:bg-indigo-50/10 transition-all group">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-3xl bg-indigo-50 flex flex-col items-center justify-center shrink-0 border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                          <span className="text-xs font-black leading-none">{d.getDate()}</span>
                          <span className="text-[8px] font-bold uppercase mt-1 opacity-70">{d.toLocaleString('default', { month: 'short' })}</span>
                       </div>
                       <div>
                          <div className="flex items-center gap-2 mb-1">
                             <h4 className="font-bold text-slate-900 text-sm">{fu.name}</h4>
                             <span className={`${ps.bg} ${ps.text} text-[8px] font-black px-1.5 py-0.5 rounded-xl uppercase`}>{ps.label}</span>
                          </div>
                          <div className="flex items-center gap-3 text-[10px] font-medium text-slate-400">
                             <span className="flex items-center gap-1"><Clock size={10} /> {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                             {fu.phone && <span className="flex items-center gap-1"><Phone size={10} /> {fu.phone}</span>}
                          </div>
                       </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                       {fu.phone && <a href={`tel:${fu.phone}`} className="p-2.5 bg-indigo-600 text-white rounded-2xl"><Phone size={14} /></a>}
                       {fu.email && <a href={`mailto:${fu.email}`} className="p-2.5 bg-white border border-slate-200 text-slate-400 rounded-2xl"><Mail size={14} /></a>}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/30 text-center"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Showing {filteredFollowUps.length} of {allFollowUps.length} entries</p></div>
          </div>
        </div>
      )}
    </>
  );
});

const UserDashboard = () => {
  const { user } = useAuth();
  const { data: queryData, isLoading: loading, refetch } = useQuery({
    queryKey: ['myLeads'],
    queryFn: async () => {
      const res = await API.get('/sales/my-leads');
      return res.data.data;
    }
  });

  const rawLeads = React.useMemo(() => ({
    followUp: queryData?.followUp || [],
    converted: queryData?.converted || [],
    notConverted: queryData?.notConverted || []
  }), [queryData]);

  const counts = React.useMemo(() => {
    const followUp = rawLeads.followUp;
    const converted = rawLeads.converted;
    
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const now = new Date();
    
    const priority = [
      ...followUp.filter(l => l.nextFollowUp && new Date(l.nextFollowUp) < now),
      ...converted.filter(l => l.deadline && new Date(l.deadline) < now && l.deliveryStatus !== 'completed')
    ].length;

    const revenue = converted.reduce((acc, l) => acc + (l.totalAmount || l.budget || 0), 0);
    const thisMonthTotalCount = followUp.filter(l => new Date(l.createdAt) >= startOfMonth).length;
    const thisMonthSuccessArr = converted.filter(l => new Date(l.updatedAt || l.createdAt) >= startOfMonth);
    const thisMonthRevenueVal = thisMonthSuccessArr.reduce((acc, l) => acc + (l.totalAmount || l.budget || 0), 0);

    return {
      priority,
      total: followUp.length,
      success: converted.length,
      revenue,
      thisMonthTotal: thisMonthTotalCount,
      thisMonthSuccess: thisMonthSuccessArr.length,
      thisMonthRevenue: thisMonthRevenueVal,
    };
  }, [rawLeads]);

  const todayLabel = new Date().toLocaleDateString('en-GB', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });

  if (loading) return (
     <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500 pb-10">
        {/* Welcome Header Skeleton */}
        <div className="bg-white/80 p-6 rounded-2xl border border-slate-200 shadow-sm">
           <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-2xl" />
              <div className="space-y-3 flex-1">
                 <Skeleton className="h-4 w-32" />
                 <Skeleton className="h-8 w-2/3 max-w-md" />
              </div>
           </div>
        </div>
        
        {/* KPI Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
           {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                 <div className="flex items-center gap-4 flex-1">
                    <Skeleton className="h-12 w-12 rounded-2xl" />
                    <div className="space-y-2 flex-1">
                       <Skeleton className="h-3 w-1/2" />
                       <Skeleton className="h-6 w-3/4" />
                    </div>
                 </div>
                 <Skeleton className="h-8 w-16 opacity-20" />
              </div>
           ))}
        </div>

        {/* Analytics Hub Skeleton */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
           <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-8 w-24 rounded-xl" />
           </div>
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
              <div className="lg:col-span-3 space-y-4">
                 <Skeleton className="h-4 w-24" />
                 <div className="flex items-center gap-4">
                    <Skeleton className="h-[120px] w-[120px] rounded-full" />
                    <div className="flex-1 space-y-2">
                       <Skeleton className="h-3 w-full" />
                       <Skeleton className="h-3 w-full" />
                       <Skeleton className="h-3 w-full" />
                    </div>
                 </div>
              </div>
              <div className="lg:col-span-5 space-y-4">
                 <Skeleton className="h-4 w-32" />
                 <Skeleton className="h-[140px] w-full rounded-xl" />
              </div>
              <div className="lg:col-span-4 space-y-4">
                 <Skeleton className="h-4 w-32" />
                 <div className="space-y-3">
                    {[...Array(4)].map((_, j) => <Skeleton key={j} className="h-12 w-full rounded-xl" />)}
                 </div>
              </div>
           </div>
        </div>

        {/* Pipeline Table Skeleton */}
        <div className="space-y-4">
           <div className="flex items-center gap-2">
              <div className="w-1.5 h-6 bg-slate-200 rounded-full" />
              <Skeleton className="h-6 w-48" />
           </div>
           <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                 <Skeleton className="h-10 w-full rounded-xl" />
              </div>
              <div className="p-6 space-y-4">
                 {[...Array(5)].map((_, k) => (
                    <div key={k} className="flex justify-between items-center py-2">
                       <div className="flex items-center gap-4 flex-1">
                          <Skeleton className="h-10 w-10 rounded-xl" />
                          <div className="space-y-2 flex-1">
                             <Skeleton className="h-4 w-1/3" />
                             <Skeleton className="h-3 w-1/4 opacity-50" />
                          </div>
                       </div>
                       <Skeleton className="h-8 w-24 rounded-lg" />
                       <Skeleton className="h-8 w-16 rounded-lg ml-8" />
                    </div>
                 ))}
              </div>
           </div>
        </div>
     </div>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500 pb-10">
      {/* Light & Airy Premium Welcome Header */}
      <div className="relative overflow-hidden bg-white/80 p-1.5 rounded-2xl border border-slate-200 shadow-[0_4px_25px_rgba(0,0,0,0.03)] group transition-all hover:shadow-[0_8px_40px_rgba(0,0,0,0.06)]">
        <div className="absolute inset-0 bg-gradient-to-tr from-violet-50/50 via-white to-rose-50/30 opacity-70" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-violet-400/5 blur-3xl -tr-20 -mt-20" />
        <div className="absolute -bottom-20 left-10 w-64 h-64 bg-indigo-500/5 blur-3xl" />
        
        <div className="relative bg-white/40 backdrop-blur-sm p-3 rounded-xl flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
          
          <div className="z-10 text-center md:text-left space-y-2">
             <div className="flex items-center justify-center md:justify-start gap-2">
                <span className="text-sm">👋</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none">
                   {new Date().getHours() < 12 ? 'Good Morning,' : new Date().getHours() < 17 ? 'Good Afternoon,' : 'Good Evening,'}
                </span>
             </div>
             <div>
                <h1 className="text-3xl lg:text-2xl font-bold text-slate-900 tracking-tight leading-none mb-2">
                   Welcome back, <span className="text-indigo-600 font-bold">{user?.name?.split(' ')[0]}!</span>
                </h1>
                <div className="flex flex-col gap-0.5">
                   <p className="text-slate-500 text-[11px] font-medium leading-relaxed">
                      You have <span className="text-indigo-500 font-bold">{counts.priority} priority</span> follow-up and <span className="text-violet-500 font-bold">{counts.total} tasks</span> pending.
                   </p>
                   <p className="text-slate-600 text-[11px] font-bold flex items-center justify-center md:justify-start gap-2">
                      Let's close more deals today! 🚀
                   </p>
                </div>
             </div>
          </div>

          {/* Illustration removed as per request */}

          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-[0_8px_20px_rgba(0,0,0,0.02)] min-w-[160px] z-10 group-hover:translate-x-1 transition-all duration-500">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                   <LayoutDashboard size={20} />
                </div>
                <div>
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">Access Level</p>
                   <p className="text-xs font-bold text-slate-800 uppercase tracking-tight">{user?.role?.replace('-', ' ')}</p>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Premium High-Density KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center border border-violet-100">
                  <Zap size={22} className="fill-current" />
               </div>
               <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Active Leads</p>
                  <p className="text-xl font-semibold text-slate-900 leading-none">{counts.total}</p>
                  <p className="text-[10px] font-bold text-indigo-500 mt-2 flex items-center gap-1">
                     <span className="w-1 h-1 bg-indigo-500 rounded-full" />
                     {counts.thisMonthTotal} this month
                  </p>
               </div>
            </div>
            <div className="w-16 h-8 opacity-40 group-hover:opacity-80 transition-opacity">
               <svg viewBox="0 -5 100 50" className="w-full h-full text-violet-500 stroke-[3] fill-none overflow-visible">
                  <path d="M0,30 Q15,5 30,25 T60,5 T90,30" className="stroke-current" strokeLinecap="round" />
               </svg>
            </div>
         </div>

         <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center border border-rose-100">
                  <Clock size={22} />
               </div>
               <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Overdue</p>
                  <p className="text-xl font-semibold text-rose-500 leading-none">{counts.priority}</p>
                  <p className="text-[10px] font-bold text-rose-400 mt-2 flex items-center gap-1">
                     <span className="w-1 h-1 bg-rose-400 rounded-full" />
                     Requires action
                  </p>
               </div>
            </div>
            <div className="w-16 h-8 opacity-40 group-hover:opacity-80 transition-opacity">
               <svg viewBox="0 -5 100 50" className="w-full h-full text-rose-400 stroke-[3] fill-none overflow-visible">
                  <path d="M0,35 Q20,10 40,25 T70,15 T100,10" className="stroke-current" strokeLinecap="round" />
               </svg>
            </div>
         </div>

         <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <BarChart3 size={22} />
               </div>
               <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Success</p>
                  <p className="text-xl font-semibold text-emerald-600 leading-none">{counts.success}</p>
                  <p className="text-[10px] font-bold text-emerald-500 mt-2 flex items-center gap-1">
                     <span className="w-1 h-1 bg-emerald-500 rounded-full" />
                     {counts.thisMonthSuccess} converted this month
                  </p>
               </div>
            </div>
            <div className="w-16 h-8 opacity-40 group-hover:opacity-80 transition-opacity">
               <svg viewBox="0 -5 100 50" className="w-full h-full text-emerald-500 stroke-[3] fill-none overflow-visible">
                  <path d="M0,35 L20,30 L40,15 L60,25 L80,15 L100,10" className="stroke-current" strokeLinecap="round" />
               </svg>
            </div>
         </div>

         <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg border border-indigo-100">
                  ₹
               </div>
               <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Revenue</p>
                  <p className="text-xl font-semibold text-slate-900 leading-none">₹{counts.revenue.toLocaleString()}</p>
                  <p className="text-[10px] font-bold text-indigo-400 mt-2 flex items-center gap-1">
                     <span className="w-1 h-1 bg-indigo-500 rounded-full" />
                     ₹{counts.thisMonthRevenue.toLocaleString()} this month
                  </p>
               </div>
            </div>
            <div className="w-16 h-8 opacity-40 group-hover:opacity-80 transition-opacity">
               <svg viewBox="0 -5 100 50" className="w-full h-full text-indigo-600 stroke-[3] fill-none overflow-visible">
                  <path d="M0,35 Q10,35 20,25 T40,25 T60,20 T80,20 T100,10" className="stroke-current" strokeLinecap="round" />
               </svg>
            </div>
         </div>
      </div>

      {/* 💎 SALES PIPELINE OVERVIEW (Exclusive for Sales Team) */}
      {user?.role === 'sales-team' && (
         <PerformanceOverviewHub 
            rawFollowUps={rawLeads.followUp}
            rawConverted={rawLeads.converted}
            rawNotConverted={rawLeads.notConverted}
            counts={counts}
         />
      )}

      {/* Main Content Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
         <div className="lg:col-span-12 space-y-6">
            <div className="flex items-center justify-between mb-2">
               <div className="flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-brand-primary rounded-full" />
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight uppercase">Sales Pipeline Operation</h2>
               </div>
            </div>
            <PersonalPipeline 
              data={rawLeads} 
              loading={loading} 
              onUpdate={refetch} 
            />
         </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-3">
         <div className="p-3 bg-slate-50 text-slate-400 rounded-full">
            <Clock size={24} />
         </div>
         <div>
            <h4 className="text-sm font-bold text-slate-900 uppercase">Project Tracking Module</h4>
            <p className="text-[11px] font-medium text-slate-500 mt-1 max-w-xs mx-auto">
               We are currently finalizing the task management and project timeline features. Stay tuned for the next update.
            </p>
         </div>
      </div>
    </div>
  );
};

export default UserDashboard;
