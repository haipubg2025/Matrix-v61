
export enum GameGenre {
  URBAN_NORMAL = 'Đô Thị Bình Thường',
  URBAN_SUPERNATURAL = 'Đô Thị Dị Biến',
  FANTASY_HUMAN = 'Fantasy Nhân Loại',
  FANTASY_MULTIRACE = 'Fantasy Đa Chủng Tộc',
  CULTIVATION = 'Tu Tiên / Tiên Hiệp',
  WUXIA = 'Kiếm Hiệp / Võ Lâm',
  SCI_FI = 'Tương Lai Giả Tưởng',
  HISTORY = 'Lịch Sử Nghìn Năm',
  WHOLESOME = 'Thuần Phong Mỹ Tục',
  FANFIC = 'Đồng Nhân',
  FREE_STYLE = 'Tự Do'
}

export enum AiModel {
  PRO_31 = 'gemini-3.1-pro-preview',
  FLASH_3 = 'gemini-3-flash-preview',
  PRO_25 = 'gemini-2.5-pro',
  FLASH_25 = 'gemini-2.5-flash',
}

export enum ThinkingLevel {
  LOW = 'LOW',
  HIGH = 'HIGH'
}

export enum ResponseLength {
  SHORT = 'Ngắn (1000 - 2000 từ)',
  MEDIUM = 'Trung bình (2500 - 5000 từ)',
  DEFAULT = 'Mặc định (5500 - 8000 từ)',
  LONG = 'Dài (8500 - 15000 từ)',
  CUSTOM = 'Tùy chỉnh (Custom)'
}

export enum WritingStyle {
  DEFAULT = 'Mặc định',
  CONVERT = 'Convert (Hán Việt)',
  WUXIA = 'Kiếm hiệp (Cổ điển)',
  PALACE = 'Cung đình / Cổ đại',
  SYSTEM = 'Hệ thống / Sảng văn',
  HARD_BOILED = 'Tối giản (Hard-boiled)',
  RURAL = 'Điền văn (Bình dị)',
  LITERARY = 'Văn chương / Tiểu thuyết',
  DARK = 'U tối / Nặng nề'
}

export enum NarrativePerspective {
  AI_DECIDES = 'Để AI quyết định',
  FIRST_PERSON = 'Ngôi thứ nhất (Xưng "Tôi", "Ta",...)',
  THIRD_PERSON = 'Ngôi thứ ba (Gọi "Anh ta", "Cô ấy",...)',
  SECOND_PERSON = 'Ngôi thứ hai (Gọi "Bạn", "Ngươi",...)'
}

export enum SexualArchetype {
  INNOCENT = 'Ngây thơ trong sáng',
  THEORETICALLY_AWARE = 'Đã biết qua sách báo/porn',
  EXPERIENCED = 'Đã có kinh nghiệm (vài lần)',
  PROMISCUOUS = 'Dâm đãng/Nhiều kinh nghiệm'
}

export interface AppSettings {
  aiModel: AiModel;
  thinkingBudget: number;
  thinkingLevel: ThinkingLevel;
  contextWindowSize: number;
  isFullscreen: boolean;
  mobileMode: boolean;
  primaryColor: string;
  adultContent: boolean;
  difficulty: 'easy' | 'medium' | 'hard' | 'hell' | 'asian';
  effectsEnabled: boolean;
  userApiKeys?: string[];
  proxyUrl?: string;
  proxyKey?: string;
  proxyModel?: string;
  theme?: 'dark' | 'light';
  fontSize?: number;
  fontFamily?: string;
  beautifyContent: boolean;
  maxNpcsToSendToAi?: number;
  proxyStatus?: 'idle' | 'testing' | 'success' | 'error';
  autoGenerateImages?: boolean;
  imageModel?: string;
  imageStyle?: string;
  imageQuality?: '512px' | '1K' | '2K' | '4K';
  temperature: number;
  maxOutputTokens?: number;
  responseLength?: ResponseLength;
  minWords?: number;
  maxWords?: number;
  writingStyle?: WritingStyle;
  narrativePerspective?: NarrativePerspective;
  streamingEnabled?: boolean;
  storageMode: 'local' | 'cloud';
  apiKeyEnabled: boolean;
  proxyEnabled: boolean;
  proxyList?: { url: string; key: string; model?: string }[];
  updatedAt?: number;
}

// NpcType removed as per user request to remove Harem functionality.

export interface GameTime {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'failed';
  reward?: string;
  group: 'main' | 'side'; 
  kind: 'single' | 'chain'; 
  currentStep?: number; 
  totalSteps?: number;   
}

export interface BodyDescription {
  virginity?: 'Còn Trinh' | 'Mất Trinh' | 'Không Rõ';
  height?: string;
  weight?: string;
  measurements?: string; 
  hair?: string;        
  face?: string;        
  torso?: string;       
  limbs?: string;       
  genitals?: string;    
  neck?: string;        
  breasts?: string;     
  nipples?: string;     
  areola?: string;      
  cleavage?: string;    
  waist?: string;       
  abdomen?: string;     
  navel?: string;       
  back?: string;        
  pubicHair?: string;   
  monsPubis?: string;   
  labia?: string;       
  clitoris?: string;    
  hymen?: string;       
  anus?: string;        
  buttocks?: string;    
  thighs?: string;      
  legs?: string;        
  feet?: string;        
  hands?: string;       
  internal?: string;    
  fluids?: string;      
  eyes?: string;        
  ears?: string;        
  shoulders?: string;   
  hips?: string;        
  skin?: string;        
  scent?: string;       
  mouth?: string;       
  lips?: string;        
}

