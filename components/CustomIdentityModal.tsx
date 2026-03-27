
import React, { useState, useMemo } from 'react';
import { GameArchetype, GameGenre, InitialChoice, AppSettings } from '../types';
import { ToastType } from './Toast';
import { gameAI } from '../services/geminiService';
import { GAME_ARCHETYPES } from '../constants';
import { CUSTOM_URBAN_NORMAL } from '../dataCustomUrbanNormal';
import { CUSTOM_URBAN_SUPER } from '../dataCustomUrbanSuper';
import { CUSTOM_CULTIVATION } from '../dataCustomCultivation';
import { CUSTOM_WUXIA } from '../dataCustomWuxia';
import { CUSTOM_FANTASY_HUMAN } from '../dataCustomFantasyHuman';
import { CUSTOM_FANTASY_MULTI } from '../dataCustomFantasyMulti';
import { SYSTEMS_DATA } from '../dataSystems';
import { ABILITIES_DATA } from '../dataAbilities';
import { GENRE_ABILITIES } from '../dataAbilitiesGenre';
import { MobileCustomIdentityModal } from './Mobile/MobileCustomIdentityModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  selectedWorld: GameArchetype | null;
  onSelectIdentity: (identity: string | InitialChoice, systemName?: string) => void;
  onSwitchWorld: (world: GameArchetype) => void;
  settings: AppSettings;
  onMcSetup?: () => void;
  addToast?: (message: string, type?: ToastType) => void;
}

const SPECIAL_SUGGESTIONS: Record<string, { title: string, tag: string, color: string, desc?: string }[]> = {
  [GameGenre.URBAN_NORMAL]: CUSTOM_URBAN_NORMAL,
  [GameGenre.URBAN_SUPERNATURAL]: CUSTOM_URBAN_SUPER,
  [GameGenre.CULTIVATION]: CUSTOM_CULTIVATION,
  [GameGenre.WUXIA]: CUSTOM_WUXIA,
  [GameGenre.FANTASY_HUMAN]: CUSTOM_FANTASY_HUMAN,
  [GameGenre.FANTASY_MULTIRACE]: CUSTOM_FANTASY_MULTI
};

