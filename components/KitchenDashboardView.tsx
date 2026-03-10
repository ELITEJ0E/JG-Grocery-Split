import React, { useState, useMemo } from 'react';
import { InventoryItem, Recipe, MealPlan } from '../types';
import { differenceInDays, parseISO, format, isSameDay } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertTriangle, 
  ChefHat, 
  Thermometer, 
  Snowflake, 
  Package, 
  Check, 
  Minus, 
  Plus, 
  X,
  Lightbulb,
  Droplets,
  Wind,
  Search
} from 'lucide-react';
import { getCategoryEmoji } from '../utils';
import { clsx } from 'clsx';

interface KitchenDashboardViewProps {
  items: InventoryItem[];
  recipes: Recipe[];
  mealPlans: MealPlan[];
  onUpdateItem: (item: InventoryItem) => void;
  onDeleteItem: (id: string) => void;
  onNavigate: (view: string) => void;
}

type StorageType = 'fridge' | 'freezer' | 'pantry';

const getStorageType = (item: InventoryItem): StorageType => {
  if (item.category === 'frozen') return 'freezer';
  if (item.category === 'dairy' || item.category === 'produce' || item.category === 'meat') return 'fridge';
  if (item.category === 'pantry' || item.category === 'bakery') return 'pantry';
  return 'pantry';
};

const getExpiryInfo = (expiryDate: string) => {
  const days = differenceInDays(parseISO(expiryDate), new Date());
  if (days < 0) return { 
    label: 'Expired', 
    badge: 'text-rose-600 bg-rose-100', 
    dot: 'bg-rose-500',
    status: 'expired' 
  };
  if (days <= 2) return { 
    label: `${days}d left`, 
    badge: 'text-amber-600 bg-amber-100', 
    dot: 'bg-amber-500',
    status: 'urgent' 
  };
  if (days <= 5) return { 
    label: `${days}d left`, 
    badge: 'text-yellow-600 bg-yellow-100', 
    dot: 'bg-yellow-500',
    status: 'moderate' 
  };
  return { 
    label: `Fresh`, 
    badge: 'text-emerald-600 bg-emerald-100', 
    dot: 'bg-emerald-500',
    status: 'fresh' 
  };
};

const getItemEmoji = (item: InventoryItem): string => {
  const name = item.name.toLowerCase();
  const emojiMap: Record<string, string> = {
    'milk': '🥛', 'egg': '🥚', 'cheese': '🧀', 'butter': '🧈',
    'yogurt': '🫙', 'yoghurt': '🫙', 'chicken': '🍗', 'beef': '🥩',
    'steak': '🥩', 'fish': '🐟', 'salmon': '🐟', 'tuna': '🐟',
    'shrimp': '🍤', 'prawn': '🍤', 'lettuce': '🥬', 'salad': '🥗',
    'tomato': '🍅', 'carrot': '🥕', 'broccoli': '🥦', 'onion': '🧅',
    'garlic': '🧄', 'potato': '🥔', 'apple': '🍎', 'banana': '🍌',
    'orange': '🍊', 'lemon': '🍋', 'strawberry': '🍓', 'grape': '🍇',
    'rice': '🍚', 'pasta': '🍝', 'noodle': '🍜', 'bread': '🍞',
    'bean': '🫘', 'lentil': '🫘', 'oil': '🫒', 'sauce': '🥫',
    'ketchup': '🥫', 'juice': '🧃', 'water': '💧', 'coffee': '☕',
    'tea': '🍵'
  };
  
  for (const [key, emoji] of Object.entries(emojiMap)) {
    if (name.includes(key)) return emoji;
  }
  return getCategoryEmoji(item.category);
};

interface ItemCardProps {
  item: InventoryItem;
  onUpdate: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
  isShelf?: boolean;
}

