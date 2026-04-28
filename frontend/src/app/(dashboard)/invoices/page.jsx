'use client';
import React from 'react';
import DocumentList from '@/views/DocumentList';
import RoleProtected from '@/components/RoleProtected';

export default function InvoicesPage() {
  return (
    <RoleProtected allowedRoles={['super-admin', 'admin', 'accounts-manager', 'accounts-team']}>
      <DocumentList type="invoice" />
    </RoleProtected>
  );
}
