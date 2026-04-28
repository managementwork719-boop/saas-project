'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import API from '../api/axios';
import { Eye, EyeOff, ShieldCheck, Mail, Lock, CheckCircle2, ArrowRight } from 'lucide-react';

const SetupPassword = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [tempPassword, setTempPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const emailParam = searchParams.get('email');
        if (emailParam) setEmail(emailParam);
    }, [searchParams]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (newPassword !== confirmPassword) {
            setError("Passwords don't match");
            return;
        }

        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setLoading(true);
        try {
            await API.post('/auth/setup-password', {
                email,
                temporaryPassword: tempPassword,
                newPassword
            });
            setSuccess(true);
            setTimeout(() => router.push('/login'), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to setup password. Check your temporary credentials.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-slate-200 border border-slate-100 p-12 text-center animate-in zoom-in duration-500">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                        <CheckCircle2 size={40} />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-4">Identity Secure!</h2>
                    <p className="text-slate-500 font-medium leading-relaxed">
                        Your permanent access key has been established. You will be redirected to the secure login portal shortly.
                    </p>
                    <div className="mt-8 pt-8 border-t border-slate-50">
                        <button 
                            onClick={() => router.push('/login')}
                            className="text-brand-primary font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 mx-auto hover:gap-3 transition-all"
                        >
                            Go to Login <ArrowRight size={14} />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-inter selection:bg-brand-primary selection:text-white">
            <div className="w-full max-w-lg flex flex-col items-center">
                {/* Logo Area */}
                <div className="mb-12 flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center shadow-lg shadow-brand-shadow">
                        <ShieldCheck className="text-white" size={24} />
                    </div>
                    <span className="text-2xl font-black text-slate-900 tracking-tight">Work Management</span>
                </div>

                <div className="w-full bg-white rounded-3xl shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden">
                    <div className="p-8 sm:p-12">
                        <div className="mb-10 text-center lg:text-left">
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Initialize Access</h1>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Secure Link Auth Protocol</p>
                        </div>

                        {error && (
                            <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-bold rounded-r-lg animate-in slide-in-from-left-2 duration-300">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Step 1: Identity */}
                            <div className="space-y-4 pb-6 border-b border-slate-100">
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Registered Mail</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input 
                                            type="email" required value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-brand-shadow focus:border-brand-primary outline-none transition-all text-sm font-semibold text-slate-900"
                                            placeholder="your@company.com"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Temporary Key (Check Email)</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input 
                                            type="text" required value={tempPassword}
                                            onChange={(e) => setTempPassword(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-brand-shadow focus:border-brand-primary outline-none transition-all text-sm font-mono text-slate-900"
                                            placeholder="Enter temp code"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Step 2: New Secure Password */}
                            <div className="space-y-4 pt-2">
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Define Permanent Access Key</label>
                                    <div className="relative">
                                        <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input 
                                            type={showPass ? 'text' : 'password'} required value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full pl-12 pr-12 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-brand-shadow focus:border-brand-primary outline-none transition-all text-sm font-semibold text-slate-900"
                                            placeholder="Min. 6 characters"
                                        />
                                        <button 
                                            type="button" onClick={() => setShowPass(!showPass)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                        >
                                            {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Confirm Permanent Key</label>
                                    <div className="relative">
                                        <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input 
                                            type={showPass ? 'text' : 'password'} required value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-brand-shadow focus:border-brand-primary outline-none transition-all text-sm font-semibold text-slate-900"
                                            placeholder="Match keys"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit" disabled={loading}
                                className="w-full py-4 bg-brand-primary text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl hover:bg-brand-hover transition-all duration-300 transform active:scale-[0.98] shadow-xl shadow-brand-shadow flex items-center justify-center gap-3 disabled:opacity-70"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <span>Establish Security Protocol</span>
                                        <ArrowRight size={16} />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    <div className="bg-slate-50/50 p-6 text-center border-t border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            © {new Date().getFullYear()} Enterprise Grade Security Systems
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SetupPassword;
