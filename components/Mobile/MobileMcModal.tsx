
import React, { useState } from 'react';
import { Player, GameGenre, GalleryImage, getGenreMeta, AppSettings, IdentityType, GameTime } from '../../types';
import { MC_PERSONALITIES } from '../../constants/personalities';
import { syncAgeAndBirthday } from '../../utils/timeUtils';
import { McStatsGrid } from '../McModal/McStatsGrid';
import { McQuestPanel } from '../McModal/McQuestPanel';
import { McAssetPanel } from '../McModal/McAssetPanel';
import { McSkillPanel } from '../McModal/McSkillPanel';
import { McInventoryPanel } from '../McModal/McInventoryPanel';
import { McInspector, InspectType } from '../McModal/McInspector';
import { IdentityPanel } from '../IdentityPanel';
import { DEFAULT_AVATAR } from '../../constants';
import { ResolvedImage } from '../ResolvedImage';

interface MobileMcModalProps {
  player: Player;
  gallery: GalleryImage[];
  genre?: GameGenre;
  onClose: () => void;
  onUpdatePlayer: (player: Player) => void;
  onUpdateGallery: (gallery: GalleryImage[]) => void;
  settings: AppSettings;
  onAvatarClick: () => void;
  onGalleryClick: () => void;
  onStudioClick?: () => void;
  initialEditing?: boolean;
  gameTime?: GameTime;
  isGameStarted?: boolean;
  onToggleLock?: (field: string) => void;
  onExport?: () => void;
  onImport?: () => void;
  onGenerateAvatar?: (customPrompt?: string) => Promise<string | undefined>;
}

const LockIcon = ({ isLocked, onClick, className = "" }: { isLocked: boolean, onClick?: () => void, className?: string }) => (
  <span 
    onClick={(e) => { e.stopPropagation(); onClick?.(); }}
    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onClick?.(); } }}
    className={`ml-1 p-1.5 transition-all hover:scale-110 active:scale-90 cursor-pointer inline-flex items-center justify-center ${isLocked ? 'text-amber-500' : 'text-neutral-700 hover:text-neutral-500'} ${className}`}
    title={isLocked ? "Đã khóa - AI không thể thay đổi" : "Chưa khóa - AI có thể thay đổi"}
    role="button"
    tabIndex={0}
  >
    {isLocked ? (
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
    )}
  </span>
);

