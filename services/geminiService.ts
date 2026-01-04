import { GoogleGenAI, Type } from "@google/genai";
import { Item } from "../types";

// Access environment variables safely for Vite
const env = (import.meta as any).env || {};
// Fallback to process.env for other environments, but prioritize VITE_ prefix for browser
const apiKey = env.VITE_GEMINI_API_KEY || process.env.API_KEY || '';

if (!apiKey) {
    console.error("CRITICAL: Gemini API Key is missing! Set VITE_GEMINI_API_KEY in your environment.");
}

const ai = new GoogleGenAI({ apiKey: apiKey });

export interface MatchResult {
  confidenceScore: number;
  reasons: string[];
}

export interface ImageAnalysisResult {
  dominantColors: string[];
  objectType: string;
  features: string[];
}

// Robust JSON cleaner
function cleanJsonString(text: string): string {
  if (!text) return "{}";
  let cleaned = text.trim();
  // Remove markdown code blocks
  cleaned = cleaned.replace(/```json/g, '').replace(/```/g, '');
  // Find the first '{' and last '}'
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  return cleaned;
}

interface ImageData {
    data: string;
    mimeType: string;
}

async function getImageData(input: string): Promise<ImageData | null> {
  if (!input) return null;
  
  try {
      if (input.startsWith('data:')) {
          const matches = input.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
              return { mimeType: matches[1], data: matches[2] };
          }
          const parts = input.split(',');
          return { mimeType: 'image/jpeg', data: parts[1] };
      }

      // Check if it's a valid URL before fetching
      try {
        new URL(input);
      } catch {
        return null;
      }

      const response = await fetch(input);
      if (!response.ok) throw new Error(`Failed to fetch image`);
      
      const blob = await response.blob();
      const mimeType = blob.type || 'image/jpeg';
      
      return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
              const base64Full = reader.result as string;
              const base64Data = base64Full.split(',')[1];
              resolve({ mimeType, data: base64Data });
          };
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
      });
  } catch (e) {
      // Use this to debug if images are failing to load (e.g. CORS)
      // console.warn("Image processing failed, proceeding with text only:", e);
      return null;
  }
}

export const analyzeImage = async (imageUrl: string): Promise<ImageAnalysisResult> => {
  try {
    const imageData = await getImageData(imageUrl);
    const prompt = `
      Analyze this image of a lost or found item.
      Identify:
      1. Dominant colors.
      2. Object type (e.g. Wallet, Phone).
      3. Unique features.
      Return JSON.
    `;

    const parts: any[] = [{ text: prompt }];
    if (imageData) {
        parts.unshift({ inlineData: { mimeType: imageData.mimeType, data: imageData.data } });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', 
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            dominantColors: { type: Type.ARRAY, items: { type: Type.STRING } },
            objectType: { type: Type.STRING },
            features: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    const result = JSON.parse(cleanJsonString(response.text || '{}'));
    return {
      dominantColors: result.dominantColors || [],
      objectType: result.objectType || 'Unknown',
      features: result.features || []
    };
  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    return { dominantColors: [], objectType: 'Unknown', features: [] };
  }
};

export const matchItems = async (lostItem: Item, foundItem: Item): Promise<MatchResult> => {
  try {
    // console.log(`[Gemini] Matching ${lostItem.title} vs ${foundItem.title}`);
    
    const lostImageData = await getImageData(lostItem.image);
    const foundImageData = await getImageData(foundItem.image);

    const prompt = `
      Compare these two items (Lost vs Found).
      
      RULES:
      1. IGNORE ownership. Even if they have the same name or look like the same user, match based on the item description/image.
      2. If titles or descriptions are similar (e.g. "Black Wallet" vs "Leather Wallet"), give a high score (>70).
      3. Be flexible with typos.
      4. If images are missing, rely heavily on text.
      5. Return ONLY JSON.
      
      Lost Item:
      Title: ${lostItem.title}
      Desc: ${lostItem.description}
      Category: ${lostItem.category}
      Color: ${lostItem.color}
      
      Found Item:
      Title: ${foundItem.title}
      Desc: ${foundItem.description}
      Category: ${foundItem.category}
      Color: ${foundItem.color}

      Return JSON with:
      confidenceScore: number (0-100).
      reasons: array of strings (max 3 brief reasons).
    `;

    const parts: any[] = [{ text: prompt }];

    if (lostImageData) {
        parts.push({ inlineData: { mimeType: lostImageData.mimeType, data: lostImageData.data } });
    }
    if (foundImageData) {
        parts.push({ inlineData: { mimeType: foundImageData.mimeType, data: foundImageData.data } });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            confidenceScore: { type: Type.NUMBER },
            reasons: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    const text = response.text || '{}';
    const result = JSON.parse(cleanJsonString(text));
    
    // console.log(`[Gemini] Match Result: ${result.confidenceScore}% for ${lostItem.title} vs ${foundItem.title}`);
    
    return {
      confidenceScore: result.confidenceScore || 0,
      reasons: result.reasons || []
    };

  } catch (error: any) {
    console.error("Gemini Match Error:", error);
    return { confidenceScore: 0, reasons: [] };
  }
};