import { Recipe, ShoppingListItem, Category } from './types';

export const exportRecipesToText = (recipes: Recipe[]): string => {
  return recipes.map(recipe => {
    let text = `RECIPE: ${recipe.name}\n`;
    if (recipe.category) text += `Category: ${recipe.category}\n`;
    if (recipe.notes) text += `Notes: ${recipe.notes}\n`;
    text += `Ingredients:\n`;
    recipe.ingredients.forEach(ing => {
      text += `- ${ing.quantity} ${ing.unit} ${ing.name}\n`;
    });
    return text;
  }).join('\n\n--------------------------\n\n');
};

export const parseRecipesFromText = (text: string): Partial<Recipe>[] => {
  // Split by common separators
  const blocks = text.split(/--------------------------|={3,}/);
  
  return blocks.map(block => {
    const lines = block.trim().split('\n');
    const recipe: Partial<Recipe> = { ingredients: [] };
    
    let currentSection = '';
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      // Handle various name formats
      if (trimmedLine.match(/^(🍳\s*)?RECIPE:/i)) {
        recipe.name = trimmedLine.replace(/^(🍳\s*)?RECIPE:/i, '').trim();
      } else if (trimmedLine.match(/^(📂\s*)?Category:/i)) {
        recipe.category = trimmedLine.replace(/^(📂\s*)?Category:/i, '').trim();
      } else if (trimmedLine.match(/^(📝\s*)?Notes:/i)) {
        recipe.notes = trimmedLine.replace(/^(📝\s*)?Notes:/i, '').trim();
      } else if (trimmedLine.match(/^(🛒\s*)?Ingredients:/i)) {
        currentSection = 'ingredients';
      } else if (currentSection === 'ingredients' && (trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('*'))) {
        const ingLine = trimmedLine.replace(/^[•\-*]\s*/, '').trim();
        const parts = ingLine.split(/\s+/);
        
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
      } else if (!recipe.name && trimmedLine.length > 0 && !trimmedLine.includes(':')) {
        // Fallback: if no name yet and line is just text, assume it's the name
        recipe.name = trimmedLine;
      }
    });
    
    return recipe;
  }).filter(r => r.name && r.name.length > 0);
};

export const exportShoppingListToText = (items: ShoppingListItem[]): string => {
  let text = `🛒 SHOPPING LIST\n`;
  text += `Date: ${new Date().toLocaleDateString()}\n`;
  text += `--------------------------\n\n`;
  
  const active = items.filter(i => !i.purchased);
  const purchased = items.filter(i => i.purchased);

  if (active.length > 0) {
    text += `TO BUY:\n`;
    active.forEach(item => {
      text += `[ ] ${item.quantity} ${item.name} (${item.category})\n`;
    });
    text += `\n`;
  }

  if (purchased.length > 0) {
    text += `PURCHASED:\n`;
    purchased.forEach(item => {
      text += `[x] ${item.quantity} ${item.name} (${item.category})\n`;
    });
  }
  
  return text;
};

export const parseShoppingListFromText = (text: string): Partial<ShoppingListItem>[] => {
  const lines = text.split('\n');
  const items: Partial<ShoppingListItem>[] = [];
  
  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.includes('---') || trimmed.includes('SHOPPING LIST')) return;

    // Match lines starting with common list markers
    const listMarkerMatch = trimmed.match(/^([✅⬜•\-*]|\[\s*\]|\[x\])\s*(.*)/i);
    let content = trimmed;
    let purchased = false;

    if (listMarkerMatch) {
      const marker = listMarkerMatch[1].toLowerCase();
      purchased = marker === '✅' || marker === '[x]';
      content = listMarkerMatch[2].trim();
    } else if (trimmed.match(/^\d/)) {
      // If starts with a number, treat as an item
      content = trimmed;
    } else {
      // Skip headers like "TO BUY:" or "PURCHASED:"
      if (trimmed.endsWith(':')) return;
      content = trimmed;
    }

    if (!content) return;

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
    
    const parts = nameAndQty.split(/\s+/);
    if (parts.length >= 2 && !isNaN(parseFloat(parts[0]))) {
      const quantity = parts[0];
      const name = parts.slice(1).join(' ');
      items.push({
        name,
        quantity,
        category,
        purchased
      });
    } else {
      items.push({
        name: nameAndQty,
        quantity: '1',
        category,
        purchased
      });
    }
  });
  
  return items;
};
