'use client';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Users, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  IndianRupee, 
  Target, 
  ExternalLink 
} from 'lucide-react';
import API from '../api/axios';

const ClientProfileModal = ({ clientId, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (clientId) fetchProfile();
  }, [clientId]);

  const fetchProfile = async () => {
    try {
      const res = await API.get(`/clients/profile/${clientId}`);
      setData(res.data.data);
    } catch (err) {
      console.error('Failed to fetch client profile');
    } finally {
      setLoading(false);
    }
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!clientId || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl animate-in zoom-in duration-200 relative overflow-hidden flex flex-col max-h-[90vh] border border-slate-200">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
               <Users size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">{data?.client?.name || 'Loading...'}</h2>
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-widest mt-0.5">Unified Client Profile</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg text-slate-400 transition-all active:scale-95">
            <X size={20}/>
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center p-12">
              <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-8">
              {/* Stats Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-emerald-500 p-5 rounded-2xl text-white shadow-xl shadow-emerald-200/50">
                  <TrendingUp className="mb-4 opacity-80" size={18} />
                  <h3 className="text-xl font-black">
                    ₹{data.leads.filter(l => l.status === 'converted').reduce((acc, curr) => acc + (curr.budget || 0), 0).toLocaleString()}
                  </h3>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-100 mt-1">Total Lifetime Value</p>
                </div>
                <div className="bg-indigo-500 p-5 rounded-2xl text-white shadow-xl shadow-indigo-200/50">
                  <CheckCircle2 className="mb-4 opacity-80" size={18} />
                  <h3 className="text-xl font-black">{data.leads.filter(l => l.status === 'converted').length}</h3>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-100 mt-1">Completed Works</p>
                </div>
                <div className="bg-amber-500 p-5 rounded-2xl text-white shadow-xl shadow-amber-200/50">
                  <Clock className="mb-4 opacity-80" size={18} />
                  <h3 className="text-xl font-black">{data.leads.filter(l => l.status !== 'converted').length}</h3>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-100 mt-1">Pending Requests</p>
                </div>
              </div>

              {/* Work Timeline */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                  <Target size={14} className="text-indigo-500" /> Automatic Work History
                </h3>
                
                <div className="space-y-4 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 pb-4">
                  {data.leads.map((work, idx) => (
                    <div key={idx} className="relative pl-10">
                      <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center z-10 ${
                        work.status === 'converted' ? 'bg-emerald-500' : work.status === 'follow-up' ? 'bg-amber-500' : 'bg-slate-400'
                      }`}>
                        {work.status === 'converted' ? <CheckCircle2 size={10} className="text-white"/> : <Clock size={10} className="text-white"/>}
                      </div>
                      
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                              {new Date(work.date || work.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                            <h4 className="text-[13px] font-bold text-slate-900 mt-0.5">{work.requirement || 'Standard Service'}</h4>
                          </div>
                          <div className="text-right">
                            <div className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg ${
                              work.status === 'converted' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                            }`}>
                              {work.status}
                            </div>
                            <div className="text-[11px] font-bold text-slate-900 mt-1">₹{work.budget?.toLocaleString()}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-200/50">
                           <div className="flex items-center gap-1.5 text-slate-500">
                             <TrendingUp size={12} />
                             <span className="text-[10px] font-medium uppercase tracking-tight text-nowrap">Handled By: <span className="text-slate-900 font-bold">{work.convertedBy || 'Sales Team'}</span></span>
                           </div>
                           <div className="flex items-center gap-1.5 text-slate-500">
                             <ExternalLink size={12} />
                             <span className="text-[10px] font-medium uppercase tracking-tight">Source: <span className="text-slate-900 font-bold uppercase">{work.source}</span></span>
                           </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ClientProfileModal;
