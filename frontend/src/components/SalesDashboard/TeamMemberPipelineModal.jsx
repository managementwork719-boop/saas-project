'use client';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import API from '@/api/axios';
import { X, User } from 'lucide-react';
import PersonalPipeline from '../PersonalPipeline';

const TeamMemberPipelineModal = ({ member, onClose }) => {
  const { data: rawLeads = { followUp: [], converted: [], notConverted: [] }, isLoading } = useQuery({
    queryKey: ['memberPipeline', member.name],
    queryFn: async () => {
      const res = await API.get(`/sales/member-leads/${encodeURIComponent(member.name)}`);
      return res.data.data;
    },
    enabled: !!member
  });

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 sm:p-6 lg:p-8">
      <div className="bg-slate-50/95 w-full max-w-6xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-200 border border-slate-200">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-white shadow-sm z-10">
          <div className="flex items-center gap-3">
            {member.profilePic ? (
               <img src={member.profilePic} alt={member.name} className="w-10 h-10 rounded-full border-2 border-slate-100 shadow-sm" />
            ) : (
               <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center border-2 border-slate-100 shadow-sm">
                  <User size={18} />
               </div>
            )}
            <div>
               <h2 className="text-lg font-bold text-slate-900 tracking-tight leading-none">{member.name}'s Pipeline</h2>
               <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">{member.email}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-all"
          >
            <X size={20}/>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <PersonalPipeline 
             data={rawLeads} 
             loading={isLoading} 
          />
        </div>
      </div>
    </div>,
    document.body
  );
};

export default TeamMemberPipelineModal;
