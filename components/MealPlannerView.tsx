import React, { useState, useMemo, useRef } from 'react';
import CalendarComponent from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { InventoryItem, Recipe, MealPlan, RecipeIngredient, MealLog } from '../types';
import { ToastType } from './ui/Toast';
import { Plus, Search, Calendar, BookOpen, Trash2, Edit2, AlertCircle, CheckCircle2, X, FileText, Copy, ClipboardPaste } from 'lucide-react';
import { format, addDays, parseISO, isSameDay } from 'date-fns';
import { clsx } from 'clsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { exportRecipesToText, parseRecipesFromText } from '../importExportUtils';

import Sheet from './ui/Sheet';

interface MealPlannerViewProps {
  recipes: Recipe[];
  mealPlans: MealPlan[];
  inventory: InventoryItem[];
  mealLogs?: MealLog[];
  onAddRecipe: (recipe: Recipe) => void;
  onUpdateRecipe: (recipe: Recipe) => void;
  onDeleteRecipe: (id: string) => void;
  onAddMealPlan: (mealPlan: MealPlan) => void;
  onUpdateMealPlan: (mealPlan: MealPlan) => void;
  onDeleteMealPlan: (id: string) => void;
  onUpdateInventory: (items: InventoryItem[]) => void;
  onAddMealLog?: (mealLog: MealLog) => void;
  onUpdateMealLog?: (mealLog: MealLog) => void;
  onDeleteMealLog?: (id: string) => void;
  onShowToast?: (message: string, type?: ToastType) => void;
}