export const CustomIdentityModal: React.FC<Props> = ({ isOpen, onClose, selectedWorld, onSelectIdentity, onSwitchWorld, settings, onMcSetup, addToast }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [customValue, setCustomValue] = useState('');
  const [activeSystem, setActiveSystem] = useState('');
  const [isGenreMenuOpen, setIsGenreMenuOpen] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [genTime, setGenTime] = useState(0);

  React.useEffect(() => {
    let interval: any;
    if (isAiGenerating) {
      setGenTime(0);
      interval = setInterval(() => {
        setGenTime(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isAiGenerating]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAiCreative = async () => {
    if (!customValue.trim() || isAiGenerating) return;
    setIsAiGenerating(true);
    const startTime = Date.now();
    try {
      const scenario = await gameAI.generateFreeStyleScenario(customValue, settings);
      if (scenario) {
        setCustomValue(scenario);
        if (addToast) {
          const duration = ((Date.now() - startTime) / 1000).toFixed(1);
          const modelInfo = settings.proxyEnabled && settings.proxyUrl && settings.proxyKey 
            ? `Proxy (${settings.proxyModel || settings.aiModel})` 
            : `API Key (${settings.aiModel})`;
          addToast(`Đã sáng tạo xong! Thời gian: ${duration}s. Model: ${modelInfo}`, 'success');
        }
      }
    } catch (error) {
      console.error("AI Creative failed:", error);
      if (addToast) addToast("Sáng tạo thất bại. Vui lòng kiểm tra cấu hình AI.", "error");
    } finally {
      setIsAiGenerating(false);
    }
  };

  const identityList = useMemo(() => (selectedWorld ? SPECIAL_SUGGESTIONS[selectedWorld.genre] || [] : []), [selectedWorld]);
  const abilityList = useMemo(() => (selectedWorld ? GENRE_ABILITIES[selectedWorld.genre] || ABILITIES_DATA : ABILITIES_DATA), [selectedWorld]);

  if (settings.mobileMode && isOpen) {
    return (
      <MobileCustomIdentityModal 
        isOpen={isOpen}
        onClose={onClose}
        selectedWorld={selectedWorld}
        onSelectIdentity={onSelectIdentity}
        onSwitchWorld={onSwitchWorld}
        onMcSetup={onMcSetup}
        settings={settings}
        addToast={addToast}
      />
    );
  }

  const systemList = SYSTEMS_DATA;

  const filterItems = (list: any[]) => list.filter(item => {
    const title = item?.title || '';
    const tag = item?.tag || '';
    const search = searchTerm || '';
    return title.toLowerCase().includes(search.toLowerCase()) ||
           (tag && tag.toLowerCase().includes(search.toLowerCase()));
  });

  if (!isOpen || !selectedWorld) return null;

  const handleAddItem = (item: any, type: 'identity' | 'system' | 'ability') => {
    const prefix = type === 'identity' ? 'Thân phận: ' : type === 'system' ? 'Sở hữu ' : 'Dị năng: ';
    
    if (type === 'system') {
      setActiveSystem(item.title);
    }

    if (!customValue.includes(item.title)) {
      setCustomValue(prev => prev + (prev.length > 0 ? ' ' : '') + prefix + item.title + '.');
    }
  };

  const clearPrompt = () => {
    setCustomValue('');
    setActiveSystem('');
  };

  const handleGenreSwitch = (world: GameArchetype) => {
    onSwitchWorld(world);
    setIsGenreMenuOpen(false);
  };

  return (
    <div className="CustomIdentityModal fixed inset-0 z-[400] bg-[#030303] flex flex-col h-screen overflow-hidden animate-in fade-in duration-300 font-sans select-none">
      {/* HEADER - CỐ ĐỊNH */}
      <div className="h-16 border-b border-white/10 bg-black/80 backdrop-blur-3xl flex items-center justify-between px-8 shrink-0 relative z-30">
        <div className="flex items-center gap-6">
          <button 
            onClick={onClose}
            className="group flex items-center gap-2 px-4 py-1.5 bg-white/5 hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400 border border-white/10 rounded-lg transition-all mono text-[10px] font-black uppercase tracking-widest"
          >
            <span>←</span>
            <span>Quay Lại</span>
          </button>
          <div className="flex flex-col">
            <h2 className="text-base font-black text-white tracking-tighter uppercase italic leading-none">
              Kiến Tạo <span className="text-emerald-500">Thực Tại Tự Do</span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <button 
              onClick={() => setIsGenreMenuOpen(!isGenreMenuOpen)}
              className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition-all duration-300 ${isGenreMenuOpen ? 'bg-emerald-500 border-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-white/5 border-white/10 text-emerald-400 hover:border-emerald-500/50'}`}
            >
              <span className="text-xs italic mono font-black uppercase tracking-widest">{selectedWorld?.genre || GameGenre.FREE_STYLE}</span>
              <span className={`text-[8px] transition-transform ${isGenreMenuOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>

            {isGenreMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-72 bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
                <div className="p-3 bg-black/40 border-b border-white/5">
                  <span className="text-[8px] mono text-neutral-600 font-black uppercase tracking-widest italic">Chuyển dịch không gian nguồn...</span>
                </div>
                <div className="max-h-80 overflow-y-auto custom-scrollbar p-2 space-y-1">
                  {GAME_ARCHETYPES.map((world) => (
                    <button
                      key={world.id}
                      onClick={() => handleGenreSwitch(world)}
                      className={`w-full text-left p-3 rounded-xl transition-all flex flex-col gap-0.5 group ${selectedWorld.id === world.id ? 'bg-emerald-500/20 border border-emerald-500/30' : 'hover:bg-white/5 border border-transparent'}`}
                    >
                      <span className={`text-[10px] font-black uppercase tracking-tight ${selectedWorld.id === world.id ? 'text-emerald-400' : 'text-neutral-400 group-hover:text-white'}`}>
                        {world.title}
                      </span>
                      <span className="text-[8px] mono text-neutral-600 font-bold uppercase">{world.genre}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-white/10"></div>

          <div className="relative w-64 group">
            <div className="absolute inset-y-0 left-3 flex items-center text-neutral-600 group-focus-within:text-emerald-500 transition-colors text-xs">🔍</div>
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Lọc dữ liệu thành phần..."
              className="w-full bg-white/5 border border-white/10 rounded-full py-1.5 pl-9 pr-4 text-[10px] text-white font-bold uppercase tracking-widest outline-none focus:border-emerald-500/50 transition-all"
            />
          </div>
        </div>
      </div>

      {/* EDITOR - CỐ ĐỊNH PHÍA TRÊN */}
      <div className="p-4 bg-black/40 border-b border-white/5 shrink-0">
        <div className="max-w-7xl mx-auto flex gap-4">
          <div className="flex-grow relative group min-w-0">
              <div className="relative bg-neutral-900/60 border border-white/10 rounded-xl focus-within:border-emerald-500/40 transition-all shadow-xl flex flex-col overflow-hidden">
              <textarea 
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                placeholder="Chọn 'Nguyên liệu' từ các danh sách bên dưới để bắt đầu kiến tạo..."
                className="w-full h-20 bg-transparent border-none outline-none p-4 text-white font-bold placeholder:text-neutral-800 text-base leading-relaxed resize-none custom-scrollbar mono"
              />
              <div className="px-3 py-1.5 bg-black/40 flex justify-between items-center border-t border-white/5">
                <div className="flex gap-3">
                  <span className="text-[8px] mono text-neutral-600 font-bold uppercase tracking-widest">Dữ liệu nạp: {customValue.length} byte</span>
                  {activeSystem && <span className="text-[8px] px-2 py-0.5 bg-yellow-500/20 text-yellow-500 rounded-sm font-black mono uppercase">Hệ Thống Đang Nạp: {activeSystem}</span>}
                  <div className="flex gap-2">
                    <button onClick={clearPrompt} className="text-[8px] font-black uppercase text-rose-500/50 hover:text-rose-500 transition-colors italic">Xóa bộ đệm</button>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-[9px] text-neutral-600 font-bold uppercase tracking-widest italic">Bỏ qua thiết lập nhân vật chính cũng được, AI sẽ dùng thiết lập mặc định của game</p>
                  <span className="text-[8px] mono text-emerald-500/30 font-black uppercase italic tracking-[0.2em]">Quantum_Sync_Ready</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-2 shrink-0">
            <button 
              onClick={handleAiCreative}
              disabled={isAiGenerating}
              className={`w-48 h-10 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2 border shadow-lg ${isAiGenerating ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-500' : 'bg-white/5 border-white/10 text-emerald-400 hover:bg-emerald-500 hover:text-black hover:border-emerald-500 active:scale-95'}`}
            >
              {isAiGenerating ? (
                <>
                  <span className="w-3 h-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></span>
                  <span>{formatTime(genTime)}</span>
                </>
              ) : (
                <>
                  <span>✨</span>
                  <span>AI Sáng Tạo</span>
                </>
              )}
            </button>

            <button 
              disabled={!customValue.trim() || isAiGenerating}
              onClick={() => {
                onSelectIdentity(customValue.trim());
              }}
              className="w-48 h-14 bg-emerald-500 text-black font-black uppercase text-xs rounded-xl hover:bg-emerald-400 transition-all shadow-[0_10px_20px_rgba(16,185,129,0.2)] disabled:opacity-10 active:scale-[0.98] flex flex-col items-center justify-center gap-1 group"
            >
              <span className="tracking-[0.1em]">KHỞI CHẠY</span>
              <span className="text-xl group-hover:translate-x-1 transition-transform">❯❯</span>
            </button>
            
            {onMcSetup && (
              <button 
                onClick={onMcSetup}
                className="w-48 h-10 bg-blue-500/10 border border-dashed border-blue-500/40 rounded-xl text-blue-500 font-black uppercase text-[10px] tracking-widest hover:bg-blue-500 hover:text-black transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <span>👤</span>
                <span>Nhân Vật Chính</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3-COLUMN SCROLLABLE AREA */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full grid grid-cols-1 md:grid-cols-3 divide-x divide-white/5">
          
          {/* CỘT 1: THÂN PHẬN */}
          <div className="flex flex-col h-full bg-blue-500/[0.01] min-h-0">
            <div className="p-3 border-b border-white/5 flex items-center justify-between bg-black/20 shrink-0">
              <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">👤 THÂN PHẬN ({selectedWorld?.genre || GameGenre.FREE_STYLE})</h3>
              <span className="px-2 py-0.5 bg-blue-500/10 rounded text-[8px] mono text-blue-400 font-bold">{filterItems(identityList).length} mục</span>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2 overscroll-contain">
              {filterItems(identityList).length > 0 ? filterItems(identityList).map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAddItem(item, 'identity')}
                  className="w-full p-4 bg-white/[0.02] border border-white/5 rounded-xl text-left hover:border-blue-500/40 hover:bg-blue-500/5 transition-all group relative overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-xs font-black uppercase group-hover:text-blue-400 transition-colors ${item.color}`}>
                      {item.title}
                    </span>
                    <span className="text-[7px] mono font-bold text-neutral-700 uppercase bg-white/5 px-1.5 py-0.5 rounded">#{item.tag}</span>
                  </div>
                  {item.desc && <p className="text-[9px] text-neutral-600 italic line-clamp-1">{item.desc}</p>}
                </button>
              )) : (
                <div className="h-full flex items-center justify-center opacity-10 grayscale">
                  <span className="mono text-[10px] font-black uppercase tracking-widest">Không có dữ liệu</span>
                </div>
              )}
            </div>
          </div>

          {/* CỘT 2: HỆ THỐNG */}
          <div className="flex flex-col h-full bg-yellow-500/[0.01] min-h-0">
            <div className="p-3 border-b border-white/5 flex items-center justify-between bg-black/20 shrink-0">
              <h3 className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.2em]">💎 HỆ THỐNG / CHEATS</h3>
              <span className="px-2 py-0.5 bg-yellow-500/10 rounded text-[8px] mono text-yellow-500 font-bold">{filterItems(systemList).length} mục</span>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2 overscroll-contain">
              {filterItems(systemList).map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAddItem(item, 'system')}
                  className={`w-full p-4 border rounded-xl text-left transition-all group ${activeSystem === item.title ? 'bg-yellow-500/10 border-yellow-500' : 'bg-white/[0.02] border-white/5 hover:border-yellow-500/40 hover:bg-yellow-500/5'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-xs font-black uppercase group-hover:text-yellow-400 transition-colors ${item.color}`}>
                      {item.title}
                    </span>
                    <span className="text-[7px] mono font-bold text-neutral-700 uppercase bg-white/5 px-1.5 py-0.5 rounded">#{item.tag}</span>
                  </div>
                  {item.desc && <p className="text-[9px] text-neutral-500 font-bold leading-tight line-clamp-2">{item.desc}</p>}
                </button>
              ))}
            </div>
          </div>

          {/* CỘT 3: DỊ NĂNG */}
          <div className="flex flex-col h-full bg-purple-500/[0.01] min-h-0">
            <div className="p-3 border-b border-white/5 flex items-center justify-between bg-black/20 shrink-0">
              <h3 className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em]">🧿 DỊ NĂNG / SIÊU CẤP</h3>
              <span className="px-2 py-0.5 bg-purple-500/10 rounded text-[8px] mono text-purple-400 font-bold">{filterItems(abilityList).length} mục</span>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2 overscroll-contain">
              {filterItems(abilityList).map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAddItem(item, 'ability')}
                  className="w-full p-4 bg-white/[0.02] border border-white/5 rounded-xl text-left hover:border-purple-500/40 hover:bg-purple-500/5 transition-all group"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-xs font-black uppercase group-hover:text-purple-400 transition-colors ${item.color}`}>
                      {item.title}
                    </span>
                    <span className="text-[7px] mono font-bold text-neutral-700 uppercase bg-white/5 px-1.5 py-0.5 rounded">#{item.tag}</span>
                  </div>
                  {item.desc && <p className="text-[9px] text-neutral-500 font-bold leading-tight line-clamp-2">{item.desc}</p>}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
