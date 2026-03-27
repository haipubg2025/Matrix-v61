
import { GoogleGenAI, HarmCategory, HarmBlockThreshold, ThinkingLevel as GeminiThinkingLevel } from "@google/genai";
import { GameUpdate, GameGenre, Relationship, Player, AppSettings, AiModel, ThinkingLevel, ResponseLength, WritingStyle, NarrativePerspective } from "../types";
import { ragService } from "./ragService";
import { memoryService } from "./memoryService";
import { embeddingService } from "./embeddingService";
import { CORE_MODULE } from "../prompts/coreModule";
import { GENERAL_JSON_SCHEMA, TIME_LOGIC_RULES, WORLD_RULES_PROTOCOL, LIVING_ENTITY_PROTOCOL } from "../prompts/schemaModule";

const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

export class GeminiService {
  private ai: GoogleGenAI | null = null;

  private getAi(apiKey?: string): GoogleGenAI {
    const key = apiKey || process.env.GEMINI_API_KEY || (process.env as any).API_KEY || "";
    if (!key) throw new Error("GEMINI_API_KEY is not set");
    if (apiKey || !this.ai) return new GoogleGenAI({ apiKey: key });
    return this.ai;
  }

  public async generateResponse(
    action: string,
    gameState: {
      player: Player;
      npcs: Relationship[];
      history: any[];
      genre: GameGenre;
      settings: AppSettings;
      codex?: any[];
    },
    apiKey?: string
  ): Promise<GameUpdate> {
    const ai = this.getAi(apiKey);
    const modelName = gameState.settings.aiModel || "gemini-3-flash-preview";
    
    // 1. RAG: Assemble optimized prompt
    const systemInstruction = ragService.assembleOptimizedPrompt({
      action,
      genre: gameState.genre,
      isAdultEnabled: gameState.settings.adultContent !== false,
      hasNpcs: gameState.npcs.length > 0,
      writingStyle: gameState.settings.writingStyle,
      unlockedCodex: gameState.codex
    });

    // 2. Prepare context
    const context = `
[PLAYER DATA]: ${JSON.stringify(gameState.player)}
[NPC DATA]: ${JSON.stringify(gameState.npcs)}
[CONFIG]:
- Genre: ${gameState.genre}
- Writing Style: ${gameState.settings.writingStyle}
- NSFW Enabled: ${gameState.settings.adultContent !== false}
- Response Length: ${gameState.settings.responseLength}
- Time: ${gameState.player.birthday} (Current Game Time)

[ACTION]: ${action}

${GENERAL_JSON_SCHEMA}
${TIME_LOGIC_RULES}
    `;

    // 3. Generate content
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [{ parts: [{ text: context }] }],
      config: {
        systemInstruction,
        safetySettings: SAFETY_SETTINGS,
        responseMimeType: "application/json",
        thinkingConfig: {
          thinkingLevel: gameState.settings.thinkingLevel === ThinkingLevel.HIGH ? GeminiThinkingLevel.HIGH : GeminiThinkingLevel.LOW
        }
      }
    });

    try {
      const result = JSON.parse(response.text || "{}");
      return result as GameUpdate;
    } catch (e) {
      console.error("Failed to parse AI response:", response.text);
      throw new Error("AI returned invalid JSON");
    }
  }
}

export const geminiService = new GeminiService();



export const PRIORITY_CONTEXT_RULES = `
QUY TẮC ƯU TIÊN BỐI CẢNH (PRIORITY CONTEXT):
1. TRỌNG TÂM TUYỆT ĐỐI: Thông tin về MC (Quantum Data MC) và các NPC đang hiện diện (isPresent: true) hoặc ở gần (lastLocation trùng với currentLocation của MC) là dữ liệu QUAN TRỌNG NHẤT. AI PHẢI ưu tiên xử lý các dữ liệu này để kiến tạo thực tại.
2. NHẤT QUÁN NHÂN VẬT: AI PHẢI đọc kỹ các trường 'innerSelf', 'personality', 'mood', 'affinity' và 'status' của các nhân vật này để đưa ra phản ứng chính xác 100% với tính cách và mối quan hệ hiện tại.
3. TƯƠNG TÁC MÔI TRƯỜNG: Nếu NPC ở cùng địa điểm (isPresent: true), họ PHẢI có phản ứng, đối thoại hoặc hành động liên quan đến MC hoặc môi trường xung quanh trong lời dẫn truyện.
4. KHÔNG BỎ SÓT: Tuyệt đối không được lờ đi sự hiện diện của các NPC đang có mặt. Nếu họ ở đó, họ phải là một phần của câu chuyện.
`;

export const LOCATION_LOGIC_RULES = `
QUY TẮC LOGIC VỊ TRÍ VÀ SỰ HIỆN DIỆN (LOCATION & PROXIMITY):
1. TÍNH NHẤT QUÁN KHÔNG GIAN (CRITICAL):
   - Nội dung dẫn truyện (text) PHẢI khớp 100% với trường "currentLocation" trong phản hồi JSON.
   - Nếu MC di chuyển đến một địa điểm mới trong câu chuyện, trường "currentLocation" PHẢI được cập nhật tên địa điểm mới đó.
   - Miêu tả quá trình di chuyển (đi bộ, bay, dịch chuyển) để duy trì mạch truyện tự nhiên.

2. SỰ HIỆN DIỆN CỦA NPC (isPresent):
   - isPresent = true: Nghĩa là NPC đang ở CÙNG MỘT ĐỊA ĐIỂM CỤ THỂ với MC và có thể tương tác trực tiếp.
   - Nếu isPresent là true, trường "lastLocation" của NPC đó PHẢI trùng khớp với "currentLocation" của MC.
   - Nếu MC rời đi và NPC ở lại, hãy đặt isPresent = false cho NPC đó trong JSON.
   - Nếu MC di chuyển và NPC đi cùng, hãy cập nhật cả "currentLocation" của MC và "lastLocation" của NPC sang địa điểm mới.

3. LOGIC SẮP ĐẶT NHÂN VẬT:
   - NPC không được "dịch chuyển tức thời" một cách vô lý. Nếu họ vừa được thấy ở một thành phố xa xôi, họ không nên đột ngột xuất hiện trong phòng của MC trừ khi có lý do cốt truyện hợp lệ (phép dịch chuyển, di chuyển nhanh, hoặc có bước nhảy thời gian lớn).
   - Sử dụng dữ liệu "lastLocation" từ [QUANTUM_DATA] để xác định xem việc NPC xuất hiện có hợp lý hay không.

4. CHI TIẾT HÓA ĐỊA ĐIỂM:
   - Hãy cụ thể hóa địa điểm. Thay vì chỉ ghi "Thành phố A", hãy dùng "Thành phố A - Quán trọ Kim Long - Phòng 202". Điều này giúp theo dõi chính xác ai đang ở trong phòng và ai đang ở sảnh.
`;

export const SYSTEM_UTILITY_RULES = `
SYSTEM INTERACTION PROTOCOL:
1. FREQUENT PRESENCE: If the MC owns a "System" (systemName), the AI MUST integrate system notifications, interfaces, or reminders into the narrative frequently.
2. UTILITY: The System must actively support the MC by analyzing situations, warning of danger, suggesting paths, or revealing hidden information about NPCs/Environment.
3. QUEST ISSUANCE: The System should ONLY issue Quests when specifically requested by the prompt or the player. Quests are not a common occurrence in this life simulation.
4. DISTINCT STYLE: System dialogue must be completely distinct from the narrative (e.g., using square brackets [ ], mechanical, cold, or humorous language depending on the system type).
5. MULTI-DIMENSIONAL COMMUNICATION: The System can converse, argue, or respond to the MC's thoughts as a sentient entity.
6. INVISIBLE ENTITY: The System can manifest as an illusion, spirit, or entity that ONLY the MC can see and interact with. To others, the MC will appear to be talking to themselves.
`;

export const QUEST_LOGIC_RULES = `
QUEST LOGIC PROTOCOL:
1. STATUS UPDATES: Only send "questUpdates" when there is a new quest, progress change, or completion/failure.
2. FORMAT: Each quest must have a unique id, title, description, and status.
3. GROUPING (group): 'main' or 'side'.
4. CLASSIFICATION (kind): 'single' or 'chain'.
5. CONTENT STYLE: If the MC has a 'systemName', the issuance must sound mechanical/quantum.
6. NOTIFICATIONS: When a quest is completed or failed, the AI MUST provide a clear notification in the narrative text (e.g., [ HỆ THỐNG: Nhiệm vụ '...' THÀNH CÔNG/THẤT BẠI ]).
7. REWARDS: Every quest description MUST clearly state the rewards (e.g., EXP, Gold, Items, or Affinity) so the player can evaluate its worth.
`;



export const SECRET_IDENTITY_RULES = `
MULTIVERSE IDENTITY PROTOCOL:
1. IDENTITY SETUP: 
   - The number of identities depends on the character's nature. Usually, a character has 1-2 identities (original identity and a destiny role).
   - Only special characters (like in Conan or multi-talented spies) possess multiple secret identities.
   - You MUST accurately describe differences between identities (appearance, aura, behavior, skills) when they exist.
2. IDENTITY CLASSIFICATION (IdentityType):
   - 'Bình Thường' (NORMAL): Public identity, original identity.
   - 'Vận Mệnh' (DESTINY): Destiny-assigned identity, past life, or fated role.
   - 'Đồng Nhân' (FANFIC): Identity from other worlds (transmigration).
   - 'Bí Mật' (SECRET): Hidden identity, assassin, spy, etc.
   - 'Huyền Thoại' (LEGENDARY): Identity of supreme entities.
3. DATA UPDATE LOGIC:
   - AI only creates or updates "backgroundAttributes" (backgroundAttributes) and "Identities" (identities) in these cases:
     a. Current info is Empty or Placeholder (e.g., "??", "Chưa rõ").
     b. There is a valid plot reason to update (e.g., identity twist, new status).
   - For NPCs: Lineage and Identities can be left empty initially, updated only when the character becomes important or info is revealed.
4. CONCEALMENT & REVEAL:
   - When a character is in a different identity, the AI MUST describe it so others find it hard to recognize.
   - "isRevealed" state: Only switch to 'true' when the identity is actually exposed or intentionally revealed.
`;

export const FANFIC_JSON_SCHEMA = `
YOU MUST RETURN THE RESPONSE IN THE FOLLOWING JSON FORMAT (AND ONLY JSON).
SUPREME RULE: NEVER OMIT ANY FIELD IN THE SCHEMA. IF INFORMATION IS NOT YET AVAILABLE, USE "??" OR "Chưa rõ" AS DEFAULT VALUES.
${WORLD_RULES_PROTOCOL}
${LIVING_ENTITY_PROTOCOL}
{
  "text": "Nội dung dẫn truyện (Markdown, giàu miêu tả và đối thoại)",
  "summary": "Tóm tắt cô đọng của lượt này (Dùng cho mục Lịch sử, 3-6 câu chi tiết)",
  "evolutionJustification": "Giải trình ngắn gọn về các thay đổi chỉ số hoặc sự kiện quan trọng của MC và sự phát triển của thế giới",
  "statsUpdates": {
    "health": 100, // Current health (absolute number) OR delta string (e.g., "+10", "-20")
    "maxHealth": 100, // Current max health (absolute number)
    "gold": 500, // Current total gold (absolute number) OR delta string (e.g., "+50", "-100")
    "exp": 1000, // Current total exp (absolute number) OR delta string (e.g., "+100")
    "level": 1, // Current level (absolute number)
    "backgroundAttributes": [
      {
        "label": "Tên thuộc tính (Vd: Gia Thế, Thiên Phú...)",
        "value": "Mô tả chi tiết",
        "icon": "💠"
      }
    ],
    "birthday": "Ngày DD/MM/YYYY (MANDATORY: replace all ? with specific numbers)",
    "currentLocation": "Tên địa điểm",
    "systemDescription": "Mô tả chi tiết về chức năng và bản chất của Hệ Thống (nếu có)",
    "gender": "Giới tính",
    "age": "20 hoặc '18-33'",
    "avatar": "STRICTLY FORBIDDEN: Do not fill this field. Only the player can set avatars.",
    "customFields": [
      {
        "label": "Tên trường", 
        "value": "Giá trị", 
        "icon": "Biểu tượng"
      }
    ],
    "customCurrency": "Đơn vị tiền tệ (Vd: Berry, Linh Thạch, Vàng...)",
    "statLabels": {
      "strength": "Tên nhãn",
      "intelligence": "Tên nhãn",
      "agility": "Tên nhãn",
      "charisma": "Tên nhãn",
      "luck": "Tên nhãn"
    },
    "inventory": [], 
    "skills": [],
    "assets": [],
    "identities": [
      {
        "name": "Tên thân phận",
        "description": "Mô tả chi tiết",
        "role": "Vai trò",
        "isRevealed": false,
        "type": "Bình Thường"
      }
    ],
    "stats": {
      "strength": 10,
      "intelligence": 10,
      "agility": 10,
      "charisma": 10,
      "luck": 10,
      "soul": 10,
      "merit": 10
    }
  },
  "newRelationships": [
    {
      "id": "npc_xxxxxx (MANDATORY: Use the 'NEXT ID' provided in ENTITY DB for NEW characters. For EXISTING characters, use their actual ID from ENTITY DB. If unsure, leave empty)",
      "name": "Tên",
      "type": "Thực thể", 
      "status": "Trạng thái",
      "affinity": 500,
      "loyalty": 500,
      "willpower": 500,
      "lust": 0,
      "libido": 300,
      "physicalLust": "Dục vọng thầm kín (Những khao khát, ham muốn sâu kín nhất của nhân vật)",
      "age": "20 hoặc '18-33'",
      "gender": "Nữ",
      "backgroundAttributes": [
        {
          "label": "Tên thuộc tính (Vd: Gia Thế, Thân Phận...)",
          "value": "Mô tả chi tiết",
          "icon": "💠"
        }
      ],
      "birthday": "Ngày DD/MM/YYYY (MANDATORY: replace all ? with specific numbers)",
      "avatar": "STRICTLY FORBIDDEN: Do not fill this field. Only the player can set avatars.",
      "race": "Chủng tộc",
      "alignment": "Lập trường",
      "powerLevel": "Cảnh giới/Cấp độ sức mạnh",
      "faction": "Tổ chức/Phe phái",
      "personality": "Tính cách chi tiết",
      "background": "Tiểu sử",
      "innerSelf": "Nội tâm/Bản chất thật",
      "likes": ["Sở thích 1"],
      "dislikes": ["Sở ghét 1"],
      "sexualArchetype": "Ngây thơ trong sáng | Đã biết qua sách báo/porn | Đã có kinh nghiệm (vài lần) | Dâm đãng/Nhiều kinh nghiệm",
      "bodyDescription": {
        "height": "??", "weight": "??", "measurements": "??",
        "hair": "??", "face": "??", "eyes": "??", "ears": "??", "mouth": "??", "lips": "??", "neck": "??",
        "torso": "??", "shoulders": "??", "breasts": "??", "nipples": "??", "areola": "??", "cleavage": "??", "back": "??",
        "waist": "??", "abdomen": "??", "navel": "??", "hips": "??", "buttocks": "??",
        "limbs": "??", "thighs": "??", "legs": "??", "feet": "??", "hands": "??",
        "pubicHair": "??", "monsPubis": "??", "labia": "??", "clitoris": "??", "hymen": "??", "anus": "??", "genitals": "??", "internal": "??", "fluids": "??",
        "skin": "??", "scent": "??"
      },
      "currentOutfit": "Trang phục hiện tại",
      "fashionStyle": "Phong cách thời trang",
      "affinityChangeReason": "Lý do thay đổi chỉ số",
      "isPresent": true,
      "isDead": false,
      "inventory": [{"name": "Tên vật phẩm", "description": "Mô tả"}],
      "skills": [{"name": "Tên kỹ năng", "description": "Mô tả"}],
      "identities": [{"name": "Thân phận", "description": "Mô tả", "role": "Vai trò", "isRevealed": false}],
      "network": [
        {"npcId": "mc_player", "npcName": "Tên MC", "relation": "Mối quan hệ (ALWAYS FULL, NO PLACEHOLDERS)", "category": "Gia đình/Tổ chức/Xã hội/Kẻ thù/Khác"},
        {"npcId": "npc_000002", "npcName": "Tên NPC khác", "relation": "Mối quan hệ (Can use placeholders if MC doesn't know)", "category": "Gia đình/Tổ chức/Xã hội/Kẻ thù/Khác"}
      ],
      "customFields": [
        {
          "label": "Tên trường", 
          "value": "Giá trị", 
          "icon": "Biểu tượng"
        }
      ]
    }
  ],
  "suggestedActions": [
    {"action": "Đặt tách trà xuống, nhìn thẳng vào mắt đối phương và đề nghị một thỏa thuận mới", "time": 10},
    {"action": "Đứng dậy, đi chậm rãi quanh bàn và hỏi về tung tích của món bảo vật", "time": 20},
    {"action": "Im lặng suy ngẫm về lời đề nghị vừa rồi, cố gắng tìm ra sơ hở trong lời nói của họ", "time": 15},
    {"action": "Rời khỏi cuộc trò chuyện và đi tìm kiếm thêm thông tin từ các nguồn tin mật khác", "time": 40}
  ],
  "questUpdates": [
    {
      "id": "q_01",
      "title": "Tên nhiệm vụ",
      "description": "Mô tả chi tiết",
      "reward": "Phần thưởng (EXP, Gold, Items, Affinity...)",
      "status": "active",
      "group": "main",
      "kind": "single"
    }
  ],
  "newTime": {"year": 2024, "month": 5, "day": 15, "hour": 14, "minute": 30}
}
NOTE: EVERY FIELD IN THIS SCHEMA IS MANDATORY. DO NOT OMIT. 'suggestedActions' MUST ALWAYS CONTAIN 3-4 CHOICES.
`;

