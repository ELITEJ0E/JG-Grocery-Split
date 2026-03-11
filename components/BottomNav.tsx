import React from 'react';
import { Camera, Utensils, ShoppingCart, BarChart2, Home } from 'lucide-react';
import { AppState } from '../types';
import { clsx } from 'clsx';

interface BottomNavProps {
  currentView: AppState;
  onNavigate: (view: AppState) => void;
}

interface NavButtonProps {
  item: { id: AppState; label: string; icon: React.ReactNode };
  currentView: AppState;
  onNavigate: (view: AppState) => void;
}

const NavButton: React.FC<NavButtonProps> = ({ item, currentView, onNavigate }) => {
  const isActive = currentView === item.id;
  return (
    <button
      onClick={() => onNavigate(item.id)}
      className={clsx(
        "relative flex flex-col items-center justify-center w-16 h-16 rounded-2xl transition-all duration-300",
        isActive ? "text-white" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
      )}
    >
      {isActive && (
        <div
          className="absolute inset-0 rounded-2xl shadow-md transition-all duration-300"
          style={{ background: 'linear-gradient(to right, #4ADE80, #38BDF8)' }}
        />
      )}
      <div className="relative z-10 flex flex-col items-center gap-1">
        <div className={clsx("transition-transform duration-200 active:scale-90", isActive ? "-translate-y-0.5" : "translate-y-0")}>
          {item.icon}
        </div>
        <span className={clsx("text-[10px] font-semibold tracking-wide", isActive ? "text-white" : "text-slate-500")}>
          {item.label}
        </span>
      </div>
    </button>
  );
};

const BottomNav: React.FC<BottomNavProps> = ({ currentView, onNavigate }) => {
  const leftItems: { id: AppState; label: string; icon: React.ReactNode }[] = [
    { id: 'kitchen', label: 'Kitchen', icon: <Home size={22} /> },
    { id: 'planner', label: 'Recipes', icon: <Utensils size={22} /> },
  ];

  const rightItems: { id: AppState; label: string; icon: React.ReactNode }[] = [
    { id: 'analytics', label: 'Stats', icon: <BarChart2 size={22} /> },
    { id: 'shoppingList', label: 'Shop', icon: <ShoppingCart size={22} /> },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-100 pb-safe z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
      <div className="flex justify-around items-center h-20 max-w-md mx-auto px-2 relative">
        {leftItems.map(item => <NavButton key={item.id} item={item} currentView={currentView} onNavigate={onNavigate} />)}

        {/* Center Scan Button */}
        <div className="flex flex-col items-center relative -mt-6">
          <button
            onClick={() => onNavigate('scan')}
            className="relative flex items-center justify-center w-16 h-16 rounded-full shadow-xl transition-transform duration-200 hover:scale-105 active:scale-95"
            style={{ background: 'linear-gradient(to right, #4ADE80, #38BDF8)' }}
          >
            {/* Glow ring */}
            <div
              className="absolute inset-0 rounded-full opacity-30 blur-md scale-110"
              style={{ background: 'linear-gradient(to right, #4ADE80, #38BDF8)' }}
            />
            <Camera size={26} className="text-white relative z-10" strokeWidth={2.5} />
          </button>
          <span className={clsx(
            "text-[10px] font-semibold tracking-wide mt-1",
            currentView === 'scan' ? "text-[#4ADE80]" : "text-slate-500"
          )}>
            Scan
          </span>
        </div>

        {rightItems.map(item => <NavButton key={item.id} item={item} currentView={currentView} onNavigate={onNavigate} />)}
      </div>
    </div>
  );
};

export default BottomNav;