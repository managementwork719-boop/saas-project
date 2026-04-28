'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BarChart3, 
  Users, 
  Briefcase, 
  LogOut, 
  LayoutDashboard, 
  Settings,
  ShieldAlert,
  TrendingUp,
  UserCheck,
  UserPlus,
  ArrowLeft,
  Search,
  ChevronLeft,
  ChevronRight,
  Menu,
  CreditCard,
  FileText,
  FileSignature,
  History
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['super-admin', 'admin', 'sales-manager', 'sales-team', 'accounts-manager', 'accounts-team', 'project-manager', 'project-team'] },
    { name: 'Leads', icon: TrendingUp, path: '/leads', roles: ['super-admin', 'admin', 'sales-manager', 'sales-team'] },
    { name: 'Projects', icon: Briefcase, path: '/projects', roles: ['super-admin', 'admin', 'project-manager', 'project-team'] },
    { name: 'Activity Log', icon: History, path: '/activity-logs', roles: ['super-admin', 'admin', 'sales-manager', 'sales-team', 'accounts-manager', 'accounts-team', 'project-manager', 'project-team'] },
    { name: 'Team', icon: Users, path: '/team', roles: ['super-admin', 'admin', 'sales-manager', 'project-manager'] },
    { name: 'Clients', icon: UserCheck, path: '/clients', roles: ['super-admin', 'admin', 'sales-manager', 'sales-team', 'project-manager'] },
    { name: 'Invoices', icon: FileText, path: '/invoices', roles: ['super-admin', 'admin', 'accounts-manager', 'accounts-team'] },
    { name: 'Quotations', icon: FileSignature, path: '/quotations', roles: ['super-admin', 'admin', 'accounts-manager', 'accounts-team'] },
    { name: 'Billing', icon: CreditCard, path: '/billing', roles: ['super-admin', 'admin', 'project-manager'] },
    { name: 'Companies', icon: ShieldAlert, path: '/companies', roles: ['super-admin'] },
    { name: 'Settings', icon: Settings, path: '/settings', roles: ['super-admin', 'admin', 'sales-manager', 'sales-team', 'accounts-manager', 'accounts-team', 'project-manager', 'project-team'] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(user?.role));

  return (
    <div className={`${isCollapsed ? 'w-20' : 'w-64'} bg-white/70 backdrop-blur-xl h-screen flex flex-col text-slate-600 fixed left-0 top-0 border-r border-slate-200/60 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-40 transition-all duration-300`}>
      {/* Brand */}
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-violet-600 rounded-xl flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-lg shadow-violet-200">
            W
          </div>
          {!isCollapsed && <span className="text-lg font-bold tracking-tight text-slate-900 animate-in fade-in duration-300">WorkSensy</span>}
        </div>
        
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all active:scale-95"
          title={isCollapsed ? "Expand" : "Collapse"}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {!isCollapsed && (
        <div className="px-6 mt-4">
          {!user?.companyId && user?.role === 'super-admin' && (
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
              System Admin
            </p>
          )}
          {user?.companyId && (
            <p className="text-[10px] text-violet-600 uppercase tracking-wider font-bold truncate bg-violet-50 px-2 py-1 rounded-md border border-violet-100 inline-block max-w-full">
              {user.companyId.name}
            </p>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1.5 mt-4 overflow-y-auto custom-scrollbar">
        {filteredMenu.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-4'} py-3 rounded-2xl transition-all duration-300 group ${
                  isActive 
                  ? 'bg-violet-100 text-violet-700 font-bold' 
                  : 'text-slate-500 hover:bg-violet-50/50 hover:text-violet-600 font-medium'
                }`}
                title={isCollapsed ? item.name : ''}
              >
                <item.icon size={19} className={`transition-transform duration-300 shrink-0 ${isCollapsed ? '' : 'group-hover:scale-110'}`} />
                {!isCollapsed && <span className="text-[13px] font-bold tracking-tight truncate animate-in slide-in-from-left-2 duration-300">{item.name}</span>}
              </Link>
            );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className={`p-6 border-t border-slate-100 bg-slate-50/30 ${isCollapsed ? 'flex flex-col items-center gap-4' : ''}`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 mb-5 px-1'}`}>
          <div className="relative">
            {user?.profilePic ? (
              <img 
                src={user?.profilePic} 
                alt="profile" 
                className="w-10 h-10 rounded-2xl border-2 border-white shadow-sm object-cover transition-all duration-500 shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-slate-200 flex items-center justify-center shrink-0">
                <Users size={20} className="text-slate-400" />
              </div>
            )}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden animate-in fade-in duration-300">
              <p className="text-sm font-bold text-slate-800 truncate leading-tight uppercase tracking-tight">{user?.name}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{user?.role === 'user' ? 'Member' : user?.role?.replace('-', ' ')}</p>
            </div>
          )}
        </div>
        <button
          onClick={logout}
          className={`flex items-center justify-center gap-2.5 ${isCollapsed ? 'w-12 h-12 rounded-2xl' : 'w-full px-5 py-3 rounded-2xl'} bg-violet-600 text-white shadow-lg shadow-violet-100 hover:bg-violet-700 hover:shadow-violet-200 transition-all duration-300 text-[11px] font-bold uppercase tracking-widest active:scale-95`}
          title="Logout System"
        >
          <LogOut size={16} />
          {!isCollapsed && <span>Logout System</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
