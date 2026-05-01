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
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileText,
  FileSignature,
  History,
  FolderOpen,
  Sliders,
  CheckSquare,
  LayoutTemplate,
  Clock,
  CheckCircle2,
  BarChart2,
  FileStack,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const isPM = user?.role === 'project-manager' || user?.role === 'project-team';

  // --- Project Manager Categorized Menu ---
  const pmMenu = [
    {
      title: 'OVERVIEW',
      items: [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
        { name: 'My Projects', icon: FolderOpen, path: '/projects' },
      ]
    },
    {
      title: 'WORK',
      items: [
        { name: 'Project Control', icon: Sliders, path: '/project-control' },
        { name: 'Task Management', icon: CheckSquare, path: '/tasks' },
        { name: 'Kanban Board', icon: LayoutTemplate, path: '/kanban' },
        { name: 'Daily Tracker', icon: Clock, path: '/daily-tracker' },
      ]
    },
    {
      title: 'TEAM',
      items: [
        { name: 'Team Workload', icon: Users, path: '/team-workload' },
        { name: 'Approvals', icon: CheckCircle2, path: '/approvals' },
        { name: 'Team Directory', icon: UserPlus, path: '/team' },
      ]
    },
    {
      title: 'REPORTS',
      items: [
        { name: 'Reports', icon: BarChart2, path: '/reports' },
        { name: 'Analytics', icon: BarChart3, path: '/analytics' },
      ]
    },
    {
      title: 'SETTINGS',
      items: [
        { name: 'Settings', icon: Settings, path: '/settings' },
        { name: 'Templates', icon: FileStack, path: '/templates' },
      ]
    }
  ];

  // --- Standard Menu for other roles (Original) ---
  const legacyMenu = [
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

  const renderMenuItem = (item, roleSpecific = false) => {
    const isActive = pathname === item.path || 
                    (item.path !== '/' && pathname.startsWith(item.path + '/')) ||
                    (item.path === '/leads' && pathname.startsWith('/sales/month'));

    // PM style vs Legacy style
    if (roleSpecific && isPM) {
        return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center justify-between group rounded-xl transition-all duration-300 ${
                isCollapsed ? 'px-0 justify-center h-11' : 'px-4 py-2.5'
              } ${
                isActive 
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-200' 
                : 'text-slate-500 hover:bg-violet-50 hover:text-violet-600'
              }`}
              title={isCollapsed ? item.name : ''}
            >
              <div className={`flex items-center ${isCollapsed ? '' : 'gap-3'}`}>
                <item.icon size={isCollapsed ? 20 : 18} className={`shrink-0 transition-transform ${isCollapsed ? '' : 'group-hover:scale-110'}`} />
                {!isCollapsed && <span className="text-[13px] font-bold tracking-tight">{item.name}</span>}
              </div>
              
              {!isCollapsed && item.badge && (
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${isActive ? 'bg-white/20 text-white' : 'bg-violet-100 text-violet-600'}`}>
                  {item.badge}
                </span>
              )}
            </Link>
        );
    }

    // Original style
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
  };

  return (
    <div className={`${isCollapsed ? 'w-20' : 'w-64'} bg-white/70 backdrop-blur-xl h-screen flex flex-col text-slate-600 fixed left-0 top-0 border-r border-slate-200/60 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-50 transition-all duration-300`}>
      
      {/* Brand Section */}
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isPM ? (
            // PM Style Logo
            <div className="w-8 h-8 bg-violet-600 rounded-xl flex items-center justify-center font-black text-[10px] text-white shadow-lg shadow-violet-200 shrink-0">
              OIS
            </div>
          ) : (
            // Original Logo
            <div className="w-8 h-8 bg-violet-600 rounded-xl flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-lg shadow-violet-200">
              W
            </div>
          )}
          {!isCollapsed && (
            <span className="text-lg font-bold tracking-tight text-slate-900 animate-in fade-in duration-300">
              {isPM ? 'Ops.Lead' : 'WorkSensy'}
            </span>
          )}
        </div>
        
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all active:scale-95"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-6">
        
        {isPM ? (
          // Categorized Menu for PM
          pmMenu.map((category) => (
            <div key={category.title} className="space-y-1">
              {!isCollapsed && (
                <p className="px-4 text-[10px] font-black text-slate-400 tracking-widest mb-2 mt-4 uppercase">
                  {category.title}
                </p>
              )}
              <div className="space-y-1">
                {category.items.map(item => renderMenuItem(item, true))}
              </div>
            </div>
          ))
        ) : (
          // Legacy/Original Menu for other roles
          <div className="space-y-1.5">
            {legacyMenu
              .filter(item => item.roles.includes(user?.role))
              .map(item => renderMenuItem(item, false))
            }
          </div>
        )}

        {/* Need Help Box (PM Only) */}
        {isPM && !isCollapsed && (
          <div className="mt-8 px-2">
            <div className="bg-violet-50 rounded-2xl p-4 border border-violet-100 group">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm mb-3">
                <HelpCircle size={16} className="text-violet-600" />
              </div>
              <p className="text-xs font-bold text-slate-900">Need Help?</p>
              <p className="text-[10px] text-slate-500 mt-1 mb-3">Contact support team</p>
              <button className="w-full py-2 bg-white rounded-lg text-violet-600 text-[10px] font-bold border border-violet-100 hover:bg-violet-600 hover:text-white transition-all">
                Get Support
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Info & Original Logout Button */}
      <div className={`p-6 border-t border-slate-100 bg-slate-50/30 ${isCollapsed ? 'flex flex-col items-center gap-4' : ''}`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 mb-5 px-1'}`}>
          <div className="relative">
            <img 
              src={user?.profilePic || 'https://res.cloudinary.com/demo/image/upload/v1622551100/sample.jpg'} 
              alt="profile" 
              className={`rounded-2xl border-2 border-white shadow-sm object-cover ${isCollapsed ? 'w-10 h-10' : 'w-10 h-10'}`}
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden animate-in fade-in duration-300">
              <p className="text-sm font-bold text-slate-800 truncate leading-tight uppercase tracking-tight">{user?.name}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                {user?.role === 'project-manager' ? 'Operations Head' : user?.role?.replace('-', ' ')}
              </p>
            </div>
          )}
        </div>
        
        {/* Original Style Logout Button */}
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
