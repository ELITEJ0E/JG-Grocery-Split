import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

const Sheet: React.FC<SheetProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer,
  className 
}) => {
  const [shouldRender, setShouldRender] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      document.body.style.overflow = 'hidden';
    } else {
      const timer = setTimeout(() => {
        setShouldRender(false);
        document.body.style.removeProperty('overflow');
      }, 300);
      return () => clearTimeout(timer);
    }
    
    return () => {
      document.body.style.removeProperty('overflow');
    };
  }, [isOpen]);

  if (!shouldRender) return null;

  return (
    <div 
      className={clsx(
        "fixed inset-0 z-[100] flex items-end justify-center p-4 transition-opacity duration-300",
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Sheet Content */}
      <div 
        className={clsx(
          "bg-white rounded-[2rem] w-full max-w-sm p-6 shadow-2xl relative z-10 transition-transform duration-300 ease-spring",
          isOpen ? "translate-y-0" : "translate-y-full",
          className
        )}
      >
        {/* Handle for dragging feel */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-200 rounded-full" />
        
        <div className="flex justify-between items-center mb-6 mt-2">
          {title ? (
            <h3 className="font-extrabold text-slate-800 text-xl tracking-tight">{title}</h3>
          ) : <div />}
          <button 
            onClick={onClose} 
            className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[70vh] no-scrollbar">
          {children}
        </div>

        {footer && (
          <div className="mt-6 pt-4 border-t border-slate-100">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sheet;
