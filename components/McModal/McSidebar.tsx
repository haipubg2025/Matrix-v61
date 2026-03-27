
import React from 'react';
import { Player, IdentityType, getGenreMeta, GameGenre, BackgroundAttribute, GameTime } from '../../types';
import { MC_PERSONALITIES } from '../../constants/personalities';
import { NewIndicator } from '../NewIndicator';
import { DEFAULT_AVATAR } from '../../constants';
import { syncAgeAndBirthday } from '../../utils/timeUtils';
import { McConditionPanel } from './McConditionPanel';
import { ResolvedImage } from '../ResolvedImage';

interface McSidebarProps {
  player: Player;
  onAvatarClick: () => void;
  onGalleryClick: () => void;
  isEditing: boolean;
  onUpdatePlayer: (player: Player) => void;
  genre?: GameGenre;
  onToggleLock?: (field: string) => void;
  onGenerateAvatar?: (customPrompt?: string) => Promise<string | undefined>;
  gameTime?: GameTime;
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

export const McSidebar: React.FC<McSidebarProps> = ({ 
  player, onAvatarClick, onGalleryClick, isEditing, onUpdatePlayer, genre, onToggleLock, onGenerateAvatar, gameTime
}) => {
  const [imgError, setImgError] = React.useState(false);
  const meta = getGenreMeta(genre);
  const labels = meta.npcLabels;

  // Reset error when avatar changes
  React.useEffect(() => {
    setImgError(false);
  }, [player.avatar]);

  const getBackgroundAttributes = (): BackgroundAttribute[] => {
    return player.backgroundAttributes || [];
  };

  const backgroundAttrs = getBackgroundAttributes();

  const handleBackgroundAttrChange = (index: number, field: keyof BackgroundAttribute, value: string) => {
    const newAttrs = [...backgroundAttrs];
    newAttrs[index] = { ...newAttrs[index], [field]: value };
    onUpdatePlayer({ ...player, backgroundAttributes: newAttrs });
  };

  const handleAddBackgroundAttr = () => {
    const newAttrs = [...backgroundAttrs, { label: 'THUỘC TÍNH MỚI', value: 'Chưa xác định', icon: '💠' }];
    onUpdatePlayer({ ...player, backgroundAttributes: newAttrs });
  };

  const handleRemoveBackgroundAttr = (index: number) => {
    const newAttrs = backgroundAttrs.filter((_, i) => i !== index);
    onUpdatePlayer({ ...player, backgroundAttributes: newAttrs });
  };

  const handleChange = (field: keyof Player, value: any) => {
    if ((field === 'age' || field === 'birthday') && gameTime?.year !== undefined) {
      const currentYear = gameTime.year;
      const updates = syncAgeAndBirthday(field as 'age' | 'birthday', value, currentYear, player);
      onUpdatePlayer({ ...player, ...updates });
    } else {
      onUpdatePlayer({ ...player, [field]: value });
    }
  };

  const healthPercent = Math.min(100, (player.health / player.maxHealth) * 100);

  return (
    <div className="w-full md:w-72 h-full border-r border-white/10 bg-black/40 p-1 flex flex-col shrink-0 overflow-y-auto custom-scrollbar relative z-20 mono">
      <div className="relative group mb-1.5 w-full aspect-[2/3] rounded-sm border-2 border-emerald-500/20 bg-emerald-500/5 overflow-hidden shrink-0 shadow-[0_0_40px_rgba(16,185,129,0.1)]">
        {player.avatar && !imgError ? (
          <ResolvedImage 
            src={player.avatar} 
            alt={player.name} 
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-1000" 
          />
        ) : (
          <ResolvedImage 
            src={DEFAULT_AVATAR} 
            alt={player.name} 
            className="w-full h-full object-cover opacity-60 transition-transform group-hover:scale-105 duration-1000" 
          />
        )}
        
        <div className="absolute top-2 right-2 z-40">
          <LockIcon isLocked={player.lockedFields?.includes('avatar') || false} onClick={() => onToggleLock?.('avatar')} className="bg-black/60 p-1 rounded-sm border border-white/10" />
        </div>

        <div onClick={onAvatarClick} className="absolute inset-0 bg-emerald-500/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer z-20 transition-opacity backdrop-blur-sm">
        </div>
        <div className="absolute bottom-2 left-0 right-0 px-2 flex flex-col gap-1.5 z-30">
          <div className="flex gap-1">
            <button onClick={onGalleryClick} className="flex-grow py-1.5 bg-black/80 border border-white/10 rounded-sm text-[9px] font-black uppercase text-white whitespace-nowrap shadow-xl hover:bg-emerald-500 hover:text-black transition-colors">
              THƯ VIỆN ẢNH
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-1 px-1">
        {/* Basic Info Section */}
        <div className="bg-white/[0.03] p-2 rounded-sm border border-white/5 space-y-2">
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="text-[7px] text-neutral-600 font-black uppercase tracking-widest">
                  {player.statLabels?.['title_label'] || 'Danh Hiệu'}
                </span>
                <LockIcon isLocked={player.lockedFields?.includes('title') || false} onClick={() => onToggleLock?.('title')} />
              </div>
              {isEditing ? (
                <input 
                  value={player.title || ''} 
                  onChange={(e) => handleChange('title', e.target.value)}
                  className="bg-transparent text-[10px] font-black text-amber-500 uppercase italic outline-none border-b border-amber-500/20 w-full"
                  placeholder="Danh Hiệu"
                />
              ) : (
                <span className="text-[10px] font-black text-amber-500 uppercase italic leading-none">{player.title || '---'}</span>
              )}
            </div>
            
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1">
                <span className="text-[7px] text-neutral-600 font-black uppercase tracking-widest">
                  {player.statLabels?.['gender_label'] || 'Giới tính'}
                </span>
                <LockIcon isLocked={player.lockedFields?.includes('gender') || false} onClick={() => onToggleLock?.('gender')} />
              </div>
              {isEditing ? (
                <select 
                  value={player.gender} 
                  onChange={(e) => handleChange('gender', e.target.value)}
                  className="bg-transparent text-[10px] font-black uppercase italic text-white outline-none"
                >
                  <option value="??" className="bg-neutral-900">??</option>
                  <option value="Nam" className="bg-neutral-900">Nam</option>
                  <option value="Nữ" className="bg-neutral-900">Nữ</option>
                  <option value="Khác" className="bg-neutral-900">Khác</option>
                </select>
              ) : (
                <span className={`text-[10px] font-black uppercase italic leading-none ${player.gender === 'Nữ' ? 'text-pink-400' : player.gender === 'Nam' ? 'text-blue-400' : 'text-neutral-500'}`}>
                  {player.gender || '---'}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="text-[7px] text-neutral-600 font-black uppercase tracking-widest">
                  {player.statLabels?.['age_label'] || 'Tuổi'}
                </span>
                <LockIcon isLocked={player.lockedFields?.includes('age') || false} onClick={() => onToggleLock?.('age')} />
              </div>
              {isEditing ? (
                <input 
                  type="number"
                  value={player.age} 
                  onChange={(e) => handleChange('age', parseInt(e.target.value) || 0)}
                  className="bg-transparent text-[10px] font-black text-white outline-none w-full border-b border-white/10"
                />
              ) : (
                <span className="text-[10px] font-black text-white uppercase italic leading-none">{player.age || '??'}</span>
              )}
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="text-[7px] text-neutral-600 font-black uppercase tracking-widest">
                  {player.statLabels?.['birthday_label'] || 'Ngày sinh'}
                </span>
                <LockIcon isLocked={player.lockedFields?.includes('birthday') || false} onClick={() => onToggleLock?.('birthday')} />
              </div>
              {isEditing ? (
                <input 
                  value={player.birthday || ''} 
                  onChange={(e) => handleChange('birthday', e.target.value)}
                  className="bg-transparent text-[10px] font-black text-white outline-none w-full border-b border-white/10"
                />
              ) : (
                <span className="text-[10px] font-black text-white uppercase italic tracking-tight leading-none">{player.birthday || '---'}</span>
              )}
            </div>
          </div>

          <div className="flex flex-col border-t border-white/5 pt-2">
            <div className="flex justify-between text-[7px] font-black uppercase mb-1">
              <div className="flex items-center gap-1">
                {isEditing ? (
                  <input 
                    value={player.statLabels?.['health_label'] || meta.hpLabel || 'Sinh Mệnh (HP)'}
                    onChange={(e) => onUpdatePlayer?.({
                      ...player,
                      statLabels: { ...(player.statLabels || {}), 'health_label': e.target.value }
                    })}
                    className="bg-transparent text-rose-500 outline-none border-b border-rose-500/20 w-20"
                  />
                ) : (
                  <span className="text-rose-500">{player.statLabels?.['health_label'] || meta.hpLabel || 'Sinh Mệnh (HP)'}</span>
                )}
                <LockIcon isLocked={player.lockedFields?.includes('health') || false} onClick={() => onToggleLock?.('health')} />
              </div>
              <div className="flex items-center gap-1">
                {isEditing ? (
                  <div className="flex items-center gap-0.5">
                    <input 
                      type="number"
                      value={player.health}
                      onChange={(e) => handleChange('health', parseInt(e.target.value) || 0)}
                      className="bg-transparent text-white w-8 outline-none border-b border-rose-500/20 text-right"
                    />
                    <span>/</span>
                    <input 
                      type="number"
                      value={player.maxHealth}
                      onChange={(e) => handleChange('maxHealth', parseInt(e.target.value) || 0)}
                      className="bg-transparent text-white w-8 outline-none border-b border-rose-500/20"
                    />
                  </div>
                ) : (
                  <span className="text-white">{player.health}/{player.maxHealth}</span>
                )}
              </div>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
              <div 
                className="h-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)] transition-all duration-500" 
                style={{ width: `${healthPercent}%` }}
              ></div>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              {isEditing ? (
                <input 
                  value={player.statLabels?.['location_label'] || 'Vị Trí'}
                  onChange={(e) => onUpdatePlayer?.({
                    ...player,
                    statLabels: { ...(player.statLabels || {}), 'location_label': e.target.value }
                  })}
                  className="bg-transparent text-[7px] text-neutral-600 font-black uppercase tracking-widest outline-none border-b border-white/10 w-16"
                />
              ) : (
                <span className="text-[7px] text-neutral-600 font-black uppercase tracking-widest">
                  {player.statLabels?.['location_label'] || 'Vị Trí'}
                </span>
              )}
              <LockIcon isLocked={player.lockedFields?.includes('currentLocation') || false} onClick={() => onToggleLock?.('currentLocation')} />
            </div>
            {isEditing ? (
              <input 
                value={player.currentLocation || ''} 
                onChange={(e) => handleChange('currentLocation', e.target.value)}
                className="bg-transparent text-[9px] text-white font-black uppercase italic outline-none border-b border-white/10 w-full"
              />
            ) : (
              <span className="text-[9px] text-white font-black uppercase italic truncate">📍 {player.currentLocation || 'Khởi đầu'}</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-1 py-1.5">

          <div className="col-span-2 flex flex-col bg-white/[0.03] p-1.5 rounded-sm border border-white/5">
            <div className="flex items-center gap-1">
              <span className="text-[7px] text-emerald-600 font-black uppercase tracking-widest">Tính cách đặc trưng</span>
              <LockIcon isLocked={player.lockedFields?.includes('personality') || false} onClick={() => onToggleLock?.('personality')} />
              {player.newFields?.includes('personality') && <NewIndicator />}
            </div>
            {isEditing ? (
              <div className="space-y-2 mt-1">
                {/* Current Tags with Delete Option */}
                <div className="flex flex-wrap gap-1 p-1 bg-black/20 rounded-sm min-h-[30px]">
                  {(player.personality || "").split('+').map(s => s.trim()).filter(Boolean).map((p, idx) => (
                    <div key={idx} className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500 text-black rounded-sm text-[8px] font-black uppercase">
                      <span>{p}</span>
                      <button 
                        onClick={() => {
                          const current = (player.personality || "").split('+').map(s => s.trim()).filter(Boolean);
                          const next = current.filter((_, i) => i !== idx);
                          onUpdatePlayer({ ...player, personality: next.join(' + ') });
                        }}
                        className="hover:text-white transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Custom Personality */}
                <div className="flex gap-1">
                  <input 
                    type="text"
                    placeholder="Thêm tính cách..."
                    className="flex-grow bg-white/5 border border-white/10 text-[9px] px-2 py-1 outline-none focus:border-emerald-500 text-white"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = e.currentTarget.value.trim();
                        if (val) {
                          const current = (player.personality || "").split('+').map(s => s.trim()).filter(Boolean);
                          if (!current.includes(val)) {
                            onUpdatePlayer({ ...player, personality: [...current, val].join(' + ') });
                          }
                          e.currentTarget.value = '';
                        }
                      }
                    }}
                  />
                </div>

                {/* Preset Suggestions */}
                <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto custom-scrollbar p-1 border-t border-white/5">
                  {MC_PERSONALITIES.map((p) => {
                    const current = (player.personality || "").split('+').map(s => s.trim()).filter(Boolean);
                    const isSelected = current.includes(p);
                    if (isSelected) return null;
                    return (
                      <button
                        key={p}
                        onClick={() => {
                          onUpdatePlayer({ ...player, personality: [...current, p].join(' + ') });
                        }}
                        className="px-1.5 py-0.5 bg-white/5 text-emerald-500/40 border border-white/10 rounded-sm text-[8px] font-black uppercase hover:border-emerald-500/40"
                      >
                        + {p}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1 mt-1">
                {player.personality ? player.personality.split('+').map((p, i) => (
                  <span key={i} className="px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-sm text-[8px] text-emerald-400 font-black uppercase">
                    {p.trim()}
                  </span>
                )) : <span className="text-[8px] text-neutral-700 italic">Trống</span>}
              </div>
            )}
          </div>
        </div>

        <McConditionPanel 
          player={player} 
          isEditing={isEditing} 
          onUpdatePlayer={onUpdatePlayer} 
          onToggleLock={onToggleLock}
        />

        <div className="space-y-1.5 py-1">
          {backgroundAttrs.map((attr, idx) => (
            <div key={idx} className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-sm relative overflow-hidden group hover:border-emerald-500 transition-colors shadow-inner">
              {isEditing && (
                <button 
                  onClick={() => handleRemoveBackgroundAttr(idx)}
                  className="absolute top-1 right-1 text-rose-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity z-30"
                >
                  ✕
                </button>
              )}
              <div className="flex items-center mb-1 gap-1">
                {isEditing ? (
                  <div className="flex items-center gap-1 w-full">
                    <input 
                      value={attr.icon || '💠'} 
                      onChange={(e) => handleBackgroundAttrChange(idx, 'icon', e.target.value)}
                      className="w-4 bg-transparent text-[7px] outline-none"
                    />
                    <input 
                      value={attr.label} 
                      onChange={(e) => handleBackgroundAttrChange(idx, 'label', e.target.value)}
                      className="flex-grow bg-transparent text-[7px] text-emerald-500 font-black uppercase tracking-widest outline-none border-b border-white/10"
                    />
                  </div>
                ) : (
                  <span className="text-[7px] text-emerald-500 font-black uppercase tracking-widest block">
                    {attr.icon || '💠'} {attr.label}
                  </span>
                )}
                <LockIcon isLocked={player.lockedFields?.includes(`background.${attr.label}`) || false} onClick={() => onToggleLock?.(`background.${attr.label}`)} />
                {player.newFields?.includes(`background.${attr.label}`) && <NewIndicator />}
              </div>
              {isEditing ? (
                <textarea 
                  value={attr.value} 
                  onChange={(e) => handleBackgroundAttrChange(idx, 'value', e.target.value)}
                  className="w-full bg-transparent text-[11px] text-white font-black leading-snug italic outline-none resize-none"
                  rows={2}
                />
              ) : (
                <p className="text-[11px] text-white font-black leading-snug italic">
                  {attr.value || "Chưa xác định"}
                </p>
              )}
            </div>
          ))}

          {isEditing && (
            <button 
              onClick={handleAddBackgroundAttr}
              className="w-full py-2 bg-white/5 border border-white/10 rounded-sm text-[8px] font-black text-emerald-500/60 uppercase hover:bg-white/10 transition-all"
            >
              + THÊM THUỘC TÍNH NỀN TẢNG
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
