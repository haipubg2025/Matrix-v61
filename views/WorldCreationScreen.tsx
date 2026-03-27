
import React, { useReducer, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Globe, Settings, Users, Sparkles, ArrowLeft, Play, Plus, Trash2, Clock, Download, Upload } from 'lucide-react';
import { Player, WorldData, GameGenre, AppSettings, GameTime, NarrativePerspective } from '../types';
import { gameAI as worldAiService } from '../services/geminiService';
import { dbService } from '../services/dbService';
import { compressionService } from '../services/compressionService';
import { useToast } from '../hooks/useToast';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 1. Luồng hoạt động chính: WorldCreationScreen component
// Quản lý trạng thái thông qua useReducer (worldCreationReducer)

interface WorldCreationState {
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
    difficulty: 'easy' | 'medium' | 'hard' | 'hell' | 'asian';
    narrativePerspective: NarrativePerspective;
  };
  entities: {
    npcs: any[];
    locations: any[];
    items: any[];
  };
  gameTime: GameTime;
  isGenerating: boolean;
}

type WorldCreationAction = 
  | { type: 'SET_GENERATING', isGenerating: boolean }
  | { type: 'AUTO_FILL_ALL', payload: any }
  | { type: 'UPDATE_PLAYER', payload: Partial<Player> }
  | { type: 'UPDATE_WORLD', payload: Partial<WorldCreationState['world']> }
  | { type: 'UPDATE_GAMETIME', payload: Partial<GameTime> }
  | { type: 'UPDATE_CONFIG', payload: Partial<WorldCreationState['config']> }
  | { type: 'UPDATE_ENTITIES', payload: Partial<WorldCreationState['entities']> }
  | { type: 'ADD_RULE', payload: string }
  | { type: 'REMOVE_RULE', payload: number }
  | { type: 'ADD_ENTITY', entityType: 'npcs' | 'locations' | 'items', payload: any }
  | { type: 'REMOVE_ENTITY', entityType: 'npcs' | 'locations' | 'items', index: number };

const worldCreationReducer = (state: WorldCreationState, action: WorldCreationAction): WorldCreationState => {
  switch (action.type) {
    case 'SET_GENERATING':
      return { ...state, isGenerating: action.isGenerating };
    case 'AUTO_FILL_ALL':
      const payload = action.payload || {};
      return {
        ...state,
        world: { 
          ...state.world, 
          ...(payload.world || {}),
          initialScenario: payload.initialScenario || payload.world?.initialScenario || state.world.initialScenario || ''
        },
        player: { ...state.player, ...(payload.player || {}) },
        entities: { 
          npcs: payload.entities?.npcs || [],
          locations: payload.entities?.locations || [],
          items: payload.entities?.items || []
        },
        gameTime: { ...state.gameTime, ...(payload.gameTime || payload.initialGameTime || {}) }
      };
    case 'UPDATE_PLAYER':
      return { ...state, player: { ...state.player, ...action.payload } };
    case 'UPDATE_WORLD':
      return { ...state, world: { ...state.world, ...action.payload } };
    case 'UPDATE_GAMETIME':
      return { ...state, gameTime: { ...state.gameTime, ...action.payload } };
    case 'UPDATE_CONFIG':
      return { ...state, config: { ...state.config, ...action.payload } };
    case 'UPDATE_ENTITIES':
      return { ...state, entities: { ...state.entities, ...action.payload } };
    case 'ADD_RULE':
      return { ...state, world: { ...state.world, rules: [...state.world.rules, action.payload] } };
    case 'REMOVE_RULE':
      return { ...state, world: { ...state.world, rules: state.world.rules.filter((_, i) => i !== action.payload) } };
    case 'ADD_ENTITY':
      return { 
        ...state, 
        entities: { 
          ...state.entities, 
          [action.entityType]: [...state.entities[action.entityType], action.payload] 
        } 
      };
    case 'REMOVE_ENTITY':
      return { 
        ...state, 
        entities: { 
          ...state.entities, 
          [action.entityType]: state.entities[action.entityType].filter((_, i) => i !== action.index) 
        } 
      };
    default:
      return state;
  }
};