const ItemCard: React.FC<ItemCardProps> = ({ item, onUpdate, onDelete, isShelf = false }) => {
  const [expanded, setExpanded] = useState(false);
  const expiry = getExpiryInfo(item.expiryDate);
  const emoji = getItemEmoji(item);

  return (
    <>
      <motion.div
        layoutId={`card-${item.id}`}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setExpanded(true)}
        className={clsx(
          "rounded-xl p-3 cursor-pointer transition-all relative overflow-hidden group",
          isShelf 
            ? "bg-white/95 backdrop-blur-sm shadow-[0_4px_12px_rgba(0,0,0,0.02),inset_0_1px_2px_rgba(255,255,255,0.8)] border border-white/80" 
            : "bg-white p-4 rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.03)] border border-slate-100/50 hover:shadow-md"
        )}
      >
        {!isShelf && <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#4ADE80] to-[#38BDF8] opacity-50"></div>}
        
        {/* Condensation effect for fridge items */}
        {isShelf && (
          <>
            <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl from-white/40 to-transparent rounded-full blur-sm"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 bg-gradient-to-tr from-blue-50/30 to-transparent rounded-full blur-sm"></div>
          </>
        )}
        
        <div className={clsx(
          "text-3xl mb-2 w-10 h-10 flex items-center justify-center border shadow-inner",
          isShelf ? "bg-white/90 rounded-lg border-white/80" : "bg-slate-50 rounded-xl border-slate-100"
        )}>
          {emoji}
        </div>
        <p className={clsx(
          "font-bold capitalize leading-tight mb-1 truncate",
          isShelf ? "text-slate-800 text-sm" : "text-slate-800 text-base"
        )}>{item.name}</p>
        <p className={clsx(
          "font-medium mb-2",
          isShelf ? "text-xs text-slate-500" : "text-sm text-slate-500"
        )}>{item.quantity} {item.unit}</p>
        <div className={clsx(
          "inline-flex items-center gap-1.5 font-bold rounded-lg",
          isShelf ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1 rounded-xl",
          expiry.badge
        )}>
          <div className={clsx("w-1.5 h-1.5 rounded-full", expiry.dot)}></div>
          {expiry.label}
        </div>
      </motion.div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end justify-center p-4"
            onClick={() => setExpanded(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-[2rem] w-full max-w-sm p-6 shadow-2xl"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="text-4xl w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 shadow-inner">
                    {emoji}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-xl capitalize mb-1">{item.name}</h3>
                    <div className={clsx("inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-xl", expiry.badge)}>
                      <div className={clsx("w-1.5 h-1.5 rounded-full", expiry.dot)}></div>
                      {expiry.label}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setExpanded(false)} 
                  className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Quantity</span>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => {
                        if (item.quantity > 1) onUpdate({ ...item, quantity: item.quantity - 1 });
                      }}
                      className="w-8 h-8 bg-white rounded-full border border-slate-200 flex items-center justify-center shadow-sm hover:bg-slate-50 transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="font-extrabold text-slate-800 min-w-[60px] text-center">
                      {item.quantity} {item.unit}
                    </span>
                    <button
                      onClick={() => onUpdate({ ...item, quantity: item.quantity + 1 })}
                      className="w-8 h-8 bg-white rounded-full border border-slate-200 flex items-center justify-center shadow-sm hover:bg-slate-50 transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => { onUpdate({ ...item, isUsed: true }); setExpanded(false); }}
                  className="w-full bg-gradient-to-r from-[#4ADE80] to-[#38BDF8] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95"
                >
                  <Check size={18} strokeWidth={3} /> Mark as Used
                </button>
                <button
                  onClick={() => { onDelete(item.id); setExpanded(false); }}
                  className="w-full bg-rose-50 text-rose-600 border border-rose-100 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-rose-100 transition-all active:scale-95"
                >
                  Remove Item
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const KitchenDashboardView: React.FC<KitchenDashboardViewProps> = ({ 
  items, 
  recipes, 
  mealPlans, 
  onUpdateItem, 
  onDeleteItem, 
  onNavigate 
}) => {
  const [pantrySearch, setPantrySearch] = useState('');
  
  const activeItems = items.filter(i => !i.isUsed && !i.isWasted);

  const fridgeItems = activeItems.filter(i => getStorageType(i) === 'fridge');
  const freezerItems = activeItems.filter(i => getStorageType(i) === 'freezer');
  const pantryItems = activeItems.filter(i => getStorageType(i) === 'pantry');

  // Filter pantry items based on search
  const filteredPantryItems = useMemo(() => {
    if (!pantrySearch.trim()) return pantryItems;
    return pantryItems.filter(item => 
      item.name.toLowerCase().includes(pantrySearch.toLowerCase())
    );
  }, [pantryItems, pantrySearch]);

  // Group pantry items by category
  const groupedPantryItems = useMemo(() => {
    const groups: Record<string, InventoryItem[]> = {
      'Canned Goods': [],
      'Dry Pasta': [],
      'Baking Supplies': [],
      'Spices': [],
      'Other': []
    };

    filteredPantryItems.forEach(item => {
      const name = item.name.toLowerCase();
      if (name.includes('can') || name.includes('beans') || name.includes('soup') || name.includes('tuna') || name.includes('corn') || name.includes('tomato')) {
        groups['Canned Goods'].push(item);
      } else if (name.includes('pasta') || name.includes('spaghetti') || name.includes('noodle') || name.includes('macaroni') || name.includes('lasagna')) {
        groups['Dry Pasta'].push(item);
      } else if (name.includes('flour') || name.includes('sugar') || name.includes('baking') || name.includes('vanilla') || name.includes('chocolate') || name.includes('brownie') || name.includes('cake')) {
        groups['Baking Supplies'].push(item);
      } else if (name.includes('spice') || name.includes('pepper') || name.includes('salt') || name.includes('cumin') || name.includes('paprika') || name.includes('oregano') || name.includes('basil') || name.includes('thyme') || name.includes('garlic powder') || name.includes('onion powder')) {
        groups['Spices'].push(item);
      } else {
        groups['Other'].push(item);
      }
    });

    return groups;
  }, [filteredPantryItems]);

  const expiringSoon = activeItems
    .filter(i => {
      const days = differenceInDays(parseISO(i.expiryDate), new Date());
      return days <= 3 && days >= 0;
    })
    .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

  const cookableMeals = useMemo(() => {
    const inventoryNames = activeItems.map(i => i.name.toLowerCase());
    return recipes.filter(recipe => {
      const matched = recipe.ingredients.filter(ing =>
        inventoryNames.some(name => name.includes(ing.name.toLowerCase()) || ing.name.toLowerCase().includes(name))
      );
      return matched.length >= Math.ceil(recipe.ingredients.length * 0.6);
    }).slice(0, 4);
  }, [recipes, activeItems]);

  const todayMeals = mealPlans.filter(mp => isSameDay(parseISO(mp.date), new Date()));

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  // Fridge Shelf Component
  const FridgeShelf: React.FC<{
    items: InventoryItem[];
    shelfNumber: number;
    isFreezer?: boolean;
  }> = ({ items, shelfNumber, isFreezer }) => {
    // Split items into two columns for shelf display
    const leftItems = items.filter((_, i) => i % 2 === 0);
    const rightItems = items.filter((_, i) => i % 2 === 1);

    return (
      <div className="relative">
        {/* Shelf label with temperature indicator */}
        <div className="flex items-center gap-2 mb-2 px-1">
          <div className={clsx(
            "w-1 h-4 rounded-full",
            isFreezer ? "bg-blue-400" : "bg-[#38BDF8]"
          )}></div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {isFreezer ? 'Freezer Shelf' : 'Fridge Shelf'} {shelfNumber}
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent"></div>
        </div>

        {/* Shelf content */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {leftItems.map(item => (
            <ItemCard key={item.id} item={item} onUpdate={onUpdateItem} onDelete={onDeleteItem} isShelf={true} />
          ))}
          {rightItems.map(item => (
            <ItemCard key={item.id} item={item} onUpdate={onUpdateItem} onDelete={onDeleteItem} isShelf={true} />
          ))}
        </div>

        {/* Glass shelf with reflection effect */}
        <div className="relative h-6 mb-2">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
          <div className="absolute inset-x-4 top-0 h-3 bg-gradient-to-b from-white/60 via-white/20 to-transparent rounded-full blur-sm"></div>
          <div className="absolute inset-x-2 top-1 h-2 bg-gradient-to-b from-slate-200/30 to-transparent blur-sm"></div>
          {isFreezer && (
            <div className="absolute right-8 -top-1 text-blue-200/50 text-xs">❄️</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full pb-28 relative">
      {/* Header with InventoryView style - white/60 backdrop-blur */}
      <div className="bg-white/60 backdrop-blur-xl px-6 pt-8 pb-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] sticky top-0 z-10 rounded-b-3xl">
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-sm font-bold text-[#38BDF8] uppercase tracking-wider mb-1">
              {format(new Date(), 'EEEE, MMMM d')}
            </p>
            <h1 className="text-3xl font-extrabold text-[#1E293B] tracking-tight">
              {greeting} 👋
            </h1>
            <p className="text-slate-500 font-medium mt-1">
              Open the fridge, let's see what's inside
            </p>
          </div>
          
          {/* Pantry shortcut - matching InventoryView filter button style */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onNavigate('inventory')}
            className="bg-gradient-to-r from-[#4ADE80] to-[#38BDF8] text-white px-4 py-2 rounded-2xl font-bold text-sm shadow-md shadow-[#38BDF8]/20 flex items-center gap-2"
          >
            <Package size={20} />
            Pantry
          </motion.button>
        </div>

        {/* Quick Stats - matching InventoryView card style */}
        <div className="grid grid-cols-3 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-[#4ADE80] to-[#38BDF8] px-3 py-2">
              <Thermometer size={16} className="text-white" />
            </div>
            <div className="p-3">
              <span className="text-2xl font-black text-slate-800 block">{fridgeItems.length}</span>
              <p className="text-xs font-bold text-slate-600">In Fridge</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-2">
              <AlertTriangle size={16} className="text-white" />
            </div>
            <div className="p-3">
              <span className="text-2xl font-black text-slate-800 block">{expiringSoon.length}</span>
              <p className="text-xs font-bold text-slate-600">Expiring Soon</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-[#4ADE80] to-[#38BDF8] px-3 py-2">
              <ChefHat size={16} className="text-white" />
            </div>
            <div className="p-3">
              <span className="text-2xl font-black text-slate-800 block">{todayMeals.length}</span>
              <p className="text-xs font-bold text-slate-600">Today's Meals</p>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="flex-1 px-5 py-7 overflow-y-auto space-y-6">
        {/* Fridge Magnet Notes - matching InventoryView expiring section style */}
        <div className="grid grid-cols-2 gap-3">
          {/* Expiring Soon Note */}
          {expiringSoon.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-100/50 rounded-2xl p-4 shadow-sm relative overflow-hidden"
            >
              {/* Magnet effect */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-2 bg-gradient-to-r from-amber-400 to-orange-400 rounded-b-lg shadow-inner"></div>
              
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-amber-500 rounded-xl flex items-center justify-center shadow-sm">
                  <AlertTriangle size={14} className="text-white" />
                </div>
                <h3 className="font-extrabold text-slate-800 text-sm">Use Soon</h3>
              </div>
              
              <div className="space-y-1.5">
                {expiringSoon.slice(0, 3).map(item => (
                  <div key={item.id} className="flex items-center gap-2 text-xs bg-white/80 p-2 rounded-lg border border-amber-100">
                    <span>{getItemEmoji(item)}</span>
                    <span className="font-medium text-slate-700 flex-1 truncate">{item.name}</span>
                    <span className="text-amber-600 font-bold">
                      {differenceInDays(parseISO(item.expiryDate), new Date())}d
                    </span>
                  </div>
                ))}
                {expiringSoon.length > 3 && (
                  <p className="text-xs text-slate-400 text-center mt-1">+{expiringSoon.length - 3} more</p>
                )}
              </div>
            </motion.div>
          )}

          {/* Cook Today Note */}
          {cookableMeals.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-100/50 rounded-2xl p-4 shadow-sm relative overflow-hidden"
            >
              {/* Magnet effect */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-2 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-b-lg shadow-inner"></div>
              
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-gradient-to-r from-[#4ADE80] to-[#38BDF8] rounded-xl flex items-center justify-center shadow-sm">
                  <ChefHat size={14} className="text-white" />
                </div>
                <h3 className="font-extrabold text-slate-800 text-sm">Cook Today</h3>
              </div>
              
              <div className="space-y-1.5">
                {cookableMeals.slice(0, 3).map(recipe => (
                  <div key={recipe.id} className="text-xs bg-white/80 p-2 rounded-lg border border-blue-100 font-medium text-slate-700">
                    • {recipe.name}
                  </div>
                ))}
                {cookableMeals.length > 3 && (
                  <p className="text-xs text-slate-400 text-center mt-1">+{cookableMeals.length - 3} more</p>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* Main Fridge Container - Opened Door View */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          {/* Fridge exterior frame */}
          <div className="bg-gradient-to-b from-slate-200 to-slate-300 rounded-[2rem] p-2 shadow-xl">
            {/* Fridge door handle */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20">
              <div className="w-3 h-20 bg-gradient-to-b from-slate-300 to-slate-400 rounded-full shadow-lg border border-slate-200"></div>
            </div>
            
            {/* Fridge interior - white background */}
            <div className="bg-gradient-to-b from-white to-slate-50 rounded-2xl p-5 border-4 border-white shadow-inner relative overflow-hidden">
              {/* Interior light effect */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/80 via-white/40 to-transparent rounded-full blur-xl"></div>
              
              {/* Cooling vent effect */}
              <div className="absolute top-2 left-2 flex gap-0.5">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="w-1 h-4 bg-blue-200/30 rounded-full"></div>
                ))}
              </div>
              
              {/* Freezer Compartment (Top) */}
              <div className="mb-8 relative">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg relative">
                    <Snowflake size={16} className="text-white" />
                    <div className="absolute -top-1 -right-1 text-blue-200 text-[8px]">❄️</div>
                  </div>
                  <div>
                    <h2 className="font-extrabold text-slate-800 text-lg">Freezer</h2>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-blue-600 font-medium">-18°C</span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Wind size={10} /> frost free
                      </span>
                    </div>
                  </div>
                </div>

                {freezerItems.length === 0 ? (
                  <div className="bg-blue-50/50 rounded-xl p-6 text-center border-2 border-dashed border-blue-200">
                    <div className="text-4xl mb-2">❄️</div>
                    <p className="text-sm font-medium text-slate-600">Freezer is empty</p>
                    <p className="text-xs text-slate-400 mt-1">Perfect for ice cream!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {freezerItems.length > 0 && (
                      <FridgeShelf 
                        items={freezerItems.slice(0, Math.ceil(freezerItems.length / 2))} 
                        shelfNumber={1} 
                        isFreezer={true}
                      />
                    )}
                    {freezerItems.length > 2 && (
                      <FridgeShelf 
                        items={freezerItems.slice(Math.ceil(freezerItems.length / 2))} 
                        shelfNumber={2} 
                        isFreezer={true}
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Frost line divider */}
              <div className="relative my-4">
                <div className="absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-blue-100/30 to-transparent"></div>
                <div className="border-t-2 border-blue-200/30 border-dashed"></div>
                <div className="absolute left-1/2 -translate-x-1/2 -top-2 text-blue-300 text-xs bg-white/80 px-2 rounded-full">
                  ❄️ ⋯ ❄️
                </div>
              </div>

              {/* Fridge Compartment (Bottom) */}
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-[#4ADE80] to-[#38BDF8] rounded-xl flex items-center justify-center shadow-lg relative">
                    <Thermometer size={16} className="text-white" />
                    <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-white/60 rounded-full"></div>
                  </div>
                  <div>
                    <h2 className="font-extrabold text-slate-800 text-lg">Fridge</h2>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#38BDF8] font-medium">4°C</span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Droplets size={10} /> 45% humidity
                      </span>
                    </div>
                  </div>
                  <div className="ml-auto flex items-center gap-1 bg-amber-100/50 px-2 py-1 rounded-lg">
                    <Lightbulb size={12} className="text-amber-500" />
                    <span className="text-[10px] text-amber-700 font-medium">light on</span>
                  </div>
                </div>

                {fridgeItems.length === 0 ? (
                  <div className="bg-green-50/50 rounded-xl p-6 text-center border-2 border-dashed border-green-200">
                    <div className="text-4xl mb-2">🧊</div>
                    <p className="text-sm font-medium text-slate-600">Fridge is empty</p>
                    <p className="text-xs text-slate-400 mt-1">Time to go shopping</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {fridgeItems.length > 0 && (
                      <FridgeShelf 
                        items={fridgeItems.slice(0, Math.ceil(fridgeItems.length / 3))} 
                        shelfNumber={1} 
                      />
                    )}
                    {fridgeItems.length > 2 && (
                      <FridgeShelf 
                        items={fridgeItems.slice(Math.ceil(fridgeItems.length / 3), Math.ceil(2 * fridgeItems.length / 3))} 
                        shelfNumber={2} 
                      />
                    )}
                    {fridgeItems.length > 4 && (
                      <FridgeShelf 
                        items={fridgeItems.slice(Math.ceil(2 * fridgeItems.length / 3))} 
                        shelfNumber={3} 
                      />
                    )}
                  </div>
                )}

                {/* Crisper Drawer at bottom */}
                <div className="mt-4 pt-3 border-t border-slate-200">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-6 bg-slate-200 rounded-lg flex items-center justify-center">
                      <span className="text-xs">🥕</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500">Crisper Drawer</span>
                        <span className="text-[10px] text-slate-400">high humidity</span>
                      </div>
                      <div className="w-12 h-1 bg-slate-300 rounded-full mt-1"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Pantry Cabinet - Modern design with search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 relative"
        >
          {/* Cabinet exterior - light wooden frame */}
          <div className="bg-gradient-to-b from-amber-100 to-amber-200 rounded-2xl p-3 shadow-xl border border-amber-300">
            {/* Cabinet door handles - modern style */}
            <div className="absolute right-6 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-6">
              <div className="w-2 h-16 bg-amber-400 rounded-full shadow-md border border-amber-500"></div>
              <div className="w-2 h-16 bg-amber-400 rounded-full shadow-md border border-amber-500"></div>
            </div>
            
            {/* Cabinet interior - white modern interior */}
            <div className="bg-white rounded-xl p-5 border border-amber-200 shadow-inner relative">
              {/* Subtle interior shadow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-50/50 to-transparent rounded-full blur-xl"></div>

              {/* Cabinet header with search */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center">
                      <Package size={18} className="text-white" />
                    </div>
                    <h3 className="font-bold text-amber-900 text-lg">Pantry</h3>
                  </div>
                  <span className="text-xs font-medium text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
                    {filteredPantryItems.length} items
                  </span>
                </div>
                
                {/* Search bar - exactly like in the picture */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search Pantry"
                    value={pantrySearch}
                    onChange={(e) => setPantrySearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-amber-50/80 border border-amber-200 rounded-xl focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all outline-none text-amber-900 placeholder:text-amber-400 text-sm"
                  />
                </div>
              </div>

              {/* Cabinet shelves with categories */}
              {Object.entries(groupedPantryItems).map(([category, items]) => {
                if (items.length === 0 && category !== 'Other') return null;
                
                // Split items into two columns for display
                const leftItems = items.filter((_, i) => i % 2 === 0);
                const rightItems = items.filter((_, i) => i % 2 === 1);

                return (
                  <div key={category} className="mb-5 last:mb-0">
                    {/* Category header */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1 h-5 bg-amber-500 rounded-full"></div>
                      <span className="text-sm font-bold text-amber-800">{category}</span>
                      <span className="text-xs text-amber-500 ml-auto">{items.length} items</span>
                    </div>

                    {/* Category items grid */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {/* Left column */}
                      <div className="space-y-2">
                        {leftItems.map(item => (
                          <ItemCard key={item.id} item={item} onUpdate={onUpdateItem} onDelete={onDeleteItem} />
                        ))}
                      </div>
                      {/* Right column */}
                      <div className="space-y-2">
                        {rightItems.map(item => (
                          <ItemCard key={item.id} item={item} onUpdate={onUpdateItem} onDelete={onDeleteItem} />
                        ))}
                      </div>
                    </div>

                    {/* Shelf line - only if not last category */}
                    {category !== 'Other' && items.length > 0 && (
                      <div className="relative h-4 mb-2">
                        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-amber-300 to-transparent"></div>
                        <div className="absolute left-1/2 -translate-x-1/2 -top-1 w-12 h-2 bg-amber-200/50 rounded-full"></div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Empty state */}
              {filteredPantryItems.length === 0 && (
                <div className="text-center py-10">
                  <div className="bg-amber-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl">🥫</span>
                  </div>
                  <p className="font-medium text-amber-800">No items found</p>
                  <p className="text-sm text-amber-500 mt-1">
                    {pantrySearch ? 'Try a different search' : 'Your pantry is empty'}
                  </p>
                </div>
              )}

              {/* Bottom drawer */}
              <div className="mt-5 pt-3 border-t-2 border-amber-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center border border-amber-300">
                    <span className="text-sm">📦</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-amber-700">Bottom Shelf</span>
                      <span className="text-[10px] text-amber-500">bulk storage</span>
                    </div>
                    {/* Drawer handle */}
                    <div className="w-20 h-1.5 bg-amber-300 rounded-full mt-2"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default KitchenDashboardView;