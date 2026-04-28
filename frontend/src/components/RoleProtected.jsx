'use client';
import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import LoadingScreen from '@/components/LoadingScreen';

const RoleProtected = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (!loading && user && allowedRoles && !allowedRoles.includes(user.role)) {
      router.push('/dashboard');
    }
  }, [user, loading, router, allowedRoles]);

  if (loading) {
    return <LoadingScreen message="Authenticating Session" />;
  }

  if (!user || (allowedRoles && !allowedRoles.includes(user.role))) {
    return null;
  }

  return <>{children}</>;
};

export default RoleProtected;