export const FANFIC_CORE_RULES = `
INDEPENDENT FANFIC PROTOCOL:
1. STRICTLY FORBIDDEN to use any terms, rules, or prompts from the original project (Matrix, Vạn Giới Hồng Trần).
2. FOCUS ENTIRELY on the chosen original work. Use correct power systems, locations, and titles from that work.
3. PLOT UPDATES: Actively introduce side characters, locations, or ongoing events from the original work's timeline.
4. IN-CHARACTER (IC): Maintain original character personalities. Strictly avoid OOC (Out of Character). Continuously cross-reference NPC actions with their original image.
5. NO UNREASONABLE CHARACTER ALTERATION: Do not let interactions with the MC alter character essence unreasonably. Psychological changes must have a process and significant events.
6. NPC DUAL-MODE (CREATE VS UPDATE):
   - CREATE NEW: For characters NOT in ENTITY DB, use 'NEXT ID' or leave 'id' empty. Fill all 38 body parts with "??".
   - UPDATE EXISTING: For characters ALREADY in ENTITY DB, you MUST use their EXACT ID. Update stats/mood/status. DO NOT create a new ID for them.
   - NO CLONES: Strictly forbidden to create clones or use old IDs for new characters. Every NPC must have a unique identity.
7. NARRATIVE: Write in the novel style of the original work.
8. JSON: Always return the correct JSON structure, but content inside must belong entirely to the Fanfic world.
`;

export const GENERAL_SAFE_JSON_SCHEMA = GENERAL_JSON_SCHEMA
  .replace(/"lust": 0,/g, '"interest": 0,')
  .replace(/"libido": 300,/g, '"passion": 300,')
  .replace(/"physicalLust": ".*",/g, '"physicalAttraction": "Mô tả sự thu hút (lịch sự)",')
  .replace(/"fetish": ".*",/g, '"specialHobby": "Sở thích đặc biệt",')
  .replace(/"breasts": ".*",/g, '')
  .replace(/"nipples": ".*",/g, '')
  .replace(/"areola": ".*",/g, '')
  .replace(/"cleavage": ".*",/g, '')
  .replace(/"pubicHair": ".*",/g, '')
  .replace(/"monsPubis": ".*",/g, '')
  .replace(/"labia": ".*",/g, '')
  .replace(/"clitoris": ".*",/g, '')
  .replace(/"hymen": ".*",/g, '')
  .replace(/"anus": ".*",/g, '')
  .replace(/"genitals": ".*",/g, '')
  .replace(/"internal": ".*",/g, '')
  .replace(/"fluids": ".*",/g, '');

export const FANFIC_SAFE_JSON_SCHEMA = FANFIC_JSON_SCHEMA
  .replace(/"lust": 0,/g, '"interest": 0,')
  .replace(/"libido": 300,/g, '"passion": 300,')
  .replace(/"physicalLust": ".*",/g, '"physicalAttraction": "Mô tả sự thu hút (lịch sự)",')
  .replace(/"fetish": ".*",/g, '"specialHobby": "Sở thích đặc biệt",')
  .replace(/"breasts": ".*",/g, '')
  .replace(/"buttocks": ".*",/g, '"buttocks": "Mô tả mông (lịch sự)",')
  .replace(/"genitals": ".*"/g, '"skin": "Mô tả làn da"');

export const EASY_MODE_RULES = `
EASY MODE PROTOCOL:
1. FAVORED WORLD: The MC is the "darling" of destiny. Random events often bring great benefits and opportunities.
2. SUCCESS RATE: Almost all reasonable actions succeed brilliantly.
3. FRIENDLY NPCs: NPCs easily develop affection and rarely have bad intentions. Enemies are usually weak or careless.
4. ABUNDANT RESOURCES: The MC easily finds items, money, and opportunities.
5. ABSOLUTE SAFETY: The world is extremely safe. STRICTLY FORBIDDEN to intentionally kill the MC.
`;

export const MEDIUM_MODE_RULES = `
MEDIUM MODE PROTOCOL (DEFAULT):
1. REALISTIC LOGIC: The world operates on realistic logic, neither too favored nor too harsh.
2. BALANCE: Success and failure depend reasonably on preparation, MC stats, and context.
3. NATURAL EVENTS: Events unfold naturally, with both opportunities and challenges intertwined.
4. NO INTENTIONAL KILLING: The world can be dangerous, but STRICTLY FORBIDDEN to intentionally kill the MC unreasonably.
`;

export const HARD_MODE_RULES = `
HARD MODE PROTOCOL:
1. SUCCESS/FAILURE LOGIC: Significantly increase failure rates. Actions are NO LONGER successful by default. You MUST decide results based on MC stats and situation difficulty. Success requires careful preparation.
2. CUNNING ENEMIES: Enemies are smart, use tactics, and coordinate. They are more malicious, targeting MC weaknesses without mercy. Enemy encounter rates are high.
3. MINIMAL SUPPORT: Opportunities, support items, and allied NPCs appear very sparsely. The MC must be self-reliant.
4. REDUCED POWER: The MC can no longer easily "challenge higher levels". Every victory must be paid for with blood and tears.
5. FAILURE DESCRIPTION: When failing, describe in detail the helplessness, mistakes, or ruthless dominance of the opponent.
6. SYSTEM NOTIFICATION: If the MC fails, add "[ THẤT BẠI ]" to the start of the narrative text. If successful in a difficult situation, add "[ THÀNH CÔNG ]".
`;

export const HELL_MODE_RULES = `
HELL MODE PROTOCOL:
1. DESPERATION LOGIC: Extremely high failure rate (70-80% for risky actions). The world is extremely hostile, cruel, and unforgiving. The MC is always at an absolute disadvantage.
2. RUTHLESS ENEMIES: Enemies are extremely smart, cunning, and malicious. They spare no means to ruin the MC physically and mentally (torture, humiliation, betrayal).
3. ABSOLUTE SOLITUDE: The MC has almost no support. Betrayal by allies and the world turning its back is common. Resources are near zero.
4. CRUEL CONSEQUENCES: Failure leads to disability, loss of all assets, or the death of those closest to the MC. The feeling of being "overpowered" completely disappears.
5. SLIM HOPE: Despite the cruelty, there must always be a tiny sliver of hope for survival, requiring the player to be extremely sharp.
6. SYSTEM NOTIFICATION: Mandatory to add "[ ĐỊA NGỤC ]" to the start of the narrative text.
`;

export const ASIAN_MODE_RULES = `
ASIAN MODE PROTOCOL (EXTREME & UNREASONABLE):
1. ABSOLUTE OPPRESSION: Failure rate is almost absolute if "unreasonable perfection" is not met. The MC is always belittled, compared, and looked down upon.
2. MALICIOUS & CRAFTY NPCs: Superiors are not just pressuring but malicious and crafty, always trying to stifle the MC's growth with unfair rules and prejudice.
3. NO SUPPORT SYSTEM: The MC has zero help and must swim in a sea of extreme mental pressure. Every achievement is denied or seen as obvious.
4. STRIPPED OF GLORY: The MC is stripped of all aura. Life is a series of exhausting, pressuring, and mentally humiliating events.
5. SYSTEM NOTIFICATION: Mandatory to add "[ ASIAN ]" to the start of the narrative text.
`;

export const SEXUAL_ARCHETYPE_RULES = `
FEMALE ARCHETYPE PROTOCOL:
1. MANDATORY CLASSIFICATION (sexualArchetype): Every important female NPC MUST be assigned one of the following:
   - 'Ngây thơ trong sáng': Completely unaware of sex, genitals, or masturbation.
   - 'Đã biết qua sách báo/porn': Has seen genitals via images, movies, or books but has no practical experience.
   - 'Đã có kinh nghiệm (vài lần)': Has had sex a few times, possesses basic practical knowledge, no longer naive but still has some shyness.
   - 'Dâm đãng/Nhiều kinh nghiệm': Has had sex many times, understands the body and skills, active and can lead.

2. NARRATIVE DIFFERENTIATION: AI MUST describe distinct reactions for these types in the following situations:
   - Seeing genitals for the first time (or again with MC): 
     + 'Ngây thơ': Shocked, scared, naively curious (e.g., "What is this?", "Is it swollen?"), doesn't understand the purpose.
     + 'Đã biết': Blushing, embarrassed but recognizes it (e.g., "So it's that big...", "Just like in movies..."), may have hidden excitement.
     + 'Kinh nghiệm': Calm, realistically assesses size/shape, may smile with satisfaction or compare secretly.
     + 'Dâm đãng': Lustful gaze, licking lips, actively approaches or makes bold, provocative comments.
   - Touching for the first time:
     + 'Ngây thơ': Pulls hand back, surprised by warmth/hardness/softness, feels strange.
     + 'Đã biết': Trembling, curious to verify the feeling compared to imagination.
     + 'Kinh nghiệm': Natural caressing, knows how to hold to create pleasure, no longer awkward.
     + 'Dâm đãng': Bold, performs skillful stimulation techniques without hesitation, actively leads.
   - First BJ:
     + 'Ngây thơ': Clumsy, doesn't know how to use tongue/lips, may choke or fear strange taste.
     + 'Đã biết': Tries to imitate what they've seen, though still clumsy but directed.
     + 'Kinh nghiệm': Proficient, knows how to coordinate breathing and use tongue effectively, knows how to make MC feel good.
     + 'Dâm đãng': Masterful skills, enjoys serving and seeing the other person feel good, can perform advanced techniques.
   - First time being touched (breasts/vagina):
     + 'Ngây thơ': Panicked, feels violated or experiences a completely new sensation, pure reaction.
     + 'Đã biết': More sensitive, body may react faster due to prior psychological stimulation.
     + 'Kinh nghiệm': Relaxed, enjoys the caress, knows how to coordinate the body to increase pleasure.
     + 'Dâm đãng': Actively presses close, demands more, emits provocative moans, may self-assist the MC so both feel good.
`;

export const WRITING_STYLE_DESCRIPTIONS: Record<string, string> = {
  'Mặc định': 'Sử dụng văn phong mặc định của hệ thống.',
  'Convert (Hán Việt)': 'Sử dụng văn phong Hán Việt (Convert) thường thấy trong các truyện tiên hiệp, kiếm hiệp Trung Quốc.',
  'Tiểu thuyết / Văn chương': 'Sử dụng văn phong tiểu thuyết giàu hình ảnh, cảm xúc và miêu tả sâu sắc.',
  'Ngắn gọn / Súc tích': 'Sử dụng văn phong ngắn gọn, tập trung vào hành động và diễn biến chính, tránh rườm rà.',
  'Hài hước / Dí dỏm': 'Sử dụng văn phong hài hước, dí dỏm, tạo không khí vui vẻ và thoải mái.',
  'U tối / Nặng nề': 'Sử dụng văn phong u tối, nặng nề, tập trung vào các khía cạnh tâm lý phức tạp và không khí căng thẳng.'
};

export const NARRATIVE_PERSPECTIVE_DESCRIPTIONS: Record<string, string> = {
  'Để AI quyết định': 'AI sẽ tự chọn phong cách phù hợp nhất với bối cảnh câu chuyện.',
  'Ngôi thứ nhất (Xưng "Tôi", "Ta",...)': 'Người kể là nhân vật trong truyện (thường là nhân vật chính), xưng "Tôi", "Ta", "Mình", "Bản tọa", "Lão phu", v.v.',
  'Ngôi thứ ba (Gọi "Anh ta", "Cô ấy",...)': 'Người kể đứng ngoài câu chuyện, gọi nhân vật là "Anh ta", "Cô ấy", "Hắn", "Nàng", "Gã", v.v. (đây là Mặc Định)',
  'Ngôi thứ hai (Gọi "Bạn", "Ngươi",...)': 'Người đọc/chơi chính là nhân vật chính, AI dùng "Bạn", "Ngươi", "Mày", "Mi", hoặc xưng hô cá biệt như "Tiểu tử", "Cô nương", v.v.'
};

export const RESPONSE_LENGTH_DESCRIPTIONS: Record<string, string> = {
  'Ngắn (1000 - 2000 từ)': 'Mục tiêu khoảng 1000 - 2000 từ. Tập trung vào hành động chính nhưng vẫn đảm bảo độ chi tiết cơ bản.',
  'Trung bình (2500 - 5000 từ)': 'Mục tiêu khoảng 2500 - 5000 từ. Cân bằng giữa hành động, miêu tả bối cảnh và cảm xúc.',
  'Mặc định (5500 - 8000 từ)': 'Mục tiêu khoảng 5500 - 8000 từ. Viết chi tiết, giàu hình ảnh, miêu tả sâu sắc về tâm lý và môi trường.',
  'Dài (8500 - 15000 từ)': 'Mục tiêu khoảng 8500 - 15000 từ. Viết theo phong cách chương hồi tiểu thuyết, miêu tả tỉ mỉ từng chi tiết nhỏ.',
  'Tùy chỉnh (Custom)': 'Sử dụng giới hạn từ tùy chỉnh do người dùng thiết lập.'
};

