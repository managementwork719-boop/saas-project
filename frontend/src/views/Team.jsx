'use client';
import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { 
  Users, 
  UserPlus, 
  Search, 
  Edit2, 
  Trash2, 
  MoreVertical, 
  Filter,
  Camera,
  X,
  Mail,
  ShieldCheck,
  User,
  Lock,
  Save,
  Briefcase,
  TrendingUp,
  ChevronDown,
  Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { TeamSkeleton } from '@/components/Skeleton';

const Team = () => {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [filter, setFilter] = useState('all');
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [smtpConfigured, setSmtpConfigured] = useState(true);

  // Pagination State
  const [page, setPage] = useState(1);

  const queryClient = useQueryClient();
  const queryKey = ['teamMembers', page, filter];

  const { data: queryData, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await API.get(`/users/company-users?page=${page}&limit=8&role=${filter === 'all' ? '' : filter}`);
      return res.data;
    },
    placeholderData: keepPreviousData
  });

  const members = queryData?.data?.users || [];
  const pagination = queryData?.pagination || { totalPages: 1, totalUsers: 0 };
  const loading = isLoading;

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'project-team',
    designation: '',
    department: '',
    profilePic: null
  });

  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    checkSmtp();
  }, []);

  const checkSmtp = async () => {
    try {
        const res = await API.get('/companies/my-company');
        const config = res.data.data.company.smtpConfig;
        if (!config || !config.host || !config.user) {
            setSmtpConfigured(false);
        } else {
            setSmtpConfigured(true);
        }
    } catch (err) {
        console.error('Failed to check SMTP status');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, profilePic: file });
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const openAddModal = () => {
    setEditMode(false);
    setSelectedMember(null);
    setFormData({ name: '', email: '', password: '', role: 'project-team', designation: '', department: '', profilePic: null });
    setPreviewUrl(null);
    setShowRoleDropdown(false);
    setShowModal(true);
  };

  const openEditModal = (member) => {
    setEditMode(true);
    setSelectedMember(member);
    setFormData({ 
      name: member.name, 
      email: member.email, 
      role: member.role,
      designation: member.designation || '',
      department: member.department || '',
      profilePic: null 
    });
    setPreviewUrl(member.profilePic);
    setShowRoleDropdown(false);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const data = new FormData();
    data.append('name', formData.name);
    data.append('role', formData.role);
    if (formData.designation) data.append('designation', formData.designation);
    if (formData.department) data.append('department', formData.department);
    
    // Admin can always change email and password (if provided)
    if (isAdmin) {
      if (formData.email) data.append('email', formData.email);
      if (formData.password) data.append('password', formData.password);
    } else {
      // For non-admins creating users (if that's even possible, but following logic)
      if (!editMode) {
        data.append('email', formData.email);
        data.append('password', formData.password);
      }
    }

    if (formData.profilePic) {
      data.append('profilePic', formData.profilePic);
    }

    try {
      if (editMode) {
        await API.patch(`/users/${selectedMember._id}`, data);
      } else {
        await API.post('/users', data);
      }
      setShowModal(false);
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
    } catch (err) {
      alert(err.response?.data?.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to remove this staff member?')) {
      try {
        await API.delete(`/users/${id}`);
        queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
      } catch (err) {
        alert('Failed to delete user');
      }
    }
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'super-admin';
  const isSalesManager = user?.role === 'sales-manager';
  const isProjectManager = user?.role === 'project-manager';

  const canManage = (member) => {
    if (isAdmin) return true;
    if (isSalesManager && member.role === 'sales-team') return true;
    if (isProjectManager && member.role === 'project-team') return true;
    return false;
  };

  const canAdd = isAdmin || isSalesManager || isProjectManager;

  if (loading && members.length === 0) return <TeamSkeleton />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* SMTP Warning */}
      {!smtpConfigured && canAdd && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-500 shadow-sm shadow-amber-100">
              <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-amber-100 text-amber-600 rounded-lg">
                      <AlertCircle size={20} />
                  </div>
                  <div>
                      <h3 className="text-[13px] font-black text-slate-900 tracking-tight uppercase">Mailing Engine Offline</h3>
                      <p className="text-slate-500 text-[10px] font-bold mt-0.5 leading-relaxed">
                          Your company's SMTP server is not configured. New member onboarding emails cannot be sent.
                      </p>
                  </div>
              </div>
              <Link 
                to="/settings"
                className="px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center gap-2 hover:bg-slate-800 transition-all active:scale-95"
              >
                  Setup Now <ArrowRight size={14} />
              </Link>
          </div>
      )}

      <div className="flex justify-between items-center bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm transition-all duration-500">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <Users size={22} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Your Team</h1>
            <p className="text-slate-500 text-[11px] font-medium mt-0.5">Manage access levels for {user?.companyId?.name}.</p>
          </div>
        </div>
        {canAdd && (
          <button 
            onClick={openAddModal}
            disabled={!smtpConfigured}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all shadow-lg flex items-center gap-2 active:scale-95 ${
                smtpConfigured 
                ? 'bg-brand-primary hover:bg-brand-hover text-white shadow-brand-shadow' 
                : 'bg-slate-100 text-slate-400 border border-slate-200 shadow-none cursor-not-allowed'
            }`}
          >
            <UserPlus size={16} />
            <span>Add Member</span>
          </button>
        )}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white/40 backdrop-blur-sm p-2 rounded-xl border border-slate-200/60 shadow-sm">
        <div className="flex items-center gap-1 p-1 bg-gray-100/50 rounded-xl w-full sm:w-auto overflow-x-auto no-scrollbar">
           {['all', 'admin', 'sales-manager', 'sales-team', 'accounts-manager', 'accounts-team', 'project-manager', 'project-team'].map((role) => (
             <button
               key={role}
               onClick={() => setFilter(role)}
               className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                 filter === role 
                 ? 'bg-white text-brand-primary shadow-sm' 
                 : 'text-gray-400 hover:text-gray-600'
               }`}
             >
               {role.replace('-', ' ')}
             </button>
           ))}
        </div>
         <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Find someone..." 
              className="w-full pl-9 pr-4 py-1.5 bg-white/50 text-slate-900 border border-slate-200/50 rounded-lg text-[11px] font-medium outline-none focus:bg-white focus:ring-2 focus:ring-brand-shadow transition-all"
            />
         </div>
      </div>

      {/* Team Grid */}
      {/* Team Strips List */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden animate-in slide-in-from-bottom-5 duration-500">
        <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-slate-50/50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
           <div className="col-span-5 pl-2">Full Member Identity</div>
           <div className="col-span-3">Assigned Role</div>
           <div className="col-span-4 text-right pr-2">Actions</div>
        </div>

        <div className="divide-y divide-slate-50">
          {members.filter(m => m._id !== user?._id).map(member => (
            <div key={member._id} className="group grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-3 hover:bg-slate-50/50 transition-all duration-200">
               {/* Detail Section */}
               <div className="col-span-1 md:col-span-5 flex items-center gap-4 pl-0 md:pl-2">
                   <div className="relative flex-shrink-0">
                    <img 
                      src={member.profilePic} 
                      alt={member.name} 
                      className="w-10 h-10 rounded-lg object-cover border border-slate-100 shadow-sm group-hover:scale-105 transition-transform"
                    />
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border border-white rounded-full ${
                      member.role === 'admin' ? 'bg-brand-primary' :
                      member.role.includes('sales') ? 'bg-orange-500' : 'bg-indigo-500'
                    }`} />
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="font-bold text-slate-900 text-[13px] truncate leading-tight">{member.name}</h3>
                    <p className="text-[10px] text-slate-400 font-medium truncate italic leading-tight">{member.email}</p>
                  </div>
               </div>

               {/* Role Section */}
               <div className="col-span-1 md:col-span-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${
                    member.role === 'admin' ? 'bg-brand-primary/10 text-brand-primary' :
                    member.role.includes('sales') ? 'bg-orange-100 text-orange-600' : 'bg-indigo-100 text-indigo-600'
                  }`}>
                    {member.role.replace('-', ' ')}
                  </span>
               </div>

               {/* Actions Section */}
               <div className="col-span-1 md:col-span-4 flex items-center justify-end gap-2 pr-0 md:pr-4">
                  {canManage(member) && member._id !== user._id ? (
                    <>
                       <button 
                        onClick={() => openEditModal(member)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 hover:text-brand-primary transition-all shadow-sm active:scale-95"
                      >
                        <Edit2 size={10} />
                        <span>Manage</span>
                      </button>
                      <button 
                        onClick={() => handleDelete(member._id)}
                        className="p-2 text-gray-300 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 group/contact">
                       <a 
                        href={`mailto:${member.email}`}
                        className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-brand-primary/10 hover:text-brand-primary transition-all"
                       >
                        <Mail size={16} />
                       </a>
                    </div>
                  )}
               </div>
            </div>
          ))}
        </div>

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Team Size: <span className="text-slate-900">{pagination.totalUsers}</span> Members
            </div>
            <div className="flex items-center gap-2">
              <button 
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-widest disabled:opacity-50 hover:bg-slate-50 transition-all active:scale-95"
              >
                Prev
              </button>
              <div className="flex gap-1">
                {[...Array(pagination.totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`w-7 h-7 rounded-lg text-[10px] font-black transition-all ${
                      page === i + 1 
                        ? 'bg-brand-primary text-white shadow-md' 
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
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-widest disabled:opacity-50 hover:bg-slate-50 transition-all active:scale-95"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

       {/* Modal Components */}
      {showModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
           <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl animate-in zoom-in duration-200 relative">
             <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
               <div>
                 <h2 className="text-sm font-black text-slate-900 tracking-tight">{editMode ? 'Manage Profile' : 'New Member'}</h2>
               </div>
               <button onClick={() => setShowModal(false)} className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 transition-all"><X size={16}/></button>
             </div>
 
             <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {/* Profile Pic Section */}
                <div className="flex justify-center mb-1">
                   <div className="relative group cursor-pointer" onClick={() => document.getElementById('pic-input').click()}>
                      <img 
                        src={previewUrl || 'https://res.cloudinary.com/demo/image/upload/v1622551100/sample.jpg'} 
                        className="w-14 h-14 rounded-xl object-cover border-2 border-slate-100 shadow-sm group-hover:opacity-75 transition-all duration-300"
                        alt="preview"
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 text-white drop-shadow-md transition-opacity">
                         <div className="bg-black/40 p-1 rounded-lg backdrop-blur-sm">
                            <Camera size={12} />
                         </div>
                      </div>
                      <input id="pic-input" type="file" hidden onChange={handleFileChange} accept="image/*" />
                   </div>
                </div>

                {/* 2-Column Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-0.5">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input 
                        type="text" required value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 text-slate-900 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-shadow focus:border-brand-primary outline-none transition-all text-xs font-semibold"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>
 
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-0.5">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input 
                        type="email" required disabled={editMode && selectedMember?._id === user._id} value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 text-slate-900 disabled:bg-slate-100 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-shadow outline-none transition-all text-xs font-semibold"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-0.5">Designation</label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input 
                        type="text" value={formData.designation}
                        onChange={(e) => setFormData({...formData, designation: e.target.value})}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 text-slate-900 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-shadow outline-none transition-all text-xs font-semibold"
                        placeholder="e.g. Senior Developer"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-0.5">Domain / Department</label>
                    <div className="relative">
                      <Layers className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input 
                        type="text" value={formData.department}
                        onChange={(e) => setFormData({...formData, department: e.target.value})}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 text-slate-900 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-shadow outline-none transition-all text-xs font-semibold"
                        placeholder="e.g. Frontend"
                      />
                    </div>
                  </div>
                </div>

                 {/* Security Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-0.5">Role / Access</label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10" size={14} />
                      
                      {/* Custom Dropdown */}
                      <div className="relative">
                        <button
                          type="button"
                          disabled={selectedMember?._id === user._id}
                          onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                          className="w-full pl-9 pr-8 py-2 bg-slate-50 text-slate-900 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-shadow focus:border-brand-primary outline-none transition-all text-xs font-semibold flex items-center justify-between disabled:bg-slate-100 disabled:cursor-not-allowed group"
                        >
                          <span className="truncate">
                            {formData.role === 'admin' ? 'Admin' : 
                             formData.role === 'sales-manager' ? 'Sales Head' :
                             formData.role === 'sales-team' ? 'Sales Team' :
                             formData.role === 'accounts-manager' ? 'Accounts Head' :
                             formData.role === 'accounts-team' ? 'Accounts Team' :
                             formData.role === 'project-manager' ? 'PM' : 'Project Team'}
                          </span>
                          <ChevronDown size={12} className={`text-slate-400 transition-transform duration-300 ${showRoleDropdown ? 'rotate-180' : ''}`} />
                        </button>

                         {showRoleDropdown && selectedMember?._id !== user?._id && (
                          <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden z-[110] animate-in slide-in-from-bottom-2 duration-200">
                             {[
                               { id: 'sales-manager', label: 'Sales Manager' },
                               { id: 'sales-team', label: 'Sales Team' },
                               { id: 'accounts-manager', label: 'Accounts Manager' },
                               { id: 'accounts-team', label: 'Accounts Team' },
                               { id: 'project-manager', label: 'Project Manager' },
                               { id: 'project-team', label: 'Project Team' }
                             ].map((opt) => (
                               <div 
                                 key={opt.id}
                                 onClick={() => {
                                   setFormData({...formData, role: opt.id});
                                   setShowRoleDropdown(false);
                                 }}
                                 className={`px-3 py-2 text-xs font-bold cursor-pointer transition-colors flex items-center justify-between group/opt ${
                                   formData.role === opt.id ? 'bg-brand-primary/10 text-brand-primary' : 'text-slate-600 hover:bg-slate-50'
                                 }`}
                               >
                                 <span>{opt.label}</span>
                                 {formData.role === opt.id && <div className="w-1.5 h-1.5 rounded-full bg-brand-primary shadow-sm shadow-brand-shadow" />}
                               </div>
                             ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                   <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-0.5">Password (Optional)</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input 
                        type="text" required={false} value={formData.password}
                        placeholder={editMode ? 'Leave blank' : 'Auto-generated if empty'}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 text-slate-900 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-shadow outline-none transition-all text-[11px] font-mono"
                      />
                    </div>
                    {!editMode && <p className="text-[9px] text-slate-400 font-medium px-1 italic">Generated password will be emailed.</p>}
                  </div>
                </div>
 
                <div className="pt-2">
                   <button 
                      type="submit" disabled={isSubmitting}
                      className="w-full py-3 bg-brand-primary text-white font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-brand-hover shadow-lg shadow-brand-shadow active:scale-95 transition-all flex items-center justify-center gap-2"
                   >
                     {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                     ) : (
                        <Save size={18} />
                     )}
                     <span>{isSubmitting ? 'Processing...' : editMode ? 'Update Team Member' : 'Confirm & Add Member'}</span>
                   </button>
                </div>
             </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Team;