export interface NpcCondition {
  name: string;
  type: 'temporary' | 'permanent';
  description: string;
}

export interface SuggestedAction {
  action: string;
  time: number; 
}

export enum IdentityType {
  NORMAL = 'Bình Thường',
  DESTINY = 'Vận Mệnh',
  FANFIC = 'Đồng Nhân',
  SECRET = 'Bí Mật',
  LEGENDARY = 'Huyền Thoại'
}

export interface Identity {
  name: string;
  description: string;
  role: string;
  isRevealed: boolean;
  type?: IdentityType;
}

export interface NpcNetwork {
  npcId: string;
  npcName?: string;
  relation: string;
  description?: string;
  affinity?: number;
}

export interface Relationship {
  id: string; 
  name: string;
  title?: string;
  type?: string;
  affinity?: number; // Optional for crowd NPCs
  affinityChangeReason?: string; 
  status: string;
  avatar?: string;
  mood?: string;
  impression?: string;
  currentOpinion?: string; 
  witnessedEvents?: string[]; 
  knowledgeBase?: string[];    
  secrets?: string[];
  lastLocation?: string;
  age?: number | string;         
  birthday?: string;    
  gender?: string;
  race?: string;
  powerLevel?: string;
  alignment?: string;
  faction?: string;
  systemName?: string;
  systemDescription?: string;
  personality?: string; 
  likes?: string[];
  dislikes?: string[];
  background?: string;
  hardships?: string[];
  lust?: number; // 0-1000 scale, current arousal
  libido?: number; // 0-1000 scale, base sexual drive
  willpower?: number; // 0-1000 scale, mental resistance
  physicalLust?: string; // Detailed description
  soulAmbition?: string;
  shortTermGoal?: string;
  longTermDream?: string;
  fetish?: string;
  sexualArchetype?: SexualArchetype;
  sexualPreferences?: string[];
  loyalty?: number; // 0-1000 scale, optional for crowd NPCs
  isPresent?: boolean;
  isDead?: boolean;
  isSensitive?: boolean; 
  bodyDescription?: BodyDescription;
  conditions?: NpcCondition[]; 
  backgroundAttributes?: BackgroundAttribute[];
  currentOutfit?: string;
  fashionStyle?: string;
  innerSelf?: string;
  lastChanges?: Record<string, { old: any, new: any }>;
  lockedFields?: string[];
  viewed?: boolean;
  skills?: Skill[];
  identities?: Identity[];
  inventory?: InventoryItem[];
  customFields?: { label: string, value: string | number, icon?: string }[];
  newFields?: string[];
  network?: NpcNetwork[];
}

export interface GenreStatDef {
  key: keyof Player['stats'];
  label: string;
  icon: string;
  color: string;
  bg: string;
}

export interface InventoryItem {
  name: string;
  description: string;
}

export interface Skill {
  name: string;
  description: string;
}

export interface Asset {
  name: string;
  description: string;
}

export interface GalleryImage {
  url: string;
  tags: string[];
  genre?: GameGenre | 'All';
}

export interface GalleryData {
  items: GalleryImage[];
  updatedAt: number;
}

export interface MemoryEntry {
  id: string;
  content: string;
  embedding: number[];
  metadata: {
    type: "fact" | "preference" | "event" | "relationship";
    importance: number;
    reasoning?: string;
    isPinned?: boolean;
    timestamp: number;
    lastUpdated: number;
  };
}

export interface MemoryState {
  worldSummary: string;
  chronicle?: string;
  memories: MemoryEntry[];
  lastSummarizedTurn: number;
}

export interface StudioParams {
  style: string;
  lighting: string;
  camera: string;
  keywords: string;
  negativePrompt: string;
  aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
}

export interface LoreSource {
  id: string;
  name: string;
  type: string;
  url: string;
  content?: string;
  timestamp: number;
}

export interface BackgroundAttribute {
  label: string;
  value: string;
  icon?: string;
}

export interface AICompanionConfig {
  id: string;
  name: string;
  personality: string;
  tone: string;
  description: string;
  avatar?: string;
  isActive: boolean;
  role: 'system' | 'assistant' | 'soul' | 'remnant' | 'deity';
  gender?: string;
}

