
import { GoogleGenAI } from "@google/genai";
import { UserLocation } from "../types";

export class GeminiService {
  private ai: GoogleGenAI | null = null;
  private apiKey: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    if (this.apiKey) {
      try {
        this.ai = new GoogleGenAI({ apiKey: this.apiKey });
      } catch (error) {
        console.error('Failed to initialize Gemini AI:', error);
      }
    } else {
      console.warn('VITE_GEMINI_API_KEY not set. AI features will be disabled.');
    }
  }

  async exploreArea(prompt: string, location?: UserLocation) {
    if (!this.ai) {
      return {
        text: "AI service is not available. Please check your API key configuration.",
        groundingChunks: []
      };
    }

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleMaps: {} }],
          toolConfig: {
            retrievalConfig: {
              latLng: location ? {
                latitude: location.latitude,
                longitude: location.longitude
              } : undefined
            }
          }
        },
      });

      return {
        text: response.text || "I couldn't find specific information for that request.",
        groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
      };
    } catch (error) {
      console.error("Gemini API Error:", error);
      return {
        text: "I encountered an error processing your request. Please try again.",
        groundingChunks: []
      };
    }
  }
}

export const geminiService = new GeminiService();
