import React, { useState } from 'react';
import { InventoryItem, Category } from '../types';
import { Check, X, Edit2, Trash2, Plus } from 'lucide-react';
import { addDays } from 'date-fns';
import { motion } from 'motion/react';

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
    <div className="flex flex-col h-full bg-gray-50 pb-24 p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Verify Items</h1>
        <button onClick={onCancel} className="p-2 bg-gray-200 rounded-full text-gray-600 hover:bg-gray-300 transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 mb-6">
        {items.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100"
          >
            <div className="flex justify-between items-start gap-4 mb-3">
              <input
                type="text"
                value={item.name || ''}
                onChange={(e) => handleUpdate(index, 'name', e.target.value)}
                placeholder="Item name"
                className="font-bold text-gray-900 text-lg bg-transparent border-b border-dashed border-gray-300 focus:border-emerald-500 focus:outline-none w-full capitalize"
              />
              <button onClick={() => handleRemove(index)} className="text-gray-400 hover:text-red-500 p-1">
                <Trash2 size={18} />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1 block">Quantity</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={item.quantity || ''}
                    onChange={(e) => handleUpdate(index, 'quantity', parseFloat(e.target.value))}
                    className="w-16 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                  <input
                    type="text"
                    value={item.unit || ''}
                    onChange={(e) => handleUpdate(index, 'unit', e.target.value)}
                    className="w-16 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                    placeholder="unit"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1 block">Price</label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                  <input
                    type="number"
                    value={item.unitPrice || ''}
                    onChange={(e) => handleUpdate(index, 'unitPrice', parseFloat(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-6 pr-2 py-1 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1 block">Category</label>
                <select
                  value={item.category || 'other'}
                  onChange={(e) => handleUpdate(index, 'category', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none capitalize"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1 block">Shelf Life (Days)</label>
                <input
                  type="number"
                  value={item.shelfLifeDays || ''}
                  onChange={(e) => handleUpdate(index, 'shelfLifeDays', parseInt(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
          </motion.div>
        ))}

        <button
          onClick={handleAddItem}
          className="w-full border-2 border-dashed border-gray-300 text-gray-500 font-medium py-3 rounded-2xl hover:bg-gray-100 hover:text-gray-700 transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          Add Another Item
        </button>
      </div>

      <button
        onClick={handleConfirm}
        className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
      >
        <Check size={20} />
        Save to Inventory
      </button>
    </div>
  );
};

export default VerificationView;
