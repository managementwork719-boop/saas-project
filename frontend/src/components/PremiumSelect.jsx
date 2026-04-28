'use client';
import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

const DropdownMenu = ({ menuRef, menuRect, options, value, handleSelect }) => {
  if (!menuRect) return null;

  return createPortal(
    <div 
      ref={menuRef}
      className="fixed z-[9999] bg-white/95 backdrop-blur-xl border border-slate-200/50 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top"
      style={{ 
        top: 0,
        left: 0,
        transform: `translate3d(${menuRect.left}px, ${menuRect.top + 8}px, 0)`,
        width: `${menuRect.width}px`,
        minWidth: '160px'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="max-h-60 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-slate-200">
        {options.map((option) => (
          <div
            key={option.value}
            onClick={(e) => handleSelect(e, option.value)}
            className={`
              flex items-center justify-between px-4 py-2.5 text-xs font-bold transition-all duration-200 cursor-pointer
              ${value === option.value 
                ? 'bg-brand-primary/10 text-brand-primary' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-brand-primary'}
              ${option.className || ''}
            `}
          >
            <span>{option.label}</span>
            {value === option.value && <Check size={12} className="shrink-0" />}
          </div>
        ))}
      </div>
    </div>,
    document.body
  );
};

const PremiumSelect = ({ 
  value, 
  options, 
  onChange, 
  disabled, 
  placeholder = "Select Option",
  className = "",
  variant = "default", // default, status, minimal
  toggleClassName = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuRect, setMenuRect] = useState(null);
  const dropdownRef = useRef(null);
  const menuRef = useRef(null);

  const selectedOption = options.find(opt => opt.value === value);

  const updatePosition = () => {
    if (dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      setMenuRect({
        top: rect.bottom,
        left: rect.left,
        width: rect.width
      });
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      const isInsideDropdown = dropdownRef.current && dropdownRef.current.contains(event.target);
      const isInsideMenu = menuRef.current && menuRef.current.contains(event.target);
      
      if (!isInsideDropdown && !isInsideMenu) {
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
    if (!disabled) setIsOpen(!isOpen);
  };

  const handleSelect = (e, val) => {
    e.stopPropagation();
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block w-full ${className}`} ref={dropdownRef}>
      {/* Toggle Button */}
      <div
        onClick={(e) => handleToggle(e)}
        className={`
          flex items-center justify-between px-3 py-1.5 rounded-xl border transition-all duration-300
          ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-200' : 'cursor-pointer hover:border-brand-primary active:scale-[0.98]'}
          ${isOpen ? 'border-brand-primary ring-4 ring-brand-primary/10 bg-white' : (toggleClassName || 'border-slate-200/60 bg-white/70')}
          ${variant === 'status' ? 'text-[10px] font-black uppercase tracking-widest' : 'text-xs font-bold text-slate-700'}
        `}
      >
        <span className="truncate mr-2">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown 
          size={14} 
          className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-brand-primary' : ''}`} 
        />
      </div>

      {/* Render Menu via Portal */}
      {isOpen && (
        <DropdownMenu 
          menuRef={menuRef}
          menuRect={menuRect} 
          options={options} 
          value={value} 
          handleSelect={handleSelect} 
        />
      )}
    </div>
  );
};

export default PremiumSelect;
