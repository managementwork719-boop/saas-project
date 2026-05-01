import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { 
  X, ChevronDown, Check, Cpu, Layout, Zap, Palette, Layers, Flag, Search, Plus, 
  Sparkles, CheckCircle2, Calendar, Clock, MoreHorizontal, Briefcase, Edit2, Users, CreditCard, ChevronLeft, ChevronRight, List, Trash2, Filter
} from 'lucide-react';

const AddProjectModal = ({ isOpen, onClose, project = null }) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [searchTeam, setSearchTeam] = useState('');
  const [domainFilter, setDomainFilter] = useState('All Domains');
  const isEdit = !!project;
  
  const [formData, setFormData] = useState({
    name: '',
    client: '',
    key: '',
    type: 'Software Development',
    description: '',
    category: 'Development',
    priority: 'Medium',
    status: 'On Track',
    tags: [],
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0],
    budget: '',
    currency: 'INR (Indian Rupee)',
    visibility: 'visible',
    milestones: []
  });

  const [selectedTeam, setSelectedTeam] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [newMilestone, setNewMilestone] = useState({ name: '', date: '' });

  const { data: teamData } = useQuery({
    queryKey: ['pmTeam'],
    queryFn: async () => {
      const res = await API.get('/project-manager/team');
      return res.data.data.team || [];
    },
    enabled: isOpen
  });

  // Derived Values
  const teamMembersList = teamData || [];
  const domains = ['All Domains', ...new Set(teamMembersList.map(m => m.department || 'Operations'))];
  
  const filteredTeam = teamMembersList.filter(m => {
    const matchesSearch = m.name?.toLowerCase().includes(searchTeam.toLowerCase()) || 
                         m.role?.toLowerCase().includes(searchTeam.toLowerCase()) ||
                         m.designation?.toLowerCase().includes(searchTeam.toLowerCase());
    const matchesDomain = domainFilter === 'All Domains' || m.department === domainFilter;
    return matchesSearch && matchesDomain;
  });

  React.useEffect(() => {
    if (!isOpen) return;

    if (project) {
      setFormData({
        name: project.name || '',
        client: project.client || '',
        key: project.key || '',
        type: project.type || 'Software Development',
        description: project.description || '',
        category: project.category || 'Development',
        priority: project.priority || 'Medium',
        status: project.riskStatus || 'On Track',
        tags: project.tags || [],
        startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        endDate: project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0],
        budget: project.budget || '',
        currency: project.currency || 'INR (Indian Rupee)',
        visibility: project.visibility || 'visible',
        milestones: project.milestones?.map(m => ({ ...m, id: m._id || Date.now() + Math.random() })) || []
      });
      // Populate selected team
      if (project.teamMembers && teamData) {
          const members = teamData.filter(m => project.teamMembers.includes(m._id));
          setSelectedTeam(members);
      }
    } else {
        // Reset form for new project
        setFormData({
            name: '', client: '', key: '', type: 'Software Development', description: '',
            category: 'Development', priority: 'Medium', status: 'On Track', tags: [],
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0],
            budget: '', currency: 'INR (Indian Rupee)', visibility: 'visible', milestones: []
        });
        setSelectedTeam([]);
        setStep(1);
    }
  }, [project, isOpen, !!teamData]);

  const calculateDuration = () => {
    if (!formData.startDate || !formData.endDate) return 0;
    const diff = new Date(formData.endDate) - new Date(formData.startDate);
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const createMutation = useMutation({
    mutationFn: async (data) => {
      if (isEdit) {
        const res = await API.patch(`/project-manager/projects/${project._id}`, data);
        return res.data;
      } else {
        const res = await API.post('/project-manager/projects', data);
        return res.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pmProjects']);
      setStep(1);
      setFormData({...formData, name: '', client: '', description: '', budget: '', milestones: [], tags: []});
      setSelectedTeam([]);
      onClose();
    }
  });

  if (!isOpen) return null;

  // Actions
  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tagToRemove) });
  };

  const handleAddMilestone = () => {
    if (newMilestone.name && newMilestone.date) {
      const diffDays = Math.ceil((new Date(newMilestone.date) - new Date(formData.startDate)) / (1000 * 60 * 60 * 24));
      const dayStr = diffDays >= 0 ? `Day ${diffDays}` : `Pre-start`;
      
      const colors = ['bg-violet-500', 'bg-indigo-500', 'bg-blue-500', 'bg-emerald-500', 'bg-orange-500', 'bg-rose-500'];
      const randColor = colors[Math.floor(Math.random() * colors.length)];

      setFormData({
        ...formData,
        milestones: [...formData.milestones, { 
          id: Date.now(), 
          name: newMilestone.name, 
          date: newMilestone.date, 
          day: dayStr, 
          color: randColor 
        }].sort((a, b) => new Date(a.date) - new Date(b.date))
      });
      setNewMilestone({ name: '', date: '' });
    }
  };

  const removeMilestone = (id) => {
    setFormData({ ...formData, milestones: formData.milestones.filter(m => m.id !== id) });
  };

  const toggleTeamMember = (member) => {
    if (selectedTeam.find(m => m._id === member._id)) {
      setSelectedTeam(selectedTeam.filter(m => m._id !== member._id));
    } else {
      setSelectedTeam([...selectedTeam, member]);
    }
  };

  const nextStep = () => setStep(s => Math.min(4, s + 1));
  const prevStep = () => setStep(s => Math.max(1, s - 1));

  const handleCreate = () => {
    const payload = {
      name: formData.name,
      client: formData.client,
      key: formData.key,
      type: formData.type,
      category: formData.category,
      description: formData.description,
      startDate: new Date(formData.startDate),
      deadline: new Date(formData.endDate),
      priority: formData.priority,
      budget: parseInt(formData.budget.toString().replace(/,/g, '')) || 0,
      currency: formData.currency,
      visibility: formData.visibility,
      status: formData.status === 'On Track' ? 'active' : 'active',
      tags: formData.tags,
      milestones: formData.milestones.map(m => ({
        name: m.name, date: new Date(m.date), day: m.day, color: m.color
      })),
      teamMembers: selectedTeam.map(m => m._id)
    };
    createMutation.mutate(payload);
  };

  const steps = [
    { id: 1, title: 'Project Details' },
    { id: 2, title: 'Team & Manager' },
    { id: 3, title: 'Timeline & Budget' },
    { id: 4, title: 'Review & Create' }
  ];

  const categories = [
    { id: 'Development', icon: Cpu, sub: 'Software / Product development', color: 'text-violet-600', bg: 'bg-violet-50' },
    { id: 'IT Operations', icon: Layout, sub: 'Infrastructure & operations', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'Marketing', icon: Zap, sub: 'Campaigns & growth', color: 'text-pink-600', bg: 'bg-pink-50' },
    { id: 'Design', icon: Palette, sub: 'UI/UX & Creative', color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'Other', icon: Layers, sub: 'Other project type', color: 'text-slate-600', bg: 'bg-slate-50' }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-50 flex justify-between items-start shrink-0">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">{isEdit ? 'Edit Project' : 'Add New Project'}</h2>
            <p className="text-xs text-slate-500 font-medium">{isEdit ? 'Update the project details below.' : 'Fill in the project details to get started.'}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
            <X size={18} />
          </button>
        </div>

        {/* Stepper */}
        <div className="px-6 py-4 flex justify-between relative shrink-0">
          <div className="absolute top-1/2 left-6 right-6 h-px bg-slate-100 -translate-y-[16px] z-0" />
          {steps.map((s) => (
            <div key={s.id} className="relative z-10 flex flex-col items-center group cursor-pointer" onClick={() => { if(s.id < step || formData.name) setStep(s.id) }}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-black transition-all mb-2 ${
                step === s.id ? 'bg-violet-600 text-white shadow-lg shadow-violet-200 ring-4 ring-violet-50' : 
                step > s.id ? 'bg-violet-100 text-violet-600' : 'bg-white border border-slate-200 text-slate-400'
              }`}>
                {step > s.id ? <Check size={14} /> : s.id}
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${step === s.id ? 'text-violet-600' : 'text-slate-400'}`}>{s.title}</span>
              {step === s.id && <div className="absolute -bottom-1 w-full h-0.5 bg-violet-600 rounded-full" />}
            </div>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-6 pb-5 custom-scrollbar min-h-[300px]">
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Project Name <span className="text-rose-500">*</span></label>
                  <input type="text" placeholder="Enter project name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all shadow-sm placeholder:text-slate-400" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Client / Department <span className="text-rose-500">*</span></label>
                  <input type="text" placeholder="Enter client or department name" value={formData.client} onChange={(e) => setFormData({...formData, client: e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all shadow-sm placeholder:text-slate-400" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Project Key (Optional)</label>
                  <input type="text" placeholder="e.g. NEX-CRM" value={formData.key} onChange={(e) => setFormData({...formData, key: e.target.value.toUpperCase()})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all shadow-sm placeholder:text-slate-400 uppercase" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Project Type <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all shadow-sm appearance-none">
                      <option value="">Select project type</option>
                      <option value="Software Development">Software Development</option>
                      <option value="Cloud Infrastructure">Cloud Infrastructure</option>
                      <option value="Marketing Campaign">Marketing Campaign</option>
                      <option value="Internal Operations">Internal Operations</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Project Description <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <textarea placeholder="Describe the project, goals, and key deliverables..." value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={3} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all shadow-sm placeholder:text-slate-400 resize-none" />
                  <span className="absolute bottom-2 right-3 text-[9px] font-bold text-slate-300 tracking-widest">{formData.description.length}/500</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Category</label>
                <div className="grid grid-cols-5 gap-2">
                  {categories.map((cat) => (
                    <div 
                      key={cat.id} 
                      onClick={() => setFormData({...formData, category: cat.id})}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer group flex flex-col gap-2 ${formData.category === cat.id ? 'border-violet-600 ring-1 ring-violet-600 shadow-sm' : 'border-slate-100 hover:border-violet-200'}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center ${cat.bg} ${cat.color}`}>
                          <cat.icon size={14} />
                        </div>
                        {formData.category === cat.id && <div className="w-3 h-3 bg-violet-600 rounded-full flex items-center justify-center"><Check size={8} className="text-white" /></div>}
                      </div>
                      <div>
                        <p className={`text-[10px] font-black tracking-tight ${formData.category === cat.id ? 'text-violet-600' : 'text-slate-900'}`}>{cat.id}</p>
                        <p className="text-[7px] font-medium text-slate-400 mt-0.5 leading-tight">{cat.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Priority <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <Flag size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-500" />
                    <select value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value})} className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all shadow-sm appearance-none">
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Initial Status <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all shadow-sm appearance-none">
                      <option value="On Track">On Track</option>
                      <option value="At Risk">At Risk</option>
                      <option value="Delayed">Delayed</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 flex gap-5">
              {/* Left Column: Team Selection */}
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-base font-black text-slate-900">Team & Manager</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Assign project manager and add team members.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Project Manager <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                        <img src={user?.profilePic || `https://ui-avatars.com/api/?name=${user?.name?.split(' ').join('+')}&background=random`} alt="" className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-700">{user?.name} (You)</span>
                    </div>
                    <input type="text" readOnly className="w-full pl-28 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none appearance-none text-slate-500 font-medium" value="Project Manager" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Team Members</label>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                      <input type="text" placeholder="Search team members by name or role..." value={searchTeam} onChange={(e) => setSearchTeam(e.target.value)} className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-[11px] outline-none focus:bg-white focus:ring-2 focus:ring-violet-500/20" />
                    </div>
                    <div className="relative w-32 shrink-0">
                      <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={10} />
                      <select 
                        value={domainFilter} 
                        onChange={(e) => setDomainFilter(e.target.value)}
                        className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-bold text-slate-600 outline-none appearance-none focus:bg-white focus:ring-2 focus:ring-violet-500/20"
                      >
                        {domains.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-1 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar bg-slate-50/50 p-1.5 rounded-xl border border-slate-100 min-h-[100px]">
                    {filteredTeam.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                        <Users size={24} className="opacity-20 mb-2" />
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">No team members found</p>
                        <p className="text-[9px] mt-1 italic">Try searching with a different name or role.</p>
                      </div>
                    )}
                    {filteredTeam.map((member) => {
                      const isSelected = selectedTeam.some(m => m._id === member._id);
                      return (
                        <div key={member._id} className={`flex items-center justify-between p-2 rounded-lg transition-all border cursor-pointer ${isSelected ? 'bg-white border-violet-200 shadow-sm' : 'hover:bg-white border-transparent hover:border-slate-100'}`} onClick={() => toggleTeamMember(member)}>
                          <div className="flex items-center gap-2.5">
                            <input type="checkbox" checked={isSelected} readOnly className="w-3.5 h-3.5 rounded border-slate-200 text-violet-600 focus:ring-violet-500 cursor-pointer" />
                            <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden border border-slate-100">
                              <img src={member.profilePic || `https://ui-avatars.com/api/?name=${member.name?.split(' ').join('+')}&background=random`} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="text-[11px] font-bold text-slate-900 leading-tight">{member.name}</p>
                                <span className="text-[8px] font-black text-violet-500 uppercase tracking-tighter bg-violet-50 px-1 rounded">{member.role?.split('-')[1] || member.role}</span>
                              </div>
                              <p className="text-[9px] font-medium text-slate-400">{member.designation || member.role}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 block">{member.department || 'Operations'}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Summary */}
              <div className="w-64 space-y-4">
                <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 space-y-3 text-center">
                  <div className="flex items-center gap-1.5 justify-center">
                    <Users size={12} className="text-violet-600" />
                    <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Team Selection</h4>
                  </div>
                  <div className="py-4">
                     <div className="text-3xl font-black text-violet-600 mb-0.5">{selectedTeam.length}</div>
                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Members Selected</p>
                  </div>
                  
                  {selectedTeam.length > 0 && (
                     <div className="text-left space-y-1.5 border-t border-slate-200 pt-3 max-h-[150px] overflow-y-auto custom-scrollbar pr-1">
                       <p className="text-[9px] font-black text-slate-900 uppercase tracking-widest mb-1.5">Selected Roles</p>
                       {selectedTeam.map(m => (
                         <div key={m._id} className="flex justify-between items-center text-[10px]">
                           <span className="font-bold text-slate-700">{m.name.split(' ')[0]}</span>
                           <span className="text-slate-400 font-medium">{m.role}</span>
                         </div>
                       ))}
                     </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 flex gap-5">
              <div className="flex-1 space-y-5">
                <div>
                  <h3 className="text-base font-black text-slate-900">Timeline & Budget</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Define project timeline, add milestones and allocate budget.</p>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Project Timeline</label>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Start Date <span className="text-rose-500">*</span></label>
                      <div className="relative">
                        <Calendar size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-violet-600 pointer-events-none" />
                        <input type="date" value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 transition-all text-slate-700 font-medium" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">End Date <span className="text-rose-500">*</span></label>
                      <div className="relative">
                        <Calendar size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-violet-600 pointer-events-none" />
                        <input type="date" value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})} min={formData.startDate} className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 transition-all text-slate-700 font-medium" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Project Duration</label>
                      <div className="relative">
                        <Clock size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-violet-600" />
                        <input type="text" value={`${calculateDuration()} Days`} readOnly className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs outline-none text-slate-500 font-bold" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <div>
                      <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Milestones</label>
                    </div>
                  </div>
                  
                  {/* Add Milestone Form */}
                  <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <input type="text" placeholder="Milestone Name" value={newMilestone.name} onChange={e => setNewMilestone({...newMilestone, name: e.target.value})} className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-violet-500" />
                    <input type="date" value={newMilestone.date} min={formData.startDate} max={formData.endDate} onChange={e => setNewMilestone({...newMilestone, date: e.target.value})} className="w-32 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-violet-500" />
                    <button onClick={handleAddMilestone} disabled={!newMilestone.name || !newMilestone.date} className="px-3 py-1.5 bg-violet-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest disabled:opacity-50 hover:bg-violet-700 transition-colors flex items-center gap-1"><Plus size={12}/> Add</button>
                  </div>

                  {formData.milestones.length === 0 && (
                    <div className="text-center p-5 bg-slate-50/50 rounded-xl border border-slate-100 border-dashed">
                       <p className="text-xs font-medium text-slate-400">No milestones added yet.</p>
                    </div>
                  )}

                  {formData.milestones.length > 0 && (
                    <div className="relative pl-5 space-y-3 before:content-[''] before:absolute before:left-[9px] before:top-2 before:bottom-2 before:w-px before:bg-slate-100 before:border-l before:border-dashed before:border-slate-300 mt-4 max-h-[150px] overflow-y-auto custom-scrollbar">
                      {formData.milestones.map((m) => (
                        <div key={m.id} className="relative flex items-center justify-between p-2 rounded-xl bg-white border border-slate-100 shadow-sm group hover:border-violet-200 transition-all">
                          <div className={`absolute -left-6 w-2.5 h-2.5 rounded-full border-2 border-white ring-2 ring-white ${m.color}`} />
                          <div className="flex items-center gap-3 flex-1">
                            <div>
                              <p className="text-[11px] font-black text-slate-900">{m.name}</p>
                              <p className="text-[9px] font-medium text-slate-400">{new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric'})}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                             <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${m.color} bg-opacity-10 ${m.color.replace('bg-', 'text-')}`}>{m.day}</span>
                             <button onClick={() => removeMilestone(m.id)} className="text-slate-300 hover:text-rose-500 transition-colors p-1"><Trash2 size={12}/></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="w-64 space-y-4">
                <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 space-y-3">
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={12} className="text-violet-600" />
                    <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Project Budget</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total Budget <span className="text-rose-500">*</span></label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">{formData.currency.includes('USD') ? '$' : '₹'}</span>
                        <input type="number" placeholder="0.00" value={formData.budget} onChange={(e) => setFormData({...formData, budget: e.target.value})} className="w-full pl-6 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-black text-slate-900 outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-500 transition-all" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 space-y-3">
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={12} className="text-violet-600" />
                    <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Settings</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                       <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Currency</label>
                       <div className="relative">
                          <select value={formData.currency} onChange={(e) => setFormData({...formData, currency: e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[10px] outline-none appearance-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-500">
                            <option value="INR (Indian Rupee)">INR (Indian Rupee)</option>
                            <option value="USD (US Dollar)">USD (US Dollar)</option>
                            <option value="EUR (Euro)">EUR (Euro)</option>
                            <option value="GBP (British Pound)">GBP (British Pound)</option>
                          </select>
                          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <p className="text-[9px] font-black text-slate-900 uppercase tracking-widest">Visibility</p>
                       <div className="space-y-1.5">
                          <label className="flex items-center gap-1.5 cursor-pointer group">
                             <input type="radio" name="vis" checked={formData.visibility === 'visible'} onChange={() => setFormData({...formData, visibility: 'visible'})} className="w-3 h-3 text-violet-600 border-slate-200 focus:ring-violet-500" />
                             <span className="text-[10px] font-medium text-slate-600 group-hover:text-slate-900">Visible to team</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer group">
                             <input type="radio" name="vis" checked={formData.visibility === 'managers-only'} onChange={() => setFormData({...formData, visibility: 'managers-only'})} className="w-3 h-3 text-violet-600 border-slate-200 focus:ring-violet-500" />
                             <span className="text-[10px] font-medium text-slate-600 group-hover:text-slate-900">Managers only</span>
                          </label>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 flex gap-5">
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-base font-black text-slate-900">Review Project Details</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Review all details before creating the project.</p>
                </div>

                <div className="space-y-3">
                  {/* Summary Sections */}
                  <div className="bg-white rounded-xl border border-slate-100 p-4 space-y-4 shadow-sm">
                    <div className="flex justify-between items-start">
                       <div className="flex gap-2">
                         <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center text-violet-600"><Briefcase size={16} /></div>
                         <h4 className="text-[11px] font-black text-slate-900 mt-1.5">Project Information</h4>
                       </div>
                       <button onClick={() => setStep(1)} className="flex items-center gap-1 text-[9px] font-black text-violet-600 uppercase tracking-widest hover:bg-violet-50 px-1.5 py-0.5 rounded transition-colors"><Edit2 size={10} /> Edit</button>
                    </div>
                    <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-[10px]">
                       <div className="flex justify-between border-b border-slate-50 pb-1.5"><span className="text-slate-400">Project Name</span><span className="font-bold text-slate-700 text-right">{formData.name || '-'}</span></div>
                       <div className="flex justify-between border-b border-slate-50 pb-1.5"><span className="text-slate-400">Client / Department</span><span className="font-bold text-slate-700 text-right">{formData.client || '-'}</span></div>
                       <div className="flex justify-between border-b border-slate-50 pb-1.5"><span className="text-slate-400">Project Key</span><span className="font-bold text-slate-700 text-right">{formData.key || '-'}</span></div>
                       <div className="flex justify-between border-b border-slate-50 pb-1.5"><span className="text-slate-400">Project Type</span><span className="font-bold text-slate-700 text-right">{formData.type}</span></div>
                       <div className="flex gap-1.5 items-center">
                          <span className="text-slate-400">Category</span>
                          <span className="px-1.5 py-0.5 bg-violet-100 text-violet-600 rounded-md font-black text-[8px] uppercase">{formData.category}</span>
                       </div>
                       <div className="flex gap-1.5 items-center">
                          <span className="text-slate-400">Priority</span>
                          <span className={`px-1.5 py-0.5 rounded-md font-black text-[8px] uppercase border ${
                            formData.priority === 'High' || formData.priority === 'Critical' ? 'bg-rose-50 text-rose-500 border-rose-100' : 
                            formData.priority === 'Medium' ? 'bg-orange-50 text-orange-500 border-orange-100' : 
                            'bg-emerald-50 text-emerald-500 border-emerald-100'
                          }`}>{formData.priority}</span>
                       </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-100 p-4 space-y-4 shadow-sm">
                    <div className="flex justify-between items-start">
                       <div className="flex gap-2">
                         <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600"><Users size={16} /></div>
                         <h4 className="text-[11px] font-black text-slate-900 mt-1.5">Team & Manager</h4>
                       </div>
                       <button onClick={() => setStep(2)} className="flex items-center gap-1 text-[9px] font-black text-violet-600 uppercase tracking-widest hover:bg-violet-50 px-1.5 py-0.5 rounded transition-colors"><Edit2 size={10} /> Edit</button>
                    </div>
                    <div className="grid grid-cols-1 gap-y-3 text-[10px]">
                       <div className="flex justify-between border-b border-slate-50 pb-1.5">
                           <span className="text-slate-400">Project Manager</span>
                           <div className="flex items-center gap-1.5">
                             <div className="w-5 h-5 rounded-full overflow-hidden bg-slate-100 border border-slate-200">
                               <img src={user?.profilePic || `https://ui-avatars.com/api/?name=${user?.name?.split(' ').join('+')}&background=random`} alt="" className="w-full h-full object-cover" />
                             </div>
                             <span className="font-bold text-slate-700">{user?.name}</span>
                           </div>
                       </div>
                       <div className="flex justify-between border-b border-slate-50 pb-1.5">
                          <span className="text-slate-400">Team Members</span>
                          {selectedTeam.length > 0 ? (
                            <div className="flex -space-x-1">
                               {selectedTeam.slice(0,4).map(m => (
                                 <div key={m._id} className="w-5 h-5 rounded-full border border-white overflow-hidden bg-slate-200 shadow-sm" title={m.name}>
                                   <img src={m.profilePic || `https://ui-avatars.com/api/?name=${m.name?.split(' ').join('+')}&background=random`} alt="" className="w-full h-full object-cover" />
                                 </div>
                               ))}
                              {selectedTeam.length > 4 && <div className="w-5 h-5 rounded-full border border-white bg-slate-50 flex items-center justify-center text-[7px] font-black text-slate-400">+{selectedTeam.length - 4}</div>}
                            </div>
                          ) : (
                            <span className="text-slate-400 font-medium italic text-[9px]">No team selected</span>
                          )}
                       </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-100 p-4 space-y-4 shadow-sm">
                    <div className="flex justify-between items-start">
                       <div className="flex gap-2">
                         <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center text-violet-600"><Clock size={16} /></div>
                         <h4 className="text-[11px] font-black text-slate-900 mt-1.5">Timeline & Budget</h4>
                       </div>
                       <button onClick={() => setStep(3)} className="flex items-center gap-1 text-[9px] font-black text-violet-600 uppercase tracking-widest hover:bg-violet-50 px-1.5 py-0.5 rounded transition-colors"><Edit2 size={10} /> Edit</button>
                    </div>
                    <div className="grid grid-cols-4 gap-3 text-[10px]">
                       <div><p className="text-slate-400 mb-0.5">Start Date</p><p className="font-bold text-slate-700">{new Date(formData.startDate).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}</p></div>
                       <div><p className="text-slate-400 mb-0.5">End Date</p><p className="font-bold text-slate-700">{new Date(formData.endDate).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}</p></div>
                       <div><p className="text-slate-400 mb-0.5">Duration</p><p className="font-bold text-slate-700">{calculateDuration()} Days</p></div>
                       <div><p className="text-slate-400 mb-0.5">Total Budget</p><p className="font-bold text-slate-900">{formData.budget ? `${formData.currency.includes('USD') ? '$' : '₹'}${parseInt(formData.budget).toLocaleString()}` : 'N/A'}</p></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tags</label>
                    <div className="flex flex-wrap gap-1.5 items-center">
                       {formData.tags.map(t => (
                         <span key={t} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[9px] font-bold flex items-center gap-1">
                           {t} 
                           <button onClick={() => removeTag(t)} className="text-slate-400 hover:text-rose-500 ml-0.5"><X size={8} /></button>
                         </span>
                       ))}
                       <div className="relative flex items-center">
                         <input 
                           type="text" 
                           placeholder="Type and press Enter to add tag..." 
                           className="text-[9px] font-bold text-slate-600 bg-transparent border-b border-dashed border-slate-300 focus:border-violet-500 outline-none w-40 pb-0.5 placeholder:text-slate-300 placeholder:font-medium" 
                           value={tagInput}
                           onChange={e => setTagInput(e.target.value)}
                           onKeyDown={handleAddTag}
                         />
                       </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-64 space-y-4">
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-6 text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-violet-200/20 rounded-full -mr-12 -mt-12 blur-2xl" />
                  <div className="relative">
                    <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner shadow-white/50">
                       <List size={24} className="text-violet-600" />
                       <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-violet-600 rounded-full border-[3px] border-white flex items-center justify-center shadow-lg"><Check size={10} className="text-white" /></div>
                    </div>
                    <h4 className="text-sm font-black text-slate-900 leading-tight">Ready to launch!</h4>
                  </div>

                  <div className="space-y-3 pt-2 text-left">
                    {[
                      { l: 'Project Key', v: formData.key || '-', icon: Layout },
                      { l: 'Project Type', v: formData.type, icon: Edit2 },
                      { l: 'Duration', v: `${calculateDuration()} Days`, icon: Clock },
                      { l: 'Milestones', v: `${formData.milestones.length} Milestones`, icon: Calendar },
                      { l: 'Total Budget', v: formData.budget ? `${formData.currency.includes('USD') ? '$' : '₹'}${parseInt(formData.budget).toLocaleString()}` : '-', icon: CreditCard },
                      { l: 'Team Members', v: `${selectedTeam.length} Members`, icon: Users },
                      { l: 'Priority', v: formData.priority, icon: Flag },
                      { l: 'Status', v: formData.status, icon: CheckCircle2 },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between group">
                        <div className="flex items-center gap-2">
                          <div className="p-1 bg-white rounded text-slate-400 group-hover:text-violet-600 transition-colors shadow-sm"><item.icon size={10} /></div>
                          <span className="text-[9px] font-bold text-slate-400 group-hover:text-slate-500 transition-colors uppercase tracking-widest">{item.l}</span>
                        </div>
                        <span className="text-[9px] font-black text-slate-700 truncate max-w-[80px] text-right" title={item.v}>{item.v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-50 flex justify-between items-center bg-white rounded-b-[20px] shrink-0">
          <button 
            onClick={step === 1 ? onClose : prevStep} 
            className="px-5 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all flex items-center gap-1.5 active:scale-95"
          >
            <ChevronLeft size={14} /> {step === 1 ? 'Cancel' : 'Back'}
          </button>
          
          <div className="flex gap-2">
            {step === 4 && (
              <button onClick={onClose} className="px-5 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all active:scale-95 shadow-sm">
                Save as Draft
              </button>
            )}
            <button 
              onClick={step === 4 ? handleCreate : nextStep}
              disabled={createMutation.isPending || (step === 1 && (!formData.name || !formData.client))}
              className="px-6 py-2 bg-violet-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-violet-200 hover:bg-violet-700 transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createMutation.isPending ? (isEdit ? 'Updating...' : 'Creating...') : step === 4 ? (isEdit ? 'Update Project' : 'Create Project') : 'Next'} 
              {!createMutation.isPending && step !== 4 && <ChevronRight size={14} />} 
              {!createMutation.isPending && step === 4 && <Check size={14} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProjectModal;