const MealPlannerView: React.FC<MealPlannerViewProps> = ({
  recipes,
  mealPlans,
  inventory,
  mealLogs = [],
  onAddRecipe,
  onUpdateRecipe,
  onDeleteRecipe,
  onAddMealPlan,
  onUpdateMealPlan,
  onDeleteMealPlan,
  onUpdateInventory,
  onAddMealLog,
  onUpdateMealLog,
  onDeleteMealLog,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'plan' | 'recipes' | 'logs'>('plan');
  
  // Recipe State
  const [searchRecipe, setSearchRecipe] = useState('');
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [isTextImportExportOpen, setIsTextImportExportOpen] = useState(false);
  const [textData, setTextData] = useState('');
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);

  // Meal Plan State
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

  // Meal Log State
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<MealLog | null>(null);
  const [logForm, setLogForm] = useState<Partial<MealLog>>({ ingredients: [] });

  // Form States
  const [recipeForm, setRecipeForm] = useState<Partial<Recipe>>({ ingredients: [] });
  const [planForm, setPlanForm] = useState<{ recipeId: string; date: string; servings: number; assignedItems: { ingredientIndex: number; inventoryItemId: string; quantity: number }[] }>({
    recipeId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    servings: 1,
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
    if (!recipeForm.name) {
      if (onShowToast) onShowToast('Recipe name is required', 'error');
      else alert('Recipe name is required');
      return;
    }
    if (!recipeForm.ingredients || recipeForm.ingredients.length === 0) {
      if (onShowToast) onShowToast('Add at least one ingredient', 'error');
      else alert('Add at least one ingredient');
      return;
    }

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

  const handleTextExport = () => {
    const text = exportRecipesToText(recipes);
    setTextData(text);
    setIsTextImportExportOpen(true);
  };

  const handleTextImport = () => {
    const imported = parseRecipesFromText(textData);
    if (imported.length === 0) {
      if (onShowToast) onShowToast('No valid recipes found in text.', 'error');
      else alert('No valid recipes found in text.');
      return;
    }
    
    imported.forEach(r => {
      onAddRecipe({
        id: crypto.randomUUID(),
        name: r.name || 'Unnamed Recipe',
        ingredients: r.ingredients || [],
        notes: r.notes,
        category: r.category,
        isFavorite: false,
      });
    });
    
    if (onShowToast) onShowToast(`Imported ${imported.length} recipes successfully!`, 'success');
    else alert(`Imported ${imported.length} recipes successfully.`);
    setIsTextImportExportOpen(false);
    setTextData('');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(textData);
    if (onShowToast) onShowToast('Copied to clipboard!', 'success');
    else alert('Copied to clipboard!');
  };

  // --- Meal Plan Logic ---
  const days = Array.from({ length: 7 }).map((_, i) => addDays(new Date(), i));

  const handleSaveMealPlan = () => {
    if (!planForm.recipeId) {
      if (onShowToast) onShowToast('Select a recipe', 'error');
      else alert('Select a recipe');
      return;
    }
    
    // Deduct from inventory
    const updatedInventory = [...inventory];
    const assignedItemsForPlan: { inventoryItemId: string; quantity: number }[] = [];
    let totalCost = 0;
    const ingredientsUsed: MealLog['ingredients'] = [];

    for (const assignment of planForm.assignedItems) {
      if (assignment.inventoryItemId && assignment.quantity > 0) {
        const itemIndex = updatedInventory.findIndex(i => i.id === assignment.inventoryItemId);
        if (itemIndex >= 0) {
          const item = updatedInventory[itemIndex];
          
          const cost = item.unitPrice * assignment.quantity;
          totalCost += cost;
          ingredientsUsed.push({
            name: item.name,
            quantity: assignment.quantity,
            unit: item.unit,
            cost: cost
          });

          updatedInventory[itemIndex] = { ...item, quantity: Math.max(0, item.quantity - assignment.quantity) };
          if (updatedInventory[itemIndex].quantity === 0) {
            updatedInventory[itemIndex].isUsed = true;
          }
          assignedItemsForPlan.push({ inventoryItemId: assignment.inventoryItemId, quantity: assignment.quantity });
        }
      }
    }

    const recipe = recipes.find(r => r.id === planForm.recipeId);
    let mealLogId: string | undefined;
    if (recipe && ingredientsUsed.length > 0 && onAddMealLog) {
      mealLogId = crypto.randomUUID();
      onAddMealLog({
        id: mealLogId,
        recipeId: recipe.id,
        recipeName: recipe.name,
        date: planForm.date,
        cost: totalCost,
        ingredients: ingredientsUsed
      });
    }

    onUpdateInventory(updatedInventory);
    onAddMealPlan({
      id: crypto.randomUUID(),
      date: planForm.date,
      recipeId: planForm.recipeId,
      mealLogId,
      servings: planForm.servings,
      assignedItems: assignedItemsForPlan,
    });

    setIsPlanModalOpen(false);
    setPlanForm({ recipeId: '', date: format(new Date(), 'yyyy-MM-dd'), servings: 1, assignedItems: [] });
  };

  const handleSaveLog = () => {
    if (!logForm.recipeName || !logForm.date) {
      if (onShowToast) onShowToast('Please fill in name and date', 'error');
      else alert('Please fill in name and date');
      return;
    }

    if (editingLog && onUpdateMealLog) {
      onUpdateMealLog({ ...editingLog, ...logForm } as MealLog);
    } else if (!editingLog && onAddMealLog) {
      onAddMealLog({
        id: crypto.randomUUID(),
        recipeName: logForm.recipeName,
        date: logForm.date,
        cost: logForm.cost || 0,
        ingredients: logForm.ingredients || []
      });
    }
    setIsLogModalOpen(false);
    setEditingLog(null);
    setLogForm({ ingredients: [] });
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
    if (plan.mealLogId && onDeleteMealLog) {
      onDeleteMealLog(plan.mealLogId);
    }
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
            <Calendar size={18} /> Plan
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
          <button
            onClick={() => setActiveTab('logs')}
            className={clsx(
              "flex-1 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2",
              activeTab === 'logs' ? "bg-white text-indigo-500 shadow-sm scale-100" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 scale-95"
            )}
          >
            <FileText size={18} /> Logs
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

            <div className="flex flex-wrap gap-3">
              <button onClick={handleTextExport} className="w-full bg-white border border-slate-100 text-[#4ADE80] py-3.5 rounded-2xl text-lg font-bold flex items-center justify-center gap-3 shadow-sm hover:bg-slate-50 transition-all active:scale-95">
                <FileText size={22} className="text-[#4ADE80]" /> WhatsApp / Notes Format
              </button>
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
                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                  {plan.assignedItems.length > 0 && (
                                    <span className="text-xs font-bold text-[#4ADE80] flex items-center gap-1.5 bg-[#4ADE80]/10 px-2 py-1 rounded-lg">
                                      <CheckCircle2 size={14} /> {plan.assignedItems.length} ingredients ready
                                    </span>
                                  )}
                                  {plan.servings && plan.servings > 1 && (
                                    <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                                      {plan.servings} servings
                                    </span>
                                  )}
                                  {(() => {
                                    const log = plan.mealLogId ? mealLogs.find(l => l.id === plan.mealLogId) : mealLogs.find(l => l.recipeId === plan.recipeId && l.date === plan.date);
                                    if (log) {
                                      return (
                                        <span className="text-xs font-bold text-slate-600 bg-slate-200/50 px-2 py-1 rounded-lg">
                                          Cost: RM{log.cost.toFixed(2)}
                                        </span>
                                      );
                                    }
                                    return null;
                                  })()}
                                </div>
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
        {activeTab === 'logs' && (
          <div className="space-y-6 animate-spring-slide-right">
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setEditingLog(null);
                  setLogForm({
                    recipeName: '',
                    date: format(new Date(), 'yyyy-MM-dd'),
                    cost: 0,
                    ingredients: []
                  });
                  setIsCalendarOpen(false);
                  setIsLogModalOpen(true);
                }}
                className="bg-white text-[#38BDF8] border border-[#38BDF8]/30 hover:bg-[#38BDF8]/5 font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all flex items-center gap-2"
              >
                <Plus size={18} /> Add Manual Log
              </button>
            </div>
            {mealLogs.length === 0 ? (
              <div className="text-center py-16 text-slate-400 bg-white/50 rounded-3xl border border-slate-200 border-dashed">
                <FileText size={48} className="mx-auto mb-4 text-slate-300" />
                <p className="font-medium text-lg text-slate-500">No meal logs found.</p>
                <p className="text-sm mt-1">Plan and save meals to see your logs here!</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {mealLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(log => (
                  <div key={log.id} className="bg-white p-5 rounded-3xl shadow-[0_4px_15px_rgba(0,0,0,0.03)] border border-slate-100 group transition-transform duration-200 hover:scale-[1.01]">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-slate-800 text-xl leading-tight">{log.recipeName}</h3>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs font-bold text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-xl inline-block">{format(parseISO(log.date), 'MMM d, yyyy')}</span>
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-xl inline-block">RM{log.cost.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingLog(log); setLogForm(log); setIsCalendarOpen(false); setIsLogModalOpen(true); }} className="w-8 h-8 flex items-center justify-center text-slate-400 bg-slate-50 rounded-full hover:bg-blue-50 hover:text-blue-500 transition-colors"><Edit2 size={16} /></button>
                        <button onClick={() => onDeleteMealLog && onDeleteMealLog(log.id)} className="w-8 h-8 flex items-center justify-center text-slate-400 bg-slate-50 rounded-full hover:bg-rose-50 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </div>
                    {log.ingredients && log.ingredients.length > 0 && (
                      <div className="bg-slate-50 p-3 rounded-2xl">
                        <span className="text-xs font-bold text-slate-700 mb-1 block">Ingredients Used:</span>
                        <div className="space-y-1">
                          {log.ingredients.map((ing, idx) => (
                            <div key={idx} className="flex justify-between text-sm text-slate-600">
                              <span>{ing.quantity} {ing.unit} {ing.name}</span>
                              <span className="font-medium">RM{ing.cost.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Text Import/Export Sheet */}
      <Sheet
        isOpen={isTextImportExportOpen}
        onClose={() => setIsTextImportExportOpen(false)}
        title="WhatsApp / Notes Format 📝"
      >
        <div className="space-y-5">
          <p className="text-sm text-slate-500 font-medium">
            Copy this text to share via WhatsApp/Notes, or paste text from your notes to import recipes.
          </p>
          
          <textarea
            value={textData}
            onChange={(e) => setTextData(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 focus:border-[#4ADE80] focus:ring-4 focus:ring-[#4ADE80]/10 outline-none transition-all font-mono text-xs text-slate-800 min-h-[300px] resize-none"
            placeholder="Paste recipe text here..."
          />
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={copyToClipboard}
              className="bg-white border border-slate-200 text-slate-700 font-bold py-3.5 rounded-2xl shadow-sm hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Copy size={18} /> Copy All
            </button>
            <button
              onClick={handleTextImport}
              className="bg-gradient-to-r from-[#4ADE80] to-emerald-500 text-white font-bold py-3.5 rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <ClipboardPaste size={18} /> Import Text
            </button>
          </div>
        </div>
      </Sheet>

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
                <div key={idx} className="grid grid-cols-[1fr_70px_70px_32px] gap-2 items-center bg-slate-50 p-2 rounded-2xl border border-slate-100">
                  <input
                    type="text"
                    value={ing.name}
                    onChange={(e) => {
                      const newIngs = [...(recipeForm.ingredients || [])];
                      newIngs[idx].name = e.target.value;
                      setRecipeForm({ ...recipeForm, ingredients: newIngs });
                    }}
                    placeholder="Name"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:border-[#4ADE80] outline-none font-medium"
                  />
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={ing.quantity ?? ''}
                    onChange={(e) => {
                      const newIngs = [...(recipeForm.ingredients || [])];
                      const val = e.target.value;
                      newIngs[idx].quantity = val === '' ? undefined : (parseFloat(val) as any);
                      setRecipeForm({ ...recipeForm, ingredients: newIngs });
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2.5 text-sm focus:border-[#4ADE80] outline-none font-medium text-center"
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
                    className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2.5 text-sm focus:border-[#4ADE80] outline-none font-medium text-center"
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
            <>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Servings Multiplier</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={planForm.servings ?? 1}
                  onChange={(e) => {
                    const val = e.target.value;
                    const newServings = val === '' ? undefined : parseFloat(val);
                    const recipe = recipes.find(r => r.id === planForm.recipeId);
                    if (recipe && newServings !== undefined) {
                      const newAssignments = planForm.assignedItems.map(a => {
                        const ing = recipe.ingredients[a.ingredientIndex];
                        const invItem = inventory.find(i => i.id === a.inventoryItemId);
                        const requiredQty = ing.quantity * newServings;
                        return {
                          ...a,
                          quantity: a.inventoryItemId ? requiredQty : 0
                        };
                      });
                      setPlanForm({ ...planForm, servings: newServings, assignedItems: newAssignments });
                    } else {
                      setPlanForm({ ...planForm, servings: newServings });
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 focus:border-[#4ADE80] focus:ring-4 focus:ring-[#4ADE80]/10 outline-none transition-all font-medium text-slate-800"
                />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800 mb-3">Assign Inventory Items</h4>
                <div className="space-y-3">
                  {recipes.find(r => r.id === planForm.recipeId)?.ingredients.map((ing, idx) => {
                    const assignment = planForm.assignedItems.find(a => a.ingredientIndex === idx);
                    const activeInventory = inventory.filter(i => !i.isWasted);
                    const requiredQty = ing.quantity * (planForm.servings || 1);
                    
                    return (
                      <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                        <div className="flex justify-between items-center mb-3">
                          <span className="font-bold text-slate-800">{ing.name}</span>
                          <span className="text-xs font-bold text-[#38BDF8] bg-[#38BDF8]/10 px-2 py-1 rounded-lg">{requiredQty} {ing.unit} needed</span>
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
                                    newAssignments[aIdx].quantity = requiredQty;
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
                        <p className="text-xs font-bold text-amber-500 mt-2 flex items-center gap-1 bg-amber-50 p-2 rounded-lg">
                          <AlertCircle size={14} /> Exceeds stock, but will be logged.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
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
      {/* Log Sheet */}
      <Sheet
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        title={editingLog ? "Edit Meal Log 📝" : "Add Meal Log 📝"}
      >
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Meal Name</label>
            <input
              type="text"
              value={logForm.recipeName || ''}
              onChange={(e) => setLogForm({ ...logForm, recipeName: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 focus:border-[#4ADE80] focus:ring-4 focus:ring-[#4ADE80]/10 outline-none transition-all font-medium text-slate-800"
              placeholder="e.g. Chicken Rice, Takeout..."
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Date</label>
            <button
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 flex items-center justify-between hover:border-[#38BDF8] transition-all group"
            >
              <div className="flex items-center gap-3">
                <Calendar className="text-[#38BDF8]" size={20} />
                <span className="font-medium text-slate-800">
                  {logForm.date ? format(parseISO(logForm.date), 'MMMM d, yyyy') : 'Select Date'}
                </span>
              </div>
              <div className={clsx("transition-transform duration-300", isCalendarOpen ? "rotate-180" : "rotate-0")}>
                <Plus size={18} className="text-slate-400 group-hover:text-[#38BDF8]" />
              </div>
            </button>
            
            {isCalendarOpen && (
              <div className="mt-3 bg-white border border-slate-100 rounded-3xl p-4 shadow-xl animate-spring-up overflow-hidden">
                <CalendarComponent
                  onChange={(value) => {
                    if (value instanceof Date) {
                      setLogForm({ ...logForm, date: format(value, 'yyyy-MM-dd') });
                      setIsCalendarOpen(false);
                    }
                  }}
                  value={logForm.date ? parseISO(logForm.date) : new Date()}
                  className="!w-full !border-none !bg-transparent font-sans"
                />
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Total Cost (RM)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={logForm.cost ?? ''}
              onChange={(e) => setLogForm({ ...logForm, cost: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 focus:border-[#4ADE80] focus:ring-4 focus:ring-[#4ADE80]/10 outline-none transition-all font-medium text-slate-800"
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-bold text-slate-700">Ingredients</label>
              <button 
                onClick={() => setLogForm({ ...logForm, ingredients: [...(logForm.ingredients || []), { name: '', quantity: 1, unit: 'pcs', cost: undefined }] })}
                className="text-xs font-bold text-[#38BDF8] bg-[#38BDF8]/10 px-3 py-1.5 rounded-xl hover:bg-[#38BDF8]/20 transition-colors flex items-center gap-1"
              >
                <Plus size={14} /> Add Item
              </button>
            </div>
            <div className="space-y-3">
              {logForm.ingredients && logForm.ingredients.length > 0 && (
                <div className="grid grid-cols-[1fr_55px_55px_65px_32px] gap-2 px-2 mb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Name</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase text-center">Qty</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase text-center">Unit</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase text-center">Cost</span>
                  <span></span>
                </div>
              )}
              {logForm.ingredients?.map((ing, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_55px_55px_65px_32px] gap-2 items-center bg-slate-50 p-2 rounded-2xl border border-slate-100">
                  <input
                    type="text"
                    value={ing.name}
                    onChange={(e) => {
                      const newIngs = [...(logForm.ingredients || [])];
                      newIngs[idx].name = e.target.value;
                      setLogForm({ ...logForm, ingredients: newIngs });
                    }}
                    placeholder="Name"
                    className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2.5 text-xs focus:border-[#4ADE80] outline-none font-medium"
                  />
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={ing.quantity ?? ''}
                    onChange={(e) => {
                      const newIngs = [...(logForm.ingredients || [])];
                      const val = e.target.value;
                      newIngs[idx].quantity = val === '' ? undefined : (parseFloat(val) as any);
                      setLogForm({ ...logForm, ingredients: newIngs });
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-1 py-2.5 text-xs focus:border-[#4ADE80] outline-none font-medium text-center"
                  />
                  <input
                    type="text"
                    value={ing.unit}
                    onChange={(e) => {
                      const newIngs = [...(logForm.ingredients || [])];
                      newIngs[idx].unit = e.target.value;
                      setLogForm({ ...logForm, ingredients: newIngs });
                    }}
                    placeholder="Unit"
                    className="w-full bg-white border border-slate-200 rounded-xl px-1 py-2.5 text-xs focus:border-[#4ADE80] outline-none font-medium text-center"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={ing.cost ?? ''}
                    onChange={(e) => {
                      const newIngs = [...(logForm.ingredients || [])];
                      const val = e.target.value;
                      newIngs[idx].cost = val === '' ? undefined : (parseFloat(val) as any);
                      setLogForm({ ...logForm, ingredients: newIngs });
                    }}
                    placeholder="Cost"
                    className="w-full bg-white border border-slate-200 rounded-xl px-1 py-2.5 text-xs focus:border-[#4ADE80] outline-none font-medium text-center"
                  />
                  <button 
                    onClick={() => {
                      const newIngs = [...(logForm.ingredients || [])];
                      newIngs.splice(idx, 1);
                      setLogForm({ ...logForm, ingredients: newIngs });
                    }}
                    className="w-8 h-8 flex items-center justify-center text-slate-400 bg-white rounded-full hover:bg-rose-50 hover:text-rose-500 transition-colors shadow-sm"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={handleSaveLog}
            className="w-full bg-gradient-to-r from-[#4ADE80] to-[#38BDF8] text-white font-bold py-4 rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-95 text-lg"
          >
            Save Log
          </button>
        </div>
      </Sheet>
    </div>
  );
};

export default MealPlannerView;
