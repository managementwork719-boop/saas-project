'use client';
import React from 'react';
import InvoiceCreator from '@/views/InvoiceCreator';
import RoleProtected from '@/components/RoleProtected';

export default function EditInvoicePage() {
  return (
    <RoleProtected allowedRoles={['super-admin', 'admin', 'accounts-manager', 'accounts-team']}>
      <InvoiceCreator />
    </RoleProtected>
  );
}
