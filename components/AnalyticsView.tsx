import React, { useState, useMemo, useEffect } from 'react';
import { InventoryItem, BudgetData, PriceHistoryEntry, LifespanData, Currency, CURRENCIES, MealLog } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Trash2, PieChart as PieChartIcon, AlertTriangle, Activity, Store, Clock, Utensils } from 'lucide-react';
import { getCategoryEmoji } from '../utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { format } from 'date-fns';
import { clsx } from 'clsx';

interface AnalyticsViewProps {
  inventory: InventoryItem[];
  budgetData?: BudgetData;
  priceHistory?: Record<string, PriceHistoryEntry[]>;
  lifespanData?: LifespanData;
  mealLogs?: MealLog[];
  currency: Currency;
  onUpdateCurrency: (currency: Currency) => void;
  onUpdateBudget: (budget: number) => void;
  onClearData: () => void;
}

const COLORS = ['#4ADE80', '#38BDF8', '#2DD4BF', '#FBBF24', '#F472B6', '#A78BFA', '#94A3B8'];

const NUTRITION_COLORS: Record<string, string> = {
  Protein: '#F472B6',
  Carbs: '#FBBF24',
  Vegetables: '#4ADE80',
  Fruits: '#38BDF8',
  Fats: '#A78BFA',
  Other: '#94A3B8'
};

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ 
  inventory, 
  budgetData, 
  priceHistory = {}, 
  lifespanData = {},
  mealLogs = [],
  currency,
  onUpdateCurrency,
  onUpdateBudget,
  onClearData
}) => {
  const [selectedPriceItem, setSelectedPriceItem] = useState<string>('');
  const [selectedStoreItem, setSelectedStoreItem] = useState<string>('');
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [tempBudget, setTempBudget] = useState(budgetData?.monthlyBudget || 800);

  const totalSpent = inventory.reduce((sum, item) => sum + (item.unitPrice * (item.originalQuantity ?? item.quantity)), 0);
  const wastedItems = inventory.filter(item => item.isWasted);
  const totalWasted = wastedItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  const wastePercentage = totalSpent > 0 ? (totalWasted / totalSpent) * 100 : 0;

  const categoryData = inventory.reduce((acc, item) => {
    const existing = acc.find(c => c.name === item.category);
    const itemValue = item.unitPrice * (item.originalQuantity ?? item.quantity);
    if (existing) {
      existing.value += itemValue;
    } else {
      acc.push({ name: item.category, value: itemValue });
    }
    return acc;
  }, [] as { name: string, value: number }[]);

  const topWasted = wastedItems
    .sort((a, b) => (b.unitPrice * b.quantity) - (a.unitPrice * a.quantity))
    .slice(0, 3);

  const formatCurrency = (value: number) => {
    return `${currency.symbol}${value.toFixed(2)}`;
  };

  const currentMonthKey = format(new Date(), 'yyyy-MM');
  const currentMonthSpent = useMemo(() => {
    return inventory
      .filter(item => format(new Date(item.purchaseDate), 'yyyy-MM') === currentMonthKey)
      .reduce((sum, item) => sum + (item.unitPrice * (item.originalQuantity ?? item.quantity)), 0);
  }, [inventory, currentMonthKey]);
  
  const monthlyBudget = budgetData?.monthlyBudget || 800;
  const budgetPercentage = monthlyBudget > 0 ? (currentMonthSpent / monthlyBudget) * 100 : 0;

  // Nutrition Data
  const nutritionData = useMemo(() => {
    const stats: Record<string, number> = { Protein: 0, Carbs: 0, Vegetables: 0, Fruits: 0, Fats: 0, Other: 0 };
    inventory.forEach(item => {
      const name = item.name.toLowerCase();
      const cat = item.category;
      if (cat === 'meat' || name.includes('egg') || name.includes('tofu') || name.includes('fish')) stats.Protein++;
      else if (cat === 'bakery' || name.includes('rice') || name.includes('pasta') || name.includes('bread')) stats.Carbs++;
      else if (cat === 'produce' && (name.includes('leaf') || name.includes('broccoli') || name.includes('cabbage') || name.includes('carrot') || name.includes('spinach'))) stats.Vegetables++;
      else if (cat === 'produce') stats.Fruits++; // Fallback for produce
      else if (cat === 'dairy' && (name.includes('butter') || name.includes('cheese')) || name.includes('oil')) stats.Fats++;
      else stats.Other++;
    });
    return Object.entries(stats).filter(([_, val]) => val > 0).map(([name, value]) => ({ name, value }));
  }, [inventory]);

  // Store Prices
  const storePrices = useMemo(() => {
    const prices: Record<string, { store: string, price: number }[]> = {};
    Object.entries(priceHistory).forEach(([item, history]) => {
      prices[item] = [];
      const storeMap = new Map<string, number>();
      (history as PriceHistoryEntry[]).forEach(entry => {
        if (entry.store) {
          // Keep the latest price for each store
          storeMap.set(entry.store, entry.price);
        }
      });
      storeMap.forEach((price, store) => {
        prices[item].push({ store, price });
      });
    });
    return prices;
  }, [priceHistory]);

  // Meal Cost Analytics
  const mealCostData = useMemo(() => {
    return mealLogs.map(log => ({
      name: log.recipeName,
      cost: log.cost,
      date: format(new Date(log.date), 'MMM dd')
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [mealLogs]);

  const ingredientUsageData = useMemo(() => {
    const usage: Record<string, number> = {};
    mealLogs.forEach(log => {
      log.ingredients.forEach(ing => {
        usage[ing.name] = (usage[ing.name] || 0) + ing.quantity;
      });
    });
    return Object.entries(usage)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5); // Top 5
  }, [mealLogs]);

  const mealStats = useMemo(() => {
    if (mealLogs.length === 0) return null;
    
    const totalCost = mealLogs.reduce((sum, log) => sum + log.cost, 0);
    const avgCost = totalCost / mealLogs.length;
    const sortedMeals = [...mealLogs].sort((a, b) => b.cost - a.cost);
    const mostExpensive = sortedMeals[0];
    const cheapest = sortedMeals[sortedMeals.length - 1];
    
    // Weekly cost
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weeklyLogs = mealLogs.filter(log => new Date(log.date) >= oneWeekAgo);
    const weeklyCost = weeklyLogs.reduce((sum, log) => sum + log.cost, 0);

    return { totalCost, avgCost, mostExpensive, cheapest, weeklyCost, weeklyCount: weeklyLogs.length };
  }, [mealLogs]);

  const mealInsights = useMemo(() => {
    if (!mealStats || mealLogs.length === 0) return [];
    const insights = [];
    
    if (mealStats.cheapest) {
      insights.push(`${mealStats.cheapest.recipeName} is one of your cheapest meals at ${formatCurrency(mealStats.cheapest.cost)}.`);
    }
    
    if (ingredientUsageData.length > 0) {
      insights.push(`Your most used ingredient is ${ingredientUsageData[0].name}.`);
    }

    const avgTakeoutCost = 15; // Assume 15 per meal
    const savings = (avgTakeoutCost * mealLogs.length) - mealStats.totalCost;
    if (savings > 0) {
      insights.push(`Cooking at home saved approximately ${formatCurrency(savings)} compared to average takeout.`);
    }

    return insights;
  }, [mealStats, ingredientUsageData, mealLogs, currency]);

  // Initialize selected items
  useEffect(() => {
    if (!selectedPriceItem && Object.keys(priceHistory).length > 0) {
      setSelectedPriceItem(Object.keys(priceHistory)[0]);
    }
    if (!selectedStoreItem && Object.keys(storePrices).length > 0) {
      setSelectedStoreItem(Object.keys(storePrices)[0]);
    }
  }, [priceHistory, storePrices]);

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleSaveBudget = () => {
    onUpdateBudget(tempBudget);
    setIsEditingBudget(false);
  };

  const handleClearData = () => {
    onClearData();
    setShowClearConfirm(false);
  };

  return (
    <div className="flex flex-col h-full pb-28 relative">
      {/* Custom Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-xs w-full animate-spring-up">
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <Trash2 className="text-rose-500" size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-800 text-center mb-2">Clear All Stats?</h3>
            <p className="text-slate-500 text-center text-sm font-medium mb-8">
              This will permanently delete your price history and budget data. This cannot be undone.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setShowClearConfirm(false)}
                className="py-3 px-4 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleClearData}
                className="py-3 px-4 bg-rose-500 text-white font-bold rounded-xl shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white/60 backdrop-blur-xl px-6 pt-8 pb-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] sticky top-0 z-50 rounded-b-3xl flex justify-between items-center">
        <h1 className="text-3xl font-extrabold text-[#1E293B] tracking-tight">Stats 📊</h1>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowClearConfirm(true)}
            className="p-2.5 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 transition-colors shadow-sm"
            title="Clear Analytics Data"
          >
            <Trash2 size={18} />
          </button>
          <div className="relative w-32">
            <Select
              value={currency.code}
              onValueChange={(value) => {
                const selected = CURRENCIES.find(c => c.code === value);
                if (selected) onUpdateCurrency(selected);
              }}
            >
              <SelectTrigger className="w-full bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 outline-none shadow-sm focus:border-[#4ADE80] focus:ring-4 focus:ring-[#4ADE80]/10 transition-all cursor-pointer h-auto">
                <SelectValue placeholder="Currency" />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map(c => (
                  <SelectItem key={c.code} value={c.code}>{c.code} ({c.symbol})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6">
        
        {/* 1. Total Spent & Wasted Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-[#4ADE80]/10 to-[#38BDF8]/10 p-5 rounded-3xl shadow-[0_4px_15px_rgba(0,0,0,0.03)] border border-white animate-spring-up">
            <div className="flex items-center gap-2 text-[#38BDF8] mb-3">
              <div className="p-2 bg-white rounded-xl shadow-sm">
                <DollarSign size={20} strokeWidth={2.5} />
              </div>
              <h3 className="font-extrabold text-xs uppercase tracking-wider">Total Spent</h3>
            </div>
            <p className="text-3xl font-black text-slate-800 tracking-tight">{formatCurrency(totalSpent)}</p>
          </div>
          
          <div className="bg-gradient-to-br from-rose-50 to-orange-50 p-5 rounded-3xl shadow-[0_4px_15px_rgba(0,0,0,0.03)] border border-white animate-spring-up">
            <div className="flex items-center gap-2 text-rose-500 mb-3">
              <div className="p-2 bg-white rounded-xl shadow-sm">
                <Trash2 size={20} strokeWidth={2.5} />
              </div>
              <h3 className="font-extrabold text-xs uppercase tracking-wider">Wasted</h3>
            </div>
            <p className="text-3xl font-black text-rose-600 tracking-tight">{formatCurrency(totalWasted)}</p>
            <div className="mt-2 inline-flex items-center gap-1 bg-white/60 px-2 py-1 rounded-lg">
              <AlertTriangle size={12} className="text-rose-500" />
              <p className="text-xs text-rose-600 font-bold">{wastePercentage.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        {/* 2. Monthly Budget Card */}
        <div className="bg-white p-6 rounded-3xl shadow-[0_4px_15px_rgba(0,0,0,0.03)] border border-slate-100 animate-spring-up">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <DollarSign size={20} className="text-[#38BDF8]" />
              <h3 className="font-extrabold text-slate-800 text-lg">Monthly Budget</h3>
            </div>
            <button 
              onClick={() => setIsEditingBudget(!isEditingBudget)}
              className="text-xs font-bold text-[#38BDF8] bg-[#38BDF8]/10 px-3 py-1.5 rounded-xl hover:bg-[#38BDF8]/20 transition-colors"
            >
              {isEditingBudget ? 'Cancel' : 'Set Budget'}
            </button>
          </div>

          {isEditingBudget ? (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mb-1.5 block">Monthly Limit ({currency.symbol})</label>
                <input
                  type="number"
                  value={tempBudget}
                  onChange={(e) => setTempBudget(parseFloat(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-black text-slate-800 focus:border-[#38BDF8] focus:ring-4 focus:ring-[#38BDF8]/10 outline-none transition-all"
                />
              </div>
              <button 
                onClick={handleSaveBudget}
                className="w-full bg-[#38BDF8] text-white font-bold py-3 rounded-xl shadow-lg shadow-[#38BDF8]/20 active:scale-95 transition-all"
              >
                Save Budget
              </button>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-end mb-2">
                <div>
                  <p className="text-sm font-medium text-slate-500">Spent this month</p>
                  <p className="text-2xl font-black text-slate-800">{formatCurrency(currentMonthSpent)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-500">Budget</p>
                  <p className="text-lg font-bold text-slate-600">{formatCurrency(monthlyBudget)}</p>
                </div>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-3">
                <div 
                  className={clsx("h-full rounded-full transition-all duration-500", budgetPercentage > 90 ? "bg-rose-500" : budgetPercentage > 70 ? "bg-amber-500" : "bg-emerald-500")}
                  style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-sm font-bold">
                <span className={budgetPercentage > 100 ? "text-rose-500" : "text-emerald-500"}>
                  {budgetPercentage > 100 ? `${formatCurrency(currentMonthSpent - monthlyBudget)} over budget` : `${formatCurrency(monthlyBudget - currentMonthSpent)} remaining`}
                </span>
              </div>
            </>
          )}
        </div>

        {/* 3. Spend by Category */}
        <div className="bg-white p-6 rounded-3xl shadow-[0_4px_15px_rgba(0,0,0,0.03)] border border-slate-100 animate-spring-up">
          <div className="flex items-center gap-2 mb-6">
            <PieChartIcon size={20} className="text-[#4ADE80]" />
            <h3 className="font-extrabold text-slate-800 text-lg">Spend by Category</h3>
          </div>
          
          <div className="h-64 relative">
            {categoryData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={90}
                      paddingAngle={6}
                      dataKey="value"
                      stroke="none"
                      cornerRadius={8}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', fontWeight: 'bold', padding: '12px' }}
                      itemStyle={{ color: '#1E293B', fontWeight: 'bold' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total</span>
                  <span className="text-slate-800 font-black text-xl">{formatCurrency(totalSpent)}</span>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                <PieChartIcon size={32} className="text-slate-300 mb-2" />
                <p className="text-xs font-bold text-slate-400">No data to display</p>
              </div>
            )}
          </div>
          
          {categoryData.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center mt-6">
              {categoryData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2 text-[10px] font-bold text-slate-600 capitalize bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                  <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  {getCategoryEmoji(entry.name)} {entry.name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. Price Trends */}
        <div className="bg-white p-6 rounded-3xl shadow-[0_4px_15px_rgba(0,0,0,0.03)] border border-slate-100 animate-spring-up">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={20} className="text-indigo-500" />
            <h3 className="font-extrabold text-slate-800 text-lg">Price Trends</h3>
          </div>
          
          <Select 
            value={selectedPriceItem} 
            onValueChange={setSelectedPriceItem}
            disabled={Object.keys(priceHistory).length === 0}
          >
            <SelectTrigger className="w-full mb-4">
              <SelectValue placeholder={Object.keys(priceHistory).length === 0 ? "No items tracked" : "Select an item"} />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(priceHistory).map(item => (
                <SelectItem key={item} value={item} className="capitalize">{item}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="h-48">
            {selectedPriceItem && priceHistory[selectedPriceItem] && priceHistory[selectedPriceItem].length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={priceHistory[selectedPriceItem]}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tickFormatter={(val) => format(new Date(val), 'MMM d')} fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${currency.symbol}${val}`} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} labelFormatter={(label) => format(new Date(label), 'MMM d, yyyy')} />
                  <Line type="monotone" dataKey="price" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center bg-slate-50 rounded-2xl border border-slate-100 border-dashed text-slate-400">
                <TrendingUp size={32} className="text-slate-300 mb-2" />
                <p className="text-xs font-bold">Scan receipts to see price trends</p>
              </div>
            )}
          </div>
        </div>

        {/* 5. Store Comparison */}
        <div className="bg-white p-6 rounded-3xl shadow-[0_4px_15px_rgba(0,0,0,0.03)] border border-slate-100 animate-spring-up">
          <div className="flex items-center gap-2 mb-4">
            <Store size={20} className="text-orange-500" />
            <h3 className="font-extrabold text-slate-800 text-lg">Store Comparison</h3>
          </div>
          
          <Select 
            value={selectedStoreItem} 
            onValueChange={setSelectedStoreItem}
            disabled={Object.keys(storePrices).length === 0}
          >
            <SelectTrigger className="w-full mb-4">
              <SelectValue placeholder={Object.keys(storePrices).length === 0 ? "No items tracked" : "Select an item"} />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(storePrices).map(item => (
                <SelectItem key={item} value={item} className="capitalize">{item}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedStoreItem && storePrices[selectedStoreItem] && storePrices[selectedStoreItem].length > 0 ? (
            <div className="space-y-3">
              {storePrices[selectedStoreItem].sort((a, b) => a.price - b.price).map((sp, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-700">{sp.store || 'Unknown Store'}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-800">{formatCurrency(sp.price)}</span>
                    {idx === 0 && <span className="text-[10px] font-bold bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full uppercase tracking-wider">Cheapest</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
              <Store size={32} className="mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-medium">Compare prices between stores.</p>
            </div>
          )}
        </div>

        {/* Meal Cost Analytics */}
        <div className="bg-white p-6 rounded-3xl shadow-[0_4px_15px_rgba(0,0,0,0.03)] border border-slate-100 animate-spring-up">
          <div className="flex items-center gap-2 mb-6">
            <Utensils size={20} className="text-indigo-500" />
            <h3 className="font-extrabold text-slate-800 text-lg">Meal Cost Analytics</h3>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50">
              <p className="text-xs font-bold text-indigo-600/70 uppercase tracking-wider mb-1">Weekly Cost</p>
              <p className="text-2xl font-black text-indigo-700">{formatCurrency(mealStats?.weeklyCost || 0)}</p>
              <p className="text-[10px] font-bold text-indigo-500 mt-1">{mealStats?.weeklyCount || 0} meals cooked</p>
            </div>
            <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50">
              <p className="text-xs font-bold text-emerald-600/70 uppercase tracking-wider mb-1">Avg Meal</p>
              <p className="text-2xl font-black text-emerald-700">{formatCurrency(mealStats?.avgCost || 0)}</p>
            </div>
          </div>

          {/* Meal Cost Chart */}
          <div className="mb-6">
            <h4 className="text-sm font-bold text-slate-600 mb-3">Cost Over Time</h4>
            <div className="h-48">
              {mealCostData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mealCostData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${currency.symbol}${val}`} />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      labelFormatter={(label) => `Date: ${label}`}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
                    />
                    <Line type="monotone" dataKey="cost" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} name="Meal Cost" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center bg-slate-50 rounded-2xl border border-slate-100 border-dashed text-slate-400">
                  <Activity size={32} className="text-slate-300 mb-2" />
                  <p className="text-xs font-bold">No meal cost data yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Ingredient Usage Chart */}
          <div className="mb-6">
            <h4 className="text-sm font-bold text-slate-600 mb-3">Top Ingredients Used</h4>
            <div className="h-48">
              {ingredientUsageData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ingredientUsageData} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis dataKey="name" type="category" fontSize={10} tickLine={false} axisLine={false} width={80} />
                    <Tooltip 
                      formatter={(value: number) => value}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="quantity" fill="#38BDF8" radius={[0, 4, 4, 0]} barSize={20} name="Quantity Used" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center bg-slate-50 rounded-2xl border border-slate-100 border-dashed text-slate-400">
                  <Utensils size={32} className="text-slate-300 mb-2" />
                  <p className="text-xs font-bold">No ingredient usage data</p>
                </div>
              )}
            </div>
          </div>

          {/* Insights */}
          {mealLogs.length > 0 && mealInsights.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-slate-600 mb-2">Insights</h4>
              {mealInsights.map((insight, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-indigo-500 mt-0.5">•</span>
                  <span className="font-medium">{insight}</span>
                </div>
              ))}
            </div>
          )}
          
          {mealLogs.length === 0 && (
            <div className="text-center py-4 text-slate-400">
              <p className="text-xs font-bold">Plan meals to track cooking costs and insights.</p>
            </div>
          )}
        </div>

        {/* 6. Nutrition Balance */}
        <div className="bg-white p-6 rounded-3xl shadow-[0_4px_15px_rgba(0,0,0,0.03)] border border-slate-100 animate-spring-up">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={20} className="text-emerald-500" />
            <h3 className="font-extrabold text-slate-800 text-lg">Nutrition Balance</h3>
          </div>
          
          <div className="h-48 relative">
            {nutritionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={nutritionData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={5} dataKey="value">
                    {nutritionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={NUTRITION_COLORS[entry.name] || '#94A3B8'} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                <Activity size={32} className="text-slate-300 mb-2" />
                <p className="text-xs font-bold text-slate-400">No data to display</p>
              </div>
            )}
          </div>

          {nutritionData.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {nutritionData.map(entry => (
                <div key={entry.name} className="flex items-center gap-1 text-xs font-bold text-slate-600 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: NUTRITION_COLORS[entry.name] || '#94A3B8' }} />
                  {entry.name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 7. Lifespan Intelligence */}
        <div className="bg-white p-6 rounded-3xl shadow-[0_4px_15px_rgba(0,0,0,0.03)] border border-slate-100 animate-spring-up">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={20} className="text-cyan-500" />
            <h3 className="font-extrabold text-slate-800 text-lg">Lifespan Intelligence</h3>
          </div>
          {Object.keys(lifespanData).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(lifespanData).sort((a, b) => a[0].localeCompare(b[0])).slice(0, 10).map(([item, data]) => (
                <div key={item} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-700 capitalize">{item}</span>
                  <span className="font-bold text-cyan-600 bg-cyan-100 px-2 py-1 rounded-lg text-sm">{(data as any).averageDays} days avg</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
              <Clock size={32} className="mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-medium">Track usage to see lifespan intelligence.</p>
            </div>
          )}
        </div>

        {/* Top Wasted List */}
        <div className="bg-white p-6 rounded-3xl shadow-[0_4px_15px_rgba(0,0,0,0.03)] border border-slate-100 animate-spring-up">
          <div className="flex items-center gap-2 mb-5">
            <TrendingDown size={20} className="text-rose-500" />
            <h3 className="font-extrabold text-slate-800 text-lg">Top Wasted Items 🥀</h3>
          </div>
          {topWasted.length > 0 ? (
            <div className="space-y-3">
              {topWasted.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-4 bg-rose-50/50 rounded-2xl border border-rose-100/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xl shadow-sm border border-rose-100">
                      {getCategoryEmoji(item.category)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 capitalize">{item.name}</p>
                      <p className="text-xs font-medium text-slate-500">{item.quantity} {item.unit}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-rose-600">-{formatCurrency(item.unitPrice * item.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
              <TrendingDown size={32} className="mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-medium">Great job! No wasted items recorded yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;