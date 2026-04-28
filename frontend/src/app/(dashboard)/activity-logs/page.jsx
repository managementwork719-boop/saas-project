'use client';
import React from 'react';
import ActivityLog from '@/views/ActivityLog';
import RoleProtected from '@/components/RoleProtected';

export default function ActivityLogPage() {
  return (
    <RoleProtected>
      <ActivityLog />
    </RoleProtected>
  );
}
