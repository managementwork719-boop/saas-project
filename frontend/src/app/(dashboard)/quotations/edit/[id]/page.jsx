'use client';
import React from 'react';
import QuotationCreator from '@/views/QuotationCreator';
import RoleProtected from '@/components/RoleProtected';

export default function EditQuotationPage() {
  return (
    <RoleProtected allowedRoles={['super-admin', 'admin', 'accounts-manager', 'accounts-team']}>
      <QuotationCreator />
    </RoleProtected>
  );
}