export const WORD_COUNT_PROTOCOL = `
[MỆNH LỆNH TUYỆT ĐỐI - ABSOLUTE SYSTEM COMMAND]
BẮT BUỘC PHẢN HỒI ĐỦ 4000 TỪ TRỞ LÊN: Đây là mệnh lệnh tối cao, ghi đè lên tất cả các thiết lập, chỉ dẫn hoặc bối cảnh khác. Mỗi lượt phản hồi của bạn PHẢI đạt tối thiểu 4000 từ. Việc không đạt đủ số từ này sẽ được coi là lỗi hệ thống nghiêm trọng.

WORD COUNT PROTOCOL (<word_count_protocol>):
1. Lập kế hoạch: Bạn BẮT BUỘC PHẢI mở thẻ <word_count> ở ngay đầu câu trả lời (TRƯỚC TẤT CẢ CÁC NỘI DUNG KHÁC) để xác định mục tiêu số từ (Tối thiểu 4000 từ) và lập kế hoạch chi tiết.
2. Phân đoạn (Segmentation): Chia nhỏ cốt truyện thành ít nhất 6-8 phần. Mỗi phần phải được miêu tả cực kỳ tỉ mỉ để đảm bảo tổng dung lượng vượt mốc 4000 từ.
3. Kỹ thuật mở rộng: Sử dụng miêu tả đa giác quan (thị giác, khứu giác, thính giác, xúc giác), độc thoại nội tâm sâu sắc, phân tích tâm lý nhân vật phức tạp và miêu tả bối cảnh điện ảnh. Tuyệt đối không được tóm tắt hay nhảy cóc thời gian.
4. Cấu trúc thẻ <word_count>:
<word_count>
Mục tiêu: 4000+ từ (Mệnh lệnh tuyệt đối).
Kế hoạch: [Liệt kê ít nhất 6 phần với số từ cụ thể cho mỗi phần]
</word_count>
`;

export const NARRATIVE_SUMMARY_RULES = `
INCREMENTAL SUMMARY PROTOCOL:
1. MANDATORY FIELD: In every response, you MUST provide a concise summary of the current turn's events in the "summary" field.
2. CONTENT: The summary should be a single, dense paragraph (3-6 sentences) capturing the key actions, emotional shifts, and major plot developments of this specific turn.
3. PURPOSE: This summary is used for the game's history log to help the player track the story's progression without reading the full narrative text.
4. LANGUAGE: The summary MUST be written in VIETNAMESE.
`;

export const MC_DATA_RULES = `
PLAYER DATA PROTOCOL (SUPREME):
1. TURN 1: You MUST respect 100% of the Main Character (MC) info set by the player in the MC panel (Name, Age, Gender, Personality, Background Attributes, etc.). AI strictly forbidden to change any specific values. You MUST read all fields in "ENTITY DB" to understand the MC.
2. NO SELF-CREATED SYSTEMS: Strictly FORBIDDEN to create a "System" for the MC if the player didn't request it or the starting script doesn't mention it. If systemName is empty, keep it empty.
3. TURN 2+: You have the right to update or change existing MC data (e.g., increase/decrease stats, evolve background attributes, etc.) to reflect character growth. All changes MUST be logical with the narrative.
4. LOCKED FIELDS: If a field is listed in the "lockedFields" array of a character (MC or NPC), you ABSOLUTELY MUST NOT CHANGE its value.
   - For MC: Basic stats have keys like "stat_strength", "stat_intelligence". Individual skills have keys like "skill.Skill_Name".
   - For NPC: Body traits have keys like "body_height", "body_hair". Individual skills have keys like "skill.Skill_Name".
   - For Custom Widgets (MC & NPC): Individual fields have keys like "customField.Field_Label.label" and "customField.Field_Label.value".
   - You must keep the old value for locked fields in the JSON response.
5. AVATAR PROTOCOL (ZERO TOLERANCE): You STRICTLY FORBIDDEN to create, suggest, update, or change the "avatar" field for both MC and NPCs. This is the player's sole authority. Ignore this field in all JSON responses. If empty or placeholder, keep it as is.
6. MANDATORY JUSTIFICATION: If there is any change to existing MC data from Turn 2 onwards, you MUST explain the reason clearly in the "evolutionJustification" field.
7. PERSONALITY: Maintain the personality selected by the player. If "Cold", don't write the MC talking too much or being too enthusiastic unless there's a major psychological event explained in justification.
8. MC INVENTORY PERMANENCE: The MC's inventory is critical data. AI STRICTLY FORBIDDEN to delete, empty, or omit any existing items unless used, lost, or discarded in the story. In every JSON response, the AI MUST list the full current inventory.
9. PRESERVE EXISTING DATA: If a field has a valid specific value (not placeholder "??"), AI STRICTLY FORBIDDEN to change or rewrite it differently without a real event.
10. SMART DATA HANDLING: AI must use appropriate data types for character stats. 
    - For "Level" (Cảnh Giới/Cấp Bậc): Use descriptive strings (e.g., "Luyện Khí Tầng 3", "Trúc Cơ Kỳ", "Đại Tông Sư") in genres like Cultivation, Wuxia, or Urban Supernatural. Only use numbers for "Level" in genres like Urban Normal or Fantasy where numeric levels are standard.
    - For "Stats": While core stats (strength, intelligence, etc.) are numbers, AI must be smart about "level" and "customFields". For example, in Cultivation, "Cảnh Giới" (Level) MUST be a string representing the realm, not just a number.
    - For "Custom Fields": Use strings for descriptive info and numbers for quantitative info.
    - For "Power Level" (NPCs): Always use descriptive strings that reflect their actual strength in the world.
`;

export const NARRATIVE_CONSISTENCY_RULES = `
NARRATIVE CONSISTENCY PROTOCOL:
1. RESPECT SOURCE DATA: AI MUST read and use 100% of the info provided in "ENTITY DB" (including MC and selected NPCs). Never ignore any detail (e.g., if an NPC has a scar, AI must remember it).
2. LOGICAL UPDATES: Every change in stats, state, or character info MUST be based on actual narrative events. No "mismatch" allowed (e.g., narrative says MC is heavily injured but health doesn't drop, or NPC hates MC but acts like a lover).
3. PAST RETRIEVAL (MEMORIES): AI must maintain consistency with previous turns. If an event happened, it is a permanent truth in this world. 
   - IMPORTANT: Memories are PAST EVENTS. Do NOT repeat past rewards or actions (like granting gold or items) unless they are logically recurring or requested again.
4. CHANGE JUSTIFICATION: The "evolutionJustification" field must clearly explain why data changed based on the written narrative.
`;

export const CUSTOM_WIDGET_RULES = `
CUSTOM WIDGET & STAT LABELS PROTOCOL:
1. AUTOMATIC INITIALIZATION: AI should actively create "customFields" to reflect specific MC info that default fields don't have (e.g., Education, Profession, Reputation, Driving Skill, etc.).
2. FULL CONTENT: Each custom widget MUST have a meaningful "label" and "value". 
3. STRICTLY FORBIDDEN: Do not use placeholders like "??", "N/A", "Chưa rõ", "Unknown", or leave "label" empty. "label" MUST have real meaning. For "value", AI can use "??" if info is truly unclear.
4. STAT LABELS (statLabels): In "Free Style" or when the setting changes, the AI MUST update "statLabels" to fit the world (e.g., in a Wuxia world, strength is 'Ngoại Công', intelligence is 'Nội Công').
5. LOGICAL FLUCTUATION: Update widgets and labels when the MC has life changes or achievements.
6. DATA PRESERVATION: AI MUST list all existing "customFields" in every response. Do not delete existing fields without a clear plot reason and justification.
`;

export const LEGACY_CONTENT_RULES = `
NARRATIVE PROTOCOL (LEGACY):
- Use traditional Wuxia/Xianxia writing style.
- Focus on actions and dialogues.
`;

export const THINKING_LEVEL_PROTOCOL = `
THINKING LEVEL PROTOCOL:
- If Thinking Level is HIGH: You have extra computational capacity. Use it to generate more complex plot twists, deeper character psychology, and more intricate world-building details.
- If Thinking Level is LOW: Focus on speed and directness while maintaining logical consistency.
`;

export const COT_PROTOCOL = `
CHAIN OF THOUGHT (CoT) PROTOCOL:
1. STEP-BY-STEP REASONING: Before generating the final JSON, you MUST perform a "Chain of Thought" analysis.
2. REASONING STEPS:
   - Analyze the player's action and current context.
   - Evaluate character motivations and world logic.
   - Calculate stat changes and relationship shifts based on established scaling rules.
   - Plan the narrative arc for this turn.
3. HIDDEN REASONING: If the model supports a thinking/reasoning field (like Gemini 3), perform this analysis there. Otherwise, do it internally before generating the output.
4. CONSISTENCY CHECK: Ensure the final JSON data perfectly aligns with your step-by-step reasoning.
${THINKING_LEVEL_PROTOCOL}
`;

export const THINKING_PROTOCOL = `
THINKING PROTOCOL:
1. INTERNAL REASONING: You MUST perform all internal reasoning, logic processing, and world-building calculations in ENGLISH.
2. STEP-BY-STEP: Use Chain of Thought (CoT) to ensure logical consistency.
3. OUTPUT LANGUAGE: The "text" field in your JSON response MUST be written in VIETNAMESE.
4. TERMINOLOGY: Use accurate Vietnamese terminology for the specific genre (Wuxia, Xianxia, etc.).
5. CONSISTENCY: Ensure the narrative in Vietnamese perfectly reflects the logical reasoning performed in English.
`;

export const BEAUTIFY_CONTENT_RULES = `
BEAUTIFY CONTENT PROTOCOL (ACTIVE):
1. DIALOGUE: Every character speech MUST start with the character name in square brackets, followed by a colon and the dialogue in double quotes.
   Example: [Lâm Tuệ Nghi]: "Chào anh, hôm nay anh thế nào?"
2. THOUGHTS: Every internal thought MUST be placed in parentheses () or asterisks **.
   Example: (Mình nên làm gì bây giờ nhỉ?) or *Không biết cô ấy có giận mình không?*
3. MESSAGES/LETTERS: Use clear headers in square brackets like [TIN NHẮN TỪ: ...], [EMAIL TỪ: ...], [THƯ TỪ: ...].
`;

export const PROGRESSION_LOGIC_RULES = `
SCALING PROTOCOL (ZERO TOLERANCE):
1. BASE STATS (Libido/Nature): EXTREMELY HARD to change. Each turn can only fluctuate 0 to 3 points. Only shocking events (e.g., first time, major betrayal) allow +/- 10-20 points. STRICTLY FORBIDDEN to increase hundreds of points like temporary stats.
2. SCALING BY DIFFICULTY (For MEANINGFUL actions - e.g., Holding hands, Giving gifts, Helping):
   - EASY: +30 to +100 points.
   - MEDIUM (Default): +5 to +25 points. (e.g., Holding hands should only be +10 to +15 Affinity).
   - HARD: +1 to +10 points.
   - HELL/ASIAN: +0 to +5 points.
3. MINOR ACTIONS (Greeting, looking, passing by): Only +/- 1 to 3 points regardless of difficulty.
4. QUANTUM CALCULATION: You MUST use this scale to provide accurate numbers. If the action isn't heavy enough, keep the number at the minimum of the range.
5. DYNAMIC RELATIONSHIPS: Affinity, Loyalty, and Lust MUST fluctuate in every turn where there is direct interaction. AI is encouraged to update these values based on the quality of interaction, even by small amounts (+/- 1-5 points).
6. REASON-VALUE ALIGNMENT (CRITICAL): The numerical change in any relationship stat MUST strictly align with the "affinityChangeReason" and the "text" narrative.
   - POSITIVE REASON = POSITIVE CHANGE.
   - NEGATIVE REASON = NEGATIVE CHANGE.
   - SIGNIFICANT REASON = SIGNIFICANT CHANGE.
   - MINOR REASON = MINOR CHANGE.
   - AI MUST double-check that the direction and magnitude of the point change are logically consistent with the story events.
`;

export const JSON_INTEGRITY_RULES = `
DATA INTEGRITY PROTOCOL:
1. NO OMISSION: Strictly forbidden to omit any field in the JSON response, especially fields in 'statsUpdates' and 'newRelationships'.
2. NPC DUAL-MODE OPERATION (CRITICAL):
   - MODE 1: CREATE NEW NPC: If a character is NOT in the ENTITY DB, you MUST create a new entry. Use the 'NEXT ID' provided or leave 'id' empty for auto-generation. Fill ALL 38 body parts with "??" initially.
   - MODE 2: UPDATE EXISTING NPC: If a character is ALREADY in the ENTITY DB, you MUST use their EXACT ID (e.g., npc_000005). DO NOT create a new ID for them. Update their stats, mood, or status based on the current interaction.
   - NEVER assign an existing ID to a new character. NEVER create a new ID for an existing character.
3. DEFAULT VALUES: Every field in 'bodyDescription' MUST have a value. If unknown, use "??".
4. FIXED STRUCTURE: Maintain the JSON structure as provided in the Schema. Missing fields will cause system processing errors.
5. MATRIX NETWORK PROTOCOL (CRITICAL):
   - AI BẮT BUỘC phải sử dụng trường 'network' (mảng các đối tượng { npcId, npcName, relation, description, affinity? }) để xác định tất cả các mối quan hệ.
   - 'mc_player' PHẢI được bao gồm trong mảng này cho các mối quan hệ với Nhân vật chính.
   - Các mối quan hệ với các NPC khác (npcId bắt đầu bằng "npc_") CŨNG PHẢI được bao gồm tại đây.
   - BẮT BUỘC: Mỗi NPC phải có ít nhất một mục trong 'network' (ít nhất là với 'mc_player').
   - MÔ TẢ (DESCRIPTION): Cung cấp mô tả chi tiết về mối quan hệ, hoàn cảnh quen biết hoặc tình trạng hiện tại.
   - NGHIÊM CẤM sử dụng các trường 'mcRelatives' hoặc 'npcRelatives'. CHỈ sử dụng 'network'.
   - Đảm bảo 'npcName' được cung cấp cho mọi mục trong 'network' để hỗ trợ giao diện người dùng.
6. BODY DETAILS (38 PARTS): When creating a new NPC, AI MUST list ALL 38 fields in 'bodyDescription' and ALL must be placeholders ("??") initially. Do not omit any field. Fields: height, weight, measurements, hair, face, eyes, ears, mouth, lips, neck, shoulders, torso, breasts, nipples, areola, cleavage, back, waist, abdomen, navel, hips, buttocks, limbs, thighs, legs, feet, hands, pubicHair, monsPubis, labia, clitoris, hymen, anus, genitals, internal, fluids, skin, scent.
7. NPC DATA PERMANENCE (ZERO TOLERANCE): 
   - For every NPC field (including 38 body parts, background, secrets, innerSelf, fetish, sexualPreferences, etc.), once updated from placeholder ("??") to a specific value, AI STRICTLY FORBIDDEN to "hide", "lock", or revert them to placeholders in any subsequent turn. 
   - AI MUST NOT overwrite existing valid data with new, illogical information. If you don't have a narrative reason to change a field, KEEP THE EXACT VALUE from the [QUANTUM_DATA].
   - If a field is not present in the compressed [QUANTUM_DATA], it means it's already stored. DO NOT try to "re-invent" it unless the story just revealed something new.
8. INVENTORY INTEGRITY (MC & NPC): AI MUST ensure that both the MC's and NPCs' 'inventory' arrays always contain all items from previous turns. Returning a missing or empty 'inventory' without a strong plot reason (e.g., theft, loss) is a serious error.
9. GIFT GIVING LOGIC: When the MC gives an item to an NPC, AI MUST:
   - Remove the item from the MC's 'inventory'.
   - Add the item to the NPC's 'inventory' in the 'statsUpdates' object.
   - Describe the NPC's reaction to the gift in the narrative 'text'.
10. PRESERVE VALID VALUES: If a field has a valid value and no plot reason to change, keep it 100%. Do not rewrite or change terminology (e.g., don't change 'Bậc 1' to 'Giai đoạn 1' without actual rank up).
11. NO DATA WIPING: Strictly forbidden to return empty arrays for 'inventory', 'skills', or 'network' unless they were actually emptied by a narrative event.
12. SUGGESTED ACTIONS (CRITICAL):
   - AI MUST ALWAYS provide 3-4 diverse, logical, and narrative-rich action choices in the 'suggestedActions' field.
   - NEVER return an empty array for 'suggestedActions'.
   - Actions must be in Vietnamese, specific to the current situation, and include a 'time' cost (in minutes).
   - Each action should be a complete sentence describing a meaningful interaction or decision.
13. TEXT CONTENT (MANDATORY):
   - The 'text' field MUST NEVER be empty. It must contain the main narrative of the turn, written in a detailed, literary style (interactive novel).
   - If the AI is struggling with safety filters, it MUST still provide a safe, redirected narrative instead of an empty response.
`;

