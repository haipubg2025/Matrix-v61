
import { GoogleGenAI } from "@google/genai";

export class EmbeddingService {
  private ai: GoogleGenAI | null = null;

  private getAi(providedKey?: string): GoogleGenAI {
    const apiKey = providedKey || process.env.GEMINI_API_KEY || (process.env as any).API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY || "";
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set for EmbeddingService");
    }
    // Always create a new instance if a key is provided to ensure we use the latest one
    if (providedKey || !this.ai) {
      return new GoogleGenAI({ apiKey });
    }
    return this.ai;
  }

  /**
   * Generates an embedding for the given text using gemini-embedding-2-preview.
   * Falls back to gemini-embedding-001 if the primary model fails.
   */
  public async getEmbedding(text: string, apiKey?: string): Promise<number[]> {
    try {
      const ai = this.getAi(apiKey);
      const result = await ai.models.embedContent({
        model: "gemini-embedding-2-preview",
        contents: [{ parts: [{ text }] }]
      });
      return result.embeddings[0].values;
    } catch (error) {
      console.warn("Primary embedding model failed, falling back to gemini-embedding-001:", error);
      try {
        const ai = this.getAi(apiKey);
        const fallbackResult = await ai.models.embedContent({
          model: "gemini-embedding-001",
          contents: [{ parts: [{ text }] }]
        });
        return fallbackResult.embeddings[0].values;
      } catch (fallbackError) {
        console.error("Fallback embedding model also failed:", fallbackError);
        return new Array(768).fill(0); 
      }
    }
  }

  /**
   * Generates a multimodal embedding (e.g., text + image).
   * Falls back to gemini-embedding-001 (text-only) if the primary model fails.
   */
  public async getMultimodalEmbedding(parts: any[], apiKey?: string): Promise<number[]> {
    try {
      const ai = this.getAi(apiKey);
      const result = await ai.models.embedContent({
        model: "gemini-embedding-2-preview",
        contents: [{ parts }]
      });
      return result.embeddings[0].values;
    } catch (error) {
      console.warn("Primary multimodal embedding failed, falling back to text-only embedding:", error);
      try {
        const ai = this.getAi(apiKey);
        // Extract text parts for fallback (gemini-embedding-001 only supports text)
        const textContent = parts
          .filter(p => p.text)
          .map(p => p.text)
          .join(" ");
        
        if (!textContent) {
          console.error("No text content available for fallback embedding.");
          return new Array(768).fill(0);
        }

        const fallbackResult = await ai.models.embedContent({
          model: "gemini-embedding-001",
          contents: [{ parts: [{ text: textContent }] }]
        });
        return fallbackResult.embeddings[0].values;
      } catch (fallbackError) {
        console.error("Fallback multimodal embedding failed:", fallbackError);
        return new Array(768).fill(0);
      }
    }
  }

  /**
   * Calculates cosine similarity between two vectors.
   */
  public cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

export const embeddingService = new EmbeddingService();
