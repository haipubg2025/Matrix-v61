
import React, { useCallback, useEffect, useState, useRef } from 'react';
import { GAME_ARCHETYPES } from './constants';
import { Header } from './components/Layout/Header';
import { LandingView } from './views/LandingView';
import { WorldCreationScreen } from './views/WorldCreationScreen';
import { FanficView } from './fanfic/FanficView';
import { GameCard } from './components/GameCard';
import { PlayingView } from './views/PlayingView';
import { McModal } from './components/McModal';

// Direct imports instead of lazy load
import { CustomIdentityModal } from './components/CustomIdentityModal';
// HaremModal import removed
import { CodexModal } from './components/CodexModal';
import { NpcProfileModal } from './components/NpcProfileModal';
import { SaveManagerModal } from './components/SaveManagerModal';
import { HistoryModal } from './components/HistoryModal';
import { SettingsModal } from './components/SettingsModal';
import { LibraryModal } from './components/LibraryModal';
import { MemoryModal } from './components/MemoryModal';
import { AiHintModal } from './components/AiHintModal';
import { AiCompanionModal } from './components/AiCompanionModal';

// Mobile Modals
import { MobileWorldSelect } from './components/Mobile/MobileWorldSelect';
import { MobileContextSelect } from './components/Mobile/MobileContextSelect';
import { MobileScenarioSelect } from './components/Mobile/MobileScenarioSelect';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error("App Error Boundary caught:", error, errorInfo);
  }
  render() {
    const renderErrorMessage = () => {
      const msg = this.state.error?.message || "Lỗi không xác định";
      return <div className="text-rose-400/70 break-all">{msg}</div>;
    };

    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen bg-[#050505] flex items-center justify-center p-8 text-center">
          <div className="max-w-md space-y-6">
            <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">⚠️</span>
            </div>
            <h1 className="text-2xl font-black text-rose-500 uppercase tracking-tighter italic">Hệ Thống Gặp Lỗi Nghiêm Trọng</h1>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Ma Trận AI đã gặp phải một sự cố không mong muốn trong quá trình kiến tạo thực tại.
              Dữ liệu hiện tại có thể đã bị gián đoạn.
            </p>
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-left overflow-auto max-h-32">
              <code className="text-[10px] mono">
                {renderErrorMessage()}
              </code>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-emerald-500 text-black font-black uppercase text-xs rounded-xl hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
            >
              Tái khởi động Ma Trận
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

import { useGameLogic } from './hooks/useGameLogic';
import { Relationship, GameGenre, Player } from './types';
import { gameAI } from './services/geminiService';
import { dbService } from './services/dbService';
import { FREE_STYLE_ARCHETYPE } from './constants/freeStyle';
import { ToastContainer } from './components/Toast';
import { ImportWorldModal } from './components/ImportWorldModal';

const App: React.FC = () => {
  const {
    view, setView,
    selectedWorld, setSelectedWorld,
    selectedContext, setSelectedContext,
    logs, setLogs,
    isLoading,
    isSavingStatus,
    isBackupSaving,
    gameTime, setGameTime, formatGameTime,
    modals, setModals,
    player, setPlayer,
    activeNpcProfile, setActiveNpcProfile,
    handleCommand, handleStartGame, handleBack, handleExit,
    handleStartNewGameFlow,
    handleStartFreeStyle,
    handleStartWorldCreation,
    handleStartImportedWorld,
    handleStartWorldGame,
    resetPlayer,
    handleStartFanficGame,
    handleManualSave,
    handleRetry,
    handleRetryMemory,
    handleSkipMemory,
    lastAction,
    markAsViewed,
    settings, updateSettings, loadSaveData,
    deleteNpc,
    toggleLock,
    generateAiAvatar,
    handleRegenerateImage,
    onUpdateLog,
    gallery, setGallery,
    toasts, addToast, removeToast
  } = useGameLogic();

  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);

  const [importCache, setImportCache] = useState<{
    activeTab: 'image' | 'st-card';
    image: {
      previewUrl: string | null;
      concept: string;
      importedData: any | null;
      lastFile: File | null;
    };
    stCard: {
      previewUrl: string | null;
      concept: string;
      stRawData: any | null;
      importedData: any | null;
      lastFile: File | null;
    };
  }>({
    activeTab: 'image',
    image: { previewUrl: null, concept: '', importedData: null, lastFile: null },
    stCard: { previewUrl: null, concept: '', stRawData: null, importedData: null, lastFile: null }
  });

  const [customScenario, setCustomScenario] = useState('');
  const [scenarioMode, setScenarioMode] = useState<'full' | 'short' | 'manual'>('manual');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [genTime, setGenTime] = useState(0);

  useEffect(() => {
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
    if (!customScenario.trim() || isAiGenerating) return;
    setIsAiGenerating(true);
    const startTime = Date.now();
    try {
      const scenario = await gameAI.generateFreeStyleScenario(customScenario, settings);
      if (scenario) {
        setCustomScenario(scenario);
        setScenarioMode('full');
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        const modelInfo = settings.proxyEnabled && settings.proxyUrl && settings.proxyKey 
          ? `Proxy (${settings.proxyModel || settings.aiModel})` 
          : `API Key (${settings.aiModel})`;
        addToast(`Đã tạo xong kịch bản! Thời gian: ${duration}s. Model: ${modelInfo}`, 'success');
      }
    } catch (error) {
      console.error("AI Creative failed:", error);
      addToast("Tạo kịch bản thất bại. Vui lòng kiểm tra lại cấu hình AI.", "error");
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleAiCreativeShort = async () => {
    if (!customScenario.trim() || isAiGenerating) return;
    setIsAiGenerating(true);
    const startTime = Date.now();
    try {
      const scenario = await gameAI.generateFreeStyleScenario(customScenario, settings, true);
      if (scenario) {
        setCustomScenario(scenario);
        setScenarioMode('short');
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        const modelInfo = settings.proxyEnabled && settings.proxyUrl && settings.proxyKey 
          ? `Proxy (${settings.proxyModel || settings.aiModel})` 
          : `API Key (${settings.aiModel})`;
        addToast(`Đã tạo xong kịch bản ngắn! Thời gian: ${duration}s. Model: ${modelInfo}`, 'success');
      }
    } catch (error) {
      console.error("AI Creative Short failed:", error);
      addToast("Tạo kịch bản ngắn thất bại. Vui lòng kiểm tra lại cấu hình AI.", "error");
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleAiRewrite = async () => {
    if (isAiGenerating) return;
    setIsAiGenerating(true);
    const startTime = Date.now();
    try {
      let prompt = "";
      if (customScenario.trim()) {
        if (scenarioMode === 'short') {
          prompt = `Hãy viết lại kịch bản ngắn này một cách trau chuốt và hấp dẫn hơn, nhưng phải bám sát ý tưởng ban đầu và không được sáng tạo quá xa: ${customScenario.trim()}`;
        } else if (scenarioMode === 'full') {
          prompt = `Hãy viết lại kịch bản chi tiết này một cách trau chuốt và hấp dẫn hơn, nhưng phải bám sát ý tưởng ban đầu và không được sáng tạo quá xa: ${customScenario.trim()}`;
        } else {
          prompt = `Hãy viết lại kịch bản này một cách trau chuốt và hấp dẫn hơn, bám sát ý tưởng gốc: ${customScenario.trim()}`;
        }
      } else {
        prompt = "Hãy viết một kịch bản ngẫu nhiên và hấp dẫn cho một trò chơi nhập vai.";
      }
      
      const scenario = await gameAI.generateFreeStyleScenario(prompt, settings, scenarioMode === 'short');
      if (scenario) {
        setCustomScenario(scenario);
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        const modelInfo = settings.proxyEnabled && settings.proxyUrl && settings.proxyKey 
          ? `Proxy (${settings.proxyModel || settings.aiModel})` 
          : `API Key (${settings.aiModel})`;
        addToast(`Đã viết lại kịch bản mới! Thời gian: ${duration}s. Model: ${modelInfo}`, 'success');
      }
    } catch (error) {
      console.error("AI Rewrite failed:", error);
      addToast("Viết lại kịch bản thất bại. Vui lòng kiểm tra lại cấu hình AI.", "error");
    } finally {
      setIsAiGenerating(false);
    }
  };

  const importSetupRef = useRef<HTMLInputElement>(null);

  const handleExportSetup = () => {
    const setupData = {
      player,
      customScenario,
      selectedWorldId: selectedWorld?.id,
      selectedContextId: selectedContext?.id
    };
    const dataStr = JSON.stringify(setupData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const worldName = (selectedWorld?.title || 'Game').replace(/\s+/g, '_');
    const playerName = (player.name || 'Unknown').replace(/\s+/g, '_');
    const fileName = `Matrix_${worldName}_${playerName}_Turn0.json`;

    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', fileName);
    link.click();
  };

  const handleImportSetup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.player) setPlayer(data.player);
        if (data.customScenario !== undefined) setCustomScenario(data.customScenario);
        // Success import
      } catch (err) {
        // Invalid file
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (modals.settings) {
          setModals(prev => ({ ...prev, settings: false }));
          if (view !== 'playing') {
            setView('landing');
          }
          return;
        }
        const anyModalOpen = Object.values(modals).some(v => v === true);
        if (anyModalOpen) {
          setModals(Object.keys(modals).reduce((acc, key) => ({ ...acc, [key]: false }), {} as any));
        } else if (view === 'playing' || view === 'fanfic-select') {
          handleExit();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modals, setModals, view, handleExit]);

  const openNpcProfile = useCallback((npc: Relationship) => { 
    setActiveNpcProfile(npc); 
    setModals(prev => ({ ...prev, npcProfile: true })); 
  }, [setActiveNpcProfile, setModals]);

  const handleLoadSpecificSave = async (slotId: string) => {
    const data = await dbService.load(slotId);
    if (data) {
      loadSaveData(data);
      setModals(prev => ({ ...prev, saveManager: false, history: false }));
    }
  };

  return (
    <ErrorBoundary>
      <div 
        className={`h-screen flex flex-col bg-[#050505] overflow-hidden text-neutral-200 ${!settings.effectsEnabled ? 'no-effects' : ''} ${settings.theme === 'light' ? 'theme-light' : ''}`}
        style={{ 
          '--app-font-size': `${settings.fontSize || 15}px`,
          fontSize: 'var(--app-font-size)',
        } as React.CSSProperties}
      >
      {view === 'playing' && !settings.mobileMode && (
        <Header 
          player={player}
          genre={selectedWorld?.genre || GameGenre.FREE_STYLE}
          gameTime={formatGameTime(gameTime)} 
          currentLocation={player.currentLocation}
          isSaving={isSavingStatus} 
          isBackupSaving={isBackupSaving}
          modals={modals} 
          setModals={setModals} 
          handleBack={handleBack} 
          handleExit={handleExit}
          view={view} 
          onManualSave={handleManualSave}
          onRegenerateImage={handleRegenerateImage}
          isLoading={isLoading}
          settings={settings}
          onUpdateSettings={updateSettings}
          markAsViewed={markAsViewed}
        />
      )}
      
      <main className="flex-grow flex flex-col overflow-hidden relative">
          {/* Hidden Inputs */}
      <input 
        type="file" 
        ref={importSetupRef} 
        onChange={handleImportSetup} 
        className="hidden" 
        accept=".json" 
      />

      {view === 'landing' && (
            <LandingView 
              player={player}
              gallery={gallery}
              settings={settings}
              onUpdateSettings={updateSettings}
              onStart={handleStartNewGameFlow} 
              onStartFanfic={() => { resetPlayer(); setView('fanfic-select'); }}
              onStartFreeStyle={handleStartFreeStyle}
              onStartWorldCreation={handleStartWorldCreation}
              onOpenImportWorld={() => setModals({...modals, importWorld: true})}
              onContinue={(slotId) => {
                handleLoadSpecificSave(slotId);
              }}
              onOpenSaveManager={() => setModals({...modals, saveManager: true})}
              onOpenSettings={() => setModals({...modals, settings: true})} 
            />
          )}
          
          {view === 'fanfic-select' && (
            <FanficView 
              onBack={handleBack}
              onExit={handleExit}
              onStartGame={handleStartFanficGame}
              settings={settings}
            />
          )}

          {view === 'world-creation' && (
            <WorldCreationScreen 
              onBack={handleBack}
              onGameStart={handleStartWorldGame}
              settings={settings}
              initialPlayer={player}
            />
          )}
          
          {view === 'world-select' && (
            settings.mobileMode ? (
              <MobileWorldSelect 
                archetypes={GAME_ARCHETYPES} 
                onSelect={(a) => { setSelectedWorld(a); setView('context-select'); }} 
                onBack={handleBack} 
              />
            ) : (
              <div className={`flex-grow flex flex-col items-center overflow-y-auto custom-scrollbar ${settings.mobileMode ? 'p-4 pb-20' : 'p-12 pb-24'}`}>
                <div className="absolute top-8 left-8">
                  <button 
                    onClick={handleBack}
                    className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-white font-black uppercase text-[10px] tracking-widest hover:bg-emerald-500 hover:text-black transition-all active:scale-95 flex items-center gap-2"
                  >
                    <span>❮</span> Quay Lại
                  </button>
                </div>
                <h2 className={`${settings.mobileMode ? 'text-4xl' : 'text-7xl'} font-black text-white uppercase tracking-tighter italic mb-8 md:mb-16 text-center`}>
                  Vạn Giới <span className="text-emerald-500">Hồng Trần</span>
                </h2>
                <div className={`grid gap-4 md:gap-8 w-full max-w-[120rem] ${settings.mobileMode ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3 xl:grid-cols-6'}`}>
                  {GAME_ARCHETYPES.map(a => <GameCard key={a.id} archetype={a} onSelect={() => { setSelectedWorld(a); setView('context-select'); }} />)}
                </div>
              </div>
            )
          )}

          {view === 'context-select' && selectedWorld && (
            settings.mobileMode ? (
              <MobileContextSelect 
                world={selectedWorld} 
                onSelect={(sub) => { setSelectedContext(sub); setView('scenario-select'); }} 
                onBack={handleBack} 
                onCustom={selectedWorld?.genre !== GameGenre.FREE_STYLE ? () => setModals({ ...modals, customIdentity: true }) : undefined}
              />
            ) : (
              <div className={`flex-grow flex flex-col overflow-hidden ${settings.mobileMode ? 'p-4' : 'p-12'}`}>
                <div className={`flex justify-between items-center mb-6 md:mb-12 ${settings.mobileMode ? 'flex-col gap-4' : ''}`}>
                  {!settings.mobileMode && (
                    <div className="w-48">
                      <button 
                        onClick={handleBack}
                        className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-white font-black uppercase text-[10px] tracking-widest hover:bg-emerald-500 hover:text-black transition-all active:scale-95 flex items-center gap-2"
                      >
                        <span>❮</span> Quay Lại
                      </button>
                    </div>
                  )}
                  <div className="flex flex-col items-center">
                    <h2 className={`${settings.mobileMode ? 'text-3xl' : 'text-6xl'} font-black text-white uppercase tracking-tighter text-center`}>
                      Chọn <span className="text-emerald-500">Bối Cảnh</span>
                    </h2>
                  </div>
                  <div className={`${settings.mobileMode ? 'w-full' : 'w-auto'} flex justify-end gap-3`}>
                    {selectedWorld?.genre !== GameGenre.FREE_STYLE && (
                      <button 
                        onClick={() => setModals({ ...modals, customIdentity: true })}
                        className="w-full md:w-auto px-6 py-3 bg-emerald-500/10 border border-dashed border-emerald-500/40 rounded-2xl text-emerald-500 font-black uppercase text-[10px] tracking-widest hover:bg-emerald-500 hover:text-black transition-all shadow-[0_0_20px_rgba(16,185,129,0.1)] active:scale-95 flex items-center justify-center gap-3"
                      >
                        <span className="text-lg">✨</span>
                        <span>Tùy Chọn</span>
                      </button>
                    )}
                  </div>
                </div>
                <div className={`flex-grow overflow-y-auto custom-scrollbar grid gap-4 md:gap-6 ${settings.mobileMode ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'}`}>
                  {selectedWorld.subScenarios.map(sub => (
                    <div key={sub.id} onClick={() => { setSelectedContext(sub); setView('scenario-select'); }} className="p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-white/5 bg-neutral-900/40 hover:border-emerald-500 hover:bg-emerald-500/5 transition-all cursor-pointer group shadow-xl flex flex-col min-h-[120px] md:min-h-[160px]">
                      <h3 className="text-xs md:text-sm font-black text-white group-hover:text-emerald-400 uppercase mb-2 md:mb-4">{sub.title.replace("Bối cảnh: ", "")}</h3>
                      <p className="text-neutral-500 text-[9px] md:text-[10px] font-bold leading-relaxed">{sub.description}</p>
                      <div className="mt-auto pt-4 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                         <span className="text-[9px] md:text-[10px] mono font-black text-emerald-500">TIẾP TỤC ❯</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}

          {view === 'scenario-select' && selectedContext && (
            settings.mobileMode ? (
              <MobileScenarioSelect 
                context={selectedContext} 
                onSelect={(sc) => {
                  if (typeof sc !== 'string' && sc.id === 'custom') setModals({...modals, customIdentity: true});
                  else handleStartGame(`${selectedContext.title}: ${typeof sc === 'string' ? sc : sc.label}`);
                }} 
                onBack={handleBack} 
                onMcSetup={() => setModals({ ...modals, identity: true })}
                isFreeStyle={selectedWorld?.genre === GameGenre.FREE_STYLE}
                onExport={handleExportSetup}
                onImport={() => importSetupRef.current?.click()}
                settings={settings}
                addToast={addToast}
              />
            ) : (
              <div className={`ScenarioSelect flex-grow flex flex-col overflow-hidden ${selectedWorld?.genre === GameGenre.FREE_STYLE ? 'p-0' : 'p-12'}`}>
                <div className={`${selectedWorld?.genre === GameGenre.FREE_STYLE ? 'p-8 pb-4' : ''} relative flex flex-col items-center shrink-0`}>
                  <div className="absolute top-0 left-0">
                    <button 
                      onClick={handleBack}
                      className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-white font-black uppercase text-[10px] tracking-widest hover:bg-emerald-500 hover:text-black transition-all active:scale-95 flex items-center gap-2"
                    >
                      <span>❮</span> Quay Lại
                    </button>
                  </div>
                  <div className="absolute top-0 right-0 flex gap-3">
                    <button 
                      onClick={handleExportSetup}
                      className="px-4 py-3 bg-amber-500/10 border border-dashed border-amber-500/40 rounded-2xl text-amber-500 font-black uppercase text-[10px] tracking-widest hover:bg-amber-500 hover:text-black transition-all active:scale-95 flex items-center gap-2"
                      title="Xuất dữ liệu thiết lập"
                    >
                      <span>📤</span>
                    </button>
                    <button 
                      onClick={() => importSetupRef.current?.click()}
                      className="px-4 py-3 bg-blue-500/10 border border-dashed border-blue-500/40 rounded-2xl text-blue-400 font-black uppercase text-[10px] tracking-widest hover:bg-blue-500 hover:text-black transition-all active:scale-95 flex items-center gap-2"
                      title="Nhập dữ liệu thiết lập"
                    >
                      <span>📥</span>
                    </button>
                    <button 
                      onClick={() => setModals({ ...modals, identity: true })}
                      className="px-6 py-3 bg-blue-500/10 border border-dashed border-blue-500/40 rounded-2xl text-blue-500 font-black uppercase text-[10px] tracking-widest hover:bg-blue-500 hover:text-black transition-all shadow-[0_0_20px_rgba(59,130,246,0.1)] active:scale-95 flex items-center gap-3"
                    >
                      <span className="text-lg">👤</span>
                      <span>Nhân Vật Chính</span>
                    </button>
                    {selectedWorld?.genre !== GameGenre.FREE_STYLE && (
                      <button 
                        onClick={() => setModals({ ...modals, customIdentity: true })}
                        className="px-6 py-3 bg-emerald-500/10 border border-dashed border-emerald-500/40 rounded-2xl text-emerald-500 font-black uppercase text-[10px] tracking-widest hover:bg-emerald-500 hover:text-black transition-all shadow-[0_0_20px_rgba(16,185,129,0.1)] active:scale-95 flex items-center gap-3"
                      >
                        <span className="text-lg">✨</span>
                        <span>Tùy Chọn</span>
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col items-center mb-6 md:mb-8">
                    <h2 className={`${settings.mobileMode ? 'text-3xl' : 'text-6xl'} font-black text-white uppercase tracking-tighter mb-2 md:mb-4 text-center`}>
                      {selectedWorld?.genre === GameGenre.FREE_STYLE ? 'Kiến Tạo' : 'Chọn'} <span className="text-emerald-500">{selectedWorld?.genre === GameGenre.FREE_STYLE ? 'Thực Tại' : 'Kịch Bản'}</span>
                    </h2>
                    <p className="text-neutral-500 text-center uppercase mono text-[10px] md:text-xs tracking-widest font-black italic mb-2">{selectedContext.title}</p>
                    <p className="text-[9px] text-neutral-600 font-bold uppercase tracking-widest italic">Bỏ qua thiết lập nhân vật chính cũng được, AI sẽ dùng thiết lập mặc định của game</p>
                  </div>
                </div>

                {selectedWorld?.genre === GameGenre.FREE_STYLE ? (
                  <div className="flex-grow flex gap-8 px-12 pb-12 overflow-hidden">
                    {/* Left Column: Suggestions */}
                    <div className="flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-4">
                      <div className="p-3 border-b border-white/5 flex items-center justify-between bg-black/20 shrink-0 mb-2">
                        <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Gợi ý bối cảnh</h3>
                        <span className="px-2 py-0.5 bg-emerald-500/10 rounded text-[8px] mono text-emerald-500 font-bold">{selectedContext.scenarios.length} mục</span>
                      </div>
                      {selectedContext.scenarios.map((sc: string, idx: number) => (
                        <button 
                          key={idx}
                          onClick={() => setCustomScenario(sc)}
                          className="p-4 bg-white/5 border border-white/10 rounded-xl text-left hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all group"
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-[10px] mono font-black text-emerald-500/40 group-hover:text-emerald-500 transition-colors">#{idx + 1}</span>
                            <div className="h-px flex-grow bg-white/5"></div>
                          </div>
                          <p className="text-[11px] text-neutral-400 group-hover:text-white font-bold leading-relaxed line-clamp-3">{sc}</p>
                        </button>
                      ))}
                    </div>

                    {/* Right Column: Editor */}
                    <div className="flex-1 flex flex-col gap-6 overflow-hidden">
                      <div className="relative group flex-grow">
                        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl blur opacity-25 group-focus-within:opacity-50 transition duration-1000 group-focus-within:duration-200"></div>
                        <div className="relative w-full h-full flex flex-col bg-neutral-900 border border-white/10 rounded-2xl overflow-hidden">
                          <textarea 
                            value={customScenario}
                            onChange={(e) => setCustomScenario(e.target.value)}
                            placeholder="Nhập bối cảnh thế giới của bạn tại đây... (Vd: Một thế giới nơi con người có thể điều khiển trọng lực, bạn là một thợ săn tiền thưởng đang bị truy nã gắt gao...)"
                            className="w-full flex-grow p-8 bg-transparent border-none text-white font-medium text-sm md:text-base focus:outline-none transition-all custom-scrollbar resize-none"
                          />
                          <div className="px-6 py-3 bg-black/40 flex justify-between items-center border-t border-white/5">
                            <div className="flex gap-4">
                              <button 
                                onClick={handleAiCreative} 
                                disabled={!customScenario.trim() || isAiGenerating}
                                className="text-[10px] font-black uppercase text-emerald-500 hover:text-emerald-400 active:text-emerald-300 transition-colors italic flex items-center gap-2 disabled:opacity-30"
                              >
                                {isAiGenerating ? (
                                  <>
                                    <span className="w-3 h-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></span>
                                    <span>{formatTime(genTime)}</span>
                                  </>
                                ) : (
                                  <>
                                    <span>✨</span>
                                    AI Sáng Tạo
                                  </>
                                )}
                              </button>
                              <button 
                                onClick={handleAiCreativeShort}
                                disabled={isAiGenerating || !customScenario.trim()}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-widest transition-all rounded-sm shadow-lg shadow-indigo-900/20"
                              >
                                {isAiGenerating ? (
                                  <>
                                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Đang xử lý...</span>
                                  </>
                                ) : (
                                  <>
                                    <span>✨</span>
                                    <span>AI Sáng tạo ngắn</span>
                                  </>
                                )}
                              </button>
                              <button 
                                onClick={handleAiRewrite}
                                disabled={isAiGenerating}
                                className="text-[10px] font-black uppercase text-blue-400 hover:text-blue-300 active:text-blue-200 transition-colors italic flex items-center gap-2 disabled:opacity-30"
                              >
                                <span>🔄</span>
                                Viết lại
                              </button>
                              <button onClick={() => setCustomScenario('')} className="text-[10px] font-black uppercase text-rose-500/50 hover:text-rose-500 transition-colors italic">Xóa bộ đệm</button>
                            </div>
                            <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest italic">Dữ liệu nạp: {customScenario.length} byte</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-center">
                        <button 
                          onClick={() => {
                            if (!customScenario.trim()) {
                            // Missing scenario
                              return;
                            }
                            handleStartGame(`${selectedContext.title}: ${customScenario.trim()}`);
                          }}
                          disabled={isAiGenerating}
                          className="w-full max-w-md h-16 bg-emerald-500 text-black font-black uppercase text-sm rounded-2xl hover:bg-emerald-400 transition-all shadow-[0_10px_30px_rgba(16,185,129,0.3)] active:scale-95 flex items-center justify-center gap-4 group disabled:opacity-50"
                        >
                          <span className="tracking-[0.2em]">KHỞI CHẠY THỰC TẠI</span>
                          <span className="text-2xl group-hover:translate-x-2 transition-transform">❯❯</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-grow overflow-y-auto custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 w-full max-w-[120rem] mx-auto px-2 md:px-4">
                    {selectedContext.scenarios.map((sc, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => handleStartGame(`${selectedContext.title}: ${sc}`)} 
                        className="p-4 md:p-6 rounded-xl md:rounded-2xl border border-white/5 bg-neutral-900/40 hover:border-emerald-500 hover:bg-emerald-500/5 transition-all cursor-pointer group shadow-lg flex items-center gap-4 md:gap-6 h-fit"
                      >
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-lg md:rounded-xl flex items-center justify-center text-emerald-500 font-black mono text-lg md:text-xl group-hover:bg-emerald-500 group-hover:text-black transition-all">
                          {idx + 1}
                        </div>
                        <div className="flex-grow">
                          <p className="text-neutral-200 text-xs md:text-sm font-bold leading-relaxed group-hover:text-white transition-colors">{sc}</p>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                           <span className="text-[9px] md:text-[10px] mono font-black text-emerald-500">BẮT ĐẦU ❯</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          )}
          
          {view === 'playing' && selectedWorld && (
            <PlayingView 
              player={player} 
              genre={selectedWorld?.genre || GameGenre.FREE_STYLE} 
              logs={logs} 
              isLoading={isLoading} 
              handleCommand={handleCommand} 
              onOpenAiHint={() => setModals({...modals, aiHint: true})}
              onRetry={handleRetry}
              openNpcProfile={openNpcProfile} 
              settings={settings}
              gameTime={formatGameTime(gameTime)}
              currentLocation={player.currentLocation}
              isSaving={isSavingStatus}
              isBackupSaving={isBackupSaving}
              modals={modals}
              setModals={setModals}
              handleBack={handleBack}
              handleExit={handleExit}
              onManualSave={handleManualSave}
              onRegenerateImage={handleRegenerateImage}
              onUpdateLog={onUpdateLog}
              lastAction={lastAction}
              selectedWorld={selectedWorld}
              onUpdateSettings={updateSettings}
              activeNpcProfile={activeNpcProfile}
              setActiveNpcProfile={setActiveNpcProfile}
              view={view}
              diagnosticsOpen={diagnosticsOpen}
              setDiagnosticsOpen={setDiagnosticsOpen}
            />
          )}
        </main>

      <McModal 
          player={player} 
          gallery={gallery}
          genre={selectedWorld?.genre} 
          worldTitle={selectedWorld?.title}
          isOpen={modals.identity} 
          onClose={() => setModals({...modals, identity: false})} 
          onUpdatePlayer={setPlayer} 
          onUpdateGallery={setGallery}
          settings={settings} 
          initialEditing={view !== 'playing'}
          gameTime={gameTime}
          isGameStarted={view === 'playing'}
          onToggleLock={toggleLock}
          onGenerateAvatar={generateAiAvatar}
        />

        <CustomIdentityModal 
          isOpen={modals.customIdentity}
          onClose={() => setModals({...modals, customIdentity: false})}
          selectedWorld={selectedWorld}
          onSelectIdentity={(identity) => {
            setModals({...modals, customIdentity: false});
            handleStartGame(typeof identity === 'string' ? identity : identity.label);
          }}
          onSwitchWorld={setSelectedWorld}
          settings={settings}
          onMcSetup={() => setModals({ ...modals, identity: true, customIdentity: false })}
          addToast={addToast}
        />

        {/* HaremModal removed */}


        <CodexModal 
          player={player} 
          genre={selectedWorld?.genre} 
          isOpen={modals.codex} 
          onClose={() => setModals({...modals, codex: false})} 
          settings={settings} 
          markAsViewed={markAsViewed}
          onUpdatePlayer={setPlayer}
        />

        <MemoryModal 
          isOpen={modals.memory} 
          onClose={() => setModals({...modals, memory: false})} 
          settings={settings} 
          logs={logs}
          turnCount={player.turnCount}
          addToast={addToast}
        />

        <AiHintModal isOpen={modals.aiHint} onClose={() => setModals({...modals, aiHint: false})} player={player} onUpdatePlayer={setPlayer} settings={settings} onUpdateSettings={updateSettings} />

        <AiCompanionModal 
          isOpen={modals.aiCompanion} 
          onClose={() => setModals({...modals, aiCompanion: false})} 
          player={player} 
          onUpdatePlayer={setPlayer} 
          settings={settings} 
        />

        <LibraryModal 
          gallery={gallery} 
          isOpen={modals.library} 
          onClose={() => setModals({...modals, library: false})} 
          onUpdateGallery={setGallery} 
          player={player}
          onUpdatePlayer={setPlayer}
          settings={settings} 
        />

        <NpcProfileModal 
          npc={activeNpcProfile} 
          player={player} 
          gallery={gallery}
          isOpen={modals.npcProfile} 
          genre={selectedWorld?.genre} 
          onClose={() => setModals({...modals, npcProfile: false})} 
          onUpdateNpc={(n) => { 
            setPlayer(prev => ({...prev, relationships: prev.relationships.map(r => r.id === n.id ? n : r)})); 
            setActiveNpcProfile(n); 
          }} 
          onDeleteNpc={(id) => {
            deleteNpc(id);
          }}
          onSwitchNpc={setActiveNpcProfile} 
          onUpdateGallery={setGallery}
          markAsViewed={markAsViewed}
          generateAiAvatar={generateAiAvatar}
          settings={settings}
          gameTime={gameTime}
        />

        <SaveManagerModal isOpen={modals.saveManager} onClose={() => setModals({...modals, saveManager: false})} onLoadSave={handleLoadSpecificSave} settings={settings} />

        <HistoryModal isOpen={modals.history} onClose={() => setModals({...modals, history: false})} logs={logs} onLoadSave={handleLoadSpecificSave} settings={settings} />

        <SettingsModal 
          isOpen={modals.settings} 
          view={view}
          onClose={() => {
            setModals({...modals, settings: false});
            if (view !== 'playing') {
              setView('landing');
            }
          }} 
          settings={settings} 
          onUpdateSettings={updateSettings} 
        />

        <ToastContainer toasts={toasts} onClose={removeToast} />

        {modals.importWorld && (
          <ImportWorldModal 
            onClose={() => setModals({...modals, importWorld: false})}
            onImport={handleStartImportedWorld}
            settings={settings}
            cache={importCache}
            onUpdateCache={setImportCache}
          />
        )}

        {/* Proxy Error Modal removed */}
        
        {/* Memory Sync Error Modal */}
        {modals.memorySyncError && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-md bg-[#0a0a0a] border border-amber-500/30 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.2)]">
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🧠</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-amber-500 uppercase tracking-tighter italic">Lỗi Kết Tinh Ký Ức</h3>
                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Chu kỳ kết tinh bị gián đoạn</p>
                  </div>
                </div>

                <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                  <p className="text-xs text-neutral-300 leading-relaxed italic">
                    "Ma trận không thể kết tinh các sự kiện vừa qua thành ký ức vĩnh viễn. Bạn muốn thử kết nối lại hay bỏ qua lượt này?"
                  </p>
                  <p className="text-[10px] text-amber-500/80 font-black uppercase tracking-widest mt-3 flex items-center gap-2">
                    <span>⚠️</span>
                    <span>Gợi ý: Thêm key Api cá nhân để ổn định kết nối</span>
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={handleRetryMemory}
                    className="w-full py-3 bg-amber-500 text-black font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-amber-400 transition-all"
                  >
                    Thử lại ngay
                  </button>
                  <button
                    onClick={handleSkipMemory}
                    className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all"
                  >
                    Bỏ qua (Tiếp tục chơi)
                  </button>
                </div>

                <p className="text-[9px] text-neutral-600 text-center mono uppercase tracking-widest">
                  Lưu ý: Nếu bỏ qua, các sự kiện vừa rồi có thể không được AI ghi nhớ sâu sắc.
                </p>
              </div>
            </div>
          </div>
        )}
    </div>
    </ErrorBoundary>
  );
};

export default App;
