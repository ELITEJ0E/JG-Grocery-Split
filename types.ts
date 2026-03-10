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
  assignedDishId?: string;
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

export type AppState = 'kitchen' | 'inventory' | 'scan' | 'planner' | 'shoppingList' | 'analytics';

export const COLORS = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#84cc16',
  '#10b981',
  '#06b6d4',
  '#0ea5e9',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#d946ef',
  '#ec4899',
  '#f43f5e',
  '#14b8a6',
  '#a855f7',
  '#eab308',
  '#22c55e',
  '#0891b2',
  '#2563eb',
  '#db2777',
];