export interface Player {
  name: string;
  title?: string;
  avatar?: string;
  gender?: string;
  age?: number | string;
  birthday?: string;
  health: number;
  maxHealth: number;
  level: number | string;
  gold: number;
  exp: number;
  stats: {
    strength: number;
    intelligence: number;
    agility: number;
    charisma: number;
    luck: number;
    soul?: number;   
    merit?: number;  
  };
  backgroundAttributes?: BackgroundAttribute[];
  cultivation?: string;
  customCultivation?: string;
  conditions?: NpcCondition[];
  systemName?: string; 
  systemDescription?: string;
  personality?: string;
  appearance?: string;
  background?: string;
  goals?: string;
  skillsSummary?: string;
  currentLocation?: string;
  assets?: Asset[]; 
  skills?: Skill[];
  inventory?: InventoryItem[];
  relationships: Relationship[];
  codex: CodexEntry[];
  storyNodes?: StoryNode[];
  quests: Quest[];
  identities?: Identity[];
  aiCompanion?: AICompanionConfig;
  isQuestEnabled?: boolean;
  customFields?: { label: string, value: string | number, icon?: string }[];
  customCurrency?: string;
  statLabels?: Record<string, string>;
  nextNpcId: number;
  turnCount: number;
  tokenUsage?: {
    latest: number;
    total: number;
    history?: number[];
  };
    aiHints?: {
      oneTurn: string;
      permanent: string;
      nsfwStyleHardcore?: boolean;
      nsfwStyleHardcoreContent?: string;
      nsfwStylePsychological?: boolean;
      nsfwStylePsychologicalContent?: string;
      nsfwStyleAction?: boolean;
      nsfwStyleActionContent?: string;
      customHints?: { id: string; text: string; enabled: boolean }[];
      forbiddenWords?: string;
      writingStyle?: string;
      contextSettings?: {
        // NPC Granular Control
        includeNpcBase?: boolean;
        includeNpcSocial?: boolean;
        includeNpcMental?: boolean;
        includeNpcDesires?: boolean;
        includeNpcGoals?: boolean;
        includeNpcSecrets?: boolean;
        includeNpcAnatomy?: boolean;
        includeNpcStatusSkills?: boolean;
        includeNpcList?: boolean;
        
        // Player
        includePlayerStats?: boolean;
        includePlayerInventory?: boolean;
        includePlayerSkills?: boolean;
        includePlayerIdentities?: boolean;
        
        // World/System
        includeCodexWorld?: boolean;
        includeCodexRules?: boolean;
        includeCodexEntities?: boolean;
        includeQuests?: boolean;
        includeMemories?: boolean;
        includeWorldSummary?: boolean;
      };
    };
  lockedFields?: string[];
  newFields?: string[];
  loreLibrary?: LoreSource[];
}

export interface CodexEntry {
  category: 'world' | 'rules' | 'entities' | 'history' | 'locations' | 'destiny' | 'story';
  title: string;
  content: string;
  unlocked: boolean;
  viewed?: boolean;
  isActive?: boolean;
}

export interface StoryNode {
  id: string;
  title: string;
  content: string;
  type: 'main' | 'branch' | 'event';
  timestamp: number;
  turnCount: number;
  parentId?: string;
}

export interface GameLog {
  type: 'system' | 'player' | 'narrator' | 'error';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  imageUrl?: string;
  suggestedActions?: SuggestedAction[];
  summary?: string;
  metadata?: {
    duration?: string;
    usedKeyIndex?: number;
    usedModel?: string;
    usedProxy?: string;
    newNpcCount?: number;
  };
  imageMetadata?: {
    duration?: string;
    model?: string;
    style?: string;
  };
}

export interface InitialChoice {
  id: string;
  label: string;
  description: string;
  effect: string;
}

export interface SubScenario {
  id: string;
  title: string;
  description: string;
  scenarios: string[];
}

export interface GameArchetype {
  id: string;
  instanceId?: string; // Unique ID for the specific game session
  title: string;
  genre: GameGenre;
  description: string;
  features: string[];
  subScenarios: SubScenario[];
  systemInstruction: string;
  defaultMcNames: string[];
}

export interface GameUpdate {
  text: string;
  evolutionJustification?: string;
  statsUpdates?: Partial<Player>;
  newRelationships?: Relationship[];
  newCodexEntry?: CodexEntry;
  newCodexEntries?: CodexEntry[];
  newStoryNodes?: StoryNode[];
  questUpdates?: Quest[];
  suggestedActions?: SuggestedAction[];
  currentLocation?: string;
  timeSkip?: number; 
  newTime?: GameTime;
  usedKeyIndex?: number;
  usedModel?: string;
  usedProxy?: string;
  tokenUsage?: number;
  summary?: string;
}

export const getAffinityLabel = (value?: number) => {
  if (value === undefined || value === null) return { label: '??', color: 'text-neutral-600' };
  if (value <= 100) return { label: 'Tử ĐỊch', color: 'text-red-700 font-black' };
  if (value <= 250) return { label: 'Thù Ghét', color: 'text-red-500' };
  if (value <= 400) return { label: 'Lạnh Nhạt', color: 'text-neutral-500' };
  if (value <= 550) return { label: 'Xã Giao', color: 'text-neutral-300' };
  if (value <= 700) return { label: 'Thân Thiết', color: 'text-emerald-400' };
  if (value <= 850) return { label: 'Ái Mộ', color: 'text-pink-400' };
  if (value <= 950) return { label: 'Si Mê', color: 'text-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]' };
  return { label: 'Tuyệt Đối Lệ Thuộc', color: 'text-rose-600 animate-pulse font-black' };
};

