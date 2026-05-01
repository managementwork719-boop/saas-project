'use client';
import React from 'react';
import RoleProtected from '@/components/RoleProtected';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import API from '@/api/axios';
import { Search, Plus, Filter, MoreVertical, CheckCircle2, XCircle, Eye, AlertTriangle } from 'lucide-react';
import { TableSkeleton } from '@/components/Skeleton';

const ApprovalsPage = () => {
  const { user } = useAuth();
  
  const { data: approvalsData, isLoading } = useQuery({
    queryKey: ['pmApprovals'],
    queryFn: async () => {
      const res = await API.get('/project-manager/approvals?status=all');
      return res.data.data;
    }
  });

  const approvals = approvalsData?.approvals || [];

  return (
    <RoleProtected allowedRoles={['project-manager', 'admin', 'super-admin']}>
      <div className="p-8 bg-[#fdfdff] min-h-screen">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Approval Queue</h1>
            <p className="text-sm text-slate-500 mt-1">Review and manage budget, leave, and milestone requests.</p>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex gap-4 mb-6 border-b border-slate-100">
          <button className="text-sm font-bold text-violet-600 border-b-2 border-violet-600 pb-3 px-2">All Requests</button>
          <button className="text-sm font-medium text-slate-500 hover:text-slate-700 pb-3 px-2">Pending</button>
          <button className="text-sm font-medium text-slate-500 hover:text-slate-700 pb-3 px-2">Approved</button>
          <button className="text-sm font-medium text-slate-500 hover:text-slate-700 pb-3 px-2">Rejected</button>
        </div>

        {/* Approvals Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-8">
              <TableSkeleton />
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <th className="py-4 px-6">Request Title</th>
                  <th className="py-4 px-6">Type</th>
                  <th className="py-4 px-6">Requested By</th>
                  <th className="py-4 px-6">Project</th>
                  <th className="py-4 px-6">Amount / Info</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {approvals.map((app) => (
                  <tr key={app._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        {app.isUrgent && <AlertTriangle size={14} className="text-red-500" />}
                        <p className="text-sm font-bold text-slate-900">{app.title}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-xs font-medium text-slate-600 uppercase tracking-wider bg-slate-50 px-2 py-1 rounded">
                        {app.type}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-xs font-medium text-slate-700">{app.requestedByName}</p>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-500">{app.projectName}</td>
                    <td className="py-4 px-6 text-xs font-bold text-slate-900">
                      {app.amount ? `₹${app.amount.toLocaleString()}` : '-'}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
                        app.status === 'approved' ? 'bg-emerald-100 text-emerald-600' :
                        app.status === 'rejected' ? 'bg-red-100 text-red-600' :
                        'bg-violet-100 text-violet-600'
                      }`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        {app.status === 'pending' && (
                          <>
                            <button className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors" title="Approve">
                              <CheckCircle2 size={18} />
                            </button>
                            <button className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors" title="Reject">
                              <XCircle size={18} />
                            </button>
                          </>
                        )}
                        <button className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors" title="View Details">
                          <Eye size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {approvals.length === 0 && (
                  <tr>
                    <td colSpan="7" className="py-20 text-center text-slate-400 font-medium">
                      No approval requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </RoleProtected>
  );
};

export default ApprovalsPage;
