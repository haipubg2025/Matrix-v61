
import React, { useMemo, useState } from 'react';
import { Player, GameLog, Relationship, getGenreMeta, GameGenre, getAffinityLabel, AppSettings } from '../types';
import { Users } from 'lucide-react';
import { Terminal } from '../components/Terminal';
import { ResolvedImage } from '../components/ResolvedImage';
import { renderSafeText } from '../components/NpcProfileBase';
import { DiagnosticPanel } from '../components/DiagnosticPanel';
import { MobilePlayingView } from './MobilePlayingView';

interface Props {
  player: Player;
  genre?: GameGenre;
  logs: GameLog[];
  isLoading: boolean;
  handleCommand: (cmd: string, timeCost?: number) => void;
  onOpenAiHint: () => void;
  onRetry: () => void;
  openNpcProfile: (npc: Relationship) => void;
  settings: AppSettings;
  gameTime: string;
  currentLocation?: string;
  isSaving: boolean;
  isBackupSaving?: boolean;
  modals: any;
  setModals: (m: any) => void;
  handleBack: () => void;
  handleExit: () => void;
  onManualSave: () => void;
  onRegenerateImage?: (logIndex: number) => Promise<void>;
  onUpdateLog: (index: number, newContent: string) => void;
  lastAction: { command: string, timeCost?: number } | null;
  selectedWorld: any;
  onUpdateSettings: (s: Partial<AppSettings>) => void;
  activeNpcProfile: Relationship | null;
  setActiveNpcProfile: (n: Relationship | null) => void;
  view: string;
  diagnosticsOpen: boolean;
  setDiagnosticsOpen: (o: boolean) => void;
}

