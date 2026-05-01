import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Download,
  Bell,
  ChevronLeft,
  ChevronRight,
  Star,
  LayoutGrid,
  List,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Briefcase,
  Users,
  ChevronDown,
  X,
  Calendar,
  Flag,
  Sparkles,
  Check,
  CreditCard,
  Edit2,
  Trash2,
  Layout,
  Cpu,
  Zap,
  Palette,
  Layers,
  Percent
} from 'lucide-react';
import { TableSkeleton } from '../components/Skeleton';
import AddProjectModal from '../components/modals/AddProjectModal';

const StatCard = ({ title, value, icon: Icon, trend, colorClass, iconColorClass }) => (
  <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-2 min-w-[180px] flex-1">
    <div className="flex justify-between items-start">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconColorClass} bg-opacity-10`}>
        <Icon className={iconColorClass.replace('bg-', 'text-')} size={18} />
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-[10px] font-bold ${trend.startsWith('↑') ? 'text-emerald-500' : 'text-slate-400'}`}>
          {trend.split(' ')[0]} {trend.split(' ')[1]}
        </div>
      )}
    </div>
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{title}</p>
      <div className="flex items-baseline gap-2">
        <h3 className="text-xl font-black text-slate-900 leading-none">{value}</h3>
      </div>
    </div>
  </div>
);



import ProjectFilterSidebar from '../components/sidebars/ProjectFilterSidebar';

