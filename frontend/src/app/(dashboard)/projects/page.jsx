'use client';
import React from 'react';
import ProjectView from '@/views/ProjectView';
import RoleProtected from '@/components/RoleProtected';

export default function Projects() {
  return (
    <RoleProtected allowedRoles={['super-admin', 'admin', 'project-manager', 'project-team']}>
      <ProjectView />
    </RoleProtected>
  );
}
