'use client';
import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/context/ToastContext';
import API from '@/api/axios';
import { 
  ChevronDown, 
  Edit3, 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  Wallet,
  FileText,
  Plus,
  MoreHorizontal,
  ChevronRight,
  Download,
  Layers,
  Briefcase,
  ExternalLink,
  Target,
  Zap,
  ShieldAlert,
  UserCircle2,
  Trash2
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip,
} from 'recharts';
import { Skeleton } from '@/components/Skeleton';
import AddProjectModal from '@/components/modals/AddProjectModal';

// --- Compact Subcomponents ---

const StatCard = ({ title, value, subValue, icon: Icon, color, progress, subValueColor, isCircular }) => (
  <div className="bg-white rounded-[16px] p-4 border border-slate-100 shadow-sm flex flex-col justify-between h-[120px]">
    <div className="flex justify-between items-start">
      {isCircular ? (
        <div className="relative w-10 h-10">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="16" fill="none" className="stroke-slate-100" strokeWidth="3" />
            <circle cx="18" cy="18" r="16" fill="none" stroke={color} strokeWidth="3" strokeDasharray={`${progress}, 100`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center"><span className="text-[9px] font-black text-slate-900">{progress}%</span></div>
        </div>
      ) : (
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-50 text-indigo-600">{Icon && <Icon size={16} />}</div>
      )}
      <div className="text-right">
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{title}</p>
        <h3 className="text-[18px] font-black text-slate-900 leading-none">{value}</h3>
      </div>
    </div>
    <div className="flex justify-between items-end">
       <p className="text-[10px] font-bold text-slate-500 truncate max-w-[100px]">{subValue}</p>
       {subValueColor && <span className={`text-[9px] font-black uppercase tracking-tight ${subValueColor}`}>{subValueColor.split(' ')[1]}</span>}
    </div>
  </div>
);

const SectionHeader = ({ title, actions = [] }) => (
  <div className="flex justify-between items-center mb-3">
    <h2 className="text-[14px] font-black text-slate-900 tracking-tight">{title}</h2>
    <div className="flex gap-3">
      {actions.map((action, idx) => (
        <button 
          key={idx} 
          onClick={action.onAction} 
          className={`text-[10px] font-bold hover:underline ${action.color || 'text-indigo-600'}`}
        >
          {action.label}
        </button>
      ))}
    </div>
  </div>
);

const MilestoneItem = ({ milestone }) => (
  <div className="flex gap-3 group relative">
    <div className="flex flex-col items-center">
      <div className={`w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm ring-2 ${milestone.status === 'Completed' ? 'bg-emerald-500 ring-emerald-50' : milestone.status === 'In Progress' ? 'bg-indigo-500 ring-indigo-50' : 'bg-slate-200 ring-slate-50'}`} />
      <div className="w-px h-full bg-slate-100 group-last:hidden my-0.5" />
    </div>
    <div className="flex-1 pb-4">
      <div className="flex justify-between items-center mb-0.5">
        <h4 className="text-[12px] font-bold text-slate-800">{milestone.name}</h4>
        <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest ${milestone.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : milestone.status === 'In Progress' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}>{milestone.status}</span>
      </div>
      <p className="text-[10px] font-bold text-slate-400">{milestone.date}</p>
    </div>
  </div>
);

const getAvatarColor = (name) => {
  const colors = [
    'bg-indigo-500', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500', 
    'bg-violet-500', 'bg-fuchsia-500', 'bg-sky-500', 'bg-teal-500',
    'bg-orange-500', 'bg-pink-500'
  ];
  if (!name) return colors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const TeamMemberItem = ({ member }) => (
  <div className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
    <div className="flex items-center gap-2">
       <div className={`w-7 h-7 rounded-full ${getAvatarColor(member.name)} flex items-center justify-center text-[9px] font-black text-white shadow-sm`}>{member.name?.substring(0,2).toUpperCase()}</div>
       <div>
          <h4 className="text-[11px] font-bold text-slate-900 leading-tight">{member.name}</h4>
          <p className="text-[9px] font-medium text-slate-400">{member.role}</p>
       </div>
    </div>
    <div className="flex items-center gap-2">
       <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${member.utilization}%` }} /></div>
       <span className="text-[10px] font-black text-slate-900 w-6 text-right">{member.utilization}%</span>
    </div>
  </div>
);

const formatTimeAgo = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const ActivityItem = ({ activity }) => (
  <div className="flex gap-3 py-2 border-b border-slate-50 last:border-0 group">
    <div className={`w-7 h-7 rounded-full ${getAvatarColor(activity.userName)} flex items-center justify-center text-[9px] font-black text-white shrink-0 uppercase shadow-sm`}>{activity.userName?.substring(0,2)}</div>
    <div className="flex-1 min-w-0">
       <p className="text-[11px] text-slate-600 leading-tight truncate">
          <span className="font-bold text-slate-900">{activity.userName}</span> {activity.action} <span className="font-bold">"{activity.description}"</span>
       </p>
    </div>
    <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap">{formatTimeAgo(activity.timestamp)}</span>
  </div>
);

const RiskRow = ({ risk }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
    <h4 className="text-[11px] font-bold text-slate-800 truncate pr-4">{risk.title}</h4>
    <div className="flex items-center gap-4 shrink-0">
       <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest ${risk.severity === 'High' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>{risk.severity}</span>
       <span className="text-[10px] font-bold text-slate-400 min-w-[60px] text-right">{risk.status}</span>
    </div>
  </div>
);

const DocumentItem = ({ doc, projectId, onDelete }) => {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = (e) => {
    e.preventDefault();
    setDownloading(true);
    
    // Use backend proxy to securely download without CORS or browser viewer issues
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const proxyUrl = `${backendUrl}/project-manager/proxy-download?url=${encodeURIComponent(doc.url)}&filename=${encodeURIComponent(doc.name)}`;
    
    window.location.href = proxyUrl;
    
    setTimeout(() => setDownloading(false), 2000);
  };

  return (
    <div className="bg-white border border-slate-100 rounded-xl p-3 flex flex-col h-full hover:shadow-md transition-all group">
       <div className="flex justify-between mb-2">
          <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center"><FileText size={14} /></div>
          <div className="flex gap-2">
            <button 
              onClick={(e) => {
                e.preventDefault();
                const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
                const proxyUrl = `${backendUrl}/project-manager/proxy-download?url=${encodeURIComponent(doc.url)}&filename=${encodeURIComponent(doc.name)}&view=inline`;
                window.open(proxyUrl, '_blank');
              }}
              className="text-slate-300 hover:text-emerald-600 transition-colors"
              title="View File"
            >
              <ExternalLink size={14} />
            </button>
            <button 
              onClick={(e) => {
                e.preventDefault();
                if (window.confirm('Are you sure you want to delete this document?')) {
                  onDelete(doc._id);
                }
              }}
              className="text-slate-300 hover:text-rose-600 transition-colors"
              title="Delete File"
            >
              <Trash2 size={14} />
            </button>
          </div>
       </div>
       <h4 className="text-[11px] font-bold text-slate-900 mb-0.5 truncate">{doc.name}</h4>
       <p className="text-[8px] font-black text-rose-500 uppercase tracking-widest mb-2">{doc.type || 'FILE'}</p>
       <div className="mt-auto pt-2 border-t border-slate-50 flex justify-between items-end">
          <p className="text-[9px] font-bold text-slate-600">{doc.date ? new Date(doc.date).toLocaleDateString() : 'N/A'}</p>
          <p className="text-[9px] font-bold text-slate-400">{doc.addedBy || 'System'}</p>
       </div>
    </div>
  );
};

// --- Main Page ---

export default function ProjectControl() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [selectedNote, setSelectedNote] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showToast } = useToast();
  const queryClient = useQueryClient();

  // Optimized Refetch
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['pmProjectDetails', activeProjectId] });
    queryClient.invalidateQueries({ queryKey: ['pmProjectsList'] });
  };

  const { data: projectsData, isLoading: loadingProjects } = useQuery({
    queryKey: ['pmProjectsList'],
    queryFn: async () => {
      const res = await API.get('/project-manager/projects?limit=50');
      return res.data.data.projects;
    }
  });

  const { data: project, isLoading: loadingProject } = useQuery({
    queryKey: ['pmProjectDetails', activeProjectId],
    queryFn: async () => {
      if (!activeProjectId) return null;
      const res = await API.get(`/project-manager/projects/${activeProjectId}`);
      return res.data.data.project;
    },
    enabled: !!activeProjectId
  });

  const handleDeleteDocument = async (docId) => {
    try {
      await API.delete(`/project-manager/projects/${activeProjectId}/documents/${docId}`);
      showToast('Document deleted successfully');
      handleRefresh();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete document', 'error');
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await API.delete(`/project-manager/projects/${activeProjectId}/notes/${noteId}`);
      showToast('Note deleted successfully');
      setSelectedNote(null);
      handleRefresh();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete note', 'error');
    }
  };

  useEffect(() => {
    if (projectsData && projectsData.length > 0 && !activeProjectId) {
      setActiveProjectId(projectsData[0]._id);
    }
  }, [projectsData, activeProjectId]);

  if (loadingProjects || (activeProjectId && loadingProject)) return <div className="p-8 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest animate-pulse">Loading...</div>;
  if (!project) return null;

  const taskData = project.taskBreakdown ? [
    { name: 'Completed', value: project.taskBreakdown.completed, color: '#10b981' },
    { name: 'In Progress', value: project.taskBreakdown.inProgress, color: '#3b82f6' },
    { name: 'To Do', value: project.taskBreakdown.todo, color: '#f59e0b' },
    { name: 'Blocked', value: project.taskBreakdown.blocked, color: '#ef4444' }
  ] : [];

  const milestones = project.milestones?.map(m => ({
    name: m.name,
    date: new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    status: m.status || (new Date(m.date) < new Date() ? 'Completed' : 'To Do')
  })) || [];

  const teamMembers = project.teamStats?.map(m => ({
    name: m.name,
    role: m.designation || m.role,
    utilization: m.completion || 0,
    profilePic: m.profilePic
  })) || [];

  const activityLog = project.activity?.map(a => ({
    userName: a.userName,
    action: a.action,
    description: a.description,
    timeAgo: new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  })) || [];

  const risks = project.risks || [];
  const documents = project.documents || [];
  const notes = project.notes || [];
  const links = project.links || [];

  const tabs = ['Overview', 'Tasks', 'Team', 'Timeline', 'Documents', 'Notes', 'Links', 'Budget', 'Risks & Issues', 'Reports', 'Settings'];

  return (
    <div className="min-h-screen pb-10 font-inter max-w-[1600px] mx-auto px-4">
      
      {/* Compact Header */}
      <div className="flex justify-between items-start py-5">
         <div className="space-y-0.5">
            <div className="flex items-center gap-2 pb-4">
               <h1 className="text-[20px] font-black text-slate-900 tracking-tight leading-none">{project.name}</h1>
               <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest rounded-full border border-emerald-100">{project.riskStatus?.replace('-', ' ')}</span>
               <div className="relative inline-block ml-1"><select className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setActiveProjectId(e.target.value)} value={activeProjectId || ''}>{projectsData?.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}</select><ChevronDown className="text-slate-400" size={16} /></div>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] font-medium text-slate-500">
               <span>{project.client}</span><span className="text-slate-300">•</span>
               <span>Managed by <span className="text-slate-900 font-bold">{project.manager?.name}</span></span><span className="text-slate-300">•</span>
               <span>Deadline <span className="text-slate-800 font-bold">{project.deadline ? new Date(project.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</span></span>
               <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ml-1 ${project.priority?.toLowerCase() === 'high' ? 'bg-rose-50 text-rose-500' : 'bg-orange-50 text-orange-500'}`}>{project.priority}</span>
            </div>
         </div>
         <button onClick={() => setShowEditModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"><Edit3 size={14} /> Edit</button>
      </div>

      {/* Compact Tabs */}
      <div className="flex items-center gap-6 border-b border-slate-100 mb-4 overflow-x-auto no-scrollbar">
         {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-2 text-[11px] font-black uppercase tracking-widest transition-all relative whitespace-nowrap ${activeTab === tab ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>{tab}{activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />}</button>
         ))}
      </div>

      {/* Overview Content */}
      {activeTab === 'Overview' && (
        <div className="space-y-4 animate-in fade-in duration-500">
          
          {/* Top Row Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
             <StatCard title="Overall Progress" value={`${project.progress || 0}%`} subValue={`${project.taskBreakdown?.completed || 0} tasks done`} color="#6366f1" progress={project.progress || 0} isCircular={true} />
             <StatCard title="Tasks" value={`${project.taskBreakdown?.completed || 0} / ${project.taskBreakdown?.total || 0}`} subValue={`${(project.taskBreakdown?.total || 0) - (project.taskBreakdown?.completed || 0)} left`} icon={CheckCircle2} />
             <StatCard title="Budget" value={`₹${((project.budgetUsed || 0)/100000).toFixed(1)}L / ₹${((project.budget || 0)/100000).toFixed(1)}L`} subValue={`${project.budgetUsedPercent || 0}% used`} icon={Wallet} />
             <StatCard title="Utilization" value="78%" subValue="Active" subValueColor="text-emerald-500 Good" icon={Users} />
             <StatCard title="Risks" value={risks.length} subValue={`${risks.filter(r => r.severity === 'High').length} high`} subValueColor="text-rose-500" icon={AlertTriangle} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
             {/* Left Area */}
             <div className="xl:col-span-9 space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                   <div className="bg-white rounded-[20px] p-4 border border-slate-100 shadow-sm flex flex-col h-[260px]">
                      <SectionHeader title="Task Progress" />
                      <div className="flex-1 flex items-center gap-6">
                         <div className="w-1/2 h-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                               <PieChart><Pie data={taskData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={4} dataKey="value">{taskData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}</Pie><Tooltip /></PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"><span className="text-[20px] font-black text-slate-900 leading-none">{project.taskBreakdown?.completed || 0}</span><span className="text-[8px] font-bold text-slate-400 uppercase">Done</span></div>
                         </div>
                         <div className="w-1/2 space-y-2">
                            {taskData.map((item, idx) => (
                               <div key={idx} className="flex items-center justify-between"><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} /><span className="text-[11px] font-bold text-slate-500">{item.name}</span></div><span className="text-[11px] font-black text-slate-900">{item.value}</span></div>
                            ))}
                         </div>
                      </div>
                   </div>
                    <div className="bg-white rounded-[20px] p-4 border border-slate-100 shadow-sm flex flex-col h-[260px]">
                       <SectionHeader title="Milestones" actions={[{ label: 'View All', onAction: () => setActiveTab('Timeline') }]} />
                      <div className="flex-1 overflow-y-auto no-scrollbar">{milestones.length > 0 ? milestones.map((m, idx) => <MilestoneItem key={idx} milestone={m} />) : <p className="text-center text-slate-300 text-[10px] font-bold mt-10 italic">NO MILESTONES</p>}</div>
                   </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="bg-white rounded-[20px] p-4 border border-slate-100 h-[280px] flex flex-col">
                       <SectionHeader title="Team Members" actions={[{ label: 'View All', onAction: () => setActiveTab('Team') }]} />
                      <div className="flex-1 overflow-y-auto no-scrollbar space-y-0.5">{teamMembers.length > 0 ? teamMembers.map((m, idx) => <TeamMemberItem key={idx} member={m} />) : <p className="text-center text-slate-300 text-[9px] font-bold mt-10 italic">NO TEAM</p>}</div>
                   </div>
                    <div className="bg-white rounded-[20px] p-4 border border-slate-100 h-[280px] flex flex-col">
                       <SectionHeader title="Recent Activity" actions={[{ label: 'View All', onAction: () => setActiveTab('Reports') }]} />
                      <div className="flex-1 overflow-y-auto no-scrollbar space-y-0.5">{activityLog.length > 0 ? activityLog.map((a, idx) => <ActivityItem key={idx} activity={a} />) : <p className="text-center text-slate-300 text-[9px] font-bold mt-10 italic">NO ACTIVITY</p>}</div>
                   </div>
                    <div className="bg-white rounded-[20px] p-4 border border-slate-100 h-[280px] flex flex-col">
                       <SectionHeader title="Risks" actions={[{ label: 'View All', onAction: () => setActiveTab('Risks & Issues') }]} />
                      <div className="flex-1 overflow-y-auto no-scrollbar space-y-0.5">{risks.length > 0 ? risks.map((r, idx) => <RiskRow key={idx} risk={r} />) : <p className="text-center text-slate-300 text-[9px] font-bold mt-10 italic">NO RISKS</p>}</div>
                   </div>
                </div>

                 <div className="bg-[#f8f9fc] rounded-[20px] p-6 border border-slate-100">
                    <SectionHeader title="Documents" actions={[
                       { label: 'View All', onAction: () => setActiveTab('Documents') },
                       { label: 'Add', onAction: () => setShowDocModal(true) }
                    ]} />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                      {documents.map((doc, idx) => (
                        <DocumentItem 
                          key={idx} 
                          doc={doc} 
                          projectId={activeProjectId} 
                          onDelete={handleDeleteDocument} 
                        />
                      ))}
                      <button onClick={() => setShowDocModal(true)} className="bg-white border-2 border-dashed border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center text-center gap-1 group hover:border-indigo-400 transition-all min-h-[100px]">
                         <Plus size={14} className="text-slate-400 group-hover:text-indigo-600" />
                         <p className="text-[10px] font-bold text-slate-900 leading-tight">Upload</p>
                      </button>
                   </div>
                </div>
             </div>

             {/* Right Sidebar */}
             <div className="xl:col-span-3 space-y-4">
                <div className="bg-white rounded-[20px] p-4 border border-slate-100 shadow-sm">
                   <h3 className="text-[13px] font-black text-slate-900 mb-3">Details</h3>
                   <div className="space-y-2.5">
                      {[
                         {label: 'Client', val: project.client, icon: Users},
                         {label: 'PM', val: project.manager?.name, icon: UserCircle2, isUser: true},
                         {label: 'Started', val: project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A', icon: Calendar},
                         {label: 'Deadline', val: project.deadline ? new Date(project.deadline).toLocaleDateString() : 'N/A', icon: Clock},
                         {label: 'Priority', val: project.priority, icon: ShieldAlert, isBadge: true, color: project.priority?.toLowerCase() === 'high' ? 'bg-rose-50 text-rose-500' : 'bg-amber-50 text-amber-500'},
                         {label: 'Status', val: project.riskStatus?.replace('-', ' '), icon: CheckCircle2, isBadge: true, color: 'bg-emerald-50 text-emerald-600'}
                      ].map((item, idx) => (
                         <div key={idx} className="flex justify-between items-center text-[10px]">
                            <div className="flex items-center gap-2 text-slate-400 font-bold"><item.icon size={12} /><span>{item.label}</span></div>
                            {item.isUser ? (
                               <div className="flex items-center gap-1 font-bold text-slate-800"><div className="w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[7px] font-black">{item.val?.substring(0,2).toUpperCase()}</div>{item.val}</div>
                            ) : item.isBadge ? (
                               <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest ${item.color}`}>{item.val}</span>
                            ) : (
                               <span className="font-bold text-slate-800">{item.val}</span>
                            )}
                         </div>
                      ))}
                   </div>
                </div>

                 <div className="bg-white rounded-[20px] p-4 border border-slate-100">
                    <SectionHeader title="Notes" actions={[
                       { label: 'View All', onAction: () => setActiveTab('Notes') },
                       { label: 'Add', onAction: () => setShowNoteModal(true) }
                    ]} />
                   <div className="space-y-2">
                      {notes.length > 0 ? notes.map((n, idx) => (
                         <div key={idx} className="p-2.5 rounded-lg border border-slate-50 hover:bg-indigo-50/10 transition-all cursor-pointer group flex justify-between items-start">
                           <div onClick={() => setSelectedNote(n)} className="flex-1 min-w-0">
                             <h4 className="text-[11px] font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">{n.title}</h4>
                             <p className="text-[9px] font-medium text-slate-400 mt-0.5 truncate">{n.content}</p>
                             {n.fileUrl && (
                               <div className="mt-2 flex items-center gap-1 px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[8px] font-black uppercase tracking-tight w-fit">
                                 <FileText size={10} /> {n.fileUrl.split('/').pop().split('.')[0].substring(0, 20) || 'Attachment'}
                               </div>
                             )}
                           </div>
                           <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               if (window.confirm('Delete this note?')) {
                                 handleDeleteNote(n._id);
                               }
                             }}
                             className="text-slate-300 hover:text-rose-600 p-1 opacity-0 group-hover:opacity-100 transition-all"
                           >
                             <Trash2 size={12} />
                           </button>
                         </div>
                      )) : <p className="text-center text-slate-300 text-[9px] font-bold italic">NO NOTES</p>}
                   </div>
                </div>

                 <div className="bg-white rounded-[20px] p-4 border border-slate-100">
                    <SectionHeader title="Links" actions={[
                       { label: 'View All', onAction: () => setActiveTab('Links') },
                       { label: 'Add', onAction: () => setShowLinkModal(true) }
                    ]} />
                   <div className="space-y-2">
                      {links.length > 0 ? links.map((l, idx) => (
                         <div key={idx} className="flex gap-2.5 p-1.5 rounded-lg hover:bg-slate-50 transition-all group cursor-pointer" onClick={() => window.open(l.url, '_blank')}><div className="w-7 h-7 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-indigo-100 group-hover:text-indigo-600 shrink-0"><ExternalLink size={12} /></div><div className="min-w-0"><h4 className="text-[11px] font-bold text-slate-900 truncate">{l.title}</h4><p className="text-[9px] font-medium text-indigo-500 truncate">{l.url}</p></div></div>
                      )) : <p className="text-center text-slate-300 text-[9px] font-bold italic">NO LINKS</p>}
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Documents Content */}
      {activeTab === 'Documents' && (
        <div className="space-y-4 animate-in fade-in duration-500">
          <div className="bg-white rounded-[20px] p-6 border border-slate-100 shadow-sm">
            <SectionHeader title="Project Documents" actions={[{ label: 'Upload New', onAction: () => setShowDocModal(true) }]} />
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-6">
              {documents.length > 0 ? documents.map((doc, idx) => (
                <DocumentItem 
                  key={idx} 
                  doc={doc} 
                  projectId={activeProjectId} 
                  onDelete={handleDeleteDocument} 
                />
              )) : (
                <div className="col-span-full py-20 text-center">
                  <FileText size={40} className="mx-auto text-slate-200 mb-3" />
                  <p className="text-slate-400 font-bold">No documents uploaded yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notes Content */}
      {activeTab === 'Notes' && (
        <div className="space-y-4 animate-in fade-in duration-500">
          <div className="bg-white rounded-[20px] p-6 border border-slate-100 shadow-sm">
            <SectionHeader title="Project Notes" actions={[{ label: 'Add New Note', onAction: () => setShowNoteModal(true) }]} />
            <div className="space-y-3 mt-6">
              {notes.length > 0 ? notes.map((n, idx) => (
                <div key={idx} className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 hover:bg-white hover:shadow-md transition-all group flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl ${getAvatarColor(n.addedBy)} text-white flex items-center justify-center text-[10px] font-black shrink-0 shadow-sm`}>
                    {n.addedBy?.substring(0,2).toUpperCase()}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-0.5">
                      <h4 className="text-[13px] font-black text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{n.title}</h4>
                      <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">{new Date(n.date).toLocaleDateString()}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{n.content}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {n.fileUrl && (
                      <button 
                        onClick={() => {
                          const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
                          const proxyUrl = `${backendUrl}/project-manager/proxy-download?url=${encodeURIComponent(n.fileUrl)}&filename=${encodeURIComponent(n.title)}&view=inline`;
                          window.open(proxyUrl, '_blank');
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black hover:bg-indigo-600 hover:text-white transition-all uppercase tracking-tighter"
                      >
                        <FileText size={12} /> View File
                      </button>
                    )}
                    <button 
                      onClick={() => {
                        if (window.confirm('Delete this note?')) handleDeleteNote(n._id);
                      }}
                      className="text-slate-300 hover:text-rose-600 transition-colors p-2"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )) : (
                <div className="col-span-full py-20 text-center">
                  <Plus size={40} className="mx-auto text-slate-200 mb-3" />
                  <p className="text-slate-400 font-bold">No notes created yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Links Content */}
      {activeTab === 'Links' && (
        <div className="space-y-4 animate-in fade-in duration-500">
          <div className="bg-white rounded-[20px] p-6 border border-slate-100 shadow-sm">
            <SectionHeader title="All Project Links" actions={[{ label: 'Add Link', onAction: () => setShowLinkModal(true) }]} />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {links.length > 0 ? links.map((l, idx) => (
                <div key={idx} className="flex items-center gap-4 p-4 rounded-xl border border-slate-50 hover:border-indigo-100 hover:bg-indigo-50/10 transition-all group cursor-pointer" onClick={() => window.open(l.url, '_blank')}>
                  <div className="w-10 h-10 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                    <ExternalLink size={18} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[13px] font-black text-slate-900 truncate">{l.title}</h4>
                    <p className="text-[11px] font-bold text-indigo-500 truncate">{l.url}</p>
                  </div>
                </div>
              )) : (
                <div className="col-span-full py-20 text-center">
                  <ExternalLink size={40} className="mx-auto text-slate-200 mb-3" />
                  <p className="text-slate-400 font-bold">No links added yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fallback for other tabs */}
      {activeTab !== 'Overview' && activeTab !== 'Links' && (
         <div className="bg-white rounded-[20px] border border-slate-100 p-12 text-center animate-in zoom-in-95 duration-300"><Layers size={24} className="mx-auto mb-3 text-indigo-600 opacity-50" /><h2 className="text-lg font-black text-slate-900 mb-1">{activeTab} Section</h2><p className="text-slate-500 text-[12px] mb-4">Under development for this dashboard.</p><button onClick={() => setActiveTab('Overview')} className="px-4 py-1.5 bg-indigo-600 text-white text-[11px] font-black rounded-lg hover:bg-indigo-700 transition-all">Back to Overview</button></div>
      )}

      <AddProjectModal isOpen={showEditModal} onClose={() => setShowEditModal(false)} project={project} />

      {/* --- Action Modals --- */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black text-slate-900">Add New Note</h3>
                <button onClick={() => setShowNoteModal(false)} className="text-slate-400 hover:text-slate-600"><Plus className="rotate-45" size={20} /></button>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                setIsSubmitting(true);
                try {
                  const formData = new FormData(e.target);
                  await API.post(`/project-manager/projects/${activeProjectId}/notes`, formData);
                  showToast('Note added successfully');
                  setShowNoteModal(false);
                  setSelectedFileName('');
                  handleRefresh();
                } catch (err) {
                  showToast(err.response?.data?.message || 'Failed to add note', 'error');
                } finally {
                  setIsSubmitting(false);
                }
              }} className="space-y-4">
                <div>
                  <label className="text-[11px] font-black text-slate-400 uppercase mb-1.5 block">Note Title</label>
                  <input name="title" required className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-bold outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="e.g. Design Feedback" />
                </div>
                <div>
                  <label className="text-[11px] font-black text-slate-400 uppercase mb-1.5 block">Content</label>
                  <textarea name="content" required rows={4} className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-bold outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="Type your note here..." />
                </div>
                <div>
                  <label className="text-[11px] font-black text-slate-400 uppercase mb-1.5 block">Attachment (Optional)</label>
                  <input 
                    type="file" 
                    name="file" 
                    className="w-full text-[12px] text-slate-500 file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-[11px] file:font-black file:bg-indigo-50 file:text-indigo-600 cursor-pointer" 
                    onChange={(e) => setSelectedFileName(e.target.files[0]?.name || '')}
                  />
                  {selectedFileName && <p className="mt-1 text-[9px] font-bold text-indigo-600">Selected: {selectedFileName}</p>}
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-indigo-600 text-white rounded-xl text-[13px] font-black hover:bg-indigo-700 transition-all disabled:opacity-50">
                  {isSubmitting ? 'Adding...' : 'Save Note'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {showLinkModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black text-slate-900">Add Link</h3>
                <button onClick={() => setShowLinkModal(false)} className="text-slate-400 hover:text-slate-600"><Plus className="rotate-45" size={20} /></button>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                setIsSubmitting(true);
                try {
                  const data = { title: e.target.title.value, url: e.target.url.value, category: 'General' };
                  await API.post(`/project-manager/projects/${activeProjectId}/links`, data);
                  showToast('Link added successfully');
                  setShowLinkModal(false);
                  handleRefresh();
                } catch (err) {
                  showToast(err.response?.data?.message || 'Failed to add link', 'error');
                } finally {
                  setIsSubmitting(false);
                }
              }} className="space-y-4">
                <div>
                  <label className="text-[11px] font-black text-slate-400 uppercase mb-1.5 block">Title</label>
                  <input name="title" required className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-bold outline-none" placeholder="Link Title" />
                </div>
                <div>
                  <label className="text-[11px] font-black text-slate-400 uppercase mb-1.5 block">URL</label>
                  <input name="url" type="url" required className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-bold outline-none" placeholder="https://..." />
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-indigo-600 text-white rounded-xl text-[13px] font-black disabled:opacity-50">Add Link</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {showDocModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black text-slate-900">Upload Doc</h3>
                <button onClick={() => setShowDocModal(false)} className="text-slate-400 hover:text-slate-600"><Plus className="rotate-45" size={20} /></button>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                setIsSubmitting(true);
                try {
                  const formData = new FormData(e.target);
                  await API.post(`/project-manager/projects/${activeProjectId}/documents`, formData);
                  showToast('File uploaded successfully');
                  setShowDocModal(false);
                  setSelectedFileName('');
                  handleRefresh();
                } catch (err) {
                  showToast(err.response?.data?.message || 'Upload failed', 'error');
                } finally {
                  setIsSubmitting(false);
                }
              }} className="space-y-4">
                <div className="p-10 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50 flex flex-col items-center gap-2 relative group hover:border-indigo-400 hover:bg-indigo-50/20 transition-all">
                   <Download size={24} className={`${selectedFileName ? 'text-indigo-600' : 'text-slate-300'} group-hover:scale-110 transition-transform`} />
                   <p className="text-[12px] font-bold text-slate-900">{selectedFileName || 'Drop file here or click to select'}</p>
                   {selectedFileName ? (
                     <p className="text-[9px] font-black text-indigo-500 uppercase">File Selected</p>
                   ) : (
                     <p className="text-[9px] font-black text-slate-400 uppercase">PDF, EXCEL, WORD, etc.</p>
                   )}
                   <input 
                     type="file" 
                     name="file" 
                     required 
                     className="absolute inset-0 opacity-0 cursor-pointer" 
                     onChange={(e) => setSelectedFileName(e.target.files[0]?.name || '')}
                   />
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-indigo-600 text-white rounded-xl text-[13px] font-black hover:bg-indigo-700 transition-all disabled:opacity-50">
                  {isSubmitting ? 'Uploading...' : 'Upload File'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Note Modal */}
      {selectedNote && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black text-slate-900">Project Note</h3>
                <button onClick={() => setSelectedNote(null)} className="text-slate-400 hover:text-slate-600"><Plus className="rotate-45" size={20} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="text-[14px] font-black text-slate-800">{selectedNote.title}</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Added by {selectedNote.addedBy} • {new Date(selectedNote.date).toLocaleDateString()}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[13px] text-slate-600 leading-relaxed whitespace-pre-wrap">{selectedNote.content}</p>
                </div>
                {selectedNote.fileUrl && (
                  <button 
                    onClick={() => {
                      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
                      const proxyUrl = `${backendUrl}/project-manager/proxy-download?url=${encodeURIComponent(selectedNote.fileUrl)}&filename=${encodeURIComponent(selectedNote.title || 'note-attachment')}&view=inline`;
                      window.open(proxyUrl, '_blank');
                    }} 
                    className="w-full py-2.5 bg-indigo-50 text-indigo-600 rounded-xl text-[11px] font-black flex items-center justify-center gap-2 hover:bg-indigo-100 transition-all"
                  >
                    <FileText size={14} /> View Attachment
                  </button>
                )}
                <button onClick={() => setSelectedNote(null)} className="w-full py-2.5 bg-slate-100 text-slate-600 rounded-xl text-[11px] font-black hover:bg-slate-200 transition-all">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