export const getLoyaltyLabel = (value?: number) => {
  if (value === undefined || value === null) return { label: '??', color: 'text-neutral-600' };
  if (value <= 150) return { label: 'Phản Trắc', color: 'text-red-700 font-black' };
  if (value <= 350) return { label: 'Bất Phục', color: 'text-orange-600' };
  if (value <= 550) return { label: 'Tạm Thời', color: 'text-neutral-400' };
  if (value <= 750) return { label: 'Tin Cậy', color: 'text-cyan-400' };
  if (value <= 900) return { label: 'Tận Hiến', color: 'text-indigo-400' };
  if (value <= 980) return { label: 'Tuyệt Đối', color: 'text-amber-400 shadow-[0_0_8px_currentColor]' };
  return { label: 'Tử Sĩ / Nô Lệ Linh Hồn', color: 'text-amber-500 animate-pulse font-black' };
};

export const getLustLabel = (value?: number) => {
  if (value === undefined || value === null) return { label: '??', color: 'text-neutral-600' };
  if (value <= 200) return { label: 'Bình Thản', color: 'text-neutral-600' };
  if (value <= 400) return { label: 'Rạo Rực Nhẹ', color: 'text-neutral-400' };
  if (value <= 600) return { label: 'Hưng Phấn', color: 'text-orange-400' };
  if (value <= 750) return { label: 'Khao Khát', color: 'text-pink-500' };
  if (value <= 900) return { label: 'Đê Mê', color: 'text-rose-500' };
  if (value <= 980) return { label: 'Phát Cuồng', color: 'text-rose-600 animate-bounce' };
  return { label: 'Cực Khoái / Sụp Đổ', color: 'text-fuchsia-600 animate-pulse font-black' };
};

export const getLibidoLabel = (value?: number) => {
  if (value === undefined || value === null) return { label: '??', color: 'text-neutral-600' };
  if (value <= 200) return { label: 'Lãnh Cảm', color: 'text-neutral-500' };
  if (value <= 450) return { label: 'Bình Thường', color: 'text-neutral-300' };
  if (value <= 650) return { label: 'Dâm Ngầm', color: 'text-orange-300' };
  if (value <= 800) return { label: 'Dâm Đãng', color: 'text-pink-400' };
  if (value <= 950) return { label: 'Phóng Đãng', color: 'text-rose-400' };
  return { label: 'Dâm Tính Triệt Để', color: 'text-fuchsia-500 animate-pulse' };
};

export const getWillpowerLabel = (value?: number) => {
  if (value === undefined || value === null) return { label: '??', color: 'text-neutral-600' };
  if (value <= 150) return { label: 'Bạc Nhược', color: 'text-red-500' };
  if (value <= 350) return { label: 'Yếu Ớt', color: 'text-orange-400' };
  if (value <= 550) return { label: 'Kiên Định', color: 'text-neutral-300' };
  if (value <= 750) return { label: 'Vững Vàng', color: 'text-emerald-400' };
  if (value <= 900) return { label: 'Bất Khuất', color: 'text-blue-400' };
  return { label: 'Đạo Tâm Bất Diệt', color: 'text-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] font-black' };
};

