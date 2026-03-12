import { Recipe, ShoppingListItem, Category } from './types';

export const exportRecipesToText = (recipes: Recipe[]): string => {
  return recipes.map(recipe => {
    let text = `🍳 RECIPE: ${recipe.name}\n`;
    if (recipe.category) text += `📂 Category: ${recipe.category}\n`;
    if (recipe.notes) text += `📝 Notes: ${recipe.notes}\n`;
    text += `🛒 Ingredients:\n`;
    recipe.ingredients.forEach(ing => {
      text += `• ${ing.quantity} ${ing.unit} ${ing.name}\n`;
    });
    return text;
  }).join('\n--------------------------\n\n');
};

export const parseRecipesFromText = (text: string): Partial<Recipe>[] => {
  const blocks = text.split(/--------------------------/);
  return blocks.map(block => {
    const lines = block.trim().split('\n');
    const recipe: Partial<Recipe> = { ingredients: [] };
    
    let currentSection = '';
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('🍳 RECIPE:')) {
        recipe.name = trimmedLine.replace('🍳 RECIPE:', '').trim();
      } else if (trimmedLine.startsWith('📂 Category:')) {
        recipe.category = trimmedLine.replace('📂 Category:', '').trim();
      } else if (trimmedLine.startsWith('📝 Notes:')) {
        recipe.notes = trimmedLine.replace('📝 Notes:', '').trim();
      } else if (trimmedLine.startsWith('🛒 Ingredients:')) {
        currentSection = 'ingredients';
      } else if (trimmedLine.startsWith('•') && currentSection === 'ingredients') {
        const ingLine = trimmedLine.replace('•', '').trim();
        const parts = ingLine.split(' ');
        if (parts.length >= 3) {
          const quantity = parseFloat(parts[0]);
          const unit = parts[1];
          const name = parts.slice(2).join(' ');
          recipe.ingredients?.push({ name, quantity: isNaN(quantity) ? 1 : quantity, unit });
        } else if (parts.length === 2) {
          const quantity = parseFloat(parts[0]);
          const name = parts[1];
          recipe.ingredients?.push({ name, quantity: isNaN(quantity) ? 1 : quantity, unit: 'pcs' });
        } else {
          recipe.ingredients?.push({ name: ingLine, quantity: 1, unit: 'pcs' });
        }
      }
    });
    
    return recipe;
  }).filter(r => r.name);
};

export const exportShoppingListToText = (items: ShoppingListItem[]): string => {
  let text = `🛒 SHOPPING LIST\n`;
  text += `Date: ${new Date().toLocaleDateString()}\n`;
  text += `--------------------------\n\n`;
  
  items.forEach(item => {
    text += `${item.purchased ? '✅' : '⬜'} ${item.quantity} ${item.name} (${item.category})\n`;
  });
  
  return text;
};

export const parseShoppingListFromText = (text: string): Partial<ShoppingListItem>[] => {
  const lines = text.split('\n');
  const items: Partial<ShoppingListItem>[] = [];
  
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('✅') || trimmed.startsWith('⬜') || trimmed.startsWith('•') || trimmed.startsWith('-')) {
      const content = trimmed.replace(/^[✅⬜•-]\s*/, '').trim();
      
      const categoryMatch = content.match(/\(([^)]+)\)$/);
      let category: Category = 'other';
      let nameAndQty = content;
      
      if (categoryMatch) {
        const catStr = categoryMatch[1].toLowerCase();
        const validCategories: Category[] = ['produce', 'dairy', 'meat', 'pantry', 'frozen', 'bakery', 'other'];
        if (validCategories.includes(catStr as Category)) {
          category = catStr as Category;
        }
        nameAndQty = content.replace(/\s*\([^)]+\)$/, '').trim();
      }
      
      const parts = nameAndQty.split(' ');
      if (parts.length >= 2) {
        const quantity = parts[0];
        const name = parts.slice(1).join(' ');
        items.push({
          name,
          quantity,
          category,
          purchased: trimmed.startsWith('✅')
        });
      } else {
        items.push({
          name: nameAndQty,
          quantity: '1',
          category,
          purchased: trimmed.startsWith('✅')
        });
      }
    }
  });
  
  return items;
};
