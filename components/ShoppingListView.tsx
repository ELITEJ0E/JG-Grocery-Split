import React, { useState, useMemo, useEffect } from 'react';
import { InventoryItem, Recipe, MealPlan, ShoppingListItem, Category } from '../types';
import { Plus, Search, Trash2, CheckCircle2, Circle, Download, Upload, AlertCircle, ChevronDown, PackagePlus, Camera, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { differenceInDays } from 'date-fns';
import { getCategoryEmoji } from '../utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface ShoppingListViewProps {
  inventory: InventoryItem[];
  recipes: Recipe[];
  mealPlans: MealPlan[];
  shoppingList: ShoppingListItem[];
  onUpdateShoppingList: (list: ShoppingListItem[]) => void;
  onAddToInventory: (item: Partial<InventoryItem>) => void;
  onNavigateToScan: () => void;
}

const CATEGORIES: Category[] = ['produce', 'dairy', 'meat', 'pantry', 'frozen', 'bakery', 'other'];

const ShoppingListView: React.FC<ShoppingListViewProps> = ({
  inventory,
  recipes,
  mealPlans,
  shoppingList,
  onUpdateShoppingList,
  onAddToInventory,
  onNavigateToScan
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<Category>('other');
  const [newItemQuantity, setNewItemQuantity] = useState('1');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPurchasedPrompt, setShowPurchasedPrompt] = useState<ShoppingListItem | null>(null);

  // Generate suggestions based on inventory and meal plans
  const suggestions = useMemo(() => {
    const suggestedItems: Omit<ShoppingListItem, 'id'>[] = [];

    // 1. Low Inventory (Items that are marked as used/wasted or quantity <= 0)
    inventory.forEach(item => {
      if (item.isUsed || item.isWasted || item.quantity <= 0) {
        suggestedItems.push({
          name: item.name,
          category: item.category,
          quantity: '1',
          purchased: false,
          suggested: true
        });
      }
    });

    // 2. Expiring Soon (<= 3 days)
    const today = new Date();
    inventory.forEach(item => {
      if (!item.isUsed && !item.isWasted && item.quantity > 0) {
        const daysToExpiry = differenceInDays(new Date(item.expiryDate), today);
        if (daysToExpiry >= 0 && daysToExpiry <= 3) {
          suggestedItems.push({
            name: item.name,
            category: item.category,
            quantity: '1',
            purchased: false,
            suggested: true
          });
        }
      }
    });

    // 3. Missing Ingredients for Recipes
    // Calculate total required ingredients
    const requiredIngredients: Record<string, { quantity: number, unit: string }> = {};
    mealPlans.forEach(plan => {
      const recipe = recipes.find(r => r.id === plan.recipeId);
      if (recipe) {
        recipe.ingredients.forEach(ing => {
          const key = ing.name.toLowerCase();
          if (!requiredIngredients[key]) {
            requiredIngredients[key] = { quantity: 0, unit: ing.unit };
          }
          requiredIngredients[key].quantity += ing.quantity;
        });
      }
    });

    // Calculate available inventory
    const availableInventory: Record<string, number> = {};
    inventory.forEach(item => {
      if (!item.isUsed && !item.isWasted) {
        const key = item.name.toLowerCase();
        if (!availableInventory[key]) {
          availableInventory[key] = 0;
        }
        availableInventory[key] += item.quantity;
      }
    });

    // Compare and suggest
    Object.entries(requiredIngredients).forEach(([name, req]) => {
      const available = availableInventory[name] || 0;
      if (available < req.quantity) {
        suggestedItems.push({
          name: name,
          category: 'other', // Default category for recipe ingredients if unknown
          quantity: `${req.quantity - available} ${req.unit}`,
          purchased: false,
          suggested: true
        });
      }
    });

    // Deduplicate suggestions and filter out items already in the shopping list
    const uniqueSuggestions = suggestedItems.filter((item, index, self) =>
      index === self.findIndex((t) => t.name.toLowerCase() === item.name.toLowerCase())
    );

    return uniqueSuggestions.filter(sug => 
      !shoppingList.some(item => item.name.toLowerCase() === sug.name.toLowerCase() && !item.purchased)
    );
  }, [inventory, recipes, mealPlans, shoppingList]);

  const handleAddItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newItemName.trim()) return;

    const newItem: ShoppingListItem = {
      id: crypto.randomUUID(),
      name: newItemName.trim(),
      category: newItemCategory,
      quantity: newItemQuantity,
      purchased: false
    };

    onUpdateShoppingList([...shoppingList, newItem]);
    setNewItemName('');
    setNewItemQuantity('1');
    setShowAddForm(false);
  };

  const handleAddSuggestion = (suggestion: Omit<ShoppingListItem, 'id'>) => {
    const newItem: ShoppingListItem = {
      ...suggestion,
      id: crypto.randomUUID()
    };
    onUpdateShoppingList([...shoppingList, newItem]);
  };

  const handleTogglePurchased = (item: ShoppingListItem) => {
    if (!item.purchased) {
      setShowPurchasedPrompt(item);
    } else {
      // Uncheck
      onUpdateShoppingList(shoppingList.map(i => i.id === item.id ? { ...i, purchased: false } : i));
    }
  };

  const handleConfirmPurchaseAction = (action: 'scan' | 'quick' | 'just_mark') => {
    if (!showPurchasedPrompt) return;
    
    const updatedList = shoppingList.map(i => 
      i.id === showPurchasedPrompt.id ? { ...i, purchased: true } : i
    );
    onUpdateShoppingList(updatedList);

    if (action === 'quick') {
      onAddToInventory({
        name: showPurchasedPrompt.name,
        category: showPurchasedPrompt.category,
        quantity: parseFloat(showPurchasedPrompt.quantity) || 1,
        unit: showPurchasedPrompt.quantity.replace(/[0-9.]/g, '').trim() || 'pcs',
        unitPrice: 0,
        shelfLifeDays: 7
      });
    } else if (action === 'scan') {
      onNavigateToScan();
    }
    
    setShowPurchasedPrompt(null);
  };

  const handleDeleteItem = (id: string) => {
    onUpdateShoppingList(shoppingList.filter(item => item.id !== id));
  };

  const handleClearPurchased = () => {
    onUpdateShoppingList(shoppingList.filter(item => !item.purchased));
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(shoppingList, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "shopping_list.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedList = JSON.parse(event.target?.result as string);
          if (Array.isArray(importedList)) {
            onUpdateShoppingList(importedList);
          }
        } catch (error) {
          console.error("Error parsing JSON", error);
          alert("Invalid JSON file");
        }
      };
      reader.readAsText(file);
    }
  };

  const filteredList = shoppingList.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeItems = filteredList.filter(item => !item.purchased);
  const purchasedItems = filteredList.filter(item => item.purchased);

  // Group active items by category
  const groupedActiveItems = activeItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<Category, ShoppingListItem[]>);

  return (
    <div className="flex flex-col h-full pb-24 relative">
      {/* Header & Search */}
      <div className="bg-white/60 backdrop-blur-xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] sticky top-0 z-10 rounded-b-3xl">
        <div className="flex justify-between items-center mb-5">
          <h1 className="text-3xl font-extrabold text-[#1E293B] tracking-tight">Shopping 🛒</h1>
          <button 
            onClick={() => setShowAddForm(!showAddForm)} 
            className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-[#4ADE80] to-[#38BDF8] text-white rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-95"
          >
            <Plus size={24} />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-100 shadow-sm rounded-2xl focus:bg-white focus:border-[#38BDF8] focus:ring-4 focus:ring-[#38BDF8]/10 transition-all outline-none text-slate-700 font-medium placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Add Item Form */}
        {showAddForm && (
          <form
            onSubmit={handleAddItem}
            className="bg-white p-5 rounded-3xl shadow-md border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          >
              <h3 className="font-bold text-slate-800 mb-4 text-lg">Add New Item</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Item name"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:border-[#38BDF8] focus:ring-2 focus:ring-[#38BDF8]/20 outline-none transition-all"
                  required
                />
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Qty"
                    value={newItemQuantity}
                    onChange={(e) => setNewItemQuantity(e.target.value)}
                    className="w-1/3 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:border-[#38BDF8] focus:ring-2 focus:ring-[#38BDF8]/20 outline-none transition-all"
                  />
                  <div className="w-2/3">
                    <Select
                      value={newItemCategory}
                      onValueChange={(value) => setNewItemCategory(value as Category)}
                    >
                      <SelectTrigger className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:border-[#38BDF8] focus:ring-2 focus:ring-[#38BDF8]/20 outline-none transition-all capitalize h-auto">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(cat => (
                          <SelectItem key={cat} value={cat} className="capitalize">{getCategoryEmoji(cat)} {cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <button type="submit" className="w-full bg-gradient-to-r from-[#4ADE80] to-[#38BDF8] text-white font-bold py-3.5 rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-95">
                  Add to List
                </button>
              </div>
            </form>
          )}

        {/* Suggested Restocks */}
        {suggestions.length > 0 && !searchQuery && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle size={20} className="text-amber-500" />
              <h2 className="font-bold text-slate-800 text-lg">Suggested Restocks</h2>
            </div>
            <div className="flex overflow-x-auto pb-4 gap-4 snap-x no-scrollbar">
              {suggestions.map((sug, idx) => (
                <div 
                  key={idx} 
                  className="flex-shrink-0 w-48 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100/50 p-4 rounded-3xl snap-start shadow-sm transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="text-2xl mb-2">{getCategoryEmoji(sug.category)}</div>
                  <p className="font-bold text-slate-800 capitalize truncate text-lg">{sug.name}</p>
                  <p className="text-sm font-medium text-amber-600 mb-3">Need: {sug.quantity}</p>
                  <button 
                    onClick={() => handleAddSuggestion(sug)}
                    className="w-full bg-white text-amber-600 border border-amber-200 text-sm font-bold py-2 rounded-xl hover:bg-amber-50 transition-colors shadow-sm"
                  >
                    + Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Shopping List */}
        <div>
          <h2 className="font-bold text-slate-800 text-lg mb-4">To Buy</h2>
          {activeItems.length === 0 ? (
            <div className="text-center py-12 bg-white/50 rounded-3xl border border-slate-200 border-dashed">
              <div className="text-4xl mb-3">🛒</div>
              <p className="text-slate-500 font-medium">Your shopping list is empty.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {CATEGORIES.map(category => {
                const itemsInCategory = groupedActiveItems[category];
                if (!itemsInCategory || itemsInCategory.length === 0) return null;

                return (
                  <div key={category} className="bg-white rounded-3xl shadow-[0_4px_15px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden">
                    <div className="bg-slate-50/80 px-5 py-3 border-b border-slate-100 flex items-center gap-2">
                      <span className="text-xl">{getCategoryEmoji(category)}</span>
                      <h3 className="font-bold text-slate-700 capitalize">{category}</h3>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {itemsInCategory.map(item => (
                        <div 
                          key={item.id} 
                          className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group animate-in fade-in slide-in-from-bottom-2 duration-300"
                        >
                          <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => handleTogglePurchased(item)}>
                            <div className="w-6 h-6 rounded-full border-2 border-slate-300 flex items-center justify-center group-hover:border-[#38BDF8] transition-colors">
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 capitalize text-lg leading-tight">{item.name}</p>
                              <p className="text-sm font-medium text-slate-500">{item.quantity}</p>
                            </div>
                          </div>
                          <button onClick={() => handleDeleteItem(item.id)} className="text-slate-300 hover:text-rose-500 p-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Purchased Items */}
        {purchasedItems.length > 0 && (
          <div className="pt-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-slate-800 text-lg">Purchased</h2>
              <button onClick={handleClearPurchased} className="text-sm text-rose-500 font-bold hover:underline bg-rose-50 px-3 py-1 rounded-lg">
                Clear All
              </button>
            </div>
            <div className="bg-white/60 rounded-3xl shadow-sm border border-slate-100 divide-y divide-slate-50">
              {purchasedItems.map(item => (
                <div 
                  key={item.id} 
                  className="flex items-center justify-between p-4 opacity-60 hover:opacity-100 transition-opacity animate-in fade-in slide-in-from-top-2 duration-300"
                >
                  <div className="flex items-center gap-4 cursor-pointer" onClick={() => handleTogglePurchased(item)}>
                    <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-sm">
                      <Check size={14} strokeWidth={3} />
                    </div>
                    <p className="font-bold text-slate-500 line-through capitalize text-lg">{item.name}</p>
                  </div>
                  <button onClick={() => handleDeleteItem(item.id)} className="text-slate-300 hover:text-rose-500 p-2">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Export/Import */}
        <div className="flex gap-3 pt-6 border-t border-slate-200/60">
          <button onClick={handleExport} className="flex-1 flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-600 font-bold py-3 rounded-2xl text-sm hover:bg-slate-50 shadow-sm transition-all active:scale-95">
            <Download size={18} /> Export
          </button>
          <label className="flex-1 flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-600 font-bold py-3 rounded-2xl text-sm hover:bg-slate-50 cursor-pointer shadow-sm transition-all active:scale-95">
            <Upload size={18} /> Import
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>
      </div>

      {/* Purchased Action Prompt Modal */}
      {showPurchasedPrompt && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-200">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-500 mb-6 mx-auto">
                <Check size={32} strokeWidth={3} />
              </div>
              <h3 className="text-2xl font-extrabold text-slate-800 mb-2 text-center">Got it!</h3>
              <p className="text-slate-500 mb-8 text-center font-medium">How would you like to add <span className="font-bold text-slate-800 capitalize">{showPurchasedPrompt.name}</span> to your inventory?</p>
              
              <div className="space-y-3">
                <button 
                  onClick={() => handleConfirmPurchaseAction('scan')}
                  className="w-full flex items-center gap-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 p-4 rounded-2xl hover:shadow-md transition-all text-left group"
                >
                  <div className="bg-white p-3 rounded-xl text-emerald-500 shadow-sm group-hover:scale-110 transition-transform">
                    <Camera size={22} />
                  </div>
                  <div>
                    <p className="font-bold text-emerald-900 text-lg">Scan Receipt Later</p>
                    <p className="text-xs font-medium text-emerald-600/80">I'll scan my receipt to add all items.</p>
                  </div>
                </button>

                <button 
                  onClick={() => handleConfirmPurchaseAction('quick')}
                  className="w-full flex items-center gap-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100 p-4 rounded-2xl hover:shadow-md transition-all text-left group"
                >
                  <div className="bg-white p-3 rounded-xl text-blue-500 shadow-sm group-hover:scale-110 transition-transform">
                    <PackagePlus size={22} />
                  </div>
                  <div>
                    <p className="font-bold text-blue-900 text-lg">Quick Add Now</p>
                    <p className="text-xs font-medium text-blue-600/80">Add directly with default expiry.</p>
                  </div>
                </button>

                <button 
                  onClick={() => handleConfirmPurchaseAction('just_mark')}
                  className="w-full text-center text-slate-400 font-bold py-3 hover:text-slate-600 transition-colors mt-2"
                >
                  Just mark as purchased
                </button>
              </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShoppingListView;
