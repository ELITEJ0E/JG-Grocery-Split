import React, { useState, useRef } from 'react';
import { Recipe, RecipeIngredient } from '../types';
import { Search, Plus, Edit2, Trash2, Download, Upload, Star, X, Save, BookOpen } from 'lucide-react';
import { clsx } from 'clsx';

interface RecipesViewProps {
  recipes: Recipe[];
  onAddRecipe: (recipe: Recipe) => void;
  onUpdateRecipe: (recipe: Recipe) => void;
  onDeleteRecipe: (id: string) => void;
  onImportRecipes: (recipes: Recipe[]) => void;
}

const RecipesView: React.FC<RecipesViewProps> = ({ recipes, onAddRecipe, onUpdateRecipe, onDeleteRecipe, onImportRecipes }) => {
  const [search, setSearch] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentRecipe, setCurrentRecipe] = useState<Partial<Recipe> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredRecipes = recipes
    .filter(r => r.name.toLowerCase().includes(search.toLowerCase()) || r.category?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0));

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(recipes));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "grocery_recipes.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported) && imported.every(r => r.id && r.name && Array.isArray(r.ingredients))) {
          onImportRecipes(imported);
        } else {
          alert('Invalid recipe format.');
        }
      } catch (err) {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = () => {
    if (!currentRecipe?.name || !currentRecipe?.ingredients?.length) {
      alert('Please provide a name and at least one ingredient.');
      return;
    }

    if (currentRecipe.id) {
      onUpdateRecipe(currentRecipe as Recipe);
    } else {
      onAddRecipe({
        ...currentRecipe,
        id: crypto.randomUUID(),
      } as Recipe);
    }
    setIsEditing(false);
    setCurrentRecipe(null);
  };

  const addIngredient = () => {
    setCurrentRecipe(prev => ({
      ...prev,
      ingredients: [...(prev?.ingredients || []), { name: '', quantity: 1, unit: 'pcs' }]
    }));
  };

  const updateIngredient = (index: number, field: keyof RecipeIngredient, value: any) => {
    const newIngredients = [...(currentRecipe?.ingredients || [])];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setCurrentRecipe(prev => ({ ...prev, ingredients: newIngredients }));
  };

  const removeIngredient = (index: number) => {
    setCurrentRecipe(prev => ({
      ...prev,
      ingredients: prev?.ingredients?.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 pb-24 relative">
      <div className="bg-white p-4 shadow-sm sticky top-0 z-10">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">My Recipes</h1>
          <div className="flex gap-2">
            <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full">
              <Upload size={20} />
            </button>
            <button onClick={handleExport} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full">
              <Download size={20} />
            </button>
            <button 
              onClick={() => {
                setCurrentRecipe({ name: '', ingredients: [], category: '', notes: '', isFavorite: false });
                setIsEditing(true);
              }}
              className="p-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-700"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search recipes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 border-transparent rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
          />
        </div>
        <input type="file" accept=".json" ref={fileInputRef} onChange={handleImport} className="hidden" />
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {filteredRecipes.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen size={24} className="text-gray-400" />
            </div>
            <p>No recipes found. Add one to get started!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredRecipes.map(recipe => (
              <div
                key={recipe.id}
                className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 animate-spring-up"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                      {recipe.name}
                      {recipe.isFavorite && <Star size={16} className="text-yellow-400 fill-yellow-400" />}
                    </h3>
                    {recipe.category && <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">{recipe.category}</span>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setCurrentRecipe(recipe); setIsEditing(true); }} className="p-1 text-gray-400 hover:text-blue-500">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => onDeleteRecipe(recipe.id)} className="p-1 text-gray-400 hover:text-red-500">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  {recipe.ingredients.length} ingredients
                </p>
                <div className="flex flex-wrap gap-1">
                  {recipe.ingredients.slice(0, 3).map((ing, i) => (
                    <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
                      {ing.name}
                    </span>
                  ))}
                  {recipe.ingredients.length > 3 && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">+{recipe.ingredients.length - 3} more</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditing && currentRecipe && (
        <div
          className="fixed inset-0 bg-white z-50 flex flex-col animate-spring-up"
        >
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h2 className="text-xl font-bold">{currentRecipe.id ? 'Edit Recipe' : 'New Recipe'}</h2>
              <button onClick={() => setIsEditing(false)} className="p-2 bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recipe Name *</label>
                <input
                  type="text"
                  value={currentRecipe.name || ''}
                  onChange={e => setCurrentRecipe({ ...currentRecipe, name: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:border-emerald-500 focus:ring-2 outline-none"
                  placeholder="e.g., Spaghetti Bolognese"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={currentRecipe.category || ''}
                    onChange={e => setCurrentRecipe({ ...currentRecipe, category: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:border-emerald-500 focus:ring-2 outline-none"
                    placeholder="e.g., Dinner"
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentRecipe.isFavorite || false}
                      onChange={e => setCurrentRecipe({ ...currentRecipe, isFavorite: e.target.checked })}
                      className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Favorite</span>
                  </label>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Ingredients *</label>
                  <button onClick={addIngredient} className="text-sm text-emerald-600 font-medium flex items-center gap-1">
                    <Plus size={16} /> Add
                  </button>
                </div>
                
                <div className="space-y-2">
                  {currentRecipe.ingredients?.map((ing, i) => (
                    <div key={i} className="flex gap-2 items-center bg-gray-50 p-2 rounded-xl border border-gray-100">
                      <input
                        type="text"
                        value={ing.name}
                        onChange={e => updateIngredient(i, 'name', e.target.value)}
                        placeholder="Name"
                        className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-emerald-500"
                      />
                      <input
                        type="number"
                        value={ing.quantity}
                        onChange={e => updateIngredient(i, 'quantity', parseFloat(e.target.value))}
                        className="w-16 bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-emerald-500"
                      />
                      <input
                        type="text"
                        value={ing.unit}
                        onChange={e => updateIngredient(i, 'unit', e.target.value)}
                        placeholder="Unit"
                        className="w-16 bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-emerald-500"
                      />
                      <button onClick={() => removeIngredient(i)} className="p-1 text-gray-400 hover:text-red-500">
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  {!currentRecipe.ingredients?.length && (
                    <p className="text-sm text-gray-500 italic">No ingredients added yet.</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={currentRecipe.notes || ''}
                  onChange={e => setCurrentRecipe({ ...currentRecipe, notes: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:border-emerald-500 focus:ring-2 outline-none min-h-[100px]"
                  placeholder="Cooking instructions or notes..."
                />
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-white pb-safe">
              <button
                onClick={handleSave}
                className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
              >
                <Save size={20} />
                Save Recipe
              </button>
            </div>
          </div>
        )}
    </div>
  );
};

export default RecipesView;
