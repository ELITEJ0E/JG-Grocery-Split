import React, { useState, useMemo, useRef } from 'react';
import { InventoryItem, Recipe, MealPlan, RecipeIngredient } from '../types';
import { Plus, Search, Calendar, BookOpen, Download, Upload, Trash2, Edit2, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { format, addDays, parseISO, isSameDay } from 'date-fns';
import { clsx } from 'clsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

import Sheet from './ui/Sheet';

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
    <div className="flex flex-col h-full pb-24 relative">
      <div className="bg-white/60 backdrop-blur-xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] sticky top-0 z-10 rounded-b-3xl">
        <h1 className="text-3xl font-extrabold text-[#1E293B] mb-5 tracking-tight">Recipes 🍳</h1>
        
        <div className="flex bg-slate-100/80 p-1.5 rounded-2xl mb-2 shadow-inner">
          <button
            onClick={() => setActiveTab('plan')}
            className={clsx(
              "flex-1 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2",
              activeTab === 'plan' ? "bg-white text-[#38BDF8] shadow-sm scale-100" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 scale-95"
            )}
          >
            <Calendar size={18} /> Meal Plan
          </button>
          <button
            onClick={() => setActiveTab('recipes')}
            className={clsx(
              "flex-1 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2",
              activeTab === 'recipes' ? "bg-white text-[#4ADE80] shadow-sm scale-100" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 scale-95"
            )}
          >
            <BookOpen size={18} /> Recipes
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'recipes' && (
          <div className="space-y-6 animate-spring-slide-left">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  placeholder="Search recipes..."
                  value={searchRecipe}
                  onChange={(e) => setSearchRecipe(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-100 shadow-sm rounded-2xl focus:bg-white focus:border-[#4ADE80] focus:ring-4 focus:ring-[#4ADE80]/10 transition-all outline-none text-slate-700 font-medium placeholder:text-slate-400"
                />
              </div>
              <button
                onClick={() => {
                  setEditingRecipe(null);
                  setRecipeForm({ ingredients: [] });
                  setIsRecipeModalOpen(true);
                }}
                className="w-14 bg-gradient-to-br from-[#4ADE80] to-[#38BDF8] text-white rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center active:scale-95"
              >
                <Plus size={24} />
              </button>
            </div>

            <div className="flex gap-3">
              <button onClick={handleExportRecipes} className="flex-1 bg-white border border-slate-100 text-slate-600 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-50 shadow-sm transition-all active:scale-95">
                <Download size={18} /> Export
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="flex-1 bg-white border border-slate-100 text-slate-600 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-50 shadow-sm transition-all active:scale-95">
                <Upload size={18} /> Import
              </button>
              <input type="file" accept=".json" ref={fileInputRef} onChange={handleImportRecipes} className="hidden" />
            </div>

            <div className="grid gap-4">
              {filteredRecipes.length === 0 ? (
                <div className="text-center py-16 text-slate-400 bg-white/50 rounded-3xl border border-slate-200 border-dashed">
                  <BookOpen size={48} className="mx-auto mb-4 text-slate-300" />
                  <p className="font-medium text-lg text-slate-500">No recipes found.</p>
                  <p className="text-sm mt-1">Add your favorite recipes to get started!</p>
                </div>
              ) : (
                filteredRecipes.map(recipe => (
                  <div 
                    key={recipe.id} 
                    className="bg-white p-5 rounded-3xl shadow-[0_4px_15px_rgba(0,0,0,0.03)] border border-slate-100 group transition-transform duration-200 hover:scale-[1.01]"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-slate-800 text-xl leading-tight">{recipe.name}</h3>
                        {recipe.category && <span className="text-xs font-bold text-[#38BDF8] bg-[#38BDF8]/10 px-2.5 py-1 rounded-xl mt-2 inline-block capitalize">{recipe.category}</span>}
                      </div>
                      <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditingRecipe(recipe); setRecipeForm(recipe); setIsRecipeModalOpen(true); }} className="w-8 h-8 flex items-center justify-center text-slate-400 bg-slate-50 rounded-full hover:bg-blue-50 hover:text-blue-500 transition-colors"><Edit2 size={16} /></button>
                        <button onClick={() => onDeleteRecipe(recipe.id)} className="w-8 h-8 flex items-center justify-center text-slate-400 bg-slate-50 rounded-full hover:bg-rose-50 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </div>
                    {recipe.notes && <p className="text-sm text-slate-500 mb-4 line-clamp-2 leading-relaxed">{recipe.notes}</p>}
                    <div className="bg-slate-50 p-3 rounded-2xl">
                      <span className="text-xs font-bold text-slate-700 mb-1 block">Ingredients:</span>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {recipe.ingredients.map(i => i.name).join(', ')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'plan' && (
          <div className="space-y-6 animate-spring-slide-right">
            {days.map(day => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const dayPlans = mealPlans.filter(mp => mp.date === dateStr);
              const isToday = isSameDay(day, new Date());
              
              return (
                <div key={dateStr} className={clsx(
                  "bg-white rounded-3xl shadow-[0_4px_15px_rgba(0,0,0,0.03)] border overflow-hidden transition-all",
                  isToday ? "border-[#4ADE80]/30 shadow-[#4ADE80]/10" : "border-slate-100"
                )}>
                  <div className={clsx(
                    "px-5 py-4 border-b flex justify-between items-center",
                    isToday ? "bg-gradient-to-r from-[#4ADE80]/10 to-transparent border-[#4ADE80]/20" : "bg-slate-50/80 border-slate-100"
                  )}>
                    <div className="flex items-baseline gap-2">
                      <span className={clsx("font-extrabold text-lg", isToday ? "text-[#4ADE80]" : "text-slate-800")}>
                        {isToday ? 'Today' : format(day, 'EEEE')}
                      </span>
                      <span className="text-sm font-medium text-slate-500">{format(day, 'MMM d')}</span>
                    </div>
                    <button 
                      onClick={() => {
                        setSelectedDate(dateStr);
                        setPlanForm({ recipeId: '', date: dateStr, assignedItems: [] });
                        setIsPlanModalOpen(true);
                      }}
                      className={clsx(
                        "w-8 h-8 flex items-center justify-center rounded-full transition-colors",
                        isToday ? "bg-[#4ADE80] text-white shadow-sm" : "bg-white text-[#38BDF8] border border-slate-200 hover:border-[#38BDF8] hover:bg-[#38BDF8]/5"
                      )}
                    >
                      <Plus size={18} strokeWidth={3} />
                    </button>
                  </div>
                  <div className="p-5">
                    {dayPlans.length === 0 ? (
                      <p className="text-sm text-slate-400 italic text-center py-3">No meals planned</p>
                    ) : (
                      <div className="space-y-3">
                        {dayPlans.map(plan => {
                          const recipe = recipes.find(r => r.id === plan.recipeId);
                          return (
                            <div key={plan.id} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100 group">
                              <div>
                                <h4 className="font-bold text-slate-800 text-lg">{recipe?.name || 'Unknown Recipe'}</h4>
                                {plan.assignedItems.length > 0 && (
                                  <p className="text-xs font-bold text-[#4ADE80] mt-1.5 flex items-center gap-1.5 bg-[#4ADE80]/10 inline-flex px-2 py-1 rounded-lg">
                                    <CheckCircle2 size={14} /> {plan.assignedItems.length} ingredients ready
                                  </p>
                                )}
                              </div>
                              <button onClick={() => handleDeletePlan(plan)} className="w-8 h-8 flex items-center justify-center text-slate-300 bg-white rounded-full hover:bg-rose-50 hover:text-rose-500 transition-colors shadow-sm">
                                <Trash2 size={16} />
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

      {/* Recipe Sheet */}
      <Sheet
        isOpen={isRecipeModalOpen}
        onClose={() => setIsRecipeModalOpen(false)}
        title={editingRecipe ? 'Edit Recipe 📝' : 'New Recipe ✨'}
      >
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Recipe Name *</label>
            <input
              type="text"
              value={recipeForm.name || ''}
              onChange={(e) => setRecipeForm({ ...recipeForm, name: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 focus:border-[#4ADE80] focus:ring-4 focus:ring-[#4ADE80]/10 outline-none transition-all font-medium text-slate-800"
              placeholder="e.g., Avocado Toast"
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Category</label>
            <input
              type="text"
              value={recipeForm.category || ''}
              onChange={(e) => setRecipeForm({ ...recipeForm, category: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 focus:border-[#4ADE80] focus:ring-4 focus:ring-[#4ADE80]/10 outline-none transition-all font-medium text-slate-800"
              placeholder="e.g., Breakfast, Healthy"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-bold text-slate-700">Ingredients *</label>
              <button 
                onClick={() => setRecipeForm({ ...recipeForm, ingredients: [...(recipeForm.ingredients || []), { name: '', quantity: 1, unit: 'pcs' }] })}
                className="text-xs font-bold text-[#38BDF8] bg-[#38BDF8]/10 px-3 py-1.5 rounded-xl hover:bg-[#38BDF8]/20 transition-colors flex items-center gap-1"
              >
                <Plus size={14} /> Add Item
              </button>
            </div>
            <div className="space-y-3">
              {recipeForm.ingredients?.map((ing, idx) => (
                <div key={idx} className="flex gap-2 items-center bg-slate-50 p-2 rounded-2xl border border-slate-100">
                  <input
                    type="text"
                    value={ing.name}
                    onChange={(e) => {
                      const newIngs = [...(recipeForm.ingredients || [])];
                      newIngs[idx].name = e.target.value;
                      setRecipeForm({ ...recipeForm, ingredients: newIngs });
                    }}
                    placeholder="Name"
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:border-[#4ADE80] outline-none font-medium"
                  />
                  <input
                    type="number"
                    value={ing.quantity}
                    onChange={(e) => {
                      const newIngs = [...(recipeForm.ingredients || [])];
                      newIngs[idx].quantity = parseFloat(e.target.value);
                      setRecipeForm({ ...recipeForm, ingredients: newIngs });
                    }}
                    className="w-20 bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:border-[#4ADE80] outline-none font-medium"
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
                    className="w-20 bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:border-[#4ADE80] outline-none font-medium"
                  />
                  <button 
                    onClick={() => {
                      const newIngs = [...(recipeForm.ingredients || [])];
                      newIngs.splice(idx, 1);
                      setRecipeForm({ ...recipeForm, ingredients: newIngs });
                    }}
                    className="w-8 h-8 flex items-center justify-center text-slate-400 bg-white rounded-full hover:bg-rose-50 hover:text-rose-500 transition-colors shadow-sm"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              {recipeForm.ingredients?.length === 0 && (
                <div className="text-center py-6 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                  <p className="text-sm text-slate-500 font-medium">No ingredients added yet.</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Notes / Instructions</label>
            <textarea
              value={recipeForm.notes || ''}
              onChange={(e) => setRecipeForm({ ...recipeForm, notes: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 focus:border-[#4ADE80] focus:ring-4 focus:ring-[#4ADE80]/10 outline-none transition-all font-medium text-slate-800 min-h-[120px] resize-none"
              placeholder="Preparation steps..."
            />
          </div>
          
          <button
            onClick={handleSaveRecipe}
            className="w-full bg-gradient-to-r from-[#4ADE80] to-[#38BDF8] text-white font-bold py-4 rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-95 text-lg"
          >
            Save Recipe
          </button>
        </div>
      </Sheet>

      {/* Plan Meal Sheet */}
      <Sheet
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        title="Plan Meal 📅"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Select Recipe</label>
            <Select
              value={planForm.recipeId}
              onValueChange={(value) => {
                const recipe = recipes.find(r => r.id === value);
                setPlanForm({ 
                  ...planForm, 
                  recipeId: value,
                  assignedItems: recipe ? recipe.ingredients.map((_, idx) => ({ ingredientIndex: idx, inventoryItemId: '', quantity: 0 })) : []
                });
              }}
            >
              <SelectTrigger className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 focus:border-[#4ADE80] focus:ring-4 focus:ring-[#4ADE80]/10 outline-none transition-all font-medium text-slate-800 h-auto">
                <SelectValue placeholder="-- Choose a recipe --" />
              </SelectTrigger>
              <SelectContent>
                {recipes.map(r => (
                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {planForm.recipeId && (
            <div>
              <h4 className="text-sm font-bold text-slate-800 mb-3">Assign Inventory Items</h4>
              <div className="space-y-3">
                {recipes.find(r => r.id === planForm.recipeId)?.ingredients.map((ing, idx) => {
                  const assignment = planForm.assignedItems.find(a => a.ingredientIndex === idx);
                  const activeInventory = inventory.filter(i => !i.isUsed && !i.isWasted);
                  
                  return (
                    <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-bold text-slate-800">{ing.name}</span>
                        <span className="text-xs font-bold text-[#38BDF8] bg-[#38BDF8]/10 px-2 py-1 rounded-lg">{ing.quantity} {ing.unit} needed</span>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Select
                            value={assignment?.inventoryItemId || ''}
                            onValueChange={(value) => {
                              const newAssignments = [...planForm.assignedItems];
                              const aIdx = newAssignments.findIndex(a => a.ingredientIndex === idx);
                              if (aIdx >= 0) {
                                newAssignments[aIdx].inventoryItemId = value;
                                // Auto-fill quantity if an item is selected
                                if (value) {
                                  const invItem = inventory.find(i => i.id === value);
                                  newAssignments[aIdx].quantity = Math.min(ing.quantity, invItem?.quantity || 0);
                                } else {
                                  newAssignments[aIdx].quantity = 0;
                                }
                              }
                              setPlanForm({ ...planForm, assignedItems: newAssignments });
                            }}
                          >
                            <SelectTrigger className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#4ADE80] font-medium h-auto">
                              <SelectValue placeholder="-- Select Inventory --" />
                            </SelectTrigger>
                            <SelectContent>
                              {activeInventory.map(item => (
                                <SelectItem key={item.id} value={item.id}>
                                  {item.name} ({item.quantity} {item.unit} avail)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
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
                            className="w-20 bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#4ADE80] font-medium"
                            placeholder="Qty"
                          />
                        )}
                      </div>
                      {assignment?.inventoryItemId && assignment.quantity > (inventory.find(i => i.id === assignment.inventoryItemId)?.quantity || 0) && (
                        <p className="text-xs font-bold text-rose-500 mt-2 flex items-center gap-1 bg-rose-50 p-2 rounded-lg">
                          <AlertCircle size={14} /> Exceeds available stock!
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          <button
            onClick={handleSaveMealPlan}
            disabled={!planForm.recipeId}
            className="w-full bg-gradient-to-r from-[#4ADE80] to-[#38BDF8] text-white font-bold py-4 rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
          >
            Save to Plan
          </button>
        </div>
      </Sheet>
    </div>
  );
};

export default MealPlannerView;
