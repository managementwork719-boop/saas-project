'use client';
import React, { use } from 'react';
import MonthlyOverview from '@/views/MonthlyOverview';
import RoleProtected from '@/components/RoleProtected';

export default function MonthlyOverviewPage({ params }) {
  const { id } = use(params);

  return (
    <RoleProtected allowedRoles={['super-admin', 'admin', 'sales-manager', 'sales-team']}>
      <MonthlyOverview />
    </RoleProtected>
  );
}
