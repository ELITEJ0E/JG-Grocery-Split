import React from 'react';
import { Camera, List, Calendar, BarChart2, ShoppingCart } from 'lucide-react';
import { AppState } from '../types';
import { clsx } from 'clsx';

interface BottomNavProps {
  currentView: AppState;
  onNavigate: (view: AppState) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentView, onNavigate }) => {
  const navItems: { id: AppState; label: string; icon: React.ReactNode }[] = [
    { id: 'inventory', label: 'Inventory', icon: <List size={24} /> },
    { id: 'planner', label: 'Planner', icon: <Calendar size={24} /> },
    { id: 'scan', label: 'Scan', icon: <Camera size={24} /> },
    { id: 'shoppingList', label: 'Shop', icon: <ShoppingCart size={24} /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart2 size={24} /> },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-2 z-50">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto px-2">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          const isScan = item.id === 'scan';
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={clsx(
                "flex flex-col items-center justify-center w-16 h-full transition-colors",
                isActive ? "text-emerald-600" : "text-gray-400 hover:text-gray-600",
                isScan && "relative -top-4"
              )}
            >
              {isScan ? (
                <div className={clsx(
                  "p-4 rounded-full shadow-lg text-white transition-transform active:scale-95",
                  isActive ? "bg-emerald-600" : "bg-emerald-500"
                )}>
                  {item.icon}
                </div>
              ) : (
                <>
                  {item.icon}
                  <span className="text-[10px] mt-1 font-medium">{item.label}</span>
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
