import React, { useState, useMemo, useRef } from 'react';
import { InventoryItem, Recipe, MealPlan, RecipeIngredient } from '../types';
import { Plus, Search, Calendar, BookOpen, Download, Upload, Trash2, Edit2, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, addDays, parseISO, isSameDay } from 'date-fns';
import { clsx } from 'clsx';

interface MealPlannerViewProps {
  recipes: Recipe[];
  mealPlans: MealPlan[];
  inventory: InventoryItem[];
  onAddRecipe: (recipe: Recipe) => void;
  onUpdateRecipe: (recipe: Recipe) => void;
  onDeleteRecipe: (id: string) => void;
  onAddMealPlan: (mealPlan: MealPlan) => void;
  onUpdateMealPlan: (mealPlan: MealPlan) => void;
  onDeleteMealPlan: (id: string) => void;
  onUpdateInventory: (items: InventoryItem[]) => void;
}

const MealPlannerView: React.FC<MealPlannerViewProps> = ({
  recipes,
  mealPlans,
  inventory,
  onAddRecipe,
  onUpdateRecipe,
  onDeleteRecipe,
  onAddMealPlan,
  onUpdateMealPlan,
  onDeleteMealPlan,
  onUpdateInventory,
}) => {
  const [activeTab, setActiveTab] = useState<'plan' | 'recipes'>('plan');
  
  // Recipe State
  const [searchRecipe, setSearchRecipe] = useState('');
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Meal Plan State
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  // Form States
  const [recipeForm, setRecipeForm] = useState<Partial<Recipe>>({ ingredients: [] });
  const [planForm, setPlanForm] = useState<{ recipeId: string; date: string; assignedItems: { ingredientIndex: number; inventoryItemId: string; quantity: number }[] }>({
    recipeId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    assignedItems: []
  });

  // --- Recipes Logic ---
  const filteredRecipes = useMemo(() => {
    return recipes.filter(r => 
      r.name.toLowerCase().includes(searchRecipe.toLowerCase()) ||
      r.category?.toLowerCase().includes(searchRecipe.toLowerCase()) ||
      r.ingredients.some(i => i.name.toLowerCase().includes(searchRecipe.toLowerCase()))
    );
  }, [recipes, searchRecipe]);

  const handleSaveRecipe = () => {
    if (!recipeForm.name) return alert('Recipe name is required');
    if (!recipeForm.ingredients || recipeForm.ingredients.length === 0) return alert('Add at least one ingredient');

    if (editingRecipe) {
      onUpdateRecipe({ ...editingRecipe, ...recipeForm } as Recipe);
    } else {
      onAddRecipe({
        id: crypto.randomUUID(),
        name: recipeForm.name,
        ingredients: recipeForm.ingredients,
        notes: recipeForm.notes,
        category: recipeForm.category,
        isFavorite: false,
      });
    }
    setIsRecipeModalOpen(false);
    setEditingRecipe(null);
    setRecipeForm({ ingredients: [] });
  };

  const handleExportRecipes = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(recipes));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "recipes.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportRecipes = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        if (Array.isArray(imported)) {
          // Basic validation
          const validRecipes = imported.filter(r => r.id && r.name && Array.isArray(r.ingredients));
          validRecipes.forEach(r => {
            if (!recipes.some(existing => existing.id === r.id)) {
              onAddRecipe(r);
            }
          });
          alert(`Imported ${validRecipes.length} recipes successfully.`);
        }
      } catch (err) {
        alert('Invalid JSON file.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- Meal Plan Logic ---
  const days = Array.from({ length: 7 }).map((_, i) => addDays(new Date(), i));

  const handleSaveMealPlan = () => {
    if (!planForm.recipeId) return alert('Select a recipe');
    
    // Deduct from inventory
    const updatedInventory = [...inventory];
    const assignedItemsForPlan: { inventoryItemId: string; quantity: number }[] = [];

    for (const assignment of planForm.assignedItems) {
      if (assignment.inventoryItemId && assignment.quantity > 0) {
        const itemIndex = updatedInventory.findIndex(i => i.id === assignment.inventoryItemId);
        if (itemIndex >= 0) {
          const item = updatedInventory[itemIndex];
          if (item.quantity < assignment.quantity) {
            return alert(`Not enough ${item.name} in inventory!`);
          }
          updatedInventory[itemIndex] = { ...item, quantity: item.quantity - assignment.quantity };
          if (updatedInventory[itemIndex].quantity === 0) {
            updatedInventory[itemIndex].isUsed = true;
          }
          assignedItemsForPlan.push({ inventoryItemId: assignment.inventoryItemId, quantity: assignment.quantity });
        }
      }
    }

    onUpdateInventory(updatedInventory);
    onAddMealPlan({
      id: crypto.randomUUID(),
      date: planForm.date,
      recipeId: planForm.recipeId,
      assignedItems: assignedItemsForPlan,
    });

    setIsPlanModalOpen(false);
    setPlanForm({ recipeId: '', date: format(new Date(), 'yyyy-MM-dd'), assignedItems: [] });
  };

  const handleDeletePlan = (plan: MealPlan) => {
    // Restore inventory
    const updatedInventory = [...inventory];
    plan.assignedItems.forEach(assignment => {
      const itemIndex = updatedInventory.findIndex(i => i.id === assignment.inventoryItemId);
      if (itemIndex >= 0) {
        updatedInventory[itemIndex] = { 
          ...updatedInventory[itemIndex], 
          quantity: updatedInventory[itemIndex].quantity + assignment.quantity,
          isUsed: false 
        };
      }
    });
    onUpdateInventory(updatedInventory);
    onDeleteMealPlan(plan.id);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 pb-24 relative">
      <div className="bg-white p-4 shadow-sm sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Planner</h1>
        
        <div className="flex bg-gray-100 p-1 rounded-xl mb-2">
          <button
            onClick={() => setActiveTab('plan')}
            className={clsx(
              "flex-1 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2",
              activeTab === 'plan' ? "bg-white text-emerald-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            <Calendar size={18} /> Meal Plan
          </button>
          <button
            onClick={() => setActiveTab('recipes')}
            className={clsx(
              "flex-1 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2",
              activeTab === 'recipes' ? "bg-white text-emerald-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            <BookOpen size={18} /> Recipes
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'recipes' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search recipes..."
                  value={searchRecipe}
                  onChange={(e) => setSearchRecipe(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
                />
              </div>
              <button
                onClick={() => {
                  setEditingRecipe(null);
                  setRecipeForm({ ingredients: [] });
                  setIsRecipeModalOpen(true);
                }}
                className="bg-emerald-600 text-white p-2 rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center"
              >
                <Plus size={24} />
              </button>
            </div>

            <div className="flex gap-2">
              <button onClick={handleExportRecipes} className="flex-1 bg-white border border-gray-200 text-gray-700 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-gray-50">
                <Download size={16} /> Export
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="flex-1 bg-white border border-gray-200 text-gray-700 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-gray-50">
                <Upload size={16} /> Import
              </button>
              <input type="file" accept=".json" ref={fileInputRef} onChange={handleImportRecipes} className="hidden" />
            </div>

            <div className="grid gap-3">
              {filteredRecipes.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <BookOpen size={32} className="mx-auto mb-3 text-gray-300" />
                  <p>No recipes found.</p>
                </div>
              ) : (
                filteredRecipes.map(recipe => (
                  <div key={recipe.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{recipe.name}</h3>
                        {recipe.category && <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md mt-1 inline-block">{recipe.category}</span>}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingRecipe(recipe); setRecipeForm(recipe); setIsRecipeModalOpen(true); }} className="text-gray-400 hover:text-blue-500"><Edit2 size={18} /></button>
                        <button onClick={() => onDeleteRecipe(recipe.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={18} /></button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{recipe.notes}</p>
                    <div className="text-xs text-gray-500">
                      <span className="font-semibold">Ingredients:</span> {recipe.ingredients.map(i => i.name).join(', ')}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'plan' && (
          <div className="space-y-6">
            {days.map(day => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const dayPlans = mealPlans.filter(mp => mp.date === dateStr);
              
              return (
                <div key={dateStr} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-gray-900">{format(day, 'EEEE')}</span>
                      <span className="text-sm text-gray-500 ml-2">{format(day, 'MMM d')}</span>
                    </div>
                    <button 
                      onClick={() => {
                        setSelectedDate(dateStr);
                        setPlanForm({ recipeId: '', date: dateStr, assignedItems: [] });
                        setIsPlanModalOpen(true);
                      }}
                      className="text-emerald-600 hover:bg-emerald-50 p-1 rounded-full transition-colors"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                  <div className="p-4">
                    {dayPlans.length === 0 ? (
                      <p className="text-sm text-gray-400 italic text-center py-2">No meals planned</p>
                    ) : (
                      <div className="space-y-3">
                        {dayPlans.map(plan => {
                          const recipe = recipes.find(r => r.id === plan.recipeId);
                          return (
                            <div key={plan.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                              <div>
                                <h4 className="font-semibold text-gray-900">{recipe?.name || 'Unknown Recipe'}</h4>
                                {plan.assignedItems.length > 0 && (
                                  <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                                    <CheckCircle2 size={12} /> {plan.assignedItems.length} ingredients assigned
                                  </p>
                                )}
                              </div>
                              <button onClick={() => handleDeletePlan(plan)} className="text-gray-400 hover:text-red-500 p-2">
                                <Trash2 size={18} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recipe Modal */}
      <AnimatePresence>
        {isRecipeModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-md shadow-xl flex flex-col max-h-[90vh]"
            >
              <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">{editingRecipe ? 'Edit Recipe' : 'Add Recipe'}</h3>
                <button onClick={() => setIsRecipeModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-4 overflow-y-auto flex-1 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recipe Name *</label>
                  <input
                    type="text"
                    value={recipeForm.name || ''}
                    onChange={(e) => setRecipeForm({ ...recipeForm, name: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
                    placeholder="e.g., Spaghetti Bolognese"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={recipeForm.category || ''}
                    onChange={(e) => setRecipeForm({ ...recipeForm, category: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
                    placeholder="e.g., Dinner, Pasta"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">Ingredients *</label>
                    <button 
                      onClick={() => setRecipeForm({ ...recipeForm, ingredients: [...(recipeForm.ingredients || []), { name: '', quantity: 1, unit: 'pcs' }] })}
                      className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md hover:bg-emerald-100"
                    >
                      + Add Item
                    </button>
                  </div>
                  <div className="space-y-2">
                    {recipeForm.ingredients?.map((ing, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={ing.name}
                          onChange={(e) => {
                            const newIngs = [...(recipeForm.ingredients || [])];
                            newIngs[idx].name = e.target.value;
                            setRecipeForm({ ...recipeForm, ingredients: newIngs });
                          }}
                          placeholder="Name"
                          className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:border-emerald-500 outline-none"
                        />
                        <input
                          type="number"
                          value={ing.quantity}
                          onChange={(e) => {
                            const newIngs = [...(recipeForm.ingredients || [])];
                            newIngs[idx].quantity = parseFloat(e.target.value);
                            setRecipeForm({ ...recipeForm, ingredients: newIngs });
                          }}
                          className="w-20 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:border-emerald-500 outline-none"
                        />
                        <input
                          type="text"
                          value={ing.unit}
                          onChange={(e) => {
                            const newIngs = [...(recipeForm.ingredients || [])];
                            newIngs[idx].unit = e.target.value;
                            setRecipeForm({ ...recipeForm, ingredients: newIngs });
                          }}
                          placeholder="Unit"
                          className="w-20 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:border-emerald-500 outline-none"
                        />
                        <button 
                          onClick={() => {
                            const newIngs = [...(recipeForm.ingredients || [])];
                            newIngs.splice(idx, 1);
                            setRecipeForm({ ...recipeForm, ingredients: newIngs });
                          }}
                          className="text-gray-400 hover:text-red-500 p-1"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                    {recipeForm.ingredients?.length === 0 && (
                      <p className="text-xs text-gray-500 italic">No ingredients added.</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes / Instructions</label>
                  <textarea
                    value={recipeForm.notes || ''}
                    onChange={(e) => setRecipeForm({ ...recipeForm, notes: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none min-h-[100px]"
                    placeholder="Preparation steps..."
                  />
                </div>
              </div>

              <div className="p-4 border-t border-gray-100">
                <button
                  onClick={handleSaveRecipe}
                  className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition-colors"
                >
                  Save Recipe
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Plan Meal Modal */}
      <AnimatePresence>
        {isPlanModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-md shadow-xl flex flex-col max-h-[90vh]"
            >
              <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">Plan Meal</h3>
                <button onClick={() => setIsPlanModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-4 overflow-y-auto flex-1 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Recipe</label>
                  <select
                    value={planForm.recipeId}
                    onChange={(e) => {
                      const rId = e.target.value;
                      const recipe = recipes.find(r => r.id === rId);
                      setPlanForm({ 
                        ...planForm, 
                        recipeId: rId,
                        assignedItems: recipe ? recipe.ingredients.map((_, idx) => ({ ingredientIndex: idx, inventoryItemId: '', quantity: 0 })) : []
                      });
                    }}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
                  >
                    <option value="">-- Choose a recipe --</option>
                    {recipes.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                {planForm.recipeId && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Assign Inventory Items</h4>
                    <div className="space-y-4">
                      {recipes.find(r => r.id === planForm.recipeId)?.ingredients.map((ing, idx) => {
                        const assignment = planForm.assignedItems.find(a => a.ingredientIndex === idx);
                        const activeInventory = inventory.filter(i => !i.isUsed && !i.isWasted);
                        
                        return (
                          <div key={idx} className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium text-sm text-gray-800">{ing.name}</span>
                              <span className="text-xs text-gray-500">{ing.quantity} {ing.unit} needed</span>
                            </div>
                            <div className="flex gap-2">
                              <select
                                value={assignment?.inventoryItemId || ''}
                                onChange={(e) => {
                                  const newAssignments = [...planForm.assignedItems];
                                  const aIdx = newAssignments.findIndex(a => a.ingredientIndex === idx);
                                  if (aIdx >= 0) {
                                    newAssignments[aIdx].inventoryItemId = e.target.value;
                                    // Auto-fill quantity if an item is selected
                                    if (e.target.value) {
                                      const invItem = inventory.find(i => i.id === e.target.value);
                                      newAssignments[aIdx].quantity = Math.min(ing.quantity, invItem?.quantity || 0);
                                    } else {
                                      newAssignments[aIdx].quantity = 0;
                                    }
                                  }
                                  setPlanForm({ ...planForm, assignedItems: newAssignments });
                                }}
                                className="flex-1 bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none"
                              >
                                <option value="">-- Select Inventory --</option>
                                {activeInventory.map(item => (
                                  <option key={item.id} value={item.id}>
                                    {item.name} ({item.quantity} {item.unit} avail)
                                  </option>
                                ))}
                              </select>
                              {assignment?.inventoryItemId && (
                                <input
                                  type="number"
                                  min="0.1"
                                  step="0.1"
                                  value={assignment.quantity || ''}
                                  onChange={(e) => {
                                    const newAssignments = [...planForm.assignedItems];
                                    const aIdx = newAssignments.findIndex(a => a.ingredientIndex === idx);
                                    if (aIdx >= 0) {
                                      newAssignments[aIdx].quantity = parseFloat(e.target.value) || 0;
                                    }
                                    setPlanForm({ ...planForm, assignedItems: newAssignments });
                                  }}
                                  className="w-20 bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none"
                                  placeholder="Qty"
                                />
                              )}
                            </div>
                            {assignment?.inventoryItemId && assignment.quantity > (inventory.find(i => i.id === assignment.inventoryItemId)?.quantity || 0) && (
                              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                <AlertCircle size={12} /> Exceeds available stock!
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-gray-100">
                <button
                  onClick={handleSaveMealPlan}
                  disabled={!planForm.recipeId}
                  className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save to Plan
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MealPlannerView;
