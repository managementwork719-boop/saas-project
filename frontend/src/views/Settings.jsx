'use client';
import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  Mail, 
  Lock, 
  Camera, 
  Save, 
  CheckCircle2, 
  ShieldCheck,
  Building2,
  Palette,
  CloudLightning,
  ArrowRight,
  Globe,
  Phone,
  CreditCard,
  Briefcase,
  Type
} from 'lucide-react';

const Settings = () => {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
  });

  const [previewUrl, setPreviewUrl] = useState(user?.profilePic || null);
  const [profilePic, setProfilePic] = useState(null);

  // Company Brand/Identity State
  const [companyData, setCompanyData] = useState({
    name: '',
    industry: '',
    website: '',
    address: '',
    phone: '',
    businessEmail: '',
    logo: '',
    bankDetails: {
      accountName: '',
      accountNumber: '',
      bankName: '',
      ifsc: ''
    },
    docLabels: {
      invoiceHeading: 'INVOICE',
      quotationHeading: 'QUOTATION',
      billTo: 'INVOICE TO',
      fromLabel: 'FROM OFFICE',
      termsLabel: 'Terms & Condition',
      bankInfoLabel: 'PAYMENT INFORMATION'
    }
  });

  const [smtpData, setSmtpData] = useState({
    host: '',
    port: 465,
    user: '',
    pass: '',
    senderName: ''
  });

  const [testLoading, setTestLoading] = useState(false);
  const [testStatus, setTestStatus] = useState(null);

  useEffect(() => {
    const fetchCompany = async () => {
        try {
            const res = await API.get('/companies/my-company');
            const company = res.data.data.company;
            if (company) {
                // Set SMTP
                if (company.smtpConfig) {
                    setSmtpData({
                        host: company.smtpConfig.host || '',
                        port: company.smtpConfig.port || 465,
                        user: company.smtpConfig.user || '',
                        pass: '', 
                        senderName: company.smtpConfig.senderName || company.name || ''
                    });
                }
                // Set Branding/Identity
                setCompanyData({
                    name: company.name || '',
                    industry: company.industry || '',
                    website: company.website || '',
                    address: company.address || '',
                    phone: company.phone || '',
                    businessEmail: company.businessEmail || '',
                    logo: company.logo || '',
                    bankDetails: company.bankDetails || {
                        accountName: '',
                        accountNumber: '',
                        bankName: '',
                        ifsc: ''
                    },
                    docLabels: company.docLabels || {
                        invoiceHeading: 'INVOICE',
                        quotationHeading: 'QUOTATION',
                        billTo: 'INVOICE TO',
                        fromLabel: 'FROM OFFICE',
                        termsLabel: 'Terms & Condition',
                        bankInfoLabel: 'PAYMENT INFORMATION'
                    }
                });
                setCompanyColor(company.themeColor || '#ea580c');
            }
        } catch (err) {
            console.error('Failed to load company data');
        }
    };
    if (user?.role === 'admin' || user?.role === 'super-admin') {
        fetchCompany();
    }
  }, [user]);

  // Company Branding State
  const [companyColor, setCompanyColor] = useState(user?.companyId?.themeColor || '#ea580c');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePic(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    const data = new FormData();
    data.append('name', formData.name);
    if (formData.password) {
      data.append('password', formData.password);
    }
    if (profilePic) {
      data.append('profilePic', profilePic);
    }

    try {
      const response = await API.patch(`/users/${user._id}`, data);
      if (response.data.status === 'success') {
        setUser(response.data.data.user);
        setSuccess(true);
        setFormData({ ...formData, password: '' });
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyUpdate = async (color) => {
    setCompanyColor(color);
    setLoading(true);
    try {
        await API.patch('/companies/my-company', { themeColor: color });
        // Update local user context if necessary
        const res = await API.get('/companies/my-company');
        setUser({ ...user, companyId: res.data.data.company });
    } catch (err) {
        console.error('Failed to update theme color');
    } finally {
        setLoading(false);
    }
  };

  const handleCompanySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        const payload = { ...companyData, themeColor: companyColor };
        await API.patch('/companies/my-company', payload);
        const res = await API.get('/companies/my-company');
        setUser({ ...user, companyId: res.data.data.company });
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
        alert(err.response?.data?.message || 'Failed to update business profile');
    } finally {
        setLoading(false);
    }
  };

  const handleSmtpSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        await API.patch('/companies/my-company/smtp', smtpData);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
        alert(err.response?.data?.message || 'Failed to save SMTP settings');
    } finally {
        setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!smtpData.host || !smtpData.user || !smtpData.pass) {
        alert('Please fill all SMTP fields to test');
        return;
    }
    setTestLoading(true);
    setTestStatus(null);
    try {
        const res = await API.post('/companies/my-company/test-smtp', smtpData);
        setTestStatus({ success: true, message: res.data.message });
    } catch (err) {
        setTestStatus({ success: false, message: err.response?.data?.message || 'Connection failed' });
    } finally {
        setTestLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm transition-all duration-500">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-brand-primary/10 text-brand-primary rounded-lg transition-colors duration-500">
            <User size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Account Core</h1>
            <p className="text-slate-500 text-[11px] font-medium mt-0.5">Identity and security preferences.</p>
          </div>
        </div>
        {success && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg animate-in zoom-in duration-300 border border-emerald-100">
             <CheckCircle2 size={14} />
             <span className="text-[11px] font-black uppercase tracking-widest">Saved</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Profile Preview & Branding */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm flex flex-col items-center text-center transition-all duration-500">
             <div className="relative group cursor-pointer mb-5" onClick={() => document.getElementById('settings-pic').click()}>
                <img 
                  src={previewUrl} 
                  alt="Profile" 
                  className="w-24 h-24 rounded-2xl object-cover border-2 border-slate-100 shadow-sm group-hover:opacity-80 transition-all duration-300"
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                   <div className="p-2 bg-black/50 text-white rounded-lg backdrop-blur-sm">
                      <Camera size={20} />
                   </div>
                </div>
                <input id="settings-pic" type="file" hidden onChange={handleFileChange} accept="image/*" />
             </div>
             
             <h2 className="text-lg font-black text-slate-900 tracking-tight">{user?.name}</h2>
             <span className="mt-1 px-2.5 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-[0.15em] rounded-md">
                {user?.role === 'user' ? 'Member' : user?.role.replace('-', ' ')}
             </span>
 
             <div className="mt-6 pt-5 border-t border-slate-100 w-full space-y-2.5">
                <div className="flex items-center gap-3 text-slate-500 text-[11px] font-medium">
                   <Mail size={14} className="text-slate-400" />
                   <span className="truncate">{user?.email}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-500 text-[11px] font-medium">
                   <Building2 size={14} className="text-slate-400" />
                   <span className="truncate font-bold text-slate-700">{user?.companyId?.name || 'Platform Admin'}</span>
                </div>
             </div>
          </div>

           {/* Company Admin: Branding Customization */}
          {(user?.role === 'admin' || user?.role === 'super-admin') && (
            <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm space-y-5 animate-in slide-in-from-left-4 duration-500">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-brand-primary/10 text-brand-primary rounded-lg transition-colors">
                    <Palette size={18} />
                 </div>
                 <h3 className="text-sm font-black text-slate-900 tracking-tight">Company Branding</h3>
               </div>
               
               <div className="space-y-4">
                  <p className="text-[9px] text-slate-400 font-black leading-relaxed uppercase tracking-[0.15em]">Select Core Identity</p>
                  <div className="grid grid-cols-4 gap-2.5">
                    {[
                      { hex: '#ea580c', name: 'Orange' },
                      { hex: '#2563eb', name: 'Blue' },
                      { hex: '#7c3aed', name: 'Purple' },
                      { hex: '#059669', name: 'Green' },
                      { hex: '#db2777', name: 'Pink' },
                      { hex: '#111827', name: 'Slate' },
                      { hex: '#4f46e5', name: 'Indigo' },
                      { hex: '#dc2626', name: 'Red' }
                    ].map((c) => (
                      <button
                        key={c.hex}
                        onClick={() => handleCompanyUpdate(c.hex)}
                        title={c.name}
                        className={`w-full aspect-square rounded-lg transition-all border-2 border-transparent hover:scale-105 active:scale-95 ${companyColor === c.hex ? 'border-brand-primary ring-4 ring-brand-shadow shadow-md' : 'shadow-sm'}`}
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                  </div>
                  
                  <div className="pt-3 border-t border-slate-50">
                     <div className="flex items-center justify-between text-[10px] text-slate-400 font-black uppercase tracking-widest">
                        <span>Active Hex</span>
                        <span className="text-brand-primary transition-colors">{companyColor}</span>
                     </div>
                  </div>
               </div>
            </div>
          )}

          <div className="bg-white border border-slate-200/60 p-6 rounded-xl text-slate-800 shadow-sm transition-all duration-500 relative overflow-hidden">
             <div className="relative z-10">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center mb-4 text-slate-500">
                   <ShieldCheck size={16} />
                </div>
                <h3 className="text-sm font-black text-slate-900 tracking-tight mb-2 uppercase tracking-widest">Security Core</h3>
                <p className="text-slate-500 text-[11px] font-medium leading-relaxed">
                   Immediate updates for system credentials. Use encryption-strength passwords for high-level protection.
                </p>
             </div>
             <div className="absolute top-0 right-0 p-4 opacity-5 text-slate-900">
                <CloudLightning size={48} />
             </div>
          </div>
        </div>

         {/* Right: Edit Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm space-y-5 transition-all duration-500">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-0.5">Identity Name</label>
                   <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        type="text" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/60 rounded-lg focus:ring-2 focus:ring-brand-shadow focus:border-brand-primary outline-none transition-all font-semibold text-slate-900 text-sm"
                        placeholder="Your name"
                        required
                      />
                   </div>
                </div>
 
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-0.5">Contact Sync (Locked)</label>
                   <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        type="email" 
                        value={formData.email}
                        disabled
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-200/60 rounded-lg text-slate-400 cursor-not-allowed font-semibold text-sm"
                      />
                   </div>
                </div>
             </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-0.5">Encrypted Access</label>
                <div className="relative">
                   <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                   <input 
                     type="text" 
                     value={formData.password}
                     onChange={(e) => setFormData({...formData, password: e.target.value})}
                     className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/60 rounded-lg focus:ring-2 focus:ring-brand-shadow focus:border-brand-primary outline-none transition-all font-mono text-slate-900 text-sm"
                     placeholder="New high-strength password"
                   />
                </div>
                <p className="text-[9px] text-slate-400 mt-1 font-black uppercase tracking-widest ml-0.5">Leave blank to maintain current access</p>
             </div>

              <div className="pt-6 border-t border-slate-50 flex justify-end">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="px-6 py-3 bg-brand-primary hover:bg-brand-hover text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-lg shadow-lg shadow-brand-shadow transition-all flex items-center gap-2.5 disabled:opacity-50 active:scale-95"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save size={14} />
                  )}
                  <span>{loading ? 'Processing' : 'Commit Changes'}</span>
                </button>
             </div>
          </form>

          {/* Business Identity & Branding - Admin Only */}
          {(user?.role === 'admin' || user?.role === 'super-admin') && (
            <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm space-y-6 mt-6 animate-in slide-in-from-right-4 duration-500">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-brand-primary/10 text-brand-primary rounded-lg">
                        <Building2 size={20} />
                    </div>
                    <div>
                        <h3 className="text-base font-black text-slate-900 tracking-tight">Business Identity</h3>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-0.5 italic">External Documentation Profile</p>
                    </div>
                </div>

                <form onSubmit={handleCompanySubmit} className="space-y-5 pt-2 border-t border-slate-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-0.5">Company Legal Name</label>
                          <input 
                            type="text" value={companyData.name}
                            onChange={(e) => setCompanyData({...companyData, name: e.target.value})}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/60 rounded-lg focus:ring-2 focus:ring-brand-shadow focus:border-brand-primary outline-none transition-all font-semibold text-slate-900 text-sm"
                          />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-0.5">Company Logo (URL)</label>
                          <input 
                            type="text" value={companyData.logo}
                            placeholder="https://example.com/logo.png"
                            onChange={(e) => setCompanyData({...companyData, logo: e.target.value})}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/60 rounded-lg focus:ring-2 focus:ring-brand-shadow focus:border-brand-primary outline-none transition-all font-semibold text-slate-900 text-sm"
                          />
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-0.5">Business Phone</label>
                          <div className="relative">
                            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input 
                              type="text" value={companyData.phone}
                              placeholder="+91 999 000 1111"
                              onChange={(e) => setCompanyData({...companyData, phone: e.target.value})}
                              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/60 rounded-lg focus:ring-2 focus:ring-brand-shadow focus:border-brand-primary outline-none transition-all font-semibold text-slate-900 text-sm"
                            />
                          </div>
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-0.5">Public Website</label>
                          <div className="relative">
                            <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input 
                              type="text" value={companyData.website}
                              placeholder="www.example.com"
                              onChange={(e) => setCompanyData({...companyData, website: e.target.value})}
                              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/60 rounded-lg focus:ring-2 focus:ring-brand-shadow focus:border-brand-primary outline-none transition-all font-semibold text-slate-900 text-sm"
                            />
                          </div>
                       </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-0.5">Office Address</label>
                        <textarea 
                          rows={3}
                          value={companyData.address}
                          onChange={(e) => setCompanyData({...companyData, address: e.target.value})}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/60 rounded-lg focus:ring-2 focus:ring-brand-shadow focus:border-brand-primary outline-none transition-all font-semibold text-slate-900 text-sm resize-none"
                          placeholder="Tech Park, Sector-62, Noida..."
                        />
                    </div>

                    <div className="flex justify-end pt-2">
                        <button 
                            type="submit" disabled={loading}
                            className="px-6 py-2.5 bg-slate-900 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-lg shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95"
                        >
                            <Save size={14} />
                            <span>Save Business Profile</span>
                        </button>
                    </div>
                </form>
            </div>
          )}

          {/* Financial Infrastructure - Admin Only */}
          {(user?.role === 'admin' || user?.role === 'super-admin') && (
            <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm space-y-6 mt-6 animate-in slide-in-from-right-4 duration-500">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-brand-primary/10 text-brand-primary rounded-lg">
                        <CreditCard size={20} />
                    </div>
                    <div>
                        <h3 className="text-base font-black text-slate-900 tracking-tight">Financial Infrastructure</h3>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-0.5 italic">Invoicing Bank Details</p>
                    </div>
                </div>

                <form onSubmit={handleCompanySubmit} className="space-y-5 pt-2 border-t border-slate-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-0.5">Account Beneficiary Name</label>
                          <input 
                            type="text" value={companyData.bankDetails.accountName}
                            onChange={(e) => setCompanyData({...companyData, bankDetails: { ...companyData.bankDetails, accountName: e.target.value }})}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/60 rounded-lg focus:ring-2 focus:ring-brand-shadow focus:border-brand-primary outline-none transition-all font-semibold text-slate-900 text-sm"
                          />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-0.5">Account Number</label>
                          <input 
                            type="text" value={companyData.bankDetails.accountNumber}
                            onChange={(e) => setCompanyData({...companyData, bankDetails: { ...companyData.bankDetails, accountNumber: e.target.value }})}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/60 rounded-lg focus:ring-2 focus:ring-brand-shadow focus:border-brand-primary outline-none transition-all font-semibold text-slate-900 text-sm"
                          />
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-0.5">Bank Name</label>
                          <input 
                            type="text" value={companyData.bankDetails.bankName}
                            onChange={(e) => setCompanyData({...companyData, bankDetails: { ...companyData.bankDetails, bankName: e.target.value }})}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/60 rounded-lg focus:ring-2 focus:ring-brand-shadow focus:border-brand-primary outline-none transition-all font-semibold text-slate-900 text-sm"
                          />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-0.5">IFSC / Swift Code</label>
                          <input 
                            type="text" value={companyData.bankDetails.ifsc}
                            onChange={(e) => setCompanyData({...companyData, bankDetails: { ...companyData.bankDetails, ifsc: e.target.value }})}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/60 rounded-lg focus:ring-2 focus:ring-brand-shadow focus:border-brand-primary outline-none transition-all font-semibold text-slate-900 text-sm"
                          />
                       </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button 
                            type="submit" disabled={loading}
                            className="px-6 py-2.5 bg-slate-900 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-lg shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95"
                        >
                            <Save size={14} />
                            <span>Save Financial Config</span>
                        </button>
                    </div>
                </form>
            </div>
          )}

          {/* Document Terminology - Admin Only */}
          {(user?.role === 'admin' || user?.role === 'super-admin') && (
            <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm space-y-6 mt-6 animate-in slide-in-from-right-4 duration-500">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-brand-primary/10 text-brand-primary rounded-lg">
                        <Type size={20} />
                    </div>
                    <div>
                        <h3 className="text-base font-black text-slate-900 tracking-tight">Document Terminology</h3>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-0.5 italic">Customize Fixed Labels</p>
                    </div>
                </div>

                <form onSubmit={handleCompanySubmit} className="space-y-5 pt-2 border-t border-slate-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-0.5">Invoice Heading</label>
                          <input 
                            type="text" value={companyData.docLabels.invoiceHeading}
                            onChange={(e) => setCompanyData({...companyData, docLabels: { ...companyData.docLabels, invoiceHeading: e.target.value }})}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/60 rounded-lg focus:ring-2 focus:ring-brand-shadow focus:border-brand-primary outline-none transition-all font-semibold text-slate-900 text-sm"
                          />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-0.5">Quotation Heading</label>
                          <input 
                            type="text" value={companyData.docLabels.quotationHeading}
                            onChange={(e) => setCompanyData({...companyData, docLabels: { ...companyData.docLabels, quotationHeading: e.target.value }})}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/60 rounded-lg focus:ring-2 focus:ring-brand-shadow focus:border-brand-primary outline-none transition-all font-semibold text-slate-900 text-sm"
                          />
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-0.5">"Bill To" Label</label>
                          <input 
                            type="text" value={companyData.docLabels.billTo}
                            onChange={(e) => setCompanyData({...companyData, docLabels: { ...companyData.docLabels, billTo: e.target.value }})}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/60 rounded-lg focus:ring-2 focus:ring-brand-shadow focus:border-brand-primary outline-none transition-all font-semibold text-slate-900 text-sm"
                          />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-0.5">"From Office" Label</label>
                          <input 
                            type="text" value={companyData.docLabels.fromLabel}
                            onChange={(e) => setCompanyData({...companyData, docLabels: { ...companyData.docLabels, fromLabel: e.target.value }})}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/60 rounded-lg focus:ring-2 focus:ring-brand-shadow focus:border-brand-primary outline-none transition-all font-semibold text-slate-900 text-sm"
                          />
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-0.5">Terms Label</label>
                          <input 
                            type="text" value={companyData.docLabels.termsLabel}
                            onChange={(e) => setCompanyData({...companyData, docLabels: { ...companyData.docLabels, termsLabel: e.target.value }})}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/60 rounded-lg focus:ring-2 focus:ring-brand-shadow focus:border-brand-primary outline-none transition-all font-semibold text-slate-900 text-sm"
                          />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-0.5">Bank Info Label</label>
                          <input 
                            type="text" value={companyData.docLabels.bankInfoLabel}
                            onChange={(e) => setCompanyData({...companyData, docLabels: { ...companyData.docLabels, bankInfoLabel: e.target.value }})}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/60 rounded-lg focus:ring-2 focus:ring-brand-shadow focus:border-brand-primary outline-none transition-all font-semibold text-slate-900 text-sm"
                          />
                       </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button 
                            type="submit" disabled={loading}
                            className="px-6 py-2.5 bg-slate-900 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-lg shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95"
                        >
                            <Save size={14} />
                            <span>Save Terminology</span>
                        </button>
                    </div>
                </form>
            </div>
          )}

          {/* SMTP Configuration - Admin Only */}
          {(user?.role === 'admin' || user?.role === 'super-admin') && (
            <div className="bg-white p-6 rounded-xl border border-slate-200/60 shadow-sm space-y-6 mt-6 animate-in slide-in-from-right-4 duration-500">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-brand-primary/10 text-brand-primary rounded-lg">
                            <CloudLightning size={20} />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-slate-900 tracking-tight">Mailing Engine</h3>
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-0.5 italic">Recommended: Brevo SMTP Relay</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSmtpSubmit} className="space-y-5 pt-2 border-t border-slate-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-0.5">SMTP Host</label>
                          <input 
                            type="text" required value={smtpData.host}
                            placeholder="e.g. smtp-relay.brevo.com"
                            onChange={(e) => setSmtpData({...smtpData, host: e.target.value})}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/60 rounded-lg focus:ring-2 focus:ring-brand-shadow focus:border-brand-primary outline-none transition-all font-semibold text-slate-900 text-sm"
                          />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-0.5">Port</label>
                          <input 
                            type="number" required value={smtpData.port}
                            placeholder="587 (Recommended)"
                            onChange={(e) => setSmtpData({...smtpData, port: parseInt(e.target.value)})}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/60 rounded-lg focus:ring-2 focus:ring-brand-shadow focus:border-brand-primary outline-none transition-all font-semibold text-slate-900 text-sm"
                          />
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-0.5">SMTP Identity (Brevo Email)</label>
                          <input 
                            type="email" required value={smtpData.user}
                            placeholder="login@smtp-brevo.com"
                            onChange={(e) => setSmtpData({...smtpData, user: e.target.value})}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/60 rounded-lg focus:ring-2 focus:ring-brand-shadow focus:border-brand-primary outline-none transition-all font-semibold text-slate-900 text-sm"
                          />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-0.5">SMTP Key / Master Password</label>
                          <input 
                            type="password" required={!smtpData.host} value={smtpData.pass}
                            placeholder="Brevo SMTP Key (Long string)"
                            onChange={(e) => setSmtpData({...smtpData, pass: e.target.value})}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/60 rounded-lg focus:ring-2 focus:ring-brand-shadow focus:border-brand-primary outline-none transition-all font-mono text-slate-900 text-sm"
                          />
                       </div>
                    </div>

                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-0.5">Sender Display Name</label>
                       <input 
                         type="text" required value={smtpData.senderName}
                         placeholder="e.g. Work Management Team"
                         onChange={(e) => setSmtpData({...smtpData, senderName: e.target.value})}
                         className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/60 rounded-lg focus:ring-2 focus:ring-brand-shadow focus:border-brand-primary outline-none transition-all font-semibold text-slate-900 text-sm"
                       />
                    </div>

                    {testStatus && (
                        <div className={`p-3 rounded-lg text-xs font-bold border ${testStatus.success ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                            {testStatus.message}
                        </div>
                    )}

                    <div className="flex items-center justify-between gap-4 pt-4">
                        <button 
                            type="button"
                            onClick={handleTestConnection}
                            disabled={testLoading}
                            className="text-brand-primary text-[10px] font-black uppercase tracking-widest hover:text-brand-hover transition-colors flex items-center gap-2 group"
                        >
                            {testLoading ? 'Verifying...' : 'Test Connection'}
                            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </button>

                        <button 
                            type="submit" disabled={loading}
                            className="px-6 py-2.5 bg-slate-900 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-lg shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95"
                        >
                            <Save size={14} />
                            <span>Save Configuration</span>
                        </button>
                    </div>
                </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
