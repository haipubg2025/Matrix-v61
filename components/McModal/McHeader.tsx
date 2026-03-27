
import React from 'react';
import { Player, GameGenre, GameTime } from '../../types';
import { syncAgeAndBirthday } from '../../utils/timeUtils';

interface McHeaderProps {
  player: Player;
  genre?: GameGenre;
  onClose: () => void;
  isEditing: boolean;
  onToggleEdit: () => void;
  onUpdatePlayer?: (player: any) => void;
  gameTime?: GameTime;
  isGameStarted?: boolean;
  onToggleLock?: (field: string) => void;
  onExport?: () => void;
  onImport?: () => void;
}

const LockIcon = ({ isLocked, onClick, className = "" }: { isLocked: boolean, onClick?: () => void, className?: string }) => (
  <span 
    onClick={(e) => { e.stopPropagation(); onClick?.(); }}
    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onClick?.(); } }}
    className={`ml-1 transition-all hover:scale-110 active:scale-90 cursor-pointer inline-flex items-center justify-center ${isLocked ? 'text-amber-500' : 'text-neutral-700 hover:text-neutral-500'} ${className}`}
    title={isLocked ? "Đã khóa - AI không thể thay đổi" : "Chưa khóa - AI có thể thay đổi"}
    role="button"
    tabIndex={0}
  >
    {isLocked ? (
      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
    )}
  </span>
);

export const McHeader: React.FC<McHeaderProps> = ({ player, genre, onClose, isEditing, onToggleEdit, onUpdatePlayer, gameTime, isGameStarted, onToggleLock, onExport, onImport }) => {
  const handleChange = (field: string, value: any) => {
    if (onUpdatePlayer) {
      if ((field === 'age' || field === 'birthday') && gameTime?.year !== undefined) {
        const currentYear = gameTime.year;
        const updates = syncAgeAndBirthday(field as 'age' | 'birthday', value, currentYear, player);
        onUpdatePlayer({ ...player, ...updates });
      } else {
        onUpdatePlayer({ ...player, [field]: value });
      }
    }
  };

  return (
    <div className="flex flex-col border-b border-white/10 bg-emerald-500/5 shrink-0 mono">
      <div className="flex justify-between items-center p-2">
        <div className="flex items-center gap-4">
          <div className="h-10 w-px bg-white/10 hidden lg:block mx-2"></div>

          <div className="hidden lg:flex items-center gap-6">
            {/* Name Only */}
            <div className="flex flex-col">
              <div className="flex items-center">
                {isEditing ? (
                  <div className="flex gap-2">
                    <input 
                      value={player.statLabels?.['name_label'] || 'Họ Tên'}
                      onChange={(e) => onUpdatePlayer?.({
                        ...player,
                        statLabels: { ...(player.statLabels || {}), 'name_label': e.target.value }
                      })}
                      className="bg-transparent text-[7px] text-neutral-600 font-black uppercase tracking-widest outline-none border-b border-white/10 w-16"
                    />
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <span className="text-[7px] text-neutral-600 font-black uppercase tracking-widest">
                      {player.statLabels?.['name_label'] || 'Họ Tên'}
                    </span>
                  </div>
                )}
                <LockIcon isLocked={player.lockedFields?.includes('name') || false} onClick={() => onToggleLock?.('name')} />
              </div>
              <div className="flex items-baseline gap-2">
                {isEditing ? (
                  <div className="flex gap-2">
                    <input 
                      value={player.name} 
                      onChange={(e) => handleChange('name', e.target.value)}
                      className="bg-transparent text-sm font-black text-white uppercase italic outline-none border-b border-emerald-500/20 w-32"
                      placeholder="Họ Tên"
                    />
                  </div>
                ) : (
                  <>
                    <span className="text-sm font-black text-white uppercase italic leading-none">{player.name}</span>
                  </>
                )}
              </div>
            </div>

            {/* Level & Exp */}
            <div className="flex items-center gap-4 border-l border-white/5 pl-6">
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="text-[7px] text-neutral-600 font-black uppercase tracking-widest">Cấp Độ</span>
                  <LockIcon isLocked={player.lockedFields?.includes('level') || false} onClick={() => onToggleLock?.('level')} />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-[8px] text-emerald-500 font-black">LV.</span>
                  {isEditing ? (
                    <input 
                      value={player.level}
                      onChange={(e) => handleChange('level', e.target.value)}
                      className="bg-transparent text-sm font-black text-white outline-none border-b border-white/10 w-12"
                    />
                  ) : (
                    <span className="text-sm font-black text-white tabular-nums">{player.level}</span>
                  )}
                </div>
              </div>

              <div className="flex flex-col min-w-[100px]">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[7px] text-neutral-600 font-black uppercase tracking-widest">Kinh Nghiệm</span>
                  <span className="text-[8px] text-neutral-400 font-bold tabular-nums">{player.exp} EXP</span>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full mt-1 overflow-hidden border border-white/5">
                  <div 
                    className="h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)] transition-all duration-500" 
                    style={{ width: `${Math.min(100, (player.exp / 1000) * 100)}%` }} // Assuming 1000 exp per level for visual
                  ></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="h-6 w-px bg-white/10 hidden md:block mx-2"></div>
        </div>

        <div className="flex items-center gap-2">
          {!isGameStarted && (
            <>
              <button 
                onClick={onImport} 
                className="px-3 py-1.5 bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20 transition-all rounded-sm border font-black uppercase text-[10px] shadow-2xl active:scale-95 flex items-center gap-2"
                title="Nhập dữ liệu MC từ tệp JSON"
              >
                <span>📥</span> Nhập
              </button>
              <button 
                onClick={onExport} 
                className="px-3 py-1.5 bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20 transition-all rounded-sm border font-black uppercase text-[10px] shadow-2xl active:scale-95 flex items-center gap-2"
                title="Xuất dữ liệu MC ra tệp JSON"
              >
                <span>📤</span> Xuất
              </button>
            </>
          )}

          {isGameStarted && (
            isEditing ? (
              <button 
                onClick={onToggleEdit} 
                className="px-4 py-1.5 bg-emerald-500 text-black border-emerald-400 hover:bg-emerald-400 transition-all rounded-sm border font-black uppercase text-[10px] shadow-2xl active:scale-95 flex items-center gap-2"
              >
                <span>💾</span> Lưu Thay Đổi
              </button>
            ) : (
              <button 
                onClick={onToggleEdit} 
                className="px-4 py-1.5 bg-white/5 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10 transition-all rounded-sm border font-black uppercase text-[10px] shadow-2xl active:scale-95"
              >
                ✎ Chỉnh Sửa
              </button>
            )
          )}

          <button onClick={onClose} className="px-4 py-1.5 bg-white/5 hover:bg-rose-500/20 text-neutral-500 hover:text-rose-400 transition-all rounded-sm border border-white/10 font-black uppercase text-[10px] shadow-2xl active:scale-95">
            [ESC] Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
