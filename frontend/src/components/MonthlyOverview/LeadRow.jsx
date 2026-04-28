'use client';
import React from 'react';
import { 
  Phone, 
  Mail, 
  MessageSquare, 
  Trash2, 
  Edit2, 
  Wallet,
  NotebookPen
} from 'lucide-react';
import PremiumSelect from '@/components/PremiumSelect';
import PremiumDatePicker from '@/components/PremiumDatePicker';

const LeadRow = ({ 
  lead, 
  idx, 
  activeTab, 
  user,
  salesMembers,
  allMembers,
  isSelected,
  handleSelectLead,
  handleOptimisticUpdate,
  handleUpdateLead,
  deleteLead,
  setSelectedLeadForNote,
  setSelectedLeadForPayment,
  setSelectedLeadForDetail,
  setEditModalData
}) => {
  const isItemOverdue = lead.isOverdue; // Assume processed or calculated

  return (
    <tr 
      onClick={() => handleSelectLead(lead._id)}
      className={`group transition-all duration-300 cursor-pointer ${isSelected ? 'bg-indigo-50/30' : 'hover:bg-slate-50/80'}`}
    >
      <td className={`px-6 py-5 first:rounded-l-2xl border-y border-l transition-all ${isSelected ? 'border-brand-primary' : 'border-slate-50'} text-[11px] font-bold text-slate-400`}>
        {idx + 1}
      </td>

      <td className={`px-4 py-5 border-y transition-all ${isSelected ? 'border-brand-primary' : 'border-slate-50'}`}>
        <div 
          className="flex flex-col cursor-pointer hover:text-brand-primary transition-colors"
          onClick={(e) => { e.stopPropagation(); setSelectedLeadForDetail(lead); }}
        >
          <span className="text-[13px] font-bold text-slate-900 leading-tight">{lead.name}</span>
          {lead.leadId && <span className="text-[10px] text-brand-primary font-black uppercase tracking-widest mt-0.5">{lead.leadId}</span>}
          {lead.location && <span className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">{lead.location}</span>}
        </div>
      </td>

      <td className={`px-4 py-5 border-y transition-all ${isSelected ? 'border-brand-primary' : 'border-slate-50'}`}>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 group/contact">
            <span className="text-[12px] text-slate-600 font-bold tracking-tight">{lead.phone || '--'}</span>
            <div className="flex gap-1 opacity-0 group-hover/contact:opacity-100 transition-opacity">
              {lead.phone && (
                <a href={`https://wa.me/91${lead.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-emerald-500 hover:scale-110 transition-transform">
                  <MessageSquare size={12} />
                </a>
              )}
            </div>
          </div>
          {lead.email && <span className="text-[10px] text-slate-400 font-medium lowercase truncate max-w-[120px]">{lead.email}</span>}
        </div>
      </td>

      {activeTab === 'origin' && (
        <>
          <td className={`px-4 py-5 border-y transition-all ${isSelected ? 'border-brand-primary' : 'border-slate-50'}`}>
            <div className="max-w-[200px]">
              <p className="text-[11px] font-bold text-slate-700 line-clamp-1">{lead.workType || lead.requirement || 'Requirement...'}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[9px] font-black text-brand-primary/60 uppercase tracking-widest">{lead.source || 'Direct'}</span>
                {lead.budget && <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">₹{lead.budget}</span>}
              </div>
            </div>
          </td>
          <td className={`px-4 py-5 border-y transition-all ${isSelected ? 'border-brand-primary' : 'border-slate-50'}`}>
             <div className="flex items-center justify-center gap-2">
                <PremiumSelect 
                  value={lead.status}
                  options={[
                    { label: 'Origin', value: 'origin' },
                    { label: 'Follow-up', value: 'follow-up' },
                    { label: 'Converted', value: 'converted' },
                    { label: 'Not Converted', value: 'not-converted' }
                  ]}
                  onChange={(val) => {
                    const updates = { status: val };
                    if (val === 'follow-up' && !lead.nextFollowUp) {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      updates.nextFollowUp = tomorrow;
                    }
                    handleOptimisticUpdate(lead._id, updates);
                  }}
                  variant="status"
                  className="w-32"
                />
                <button 
                  onClick={(e) => { e.stopPropagation(); setSelectedLeadForNote(lead); }}
                  className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-brand-primary rounded-lg transition-all"
                >
                  <NotebookPen size={14} />
                </button>
             </div>
          </td>
        </>
      )}

      {/* Settings / Actions Column */}
      <td className={`px-6 py-5 text-right last:rounded-r-2xl border-y border-r transition-all ${isSelected ? 'border-brand-primary' : 'border-slate-50'}`}>
        <div className="flex items-center justify-end gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={(e) => { e.stopPropagation(); setEditModalData(lead); }}
            className="p-1.5 hover:bg-slate-200 hover:text-brand-primary rounded-lg transition-all"
          >
            <Edit2 size={14} />
          </button>
          <a href={`tel:${lead.phone}`} className="p-1.5 hover:bg-emerald-100 hover:text-emerald-600 rounded-lg transition-all"><Phone size={14} /></a>
          {user?.role !== 'sales-team' && (
            <button 
              onClick={(e) => { e.stopPropagation(); deleteLead(lead._id); }}
              className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-all"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};

export default LeadRow;
