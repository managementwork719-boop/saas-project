'use client';
import React from 'react';
import OverviewCard from './OverviewCard';
import { 
  Users, 
  Target, 
  TrendingUp, 
  IndianRupee 
} from 'lucide-react';

const MonthlyStats = ({ stats }) => {
  const items = [
    { 
      title: 'Monthly Leads', 
      value: stats.count || 0, 
      icon: Users, 
      color: 'bg-blue-500', 
    },
    { 
      title: 'Conversions', 
      value: stats.converted || 0, 
      icon: Target, 
      color: 'bg-emerald-500', 
    },
    { 
      title: 'Current Revenue', 
      value: `₹${(stats.revenue || 0).toLocaleString()}`, 
      icon: IndianRupee, 
      color: 'bg-violet-600', 
    },
    { 
      title: 'Amount Received', 
      value: `₹${(stats.received || 0).toLocaleString()}`, 
      icon: TrendingUp, 
      color: 'bg-amber-500' 
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {items.map((item, idx) => (
        <OverviewCard key={item.title} {...item} delay={idx * 100} />
      ))}
    </div>
  );
};

export default MonthlyStats;
