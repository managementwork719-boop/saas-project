'use client';
import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import { 
  Target, 
  Phone, 
  Mail, 
  CheckCircle2, 
  MessageSquare,
  History,
  TrendingUp,
  Layers,
  NotebookPen,
  Wallet
} from 'lucide-react';
import LeadConversationModal from './LeadConversationModal';
import PaymentHistoryModal from './PaymentHistoryModal';
import ClientProfileModal from './ClientProfileModal';

const isToday = (dateString) => {
  if (!dateString) return false;
  const date = new Date(dateString);
  const today = new Date();
  return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
};

const isOverdue = (dateString) => {
  if (!dateString) return false;
  const date = new Date(dateString);
  const now = new Date();
  return date < now;
};

const PersonalPipeline = ({ data, loading, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('follow-up');
  const [selectedLeadForNote, setSelectedLeadForNote] = useState(null);
  const [selectedLeadForPayment, setSelectedLeadForPayment] = useState(null);
  const [selectedLeadForDetail, setSelectedLeadForDetail] = useState(null);

  const handleQuickConvert = async (leadId) => {
    if (!window.confirm('Mark this lead as Converted?')) return;
    try {
      await API.patch(`/sales/lead/${leadId}`, { status: 'converted' });
      if (onUpdate) onUpdate();
    } catch (err) {
      alert('Failed to convert lead');
    }
  };

  const { currentLeads, stats } = React.useMemo(() => {
    const fUp = data?.followUp || [];
    const conv = data?.converted || [];

    const leads = activeTab === 'follow-up' ? fUp : conv;
    
    const attentionCount = 
      fUp.filter(l => isOverdue(l.nextFollowUp)).length + 
      conv.filter(l => isOverdue(l.deadline) && l.deliveryStatus !== 'completed').length;
      
    const totalRev = conv.reduce((acc, l) => acc + (l.totalAmount || l.budget || 0), 0);
    
    return {
      currentLeads: leads,
      stats: {
        active: fUp.length,
        attention: attentionCount,
        success: conv.length,
        revenue: totalRev
      }
    };
  }, [activeTab, data]);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/60 shadow-[0_4px_25px_rgba(0,0,0,0.02)] overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-700">
      {/* Light Action Header */}
      <div className="p-6 border-b border-slate-100 bg-white flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex items-center gap-4">
               <div className={`w-12 h-12 rounded-[36px] flex items-center justify-center shadow-sm ${activeTab === 'follow-up' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                  {activeTab === 'follow-up' ? <Target size={22} /> : <CheckCircle2 size={22} />}
               </div>
               <div>
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight uppercase">
                    {activeTab === 'follow-up' ? 'Lead Pipeline' : 'Converted Deals'}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    {activeTab === 'follow-up' ? 'Monitoring High Priority Actions' : 'Archive of Successfully Closed Deals'}
                  </p>
               </div>
            </div>
            
            <div className="flex bg-slate-100 p-1.5 rounded-[36px]">
               {['follow-up', 'converted'].map(tab => (
                 <button 
                   key={tab}
                   onClick={() => setActiveTab(tab)}
                   className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${
                     activeTab === tab ? 'bg-white text-indigo-900 shadow-md scale-100' : 'text-slate-400 hover:text-slate-600'
                   }`}
                 >
                   {tab.replace('-', ' ')}
                 </button>
               ))}
            </div>
      </div>

      {/* Light Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-100 border-b border-slate-100">
         <div className="bg-white p-5 text-center">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Active Logs</p>
            <p className="text-xl font-bold text-slate-900">{stats.active}</p>
         </div>
         <div className="bg-white p-5 text-center">
            <p className="text-[9px] font-bold text-rose-500 uppercase tracking-widest mb-1.5">Attention</p>
            <p className="text-xl font-bold text-rose-500">{stats.attention}</p>
         </div>
         <div className="bg-white p-5 text-center">
            <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mb-1.5">Success Rate</p>
            <p className="text-xl font-bold text-emerald-500">{stats.success}</p>
         </div>
         <div className="bg-white p-5 text-center">
            <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest mb-1.5">Total Revenue</p>
            <p className="text-xl font-bold text-indigo-600">₹{stats.revenue.toLocaleString()}</p>
         </div>
      </div>

      <div className="overflow-x-auto pb-4">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-50/30">
              <th className="px-8 py-5 border-b border-slate-100">Lead ID</th>
              <th className="px-8 py-5 border-b border-slate-100">Client Profile</th>
              <th className="px-8 py-5 border-b border-slate-100">Project Scope</th>
              <th className="px-8 py-5 border-b border-slate-100">{activeTab === 'follow-up' ? 'Next Action' : 'Closed Date'}</th>
              <th className="px-8 py-5 border-b border-slate-100 text-right">Operations</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50/60">
            {loading ? (
               <tr>
                  <td colSpan="5" className="py-16 text-center">
                     <div className="flex flex-col items-center gap-3">
                        <div className="w-6 h-6 border-2 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin" />
                        <span className="text-slate-300 font-bold text-[10px] uppercase tracking-widest">Synchronizing Pipeline...</span>
                     </div>
                  </td>
               </tr>
            ) : currentLeads.length === 0 ? (
               <tr>
                  <td colSpan="5" className="py-20 text-center">
                     <div className="flex flex-col items-center gap-2 opacity-20">
                        {activeTab === 'follow-up' ? <History size={40} /> : <TrendingUp size={40} />}
                        <p className="font-bold text-xs uppercase tracking-widest">No Record Available</p>
                     </div>
                  </td>
               </tr>
            ) : (
              currentLeads.map((lead) => {
                const isItemOverdue = (activeTab === 'converted' && isOverdue(lead.deadline) && lead.deliveryStatus !== 'completed') || 
                                     (activeTab === 'follow-up' && isOverdue(lead.nextFollowUp));
                return (
                <tr 
                  key={lead._id} 
                  className={`group hover:bg-slate-50/80 transition-all border-l-4 
                    ${isItemOverdue ? 'bg-red-100 border-red-500 animate-pulse-slow' : activeTab === 'follow-up' ? 'hover:border-amber-500' : 'hover:border-emerald-500'}`}
                >
                  <td className="px-6 py-4">
                     <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border transition-colors ${
                       activeTab === 'follow-up' 
                       ? 'bg-amber-50 text-amber-700 border-amber-100 group-hover:bg-white' 
                       : 'bg-emerald-50 text-emerald-700 border-emerald-100 group-hover:bg-white'
                     }`}>
                        {lead.leadId}
                     </span>
                  </td>
                  <td className="px-6 py-4">
                    <div 
                      className="flex flex-col cursor-pointer group/name"
                      onClick={() => setSelectedLeadForDetail(lead)}
                    >
                      <span className="text-xs font-bold text-slate-900 group-hover/name:text-brand-primary transition-colors">{lead.name}</span>
                      <span className="text-[10px] text-slate-400 font-medium">{lead.email || 'No Email'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                     <div className="text-[11px] text-slate-600 font-bold max-w-[180px] truncate">{lead.requirement || lead.workType || '-'}</div>
                     {activeTab === 'converted' && (
                       <div className="text-[10px] font-bold text-emerald-600 tracking-tight mt-0.5">Deal Closed at ₹{(lead.totalAmount || lead.budget || 0).toLocaleString()}</div>
                     )}
                  </td>
                  <td className="px-6 py-4">
                      {activeTab === 'follow-up' ? (
                         <div className={`${isOverdue(lead.nextFollowUp) ? 'text-red-600 bg-red-50' : isToday(lead.nextFollowUp) ? 'text-amber-600 bg-amber-50' : 'text-slate-600 bg-slate-100'} px-2.5 py-1 rounded-3xl inline-block text-[10px] font-bold uppercase tracking-wider border border-transparent group-hover:border-current transition-all`}>
                            {lead.nextFollowUp ? new Date(lead.nextFollowUp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Set Date'}
                         </div>
                      ) : (
                         <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5">
                               <div className={`${isItemOverdue ? 'text-rose-600 bg-rose-100 animate-pulse' : 'text-emerald-700 bg-emerald-50'} font-bold text-[11px] uppercase tracking-tight px-2 py-0.5 rounded`}>
                                 {lead.assignedTo || 'Unassigned'}
                               </div>
                               {isItemOverdue && <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">Critical</span>}
                            </div>
                            <div className="text-[9px] text-slate-400 font-medium">Closed on {new Date(lead.updatedAt).toLocaleDateString()}</div>
                         </div>
                      )}
                  </td>
                  <td className="px-6 py-4 text-right">
                     <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                        {activeTab === 'follow-up' && (
                          <button 
                            onClick={() => handleQuickConvert(lead._id)}
                            className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-3xl transition-all shadow-sm"
                            title="Mark as Converted"
                          >
                             <CheckCircle2 size={14} />
                          </button>
                        )}
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSelectedLeadForNote(lead); }}
                          className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-3xl transition-all shadow-sm"
                          title="Lead Credentials / Notes"
                        >
                           <NotebookPen size={14} />
                        </button>
                        {activeTab === 'converted' && (
                           <button 
                             onClick={(e) => { e.stopPropagation(); setSelectedLeadForPayment(lead); }}
                             className="p-2 bg-pink-50 text-pink-600 hover:bg-pink-600 hover:text-white rounded-3xl transition-all shadow-sm"
                             title="Payment Installments"
                           >
                              <Wallet size={14} />
                           </button>
                        )}
                        <a 
                          href={`https://wa.me/91${lead.phone?.replace(/\D/g, '')}`} 
                          target="_blank" 
                          className="p-2 bg-slate-100 text-slate-600 hover:bg-brand-primary hover:text-white rounded-3xl transition-all shadow-sm"
                          title="Message Client"
                        >
                           <MessageSquare size={14} />
                        </a>
                        <a 
                          href={`tel:${lead.phone}`} 
                          className="p-2 bg-slate-100 text-slate-600 hover:bg-slate-900 hover:text-white rounded-3xl transition-all shadow-sm"
                          title="Call Client"
                        >
                           <Phone size={14} />
                        </a>
                     </div>
                  </td>
                </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      {selectedLeadForNote && (
         <LeadConversationModal 
           lead={selectedLeadForNote} 
           onClose={() => setSelectedLeadForNote(null)} 
           onNoteAdded={onUpdate}
         />
      )}

      {selectedLeadForPayment && (
        <PaymentHistoryModal 
          lead={selectedLeadForPayment} 
          onClose={() => setSelectedLeadForPayment(null)} 
          onPaymentAdded={onUpdate}
        />
      )}

      {selectedLeadForDetail && (
        <ClientProfileModal 
          clientId={selectedLeadForDetail.clientId} 
          onClose={() => setSelectedLeadForDetail(null)} 
        />
      )}
    </div>
  );
};

export default PersonalPipeline;
