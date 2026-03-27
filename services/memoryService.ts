
import { GoogleGenAI } from "@google/genai";
import { GameLog, MemoryEntry, MemoryState, AiModel, AppSettings } from "../types";
import { embeddingService } from "./embeddingService";

export class MemoryService {
  private state: MemoryState = {
    worldSummary: "Câu chuyện vừa bắt đầu.",
    chronicle: "",
    memories: [],
    lastSummarizedTurn: 0,
  };

  /**
   * Cập nhật bộ nhớ dựa trên logs mới
   * Sử dụng AI để trích xuất các "atomic memories" (sự kiện/sự thật nguyên tử)
   */
  public async updateMemory(logs: GameLog[], turn: number, force: boolean = false, settings?: AppSettings): Promise<void> {
    // Cho phép cập nhật mỗi lượt nếu cần, nhưng vẫn giữ một khoảng nghỉ nhỏ để tránh spam API liên tục trong 1 lượt
    if (!force && this.state.memories.length > 0 && turn - this.state.lastSummarizedTurn < 10) return;

    let apiKeyToUse = process.env.GEMINI_API_KEY || (process.env as any).API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY || "";
    
    if (settings?.userApiKeys && settings.userApiKeys.length > 0) {
      // Use the first available user key if system key is missing or as an alternative
      apiKeyToUse = settings.userApiKeys[0];
    }

    if (!apiKeyToUse) {
      throw new Error("API key must be set when using the Gemini API. Please check your settings.");
    }

    const ai = new GoogleGenAI({ apiKey: apiKeyToUse });
    const recentLogs = logs.slice(-20).map(l => `[${l.type.toUpperCase()}] ${l.content}`).join("\n");

    const extractionPrompt = `
      Bạn là một "Quantum Memory Manager". Nhiệm vụ của bạn là trích xuất các ký ức quan trọng từ nhật ký game RPG dưới đây.
      
      NHẬT KÝ GẦN ĐÂY:
      ${recentLogs}

      KÝ ỨC HIỆN TẠI (TÓM TẮT):
      ${this.state.worldSummary}

      HÃY TRÍCH XUẤT:
      1. Các sự thật (Facts): Về thế giới, địa điểm, quy luật, hoặc thông tin mới về nhân vật.
      2. Sự kiện (Events): Những hành động, cuộc hội thoại hoặc biến cố vừa xảy ra.
      3. Mối quan hệ (Relationships): Thay đổi trong tình cảm, thái độ hoặc thông tin về NPC.
      4. Sở thích/Thói quen (Preferences): Của MC hoặc NPC.

      TIÊU CHÍ CHẤM ĐIỂM QUAN TRỌNG (importance 1-100):
      - 90-100: Biến cố cực lớn, thay đổi vĩnh viễn thế giới hoặc vận mệnh nhân vật chính, cái chết của NPC quan trọng.
      - 70-89: Sự kiện quan trọng, gặp NPC mới có tên tuổi, thay đổi lớn trong quan hệ, hoàn thành nhiệm vụ lớn.
      - 40-69: Thông tin hữu ích, hội thoại có chiều sâu, khám phá địa điểm mới, vật phẩm hiếm.
      - 20-39: Chi tiết nhỏ, thói quen, sở thích, thông tin bổ trợ bối cảnh.
      - < 20: Thông tin vụn vặt, không đáng lưu trữ lâu dài.

      YÊU CẦU:
      - Trích xuất các thông tin giúp xây dựng bối cảnh và tính cách nhân vật.
      - Mỗi ký ức phải là một câu khẳng định ngắn gọn, độc lập.
      - Nếu lượt vừa qua không có thông tin gì mới đáng kể, hãy để "extractedMemories" là mảng rỗng [].

      TRẢ VỀ JSON (VÀ CHỈ JSON):
      {
        "newWorldSummary": "Bản tóm tắt thế giới mới. Phải bao gồm: Địa điểm hiện tại, mục tiêu ngắn hạn của MC, các NPC quan trọng đang có mặt, và tình trạng cốt truyện chính. (Ngắn gọn < 150 từ)",
        "extractedMemories": [
          { 
            "content": "Nội dung ký ức", 
            "type": "fact/event/relationship/preference", 
            "importance": 1-100,
            "reasoning": "Giải thích ngắn gọn tại sao chấm điểm này"
          }
        ]
      }
    `;

    try {
      let responseText = "";
      const flashModels = [
        AiModel.FLASH_3,
        AiModel.FLASH_25,
      ];

      let lastError = null;
      for (const modelName of flashModels) {
        try {
          console.log(`[SEMANTIC_MEMORY]: Attempting memory extraction with ${modelName}...`);
          const response = await ai.models.generateContent({
            model: modelName,
            contents: extractionPrompt,
            config: { responseMimeType: "application/json" }
          });
          responseText = response.text || "";
          if (responseText) {
            console.log(`[SEMANTIC_MEMORY]: Successfully used ${modelName}`);
            break; 
          }
        } catch (err) {
          console.warn(`[SEMANTIC_MEMORY]: ${modelName} failed, trying next fallback...`, err);
          lastError = err;
          continue;
        }
      }

      if (!responseText && lastError) {
        throw lastError;
      }

      if (responseText) {
        const jsonStr = this.extractValidJson(responseText);
        const result = JSON.parse(jsonStr);
        
        this.state.worldSummary = result.newWorldSummary || this.state.worldSummary;
        this.state.lastSummarizedTurn = turn;

        if (result.extractedMemories && Array.isArray(result.extractedMemories)) {
          console.log(`[SEMANTIC_MEMORY]: Extracted ${result.extractedMemories.length} memories`);
          for (const mem of result.extractedMemories) {
            if (mem && mem.content) {
              await this.upsertMemory(mem.content, mem.type || 'event', mem.importance || 50, apiKeyToUse, mem.reasoning);
            }
          }
        }

        // Tự động ghim ký ức trên 85 điểm và giữ lại ký ức trên 20 điểm
        this.state.memories = this.state.memories.filter(m => {
          if (m.metadata.importance > 85) {
            m.metadata.isPinned = true;
          }
          return m.metadata.importance >= 20;
        });

        // Giới hạn số lượng ký ức để tránh quá tải
        if (this.state.memories.length > 200) {
          // Ưu tiên giữ lại ký ức được ghim, sau đó là quan trọng, sau đó là mới nhất
          this.state.memories.sort((a, b) => {
            if (a.metadata.isPinned && !b.metadata.isPinned) return -1;
            if (!a.metadata.isPinned && b.metadata.isPinned) return 1;
            const scoreA = (a.metadata.importance * 2) + (a.metadata.lastUpdated / 1000000000);
            const scoreB = (b.metadata.importance * 2) + (b.metadata.lastUpdated / 1000000000);
            return scoreB - scoreA;
          });
          this.state.memories = this.state.memories.slice(0, 200);
        }
      }
    } catch (e) {
      console.error("[SEMANTIC_MEMORY]: Update failed:", e);
      throw e; // Re-throw to allow UI to handle error
    }
  }

