'use client';
import React from 'react';
import Clients from '@/views/Clients';
import RoleProtected from '@/components/RoleProtected';

export default function ClientsPage() {
  return (
    <RoleProtected allowedRoles={['super-admin', 'admin', 'sales-manager', 'sales-team', 'project-manager']}>
      <Clients />
    </RoleProtected>
  );
}
