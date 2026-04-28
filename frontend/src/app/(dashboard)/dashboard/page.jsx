import React from 'react';
import { cookies } from 'next/headers';
import AdminDashboard from '@/views/AdminDashboard';
import SalesDashboard from '@/views/SalesDashboard';
import ProjectDashboard from '@/views/ProjectDashboard';
import UserDashboard from '@/views/UserDashboard';
import { FileText } from 'lucide-react';
import { fetchServer } from '@/utils/fetchServer';

export default async function DashboardPage() {
  const data = await fetchServer('/auth/getMe');
  const user = data?.data?.user;

  if (!user) return null;

  if (user.role === 'super-admin') {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-slate-900">Super Admin Panel</h1>
        <p className="text-slate-500 mt-2">Company Management features will appear here.</p>
      </div>
    );
  }

  if (user.role === 'admin') {
    return <AdminDashboard />;
  }

  if (user.role === 'sales-manager') {
    const statsData = await fetchServer(`/sales/dashboard?year=${new Date().getFullYear()}`);
    return <SalesDashboard mode="dashboard" initialStats={statsData?.data} />;
  }

  if (user.role === 'project-manager' || user.role === 'project-team') {
    return <ProjectDashboard />;
  }

  if (user.role === 'accounts-manager' || user.role === 'accounts-team') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md animate-in fade-in zoom-in duration-700">
          <div className="w-20 h-20 bg-brand-primary/10 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
             <FileText size={40} className="text-brand-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight uppercase">Accounts Portal</h1>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">
              Your account is restricted to financial operations. Please use the sidebar to manage 
              <span className="text-brand-primary font-bold"> Invoices</span> and 
              <span className="text-brand-primary font-bold"> Quotations</span>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <UserDashboard />;
}
