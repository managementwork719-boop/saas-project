'use client';
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X, AlertTriangle, Check } from 'lucide-react';

const CalendarMenu = ({ menuRef, menuRect, selectedDate, onSelect, onClear }) => {
  const [viewDate, setViewDate] = useState(selectedDate ? new Date(selectedDate) : new Date());
  
  const daysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

  const month = viewDate.getMonth();
  const year = viewDate.getFullYear();
  const totalDays = daysInMonth(month, year);
  const startDay = firstDayOfMonth(month, year);

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const days = [];
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let i = 1; i <= totalDays; i++) days.push(i);

  if (!menuRect) return null;

  return createPortal(
    <div 
      ref={menuRef}
      className="fixed z-[9999] bg-white/95 backdrop-blur-2xl border border-slate-200/60 rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] overflow-hidden animate-in fade-in zoom-in-95 duration-300 origin-top p-5 w-[300px]"
      style={{ 
        top: 0,
        left: 0,
        transform: `translate3d(${menuRect.left}px, ${menuRect.top + 12}px, 0)`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-brand-primary active:scale-90">
          <ChevronLeft size={18} />
        </button>
        <div className="flex flex-col items-center">
            <span className="text-[10px] font-black text-brand-primary/50 uppercase tracking-[0.2em] mb-0.5">{year}</span>
            <span className="text-sm font-black text-slate-800 tracking-tight">{monthNames[month]}</span>
        </div>
        <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-brand-primary active:scale-90">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 gap-1 mb-3">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={`${d}-${i}`} className="text-[9px] font-black text-slate-400 text-center uppercase tracking-tighter opacity-70">{d}</div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day, idx) => {
          if (day === null) return <div key={`empty-${idx}`} />;
          
          const d = new Date(year, month, day);
          const dateStr = d.toISOString().split('T')[0];
          const isSelected = selectedDate && selectedDate.split('T')[0] === dateStr;
          const isToday = new Date().toISOString().split('T')[0] === dateStr;
          const isWeekend = d.getDay() === 0 || d.getDay() === 6;

          return (
            <button
              key={idx}
              onClick={() => onSelect(dateStr)}
              className={`
                aspect-square flex items-center justify-center text-[12px] font-bold rounded-xl transition-all duration-300 relative group
                ${isSelected 
                  ? 'bg-brand-primary text-white shadow-lg shadow-brand-shadow scale-105 z-10' 
                  : isToday 
                    ? 'bg-brand-primary/10 text-brand-primary ring-2 ring-brand-primary/20' 
                    : isWeekend 
                        ? 'text-slate-400 hover:bg-slate-50 hover:text-brand-primary'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-brand-primary'}
              `}
            >
              {day}
              {isToday && !isSelected && <span className="absolute bottom-1 w-1 h-1 bg-brand-primary rounded-full"></span>}
            </button>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex gap-2">
        <button 
          onClick={() => {
            const today = new Date().toISOString().split('T')[0];
            onSelect(today);
          }}
          className="flex-1 px-4 py-2 text-[10px] font-black uppercase text-brand-primary bg-brand-primary/5 hover:bg-brand-primary/10 rounded-xl transition-all tracking-widest active:scale-95"
        >
          Today
        </button>
        {onClear && (
          <button 
            onClick={onClear}
            className="px-4 py-2 text-[10px] font-black uppercase text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all active:scale-95"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>,
    document.body
  );
};

const PremiumDatePicker = ({ 
  value, 
  onChange, 
  placeholder = "Set Date",
  isOverdue = false,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuRect, setMenuRect] = useState(null);
  const containerRef = useRef(null);
  const menuRef = useRef(null);

  const updatePosition = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMenuRect({
        top: rect.bottom,
        left: rect.left,
        width: rect.width
      });
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      const isInsideContainer = containerRef.current && containerRef.current.contains(event.target);
      const isInsideMenu = menuRef.current && menuRef.current.contains(event.target);
      
      if (!isInsideContainer && !isInsideMenu) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', updatePosition, { capture: true, passive: true });
      window.addEventListener('resize', updatePosition);
      updatePosition();
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', updatePosition, { capture: true });
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  const handleToggle = (e) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleSelect = (dateStr) => {
    onChange(dateStr);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setIsOpen(false);
  };

  const displayValue = value 
    ? new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    : placeholder;

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      <button
        onClick={handleToggle}
        className={`
          group relative inline-flex items-center gap-2 whitespace-nowrap px-3 py-2 rounded-xl transition-all duration-300 font-black text-[11px] border
          ${isOpen 
            ? 'border-brand-primary ring-4 ring-brand-primary/10 bg-white text-brand-primary z-50' 
            : isOverdue 
              ? 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100 hover:scale-105 shadow-sm active:scale-95' 
              : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-white hover:border-brand-primary/30 hover:shadow-md active:scale-95'}
        `}
      >
        {isOverdue && !isOpen && <AlertTriangle size={13} className="text-rose-500 animate-pulse" />}
        {!isOverdue && !isOpen && <CalendarIcon size={13} className="text-slate-400 group-hover:text-brand-primary transition-colors" />}
        {isOpen && <X size={13} className="text-brand-primary animate-in spin-in-90 duration-300" />}
        <span className="tracking-tight">{displayValue}</span>
      </button>

      {isOpen && (
        <CalendarMenu 
          menuRef={menuRef}
          menuRect={menuRect}
          selectedDate={value}
          onSelect={handleSelect}
          onClear={handleClear}
        />
      )}
    </div>
  );
};

export default PremiumDatePicker;
