'use client';
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import API from '../api/axios';
import { 
  Folder, 
  CheckSquare, 
  AlertTriangle, 
  PieChart,
  CheckCircle2,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  ExternalLink,
  Plus,
  FileText,
  Clock,
  Layout,
  Users,
  BarChart3
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { Skeleton } from '../components/Skeleton';

// --- Subcomponents ---

const StatCard = ({ title, value, icon: Icon, trend, trendLabel, colorClass, data }) => (
  <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-2">
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${colorClass} bg-opacity-10`}>
        <Icon className={colorClass.replace('bg-', 'text-')} size={16} />
      </div>
      <div className="text-right">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{title}</p>
        <h3 className="text-lg font-bold text-slate-900 tracking-tight">{value}</h3>
      </div>
    </div>
    
    <div className="flex justify-between items-end mt-1">
      <div className="flex items-center gap-1 text-[9px] font-bold">
        {trend && (
          <span className={`flex items-center ${trend > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {trend > 0 ? <ArrowUp size={8} /> : <ArrowDown size={8} />}
            {Math.abs(trend)}%
          </span>
        )}
        <span className="text-slate-400 font-medium uppercase tracking-tight">{trendLabel}</span>
      </div>
      {data && (
        <div className="w-12 h-5">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <Line type="monotone" dataKey="value" stroke={trend > 0 ? '#10b981' : '#f43f5e'} strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  </div>
);

const ApprovalItem = ({ approval }) => {
  const typeColors = {
    'Task': 'text-violet-600 bg-violet-50',
    'Budget': 'text-orange-600 bg-orange-50',
    'Milestone': 'text-blue-600 bg-blue-50'
  };

  return (
    <div className="group border-b border-slate-50 last:border-0 py-3 first:pt-0">
      <div className="flex items-start gap-3">
        <div className={`w-1 h-8 rounded-full shrink-0 ${approval.type === 'Budget' ? 'bg-orange-400/30' : 'bg-violet-400/30'}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <h4 className="text-[12px] font-bold text-slate-900 truncate tracking-tight">{approval.title}</h4>
            <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest ${typeColors[approval.type] || 'bg-slate-50 text-slate-500'}`}>
              {approval.type}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium">{approval.projectName}</p>
          
          <div className="flex gap-1.5 mt-2">
            <button className="flex-1 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-bold rounded-lg border border-emerald-100/50 hover:bg-emerald-600 hover:text-white transition-all">
              Approve
            </button>
            <button className="flex-1 py-1 bg-rose-50 text-rose-600 text-[9px] font-bold rounded-lg border border-rose-100/50 hover:bg-rose-600 hover:text-white transition-all">
              Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ActivityItem = ({ log }) => (
  <div className="flex gap-3 relative pb-3 last:pb-0 group">
    <div className="absolute top-6 left-1 w-px h-[calc(100%-1.5rem)] bg-slate-100 group-last:hidden"></div>
    <div className="mt-1 relative z-10 shrink-0">
      <div className={`w-2.5 h-2.5 rounded-full border border-white shadow-sm ${
        log.action.includes('completed') ? 'bg-emerald-500' :
        log.action.includes('created') ? 'bg-blue-500' :
        log.action.includes('delayed') ? 'bg-rose-500' :
        log.action.includes('approval') ? 'bg-violet-500' : 'bg-orange-500'
      }`}></div>
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-start gap-1 mb-0.5">
        <p className="text-[10px] text-slate-600 leading-tight">
          <span className="font-bold text-slate-900">{log.userName.split(' ')[0]}</span> {log.action.toLowerCase()} <span className="font-bold text-slate-900">"{log.description}"</span>
        </p>
        <span className="text-[8px] font-bold text-slate-400 shrink-0">{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
      </div>
      <p className="text-[9px] font-medium text-slate-400 truncate">{log.module}</p>
    </div>
  </div>
);

// --- Main Dashboard ---

const ProjectDashboard = () => {
  const { user: authUser } = useAuth();
  const [activeTab, setActiveTab] = useState('All');
  const sparklineData = Array.from({length: 10}, () => ({value: Math.floor(Math.random() * 100)}));

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['pmDashboard'],
    queryFn: async () => {
      const res = await API.get('/project-manager/dashboard');
      return res.data.data;
    },
    refetchInterval: 30000 
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    if (hour < 21) return 'Good evening';
    return 'Good night';
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 bg-[#fdfdff] min-h-screen animate-pulse">
        <div className="h-8 bg-slate-100 rounded-lg w-48 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[1,2,3,4,5].map(i => <div key={i} className="h-24 bg-slate-100 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-80 col-span-2 bg-slate-100 rounded-2xl" />
          <div className="h-80 bg-slate-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  const stats = dashboardData?.stats || {};
  const projects = dashboardData?.projects || [];
  const teamPerf = dashboardData?.teamPerformance?.members || [];
  const approvals = dashboardData?.approvals || [];
  const activities = dashboardData?.activityFeed || [];
  const workload = dashboardData?.teamWorkload || [];
  const dailyTracker = dashboardData?.dailyTracker || [];

  return (
    <div className="space-y-4 font-inter pb-10">
      
      {/* Top Header */}
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">{getGreeting()}, {authUser?.name?.split(' ')[0]}! 👋</h1>
          <p className="text-[11px] text-slate-500">Here's a quick look at your operations today.</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-5 gap-3">
        <StatCard title="Active Projects" value={stats.activeProjects} icon={Folder} trend={3} trendLabel="monthly" colorClass="bg-violet-500 text-violet-600" data={sparklineData} />
        <StatCard title="Total Tasks" value={stats.totalTasks} icon={CheckSquare} trend={12} trendLabel="monthly" colorClass="bg-indigo-500 text-indigo-500" data={sparklineData} />
        <StatCard title="Delayed Tasks" value={stats.delayedTasks} icon={AlertTriangle} trend={-4} trendLabel="daily" colorClass="bg-rose-500 text-rose-500" data={sparklineData} />
        <StatCard title="Team Utilization" value={`${stats.teamUtilization}%`} icon={PieChart} trend={5} trendLabel="monthly" colorClass="bg-emerald-500 text-emerald-600" data={sparklineData} />
        <StatCard title="Approvals" value={stats.pendingApprovals} icon={CheckCircle2} trendLabel={`${stats.urgentApprovals} urgent`} colorClass="bg-orange-500 text-orange-600" data={sparklineData} />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        
        {/* Project Overview */}
        <div className="xl:col-span-5 bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-50">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">Project Overview</h2>
              <button className="text-[10px] font-bold text-violet-600 flex items-center gap-1.5 hover:underline">
                View All <ExternalLink size={10} />
              </button>
            </div>
            
            <div className="flex gap-4 border-b border-slate-50 -mb-4">
              {['All', 'At Risk', 'Delayed'].map(tab => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 text-[10px] font-bold uppercase tracking-widest transition-all relative ${
                    activeTab === tab ? 'text-violet-600' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {tab}
                  {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600 rounded-full" />}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-50 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="px-4 py-2">Project</th>
                  <th className="px-2 py-2">Progress</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Manager</th>
                  <th className="px-4 py-2 text-right">Deadline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {projects.slice(0,5).map(project => (
                  <tr key={project._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-4 py-2">
                      <p className="text-[10px] font-bold text-slate-900 truncate">{project.name}</p>
                      <p className="text-[8px] text-slate-400 font-medium">{project.client}</p>
                    </td>
                    <td className="px-2 py-2 w-16">
                      <div className="w-full bg-slate-100 rounded-full h-1">
                        <div className={`h-full rounded-full ${project.progress > 80 ? 'bg-emerald-500' : 'bg-violet-500'}`} style={{ width: `${project.progress}%` }} />
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest ${
                        project.riskStatus === 'on-track' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
                      }`}>
                        {project.riskStatus.split('-')[0]}
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-[7px] font-black border border-violet-200">
                          {project.manager?.name?.substring(0,2)}
                        </div>
                        <span className="text-[9px] font-bold text-slate-600">{project.manager?.name?.split(' ')[0]}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <span className="text-[9px] font-bold text-slate-500 uppercase">
                        {new Date(project.deadline).toLocaleDateString([], {month: 'short', day: 'numeric'})}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Team Performance */}
        <div className="xl:col-span-4 bg-white rounded-3xl border border-slate-200/60 shadow-sm p-4 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Team Performance</h2>
            <div className="flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded-lg border border-slate-100">
               <span className="text-[9px] font-bold text-slate-500">Month</span>
               <ChevronDown size={10} className="text-slate-400" />
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-end mb-1.5">
              <div>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Avg Completion</p>
                <h3 className="text-xl font-black text-violet-600 leading-none">{dashboardData?.teamPerformance?.overallCompletion}%</h3>
              </div>
              <div className="text-right">
                <h3 className="text-lg font-black text-slate-900 leading-none">{dashboardData?.teamPerformance?.totalTasksDone}</h3>
                <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">Done</p>
              </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5">
              <div className="bg-violet-600 h-full rounded-full" style={{ width: `${dashboardData?.teamPerformance?.overallCompletion}%` }} />
            </div>
          </div>

          <div className="flex-1 overflow-auto">
             <table className="w-full text-left">
                <thead>
                  <tr className="text-[7px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                     <th className="pb-1.5">#</th>
                     <th className="pb-1.5">Member</th>
                     <th className="pb-1.5">Ratio</th>
                     <th className="pb-1.5 text-right">Done</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {teamPerf.slice(0,5).map((member, i) => (
                    <tr key={member._id}>
                      <td className="py-2 text-[9px] font-bold text-slate-400">{i + 1}</td>
                      <td className="py-2">
                        <div className="flex items-center gap-1.5">
                           <div className="w-4 h-4 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center text-[7px] font-black">
                              {member.name.substring(0,2)}
                           </div>
                           <span className="text-[10px] font-bold text-slate-800">{member.name.split(' ')[0]}</span>
                        </div>
                      </td>
                      <td className="py-2">
                         <span className="text-[9px] font-bold text-emerald-600">{member.completion}%</span>
                      </td>
                      <td className="py-2 text-right">
                         <span className="text-[9px] font-bold text-slate-600">{member.tasksDone}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>
        </div>

        {/* Approval Queue */}
        <div className="xl:col-span-3 bg-white rounded-3xl border border-slate-200/60 shadow-sm p-4 flex flex-col">
          <h2 className="text-sm font-bold text-slate-900 tracking-tight mb-4">Approval Queue</h2>
          <div className="divide-y divide-slate-50 flex-1 overflow-auto">
            {approvals.slice(0, 3).map(app => <ApprovalItem key={app._id} approval={app} />)}
            {approvals.length === 0 && <div className="py-8 text-center text-slate-400 text-[10px] font-bold uppercase opacity-50">Clear!</div>}
          </div>
        </div>
      </div>

      {/* Second Row Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        
        {/* Activity Feed */}
        <div className="xl:col-span-4 bg-white rounded-3xl border border-slate-200/60 shadow-sm p-4 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Activity Feed</h2>
            <button className="text-[10px] font-bold text-violet-600 flex items-center gap-1 hover:underline">See All <ArrowRight size={10} /></button>
          </div>
          <div className="flex-1 overflow-auto">
            {activities.length > 0 ? activities.slice(0,5).map(log => <ActivityItem key={log._id} log={log} />) : (
               <div className="py-6 text-center text-slate-400 text-[10px] font-bold uppercase opacity-50">Empty</div>
            )}
          </div>
        </div>

        {/* Team Workload */}
        <div className="xl:col-span-4 bg-white rounded-3xl border border-slate-200/60 shadow-sm p-4 flex flex-col">
          <h2 className="text-sm font-bold text-slate-900 tracking-tight mb-4">Team Workload</h2>
          <div className="flex-1 space-y-4">
            {workload.slice(0,5).map((member, i) => (
              <div key={member._id} className="flex items-center gap-2">
                <div className={`w-5 h-5 rounded text-white flex items-center justify-center text-[7px] font-black ${
                   i === 0 ? 'bg-blue-500' : i === 1 ? 'bg-violet-500' : 'bg-rose-500'
                }`}>
                   {member.name.substring(0,2)}
                </div>
                <span className="text-[10px] font-bold text-slate-600 w-16 truncate">{member.name.split(' ')[0]}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-1 overflow-hidden">
                  <div className={`h-full bg-violet-600`} style={{ width: `${member.workloadPct}%` }}></div>
                </div>
                <span className="text-[9px] font-black text-slate-900 w-6 text-right">{member.workloadPct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Tracker */}
        <div className="xl:col-span-4 bg-white rounded-3xl border border-slate-200/60 shadow-sm p-4 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Daily Log <span className="text-slate-400 font-medium text-[10px]">Today</span></h2>
            <button className="text-[10px] font-bold text-violet-600 flex items-center gap-1 hover:underline">Full Tracker <ArrowRight size={10} /></button>
          </div>
          <div className="flex-1 overflow-auto">
             <table className="w-full text-left">
                <thead>
                  <tr className="text-[7px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                     <th className="pb-2">MEMBER</th>
                     <th className="pb-2">TASK</th>
                     <th className="pb-2 text-right">TIME</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {dailyTracker.slice(0,5).map((tracker, i) => (
                    <tr key={i}>
                      <td className="py-2.5">
                        <div className="flex items-center gap-1.5">
                           <div className="w-4 h-4 rounded bg-blue-500 text-white flex items-center justify-center text-[7px] font-black">
                              {tracker.name.substring(0,2)}
                           </div>
                           <span className="text-[9px] font-bold text-slate-600 truncate w-12">{tracker.name.split(' ')[0]}</span>
                        </div>
                      </td>
                      <td className="py-2.5">
                        <span className="text-[9px] font-bold text-slate-700 truncate block w-32">{tracker.task}</span>
                      </td>
                      <td className="py-2.5 text-right">
                        <span className="text-[9px] font-medium text-slate-600">{Math.floor(tracker.hoursLogged)}h {Math.round((tracker.hoursLogged % 1) * 60)}m</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>
        </div>
      </div>

      {/* Quick Actions & Shortcuts Row */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:divide-x divide-slate-100">
          
          {/* Quick Actions */}
          <div className="lg:col-span-5 pr-4">
            <h2 className="text-[12px] font-bold text-slate-900 mb-3">Quick Actions</h2>
            <div className="flex flex-wrap gap-2">
              <button className="bg-violet-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5 hover:bg-violet-700 transition-all shadow-sm">
                <Plus size={14} /> New Project
              </button>
              {[
                { label: 'Task', icon: Plus },
                { label: 'Approval', icon: FileText },
                { label: 'Time', icon: Clock }
              ].map(action => (
                <button key={action.label} className="bg-white text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5 hover:bg-slate-50 transition-all">
                  <action.icon size={14} className="text-slate-400" /> {action.label}
                </button>
              ))}
            </div>
          </div>

          {/* Shortcuts */}
          <div className="lg:col-span-7 pl-6">
            <h2 className="text-[12px] font-bold text-slate-900 mb-3">Shortcuts</h2>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Kanban', icon: Layout },
                { label: 'Tasks', icon: CheckSquare },
                { label: 'Workload', icon: Users },
                { label: 'Reports', icon: BarChart3 },
                { label: 'Analytics', icon: PieChart }
              ].map(shortcut => (
                <button key={shortcut.label} className="bg-white text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5 hover:bg-slate-50 transition-all">
                  <shortcut.icon size={14} className="text-slate-400" /> {shortcut.label}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
      
    </div>
  );
};

export default ProjectDashboard;