export const PlayingView: React.FC<Props> = (props) => {
  const { player, genre, logs, isLoading, handleCommand, onOpenAiHint, onRetry, openNpcProfile, settings, lastAction, onUpdateLog } = props;

  if (settings.mobileMode) {
    return (
      <MobilePlayingView 
        {...props}
        onRegenerateImage={props.onRegenerateImage}
        onCommand={handleCommand}
        handleExit={props.handleExit}
        lastAction={lastAction}
        view={props.view}
      />
    );
  }

  const [filters, setFilters] = useState({
    presentOnly: false
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(settings.mobileMode);
  const [activeMobileTab, setActiveMobileTab] = useState<'terminal' | 'npcs'>('terminal');
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);

  const isMobile = settings.mobileMode;

  // LỌC NPC: Hiện diện hoặc có thiện cảm cao (>30)
  const sortedNpcs = useMemo(() => {
    const filtered = player.relationships.filter(n => {
      // Filter by presence if enabled
      if (filters.presentOnly && !n.isPresent) return false;

      return true;
    });

    return [...filtered].sort((a, b) => {
      // 1. Ưu tiên đang hiện diện
      if (a.isPresent !== b.isPresent) return a.isPresent ? -1 : 1;
      
      // 2. Theo độ thiện cảm (Giảm dần)
      if (a.affinity !== b.affinity) return (b.affinity || 0) - (a.affinity || 0);
      
      // 3. Theo tên
      return a.name.localeCompare(b.name);
    });
  }, [player.relationships, filters]);

  return (
    <div className={`flex-grow overflow-hidden p-1 relative ${isMobile ? 'flex flex-col' : 'grid grid-cols-1 lg:grid-cols-12 gap-1'}`}>
      {/* DIAGNOSTIC PANEL (Floating) */}
      <DiagnosticPanel 
        logs={logs} 
        isMobile={isMobile} 
        settings={settings} 
        player={player} 
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
      />
      
      {/* MOBILE TAB SWITCHER */}
      {isMobile && (
        <div className="flex border-b border-white/10 bg-[var(--bg)]/40 backdrop-blur-xl shrink-0">
          <button 
            onClick={() => setActiveMobileTab('terminal')}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${activeMobileTab === 'terminal' ? 'text-emerald-500 border-b-2 border-emerald-500 bg-emerald-500/5' : 'text-neutral-500'}`}
          >
            📟 Thực Tại
          </button>
          <button 
            onClick={() => setActiveMobileTab('npcs')}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${activeMobileTab === 'npcs' ? 'text-emerald-500 border-b-2 border-emerald-500 bg-emerald-500/5' : 'text-neutral-500'}`}
          >
            👥 Thực Thể ({sortedNpcs.length})
          </button>
        </div>
      )}

      {/* SIDEBAR: NPC & ENTITY LIST */}
      <div className={`${isMobile ? (activeMobileTab === 'npcs' ? 'flex-grow' : 'hidden') : (isSidebarCollapsed ? 'lg:col-span-1' : 'lg:col-span-3')} flex flex-col gap-1 overflow-hidden transition-all duration-300 relative`}>
        {!isMobile && (
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="absolute top-2 right-2 z-50 w-6 h-6 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-neutral-500 hover:text-white hover:bg-white/10 transition-all"
            title={isSidebarCollapsed ? "Mở rộng" : "Thu gọn"}
          >
            {isSidebarCollapsed ? '❯' : '❮'}
          </button>
        )}

        <div className={`bg-[var(--bg)]/90 border border-white/5 rounded-sm p-2 flex flex-col h-full shadow-[0_0_40px_rgba(0,0,0,0.5)] backdrop-blur-3xl relative overflow-hidden group ${isSidebarCollapsed && !isMobile ? 'items-center' : ''}`}>
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>
          
          {!isSidebarCollapsed ? (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-3 border-b border-white/10 pb-2 relative z-10">
              <h3 className="text-[16px] leading-[15px] font-bold font-mono uppercase text-emerald-500 tracking-[0.3em] flex items-center gap-2 shrink-0">
                <div className="flex items-center justify-center" style={{ fontSize: '15px' }}>
                  <Users className="w-[15px] h-[15px] text-emerald-500" />
                </div>
                Ma Trận Thực Thể
              </h3>
              
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-1 cursor-pointer group/filter">
                  <input 
                    type="checkbox" 
                    checked={filters.presentOnly} 
                    onChange={() => setFilters(f => ({...f, presentOnly: !f.presentOnly}))}
                    className="hidden"
                  />
                  <span className={`text-[7px] px-1 rounded-sm font-black border transition-all ${filters.presentOnly ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-neutral-900 border-white/5 text-neutral-600'}`}>
                    PRESENT {filters.presentOnly ? '✓' : '○'}
                  </span>
                </label>
              </div>

              <span className="text-[8px] leading-[10px] font-normal mono text-neutral-600 uppercase tracking-widest italic ml-auto shrink-0">Verified_Souls // {sortedNpcs.length}</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-8 relative z-10">
               <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></div>
               <span className="text-[8px] mono text-neutral-600 uppercase font-black tracking-widest [writing-mode:vertical-rl] rotate-180">Verified_Souls // {sortedNpcs.length}</span>
            </div>
          )}

          <div className="flex-grow overflow-y-auto custom-scrollbar pr-1 space-y-2 relative z-10">
            {sortedNpcs.length > 0 ? (
              sortedNpcs.map((npc, idx) => {
                const isPresent = npc.isPresent;
                const isNearby = !isPresent && npc.lastLocation === player.currentLocation;
                const isFar = !isPresent && npc.lastLocation !== player.currentLocation;
                
                const genderChar = npc.gender === 'Nữ' ? '♀' : '♂';
                const genderColor = npc.gender === 'Nữ' ? 'text-pink-500' : 'text-blue-500';

                // Right border logic
                const rightBorderColor = 'bg-cyan-500';
                const rightBorderShadow = 'shadow-[0_0_10px_#06b6d4]';

                return (
                  <div 
                    key={idx} 
                    onClick={() => openNpcProfile(npc)}
                    className={`group/item relative p-2.5 rounded-sm border transition-all cursor-pointer overflow-hidden ${
                      isPresent 
                      ? 'bg-emerald-500/[0.08] border-emerald-500/40 shadow-[inset_0_0_15px_rgba(16,185,129,0.05)]' 
                      : 'bg-cyan-500/[0.04] border-cyan-500/10 hover:border-cyan-500/30'
                    } ${isSidebarCollapsed ? 'flex justify-center p-1' : ''}`}
                  >
                    {/* Visual Status Indicators */}
                    {isPresent && (
                      <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></div>
                    )}
                    {isNearby && (
                      <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500/40"></div>
                    )}
                    
                    {/* Right Border for Entity Type */}
                    <div className={`absolute top-0 right-0 w-1 h-full ${rightBorderColor} ${rightBorderShadow} opacity-40 group-hover/item:opacity-100 transition-opacity`}></div>

                    <div className={`flex gap-3 items-center relative z-10 ${isSidebarCollapsed ? 'flex-col gap-1' : ''}`}>
                      {/* Avatar Wrapper */}
                      <div className="relative shrink-0">
                        <div className={`${isSidebarCollapsed ? 'w-6' : 'w-10'} aspect-[2/3] rounded-sm overflow-hidden border transition-all ${
                          isPresent ? 'border-emerald-500/50' : 'border-white/10 bg-neutral-900'
                        }`}>
                          {npc.avatar ? (
                            <ResolvedImage src={npc.avatar} alt={npc.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className={`w-full h-full flex items-center justify-center font-black opacity-20 ${isSidebarCollapsed ? 'text-[8px]' : 'text-[14px]'}`}>?</div>
                          )}
                        </div>
                      </div>

                      {/* Info Content */}
                      {!isSidebarCollapsed && (
                        <div className="flex-grow min-w-0 flex flex-col gap-0.5">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-1.5 truncate">
                              <p className={`text-[15px] leading-[17px] font-black uppercase tracking-tight truncate font-mono not-italic ${isPresent ? 'text-white' : isNearby ? 'text-neutral-200' : 'text-neutral-400'}`}>
                                {npc.name}
                              </p>
                              <div className="flex items-center gap-1 shrink-0 ml-1">
                                {isPresent ? (
                                  <span className="text-[7px] px-1 bg-emerald-500 text-black font-black rounded-sm animate-pulse">CÓ MẶT</span>
                                ) : isNearby ? (
                                  <span className="text-[7px] px-1 bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 font-black rounded-sm">Ở GẦN</span>
                                ) : (
                                  <span className="text-[7px] px-1 bg-neutral-800 text-neutral-500 font-black rounded-sm">Ở XA</span>
                                )}
                                <span className={`text-[10px] font-black ${genderColor}`}>{genderChar}</span>
                                <span className="text-[9px] font-bold text-neutral-500 mono">[{npc.age}]</span>
                              </div>
                            </div>
                            <span className={`mono text-[9px] font-black ${npc.affinity > 700 ? 'text-pink-400' : npc.affinity > 400 ? 'text-emerald-400' : 'text-neutral-600'}`}>
                              {npc.affinity}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                             <div className="flex flex-col min-w-0 w-full">
                                <div className="flex justify-between items-center gap-2">
                                  <span className="text-[8px] mono text-neutral-500 font-black uppercase truncate">
                                    {npc.powerLevel || 'Thực thể'}
                                  </span>
                                  <div className="flex items-center gap-1">
                                      <span className="text-[7px] px-1 rounded-sm font-black border bg-cyan-500/10 border-cyan-500/20 text-cyan-400">
                                        THỰC THỂ
                                      </span>
                                  </div>
                                </div>
                                
                                <div className="mt-1 border-t border-white/5 pt-1">
                                  <div className="text-[8px] mono leading-tight">
                                    <span className="inline-flex items-center gap-0.5 mr-2">
                                      <span className="opacity-50">📍</span>
                                      <span className="text-neutral-400 font-bold uppercase">{npc.lastLocation || 'Chưa rõ'}</span>
                                    </span>
                                    <span className="inline-flex items-center gap-0.5">
                                      <span className="opacity-50">⚡</span>
                                      <span className="text-emerald-500/80 font-black uppercase">{npc.status || 'Đang chờ...'}</span>
                                    </span>
                                  </div>
                                  {npc.mood && (
                                    <div className="flex items-center gap-1 mt-0.5">
                                      <span className="text-[7px] opacity-50">🎭</span>
                                      <span className="text-[7px] mono text-pink-400/70 font-black italic uppercase tracking-tighter">
                                        {npc.mood}
                                      </span>
                                    </div>
                                  )}
                                </div>
                             </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-20 text-center opacity-10">
                <span className="text-2xl italic font-black">NO_VERIFIED_ENTITIES</span>
              </div>
            )}
          </div>
          {/* PLAYER HUD REMOVED FROM HERE */}
        </div>
      </div>

      <div className={`${isMobile ? (activeMobileTab === 'terminal' ? 'flex-grow' : 'hidden') : (isSidebarCollapsed ? 'lg:col-span-11' : 'lg:col-span-9')} h-full flex flex-col overflow-hidden transition-all duration-300`}>
        <Terminal 
          logs={logs} 
          onCommand={handleCommand} 
          onOpenAiHint={onOpenAiHint}
          onRetry={onRetry}
          onRegenerateImage={props.onRegenerateImage}
          onUpdateLog={onUpdateLog}
          onToggleDiagnostics={() => setIsDiagnosticsOpen(!isDiagnosticsOpen)}
          lastAction={lastAction}
          isLoading={isLoading} 
          player={player} 
          genre={genre} 
          isMobile={isMobile}
          settings={settings}
        />
      </div>
    </div>
  );
};
