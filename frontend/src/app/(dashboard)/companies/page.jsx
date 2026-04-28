'use client';
import React from 'react';
import Companies from '@/views/Companies';
import RoleProtected from '@/components/RoleProtected';

export default function CompaniesPage() {
  return (
    <RoleProtected allowedRoles={['super-admin']}>
      <Companies />
    </RoleProtected>
  );
}
