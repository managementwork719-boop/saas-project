'use client';
import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import API from '@/api/axios';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Calendar, Download } from 'lucide-react';

// Modular Components
import MonthlyStats from './MonthlyStats';
import LeadTable from './LeadTable';
import LeadModals from './LeadModals';
import { HeaderSkeleton } from '@/components/Skeleton';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MonthlyOverviewContainer = ({ year, month, monthId }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  // State
  const [activeTab, setActiveTab] = useState('origin');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  
  // Modal States
  const [showManual, setShowManual] = useState(false);
  const [editModalData, setEditModalData] = useState(null);
  const [selectedLeadForNote, setSelectedLeadForNote] = useState(null);
  const [selectedLeadForPayment, setSelectedLeadForPayment] = useState(null);
  const [selectedLeadForDetail, setSelectedLeadForDetail] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);

  const [manualForm, setManualForm] = useState({
    name: '', phone: '', email: '', requirement: '', budget: '', source: '', location: '', leadId: '', date: new Date().toISOString().split('T')[0]
  });

  // Fetch Data
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['monthlyOverview', monthId, activeTab, page, searchTerm],
    queryFn: async () => {
      const res = await API.get('/sales/monthly-overview', {
        params: { 
          month: monthId, 
          status: activeTab, 
          page, 
          search: searchTerm, 
          limit: 15 
        }
      });
      return res.data.data;
    },
    keepPreviousData: true,
  });

  const monthName = MONTH_NAMES[parseInt(month) - 1] || 'Unknown Month';

  const leads = data?.leads || [];
  const pagination = data?.pagination || {};
  const stats = data?.stats || {};

  const tablePagination = {
    ...pagination,
    totalOrigin: stats.originCount,
    totalFollowUp: stats.followUpCount,
    totalConverted: stats.converted,
    totalNotConverted: stats.notConvertedCount
  };

  // Mutation for single field updates
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }) => API.patch(`/sales/lead/${id}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries(['monthlyOverview']);
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Update failed', 'error');
    }
  });

  const handleOptimisticUpdate = useCallback((id, updates) => {
    updateMutation.mutate({ id, updates });
  }, [updateMutation]);

  // Create Lead Mutation
  const createMutation = useMutation({
    mutationFn: (newLead) => API.post('/sales/create-manual', newLead),
    onSuccess: () => {
      showToast('Lead created successfully');
      setShowManual(false);
      setManualForm({ name: '', phone: '', email: '', requirement: '', budget: '', source: '', location: '', leadId: '', date: new Date().toISOString().split('T')[0] });
      queryClient.invalidateQueries(['monthlyOverview']);
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Creation failed', 'error');
    }
  });

  const handleManualSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(manualForm);
  };

  const handleFullEditSubmit = (e) => {
    e.preventDefault();
    if (!editModalData?._id) return;
    updateMutation.mutate({ 
      id: editModalData._id, 
      updates: editModalData 
    }, {
      onSuccess: () => {
        setEditModalData(null);
        showToast('Lead details updated');
      }
    });
  };

  const deleteLead = async (id) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      try {
        await API.delete(`/sales/lead/${id}`);
        showToast('Lead deleted successfully');
        refetch();
      } catch (err) {
        showToast('Failed to delete lead', 'error');
      }
    }
  };

  const handleUploadExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    setUploadLoading(true);

    try {
      const res = await API.post('/sales/import', formData);
      showToast(res.data.message || 'Import successful');
      setShowUpload(false);
      refetch();
    } catch (err) {
      showToast(err.response?.data?.message || 'Import failed', 'error');
    } finally {
      setUploadLoading(false);
    }
  };

  const downloadSampleFormat = async () => {
    const sampleData = [
      { 'ID': 'L-101', 'Name': 'John Doe', 'Phone': '9876543210', 'Email': 'john@example.com', 'Source': 'Google Ads', 'Location': 'Mumbai', 'Requirement': 'Web Development', 'Budget': 50000 }
    ];
    const XLSX = await import('xlsx');
    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sample Format");
    XLSX.writeFile(wb, "WorkSensy_Lead_Import_Format.xlsx");
  };

  if (isLoading) return <HeaderSkeleton />;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="relative overflow-hidden bg-white/40 p-3 rounded-[32px] border border-slate-200/50 shadow-sm group">
        <div className="relative bg-white/80 backdrop-blur-2xl border border-white p-8 rounded-[28px] flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
          {/* Animated Background Accent */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-1000" />
          
          <div className="flex items-center gap-6 relative z-10">
            <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary shadow-inner">
              <Calendar size={32} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">
                {monthName} <span className="text-brand-primary/40">{year}</span>
              </h1>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.25em] mt-1 flex items-center gap-2">
                Operational Control <span className="w-1 h-1 bg-slate-300 rounded-full" /> 
                {leads.length} Records Loaded
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 relative z-10">
            <button 
              className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-600 hover:border-brand-primary hover:text-brand-primary hover:shadow-lg transition-all flex items-center gap-2 group/btn"
            >
              <Download size={14} className="group-hover/btn:-translate-y-0.5 transition-transform" />
              Export Intel
            </button>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <MonthlyStats stats={stats} />

      {/* Main Table Section */}
      <LeadTable 
        leads={leads}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        isLoading={isLoading}
        isFetching={isFetching}
        pagination={tablePagination}
        page={page}
        setPage={setPage}
        user={user}
        salesMembers={[]} // Fetch from AuthContext if needed
        allMembers={[]} // Fetch from AuthContext if needed
        isSelected={selectedLeadId === null} // Dummy for now
        handleSelectLead={setSelectedLeadId}
        handleOptimisticUpdate={handleOptimisticUpdate}
        handleUpdateLead={handleOptimisticUpdate}
        deleteLead={deleteLead}
        setSelectedLeadForNote={setSelectedLeadForNote}
        setSelectedLeadForPayment={setSelectedLeadForPayment}
        setSelectedLeadForDetail={setSelectedLeadForDetail}
        setEditModalData={setEditModalData}
        onAddManual={() => setShowManual(true)}
        onUploadClick={() => setShowUpload(true)}
      />

      {/* Modals Section */}
      <LeadModals 
        showManual={showManual}
        setShowManual={setShowManual}
        manualForm={manualForm}
        setManualForm={setManualForm}
        manualLoading={createMutation.isPending}
        handleManualSubmit={handleManualSubmit}
        editModalData={editModalData}
        setEditModalData={setEditModalData}
        editLoading={updateMutation.isPending}
        handleFullEditSubmit={handleFullEditSubmit}
        selectedLeadForNote={selectedLeadForNote}
        setSelectedLeadForNote={setSelectedLeadForNote}
        selectedLeadForPayment={selectedLeadForPayment}
        setSelectedLeadForPayment={setSelectedLeadForPayment}
        selectedLeadForDetail={selectedLeadForDetail}
        setSelectedLeadForDetail={setSelectedLeadForDetail}
        fetchMonthDetails={refetch}
        monthName={monthName}
        year={year}
      />

      {/* Excel Import Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl animate-in zoom-in duration-200 relative border border-slate-100">
             <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-indigo-50/30 rounded-t-2xl">
                <div className="flex items-center gap-1.5 text-indigo-600">
                   <Download size={18} />
                   <h2 className="text-sm font-bold text-slate-900 tracking-tight">Import Leads from Excel</h2>
                </div>
                <button onClick={() => setShowUpload(false)} className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 transition-all"><X size={16}/></button>
             </div>

             <div className="p-6">
                <button 
                  onClick={downloadSampleFormat}
                  className="mb-6 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline flex items-center justify-center gap-1.5 mx-auto"
                >
                  <Download size={12} />
                  Download Sample Format
                </button>
                
                <div className="flex flex-col gap-4">
                   <label className="w-full cursor-pointer group">
                      <div className="w-full py-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl group-hover:border-indigo-600 group-hover:bg-indigo-50/50 transition-all text-center">
                         <span className="text-xs font-bold text-slate-600">Choose Excel File</span>
                         <input 
                           type="file" 
                           className="hidden" 
                           accept=".xlsx, .xls, .csv"
                           onChange={handleUploadExcel}
                           disabled={uploadLoading}
                         />
                      </div>
                   </label>
                   
                   {uploadLoading && (
                     <div className="flex items-center justify-center gap-2 text-indigo-600 animate-pulse">
                        <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Processing Data...</span>
                     </div>
                   )}
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthlyOverviewContainer;
