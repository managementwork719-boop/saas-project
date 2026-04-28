'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import API from '@/api/axios';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useQuery } from '@tanstack/react-query';
import LeadConversationModal from '@/components/LeadConversationModal';
import SalesAnalytics from '@/components/SalesAnalytics';
import { 
  ArrowRight,
  ArrowRightCircle,
  TrendingUp, 
  Users, 
  CheckCircle2, 
  Target,
  FileSpreadsheet,
  Activity,
  Flame,
  AlertTriangle,
  Plus,
  Mail,
  User,
  LayoutGrid,
  ChevronRight,
  Clock,
  Upload,
  UserPlus,
  X,
  AlertCircle,
  IndianRupee,
  MessageSquare,
  MapPin,
  Phone
} from 'lucide-react';
import PremiumSelect from '@/components/PremiumSelect';
import { HeaderSkeleton, AnalyticsSkeleton, PulseSkeleton, StatSkeleton } from '@/components/Skeleton';
import { 
  StatCard, 
  FeaturedMetricCard, 
  TeamPulseItem, 
  LeaderboardItem, 
  MonthCard 
} from '@/components/SalesDashboard/SalesComponents';
import TeamMemberPipelineModal from '@/components/SalesDashboard/TeamMemberPipelineModal';

const SalesDashboard = ({ mode = 'dashboard', initialStats = null }) => {
  const { user, fetchTeamStats } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  
  // Modal States
  const [showUpload, setShowUpload] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showAllOverdue, setShowAllOverdue] = useState(false);
  const [selectedLeadForNote, setSelectedLeadForNote] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Manual Form State
  const [manualForm, setManualForm] = useState({
    name: '', phone: '', email: '', requirement: '', budget: '', source: '', location: '', leadId: '', date: new Date().toISOString().split('T')[0]
  });
  const [manualLoading, setManualLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);

  // TanStack Query
  const { data: stats, isLoading: loading, refetch: fetchStats } = useQuery({
    queryKey: ['salesStats', selectedYear],
    queryFn: async () => {
      const res = await API.get(`/sales/dashboard?year=${selectedYear}`);
      return res.data.data;
    },
    initialData: selectedYear === new Date().getFullYear().toString() ? initialStats : undefined
  });

  const { data: team = [], isLoading: teamLoading } = useQuery({
    queryKey: ['teamStats', selectedYear],
    queryFn: async () => await fetchTeamStats(selectedYear),
    enabled: user?.role !== 'sales-team'
  });

  const { data: overdueProjects = [], isLoading: overdueLoading } = useQuery({
    queryKey: ['overdueProjects'],
    queryFn: async () => {
      const res = await API.get('/sales/overdue-projects');
      return res.data.data.overdueProjects || [];
    },
    enabled: ['sales-manager', 'admin', 'super-admin'].includes(user?.role)
  });

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setManualLoading(true);
    try {
      await API.post('/sales/create-manual', manualForm);
      showToast('Lead registered successfully');
      setShowManual(false);
      setManualForm({ name: '', phone: '', email: '', requirement: '', budget: '', source: '', location: '', leadId: '', date: new Date().toISOString().split('T')[0] });
      fetchStats();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to add lead', 'error');
    } finally {
      setManualLoading(false);
    }
  };

  const handleUploadExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    
    setUploadLoading(true);
    try {
      await API.post('/sales/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showToast('Leads imported successfully');
      setShowUpload(false);
      fetchStats();
    } catch (err) {
      showToast(err.response?.data?.message || 'Import failed', 'error');
    } finally {
      setUploadLoading(false);
    }
  };

  const leaderboardData = React.useMemo(() => {
    const topEarners = [...team].sort((a,b) => (b.stats?.totalRevenue||0) - (a.stats?.totalRevenue||0));
    const maxRev = Math.max(...topEarners.map(m => m.stats?.totalRevenue || 1), 1);
    return topEarners.slice(0, 5).map(member => ({
      ...member,
      percentage: ((member.stats?.totalRevenue || 0) / maxRev) * 100
    }));
  }, [team]);

  const handleMonthClick = useCallback((monthId) => {
    router.push(`/sales/month/${monthId}`);
  }, [router]);

  const downloadSampleExcel = async () => {
    const sampleData = [
      {
        'ID': 'L-101',
        'Name': 'John Doe',
        'Phone': '9876543210',
        'Email': 'john@example.com',
        'Source': 'Google Ads',
        'Location': 'Mumbai',
        'Requirement': 'Web Development',
        'Budget': 50000
      },
      {
        'ID': 'L-102',
        'Name': 'Jane Smith',
        'Phone': '9123456789',
        'Email': 'jane@example.com',
        'Source': 'Facebook',
        'Location': 'Delhi',
        'Requirement': 'Mobile App',
        'Budget': 75000
      }
    ];

    const XLSX = await import('xlsx');
    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sample Format");
    XLSX.writeFile(wb, "WorkSensy_Lead_Import_Format.xlsx");
  };

  if (loading) return (
     <div className="space-y-6 max-w-[1400px] mx-auto animate-in fade-in duration-500">
        <HeaderSkeleton>
           <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => <StatSkeleton key={i} />)}
           </div>
        </HeaderSkeleton>
        <AnalyticsSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
           <PulseSkeleton />
           <PulseSkeleton />
           <PulseSkeleton />
        </div>
     </div>
  );

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
      {/* HEADER CONTROLS */}
      <div className="flex items-center justify-between mb-2">
        <span className="px-4 py-1.5 bg-white/70 backdrop-blur-md border border-slate-200/60 rounded-full text-[11px] font-bold text-slate-500 uppercase tracking-widest shadow-sm">
          {mode === 'dashboard' ? 'Sales Overview' : 'Leads Repository'}
        </span>

        <div className="bg-white/70 backdrop-blur-md border border-slate-200 shadow-sm px-4 py-1.5 rounded-xl flex items-center gap-3">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Select Period</span>
          <PremiumSelect
            value={selectedYear}
            onChange={setSelectedYear}
            options={[
              { label: '2024', value: '2024' },
              { label: '2025', value: '2025' },
              { label: '2026', value: '2026' }
            ]}
            className="w-24 border-none"
          />
        </div>
      </div>

      {mode === 'dashboard' ? (
        <div className="space-y-5">
          {/* Main KPI Frame */}
          <div className="relative overflow-hidden bg-white/40 p-2 rounded-2xl border border-slate-200/50 shadow-sm">
              <div className="relative bg-white/80 backdrop-blur-xl border border-white/60 p-6 md:p-8 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
                <div className="flex-1 flex flex-col md:flex-row items-center gap-6 z-10 text-center md:text-left">
                  <div className="relative w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-200">
                    <Target size={30} />
                  </div>
                  <div>
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                      <div className="flex items-center gap-1.5 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                        <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">
                          {new Date().getHours() < 12 ? '☀️ Good Morning' : new Date().getHours() < 17 ? '⛅ Good Afternoon' : '🌙 Good Evening'}
                        </span>
                      </div>
                      <div className="w-1 h-1 rounded-full bg-slate-300" />
                      <div className="flex items-center gap-1.5">
                         <Activity size={10} className="text-emerald-500" />
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Real-time Sync</span>
                      </div>
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter leading-none mb-4">
                      Welcome back, <span className="premium-gradient-text">{user?.name?.split(' ')[0]}!</span>
                    </h2>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                       <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100/50 rounded-full border border-slate-200/60">
                          <span className="text-[10px] font-bold text-slate-500">You have <span className="text-indigo-600 font-black">0</span> new leads to process today</span>
                       </div>
                       <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50/50 rounded-full border border-emerald-100/60">
                          <span className="text-[10px] font-bold text-emerald-600">Let's hit the target! 🚀</span>
                       </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 z-10">
                   <div className="bg-white/50 border border-slate-100 p-3 rounded-2xl flex items-center gap-3 shadow-sm min-w-[140px]">
                      <div className="text-right">
                         <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Access Level</p>
                         <p className="text-[11px] font-black text-indigo-900 uppercase tracking-widest">{user?.role?.replace('-', ' ')}</p>
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                         <LayoutGrid size={14} />
                      </div>
                   </div>

                   <div className="border-l border-slate-100 pl-6 hidden md:block">
                      <p className="text-2xl font-black text-slate-900 tracking-tighter mb-0.5">₹{stats?.total?.revenue?.toLocaleString() || 0}</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Revenue Forecast</p>
                   </div>
                </div>
              </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
              <StatCard title="Revenue" value={`₹${stats?.total?.revenue?.toLocaleString() || 0}`} icon={TrendingUp} />
              <StatCard title="Received" value={`₹${stats?.total?.received?.toLocaleString() || 0}`} icon={Mail} />
              <StatCard title="Total Leads" value={stats?.total?.leads || 0} icon={Users} />
              <StatCard title="Success Rate" value={`${stats?.total?.conversionRate || 0}%`} icon={CheckCircle2} />
              <div className="bg-[#0f172a] rounded-xl p-4 border border-slate-800 flex flex-col justify-between shadow-xl h-full relative overflow-hidden group cursor-pointer hover:bg-slate-900 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                  <Flame size={18} className="text-orange-400" />
                </div>
                <div>
                   <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Growth Index</p>
                   <h3 className="text-xl font-black text-white tracking-tight leading-none">₹{stats?.total?.revenue?.toLocaleString() || 0}</h3>
                </div>
                {/* Decorative element */}
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl group-hover:bg-orange-500/20 transition-all" />
              </div>
            </div>
          </div>

          <SalesAnalytics stats={stats} user={user} />

          {/* Pulse & Leaderboard */}
          {user?.role !== 'sales-team' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-slate-200/60 overflow-hidden flex flex-col h-full shadow-sm">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Team Pulse</h3>
                </div>
                <div className="divide-y divide-slate-50 flex-1 overflow-auto">
                  {team.map(member => <TeamPulseItem key={member._id} member={member} onClick={setSelectedMember} />)}
                </div>
              </div>

              <div className="rounded-2xl p-6 shadow-xl flex flex-col h-full bg-[#1a1f3a]" style={{background: 'linear-gradient(135deg, #1e2a5e 0%, #1a1035 100%)'}}>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-5">Leaderboard</h3>
                <div className="space-y-4 flex-1 overflow-auto">
                  {leaderboardData.map(m => <LeaderboardItem key={m._id} name={m.name} value={m.stats?.totalRevenue || 0} percentage={m.percentage} />)}
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-slate-200/60 overflow-hidden flex flex-col h-full shadow-sm">
                 <div className="px-5 py-4 border-b border-slate-100 bg-rose-50/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <AlertTriangle size={16} className="text-rose-500" />
                       <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Deadline Watch</h3>
                    </div>
                    {overdueProjects.length > 0 && (
                       <button 
                          onClick={() => setShowAllOverdue(true)}
                          className="text-[10px] font-bold text-rose-600 hover:underline uppercase tracking-widest"
                       >
                          See More
                       </button>
                    )}
                 </div>
                  <div className="divide-y divide-slate-50 flex-1 overflow-auto p-4">
                    {overdueLoading ? (
                       <div className="flex flex-col gap-3">
                          {[1,2,3].map(i => (
                             <div key={i} className="flex flex-col gap-2 opacity-50">
                                <div className="h-3 w-2/3 bg-slate-100 rounded animate-pulse" />
                                <div className="h-2 w-1/2 bg-slate-50 rounded animate-pulse" />
                             </div>
                          ))}
                       </div>
                    ) : overdueProjects.length === 0 ? (
                       <div className="flex flex-col items-center justify-center py-8 opacity-40">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No overdue items</p>
                       </div>
                    ) : (
                       <div className="space-y-4">
                          {overdueProjects.slice(0, 3).map((proj) => (
                             <div key={proj._id} className="flex items-start justify-between group">
                                <div className="flex flex-col gap-0.5">
                                   <p className="text-xs font-bold text-slate-900 leading-tight group-hover:text-rose-600 transition-colors">{proj.name}</p>
                                   <p className="text-[10px] text-slate-400 font-medium truncate max-w-[140px]">{proj.requirement || 'No Details'}</p>
                                   <div className="flex items-center gap-2 mt-1">
                                      <span className="text-[9px] font-black text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                         {new Date(proj.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                      </span>
                                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{proj.convertedBy}</span>
                                   </div>
                                </div>
                                <a 
                                   href={`tel:${proj.phone}`} 
                                   className="p-2 bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 rounded-xl transition-all"
                                >
                                   <Phone size={14} />
                                </a>
                             </div>
                          ))}
                          {overdueProjects.length > 0 && (
                             <button 
                                onClick={() => setShowAllOverdue(true)}
                                className="w-full mt-2 py-2 border border-slate-100 rounded-xl text-[9px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                             >
                                <span>View Full Schedule</span>
                                <ArrowRight size={10} />
                             </button>
                          )}
                       </div>
                    )}
                  </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-5">
           {/* Leads Repository View */}
           <div className="bg-white/70 backdrop-blur-xl border border-slate-200/60 rounded-2xl p-4 flex justify-between items-center shadow-sm">
              <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Pipeline Repository</span>
              <div className="flex gap-3">
                 <button onClick={() => setShowManual(true)} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-widest hover:border-brand-primary transition-all">Manual Lead</button>
                 <button onClick={() => setShowUpload(true)} className="px-4 py-2 bg-brand-primary text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-brand-shadow transition-all">Import Excel</button>
              </div>
           </div>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {stats?.months?.map(m => <MonthCard key={m._id} month={m._id} data={m} user={user} onClick={() => handleMonthClick(m._id)} />)}
           </div>
        </div>
      )}

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

    {/* Import Excel Modal */}
    {showUpload && mounted && createPortal(
      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
        <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl animate-in zoom-in duration-200 overflow-hidden border border-slate-200">
           <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-1.5 text-brand-primary">
                 <FileSpreadsheet size={18} />
                 <h2 className="text-sm font-bold text-slate-900 tracking-tight">Import Leads from Excel</h2>
              </div>
              <button onClick={() => setShowUpload(false)} className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 transition-all"><X size={16}/></button>
           </div>

           <div className="p-8 text-center">
              <div className="w-16 h-16 bg-indigo-50 text-brand-primary rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-100 shadow-inner">
                 <Upload size={28} />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">Select your spreadsheet</h3>
              <p className="text-[11px] text-slate-400 font-medium mb-4">Supported formats: .xlsx, .xls, .csv</p>
              
              <button 
                onClick={downloadSampleExcel}
                className="mb-6 text-[10px] font-black text-brand-primary uppercase tracking-widest hover:underline flex items-center justify-center gap-1.5 mx-auto"
              >
                <FileSpreadsheet size={12} />
                Download Sample Format
              </button>
              
              <div className="flex flex-col gap-4">
                 <label className="w-full cursor-pointer group">
                    <div className="w-full py-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl group-hover:border-brand-primary group-hover:bg-brand-primary/5 transition-all text-center">
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
                   <div className="flex items-center justify-center gap-2 text-brand-primary animate-pulse">
                      <div className="w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Processing Data...</span>
                   </div>
                 )}
              </div>
           </div>

           <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
              <AlertCircle size={14} className="text-amber-500" />
              <p className="text-[10px] font-bold text-slate-500">Ensure your Excel matches the required column headers.</p>
           </div>
        </div>
      </div>,
      document.body
    )}

      {/* All Overdue Modal */}
      {showAllOverdue && mounted && createPortal(
      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
         <div className="bg-white w-full max-w-xl max-h-[80vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-200 border border-slate-100">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-rose-50/20">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-rose-100 text-rose-600 rounded-xl shadow-sm">
                     <AlertTriangle size={18} />
                  </div>
                  <div>
                     <h2 className="text-md font-bold text-slate-900 tracking-tight">Overdue Projects</h2>
                     <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mt-0.5">Attention Required</p>
                  </div>
               </div>
               <button 
                  onClick={() => setShowAllOverdue(false)} 
                  className="p-2 hover:bg-rose-100/50 rounded-xl text-rose-400 hover:text-rose-600 transition-all"
               >
                  <X size={18}/>
               </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50/30">
               {overdueProjects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 opacity-30">
                     <Clock size={32} className="text-slate-300 mb-4" />
                     <p className="text-xs font-bold uppercase tracking-widest text-slate-400">No overdue items</p>
                  </div>
               ) : overdueProjects.map((proj) => (
                  <div key={proj._id} className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-100 hover:border-rose-200 hover:shadow-sm transition-all group">
                     <div className="flex flex-col gap-1 flex-1 pr-3">
                        <div className="flex items-center gap-2">
                           <span className="text-[9px] font-black text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded-md uppercase tracking-wider">#{proj.leadId}</span>
                           <h4 className="font-bold text-slate-900 text-[13px]">{proj.name}</h4>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium truncate max-w-[300px]">{proj.requirement}</p>
                        <div className="flex items-center gap-3 mt-1">
                           <div className="flex items-center gap-1.5 text-[9px] font-bold text-rose-600">
                              <Clock size={10} />
                              <span>Due {new Date(proj.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                           </div>
                           <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                              <Users size={10} />
                              <span>{proj.convertedBy}</span>
                           </div>
                        </div>
                     </div>
                     <div className="flex items-center gap-2">
                        <a 
                           href={`tel:${proj.phone}`} 
                           className="p-2.5 bg-rose-600 text-white rounded-xl shadow-md shadow-rose-200 hover:scale-105 active:scale-95 transition-all"
                        >
                           <Phone size={14} />
                        </a>
                     </div>
                  </div>
               ))}
            </div>
            <div className="p-3 bg-white border-t border-slate-100 text-center">
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{overdueProjects.length} items flagged</p>
            </div>
         </div>
      </div>,
      document.body
    )}

    {selectedMember && mounted && createPortal(
      <TeamMemberPipelineModal 
        member={selectedMember} 
        onClose={() => setSelectedMember(null)} 
      />,
      document.body
    )}
    </div>
  );
};

export default SalesDashboard;
