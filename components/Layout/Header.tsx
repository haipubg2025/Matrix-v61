
import React, { useEffect } from 'react';
import { GameTime, Player, AppSettings, getGenreMeta, GameGenre } from '../../types';
import { MobileHeader } from '../Mobile/MobileHeader';
import { DEFAULT_AVATAR } from '../../constants';

interface HeaderProps {
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
  view: string;
  onManualSave: () => void;
  onRegenerateImage?: (logIndex: number) => Promise<void>;
  isLoading?: boolean;
  settings: AppSettings;
  onUpdateSettings: (s: Partial<AppSettings>) => void;
  markAsViewed?: (id: string, type: 'codex' | 'npc') => void;
}

export const Header: React.FC<HeaderProps> = (props) => {
  const { 
    player, genre, gameTime, currentLocation, isSaving, isBackupSaving, modals, setModals, handleBack, handleExit, view, onManualSave, onRegenerateImage, isLoading, settings, onUpdateSettings, markAsViewed 
  } = props;

  const [imgError, setImgError] = React.useState(false);

  // Reset error when avatar changes
  React.useEffect(() => {
    setImgError(false);
  }, [player.avatar]);

  const isPlaying = view === 'playing';
  const isSubSelect = view === 'sub-select';
  const isMobile = settings.mobileMode;
  const [isCollapsed, setIsCollapsed] = React.useState(isMobile);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const hasNewMcInfo = (player.newFields?.length || 0) > 0;

  if (settings.mobileMode) {
    return <MobileHeader {...props} onUpdateSettings={onUpdateSettings} />;
  }

  const navButtons = [
    {id: 'identity', label: 'MC', color: 'emerald', key: 'F1', borderColor: 'border-emerald-500/30', activeColor: 'bg-emerald-500', textColor: 'text-emerald-400', hasDot: hasNewMcInfo},
    {id: 'aiCompanion', label: 'AI', color: 'emerald', key: 'F8', borderColor: 'border-emerald-500/30', activeColor: 'bg-emerald-500', textColor: 'text-emerald-400'},
    {id: 'codex', label: 'Codex', color: 'amber', key: 'F5', borderColor: 'border-amber-500/30', activeColor: 'bg-amber-500', textColor: 'text-amber-400'},
    {id: 'memory', label: 'Ký Ức', color: 'indigo', key: 'F6', borderColor: 'border-indigo-500/30', activeColor: 'bg-indigo-500', textColor: 'text-indigo-400'},
    {id: 'library', label: 'Library', color: 'indigo', key: 'F7', borderColor: 'border-indigo-500/30', activeColor: 'bg-indigo-500', textColor: 'text-indigo-400'}
  ];

  const handleNavClick = (id: string) => {
    const isOpening = !modals[id];
    setModals({ ...modals, [id]: isOpening });
  };

  const meta = getGenreMeta(genre);

  return (
    <header className={`Header border-b border-white/5 bg-black/60 backdrop-blur-2xl shrink-0 z-50 transition-all duration-300 ${isCollapsed ? 'h-10' : 'h-auto min-h-20'}`}>
      <div className={`w-full px-4 md:px-8 flex items-center justify-between transition-all duration-300 ${isCollapsed ? 'h-10' : 'h-auto py-4 md:h-20'}`}>
        <div className={`flex items-center gap-3 md:gap-4 transition-opacity duration-500 ${isPlaying || isSubSelect ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          {!isCollapsed && (
            <div className={`${isMobile ? 'w-10 h-10' : 'w-12 h-12'} bg-neutral-900 rounded-2xl flex items-center justify-center font-black text-black shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-transform hover:scale-105 cursor-pointer overflow-hidden border border-white/10 shrink-0`}>
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
          <div className="flex flex-col min-w-0">
            <h1 className={`font-bold font-mono text-left tracking-[0.2em] uppercase text-white transition-all ${isCollapsed ? 'text-[9px] leading-[9px] mb-0' : 'text-[12px] leading-[12px] mb-1'}`}>{player.name}</h1>
            {!isCollapsed && (
              <div className="flex flex-wrap items-center gap-2 md:gap-3">
                 <div className="flex items-center gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[8px] md:text-[10px] mono text-emerald-500/80 font-black uppercase tracking-widest">{gameTime}</span>
                 </div>
                 <div className="flex items-center gap-1.5 border-l border-white/10 pl-2 md:pl-3">
                    {/* Turn count removed */}
                 </div>
                 {currentLocation && (
                   <div className="flex items-center gap-1.5 border-l border-white/10 pl-2 md:pl-3">
                      <span className="text-[8px] md:text-[10px] mono text-neutral-400 font-black uppercase tracking-widest truncate max-w-[100px] md:max-w-none">📍 {currentLocation}</span>
                   </div>
                 )}
              </div>
            )}
            {isSubSelect && !isCollapsed && <span className="text-[8px] md:text-[10px] mono text-neutral-500 font-black uppercase tracking-widest">Thiết lập vận mệnh</span>}
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {!isCollapsed && isSubSelect && (
            <button onClick={() => setModals({ ...modals, customIdentity: true })} className="px-4 md:px-6 py-2 bg-emerald-500 text-black font-black uppercase text-[10px] md:text-xs rounded-xl hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <span>✨</span> {isMobile ? 'Tùy Chọn' : 'Tự Chọn Thân Phận'}
            </button>
          )}

          {isPlaying && (
            <>
              {!isCollapsed && (
                <div className="flex flex-col items-end mr-2 md:mr-4">
                  {(isSaving || isBackupSaving) && (
                    <div className="flex items-center gap-2 text-emerald-500/50 mono text-[7px] md:text-[8px] font-black uppercase tracking-widest animate-pulse">
                      <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                      {isBackupSaving ? 'Backup...' : (isMobile ? 'Lưu...' : 'Đang Lưu...')}
                    </div>
                  )}
                </div>
              )}
              
              {!isMobile ? (
                <nav className={`flex items-center gap-2 mr-4 border-r border-white/10 pr-4 ${isCollapsed ? 'hidden' : 'flex'}`}>
                  {navButtons.map(btn => (
                    <button 
                      key={btn.id}
                      onClick={() => handleNavClick(btn.id)}
                      className={`px-3 py-2 rounded-xl border mono text-[9px] font-black uppercase transition-all duration-300 relative ${modals[btn.id] ? `${btn.activeColor} text-black border-transparent` : `bg-white/5 ${btn.textColor} ${btn.borderColor} hover:bg-${btn.color}-500/10`}`}
                    >
                      {btn.label}
                      {(btn as any).hasDot && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_#ef4444] animate-pulse z-10"></div>
                      )}
                    </button>
                  ))}
                </nav>
              ) : (
                !isCollapsed && (
                  <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className={`p-2 rounded-xl border border-white/10 bg-white/5 text-white transition-all ${isMenuOpen ? 'bg-emerald-500 text-black border-transparent' : ''}`}
                  >
                    {isMenuOpen ? '✕' : '☰'}
                  </button>
                )
              )}
              
              {!isMobile && (
                <div className={`flex items-center gap-2 mr-4 ${isCollapsed ? 'hidden' : 'flex'}`}>
                  <button 
                    onClick={() => onManualSave()}
                    className="px-4 py-2 bg-emerald-500 text-black rounded-xl mono text-[9px] font-black uppercase hover:bg-emerald-400 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                  >
                    Lưu
                  </button>
                  <button onClick={() => setModals({ ...modals, history: true })} className="px-4 py-2 bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 rounded-xl mono text-[9px] font-black uppercase hover:bg-cyan-400 hover:text-black transition-all">Lịch Sử(LoadGame)</button>
                  <button onClick={() => setModals({ ...modals, settings: true })} className="px-4 py-2 bg-neutral-800/40 border border-white/10 text-neutral-400 rounded-xl mono text-[9px] font-black uppercase hover:bg-white hover:text-black transition-all">Cài Đặt</button>
                </div>
              )}
            </>
          )}
          
          <div className="flex items-center gap-2 md:gap-4">
            {!isMobile && (
              <button onClick={isPlaying ? handleExit : handleBack} className={`text-[10px] mono uppercase font-black px-6 py-2 rounded-xl transition-all border shadow-lg ${isCollapsed ? 'hidden' : 'block'} ${isPlaying ? 'text-red-500 border-red-500/40 bg-red-500/5 hover:bg-red-500 hover:text-black' : 'text-white/60 border-white/20 bg-white/5 hover:bg-white/10'}`}>
                {isPlaying ? 'Thoát' : '← Quay Lại'}
              </button>
            )}
            
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-neutral-500 hover:text-white hover:bg-white/10 transition-all"
              title={isCollapsed ? "Mở rộng" : "Thu gọn"}
            >
              {isCollapsed ? '▼' : '▲'}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE MENU OVERLAY */}
      {isMobile && isMenuOpen && !isCollapsed && (
        <div className="absolute top-full left-0 w-full bg-black/95 backdrop-blur-3xl border-b border-white/10 p-4 grid grid-cols-2 gap-2 animate-in slide-in-from-top-4 duration-300 z-[60]">
          {navButtons.map(btn => (
            <button 
              key={btn.id}
              onClick={() => { handleNavClick(btn.id); setIsMenuOpen(false); }}
              className={`px-3 py-4 rounded-xl border mono text-[10px] font-black uppercase transition-all duration-300 flex items-center justify-center gap-2 relative ${modals[btn.id] ? `${btn.activeColor} text-black border-transparent` : `bg-white/5 ${btn.textColor} ${btn.borderColor}`}`}
            >
              {btn.label}
              {btn.hasDot && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_#ef4444] animate-pulse z-10"></div>
              )}
            </button>
          ))}
          <button 
            onClick={() => { onManualSave(); setIsMenuOpen(false); }}
            className="px-3 py-4 bg-emerald-500 text-black rounded-xl mono text-[10px] font-black uppercase col-span-2"
          >
            💾 Lưu Thực Tại
          </button>
          <button 
            onClick={() => { setModals({ ...modals, history: true }); setIsMenuOpen(false); }}
            className="px-3 py-4 bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 rounded-xl mono text-[10px] font-black uppercase"
          >
            📜 Lịch Sử(LoadGame)
          </button>
          <button 
            onClick={() => { setModals({ ...modals, settings: true }); setIsMenuOpen(false); }}
            className="px-3 py-4 bg-neutral-800/40 border border-white/10 text-neutral-400 rounded-xl mono text-[10px] font-black uppercase"
          >
            ⚙️ Cài Đặt
          </button>
          <button 
            onClick={() => { isPlaying ? handleExit() : handleBack(); setIsMenuOpen(false); }}
            className="px-3 py-4 bg-red-500/10 border border-red-500/40 text-red-500 rounded-xl mono text-[10px] font-black uppercase"
          >
            {isPlaying ? '🚪 Thoát' : '← Quay Lại'}
          </button>
        </div>
      )}
    </header>
  );
};
