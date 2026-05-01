import React, { useState, useEffect, useMemo } from 'react';
import { X, Check, Calendar, ChevronDown, Filter, Zap, Target, AlertCircle, Clock, CheckCircle2, User, Layout, BarChart3, Star, Briefcase } from 'lucide-react';

const ProjectFilterSidebar = ({ isOpen, onClose, onApply, currentFilters, managers = [], projects = [] }) => {
  const defaultFilters = {
    quickFilter: 'All',
    project: '',
    manager: '',
    status: [],
    priority: [],
    dateRange: { start: '', end: '' },
    progressRange: [0, 100]
  };

  const [filters, setFilters] = useState(currentFilters || defaultFilters);

  useEffect(() => {
    if (isOpen) {
      setFilters(currentFilters || defaultFilters);
    }
  }, [isOpen, currentFilters]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.quickFilter !== 'All') count++;
    if (filters.project) count++;
    if (filters.manager) count++;
    if (filters.status.length > 0) count++;
    if (filters.priority.length > 0) count++;
    if (filters.dateRange.start || filters.dateRange.end) count++;
    if (filters.progressRange[0] !== 0 || filters.progressRange[1] !== 100) count++;
    return count;
  }, [filters]);

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters(defaultFilters);
    onApply(defaultFilters);
    onClose();
  };

  const toggleStatus = (status) => {
    const updated = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status];
    setFilters({ ...filters, status: updated });
  };

  const togglePriority = (priority) => {
    const updated = filters.priority.includes(priority)
      ? filters.priority.filter(p => p !== priority)
      : [...filters.priority, priority];
    setFilters({ ...filters, priority: updated });
  };

  const handleDatePreset = (preset) => {
    const now = new Date();
    let start = '';
    let end = '';

    if (preset === 'This Month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    } else if (preset === 'Last Month') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
      end = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
    }

    setFilters({ ...filters, dateRange: { start, end } });
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-[1px] z-[200] transition-opacity" onClick={onClose} />
      
      <div className="fixed right-0 top-0 bottom-0 w-[340px] bg-white shadow-2xl z-[210] flex flex-col animate-in slide-in-from-right duration-300 font-inter border-l border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-lg shadow-violet-100">
              <Filter size={18} />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">Filters</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Global Overview</p>
            </div>
            {activeFiltersCount > 0 && (
              <span className="ml-1 w-5 h-5 rounded-full bg-violet-100 text-violet-600 text-[10px] font-black flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 text-slate-400 rounded-xl transition-all">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-7 custom-scrollbar">
          
          {/* Quick Filters */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-400">
              <Zap size={12} />
              <label className="text-xs font-black uppercase tracking-widest">Presets</label>
            </div>
            <div className="flex flex-wrap gap-2">
              {['All', 'On Track', 'At Risk', 'Delayed', 'Completed'].map(qf => (
                <button
                  key={qf}
                  onClick={() => setFilters({ ...filters, quickFilter: qf })}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                    filters.quickFilter === qf 
                      ? 'bg-violet-600 border-violet-600 text-white shadow-md shadow-violet-50' 
                      : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {qf}
                </button>
              ))}
            </div>
          </div>

          {/* Selections */}
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Briefcase size={12} /> Project
              </label>
              <div className="relative group">
                <select 
                  value={filters.project}
                  onChange={e => setFilters({ ...filters, project: e.target.value })}
                  className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-700 outline-none appearance-none focus:border-violet-500 focus:bg-white transition-all cursor-pointer"
                >
                  <option value="">All Active Projects</option>
                  {projects.map(p => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <User size={12} /> Manager
              </label>
              <div className="relative group">
                <select 
                  value={filters.manager}
                  onChange={e => setFilters({ ...filters, manager: e.target.value })}
                  className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-700 outline-none appearance-none focus:border-violet-500 focus:bg-white transition-all cursor-pointer"
                >
                  <option value="">All Managers</option>
                  {managers.map(m => (
                    <option key={m.id} value={m.name}>{m.name}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Status Grid */}
          <div className="space-y-3">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <BarChart3 size={12} /> Status
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { id: 'on-track', label: 'On Track', color: 'bg-emerald-500' },
                { id: 'at-risk', label: 'At Risk', color: 'bg-orange-500' },
                { id: 'delayed', label: 'Delayed', color: 'bg-rose-500' },
                { id: 'completed', label: 'Completed', color: 'bg-indigo-500' }
              ].map(s => {
                const isActive = filters.status.includes(s.id);
                return (
                  <button 
                    key={s.id} 
                    onClick={() => toggleStatus(s.id)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-2xl border transition-all ${
                      isActive ? 'bg-violet-50 border-violet-200' : 'bg-white border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-lg border flex items-center justify-center ${isActive ? 'bg-violet-600 border-violet-600' : 'bg-white border-slate-200'}`}>
                      {isActive && <Check size={10} className="text-white" strokeWidth={3} />}
                    </div>
                    <span className={`text-xs font-bold ${isActive ? 'text-violet-900' : 'text-slate-600'}`}>{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-3">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Star size={12} /> Priority
            </label>
            <div className="flex gap-2">
              {['High', 'Medium', 'Low'].map(p => {
                const isActive = filters.priority.includes(p);
                return (
                  <button
                    key={p}
                    onClick={() => togglePriority(p)}
                    className={`flex-1 py-3 rounded-2xl text-xs font-bold border transition-all ${
                      isActive 
                        ? 'bg-slate-900 border-slate-900 text-white shadow-lg' 
                        : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Timeline */}
          <div className="space-y-3">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Calendar size={12} /> Timeline
            </label>
            <div className="grid grid-cols-2 gap-3">
               <div className="col-span-2 relative">
                <select 
                  onChange={e => handleDatePreset(e.target.value)}
                  className="w-full pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-500 outline-none appearance-none focus:border-violet-500 transition-all"
                >
                  <option value="">Presets</option>
                  <option value="This Month">This Month</option>
                  <option value="Last Month">Last Month</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" />
               </div>
               <div className="space-y-1">
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">From</span>
                 <input 
                    type="date" 
                    value={filters.dateRange.start}
                    onChange={e => setFilters({ ...filters, dateRange: { ...filters.dateRange, start: e.target.value } })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 outline-none focus:bg-white focus:border-violet-500"
                  />
               </div>
               <div className="space-y-1">
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">To</span>
                 <input 
                    type="date" 
                    value={filters.dateRange.end}
                    onChange={e => setFilters({ ...filters, dateRange: { ...filters.dateRange, end: e.target.value } })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 outline-none focus:bg-white focus:border-violet-500"
                  />
               </div>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Layout size={12} /> Progress
              </label>
              <span className="text-xs font-black text-violet-600">{filters.progressRange[0]}% - {filters.progressRange[1]}%</span>
            </div>
            <div className="px-1 space-y-4">
               <div className="relative h-1.5 bg-slate-100 rounded-full">
                  <div 
                    className="absolute h-full bg-violet-600 rounded-full shadow-sm"
                    style={{ left: `${filters.progressRange[0]}%`, right: `${100 - filters.progressRange[1]}%` }}
                  />
               </div>
               <div className="flex gap-4">
                  <input 
                    type="range" min="0" max="100" 
                    value={filters.progressRange[0]}
                    onChange={e => {
                      const val = parseInt(e.target.value);
                      setFilters({ ...filters, progressRange: [val, Math.max(val, filters.progressRange[1])] });
                    }}
                    className="flex-1 h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-violet-600" 
                  />
                  <input 
                    type="range" min="0" max="100" 
                    value={filters.progressRange[1]}
                    onChange={e => {
                      const val = parseInt(e.target.value);
                      setFilters({ ...filters, progressRange: [Math.min(val, filters.progressRange[0]), val] });
                    }}
                    className="flex-1 h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-violet-600" 
                  />
               </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 bg-white border-t border-slate-100 flex gap-3">
          <button 
            onClick={handleReset}
            className="flex-1 py-3 text-slate-400 hover:text-slate-900 text-xs font-black uppercase tracking-widest transition-all"
          >
            Reset
          </button>
          <button 
            onClick={handleApply}
            className="flex-[2] py-3.5 bg-violet-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-violet-700 transition-all shadow-xl shadow-violet-100 active:scale-95"
          >
            Apply Filters
          </button>
        </div>

      </div>
    </>
  );
};

export default ProjectFilterSidebar;
