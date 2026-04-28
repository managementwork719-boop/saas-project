'use client';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import API from '../api/axios';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useDebounce } from '../hooks/useDebounce';
import { 
  Users, 
  Search, 
  IndianRupee, 
  Phone,
  Mail,
  X,
  TrendingUp,
  CheckCircle2,
  Clock,
  ExternalLink,
  Target,
  Edit2,
  Trash2,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import ClientProfileModal from '../components/ClientProfileModal';

const EditClientModal = ({ client, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: client.name,
    phone: client.phone,
    email: client.email || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.patch(`/clients/${client._id}`, formData);
      onUpdate();
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl animate-in zoom-in duration-200 border border-slate-200">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
          <div className="flex items-center gap-2 text-indigo-600">
            <Edit2 size={18} />
            <h2 className="text-sm font-bold text-slate-900">Edit Client Details</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 transition-all"><X size={16}/></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Full Name</label>
            <input 
              type="text" required value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none text-xs font-semibold"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Mobile Number</label>
            <input 
              type="text" required value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none text-xs font-semibold"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Email Address</label>
            <input 
              type="email" value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none text-xs font-semibold"
              placeholder="client@example.com"
            />
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full py-3 bg-indigo-600 text-white font-bold uppercase tracking-[0.15em] text-[10px] rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
};

// ClientProfileModal has been moved to src/components/ClientProfileModal.jsx

const Clients = () => {
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [editingClient, setEditingClient] = useState(null);
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const queryClient = useQueryClient();
  const queryKey = ['clients', page, debouncedSearch];

  const { data: queryData, isLoading: loading } = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await API.get(`/clients/all?page=${page}&limit=8&search=${debouncedSearch}`);
      return res.data;
    },
    placeholderData: keepPreviousData
  });

  const clients = queryData?.data?.clients || [];
  const pagination = queryData?.pagination || { totalPages: 1, totalClients: 0 };

  const fetchClients = () => {
    queryClient.invalidateQueries({ queryKey: ['clients'] });
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
       const res = await API.post('/clients/sync');
       alert(res.data.message);
       fetchClients();
    } catch (err) {
       alert('Sync failed');
    } finally {
       setSyncing(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this client? Associated work history will be unlinked.')) return;
    
    try {
      await API.delete(`/clients/${id}`);
      fetchClients();
    } catch (err) {
      alert('Delete failed');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Unified Clients</h1>
          <p className="text-[#94a3b8] text-[10px] font-black uppercase tracking-[0.15em] mt-0.5">Cross-Work History & Retention System</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
          <button 
             onClick={handleSync}
             disabled={syncing}
             className="px-4 py-2.5 bg-white/60 backdrop-blur-md border border-slate-200 rounded-2xl text-slate-600 hover:text-indigo-600 hover:border-indigo-400/50 transition-all shadow-[0_4px_15px_rgba(0,0,0,0.03)] flex items-center gap-2.5 group active:scale-95"
             title="Link legacy leads to client profiles"
          >
             <RefreshCw size={15} className={`text-indigo-500 ${syncing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
             <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Sync History</span>
          </button>
          <div className="relative flex-1 sm:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-all" size={15} />
            <input 
              type="text"
              placeholder="Search by name or mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white/60 backdrop-blur-md border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-300 outline-none text-xs font-bold transition-all shadow-[0_4px_15px_rgba(0,0,0,0.03)]"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="bg-white/40 backdrop-blur-md h-[180px] rounded-[24px] border border-slate-100 animate-pulse shadow-sm" />
          ))}
        </div>
      ) : (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {clients.map(client => (
                <div 
                  key={client._id}
                  onClick={() => setSelectedClientId(client._id)}
                  className="group relative bg-white/70 backdrop-blur-xl p-5 rounded-[24px] border border-slate-200/50 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(99,102,241,0.08)] hover:border-indigo-500/40 hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden h-full flex flex-col"
                >
                  {/* Glassy Background Ornament */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl -mr-8 -mt-8 transition-colors group-hover:bg-indigo-500/10" />
                  
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-[0_4px_15px_rgba(99,102,241,0.3)] group-hover:scale-110 transition-transform duration-500">
                        <Users size={18} />
                      </div>
                      <div className="flex flex-col items-end gap-2">
                         <div className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                           client.totalWorks > 1 
                             ? 'bg-indigo-500 text-white shadow-[0_4px_10px_rgba(99,102,241,0.3)]' 
                             : 'bg-slate-100 text-slate-500'
                         }`}>
                           {client.totalWorks > 1 ? 'REPEAT' : 'NEW'}
                         </div>
                         <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0 duration-300">
                            <button 
                              onClick={(e) => { e.stopPropagation(); setEditingClient(client); }}
                              className="p-1.5 bg-white/80 hover:bg-white text-indigo-600 rounded-lg shadow-sm border border-slate-100 transition-all translate-y-1 group-hover:translate-y-0"
                            >
                               <Edit2 size={11} />
                            </button>
                            <button 
                              onClick={(e) => handleDelete(e, client._id)}
                              className="p-1.5 bg-white/80 hover:bg-red-50 text-red-600 rounded-lg shadow-sm border border-slate-100 transition-all translate-y-1 group-hover:translate-y-0 delay-75"
                            >
                               <Trash2 size={11} />
                            </button>
                         </div>
                      </div>
                    </div>

                    <div className="mb-auto">
                      <h3 className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight line-clamp-1">{client.name}</h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Phone size={10} className="text-slate-400 group-hover:text-indigo-400 transition-colors" />
                        <span className="text-[11px] font-bold text-slate-500 tracking-tight">{client.phone}</span>
                      </div>
                    </div>

                    <div className="mt-6 pt-5 border-t border-slate-100/80 flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.15em]">Works</span>
                        <span className="text-sm font-black text-slate-900">{client.totalWorks || 0}</span>
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.15em]">Lifetime Val</span>
                        <span className="text-sm font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">₹{client.totalRevenue?.toLocaleString() || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination UI */}
            {pagination.totalPages > 1 && (
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/40 backdrop-blur-md p-4 rounded-[24px] border border-slate-200/50 shadow-sm">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Showing <span className="text-slate-900">{clients.length}</span> of <span className="text-slate-900">{pagination.totalClients}</span> clients
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
                  >
                    Previous
                  </button>
                  <div className="flex gap-1">
                    {[...Array(pagination.totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setPage(i + 1)}
                        className={`w-8 h-8 rounded-xl text-[10px] font-black transition-all ${
                          page === i + 1 
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                            : 'bg-white border border-slate-100 text-slate-400 hover:bg-slate-50'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                  <button 
                    disabled={page === pagination.totalPages}
                    onClick={() => setPage(page + 1)}
                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

          {clients.length === 0 && (
            <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200 mx-auto max-w-xl">
              <Users size={48} className="mx-auto text-slate-200 mb-4" />
              <h3 className="text-sm font-bold text-slate-900">No clients found</h3>
              <p className="text-[11px] text-slate-500 mt-1 uppercase tracking-widest">Try adjusting your search criteria</p>
            </div>
          )}
        </>
      )}

      {selectedClientId && !editingClient && mounted && createPortal(
        <ClientProfileModal 
          clientId={selectedClientId} 
          onClose={() => setSelectedClientId(null)} 
        />,
        document.body
      )}

      {editingClient && mounted && createPortal(
        <EditClientModal 
          client={editingClient} 
          onClose={() => setEditingClient(null)} 
          onUpdate={fetchClients} 
        />,
        document.body
      )}
    </div>
  );
};

export default Clients;
