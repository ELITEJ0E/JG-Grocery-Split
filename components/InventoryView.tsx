import React, { useState } from 'react';
import { InventoryItem, Category, MealPlan, Recipe } from '../types';
import { Search, Filter, Plus, Clock, Trash2, ChefHat, AlertCircle } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'motion/react';

interface InventoryViewProps {
  items: InventoryItem[];
  mealPlans: MealPlan[];
  recipes: Recipe[];
  onUpdateItem: (item: InventoryItem) => void;
  onDeleteItem: (id: string) => void;
}

const CATEGORY_COLORS: Record<Category, string> = {
  produce: 'bg-green-100 text-green-800 border-green-200',
  dairy: 'bg-blue-100 text-blue-800 border-blue-200',
  meat: 'bg-red-100 text-red-800 border-red-200',
  pantry: 'bg-amber-100 text-amber-800 border-amber-200',
  frozen: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  bakery: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  other: 'bg-gray-100 text-gray-800 border-gray-200',
};

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
    if (days < 0) return { label: 'Expired', color: 'text-red-600 bg-red-50', icon: '🚨' };
    if (days <= 2) return { label: `${days} days left`, color: 'text-orange-600 bg-orange-50', icon: '⚠️' };
    if (days <= 5) return { label: `${days} days left`, color: 'text-yellow-600 bg-yellow-50', icon: '⏳' };
    return { label: `${days} days left`, color: 'text-emerald-600 bg-emerald-50', icon: '✅' };
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 pb-24 relative">
      <div className="bg-white p-4 shadow-sm sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Inventory</h1>
        
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search ingredients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 border-transparent rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          <button
            onClick={() => setFilterCategory('all')}
            className={clsx(
              "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
              filterCategory === 'all' ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            All Items
          </button>
          {Object.keys(CATEGORY_COLORS).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat as Category)}
              className={clsx(
                "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap capitalize transition-colors",
                filterCategory === cat ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {expiringSoonItems.length > 0 && filterCategory === 'all' && search === '' && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-orange-600 uppercase tracking-wider mb-3 flex items-center gap-2">
              <AlertCircle size={16} /> Expiring Soon
            </h2>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
              {expiringSoonItems.map(item => (
                <div key={item.id} className="bg-orange-50 border border-orange-200 p-3 rounded-xl min-w-[160px] flex-shrink-0">
                  <h3 className="font-bold text-gray-900 capitalize truncate">{item.name}</h3>
                  <p className="text-xs text-gray-600 mb-2">{item.quantity} {item.unit}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onUpdateItem({ ...item, isUsed: true })}
                      className="flex-1 bg-emerald-500 text-white text-xs font-bold py-1.5 rounded hover:bg-emerald-600 transition-colors"
                    >
                      Use
                    </button>
                    <button
                      onClick={() => onDeleteItem(item.id)}
                      className="flex-1 bg-red-500 text-white text-xs font-bold py-1.5 rounded hover:bg-red-600 transition-colors"
                    >
                      Discard
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {filteredItems.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={24} className="text-gray-400" />
            </div>
            <p>No items found.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            <AnimatePresence>
              {filteredItems.map(item => {
                const status = getExpiryStatus(item.expiryDate);
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4"
                  >
                    <div className={clsx("w-12 h-12 rounded-xl flex items-center justify-center text-xl border flex-shrink-0", CATEGORY_COLORS[item.category])}>
                      {item.name.charAt(0).toUpperCase()}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate capitalize">{item.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <span>{item.quantity} {item.unit}</span>
                        <span>•</span>
                        <span className="capitalize">{item.category}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <div className={clsx("flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md", status.color)}>
                        <span>{status.icon}</span>
                        <span>{status.label}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => onUpdateItem({ ...item, isUsed: true })}
                          className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded hover:bg-emerald-100"
                        >
                          Use
                        </button>
                        <button
                          onClick={() => onDeleteItem(item.id)}
                          className="text-gray-400 hover:text-red-500 p-1"
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