const ProjectView = () => {
  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();
  const [activeTab, setActiveTab] = useState('All Projects');
  const [viewMode, setViewMode] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilterSidebar, setShowFilterSidebar] = useState(false);
  const [activeFilters, setActiveFilters] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [dropdownConfig, setDropdownConfig] = useState({ id: null, x: 0, y: 0 });
  const itemsPerPage = 10;

  const isPM = authUser?.role === 'project-manager';

  const { data: projectsData, isLoading } = useQuery({
    queryKey: ['pmProjects'],
    queryFn: async () => {
      const res = await API.get('/project-manager/projects');
      return res.data.data;
    }
  });
  
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return await API.delete(`/project-manager/projects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pmProjects']);
      setDropdownConfig({ id: null, x: 0, y: 0 });
    }
  });

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setShowAddModal(true);
    setDropdownConfig({ id: null, x: 0, y: 0 });
  };

  const projects = projectsData?.projects || [];

  const uniqueManagers = useMemo(() => {
    const managers = new Map();
    projects.forEach(p => {
      const managerId = p.manager?._id || p.manager;
      const managerName = p.managerName || p.manager?.name;
      if (managerId && managerName) {
        managers.set(managerId, { id: managerId, name: managerName });
      } else if (managerName) {
        managers.set(managerName, { id: managerName, name: managerName });
      }
    });
    return Array.from(managers.values());
  }, [projects]);

  // Optimized project processing with useMemo
  const processedProjects = useMemo(() => {
    return projects
      .filter(p => {
        if (activeTab === 'All Projects') return true;
        if (activeTab === 'Completed') return p.status === 'completed';
        if (p.status === 'completed') return false; // Exclude completed from other health tabs
        if (activeTab === 'On Track') return p.riskStatus === 'on-track';
        if (activeTab === 'At Risk') return p.riskStatus === 'at-risk';
        if (activeTab === 'Delayed') return p.riskStatus === 'delayed';
        return true;
      })
      .filter(p => {
        if (!activeFilters) return true;
        
        let match = true;

        if (activeFilters.quickFilter && activeFilters.quickFilter !== 'All') {
          const statusMap = {
            'On Track': 'on-track',
            'At Risk': 'at-risk',
            'Delayed': 'delayed',
            'Completed': 'completed'
          };
          if (p.riskStatus !== statusMap[activeFilters.quickFilter]) match = false;
        }

        if (activeFilters.project && p._id !== activeFilters.project) match = false;
        
        if (activeFilters.manager && p.managerName !== activeFilters.manager && (!p.manager || p.manager.name !== activeFilters.manager)) match = false;

        if (activeFilters.status && activeFilters.status.length > 0) {
          if (!activeFilters.status.includes(p.riskStatus)) match = false;
        }

        if (activeFilters.priority && activeFilters.priority.length > 0) {
          if (!activeFilters.priority.includes(p.priority)) match = false;
        }

        if (activeFilters.progressRange) {
          const [min, max] = activeFilters.progressRange;
          if (p.progress < min || p.progress > max) match = false;
        }

        if (activeFilters.dateRange && (activeFilters.dateRange.start || activeFilters.dateRange.end)) {
          const projectDate = new Date(p.deadline);
          if (activeFilters.dateRange.start) {
            const start = new Date(activeFilters.dateRange.start);
            if (projectDate < start) match = false;
          }
          if (activeFilters.dateRange.end) {
            const end = new Date(activeFilters.dateRange.end);
            if (projectDate > end) match = false;
          }
        }
        


        return match;
      })
      .filter(p => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        return (
          p.name?.toLowerCase().includes(searchLower) ||
          p.client?.toLowerCase().includes(searchLower) ||
          p.managerName?.toLowerCase().includes(searchLower) ||
          p.subTitle?.toLowerCase().includes(searchLower)
        );
      });
  }, [projects, activeTab, searchTerm, activeFilters]);
  const paginatedProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processedProjects.slice(startIndex, startIndex + itemsPerPage);
  }, [processedProjects, currentPage]);

  const totalPages = Math.ceil(processedProjects.length / itemsPerPage);

  const stats = useMemo(() => ({
    total: projects.length,
    onTrack: projects.filter(p => p.riskStatus === 'on-track' && p.status !== 'completed').length,
    atRisk: projects.filter(p => p.riskStatus === 'at-risk' && p.status !== 'completed').length,
    delayed: projects.filter(p => p.riskStatus === 'delayed' && p.status !== 'completed').length,
    completed: projects.filter(p => p.status === 'completed').length
  }), [projects]);

  const activeFiltersCount = useMemo(() => {
    if (!activeFilters) return 0;
    let count = 0;
    if (activeFilters.quickFilter && activeFilters.quickFilter !== 'All') count++;
    if (activeFilters.project) count++;
    if (activeFilters.manager) count++;
    if (activeFilters.status?.length > 0) count++;
    if (activeFilters.priority?.length > 0) count++;
    if (activeFilters.dateRange?.start || activeFilters.dateRange?.end) count++;
    if (activeFilters.progressRange && (activeFilters.progressRange[0] !== 0 || activeFilters.progressRange[1] !== 100)) count++;
    return count;
  }, [activeFilters]);

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'text-rose-500';
      case 'medium': return 'text-orange-500';
      case 'low': return 'text-emerald-500';
      default: return 'text-slate-400';
    }
  };

  const getStatusBadge = (status) => {
    const commonStyles = "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest";
    switch (status?.toLowerCase()) {
      case 'on-track':
      case 'on track':
        return <span className={`${commonStyles} bg-emerald-50 text-emerald-600`}>On Track</span>;
      case 'at-risk':
      case 'at risk':
        return <span className={`${commonStyles} bg-orange-50 text-orange-600`}>At Risk</span>;
      case 'delayed':
        return <span className={`${commonStyles} bg-rose-50 text-rose-600`}>Delayed</span>;
      case 'completed':
        return <span className={`${commonStyles} bg-indigo-50 text-indigo-600`}>Completed</span>;
      default:
        return <span className={`${commonStyles} bg-slate-50 text-slate-400`}>{status}</span>;
    }
  };

  return (
    <div className="min-h-screen font-inter">
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Projects</h1>
          <p className="text-[12px] text-slate-500 font-medium">Overview and management of organizational initiatives.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-[12px] w-48 focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all shadow-sm"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={12} />
              </button>
            )}
          </div>
          {isPM && (
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 bg-violet-600 text-white px-4 py-2 rounded-xl text-[12px] font-bold shadow-lg shadow-violet-200 hover:bg-violet-700 transition-all active:scale-95"
            >
              <Plus size={16} /> New Project
            </button>
          )}
          <button 
            onClick={() => setShowFilterSidebar(true)}
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:bg-slate-50 transition-all shadow-sm"
          >
            <Filter size={16} />
          </button>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="flex flex-wrap gap-3 mb-6">
        <StatCard title="Total" value={stats.total} icon={Briefcase} trend="↑ 3" iconColorClass="bg-violet-500 text-violet-600" />
        <StatCard title="On Track" value={stats.onTrack} icon={CheckCircle2} iconColorClass="bg-emerald-500 text-emerald-600" />
        <StatCard title="At Risk" value={stats.atRisk} icon={AlertTriangle} iconColorClass="bg-orange-500 text-orange-600" />
        <StatCard title="Delayed" value={stats.delayed} icon={Clock} iconColorClass="bg-rose-500 text-rose-600" />
        <StatCard title="Completed" value={stats.completed} icon={Star} iconColorClass="bg-indigo-500 text-indigo-600" />
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div className="px-4 py-2 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
          <div className="flex gap-6">
            {['All Projects', 'On Track', 'At Risk', 'Delayed', 'Completed'].map(tab => {
              const count = tab === 'All Projects' ? stats.total : stats[tab.toLowerCase().replace(' ', '')] || 0;
              return (
                <button 
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setCurrentPage(1);
                  }}
                  className={`pb-2 pt-2 text-[10px] font-bold uppercase tracking-widest relative transition-all ${
                    activeTab === tab ? 'text-violet-600' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {tab}
                    <span className={`px-1 py-0.5 rounded text-[9px] ${activeTab === tab ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-400'}`}>
                      {count}
                    </span>
                  </div>
                  {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600 rounded-full" />}
                </button>
              );
            })}
          </div>
          
          <div className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-lg border border-slate-200/50">
             <button onClick={() => setViewMode('list')} className={`p-1 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-400'}`}><List size={14} /></button>
             <button onClick={() => setViewMode('grid')} className={`p-1 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-400'}`}><LayoutGrid size={14} /></button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8"><TableSkeleton /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                  <th className="px-4 py-3">Project</th>
                  <th className="px-3 py-3">Client</th>
                  <th className="px-3 py-3">Manager</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Progress</th>
                  <th className="px-3 py-3">Team</th>
                  <th className="px-3 py-3">Deadline</th>
                  <th className="px-3 py-3">Priority</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginatedProjects.length > 0 ? paginatedProjects.map((project) => (
                  <tr key={project._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-violet-50 text-violet-600"><Briefcase size={16} /></div>
                        <div>
                          <p className="text-[12px] font-bold text-slate-900 leading-tight">{project.name}</p>
                          <p className="text-[9px] font-medium text-slate-400 mt-0.5">{project.type || project.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 font-medium text-slate-600 text-[11px]">{project.client}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-600 overflow-hidden border border-slate-200 shadow-sm">
                           {project.manager?.profilePic ? <img src={project.manager.profilePic} alt="" className="w-full h-full object-cover" /> : project.managerName?.substring(0, 2)}
                        </div>
                        <span className="text-[11px] font-bold text-slate-700">{project.managerName}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">{getStatusBadge(project.status === 'completed' ? 'completed' : project.riskStatus)}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2 min-w-[100px]">
                        <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ${
                              project.progress > 80 ? 'bg-emerald-500' : project.progress > 40 ? 'bg-violet-500' : 'bg-orange-500'
                            }`} 
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-black text-slate-900">{project.progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex -space-x-2">
                        {project.teamMembers?.slice(0, 3).map((member, idx) => (
                          <div 
                            key={member._id || idx} 
                            className="w-7 h-7 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center overflow-hidden shadow-sm"
                            title={member.name}
                          >
                            <img 
                              src={member.profilePic || `https://ui-avatars.com/api/?name=${member.name?.split(' ').join('+')}&background=random`} 
                              alt={member.name} 
                              className="w-full h-full object-cover" 
                            />
                          </div>
                        ))}
                        {project.teamMembers?.length > 3 && (
                          <div className="w-7 h-7 rounded-full border-2 border-white bg-slate-800 flex items-center justify-center text-[8px] font-black text-white shadow-sm">
                            +{project.teamMembers.length - 3}
                          </div>
                        )}
                        {!project.teamMembers?.length && (
                          <span className="text-[10px] text-slate-300 italic">No team</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-[10px] font-bold text-slate-700">
                      {new Date(project.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${getPriorityColor(project.priority)}`}>
                        {project.priority || 'Medium'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button 
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setDropdownConfig({
                            id: dropdownConfig.id === project._id ? null : project._id,
                            x: rect.left - 120, // Offset to align right
                            y: rect.bottom + 8
                          });
                        }}
                        className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={9} className="py-10 text-center text-slate-400 text-[11px] font-bold uppercase tracking-widest opacity-50">No projects found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Dynamic Pagination */}
        <div className="px-6 py-4 border-t border-slate-50 flex justify-between items-center bg-white">
          <p className="text-[11px] font-bold text-slate-400">
            Showing {paginatedProjects.length} of {processedProjects.length} results
          </p>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button 
                  key={page} 
                  onClick={() => setCurrentPage(page)}
                  className={`w-7 h-7 rounded-lg text-[10px] font-black transition-all ${
                    currentPage === page 
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-200' 
                    : 'text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Global Portal-like Dropdown */}
      {dropdownConfig.id && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => setDropdownConfig({ id: null, x: 0, y: 0 })} />
          <div 
            className="fixed w-36 bg-white rounded-xl border border-slate-100 shadow-2xl z-[101] py-1.5 animate-in fade-in zoom-in-95 duration-100 origin-top-right"
            style={{ 
              left: `${dropdownConfig.x}px`, 
              top: `${dropdownConfig.y}px` 
            }}
          >
            <div className="px-3 py-1 mb-1 border-b border-slate-50">
               <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Project Actions</p>
            </div>
            <button 
              onClick={() => handleEdit(projects.find(p => p._id === dropdownConfig.id))}
              className="w-full px-3 py-2 text-left text-[11px] font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2 transition-colors group"
            >
              <div className="w-5 h-5 rounded bg-violet-50 flex items-center justify-center text-violet-500 group-hover:bg-violet-500 group-hover:text-white transition-all">
                <Edit2 size={10} />
              </div>
              Edit Project
            </button>
            <button className="w-full px-3 py-2 text-left text-[11px] font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2 transition-colors group">
              <div className="w-5 h-5 rounded bg-emerald-50 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                <Search size={10} />
              </div>
              View Details
            </button>
            <div className="h-px bg-slate-50 my-1" />
            <button 
              onClick={() => handleDelete(dropdownConfig.id)}
              className="w-full px-3 py-2 text-left text-[11px] font-bold text-rose-500 hover:bg-rose-50 flex items-center gap-2 transition-colors group"
            >
              <div className="w-5 h-5 rounded bg-rose-50 flex items-center justify-center text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-all">
                <Trash2 size={10} />
              </div>
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Project'}
            </button>
          </div>
        </>
      )}

      <AddProjectModal 
        isOpen={showAddModal} 
        onClose={() => {
          setShowAddModal(false);
          setEditingProject(null);
        }} 
        project={editingProject}
      />

      <ProjectFilterSidebar 
        isOpen={showFilterSidebar}
        onClose={() => setShowFilterSidebar(false)}
        onApply={(filters) => setActiveFilters(filters)}
        currentFilters={activeFilters}
        managers={uniqueManagers}
        projects={projects}
      />

    </div>
  );
};

export default ProjectView;
