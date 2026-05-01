'use client';
import React from 'react';
import RoleProtected from '@/components/RoleProtected';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import API from '@/api/axios';
import { Search, Plus, Filter, MoreVertical, Calendar, Clock, AlertCircle } from 'lucide-react';
import { TableSkeleton } from '@/components/Skeleton';

const TasksPage = () => {
  const { user } = useAuth();
  
  const { data: tasksData, isLoading } = useQuery({
    queryKey: ['pmTasks'],
    queryFn: async () => {
      const res = await API.get('/project-manager/tasks');
      return res.data.data;
    }
  });

  const tasks = tasksData?.tasks || [];

  return (
    <RoleProtected allowedRoles={['project-manager', 'project-team', 'admin', 'super-admin']}>
      <div className="p-8 bg-[#fdfdff] min-h-screen">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Task Management</h1>
            <p className="text-sm text-slate-500 mt-1">Manage and track all project tasks and milestones.</p>
          </div>
          <button className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-violet-200 hover:bg-violet-700 transition-all">
            <Plus size={18} /> New Task
          </button>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-6 shadow-sm flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search tasks..." 
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">
              <Filter size={16} /> Filters
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">
              <Calendar size={16} /> Due Date
            </button>
          </div>
        </div>

        {/* Tasks Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-8">
              <TableSkeleton />
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <th className="py-4 px-6">Task Title</th>
                  <th className="py-4 px-6">Project</th>
                  <th className="py-4 px-6">Assigned To</th>
                  <th className="py-4 px-6">Due Date</th>
                  <th className="py-4 px-6">Priority</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                    <td className="py-4 px-6">
                      <p className="text-sm font-bold text-slate-900">{task.title}</p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-xs text-slate-500">{task.projectName}</p>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-violet-100 text-violet-600 flex items-center justify-center text-[10px] font-bold uppercase">
                          {task.assignedToName?.substring(0, 2)}
                        </div>
                        <span className="text-xs text-slate-700">{task.assignedToName}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <Clock size={14} className="text-slate-400" />
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
                        task.priority === 'critical' ? 'bg-red-100 text-red-600' :
                        task.priority === 'high' ? 'bg-orange-100 text-orange-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
                        task.status === 'completed' ? 'bg-emerald-100 text-emerald-600' :
                        task.status === 'in-progress' ? 'bg-blue-100 text-blue-600' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {task.status.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {tasks.length === 0 && (
                  <tr>
                    <td colSpan="7" className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <AlertCircle size={40} className="text-slate-200" />
                        <p className="text-slate-400 font-medium">No tasks found. Create your first task to get started!</p>
                      </div>
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

export default TasksPage;
