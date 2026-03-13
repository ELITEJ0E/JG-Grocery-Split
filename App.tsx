import React, { useState, useEffect } from 'react';
import { AppState, InventoryItem, Recipe, MealPlan, ShoppingListItem, PriceHistoryEntry, BudgetData, LifespanData, Currency, CURRENCIES, MealLog } from './types';
import BottomNav from './components/BottomNav';
import InventoryView from './components/InventoryView';
import MealPlannerView from './components/MealPlannerView';
import AnalyticsView from './components/AnalyticsView';
import ShoppingListView from './components/ShoppingListView';
import ScanView from './components/ScanView';
import VerificationView from './components/VerificationView';
import KitchenDashboardView from './components/KitchenDashboardView';
import InstallPrompt from './components/InstallPrompt';
import LoadingScreen from './components/LoadingScreen';
import Toast, { ToastType } from './components/ui/Toast';
import { addDays, format, differenceInDays } from 'date-fns';

const App: React.FC = () => {
  const [view, setView] = useState<AppState>('kitchen');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [mealLogs, setMealLogs] = useState<MealLog[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [scannedItems, setScannedItems] = useState<Partial<InventoryItem>[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [currency, setCurrency] = useState<Currency>(CURRENCIES[0]);

  const [toast, setToast] = useState<{ message: string; type: ToastType; isVisible: boolean }>({
    message: '',
    type: 'success',
    isVisible: false
  });

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ message, type, isVisible: true });
  };

  const [priceHistory, setPriceHistory] = useState<Record<string, PriceHistoryEntry[]>>({});
  const [budgetData, setBudgetData] = useState<BudgetData>({ monthlyBudget: 800, months: {} });
  const [lifespanData, setLifespanData] = useState<LifespanData>({});

  useEffect(() => {
    const storedInventory = localStorage.getItem('grocery_inventory');
    const storedRecipes = localStorage.getItem('userRecipes');
    const storedMealPlans = localStorage.getItem('grocery_meal_plans');
    const storedMealLogs = localStorage.getItem('grocery_meal_logs');
    const storedShoppingList = localStorage.getItem('shoppingList');
    const storedPriceHistory = localStorage.getItem('priceHistory');
    const storedBudgetData = localStorage.getItem('budgetData');
    const storedLifespanData = localStorage.getItem('lifespanData');
    const storedCurrency = localStorage.getItem('currency');

    if (storedInventory) setInventory(JSON.parse(storedInventory));
    if (storedRecipes) setRecipes(JSON.parse(storedRecipes));
    if (storedMealPlans) setMealPlans(JSON.parse(storedMealPlans));
    if (storedMealLogs) setMealLogs(JSON.parse(storedMealLogs));
    if (storedShoppingList) setShoppingList(JSON.parse(storedShoppingList));
    if (storedPriceHistory) setPriceHistory(JSON.parse(storedPriceHistory));
    if (storedBudgetData) setBudgetData(JSON.parse(storedBudgetData));
    if (storedLifespanData) setLifespanData(JSON.parse(storedLifespanData));
    if (storedCurrency) setCurrency(JSON.parse(storedCurrency));
  }, []);

  useEffect(() => {
    localStorage.setItem('grocery_inventory', JSON.stringify(inventory));
    localStorage.setItem('userRecipes', JSON.stringify(recipes));
    localStorage.setItem('grocery_meal_plans', JSON.stringify(mealPlans));
    localStorage.setItem('grocery_meal_logs', JSON.stringify(mealLogs));
    localStorage.setItem('shoppingList', JSON.stringify(shoppingList));
    localStorage.setItem('priceHistory', JSON.stringify(priceHistory));
    localStorage.setItem('budgetData', JSON.stringify(budgetData));
    localStorage.setItem('lifespanData', JSON.stringify(lifespanData));
    localStorage.setItem('currency', JSON.stringify(currency));
  }, [inventory, recipes, mealPlans, mealLogs, shoppingList, priceHistory, budgetData, lifespanData, currency]);

  const handleAddMealLog = (mealLog: MealLog) => {
    setMealLogs(prev => [...prev, mealLog]);
  };

  const handleUpdateItem = (updatedItem: InventoryItem) => {
    setInventory(prev => {
      const oldItem = prev.find(i => i.id === updatedItem.id);
      if (oldItem && !oldItem.isUsed && updatedItem.isUsed && updatedItem.usedDate) {
        // Calculate lifespan
        const days = differenceInDays(new Date(updatedItem.usedDate), new Date(updatedItem.purchaseDate));
        if (days >= 0) {
          setLifespanData(prevLifespan => {
            const name = updatedItem.name.toLowerCase();
            const existing = prevLifespan[name] || { averageDays: 0, history: [] };
            const newHistory = [...existing.history, days];
            const newAverage = newHistory.reduce((a, b) => a + b, 0) / newHistory.length;
            return { ...prevLifespan, [name]: { averageDays: Math.round(newAverage), history: newHistory } };
          });
        }
      }
      return prev.map(item => item.id === updatedItem.id ? updatedItem : item);
    });
  };

  const handleDeleteItem = (id: string) => {
    setInventory(inventory.map(item => item.id === id ? { ...item, isWasted: true } : item));
  };

  const handleAddRecipe = (recipe: Recipe) => {
    setRecipes(prev => [...prev, recipe]);
  };

  const handleUpdateRecipe = (recipe: Recipe) => {
    setRecipes(recipes.map(r => r.id === recipe.id ? recipe : r));
  };

  const handleDeleteRecipe = (id: string) => {
    setRecipes(recipes.filter(r => r.id !== id));
    setMealPlans(mealPlans.filter(mp => mp.recipeId !== id));
  };

  const handleAddMealPlan = (mealPlan: MealPlan) => {
    setMealPlans(prev => [...prev, mealPlan]);
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
    
    // Update price history
    setPriceHistory(prev => {
      const newHistory = { ...prev };
      items.forEach(item => {
        if (item.unitPrice > 0) {
          const name = item.name.toLowerCase();
          if (!newHistory[name]) newHistory[name] = [];
          newHistory[name].push({
            date: item.purchaseDate,
            price: item.unitPrice,
            store: item.store
          });
        }
      });
      return newHistory;
    });

    // Update budget data
    setBudgetData(prev => {
      const newData = { ...prev };
      items.forEach(item => {
        if (item.unitPrice > 0) {
          const monthKey = format(new Date(item.purchaseDate), 'yyyy-MM');
          if (!newData.months[monthKey]) {
            newData.months[monthKey] = { totalSpent: 0, categories: {} };
          }
          const cost = item.unitPrice * item.quantity;
          newData.months[monthKey].totalSpent += cost;
          
          const cat = item.category || 'other';
          newData.months[monthKey].categories[cat] = (newData.months[monthKey].categories[cat] || 0) + cost;
        }
      });
      return newData;
    });

    setIsVerifying(false);
    setScannedItems([]);
    setView('kitchen');
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
          currency={currency}
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
      case 'kitchen':
        return (
          <KitchenDashboardView
            items={inventory}
            recipes={recipes}
            mealPlans={mealPlans}
            onUpdateItem={handleUpdateItem}
            onDeleteItem={handleDeleteItem}
            onNavigate={setView}
          />
        );
      case 'inventory':
        return <InventoryView items={inventory} mealPlans={mealPlans} recipes={recipes} onUpdateItem={handleUpdateItem} onDeleteItem={handleDeleteItem} />;
      case 'planner':
        return (
          <MealPlannerView
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
            onAddMealLog={handleAddMealLog}
            onShowToast={showToast}
          />
        );
      case 'scan':
        return <ScanView onItemsExtracted={handleItemsExtracted} onCancel={() => setView('kitchen')} />;
      case 'analytics':
        return (
          <AnalyticsView 
            inventory={inventory} 
            budgetData={budgetData} 
            priceHistory={priceHistory} 
            lifespanData={lifespanData}
            mealLogs={mealLogs}
            currency={currency}
            onUpdateCurrency={setCurrency}
            onUpdateBudget={(budget) => setBudgetData(prev => ({ ...prev, monthlyBudget: budget }))}
            onClearData={() => {
              setInventory([]);
              setPriceHistory({});
              setBudgetData({ monthlyBudget: 800, months: {} });
              setLifespanData({});
              setMealLogs([]);
            }}
          />
        );
      case 'shoppingList':
        return (
          <ShoppingListView
            inventory={inventory}
            recipes={recipes}
            mealPlans={mealPlans}
            shoppingList={shoppingList}
            onUpdateShoppingList={setShoppingList}
            onAddToInventory={handleQuickAddInventory}
            onNavigateToScan={() => setView('scan')}
            onShowToast={showToast}
          />
        );
      default:
        return (
          <KitchenDashboardView
            items={inventory}
            recipes={recipes}
            mealPlans={mealPlans}
            onUpdateItem={handleUpdateItem}
            onDeleteItem={handleDeleteItem}
            onNavigate={setView}
          />
        );
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen shadow-2xl overflow-hidden relative font-sans text-[#1E293B]"
      style={{ background: 'linear-gradient(160deg, #f0fdf4 0%, #e0f7fa 50%, #ecfeff 100%)' }}
    >
      <LoadingScreen />
      {renderContent()}
      <Toast 
        message={toast.message} 
        type={toast.type} 
        isVisible={toast.isVisible} 
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} 
      />
      {!isVerifying && <InstallPrompt />}
      {!isVerifying && <BottomNav currentView={view} onNavigate={setView} />}
    </div>
  );
};

export default App;