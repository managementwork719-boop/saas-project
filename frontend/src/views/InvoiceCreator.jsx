'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Download, ChevronLeft, Save, Printer, FileCheck, Settings } from 'lucide-react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import BrandingModal from '../components/BrandingModal';

const InvoiceCreator = () => {
    const router = useRouter();
    const params = useParams();
    const { id } = params;
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const { showToast } = useToast();
    const invoiceRef = useRef();
    const [loading, setLoading] = useState(false);
    const [isFinalized, setIsFinalized] = useState(false);
    const [invoiceNum, setInvoiceNum] = useState('INV-XXX');
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
            invoiceHeading: 'INVOICE',
            billTo: 'INVOICE TO',
            fromLabel: 'FROM OFFICE',
            termsLabel: 'Terms & Condition',
            bankInfoLabel: 'PAYMENT INFORMATION',
            termsText: 'Please ensure payment is made within 15 days.'
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

    // Fetch existing invoice & Company details
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Fetch Company Details
                const compRes = await API.get('/companies/my-company');
                const companyData = compRes.data.data.company;
                setCompany(companyData);

                if (id) {
                    const res = await API.get(`/documents/invoices`);
                    const invoice = res.data.data.invoices.find(inv => inv._id === id);
                    if (invoice) {
                        setClientInfo({
                            name: invoice.clientName,
                            address: invoice.clientAddress,
                            phone: invoice.clientPhone,
                            email: invoice.clientEmail
                        });
                        setItems(invoice.items);
                        setIsFinalized(invoice.isFinalized);
                        setInvoiceNum(invoice.invoiceNumber);
                        setTaxRate(invoice.taxRate || 0);
                        
                        // Load saved branding or fallback to company data
                        // Load saved branding and merge with latest company assets (signature/stamp/logo)
                        // Load saved branding and ensure signatures/stamps are included if missing
                        const savedBranding = invoice.docBranding || {};
                        const companyInv = companyData.invoiceBranding || {};
                        setDocBranding({
                            ...savedBranding,
                            signature: savedBranding.signature || companyInv.signature || '',
                            stamp: savedBranding.stamp || companyInv.stamp || '',
                            logo: savedBranding.logo || companyInv.logo || '',
                            companyName: savedBranding.companyName || companyInv.name || '',
                            companyAddress: savedBranding.companyAddress || companyInv.address || '',
                            companyPhone: savedBranding.companyPhone || companyInv.phone || '',
                            companyEmail: savedBranding.companyEmail || companyInv.email || '',
                            website: savedBranding.website || companyInv.website || '',
                            accountManager: savedBranding.accountManager || user?.name || '',
                            industry: savedBranding.industry || companyInv.industry || '',
                            labels: {
                                ...docBranding.labels,
                                ...companyInv.labels,
                                ...savedBranding.labels
                            }
                        });
                    }
                } else {
                    const companyInv = companyData.invoiceBranding || {};
                    setDocBranding({
                        logo: companyInv.logo || companyData.logo || '',
                        companyName: companyInv.name || companyData.name || '',
                        companyAddress: companyInv.address || companyData.address || '',
                        companyPhone: companyInv.phone || companyData.phone || '',
                        companyEmail: companyInv.email || companyData.businessEmail || '',
                        website: companyInv.website || companyData.website || '',
                        accountManager: user?.name || '',
                        industry: companyInv.industry || companyData.industry || '',
                        signature: companyInv.signature || '',
                        stamp: companyInv.stamp || '',
                        labels: {
                            ...docBranding.labels,
                            ...companyInv.labels
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
            // 1. Update local state for immediate preview feedback
            setDocBranding(newBranding);
            
            // 2. Sync to Global Company Profile (Only if authorized and requested)
            const allowedRoles = ['admin', 'super-admin', 'accounts-manager', 'accounts-team'];
            if (syncGlobally && allowedRoles.includes(user?.role)) {
                const payload = {
                    invoiceBranding: {
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
                showToast('Branding updated globally for Invoices', 'success');
            }

            // 3. If editing an existing document, also save branding to the document itself
            if (id) {
                await API.patch(`/documents/invoices/${id}`, {
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
        if (!clientInfo.name) return showToast('Please enter client name before saving', 'warning');
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
                await API.patch(`/documents/invoices/${id}`, payload);
            } else {
                await API.post('/documents/invoices', payload);
            }
            
            if (finalize) {
                showToast('Invoice finalized successfully. Download starting...', 'success');
                setIsFinalized(true);
                // Trigger PDF download after a brief delay to allow state update
                setTimeout(() => downloadPDF(), 500);
            } else {
                showToast('Draft version saved successfully', 'success');
                router.push('/invoices');
            }
        } catch (err) {
            console.error(err);
            showToast(err.response?.data?.message || 'Failed to save document. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const downloadPDF = async () => {
        try {
            setLoading(true);
            
            // 1. Ensure page is scrolled to top to avoid offset clipping
            window.scrollTo(0, 0);
            
            const element = invoiceRef.current;
            if (!element) {
                showToast('Preview area not ready for download', 'error');
                return;
            }

            // 2. High-fidelity capture
            const canvas = await html2canvas(element, {
                scale: 3.0, // Extra high definition
                useCORS: true,
                logging: false,
                backgroundColor: "#ffffff",
                windowWidth: element.scrollWidth,
                windowHeight: element.scrollHeight,
                onclone: (clonedDoc) => {
                    const allElements = clonedDoc.getElementsByTagName("*");
                    for (let i = 0; i < allElements.length; i++) {
                        const el = allElements[i];
                        const style = window.getComputedStyle(el);
                        ['color', 'backgroundColor', 'borderColor', 'outlineColor', 'fill', 'stroke'].forEach(prop => {
                            const val = style[prop];
                            if (val && (val.includes('oklch') || val.includes('oklab') || val.includes('color-mix'))) {
                                if (prop === 'backgroundColor') {
                                    el.style[prop] = '#ffffff';
                                } else {
                                    el.style[prop] = '#1e293b';
                                }
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
            
            pdf.save(`Invoice_${invoiceNum}.pdf`);
            showToast('Document saved to your device', 'success');
        } catch (err) {
            console.error('PDF Generation Error:', err);
            showToast('Failed to generate PDF. Try a different browser.', 'error');
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
                        onClick={() => router.push('/invoices')}
                        className="p-2 hover:bg-slate-100 rounded-xl transition-all"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight">Generate Professional Invoice</h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5">Template: Classic B&W</p>
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
                                className="flex items-center gap-2 px-6 py-2.5 bg-brand-primary text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-brand-shadow hover:bg-brand-hover transition-all active:scale-95"
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
                        <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest font-jakarta">Invoice Details</h2>
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
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary/10 outline-none text-sm font-bold disabled:bg-slate-50 disabled:text-slate-400 transition-all font-jakarta"
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
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary/10 outline-none text-sm font-bold disabled:bg-slate-50 transition-all font-jakarta"
                                value={clientInfo.phone}
                                onChange={(e) => setClientInfo({...clientInfo, phone: e.target.value})}
                                placeholder="91-0000000000"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Client Address</label>
                        <textarea 
                            disabled={isFinalized}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary/10 outline-none text-sm font-bold resize-none h-20 disabled:bg-slate-50 transition-all font-jakarta"
                            value={clientInfo.address}
                            onChange={(e) => setClientInfo({...clientInfo, address: e.target.value})}
                            placeholder="1550 Silky Blue Road..."
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tax Percentage (%)</label>
                        <input 
                            disabled={isFinalized}
                            type="number"
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-primary/10 outline-none text-sm font-bold disabled:bg-slate-50 transition-all font-jakarta"
                            value={taxRate || 0}
                            onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                            placeholder="e.g. 18"
                        />
                    </div>

                    {/* Items Section */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                        <div className="flex justify-between items-center">
                            <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Billable Items</h3>
                            {!isFinalized && (
                                <button 
                                    onClick={handleAddItem}
                                    className="p-2 text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-all"
                                >
                                    <Plus size={16} />
                                </button>
                            )}
                        </div>

                        <div className="space-y-2">
                            {items.map((item, idx) => (
                                <div key={idx} className={`flex gap-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 relative group transition-all ${isFinalized ? 'border-transparent' : ''}`}>
                                    <div className="flex-1 space-y-1">
                                        <input 
                                            disabled={isFinalized}
                                            className="w-full bg-transparent text-sm font-bold outline-none disabled:text-slate-500"
                                            placeholder="Item Description"
                                            value={item.description}
                                            onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                                        />
                                        <div className="flex gap-4">
                                            <div className="flex-1">
                                                <input 
                                                    disabled={isFinalized}
                                                    type="number"
                                                    className="w-full bg-transparent text-xs font-medium text-slate-400 outline-none disabled:opacity-50"
                                                    placeholder="Qty"
                                                    value={item.quantity || 0}
                                                    onChange={(e) => handleItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <input 
                                                    disabled={isFinalized}
                                                    type="number"
                                                    className="w-full bg-transparent text-xs font-medium text-slate-400 outline-none disabled:opacity-50"
                                                    placeholder="Price"
                                                    value={item.price || 0}
                                                    onChange={(e) => handleItemChange(idx, 'price', parseFloat(e.target.value) || 0)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    {!isFinalized && (
                                        <button 
                                            onClick={() => handleRemoveItem(idx)}
                                            className="opacity-0 group-hover:opacity-100 p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Preview Section - Design 1 (Professional B&W) */}
                <div 
                    className="sticky top-8 bg-white p-10 shadow-2xl rounded-sm border shrink-0 mx-auto lg:mx-0" 
                    ref={invoiceRef}
                    style={{ 
                        backgroundColor: '#ffffff', 
                        borderColor: '#f1f5f9',
                        width: '550px',
                        minHeight: '778px'
                    }}
                >
                    {/* Header Bar */}
                    <div className="flex justify-between items-start mb-5">
                        <div className="flex items-center gap-3">
                            <div className="relative group/logo">
                                {docBranding.logo ? (
                                    <img src={docBranding.logo} alt="Logo" className="w-12 h-12 object-contain" />
                                ) : (
                                    <div className="w-12 h-12 bg-black text-white flex items-center justify-center font-bold text-base" style={{ backgroundColor: '#000000', color: '#ffffff' }}>
                                        {docBranding.companyName?.charAt(0) || 'W'}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <h1 className="text-base font-bold tracking-tight text-black font-jakarta">
                                    {docBranding.companyName}
                                </h1>
                                <p className="text-[6px] font-bold uppercase tracking-[0.3em] text-slate-400">
                                    {docBranding.industry}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h2 className="text-base font-bold tracking-tighter text-black uppercase mb-1 font-jakarta">
                                {docBranding.labels.invoiceHeading}
                            </h2>
                            <p className="text-[7px] font-bold tracking-widest uppercase" style={{ color: '#94a3b8' }}>DATE: {new Date().toLocaleDateString('en-GB')}</p>
                        </div>
                    </div>

                    {/* Ship To Blocks */}
                    <div className="grid grid-cols-2 gap-6 mb-4 px-4 py-4 rounded-2xl border" style={{ backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' }}>
                        <div className="space-y-1">
                            <p className="text-[8px] font-bold uppercase tracking-widest text-black">
                                {docBranding.labels.billTo}
                            </p>
                            <h3 className="text-[10px] font-bold mb-1 uppercase tracking-tight" style={{ color: '#000000' }}>{clientInfo.name || 'CLIENT NAME'}</h3>
                            <p className="text-[8px] leading-relaxed font-medium whitespace-pre-line" style={{ color: '#64748b' }}>{clientInfo.address || 'CLIENT ADDRESS'}</p>
                            <p className="text-[8px] mt-2 font-bold tracking-widest" style={{ color: '#000000' }}>{clientInfo.phone || 'PHONE NUMBER'}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[8px] font-bold uppercase tracking-widest text-black">
                                {docBranding.labels.fromLabel}
                            </p>
                            <h3 className="text-[10px] font-bold mb-1 uppercase tracking-tight text-black">
                                {docBranding.companyName}
                            </h3>
                            <p className="text-[8px] leading-relaxed font-medium whitespace-pre-line text-slate-500">
                                {docBranding.companyAddress}
                            </p>
                            <p className="text-[8px] mt-2 font-bold tracking-widest text-black">
                                {docBranding.companyPhone}
                            </p>
                        </div>
                    </div>

                    {/* Invoice Meta */}
                    <div className="flex justify-between items-center mb-4 px-4">
                        <p className="text-[7px] font-bold uppercase tracking-widest" style={{ color: '#000000' }}>DATE: {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        <p className="text-[7px] font-bold uppercase tracking-widest" style={{ color: '#000000' }}>INV NO: {invoiceNum}</p>
                    </div>

                    {/* Table */}
                    <table className="w-full text-left border-y mb-6" style={{ borderTopColor: '#000000', borderBottomColor: '#000000', borderTopWidth: '2px', borderBottomWidth: '2px' }}>
                        <thead>
                            <tr className="border-b text-[8px] font-bold uppercase tracking-widest" style={{ borderBottomColor: '#f1f5f9', color: '#94a3b8' }}>
                                <th className="py-2 px-4 w-12 text-center" style={{ color: '#000000' }}>NO</th>
                                <th className="py-2" style={{ color: '#000000' }}>ITEM DESCRIPTION</th>
                                <th className="py-2 text-center" style={{ color: '#000000' }}>PRICE</th>
                                <th className="py-2 text-center" style={{ color: '#000000' }}>QUANTITY</th>
                                <th className="py-2 text-right px-4" style={{ color: '#000000' }}>TOTAL</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, idx) => (
                                <tr key={idx} className="border-b" style={{ borderBottomColor: '#f8fafc' }}>
                                    <td className="py-2.5 px-4 text-[7px] text-center font-bold" style={{ color: '#cbd5e1' }}>{idx + 1}.</td>
                                    <td className="py-2.5 text-[9px] font-bold uppercase" style={{ color: '#000000' }}>{item.description || 'Sample Item Desc'}</td>
                                    <td className="py-2.5 text-[8px] text-center font-bold" style={{ color: '#64748b' }}>₹{item.price?.toLocaleString()}</td>
                                    <td className="py-2.5 text-[8px] text-center font-bold" style={{ color: '#64748b' }}>{item.quantity}</td>
                                    <td className="py-2.5 text-[9px] text-right px-4 font-bold" style={{ color: '#000000' }}>₹{item.total?.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Totals */}
                    <div className="flex justify-between items-start px-4">
                        <div className="max-w-[200px]">
                            {company?.bankDetails?.accountNumber && (
                                <div className="mb-6">
                                    <p className="text-[10px] font-black mb-2 uppercase tracking-widest text-black">
                                        {docBranding.labels.bankInfoLabel}
                                    </p>
                                    <div className="space-y-1">
                                        <p className="text-[8px] font-bold" style={{ color: '#64748b' }}>A/C: <span className="text-black" style={{ color: '#000000' }}>{company.bankDetails.accountNumber}</span></p>
                                        <p className="text-[8px] font-bold" style={{ color: '#64748b' }}>BANK: <span className="text-black" style={{ color: '#000000' }}>{company.bankDetails.bankName}</span></p>
                                        <p className="text-[8px] font-bold" style={{ color: '#64748b' }}>IFSC: <span className="text-black" style={{ color: '#000000' }}>{company.bankDetails.ifsc}</span></p>
                                    </div>
                                </div>
                            )}
                            <p className="text-[10px] font-bold mb-2 uppercase" style={{ color: '#000000' }}>TOTAL DUE</p>
                            <p className="text-lg font-bold tracking-tighter" style={{ color: '#000000' }}>₹{finalTotal?.toLocaleString()}.00</p>
                        </div>
                        <div className="w-64 space-y-3">
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest" style={{ color: '#94a3b8' }}>
                                <span>SUBTOTAL:</span>
                                <span style={{ color: '#000000' }}>₹{subtotal?.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest" style={{ color: '#94a3b8' }}>
                                <span>TAX ({taxRate}%):</span>
                                <span style={{ color: '#000000' }}>₹{taxAmount?.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest border-t pt-3" style={{ borderTopColor: '#000000', borderTopWidth: '2px', color: '#000000' }}>
                                <span>GRAND TOTAL:</span>
                                <span>₹{finalTotal?.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer Info */}
                    <div className="grid grid-cols-2 gap-12 mt-12 px-4">
                        <div className="space-y-4">
                            <div>
                                <p className="text-[9px] font-black mb-1 uppercase tracking-widest text-black">
                                    {docBranding.labels.termsLabel}
                                </p>
                                <p className="text-[8px] font-bold leading-relaxed italic" style={{ color: '#94a3b8' }}>
                                    {docBranding.labels.termsText || 'Please ensure payment is made within 15 days. Late payments may be subject to interest charges.'}
                                </p>
                            </div>
                        </div>
                        <div className="text-right flex flex-col items-end relative">
                            {/* Official Stamp */}
                            {docBranding.stamp && (
                                <div className="absolute -top-16 -left-12 w-24 h-24 opacity-80 pointer-events-none transform -rotate-12">
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

                    {/* Bottom Contact Strip */}
                    <div className="mt-8 border-t border-slate-100 flex justify-between items-center text-[8px] font-bold uppercase tracking-widest">
                        <p className="text-slate-400">
                            Contact us<span className="text-black ml-1">{docBranding.companyEmail}</span> 
                            <span className="mx-2 serapator opacity-20">|</span> 
                            <span className="text-black">{docBranding.companyPhone}</span>
                        </p>
                        <div className="flex gap-4">
                            <span className="text-black tracking-[0.2em]">{docBranding.website || 'WWW.WORKSENSY.APP'}</span>
                        </div>
                    </div>
                </div>
            </div>

            <BrandingModal 
                isOpen={isBrandingModalOpen}
                onClose={() => setIsBrandingModalOpen(false)}
                branding={docBranding}
                onSave={updateBranding}
                type="invoice"
            />
        </div>
    );
};

export default InvoiceCreator;
