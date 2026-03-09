import React, { useState, useMemo, useEffect } from 'react';
import { InventoryItem, Recipe, MealPlan, ShoppingListItem, Category } from '../types';
import { Plus, Search, Trash2, CheckCircle2, Circle, Download, Upload, AlertCircle, ChevronDown, PackagePlus, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';
import { differenceInDays } from 'date-fns';

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
    <div className="flex flex-col h-full bg-gray-50 pb-24">
      {/* Header & Search */}
      <div className="bg-white p-4 shadow-sm z-10 sticky top-0">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Shopping List</h1>
          <div className="flex gap-2">
            <button onClick={() => setShowAddForm(!showAddForm)} className="p-2 bg-emerald-100 text-emerald-700 rounded-full hover:bg-emerald-200 transition-colors">
              <Plus size={20} />
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-100 border-transparent rounded-xl pl-10 pr-4 py-2 text-sm focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Add Item Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleAddItem}
              className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <h3 className="font-bold text-gray-900 mb-3">Add New Item</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Item name"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  required
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Qty (e.g., 1L, 2)"
                    value={newItemQuantity}
                    onChange={(e) => setNewItemQuantity(e.target.value)}
                    className="w-1/3 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value as Category)}
                    className="w-2/3 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none capitalize"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-2 rounded-xl hover:bg-emerald-700 transition-colors">
                  Add to List
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Suggested Restocks */}
        {suggestions.length > 0 && !searchQuery && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle size={18} className="text-orange-500" />
              <h2 className="font-bold text-gray-900">Suggested Restocks</h2>
            </div>
            <div className="flex overflow-x-auto pb-2 gap-3 snap-x">
              {suggestions.map((sug, idx) => (
                <div key={idx} className="flex-shrink-0 w-48 bg-orange-50 border border-orange-100 p-3 rounded-2xl snap-start">
                  <p className="font-bold text-gray-900 capitalize truncate">{sug.name}</p>
                  <p className="text-xs text-orange-600 mb-2">Need: {sug.quantity}</p>
                  <button 
                    onClick={() => handleAddSuggestion(sug)}
                    className="w-full bg-white text-orange-600 border border-orange-200 text-xs font-bold py-1.5 rounded-lg hover:bg-orange-100 transition-colors"
                  >
                    + Add to List
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Shopping List */}
        <div>
          <h2 className="font-bold text-gray-900 mb-3">To Buy</h2>
          {activeItems.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8 bg-white rounded-2xl border border-gray-100 border-dashed">
              Your shopping list is empty.
            </p>
          ) : (
            <div className="space-y-4">
              {CATEGORIES.map(category => {
                const itemsInCategory = groupedActiveItems[category];
                if (!itemsInCategory || itemsInCategory.length === 0) return null;

                return (
                  <div key={category} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-700 text-sm capitalize">{category}</h3>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {itemsInCategory.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-3 flex-1">
                            <button onClick={() => handleTogglePurchased(item)} className="text-gray-300 hover:text-emerald-500 transition-colors">
                              <Circle size={22} />
                            </button>
                            <div>
                              <p className="font-medium text-gray-900 capitalize">{item.name}</p>
                              <p className="text-xs text-gray-500">{item.quantity}</p>
                            </div>
                          </div>
                          <button onClick={() => handleDeleteItem(item.id)} className="text-gray-300 hover:text-red-500 p-2">
                            <Trash2 size={16} />
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
          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-bold text-gray-900">Purchased</h2>
              <button onClick={handleClearPurchased} className="text-xs text-red-500 font-medium hover:underline">
                Clear All
              </button>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
              {purchasedItems.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 opacity-60">
                  <div className="flex items-center gap-3">
                    <button onClick={() => handleTogglePurchased(item)} className="text-emerald-500">
                      <CheckCircle2 size={22} />
                    </button>
                    <p className="font-medium text-gray-500 line-through capitalize">{item.name}</p>
                  </div>
                  <button onClick={() => handleDeleteItem(item.id)} className="text-gray-300 hover:text-red-500 p-2">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Export/Import */}
        <div className="flex gap-2 pt-4 border-t border-gray-200">
          <button onClick={handleExport} className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 font-medium py-2 rounded-xl text-sm hover:bg-gray-50">
            <Download size={16} /> Export
          </button>
          <label className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 font-medium py-2 rounded-xl text-sm hover:bg-gray-50 cursor-pointer">
            <Upload size={16} /> Import
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>
      </div>

      {/* Purchased Action Prompt Modal */}
      <AnimatePresence>
        {showPurchasedPrompt && (
          <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-2">Item Purchased!</h3>
              <p className="text-gray-600 mb-6">How would you like to add <span className="font-bold capitalize">{showPurchasedPrompt.name}</span> to your inventory?</p>
              
              <div className="space-y-3">
                <button 
                  onClick={() => handleConfirmPurchaseAction('scan')}
                  className="w-full flex items-center gap-3 bg-emerald-50 border border-emerald-200 p-4 rounded-2xl hover:bg-emerald-100 transition-colors text-left"
                >
                  <div className="bg-emerald-100 p-2 rounded-full text-emerald-600">
                    <Camera size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-emerald-900">Scan Receipt Later</p>
                    <p className="text-xs text-emerald-700">I'll scan my receipt to add all items at once.</p>
                  </div>
                </button>

                <button 
                  onClick={() => handleConfirmPurchaseAction('quick')}
                  className="w-full flex items-center gap-3 bg-blue-50 border border-blue-200 p-4 rounded-2xl hover:bg-blue-100 transition-colors text-left"
                >
                  <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                    <PackagePlus size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-blue-900">Quick Add Now</p>
                    <p className="text-xs text-blue-700">Add directly to inventory with default expiry.</p>
                  </div>
                </button>

                <button 
                  onClick={() => handleConfirmPurchaseAction('just_mark')}
                  className="w-full text-center text-gray-500 font-medium py-2 hover:text-gray-700"
                >
                  Just mark as purchased
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ShoppingListView;
