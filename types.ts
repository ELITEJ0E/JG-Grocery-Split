
export type Category = 'produce' | 'dairy' | 'meat' | 'pantry' | 'frozen' | 'bakery' | 'other';

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  category: Category;
  purchaseDate: string; // ISO string
  expiryDate: string; // ISO string
  assignedDishId?: string; // Keep for backwards compatibility or remove if not needed
  isUsed: boolean;
  isWasted: boolean;
}

export interface RecipeIngredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface Recipe {
  id: string;
  name: string;
  ingredients: RecipeIngredient[];
  notes?: string;
  category?: string;
  isFavorite?: boolean;
}

export interface MealPlan {
  id: string;
  date: string; // YYYY-MM-DD
  recipeId: string;
  assignedItems: {
    inventoryItemId: string;
    quantity: number;
  }[];
}

export interface ShoppingListItem {
  id: string;
  name: string;
  category: Category;
  quantity: string;
  purchased: boolean;
  suggested?: boolean;
}

export type AppState = 'inventory' | 'scan' | 'planner' | 'shoppingList' | 'analytics';

export const COLORS = [
  '#ef4444', // red-500
  '#f97316', // orange-500
  '#f59e0b', // amber-500
  '#84cc16', // lime-500
  '#10b981', // emerald-500
  '#06b6d4', // cyan-500
  '#0ea5e9', // sky-500
  '#3b82f6', // blue-500
  '#6366f1', // indigo-500
  '#8b5cf6', // violet-500
  '#d946ef', // fuchsia-500
  '#ec4899', // pink-500
  '#f43f5e', // rose-500
  '#14b8a6', // teal-500
  '#a855f7', // purple-500
  '#eab308', // yellow-500
  '#22c55e', // green-500
  '#0891b2', // cyan-600
  '#2563eb', // blue-600
  '#db2777', // pink-600
];
