'use client';
import React from 'react';
import { 
  Briefcase, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  LayoutDashboard,
  Users,
  Calendar,
  Zap,
  ArrowUpRight,
  TrendingUp,
  Target
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const StatCard = ({ title, value, icon: Icon, color, trend }) => (
  <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-4 group">
    <div className={`p-2.5 rounded-lg ${color} bg-opacity-10 transition-colors group-hover:bg-opacity-20`}>
      <Icon className={color.replace('bg-', 'text-')} size={18} />
    </div>
    <div className="flex-1">
      <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{title}</p>
      <div className="flex items-baseline gap-2">
        <h3 className="text-lg font-bold text-slate-900 tracking-tight">{value}</h3>
        {trend && (
          <span className="flex items-center text-green-500 text-[10px] font-bold">
            <ArrowUpRight size={10} className="mr-0.5" />
            {trend}
          </span>
        )}
      </div>
    </div>
  </div>
);

const ProjectDashboard = () => {
  const { user } = useAuth();
  const today = new Date().toLocaleDateString('en-GB', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Welcome Header */}
      <div className="bg-slate-900 p-8 rounded-2xl relative overflow-hidden border border-slate-800 shadow-2xl">
         <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50" />
         <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-primary/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl opacity-30" />
         
         <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
               <div className="flex items-center gap-2 text-brand-primary">
                  <Zap size={16} fill="currentColor" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em]">{today}</span>
               </div>
               <h1 className="text-3xl font-bold text-white tracking-tight">
                  <span className="text-slate-400">Project Engine:</span> {user?.name?.split(' ')[0]} 
               </h1>
               <p className="text-slate-400 text-sm font-medium">
                  Welcome to the Project Command Center. Track milestones and team velocity.
               </p>
            </div>
            
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-sm">
               <div className="p-2 bg-white/10 rounded-lg text-white">
                  <Target size={20} />
               </div>
               <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Command Level</p>
                  <p className="text-xs font-bold text-white uppercase mt-1">{user?.role?.replace('-', ' ')}</p>
               </div>
            </div>
         </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
            title="Active Projects" 
            value="14" 
            icon={Briefcase} 
            color="bg-blue-500" 
            trend="+2.5%" 
        />
        <StatCard 
            title="In Pipeline" 
            value="8" 
            icon={Clock} 
            color="bg-orange-500" 
            trend="+12%" 
        />
        <StatCard 
            title="Completed" 
            value="128" 
            icon={CheckCircle2} 
            color="bg-emerald-500" 
            trend="+8.4%" 
        />
        <StatCard 
            title="Critical Alerts" 
            value="2" 
            icon={AlertCircle} 
            color="bg-red-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
         {/* Project Pulse List */}
         <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight uppercase">Recent Project Activity</h2>
               </div>
               <button className="text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest">View Schedule</button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm divide-y divide-slate-100 overflow-hidden">
               {[
                 { name: 'Website Redesign', client: 'Global Edge', status: 'In Progress', progress: 65, tech: 'React / Node' },
                 { name: 'SaaS Mobile App', client: 'Nexus Corp', status: 'Testing', progress: 90, tech: 'Flutter / Firebase' },
                 { name: 'CRM Integration', client: 'Vertex Ltd', status: 'Setup', progress: 15, tech: 'Python / AWS' }
               ].map((project, i) => (
                 <div key={i} className="p-4 hover:bg-slate-50 transition-all cursor-pointer group">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                       <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0 group-hover:scale-110 transition-transform">
                             <Briefcase size={20} />
                          </div>
                          <div>
                             <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{project.name}</h4>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{project.client}</p>
                          </div>
                       </div>
                       
                       <div className="flex-1 max-w-xs md:mx-8">
                          <div className="flex justify-between items-center mb-1">
                             <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Milestone</span>
                             <span className="text-[10px] font-bold text-indigo-600">{project.progress}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                             <div 
                                className="h-full bg-indigo-500 rounded-full transition-all duration-1000" 
                                style={{ width: `${project.progress}%` }} 
                             />
                          </div>
                       </div>
                       
                       <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${
                             project.status === 'Testing' ? 'bg-amber-100 text-amber-600' :
                             project.status === 'In Progress' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'
                          }`}>
                             {project.status}
                          </span>
                       </div>
                    </div>
                 </div>
               ))}
            </div>
         </div>

         {/* Sidebar Stats */}
         <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#0f172a] rounded-2xl p-6 text-white relative overflow-hidden shadow-xl border border-white/5">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl -mr-16 -mt-16"></div>
                
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] mb-6 text-slate-400 italic">Global Stats</h3>
                
                <div className="space-y-6 relative z-10">
                   <div>
                      <div className="flex justify-between items-end mb-2">
                         <span className="text-[10px] font-bold text-slate-300 uppercase">Team Velocity</span>
                         <span className="text-xs font-bold">94%</span>
                      </div>
                      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                         <div className="h-full w-[94%] bg-indigo-400" />
                      </div>
                   </div>
                   
                   <div>
                      <div className="flex justify-between items-end mb-2">
                         <span className="text-[10px] font-bold text-slate-300 uppercase">Infrastructure</span>
                         <span className="text-xs font-bold">Healthy</span>
                      </div>
                      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                         <div className="h-full w-full bg-emerald-400" />
                      </div>
                   </div>

                   <button className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all active:scale-95 shadow-lg shadow-indigo-500/20">
                      Generate ROI Report
                   </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                   <Calendar size={16} className="text-indigo-500" />
                   <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900">Upcoming Delivs</h3>
                </div>
                <div className="space-y-4">
                   {[
                     { day: '22', month: 'OCT', title: 'Beta Launch', color: 'bg-blue-500' },
                     { day: '25', month: 'OCT', title: 'Client Review', color: 'bg-orange-500' }
                   ].map((item, i) => (
                     <div key={i} className="flex items-center gap-4">
                        <div className="flex flex-col items-center justify-center w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 shrink-0">
                           <span className="text-[11px] font-bold text-slate-900 leading-none">{item.day}</span>
                           <span className="text-[8px] font-bold text-slate-400 mt-0.5">{item.month}</span>
                        </div>
                        <div>
                           <p className="text-xs font-bold text-slate-900">{item.title}</p>
                           <div className="flex items-center gap-1.5 mt-0.5">
                              <div className={`w-1.5 h-1.5 rounded-full ${item.color}`} />
                              <span className="text-[9px] font-medium text-slate-500">Q4 Milestone</span>
                           </div>
                        </div>
                     </div>
                   ))}
                </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default ProjectDashboard;
