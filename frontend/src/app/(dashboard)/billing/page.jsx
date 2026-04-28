'use client';
import React from 'react';
import { BillingPage } from '@/views/PlaceholderPages';
import RoleProtected from '@/components/RoleProtected';

export default function Billing() {
  return (
    <RoleProtected allowedRoles={['super-admin', 'admin', 'project-manager']}>
      <BillingPage />
    </RoleProtected>
  );
}
