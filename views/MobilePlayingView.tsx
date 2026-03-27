
import React, { useState } from 'react';
import { MobileHeader } from '../components/Mobile/MobileHeader';
import { MobileTerminal } from '../components/Mobile/MobileTerminal';
import { Relationship, Player, GameLog, AppSettings, GameArchetype, GameGenre } from '../types';
import { NpcList } from '../components/NpcList';
import { DiagnosticPanel } from '../components/DiagnosticPanel';

interface MobilePlayingViewProps {
  player: Player;
  logs: GameLog[];
  gameTime: string;
  currentLocation?: string;
  isSaving: boolean;
  isBackupSaving?: boolean;
  modals: any;
  setModals: (m: any) => void;
  handleBack: () => void;
  handleExit: () => void;
  onManualSave: () => void;
  onCommand: (cmd: string, timeCost?: number) => void;
  onOpenAiHint: () => void;
  onRetry: () => void;
  onRegenerateImage?: (logIndex: number) => Promise<void>;
  onUpdateLog: (index: number, newContent: string) => void;
  lastAction: { command: string, timeCost?: number } | null;
  isLoading: boolean;
  activeNpcProfile: Relationship | null;
  setActiveNpcProfile: (n: Relationship | null) => void;
  selectedWorld: GameArchetype | null;
  settings: AppSettings;
  onUpdateSettings: (s: Partial<AppSettings>) => void;
  view: string;
  genre?: GameGenre;
}

export const MobilePlayingView: React.FC<MobilePlayingViewProps> = ({
  player, logs, gameTime, currentLocation, isSaving, isBackupSaving, modals, setModals,
  handleBack, handleExit, onManualSave, onCommand, onOpenAiHint, onRetry, onRegenerateImage, onUpdateLog, isLoading,
  activeNpcProfile, setActiveNpcProfile, selectedWorld, settings, onUpdateSettings,
  view, lastAction, genre
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);

  return (
    <div className="absolute inset-0 bg-[var(--bg)] flex flex-col overflow-hidden font-sans selection:bg-emerald-500 selection:text-black">
      {/* DIAGNOSTIC PANEL (Floating) */}
      <DiagnosticPanel 
        logs={logs} 
        isMobile={true} 
        settings={settings} 
        player={player} 
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
      />

      {/* MOBILE HEADER */}
      {!isSidebarOpen && (
        <MobileHeader 
          player={player}
          genre={genre || GameGenre.URBAN_NORMAL}
          gameTime={gameTime}
          currentLocation={currentLocation}
          isSaving={isSaving}
          isBackupSaving={isBackupSaving}
          modals={modals}
          setModals={setModals}
          handleBack={handleBack}
          handleExit={handleExit}
          onManualSave={onManualSave}
          isLoading={isLoading}
          settings={settings}
          onUpdateSettings={onUpdateSettings}
          view={view}
        />
      )}

      <div className="flex-grow flex overflow-hidden relative">
        {/* NPC SIDEBAR - OVERLAY ON MOBILE */}
        <div 
          className={`fixed inset-0 z-[300] transition-all duration-500 ${isSidebarOpen ? 'visible' : 'invisible'}`}
        >
          {/* Backdrop */}
          <div 
            onClick={() => setIsSidebarOpen(false)}
            className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-500 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}
          ></div>
          
          {/* Sidebar Content */}
          <div 
            className={`absolute inset-y-0 left-0 w-full bg-[var(--bg)] border-r border-white/10 shadow-[20px_0_50px_rgba(0,0,0,0.5)] transition-transform duration-500 ease-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
          >
            <div className="h-full flex flex-col">
              <div className="p-2 border-b border-white/10 flex justify-between items-center bg-emerald-500/5" style={{ paddingTop: 'calc(0.5rem + env(safe-area-inset-top))' }}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]"></div>
                  <h3 className="text-xs font-black uppercase text-emerald-500 tracking-[0.2em] italic">Ma Trận Thực Thể</h3>
                </div>
                <button 
                  onClick={() => setIsSidebarOpen(false)} 
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-neutral-400 active:scale-90 transition-all"
                >
                  ✕
                </button>
              </div>
              
              <div className="flex-grow overflow-y-auto custom-scrollbar p-1">
                <NpcList 
                  npcs={player.relationships} 
                  player={player}
                  onSelectNpc={(n) => { 
                    setActiveNpcProfile(n); 
                    setModals({...modals, npcProfile: true}); 
                    setIsSidebarOpen(false);
                  }} 
                  genre={selectedWorld?.genre}
                />
              </div>

              <div className="p-1 border-t border-white/10 bg-black/40">
                <div className="flex items-center justify-between">
                  <span className="text-[8px] mono text-neutral-600 uppercase font-black tracking-widest">Verified_Souls // {player.relationships.length}</span>
                  <div className="flex gap-1">
                    <div className="w-1 h-1 rounded-full bg-emerald-500/20"></div>
                    <div className="w-1 h-1 rounded-full bg-emerald-500/40"></div>
                    <div className="w-1 h-1 rounded-full bg-emerald-500/60"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN TERMINAL AREA */}
        <div className="flex-grow flex flex-col overflow-hidden">
          <MobileTerminal 
            logs={logs}
            onCommand={onCommand}
            onOpenAiHint={onOpenAiHint}
            onRetry={onRetry}
            onRegenerateImage={onRegenerateImage}
            onUpdateLog={onUpdateLog}
            onToggleDiagnostics={() => setIsDiagnosticsOpen(!isDiagnosticsOpen)}
            lastAction={lastAction}
            isLoading={isLoading}
            player={player}
            genre={selectedWorld?.genre}
            settings={settings}
          />
        </div>

        {/* FLOATING SIDEBAR TOGGLE */}
        {!isSidebarOpen && (
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="absolute top-1/2 -translate-y-1/2 left-0 w-6 h-16 bg-emerald-500/10 border border-l-0 border-emerald-500/30 rounded-r-xl flex items-center justify-center backdrop-blur-md z-40 shadow-[0_0_20px_rgba(16,185,129,0.1)] active:scale-90 transition-all"
          >
            <span className="text-emerald-500 text-[10px] animate-pulse">❯</span>
          </button>
        )}
      </div>
    </div>
  );
};
