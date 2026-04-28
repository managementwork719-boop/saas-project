'use client';
import React from 'react';
import Team from '@/views/Team';
import RoleProtected from '@/components/RoleProtected';

export default function TeamPage() {
  return (
    <RoleProtected allowedRoles={['super-admin', 'admin', 'sales-manager', 'sales-team', 'project-manager']}>
      <Team />
    </RoleProtected>
  );
}
