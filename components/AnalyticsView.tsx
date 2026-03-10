import React, { useState } from 'react';
import { InventoryItem } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Trash2, PieChart as PieChartIcon, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { getCategoryEmoji } from '../utils';

interface AnalyticsViewProps {
  inventory: InventoryItem[];
}

const COLORS = ['#4ADE80', '#38BDF8', '#2DD4BF', '#FBBF24', '#F472B6', '#A78BFA', '#94A3B8'];

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
    <div className="flex flex-col h-full pb-28 relative">
      <div className="bg-white/60 backdrop-blur-xl px-6 pt-8 pb-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] sticky top-0 z-10 rounded-b-3xl flex justify-between items-center">
        <h1 className="text-3xl font-extrabold text-[#1E293B] tracking-tight">Stats 📊</h1>
        <div className="relative">
          <select
            value={currency.code}
            onChange={(e) => {
              const selected = CURRENCIES.find(c => c.code === e.target.value);
              if (selected) setCurrency(selected);
            }}
            className="appearance-none bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl pl-4 pr-10 py-2.5 outline-none shadow-sm focus:border-[#4ADE80] focus:ring-4 focus:ring-[#4ADE80]/10 transition-all cursor-pointer"
          >
            {CURRENCIES.map(c => (
              <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-[#4ADE80]/10 to-[#38BDF8]/10 p-5 rounded-3xl shadow-[0_4px_15px_rgba(0,0,0,0.03)] border border-white"
          >
            <div className="flex items-center gap-2 text-[#38BDF8] mb-3">
              <div className="p-2 bg-white rounded-xl shadow-sm">
                <DollarSign size={20} strokeWidth={2.5} />
              </div>
              <h3 className="font-extrabold text-xs uppercase tracking-wider">Total Spent</h3>
            </div>
            <p className="text-3xl font-black text-slate-800 tracking-tight">{formatCurrency(totalSpent)}</p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-rose-50 to-orange-50 p-5 rounded-3xl shadow-[0_4px_15px_rgba(0,0,0,0.03)] border border-white"
          >
            <div className="flex items-center gap-2 text-rose-500 mb-3">
              <div className="p-2 bg-white rounded-xl shadow-sm">
                <Trash2 size={20} strokeWidth={2.5} />
              </div>
              <h3 className="font-extrabold text-xs uppercase tracking-wider">Wasted</h3>
            </div>
            <p className="text-3xl font-black text-rose-600 tracking-tight">{formatCurrency(totalWasted)}</p>
            <div className="mt-2 inline-flex items-center gap-1 bg-white/60 px-2 py-1 rounded-lg">
              <AlertTriangle size={12} className="text-rose-500" />
              <p className="text-xs text-rose-600 font-bold">{wastePercentage.toFixed(1)}% of total</p>
            </div>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-3xl shadow-[0_4px_15px_rgba(0,0,0,0.03)] border border-slate-100"
        >
          <div className="flex items-center gap-2 mb-6">
            <PieChartIcon size={20} className="text-[#4ADE80]" />
            <h3 className="font-extrabold text-slate-800 text-lg">Spend by Category</h3>
          </div>
          
          {categoryData.length > 0 ? (
            <>
              <div className="h-64 relative">
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
                      contentStyle={{ 
                        borderRadius: '16px', 
                        border: 'none', 
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                        fontWeight: 'bold',
                        padding: '12px'
                      }}
                      itemStyle={{ color: '#1E293B', fontWeight: 'bold' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total</span>
                  <span className="text-slate-800 font-black text-xl">{formatCurrency(totalSpent)}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 justify-center mt-6">
                {categoryData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2 text-sm font-bold text-slate-600 capitalize bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                    <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    {getCategoryEmoji(entry.name)} {entry.name}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
              <PieChartIcon size={40} className="mx-auto mb-3 text-slate-300" />
              <p className="font-medium">No spending data yet.</p>
            </div>
          )}
        </motion.div>

        {topWasted.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white p-6 rounded-3xl shadow-[0_4px_15px_rgba(0,0,0,0.03)] border border-slate-100"
          >
            <div className="flex items-center gap-2 mb-5">
              <TrendingDown size={20} className="text-rose-500" />
              <h3 className="font-extrabold text-slate-800 text-lg">Top Wasted Items 🥀</h3>
            </div>
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
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsView;