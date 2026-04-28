import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useToast } from '../context/ToastContext';

import { useParams, useRouter } from 'next/navigation';
import API from '../api/axios';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  IndianRupee,
  MoreVertical,
  Plus,
  BarChart3,
  Phone,
  Mail,
  Search,
  MessageSquare,
  Calendar,
  Edit2,
  Trash2,
  ExternalLink,
  Target,
  AlertTriangle,
  Clock,
  UserPlus,
  User,
  MapPin,
  X,
  NotebookPen,
  Wallet,
  FileSpreadsheet,
  FileDown,
  Download
} from 'lucide-react';
import LeadConversationModal from '../components/LeadConversationModal';
import PaymentHistoryModal from '../components/PaymentHistoryModal';
import ClientProfileModal from '../components/ClientProfileModal';
import { useAuth } from '../context/AuthContext';
import PremiumSelect from '../components/PremiumSelect';
import PremiumDatePicker from '../components/PremiumDatePicker';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Skeleton, StatSkeleton, HeaderSkeleton, TableRowSkeleton } from '../components/Skeleton';
import { useDebounce } from '../hooks/useDebounce';


const PriorityBadge = ({ priority }) => {
  const styles = {
    high: 'bg-red-100 text-red-600 border-red-200',
    normal: 'bg-amber-100 text-amber-600 border-amber-200',
    low: 'bg-slate-100 text-slate-600 border-slate-200'
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border ${styles[priority]}`}>
      {priority}
    </span>
  );
};

const isToday = (dateString) => {
  if (!dateString) return false;
  const date = new Date(dateString);
  const today = new Date();
  return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
};

const isOverdue = (dateString) => {
  if (!dateString) return false;
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < new Date();
};

const OverviewCard = ({ title, value, icon: Icon, color = 'bg-brand-primary' }) => (
  <div className={`${color} p-4 rounded-xl text-white shadow-sm flex items-center justify-between transition-all hover:scale-[1.02] hover:shadow-lg`}>
    <div className="space-y-0.5">
      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/80">{title}</p>
      <h3 className="text-xl font-bold text-white tracking-tight leading-tight">{value}</h3>
    </div>
    <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md border border-white/10">
      <Icon size={18} className="text-white" />
    </div>
  </div>
);

const MonthlyOverview = () => {
  const params = useParams();
  const monthId = params?.id || '';
  const router = useRouter();
  const { user, fetchTeam, team: cachedTeam } = useAuth();
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  
  const [activeTab, setActiveTab] = useState('origin');
  const [teamMembers, setTeamMembers] = useState(cachedTeam || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadCampaignName, setUploadCampaignName] = useState('');
  const [campaigns, setCampaigns] = useState([]);
  const [activeCampaign, setActiveCampaign] = useState(null);
  const [memberDropdownOpen, setMemberDropdownOpen] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Pagination State
  const [page, setPage] = useState(1);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  
  const queryClient = useQueryClient();
  const queryKey = ['monthlyOverview', monthId, page, debouncedSearch, activeTab, selectedMember, activeCampaign];

  const { data: queryData, isLoading, isFetching } = useQuery({
    queryKey,
    staleTime: 30000,
    gcTime: 1000 * 60 * 5,
    queryFn: async () => {
      const params = new URLSearchParams({
        month: monthId,
        page: page.toString(),
        search: debouncedSearch,
        status: activeTab
      });
      if (selectedMember) params.append('member', selectedMember);
      if (activeCampaign) params.append('campaign', activeCampaign);
      
      const res = await API.get(`/sales/monthly-overview?${params.toString()}`);
      
      if (res.data.data.campaigns) {
        setCampaigns(res.data.data.campaigns);
      }
      
      return res.data.data;
    }
  });

  useEffect(() => {
    if (queryData && !hasLoadedOnce) setHasLoadedOnce(true);
  }, [queryData]);

  const data = queryData || null;
  const loading = isLoading;
  const tableLoading = isLoading; 
  const pagination = queryData?.pagination || { totalPages: 1, totalLeads: 0 };

  const [editModalData, setEditModalData] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [selectedLeadForNote, setSelectedLeadForNote] = useState(null);
  const [selectedLeadForPayment, setSelectedLeadForPayment] = useState(null);
  const [selectedLeadForDetail, setSelectedLeadForDetail] = useState(null);

  // Manual Entry State
  const [showManual, setShowManual] = useState(false);
  const [manualLoading, setManualLoading] = useState(false);
  const [manualForm, setManualForm] = useState({
    leadId: '', name: '', phone: '', email: '', address: '', source: '', 
    campaign: '', requirement: '', budget: '', location: ''
  });

  useEffect(() => {
    if (!cachedTeam) {
      fetchTeam().then(setTeamMembers);
    }
  }, []);

  // Optimistic Status Update
  const handleOptimisticUpdate = async (id, updates) => {
    const previousData = queryClient.getQueryData(queryKey);
    if (!previousData) return;
    
    // 1. Check if the status has changed to something other than the current tab
    const statusChanged = updates.status && updates.status !== activeTab;

    // 2. Optimistically update local cache
    let updatedLeads;
    if (statusChanged) {
        updatedLeads = previousData.leads.filter(l => l._id !== id);
    } else {
        updatedLeads = previousData.leads.map(l => 
          l._id === id ? { ...l, ...updates } : l
        );
    }
    
    queryClient.setQueryData(queryKey, { ...previousData, leads: updatedLeads });

    try {
      // 3. Perform background API call
      await API.patch(`/sales/lead/${id}`, updates);
    } catch (err) {
      // 4. Rollback on failure
      queryClient.setQueryData(queryKey, previousData);
      alert(err.response?.data?.message || 'Update failed. Reverting changes.');
    }
  };


  const handleUpdateLead = async (id, updateData) => {
    try {
      await API.patch(`/sales/lead/${id}`, updateData);
      fetchMonthDetails();
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed');
    }
  };

  const deleteLead = async (id) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) return;
    try {
      await API.delete(`/sales/lead/${id}`);
      fetchMonthDetails();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleFullEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      await API.patch(`/sales/lead/${editModalData._id}`, editModalData);
      setEditModalData(null);
      fetchMonthDetails();
    } catch (err) {
      alert(err.response?.data?.message || 'Full update failed');
    } finally {
      setEditLoading(false);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setManualLoading(true);
    try {
      // Pass the current monthId to ensure lead is added to THIS month view
      await API.post('/sales/create-manual', { ...manualForm, month: monthId });
      setShowManual(false);
      setManualForm({
        leadId: '', name: '', phone: '', email: '', address: '', source: '', 
        campaign: '', requirement: '', budget: '', location: ''
      });
      fetchMonthDetails(); // Refresh list to show new lead
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add lead');
    } finally {
      setManualLoading(false);
    }
  };

  const toggleLeadSelection = (id) => {
    setSelectedLeads(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Only show the FULL PAGE skeleton on the very first load of the entire component
  const isInitialLoad = isLoading && !hasLoadedOnce;

  if (isInitialLoad) return (
    <div className="space-y-6 max-w-[1400px] mx-auto animate-in fade-in duration-500 pb-10">
      <div className="flex items-center gap-4 mb-2">
         <Skeleton className="h-10 w-10 circle" />
         <Skeleton className="h-8 w-48 rounded-lg" />
      </div>

      <HeaderSkeleton />

      <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
        {[1,2,3,4,5].map(i => <StatSkeleton key={i} />)}
      </div>

      <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-slate-200/60 shadow-[0_4px_30px_rgba(0,0,0,0.03)] overflow-hidden h-[500px] p-8">
        <div className="flex justify-between items-center mb-8">
           <Skeleton className="h-8 w-64 rounded-xl" />
           <div className="flex gap-2">
              <Skeleton className="h-10 w-32 rounded-xl" />
              <Skeleton className="h-10 w-32 rounded-xl" />
           </div>
        </div>
        <div className="space-y-4">
          {[1,2,3,4,5,6,7,8].map(i => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      </div>
    </div>
  );

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const [year, monthNum] = monthId.split('-');
  const monthName = months[parseInt(monthNum) - 1];

  // Filter is now handled by the server, but we keep tab filtering logic
  const filteredLeads = data?.leads || [];

  const exportLeadsToExcel = async () => {
    if (!filteredLeads || filteredLeads.length === 0) {
      alert('No leads found to export');
      return;
    }

    const XLSX = await import('xlsx');

    const exportData = filteredLeads.map((lead, index) => ({
      'S.No': index + 1,
      'Lead ID': lead.leadId || lead._id,
      'Name': lead.name,
      'Phone': lead.phone,
      'Email': lead.email || 'N/A',
      'Source': lead.source || 'N/A',
      'Requirement': lead.requirement || lead.workType || 'N/A',
      'Budget': lead.budget || lead.totalAmount || 0,
      'Location': lead.location || 'N/A',
      'Status': lead.status,
      'Date': new Date(lead.createdAt).toLocaleDateString()
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    const wscols = [
      {wch: 8}, {wch: 25}, {wch: 20}, {wch: 15}, {wch: 25}, {wch: 15}, {wch: 30}, {wch: 12}, {wch: 15}, {wch: 15}, {wch: 15}
    ];
    ws['!cols'] = wscols;

    XLSX.utils.book_append_sheet(wb, ws, "Monthly Leads");
    XLSX.writeFile(wb, `WorkSensy_Leads_${monthName}_${year}.xlsx`);
  };

  const handleUploadExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    if (uploadCampaignName) {
      formData.append('campaignName', uploadCampaignName);
    }
    setUploadLoading(true);

    try {
      const res = await API.post('/sales/import', formData);
      showToast(res.data.message || 'Import successful');
      setShowUpload(false);
      setUploadCampaignName('');
      queryClient.invalidateQueries(['monthlyOverview']);
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

  const handleDeleteCampaign = async (name) => {
    if (!window.confirm(`Are you sure you want to delete all leads in the "${name}" tab? This cannot be undone.`)) return;

    try {
      await API.delete(`/sales/campaign/${encodeURIComponent(name)}?month=${monthId}`);
      showToast('Campaign deleted successfully');
      setActiveCampaign(null);
      queryClient.invalidateQueries(['monthlyOverview']);
    } catch (err) {
      showToast(err.response?.data?.message || 'Delete failed', 'error');
    }
  };

  // Member lists for dropdowns
  const allMembers = teamMembers.map(m => m.name);
  const salesMembers = teamMembers.filter(m => ['sales-team'].includes(m.role)).map(m => m.name);

  // Weekly Chart Data (Mocking week distribution if not available in DB)
  const chartData = [
    { name: 'Week 1', revenue: Math.round((data?.stats?.revenue || 0) * 0.2) },
    { name: 'Week 2', revenue: Math.round((data?.stats?.revenue || 0) * 0.35) },
    { name: 'Week 3', revenue: Math.round((data?.stats?.revenue || 0) * 0.25) },
    { name: 'Week 4', revenue: Math.round((data?.stats?.revenue || 0) * 0.2) },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/leads')}
            className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-brand-primary hover:border-brand-primary transition-all shadow-sm"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{monthName} Overview</h1>
            <p className="text-slate-500 text-[11px] font-medium mt-0.5 uppercase tracking-widest">Monthly Lead Performance Analysis</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Member Filter Dropdown - only for admin/manager */}
          {(user?.role === 'admin' || user?.role === 'super-admin' || user?.role === 'sales-manager') && teamMembers.filter(m => m.role === 'sales-team').length > 0 && (
            <div className="relative" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setMemberDropdownOpen(false); }}>
              <button
                onClick={() => setMemberDropdownOpen(prev => !prev)}
                className={`flex items-center gap-2 px-3.5 h-10 rounded-xl border text-xs font-bold transition-all shadow-sm min-w-[160px] justify-between ${
                  selectedMember
                    ? 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-brand-primary/40 hover:text-brand-primary'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black ${
                    selectedMember ? 'bg-brand-primary text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {selectedMember ? selectedMember.charAt(0).toUpperCase() : <User size={10} />}
                  </div>
                  <span className="truncate max-w-[100px]">{selectedMember || 'All Members'}</span>
                </div>
                <svg className={`flex-shrink-0 transition-transform duration-200 ${memberDropdownOpen ? 'rotate-180' : ''}`} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </button>

              {memberDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.08)] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-1.5">
                    {/* All Members option */}
                    <button
                      onClick={() => { setSelectedMember(''); setPage(1); setMemberDropdownOpen(false); }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        selectedMember === '' ? 'bg-indigo-50/80 text-brand-primary' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>All Members</span>
                      {selectedMember === '' && <svg className="text-brand-primary" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
                    </button>

                    {/* Sales team members only */}
                    {teamMembers
                      .filter(m => m.role === 'sales-team')
                      .map(m => (
                        <button
                          key={m._id || m.name}
                          onClick={() => { setSelectedMember(m.name); setPage(1); setMemberDropdownOpen(false); }}
                          className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                            selectedMember === m.name ? 'bg-indigo-50/80 text-brand-primary' : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span className="truncate">{m.name}</span>
                          {selectedMember === m.name && <svg className="text-brand-primary flex-shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
                        </button>
                      ))
                    }
                </div>
              )}
            </div>
          )}
          <button 
            onClick={exportLeadsToExcel}
            className="bg-white border border-slate-200 text-slate-600 px-4 h-10 rounded-xl text-xs font-bold uppercase tracking-widest transition-all hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 flex items-center gap-2 active:scale-95 shadow-sm"
          >
            <FileDown size={16} />
            <span>Export Report</span>
          </button>
          <button 
            onClick={() => setShowManual(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 h-10 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 active:scale-95"
          >
            <Plus size={16} />
            <span>Add Lead</span>
          </button>
        </div>
      </div>


      {/* KPI Row */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
        {(user?.role === 'admin' || user?.role === 'super-admin' || user?.role === 'sales-manager' || user?.role === 'sales-team') && (
          <OverviewCard title="Revenue" value={`₹${data?.stats?.revenue?.toLocaleString() || 0}`} icon={IndianRupee} />
        )}
        <OverviewCard title="Leads" value={data?.stats?.count || 0} icon={Users} color="bg-indigo-500" />
        <OverviewCard title="Converted" value={data?.stats?.converted || 0} icon={CheckCircle2} color="bg-emerald-500" />
        {(user?.role === 'admin' || user?.role === 'super-admin' || user?.role === 'sales-manager' || user?.role === 'sales-team') && (
          <>
            <OverviewCard title="Received" value={`₹${data?.stats?.received?.toLocaleString() || 0}`} icon={Wallet} color="bg-cyan-600" />
            <OverviewCard title="Profit" value={`₹${data?.stats?.profit?.toLocaleString() || 0}`} icon={TrendingUp} color="bg-slate-900" />
          </>
        )}
      </div>
 
       {/* Weekly Analysis Chart - Zig Zag Style */}
       <div className="bg-white/70 backdrop-blur-xl p-5 rounded-[24px] border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-[40px] animate-pulse" />
          
          <div className="flex items-center justify-between mb-4 relative z-10">
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_4px_15px_rgba(99,102,241,0.3)]">
                   <TrendingUp size={14} className="text-white" />
                </div>
                <div>
                   <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Weekly Performance</h3>
                   <p className="text-xs font-black text-slate-900 tracking-tight">Revenue Pulse</p>
                </div>
             </div>
             <div className="bg-brand-primary/10 px-2 py-0.5 rounded-full border border-brand-primary/20">
                <span className="text-[9px] font-black text-brand-primary tracking-tight">LIVE PULSE</span>
             </div>
          </div>
          
          <div className="h-[120px] w-full relative z-10">
                          <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                   <defs>
                      <linearGradient id="monthGradient" x1="0" y1="0" x2="1" y2="0">
                         <stop offset="0%" stopColor="#6366f1" />
                         <stop offset="100%" stopColor="#ec4899" />
                      </linearGradient>
                      <linearGradient id="monthFill" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                         <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                   </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.4} />
                    <XAxis 
                       dataKey="name" 
                       axisLine={false} 
                       tickLine={false} 
                       tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 700 }}
                       dy={10}
                    />
                    <YAxis hide={true} domain={['dataMin - 100', 'dataMax + 100']} />
                    <Tooltip 
                       contentStyle={{ 
                          borderRadius: '12px', 
                          border: 'none', 
                          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                          fontSize: '11px',
                          fontWeight: '900',
                          backgroundColor: 'rgba(255, 255, 255, 0.8)',
                          backdropFilter: 'blur(10px)'
                       }}
                       itemStyle={{ color: '#1e293b' }}
                    />
                    <Area 
                       type="monotone" 
                       dataKey="revenue" 
                       stroke="#6366f1" 
                       strokeWidth={4} 
                       fill="url(#monthFill)" 
                       strokeLinecap="round"
                       animationDuration={1500} 
                       dot={{ 
                          r: 4, 
                          fill: '#6366f1', 
                          stroke: '#fff', 
                          strokeWidth: 2,
                          fillOpacity: 1
                       }}
                       activeDot={{ 
                          r: 6, 
                          fill: '#6366f1', 
                          stroke: '#fff', 
                          strokeWidth: 3,
                          style: { filter: 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.4))' }
                       }}
                    />
                </AreaChart>
             </ResponsiveContainer>
          </div>
       </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Lead Table Section */}
        <div className="lg:col-span-12">
           {/* Tabs & Search */}
           <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-3 bg-slate-50/50 border-b border-slate-100">
                <div className="flex gap-2">
                  {['origin', 'follow-up', 'converted', 'not-converted'].map(tab => {
                    const counts = {
                      'origin': data?.stats?.originCount || 0,
                      'follow-up': data?.stats?.followUpCount || 0,
                      'converted': data?.stats?.converted || 0,
                      'not-converted': data?.stats?.notConvertedCount || 0
                    };
                    return (
                      <div key={tab} className="flex items-center">
                        <button
                          onClick={() => { setActiveTab(tab); setPage(1); setSelectedLeads([]); }}
                          className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                            activeTab === tab 
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' 
                            : 'text-slate-400 hover:text-slate-600 hover:bg-white'
                          }`}
                        >
                          <span>{tab.replace('-', ' ')}</span>
                          <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${
                            activeTab === tab ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {counts[tab]}
                          </span>
                        </button>
                        {tab === 'not-converted' && (
                          <button 
                            onClick={() => setShowUpload(true)}
                            className="ml-1 p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            title="Import Excel"
                          >
                            <Plus size={14} />
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {/* Dynamic Campaign Tabs */}
                  {campaigns.map(camp => (
                    <div key={camp} className="flex items-center group/tab relative">
                      <button
                        onClick={() => { setActiveCampaign(camp === activeCampaign ? null : camp); setPage(1); }}
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                          activeCampaign === camp 
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-100' 
                          : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        {camp}
                      </button>
                      
                      {/* Edit option for tab (Allows re-uploading into this campaign) */}
                      <button 
                        onClick={() => { setUploadCampaignName(camp); setShowUpload(true); }}
                        className="ml-1 p-1 text-slate-300 hover:text-emerald-600 opacity-0 group-hover/tab:opacity-100 transition-all"
                        title="Update Data"
                      >
                        <Plus size={10} />
                      </button>

                      {/* Delete option for tab */}
                      <button 
                        onClick={() => handleDeleteCampaign(camp)}
                        className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover/tab:opacity-100 transition-all"
                        title="Delete Tab"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                 </div>

                 {/* Server-side Search */}
                 <div className="relative w-full sm:w-64">
                   <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                   <input 
                     type="text"
                     placeholder="Search leads..."
                     value={searchQuery}
                     onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                     className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-medium focus:ring-2 focus:ring-brand-shadow outline-none transition-all"
                   />
                 </div>
              </div>
           </div>

           <div className="overflow-x-auto min-h-[400px]">
                <table className="w-full border-separate border-spacing-y-3 px-1">
                <thead>
                  <tr className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {activeTab === 'origin' && (
                       <>
                         <th className="px-6 py-4">Lead ID</th>
                         <th className="px-4 py-4">Name</th>
                         <th className="px-4 py-4">Phone</th>
                         <th className="px-4 py-4">Source</th>
                         <th className="px-4 py-4">Campaign</th>
                         <th className="px-4 py-4">Requirement</th>
                         <th className="px-4 py-4">Budget</th>
                         <th className="px-4 py-4 min-w-[120px]">Handled By</th>
                         <th className="px-4 py-4">Status</th>
                         <th className="px-4 py-4 text-right pr-6">Actions</th>
                       </>
                    )}
                    {activeTab === 'follow-up' && (
                       <>
                         <th className="px-6 py-4">S.No</th>
                         <th className="px-4 py-4">Name</th>
                         <th className="px-4 py-4">Phone</th>
                         <th className="px-4 py-4">Source</th>
                         <th className="px-4 py-4 text-nowrap">Location</th>
                         <th className="px-4 py-4">Date</th>
                         <th className="px-4 py-4">Priority</th>
                         <th className="px-4 py-4">Work</th>
                         <th className="px-4 py-4 whitespace-nowrap">Next Follow</th>
                         <th className="px-4 py-4">Status</th>
                         <th className="px-4 py-4 min-w-[120px]">Handled By</th>
                         <th className="px-4 py-4">Amount</th>
                         <th className="px-4 py-4">Remarks</th>
                         <th className="px-4 py-4 text-right pr-6">Actions</th>
                       </>
                    )}
                    {activeTab === 'converted' && (
                       <>
                         <th className="px-6 py-4">S.No</th>
                         <th className="px-4 py-4">Client</th>
                         <th className="px-4 py-4">Phone</th>
                         <th className="px-4 py-4">Work</th>
                         <th className="px-4 py-4">Source</th>
                         <th className="px-4 py-4">Converted</th>
                         <th className="px-4 py-4 whitespace-nowrap">Assigned To</th>
                         <th className="px-4 py-4">Date</th>
                         <th className="px-4 py-4 text-center">Total </th>
                         <th className="px-4 py-4 text-center">Advance </th>
                         <th className="px-4 py-4 text-center">Pending </th>
                         <th className="px-4 py-4 whitespace-nowrap">Payment</th>
                         <th className="px-4 py-4">Status</th>
                         <th className="px-4 py-4">Deadline</th>
                         <th className="px-4 py-4">Remarks</th>
                         <th className="px-4 py-4 text-right pr-6">Actions</th>
                       </>
                    )}
                    {activeTab === 'not-converted' && (
                       <>
                         <th className="px-6 py-4">Lead ID</th>
                         <th className="px-4 py-4">Name</th>
                         <th className="px-4 py-4">Phone</th>
                         <th className="px-4 py-4">Source</th>
                         <th className="px-4 py-4">Location</th>
                         <th className="px-4 py-4">Date</th>
                          <th className="px-4 py-4 whitespace-nowrap">Handled By</th>
                         <th className="px-4 py-4 text-center">Amount</th>
                         <th className="px-4 py-4">Status</th>
                         <th className="px-4 py-4">Remarks</th>
                         <th className="px-4 py-4 text-right pr-6">Actions</th>
                       </>
                    )}
                  </tr>
                </thead>
                <tbody className={`transition-all duration-500 ${isFetching && !isLoading ? 'opacity-40 pointer-events-none grayscale-[0.5]' : 'opacity-100'}`}>
                  {tableLoading ? (
                    [...Array(8)].map((_, i) => (
                      <tr key={i} className="animate-pulse border-b border-slate-50">
                        <td colSpan="20" className="px-6 py-6">
                           <div className="flex gap-4 items-center">
                              <div className="w-10 h-10 bg-slate-100 rounded-xl" />
                              <div className="h-4 w-1/4 bg-slate-100 rounded-lg" />
                              <div className="h-4 w-1/6 bg-slate-100 rounded-lg" />
                              <div className="h-4 w-1/6 bg-slate-100 rounded-lg" />
                              <div className="h-4 w-1/6 bg-slate-100 rounded-lg ml-auto" />
                           </div>
                        </td>
                      </tr>
                    ))
                  ) : filteredLeads.map((lead, idx) => {
                    const isSelected = selectedLeads.includes(lead._id);
                    const isItemOverdue = (activeTab === 'converted' && isOverdue(lead.deadline) && lead.deliveryStatus !== 'completed') || 
                                         (activeTab === 'follow-up' && isOverdue(lead.nextFollowUp));
                    
                    return (
                    <tr 
                      key={lead._id} 
                      onClick={(e) => {
                        if (['SELECT', 'INPUT', 'TEXTAREA', 'BUTTON'].includes(e.target.tagName) || e.target.closest('a')) return;
                        toggleLeadSelection(lead._id);
                      }}
                      className={`group transition-all duration-300 cursor-pointer hover:scale-[1.005] relative
                        ${isSelected ? 'z-10' : ''} ${isItemOverdue ? 'animate-pulse-slow' : ''}`}
                    >
                      {activeTab === 'origin' && (
                        <>
                          <td className={`px-6 py-5 first:rounded-l-2xl border-y border-l transition-all shadow-sm group-hover:shadow-md ${isSelected ? 'bg-indigo-50/50 border-brand-primary shadow-brand-shadow' : isItemOverdue ? 'bg-red-100 border-red-200' : 'bg-white border-slate-100'}`}>
                             <div className="flex items-center gap-3">
                                <span className={`w-2 h-2 rounded-full ${lead.status === 'converted' ? 'bg-emerald-500' : 'bg-brand-primary'} shadow-sm shadow-brand-shadow`}></span>
                                <span className="text-[11px] font-bold text-slate-500 font-mono bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">{lead.leadId}</span>
                             </div>
                          </td>
                          <td className={`px-4 py-5 border-y transition-all shadow-sm group-hover:shadow-md ${isSelected ? 'bg-indigo-50/50 border-brand-primary shadow-brand-shadow' : isItemOverdue ? 'bg-red-100 border-red-200' : 'bg-white border-slate-100'} text-[13px] font-bold text-slate-900 group relative`}>
                              <div 
                                className="flex flex-col cursor-pointer hover:text-brand-primary transition-colors"
                                onClick={(e) => { e.stopPropagation(); setSelectedLeadForDetail(lead); }}
                              >
                                <span>{lead.name}</span>
                                {lead.email && <span className="text-[10px] text-brand-primary/70 font-medium lowercase tracking-tight">{lead.email}</span>}
                                {lead.address && (
                                  <span className="text-[9px] text-slate-400 font-normal group-hover:text-brand-primary truncate max-w-[150px]" title={lead.address}>
                                    {lead.address}
                                  </span>
                                )}
                              </div>
                           </td>

                          <td className={`px-4 py-5 border-y transition-all shadow-sm group-hover:shadow-md ${isSelected ? 'bg-indigo-50/50 border-brand-primary shadow-brand-shadow' : isItemOverdue ? 'bg-red-100 border-red-200' : 'bg-white border-slate-100'} text-[12px] text-slate-600 font-medium whitespace-nowrap`}>
                            <div className="flex items-center gap-2">
                              <span>{lead.phone || '--'}</span>
                              {lead.phone && (
                                <a href={`https://wa.me/91${lead.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-emerald-500 hover:text-emerald-600 transition-colors">
                                  <MessageSquare size={13} strokeWidth={2.5} />
                                </a>
                              )}
                            </div>
                          </td>
                          <td className={`px-4 py-5 border-y transition-all shadow-sm group-hover:shadow-md ${isSelected ? 'bg-indigo-50/50 border-brand-primary shadow-brand-shadow' : isItemOverdue ? 'bg-red-100 border-red-200' : 'bg-white border-slate-100'} text-[10px] font-bold text-slate-500 uppercase tracking-widest`}>{lead.source}</td>
                          <td className={`px-4 py-5 border-y transition-all shadow-sm group-hover:shadow-md ${isSelected ? 'bg-indigo-50/50 border-brand-primary shadow-brand-shadow' : isItemOverdue ? 'bg-red-100 border-red-200' : 'bg-white border-slate-100'} text-[10px] font-bold text-indigo-600 uppercase tracking-widest`}>{lead.campaign || '--'}</td>
                          <td className={`px-4 py-5 border-y transition-all shadow-sm group-hover:shadow-md ${isSelected ? 'bg-indigo-50/50 border-brand-primary shadow-brand-shadow' : isItemOverdue ? 'bg-red-100 border-red-200' : 'bg-white border-slate-100'} text-[12px] text-slate-500 font-medium max-w-[220px]`} title={lead.requirement}>
                            <div className="whitespace-normal line-clamp-2 leading-relaxed">{lead.requirement}</div>
                          </td>
                          <td className={`px-4 py-5 border-y transition-all shadow-sm group-hover:shadow-md ${isSelected ? 'bg-indigo-50/50 border-brand-primary shadow-brand-shadow' : isItemOverdue ? 'bg-red-100 border-red-200' : 'bg-white border-slate-100'} text-[12px] font-bold text-slate-900`}>₹{lead.budget?.toLocaleString()}</td>
                          <td className={`px-4 py-5 border-y transition-all shadow-sm group-hover:shadow-md ${isSelected ? 'bg-indigo-50/50 border-brand-primary shadow-brand-shadow' : isItemOverdue ? 'bg-red-100 border-red-200' : 'bg-white border-slate-100'}`}>
                            <PremiumSelect 
                              value={lead.convertedBy || ''}
                              options={[
                                { label: 'Sales Owner', value: '' },
                                ...salesMembers.map(name => ({ label: name, value: name }))
                              ]}
                              onChange={(val) => handleOptimisticUpdate(lead._id, { convertedBy: val })}
                              className="w-28"
                            />
                          </td>
                          <td className={`px-4 py-5 border-y transition-all shadow-sm group-hover:shadow-md ${isSelected ? 'bg-indigo-50/50 border-brand-primary shadow-brand-shadow' : isItemOverdue ? 'bg-red-100 border-red-200' : 'bg-white border-slate-100'}`}>
                            <div className="flex items-center gap-2">
                              <PremiumSelect 
                                value={lead.status}
                                disabled={!lead.convertedBy}
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
                                toggleClassName={lead.status === 'converted' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : lead.status === 'not-converted' ? 'bg-slate-50 text-slate-500 border-slate-100' : 'bg-white text-brand-primary border-brand-primary/20'}
                                className="w-32"
                              />
                              <button 
                                onClick={(e) => { e.stopPropagation(); setSelectedLeadForNote(lead); }}
                                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-indigo-600 rounded-lg transition-all"
                                title="Conversation Notes"
                              >
                                <NotebookPen size={14} />
                              </button>
                            </div>
                          </td>
                        </>
                      )}

                      {activeTab === 'not-converted' && (
                        <>
                          <td className={`px-6 py-5 first:rounded-l-2xl border-y border-l transition-all shadow-sm group-hover:shadow-md ${isSelected ? 'bg-indigo-50/50 border-brand-primary shadow-brand-shadow' : 'bg-white border-slate-100'}`}>
                             <div className="flex items-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                                <span className="text-[11px] font-bold text-slate-500 font-mono bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">{lead.leadId}</span>
                             </div>
                          </td>
                          <td className={`px-4 py-5 border-y transition-all shadow-sm group-hover:shadow-md ${isSelected ? 'bg-indigo-50/50 border-brand-primary shadow-brand-shadow' : 'bg-white border-slate-100'} text-[13px] font-bold text-slate-900 group relative`}>
                              <div 
                                className="flex flex-col cursor-pointer hover:text-brand-primary transition-colors"
                                onClick={(e) => { e.stopPropagation(); setSelectedLeadForDetail(lead); }}
                              >
                                <span>{lead.name}</span>
                                {lead.email && <span className="text-[10px] text-brand-primary/70 font-medium lowercase tracking-tight">{lead.email}</span>}
                              </div>
                           </td>
                          <td className={`px-4 py-5 border-y transition-all shadow-sm group-hover:shadow-md ${isSelected ? 'bg-indigo-50/50 border-brand-primary shadow-brand-shadow' : 'bg-white border-slate-100'} text-[12px] text-slate-600 font-medium whitespace-nowrap`}>
                             <div className="flex items-center gap-2">
                               <span>{lead.phone || '--'}</span>
                             </div>
                          </td>
                          <td className={`px-4 py-5 border-y transition-all shadow-sm group-hover:shadow-md ${isSelected ? 'bg-indigo-50/50 border-brand-primary shadow-brand-shadow' : 'bg-white border-slate-100'} text-[10px] font-bold text-slate-500 uppercase tracking-widest`}>{lead.source || '-'}</td>
                          <td className={`px-4 py-5 border-y transition-all shadow-sm group-hover:shadow-md ${isSelected ? 'bg-indigo-50/50 border-brand-primary shadow-brand-shadow' : 'bg-white border-slate-100'} text-[12px] text-slate-500 font-medium`}>{lead.location || '-'}</td>
                          <td className={`px-4 py-5 border-y transition-all shadow-sm group-hover:shadow-md ${isSelected ? 'bg-indigo-50/50 border-brand-primary shadow-brand-shadow' : 'bg-white border-slate-100'} text-[12px] text-slate-600 font-medium`}>{new Date(lead.date).toLocaleDateString('en-GB')}</td>
                          <td className={`px-4 py-5 border-y transition-all shadow-sm group-hover:shadow-md ${isSelected ? 'bg-indigo-50/50 border-brand-primary shadow-brand-shadow' : 'bg-white border-slate-100'} text-[11px] font-bold text-slate-600`}>{lead.convertedBy || 'Sales Staff'}</td>
                          <td className={`px-4 py-5 border-y transition-all shadow-sm group-hover:shadow-md ${isSelected ? 'bg-indigo-50/50 border-brand-primary shadow-brand-shadow' : 'bg-white border-slate-100'} text-center text-[12px] font-bold text-slate-900`}>₹{(lead.budget || lead.totalAmount || 0).toLocaleString()}</td>
                          <td className={`px-4 py-5 border-y transition-all shadow-sm group-hover:shadow-md ${isSelected ? 'bg-indigo-50/50 border-brand-primary shadow-brand-shadow' : 'bg-white border-slate-100'}`}>
                             <PremiumSelect 
                               value={lead.status}
                               options={[
                                 { label: 'Origin', value: 'origin' },
                                 { label: 'Follow-up', value: 'follow-up' },
                                 { label: 'Converted', value: 'converted' },
                                 { label: 'Not Converted', value: 'not-converted' }
                               ]}
                               onChange={(val) => handleOptimisticUpdate(lead._id, { status: val })}
                               variant="status"
                               toggleClassName="bg-slate-50 text-slate-500 border-slate-100 font-bold uppercase tracking-widest text-[9px]"
                               className="w-32"
                             />
                          </td>
                          <td className={`px-4 py-5 border-y transition-all shadow-sm group-hover:shadow-md ${isSelected ? 'bg-indigo-50/50 border-brand-primary shadow-brand-shadow' : 'bg-white border-slate-100'} text-[11px] font-bold text-slate-500`}>
                             <input 
                               type="text"
                               defaultValue={lead.remarks || ''}
                               placeholder="Reason for loss..."
                               onBlur={(e) => {
                                 if (e.target.value !== lead.remarks) handleUpdateLead(lead._id, { remarks: e.target.value });
                               }}
                               className="bg-transparent border-none text-[11px] font-medium text-slate-700 focus:ring-0 p-0 w-24 placeholder:text-slate-400"
                             />
                          </td>
                        </>
                      )}

                      {activeTab === 'follow-up' && (
                         <>
                           <td className={`px-6 py-5 first:rounded-l-2xl border-y border-l transition-all shadow-sm group-hover:shadow-md ${isSelected ? 'bg-indigo-50/50 border-brand-primary shadow-brand-shadow' : isItemOverdue ? 'bg-red-100 border-red-200' : 'bg-white border-slate-100'} text-[11px] font-bold text-slate-400`}>{idx + 1}</td>
                          <td className={`px-4 py-5 border-y transition-all shadow-sm group-hover:shadow-md ${isSelected ? 'bg-indigo-50/50 border-brand-primary shadow-brand-shadow' : isItemOverdue ? 'bg-red-100 border-red-200' : 'bg-white border-slate-100'}`}>
                              <div 
                                className="flex flex-col cursor-pointer hover:text-brand-primary transition-colors"
                                onClick={(e) => { e.stopPropagation(); setSelectedLeadForDetail(lead); }}
                              >
                                <span>{lead.name}</span>
                                {lead.email && <span className="text-[10px] text-brand-primary/70 font-medium lowercase tracking-tight">{lead.email}</span>}
                                {lead.address && (
                                  <span className="text-[9px] text-slate-400 font-normal group-hover:text-brand-primary truncate max-w-[150px]" title={lead.address}>
                                    {lead.address}
                                  </span>
                                )}
                              </div>
                           </td>

                           <td className={`px-4 py-5 border-y transition-all shadow-sm group-hover:shadow-md ${isSelected ? 'bg-indigo-50/50 border-brand-primary shadow-brand-shadow' : isItemOverdue ? 'bg-red-100 border-red-200' : 'bg-white border-slate-100'} text-[12px] text-slate-600 font-medium whitespace-nowrap`}>
                             <div className="flex items-center gap-2">
                               <span>{lead.phone || '--'}</span>
                               <div className="flex gap-1.5 translate-y-[1px]">
                                  {lead.phone && (
                                    <a href={`https://wa.me/91${lead.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-emerald-500 hover:text-emerald-600 transition-all hover:scale-110">
                                      <MessageSquare size={13} strokeWidth={2.5} />
                                    </a>
                                  )}
                                  {lead.email && (
                                    <a href={`mailto:${lead.email}`} className="text-brand-primary hover:text-brand-primary/80 transition-all hover:scale-110">
                                      <Mail size={13} strokeWidth={2.5} />
                                    </a>
                                  )}
                                </div>
                              </div>
                           </td>
                           <td className={`px-4 py-5 border-y transition-all shadow-sm group-hover:shadow-md ${isSelected ? 'bg-indigo-50/50 border-brand-primary shadow-brand-shadow' : isItemOverdue ? 'bg-red-100 border-red-200' : 'bg-white border-slate-100'} text-[10px] font-bold text-slate-500 uppercase tracking-widest`}>{lead.source || '-'}</td>
                           <td className={`px-4 py-5 border-y transition-all shadow-sm group-hover:shadow-md ${isSelected ? 'bg-indigo-50/50 border-brand-primary shadow-brand-shadow' : isItemOverdue ? 'bg-red-100 border-red-200' : 'bg-white border-slate-100'} text-[12px] text-slate-600 font-medium`}>{lead.location || 'City'}</td>
                           <td className={`px-4 py-5 border-y transition-all shadow-sm group-hover:shadow-md ${isSelected ? 'bg-indigo-50/50 border-brand-primary shadow-brand-shadow' : isItemOverdue ? 'bg-red-100 border-red-200' : 'bg-white border-slate-100'} text-[12px] text-slate-600 font-medium`}>{new Date(lead.date).toLocaleDateString('en-GB')}</td>
                          <td className={`px-4 py-5 border-y transition-all shadow-sm group-hover:shadow-md ${isSelected ? 'bg-indigo-50/50 border-brand-primary shadow-brand-shadow' : isItemOverdue ? 'bg-red-100 border-red-200' : 'bg-white border-slate-100'}`}>
                              <PremiumSelect 
                                value={lead.priority}
                                options={[
                                  { label: 'Low', value: 'low' },
                                  { label: 'Normal', value: 'normal' },
                                  { label: 'High', value: 'high', className: 'text-rose-600' }
                                ]}
                                onChange={(val) => handleOptimisticUpdate(lead._id, { priority: val })}
                                variant="status"
                                toggleClassName={lead.priority === 'high' ? 'bg-red-50 text-red-600 border-red-100' : lead.priority === 'normal' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-500 border-slate-100'}
                                className="w-24"
                              />
                           </td>
                           <td className={`px-4 py-5 border-y transition-all shadow-sm group-hover:shadow-md ${isSelected ? 'bg-indigo-50/50 border-brand-primary shadow-brand-shadow' : isItemOverdue ? 'bg-red-100 border-red-200' : 'bg-white border-slate-100'} text-[12px] text-slate-500 font-medium max-w-[220px]`} title={lead.workType || lead.requirement}>
                             <div className="whitespace-normal line-clamp-2 leading-relaxed">{lead.workType || lead.requirement}</div>
                           </td>
                           <td className={`px-4 py-5 border-y transition-all shadow-sm group-hover:shadow-md ${isSelected ? 'bg-indigo-50/50 border-brand-primary shadow-brand-shadow' : isItemOverdue ? 'bg-red-100 border-red-200' : 'bg-white border-slate-100'} text-[11px] font-bold`}>
                              <PremiumDatePicker
                                value={lead.nextFollowUp}
                                onChange={(val) => handleOptimisticUpdate(lead._id, { nextFollowUp: val })}
                                isOverdue={isOverdue(lead.nextFollowUp)}
                                placeholder="Next Follow"
                              />
                           </td>
                          <td className={`px-4 py-5 border-y transition-all shadow-sm group-hover:shadow-md ${isSelected ? 'bg-indigo-50/50 border-brand-primary shadow-brand-shadow' : isItemOverdue ? 'bg-red-100 border-red-200' : 'bg-white border-slate-100'}`}>
                             <div className="flex items-center gap-2">
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
                                 toggleClassName={lead.status === 'converted' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : lead.status === 'not-converted' ? 'bg-slate-50 text-slate-500 border-slate-100' : 'bg-white text-brand-primary border-brand-primary/20'}
                                 className="w-32"
                               />
                               <button 
                                 onClick={(e) => { e.stopPropagation(); setSelectedLeadForNote(lead); }}
                                 className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-indigo-600 rounded-lg transition-all"
                                 title="Conversation Notes"
                               >
                                 <NotebookPen size={14} />
                               </button>
                             </div>
                           </td>
                           <td className={`px-4 py-5 border-y transition-all shadow-sm group-hover:shadow-md ${isSelected ? 'bg-indigo-50/50 border-brand-primary shadow-brand-shadow' : isItemOverdue ? 'bg-red-100 border-red-200' : 'bg-white border-slate-100'} text-[11px] font-bold text-brand-primary text-left`}>
                             <PremiumSelect 
                               value={lead.convertedBy || ''}
                               options={[
                                 { label: 'Sales Owner', value: '' },
                                 ...salesMembers.map(name => ({ label: name, value: name }))
                               ]}
                               onChange={(val) => handleOptimisticUpdate(lead._id, { convertedBy: val })}
                               className="w-28"
                             />
                           </td>
                           <td className={`px-4 py-5 border-y transition-all shadow-sm group-hover:shadow-md ${isSelected ? 'bg-indigo-50/50 border-brand-primary shadow-brand-shadow' : isItemOverdue ? 'bg-red-100 border-red-200' : 'bg-white border-slate-100'} text-[12px] font-bold text-slate-900`}>{lead.totalAmount || lead.budget || 0}</td>
                          <td className={`px-4 py-5 border-y transition-all shadow-sm group-hover:shadow-md ${isSelected ? 'bg-indigo-50/50 border-brand-primary shadow-brand-shadow' : isItemOverdue ? 'bg-red-100 border-red-200' : 'bg-white border-slate-100'}`}>
                              <textarea
                                defaultValue={lead.remarks || ''}
                                onBlur={(e) => {
                                  if (e.target.value !== lead.remarks) handleUpdateLead(lead._id, { remarks: e.target.value });
                                }}
                                className="bg-white border border-slate-200 text-[11px] font-medium rounded-lg px-2 py-1 focus:ring-1 focus:ring-brand-primary w-32 h-[34px] resize-none shadow-sm"
                                placeholder="Remarks..."
                              />
                           </td>
                         </>
                      )}

                      {activeTab === 'converted' && (
                         <>
                           <td className={`px-6 py-5 first:rounded-l-2xl border-y border-l transition-all shadow-sm group-hover:shadow-md ${isSelected ? 'bg-indigo-50/50 border-brand-primary shadow-brand-shadow' : isItemOverdue ? 'bg-red-100 border-red-200' : 'bg-white border-slate-100'} text-[11px] font-bold text-slate-400`}>{idx + 1}</td>
                          <td className={`px-4 py-5 border-y transition-all shadow-sm group-hover:shadow-md ${isSelected ? 'bg-indigo-50/50 border-brand-primary shadow-brand-shadow' : isItemOverdue ? 'bg-red-100 border-red-200' : 'bg-white border-slate-100'}`}>
                              <div 
                                className="flex flex-col cursor-pointer hover:text-brand-primary transition-colors"
                                onClick={(e) => { e.stopPropagation(); setSelectedLeadForDetail(lead); }}
                              >
                                <span>{lead.name}</span>
                                {lead.email && <span className="text-[10px] text-brand-primary/70 font-medium lowercase tracking-tight">{lead.email}</span>}
                                {lead.address && (
                                  <span className="text-[9px] text-slate-400 font-normal group-hover:text-brand-primary truncate max-w-[150px]" title={lead.address}>
                                    {lead.address}
                                  </span>
                                )}
                              </div>
                           </td>

                           <td className={`px-4 py-5 border-y transition-all shadow-sm group-hover:shadow-md ${isSelected ? 'bg-indigo-50/50 border-brand-primary shadow-brand-shadow' : isItemOverdue ? 'bg-red-100 border-red-200' : 'bg-white border-slate-100'} text-[12px] text-slate-600 font-medium whitespace-nowrap`}>
                             <div className="flex items-center gap-2">
                               <span>{lead.phone || '--'}</span>
                               <div className="flex gap-1.5 translate-y-[1px]">
                                  {lead.phone && (
                                    <a href={`https://wa.me/91${lead.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-emerald-500 hover:text-emerald-600 transition-all hover:scale-110">
                                      <MessageSquare size={13} strokeWidth={2.5} />
                                    </a>
                                  )}
                                  {lead.email && (
                                    <a href={`mailto:${lead.email}`} className="text-brand-primary hover:text-brand-primary/80 transition-all hover:scale-110">
                                      <Mail size={13} strokeWidth={2.5} />
                                    </a>
                                  )}
                                </div>
                              </div>
                           </td>
                           <td className={`px-4 py-5 border-y transition-all shadow-sm group-hover:shadow-md ${isSelected ? 'bg-indigo-50/50 border-brand-primary shadow-brand-shadow' : isItemOverdue ? 'bg-red-100 border-red-200' : 'bg-white border-slate-100'} text-[12px] text-slate-500 font-medium max-w-[220px]`} title={lead.workType || lead.requirement || ''}>
                             <div className="whitespace-normal line-clamp-2 leading-relaxed">{lead.workType || lead.requirement || 'Work...'}</div>
                           </td>
                           <td className={`px-4 py-5 border-y transition-all shadow-sm group-hover:shadow-md ${isSelected ? 'bg-indigo-50/50 border-brand-primary shadow-brand-shadow' : isItemOverdue ? 'bg-red-100 border-red-200' : 'bg-white border-slate-100'} text-[10px] font-bold text-slate-500 uppercase tracking-widest`}>{lead.source || '-'}</td>
                           <td className={`px-4 py-5 border-y transition-all shadow-sm group-hover:shadow-md ${isSelected ? 'bg-indigo-50/50 border-brand-primary shadow-brand-shadow' : isItemOverdue ? 'bg-red-100 border-red-200' : 'bg-white border-slate-100'} text-[11px] font-bold text-slate-600`}>{lead.convertedBy || 'Sales Staff'}</td>
                          <td className={`px-4 py-5 border-y transition-all shadow-sm group-hover:shadow-md ${isSelected ? 'bg-indigo-50/50 border-brand-primary shadow-brand-shadow' : isItemOverdue ? 'bg-red-100 border-red-200' : 'bg-white border-slate-100'}`}>
                             <PremiumSelect 
                               value={lead.assignedTo || ''}
                               options={[
                                 { label: 'Assign To...', value: '' },
                                 ...allMembers.map(name => ({ label: name, value: name }))
                               ]}
                               onChange={(val) => handleOptimisticUpdate(lead._id, { assignedTo: val })}
                               className="w-32"
                             />
                           </td>
                           <td className={`px-4 py-5 border-y transition-all shadow-sm group-hover:shadow-md ${isSelected ? 'bg-indigo-50/50 border-brand-primary shadow-brand-shadow' : isItemOverdue ? 'bg-red-100 border-red-200' : 'bg-white border-slate-100'} text-[12px] text-slate-600 font-medium`}>{new Date(lead.date).toLocaleDateString('en-GB')}</td>
                           <td className={`px-4 py-5 border-y transition-all shadow-sm group-hover:shadow-md ${isSelected ? 'bg-indigo-50/50 border-brand-primary shadow-brand-shadow' : isItemOverdue ? 'bg-red-100 border-red-200' : 'bg-white border-slate-100'} text-center`}>
                              <span className="text-[12px] font-bold text-slate-900">
                                ₹{(lead.totalAmount || lead.budget || 0).toLocaleString()}
                              </span>
                           </td>
                           <td className={`px-4 py-5 border-y transition-all shadow-sm group-hover:shadow-md ${isSelected ? 'bg-indigo-50/50 border-brand-primary shadow-brand-shadow' : isItemOverdue ? 'bg-red-100 border-red-200' : 'bg-white border-slate-100'} text-center`}>
                               <div className="flex items-center justify-center gap-1.5">
                                 <span className="text-[12px] font-extrabold text-emerald-600">
                                   ₹{(lead.advanceAmount || 0).toLocaleString()}
                                 </span>
                                 <button 
                                   onClick={(e) => { e.stopPropagation(); setSelectedLeadForPayment(lead); }}
                                   className="p-1 hover:bg-emerald-50 text-emerald-600 rounded transition-all"
                                   title="Add/View Installments (Kist)"
                                 >
                                    <Wallet size={12} />
                                 </button>
                               </div>
                            </td>
                           <td className={`px-4 py-5 border-y transition-all shadow-sm group-hover:shadow-md ${isSelected ? 'bg-indigo-50/50 border-brand-primary shadow-brand-shadow' : isItemOverdue ? 'bg-red-200/60 shadow-inner' : 'bg-red-50 shadow-sm'} text-[12px] font-bold text-red-600 text-center transition-colors`}>
                              {(lead.totalAmount || lead.budget || 0) - (lead.advanceAmount || 0)}
                           </td>
                          <td className={`px-4 py-5 border-y transition-all shadow-sm group-hover:shadow-md ${isSelected ? 'bg-indigo-50/50 border-brand-primary shadow-brand-shadow' : isItemOverdue ? 'bg-red-100 border-red-200' : 'bg-white border-slate-100'}`}>
                              <PremiumSelect 
                                value={lead.paymentStatus}
                                options={[
                                  { label: 'Pending', value: 'pending', className: 'text-rose-600' },
                                  { label: 'Partial', value: 'partial', className: 'text-amber-600' },
                                  { label: 'Received', value: 'received', className: 'text-emerald-600' }
                                ]}
                                onChange={(val) => handleOptimisticUpdate(lead._id, { paymentStatus: val })}
                                variant="status"
                                toggleClassName={lead.paymentStatus === 'received' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}
                                className="w-28"
                              />
                           </td>
                          <td className={`px-4 py-5 border-y transition-all shadow-sm group-hover:shadow-md ${isSelected ? 'bg-indigo-50/50 border-brand-primary shadow-brand-shadow' : isItemOverdue ? 'bg-red-100 border-red-200' : 'bg-white border-slate-100'}`}>
                              <PremiumSelect 
                                value={lead.deliveryStatus}
                                options={[
                                  { label: 'Not Started', value: 'not-started' },
                                  { label: 'In Progress', value: 'in-progress', className: 'text-blue-600' },
                                  { label: 'Completed', value: 'completed', className: 'text-emerald-600' }
                                ]}
                                onChange={(val) => handleOptimisticUpdate(lead._id, { deliveryStatus: val })}
                                variant="status"
                                toggleClassName={lead.deliveryStatus === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : lead.deliveryStatus === 'in-progress' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-50 text-slate-500 border-slate-100'}
                                className="w-32"
                              />
                           </td>
                           <td className={`px-4 py-5 border-y transition-all shadow-sm group-hover:shadow-md ${isSelected ? 'bg-indigo-50/50 border-brand-primary shadow-brand-shadow' : isItemOverdue ? 'bg-rose-50/70 border-rose-100 shadow-[inset_0_0_10px_rgba(244,63,94,0.1)]' : 'bg-white border-slate-100'} text-[11px] font-bold text-slate-500`}>
                              <PremiumDatePicker
                                value={lead.deadline}
                                onChange={(val) => handleOptimisticUpdate(lead._id, { deadline: val })}
                                isOverdue={isItemOverdue}
                                placeholder="Set Date"
                              />
                           </td>
                           <td className={`px-4 py-5 border-y transition-all shadow-sm group-hover:shadow-md ${isSelected ? 'bg-indigo-50/50 border-brand-primary shadow-brand-shadow' : isItemOverdue ? 'bg-red-100 border-red-200' : 'bg-white border-slate-100'} text-[11px] font-bold text-slate-500`}>
                             <input 
                               type="text"
                               defaultValue={lead.remarks || ''}
                               placeholder="Client satisfied..."
                               onBlur={(e) => {
                                 if (e.target.value !== lead.remarks) handleUpdateLead(lead._id, { remarks: e.target.value });
                               }}
                               className="bg-transparent border-none text-[11px] font-medium text-slate-700 focus:ring-0 p-0 w-24 placeholder:text-slate-400"
                             />
                           </td>
                         </>
                      )}

                        <td className={`px-6 py-5 text-right last:rounded-r-2xl border-y border-r transition-all shadow-sm group-hover:shadow-md ${isSelected ? 'bg-indigo-50/50 border-brand-primary shadow-brand-shadow' : isItemOverdue ? 'bg-rose-50/70 border-rose-100' : 'bg-white border-slate-100'}`}>
                        <div className="flex items-center justify-end gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                           <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               setEditModalData(lead);
                             }}
                             className="p-1.5 hover:bg-slate-200 hover:text-brand-primary rounded-lg transition-all"
                           >
                              <Edit2 size={14} />
                           </button>
                           <a href={`tel:${lead.phone}`} className="p-1.5 hover:bg-emerald-100 hover:text-emerald-600 rounded-lg transition-all"><Phone size={14} /></a>
                           <a href={`https://wa.me/91${lead.phone?.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="p-1.5 hover:bg-green-100 hover:text-green-600 rounded-lg transition-all"><MessageSquare size={14} /></a>
                           
                           <a href={`mailto:?subject=Lead Info&body=${lead.name}`} className="p-1.5 hover:bg-brand-primary/10 hover:text-brand-primary rounded-lg transition-all"><Mail size={14} /></a>
                           {user?.role !== 'sales-team' && (
                             <button 
                               onClick={(e) => { e.stopPropagation(); deleteLead(lead._id); }}
                               className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-all"
                               title="Delete Lead"
                             >
                               <Trash2 size={14} />
                             </button>
                           )}
                        </div>
                      </td>
                      </tr>
                     );
                  })}
                  {filteredLeads.length === 0 && !isFetching && !isLoading && (
                    <tr>
                      <td colSpan="20" className="py-20 text-center font-bold text-slate-300 text-sm">No data available for this pipeline stage.</td>
                    </tr>
                  )}
                </tbody>
               </table>
               {isFetching && (
                 <div className="absolute top-0 left-0 right-0 h-1 z-20 overflow-hidden">
                    <div className="h-full bg-brand-primary animate-progress-fast shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                 </div>
               )}
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-between items-center px-6 py-4 bg-slate-50/50 border-t border-slate-100">
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Showing {filteredLeads.length} of {pagination.totalLeads} leads
               </span>
               <div className="flex gap-2">
                  <button 
                    disabled={page === 1 || tableLoading}
                    onClick={() => setPage(prev => prev - 1)}
                    className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ArrowLeft size={14} />
                  </button>
                  <div className="flex items-center gap-1">
                     <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700">
                        {page}
                     </span>
                     <span className="text-[11px] font-bold text-slate-400">/ {pagination.totalPages}</span>
                  </div>
                  <button 
                    disabled={page === pagination.totalPages || tableLoading}
                    onClick={() => setPage(prev => prev + 1)}
                    className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all rotate-180"
                  >
                    <ArrowLeft size={14} />
                  </button>
               </div>
            </div>
        </div>
      </div>

      {/* Manual Entry Modal */}
      {showManual && mounted && createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl animate-in zoom-in duration-200 relative border border-slate-200">
             <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
                <div className="flex items-center gap-1.5 text-brand-primary">
                   <UserPlus size={18} />
                   <h2 className="text-sm font-bold text-slate-900 tracking-tight">Manual Lead Registration</h2>
                </div>
                <button onClick={() => setShowManual(false)} className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 transition-all"><X size={16}/></button>
             </div>

             <form onSubmit={handleManualSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 ml-0.5">Reference ID</label>
                      <div className="relative">
                         <Target className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                         <input 
                           type="text" value={manualForm.leadId}
                           onChange={(e) => setManualForm({...manualForm, leadId: e.target.value})}
                           className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-shadow outline-none text-xs font-semibold"
                           placeholder="L-301 (Optional)"
                         />
                      </div>
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 ml-0.5">Lead Name</label>
                      <div className="relative">
                         <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                         <input 
                           type="text" required value={manualForm.name}
                           onChange={(e) => setManualForm({...manualForm, name: e.target.value})}
                           className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-shadow outline-none text-xs font-semibold"
                           placeholder="John Doe"
                         />
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 ml-0.5">Email Address</label>
                      <div className="relative">
                         <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                         <input 
                           type="email" value={manualForm.email}
                           onChange={(e) => setManualForm({...manualForm, email: e.target.value})}
                           className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-shadow outline-none text-xs font-semibold"
                           placeholder="john@example.com"
                         />
                      </div>
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 ml-0.5">Contact Phone</label>
                      <div className="relative">
                         <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                         <input 
                           type="text" required value={manualForm.phone}
                           onChange={(e) => setManualForm({...manualForm, phone: e.target.value})}
                           className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-shadow outline-none text-xs font-semibold"
                           placeholder="9876543210"
                         />
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 ml-0.5">Traffic Source</label>
                      <div className="relative">
                         <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                         <input 
                           type="text" value={manualForm.source}
                           onChange={(e) => setManualForm({...manualForm, source: e.target.value})}
                           className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-shadow outline-none text-xs font-semibold"
                           placeholder="Fb Ads, Website..."
                         />
                      </div>
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 ml-0.5">Physical Location</label>
                      <div className="relative">
                         <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                         <input 
                           type="text" value={manualForm.location}
                           onChange={(e) => setManualForm({...manualForm, location: e.target.value})}
                           className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-shadow outline-none text-xs font-semibold"
                           placeholder="Delhi, Mumbai..."
                         />
                      </div>
                   </div>
                </div>

                <div className="space-y-1">
                   <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 ml-0.5">Requirement Details</label>
                   <textarea 
                     rows="2" value={manualForm.requirement}
                     onChange={(e) => setManualForm({...manualForm, requirement: e.target.value})}
                     className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-shadow outline-none text-xs font-semibold resize-none"
                     placeholder="Looking for web development services..."
                   />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 ml-0.5">Estimated Budget</label>
                      <div className="relative">
                         <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                         <input 
                           type="number" value={manualForm.budget}
                           onChange={(e) => setManualForm({...manualForm, budget: e.target.value})}
                           className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-shadow outline-none text-xs font-semibold"
                           placeholder="50000"
                         />
                      </div>
                   </div>
                </div>

                <button 
                  type="submit" disabled={manualLoading}
                  className="w-full py-3 mt-2 bg-brand-primary text-white font-bold uppercase tracking-[0.2em] text-[10px] rounded-xl hover:bg-brand-hover shadow-lg shadow-brand-shadow transition-all flex items-center justify-center gap-2"
                >
                  {manualLoading ? (
                     <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : <Plus size={14}/>}
                  <span>{manualLoading ? 'Registering...' : 'Finalize Manual Add'}</span>
                </button>
             </form>
          </div>
        </div>,
        document.body
      )}

       {/* Edit Entry Modal */}
       {editModalData && mounted && createPortal(
         <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
           <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl animate-in zoom-in duration-200 relative border border-slate-200">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
                 <div className="flex items-center gap-1.5 text-brand-primary">
                    <Edit2 size={18} />
                    <h2 className="text-sm font-bold text-slate-900 tracking-tight">Edit Lead Information</h2>
                 </div>
                 <button onClick={() => setEditModalData(null)} className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 transition-all"><X size={16}/></button>
              </div>

              <form onSubmit={handleFullEditSubmit} className="p-6 space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 ml-0.5">Reference ID</label>
                       <input 
                         type="text" value={editModalData.leadId || ''}
                         onChange={(e) => setEditModalData({...editModalData, leadId: e.target.value})}
                         className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-shadow outline-none text-xs font-semibold"
                       />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 ml-0.5">Lead Name</label>
                       <div className="relative">
                          <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                          <input 
                            type="text" required value={editModalData.name || ''}
                            onChange={(e) => setEditModalData({...editModalData, name: e.target.value})}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-shadow outline-none text-xs font-semibold"
                          />
                       </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 ml-0.5">Contact Number</label>
                       <input 
                         type="text" required value={editModalData.phone || ''}
                         onChange={(e) => setEditModalData({...editModalData, phone: e.target.value})}
                         className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-shadow outline-none text-xs font-semibold"
                       />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 ml-0.5">Traffic Source</label>
                       <input 
                         type="text" value={editModalData.source || ''}
                         onChange={(e) => setEditModalData({...editModalData, source: e.target.value})}
                         className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-shadow outline-none text-xs font-semibold"
                       />
                    </div>
                 </div>

                 <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 ml-0.5">Requirement Details</label>
                    <textarea 
                      rows="3" value={editModalData.requirement || ''}
                      onChange={(e) => setEditModalData({...editModalData, requirement: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-shadow outline-none text-xs font-semibold resize-none"
                      placeholder="Enter requirement details..."
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 ml-0.5">Estimated Value</label>
                       <input 
                         type="number" value={editModalData.budget || 0}
                         onChange={(e) => setEditModalData({...editModalData, budget: parseFloat(e.target.value) || 0})}
                         className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-shadow outline-none text-xs font-semibold"
                       />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 ml-0.5">Physical Location</label>
                       <input 
                         type="text" value={editModalData.location || ''}
                         onChange={(e) => setEditModalData({...editModalData, location: e.target.value})}
                         className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-shadow outline-none text-xs font-semibold"
                       />
                    </div>
                 </div>

                 <button 
                   type="submit" disabled={editLoading}
                   className="w-full py-3 mt-2 bg-brand-primary text-white font-bold uppercase tracking-[0.2em] text-[10px] rounded-xl hover:bg-brand-hover shadow-lg shadow-brand-shadow transition-all flex items-center justify-center gap-2"
                 >
                   {editLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                   ) : <Edit2 size={14}/>}
                   <span>{editLoading ? 'Saving...' : 'Save Lead Data'}</span>
                 </button>
              </form>
           </div>
         </div>,
         document.body
       )}

      {selectedLeadForNote && mounted && createPortal(
        <LeadConversationModal 
          lead={selectedLeadForNote} 
          onClose={() => setSelectedLeadForNote(null)} 
          onNoteAdded={fetchMonthDetails}
        />,
        document.body
      )}

      {selectedLeadForPayment && mounted && createPortal(
        <PaymentHistoryModal 
          lead={selectedLeadForPayment} 
          onClose={() => setSelectedLeadForPayment(null)} 
          onPaymentAdded={fetchMonthDetails}
        />,
        document.body
      )}

      {selectedLeadForDetail && mounted && createPortal(
        <ClientProfileModal 
          clientId={selectedLeadForDetail.clientId} 
          onClose={() => setSelectedLeadForDetail(null)} 
        />,
        document.body
      )}

      {/* Excel Import Modal */}
      {showUpload && mounted && createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl animate-in zoom-in duration-200 relative border border-slate-100">
             <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-indigo-50/30 rounded-t-2xl">
                <div className="flex items-center gap-1.5 text-indigo-600">
                   <Download size={18} />
                   <h2 className="text-sm font-bold text-slate-900 tracking-tight">Import Leads from Excel</h2>
                </div>
                <button onClick={() => { setShowUpload(false); setUploadCampaignName(''); }} className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 transition-all"><X size={16}/></button>
             </div>

             <div className="p-6">
                <div className="mb-6 space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tab Name / Campaign</label>
                   <input 
                     type="text"
                     placeholder="e.g. Meta Ads, Delhi Real Estate..."
                     value={uploadCampaignName}
                     onChange={(e) => setUploadCampaignName(e.target.value)}
                     className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                   />
                </div>

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
        </div>,
        document.body
      )}
    </div>
  );
};

export default MonthlyOverview;

