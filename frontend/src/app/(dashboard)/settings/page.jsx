'use client';
import React from 'react';
import Settings from '@/views/Settings';
import RoleProtected from '@/components/RoleProtected';

export default function SettingsPage() {
  return (
    <RoleProtected>
      <Settings />
    </RoleProtected>
  );
}
