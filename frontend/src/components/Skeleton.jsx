'use client';
import React from 'react';

export const Skeleton = ({ className, ...props }) => {
  return (
    <div
      className={`relative overflow-hidden bg-slate-200/60 rounded-md ${className}`}
      {...props}
    >
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
    </div>
  );
};

export const DashboardSkeleton = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-2xl" />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-96 col-span-2 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    </div>
  );
};

export const TableSkeleton = () => {
  return (
    <div className="space-y-4">
      <Skeleton className="h-12 w-full" />
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-16 w-full opacity-60" />
      ))}
    </div>
  );
};

export const StatSkeleton = () => (
  <div className="bg-white/70 backdrop-blur-xl rounded-xl p-4 border border-slate-200/60 h-28 flex flex-col justify-between">
    <Skeleton className="h-10 w-10 rounded-xl" />
    <div className="space-y-2 mt-2">
      <Skeleton className="h-6 w-20" />
      <Skeleton className="h-3 w-16" />
    </div>
  </div>
);

export const HeaderSkeleton = ({ children }) => (
  <div className="space-y-4">
    <div className="relative overflow-hidden bg-white/40 p-3 rounded-[17px] border border-slate-200/50">
      <div className="relative bg-white/80 backdrop-blur-xl border border-white/60 p-6 rounded-[17px] flex flex-col md:flex-row items-center gap-6">
        <Skeleton className="h-16 w-16 rounded-[17px] shrink-0" />
        <div className="space-y-3 flex-1">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
      </div>
      {children && <div className="mt-6">{children}</div>}
    </div>
  </div>
);

export const TableRowSkeleton = () => (
  <div className="flex items-center gap-4 py-3 border-b border-slate-100">
    <Skeleton className="h-8 w-8 rounded-full" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-3 w-24" />
    </div>
    <Skeleton className="h-6 w-16 rounded-full" />
  </div>
);

export const AnalyticsSkeleton = () => (
  <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/60 shadow-sm h-[400px] flex flex-col gap-6">
    <div className="flex justify-between items-center">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-8 w-32 rounded-lg" />
    </div>
    <Skeleton className="flex-1 w-full rounded-xl" />
  </div>
);

export const PulseSkeleton = () => (
  <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/60 shadow-sm h-full space-y-4">
    <Skeleton className="h-6 w-32 mb-4" />
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <Skeleton className="h-4 w-8" />
      </div>
    ))}
  </div>
);

export default Skeleton;
