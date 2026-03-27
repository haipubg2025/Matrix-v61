
import React, { useRef, useState, useEffect } from 'react';
import { Relationship, GameGenre, Player, AppSettings, GameTime, StudioParams, GalleryImage } from '../../types';
import { syncAgeAndBirthday } from '../../utils/timeUtils';
import { NpcSidebarBio, LockToggle, NpcSocialColumn, NpcSkillsWidget, NpcInventoryWidget, NpcCustomFieldsWidget } from '../NpcProfileBase';
import { 
  NpcRelationshipDashboard, 
  NpcPsychologyWidget, 
  NpcOpinionWidget, 
  NpcImpressionWidget, 
  NpcSecretsWidget, 
  NpcLogsWidget,
  NpcInnerSelfWidget,
  NpcFetishWidget,
  NpcSexualPreferencesWidget,
  NpcSexualArchetypeWidget
} from '../NpcProfileMental';
import { NpcPhysicalColumn, NpcPrivateWidget, NpcFashionWidget, NpcPhysiologyWidget } from '../NpcProfileAnatomy';
import { IdentityPanel } from '../IdentityPanel';
import { GalleryPicker } from '../GalleryPicker';
import { ResolvedImage } from '../ResolvedImage';
import { DEFAULT_AVATAR } from '../../constants';

interface MobileNpcProfileModalProps {
  npc: Relationship | null;
  player: Player;
  gallery: GalleryImage[];
  isOpen: boolean;
  genre?: GameGenre;
  onClose: () => void;
  onUpdateNpc: (npc: Relationship) => void;
  onDeleteNpc: (id: string) => void;
  onSwitchNpc: (npc: Relationship) => void;
  onUpdateGallery: (gallery: GalleryImage[]) => void;
  markAsViewed?: (id: string, type: 'codex' | 'npc') => void;
  settings: AppSettings;
  themeColor: string;
  handlePrev: () => void;
  handleNext: () => void;
  handleAvatarClick: () => void;
  handleOpenGallery: () => void;
  showGalleryPicker: boolean;
  setShowGalleryPicker: (v: boolean) => void;
  selectFromGallery: (url: string) => void;
  generateAiAvatar: (customPrompt?: string | StudioParams, npcId?: string) => Promise<string | undefined>;
  onInspect?: (data: { name: string; type: any; description?: string }) => void;
  gameTime?: GameTime;
  isUploading: boolean;
}

