'use client';
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Send, UserCircle, Clock, NotebookPen } from 'lucide-react';
import API from '../api/axios';

const LeadConversationModal = ({ lead, onClose, onNoteAdded }) => {
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState(lead.conversationLogs || []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!note.trim()) return;

    setLoading(true);
    try {
      const res = await API.post(`/sales/lead/${lead._id}/note`, { note });
      setLogs(res.data.data.logs);
      setNote('');
      if (onNoteAdded) onNoteAdded();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add note');
    } finally {
      setLoading(false);
    }
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl animate-in zoom-in duration-200 flex flex-col max-h-[80vh] border border-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-indigo-50/30 rounded-t-2xl">
          <div className="flex items-center gap-2 text-indigo-600">
            <NotebookPen size={18} />
            <h2 className="text-sm font-bold text-slate-900">Conversation Notepad: {lead.name}</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-xl text-slate-400 transition-all"><X size={16}/></button>
        </div>

        {/* Notes list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-300">
               <NotebookPen size={48} className="mb-2 opacity-20" />
               <p className="text-xs font-bold uppercase tracking-widest">No conversation logs yet</p>
            </div>
          ) : (
            [...logs].reverse().map((log, i) => (
              <div key={i} className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 animate-in slide-in-from-bottom-2 duration-300">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-1.5">
                    <UserCircle size={14} className="text-indigo-400" />
                    <span className="text-[10px] font-bold text-slate-700 uppercase tracking-tight">{log.author}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400">
                    <Clock size={10} />
                    <span className="text-[9px] font-medium">{new Date(log.timestamp).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
                <p className="text-[12px] text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">{log.note}</p>
              </div>
            ))
          )}
        </div>

        {/* Input area */}
        <div className="p-4 border-t border-slate-100 bg-white rounded-b-2xl">
          <form onSubmit={handleSubmit} className="relative">
            <textarea 
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Record your conversation here..."
              className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-xs font-semibold resize-none h-20"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <button 
              type="submit"
              disabled={loading || !note.trim()}
              className="absolute right-2 bottom-2 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all disabled:opacity-50 disabled:translate-y-0 active:scale-95"
            >
              <Send size={16} />
            </button>
          </form>
          <p className="text-[9px] text-slate-400 mt-2 ml-1 italic">Press Shift+Enter for new line</p>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default LeadConversationModal;