export const MobileMcModal: React.FC<MobileMcModalProps> = ({ 
  player, gallery, genre, onClose, onUpdatePlayer, onUpdateGallery, settings, onAvatarClick, onGalleryClick, onStudioClick, initialEditing = false, gameTime, isGameStarted, onToggleLock,
  onExport, onImport, onGenerateAvatar
}) => {
  const [mainTab, setMainTab] = useState<'avatar' | 'info'>('info');
  const [activeTab, setActiveTab] = useState<'stats' | 'quests' | 'assets' | 'skills' | 'inventory'>('stats');
  const [isEditing, setIsEditing] = useState(initialEditing);
  const [imgError, setImgError] = useState(false);

  // Reset error when avatar changes
  React.useEffect(() => {
    setImgError(false);
  }, [player.avatar]);

  const [inspectingItem, setInspectingItem] = useState<{ 
    name: string; 
    type: InspectType; 
    description?: string;
    reward?: string;
    status?: string;
    questGroup?: string;
    questKind?: string;
    progress?: string;
  } | null>(null);

  const meta = getGenreMeta(genre);
  const hasSystem = !!player.systemName;

  const tabs = [
    { id: 'stats', label: 'Chỉ Số', icon: '📊' },
    { id: 'quests', label: 'Nhiệm Vụ', icon: '📜' },
    { id: 'assets', label: 'Tài Sản', icon: '💰' },
    { id: 'skills', label: 'Kỹ Năng', icon: '⚔️' },
    { id: 'inventory', label: 'Hành Trang', icon: '🎒' },
  ];

  return (
    <div className="MobileMcModal fixed inset-0 z-[300] bg-black flex flex-col h-full overflow-hidden mono selection:bg-emerald-500 selection:text-black">
      {/* HEADER */}
      <div className="flex items-center justify-between p-2 border-b border-white/10 bg-emerald-500/5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]"></div>
          <h2 className="text-sm font-black text-emerald-500 uppercase tracking-widest italic">MC_IDENTITY_CORE</h2>
        </div>
        <div className="flex items-center gap-2">
          {!isGameStarted && (
            <>
              <button 
                onClick={onImport}
                className="p-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20 active:scale-90"
                title="Nhập"
              >
                📥
              </button>
              <button 
                onClick={onExport}
                className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20 active:scale-90"
                title="Xuất"
              >
                📤
              </button>
            </>
          )}
          {isGameStarted && (
            isEditing ? (
              <button 
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase transition-all bg-emerald-500 text-black border-emerald-400"
              >
                LƯU
              </button>
            ) : (
              <button 
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase transition-all bg-white/5 text-emerald-500 border-white/10"
              >
                SỬA
              </button>
            )
          )}
          <button onClick={onClose} className="p-2 bg-white/5 text-neutral-400 rounded-lg border border-white/10">✕</button>
        </div>
      </div>

      {/* MAIN TABS */}
      <div className="flex border-b border-white/10 bg-black shrink-0">
        <button
          onClick={() => setMainTab('avatar')}
          className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${mainTab === 'avatar' ? 'text-emerald-500 bg-emerald-500/5' : 'text-neutral-500'}`}
        >
          <div className="flex items-center justify-center gap-2">
            <span>🖼️</span> AVATAR
          </div>
          {mainTab === 'avatar' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500 shadow-[0_0_10px_#10b981]"></div>}
        </button>
        <button
          onClick={() => setMainTab('info')}
          className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${mainTab === 'info' ? 'text-emerald-500 bg-emerald-500/5' : 'text-neutral-500'}`}
        >
          <div className="flex items-center justify-center gap-2">
            <span>📊</span> INFO
          </div>
          {mainTab === 'info' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500 shadow-[0_0_10px_#10b981]"></div>}
        </button>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-grow min-h-0 overflow-hidden flex flex-col">
        {mainTab === 'avatar' ? (
          <div className="flex-grow overflow-y-auto p-4 space-y-6 animate-in fade-in slide-in-from-left-4 duration-300 custom-scrollbar">
            {/* AVATAR IMAGE */}
            <div className="relative mx-auto w-full max-w-[300px] aspect-[3/4] rounded-3xl border-2 border-emerald-500/20 bg-emerald-500/5 overflow-hidden shadow-2xl group">
              {player.avatar && !imgError ? (
                <ResolvedImage 
                  src={player.avatar} 
                  alt={player.name} 
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover" 
                />
              ) : (
                <ResolvedImage 
                  src={DEFAULT_AVATAR} 
                  alt={player.name} 
                  className="w-full h-full object-cover opacity-60" 
                />
              )}
              
              {/* Click Overlay for Avatar */}
              <div 
                onClick={onAvatarClick}
                className="absolute inset-0 bg-emerald-500/20 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity backdrop-blur-[2px] z-10"
              >
                <span className="bg-black/60 px-4 py-2 rounded-full text-[10px] font-black text-white uppercase tracking-widest border border-white/10">THAY ĐỔI ẢNH</span>
              </div>

              {/* Lock Icon for Avatar */}
              <div className="absolute top-4 right-4 z-20">
                <div className="bg-black/60 backdrop-blur-md p-2 rounded-xl border border-white/10">
                  <LockIcon 
                    isLocked={player.lockedFields?.includes('avatar') || false} 
                    onClick={() => onToggleLock?.('avatar')} 
                    className="!p-0"
                  />
                </div>
              </div>

              {/* Avatar Overlay Info */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/60 to-transparent z-20">
                {isEditing ? (
                  <div className="space-y-1">
                    <input 
                      value={player.name}
                      onChange={(e) => onUpdatePlayer({ ...player, name: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-lg font-black text-white uppercase tracking-tighter outline-none"
                      placeholder="Tên nhân vật"
                    />
                    <input 
                      value={player.title || ''}
                      onChange={(e) => onUpdatePlayer({ ...player, title: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-[10px] font-black text-emerald-400 uppercase tracking-widest outline-none"
                      placeholder="Danh hiệu"
                    />
                  </div>
                ) : (
                  <>
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter truncate">{player.name}</h3>
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest truncate">{player.title || 'Người Chơi'}</p>
                  </>
                )}
              </div>
            </div>

            {/* AVATAR ACTIONS */}
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={onAvatarClick}
                className="flex flex-col items-center justify-center gap-2 p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all active:scale-95"
              >
                <span className="text-xl">📤</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Tải Lên</span>
              </button>
              <button 
                onClick={onGalleryClick}
                className="flex flex-col items-center justify-center gap-2 p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all active:scale-95"
              >
                <span className="text-xl">🖼️</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400">Kho Ảnh</span>
              </button>
              {onStudioClick && (
                <button 
                  onClick={onStudioClick}
                  className="flex flex-col items-center justify-center gap-2 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl hover:bg-emerald-500/20 transition-all active:scale-95"
                >
                  <span className="text-xl">🎨</span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Studio</span>
                </button>
              )}
              {onGenerateAvatar && (
                <button 
                  onClick={() => onGenerateAvatar()}
                  className="flex flex-col items-center justify-center gap-2 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl hover:bg-emerald-500/20 transition-all active:scale-95"
                >
                  <span className="text-xl">✨</span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Tạo AI</span>
                </button>
              )}
            </div>

            {/* BASIC INFO (Moved from Stats tab) */}
            <div className="space-y-4">
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">THÔNG TIN CƠ BẢN</span>
                  <div className="flex items-center gap-2">
                    <LockIcon isLocked={player.lockedFields?.includes('name') || false} onClick={() => onToggleLock?.('name')} />
                    <LockIcon isLocked={player.lockedFields?.includes('title') || false} onClick={() => onToggleLock?.('title')} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <span className="text-[8px] text-neutral-500 font-black uppercase tracking-widest">Giới tính</span>
                      <LockIcon isLocked={player.lockedFields?.includes('gender') || false} onClick={() => onToggleLock?.('gender')} />
                    </div>
                    {isEditing ? (
                      <select 
                        value={player.gender} 
                        onChange={(e) => onUpdatePlayer({ ...player, gender: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-[10px] font-black text-white uppercase outline-none"
                      >
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                        <option value="Khác">Khác</option>
                      </select>
                    ) : (
                      <div className="text-[10px] font-black text-white uppercase italic">{player.gender || '---'}</div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <span className="text-[8px] text-neutral-500 font-black uppercase tracking-widest">Tuổi</span>
                      <LockIcon isLocked={player.lockedFields?.includes('age') || false} onClick={() => onToggleLock?.('age')} />
                    </div>
                    {isEditing ? (
                      <input 
                        type={typeof player.age === 'number' ? 'number' : 'text'}
                        value={player.age} 
                        onChange={(e) => {
                          const val = e.target.value;
                          const numVal = parseInt(val);
                          const finalVal = isNaN(numVal) || val !== numVal.toString() ? val : numVal;
                          const currentYear = gameTime?.year || 2024;
                          const updates = syncAgeAndBirthday('age', finalVal, currentYear, player);
                          onUpdatePlayer({ ...player, ...updates });
                        }}
                        className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-[10px] font-black text-white outline-none"
                      />
                    ) : (
                      <div className="text-[10px] font-black text-white uppercase italic">{player.age || '??'} Tuổi</div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <span className="text-[8px] text-neutral-500 font-black uppercase tracking-widest">Ngày sinh</span>
                      <LockIcon isLocked={player.lockedFields?.includes('birthday') || false} onClick={() => onToggleLock?.('birthday')} />
                    </div>
                    {isEditing ? (
                      <input 
                        value={player.birthday || ''} 
                        onChange={(e) => {
                          const currentYear = gameTime?.year || 2024;
                          const updates = syncAgeAndBirthday('birthday', e.target.value, currentYear, player);
                          onUpdatePlayer({ ...player, ...updates });
                        }}
                        className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-[10px] font-black text-white outline-none"
                        placeholder="DD/MM"
                      />
                    ) : (
                      <div className="text-[10px] font-black text-white uppercase italic">{player.birthday || '---'}</div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <span className="text-[8px] text-neutral-500 font-black uppercase tracking-widest">Vị trí</span>
                      <LockIcon isLocked={player.lockedFields?.includes('currentLocation') || false} onClick={() => onToggleLock?.('currentLocation')} />
                    </div>
                    {isEditing ? (
                      <input 
                        value={player.currentLocation || ''} 
                        onChange={(e) => onUpdatePlayer({ ...player, currentLocation: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-[10px] font-black text-white uppercase outline-none"
                      />
                    ) : (
                      <div className="text-[10px] font-black text-white uppercase italic truncate">📍 {player.currentLocation || 'Khởi đầu'}</div>
                    )}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/5">
                  <div className="flex justify-between text-[8px] font-black uppercase mb-1">
                    <div className="flex items-center gap-1">
                      <span className="text-rose-500">{player.statLabels?.['health_label'] || meta.hpLabel || 'Sinh Mệnh (HP)'}</span>
                      <LockIcon isLocked={player.lockedFields?.includes('health') || false} onClick={() => onToggleLock?.('health')} />
                    </div>
                    <span className="text-white">{player.health} / {player.maxHealth}</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className="h-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]" 
                      style={{ width: `${Math.min(100, (player.health / player.maxHealth) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* SYSTEM INFO */}
              {(player.systemName || player.systemDescription || isEditing) && (
                <div className={`p-4 rounded-2xl border transition-all ${player.systemName ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/10'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${player.systemName ? 'text-emerald-400' : 'text-neutral-500'}`}>
                      {player.systemName ? 'SYSTEM_DATA_CORE' : 'SYSTEM_OFFLINE'}
                    </span>
                    <LockIcon isLocked={player.lockedFields?.includes('systemName') || false} onClick={() => onToggleLock?.('systemName')} />
                  </div>

                  {isEditing && (
                    <div className="mb-4 pb-4 border-b border-white/5">
                      <button 
                        onClick={() => {
                          if (player.systemName) {
                            onUpdatePlayer({ ...player, systemName: "", systemDescription: "" });
                          } else {
                            onUpdatePlayer({ 
                              ...player, 
                              systemName: "Hệ Thống Vạn Giới", 
                              systemDescription: "Giao diện trung gian giữa não bộ chủ thể và Ma Trận Lượng Tử. Hệ thống cho phép truy cập các chức năng 'Cheat' thực tại, giao nhiệm vụ định mệnh và cung cấp phần thưởng vượt xa quy luật vật lý thông thường." 
                            });
                          }
                        }}
                        className={`w-full py-2 rounded-xl text-[10px] font-black uppercase transition-all ${player.systemName ? 'bg-emerald-500 text-black' : 'bg-white/10 text-emerald-500 border border-emerald-500/30'}`}
                      >
                        {player.systemName ? 'TẮT HỆ THỐNG' : 'BẬT HỆ THỐNG'}
                      </button>
                    </div>
                  )}

                  <div className="space-y-2">
                    {player.systemName ? (
                      isEditing ? (
                        <>
                          <input 
                            value={player.systemName || ''} 
                            onChange={(e) => onUpdatePlayer({ ...player, systemName: e.target.value })}
                            className="w-full bg-black/40 border border-emerald-500/20 rounded px-2 py-1 text-[10px] font-black text-emerald-400 uppercase outline-none"
                            placeholder="Tên hệ thống"
                          />
                          <textarea 
                            value={player.systemDescription || ''} 
                            onChange={(e) => onUpdatePlayer({ ...player, systemDescription: e.target.value })}
                            className="w-full bg-black/40 border border-emerald-500/20 rounded px-2 py-1 text-[9px] font-medium text-emerald-400/60 outline-none resize-none"
                            rows={2}
                            placeholder="Mô tả hệ thống"
                          />
                        </>
                      ) : (
                        <>
                          <div className="text-[10px] font-black text-emerald-400 uppercase">{player.systemName}</div>
                          {player.systemDescription && <p className="text-[9px] text-emerald-400/60 font-medium italic">{player.systemDescription}</p>}
                        </>
                      )
                    ) : isEditing ? (
                      <p className="text-[9px] text-neutral-600 italic">Hệ thống đang ở trạng thái vô hiệu hóa.</p>
                    ) : null}
                  </div>
                </div>
              )}

              {/* PERSONALITY */}
              <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] text-emerald-500/40 font-black uppercase tracking-widest">Tính cách</span>
                  <LockIcon isLocked={player.lockedFields?.includes('personality') || false} onClick={() => onToggleLock?.('personality')} />
                </div>
                {isEditing ? (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1 p-2 bg-black/20 rounded-xl min-h-[40px]">
                      {(player.personality || "").split('+').map(s => s.trim()).filter(Boolean).map((p, idx) => (
                        <div key={idx} className="flex items-center gap-1 px-2 py-1 bg-emerald-500 text-black rounded-lg text-[9px] font-black uppercase">
                          <span>{p}</span>
                          <button 
                            onClick={() => {
                              const current = (player.personality || "").split('+').map(s => s.trim()).filter(Boolean);
                              const next = current.filter((_, i) => i !== idx);
                              onUpdatePlayer({ ...player, personality: next.join(' + ') });
                            }}
                          >✕</button>
                        </div>
                      ))}
                    </div>
                    <input 
                      type="text"
                      placeholder="Thêm tính cách..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[10px] text-white outline-none focus:border-emerald-500"
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
                    <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto custom-scrollbar p-1">
                      {MC_PERSONALITIES.map((p) => {
                        const current = (player.personality || "").split('+').map(s => s.trim()).filter(Boolean);
                        if (current.includes(p)) return null;
                        return (
                          <button
                            key={p}
                            onClick={() => onUpdatePlayer({ ...player, personality: [...current, p].join(' + ') })}
                            className="px-2 py-1 bg-white/5 text-emerald-500/40 border border-white/10 rounded-lg text-[8px] font-black uppercase hover:border-emerald-500/40"
                          >
                            + {p}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {player.personality ? player.personality.split('+').map((p, i) => (
                      <span key={i} className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[9px] text-emerald-400 font-black uppercase">
                        {p.trim()}
                      </span>
                    )) : <span className="text-[9px] text-neutral-700 italic">Trống</span>}
                  </div>
                )}
              </div>

              {/* BACKGROUND ATTRIBUTES */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] text-emerald-500/40 font-black uppercase tracking-widest">Thuộc tính nền tảng</span>
                  {isEditing && (
                    <button 
                      onClick={() => {
                        const newAttrs = [...(player.backgroundAttributes || []), { label: 'THUỘC TÍNH MỚI', value: 'Chưa xác định', icon: '💠' }];
                        onUpdatePlayer({ ...player, backgroundAttributes: newAttrs });
                      }}
                      className="text-[10px] text-emerald-500 font-black uppercase"
                    >
                      + THÊM
                    </button>
                  )}
                </div>
                {(player.backgroundAttributes || []).map((attr, idx) => (
                  <div key={idx} className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl relative group">
                    {isEditing && (
                      <button 
                        onClick={() => {
                          const newAttrs = (player.backgroundAttributes || []).filter((_, i) => i !== idx);
                          onUpdatePlayer({ ...player, backgroundAttributes: newAttrs });
                        }}
                        className="absolute top-2 right-2 text-rose-500"
                      >✕</button>
                    )}
                    <div className="flex items-center justify-between mb-2">
                      {isEditing ? (
                        <div className="flex items-center gap-2 w-full pr-6">
                          <input 
                            value={attr.icon || '💠'} 
                            onChange={(e) => {
                              const newAttrs = [...(player.backgroundAttributes || [])];
                              newAttrs[idx] = { ...attr, icon: e.target.value };
                              onUpdatePlayer({ ...player, backgroundAttributes: newAttrs });
                            }}
                            className="w-6 bg-transparent text-[10px] outline-none"
                          />
                          <input 
                            value={attr.label} 
                            onChange={(e) => {
                              const newAttrs = [...(player.backgroundAttributes || [])];
                              newAttrs[idx] = { ...attr, label: e.target.value };
                              onUpdatePlayer({ ...player, backgroundAttributes: newAttrs });
                            }}
                            className="flex-grow bg-transparent text-[10px] text-emerald-500 font-black uppercase tracking-widest outline-none border-b border-white/10"
                          />
                        </div>
                      ) : (
                        <span className="text-[10px] text-emerald-500/40 font-black uppercase tracking-widest">
                          {attr.icon || '💠'} {attr.label}
                        </span>
                      )}
                      <LockIcon isLocked={player.lockedFields?.includes(`background.${attr.label}`) || false} onClick={() => onToggleLock?.(`background.${attr.label}`)} />
                    </div>
                    {isEditing ? (
                      <textarea 
                        value={attr.value} 
                        onChange={(e) => {
                          const newAttrs = [...(player.backgroundAttributes || [])];
                          newAttrs[idx] = { ...attr, value: e.target.value };
                          onUpdatePlayer({ ...player, backgroundAttributes: newAttrs });
                        }}
                        className="w-full bg-transparent text-xs text-neutral-300 italic leading-relaxed outline-none resize-none"
                        rows={2}
                      />
                    ) : (
                      <p className="text-xs text-neutral-300 italic leading-relaxed">{attr.value || "Chưa xác định"}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="h-10"></div>
          </div>
        ) : (
          <div className="flex-grow flex flex-col min-h-0 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* SUB TABS */}
            <div className="flex overflow-x-auto custom-scrollbar bg-black/40 border-b border-white/5 shrink-0 px-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 min-w-[70px] py-3 flex flex-col items-center gap-1 transition-all relative ${activeTab === tab.id ? 'text-emerald-500' : 'text-neutral-500'}`}
                >
                  <span className="text-sm">{tab.icon}</span>
                  <span className="text-[8px] font-black uppercase tracking-tighter whitespace-nowrap">{tab.label}</span>
                  {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500"></div>}
                </button>
              ))}
            </div>

            {/* SUB CONTENT */}
            <div className="flex-grow overflow-y-auto custom-scrollbar p-2">
              {inspectingItem && (
                <McInspector 
                  item={inspectingItem} 
                  player={player} 
                  onClose={() => setInspectingItem(null)} 
                />
              )}

              <div className="space-y-4">
                {activeTab === 'stats' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
                    <McStatsGrid 
                      player={player} 
                      genre={genre} 
                      isEditing={isEditing}
                      onUpdatePlayer={onUpdatePlayer}
                      onToggleLock={onToggleLock}
                    />
                    
                    <IdentityPanel 
                      identities={player.identities || []}
                      isEditing={isEditing}
                      onUpdate={(identities) => onUpdatePlayer({ ...player, identities })}
                      isLocked={player.lockedFields?.includes('identities')}
                      onToggleLock={() => onToggleLock('identities')}
                    />
                  </div>
                )}

                {activeTab === 'quests' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <McQuestPanel 
                      quests={player.quests} 
                      hasSystem={hasSystem} 
                      systemName={player.systemName || "Thế giới"} 
                      onInspect={setInspectingItem} 
                      playerLevel={player.level}
                      isEditing={isEditing}
                      onUpdatePlayer={(updates) => onUpdatePlayer({ ...player, ...updates })}
                      player={player}
                      onToggleLock={onToggleLock}
                    />
                  </div>
                )}

                {activeTab === 'assets' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <McAssetPanel 
                      gold={player.gold} 
                      assets={player.assets || []} 
                      onInspect={setInspectingItem} 
                      isEditing={isEditing}
                      onUpdatePlayer={(updates) => onUpdatePlayer({ ...player, ...updates })}
                      player={player}
                      onToggleLock={onToggleLock}
                    />
                  </div>
                )}

                {activeTab === 'skills' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <McSkillPanel 
                      skills={player.skills || []} 
                      skillLabel={meta.skillLabel} 
                      onInspect={setInspectingItem} 
                      isEditing={isEditing}
                      onUpdatePlayer={(updates) => onUpdatePlayer({ ...player, ...updates })}
                      isLocked={player.lockedFields?.includes('skills')}
                      onToggleLock={onToggleLock}
                      player={player}
                    />
                  </div>
                )}

                {activeTab === 'inventory' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <McInventoryPanel 
                      inventory={player.inventory || []} 
                      onInspect={setInspectingItem} 
                      isEditing={isEditing}
                      onUpdatePlayer={(updates) => onUpdatePlayer({ ...player, ...updates })}
                      isLocked={player.lockedFields?.includes('inventory')}
                      onToggleLock={() => onToggleLock('inventory')}
                    />
                  </div>
                )}
              </div>
              <div className="h-20"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
