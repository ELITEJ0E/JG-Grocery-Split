import { Category } from './types';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getCategoryEmoji = (category: Category | string): string => {
  switch (category.toLowerCase()) {
    case 'produce': return '🥬';
    case 'dairy': return '🥛';
    case 'meat': return '🍗';
    case 'pantry': return '🥫';
    case 'frozen': return '❄️';
    case 'bakery': return '🥐';
    default: return '📦';
  }
};

export const getCategoryColor = (category: Category | string): string => {
  switch (category.toLowerCase()) {
    case 'produce': return 'bg-green-100 text-green-700 border-green-200';
    case 'dairy': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'meat': return 'bg-rose-100 text-rose-700 border-rose-200';
    case 'pantry': return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'frozen': return 'bg-cyan-100 text-cyan-700 border-cyan-200';
    case 'bakery': return 'bg-orange-100 text-orange-700 border-orange-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};