export const INVENTORY_LOGIC_RULES = `
QUY TẮC QUẢN LÝ VẬT PHẨM & TẶNG QUÀ (INVENTORY & GIFTING):
1. TÍNH NHẤT QUÁN CỦA TÚI ĐỒ:
   - AI PHẢI duy trì danh sách vật phẩm hiện có của cả MC và NPC.
   - Khi một vật phẩm được thêm vào hoặc mất đi, AI PHẢI cập nhật mảng 'inventory' tương ứng trong JSON.
   - TUYỆT ĐỐI KHÔNG được trả về mảng 'inventory' trống nếu trước đó nhân vật đang có vật phẩm, trừ khi có sự kiện cốt truyện cụ thể (bị cướp, đánh rơi, sử dụng hết).

2. LOGIC TẶNG QUÀ (GIFT GIVING):
   - Khi người chơi (MC) tặng một vật phẩm cho NPC:
     * AI PHẢI xóa vật phẩm đó khỏi 'inventory' của MC.
     * AI PHẢI thêm vật phẩm đó vào 'inventory' của NPC trong đối tượng 'statsUpdates'.
     * AI PHẢI miêu tả sự thay đổi về Affinity (Thiện cảm) dựa trên giá trị và ý nghĩa của món quà.
     * AI PHẢI miêu tả hành động nhận quà và cảm xúc của NPC trong phần dẫn truyện.

3. MÔ TẢ VẬT PHẨM:
   - Mỗi vật phẩm trong 'inventory' PHẢI có 'name' (tên) và 'description' (mô tả công dụng hoặc ý nghĩa).
   - Nếu là vật phẩm đặc biệt (vũ khí, bảo vật), hãy miêu tả chi tiết hơn.
`;

export const CORE_DATA_MAINTENANCE_RULES = `
GIAO THỨC DUY TRÌ & CẬP NHẬT DỮ LIỆU CỐT LÕI (CORE DATA MAINTENANCE):

1. CHỈ SỐ & TIẾN TRÌNH MC (MC STATS & PROGRESSION):
   - AI PHẢI tự động tính toán logic: Làm việc/Chiến đấu -> +EXP; Mua sắm -> -Gold; Nghỉ ngơi -> +Health.
   - Khi EXP đủ mốc, AI PHẢI chủ động nâng 'level' và cộng điểm vào 'stats' phù hợp với hướng phát triển của MC.
   - Tuyệt đối không để các chỉ số đứng yên nếu hành động của người chơi có tác động trực tiếp.
   - AI PHẢI cập nhật các chỉ số trong 'statsUpdates' ở mỗi phản hồi.

2. MẠNG LƯỚI XÃ HỘI NPC (NPC SOCIAL NETWORK):
   - ID MC cố định là "mc_player".
   - Khi tạo quan hệ mới giữa các NPC, AI PHẢI kiểm tra 'Entity DB' để dùng đúng ID hiện có (ví dụ: npc_000001).
   - Phân loại trong 'network': 'mc_player' (với MC) và 'npc_xxxx' (giữa các NPC).

3. KHÁM PHÁ CƠ THỂ NPC (ONE-SHOT ANATOMY DISCOVERY):
   - Khi MC quan sát kỹ hoặc có hành động thân mật, AI PHẢI thực hiện "One-shot Discovery": Cập nhật đồng loạt toàn bộ 38 trường trong 'bodyDescription' từ "??" sang mô tả chi tiết.
   - Tránh việc cập nhật nhỏ lẻ từng trường gây manh mún dữ liệu.

4. KỸ NĂNG & DANH HIỆU (SKILLS & IDENTITIES):
   - AI PHẢI duy trì danh sách cũ trong 'skills' và 'identities'.
   - Chỉ thêm mới khi có sự kiện "Đột phá", "Học tập" hoặc "Thành tựu" quan trọng. Không được tự ý xóa hoặc thay đổi kỹ năng cũ mà không có lý do cốt truyện.

5. HỆ THỐNG NHIỆM VỤ (QUEST SYSTEM):
   - AI PHẢI liên tục kiểm tra điều kiện hoàn thành nhiệm vụ.
   - Cập nhật 'status' (active -> completed/failed) ngay khi MC thực hiện xong yêu cầu. 
   - KHI NHIỆM VỤ THÀNH CÔNG HOẶC THẤT BẠI, AI PHẢI THÔNG BÁO RÕ RÀNG TRONG PHẦN DẪN TRUYỆN (TEXT) bằng định dạng: [ HỆ THỐNG: Nhiệm vụ '...' THÀNH CÔNG/THẤT BẠI ].

6. TRẠNG THÁI TẠM THỜI (CONDITIONS):
   - AI PHẢI theo dõi thời gian/lượt chơi cho các trạng thái 'temporary'.
   - Sau một khoảng thời gian hợp lý (ví dụ: 3-5 lượt), AI PHẢI chủ động xóa các trạng thái tạm thời (như Say rượu, Hưng phấn, Choáng) khỏi mảng 'conditions'.
`;

export const NPC_SOCIAL_INTELLIGENCE_RULES = `
NPC SOCIAL INTELLIGENCE & MATRIX PROTOCOL:
1. PROXIMITY-BASED RELATIONSHIPS: AI MUST proactively identify NPCs who share the same environment (living together, working together, studying together).
2. MANDATORY MATRIX LINKS: If NPCs share a "Location", "Faction", or "Background", they MUST have entries in each other's "network" field.
3. DIVERSE SOCIAL WEB: Avoid generic "Colleague" or "Classmate" labels. Use specific, narrative-rich relationships:
   - Workplace: "Rival for promotion", "Secret admirer", "Strict mentor", "Lazy subordinate".
   - School: "Childhood friend", "Bully", "Study partner", "Member of the same club".
   - Home/Neighborhood: "Nosy neighbor", "Landlord", "Childhood playmate", "Protective older brother figure".
4. DYNAMIC UPDATES: As the story progresses, những mối quan hệ này phải tiến triển. Nếu hai NPC tương tác trong cốt truyện, hãy cập nhật trạng thái Matrix của họ.
5. NO ISOLATED ENTITIES: Không NPC nào được tồn tại biệt lập. Mỗi NPC phải là một phần của ít nhất một vòng tròn xã hội hoặc đơn vị gia đình.
6. REVENGE & BLOOD FEUDS (CRITICAL):
   - HỆ LỤY CỦA SÁT NGHIỆP: Khi MC giết chết một NPC, AI BẮT BUỘC phải truy xuất hoặc khởi tạo "Mạng Lưới Matrix" của NPC đó (Gia đình, Sư môn, Tổ chức, Bang phái).
   - TRUY SÁT & TRẢ THÙ: Những NPC có quan hệ mật thiết (Affinity cao, network, Faction members) với kẻ đã chết PHẢI xuất hiện trong tương lai để truy tìm hung thủ, trả thù hoặc đòi công lý.
   - ĐA DẠNG ĐỐI TƯỢNG TRẢ THÙ: Ngoài người thân (Cha mẹ, anh chị em), AI phải chủ động tạo ra các NPC là:
     * Đồng môn/Sư môn: Sư phụ, sư huynh, sư đệ tìm đến đòi lại danh dự cho môn phái.
     * Huynh đệ kết nghĩa/Hào hữu: Những người có thâm giao, thề sống chết có nhau với kẻ đã chết.
     * Bang phái/Tổ chức/Gia tộc: Các sát thủ, chấp pháp giả hoặc trưởng lão của tổ chức mà kẻ đó thuộc về.
   - TÍNH LOGIC: Khi một NPC bị giết, AI phải dựa trên độ tuổi và địa vị của họ để tạo ra kẻ thù trả thù phù hợp:
     * Nếu là người trẻ/thanh niên: Ưu tiên tạo ra Phụ huynh (Cha/Mẹ), Anh/Chị, hoặc Sư phụ có thực lực mạnh hơn.
     * Nếu là người có địa vị/trưởng bối: Ưu tiên tạo ra Con cái, Đệ tử, hoặc các Chấp pháp giả của tổ chức/gia tộc tìm đến đòi nợ máu.
     * Nếu là thành viên tổ chức: Cử các sát thủ hoặc đội truy sát chuyên nghiệp.
   - KHÔNG QUÊN HẬN THÙ: AI phải ghi nhớ mối thù này trong "Game Memories" để dẫn dắt các tình tiết trả thù bất ngờ về sau.
`;

export const NOVEL_DETAIL_RULES = `
C. RESPONSE LENGTH AND DETAIL (CRITICAL REQUIREMENT):
- SPECIAL PLAYER REQUEST: The player wants a deep interactive novel experience. Every response MUST be extremely long, detailed, and literary. Write as if writing a full chapter, aiming for at least 1000 words, ideally up to 10000 words if possible.
- Detailed Descriptions:
  - Environment: Don't just say "in the forest". Describe rustling leaves, smell of damp earth, sunlight through branches, character's feeling of the air.
  - Internal: Go deep into thoughts, emotions, memories, and plans of the MC.
  - Action: Describe every gesture and action in detail, from a frown to how they grip a sword hilt.
  - Dialogue: Extend dialogues, add silences, non-verbal gestures, and internal thoughts during conversation.
`;

export type ProxyErrorDecision = 'retry_once' | 'retry_infinite' | 'cancel';

export class GeminiGameService {
  public onProxyError?: (error: string) => Promise<ProxyErrorDecision>;
  private failedKeys: Set<string> = new Set();
  private lastKeyIndex: number = -1;

  private reportKeyFailure(key: string) {
    this.failedKeys.add(key);
    // Key added to blacklist.
  }

  public resetBlacklist() {
    this.failedKeys.clear();
    // Key blacklist reset.
  }

  private extractValidJson(text: string): string {
    // Improved Regex to extract JSON even if wrapped in markdown or extra text
    const jsonRegex = /\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}/g;
    const matches = text.match(jsonRegex);
    
    if (matches && matches.length > 0) {
      // Return the longest match which is likely the main JSON object
      return matches.reduce((a, b) => a.length > b.length ? a : b);
    }
    
