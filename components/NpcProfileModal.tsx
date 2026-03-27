
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Relationship, GameGenre, Player, AppSettings, GameTime, GalleryImage } from '../types';
import { syncAgeAndBirthday } from '../utils/timeUtils';
import { NpcSidebarBio, NpcSocialColumn, renderSafeText, LockToggle, NpcSkillsWidget, NpcInventoryWidget, NpcCustomFieldsWidget } from './NpcProfileBase';
import { IdentityPanel } from './IdentityPanel';
import { McInspector, InspectType } from './McModal/McInspector';
import { AiImageStudio } from './AiImageStudio';
import { StudioParams } from '../types';
import { NpcPhysicalColumn, NpcPrivateWidget, NpcFashionWidget, NpcPhysiologyWidget } from './NpcProfileAnatomy';
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
} from './NpcProfileMental';
import { uploadImage, uploadImageFromUrl, fetchUserImages } from '../services/uploadService';
import { MobileNpcProfileModal } from './Mobile/MobileNpcProfileModal';
import { GalleryPicker } from './GalleryPicker';
import { ResolvedImage } from './ResolvedImage';
import { DEFAULT_AVATAR } from '../constants';

interface Props {
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
  generateAiAvatar: (customPrompt?: string | StudioParams, npcId?: string) => Promise<string | undefined>;
  settings: AppSettings;
  gameTime?: GameTime;
}

