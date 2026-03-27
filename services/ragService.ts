
import { GameGenre, CodexEntry, WritingStyle } from "../types";
import { CORE_MODULE } from "../prompts/coreModule";
import { NPC_MODULE } from "../prompts/npcModule";
import { INTEGRITY_MODULE, SOCIAL_INTELLIGENCE_MODULE } from "../prompts/integrityModule";
import { PHYSICAL_MODULE } from "../prompts/physicalModule";
import { ADULT_MODULE } from "../prompts/adultModule";
import { SAFE_MODE_RULES } from "../prompts/safeModeRules";
import { embeddingService } from "./embeddingService";

// Genre-specific rules
import { FEMALE_PHYSICAL_WUXIA_RULES } from "../prompts/femalePhysicalWuxiaRules";
import { FEMALE_PHYSICAL_URBAN_RULES } from "../prompts/femalePhysicalUrbanRules";
import { FEMALE_PHYSICAL_FANTASY_RULES } from "../prompts/femalePhysicalFantasyRules";

export interface RagContext {
  action: string;
  genre: GameGenre;
  isAdultEnabled: boolean;
  hasNpcs: boolean;
  writingStyle?: WritingStyle;
  unlockedCodex?: CodexEntry[];
  actionEmbedding?: number[];
}

export class RagService {
  /**
   * Truy xuất quy tắc theo thể loại
   */
  private getGenreRules(genre: GameGenre): string {
    switch (genre) {
      case GameGenre.WUXIA: 
      case GameGenre.CULTIVATION:
        return FEMALE_PHYSICAL_WUXIA_RULES;
      case GameGenre.URBAN_NORMAL: 
      case GameGenre.URBAN_SUPERNATURAL: 
        return FEMALE_PHYSICAL_URBAN_RULES;
      case GameGenre.FANTASY_HUMAN:
      case GameGenre.FANTASY_MULTIRACE: 
        return FEMALE_PHYSICAL_FANTASY_RULES;
      default: return "";
    }
  }

  /**
   * Truy xuất các mục Codex liên quan
   */
  private getCodexContext(action: string, codex?: CodexEntry[]): string {
    if (!codex || codex.length === 0 || !action) return "";
    
    const relevantEntries = codex.filter(entry => {
      const keywords = (entry.title || '').toLowerCase().split(" ");
      return keywords.some(key => key.length > 2 && action.toLowerCase().includes(key));
    });

    if (relevantEntries.length === 0) return "";

    return `
      KIẾN THỨC THẾ GIỚI (UNLOCKED LORE):
      ${relevantEntries.map(e => `[${e.title}]: ${e.content}`).join("\n")}
    `;
  }

  /**
   * Hàm chính để lấy Prompt đã tối ưu hóa (RAG)
   */
  public assembleOptimizedPrompt(context: RagContext): string {
    const chunks: string[] = [];

    // 1. Codex Context
    const codex = this.getCodexContext(context.action, context.unlockedCodex);
    if (codex) chunks.push(codex);

    // 2. Core Module
    chunks.push(CORE_MODULE);

    // 3. Genre Rules
    const genreRules = this.getGenreRules(context.genre);
    if (genreRules) chunks.push(genreRules);

    // 4. NPC & Physical Rules
    if (context.hasNpcs) {
      chunks.push(NPC_MODULE);
      chunks.push(INTEGRITY_MODULE);
      chunks.push(SOCIAL_INTELLIGENCE_MODULE);
      chunks.push(PHYSICAL_MODULE);
      
      if (!context.isAdultEnabled) {
        chunks.push(SAFE_MODE_RULES);
      }
    }

    // 5. Adult Module
    if (context.isAdultEnabled) {
      chunks.push(ADULT_MODULE);
    } else {
      chunks.push("LƯU Ý: Nội dung 18+ đang bị TẮT. Tuyệt đối KHÔNG miêu tả bất kỳ hành động nhạy cảm nào.");
    }

    // 6. Writing Style
    if (context.writingStyle && context.writingStyle !== WritingStyle.DEFAULT) {
      chunks.push(`PHONG CÁCH VIẾT (WRITING STYLE): ${context.writingStyle}. Hãy tuân thủ nghiêm ngặt văn phong này trong suốt câu chuyện.`);
    }

    return chunks.filter(c => c.trim() !== "").join("\n\n");
  }
}

export const ragService = new RagService();
