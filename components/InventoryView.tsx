import React, { useState } from 'react';
import { InventoryItem, Category, MealPlan, Recipe } from '../types';
import { Search, Trash2, AlertCircle, Check } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'motion/react';
import { getCategoryEmoji, getCategoryColor } from '../utils';

interface InventoryViewProps {
  items: InventoryItem[];
  mealPlans: MealPlan[];
  recipes: Recipe[];
  onUpdateItem: (item: InventoryItem) => void;
  onDeleteItem: (id: string) => void;
}

const CATEGORIES: Category[] = ['produce', 'dairy', 'meat', 'pantry', 'frozen', 'bakery', 'other'];

const InventoryView: React.FC<InventoryViewProps> = ({ items, mealPlans, recipes, onUpdateItem, onDeleteItem }) => {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<Category | 'all'>('all');

  const activeItems = items.filter(item => !item.isUsed && !item.isWasted);

  const filteredItems = activeItems
    .filter(item => item.name.toLowerCase().includes(search.toLowerCase()))
    .filter(item => filterCategory === 'all' || item.category === filterCategory)
    .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

  const expiringSoonItems = activeItems.filter(item => {
    const days = differenceInDays(parseISO(item.expiryDate), new Date());
    return days <= 3 && days >= 0;
  });

  const getExpiryStatus = (expiryDate: string) => {
    const days = differenceInDays(parseISO(expiryDate), new Date());
    if (days < 0) return { label: 'Expired', color: 'text-rose-600 bg-rose-100', dot: 'bg-rose-500' };
    if (days <= 2) return { label: `Expires in ${days}d`, color: 'text-amber-600 bg-amber-100', dot: 'bg-amber-500' };
    if (days <= 5) return { label: `Expires in ${days}d`, color: 'text-yellow-600 bg-yellow-100', dot: 'bg-yellow-500' };
    return { label: `Fresh (${days}d)`, color: 'text-emerald-600 bg-emerald-100', dot: 'bg-emerald-500' };
  };

  return (
    <div className="flex flex-col h-full pb-24 relative">
      <div className="bg-white/60 backdrop-blur-xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] sticky top-0 z-10 rounded-b-3xl">
        <h1 className="text-3xl font-extrabold text-[#1E293B] mb-5 tracking-tight">My Pantry 📦</h1>
        
        <div className="relative mb-5">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search ingredients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-100 shadow-sm rounded-2xl focus:bg-white focus:border-[#38BDF8] focus:ring-4 focus:ring-[#38BDF8]/10 transition-all outline-none text-slate-700 font-medium placeholder:text-slate-400"
          />
        </div>

        <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setFilterCategory('all')}
            className={clsx(
              "px-5 py-2 rounded-2xl text-sm font-bold whitespace-nowrap transition-all duration-300 shadow-sm",
              filterCategory === 'all' 
                ? "bg-gradient-to-r from-[#4ADE80] to-[#38BDF8] text-white shadow-md shadow-[#38BDF8]/20 scale-105" 
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-100"
            )}
          >
            All Items
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={clsx(
                "px-4 py-2 rounded-2xl text-sm font-bold whitespace-nowrap capitalize transition-all duration-300 flex items-center gap-2 shadow-sm",
                filterCategory === cat 
                  ? "bg-gradient-to-r from-[#4ADE80] to-[#38BDF8] text-white shadow-md shadow-[#38BDF8]/20 scale-105" 
                  : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-100"
              )}
            >
              <span>{getCategoryEmoji(cat)}</span>
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {expiringSoonItems.length > 0 && filterCategory === 'all' && search === '' && (
          <div className="mb-8">
            <h2 className="text-sm font-bold text-amber-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <AlertCircle size={18} /> Use Soon
            </h2>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 snap-x">
              {expiringSoonItems.map(item => (
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  key={item.id} 
                  className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100/50 p-4 rounded-3xl min-w-[180px] flex-shrink-0 snap-start shadow-sm"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-3xl bg-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm">
                      {getCategoryEmoji(item.category)}
                    </div>
                    <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-1 rounded-lg">
                      {differenceInDays(parseISO(item.expiryDate), new Date())}d left
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-800 capitalize truncate text-lg">{item.name}</h3>
                  <p className="text-sm font-medium text-slate-500 mb-4">{item.quantity} {item.unit}</p>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => onUpdateItem({ ...item, isUsed: true })}
                      className="flex-1 bg-white text-emerald-600 border border-emerald-100 text-sm font-bold py-2 rounded-xl hover:bg-emerald-50 transition-colors flex items-center justify-center gap-1 shadow-sm"
                    >
                      <Check size={16} /> Use
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {filteredItems.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm border border-slate-100">
              <span className="text-4xl">🍃</span>
            </div>
            <p className="font-medium text-lg text-slate-500">All fresh and empty!</p>
            <p className="text-sm mt-1">Time to scan some groceries.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            <AnimatePresence>
              {filteredItems.map(item => {
                const status = getExpiryStatus(item.expiryDate);
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, x: -20 }}
                    whileHover={{ scale: 1.01 }}
                    className="bg-white p-4 rounded-3xl shadow-[0_4px_15px_rgba(0,0,0,0.03)] border border-slate-100/50 flex items-center gap-4 relative overflow-hidden group"
                  >
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[#4ADE80] to-[#38BDF8] opacity-50"></div>
                    
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl bg-slate-50 border border-slate-100 flex-shrink-0 shadow-inner">
                      {getCategoryEmoji(item.category)}
                    </div>
                    
                    <div className="flex-1 min-w-0 py-1">
                      <h3 className="font-bold text-slate-800 truncate capitalize text-lg leading-tight mb-1">{item.name}</h3>
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                        <span className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-600">{item.quantity} {item.unit}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3 flex-shrink-0">
                      <div className={clsx("flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-xl", status.color)}>
                        <div className={clsx("w-1.5 h-1.5 rounded-full", status.dot)}></div>
                        {status.label}
                      </div>
                      <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onUpdateItem({ ...item, isUsed: true })}
                          className="w-8 h-8 flex items-center justify-center text-emerald-600 bg-emerald-50 rounded-full hover:bg-emerald-100 transition-colors"
                          title="Mark as used"
                        >
                          <Check size={16} strokeWidth={3} />
                        </button>
                        <button
                          onClick={() => onDeleteItem(item.id)}
                          className="w-8 h-8 flex items-center justify-center text-rose-400 bg-rose-50 rounded-full hover:bg-rose-100 hover:text-rose-600 transition-colors"
                          title="Discard"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryView;