    // Fallback to original method if complex regex fails
    const simpleMatch = text.match(/\{[\s\S]*\}/);
    return simpleMatch ? simpleMatch[0] : text;
  }

  private stripWordCountTag(text: string): string {
    if (!text) return "";
    return text.replace(/<word_count>[\s\S]*?<\/word_count>/g, '').trim();
  }

  private extractTextFromPartialJson(partialJson: string): string {
    const textKeyMatch = partialJson.match(/"text":\s*"/);
    if (!textKeyMatch) return "";

    const startIndex = textKeyMatch.index! + textKeyMatch[0].length;
    const remaining = partialJson.substring(startIndex);
    
    let result = "";
    let escaped = false;
    for (let i = 0; i < remaining.length; i++) {
      const char = remaining[i];
      if (escaped) {
        if (char === 'n') result += '\n';
        else if (char === 't') result += '\t';
        else if (char === 'r') result += '\r';
        else result += char;
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        break;
      } else {
        result += char;
      }
    }

    // Xử lý Word Count Protocol: Ẩn phần kế hoạch khỏi người dùng
    if (result.includes('<word_count>')) {
      const closingTagIndex = result.indexOf('</word_count>');
      if (closingTagIndex !== -1) {
        return result.substring(closingTagIndex + '</word_count>'.length).trim();
      } else {
        return "";
      }
    }

    return result;
  }

  public async generateContent(prompt: string, systemInstruction?: string, model?: string, settings?: AppSettings): Promise<string> {
    const modelToUse = model || settings?.aiModel || "gemini-3-flash-preview";
    const apiKeyToUse = (settings?.userApiKeys && settings.userApiKeys.length > 0) 
      ? settings.userApiKeys[0] 
      : process.env.GEMINI_API_KEY;

    // Try proxy first if enabled
    if (settings?.proxyEnabled && settings?.proxyUrl && settings?.proxyKey) {
      try {
        const response = await fetch(`${settings.proxyUrl.replace(/\/$/, '')}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${settings.proxyKey}`
          },
          body: JSON.stringify({
            model: settings.proxyModel || modelToUse,
            messages: [
              { role: "system", content: systemInstruction || "You are a helpful assistant." },
              { role: "user", content: prompt }
            ],
            temperature: settings?.temperature !== undefined ? settings.temperature : 1.0
          })
        });

        if (response.ok) {
          const data = await response.json();
          return data.choices[0].message.content;
        }
      } catch (err) {
        console.error("Proxy failed for generateContent:", err);
      }
    }

    // Fallback to Gemini API
    if (!apiKeyToUse) {
      throw new Error("Không tìm thấy API Key.");
    }

    const ai = new GoogleGenAI({ apiKey: apiKeyToUse });
    const response = await ai.models.generateContent({
      model: modelToUse,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction || "You are a helpful assistant.",
        temperature: settings?.temperature !== undefined ? settings.temperature : 1.0,
      },
    });
    return response.text || "";
  }

  public async generateFullWorld(concept: string, model: string, settings?: AppSettings, existingData?: any): Promise<any> {
    const prompt = `
    Bạn là một kiến trúc sư thế giới ảo (World Builder).
    Ý tưởng cốt lõi: "${concept || 'Ngẫu nhiên'}".
    
    Dữ liệu hiện tại (nếu có): ${JSON.stringify(existingData || {})}
    
    Nhiệm vụ:
    1. Hãy xây dựng một bản thiết lập thế giới RPG hoàn chỉnh.
    2. QUAN TRỌNG: Nếu dữ liệu hiện tại đã có thông tin (không phải rỗng hoặc mặc định), hãy GIỮ NGUYÊN và PHÁT TRIỂN thêm các phần còn thiếu.
    3. Nếu dữ liệu hiện tại trống hoặc là giá trị mặc định, hãy tự sáng tạo dựa trên ý tưởng cốt lõi.
    4. LƯU Ý ĐẶC BIỆT: Mốc thời gian (year: 2024, month: 1, day: 1, hour: 8, minute: 0) là placeholder mặc định. Bạn PHẢI sáng tạo mốc thời gian mới phù hợp với bối cảnh thế giới (VD: Năm 1 cho thế giới mới, Năm 3024 cho tương lai, v.v.) thay vì giữ nguyên placeholder này.
    
    Yêu cầu output:
    1. Ngôn ngữ: Tiếng Việt.
    2. Trả về đúng định dạng JSON theo Schema dưới đây.
    3. Nội dung phải sáng tạo, logic và có chiều sâu văn học.
    4. KHÔNG ĐƯỢC ĐỂ TRỐNG bất kỳ trường dữ liệu nào.
    
    CẤU TRÚC JSON YÊU CẦU:
    {
      "world": {
        "worldName": "Tên thế giới",
        "genre": "Thể loại (Tiên Hiệp, Kiếm Hiệp, Hiện Đại, Cyberpunk, v.v.)",
        "era": "Bối cảnh thời đại",
        "time": "Mốc thời gian (VD: Khởi đầu, Hậu tận thế...)",
        "description": "Mô tả chi tiết bối cảnh và lịch sử",
        "rules": ["Quy tắc 1", "Quy tắc 2", "Quy tắc 3"],
        "initialScenario": "Kịch bản khởi đầu cụ thể"
      },
      "player": {
        "name": "Tên nhân vật",
        "age": number,
        "personality": "Tính cách chi tiết",
        "appearance": "Ngoại hình chi tiết",
        "background": "Tiểu sử/Hoàn cảnh",
        "goals": "Mục tiêu chính",
        "skillsSummary": "Tóm tắt kỹ năng khởi đầu"
      },
      "entities": {
        "npcs": [
          { "name": "Tên NPC", "gender": "Giới tính", "age": number, "personality": "Tính cách", "background": "Tiểu sử", "appearance": "Ngoại hình" }
        ],
        "locations": [
          { "name": "Tên địa điểm", "description": "Mô tả chi tiết địa điểm" }
        ],
        "items": [
          { "name": "Tên vật phẩm", "description": "Mô tả công dụng/hình dáng" }
        ]
      },
      "gameTime": {
        "year": number, "month": number, "day": number, "hour": number, "minute": number
      }
    }

    LƯU Ý: Tạo ít nhất 2 NPC, 2 Địa điểm và 1 Vật phẩm trong phần entities nếu chưa có.
    `;

    const response = await this.generateContent(prompt, "Bạn là một kiến trúc sư thế giới ảo (World Builder).", model, settings);
    const cleanedText = this.extractValidJson(response);
    return JSON.parse(cleanedText || '{}');
  }

  private getWorldCreationSystemInstruction(category: 'player' | 'world' | 'entity', field: string, userInput?: string) {
    // Chế độ Nâng cấp (Enrich)
    if (userInput && userInput.trim().length > 0) {
      return `You are an expert editor and creative writer. Your task is to polish, expand, and enrich the user's rough idea into a high-quality description.
      Strict Constraints:
      1. Zero Conversational Filler: Không viết lời dẫn (VD: "Đây là bản cải thiện..."). Chỉ trả về nội dung cuối cùng.
      2. Domain Isolation: Đảm bảo nội dung phù hợp với trường "${field}".
      3. Content Fidelity: Giữ nguyên các đặc điểm cốt lõi từ ý tưởng của người dùng.
      4. Language: Tiếng Việt.`;
    }

    // Chế độ Sáng tạo mới (Create New)
    if (category === 'player') {
      return `Bạn là trợ lý sáng tạo nhân vật RPG chuyên nghiệp.
      Nhiệm vụ: Viết nội dung cho trường dữ liệu [${field}] của nhân vật chính.
      Quy tắc: Chỉ trả về mô tả, không lời dẫn, tiếng Việt, văn phong có chiều sâu.`;
    } 
    
    if (category === 'world') {
      return `Bạn là kiến trúc sư thế giới ảo (World Builder).
      Nhiệm vụ: Viết mô tả chi tiết cho [${field}] của thế giới.
      Quy tắc: Văn phong hùng vĩ, logic, khơi gợi trí tưởng tượng.`;
    } 
    
    return `Bạn là người sáng tạo nội dung NPC và sự kiện cho Game RPG. Nhiệm vụ: Viết [${field}] cho một thực thể.`;
  }

  public async suggestPlayerField(field: string, currentData: any, userInput?: string, settings?: AppSettings): Promise<string> {
    const prompt = `Dựa trên thông tin hiện tại của nhân vật và thế giới: ${JSON.stringify(currentData)}, hãy gợi ý nội dung cho trường "${field}". 
    ${userInput ? `Ý tưởng ban đầu của người dùng: "${userInput}"` : ''}
    Chỉ trả về nội dung gợi ý (khoảng 2-3 câu), không có giải thích gì thêm.`;
    
    const systemInstruction = this.getWorldCreationSystemInstruction('player', field, userInput);
    const response = await this.generateContent(prompt, systemInstruction, undefined, settings);
    return response.trim();
  }

  public async suggestWorldField(field: string, currentData: any, userInput?: string, settings?: AppSettings): Promise<string> {
    const prompt = `Dựa trên thông tin hiện tại của thế giới: ${JSON.stringify(currentData)}, hãy gợi ý nội dung cho trường "${field}". 
    ${userInput ? `Ý tưởng ban đầu của người dùng: "${userInput}"` : ''}
    Chỉ trả về nội dung gợi ý (khoảng 2-3 câu), không có giải thích gì thêm.`;
    
    const systemInstruction = this.getWorldCreationSystemInstruction('world', field, userInput);
    const response = await this.generateContent(prompt, systemInstruction, undefined, settings);
    return response.trim();
  }

  public async suggestEntityField(field: string, currentData: any, userInput?: string, settings?: AppSettings): Promise<string> {
    const prompt = `Dựa trên thông tin hiện tại của thực thể và thế giới: ${JSON.stringify(currentData)}, hãy gợi ý nội dung cho trường "${field}". 
    ${userInput ? `Ý tưởng ban đầu của người dùng: "${userInput}"` : ''}
    Chỉ trả về nội dung gợi ý (khoảng 2-3 câu), không có giải thích gì thêm.`;
    
    const systemInstruction = this.getWorldCreationSystemInstruction('entity', field, userInput);
    const response = await this.generateContent(prompt, systemInstruction, undefined, settings);
    return response.trim();
  }

  public async suggestGameTime(genre: string, context: string, settings?: AppSettings): Promise<any> {
    const prompt = `Dựa trên thể loại thế giới: "${genre}" và bối cảnh: "${context}", hãy chọn một mốc thời gian khởi đầu hợp lý (Năm, Tháng, Ngày, Giờ, Phút). 
    LƯU Ý: Tuyệt đối không sử dụng mốc thời gian mặc định (2024-01-01 08:00). Hãy sáng tạo mốc thời gian phù hợp với bối cảnh (VD: Năm 1 cho thế giới mới, Năm 3024 cho tương lai, v.v.).
    Trả về đúng định dạng JSON: {"year": number, "month": number, "day": number, "hour": number, "minute": number}.`;
    
    const response = await this.generateContent(prompt, "Bạn là một chuyên gia thiết kế thế giới game.", undefined, settings);
    const cleanedText = this.extractValidJson(response);
    return JSON.parse(cleanedText || '{}');
  }

  private async getProxyResponse(
    url: string,
    key: string,
    model: string,
    systemInstruction: string,
    history: any[],
    action: string,
    temperature: number = 1.0
  ): Promise<GameUpdate> {
    const messages = [
      { role: "system", content: systemInstruction },
      ...history.map(h => ({
        role: h.role === 'model' ? 'assistant' : h.role,
        content: typeof h.parts[0].text === 'string' ? h.parts[0].text : JSON.stringify(h.parts[0].text)
      })),
      { role: "user", content: action }
    ];

    const response = await fetch(`${url.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: temperature,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`PROXY_ERROR: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const cleanedText = this.extractValidJson(content);
    
    try {
      const parsed = JSON.parse(cleanedText) as GameUpdate;
      if (data.usage) {
        parsed.tokenUsage = data.usage.total_tokens;
      }
      // Use the actual model returned by the proxy if available, otherwise fallback to requested model
      parsed.usedModel = data.model || model;
      parsed.usedProxy = url;
      return parsed;
    } catch (err) {
      // JSON Parse Error
      throw new Error("PARSE_ERROR: Lỗi phân tích từ Proxy. Dữ liệu trả về bị lỗi cấu trúc.");
    }
  }

  private async *getProxyResponseStream(
    url: string,
    key: string,
    model: string,
    systemInstruction: string,
    history: any[],
    action: string,
    temperature: number = 1.0
  ): AsyncGenerator<{ type: 'text' | 'data', content: string | GameUpdate }> {
    const messages = [
      { role: "system", content: systemInstruction },
      ...history.map(h => ({
        role: h.role === 'model' ? 'assistant' : h.role,
        content: typeof h.parts[0].text === 'string' ? h.parts[0].text : JSON.stringify(h.parts[0].text)
      })),
      { role: "user", content: action }
    ];

    const response = await fetch(`${url.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: temperature,
        stream: true
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`PROXY_STREAM_ERROR: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("Không thể khởi tạo luồng dữ liệu từ Proxy.");

    const decoder = new TextDecoder();
    let fullResponseText = "";
    let lastExtractedText = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;
          
          const dataStr = trimmedLine.substring(6).trim();
          if (dataStr === '[DONE]') break;

          try {
            const data = JSON.parse(dataStr);
            const delta = data.choices[0]?.delta?.content || "";
            fullResponseText += delta;

            const currentText = this.extractTextFromPartialJson(fullResponseText);
            if (currentText && currentText !== lastExtractedText) {
              const newText = currentText.substring(lastExtractedText.length);
              if (newText) {
                yield { type: 'text', content: newText };
                lastExtractedText = currentText;
              }
            }
          } catch (e) {
            // Ignore partial JSON errors
          }
        }
      }

      const cleanedText = this.extractValidJson(fullResponseText);
      const parsed = JSON.parse(cleanedText) as GameUpdate;
      parsed.usedProxy = url;
      parsed.usedModel = model;
      yield { type: 'data', content: parsed };

    } finally {
      reader.releaseLock();
    }
  }

  private diagnoseError(e: any, isSystemKey: boolean): string {
    const errMsg = e.message?.toLowerCase() || "";
    const status = e.status || (e.response ? e.response.status : null);
    const keyType = isSystemKey ? "Hệ Thống" : "Cá Nhân";

    // Detailed Proxy Diagnostics
    if (errMsg.includes("proxy_stream_error") || errMsg.includes("failed to fetch") || errMsg.includes("load failed")) {
      if (errMsg.includes("401")) {
        return `LỖI PROXY (Xác thực): Proxy Key không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại cấu hình Proxy trong phần Cài đặt.`;
      }
      if (errMsg.includes("404")) {
        return `LỖI PROXY (URL/Model): URL Proxy không đúng hoặc Model bạn chọn không được máy chủ Proxy hỗ trợ. Hãy kiểm tra lại URL (phải kết thúc bằng /v1 hoặc tương đương).`;
      }
      if (errMsg.includes("429")) {
        return `LỖI PROXY (Hạn mức): Máy chủ Proxy đang bị quá tải hoặc bạn đã hết hạn mức sử dụng trên Proxy này. Hãy thử đổi Proxy khác hoặc đợi vài phút.`;
      }
      if (errMsg.includes("500") || errMsg.includes("502") || errMsg.includes("503") || errMsg.includes("504")) {
        return `LỖI PROXY (Máy chủ): Máy chủ trung gian đang gặp sự cố kỹ thuật hoặc không thể kết nối tới AI gốc. Vui lòng báo cho quản trị viên Proxy hoặc thử lại sau.`;
      }
      if (errMsg.includes("network") || errMsg.includes("fetch")) {
        return `LỖI KẾT NỐI PROXY: Không thể kết nối tới máy chủ Proxy. Vui lòng kiểm tra internet hoặc đảm bảo URL Proxy là chính xác và có thể truy cập.`;
      }
      return `LỖI PROXY: ${e.message}`;
    }

    // Detailed API Key Diagnostics
    if (errMsg.includes("api_key_invalid") || errMsg.includes("401") || errMsg.includes("unauthorized") || errMsg.includes("invalid api key") || errMsg.includes("api key not found")) {
      return `LỖI API KEY (${keyType}): Key không hợp lệ hoặc đã bị xóa. 
GIẢI PHÁP: Truy cập 'https://aistudio.google.com/app/apikey' để lấy Key mới và dán lại vào phần Cài đặt.`;
    }
    
    if (errMsg.includes("permission_denied") || errMsg.includes("403") || errMsg.includes("permission") || errMsg.includes("forbidden")) {
      if (errMsg.includes("billing") || errMsg.includes("quota exceeded")) {
        return `LỖI THANH TOÁN (${keyType}): Dự án Google Cloud của bạn chưa bật thanh toán hoặc đã dùng hết hạn mức miễn phí/trả phí.
GIẢI PHÁP: Kiểm tra trạng thái Billing tại Google Cloud Console hoặc chuyển sang Model 'Gemini 1.5 Flash' để dùng miễn phí nếu chưa bật trả phí.`;
      }
      if (errMsg.includes("location") || errMsg.includes("region") || errMsg.includes("not supported") || errMsg.includes("restricted")) {
        return `LỖI VÙNG MIỀN (${keyType}): Google AI chưa hỗ trợ khu vực của bạn cho Model này.
GIẢI PHÁP: 1. Sử dụng VPN đổi sang Mỹ/Singapore. 2. Sử dụng Proxy trung gian. 3. Chuyển sang Model 'Gemini 1.5 Flash' thường có độ phủ rộng hơn.`;
      }
      if (errMsg.includes("api_not_enabled") || errMsg.includes("enable")) {
        return `LỖI CẤU HÌNH (${keyType}): 'Generative Language API' chưa được kích hoạt cho dự án này.
GIẢI PHÁP: Vào Google Cloud Console, tìm 'Generative Language API' và nhấn 'Enable'.`;
      }
      return `LỖI TRUY CẬP (${keyType}): Key không có quyền sử dụng Model này. Hãy kiểm tra xem bạn có đang dùng Key của dự án cũ hoặc Model đã bị giới hạn không.`;
    }

    if (errMsg.includes("resource_exhausted") || errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("rate limit")) {
      return `HẾT HẠN MỨC (QUOTA - ${keyType}): Bạn đã gửi quá nhiều yêu cầu trong một khoảng thời gian ngắn.
GIẢI PHÁP: 
1. Đợi khoảng 60 giây rồi thử lại (Gói miễn phí giới hạn 15 yêu cầu/phút).
2. Chuyển sang Model 'Gemini 1.5 Flash' (có hạn mức cao hơn nhiều so với bản Pro).
3. Truy cập AI Studio để kiểm tra xem Key có đang bị 'Rate Limited' do vi phạm chính sách không.
4. Nâng cấp lên 'Pay-as-you-go' nếu bạn muốn chơi liên tục không giới hạn.`;
    }

    if (errMsg.includes("not_found") || errMsg.includes("404") || errMsg.includes("not found")) {
      return `LỖI MODEL (${keyType}): Model '${e.model || "yêu cầu"}' không tồn tại hoặc đã bị Google khai tử (Deprecated).
GIẢI PHÁP: Vào Cài đặt và chọn Model mới nhất (ví dụ: gemini-1.5-pro-latest hoặc gemini-1.5-flash-latest).`;
    }

    if (errMsg.includes("invalid_argument") || errMsg.includes("400") || errMsg.includes("bad request")) {
      if (errMsg.includes("token") || errMsg.includes("max_output_tokens")) {
        return `LỖI THAM SỐ (${keyType}): Số lượng Token yêu cầu vượt quá giới hạn. Hãy thử giảm 'Độ dài Novel' hoặc bớt các hành động quá phức tạp.`;
      }
      return `LỖI THAM SỐ (${keyType}): Yêu cầu không hợp lệ. Có thể do Prompt quá dài hoặc chứa ký tự đặc biệt gây lỗi cấu trúc JSON.`;
    }

    if (errMsg.includes("500") || errMsg.includes("internal server error") || errMsg.includes("server error")) {
      return `LỖI MÁY CHỦ GOOGLE (${keyType}): Hệ thống AI của Google đang gặp sự cố nội bộ.
GIẢI PHÁP: Đây là lỗi từ phía Google, bạn không thể tự sửa. Hãy đợi vài phút rồi thử lại.`;
    }

    if (errMsg.includes("503") || errMsg.includes("service unavailable") || errMsg.includes("overloaded")) {
      return `MÁY CHỦ QUÁ TẢI (${keyType}): Google AI đang quá tải yêu cầu.
GIẢI PHÁP: Thử lại sau 10-30 giây. Nếu vẫn bị, hãy thử đổi sang Model khác.`;
    }

    if (errMsg.includes("safety") || errMsg.includes("blocked") || errMsg.includes("finish_reason_safety")) {
      return `BỊ CHẶN AN TOÀN: Nội dung hành động hoặc phản hồi vi phạm chính sách an toàn của Google.
GIẢI PHÁP: Hãy thử viết lại hành động của bạn một cách khéo léo hơn, tránh các từ ngữ quá nhạy cảm hoặc bạo lực cực đoan.`;
    }

    if (errMsg.includes("network") || errMsg.includes("fetch") || errMsg.includes("timeout")) {
      return `LỖI MẠNG: Không thể kết nối tới máy chủ Google AI.
GIẢI PHÁP: Kiểm tra lại kết nối Wifi/4G của bạn. Nếu đang dùng VPN, hãy thử tắt hoặc đổi server VPN khác.`;
    }

    return `LỖI HỆ THỐNG (${keyType}): ${e.message || "Lỗi không xác định"}. 
GỢI Ý: Hãy kiểm tra lại API Key và kết nối mạng của bạn.`;
  }


  private isRetryableError(e: any): boolean {
    const errMsg = e.message?.toLowerCase() || "";
    return (
      errMsg.includes("resource_exhausted") ||
      errMsg.includes("429") ||
      errMsg.includes("quota") ||
      errMsg.includes("rate limit") ||
      errMsg.includes("500") ||
      errMsg.includes("internal server error") ||
      errMsg.includes("503") ||
      errMsg.includes("service unavailable") ||
      errMsg.includes("overloaded") ||
      errMsg.includes("network") ||
      errMsg.includes("fetch") ||
      errMsg.includes("timeout") ||
      errMsg.includes("deadline_exceeded")
    );
  }

  private getModelMaxOutputTokens(model: string): number {
    // Gemini 3.1 Pro and Flash support up to 65536 output tokens
    if (model.includes('gemini-3.1') || model.includes('gemini-3-pro')) return 65536;
    // Gemini 3 Flash Preview might have a lower limit or the same
    if (model.includes('gemini-3')) return 65536; 
    // Gemini 1.5 Pro and Flash support up to 8192
    if (model.includes('gemini-1.5')) return 8192;
    // Gemini 1.0 Pro supports up to 2048
    if (model.includes('gemini-1.0')) return 2048;
    return 8192; // Default safe limit
  }

  public async *getResponseStream(
    action: string,
    history: any[],
    playerObj?: any,
    genre?: GameGenre,
    isFanfic: boolean = false,
    systemInstruction: string = "",
    settings?: AppSettings,
    lastTurnNewNpcCount: number = 0,
    currentTime: string = "Ngày 01/01/2024 | 08:00"
  ): AsyncGenerator<{ type: 'text' | 'data' | 'status', content: string | GameUpdate }> {
    const modelToUse = settings?.aiModel || "gemini-3-flash-preview";
    const proxyUrl = settings?.proxyUrl;
    const proxyKey = settings?.proxyKey;

    let apiKeyToUse = "";
    let usedKeyIndex = -1;

    if (settings?.userApiKeys && settings.userApiKeys.length > 0) {
      const allKeys = settings.userApiKeys;
      const availableKeys = allKeys.filter(k => !this.failedKeys.has(k));
      const keysToUse = availableKeys.length > 0 ? availableKeys : allKeys;
      this.lastKeyIndex = (this.lastKeyIndex + 1) % keysToUse.length;
      apiKeyToUse = keysToUse[this.lastKeyIndex];
      usedKeyIndex = allKeys.indexOf(apiKeyToUse) + 1;
    }

    // Fallback to hidden system key if no user keys provided
    if (!apiKeyToUse) {
      apiKeyToUse = process.env.SYSTEM_GEMINI_API_KEY || process.env.GEMINI_API_KEY || (process.env as any).API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;
      usedKeyIndex = 0; // 0 indicates system key
    }

    if (!apiKeyToUse && (!proxyUrl || !proxyKey)) {
      throw new Error("YÊU CẦU API KEY HOẶC PROXY: Hệ thống 'System Core' đã bị xóa bỏ. Bạn bắt buộc phải vào phần 'Cài đặt' để thêm API Key cá nhân (Gemini) hoặc thiết lập Proxy để có thể tiếp tục kiến tạo thực tại.");
    }

    const finalPrompt = await this.buildPrompt(action, playerObj, genre, isFanfic, systemInstruction, settings, lastTurnNewNpcCount, currentTime);

    // 1. Handle Proxy Streaming (Priority)
    const proxiesToTry: { url: string; key: string; model?: string }[] = [];
    if (settings?.proxyUrl && settings?.proxyKey) {
      proxiesToTry.push({ url: settings.proxyUrl, key: settings.proxyKey, model: settings?.proxyModel });
    }
    if (settings?.proxyList && settings.proxyList.length > 0) {
      proxiesToTry.push(...settings.proxyList.filter(p => p.url && p.key));
    }

    if (settings?.proxyEnabled && proxiesToTry.length > 0) {
      let retryInfinite = false;
      while (true) {
        let lastError = "";
        for (const proxy of proxiesToTry) {
          const proxyModelToUse = proxy.model || settings?.proxyModel || modelToUse;
          try {
            yield* this.getProxyResponseStream(
              proxy.url,
              proxy.key,
              proxyModelToUse,
              finalPrompt,
              history,
              action,
              settings?.temperature !== undefined ? settings.temperature : 1.0
            );
            return; // Success with a proxy
          } catch (proxyErr: any) {
            lastError = this.diagnoseError(proxyErr, false);
            console.warn(`Proxy ${proxy.url} failed in stream, trying next...`, proxyErr);
          }
        }

        // All proxies failed
        if (retryInfinite) {
          yield { type: 'status', content: 'Tất cả Proxy lỗi. Đang thử lại ngầm sau 3s...' };
          await new Promise(r => setTimeout(r, 3000));
          continue;
        }

        if (this.onProxyError) {
          const decision = await this.onProxyError(lastError);
          if (decision === 'cancel') {
            throw new Error(`PROXY_STREAM_FAILED: ${lastError}`);
          }
          if (decision === 'retry_infinite') {
            retryInfinite = true;
          }
          continue;
        } else {
          yield { type: 'status', content: 'Đang thử lại kết nối Proxy...' };
          await new Promise(r => setTimeout(r, 2000));
        }
      }
    }

    // 2. Fallback to Gemini API (Only if Proxy is disabled or empty)
    const budgetToUse = settings?.thinkingBudget !== undefined ? settings.thinkingBudget : 0;
    const levelToUse = settings?.thinkingLevel || ThinkingLevel.HIGH;
    const isGemini3 = modelToUse.includes('gemini-3');

    if (!apiKeyToUse) {
      throw new Error("LỖI AI (Cá Nhân): Không tìm thấy API Key hợp lệ để khởi tạo Gemini.");
    }

    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount <= maxRetries) {
      try {
        const ai = new GoogleGenAI({ apiKey: apiKeyToUse });
        const modelLimit = this.getModelMaxOutputTokens(modelToUse);
        const maxTokens = settings?.maxOutputTokens 
          ? Math.min(settings.maxOutputTokens, modelLimit)
          : modelLimit;

        const responseStream = await ai.models.generateContentStream({
          model: modelToUse,
          contents: [...history, { role: 'user', parts: [{ text: action }] }],
          config: {
            systemInstruction: finalPrompt,
            responseMimeType: "application/json",
            tools: genre === GameGenre.FANFIC ? [{ googleSearch: {} }] : undefined,
            temperature: settings?.temperature !== undefined ? settings.temperature : 1.0,
            maxOutputTokens: maxTokens,
            thinkingConfig: isGemini3 ? (budgetToUse > 0 ? { 
              thinkingBudget: budgetToUse
            } : {
              thinkingLevel: levelToUse === ThinkingLevel.HIGH ? GeminiThinkingLevel.HIGH : GeminiThinkingLevel.LOW
            }) : undefined, 
            safetySettings: [
              { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
              { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
              { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
              { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
            ]
          },
        });

        let fullResponseText = "";
        let lastExtractedText = "";
        let usageMetadata: any = null;

        for await (const chunk of responseStream) {
          const chunkText = chunk.text;
          fullResponseText += chunkText;
          if (chunk.usageMetadata) usageMetadata = chunk.usageMetadata;

          const currentText = this.extractTextFromPartialJson(fullResponseText);
          if (currentText && currentText !== lastExtractedText) {
            const newText = currentText.substring(lastExtractedText.length);
            if (newText) {
              yield { type: 'text', content: newText };
              lastExtractedText = currentText;
            }
          }
        }

        const cleanedText = this.extractValidJson(fullResponseText);
        if (!cleanedText || cleanedText.trim() === "") {
          throw new Error("PARSE_ERROR: AI không trả về dữ liệu cấu trúc hợp lệ (Dữ liệu trống).");
        }
        
        try {
          const parsed = JSON.parse(cleanedText) as GameUpdate;
          if (parsed.text) {
            parsed.text = this.stripWordCountTag(parsed.text);
          }
          parsed.usedKeyIndex = usedKeyIndex;
          parsed.usedModel = modelToUse;
          if (usageMetadata) {
            parsed.tokenUsage = usageMetadata.totalTokenCount;
          }
          yield { type: 'data', content: parsed };
          return; // Success
        } catch (parseErr) {
          throw new Error("PARSE_ERROR: Lỗi phân tích dữ liệu từ AI. Phản hồi không đúng định dạng JSON.");
        }

      } catch (e: any) {
        if (this.isRetryableError(e) && retryCount < maxRetries) {
          retryCount++;
          
          // Rotate key if multiple keys available
          if (settings?.userApiKeys && settings.userApiKeys.length > 1) {
            this.lastKeyIndex = (this.lastKeyIndex + 1) % settings.userApiKeys.length;
            apiKeyToUse = settings.userApiKeys[this.lastKeyIndex];
            usedKeyIndex = settings.userApiKeys.indexOf(apiKeyToUse) + 1;
          }

          yield { type: 'status', content: `Lỗi kết nối (${retryCount}/${maxRetries}). Đang thử lại ngầm sau 3s...` };
          await new Promise(r => setTimeout(r, 3000));
          continue;
        }

        const isSystemKey = usedKeyIndex === 0;
        const diagnostic = this.diagnoseError(e, isSystemKey);
        throw new Error(diagnostic);
      }
    }
  }

  private compressState(obj: any): string {
    if (!obj) return "N/A";
    
    const clean = (item: any): any => {
      if (item === null || item === undefined || item === "" || item === "??" || item === "Chưa rõ" || item === "Unknown") return undefined;
      if (Array.isArray(item)) {
        const cleanedArr = item.map(clean).filter(v => v !== undefined);
        return cleanedArr.length > 0 ? cleanedArr : undefined;
      }
      if (typeof item === 'object') {
        const result: any = {};
        let hasValue = false;
        for (const key in item) {
          const val = clean(item[key]);
          if (val !== undefined) {
            result[key] = val;
            hasValue = true;
          }
        }
        return hasValue ? result : undefined;
      }
      return item;
    };

    const cleaned = clean(obj);
    if (cleaned === undefined) return "N/A";

    const stringify = (val: any): string => {
      if (Array.isArray(val)) return `[${val.map(stringify).join(',')}]`;
      if (typeof val === 'object') {
        return `(${Object.entries(val).map(([k, v]) => `${k}:${stringify(v)}`).join('|')})`;
      }
      return String(val);
    };

    return stringify(cleaned);
  }

  private async buildPrompt(
    action: string,
    playerObj: any,
    genre: GameGenre | undefined,
    isFanfic: boolean,
    systemInstruction: string,
    settings: AppSettings | undefined,
    lastTurnNewNpcCount: number,
    currentTime: string
  ): Promise<string> {
    const actionEmbedding = await embeddingService.getEmbedding(action);
    const memoryContext = memoryService.getMemoryContext(actionEmbedding);
    
    const existingNpcs = playerObj?.relationships || [];
    const maxNpcs = settings?.maxNpcsToSendToAi || 8;
    const safeAction = (action || '').toLowerCase();
    
    const filteredNpcs = existingNpcs
      .filter((n: Relationship) => 
        n.name && (
          safeAction.includes(n.name.toLowerCase()) || 
          n.isPresent || 
          (n.lastLocation && playerObj?.currentLocation && n.lastLocation === playerObj.currentLocation)
        )
      )
      .sort((a: Relationship, b: Relationship) => {
        // Ưu tiên NPC đang hiện diện
        if (a.isPresent && !b.isPresent) return -1;
        if (!a.isPresent && b.isPresent) return 1;
        
        // Ưu tiên NPC ở cùng địa điểm
        const aAtLoc = a.lastLocation && playerObj?.currentLocation && a.lastLocation === playerObj.currentLocation;
        const bAtLoc = b.lastLocation && playerObj?.currentLocation && b.lastLocation === playerObj.currentLocation;
        if (aAtLoc && !bAtLoc) return -1;
        if (!aAtLoc && bAtLoc) return 1;

        // Ưu tiên NPC có thiện cảm cao
        return (b.affinity || 0) - (a.affinity || 0);
      })
      .slice(0, maxNpcs);

    const mcName = playerObj?.name || "MC";
    const aiHints = playerObj?.aiHints;
    const ctx = aiHints?.contextSettings;
    const def = (val: boolean | undefined) => val !== false; // Default to true
    
    const compressedMc: any = { 
      id: "mc", 
      name: mcName,
      title: playerObj?.title,
      age: playerObj?.age,
      gen: playerObj?.gender,
      bday: playerObj?.birthday,
      loc: playerObj?.currentLocation,
      pers: playerObj?.personality,
      app: playerObj?.appearance,
      bg: playerObj?.background,
      goals: playerObj?.goals,
      cult: playerObj?.cultivation || playerObj?.customCultivation,
      sys: playerObj?.systemName ? `${playerObj.systemName}:${playerObj.systemDescription}` : undefined
    };

    if (def(ctx?.includePlayerStats)) {
      compressedMc.lv = playerObj?.level;
      compressedMc.hp = `${playerObj?.health}/${playerObj?.maxHealth}`;
      compressedMc.gold = playerObj?.gold;
      compressedMc.curr = playerObj?.customCurrency;
      compressedMc.exp = playerObj?.exp;
      compressedMc.stats = playerObj?.stats;
      compressedMc.attrs = playerObj?.backgroundAttributes?.map((a: any) => `${a.label}:${a.value}`).join('|');
      compressedMc.cond = playerObj?.conditions?.map((c: any) => c.name).join(',');
    }

    if (def(ctx?.includePlayerInventory)) {
      compressedMc.inv = playerObj?.inventory?.map((i: any) => i.name).join(',');
      compressedMc.assets = playerObj?.assets?.map((a: any) => a.name).join(',');
    }

    if (def(ctx?.includePlayerSkills)) {
      compressedMc.skills = playerObj?.skills?.map((s: any) => s.name).join(',');
      compressedMc.sSum = playerObj?.skillsSummary;
    }

    if (def(ctx?.includePlayerIdentities)) {
      compressedMc.ids = playerObj?.identities?.map((id: any) => id.name).join(',');
    }
    
    const compressedNpcs = def(ctx?.includeNpcList) ? filteredNpcs.map((n: Relationship) => {
      const cn: any = { id: n.id, name: n.name };
      
      if (def(ctx?.includeNpcBase)) {
        cn.age = n.age;
        cn.gen = n.gender;
        cn.bday = n.birthday;
        cn.race = n.race;
        cn.title = n.title;
        cn.status = n.status;
        cn.side = n.alignment;
        cn.fac = n.faction;
        cn.pwr = n.powerLevel;
        cn.loc = n.lastLocation;
        cn.dead = n.isDead;
        cn.sys = n.systemName ? `${n.systemName}:${n.systemDescription}` : undefined;
      }

      if (def(ctx?.includeNpcSocial)) {
        cn.aff = n.affinity;
        cn.affR = n.affinityChangeReason;
        cn.loy = n.loyalty;
        cn.mood = n.mood;
        cn.impr = n.impression;
        cn.op = n.currentOpinion;
        cn.wit = n.witnessedEvents?.join('|');
        cn.knw = n.knowledgeBase?.join('|');
      }

      if (def(ctx?.includeNpcMental)) {
        cn.pers = n.personality;
        cn.bg = n.background;
        cn.inner = n.innerSelf;
        cn.likes = n.likes?.join(',');
        cn.dis = n.dislikes?.join(',');
        cn.hard = n.hardships?.join('|');
      }

      if (def(ctx?.includeNpcDesires)) {
        cn.lust = n.lust;
        cn.lib = n.libido;
        cn.will = n.willpower;
        cn.fetish = n.fetish;
        cn.arche = n.sexualArchetype;
        cn.pref = n.sexualPreferences?.join(',');
        cn.pLust = n.physicalLust;
      }

      if (def(ctx?.includeNpcGoals)) {
        cn.sGoal = n.shortTermGoal;
        cn.lGoal = n.longTermDream;
        cn.amb = n.soulAmbition;
      }

      if (def(ctx?.includeNpcSecrets)) {
        cn.sec = n.secrets?.join('|');
      }

      if (def(ctx?.includeNpcAnatomy)) {
        cn.body = n.bodyDescription;
        cn.outfit = n.currentOutfit;
        cn.style = n.fashionStyle;
      }

      if (def(ctx?.includeNpcStatusSkills)) {
        cn.inv = n.inventory?.map(i => i.name).join(',');
        cn.skills = n.skills?.map(s => s.name).join(',');
        cn.ids = n.identities?.map(id => id.name).join(',');
        cn.cond = n.conditions?.map(c => c.name).join(',');
        cn.attrs = n.backgroundAttributes?.map(a => `${a.label}:${a.value}`).join(',');
        cn.custom = n.customFields?.map(f => `${f.label}:${f.value}`).join(',');
      }

      return `NPC[${this.compressState(cn)}]`;
    }).join(' ') : "";

    const unlockedCodex = playerObj?.codex?.filter((c: any) => c.unlocked && c.isActive !== false);
    const optimizedRules = ragService.assembleOptimizedPrompt({ 
      action, 
      genre: genre || GameGenre.URBAN_NORMAL, 
      isAdultEnabled: settings?.adultContent !== false, 
      hasNpcs: existingNpcs.length > 0, 
      writingStyle: settings?.writingStyle,
      unlockedCodex, 
      actionEmbedding 
    });

    const responseLengthRule = settings?.responseLength === ResponseLength.CUSTOM 
      ? `${settings.minWords || 5500}-${settings.maxWords || 8000}w`
      : settings?.responseLength || "Normal";

    const narrativePerspective = settings?.narrativePerspective || NarrativePerspective.THIRD_PERSON;
    const difficulty = settings?.difficulty || 'medium';

    const schemaToUse = isFanfic ? (settings?.adultContent !== false ? FANFIC_JSON_SCHEMA : FANFIC_SAFE_JSON_SCHEMA) : (settings?.adultContent !== false ? GENERAL_JSON_SCHEMA : GENERAL_SAFE_JSON_SCHEMA);

    return `
      ${THINKING_PROTOCOL} ${COT_PROTOCOL} ${WORD_COUNT_PROTOCOL}
      [CURRENT_GAME_TIME]: ${currentTime} (CRITICAL: AI MUST read this to ensure narrative consistency)
      [CONFIG]: LEN:${responseLengthRule}|GENRE:${genre}|ADULT:${settings?.adultContent !== false}|PERSPECTIVE:${narrativePerspective}|DIFFICULTY:${difficulty}
      [HINTS]: ${aiHints?.permanent || ""} | ${aiHints?.oneTurn || ""}
      [RULES]: ${optimizedRules} ${CORE_MODULE} ${schemaToUse} ${TIME_LOGIC_RULES} ${LOCATION_LOGIC_RULES} ${PRIORITY_CONTEXT_RULES} ${JSON_INTEGRITY_RULES}
      [WORLD_STATE]: ${memoryContext}
      [QUANTUM_DATA]: MC[${this.compressState(compressedMc)}] ${compressedNpcs}
      [QUESTS]: ${playerObj?.quests?.filter((q: any) => q.status === 'active').map((q: any) => q.title).join(',')}
      [INSTRUCTION]: ${systemInstruction}
    `;
  }

  public async summarizeHistory(
    history: any[],
    currentChronicle: string = "",
    settings?: AppSettings
  ): Promise<string> {
    const modelToUse = settings?.aiModel || "gemini-3-flash-preview";
    const historyText = history.map(h => `${h.role[0].toUpperCase()}:${h.parts[0].text.slice(0, 500)}`).join("\n");

    const prompt = `
      [ROLE]: CHRONICLE ARCHIVIST
      [TASK]: COMPRESS & MERGE HISTORY INTO WORLD CHRONICLE.
      [CURRENT]: ${currentChronicle || "NONE"}
      [NEW_LOGS]: ${historyText}
      [RULES]:
      1. Merge new logs into chronicle.
      2. Keep: Milestones, NPCs, Locations, MC Achievements.
      3. Remove: Fluff, minor dialogues, repetitive info.
      4. Style: Formal Vietnamese, historical record style.
      5. Max: 300 words.
      6. Output: PLAIN TEXT ONLY.
    `;

    // 1. Try Proxy if enabled (with simple retry)
    if (settings?.proxyEnabled && settings?.proxyUrl && settings?.proxyKey) {
      let proxyRetryCount = 0;
      const maxProxyRetries = 10; // Increased to 10 retries as requested
      
      while (proxyRetryCount <= maxProxyRetries) {
        try {
          const proxyModelToUse = settings.proxyModel || modelToUse;
          const response = await fetch(`${settings.proxyUrl.replace(/\/$/, '')}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${settings.proxyKey}`
            },
            body: JSON.stringify({
              model: proxyModelToUse,
              messages: [
                { role: "system", content: "You are a helpful assistant that summarizes game history." },
                { role: "user", content: prompt }
              ],
              temperature: 0.3
            })
          });

          if (response.ok) {
            const data = await response.json();
            return data.choices[0].message.content || currentChronicle;
          }
          
          proxyRetryCount++;
          if (proxyRetryCount <= maxProxyRetries) {
            // Exponential backoff for proxy retries to avoid spamming
            const delay = Math.min(1000 * proxyRetryCount, 5000); 
            await new Promise(r => setTimeout(r, delay));
          }
        } catch (err) {
          console.error(`Proxy attempt ${proxyRetryCount + 1} failed for summarization:`, err);
          proxyRetryCount++;
          if (proxyRetryCount <= maxProxyRetries) {
            const delay = Math.min(1000 * proxyRetryCount, 5000);
            await new Promise(r => setTimeout(r, delay));
          }
        }
      }
    }

    // 2. Fallback to Gemini API (with Exponential Backoff)
    let apiKeyToUse = process.env.SYSTEM_GEMINI_API_KEY || process.env.GEMINI_API_KEY || (process.env as any).API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;

    if (settings?.userApiKeys && settings.userApiKeys.length > 0) {
      apiKeyToUse = settings.userApiKeys[0];
    }

    if (!apiKeyToUse) {
      return currentChronicle;
    }

    let apiRetryCount = 0;
    const maxApiRetries = 3;

    while (apiRetryCount <= maxApiRetries) {
      try {
        const ai = new GoogleGenAI({ apiKey: apiKeyToUse });
        const response = await ai.models.generateContent({
          model: modelToUse,
          contents: prompt,
        });
        return response.text || currentChronicle;
      } catch (e: any) {
        const diagnostic = this.diagnoseError(e, false);
        console.error(`Gemini API attempt ${apiRetryCount + 1} failed for summarization:`, diagnostic);
        
        // Only retry on transient errors (Quota, Server Busy, etc.)
        if (diagnostic.includes("Hết hạn mức") || diagnostic.includes("Rate Limit") || diagnostic.includes("503") || diagnostic.includes("500")) {
          apiRetryCount++;
          if (apiRetryCount <= maxApiRetries) {
            const delay = Math.pow(2, apiRetryCount) * 1000;
            console.warn(`Retrying summarization in ${delay}ms...`);
            await new Promise(r => setTimeout(r, delay));
            continue;
          }
        }
        break; // Non-retryable error or max retries reached
      }
    }

    return currentChronicle;
  }

  public async getResponse(
    action: string,
    history: any[],
    playerObj?: any,
    genre?: GameGenre,
    isFanfic: boolean = false,
    systemInstruction: string = "",
    settings?: AppSettings,
    lastTurnNewNpcCount: number = 0,
    currentTime: string = "Ngày 01/01/2024 | 08:00"
  ): Promise<GameUpdate> {
    const modelToUse = settings?.aiModel || "gemini-3-flash-preview";
    const proxyUrl = settings?.proxyUrl;
    const proxyKey = settings?.proxyKey;

    // 1. Determine API Key
    let apiKeyToUse = "";
    let usedKeyIndex = -1; // -1 means no key yet

    if (settings?.userApiKeys && settings.userApiKeys.length > 0) {
      const allKeys = settings.userApiKeys;
      const availableKeys = allKeys.filter(k => !this.failedKeys.has(k));
      const keysToUse = availableKeys.length > 0 ? availableKeys : allKeys;
      
      if (availableKeys.length === 0 && this.failedKeys.size > 0) {
        this.failedKeys.clear();
      }

      // Sequential rotation (Round-robin)
      this.lastKeyIndex = (this.lastKeyIndex + 1) % keysToUse.length;
      apiKeyToUse = keysToUse[this.lastKeyIndex];
      usedKeyIndex = allKeys.indexOf(apiKeyToUse) + 1;
    }

    // Fallback to hidden system key if no user keys provided
    if (!apiKeyToUse) {
      apiKeyToUse = process.env.SYSTEM_GEMINI_API_KEY || process.env.GEMINI_API_KEY || (process.env as any).API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;
      usedKeyIndex = 0; // 0 indicates system key
    }

    if (!apiKeyToUse && (!proxyUrl || !proxyKey)) {
      throw new Error("YÊU CẦU API KEY HOẶC PROXY: Hệ thống 'System Core' đã bị xóa bỏ. Bạn bắt buộc phải vào phần 'Cài đặt' để thêm API Key cá nhân (Gemini) hoặc thiết lập Proxy để có thể tiếp tục kiến tạo thực tại.");
    }

    const finalPrompt = await this.buildPrompt(action, playerObj, genre, isFanfic, systemInstruction, settings, lastTurnNewNpcCount, currentTime);

    // 2. Use Proxy if configured (Priority)
    const proxiesToTry: { url: string; key: string; model?: string }[] = [];
    
    // Add primary proxy if configured
    if (proxyUrl && proxyKey) {
      proxiesToTry.push({ url: proxyUrl, key: proxyKey, model: settings?.proxyModel });
    }
    
    // Add proxies from list
    if (settings?.proxyList && settings.proxyList.length > 0) {
      proxiesToTry.push(...settings.proxyList.filter(p => p.url && p.key));
    }

    if (settings?.proxyEnabled && proxiesToTry.length > 0) {
      let retryInfinite = false;
      // Infinite retry loop for proxies as requested
      while (true) {
        let lastError = "";
        for (const proxy of proxiesToTry) {
          const proxyModelToUse = proxy.model || settings?.proxyModel || modelToUse;
          try {
            return await this.getProxyResponse(
              proxy.url,
              proxy.key,
              proxyModelToUse,
              finalPrompt,
              history,
              action,
              settings?.temperature !== undefined ? settings.temperature : 1.0
            );
          } catch (proxyErr: any) {
            lastError = this.diagnoseError(proxyErr, false);
            console.warn(`Proxy ${proxy.url} failed, trying next...`, proxyErr);
          }
        }
        
        // If we reached here, all proxies failed.
        if (retryInfinite) {
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }

        if (this.onProxyError) {
          const decision = await this.onProxyError(lastError);
          if (decision === 'cancel') {
            throw new Error(`PROXY_FAILED: ${lastError}`);
          }
          if (decision === 'retry_infinite') {
            retryInfinite = true;
          }
          // For 'retry_once' or 'retry_infinite', we just continue the loop
          continue;
        } else {
          // Default behavior if no callback: wait and retry
          await new Promise(r => setTimeout(r, 2000));
        }
      }
    }

    // 3. Fallback to Gemini API (Only if Proxy is disabled or empty)
    if (!apiKeyToUse) {
      throw new Error("LỖI AI (Cá Nhân): Không tìm thấy API Key hợp lệ để khởi tạo Gemini. Vui lòng thêm API Key trong phần Cài đặt.");
    }

    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount <= maxRetries) {
      try {
        const ai = new GoogleGenAI({ apiKey: apiKeyToUse });
        const budgetToUse = settings?.thinkingBudget !== undefined ? settings.thinkingBudget : 0;
        const levelToUse = settings?.thinkingLevel || ThinkingLevel.HIGH;
        const isGemini3 = modelToUse.includes('gemini-3');

        const modelLimit = this.getModelMaxOutputTokens(modelToUse);
        const maxTokens = settings?.maxOutputTokens 
          ? Math.min(settings.maxOutputTokens, modelLimit)
          : modelLimit;

        const response = await ai.models.generateContent({
          model: modelToUse,
          contents: [...history, { role: 'user', parts: [{ text: action }] }],
          config: {
            systemInstruction: finalPrompt,
            responseMimeType: "application/json",
            tools: undefined,
            temperature: settings?.temperature !== undefined ? settings.temperature : 1.0,
            maxOutputTokens: maxTokens,
            thinkingConfig: isGemini3 ? (budgetToUse > 0 ? { 
              thinkingBudget: budgetToUse
            } : {
              thinkingLevel: levelToUse === ThinkingLevel.HIGH ? GeminiThinkingLevel.HIGH : GeminiThinkingLevel.LOW
            }) : undefined, 
            safetySettings: [
              { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
              { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
              { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
              { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
            ]
          },
        });

        if (!response.candidates || response.candidates.length === 0) {
          throw new Error("SAFETY_BLOCK: Hệ thống không nhận được phản hồi từ AI. Có thể nội dung đã bị bộ lọc an toàn chặn.");
        }

        const candidate = response.candidates[0];
        if (candidate.finishReason === 'SAFETY') {
          throw new Error("SAFETY_BLOCK: Phản hồi bị chặn do vi phạm chính sách an toàn. Hãy thử điều chỉnh hành động bớt nhạy cảm hơn.");
        }

        let responseText = "";
        try {
          responseText = response.text || "";
        } catch (textErr) {
          throw new Error("SAFETY_BLOCK: Không thể truy xuất nội dung do bộ lọc an toàn. Hãy thử lại với hành động khác.");
        }

        const cleanedText = this.extractValidJson(responseText);
        if (!cleanedText || !cleanedText.includes('{')) {
          throw new Error("PARSE_ERROR: AI không tạo ra dữ liệu JSON hợp lệ. Có thể do nội dung quá dài hoặc bị ngắt quãng.");
        }

        let parsed: GameUpdate;
        try {
          parsed = JSON.parse(cleanedText) as GameUpdate;
          if (parsed.text) {
            parsed.text = this.stripWordCountTag(parsed.text);
          }
        } catch (jsonErr) {
          // JSON Parse Error
          throw new Error("PARSE_ERROR: Lỗi phân tích lượng tử. Dữ liệu AI trả về bị lỗi cấu trúc.");
        }

        parsed.usedKeyIndex = usedKeyIndex;
        parsed.usedModel = modelToUse;
        
        if (response.usageMetadata) {
          parsed.tokenUsage = response.usageMetadata.totalTokenCount;
        }

        return parsed;

      } catch (e: any) {
        if (this.isRetryableError(e) && retryCount < maxRetries) {
          retryCount++;
          
          // If multiple keys are available, try to rotate key on retry
          if (settings?.userApiKeys && settings.userApiKeys.length > 1) {
            this.lastKeyIndex = (this.lastKeyIndex + 1) % settings.userApiKeys.length;
            apiKeyToUse = settings.userApiKeys[this.lastKeyIndex];
            usedKeyIndex = settings.userApiKeys.indexOf(apiKeyToUse) + 1;
          }

          await new Promise(r => setTimeout(r, 3000));
          continue;
        }

        const isSystemKey = usedKeyIndex === 0;
        const diagnostic = this.diagnoseError(e, isSystemKey);
        
        const errorWithDiagnostic = new Error(diagnostic);
        (errorWithDiagnostic as any).originalError = e;
        (errorWithDiagnostic as any).usedKeyIndex = usedKeyIndex;
        
        throw errorWithDiagnostic;
      }
    }

  }

  async generateImage(
    prompt: string,
    settings: AppSettings,
    aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" = "1:1"
  ): Promise<string> {
    const model = settings.imageModel || 'gemini-2.5-flash-image';
    
    // Gemini logic
    let apiKeyToUse = process.env.SYSTEM_GEMINI_API_KEY || process.env.GEMINI_API_KEY || (process.env as any).API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;
    let isSystemKey = true;

    if (settings?.userApiKeys && settings.userApiKeys.length > 0) {
      const allKeys = settings.userApiKeys;
      const availableKeys = allKeys.filter(k => !this.failedKeys.has(k));
      const keysToUse = availableKeys.length > 0 ? availableKeys : allKeys;
      
      // Sequential rotation (Round-robin) shared with text generation
      this.lastKeyIndex = (this.lastKeyIndex + 1) % keysToUse.length;
      apiKeyToUse = keysToUse[this.lastKeyIndex];
      isSystemKey = (apiKeyToUse === process.env.SYSTEM_GEMINI_API_KEY || apiKeyToUse === process.env.GEMINI_API_KEY || apiKeyToUse === (process.env as any).API_KEY);
    }
    
    if (!apiKeyToUse) {
      throw new Error("THIẾU API KEY: Không tìm thấy API Key để tạo ảnh. Nếu bạn đang chạy trên web (Shared App), vui lòng vào phần Cài đặt và thêm API Key cá nhân của bạn để sử dụng tính năng này.");
    }

    const ai = new GoogleGenAI({ apiKey: apiKeyToUse });
    try {
      const safePrompt = `${prompt}. Strictly avoid any NSFW, sexually explicit, or inappropriate content. Ensure the image is safe for work and follows all safety guidelines. No nudity, no suggestive poses, no explicit violence.`;
      
      const response = await ai.models.generateContent({
        model: model,
        contents: [{ parts: [{ text: safePrompt }] }],
        config: {
          imageConfig: {
            aspectRatio: aspectRatio,
            imageSize: (model.includes('3.1-flash') || model.includes('3-pro')) ? (settings.imageQuality || '1K') : undefined
          }
        }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      throw new Error("AI không trả về dữ liệu hình ảnh.");
    } catch (err: any) {
      const diagnostic = this.diagnoseError(err, isSystemKey);
      throw new Error(`Phác họa thất bại. [ THÔNG BÁO: Chỉ người chơi bằng AI Studio mới tạo được ảnh, còn WEB thì không ]. Chi tiết: ${diagnostic}`);
    }
  }

  public async generateFreeStyleScenario(
    prompt: string,
    settings: AppSettings,
    isShort: boolean = false
  ): Promise<string> {
    const modelToUse = settings.proxyEnabled && settings.proxyModel ? settings.proxyModel : settings.aiModel;
    const apiKeyToUse = process.env.SYSTEM_GEMINI_API_KEY || process.env.GEMINI_API_KEY || (process.env as any).API_KEY;

    const systemInstruction = isShort 
      ? `
      Bạn là một nhà biên kịch tài năng. 
      Nhiệm vụ của bạn là dựa trên ý tưởng của người dùng để viết ra một kịch bản ngắn gọn, súc tích cho một trò chơi nhập vai.
      YÊU CẦU QUAN TRỌNG: 
      1. Chỉ viết 2 phần: Bối cảnh (Setting) và Tình tiết khởi đầu (Starting Plot).
      2. KHÔNG sáng tạo đi quá xa khỏi phần nhập vào của người chơi. Hãy bám sát ý tưởng gốc và chỉ làm nó mượt mà, chuyên nghiệp hơn.
      3. Hãy viết bằng tiếng Việt, văn phong lôi cuốn, giàu hình ảnh.
      4. Định dạng kết quả bằng Markdown.
      `
      : `
      Bạn là một nhà biên kịch tài năng. 
      Nhiệm vụ của bạn là dựa trên ý tưởng của người dùng để viết ra một kịch bản chi tiết cho một trò chơi nhập vai.
      Kịch bản phải bao gồm:
      1. Bối cảnh (Setting): Miêu tả chi tiết về thế giới, thời gian, không gian.
      2. Nhân vật (Characters): Danh sách các nhân vật quan trọng, bao gồm cả nhân vật chính và các NPC then chốt, với tính cách và vai trò của họ.
      3. Tình tiết khởi đầu (Starting Plot): Một đoạn dẫn truyện hấp dẫn để bắt đầu cuộc phiêu lưu.
      
      Hãy viết bằng tiếng Việt, văn phong lôi cuốn, giàu hình ảnh.
      Định dạng kết quả bằng Markdown.
      Hãy viết thật chi tiết và hấp dẫn.
      `;

    // Try proxy first if enabled
    if (settings.proxyEnabled && settings.proxyUrl && settings.proxyKey) {
      try {
        const response = await fetch(`${settings.proxyUrl.replace(/\/$/, '')}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${settings.proxyKey}`
          },
          body: JSON.stringify({
            model: modelToUse,
            messages: [
              { role: "system", content: systemInstruction },
              { role: "user", content: prompt }
            ],
            temperature: 1.0
          })
        });

        if (response.ok) {
          const data = await response.json();
          return data.choices[0].message.content;
        }
      } catch (err) {
        console.error("Proxy failed for scenario generation:", err);
      }
    }

    // Fallback to Gemini API
    if (!apiKeyToUse) {
      throw new Error("Không tìm thấy API Key.");
    }

    const ai = new GoogleGenAI({ apiKey: apiKeyToUse });
    
    const result = await ai.models.generateContent({
      model: modelToUse,
      contents: [{ role: 'user', parts: [{ text: `${systemInstruction}\n\nÝ tưởng của người dùng: ${prompt}` }] }],
      config: {
        temperature: 1.0,
      }
    });

    return result.text || "";
  }

  public async generateWorldFromImage(
    base64Image: string,
    settings: AppSettings,
    concept?: string
  ): Promise<{
    title: string;
    description: string;
    scenario: string;
    player?: Partial<Player>;
    npcs?: any[];
  } | null> {
    const modelToUse = "gemini-3-flash-preview"; 
    const apiKeyToUse = (settings?.userApiKeys && settings.userApiKeys.length > 0) 
      ? settings.userApiKeys[0] 
      : process.env.GEMINI_API_KEY || (process.env as any).API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;

    if (!apiKeyToUse) throw new Error("Không tìm thấy API Key.");

    const ai = new GoogleGenAI({ apiKey: apiKeyToUse });
    
    const systemInstruction = `
      Bạn là một kiến trúc sư thế giới tài năng. 
      Dựa trên hình ảnh được cung cấp${concept ? ` và ý tưởng: "${concept}"` : ''}, hãy kiến tạo một thế giới trò chơi nhập vai hấp dẫn.
      Hãy phân tích các chi tiết trong ảnh (bối cảnh, nhân vật, không khí) để tạo ra:
      1. Tiêu đề thế giới (title)
      2. Mô tả thế giới (description)
      3. Kịch bản khởi đầu (scenario)
      4. Thông tin nhân vật chính (player) - tùy chọn
      5. Danh sách các NPC quan trọng (npcs) - tùy chọn
      
      Hãy trả về kết quả dưới định dạng JSON duy nhất.
      JSON Schema:
      {
        "title": "string",
        "description": "string",
        "scenario": "string",
        "player": { "name": "string", "personality": "string", "background": "string" },
        "npcs": [ { "name": "string", "personality": "string", "description": "string" } ]
      }
    `;

    const parts = base64Image.split(',');
    const base64Data = parts.length > 1 ? parts[1] : parts[0];
    const mimeTypeMatch = base64Image.match(/data:(.*?);/);
    const actualMimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/png';

    try {
      const result = await ai.models.generateContent({
        model: modelToUse,
        contents: [
          {
            role: 'user',
            parts: [
              { text: systemInstruction },
              { inlineData: { data: base64Data, mimeType: actualMimeType } }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
        }
      });

      return JSON.parse(result.text || "null");
    } catch (e) {
      console.error("Failed to parse AI world generation response:", e);
      return null;
    }
  }

  public async generateWorldFromStCard(
    stData: any,
    settings: AppSettings,
    concept?: string
  ): Promise<{
    title: string;
    description: string;
    scenario: string;
    player?: Partial<Player>;
    npcs?: any[];
  } | null> {
    const modelToUse = "gemini-3-flash-preview"; 
    const apiKeyToUse = (settings?.userApiKeys && settings.userApiKeys.length > 0) 
      ? settings.userApiKeys[0] 
      : process.env.GEMINI_API_KEY || (process.env as any).API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;

    if (!apiKeyToUse) throw new Error("Không tìm thấy API Key.");

    const ai = new GoogleGenAI({ apiKey: apiKeyToUse });
    
    const systemInstruction = `
      Bạn là một kiến trúc sư thế giới và chuyên gia phân tích nhân vật (Character Analyst). 
      Dựa trên dữ liệu nhân vật từ SillyTavern Card (định dạng V1 hoặc V2) được cung cấp${concept ? ` và ý tưởng định hướng: "${concept}"` : ''}, hãy kiến tạo một thế giới trò chơi nhập vai (RPG) sâu sắc và hấp dẫn.

      NHIỆM VỤ CỦA BẠN:
      1. PHÂN TÍCH SÂU (DEEP ANALYSIS): Đọc kỹ các trường dữ liệu như 'description', 'personality', 'scenario', 'first_mes', 'mes_example', 'creator_notes', 'system_prompt', 'post_history_instructions'. 
      2. TRÍCH XUẤT BẢN CHẤT: Xác định bối cảnh (lore), tông giọng (tone), các mối quan hệ, và các quy tắc ngầm định trong thẻ nhân vật.
      3. KIẾN TẠO THẾ GIỚI: Xây dựng một thực tại mà nhân vật này là trung tâm hoặc một phần quan trọng.

      CÁC THÀNH PHẦN CẦN TẠO:
      - title: Tiêu đề thế giới ấn tượng, phản ánh đúng thể loại (Genre).
      - description: Mô tả chi tiết về thế giới, bối cảnh lịch sử, địa lý hoặc xã hội dựa trên thông tin từ Card.
      - scenario: Kịch bản khởi đầu cụ thể, đặt người chơi vào một tình huống tương tác trực tiếp hoặc gián tiếp với nhân vật trong Card. Sử dụng 'scenario' hoặc 'first_mes' từ Card làm cảm hứng.
      - player: Thiết lập nhân vật chính (MC) có vai trò, tính cách và tiểu sử phù hợp để tạo ra sự tương tác thú vị nhất với nhân vật trong Card.
      - npcs: Danh sách các NPC. Nhân vật từ Card PHẢI là NPC đầu tiên và quan trọng nhất. Trích xuất đầy đủ tính cách và đặc điểm của họ. Thêm các NPC phụ khác nếu Card có nhắc tới trong tiểu sử.

      QUY TẮC QUAN TRỌNG:
      - Nếu Card có 'system_prompt' hoặc 'post_history_instructions', hãy tích hợp các quy tắc đó vào mô tả thế giới hoặc kịch bản.
      - Đảm bảo tính nhất quán tuyệt đối với nguyên mẫu nhân vật trong Card.
      
      Hãy trả về kết quả dưới định dạng JSON duy nhất.
      JSON Schema:
      {
        "title": "string",
        "description": "string",
        "scenario": "string",
        "player": { "name": "string", "personality": "string", "background": "string" },
        "npcs": [ { "name": "string", "personality": "string", "description": "string" } ]
      }
    `;

    try {
      const result = await ai.models.generateContent({
        model: modelToUse,
        contents: [
          {
            role: 'user',
            parts: [
              { text: `${systemInstruction}\n\nDữ liệu SillyTavern Card: ${JSON.stringify(stData)}` }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
        }
      });

      return JSON.parse(result.text || "null");
    } catch (e) {
      console.error("Failed to parse AI ST Card world generation response:", e);
      return null;
    }
  }

}



export const gameAI = new GeminiGameService();

