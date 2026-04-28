'use client';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, IndianRupee, Calendar, CreditCard, User, History, Wallet, CheckCircle2 } from 'lucide-react';
import PremiumSelect from './PremiumSelect';
import API from '../api/axios';

const PaymentHistoryModal = ({ lead, onClose, onPaymentAdded }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    method: 'Cash',
    note: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [history, setHistory] = useState(lead.paymentHistory || []);

  const totalBudget = lead.totalAmount || lead.budget || 0;
  const totalPaid = history.reduce((sum, p) => sum + p.amount, 0);
  const pending = totalBudget - totalPaid;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || formData.amount <= 0) return;

    setLoading(true);
    try {
      const res = await API.post(`/sales/lead/${lead._id}/payment`, formData);
      setHistory(res.data.data.paymentHistory);
      setFormData({
        amount: '',
        method: 'Cash',
        note: '',
        date: new Date().toISOString().split('T')[0]
      });
      if (onPaymentAdded) onPaymentAdded();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add payment');
    } finally {
      setLoading(false);
    }
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl animate-in zoom-in duration-200 flex flex-col max-h-[90vh] border border-slate-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-emerald-50/30 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
              <Wallet size={20} />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">Payment Timeline: {lead.name}</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Installment & Balance Tracking</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl text-slate-400 transition-all"><X size={18}/></button>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Timeline & Stats */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
            {/* Balance Card */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                 <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Total</p>
                 <p className="text-sm font-extrabold text-slate-900">₹{totalBudget.toLocaleString()}</p>
              </div>
              <div className="bg-emerald-500 p-3 rounded-xl shadow-md shadow-emerald-100">
                 <p className="text-[9px] font-bold text-white/70 uppercase mb-1">Paid</p>
                 <p className="text-sm font-extrabold text-white">₹{totalPaid.toLocaleString()}</p>
              </div>
              <div className={`${pending <= 0 ? 'bg-indigo-500' : 'bg-rose-500'} p-3 rounded-xl shadow-md shadow-rose-100 transition-colors`}>
                 <p className="text-[9px] font-bold text-white/70 uppercase mb-1">Pending</p>
                 <p className="text-sm font-extrabold text-white">₹{Math.max(0, pending).toLocaleString()}</p>
              </div>
            </div>

            {/* History List */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <History size={12} /> Payment History
              </h3>
              {history.length === 0 ? (
                <div className="py-12 text-center text-slate-300">
                   <IndianRupee size={32} className="mx-auto mb-2 opacity-20" />
                   <p className="text-[10px] font-bold uppercase">No payments recorded yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {[...history].reverse().map((pay, i) => (
                    <div key={i} className="relative pl-6 border-l-2 border-emerald-100 group animate-in slide-in-from-left-2 duration-300">
                      <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-4 border-emerald-500 z-10" />
                      <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm transition-all hover:border-emerald-200">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-black text-slate-900">₹{pay.amount.toLocaleString()}</span>
                              <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[8px] font-bold uppercase tracking-widest">{pay.method}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium">{pay.note || 'No description provided.'}</p>
                          </div>
                          <div className="text-right">
                             <p className="text-[9px] font-bold text-slate-400 capitalize flex items-center gap-1 justify-end">
                              <User size={10} /> {pay.receivedBy}
                             </p>
                             <p className="text-[9px] text-slate-400 font-medium mt-0.5">
                               {new Date(pay.date).toLocaleDateString()}
                             </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {pending <= 0 && (
                    <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-center gap-3 animate-pulse">
                      <CheckCircle2 className="text-indigo-600" size={24} />
                      <div>
                        <p className="text-[11px] font-black text-indigo-900 uppercase">Payment Completed</p>
                        <p className="text-[10px] text-indigo-700 font-medium italic">Full amount has been successfully received.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Form Side */}
          <div className="w-full md:w-72 bg-white border-l border-slate-100 p-6 flex flex-col">
            <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Plus className="text-emerald-500" size={16} /> New Installment
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Kist Amount</label>
                <div className="relative">
                  <IndianRupee size={14} className="absolute left-3 top-2.5 text-slate-400" />
                  <input 
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    placeholder="Enter amount"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none text-xs font-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Method</label>
                  <div className="relative">
                    <CreditCard size={12} className="absolute left-2.5 top-3 z-10 text-slate-400" />
                    <PremiumSelect 
                      value={formData.method}
                      onChange={(val) => setFormData({...formData, method: val})}
                      options={[
                        { label: 'Cash', value: 'Cash' },
                        { label: 'UPI', value: 'UPI' },
                        { label: 'Bank', value: 'Bank Transfer' },
                        { label: 'Other', value: 'Other' }
                      ]}
                      className="pl-5"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Entry Date</label>
                  <div className="relative">
                    <Calendar size={12} className="absolute left-2.5 top-2.5 text-slate-400" />
                    <input 
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      className="w-full pl-7 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[9px] font-black outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Payment Note</label>
                <textarea 
                  value={formData.note}
                  onChange={(e) => setFormData({...formData, note: e.target.value})}
                  placeholder="e.g. 1st installment, final payment..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none text-xs font-semibold h-24 resize-none"
                />
              </div>

              <button 
                type="submit"
                disabled={loading || !formData.amount || pending <= 0}
                className="w-full py-3 bg-emerald-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-600 shadow-md shadow-emerald-100 transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
              >
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus size={14}/>}
                Add Payment
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PaymentHistoryModal;
