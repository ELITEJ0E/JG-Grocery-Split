import React, { useState } from 'react';
import { InventoryItem } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Trash2 } from 'lucide-react';

interface AnalyticsViewProps {
  inventory: InventoryItem[];
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#64748b'];

const CURRENCIES = [
  { code: 'MYR', symbol: 'RM' },
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
];

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ inventory }) => {
  const [currency, setCurrency] = useState(CURRENCIES[0]);

  const totalSpent = inventory.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  const wastedItems = inventory.filter(item => item.isWasted);
  const totalWasted = wastedItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  const wastePercentage = totalSpent > 0 ? (totalWasted / totalSpent) * 100 : 0;

  const categoryData = inventory.reduce((acc, item) => {
    const existing = acc.find(c => c.name === item.category);
    if (existing) {
      existing.value += item.unitPrice * item.quantity;
    } else {
      acc.push({ name: item.category, value: item.unitPrice * item.quantity });
    }
    return acc;
  }, [] as { name: string, value: number }[]);

  const topWasted = wastedItems
    .sort((a, b) => (b.unitPrice * b.quantity) - (a.unitPrice * a.quantity))
    .slice(0, 3);

  const formatCurrency = (value: number) => {
    return `${currency.symbol}${value.toFixed(2)}`;
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 pb-24 p-4 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <select
          value={currency.code}
          onChange={(e) => {
            const selected = CURRENCIES.find(c => c.code === e.target.value);
            if (selected) setCurrency(selected);
          }}
          className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block p-2 outline-none shadow-sm font-medium"
        >
          {CURRENCIES.map(c => (
            <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <DollarSign size={18} />
            <h3 className="font-medium text-sm uppercase tracking-wider">Total Spent</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalSpent)}</p>
        </div>
        
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 text-red-500 mb-2">
            <Trash2 size={18} />
            <h3 className="font-medium text-sm uppercase tracking-wider">Wasted</h3>
          </div>
          <p className="text-3xl font-bold text-red-600">{formatCurrency(totalWasted)}</p>
          <p className="text-xs text-red-500 font-medium mt-1">{wastePercentage.toFixed(1)}% of total</p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-8">
        <h3 className="font-bold text-gray-900 mb-6">Spend by Category</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-3 justify-center mt-4">
          {categoryData.map((entry, index) => (
            <div key={entry.name} className="flex items-center gap-2 text-sm font-medium text-gray-600 capitalize">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
              {entry.name}
            </div>
          ))}
        </div>
      </div>

      {topWasted.length > 0 && (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4">Top Wasted Items</h3>
          <div className="space-y-3">
            {topWasted.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-red-50 rounded-xl">
                <div>
                  <p className="font-semibold text-gray-900 capitalize">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.quantity} {item.unit}</p>
                </div>
                <p className="font-bold text-red-600">-{formatCurrency(item.unitPrice * item.quantity)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsView;
