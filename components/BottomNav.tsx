import React from 'react';
import { Camera, Utensils, ShoppingCart, BarChart2, Home } from 'lucide-react';
import { AppState } from '../types';
import { clsx } from 'clsx';
import { motion } from 'motion/react';

interface BottomNavProps {
  currentView: AppState;
  onNavigate: (view: AppState) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentView, onNavigate }) => {
  const leftItems: { id: AppState; label: string; icon: React.ReactNode }[] = [
    { id: 'kitchen', label: 'Kitchen', icon: <Home size={22} /> },
    { id: 'planner', label: 'Recipes', icon: <Utensils size={22} /> },
  ];

  const rightItems: { id: AppState; label: string; icon: React.ReactNode }[] = [
    { id: 'analytics', label: 'Stats', icon: <BarChart2 size={22} /> },
    { id: 'shoppingList', label: 'Shop', icon: <ShoppingCart size={22} /> },
  ];

  const NavButton = ({ item }: { item: { id: AppState; label: string; icon: React.ReactNode } }) => {
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
          <motion.div
            layoutId="bottomNavActive"
            className="absolute inset-0 rounded-2xl shadow-md"
            style={{ background: 'linear-gradient(to right, #4ADE80, #38BDF8)' }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          />
        )}
        <div className="relative z-10 flex flex-col items-center gap-1">
          <motion.div whileTap={{ scale: 0.9 }} animate={{ y: isActive ? -2 : 0 }}>
            {item.icon}
          </motion.div>
          <span className={clsx("text-[10px] font-semibold tracking-wide", isActive ? "text-white" : "text-slate-500")}>
            {item.label}
          </span>
        </div>
      </button>
    );
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-100 pb-safe z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
      <div className="flex justify-around items-center h-20 max-w-md mx-auto px-2 relative">
        {leftItems.map(item => <NavButton key={item.id} item={item} />)}

        {/* Center Scan Button */}
        <div className="flex flex-col items-center relative -mt-6">
          <motion.button
            whileTap={{ scale: 0.92 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => onNavigate('scan')}
            className="relative flex items-center justify-center w-16 h-16 rounded-full shadow-xl"
            style={{ background: 'linear-gradient(to right, #4ADE80, #38BDF8)' }}
          >
            {/* Glow ring */}
            <div
              className="absolute inset-0 rounded-full opacity-30 blur-md scale-110"
              style={{ background: 'linear-gradient(to right, #4ADE80, #38BDF8)' }}
            />
            <Camera size={26} className="text-white relative z-10" strokeWidth={2.5} />
          </motion.button>
          <span className={clsx(
            "text-[10px] font-semibold tracking-wide mt-1",
            currentView === 'scan' ? "text-[#4ADE80]" : "text-slate-500"
          )}>
            Scan
          </span>
        </div>

        {rightItems.map(item => <NavButton key={item.id} item={item} />)}
      </div>
    </div>
  );
};

export default BottomNav;