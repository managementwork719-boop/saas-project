'use client';
import React from 'react';
import { 
  ArrowLeft,
  Search,
  Plus
} from 'lucide-react';
import Skeleton, { TableSkeleton } from '@/components/Skeleton';
import LeadRow from './LeadRow';

const LeadTable = ({ 
  leads, 
  activeTab, 
  setActiveTab, 
  searchTerm, 
  setSearchTerm, 
  isLoading, 
  isFetching,
  pagination,
  page,
  setPage,
  onAddManual,
  ...handlers 
}) => {
  const tabs = [
    { id: 'origin', label: 'Origin', count: pagination.totalOrigin },
    { id: 'follow-up', label: 'Follow Up', count: pagination.totalFollowUp },
    { id: 'converted', label: 'Converted', count: pagination.totalConverted },
    { id: 'not-converted', label: 'Not Converted', count: pagination.totalNotConverted },
  ];

  return (
    <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full animate-in fade-in slide-in-from-bottom-8 delay-300">
      {/* Table Header / Toolbar */}
      <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/30">
        <div className="flex bg-white p-1 rounded-xl border border-slate-200/60 shadow-sm">
          {tabs.map((tab) => (
            <div key={tab.id} className="flex items-center">
              <button
                onClick={() => { setActiveTab(tab.id); setPage(1); }}
                className={`px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                  activeTab === tab.id 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                }`}
              >
                {tab.label} 
                <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {tab.count || 0}
                </span>
              </button>
              {tab.id === 'not-converted' && (
                <button 
                  onClick={handlers.onUploadClick}
                  className="ml-1 p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                  title="Import Excel"
                >
                  <Plus size={14} />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Search leads..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-brand-shadow outline-none transition-all"
            />
          </div>
          <button 
            onClick={onAddManual}
            className="px-4 py-2.5 bg-brand-primary text-white rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-brand-hover shadow-lg shadow-brand-shadow transition-all flex items-center gap-2 shrink-0"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">Add Lead</span>
          </button>
        </div>
      </div>

      {/* Table Body */}
      <div className="flex-1 overflow-x-auto relative min-h-[400px]">
        {isLoading ? (
          <div className="p-8">
            <TableSkeleton />
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">#</th>
                <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Lead Info</th>
                <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Contact</th>
                {activeTab === 'origin' && (
                  <>
                    <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Requirement</th>
                    <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">Actions</th>
                  </>
                )}
                {/* ... other tab-specific headers ... */}
                {/* For brevity, I'll consolidate the headers in the full implementation */}
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Settings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {leads.map((lead, idx) => (
                <LeadRow 
                  key={lead._id} 
                  lead={lead} 
                  idx={idx} 
                  activeTab={activeTab} 
                  {...handlers} 
                />
              ))}
              {leads.length === 0 && !isFetching && (
                <tr>
                  <td colSpan="20" className="py-20 text-center font-bold text-slate-300 text-sm uppercase tracking-widest">
                    No data available for this stage.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {isFetching && (
          <div className="absolute top-0 left-0 right-0 h-1 z-20 overflow-hidden">
            <div className="h-full bg-brand-primary animate-shimmer shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-100 flex justify-between items-center">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Showing {leads.length} of {pagination.totalLeads || 0} leads
        </span>
        <div className="flex gap-2">
          <button 
            disabled={page === 1 || isFetching}
            onClick={() => setPage(p => p - 1)}
            className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:bg-white disabled:opacity-30 transition-all"
          >
            <ArrowLeft size={14} />
          </button>
          <div className="flex items-center gap-1.5">
            <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 shadow-sm">{page}</span>
            <span className="text-[11px] font-bold text-slate-400">/ {pagination.totalPages || 1}</span>
          </div>
          <button 
            disabled={page === pagination.totalPages || isFetching}
            onClick={() => setPage(p => p + 1)}
            className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:bg-white disabled:opacity-30 transition-all rotate-180"
          >
            <ArrowLeft size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeadTable;
