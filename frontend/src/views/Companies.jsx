'use client';
import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import { 
  Plus, 
  Building2, 
  UserPlus, 
  Search, 
  MoreVertical, 
  Copy,
  CheckCircle2,
  X,
  Edit2
} from 'lucide-react';

const Companies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [copySuccess, setCopySuccess] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    companyName: '',
    industry: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const res = await API.get('/super-admin/companies');
      setCompanies(res.data.data.companies);
    } catch (err) {
      console.error('Failed to fetch companies');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingCompany) {
        await API.patch(`/super-admin/update-company/${editingCompany._id}`, {
          name: formData.companyName,
          industry: formData.industry
        });
      } else {
        await API.post('/super-admin/setup-company', formData);
      }
      handleCloseModal();
      fetchCompanies();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to process request');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (comp) => {
    setEditingCompany(comp);
    setFormData({
      companyName: comp.name,
      industry: comp.industry || '',
      adminName: '---', // Not needed for edit
      adminEmail: '---', // Not needed for edit
      adminPassword: '---', // Not needed for edit
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCompany(null);
    setFormData({ companyName: '', industry: '', adminName: '', adminEmail: '', adminPassword: '' });
  };

  const copyToClipboard = (email, pass) => {
    const text = `Company Login Details:\nEmail: ${email}\nPassword: ${pass}`;
    navigator.clipboard.writeText(text);
    setCopySuccess(email);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Clients</h1>
          <p className="text-gray-500 text-sm mt-1">Onboard and manage companies using your software.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-orange-600 hover:bg-orange-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-orange-600/20 flex items-center gap-2"
        >
          <UserPlus size={20} />
          <span>Add New Client</span>
        </button>
      </div>

      {/* Companies Grid/Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
            <h3 className="font-bold text-gray-800">All Onboarded Companies</h3>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Search companies..." 
                    className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
                />
            </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 text-gray-400 text-xs uppercase tracking-widest font-bold">
                <th className="px-6 py-4">Company</th>
                <th className="px-6 py-4">Industry</th>
                <th className="px-6 py-4">Joined Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {companies.map((comp) => (
                <tr key={comp._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                        <Building2 size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{comp.name}</p>
                        <p className="text-gray-500 text-xs">ID: {comp._id.slice(-6)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 font-medium">{comp.industry || 'General'}</td>
                  <td className="px-6 py-4 text-gray-500">{new Date(comp.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                     <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-[10px] font-bold uppercase tracking-wider">Active</span>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => handleEdit(comp)}
                      className="p-2 hover:bg-orange-50 rounded-lg text-slate-400 hover:text-orange-600 transition-all active:scale-95"
                      title="Edit Company"
                    >
                        <Edit2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-gray-50 to-white">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 text-left">
                  {editingCompany ? 'Update Company Details' : 'Onboard New Client'}
                </h2>
                <p className="text-gray-500 text-sm">
                  {editingCompany ? `Modifying ${editingCompany.name}` : 'Create a new workspace and admin account.'}
                </p>
              </div>
              <button 
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Company Section */}
                <div className="md:col-span-2">
                   <h3 className="text-sm font-bold text-orange-600 uppercase tracking-widest mb-4">Company Details</h3>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 underline bg-transparent">Company Name</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.companyName}
                    onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                    placeholder="e.g. Acme Innovations"
                    className="w-full px-4 py-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Industry</label>
                  <input 
                    type="text" 
                    value={formData.industry}
                    onChange={(e) => setFormData({...formData, industry: e.target.value})}
                    placeholder="e.g. Technology"
                    className="w-full px-4 py-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                  />
                </div>

                {!editingCompany && (
                  <>
                    <div className="md:col-span-2 pt-4">
                       <h3 className="text-sm font-bold text-orange-600 uppercase tracking-widest mb-4">Initial Admin Account</h3>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Admin Full Name</label>
                      <input 
                        type="text" 
                        required 
                        value={formData.adminName}
                        onChange={(e) => setFormData({...formData, adminName: e.target.value})}
                        placeholder="e.g. John Doe"
                        className="w-full px-4 py-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Admin Email Address</label>
                      <input 
                        type="email" 
                        required 
                        value={formData.adminEmail}
                        onChange={(e) => setFormData({...formData, adminEmail: e.target.value})}
                        placeholder="client@email.com"
                        className="w-full px-4 py-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Set Initial Password</label>
                      <input 
                        type="text" 
                        required 
                        value={formData.adminPassword}
                        onChange={(e) => setFormData({...formData, adminPassword: e.target.value})}
                        placeholder="Create a strong password"
                        className="w-full px-4 py-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 outline-none transition-all font-mono"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 flex gap-4">
                <button 
                  type="button" 
                  onClick={handleCloseModal}
                  className="flex-1 py-4 px-6 text-gray-500 font-bold hover:bg-gray-50 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="flex-[2] py-4 px-6 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-500 shadow-lg shadow-orange-600/20 transition-all transform active:scale-[0.98]"
                >
                  {loading ? (editingCompany ? 'Updating...' : 'Creating...') : (editingCompany ? 'Save Changes' : 'Create & Onboard Client')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Companies;
