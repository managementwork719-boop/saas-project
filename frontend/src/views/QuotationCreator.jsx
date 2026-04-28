'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Download, ChevronLeft, Save, FileCheck, Settings } from 'lucide-react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import BrandingModal from '../components/BrandingModal';

const QuotationCreator = () => {
    const router = useRouter();
    const params = useParams();
    const { id } = params;
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const { showToast } = useToast();
    const quoteRef = useRef();
    
    const [loading, setLoading] = useState(false);
    const [isFinalized, setIsFinalized] = useState(false);
    const [quoteNum, setQuoteNum] = useState('QT-XXX');
    const [company, setCompany] = useState(null);
    const [isBrandingModalOpen, setIsBrandingModalOpen] = useState(false);

    // Branding State
    const [docBranding, setDocBranding] = useState({
        logo: '',
        companyName: '',
        companyAddress: '',
        companyPhone: '',
        companyEmail: '',
        website: '',
        accountManager: '',
        industry: '',
        signature: '',
        stamp: '',
        labels: {
            quotationHeading: 'QUOTATION',
            billTo: 'QUOTATION TO',
            fromLabel: 'FROM OFFICE',
            termsLabel: 'Terms & Conditions',
            bankInfoLabel: 'Payment Method',
            termsText: 'Valid for 15 days from the date of issue. Technical scope as discussed.'
        }
    });

    const [clientInfo, setClientInfo] = useState({
        name: '',
        address: '',
        phone: '',
        email: ''
    });

    const [items, setItems] = useState([
        { description: '', quantity: 1, price: 0, total: 0 }
    ]);

    // Client Search State
    const [clientSearch, setClientSearch] = useState('');
    const [clientSuggestions, setClientSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [taxRate, setTaxRate] = useState(0);

    // Fetch existing quotation & Company details
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Fetch Company Details
                const compRes = await API.get('/companies/my-company');
                const companyData = compRes.data.data.company;
                setCompany(companyData);

                if (id) {
                    const res = await API.get(`/documents/quotations`);
                    const quo = res.data.data.quotations.find(q => q._id === id);
                    if (quo) {
                        setClientInfo({
                            name: quo.clientName,
                            address: quo.clientAddress,
                            phone: quo.clientPhone,
                            email: quo.clientEmail
                        });
                        setItems(quo.items);
                        setIsFinalized(quo.isFinalized);
                        setQuoteNum(quo.quotationNumber);
                        setTaxRate(quo.taxRate || 0);

                        // Load saved branding or fallback
                        // Load saved branding and merge with latest company assets (signature/stamp/logo)
                        // Load saved branding and ensure signatures/stamps are included if missing
                        const savedBranding = quo.docBranding || {};
                        const companyQuo = companyData.quotationBranding || {};
                        setDocBranding({
                            ...savedBranding,
                            signature: savedBranding.signature || companyQuo.signature || '',
                            stamp: savedBranding.stamp || companyQuo.stamp || '',
                            logo: savedBranding.logo || companyQuo.logo || '',
                            companyName: savedBranding.companyName || companyQuo.name || '',
                            companyAddress: savedBranding.companyAddress || companyQuo.address || '',
                            companyPhone: savedBranding.companyPhone || companyQuo.phone || '',
                            companyEmail: savedBranding.companyEmail || companyQuo.email || '',
                            website: savedBranding.website || companyQuo.website || '',
                            accountManager: savedBranding.accountManager || user?.name || '',
                            industry: savedBranding.industry || companyQuo.industry || '',
                            labels: {
                                ...docBranding.labels,
                                ...companyQuo.labels,
                                ...savedBranding.labels
                            }
                        });
                    }
                } else {
                    const companyQuo = companyData.quotationBranding || {};
                    setDocBranding({
                        logo: companyQuo.logo || companyData.logo || '',
                        companyName: companyQuo.name || companyData.name || '',
                        companyAddress: companyQuo.address || companyData.address || '',
                        companyPhone: companyQuo.phone || companyData.phone || '',
                        companyEmail: companyQuo.email || companyData.businessEmail || '',
                        website: companyQuo.website || companyData.website || '',
                        accountManager: user?.name || '',
                        industry: companyQuo.industry || companyData.industry || '',
                        signature: companyQuo.signature || '',
                        stamp: companyQuo.stamp || '',
                        labels: {
                            ...docBranding.labels,
                            ...companyQuo.labels
                        }
                    });
                }
            } catch (err) {
                showToast('Failed to load data', 'error');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const updateBranding = async (newBranding, syncGlobally = true) => {
        try {
            // 1. Update local state
            setDocBranding(newBranding);
            
            // 2. Sync to Global Company Profile (Only if authorized and requested)
            const allowedRoles = ['admin', 'super-admin', 'accounts-manager', 'accounts-team'];
            if (syncGlobally && allowedRoles.includes(user?.role)) {
                const payload = {
                    quotationBranding: {
                        name: newBranding.companyName,
                        address: newBranding.companyAddress,
                        phone: newBranding.companyPhone,
                        email: newBranding.companyEmail,
                        logo: newBranding.logo,
                        signature: newBranding.signature,
                        stamp: newBranding.stamp,
                        website: newBranding.website,
                        industry: newBranding.industry,
                        labels: newBranding.labels
                    }
                };
                
                await API.patch('/companies/my-company', payload);
                showToast('Branding updated globally for Quotations', 'success');
            }

            // 3. If editing an existing document, also save branding to the document itself
            if (id) {
                await API.patch(`/documents/quotations/${id}`, {
                    docBranding: newBranding
                });
            }

            showToast('Changes applied successfully', 'success');
        } catch (err) {
            console.error('Failed to update branding:', err);
            showToast('Failed to save branding changes', 'error');
        }
    };

    // Client Search Logic
    useEffect(() => {
        const searchClients = async () => {
            if (clientSearch.length < 2) {
                setClientSuggestions([]);
                return;
            }
            try {
                const res = await API.get(`/clients/all?search=${clientSearch}&limit=5`);
                setClientSuggestions(res.data.data.clients);
            } catch (err) {
                console.error('Client search failed');
            }
        };
        const timer = setTimeout(searchClients, 300);
        return () => clearTimeout(timer);
    }, [clientSearch]);

    const handleClientSelect = (client) => {
        setClientInfo({
            name: client.name,
            phone: client.phone,
            email: client.email || '',
            address: '' 
        });
        setClientSearch(client.name);
        setShowSuggestions(false);
        showToast(`Auto-filled details for ${client.name}`, 'info');
    };

    const handleAddItem = () => {
        if (isFinalized) return;
        setItems([...items, { description: '', quantity: 1, price: 0, total: 0 }]);
    };

    const handleRemoveItem = (index) => {
        if (isFinalized) return;
        setItems(items.filter((_, i) => i !== index));
    };

    const handleItemChange = (index, field, value) => {
        if (isFinalized) return;
        const newItems = [...items];
        newItems[index][field] = value;
        if (field === 'price' || field === 'quantity') {
            newItems[index].total = newItems[index].price * (newItems[index].quantity || 0);
        }
        setItems(newItems);
    };

    const subtotal = items.reduce((acc, item) => acc + item.total, 0);
    const taxAmount = (subtotal * taxRate) / 100;
    const finalTotal = subtotal + taxAmount;

    const handleSave = async (finalize = false) => {
        if (!clientInfo.name) return showToast('Please enter client name', 'warning');
        setLoading(true);
        try {
            const payload = {
                clientName: clientInfo.name,
                clientAddress: clientInfo.address,
                clientPhone: clientInfo.phone,
                clientEmail: clientInfo.email,
                items,
                subtotal,
                tax: taxAmount,
                taxRate: taxRate,
                total: finalTotal,
                isFinalized: finalize,
                docBranding: docBranding
            };

            if (id) {
                await API.patch(`/documents/quotations/${id}`, payload);
            } else {
                await API.post('/documents/quotations', payload);
            }

            if (finalize) {
                showToast('Quotation finished. Preparing download...', 'success');
                setIsFinalized(true);
                setTimeout(() => downloadPDF(), 500);
            } else {
                showToast('Draft version saved', 'success');
                router.push('/quotations');
            }
        } catch (err) {
            console.error(err);
            showToast(err.response?.data?.message || 'Failed to save quotation', 'error');
        } finally {
            setLoading(false);
        }
    };

    const downloadPDF = async () => {
        try {
            setLoading(true);
            
            // 1. Ensure page is scrolled to top to avoid offset clipping
            window.scrollTo(0, 0);
            
            const element = quoteRef.current;
            if (!element) {
                showToast('Preview element not found', 'error');
                return;
            }

            // 2. High-fidelity capture
            const canvas = await html2canvas(element, {
                scale: 3.0, 
                useCORS: true,
                logging: false,
                backgroundColor: "#ffffff",
                windowWidth: element.scrollWidth,
                windowHeight: element.scrollHeight,
                onclone: (clonedDoc) => {
                    const allElements = clonedDoc.getElementsByTagName("*");
                    for (let i = 0; i < allElements.length; i++) {
                        const style = window.getComputedStyle(allElements[i]);
                        ['color', 'backgroundColor', 'borderColor', 'fill', 'stroke'].forEach(prop => {
                            const val = style[prop];
                            if (val && (val.includes('oklch') || val.includes('oklab') || val.includes('color-mix'))) {
                                allElements[i].style[prop] = prop === 'backgroundColor' ? '#ffffff' : '#475569';
                            }
                        });
                    }
                }
            });

            const imgData = canvas.toDataURL('image/png', 1.0);
            
            // 3. A4 PDF Initialization
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            // 4. Multi-page Slicing Logic
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const pageHeightInCanvas = (imgWidth * pdfHeight) / pdfWidth;
            let heightLeft = imgHeight;
            let position = 0;
            
            // Add first page
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, (imgHeight * pdfWidth) / imgWidth, undefined, 'FAST');
            heightLeft -= pageHeightInCanvas;

            // Add additional pages if content overflows A4 significantly (threshold of 20px)
            while (heightLeft > 20) {
                position = - (imgHeight - heightLeft);
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, (imgHeight * pdfWidth) / imgWidth, undefined, 'FAST');
                heightLeft -= pageHeightInCanvas;
            }
            
            pdf.save(`Quotation_${quoteNum}.pdf`);
            showToast('Quotation saved to your device', 'success');
        } catch (err) {
            console.error('PDF Generation Error:', err);
            showToast('Failed to generate PDF quotation.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between bg-white/70 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/60 shadow-sm">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.push('/quotations')}
                        className="p-2 hover:bg-slate-100 rounded-xl transition-all"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight">Create Modern Quotation</h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5">Template: Modern Gradient</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    {!isFinalized ? (
                        <>
                            <button 
                                onClick={() => setIsBrandingModalOpen(true)}
                                className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-600 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95 border border-slate-200"
                            >
                                <Settings size={16} />
                                Edit Design
                            </button>
                            <button 
                                onClick={() => handleSave(false)}
                                disabled={loading}
                                className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary/10 text-brand-primary rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-brand-primary/20 transition-all active:scale-95"
                            >
                                <Save size={16} />
                                {loading ? 'Saving...' : 'Save Draft'}
                            </button>
                            <button 
                                onClick={() => handleSave(true)}
                                disabled={loading}
                                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-brand-shadow hover:from-indigo-700 hover:to-purple-700 transition-all active:scale-95"
                            >
                                <FileCheck size={16} />
                                {loading ? 'Processing...' : 'Save & Finish'}
                            </button>
                        </>
                    ) : (
                        <button 
                            onClick={downloadPDF}
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95"
                        >
                            <Download size={16} />
                            {loading ? 'Generating...' : 'Download PDF'}
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Form Section */}
                <div className={`bg-white/70 backdrop-blur-xl p-8 rounded-[32px] border border-slate-200/60 shadow-sm space-y-6 ${isFinalized ? 'opacity-80' : ''}`}>
                    <div className="flex justify-between items-center border-b pb-4 mb-4">
                        <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest font-jakarta">Project Proposal Details</h2>
                        {isFinalized && (
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-100 flex items-center gap-1.5">
                                <FileCheck size={12} /> Finalized
                            </span>
                        )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1 relative">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                {docBranding.labels.billTo}
                            </label>
                            <input 
                                disabled={isFinalized}
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 outline-none text-sm font-bold disabled:bg-slate-50 disabled:text-slate-400 transition-all font-jakarta"
                                value={clientInfo.name}
                                onChange={(e) => {
                                    setClientInfo({...clientInfo, name: e.target.value});
                                    setClientSearch(e.target.value);
                                    setShowSuggestions(true);
                                }}
                                onFocus={() => setShowSuggestions(true)}
                                placeholder="Start typing name..."
                            />
                            {showSuggestions && clientSuggestions.length > 0 && (
                                <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                                    {clientSuggestions.map((client) => (
                                        <button
                                            key={client._id}
                                            type="button"
                                            onClick={() => handleClientSelect(client)}
                                            className="w-full px-5 py-3 text-left hover:bg-slate-50 flex flex-col transition-colors border-b last:border-0"
                                        >
                                            <span className="text-sm font-bold text-slate-900">{client.name}</span>
                                            <span className="text-[10px] font-medium text-slate-500">{client.phone}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Client Phone</label>
                            <input 
                                disabled={isFinalized}
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 outline-none text-sm font-bold disabled:bg-slate-50 transition-all font-jakarta"
                                value={clientInfo.phone}
                                onChange={(e) => setClientInfo({...clientInfo, phone: e.target.value})}
                                placeholder="+91 12345 67890"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Client Email</label>
                        <input 
                            disabled={isFinalized}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 outline-none text-sm font-bold disabled:bg-slate-50 transition-all font-jakarta"
                            value={clientInfo.email}
                            onChange={(e) => setClientInfo({...clientInfo, email: e.target.value})}
                            placeholder="client@example.com"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Project Requirements / Location</label>
                        <textarea 
                            disabled={isFinalized}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 outline-none text-sm font-bold resize-none h-24 disabled:bg-slate-50 transition-all"
                            value={clientInfo.address}
                            onChange={(e) => setClientInfo({...clientInfo, address: e.target.value})}
                            placeholder="Makelar Inc, 270 5th Avenue..."
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tax Percentage (%)</label>
                        <input 
                            disabled={isFinalized}
                            type="number"
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/10 outline-none text-sm font-bold disabled:bg-slate-50 transition-all font-jakarta"
                            value={taxRate || 0}
                            onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                            placeholder="e.g. 18"
                        />
                    </div>

                    {/* Items Section */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                        <div className="flex justify-between items-center">
                            <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Services & Scope</h3>
                            {!isFinalized && (
                                <button 
                                    onClick={handleAddItem}
                                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                >
                                    <Plus size={16} />
                                </button>
                            )}
                        </div>

                        <div className="space-y-3">
                            {items.map((item, idx) => (
                                <div key={idx} className={`flex gap-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 items-center transition-all ${isFinalized ? 'border-transparent' : ''}`}>
                                    <div className="flex-1 space-y-1">
                                        <input 
                                            disabled={isFinalized}
                                            className="w-full bg-transparent text-sm font-bold outline-none disabled:text-slate-500"
                                            placeholder="Service Description"
                                            value={item.description}
                                            onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                                        />
                                        <div className="flex gap-4">
                                            <input 
                                                disabled={isFinalized}
                                                type="number"
                                                className="w-20 bg-transparent text-xs font-bold text-slate-400 outline-none disabled:opacity-50"
                                                placeholder="Qty"
                                                value={item.quantity || 0}
                                                onChange={(e) => handleItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                                            />
                                            <input 
                                                disabled={isFinalized}
                                                type="number"
                                                className="w-24 bg-transparent text-xs font-bold text-slate-400 outline-none disabled:opacity-50"
                                                placeholder="Unit Price"
                                                value={item.price || 0}
                                                onChange={(e) => handleItemChange(idx, 'price', parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                    </div>
                                    {!isFinalized && (
                                        <button 
                                            onClick={() => handleRemoveItem(idx)}
                                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Preview Section - Design 2 (Modern Gradient) */}
                <div 
                    className="sticky top-8 bg-white shadow-2xl overflow-hidden rounded-sm shrink-0 mx-auto lg:mx-0" 
                    ref={quoteRef}
                    style={{ 
                        backgroundColor: '#ffffff',
                        width: '550px',
                        minHeight: '778px'
                    }}
                >
                    {/* Modern Header Gradient */}
                    <div 
                        className="h-[220px] p-10 text-white relative"
                        style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #f43f5e 100%)', color: '#ffffff' }}
                    >
                        <div className="flex justify-between items-start h-full">
                            <div className="space-y-8 flex-1">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white rounded-xl overflow-hidden p-1 shadow-lg w-12 h-12">
                                        {docBranding.logo ? (
                                            <img src={docBranding.logo} alt="Logo" className="w-full h-full object-contain" />
                                        ) : (
                                            <div className="w-full h-full bg-white flex items-center justify-center font-black text-2xl" style={{ color: '#4f46e5' }}>
                                                {docBranding.companyName?.charAt(0) || 'S'}
                                            </div>
                                        )}
                                    </div>
                                    <h2 className="text-lg font-black tracking-tight uppercase font-jakarta text-white">
                                        {docBranding.companyName}
                                    </h2>
                                </div>
                                <div className="space-y-1">
                                    <h1 className="text-3xl font-black tracking-tighter font-jakarta text-white opacity-90">
                                        {docBranding.labels.quotationHeading}
                                    </h1>
                                    <p className="text-xs font-black tracking-widest uppercase" style={{ color: '#ffffff', opacity: 0.6 }}># {quoteNum}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[12px] font-black text-white/60">
                                        {docBranding.companyName}
                                    </span>
                                    <span className="text-white/40 text-xs">•</span>
                                    <span className="text-[12px] font-black" style={{ color: '#ffffff', opacity: 0.6 }}>
                                        {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="text-right space-y-3 flex-1">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#ffffff', opacity: 0.6 }}>Date Information</p>
                                    <p className="text-xs font-bold" style={{ color: '#ffffff' }}>{new Date().toLocaleDateString('en-GB')}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/60">
                                        {docBranding.labels.billTo}
                                    </p>
                                    <p className="text-xs font-black" style={{ color: '#ffffff' }}>{clientInfo.name || 'CLIENT NAME'}</p>
                                    <p className="text-[10px] font-medium whitespace-pre-line max-w-[200px] ml-auto uppercase tracking-tighter leading-tight" style={{ color: '#ffffff', opacity: 0.8 }}>{clientInfo.address || 'CLIENT ADDRESS'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#ffffff', opacity: 0.6 }}>Total Due:</p>
                                    <p className="text-lg font-black tracking-tight" style={{ color: '#ffffff' }}>₹ {finalTotal?.toLocaleString()}.00</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="relative -mt-16 mx-12 bg-white rounded-3xl p-6 shadow-xl" style={{ backgroundColor: '#ffffff' }}>
                        <table className="w-full text-left">
                            <thead style={{ backgroundColor: '#f1f5f9' }}>
                                <tr className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#64748b' }}>
                                    <th className="py-5 px-6 rounded-l-2xl">NO.</th>
                                    <th className="py-5">Item Description</th>
                                    <th className="py-5 text-center">Price</th>
                                    <th className="py-5 text-center">Qty.</th>
                                    <th className="py-5 text-right px-6 rounded-r-2xl">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y" style={{ borderColor: '#f1f5f9' }}>
                                {items.map((item, idx) => (
                                    <tr key={idx} className="font-bold group">
                                        <td className="py-4 px-6 text-xs" style={{ color: '#cbd5e1' }}>0{idx + 1}.</td>
                                        <td className="py-4">
                                            <p className="text-xs mb-0.5" style={{ color: '#1e293b' }}>{item.description || 'Service Name'}</p>
                                            <p className="text-[9px] font-medium italic" style={{ color: '#94a3b8' }}>Project Scope Detail</p>
                                        </td>
                                        <td className="py-4 text-xs text-center font-medium" style={{ color: '#475569' }}>₹{item.price?.toLocaleString()}</td>
                                        <td className="py-4 text-xs text-center" style={{ color: '#475569' }}>{item.quantity}</td>
                                        <td className="py-4 text-sm text-right px-6 font-black" style={{ color: '#1e293b' }}>₹{item.total?.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="mt-8 flex justify-between items-end border-t pt-6" style={{ borderTopColor: '#f8fafc' }}>
                            <div className="space-y-4">
                                {company?.bankDetails?.accountNumber && (
                                    <div>
                                        <p className="text-[11px] font-black mb-2 uppercase tracking-widest text-slate-900">
                                            {docBranding.labels.bankInfoLabel}
                                        </p>
                                        <p className="text-[10px] font-bold" style={{ color: '#64748b' }}>Bank: {company.bankDetails.bankName}</p>
                                        <p className="text-[10px] font-bold" style={{ color: '#64748b' }}>A/C: {company.bankDetails.accountNumber}</p>
                                        <p className="text-[10px] font-bold italic opacity-60" style={{ color: '#64748b' }}>IFSC: {company.bankDetails.ifsc}</p>
                                    </div>
                                )}
                                <div className="max-w-[200px]">
                                    <p className="text-[11px] font-black mb-2 uppercase tracking-widest text-slate-900">
                                        {docBranding.labels.termsLabel}
                                    </p>
                                    <p className="text-[9px] font-medium leading-relaxed" style={{ color: '#94a3b8' }}>
                                        Valid for 15 days from the date of issue. Technical scope as discussed.
                                    </p>
                                </div>
                            </div>

                            <div className="w-64 space-y-4">
                                <div className="flex justify-between items-center text-[10px] font-bold tracking-widest uppercase" style={{ color: '#94a3b8' }}>
                                    <span>Sub total :</span>
                                    <span style={{ color: '#1e293b' }}>₹ {subtotal?.toLocaleString()}.00</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-bold tracking-widest uppercase" style={{ color: '#94a3b8' }}>
                                    <span>Tax ({taxRate}%) :</span>
                                    <span style={{ color: '#1e293b' }}>₹ {taxAmount?.toLocaleString()}.00</span>
                                </div>
                                <div 
                                    className="p-4 rounded-2xl flex justify-between items-center text-white"
                                    style={{ background: 'linear-gradient(to right, #f43f5e, #6366f1)', color: '#ffffff' }}
                                >
                                    <span className="text-[10px] font-black uppercase tracking-widest">Total :</span>
                                    <span className="text-xl font-black">₹ {finalTotal?.toLocaleString()}</span>
                                </div>
                                <div className="text-right flex flex-col items-end relative pt-4">
                                    {/* Official Stamp */}
                                    {docBranding.stamp && (
                                        <div className="absolute -top-12 -left-8 w-24 h-24 opacity-80 pointer-events-none transform -rotate-12">
                                            <img src={docBranding.stamp} alt="Stamp" className="w-full h-full object-contain mix-blend-multiply" />
                                        </div>
                                    )}

                                    <div className="w-32 text-center relative z-10">
                                        <p className="text-[8px] font-bold mb-2 uppercase tracking-widest text-black/60">ACCOUNT MANAGER</p>
                                        
                                        <div className="relative h-12 flex items-center justify-center mb-1">
                                            {docBranding.signature ? (
                                                <img src={docBranding.signature} alt="Sign" className="max-h-full max-w-full object-contain" />
                                            ) : (
                                                <p className="text-[22px] font-signature leading-none opacity-20 select-none" style={{ color: '#1e293b' }}>
                                                    Sign here
                                                </p>
                                            )}
                                        </div>

                                        <div className="h-[1px] w-full mb-1" style={{ backgroundColor: '#e2e8f0' }} />
                                        <p className="text-[6px] font-bold uppercase tracking-[0.4em]" style={{ color: '#94a3b8' }}>
                                            Authorized Signatory
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Modern Footer Strip */}
                    <div className="mt-12 p-10 flex justify-between items-center bg-slate-50 border-t border-slate-100 rounded-b-3xl">
                        <div className="space-y-1.5">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Connect with us</p>
                            <div className="flex gap-4 text-[9px] font-bold text-slate-700">
                                <span>{docBranding.companyPhone}</span>
                                <span className="opacity-20">|</span>
                                <span>{docBranding.companyEmail}</span>
                            </div>
                        </div>
                        <div className="text-right space-y-1.5">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Official Website</p>
                            <p className="text-[10px] font-black text-indigo-600 tracking-widest">
                                {docBranding.website || 'WWW.WORKSENSY.APP'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <BrandingModal 
                isOpen={isBrandingModalOpen}
                onClose={() => setIsBrandingModalOpen(false)}
                branding={docBranding}
                onSave={updateBranding}
                type="quotation"
            />
        </div>
    );
};

export default QuotationCreator;
