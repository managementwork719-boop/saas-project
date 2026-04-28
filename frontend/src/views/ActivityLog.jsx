'use client';
import React, { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react';
import API from '../api/axios';
import { 
  History, Search, ChevronLeft, ChevronRight, Calendar, User, Shield, Activity, 
  Globe, CheckCircle2, XCircle, CreditCard, Target, Users, RefreshCw, BarChart3, 
  PieChart as PieIcon, Zap, TrendingDown, ArrowUpRight, LayoutGrid, Info
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, ComposedChart
} from 'recharts';
import { ActivityLogSkeleton } from '@/components/Skeleton';

// --- Components ---

const StatCard = memo(({ label, val, color, icon: Icon, trend }) => (
  <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between group hover:border-violet-200 transition-all">
    <div>
      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none">{label}</p>
      <div className="flex items-baseline gap-1">
        <h4 className="text-xl font-black text-slate-900 tracking-tight leading-none">{val}</h4>
        {trend && <span className="text-[6px] font-black text-emerald-500 uppercase leading-none opacity-50 group-hover:opacity-100 transition-opacity">{trend}</span>}
      </div>
    </div>
    <Icon className={`text-${color}-500 opacity-20 group-hover:opacity-100 transition-opacity duration-500`} size={22} />
  </div>
));

const ActivityTrendChart = memo(({ data }) => (
  <div className="lg:col-span-8 bg-white p-6 rounded-[28px] border border-slate-200/60 shadow-xl overflow-hidden relative group">
    <div className="flex items-center justify-between mb-5 px-1">
      <div>
        <h3 className="text-[11px] font-black text-slate-900 uppercase flex items-center gap-2 leading-none">
          Operational Velocity
          <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
        </h3>
        <p className="text-[9px] font-black text-slate-300 uppercase mt-1 tracking-widest">Last 7 Audit Sessions</p>
      </div>
      <ArrowUpRight size={18} className="text-violet-600 p-1 bg-violet-50 rounded-lg group-hover:rotate-12 transition-transform" />
    </div>
    <div className="h-44 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data}>
          <defs>
            <linearGradient id="cVelo" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} />
          <YAxis hide />
          <Tooltip contentStyle={{ borderRadius: '14px', border: 'none', boxShadow: '0 8px 12px -1px rgb(0 0 0 / 0.1)', fontSize: '9px', fontWeight: 800 }} />
          <Area type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={3} fill="url(#cVelo)" animationDuration={1200} />
          <Bar dataKey="count" barSize={6} fill="#f1f5f9" radius={[3, 3, 0, 0]} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  </div>
));

const ModulePieChart = memo(({ data, colors }) => (
  <div className="lg:col-span-4 bg-slate-950 p-6 rounded-[28px] shadow-2xl relative overflow-hidden border border-slate-800 flex flex-col justify-center text-center">
    <h3 className="text-[10px] font-black text-white/40 uppercase mb-6 tracking-[0.2em] leading-none">Infrastucture Splits</h3>
    <div className="h-32 relative mb-4">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} innerRadius={40} outerRadius={55} paddingAngle={5} dataKey="value" animationBegin={200}>
            {data.map((entry, index) => <Cell key={`cell-${index}`} fill={colors[index % colors.length]} cornerRadius={4} />)}
          </Pie>
          <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', backgroundColor: '#0f172a', color: '#fff', fontSize: '9px', fontWeight: 800 }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <p className="text-xl font-black text-white leading-none tracking-tight">{data.length}</p>
        <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest mt-1">Nodes</p>
      </div>
    </div>
    <div className="flex flex-wrap gap-1.5 justify-center opacity-70">
      {data.slice(0, 4).map((d, i) => (
        <div key={i} className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: colors[i % colors.length] }} />
          <span className="text-[8px] font-black text-slate-300 uppercase tracking-tighter truncate max-w-[60px]">{d.name}</span>
        </div>
      ))}
    </div>
  </div>
));

// --- Main Component ---

