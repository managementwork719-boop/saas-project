'use client';
import React, { useState, useEffect } from 'react';
import { Plus, Search, FileText, FileSignature, Download, Trash2, Calendar, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const DocumentList = ({ type }) => {
    const router = useRouter();
    const { user } = useAuth();
    const { showToast } = useToast();
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const isInvoice = type === 'invoice';
    const title = isInvoice ? 'Invoices' : 'Quotations';
    const Icon = isInvoice ? FileText : FileSignature;
    const endpoint = isInvoice ? '/documents/invoices' : '/documents/quotations';

    useEffect(() => {
        fetchDocuments();
    }, [type]);

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const res = await API.get(endpoint);
            setDocuments(res.data.data[isInvoice ? 'invoices' : 'quotations'] || []);
        } catch (err) {
            showToast(`Could not load ${title}`, 'error');
            console.error(`Failed to fetch ${title}`, err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
        try {
            await API.delete(`${endpoint}/${id}`);
            setDocuments(prev => prev.filter(doc => doc._id !== id));
            showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`, 'success');
        } catch (err) {
            showToast('Authorization required or deletion failed', 'error');
        }
    };

    const filteredDocs = documents.filter(doc => 
        doc.clientName?.toLowerCase().includes(search.toLowerCase()) ||
        (isInvoice ? doc.invoiceNumber : doc.quotationNumber)?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/70 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/60 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary">
                        <Icon size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h1>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                            {isInvoice ? 'Billing & Revenue Records' : 'Proposals & Estimates'}
                        </p>
                    </div>
                </div>
                
                <button
                    onClick={() => router.push(`/${type}s/create`)}
                    className="flex items-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-brand-shadow hover:bg-brand-hover transition-all active:scale-95"
                >
                    <Plus size={16} />
                    Create New {isInvoice ? 'Invoice' : 'Quotation'}
                </button>
            </div>

            {/* Search and Filters */}
            <div className="relative group max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors" size={18} />
                <input 
                    type="text"
                    placeholder={`Search by client or ${type} number...`}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 bg-white/50 backdrop-blur-sm border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all font-medium text-slate-600"
                />
            </div>

            {/* List */}
            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary"></div>
                </div>
            ) : filteredDocs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDocs.map((doc) => (
                        <div 
                            key={doc._id} 
                            onClick={() => router.push(`/${type}s/edit/${doc._id}${doc.isFinalized ? '?download=true' : ''}`)}
                            className="group bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                        >
                           <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-slate-50 rounded-xl text-slate-500 font-black text-[10px] uppercase tracking-tighter border border-slate-100">
                                    #{isInvoice ? doc.invoiceNumber : doc.quotationNumber}
                                </div>
                                <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                    doc.isFinalized 
                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                    : 'bg-amber-50 text-amber-600 border border-amber-100'
                                }`}>
                                    {doc.isFinalized ? 'Finished' : 'Draft'}
                                </div>
                           </div>
                           
                           <h3 className="text-base font-black text-slate-800 mb-1 truncate">{doc.clientName}</h3>
                           
                           <div className="flex items-center gap-2 text-slate-400 text-[11px] font-bold mb-4">
                               <Calendar size={12} />
                               <span>{new Date(doc.date).toLocaleDateString('en-GB')}</span>
                               <span className="mx-1">•</span>
                               <User size={12} />
                               <span className="truncate">{doc.creatorName || 'Staff'}</span>
                           </div>

                           <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                               <div className="text-lg font-black text-slate-900 tracking-tight">
                                   ₹{doc.total?.toLocaleString()}
                                </div>
                               <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                   {(user?.role === 'admin' || user?.role === 'super-admin' || user?.role === 'sales-manager') && (
                                       <button 
                                            onClick={() => handleDelete(doc._id)}
                                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                            title="Delete Document"
                                       >
                                           <Trash2 size={16} />
                                       </button>
                                   )}
                                   
                                   {!doc.isFinalized ? (
                                       <button 
                                            onClick={() => router.push(`/${type}s/edit/${doc._id}`)}
                                            className="p-2 text-brand-primary hover:bg-brand-primary/5 rounded-xl transition-all"
                                            title="Edit Draft"
                                       >
                                           <FileSignature size={16} />
                                       </button>
                                   ) : (
                                       <button 
                                            onClick={() => router.push(`/${type}s/edit/${doc._id}?download=true`)}
                                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                                            title="Download Finalized"
                                       >
                                           <Download size={16} />
                                       </button>
                                   )}
                               </div>
                           </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-white/50 backdrop-blur-sm rounded-[32px] border border-dashed border-slate-300">
                    <Icon size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-bold text-slate-900">No {title} Found</h3>
                    <p className="text-slate-500 text-sm">Start generating documents for your clients.</p>
                </div>
            )}
        </div>
    );
};

export default DocumentList;
