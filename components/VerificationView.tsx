import React, { useState } from 'react';
import { InventoryItem, Category } from '../types';
import { Check, X, Edit2, Trash2, Plus, PackageOpen } from 'lucide-react';
import { addDays } from 'date-fns';
import { motion } from 'motion/react';
import { getCategoryEmoji } from '../utils';

interface VerificationViewProps {
  items: Partial<InventoryItem>[];
  onConfirm: (items: InventoryItem[]) => void;
  onCancel: () => void;
}

const CATEGORIES: Category[] = ['produce', 'dairy', 'meat', 'pantry', 'frozen', 'bakery', 'other'];

const VerificationView: React.FC<VerificationViewProps> = ({ items: initialItems, onConfirm, onCancel }) => {
  const [items, setItems] = useState<Partial<InventoryItem>[]>(initialItems);

  const handleUpdate = (index: number, field: keyof InventoryItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleRemove = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleAddItem = () => {
    setItems([...items, {
      name: '',
      quantity: 1,
      unit: 'pcs',
      unitPrice: 0,
      category: 'other',
      shelfLifeDays: 7,
      purchaseDate: new Date().toISOString().split('T')[0]
    }]);
  };

  const handleConfirm = () => {
    const finalItems: InventoryItem[] = items.map(item => {
      const purchaseDate = item.purchaseDate || new Date().toISOString();
      const shelfLife = item.shelfLifeDays || 7;
      return {
        id: crypto.randomUUID(),
        name: item.name || 'Unknown',
        quantity: item.quantity || 1,
        unit: item.unit || 'pcs',
        unitPrice: item.unitPrice || 0,
        category: (item.category as Category) || 'other',
        purchaseDate,
        expiryDate: addDays(new Date(purchaseDate), shelfLife).toISOString(),
        isUsed: false,
        isWasted: false,
      };
    });
    onConfirm(finalItems);
  };

  return (
    <div className="flex flex-col h-full pb-24 relative">
      <div className="bg-white/60 backdrop-blur-xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] sticky top-0 z-10 rounded-b-3xl flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-[#1E293B] tracking-tight mb-1">Verify Items 🧐</h1>
          <p className="text-sm font-medium text-slate-500">Check before adding to pantry</p>
        </div>
        <button onClick={onCancel} className="p-2.5 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200 transition-colors shadow-sm">
          <X size={20} strokeWidth={3} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {items.length === 0 ? (
          <div className="text-center py-12 bg-white/50 rounded-3xl border border-slate-200 border-dashed">
            <PackageOpen size={48} className="mx-auto mb-4 text-slate-300" strokeWidth={1.5} />
            <p className="text-slate-500 font-medium">No items found.</p>
          </div>
        ) : (
          items.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white p-5 rounded-3xl shadow-[0_4px_15px_rgba(0,0,0,0.03)] border border-slate-100 relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[#4ADE80] to-[#38BDF8] opacity-50"></div>
              
              <div className="flex justify-between items-start gap-4 mb-4 pl-2">
                <div className="flex-1">
                  <input
                    type="text"
                    value={item.name || ''}
                    onChange={(e) => handleUpdate(index, 'name', e.target.value)}
                    placeholder="Item name"
                    className="font-extrabold text-slate-800 text-xl bg-transparent border-b-2 border-dashed border-slate-200 focus:border-[#4ADE80] focus:outline-none w-full capitalize placeholder:text-slate-300 pb-1 transition-colors"
                  />
                </div>
                <button onClick={() => handleRemove(index)} className="text-slate-300 hover:text-rose-500 p-2 bg-slate-50 rounded-xl hover:bg-rose-50 transition-colors">
                  <Trash2 size={18} strokeWidth={2.5} />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4 pl-2">
                <div>
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mb-1.5 block">Quantity</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={item.quantity || ''}
                      onChange={(e) => handleUpdate(index, 'quantity', parseFloat(e.target.value))}
                      className="w-16 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:border-[#4ADE80] focus:ring-4 focus:ring-[#4ADE80]/10 outline-none transition-all"
                    />
                    <input
                      type="text"
                      value={item.unit || ''}
                      onChange={(e) => handleUpdate(index, 'unit', e.target.value)}
                      className="w-16 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:border-[#4ADE80] focus:ring-4 focus:ring-[#4ADE80]/10 outline-none transition-all"
                      placeholder="unit"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mb-1.5 block">Price</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                    <input
                      type="number"
                      value={item.unitPrice || ''}
                      onChange={(e) => handleUpdate(index, 'unitPrice', parseFloat(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-7 pr-3 py-2 text-sm font-bold text-slate-700 focus:border-[#4ADE80] focus:ring-4 focus:ring-[#4ADE80]/10 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pl-2">
                <div>
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mb-1.5 block">Category</label>
                  <div className="relative">
                    <select
                      value={item.category || 'other'}
                      onChange={(e) => handleUpdate(index, 'category', e.target.value)}
                      className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-8 py-2 text-sm font-bold text-slate-700 focus:border-[#4ADE80] focus:ring-4 focus:ring-[#4ADE80]/10 outline-none capitalize transition-all"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      {getCategoryEmoji(item.category as Category || 'other')}
                    </div>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mb-1.5 block">Shelf Life (Days)</label>
                  <input
                    type="number"
                    value={item.shelfLifeDays || ''}
                    onChange={(e) => handleUpdate(index, 'shelfLifeDays', parseInt(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:border-[#4ADE80] focus:ring-4 focus:ring-[#4ADE80]/10 outline-none transition-all"
                  />
                </div>
              </div>
            </motion.div>
          ))
        )}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleAddItem}
          className="w-full border-2 border-dashed border-[#38BDF8]/30 bg-[#38BDF8]/5 text-[#38BDF8] font-bold py-4 rounded-3xl hover:bg-[#38BDF8]/10 transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={20} strokeWidth={3} />
          Add Another Item
        </motion.button>
      </div>

      <div className="fixed bottom-20 left-0 right-0 p-6 bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto">
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleConfirm}
            disabled={items.length === 0}
            className="w-full bg-gradient-to-r from-[#4ADE80] to-[#2DD4BF] text-white font-extrabold py-4 rounded-2xl shadow-[0_8px_25px_rgba(45,212,191,0.3)] hover:shadow-[0_12px_30px_rgba(45,212,191,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check size={22} strokeWidth={3} />
            Save to Pantry
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default VerificationView;
