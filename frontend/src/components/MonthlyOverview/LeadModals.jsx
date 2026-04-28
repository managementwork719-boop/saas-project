'use client';
import React from 'react';
import LeadConversationModal from '@/components/LeadConversationModal';
import PaymentHistoryModal from '@/components/PaymentHistoryModal';
import ClientProfileModal from '@/components/ClientProfileModal';
import { X, UserPlus, Edit2, Target, User, Mail, Phone, MapPin, IndianRupee, Plus, Users } from 'lucide-react';

const LeadModals = ({ 
  showManual, 
  setShowManual,
  manualForm,
  setManualForm,
  manualLoading,
  handleManualSubmit,
  editModalData,
  setEditModalData,
  editLoading,
  handleFullEditSubmit,
  selectedLeadForNote,
  setSelectedLeadForNote,
  selectedLeadForPayment,
  setSelectedLeadForPayment,
  selectedLeadForDetail,
  setSelectedLeadForDetail,
  fetchMonthDetails,
  monthName,
  year
}) => {
  return (
    <>
      {/* Manual Entry Modal */}
      {showManual && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl animate-in zoom-in duration-200 relative">
             <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
                <div className="flex items-center gap-1.5 text-brand-primary">
                   <UserPlus size={18} />
                   <h2 className="text-sm font-bold text-slate-900 tracking-tight">Manual Lead Registration ({monthName} {year})</h2>
                </div>
                <button onClick={() => setShowManual(false)} className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 transition-all"><X size={16}/></button>
             </div>

             <form onSubmit={handleManualSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 ml-0.5">Lead Name</label>
                      <input 
                        type="text" required value={manualForm.name}
                        onChange={(e) => setManualForm({...manualForm, name: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                        placeholder="John Doe"
                      />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 ml-0.5">Contact Phone</label>
                      <input 
                        type="text" required value={manualForm.phone}
                        onChange={(e) => setManualForm({...manualForm, phone: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                        placeholder="9876543210"
                      />
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 ml-0.5">Email Address</label>
                      <input 
                        type="email" value={manualForm.email}
                        onChange={(e) => setManualForm({...manualForm, email: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                        placeholder="email@example.com"
                      />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 ml-0.5">Lead Date</label>
                      <input 
                        type="date" value={manualForm.date}
                        onChange={(e) => setManualForm({...manualForm, date: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                      />
                   </div>
                </div>

                <div className="space-y-1">
                   <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 ml-0.5">Requirement / Project Details</label>
                   <textarea 
                     value={manualForm.requirement}
                     onChange={(e) => setManualForm({...manualForm, requirement: e.target.value})}
                     className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold h-20 resize-none"
                     placeholder="Enter project details..."
                   />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 ml-0.5">Budget (₹)</label>
                      <input 
                        type="number" value={manualForm.budget}
                        onChange={(e) => setManualForm({...manualForm, budget: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                        placeholder="5000"
                      />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 ml-0.5">Source / Origin</label>
                      <input 
                        type="text" value={manualForm.source}
                        onChange={(e) => setManualForm({...manualForm, source: e.target.value})}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                        placeholder="Google Ads"
                      />
                   </div>
                </div>

                <div className="space-y-1">
                   <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 ml-0.5">Location</label>
                   <input 
                     type="text" value={manualForm.location}
                     onChange={(e) => setManualForm({...manualForm, location: e.target.value})}
                     className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                     placeholder="Mumbai, Maharashtra"
                   />
                </div>
                <button 
                  type="submit" disabled={manualLoading}
                  className="w-full py-3 bg-brand-primary text-white font-bold uppercase tracking-widest text-[10px] rounded-xl hover:bg-brand-hover shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  {manualLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus size={14}/>}
                  <span>{manualLoading ? 'Registering...' : 'Finalize Manual Add'}</span>
                </button>
             </form>
          </div>
        </div>
      )}

      {/* Edit Entry Modal */}
      {editModalData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] p-4">
           <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl animate-in zoom-in duration-200 relative">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
                 <div className="flex items-center gap-1.5 text-brand-primary">
                    <Edit2 size={18} />
                    <h2 className="text-sm font-bold text-slate-900 tracking-tight">Edit Lead Information</h2>
                 </div>
                 <button onClick={() => setEditModalData(null)} className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 transition-all"><X size={16}/></button>
              </div>

              <form onSubmit={handleFullEditSubmit} className="p-6 space-y-4">
                 <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 ml-0.5">Lead Name</label>
                    <input 
                      type="text" required value={editModalData.name || ''}
                      onChange={(e) => setEditModalData({...editModalData, name: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 ml-0.5">Email Address</label>
                       <input 
                         type="email" value={editModalData.email || ''}
                         onChange={(e) => setEditModalData({...editModalData, email: e.target.value})}
                         className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                       />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 ml-0.5">Lead Date</label>
                       <input 
                         type="date" value={editModalData.date ? new Date(editModalData.date).toISOString().split('T')[0] : ''}
                         onChange={(e) => setEditModalData({...editModalData, date: e.target.value})}
                         className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                       />
                    </div>
                 </div>

                 <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 ml-0.5">Requirement</label>
                    <textarea 
                      value={editModalData.requirement || ''}
                      onChange={(e) => setEditModalData({...editModalData, requirement: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold h-20 resize-none"
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 ml-0.5">Budget (₹)</label>
                       <input 
                         type="number" value={editModalData.budget || 0}
                         onChange={(e) => setEditModalData({...editModalData, budget: e.target.value})}
                         className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                       />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 ml-0.5">Source</label>
                       <input 
                         type="text" value={editModalData.source || ''}
                         onChange={(e) => setEditModalData({...editModalData, source: e.target.value})}
                         className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                       />
                    </div>
                 </div>

                 <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 ml-0.5">Location</label>
                    <input 
                      type="text" value={editModalData.location || ''}
                      onChange={(e) => setEditModalData({...editModalData, location: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                    />
                 </div>
                 <button 
                   type="submit" disabled={editLoading}
                   className="w-full py-3 bg-brand-primary text-white font-bold uppercase tracking-widest text-[10px] rounded-xl hover:bg-brand-hover shadow-lg transition-all flex items-center justify-center gap-2"
                 >
                   {editLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Edit2 size={14}/>}
                   <span>{editLoading ? 'Saving...' : 'Save Lead Data'}</span>
                 </button>
              </form>
           </div>
        </div>
      )}

      {selectedLeadForNote && (
        <LeadConversationModal 
          lead={selectedLeadForNote} 
          onClose={() => setSelectedLeadForNote(null)} 
          onNoteAdded={fetchMonthDetails}
        />
      )}

      {selectedLeadForPayment && (
        <PaymentHistoryModal 
          lead={selectedLeadForPayment} 
          onClose={() => setSelectedLeadForPayment(null)} 
          onPaymentAdded={fetchMonthDetails}
        />
      )}

      {selectedLeadForDetail && (
        <ClientProfileModal 
          clientId={selectedLeadForDetail.clientId} 
          onClose={() => setSelectedLeadForDetail(null)} 
        />
      )}
    </>
  );
};

export default LeadModals;
