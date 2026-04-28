'use client';
import React from 'react';
import { ProjectsPage } from '@/views/PlaceholderPages';
import RoleProtected from '@/components/RoleProtected';

export default function Projects() {
  return (
    <RoleProtected allowedRoles={['super-admin', 'admin', 'project-manager', 'project-team']}>
      <ProjectsPage />
    </RoleProtected>
  );
}
