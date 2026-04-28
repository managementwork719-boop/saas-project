'use client';
import React, { useState, useEffect } from 'react';
import { X, Camera, Save, Info, Globe, Phone, User as UserIcon, Building, FileText } from 'lucide-react';

const BrandingModal = ({ isOpen, onClose, branding, onSave, type = 'invoice' }) => {
    const [localBranding, setLocalBranding] = useState(branding);
    const [syncGlobally, setSyncGlobally] = useState(true);

    useEffect(() => {
        if (isOpen) {
            setLocalBranding(branding);
        }
    }, [isOpen, branding]);

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLocalBranding(prev => ({ ...prev, logo: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSignatureChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLocalBranding(prev => ({ ...prev, signature: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleStampChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLocalBranding(prev => ({ ...prev, stamp: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const updateLabel = (key, value) => {
        setLocalBranding(prev => ({
            ...prev,
            labels: { ...prev.labels, [key]: value }
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className={`bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 transition-all`}>
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 font-jakarta uppercase tracking-tight">Configure {type} Branding</h2>
                        <p className="text-xs font-bold text-slate-400 mt-0.5">Customize how your {type}s appear to clients</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-slate-900"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                    {/* Logo Section */}
                    <div className="flex items-center gap-6 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                        <div className="relative group overflow-hidden bg-white rounded-2xl w-24 h-24 flex items-center justify-center border border-slate-200 shadow-sm shrink-0">
                            {localBranding.logo ? (
                                <img src={localBranding.logo} alt="Preview" className="w-full h-full object-contain" />
                            ) : (
                                <div className="text-slate-300 font-black text-4xl">
                                    {localBranding.companyName?.charAt(0) || '?'}
                                </div>
                            )}
                            <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center cursor-pointer text-white backdrop-blur-[2px]">
                                <Camera size={20} />
                                <span className="text-[10px] font-black uppercase mt-1">Change</span>
                                <input type="file" hidden onChange={handleLogoChange} accept="image/*" />
                            </label>
                        </div>
                        <div className="space-y-1 flex-1">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Company Logo</h3>
                            <p className="text-[10px] font-bold text-slate-400">Upload a high-quality PNG or SVG for best print results.</p>
                            <button 
                                onClick={() => setLocalBranding(prev => ({ ...prev, logo: '' }))}
                                className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline mt-2"
                            >
                                Remove Logo
                            </button>
                        </div>
                    </div>

                    {/* Identity Section */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1 pre-group">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <Building size={12} className="text-brand-primary" /> Brand Name
                            </label>
                            <input 
                                className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary outline-none text-sm font-bold transition-all"
                                value={localBranding.companyName}
                                onChange={(e) => setLocalBranding({...localBranding, companyName: e.target.value})}
                                placeholder="e.g., WorkSensy Studio"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <Info size={12} className="text-brand-primary" /> Sector / Industry
                            </label>
                            <input 
                                className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary outline-none text-sm font-bold transition-all"
                                value={localBranding.industry}
                                onChange={(e) => setLocalBranding({...localBranding, industry: e.target.value})}
                                placeholder="e.g., Precision Digital Ecosystem"
                            />
                        </div>
                    </div>

                    {/* Address Section */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <FileText size={12} className="text-brand-primary" /> Office Address (From)
                        </label>
                        <textarea 
                            className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary outline-none text-sm font-bold h-24 resize-none transition-all"
                            value={localBranding.companyAddress}
                            onChange={(e) => setLocalBranding({...localBranding, companyAddress: e.target.value})}
                            placeholder="Full business address..."
                        />
                    </div>

                    {/* Terms Section */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <FileText size={12} className="text-brand-primary" /> Terms & Conditions
                        </label>
                        <textarea 
                            className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary outline-none text-sm font-bold h-24 resize-none transition-all italic text-slate-500"
                            value={localBranding.labels.termsText || 'Please ensure payment is made within 15 days.'}
                            onChange={(e) => updateLabel('termsText', e.target.value)}
                            placeholder="Standard legality or payment terms..."
                        />
                    </div>

                    {/* Validation Assets Section */}
                    <div className="space-y-4 pt-6 border-t border-slate-100">
                        <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 mb-4">
                            Authorized Validation Assets
                        </h3>
                        <div className="grid grid-cols-2 gap-6">
                            {/* Signature Uploader */}
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-3 ml-1">Official Signature</label>
                                <div className="relative group overflow-hidden bg-white rounded-xl h-24 flex items-center justify-center border border-slate-200 shadow-sm">
                                    {localBranding.signature ? (
                                        <img src={localBranding.signature} alt="Sign" className="w-full h-full object-contain p-2" />
                                    ) : (
                                        <div className="text-slate-300 font-bold text-[8px] uppercase tracking-widest">No Signature</div>
                                    )}
                                    <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center cursor-pointer text-white backdrop-blur-[2px]">
                                        <Camera size={16} />
                                        <span className="text-[8px] font-black uppercase mt-1">Upload Sign</span>
                                        <input type="file" hidden onChange={handleSignatureChange} accept="image/*" />
                                    </label>
                                </div>
                                {localBranding.signature && (
                                    <button 
                                        onClick={() => setLocalBranding(prev => ({ ...prev, signature: '' }))}
                                        className="text-[9px] font-bold text-rose-500 mt-2 hover:underline w-full text-center uppercase tracking-widest"
                                    >
                                        Remove Sign
                                    </button>
                                )}
                            </div>

                            {/* Stamp Uploader */}
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-3 ml-1">Official Stamp / Seal</label>
                                <div className="relative group overflow-hidden bg-white rounded-xl h-24 flex items-center justify-center border border-slate-200 shadow-sm">
                                    {localBranding.stamp ? (
                                        <img src={localBranding.stamp} alt="Stamp" className="w-full h-full object-contain p-2" />
                                    ) : (
                                        <div className="text-slate-300 font-bold text-[8px] uppercase tracking-widest">No Stamp</div>
                                    )}
                                    <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center cursor-pointer text-white backdrop-blur-[2px]">
                                        <Camera size={16} />
                                        <span className="text-[8px] font-black uppercase mt-1">Upload Stamp</span>
                                        <input type="file" hidden onChange={handleStampChange} accept="image/*" />
                                    </label>
                                </div>
                                {localBranding.stamp && (
                                    <button 
                                        onClick={() => setLocalBranding(prev => ({ ...prev, stamp: '' }))}
                                        className="text-[9px] font-bold text-rose-500 mt-2 hover:underline w-full text-center uppercase tracking-widest"
                                    >
                                        Remove Stamp
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Signature & Bottom Info */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <UserIcon size={12} className="text-brand-primary" /> Manager Name
                            </label>
                            <input 
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none text-sm font-bold transition-all"
                                value={localBranding.accountManager}
                                onChange={(e) => setLocalBranding({...localBranding, accountManager: e.target.value})}
                                placeholder="A. K. Sharma"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <Phone size={12} className="text-brand-primary" /> Mobile Number
                            </label>
                            <input 
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none text-sm font-bold transition-all"
                                value={localBranding.companyPhone}
                                onChange={(e) => setLocalBranding({...localBranding, companyPhone: e.target.value})}
                                placeholder="+91 999 000 1111"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <Globe size={12} className="text-brand-primary" /> Website Link
                            </label>
                            <input 
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none text-sm font-bold transition-all"
                                value={localBranding.website}
                                onChange={(e) => setLocalBranding({...localBranding, website: e.target.value})}
                                placeholder="www.worksensy.app"
                            />
                        </div>
                    </div>

                    {/* Terminology Overrides */}
                    <div className="space-y-4 pt-6 border-t border-slate-100">
                        <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 mb-4">
                            Custom Terminology Labels
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Document Header</label>
                                <input 
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none text-xs font-bold"
                                    value={localBranding.labels.invoiceHeading || localBranding.labels.quotationHeading}
                                    onChange={(e) => updateLabel(localBranding.labels.invoiceHeading ? 'invoiceHeading' : 'quotationHeading', e.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Billing Label</label>
                                <input 
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl outline-none text-xs font-bold"
                                    value={localBranding.labels.billTo}
                                    onChange={(e) => updateLabel('billTo', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="px-8 py-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <label className="relative inline-flex items-center cursor-pointer group">
                            <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={syncGlobally}
                                onChange={() => setSyncGlobally(!syncGlobally)}
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                            <span className="ms-3 text-[10px] font-black text-slate-510 uppercase tracking-widest text-slate-500 group-hover:text-slate-900 transition-colors">
                                Update Global Company Profile
                            </span>
                        </label>
                    </div>

                    <div className="flex items-center gap-4">
                        <button 
                            onClick={onClose}
                            className="px-6 py-2.5 text-slate-500 font-black text-[11px] uppercase tracking-widest hover:text-slate-900 transition-all"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={() => {
                                onSave(localBranding, syncGlobally);
                                onClose();
                            }}
                            className="flex items-center gap-2 px-8 py-2.5 bg-brand-primary text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-brand-shadow hover:bg-brand-hover transition-all active:scale-95"
                        >
                            <Save size={16} />
                            Apply & Preview
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BrandingModal;