const CollapsibleSection: React.FC<{
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  themeColor: string;
  children: React.ReactNode;
}> = ({ title, isOpen, onToggle, themeColor, children }) => {
  return (
    <div className="space-y-1.5">
      <button 
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-3 py-3 bg-${themeColor}-500/10 border border-${themeColor}-500/30 rounded-sm active:bg-${themeColor}-500/20 transition-all`}
      >
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 bg-${themeColor}-500 shadow-[0_0_5px_currentColor]`}></div>
          <span className={`text-[11px] font-black text-${themeColor}-400 uppercase tracking-[0.2em]`}>{title}</span>
        </div>
        <span className={`text-${themeColor}-500 text-xs transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      {isOpen && (
        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
          {children}
        </div>
      )}
    </div>
  );
};

export const MobileNpcProfileModal: React.FC<MobileNpcProfileModalProps> = ({
  npc, player, gallery, isOpen, genre, onClose, onUpdateNpc, onSwitchNpc, onUpdateGallery, markAsViewed, settings,
  themeColor, handlePrev, handleNext, handleAvatarClick, handleOpenGallery,
  showGalleryPicker, setShowGalleryPicker, selectFromGallery, onDeleteNpc,
  onInspect, gameTime, isUploading
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    relationship: true,
    psychology: false,
    sexual: false,
    anatomy: false,
    skills: false,
    social: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const expandAll = () => {
    setExpandedSections(Object.keys(expandedSections).reduce((acc, k) => ({ ...acc, [k]: true }), {}));
  };

  const collapseAll = () => {
    setExpandedSections(Object.keys(expandedSections).reduce((acc, k) => ({ ...acc, [k]: false }), {}));
  };

  // Scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && npc && npc.viewed === false && markAsViewed) {
      markAsViewed(npc.id, 'npc');
    }
  }, [isOpen, npc?.id, npc?.viewed, markAsViewed]);

  if (!npc) return null;

  const handleChange = (field: keyof Relationship, value: any) => {
    if (npc) {
      if ((field === 'age' || field === 'birthday') && gameTime?.year !== undefined) {
        const currentYear = gameTime.year;
        const updates = syncAgeAndBirthday(field as 'age' | 'birthday', value, currentYear, npc);
        onUpdateNpc({ ...npc, ...updates });
      } else {
        onUpdateNpc({ ...npc, [field]: value });
      }
    }
  };

  return (
    <div className="MobileNpcProfileModal fixed inset-0 z-[400] bg-black flex flex-col h-full overflow-hidden mono">
      {/* HEADER */}
      <div className={`flex flex-col gap-1 px-2 py-2 border-b border-white/10 bg-${themeColor}-500/[0.06] backdrop-blur-3xl shrink-0`}>
        <div className="flex items-center justify-between w-full gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full bg-${themeColor}-500 shadow-[0_0_8px_currentColor] animate-pulse`}></div>
            <div className="flex items-center gap-1 mr-2">
              <button onClick={handlePrev} className="w-8 h-8 flex items-center justify-center bg-white/5 border border-white/10 rounded-full transition-all text-neutral-400 active:scale-90">❮</button>
              <button onClick={handleNext} className="w-8 h-8 flex items-center justify-center bg-white/5 border border-white/10 rounded-full transition-all text-neutral-400 active:scale-90">❯</button>
            </div>
            <div className="flex flex-col min-w-0">
              {isEditing ? (
                <div className="flex flex-col">
                  <input 
                    value={npc.name} 
                    onChange={(e) => handleChange('name', e.target.value)}
                    className={`bg-transparent text-sm font-black text-${themeColor}-400 tracking-tight uppercase outline-none border-b border-${themeColor}-500/30 w-32`}
                    placeholder="Họ Tên"
                  />
                  <input 
                    value={npc.title || ''} 
                    onChange={(e) => handleChange('title', e.target.value)}
                    className={`bg-transparent text-[9px] font-black text-${themeColor}-500/60 tracking-widest uppercase outline-none border-b border-${themeColor}-500/10 w-32`}
                    placeholder="Danh Hiệu"
                  />
                </div>
              ) : (
                <div className="flex flex-col">
                  <h2 className={`text-[11px] font-black text-${themeColor}-400 tracking-tight uppercase truncate max-w-[140px]`}>
                    {npc.name}
                  </h2>
                  {npc.title && (
                    <span className={`text-[8px] font-black text-${themeColor}-500/60 tracking-widest uppercase truncate max-w-[140px]`}>
                      {npc.title}
                    </span>
                  )}
                </div>
              )}
              <div className="flex items-center gap-1">
                <LockToggle fieldKey="name" npc={npc} onUpdateNpc={onUpdateNpc} />
                <LockToggle fieldKey="title" npc={npc} onUpdateNpc={onUpdateNpc} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsEditing(!isEditing)} 
              className={`p-2.5 transition-all rounded-sm border font-black uppercase text-[10px] shadow-xl active:scale-95 ${isEditing ? `bg-${themeColor}-500 text-black border-${themeColor}-400` : 'bg-white/5 text-neutral-400 border-white/10'}`}
            >
              {isEditing ? '💾' : '✎'}
            </button>
            <button onClick={onClose} className="p-2.5 bg-white/5 text-neutral-400 rounded-sm border border-white/10 font-black uppercase text-[10px] shadow-xl active:scale-95">
              ✕
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 shrink-0">
          {isEditing ? (
            <select 
              value={npc.type} 
              onChange={(e) => handleChange('type', e.target.value)}
              className={`px-2 py-0.5 rounded-sm text-[9px] font-black border border-${themeColor}-500/30 bg-black text-${themeColor}-400 uppercase outline-none`}
            >
              <option value="">Thực thể</option>
            </select>
          ) : (
            <span className={`px-2 py-0.5 rounded-sm text-[9px] font-black border border-${themeColor}-500/30 bg-${themeColor}-500/10 text-${themeColor}-400 uppercase tracking-tighter`}>
              Thực thể
            </span>
          )}
          {isEditing ? (
            <select 
              value={npc.isDead ? 'true' : 'false'} 
              onChange={(e) => handleChange('isDead', e.target.value === 'true')}
              className={`px-2 py-0.5 rounded-sm text-[9px] font-black border border-red-500/30 bg-black text-red-400 uppercase outline-none`}
            >
              <option value="false">Còn Sống</option>
              <option value="true">Đã Chết</option>
            </select>
          ) : npc.isDead ? (
            <span className="px-2 py-0.5 rounded-sm text-[9px] font-black border border-red-500/30 bg-red-500/10 text-red-500 uppercase tracking-tighter">
              ĐÃ CHẾT
            </span>
          ) : null}
          {isEditing ? (
            <select 
              value={npc.isPresent ? 'true' : 'false'} 
              onChange={(e) => handleChange('isPresent', e.target.value === 'true')}
              className={`px-2 py-0.5 rounded-sm text-[9px] font-black border border-white/10 bg-black text-white uppercase outline-none`}
            >
              <option value="true">Hiện Diện</option>
              <option value="false">Vắng Mặt</option>
            </select>
          ) : !npc.isDead && (
            <span className={`px-2 py-0.5 rounded-sm text-[9px] font-black border ${npc.isPresent ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-neutral-500/30 bg-neutral-500/10 text-neutral-400'} uppercase tracking-tighter`}>
              {npc.isPresent ? 'Hiện Diện' : 'Vắng Mặt'}
            </span>
          )}

          {/* MOBILE GENDER, AGE, BIRTHDAY */}
          <div className="flex items-center gap-1.5 border-l border-white/10 pl-1.5 shrink-0">
            {isEditing ? (
              <>
                <input 
                  value={npc.gender || ''} 
                  onChange={(e) => handleChange('gender', e.target.value)}
                  className="px-1.5 py-0.5 rounded-sm text-[9px] font-black border border-white/10 bg-black text-white uppercase outline-none w-12"
                  placeholder="Giới tính"
                />
                <input 
                  type="number"
                  value={npc.age || ''} 
                  onChange={(e) => handleChange('age', parseInt(e.target.value) || 0)}
                  className="px-1.5 py-0.5 rounded-sm text-[9px] font-black border border-white/10 bg-black text-white uppercase outline-none w-10"
                  placeholder="Tuổi"
                />
                <input 
                  value={npc.birthday || ''} 
                  onChange={(e) => handleChange('birthday', e.target.value)}
                  className="px-1.5 py-0.5 rounded-sm text-[9px] font-black border border-white/10 bg-black text-white uppercase outline-none w-16"
                  placeholder="Sinh nhật"
                />
              </>
            ) : (
              <>
                <span className="px-2 py-0.5 rounded-sm text-[9px] font-black border border-white/10 bg-white/5 text-white uppercase tracking-tighter">
                  {npc.gender || '---'}
                </span>
                <span className="px-2 py-0.5 rounded-sm text-[9px] font-black border border-white/10 bg-white/5 text-white uppercase tracking-tighter">
                  {npc.age || '---'}T
                </span>
                <span className="px-2 py-0.5 rounded-sm text-[9px] font-black border border-white/10 bg-white/5 text-white uppercase tracking-tighter">
                  {npc.birthday || '---'}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-grow overflow-y-auto custom-scrollbar flex flex-col relative p-2 space-y-3 pb-32">
        <div className="flex justify-end gap-4 px-1">
          <button onClick={expandAll} className="text-[9px] font-black text-neutral-500 uppercase tracking-widest hover:text-white transition-colors">[+] Mở rộng</button>
          <button onClick={collapseAll} className="text-[9px] font-black text-neutral-500 uppercase tracking-widest hover:text-white transition-colors">[-] Thu gọn</button>
        </div>

        <GalleryPicker 
          player={player}
          gallery={gallery}
          isOpen={showGalleryPicker}
          onClose={() => setShowGalleryPicker(false)}
          onSelect={selectFromGallery}
          settings={settings}
          title="KHO ẢNH NPC"
          themeColor={themeColor}
        />

        {/* AVATAR & BIO */}
        <div className="w-full p-1 bg-black/40 flex flex-col shrink-0 border border-white/10 rounded-sm">
          <div className="relative group mb-1.5 w-full aspect-square rounded-sm border border-white/10 bg-neutral-900 overflow-hidden shrink-0">
            {isUploading ? (
              <div className="h-full flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
                <div className={`w-10 h-10 border-2 border-${themeColor}-500/20 border-t-${themeColor}-500 rounded-full animate-spin mb-4`}></div>
                <span className={`mono text-[10px] text-${themeColor}-400 font-black uppercase animate-pulse`}>ĐANG TẢI...</span>
              </div>
            ) : npc.avatar ? (
              <ResolvedImage src={npc.avatar} alt={npc.name} className="w-full h-full object-cover" loading="lazy" fallback={DEFAULT_AVATAR} />
            ) : (
              <img src={DEFAULT_AVATAR} alt={npc.name} className="w-full h-full object-cover opacity-40" loading="lazy" />
            )}
            <div onClick={handleAvatarClick} className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer z-20">
                <span className="text-white font-black text-[10px] uppercase bg-black/60 px-3 py-1.5 rounded-sm">TẢI ẢNH</span>
            </div>

            <div className="absolute top-2 right-2 z-40">
              <LockToggle fieldKey="avatar" npc={npc} onUpdateNpc={onUpdateNpc} />
            </div>

            <button onClick={handleOpenGallery} className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/80 border border-white/10 rounded-sm text-[10px] font-black uppercase text-white z-30">
              THƯ VIỆN
            </button>
          </div>

          <NpcSidebarBio 
            npc={npc} 
            themeColor={themeColor} 
            genre={genre} 
            isEditing={isEditing}
            onUpdateNpc={onUpdateNpc}
          />
        </div>

        {/* ALL WIDGETS - COLLAPSIBLE SECTIONS */}
        <CollapsibleSection 
          title="QUAN HỆ & CẢM XÚC" 
          isOpen={expandedSections.relationship} 
          onToggle={() => toggleSection('relationship')}
          themeColor={themeColor}
        >
          <NpcRelationshipDashboard 
            npc={npc} 
            isEditing={isEditing}
            onUpdateNpc={onUpdateNpc}
          />
          <NpcOpinionWidget 
            npc={npc} 
            isEditing={isEditing}
            onUpdateNpc={onUpdateNpc}
          />
          <NpcImpressionWidget 
            npc={npc} 
            themeColor={themeColor} 
            isEditing={isEditing}
            onUpdateNpc={onUpdateNpc}
          />
        </CollapsibleSection>

        <CollapsibleSection 
          title="TÂM LÝ & DANH TÍNH" 
          isOpen={expandedSections.psychology} 
          onToggle={() => toggleSection('psychology')}
          themeColor={themeColor}
        >
          <IdentityPanel 
            identities={npc.identities || []}
            isEditing={isEditing}
            onUpdate={(identities) => onUpdateNpc({ ...npc, identities })}
            isLocked={npc.lockedFields?.includes('identities')}
            onToggleLock={() => {
              const currentLocked = npc.lockedFields || [];
              const isLocked = currentLocked.includes('identities');
              const newLocked = isLocked 
                ? currentLocked.filter(f => f !== 'identities')
                : [...currentLocked, 'identities'];
              onUpdateNpc({ ...npc, lockedFields: newLocked });
            }}
          />
          <NpcPsychologyWidget 
            npc={npc} 
            isEditing={isEditing}
            onUpdateNpc={onUpdateNpc}
          />
          <NpcInnerSelfWidget 
            npc={npc} 
            isEditing={isEditing}
            onUpdateNpc={onUpdateNpc}
          />
          <NpcSecretsWidget 
            npc={npc} 
            isEditing={isEditing}
            onUpdateNpc={onUpdateNpc}
          />
        </CollapsibleSection>

        <CollapsibleSection 
          title="SỞ THÍCH & FETISH" 
          isOpen={expandedSections.sexual} 
          onToggle={() => toggleSection('sexual')}
          themeColor={themeColor}
        >
          <NpcFetishWidget 
            npc={npc} 
            isEditing={isEditing}
            onUpdateNpc={onUpdateNpc}
          />
          <NpcSexualPreferencesWidget 
            npc={npc} 
            isEditing={isEditing}
            onUpdateNpc={onUpdateNpc}
          />
          <NpcSexualArchetypeWidget 
            npc={npc} 
            isEditing={isEditing}
            onUpdateNpc={onUpdateNpc}
          />
        </CollapsibleSection>

        <CollapsibleSection 
          title="HÌNH THỂ & TRANG PHỤC" 
          isOpen={expandedSections.anatomy} 
          onToggle={() => toggleSection('anatomy')}
          themeColor={themeColor}
        >
          <NpcPhysicalColumn 
            npc={npc} 
            themeColor={themeColor} 
            isEditing={isEditing}
            onUpdateNpc={onUpdateNpc}
          />
          <NpcFashionWidget 
            npc={npc} 
            isEditing={isEditing}
            onUpdateNpc={onUpdateNpc}
          />
          <NpcPhysiologyWidget 
            npc={npc} 
            isEditing={isEditing}
            onUpdateNpc={onUpdateNpc}
          />
          <NpcPrivateWidget 
            npc={npc} 
            isEditing={isEditing}
            onUpdateNpc={onUpdateNpc}
          />
        </CollapsibleSection>

        <CollapsibleSection 
          title="KỸ NĂNG & HÀNH TRANG" 
          isOpen={expandedSections.skills} 
          onToggle={() => toggleSection('skills')}
          themeColor={themeColor}
        >
          <NpcSkillsWidget 
            npc={npc} 
            genre={genre}
            isEditing={isEditing}
            onUpdateNpc={onUpdateNpc}
            onInspect={onInspect}
          />
          <NpcInventoryWidget 
            npc={npc}
            isEditing={isEditing}
            onUpdateNpc={onUpdateNpc}
            onInspect={onInspect}
          />
          <NpcCustomFieldsWidget 
            npc={npc}
            isEditing={isEditing}
            onUpdateNpc={onUpdateNpc}
            onInspect={onInspect}
          />
        </CollapsibleSection>

        <CollapsibleSection 
          title="XÃ HỘI & NHẬT KÝ" 
          isOpen={expandedSections.social} 
          onToggle={() => toggleSection('social')}
          themeColor={themeColor}
        >
          <NpcSocialColumn 
            npc={npc} 
            player={player} 
            onSwitchNpc={onSwitchNpc} 
            isEditing={isEditing}
            onUpdateNpc={onUpdateNpc}
          />
          <NpcLogsWidget 
            npc={npc} 
            isEditing={isEditing}
            onUpdateNpc={onUpdateNpc}
          />
        </CollapsibleSection>

        {isEditing && (
          <div className="pt-8 pb-4 px-2">
            <button 
              onClick={() => {
                onDeleteNpc(npc.id);
              }}
              className="w-full py-4 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-black transition-all rounded-xl border border-rose-500/40 font-black uppercase text-xs shadow-xl active:scale-95 flex items-center justify-center gap-3"
            >
              <span>🗑</span>
              <span>XÓA NHÂN VẬT KHỎI THỰC TẠI</span>
            </button>
            <p className="text-[8px] text-rose-500/60 text-center mt-2 font-black uppercase tracking-widest">Cảnh báo: Hành động này không thể hoàn tác</p>
          </div>
        )}
      </div>
    </div>
  );
};
