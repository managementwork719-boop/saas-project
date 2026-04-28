'use client';
import React from 'react';
import SalesDashboard from '@/views/SalesDashboard';
import RoleProtected from '@/components/RoleProtected';

export default function LeadsPage() {
  return (
    <RoleProtected allowedRoles={['super-admin', 'admin', 'sales-manager', 'sales-team']}>
      <SalesDashboard mode="leads" />
    </RoleProtected>
  );
}