const ActivityLog = () => {
  const [view, setView] = useState('logs');
  const [logs, setLogs] = useState([]);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ module: '', role: '', startDate: '', endDate: '' });

  const debouncedSearch = useRef('');
  const searchTimeout = useRef(null);

  const modules = ['Auth', 'Sales', 'Billing', 'Team', 'Clients', 'System'];
  const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#7c3aed', '#ec4899', '#64748b'];

  const fetchLogs = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const params = { page, limit: 14, search: debouncedSearch.current, ...filters };
      const res = await API.get('/activity-logs', { params, withCredentials: true });
      setLogs(res.data.data.logs);
      setTotal(res.data.total);
      setTotalPages(res.data.data.pagination.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  const fetchInsights = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get('/activity-logs/insights', { withCredentials: true });
      setInsights(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    view === 'logs' ? fetchLogs() : fetchInsights();
  }, [fetchLogs, fetchInsights, view]);

  const handleSearchChange = (val) => {
    setSearchQuery(val);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      debouncedSearch.current = val;
      setPage(1);
      fetchLogs();
    }, 400);
  };

  const handleExport = async () => {
    try {
      const queryParams = new URLSearchParams({ search: debouncedSearch.current, ...filters });
      const response = await API.get(`/activity-logs/export?${queryParams}`, {
        withCredentials: true,
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `activity_logs_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const getModuleConfig = (module) => {
    const map = {
      'Auth': { icon: <Shield size={12} />, color: '#2563eb', bg: 'bg-blue-50', text: 'text-blue-600' },
      'Sales': { icon: <Target size={12} />, color: '#d97706', bg: 'bg-amber-50', text: 'text-amber-600' },
      'Billing': { icon: <CreditCard size={12} />, color: '#059669', bg: 'bg-emerald-50', text: 'text-emerald-600' },
      'Team': { icon: <Users size={12} />, color: '#4f46e5', bg: 'bg-indigo-50', text: 'text-indigo-600' },
      'Clients': { icon: <User size={12} />, color: '#7c3aed', bg: 'bg-violet-50', text: 'text-violet-600' }
    };
    return map[module] || { icon: <Activity size={12} />, color: '#64748b', bg: 'bg-slate-50', text: 'text-slate-600' };
  };

  const trendData = useMemo(() => 
    insights?.activityTrend?.map(t => ({ day: t._id.split('-').slice(2).join('/'), count: t.count })) || [], 
  [insights]);

  const pieData = useMemo(() => 
    insights?.moduleStats?.map(s => ({ name: s._id, value: s.count })) || [], 
  [insights]);

  if (loading) return <ActivityLogSkeleton />;

  return (
    <div className="max-w-[1240px] mx-auto space-y-4 px-4 md:px-0 mb-8 min-h-screen">
      {/* Balanced Dashboard Header */}
      <div className="flex items-center justify-between py-2.5 border-b border-slate-100/50">
        <div className="flex items-center gap-4 group">
          <div className="p-3.5 bg-slate-900 rounded-[20px] text-white shadow-xl shadow-slate-200 transition-all group-hover:rotate-6 group-hover:scale-105 duration-500">
            {view === 'logs' ? <LayoutGrid size={22} /> : <BarChart3 size={22} />}
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tighter leading-none flex items-center gap-3 uppercase">
              Operational Portal
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            </h1>
            <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-[0.2em] italic flex items-center gap-2">
               <Shield size={11} className="text-violet-500" /> {view === 'logs' ? 'Audit Snapshot' : 'Deep Analytics'} 
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2.5">
           {view === 'logs' && (
             <button onClick={handleExport} className="px-4 py-2.5 bg-violet-600 text-white rounded-[14px] text-[10px] font-bold uppercase tracking-widest hover:bg-violet-700 transition-all shadow-lg shadow-violet-100 flex items-center gap-2 active:scale-95">
                <CreditCard size={14} />
                Download Report
             </button>
           )}
           
           <div className="bg-slate-100 p-1 rounded-[16px] flex gap-1 shadow-inner border border-slate-200/40">
              {['logs', 'insights'].map(v => (
                <button 
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-5 py-2 rounded-[14px] text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${view === v ? 'bg-white text-slate-900 shadow-md scale-100' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {v === 'logs' ? 'LOG FEED' : 'ANALYTICS'}
                </button>
              ))}
           </div>

           {view === 'logs' && (
             <button onClick={() => fetchLogs(true)} className="p-2.5 bg-white border border-slate-200 rounded-[14px] text-slate-400 hover:text-violet-600 transition-all active:scale-95 group">
                <RefreshCw size={18} className={loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
             </button>
           )}
        </div>
      </div>

      {view === 'logs' ? (
        <div className="space-y-3 animate-in fade-in duration-500">
          <div className="bg-white/80 backdrop-blur-xl p-2.5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-600 transition-colors" size={15} />
              <input 
                type="text"
                placeholder="Search operational logs..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-[11px] font-bold text-slate-700 outline-none transition-all focus:bg-white focus:ring-1 focus:ring-violet-500/20"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select 
                className="bg-slate-50 border-none rounded-xl text-[10px] font-black uppercase px-3 py-2 outline-none cursor-pointer hover:bg-slate-100"
                value={filters.module}
                onChange={(e) => setFilters({...filters, module: e.target.value})}
              >
                <option value="">ALL MODULES</option>
                {modules.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <select 
                className="bg-slate-50 border-none rounded-xl text-[10px] font-black uppercase px-3 py-2 outline-none cursor-pointer hover:bg-slate-100"
                value={filters.role}
                onChange={(e) => setFilters({...filters, role: e.target.value})}
              >
                <option value="">ALL ROLES</option>
                {['admin', 'sales-manager', 'sales-team', 'project-manager', 'project-team', 'accounts-manager', 'accounts-team'].map(r => (
                  <option key={r} value={r}>{r.replace('-', ' ').toUpperCase()}</option>
                ))}
              </select>
              <div className="flex items-center gap-2 bg-slate-50 px-3 rounded-xl border border-slate-100">
                <Calendar size={12} className="text-slate-400" />
                <div className="flex items-center gap-1.5">
                  <input 
                    type="date" 
                    className="bg-transparent border-none text-[9px] font-black p-0 outline-none w-24 h-8" 
                    value={filters.startDate} 
                    onChange={(e) => setFilters({...filters, startDate: e.target.value})} 
                  />
                  <span className="text-[10px] font-black text-slate-300">TO</span>
                  <input 
                    type="date" 
                    className="bg-transparent border-none text-[9px] font-black p-0 outline-none w-24 h-8" 
                    value={filters.endDate} 
                    onChange={(e) => setFilters({...filters, endDate: e.target.value})} 
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[20px] border border-slate-200/60 shadow-xl overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Actor</th>
                    <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Activity</th>
                    <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Narrative</th>
                    <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Origin</th>
                    <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center leading-none">Time</th>
                    <th className="px-5 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center leading-none">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {logs.length === 0 ? (
                    <tr><td colSpan="6" className="py-20 text-center text-[10px] font-black text-slate-200 uppercase tracking-widest italic">Zero Traces Found</td></tr>
                  ) : logs.map((log) => {
                    const cfg = getModuleConfig(log.module);
                    return (
                      <tr key={log._id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-5 py-2.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center text-white text-[10px] font-black">{log.userName.charAt(0).toUpperCase()}</div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-800 leading-tight uppercase tracking-tight">{log.userName}</p>
                              <p className="text-[8px] font-bold text-slate-400 mt-0.5 uppercase">{log.role.replace('-', ' ')}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <div className={`p-1 ${cfg.bg} ${cfg.text} rounded`}>{cfg.icon}</div>
                            <p className="text-[11px] font-bold text-slate-700 tracking-tight">{log.action}</p>
                          </div>
                        </td>
                        <td className="px-5 py-2.5 max-w-[220px]">
                          <p className="text-[10px] font-medium text-slate-500 line-clamp-1 italic">{log.description}</p>
                        </td>
                        <td className="px-5 py-2.5"><span className="text-[10px] font-mono text-slate-400 font-bold">{log.ipAddress}</span></td>
                        <td className="px-5 py-2.5 text-center"><span className="text-[11px] font-bold text-slate-900 tracking-tighter">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></td>
                        <td className="px-5 py-2.5 text-center">
                          <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase ${log.status === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                            {log.status === 'success' ? 'OK' : 'FAIL'}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 border-t border-slate-50 bg-slate-50/20 flex items-center justify-between">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{total} Total Trace Logs</span>
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-bold text-slate-400 uppercase">Page {page} of {totalPages}</span>
                <div className="flex gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} className="p-1 rounded-md bg-white border disabled:opacity-20 transition-all active:scale-95"><ChevronLeft size={14}/></button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="p-1 rounded-md bg-white border disabled:opacity-20 transition-all active:scale-95"><ChevronRight size={14}/></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in zoom-in-98 duration-500">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="Activity Vol" val={total} color="violet" icon={Zap} />
            <StatCard label="System Actors" val={insights?.userStats?.length || 0} color="slate" icon={User} />
            <StatCard label="SLA Health" val="99.9%" color="emerald" icon={CheckCircle2} />
            <StatCard label="Security Flags" val={insights?.statusStats?.find(s => s._id === 'fail')?.count || 0} color="rose" icon={TrendingDown} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <ActivityTrendChart data={trendData} />
            <ModulePieChart data={pieData} colors={COLORS} />
          </div>
          <div className="bg-white p-5 rounded-[28px] border border-slate-200/60 shadow-sm">
            <div className="flex items-center justify-between mb-5 border-b border-slate-50 pb-3">
              <h3 className="text-[11px] font-black text-slate-900 uppercase flex items-center gap-2 tracking-widest"><BarChart3 size={15} /> Top Principal Performance</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {insights?.userStats?.slice(0, 3).map((u, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50/50 hover:bg-white transition-all shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-[11px]">{u._id.charAt(0)}</div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1.5 font-black text-[10px]"><span className="text-slate-800 uppercase">{u._id}</span><span className="text-violet-600">{u.count} PKT</span></div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-violet-500 transition-all duration-1000" style={{ width: `${(u.count / (insights.userStats[0]?.count || 1)) * 100}%` }} /></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="text-center py-6 border-t border-slate-100/60 mt-4 opacity-30">
         <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.5em]">PROTECTED BY WORKSENSY PROTOCOL • NODE.SECURE_SESSION</p>
      </div>
    </div>
  );
};

export default memo(ActivityLog);
