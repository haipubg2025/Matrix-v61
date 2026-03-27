
import React, { useState } from 'react';
import { Player, AppSettings, getGenreMeta, GameGenre } from '../../types';
import { Maximize, Minimize, Menu, X as CloseIcon, RefreshCw } from 'lucide-react';
import { DEFAULT_AVATAR } from '../../constants';

interface MobileHeaderProps {
  player: Player;
  genre: GameGenre;
  gameTime: string;
  currentLocation?: string;
  isSaving: boolean;
  isBackupSaving?: boolean;
  modals: any;
  setModals: (m: any) => void;
  handleBack: () => void;
  handleExit: () => void;
  onManualSave: () => void;
  isLoading?: boolean;
  settings: AppSettings;
  onUpdateSettings: (s: Partial<AppSettings>) => void;
  view: string;
  markAsViewed?: (id: string, type: 'codex' | 'npc') => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ 
  player, genre, gameTime, currentLocation, isSaving, isBackupSaving, modals, setModals, handleBack, handleExit, onManualSave, isLoading,
  settings, onUpdateSettings, view, markAsViewed
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [imgError, setImgError] = useState(false);

  // Reset error when avatar changes
  React.useEffect(() => {
    setImgError(false);
  }, [player.avatar]);

  const isPlaying = view === 'playing';

  const toggleFullscreen = () => {
    onUpdateSettings({ isFullscreen: !settings.isFullscreen });
  };

  const navButtons = [
    {id: 'identity', label: 'MC', color: 'emerald', activeColor: 'bg-emerald-500', textColor: 'text-emerald-400'},
    {id: 'aiCompanion', label: 'AI', color: 'emerald', activeColor: 'bg-emerald-500', textColor: 'text-emerald-400'},
    {id: 'codex', label: 'Codex', color: 'amber', activeColor: 'bg-amber-500', textColor: 'text-amber-400'},
    {id: 'memory', label: 'Ký Ức', color: 'indigo', activeColor: 'bg-indigo-500', textColor: 'text-indigo-400'},
    {id: 'library', label: 'Library', color: 'indigo', activeColor: 'bg-indigo-500', textColor: 'text-indigo-400'}
  ];

  const handleNavClick = (id: string) => {
    const isOpening = !modals[id];
    setModals({ ...modals, [id]: isOpening });
    setIsMenuOpen(false);
  };

  const isFullscreenSupported = typeof document !== 'undefined' && (
    !!(document.documentElement as any).requestFullscreen || 
    !!(document.documentElement as any).webkitRequestFullscreen || 
    !!(document.documentElement as any).mozRequestFullScreen || 
    !!(document.documentElement as any).msRequestFullscreen
  );

  const meta = getGenreMeta(genre);

  return (
    <header className={`relative border-b border-white/5 bg-[var(--bg)] shrink-0 z-[200] transition-all duration-300 ${isCollapsed ? 'h-10' : 'h-auto'}`}>
      <div className={`w-full px-2 flex items-center justify-between transition-all duration-300 ${isCollapsed ? 'h-10' : 'py-1.5'}`}>
        <div className="flex items-center gap-2 min-w-0">
          {!isCollapsed && (
            <div 
              onClick={() => setModals({ ...modals, identity: true })}
              className="w-10 h-10 bg-neutral-900 rounded-xl flex items-center justify-center font-black text-black border border-white/10 shrink-0 overflow-hidden active:scale-95 transition-all cursor-pointer"
            >
              {player.avatar && !imgError ? (
                <img 
                  src={player.avatar} 
                  alt={player.name} 
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover" 
                />
              ) : (
                <img 
                  src={DEFAULT_AVATAR} 
                  alt={player.name} 
                  className="w-full h-full object-cover opacity-60" 
                />
              )}
            </div>
          )}
          <div 
            className="flex flex-col min-w-0 cursor-pointer active:opacity-70 transition-opacity"
            onClick={() => setModals({ ...modals, identity: true })}
          >
            <h1 className={`font-black tracking-widest uppercase text-white leading-none transition-all ${isCollapsed ? 'text-[9px]' : 'text-xs mb-1'}`}>{player.name}</h1>
            {!isCollapsed && (
              <div className="flex flex-col gap-1">
                 <div className="flex items-center gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[8px] mono text-emerald-500/80 font-black uppercase">{gameTime}</span>
                    {/* Turn count removed */}
                 </div>
                 {currentLocation && (
                   <span className="text-[8px] mono text-neutral-400 font-black uppercase truncate max-w-[120px]">📍 {currentLocation}</span>
                 )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {(isSaving || isBackupSaving) && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></div>
              <span className="text-[7px] mono text-emerald-500 font-black uppercase">
                {isBackupSaving ? 'Backup' : 'Saving'}
              </span>
            </div>
          )}
          
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all active:scale-90 ${isMenuOpen ? 'bg-emerald-500 text-black border-transparent shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-white/5 border-white/10 text-white'}`}
          >
            {isMenuOpen ? <CloseIcon size={16} /> : <Menu size={16} />}
          </button>

          {isFullscreenSupported && (
            <button 
              onClick={toggleFullscreen}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-neutral-400 active:scale-90 transition-all"
              title={settings.isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
            >
              {settings.isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
            </button>
          )}

          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-neutral-500 active:scale-90 transition-all"
          >
            {isCollapsed ? '▼' : '▲'}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div 
          className="fixed left-0 w-full bg-[var(--bg)] border-b border-white/10 p-4 grid grid-cols-2 gap-2 z-[9999] shadow-[0_20px_80px_rgba(0,0,0,1)] animate-in slide-in-from-top-2 duration-200"
          style={{ top: isCollapsed ? '40px' : '56px' }}
        >
          {/* User profile section removed */}
          {navButtons.map(btn => (
            <button 
              key={btn.id}
              onClick={() => handleNavClick(btn.id)}
              className={`px-2 py-2.5 rounded-xl border mono text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 active:scale-95 ${modals[btn.id] ? `${btn.activeColor} text-black border-transparent` : `bg-white/5 ${btn.textColor} border-white/10`}`}
            >
              {btn.label}
              {player.relationships.some(r => r.type === btn.id && r.viewed === false) && (
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
              )}
            </button>
          ))}
          <button 
            onClick={() => { onManualSave(); setIsMenuOpen(false); }}
            className="px-2 py-2.5 bg-emerald-500 text-black rounded-xl mono text-[10px] font-black uppercase col-span-2 active:scale-[0.98] transition-all"
          >
            💾 Lưu Thực Tại
          </button>
          <button 
            onClick={() => { setModals({ ...modals, history: true }); setIsMenuOpen(false); }}
            className="px-2 py-2.5 bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 rounded-xl mono text-[10px] font-black uppercase active:scale-95 transition-all"
          >
            📜 Lịch Sử(LoadGame)
          </button>
          <button 
            onClick={() => { setModals({ ...modals, settings: true }); setIsMenuOpen(false); }}
            className="px-2 py-2.5 bg-neutral-800/40 border border-white/10 text-neutral-400 rounded-xl mono text-[10px] font-black uppercase active:scale-95 transition-all"
          >
            ⚙️ Cài Đặt
          </button>
          <button 
            onClick={() => { isPlaying ? handleExit() : handleBack(); setIsMenuOpen(false); }}
            className="px-2 py-2.5 bg-red-500/10 border border-red-500/40 text-red-500 rounded-xl mono text-[10px] font-black uppercase active:scale-95 transition-all"
          >
            {isPlaying ? '🚪 Thoát' : '← Quay Lại'}
          </button>
        </div>
      )}
    </header>

  );
};
