'use client';
import React, { useState, Suspense } from 'react';
import Sidebar from '@/components/Sidebar';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const router = useRouter();

  // Route protection - though middleware is better, this is a safe fallback
  React.useEffect(() => {
    if (!loading && !user && pathname !== '/login') {
      router.push('/login');
    }
  }, [loading, user, pathname, router]);

  if (!loading && !user && pathname !== '/login') {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex bg-[#fdfdff] min-h-screen font-inter">
      {/* Fixed Sidebar */}
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* Main Content Area */}
      <div className={`flex-1 transition-all duration-300 flex flex-col ${isCollapsed ? 'ml-20' : 'ml-64'} relative`}>
        
        {/* Organic Background (Ported from old layout) */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden" 
          style={{ zIndex: 0, left: isCollapsed ? '80px' : '256px' }}>
          <div className="absolute inset-0 bg-[#f8f9ff]/50" />
          <div style={{
            position: 'absolute',
            top: '-5%',
            left: '5%',
            width: '80vw',
            height: '70vh',
            background: 'radial-gradient(circle at center, rgba(139, 92, 246, 0.15) 0%, rgba(167, 139, 250, 0.08) 40%, transparent 70%)',
            filter: 'blur(80px)',
            transform: 'rotate(-10deg)',
          }} />
          <div style={{
            position: 'absolute',
            top: '20%',
            right: '-10%',
            width: '60vw',
            height: '60vh',
            background: 'radial-gradient(circle at center, rgba(99, 102, 241, 0.12) 0%, rgba(59, 130, 246, 0.05) 50%, transparent 80%)',
            filter: 'blur(100px)',
          }} />
        </div>

        {/* Dynamic Page Content */}
        <main className="p-8 relative flex-1">
          <div className="max-w-7xl mx-auto h-full">
            <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin"></div></div>}>
              {children}
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
