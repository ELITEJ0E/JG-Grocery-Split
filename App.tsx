
import React, { useState, useEffect } from 'react';
import { AppState, InventoryItem, Recipe, MealPlan, ShoppingListItem } from './types';
import BottomNav from './components/BottomNav';
import InventoryView from './components/InventoryView';
import MealPlannerView from './components/MealPlannerView';
import AnalyticsView from './components/AnalyticsView';
import ShoppingListView from './components/ShoppingListView';
import ScanView from './components/ScanView';
import VerificationView from './components/VerificationView';
import { addDays } from 'date-fns';

const App: React.FC = () => {
  const [view, setView] = useState<AppState>('inventory');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [scannedItems, setScannedItems] = useState<Partial<InventoryItem>[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    const storedInventory = localStorage.getItem('grocery_inventory');
    const storedRecipes = localStorage.getItem('userRecipes');
    const storedMealPlans = localStorage.getItem('grocery_meal_plans');
    const storedShoppingList = localStorage.getItem('shoppingList');

    if (storedInventory) setInventory(JSON.parse(storedInventory));
    if (storedRecipes) setRecipes(JSON.parse(storedRecipes));
    if (storedMealPlans) setMealPlans(JSON.parse(storedMealPlans));
    if (storedShoppingList) setShoppingList(JSON.parse(storedShoppingList));
  }, []);

  // Save to local storage on change
  useEffect(() => {
    localStorage.setItem('grocery_inventory', JSON.stringify(inventory));
    localStorage.setItem('userRecipes', JSON.stringify(recipes));
    localStorage.setItem('grocery_meal_plans', JSON.stringify(mealPlans));
    localStorage.setItem('shoppingList', JSON.stringify(shoppingList));
  }, [inventory, recipes, mealPlans, shoppingList]);

  const handleUpdateItem = (updatedItem: InventoryItem) => {
    setInventory(inventory.map(item => item.id === updatedItem.id ? updatedItem : item));
  };

  const handleDeleteItem = (id: string) => {
    setInventory(inventory.map(item => item.id === id ? { ...item, isWasted: true } : item));
  };

  const handleAddRecipe = (recipe: Recipe) => {
    setRecipes([...recipes, recipe]);
  };

  const handleUpdateRecipe = (recipe: Recipe) => {
    setRecipes(recipes.map(r => r.id === recipe.id ? recipe : r));
  };

  const handleDeleteRecipe = (id: string) => {
    setRecipes(recipes.filter(r => r.id !== id));
    // Also remove meal plans associated with this recipe
    setMealPlans(mealPlans.filter(mp => mp.recipeId !== id));
  };

  const handleAddMealPlan = (mealPlan: MealPlan) => {
    setMealPlans([...mealPlans, mealPlan]);
  };

  const handleUpdateMealPlan = (mealPlan: MealPlan) => {
    setMealPlans(mealPlans.map(mp => mp.id === mealPlan.id ? mealPlan : mp));
  };

  const handleDeleteMealPlan = (id: string) => {
    setMealPlans(mealPlans.filter(mp => mp.id !== id));
  };

  const handleItemsExtracted = (items: Partial<InventoryItem>[]) => {
    setScannedItems(items);
    setIsVerifying(true);
  };

  const handleConfirmItems = (items: InventoryItem[]) => {
    setInventory([...inventory, ...items]);
    setIsVerifying(false);
    setScannedItems([]);
    setView('inventory');
  };

  const handleQuickAddInventory = (item: Partial<InventoryItem>) => {
    const newItem: InventoryItem = {
      id: crypto.randomUUID(),
      name: item.name || 'Unknown',
      quantity: item.quantity || 1,
      unit: item.unit || 'pcs',
      unitPrice: item.unitPrice || 0,
      category: item.category || 'other',
      purchaseDate: new Date().toISOString(),
      expiryDate: addDays(new Date(), item.shelfLifeDays || 7).toISOString(),
      isUsed: false,
      isWasted: false,
    };
    setInventory([...inventory, newItem]);
  };

  const renderContent = () => {
    if (isVerifying) {
      return (
        <VerificationView
          items={scannedItems}
          onConfirm={handleConfirmItems}
          onCancel={() => {
            setIsVerifying(false);
            setScannedItems([]);
            setView('scan');
          }}
        />
      );
    }

    switch (view) {
      case 'inventory':
        return <InventoryView items={inventory} mealPlans={mealPlans} recipes={recipes} onUpdateItem={handleUpdateItem} onDeleteItem={handleDeleteItem} />;
      case 'planner':
        return <MealPlannerView 
          recipes={recipes} 
          mealPlans={mealPlans} 
          inventory={inventory} 
          onAddRecipe={handleAddRecipe} 
          onUpdateRecipe={handleUpdateRecipe}
          onDeleteRecipe={handleDeleteRecipe}
          onAddMealPlan={handleAddMealPlan}
          onUpdateMealPlan={handleUpdateMealPlan}
          onDeleteMealPlan={handleDeleteMealPlan}
          onUpdateInventory={setInventory}
        />;
      case 'scan':
        return <ScanView onItemsExtracted={handleItemsExtracted} onCancel={() => setView('inventory')} />;
      case 'analytics':
        return <AnalyticsView inventory={inventory} />;
      case 'shoppingList':
        return <ShoppingListView 
          inventory={inventory}
          recipes={recipes}
          mealPlans={mealPlans}
          shoppingList={shoppingList}
          onUpdateShoppingList={setShoppingList}
          onAddToInventory={handleQuickAddInventory}
          onNavigateToScan={() => setView('scan')}
        />;
      default:
        return <InventoryView items={inventory} mealPlans={mealPlans} recipes={recipes} onUpdateItem={handleUpdateItem} onDeleteItem={handleDeleteItem} />;
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen shadow-2xl overflow-hidden relative font-sans">
      {renderContent()}
      {!isVerifying && <BottomNav currentView={view} onNavigate={setView} />}
    </div>
  );
};

export default App;
