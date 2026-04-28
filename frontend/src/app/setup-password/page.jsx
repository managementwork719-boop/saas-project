'use client';
import React, { Suspense } from 'react';
import SetupPassword from '@/views/SetupPassword';

export default function SetupPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white"><div className="w-8 h-8 border-4 border-slate-100 border-t-brand-primary rounded-full animate-spin"></div></div>}>
      <SetupPassword />
    </Suspense>
  );
}