export const getGenreMeta = (genre?: GameGenre) => {
  switch (genre) {
    case GameGenre.CULTIVATION:
      return {
        skillLabel: "CÔNG PHÁP & THẦN THÔNG",
        ranks: ["Phàm Nhân", "Luyện Khí", "Trúc Cơ", "Kim Đan", "Nguyên Anh", "Hóa Thần", "Luyện Hư", "Hợp Thể", "Đại Thừa", "Độ Kiếp", "Chân Tiên", "Tiên Vương", "Tiên Đế", "Đại Đế"],
        statsDef: [
          { key: 'strength', label: 'Căn Cốt', icon: '🏔️', color: 'text-red-500', bg: 'bg-red-500/5' },
          { key: 'intelligence', label: 'Ngộ Tính', icon: '🧠', color: 'text-blue-400', bg: 'bg-blue-400/5' },
          { key: 'soul', label: 'Thần Thức', icon: '🔮', color: 'text-purple-400', bg: 'bg-purple-500/5' },
          { key: 'agility', label: 'Thân Pháp', icon: '⚡', color: 'text-emerald-400', bg: 'bg-emerald-500/5' },
          { key: 'luck', label: 'Khí Vận', icon: '🍀', color: 'text-yellow-500', bg: 'bg-yellow-500/5' },
        ] as GenreStatDef[],
        npcLabels: {
          faction: "Tông Môn / Gia Tộc", race: "Linh Căn / Chủng Tộc", alignment: "Đạo Tâm / Lập Trường",
          power: "Cảnh Giới",
          desire: "Đạo Quả / Tâm Nguyện", background: "Tiền Kiếp / Tu Hành", stat1Icon: "🏔️", stat2Icon: "⚡", stat3Icon: "🧬"
        },
        hpLabel: "Sinh Mệnh (HP)",
        turnLabel: "Số Lượt",
        codexLabels: {
          world: "Thiên Đạo", locations: "Bản Đồ Tu Chân", history: "Thượng Cổ Bí Sử", entities: "Kỳ Trân Dị Bảo", npcs: "Danh Sách Tu Sĩ"
        },
        aiTheme: {
          label: "LINH LỰC ĐANG KHỞI TẠO",
          primary: "text-purple-500",
          secondary: "text-purple-400/60",
          accent: "from-purple-600 via-fuchsia-500 to-purple-400",
          glow: "shadow-[0_0_20px_rgba(168,85,247,0.4)]",
          scanline: "bg-purple-500/50",
          iconColor: "text-purple-500"
        }
      };
    case GameGenre.WUXIA:
      return {
        skillLabel: "TÂM PHÁP & VÕ HỌC",
        ranks: ["Bất Nhập Lưu", "Tam Lưu", "Nhị Lưu", "Nhất Lưu", "Đỉnh Phong", "Tuyệt Thế", "Tông Sư", "Đại Tông Sư", "Thiên Hạ Đệ Nhất"],
        statsDef: [
          { key: 'strength', label: 'Ngoại Công', icon: '⚔️', color: 'text-red-500', bg: 'bg-red-500/5' },
          { key: 'intelligence', label: 'Nội Công', icon: '☯️', color: 'text-blue-400', bg: 'bg-blue-400/5' },
          { key: 'agility', label: 'Khinh Công', icon: '⚡', color: 'text-emerald-400', bg: 'bg-emerald-500/5' },
          { key: 'charisma', label: 'Danh Vọng', icon: '✨', color: 'text-pink-400', bg: 'bg-pink-500/5' },
          { key: 'luck', label: 'Cơ Duyên', icon: '🍀', color: 'text-yellow-500', bg: 'bg-yellow-500/5' },
        ] as GenreStatDef[],
        npcLabels: {
          faction: "Môn Phái / Bang Hội", race: "Gia Thế", alignment: "Chính / Tà / Quái",
          power: "Võ Công",
          desire: "Cừu Hận / Ước Nguyện", background: "Giang Hồ Ký Sự", stat1Icon: "⚔️", stat2Icon: "🥋", stat3Icon: "🏮"
        },
        codexLabels: {
          world: "Giang Hồ Quy Tắc", locations: "Bản Đồ Võ Lâm", history: "Võ Lâm Ký Sự", entities: "Thần Binh Lợi Khí", npcs: "Bảng Xếp Hạng Cao Thủ"
        },
        hpLabel: "Sinh Mệnh (HP)",
        turnLabel: "Số Lượt",
        aiTheme: {
          label: "KIẾM Ý ĐANG NGƯNG TỤ",
          primary: "text-red-500",
          secondary: "text-red-400/60",
          accent: "from-red-600 via-orange-500 to-red-400",
          glow: "shadow-[0_0_20px_rgba(239,68,68,0.4)]",
          scanline: "bg-red-500/50",
          iconColor: "text-red-500"
        }
      };
    case GameGenre.URBAN_NORMAL:
      return {
        skillLabel: "KỸ NĂNG & NĂNG LỰC",
        ranks: ["Vô Danh", "Tân Binh", "Chuyên Gia", "Thành Đạt", "Hào Môn", "Cấp Cao", "Trùm Cuối", "Huyền Thoại Đô Thị"],
        statsDef: [
          { key: 'strength', label: 'Thể Lực', icon: '🏃', color: 'text-red-500', bg: 'bg-red-500/5' },
          { key: 'intelligence', label: 'Trí Tuệ', icon: '🧠', color: 'text-blue-400', bg: 'bg-blue-400/5' },
          { key: 'charisma', label: 'Quyến Rũ', icon: '✨', color: 'text-pink-400', bg: 'bg-pink-500/5' },
        ] as GenreStatDef[],
        npcLabels: {
          faction: "Tập Đoàn / Thế Lực", race: "Nghề Nghiệp / Thân Phận", alignment: "Lối Sống / Tư Tưởng",
          power: "Địa Vị",
          desire: "Tham Vọng / Mục Tiêu", background: "Hồ sơ Cá nhân", stat1Icon: "🏢", stat2Icon: "💵", stat3Icon: "📱"
        },
        hpLabel: "Sức Khỏe",
        turnLabel: "Thời Gian",
        codexLabels: {
          world: "Quy Tắc Xã Hội", locations: "Bản Đồ Thành Phố", history: "Hồ Sơ Sự Kiện", entities: "Tài Sản & Vật Phẩm", npcs: "Danh Bạ Quan Hệ"
        },
        aiTheme: {
          label: "DỮ LIỆU ĐÔ THỊ ĐANG TẢI",
          primary: "text-blue-500",
          secondary: "text-blue-400/60",
          accent: "from-blue-600 via-cyan-500 to-blue-400",
          glow: "shadow-[0_0_20px_rgba(59,130,246,0.4)]",
          scanline: "bg-blue-500/50",
          iconColor: "text-blue-500"
        }
      };
    case GameGenre.URBAN_SUPERNATURAL:
      return {
        skillLabel: "DỊ N NĂNG & THỨC TỈNH",
        ranks: ["Hạng F", "Hạng E", "Hạng D", "Hạng C", "Hạng B", "Hạng A", "Hạng S", "Hạng SS", "Hạng SSS", "Bán Thần", "Chân Thần"],
        statsDef: [
          { key: 'strength', label: 'Lực Thức Tỉnh', icon: '⚡', color: 'text-red-500', bg: 'bg-red-500/5' },
          { key: 'intelligence', label: 'Tinh Thần Lực', icon: '🧿', color: 'text-blue-400', bg: 'bg-blue-400/5' },
          { key: 'agility', label: 'Tốc Độ TK', icon: '🏎️', color: 'text-emerald-400', bg: 'bg-emerald-500/5' },
          { key: 'charisma', label: 'Mị Lực DN', icon: '✨', color: 'text-pink-400', bg: 'bg-pink-500/5' },
        ] as GenreStatDef[],
        npcLabels: {
          faction: "Hội Kín / Tập Đoàn Thần Linh", race: "Chủng Tộc / Dị Năng", alignment: "Quy Luật Bản Thể",
          power: "Cấp Bậc",
          desire: "Chấp Niệm / Thần Vị", background: "Lịch Sử Thức Tỉnh", stat1Icon: "⚡", stat2Icon: "🧿", stat3Icon: "🧬"
        },
        codexLabels: {
          world: "Quy Luật Dị Biến", locations: "Vùng Dị Thường", history: "Hồ Sơ Thức Tỉnh", entities: "Vật Thể Dị Năng", npcs: "Danh Sách Dị Năng Giả"
        },
        hpLabel: "Sinh Mệnh (HP)",
        turnLabel: "Thời Gian",
        aiTheme: {
          label: "DỊ NĂNG ĐANG THỨC TỈNH",
          primary: "text-indigo-500",
          secondary: "text-indigo-400/60",
          accent: "from-indigo-600 via-purple-500 to-indigo-400",
          glow: "shadow-[0_0_20px_rgba(99,102,241,0.4)]",
          scanline: "bg-indigo-500/50",
          iconColor: "text-indigo-500"
        }
      };
    case GameGenre.FANTASY_HUMAN:
    case GameGenre.FANTASY_MULTIRACE:
      return {
        skillLabel: "MA PHÁP & CHIẾN KỸ",
        ranks: ["Dân Thường", "Tập Sự", "Chiến Binh", "Kỵ sĩ", "Đại Hiệp Sĩ", "Lãnh Chúa", "Đại Công Tước", "Anh Hùng", "Bá Chủ", "Bất Tử"],
        statsDef: [
          { key: 'strength', label: 'Sức Mạnh', icon: '🛡️', color: 'text-red-500', bg: 'bg-red-500/5' },
          { key: 'intelligence', label: 'Ma Pháp', icon: '🔮', color: 'text-blue-400', bg: 'bg-blue-400/5' },
          { key: 'agility', label: 'Nhanh Nhẹn', icon: '👟', color: 'text-emerald-400', bg: 'bg-emerald-500/5' },
          { key: 'charisma', label: 'Uy Nghi', icon: '👑', color: 'text-pink-400', bg: 'bg-pink-500/5' },
          { key: 'luck', label: 'Phúc Lợi', icon: '🍀', color: 'text-yellow-500', bg: 'bg-yellow-500/5' },
        ] as GenreStatDef[],
        npcLabels: {
          faction: "Vương Quốc / Liên Minh", race: "Chủng Tộc / Hệ", alignment: "Tín Ngưỡng / Lập Trường",
          desire: "Sứ Mệnh / Khát Vọng", background: "Sử Thi Ghi Chép", stat1Icon: "🔮", stat2Icon: "🛡️", stat3Icon: "📜"
        },
        codexLabels: {
          world: "Thần Thoại & Quy Tắc", locations: "Bản Đồ Đại Lục", history: "Sử Thi Anh Hùng", entities: "Ma Pháp Bảo Vật", npcs: "Danh Sách Anh Hùng"
        },
        hpLabel: "Sinh Mệnh (HP)",
        turnLabel: "Số Lượt",
        aiTheme: {
          label: "MA PHÁP ĐANG KHỞI TẠO",
          primary: "text-amber-500",
          secondary: "text-amber-400/60",
          accent: "from-amber-600 via-yellow-500 to-amber-400",
          glow: "shadow-[0_0_20px_rgba(245,158,11,0.4)]",
          scanline: "bg-amber-500/50",
          iconColor: "text-amber-500"
        }
      };
    case GameGenre.SCI_FI:
      return {
        skillLabel: "CÔNG NGHỆ & NÂNG CẤP",
        ranks: ["Thường Dân", "Kỹ Thuật Viên", "Hacker", "Đặc Vụ", "Chỉ Huy", "Huyền Thoại Cyber", "Chúa Tể Mạng"],
        statsDef: [
          { key: 'strength', label: 'Cơ Thể Học', icon: '🦾', color: 'text-red-500', bg: 'bg-red-500/5' },
          { key: 'intelligence', label: 'Xử Lý Dữ Liệu', icon: '💾', color: 'text-blue-400', bg: 'bg-blue-400/5' },
          { key: 'agility', label: 'Phản Xạ Thần Kinh', icon: '⚡', color: 'text-emerald-400', bg: 'bg-emerald-500/5' },
          { key: 'charisma', label: 'Mị Lực Kỹ Thuật', icon: '✨', color: 'text-pink-400', bg: 'bg-pink-500/5' },
          { key: 'luck', label: 'Thuật Toán May Mắn', icon: '🍀', color: 'text-yellow-500', bg: 'bg-yellow-500/5' },
        ] as GenreStatDef[],
        npcLabels: {
          faction: "Tập Đoàn / Băng Đảng", race: "Chủng Tộc / Loại Máy", alignment: "Quy Tắc Hệ Thống",
          desire: "Mục Tiêu Số Hóa", background: "Dữ Liệu Quá Khứ", stat1Icon: "🦾", stat2Icon: "💾", stat3Icon: "🌐"
        },
        codexLabels: {
          world: "Mạng Lưới Toàn Cầu", locations: "Bản Đồ Thành Phố / Trạm", history: "Lịch Sử Công Nghệ", entities: "Thiết Bị & Chip", npcs: "Danh Sách Thực Thể"
        },
        hpLabel: "Chỉ Số Sinh Tồn",
        turnLabel: "Thời Gian",
        aiTheme: {
          label: "HỆ THỐNG ĐANG KẾT NỐI",
          primary: "text-emerald-500",
          secondary: "text-emerald-400/60",
          accent: "from-emerald-600 via-cyan-500 to-emerald-400",
          glow: "shadow-[0_0_20px_rgba(16,185,129,0.4)]",
          scanline: "bg-emerald-500/50",
          iconColor: "text-emerald-500"
        }
      };
    case GameGenre.HISTORY:
      return {
        skillLabel: "VĂN VÕ & MƯU LƯỢC",
        ranks: ["Thường Dân", "Tú Tài", "Cử Nhân", "Trạng Nguyên", "Quan Viên", "Đại Thần", "Vương Hầu", "Hoàng Đế"],
        statsDef: [
          { key: 'strength', label: 'Võ Lực', icon: '⚔️', color: 'text-red-500', bg: 'bg-red-500/5' },
          { key: 'intelligence', label: 'Mưu Lược', icon: '📜', color: 'text-blue-400', bg: 'bg-blue-400/5' },
          { key: 'agility', label: 'Thân Pháp', icon: '⚡', color: 'text-emerald-400', bg: 'bg-emerald-500/5' },
          { key: 'charisma', label: 'Uy Nghi', icon: '👑', color: 'text-pink-400', bg: 'bg-pink-500/5' },
          { key: 'luck', label: 'Thiên Mệnh', icon: '🍀', color: 'text-yellow-500', bg: 'bg-yellow-500/5' },
        ] as GenreStatDef[],
        npcLabels: {
          faction: "Triều Đình / Bang Hội", race: "Gia Thế / Xuất Thân", alignment: "Đạo Đức / Lập Trường",
          desire: "Dã Tâm / Ước Nguyện", background: "Gia Phả / Ký Sự", stat1Icon: "⚔️", stat2Icon: "📜", stat3Icon: "🏯"
        },
        codexLabels: {
          world: "Quy Tắc Triều Đình", locations: "Bản Đồ Lãnh Thổ", history: "Biên Niên Sử", entities: "Báu Vật Triều Đại", npcs: "Danh Sách Nhân Vật"
        },
        hpLabel: "Sức Khỏe",
        turnLabel: "Thời Gian",
        aiTheme: {
          label: "SỬ THI ĐANG TÁI HIỆN",
          primary: "text-stone-500",
          secondary: "text-stone-400/60",
          accent: "from-stone-600 via-neutral-500 to-stone-400",
          glow: "shadow-[0_0_20px_rgba(120,113,108,0.4)]",
          scanline: "bg-stone-500/50",
          iconColor: "text-stone-500"
        }
      };
    case GameGenre.WHOLESOME:
      return {
        skillLabel: "KỸ NĂNG SỐNG & ĐẠO ĐỨC",
        ranks: ["Người Tốt", "Công Dân Ưu Tú", "Tấm Gương Sáng", "Nhà Từ Thiện", "Hiền Triết", "Thánh Nhân"],
        statsDef: [
          { key: 'strength', label: 'Sức Khỏe', icon: '🍎', color: 'text-green-500', bg: 'bg-green-500/5' },
          { key: 'intelligence', label: 'Kiến Thức', icon: '📖', color: 'text-blue-400', bg: 'bg-blue-400/5' },
          { key: 'charisma', label: 'Lòng Tốt', icon: '❤️', color: 'text-pink-400', bg: 'bg-pink-500/5' },
          { key: 'luck', label: 'Phúc Đức', icon: '✨', color: 'text-yellow-500', bg: 'bg-yellow-500/5' },
        ] as GenreStatDef[],
        npcLabels: {
          faction: "Cộng Đồng / Tổ Chức", race: "Nghề Nghiệp", alignment: "Phẩm Hạnh",
          desire: "Ước Nguyện Thiện Lành", background: "Tiểu Sử Cuộc Đời", stat1Icon: "🍎", stat2Icon: "📖", stat3Icon: "🤝"
        },
        codexLabels: {
          world: "Chuẩn Mực Đạo Đức", locations: "Địa Danh Văn Hóa", history: "Gương Sáng Việc Tốt", entities: "Vật Phẩm Ý Nghĩa", npcs: "Danh Sách Người Tốt"
        },
        hpLabel: "Sức Khỏe",
        turnLabel: "Thời Gian",
        aiTheme: {
          label: "THẾ GIỚI ĐANG HÌNH THÀNH",
          primary: "text-green-500",
          secondary: "text-green-400/60",
          accent: "from-green-600 via-emerald-500 to-green-400",
          glow: "shadow-[0_0_20px_rgba(34,197,94,0.4)]",
          scanline: "bg-green-500/50",
          iconColor: "text-green-500"
        }
      };
    case GameGenre.FREE_STYLE:
      return {
        skillLabel: "KỸ NĂNG & NĂNG LỰC",
        ranks: ["Tân Thủ", "Trung Cấp", "Cao Cấp", "Huyền Thoại"],
        statsDef: [
          { key: 'strength', label: 'Sức Mạnh', icon: '⚔️', color: 'text-neutral-400', bg: 'bg-neutral-500/5' },
          { key: 'intelligence', label: 'Trí Tuệ', icon: '🧠', color: 'text-neutral-400', bg: 'bg-neutral-500/5' },
          { key: 'agility', label: 'Nhanh Nhẹn', icon: '⚡', color: 'text-neutral-400', bg: 'bg-neutral-500/5' },
          { key: 'charisma', label: 'Quyến Rũ', icon: '✨', color: 'text-neutral-400', bg: 'bg-neutral-500/5' },
          { key: 'luck', label: 'May Mắn', icon: '🍀', color: 'text-neutral-400', bg: 'bg-neutral-500/5' },
        ] as GenreStatDef[],
        npcLabels: {
          faction: "Thế Lực", race: "Chủng Tộc", alignment: "Lập Trường",
          desire: "Ước Nguyện", background: "Tiểu Sử", stat1Icon: "⚔️", stat2Icon: "🧠", stat3Icon: "⚡"
        },
        codexLabels: {
          world: "Thế Giới", locations: "Địa Danh", history: "Lịch Sử", entities: "Vật Phẩm", npcs: "Nhân Vật"
        },
        hpLabel: "Sinh Mệnh",
        turnLabel: "Số Lượt",
        aiTheme: {
          label: "ĐANG PHÂN TÍCH THỰC TẠI...",
          primary: "text-neutral-400",
          secondary: "text-neutral-500/60",
          accent: "from-neutral-600 via-neutral-500 to-neutral-400",
          glow: "shadow-[0_0_20px_rgba(163,163,163,0.4)]",
          scanline: "bg-neutral-500/50",
          iconColor: "text-neutral-400"
        }
      };
    default:
      return {
        skillLabel: "KỸ NĂNG",
        ranks: ["Cấp 1", "Cấp 2", "Cấp 3", "Cấp 4", "Cấp 5"],
        statsDef: [
          { key: 'strength', label: 'Sức Mạnh', icon: '⚔️', color: 'text-red-500', bg: 'bg-red-500/5' },
          { key: 'intelligence', label: 'Trí Tuệ', icon: '🧠', color: 'text-blue-400', bg: 'bg-blue-400/5' },
          { key: 'agility', label: 'Nhanh Nhẹn', icon: '⚡', color: 'text-emerald-400', bg: 'bg-emerald-500/5' },
        ] as GenreStatDef[],
        npcLabels: {
          faction: "Thế Lực", race: "Chủng Tộc", alignment: "Lập Trường", desire: "Ước Nguyện", background: "Tiểu sử",
          stat1Icon: "💠", stat2Icon: "💠", stat3Icon: "💠"
        },
        codexLabels: {
          world: "Thế giới", locations: "Địa danh", history: "Biên niên sử", entities: "Kỳ trân", npcs: "Nhân vật"
        },
        hpLabel: "Sinh Mệnh",
        turnLabel: "Số Lượt",
        aiTheme: {
          label: "THỰC TẠI ĐANG KIẾN TẠO",
          primary: "text-emerald-500",
          secondary: "text-emerald-400/60",
          accent: "from-emerald-600 via-cyan-500 to-emerald-400",
          glow: "shadow-[0_0_20px_rgba(16,185,129,0.4)]",
          scanline: "bg-emerald-500/50",
          iconColor: "text-emerald-500"
        }
      };
  }
};

export interface WorldData {
  player: Player;
  world: {
    worldName: string;
    genre: GameGenre;
    era: string;
    time: string;
    description: string;
    rules: string[];
    initialScenario?: string;
  };
  config: {
    difficulty: string;
    narrativePerspective: string;
    [key: string]: any;
  };
  entities: {
    npcs: any[];
    locations: any[];
    items: any[];
  };
  gameTime: GameTime;
  memoryState?: MemoryState;
  savedState: {
    history: any[];
    turnCount: number;
  };
  id?: string;
  createdAt?: number;
  updatedAt?: number;
}