interface Props {
  onBack: () => void;
  onGameStart?: (worldData: WorldData) => void;
  settings: AppSettings;
  initialPlayer: Player;
}

// C. Giao diện các Tab thiết lập
const TABS = [
  { id: 0, label: "Nhân vật", icon: User },
  { id: 1, label: "Thế giới", icon: Globe },
  { id: 2, label: "Quy tắc", icon: Settings },
  { id: 3, label: "Thực thể", icon: Users },
];

export const WorldCreationScreen: React.FC<Props> = ({ onBack, onGameStart, settings, initialPlayer }) => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState(0);
  const [conceptInput, setConceptInput] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const [state, dispatch] = useReducer(worldCreationReducer, {
    player: initialPlayer,
    world: {
      worldName: '',
      genre: GameGenre.FREE_STYLE,
      era: 'Hiện đại',
      time: 'Khởi đầu',
      description: '',
      rules: [],
      initialScenario: ''
    },
    config: {
      difficulty: settings.difficulty || 'medium',
      narrativePerspective: settings.narrativePerspective || NarrativePerspective.FIRST_PERSON
    },
    entities: {
      npcs: [],
      locations: [],
      items: []
    },
    gameTime: {
      year: 2024,
      month: 1,
      day: 1,
      hour: 8,
      minute: 0
    },
    isGenerating: false
  });

  // A. Chức năng AI Khởi tạo nhanh (handleAutoFillAll)
  const handleAutoFillAll = async () => {
    dispatch({ type: 'SET_GENERATING', isGenerating: true });
    try {
      const existingData = {
        player: state.player,
        world: state.world,
        entities: state.entities,
        gameTime: state.gameTime
      };
      // Gọi service AI để tạo toàn bộ dữ liệu thế giới, truyền thêm state hiện tại để AI điền nốt chỗ trống
      const data = await worldAiService.generateFullWorld(conceptInput, settings.aiModel, settings || undefined, existingData);
      // Cập nhật toàn bộ state của thế giới với dữ liệu AI vừa tạo
      dispatch({ type: 'AUTO_FILL_ALL', payload: data });
      addToast("AI đã hoàn tất kiến tạo thực tại!", "success");
    } catch (err) {
      console.error("AI Generation failed", err);
      addToast("AI gặp lỗi khi kiến tạo, vui lòng thử lại.", "error");
    } finally {
      dispatch({ type: 'SET_GENERATING', isGenerating: false });
    }
  };

  const handleExport = () => {
    const dataToExport = {
      player: state.player,
      world: state.world,
      entities: state.entities,
      gameTime: state.gameTime
    };
    // Use strongest compression (binary blob)
    const blob = compressionService.compressToBlob(dataToExport);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `world-creation-${state.world.worldName || 'untitled'}.mtx`;
    a.click();
    URL.revokeObjectURL(url);
    addToast("Đã xuất dữ liệu thành công (Nén tối đa)!", "success");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        if (!buffer) throw new Error("Tệp trống");

        let data: any = null;
        
        // Try to decompress first (it's binary)
        data = compressionService.decompressFromBuffer(buffer);
        
        // If decompression failed, maybe it's a plain JSON string
        if (!data) {
          const text = new TextDecoder().decode(buffer);
          data = JSON.parse(text);
        }

        if (data) {
          dispatch({ type: 'AUTO_FILL_ALL', payload: data });
          addToast("Đã nhập dữ liệu thành công!", "success");
        } else {
          throw new Error("Dữ liệu không hợp lệ");
        }
      } catch (err) {
        console.error("Import failed", err);
        addToast("Lỗi khi nhập dữ liệu: File không hợp lệ hoặc bị hỏng.", "error");
      }
    };
    reader.readAsArrayBuffer(file);
    // Reset input value to allow re-importing the same file
    e.target.value = '';
  };

  // B. Chức năng Bắt đầu Game (handleStartGame)
  const handleStartGame = async () => {
     console.log("WorldCreationScreen: handleStartGame called");
     if (!settings) {
       console.log("WorldCreationScreen: No settings found");
       addToast("Lỗi hệ thống: Không tìm thấy cài đặt ứng dụng.", "error");
       return;
     }

     const worldData: WorldData = {
        player: state.player,
        world: state.world,
        config: {
            ...state.config,
            difficulty: settings.difficulty,
            narrativePerspective: settings.narrativePerspective || NarrativePerspective.FIRST_PERSON,
            // ... các thiết lập khác
        },
        entities: state.entities,
        gameTime: state.gameTime,
        savedState: { history: [], turnCount: 0 }
     };
     
     console.log("WorldCreationScreen: worldData prepared", worldData);

     // Kiểm tra điều kiện tối thiểu (Tên nhân vật và Tên thế giới)
     const missingFields = [];
     if (!worldData.player.name || worldData.player.name === 'Vô Danh') missingFields.push("Tên nhân vật");
     if (!worldData.world.worldName) missingFields.push("Tên thế giới");
     if (!worldData.world.description) missingFields.push("Mô tả thế giới");
     
     // Nếu thiếu thông tin quan trọng, tự động dùng AI để điền nốt
     if (missingFields.length > 0) {
         dispatch({ type: 'SET_GENERATING', isGenerating: true });
         addToast("Đang dùng AI để hoàn thiện các thông tin còn thiếu...", "info");
         try {
             const existingData = {
                 player: state.player,
                 world: state.world,
                 entities: state.entities,
                 gameTime: state.gameTime
             };
             // Gọi service AI để tạo toàn bộ dữ liệu thế giới, truyền thêm state hiện tại để AI điền nốt chỗ trống
             const aiGeneratedData = await worldAiService.generateFullWorld(conceptInput, settings.aiModel, settings || undefined, existingData);
             
             // Cập nhật toàn bộ state của thế giới với dữ liệu AI vừa tạo để người dùng thấy
             dispatch({ type: 'AUTO_FILL_ALL', payload: aiGeneratedData });
             
             // Cập nhật worldData để bắt đầu game
             worldData.player = aiGeneratedData.player;
             worldData.world = aiGeneratedData.world;
             worldData.entities = aiGeneratedData.entities;
             worldData.gameTime = aiGeneratedData.gameTime;
             
             addToast("AI đã hoàn tất kiến tạo thực tại!", "success");
         } catch (err) {
             console.error("AI Auto-fill failed during start", err);
             addToast("AI gặp lỗi khi hoàn thiện thông tin. Vui lòng thử lại hoặc điền thủ công.", "error");
             dispatch({ type: 'SET_GENERATING', isGenerating: false });
             return;
         } finally {
             dispatch({ type: 'SET_GENERATING', isGenerating: false });
         }
     }

     try {
         console.log("WorldCreationScreen: Saving autosave...");
         // Lưu bản tự động lưu (Autosave) khởi đầu
         await dbService.saveAutosave({
             id: `auto_slot_0`,
             name: `${worldData.world.worldName} - Khởi tạo`,
             createdAt: Date.now(),
             updatedAt: Date.now(),
             data: worldData
         });
         console.log("WorldCreationScreen: Autosave success");
         
         // Chuyển hướng sang màn hình Gameplay
         if (onGameStart) {
             console.log("WorldCreationScreen: Calling onGameStart");
             onGameStart(worldData);
         } else {
             console.log("WorldCreationScreen: onGameStart prop is missing");
             addToast("Lỗi hệ thống: Không thể khởi động game.", "error");
         }
     } catch (err: unknown) {
         console.error("Autosave failed", err);
         addToast("Lỗi khi lưu dữ liệu khởi tạo. Vui lòng thử lại.", "error");
     }
  };

  const handleSuggestPlayerField = async (field: keyof Player) => {
    try {
      const userInput = state.player[field] as string;
      const suggestion = await worldAiService.suggestPlayerField(field, { player: state.player, world: state.world }, userInput, settings);
      dispatch({ type: 'UPDATE_PLAYER', payload: { [field]: suggestion } });
      addToast(`AI đã gợi ý ${field}!`, "success");
    } catch (err) {
      console.error("AI Suggestion failed", err);
      addToast("AI gặp lỗi khi gợi ý, vui lòng thử lại.", "error");
    }
  };

  const handleSuggestWorldField = async (field: keyof WorldCreationState['world']) => {
    try {
      const userInput = state.world[field] as string;
      const suggestion = await worldAiService.suggestWorldField(field, { world: state.world }, userInput, settings);
      dispatch({ type: 'UPDATE_WORLD', payload: { [field]: suggestion } });
      addToast(`AI đã gợi ý ${field}!`, "success");
    } catch (err) {
      console.error("AI Suggestion failed", err);
      addToast("AI gặp lỗi khi gợi ý, vui lòng thử lại.", "error");
    }
  };

  const handleSuggestGameTime = async () => {
    try {
      const suggestion = await worldAiService.suggestGameTime(state.world.genre, state.world.era, settings);
      dispatch({ type: 'UPDATE_GAMETIME', payload: suggestion });
      addToast("AI đã gợi ý thời gian!", "success");
    } catch (err) {
      console.error("AI Suggestion failed", err);
      addToast("AI gặp lỗi khi gợi ý, vui lòng thử lại.", "error");
    }
  };

  const handleSuggestEntityField = async (entityType: 'npcs' | 'locations' | 'items', index: number, field: string) => {
    try {
      const entity = state.entities[entityType][index];
      const userInput = entity[field] as string;
      const suggestion = await worldAiService.suggestEntityField(field, { entity, world: state.world }, userInput, settings);
      
      const updatedEntity = { ...entity, [field]: suggestion };
      const updatedList = [...state.entities[entityType]];
      updatedList[index] = updatedEntity;
      
      dispatch({ 
        type: 'UPDATE_ENTITIES',
        payload: { [entityType]: updatedList }
      });
      addToast(`AI đã gợi ý ${field}!`, "success");
    } catch (err) {
      console.error("AI Suggestion failed", err);
      addToast("AI gặp lỗi khi gợi ý, vui lòng thử lại.", "error");
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 0: // Nhân vật
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Tên & Tuổi */}
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] mono text-neutral-500 uppercase font-black flex items-center gap-2">
                  <User size={12} className="text-emerald-500" />
                  Tên Nhân Vật
                </label>
                <div className="relative group">
                  <input 
                    type="text" 
                    value={state.player.name}
                    onChange={e => dispatch({ type: 'UPDATE_PLAYER', payload: { name: e.target.value } })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500/50 outline-none transition-all"
                    placeholder="Nhập tên..."
                  />
                  <button 
                    onClick={() => handleSuggestPlayerField('name')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-neutral-500 hover:text-emerald-500 transition-colors"
                    title="Gợi ý AI"
                  >
                    <Sparkles size={16} />
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] mono text-neutral-500 uppercase font-black">Tuổi</label>
                <input 
                  type="number" 
                  value={state.player.age}
                  onChange={e => dispatch({ type: 'UPDATE_PLAYER', payload: { age: parseInt(e.target.value) || 0 } })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500/50 outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tính cách & Ngoại hình */}
              <div className="space-y-2">
                <label className="text-[10px] mono text-neutral-500 uppercase font-black flex items-center justify-between">
                  <span>Tính Cách</span>
                  <button onClick={() => handleSuggestPlayerField('personality')} className="text-emerald-500 hover:text-emerald-400 flex items-center gap-1 lowercase font-normal">
                    <Sparkles size={10} /> gợi ý
                  </button>
                </label>
                <input 
                  type="text" 
                  value={state.player.personality}
                  onChange={e => dispatch({ type: 'UPDATE_PLAYER', payload: { personality: e.target.value } })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500/50 outline-none transition-all"
                  placeholder="Dũng cảm, trầm mặc..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] mono text-neutral-500 uppercase font-black flex items-center justify-between">
                  <span>Ngoại Hình</span>
                  <button onClick={() => handleSuggestPlayerField('appearance')} className="text-emerald-500 hover:text-emerald-400 flex items-center gap-1 lowercase font-normal">
                    <Sparkles size={10} /> gợi ý
                  </button>
                </label>
                <input 
                  type="text" 
                  value={state.player.appearance || ''}
                  onChange={e => dispatch({ type: 'UPDATE_PLAYER', payload: { appearance: e.target.value } })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500/50 outline-none transition-all"
                  placeholder="Cao lớn, tóc đen..."
                />
              </div>
            </div>

            {/* Kỹ năng & Mục tiêu */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] mono text-neutral-500 uppercase font-black flex items-center justify-between">
                  <span>Kỹ Năng Sở Trường</span>
                  <button onClick={() => handleSuggestPlayerField('skillsSummary')} className="text-emerald-500 hover:text-emerald-400 flex items-center gap-1 lowercase font-normal">
                    <Sparkles size={10} /> gợi ý
                  </button>
                </label>
                <input 
                  type="text" 
                  value={state.player.skillsSummary || ''}
                  onChange={e => dispatch({ type: 'UPDATE_PLAYER', payload: { skillsSummary: e.target.value } })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500/50 outline-none transition-all"
                  placeholder="Kiếm thuật, ma pháp..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] mono text-neutral-500 uppercase font-black flex items-center justify-between">
                  <span>Mục Tiêu</span>
                  <button onClick={() => handleSuggestPlayerField('goals')} className="text-emerald-500 hover:text-emerald-400 flex items-center gap-1 lowercase font-normal">
                    <Sparkles size={10} /> gợi ý
                  </button>
                </label>
                <input 
                  type="text" 
                  value={state.player.goals || ''}
                  onChange={e => dispatch({ type: 'UPDATE_PLAYER', payload: { goals: e.target.value } })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500/50 outline-none transition-all"
                  placeholder="Trở thành anh hùng, tìm lại gia đình..."
                />
              </div>
            </div>

            {/* Tiểu sử */}
            <div className="space-y-2">
              <label className="text-[10px] mono text-neutral-500 uppercase font-black flex items-center justify-between">
                <span>Tiểu Sử</span>
                <button onClick={() => handleSuggestPlayerField('background')} className="text-emerald-500 hover:text-emerald-400 flex items-center gap-1 lowercase font-normal">
                  <Sparkles size={10} /> gợi ý
                </button>
              </label>
              <textarea 
                value={state.player.background}
                onChange={e => dispatch({ type: 'UPDATE_PLAYER', payload: { background: e.target.value } })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500/50 outline-none transition-all h-32 resize-none"
                placeholder="Kể về quá khứ của nhân vật..."
              />
            </div>
          </motion.div>
        );
      case 1: // Thế giới
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Tên thế giới & Thể loại */}
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] mono text-neutral-500 uppercase font-black">Tên Thế Giới</label>
                <input 
                  type="text" 
                  value={state.world.worldName}
                  onChange={e => dispatch({ type: 'UPDATE_WORLD', payload: { worldName: e.target.value } })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500/50 outline-none transition-all"
                  placeholder="Ví dụ: Đại Lục Huyền Bí, Thành Phố Ngầm..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] mono text-neutral-500 uppercase font-black">Thể Loại</label>
                <div className="space-y-2">
                  <select 
                    value={state.world.genre}
                    onChange={e => dispatch({ type: 'UPDATE_WORLD', payload: { genre: e.target.value as GameGenre } })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500/50 outline-none transition-all"
                  >
                    {Object.values(GameGenre).map(g => (
                      <option key={g} value={g} className="bg-neutral-900">{g}</option>
                    ))}
                  </select>
                  <input 
                    type="text" 
                    value={state.world.era}
                    onChange={e => dispatch({ type: 'UPDATE_WORLD', payload: { era: e.target.value } })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:border-emerald-500/50 outline-none transition-all"
                    placeholder="Tùy chọn bối cảnh (VD: Cyberpunk, Tiên Hiệp...)"
                  />
                </div>
              </div>
            </div>

            {/* Bối cảnh & Lịch sử */}
            <div className="space-y-2">
              <label className="text-[10px] mono text-neutral-500 uppercase font-black flex items-center justify-between">
                <span>Bối Cảnh & Lịch Sử</span>
                <button onClick={() => handleSuggestWorldField('description')} className="text-emerald-500 hover:text-emerald-400 flex items-center gap-1 lowercase font-normal">
                  <Sparkles size={10} /> AI Gợi ý
                </button>
              </label>
              <textarea 
                value={state.world.description}
                onChange={e => dispatch({ type: 'UPDATE_WORLD', payload: { description: e.target.value } })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500/50 outline-none transition-all h-40 resize-none"
                placeholder="Mô tả xã hội (phong kiến, hiện đại...), công nghệ (hơi nước, AI...), hệ thống phép thuật (tu tiên, ma pháp...), lịch sử hình thành..."
              />
            </div>

            {/* Thời gian khởi đầu */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-500">
                  <Clock size={16} />
                  <span className="text-xs font-black uppercase tracking-widest">Thời gian khởi đầu</span>
                </div>
                <button onClick={handleSuggestGameTime} className="text-emerald-500 hover:text-emerald-400 flex items-center gap-1 lowercase font-normal text-[10px]">
                  <Sparkles size={10} /> AI Gợi ý
                </button>
              </div>
              
              <div className="grid grid-cols-5 gap-4">
                {[
                  { label: 'NĂM', key: 'year' },
                  { label: 'THÁNG', key: 'month' },
                  { label: 'NGÀY', key: 'day' },
                  { label: 'GIỜ', key: 'hour' },
                  { label: 'PHÚT', key: 'minute' }
                ].map(field => (
                  <div key={field.key} className="space-y-2">
                    <label className="block text-center text-[8px] mono text-neutral-500 uppercase font-black">{field.label}</label>
                    <input 
                      type="number" 
                      value={state.gameTime[field.key as keyof GameTime]}
                      onChange={e => dispatch({ type: 'UPDATE_GAMETIME', payload: { [field.key]: parseInt(e.target.value) || 0 } })}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-2 text-center text-white text-sm focus:border-emerald-500/50 outline-none transition-all"
                    />
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-neutral-500 italic">* Bạn có thể tự nhập mốc thời gian tùy ý (VD: Năm 2024 hoặc Năm 1).</p>
            </div>

            {/* Kịch bản khởi đầu */}
            <div className="space-y-2">
              <label className="text-[10px] mono text-neutral-500 uppercase font-black flex items-center justify-between">
                <span>Kịch Bản Khởi Đầu (Tùy chọn)</span>
                <button onClick={() => handleSuggestWorldField('initialScenario')} className="text-emerald-500 hover:text-emerald-400 flex items-center gap-1 lowercase font-normal">
                  <Sparkles size={10} /> AI Gợi ý
                </button>
              </label>
              <textarea 
                value={state.world.initialScenario || ''}
                onChange={e => dispatch({ type: 'UPDATE_WORLD', payload: { initialScenario: e.target.value } })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500/50 outline-none transition-all h-32 resize-none"
                placeholder="Nhập hành động hoặc tình huống bắt đầu cụ thể. VD: Tôi tỉnh dậy trong một nhà tù cháy rực, tay bị xích..."
              />
            </div>
          </motion.div>
        );
      case 2: // Quy tắc
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              {state.world.rules.map((rule, index) => (
                <div key={index} className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-xl group">
                  <span className="text-emerald-500 font-black mono text-xs">{index + 1}.</span>
                  <p className="flex-grow text-sm text-neutral-300">{rule}</p>
                  <button 
                    onClick={() => dispatch({ type: 'REMOVE_RULE', payload: index })}
                    className="text-neutral-600 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input 
                  type="text" 
                  id="new-rule"
                  placeholder="Thêm quy tắc mới..."
                  className="flex-grow bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500/50 outline-none transition-all"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const input = e.currentTarget;
                      if (input.value.trim()) {
                        dispatch({ type: 'ADD_RULE', payload: input.value });
                        input.value = '';
                      }
                    }
                  }}
                />
                <button 
                  onClick={() => {
                    const input = document.getElementById('new-rule') as HTMLInputElement;
                    if (input.value.trim()) {
                      dispatch({ type: 'ADD_RULE', payload: input.value });
                      input.value = '';
                    }
                  }}
                  className="px-6 bg-emerald-500 text-black font-black uppercase text-xs rounded-xl hover:bg-emerald-400 transition-all"
                >
                  Thêm
                </button>
              </div>
            </div>
          </motion.div>
        );
      case 3: // Thực thể
        return (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* NPCs */}
              <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-emerald-500 italic">NPCs</h4>
                  <span className="text-[10px] mono text-neutral-500">{state.entities.npcs.length}</span>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                  {state.entities.npcs.map((npc, i) => (
                    <div key={i} className="flex items-center justify-between group p-2 hover:bg-white/5 rounded-lg transition-all">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-neutral-400 font-bold">{npc.name || npc}</span>
                        {npc.personality && <span className="text-[8px] text-neutral-600 italic">{npc.personality}</span>}
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => handleSuggestEntityField('npcs', i, 'personality')}
                          className="text-neutral-600 hover:text-emerald-500"
                          title="Gợi ý tính cách"
                        >
                          <Sparkles size={10} />
                        </button>
                        <button 
                          onClick={() => dispatch({ type: 'REMOVE_ENTITY', entityType: 'npcs', index: i })}
                          className="text-neutral-600 hover:text-rose-500"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {state.entities.npcs.length === 0 && <div className="text-[10px] text-neutral-600 italic">Chưa có NPC</div>}
                </div>
                <button 
                  onClick={() => {
                    const name = prompt("Nhập tên NPC:");
                    if (name) dispatch({ type: 'ADD_ENTITY', entityType: 'npcs', payload: { name } });
                  }}
                  className="w-full py-2 border border-dashed border-white/10 rounded-lg text-[10px] text-neutral-500 hover:border-emerald-500/50 hover:text-emerald-500 transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={10} /> Thêm NPC
                </button>
              </div>

              {/* Locations */}
              <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-blue-500 italic">Địa Danh</h4>
                  <span className="text-[10px] mono text-neutral-500">{state.entities.locations.length}</span>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                  {state.entities.locations.map((loc, i) => (
                    <div key={i} className="flex items-center justify-between group p-2 hover:bg-white/5 rounded-lg transition-all">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-neutral-400 font-bold">{loc.name || loc}</span>
                        {loc.description && <span className="text-[8px] text-neutral-600 italic">{loc.description}</span>}
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => handleSuggestEntityField('locations', i, 'description')}
                          className="text-neutral-600 hover:text-blue-500"
                          title="Gợi ý mô tả"
                        >
                          <Sparkles size={10} />
                        </button>
                        <button 
                          onClick={() => dispatch({ type: 'REMOVE_ENTITY', entityType: 'locations', index: i })}
                          className="text-neutral-600 hover:text-rose-500"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {state.entities.locations.length === 0 && <div className="text-[10px] text-neutral-600 italic">Chưa có địa danh</div>}
                </div>
                <button 
                   onClick={() => {
                    const name = prompt("Nhập tên địa danh:");
                    if (name) dispatch({ type: 'ADD_ENTITY', entityType: 'locations', payload: { name } });
                  }}
                  className="w-full py-2 border border-dashed border-white/10 rounded-lg text-[10px] text-neutral-500 hover:border-blue-500/50 hover:text-blue-500 transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={10} /> Thêm Địa Danh
                </button>
              </div>

              {/* Items */}
              <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-amber-500 italic">Vật Phẩm</h4>
                  <span className="text-[10px] mono text-neutral-500">{state.entities.items.length}</span>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                  {state.entities.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between group p-2 hover:bg-white/5 rounded-lg transition-all">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-neutral-400 font-bold">{item.name || item}</span>
                        {item.description && <span className="text-[8px] text-neutral-600 italic">{item.description}</span>}
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => handleSuggestEntityField('items', i, 'description')}
                          className="text-neutral-600 hover:text-amber-500"
                          title="Gợi ý mô tả"
                        >
                          <Sparkles size={10} />
                        </button>
                        <button 
                          onClick={() => dispatch({ type: 'REMOVE_ENTITY', entityType: 'items', index: i })}
                          className="text-neutral-600 hover:text-rose-500"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {state.entities.items.length === 0 && <div className="text-[10px] text-neutral-600 italic">Chưa có vật phẩm</div>}
                </div>
                <button 
                   onClick={() => {
                    const name = prompt("Nhập tên vật phẩm:");
                    if (name) dispatch({ type: 'ADD_ENTITY', entityType: 'items', payload: { name } });
                  }}
                  className="w-full py-2 border border-dashed border-white/10 rounded-lg text-[10px] text-neutral-500 hover:border-amber-500/50 hover:text-amber-500 transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={10} /> Thêm Vật Phẩm
                </button>
              </div>
            </div>
            <p className="text-[10px] text-neutral-500 text-center italic">Sử dụng AI Khởi Tạo Nhanh để tự động tạo danh sách thực thể dựa trên ý tưởng của bạn.</p>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#050505] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/40 backdrop-blur-md">
        <button onClick={onBack} className="text-neutral-500 hover:text-white transition-colors flex items-center gap-2 uppercase mono text-[10px] font-black">
          <ArrowLeft size={14} /> Quay Lại
        </button>
        <h2 className="text-lg md:text-xl font-black text-white uppercase tracking-tighter italic">Kiến Tạo <span className="text-emerald-500">Thực Tại</span></h2>
        <div className="flex items-center gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImport} 
            accept=".json,.mtx" 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-neutral-500 hover:text-white transition-all flex items-center gap-2 uppercase mono text-[10px] font-black border border-white/10 rounded-full hover:bg-white/5"
            title="Nhập dữ liệu"
          >
            <Upload size={14} /> <span className="hidden md:inline">NHẬP</span>
          </button>
          <button 
            onClick={handleExport}
            className="p-2 text-neutral-500 hover:text-white transition-all flex items-center gap-2 uppercase mono text-[10px] font-black border border-white/10 rounded-full hover:bg-white/5"
            title="Xuất dữ liệu"
          >
            <Download size={14} /> <span className="hidden md:inline">XUẤT</span>
          </button>
          <button 
            onClick={handleStartGame}
            disabled={state.isGenerating}
            className={cn(
              "px-4 md:px-8 py-2 font-black uppercase text-[10px] md:text-xs rounded-full transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] flex items-center gap-2",
              state.isGenerating 
                ? "bg-neutral-800 text-neutral-500 cursor-not-allowed" 
                : "bg-emerald-500 text-black hover:bg-emerald-400"
            )}
          >
            {state.isGenerating ? (
              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <Play size={12} fill="currentColor" className="md:w-3.5 md:h-3.5" />
            )}
            BẮT ĐẦU GAME
          </button>
        </div>
      </div>

      {/* AI Concept Input */}
      <div className="p-4 bg-white/5 border-b border-white/10">
        <div className="w-full flex flex-col md:flex-row gap-3 md:gap-4">
          <div className="flex-grow relative">
            <input 
              type="text" 
              value={conceptInput}
              onChange={e => setConceptInput(e.target.value)}
              placeholder="Nhập ý tưởng sơ khai cho thế giới của bạn..."
              className="w-full bg-black/40 border border-white/10 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4 text-sm text-white focus:border-emerald-500/50 outline-none transition-all md:pr-32"
            />
            <div className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 items-center gap-2 pointer-events-none">
              <span className="text-[10px] mono text-neutral-600 uppercase font-black">Concept Mode</span>
            </div>
          </div>
          <button 
            onClick={handleAutoFillAll}
            disabled={state.isGenerating}
            className={cn(
              "px-6 md:px-8 py-3 md:py-0 rounded-xl md:rounded-2xl font-black uppercase text-[10px] md:text-xs flex items-center justify-center gap-2 transition-all",
              state.isGenerating 
                ? "bg-neutral-800 text-neutral-500 cursor-not-allowed" 
                : "bg-blue-600 text-white hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.3)]"
            )}
          >
            {state.isGenerating ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <Sparkles size={14} className="md:w-4 md:h-4" />
            )}
            AI Khởi Tạo Nhanh
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-black/20 border-b border-white/5">
        <div className="w-full flex">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 py-3 md:py-4 flex flex-col items-center gap-1 md:gap-2 transition-all relative group",
                activeTab === tab.id ? "text-emerald-500" : "text-neutral-500 hover:text-neutral-300"
              )}
            >
              <tab.icon size={16} className="md:w-[18px] md:h-[18px]" />
              <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow overflow-y-auto p-4 md:p-6 custom-scrollbar">
        <div className="w-full">
          <AnimatePresence mode="wait">
            {renderTabContent()}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