  private extractValidJson(text: string): string {
    const jsonRegex = /\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}/g;
    const matches = text.match(jsonRegex);
    if (matches && matches.length > 0) {
      return matches.reduce((a, b) => a.length > b.length ? a : b);
    }
    const simpleMatch = text.match(/\{[\s\S]*\}/);
    return simpleMatch ? simpleMatch[0] : text;
  }

  /**
   * Thêm hoặc cập nhật một ký ức dựa trên độ tương đồng ngữ nghĩa
   */
  private async upsertMemory(content: string, type: any, importance: number, apiKey?: string, reasoning?: string): Promise<void> {
    const embedding = await embeddingService.getEmbedding(content, apiKey);
    
    // Tìm xem có ký ức nào tương tự không (để cập nhật thay vì thêm mới)
    let existingIdx = -1;
    let maxSim = 0;

    for (let i = 0; i < this.state.memories.length; i++) {
      const sim = embeddingService.cosineSimilarity(embedding, this.state.memories[i].embedding);
      if (sim > 0.92) { // Độ tương đồng rất cao, coi như cùng một chủ đề
        if (sim > maxSim) {
          maxSim = sim;
          existingIdx = i;
        }
      }
    }

    const now = Date.now();
    if (existingIdx > -1) {
      // Cập nhật ký ức cũ
      this.state.memories[existingIdx].content = content;
      this.state.memories[existingIdx].embedding = embedding;
      this.state.memories[existingIdx].metadata.lastUpdated = now;
      this.state.memories[existingIdx].metadata.importance = Math.max(this.state.memories[existingIdx].metadata.importance, importance);
      if (reasoning) this.state.memories[existingIdx].metadata.reasoning = reasoning;
    } else {
      // Thêm ký ức mới
      this.state.memories.push({
        id: Math.random().toString(36).substring(2, 11),
        content,
        embedding,
        metadata: {
          type,
          importance,
          reasoning,
          timestamp: now,
          lastUpdated: now,
        }
      });
    }
  }

  /**
   * Lấy ngữ cảnh bộ nhớ dựa trên hành động hiện tại
   */
  public getMemoryContext(actionEmbedding?: number[]): string {
    let relevantMemories: string[] = [];
    
    if (actionEmbedding && actionEmbedding.length > 0 && this.state.memories.length > 0) {
      const scored = this.state.memories.map(m => ({
        content: m.content,
        score: embeddingService.cosineSimilarity(actionEmbedding, m.embedding)
      }));

      // Lấy top 8 ký ức liên quan nhất, lọc theo ngưỡng 0.6
      const filtered = scored
        .sort((a, b) => b.score - a.score)
        .filter(m => m.score > 0.6);

      // Nếu không có cái nào trên 0.6, lấy top 3 cái cao nhất bất kể điểm số
      relevantMemories = (filtered.length > 0 ? filtered.slice(0, 8) : scored.sort((a, b) => b.score - a.score).slice(0, 3))
        .map(m => `- ${m.content}`);
    }

    return `
      [ WORLD SUMMARY ]:
      ${this.state.worldSummary}

      [ WORLD CHRONICLE (LONG-TERM HISTORY) ]:
      ${this.state.chronicle || "Chưa có biên niên sử dài hạn."}

      [ RELEVANT SEMANTIC MEMORIES ]:
      ${relevantMemories.length > 0 ? relevantMemories.join("\n") : "Không có ký ức liên quan trực tiếp."}
    `;
  }

  public setState(state: MemoryState) {
    // Đảm bảo cấu trúc dữ liệu cũ vẫn tương thích nếu có
    this.state = {
      worldSummary: state.worldSummary || "Câu chuyện vừa bắt đầu.",
      chronicle: state.chronicle || "",
      memories: state.memories || [],
      lastSummarizedTurn: state.lastSummarizedTurn || 0,
    };
  }

  public getState(): MemoryState {
    return this.state;
  }

  public deleteMemory(id: string): void {
    this.state.memories = this.state.memories.filter(m => m.id !== id);
  }

  public togglePin(id: string): void {
    const mem = this.state.memories.find(m => m.id === id);
    if (mem) {
      mem.metadata.isPinned = !mem.metadata.isPinned;
    }
  }

  public bulkDelete(filter: (m: MemoryEntry) => boolean): void {
    this.state.memories = this.state.memories.filter(m => !filter(m));
  }
}

export const memoryService = new MemoryService();
