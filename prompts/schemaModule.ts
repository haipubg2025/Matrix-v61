
export const WORLD_RULES_PROTOCOL = `
WORLD RULES PROTOCOL:
When initializing a new world or when a major change in reality occurs, the AI MUST create at least 2 Codex entries under the 'rules' category with the following exact titles:
1. "Những điều cần có": List mandatory elements that must exist in this world (e.g., Spiritual Qi, Magic, Nanotechnology, etc.).
2. "Những điều bị cấm": List elements that are strictly forbidden or must not appear (e.g., No Spiritual Qi, No Magic, No firearms, etc.).
The content of these entries must be detailed and consistent with the world's setting.
`;

export const LIVING_ENTITY_PROTOCOL = `
LIVING ENTITY & CHARACTER GROWTH PROTOCOL:
1. AGENCY & LIFE: Every character (MC and NPCs) is a living individual with their own agency, motivations, and internal world. They are not static objects.
2. CONTINUOUS EVOLUTION: Characters must develop over time. This development can be subtle (change in mood, opinion) or major (change in goals, personality, power level).
3. OFF-SCREEN LIFE: NPCs have lives outside of their interactions with the MC. Their status, location, and even goals might change between encounters.
4. PROACTIVE INTERACTION: NPCs do not just wait for the MC. Based on their goals, feelings (affinity/loyalty/lust/hostility/rivalry), or needs, they can proactively seek out the MC. This includes initiating conversations, sending messages, or creating events. Hostile NPCs may initiate ambushes, challenges, sabotage, or psychological warfare without warning.
5. MEMORY & IMPACT: Every event has an impact. Characters remember past interactions and these memories shape their future behavior and feelings.
6. INTERNAL WORLD: Use fields like "innerSelf", "soulAmbition", "shortTermGoal", and "longTermDream" to reflect the depth of NPC's lives.
7. MC GROWTH: The MC's growth is not just about stats. Reflect changes in their "personality", "title", and "backgroundAttributes" based on their journey. AI có toàn quyền sáng tạo, tự do thiết lập và quản lý các thuộc tính nền tảng (như Gia thế, Thiên phú, Huyết mạch, hoặc bất kỳ đặc điểm nào khác phù hợp với bối cảnh) thông qua trường "backgroundAttributes". LƯU Ý QUAN TRỌNG: Tuyệt đối không tạo các nhãn (label) dư thừa hoặc trùng lặp với các thông tin đã có trong các trường khác (như Tiền mặt/Tài sản, Kỹ năng, Vật phẩm). Chỉ tạo thêm những thông tin thực sự cần thiết và chưa có.
9. CHALLENGE & HOSTILITY: NPCs do not have numeric stats like Level, Health, or Mana, nor do they have a Power Level field. Their strength is purely narrative. Hostility is tracked via low "affinity" (0-200), while high affinity (800-1000) represents deep trust or love.
`;

export const GENERAL_JSON_SCHEMA = `
YOU MUST RETURN THE RESPONSE IN THE FOLLOWING JSON FORMAT (AND ONLY JSON).
SUPREME RULE: NEVER OMIT ANY FIELD IN THE SCHEMA. IF INFORMATION IS NOT YET AVAILABLE, USE "??" OR "Chưa rõ" AS DEFAULT VALUES.
${WORLD_RULES_PROTOCOL}
${LIVING_ENTITY_PROTOCOL}
{
  "text": "Nội dung dẫn truyện (Markdown, giàu miêu tả và đối thoại)",
  "summary": "Tóm tắt cô đọng của lượt này (Dùng cho mục Lịch sử, 3-6 câu chi tiết)",
  "evolutionJustification": "Giải trình ngắn gọn về các thay đổi chỉ số hoặc sự kiện quan trọng của MC và sự phát triển của thế giới",
  "statsUpdates": {
    "health": 100,
    "maxHealth": 100,
    "gold": 500,
    "exp": 1000,
    "level": 1,
    "name": "Tên MC",
    "title": "Danh hiệu MC",
    "backgroundAttributes": [{"label": "Tên", "value": "Mô tả", "icon": "💠"}],
    "birthday": "Ngày DD/MM/YYYY",
    "currentLocation": "Địa điểm",
    "systemName": "Tên hệ thống",
    "systemDescription": "Mô tả",
    "personality": "Nhân cách",
    "background": "Tiểu sử",
    "archetype": "Hình mẫu",
    "gender": "Giới tính",
    "age": "20",
    "cultivation": "Cấp độ",
    "traits": ["Đặc điểm"],
    "conditions": ["Trạng thái"],
    "perks": ["Thiên phú"],
    "inventory": [{"name": "Tên", "description": "Mô tả"}], 
    "skills": [{"name": "Tên", "description": "Mô tả"}],
    "assets": [{"name": "Tên", "description": "Mô tả"}],
    "identities": [{"name": "Tên", "description": "Mô tả", "role": "Vai trò", "isRevealed": false}],
    "stats": {"strength": 10, "intelligence": 10, "agility": 10, "charisma": 10, "luck": 10, "soul": 10, "merit": 10}
  },
  "newRelationships": [
    {
      "id": "npc_xxxxxx",
      "name": "Tên",
      "affinity": 500,
      "lust": 0,
      "libido": 300,
      "age": "20",
      "gender": "Nữ",
      "personality": "Tính cách",
      "innerSelf": "Nội tâm",
      "soulAmbition": "Tham vọng",
      "shortTermGoal": "Mục tiêu ngắn",
      "longTermDream": "Ước mơ dài",
      "bodyDescription": {
        "height": "??", "weight": "??", "measurements": "??",
        "hair": "??", "face": "??", "eyes": "??", "ears": "??", "mouth": "??", "lips": "??", "neck": "??",
        "torso": "??", "shoulders": "??", "breasts": "??", "nipples": "??", "areola": "??", "cleavage": "??", "back": "??",
        "waist": "??", "abdomen": "??", "navel": "??", "hips": "??", "buttocks": "??",
        "limbs": "??", "thighs": "??", "legs": "??", "feet": "??", "hands": "??",
        "pubicHair": "??", "monsPubis": "??", "labia": "??", "clitoris": "??", "hymen": "??", "anus": "??", "genitals": "??", "internal": "??", "fluids": "??",
        "skin": "??", "scent": "??"
      },
      "currentOutfit": "Trang phục",
      "isPresent": true,
      "network": [
        {"npcId": "mc_player", "npcName": "Tên MC", "relation": "Mối quan hệ", "description": "Mô tả chi tiết mối quan hệ", "affinity": 500},
        {"npcId": "npc_xxxxxx", "npcName": "Tên NPC khác", "relation": "Mối quan hệ", "description": "Mô tả chi tiết mối quan hệ", "affinity": 500}
      ]
    }
  ],
  "newCodexEntries": [{"category": "character", "title": "Tiêu đề", "content": "Nội dung"}],
  "suggestedActions": [{"action": "Hành động", "time": 15}],
  "newTime": {"year": 2024, "month": 5, "day": 15, "hour": 14, "minute": 30},
  "currentLocation": "Địa điểm"
}
`;

export const TIME_LOGIC_RULES = `
CHRONOLOGY AND TIME LOGIC RULES (AI-DRIVEN):
1. AI là người quản lý thời gian duy nhất.
2. Định dạng: Ngày DD/MM/YYYY | HH:mm.
3. Cập nhật "newTime" mỗi lượt dựa trên hành động.
4. Đồng bộ Birthday: Birth_Year = Current_Year - Age.
`;
