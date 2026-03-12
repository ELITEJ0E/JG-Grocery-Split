import { GoogleGenAI, Type } from "@google/genai";
import { InventoryItem } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const parseReceiptImage = async (base64Image: string): Promise<{ items: Partial<InventoryItem>[], purchaseDate: string, store?: string }> => {
  // Strip the data:image/jpeg;base64, prefix if present
  const base64Data = base64Image.split(',')[1] || base64Image;
  const mimeType = base64Image.split(';')[0].split(':')[1] || "image/jpeg";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: base64Data
            }
          },
          {
            text: `Analyze this grocery receipt and extract the purchased items. 
            For each item, provide:
            - name (normalized, singular form)
            - quantity (number)
            - unit (e.g., kg, liter, piece, pack)
            - unitPrice (number)
            - category (must be exactly one of: 'produce', 'dairy', 'meat', 'pantry', 'frozen', 'bakery', 'other')
            - shelfLifeDays (estimated shelf life in days based on the category and item type)
            
            Also extract the purchaseDate if available (YYYY-MM-DD), otherwise use today's date.
            Extract the store name if visible on the receipt.
            `
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            purchaseDate: { type: Type.STRING },
            store: { type: Type.STRING },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  unit: { type: Type.STRING },
                  unitPrice: { type: Type.NUMBER },
                  category: { type: Type.STRING },
                  shelfLifeDays: { type: Type.NUMBER },
                },
                required: ["name", "quantity", "unit", "unitPrice", "category", "shelfLifeDays"]
              }
            }
          },
          required: ["items"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No data returned from Gemini");
    }

    const data = JSON.parse(text);
    
    return {
      items: data.items || [],
      purchaseDate: data.purchaseDate || new Date().toISOString().split('T')[0],
      store: data.store
    };

  } catch (error) {
    console.error("Error parsing receipt with Gemini:", error);
    throw error;
  }
};

export const identifyProductImage = async (base64Image: string): Promise<Partial<InventoryItem> | null> => {
  const base64Data = base64Image.split(',')[1] || base64Image;
  const mimeType = base64Image.split(';')[0].split(':')[1] || "image/jpeg";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: base64Data
            }
          },
          {
            text: `Identify this grocery product from the image.
            Return a JSON object with:
            - name (string, normalized, singular form)
            - quantity (number, default 1)
            - unit (string, e.g., 'pack', 'bottle', 'piece')
            - unitPrice (number, estimate if unknown)
            - category (must be exactly one of: 'produce', 'dairy', 'meat', 'pantry', 'frozen', 'bakery', 'other')
            - shelfLifeDays (number, estimated shelf life)
            
            If you cannot identify the product, return an empty object {}.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            quantity: { type: Type.NUMBER },
            unit: { type: Type.STRING },
            unitPrice: { type: Type.NUMBER },
            category: { type: Type.STRING },
            shelfLifeDays: { type: Type.NUMBER },
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      return null;
    }
    
    const data = JSON.parse(text);
    if (!data.name) return null;
    
    return data;
  } catch (error) {
    console.error("Error identifying product image:", error);
    return null;
  }
};

export const searchBarcode = async (barcode: string): Promise<Partial<InventoryItem> | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `I scanned a grocery product barcode: ${barcode}. 
      Can you identify this product and provide its details?
      Return a JSON object with:
      - name (string)
      - quantity (number, default 1)
      - unit (string, e.g., 'pack', 'bottle')
      - unitPrice (number, estimate if unknown)
      - category (must be exactly one of: 'produce', 'dairy', 'meat', 'pantry', 'frozen', 'bakery', 'other')
      - shelfLifeDays (number, estimated shelf life)
      
      If you cannot identify the product, return an empty object {}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            quantity: { type: Type.NUMBER },
            unit: { type: Type.STRING },
            unitPrice: { type: Type.NUMBER },
            category: { type: Type.STRING },
            shelfLifeDays: { type: Type.NUMBER },
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      return null;
    }
    
    const data = JSON.parse(text);
    if (!data.name) return null;
    
    return data;
  } catch (error) {
    console.error("Error searching barcode:", error);
    return null;
  }
};