export const NpcProfileModal: React.FC<Props> = ({ npc, player, gallery, isOpen, genre, onClose, onUpdateNpc, onDeleteNpc, onSwitchNpc, onUpdateGallery, markAsViewed, generateAiAvatar, settings, gameTime }) => {
  const isMobile = settings.mobileMode;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showGalleryPicker, setShowGalleryPicker] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [showStudio, setShowStudio] = useState(false);
  const [uploadMode, setUploadMode] = useState<'cloud' | 'local'>('cloud');
  const [tempUrl, setTempUrl] = useState('');
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

  const handlePrev = useCallback(() => {
    if (!npc || player.relationships.length <= 1) return;
    const currentIndex = player.relationships.findIndex(r => r.id === npc.id);
    const prevIndex = (currentIndex - 1 + player.relationships.length) % player.relationships.length;
    onSwitchNpc(player.relationships[prevIndex]);
  }, [npc, player.relationships, onSwitchNpc]);

  const handleNext = useCallback(() => {
    if (!npc || player.relationships.length <= 1) return;
    const currentIndex = player.relationships.findIndex(r => r.id === npc.id);
    const nextIndex = (currentIndex + 1) % player.relationships.length;
    onSwitchNpc(player.relationships[nextIndex]);
  }, [npc, player.relationships, onSwitchNpc]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handlePrev, handleNext]);

  useEffect(() => {
    if (isOpen && npc && npc.viewed === false && markAsViewed) {
      markAsViewed(npc.id, 'npc');
    }
  }, [isOpen, npc?.id, npc?.viewed, markAsViewed]);

  if (!isOpen || !npc) return null;

  const handleOpenGallery = () => {
    setShowGalleryPicker(true);
  };

  // SỬ DỤNG STRICT CHECK ĐỂ ĐẢM BẢO NPC CHƯA GẶP KHÔNG BỊ LỘ THÔNG TIN
  const themeColor = 'cyan';

  const handleAvatarClick = () => {
    setShowAvatarMenu(true);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
    setShowAvatarMenu(false);
  };

  const handleUrlSubmit = async () => {
    if (tempUrl.trim() && npc) {
      const url = tempUrl.trim();
      setIsUploading(true);
      try {
        const finalUrl = await uploadImageFromUrl(url, uploadMode);
        
        const currentLocks = npc.lockedFields || [];
        const nextLocks = currentLocks.includes('avatar') ? currentLocks : [...currentLocks, 'avatar'];
        onUpdateNpc({ ...npc, avatar: finalUrl, lockedFields: nextLocks });
        
        // Add to gallery if not exists
        const existing = gallery.find(g => g.url === finalUrl);
        if (!existing) {
          onUpdateGallery([{ 
            url: finalUrl, 
            tags: finalUrl === url ? [npc.name, "external"] : [npc.name, uploadMode === 'cloud' ? "cloud" : "local"], 
            genre: genre 
          }, ...gallery]);
        }
        
        setShowUrlInput(false);
        setTempUrl('');
      } catch (error) {
        console.error("URL submit failed:", error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleChange = (field: keyof Relationship, value: any) => {
    if (npc) {
      // Clear lastChanges for this field when manually edited to avoid UI conflict
      const newLastChanges = { ...(npc.lastChanges || {}) };
      delete newLastChanges[field];

      if ((field === 'age' || field === 'birthday') && gameTime?.year !== undefined) {
        const currentYear = gameTime.year;
        const updates = syncAgeAndBirthday(field as 'age' | 'birthday', value, currentYear, npc);
        onUpdateNpc({ ...npc, ...updates, lastChanges: newLastChanges });
      } else {
        onUpdateNpc({ ...npc, [field]: value, lastChanges: newLastChanges });
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && npc) {
      try {
        setIsUploading(true);
        console.log("Starting avatar upload for NPC:", npc.name, npc.id, "Mode:", uploadMode);
        const imageUrl = await uploadImage(file, uploadMode);
        console.log("Avatar upload successful, URL length:", imageUrl.length);
        
        // Add to gallery if not exists
        const existing = gallery.find(g => g.url === imageUrl);
        if (!existing) {
          onUpdateGallery([{ url: imageUrl, tags: [npc.name], genre: genre }, ...gallery]);
        }
        
        const currentLocks = npc.lockedFields || [];
        const nextLocks = currentLocks.includes('avatar') ? currentLocks : [...currentLocks, 'avatar'];
        onUpdateNpc({ ...npc, avatar: imageUrl, lockedFields: nextLocks });
      } catch (error) {
        console.error("Avatar upload failed:", error);
        alert("Không thể tải ảnh lên. Vui lòng thử lại hoặc kiểm tra định dạng ảnh.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const selectFromGallery = (img: string) => {
    const currentLocks = npc.lockedFields || [];
    const nextLocks = currentLocks.includes('avatar') ? currentLocks : [...currentLocks, 'avatar'];
    onUpdateNpc({ ...npc, avatar: img, lockedFields: nextLocks });
    
    // Add to gallery if not exists
    const existing = gallery.find(g => g.url === img);
    if (!existing) {
      onUpdateGallery([{ url: img, tags: [npc.name], genre: genre }, ...gallery]);
    }
    
    setShowGalleryPicker(false);
  };

  const handleAiGenerate = async (params?: StudioParams) => {
    if (!npc) return;
    setShowAvatarMenu(false);
    setShowStudio(false);
    const url = await generateAiAvatar(params, npc.id);
    if (url) {
      const currentLocks = npc.lockedFields || [];
      const nextLocks = currentLocks.includes('avatar') ? currentLocks : [...currentLocks, 'avatar'];
      onUpdateNpc({ ...npc, avatar: url, lockedFields: nextLocks });
    }
  };

  const commonElements = (
    <>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
      
      <AiImageStudio 
        isOpen={showStudio}
        onClose={() => setShowStudio(false)}
        onGenerate={handleAiGenerate}
        playerName={npc.name}
        playerGender={npc.gender || 'Bí mật'}
        playerAge={parseInt(String(npc.age)) || 0}
        playerPersonality={npc.personality || 'Chưa rõ'}
        currentLocation={npc.lastLocation || 'Chưa rõ'}
        genre={genre}
        settings={settings}
        themeColor={themeColor}
      />

      {showAvatarMenu && (
        <div className="fixed inset-0 z-[1001] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-neutral-900 border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <h3 className={`text-xl font-black text-${themeColor}-400 uppercase tracking-widest`}>TÙY CHỌN ẢNH</h3>
              <button onClick={() => setShowAvatarMenu(false)} className="text-neutral-500 hover:text-white transition-colors">✕</button>
            </div>
            
            <div className="space-y-4">
              <button 
                onClick={() => { setShowAvatarMenu(false); setShowStudio(true); }}
                className={`w-full py-4 bg-${themeColor}-500/10 hover:bg-${themeColor}-500/20 border border-${themeColor}-500/40 rounded-xl text-${themeColor}-400 font-black uppercase text-xs transition-all flex items-center justify-center gap-3 shadow-[0_0_15px_rgba(var(--theme-rgb),0.1)]`}
              >
                <span>✨</span> AI GENERATE (STUDIO)
              </button>

              <button 
                onClick={() => handleAiGenerate()}
                className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-black uppercase text-xs transition-all flex items-center justify-center gap-3"
              >
                <span>⚡</span> AI GENERATE (QUICK)
              </button>

              <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-3">
                <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2">1. TẢI ẢNH LÊN</p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setUploadMode('cloud'); triggerFileInput(); }}
                    className={`flex-1 py-3 rounded-lg border font-black uppercase text-[10px] transition-all ${uploadMode === 'cloud' ? `bg-${themeColor}-500 text-black border-${themeColor}-400` : 'bg-white/5 text-white border-white/10 hover:bg-white/10'}`}
                  >
                    ☁️ CLOUD (FIREBASE)
                  </button>
                  <button 
                    onClick={() => { setUploadMode('local'); triggerFileInput(); }}
                    className={`flex-1 py-3 rounded-lg border font-black uppercase text-[10px] transition-all ${uploadMode === 'local' ? `bg-${themeColor}-500 text-black border-${themeColor}-400` : 'bg-white/5 text-white border-white/10 hover:bg-white/10'}`}
                  >
                    💾 LOCAL (INDEXEDDB)
                  </button>
                </div>
                <p className="text-[8px] text-neutral-600 italic">Lưu ý: Local sẽ lưu trực tiếp vào trình duyệt của bạn, không tốn dung lượng cloud.</p>
              </div>

              <button 
                onClick={() => { setShowAvatarMenu(false); setShowUrlInput(true); }}
                className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-black uppercase text-xs transition-all flex items-center justify-center gap-3"
              >
                <span>🔗</span> DÁN URL ẢNH TRỰC TIẾP
              </button>

              <button 
                onClick={() => { setShowAvatarMenu(false); handleOpenGallery(); }}
                className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-black uppercase text-xs transition-all flex items-center justify-center gap-3"
              >
                <span>🖼️</span> CHỌN TỪ THƯ VIỆN ẢNH
              </button>
            </div>

            <button 
              onClick={() => setShowAvatarMenu(false)}
              className="w-full py-3 text-neutral-500 font-black uppercase text-[10px] tracking-widest hover:text-white transition-colors"
            >
              HỦY BỎ
            </button>
          </div>
        </div>
      )}

      {showUrlInput && (
        <div className="fixed inset-0 z-[1001] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-neutral-900 border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            <h3 className={`text-xl font-black text-${themeColor}-400 uppercase tracking-widest border-b border-white/5 pb-4`}>DÁN URL ẢNH</h3>
            <div className="space-y-4">
              <input 
                autoFocus
                value={tempUrl}
                onChange={(e) => setTempUrl(e.target.value)}
                placeholder="https://example.com/image.png"
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-4 text-white text-sm outline-none focus:border-emerald-500 transition-all"
              />
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowUrlInput(false)}
                  className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-neutral-400 font-black uppercase text-xs transition-all"
                >
                  HỦY
                </button>
                <button 
                  onClick={handleUrlSubmit}
                  className={`flex-1 py-4 bg-${themeColor}-500 text-black font-black uppercase text-xs rounded-xl hover:opacity-90 transition-all`}
                >
                  XÁC NHẬN
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isUploading && (
        <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
          <span className="text-emerald-500 font-black uppercase tracking-[0.4em] text-xs animate-pulse">Đang tải ảnh...</span>
        </div>
      )}
    </>
  );

  if (isMobile) {
    return (
      <>
        {commonElements}
        <MobileNpcProfileModal 
          npc={npc}
          player={player}
          gallery={gallery}
          isOpen={isOpen}
          genre={genre}
          onClose={onClose}
          onUpdateNpc={onUpdateNpc}
          onUpdateGallery={onUpdateGallery}
          onDeleteNpc={onDeleteNpc}
          onSwitchNpc={onSwitchNpc}
          markAsViewed={markAsViewed}
          generateAiAvatar={generateAiAvatar}
          onInspect={setInspectingItem}
          settings={settings}
          themeColor={themeColor}
          handlePrev={handlePrev}
          handleNext={handleNext}
          handleAvatarClick={handleAvatarClick}
          handleOpenGallery={handleOpenGallery}
          showGalleryPicker={showGalleryPicker}
          setShowGalleryPicker={setShowGalleryPicker}
          selectFromGallery={selectFromGallery}
          gameTime={gameTime}
          isUploading={isUploading}
        />
      </>
    );
  }

  // --- GIAO DIỆN CHO NPC ĐÃ GẶP (ĐẦY ĐỦ THÔNG TIN) ---
  return (
    <div className="NpcProfileModal fixed inset-0 z-[400] bg-[var(--bg)] flex flex-col animate-in fade-in duration-200 overflow-hidden mono">
      {commonElements}


      <div className={`flex ${isMobile ? 'flex-col gap-2' : 'justify-between items-center'} px-4 py-2 border-b border-white/10 bg-${themeColor}-500/[0.06] backdrop-blur-3xl shrink-0`}>
        <div className="flex items-center justify-between w-full md:w-auto gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full bg-${themeColor}-500 shadow-[0_0_8px_currentColor] animate-pulse`}></div>
            
            {/* NAVIGATION BUTTONS */}
            <div className="flex items-center gap-1 mr-2">
              <button onClick={handlePrev} className={`w-7 h-7 flex items-center justify-center bg-white/5 hover:bg-${themeColor}-500/20 border border-white/10 rounded-full transition-all text-neutral-400 hover:text-${themeColor}-400`}>
                ❮
              </button>
              <button onClick={handleNext} className={`w-7 h-7 flex items-center justify-center bg-white/5 hover:bg-${themeColor}-500/20 border border-white/10 rounded-full transition-all text-neutral-400 hover:text-${themeColor}-400`}>
                ❯
              </button>
            </div>

            <div className="flex items-baseline gap-4">
              <div className="flex items-baseline">
                {isEditing ? (
                  <input 
                    value={npc.name} 
                    onChange={(e) => handleChange('name', e.target.value)}
                    className={`bg-transparent text-sm md:text-base font-black text-${themeColor}-400 tracking-tight uppercase outline-none border-b border-${themeColor}-500/30 focus:border-${themeColor}-500 w-32 md:w-auto`}
                  />
                ) : (
                  <h2 className={`text-[10px] md:text-base font-black text-${themeColor}-400 tracking-tight uppercase truncate max-w-[120px] md:max-w-none`}>
                    {npc.name}
                  </h2>
                )}
                <LockToggle fieldKey="name" npc={npc} onUpdateNpc={onUpdateNpc} />
              </div>

              {!isMobile && (
                <div className="flex items-center gap-3 border-l border-white/10 pl-4">
                  {/* GENDER */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-neutral-500 font-black uppercase">Giới tính:</span>
                    {isEditing ? (
                      <input 
                        value={npc.gender || ''} 
                        onChange={(e) => handleChange('gender', e.target.value)}
                        className={`bg-transparent text-[10px] font-black text-white uppercase outline-none border-b border-white/10 w-16`}
                      />
                    ) : (
                      <span className="text-[10px] font-black text-white uppercase">{npc.gender || '---'}</span>
                    )}
                    <LockToggle fieldKey="gender" npc={npc} onUpdateNpc={onUpdateNpc} />
                  </div>

                  {/* AGE */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-neutral-500 font-black uppercase">Tuổi:</span>
                    {isEditing ? (
                      <input 
                        type="number"
                        value={npc.age || ''} 
                        onChange={(e) => handleChange('age', parseInt(e.target.value) || 0)}
                        className={`bg-transparent text-[10px] font-black text-white uppercase outline-none border-b border-white/10 w-12`}
                      />
                    ) : (
                      <span className="text-[10px] font-black text-white uppercase">{npc.age || '---'}</span>
                    )}
                    <LockToggle fieldKey="age" npc={npc} onUpdateNpc={onUpdateNpc} />
                  </div>

                  {/* BIRTHDAY */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-neutral-500 font-black uppercase">Sinh nhật:</span>
                    {isEditing ? (
                      <input 
                        value={npc.birthday || ''} 
                        onChange={(e) => handleChange('birthday', e.target.value)}
                        className={`bg-transparent text-[10px] font-black text-white uppercase outline-none border-b border-white/10 w-24`}
                      />
                    ) : (
                      <span className="text-[10px] font-black text-white uppercase">{npc.birthday || '---'}</span>
                    )}
                    <LockToggle fieldKey="birthday" npc={npc} onUpdateNpc={onUpdateNpc} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {isMobile && (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsEditing(!isEditing)} 
                className={`p-2 transition-all rounded-sm border font-black uppercase text-[10px] shadow-xl active:scale-95 ${
                  isEditing 
                    ? `bg-${themeColor}-500 text-black border-${themeColor}-400` 
                    : 'bg-white/5 text-neutral-400 border-white/10'
                }`}
              >
                {isEditing ? '💾' : '✎'}
              </button>
              <button onClick={onClose} className="p-2 bg-white/5 text-neutral-400 rounded-sm border border-white/10 font-black uppercase text-[10px] shadow-xl active:scale-95">
                ✕
              </button>
            </div>
          )}
        </div>

        <div className={`flex items-center gap-3 ${isMobile ? 'overflow-x-auto custom-scrollbar pb-1' : ''}`}>
           {/* NHÃN NPC - QUẢN LÝ TRẠNG THÁI & PHÂN LOẠI */}
           <div className="flex items-center gap-1.5 mr-2 shrink-0">
              {isEditing ? (
                <>
                  {npc.type === 'family' && (
                    <select 
                      value={npc.type} 
                      onChange={(e) => handleChange('type', e.target.value)}
                      className={`px-2 py-0.5 rounded-sm text-[9px] font-black border border-${themeColor}-500/30 bg-black text-${themeColor}-400 uppercase outline-none`}
                    >
                      <option value="family">Gia Đình</option>
                    </select>
                  )}
                  <select 
                    value={npc.isDead ? 'true' : 'false'} 
                    onChange={(e) => handleChange('isDead', e.target.value === 'true')}
                    className={`px-2 py-0.5 rounded-sm text-[9px] font-black border border-red-500/30 bg-black text-red-400 uppercase outline-none`}
                  >
                    <option value="false">Còn Sống</option>
                    <option value="true">Đã Chết</option>
                  </select>
                  <select 
                    value={npc.isPresent ? 'true' : 'false'} 
                    onChange={(e) => handleChange('isPresent', e.target.value === 'true')}
                    className={`px-2 py-0.5 rounded-sm text-[9px] font-black border border-emerald-500/30 bg-black text-emerald-400 uppercase outline-none`}
                  >
                    <option value="true">Hiện Diện</option>
                    <option value="false">Vắng Mặt</option>
                  </select>
                  <input 
                    value={npc.status || ''} 
                    onChange={(e) => handleChange('status', e.target.value)}
                    className="px-2 py-0.5 rounded-sm text-[9px] font-black border border-cyan-500/30 bg-black text-cyan-400 uppercase outline-none w-24 md:w-32"
                    placeholder="Hoạt động"
                  />
                </>
              ) : (
                <>
                  {npc.type === 'family' && (
                    <span className={`px-2 py-0.5 rounded-sm text-[9px] font-black border border-${themeColor}-500/30 bg-${themeColor}-500/10 text-${themeColor}-400 uppercase tracking-tighter shadow-sm`}>
                      Gia Đình
                    </span>
                  )}
                  {npc.isDead ? (
                    <span className="px-2 py-0.5 rounded-sm text-[9px] font-black border border-red-500/30 bg-red-500/10 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.1)] uppercase tracking-tighter">
                      ĐÃ CHẾT
                    </span>
                  ) : (
                    <span className={`px-2 py-0.5 rounded-sm text-[9px] font-black border ${npc.isPresent ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 'border-neutral-500/30 bg-neutral-500/10 text-neutral-400'} uppercase tracking-tighter`}>
                      {npc.isPresent ? 'Hiện Diện' : 'Vắng Mặt'}
                    </span>
                  )}
                </>
              )}
           </div>

           {!isMobile && (
             <>
               <button 
                 onClick={() => setIsEditing(!isEditing)} 
                 className={`px-4 py-1.5 transition-all rounded-sm border font-black uppercase text-sm shadow-xl active:scale-95 ${
                   isEditing 
                     ? `bg-${themeColor}-500 text-black border-${themeColor}-400` 
                     : 'bg-white/5 text-neutral-400 border-white/10 hover:bg-white/10'
                 }`}
               >
                 {isEditing ? '💾 LƯU' : '✎ SỬA'}
               </button>

               <button onClick={onClose} className="px-4 py-1.5 bg-white/5 hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400 transition-all rounded-sm border border-white/10 font-black uppercase text-sm shadow-xl active:scale-95">
                 [ESC] ĐÓNG
               </button>
             </>
           )}
        </div>
      </div>

      <div className={`flex flex-grow overflow-hidden relative ${isMobile ? 'flex-col overflow-y-auto custom-scrollbar' : ''}`}>
        <GalleryPicker 
          player={player}
          gallery={gallery}
          isOpen={showGalleryPicker}
          onClose={() => setShowGalleryPicker(false)}
          onSelect={selectFromGallery}
          settings={settings}
          title={`THƯ VIỆN ẢNH // ${npc.name}`}
          themeColor={themeColor}
        />

        {/* SIDEBAR */}
        <div className={`${isMobile ? 'w-full' : 'w-80 border-r'} border-white/10 bg-black/40 flex flex-col shrink-0 overflow-y-auto custom-scrollbar p-1.5`}>
          <div className={`relative group mb-1.5 w-full ${isMobile ? 'aspect-square' : 'aspect-[2/3]'} rounded-sm border border-white/10 bg-neutral-900 overflow-hidden shrink-0`}>
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
            
            <div onClick={handleAvatarClick} className={`absolute inset-0 bg-${themeColor}-500/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer z-20 transition-opacity backdrop-blur-sm`}>
                <span className="text-white font-black text-sm uppercase bg-black/60 px-4 py-2 rounded-sm">TẢI ẢNH MỚI</span>
            </div>

            <div className="absolute top-2 right-2 z-40">
              <LockToggle fieldKey="avatar" npc={npc} onUpdateNpc={onUpdateNpc} />
            </div>

            <button onClick={handleOpenGallery} className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/80 border border-white/10 rounded-sm text-sm font-black uppercase text-white z-30 whitespace-nowrap shadow-xl">
              THƯ VIỆN ẢNH
            </button>
          </div>

          <NpcSidebarBio 
            npc={npc} 
            themeColor={themeColor} 
            genre={genre} 
            isEditing={isEditing}
            onUpdateNpc={onUpdateNpc}
          />

          {isEditing && (
            <div className="mt-8 p-4 bg-rose-500/5 border border-rose-500/20 rounded-xl">
              <h4 className="text-[10px] font-black text-rose-500 uppercase mb-3 tracking-widest">Khu Vực Nguy Hiểm</h4>
              <button 
                onClick={() => {
                  onDeleteNpc(npc.id);
                }}
                className="w-full py-3 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-black transition-all rounded-lg border border-rose-500/40 font-black uppercase text-[10px] shadow-xl active:scale-95 flex items-center justify-center gap-2"
              >
                <span>🗑</span>
                <span>XÓA NHÂN VẬT</span>
              </button>
            </div>
          )}
        </div>

        {/* MAIN CONTENT */}
        <div className={`flex-grow p-1.5 ${isMobile ? '' : 'overflow-y-auto custom-scrollbar'} relative`}>
          <div className={`grid grid-cols-1 ${isMobile ? '' : 'xl:grid-cols-3'} gap-1.5 items-start`}>
              <div className="space-y-1.5">
                  <NpcRelationshipDashboard 
                    npc={npc} 
                    isEditing={isEditing}
                    onUpdateNpc={onUpdateNpc}
                  />
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
                  <NpcSkillsWidget 
                    npc={npc} 
                    genre={genre}
                    isEditing={isEditing}
                    onUpdateNpc={onUpdateNpc}
                    onInspect={setInspectingItem}
                  />
                  <NpcLogsWidget 
                    npc={npc} 
                    isEditing={isEditing}
                    onUpdateNpc={onUpdateNpc}
                  />
              </div>

              <div className="space-y-1.5">
                  <NpcSocialColumn 
                    npc={npc} 
                    player={player} 
                    onSwitchNpc={onSwitchNpc} 
                    isEditing={isEditing}
                    onUpdateNpc={onUpdateNpc}
                  />
                  <NpcInnerSelfWidget 
                    npc={npc} 
                    isEditing={isEditing}
                    onUpdateNpc={onUpdateNpc}
                  />
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
                  <NpcPhysicalColumn 
                    npc={npc} 
                    themeColor={themeColor} 
                    isEditing={isEditing}
                    onUpdateNpc={onUpdateNpc}
                  />
              </div>

              <div className="space-y-1.5">
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
                  <NpcPsychologyWidget 
                    npc={npc} 
                    isEditing={isEditing}
                    onUpdateNpc={onUpdateNpc}
                  />
                  <NpcSecretsWidget 
                    npc={npc} 
                    isEditing={isEditing}
                    onUpdateNpc={onUpdateNpc}
                  />
                  <NpcPrivateWidget 
                    npc={npc} 
                    isEditing={isEditing}
                    onUpdateNpc={onUpdateNpc}
                  />
              </div>
          </div>
          
          {/* BOTTOM WIDGETS */}
          <div className="mt-1.5 space-y-1.5">
            <NpcInventoryWidget 
              npc={npc}
              isEditing={isEditing}
              onUpdateNpc={onUpdateNpc}
              onInspect={setInspectingItem}
            />
            <NpcCustomFieldsWidget 
              npc={npc}
              isEditing={isEditing}
              onUpdateNpc={onUpdateNpc}
              onInspect={setInspectingItem}
            />
          </div>
        </div>
      </div>
      {inspectingItem && (
        <McInspector 
          item={inspectingItem} 
          player={player} 
          onClose={() => setInspectingItem(null)} 
        />
      )}
    </div>
  );
};
