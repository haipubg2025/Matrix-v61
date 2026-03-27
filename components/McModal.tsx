
import React, { useRef, useState, useEffect } from 'react';
import { Player, GameGenre, GalleryImage, getGenreMeta, AppSettings, GameTime, StudioParams } from '../types';
import { McHeader } from './McModal/McHeader';
import { McStatsGrid } from './McModal/McStatsGrid';
import { McInspector, InspectType } from './McModal/McInspector';
import { McSidebar } from './McModal/McSidebar';
import { McQuestPanel } from './McModal/McQuestPanel';
import { McAssetPanel } from './McModal/McAssetPanel';
import { McSkillPanel } from './McModal/McSkillPanel';
import { McInventoryPanel } from './McModal/McInventoryPanel';
import { IdentityPanel } from './IdentityPanel';
import { uploadImage, uploadImageFromUrl, fetchUserImages } from '../services/uploadService';
import { MobileMcModal } from './Mobile/MobileMcModal';
import { GalleryPicker } from './GalleryPicker';
import { AiImageStudio } from './AiImageStudio';

interface Props {
  player: Player;
  gallery: GalleryImage[];
  genre?: GameGenre;
  isOpen: boolean;
  onClose: () => void;
  onUpdatePlayer: (player: Player) => void;
  onUpdateGallery: (gallery: GalleryImage[]) => void;
  settings: AppSettings;
  initialEditing?: boolean;
  gameTime?: GameTime;
  isGameStarted?: boolean;
  onToggleLock?: (field: string) => void;
  onGenerateAvatar?: (customPrompt?: string | StudioParams) => Promise<string | undefined>;
  worldTitle?: string;
}

export const McModal: React.FC<Props> = ({ 
  player, gallery, genre, isOpen, onClose, onUpdatePlayer, onUpdateGallery, settings, 
  initialEditing = false, gameTime, isGameStarted = false,
  onToggleLock, onGenerateAvatar, worldTitle
}) => {
  const isMobile = settings.mobileMode;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(initialEditing);

  useEffect(() => {
    if (isOpen) {
      setIsEditing(initialEditing);
    }
  }, [isOpen, initialEditing]);

  const [isUploading, setIsUploading] = useState(false);
  const [showGalleryPicker, setShowGalleryPicker] = useState(false);
  const [showStudio, setShowStudio] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
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

  useEffect(() => {
    if (isOpen && player.newFields && player.newFields.length > 0) {
      onUpdatePlayer({
        ...player,
        newFields: []
      });
    }
  }, [isOpen, player.newFields?.length]);

  const handleExport = () => {
    const dataStr = JSON.stringify(player, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const worldName = (worldTitle || 'UnknownWorld').replace(/\s+/g, '_');
    const playerName = (player.name || 'Unknown').replace(/\s+/g, '_');
    const turnCount = player.turnCount || 0;
    const exportFileDefaultName = `Matrix_${worldName}_${playerName}_Turn${turnCount}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedPlayer = JSON.parse(event.target?.result as string);
        onUpdatePlayer({
          ...player,
          ...importedPlayer,
          relationships: importedPlayer.relationships || player.relationships,
        });
        if (importedPlayer.gallery) {
          onUpdateGallery(importedPlayer.gallery);
        }
        // Success import
      } catch (error) {
        console.error("Import error:", error);
        // Invalid file
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  if (!isOpen) return null;

  const handleOpenGallery = () => {
    setShowGalleryPicker(true);
  };

  const selectFromGallery = (img: string) => {
    const currentLocks = player.lockedFields || [];
    const nextLocks = currentLocks.includes('avatar') ? currentLocks : [...currentLocks, 'avatar'];
    onUpdatePlayer({ ...player, avatar: img, lockedFields: nextLocks });
    
    // Add to gallery if not exists
    const existing = gallery.find(g => g.url === img);
    if (!existing) {
      onUpdateGallery([{ url: img, tags: [], genre: genre }, ...gallery]);
    }
    
    setShowGalleryPicker(false);
  };

  const handleAvatarClick = () => {
    setShowAvatarMenu(true);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
    setShowAvatarMenu(false);
  };

  const handleUrlSubmit = async () => {
    if (tempUrl.trim()) {
      const url = tempUrl.trim();
      setIsUploading(true);
      try {
        const finalUrl = await uploadImageFromUrl(url, uploadMode);
        
        const currentLocks = player.lockedFields || [];
        const nextLocks = currentLocks.includes('avatar') ? currentLocks : [...currentLocks, 'avatar'];
        onUpdatePlayer({ ...player, avatar: finalUrl, lockedFields: nextLocks });
        
        // Add to gallery if not exists
        const existing = gallery.find(g => g.url === finalUrl);
        if (!existing) {
          onUpdateGallery([{ 
            url: finalUrl, 
            tags: finalUrl === url ? ["external"] : [uploadMode === 'cloud' ? "cloud" : "local"], 
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsUploading(true);
        console.log("Starting avatar upload for PC:", player.name, "Mode:", uploadMode);
        const imageUrl = await uploadImage(file, uploadMode);
        console.log("Avatar upload successful, URL length:", imageUrl.length);
        
        const existing = gallery.find(g => g.url === imageUrl);
        if (!existing) {
          onUpdateGallery([{ url: imageUrl, tags: [], genre: genre }, ...gallery]);
        }
          
        onUpdatePlayer({
          ...player,
          avatar: imageUrl,
          lockedFields: player.lockedFields?.includes('avatar') ? player.lockedFields : [...(player.lockedFields || []), 'avatar']
        });
      } catch (error) {
        console.error("Upload failed:", error);
        // Upload failed
      } finally {
        setIsUploading(false);
      }
    }
  };

  const commonElements = (
    <>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
      <input type="file" ref={importInputRef} onChange={handleImport} className="hidden" accept=".json" />
      
      {showAvatarMenu && (
        <div className="fixed inset-0 z-[1001] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-neutral-900 border border-emerald-500/20 rounded-2xl p-6 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <h3 className="text-xl font-black text-emerald-400 uppercase tracking-widest">TÙY CHỌN ẢNH MC</h3>
              <button onClick={() => setShowAvatarMenu(false)} className="text-neutral-500 hover:text-white transition-colors">✕</button>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-3">
                <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2">1. TẢI ẢNH LÊN</p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setUploadMode('cloud'); triggerFileInput(); }}
                    className={`flex-1 py-3 rounded-lg border font-black uppercase text-[10px] transition-all ${uploadMode === 'cloud' ? 'bg-emerald-500 text-black border-emerald-400' : 'bg-white/5 text-white border-white/10 hover:bg-white/10'}`}
                  >
                    ☁️ CLOUD
                  </button>
                  <button 
                    onClick={() => { setUploadMode('local'); triggerFileInput(); }}
                    className={`flex-1 py-3 rounded-lg border font-black uppercase text-[10px] transition-all ${uploadMode === 'local' ? 'bg-emerald-500 text-black border-emerald-400' : 'bg-white/5 text-white border-white/10 hover:bg-white/10'}`}
                  >
                    💾 LOCAL
                  </button>
                </div>
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

              {onGenerateAvatar && (
                <button 
                  onClick={() => {
                    setShowAvatarMenu(false);
                    setShowStudio(true);
                  }}
                  className="w-full py-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-400 font-black uppercase text-xs transition-all flex items-center justify-center gap-3 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                >
                  <span>✨</span> AI IMAGE STUDIO
                </button>
              )}
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
          <div className="w-full max-w-md bg-neutral-900 border border-emerald-500/20 rounded-2xl p-6 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-emerald-400 uppercase tracking-widest border-b border-white/5 pb-4">DÁN URL ẢNH MC</h3>
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
                  className="flex-1 py-4 bg-emerald-500 text-black font-black uppercase text-xs rounded-xl hover:opacity-90 transition-all"
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

  if (isMobile && isOpen) {
    return (
      <>
        {commonElements}
        <GalleryPicker 
          player={player}
          gallery={gallery}
          isOpen={showGalleryPicker}
          onClose={() => setShowGalleryPicker(false)}
          onSelect={selectFromGallery}
          settings={settings}
          title="TÙY CHỌN ẢNH MC"
          themeColor="emerald"
          onGenerateAvatar={onGenerateAvatar}
        />
        <MobileMcModal 
          player={player}
          gallery={gallery}
          genre={genre}
          onClose={onClose}
          onUpdatePlayer={onUpdatePlayer}
          onUpdateGallery={onUpdateGallery}
          settings={settings}
          onAvatarClick={handleAvatarClick}
          onGalleryClick={handleOpenGallery}
          onStudioClick={() => setShowStudio(true)}
          initialEditing={initialEditing}
          gameTime={gameTime}
          isGameStarted={isGameStarted}
          onToggleLock={onToggleLock}
          onExport={handleExport}
          onImport={() => importInputRef.current?.click()}
          onGenerateAvatar={onGenerateAvatar}
        />
      </>
    );
  }

  const meta = getGenreMeta(genre);
  const hasSystem = !!player.systemName;

  return (
    <div className="McModal fixed inset-0 z-[300] bg-[#020202] flex flex-col animate-in fade-in duration-300 overflow-hidden mono selection:bg-emerald-500 selection:text-black">
      {commonElements}
      
      <GalleryPicker 
        player={player}
        gallery={gallery}
        isOpen={showGalleryPicker}
        onClose={() => setShowGalleryPicker(false)}
        onSelect={selectFromGallery}
        settings={settings}
        title="TÙY CHỌN ẢNH MC"
        themeColor="emerald"
        onGenerateAvatar={onGenerateAvatar}
        onOpenStudio={() => {
          setShowGalleryPicker(false);
          setShowStudio(true);
        }}
      />

      <AiImageStudio 
        isOpen={showStudio}
        onClose={() => setShowStudio(false)}
        onGenerate={async (params) => {
          if (onGenerateAvatar) {
            await onGenerateAvatar(params);
          }
        }}
        playerName={player.name}
        playerGender={player.gender || 'Bí mật'}
        playerAge={parseInt(String(player.age)) || 0}
        playerPersonality={player.personality || 'Chưa rõ'}
        currentLocation={player.currentLocation || 'Chưa rõ'}
        genre={genre}
        settings={settings}
      />
      
      <div className="absolute inset-0 pointer-events-none opacity-10 z-0">
         <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.05),transparent_70%)]"></div>
      </div>

      <div className="relative z-10 flex flex-col h-full">
        <McHeader 
          player={player} 
          genre={genre} 
          onClose={onClose} 
          isEditing={isEditing}
          onToggleEdit={() => setIsEditing(!isEditing)}
          onUpdatePlayer={onUpdatePlayer}
          gameTime={gameTime}
          isGameStarted={isGameStarted}
          onToggleLock={onToggleLock}
          onExport={handleExport}
          onImport={() => importInputRef.current?.click()}
        />

        <div className={`flex flex-col ${isMobile ? '' : 'md:flex-row'} flex-grow min-h-0 overflow-hidden relative`}>
          
          {inspectingItem && (
            <McInspector 
              item={inspectingItem} 
              player={player} 
              onClose={() => setInspectingItem(null)} 
            />
          )}

          <div className={`${isMobile ? 'w-full shrink-0' : 'h-full'} flex flex-col`}>
            <McSidebar 
              player={player} 
              onAvatarClick={handleAvatarClick} 
              onGalleryClick={handleOpenGallery}
              isEditing={isEditing}
              onUpdatePlayer={onUpdatePlayer}
              genre={genre}
              onToggleLock={onToggleLock}
              onGenerateAvatar={onGenerateAvatar}
            />
          </div>

          <div className="flex-grow min-h-0 p-2 overflow-y-auto custom-scrollbar bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.02),transparent)] relative z-20">
            <div className="w-full space-y-2.5">
              
              <section className="space-y-2">
                <div className="flex items-center gap-3 px-1">
                  <span className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.4em]">❯ THÔNG SỐ CƠ BẢN & ĐẶC TÍNH</span>
                  <div className="h-px flex-grow bg-white/10"></div>
                </div>
                <McStatsGrid 
                  player={player} 
                  genre={genre} 
                  isEditing={isEditing}
                  onUpdatePlayer={onUpdatePlayer}
                  onToggleLock={onToggleLock}
                  onInspect={setInspectingItem}
                />
              </section>

              <div className={`grid gap-2 ${isMobile ? 'grid-cols-1' : 'md:grid-cols-2 xl:grid-cols-5'}`}>
                <IdentityPanel 
                  identities={player.identities || []}
                  isEditing={isEditing}
                  onUpdate={(identities) => onUpdatePlayer({ ...player, identities })}
                  isLocked={player.lockedFields?.includes('identities')}
                  onToggleLock={() => onToggleLock('identities')}
                />

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

                <McAssetPanel 
                  gold={player.gold} 
                  assets={player.assets || []} 
                  onInspect={setInspectingItem} 
                  isEditing={isEditing}
                  onUpdatePlayer={(updates) => onUpdatePlayer({ ...player, ...updates })}
                  player={player}
                  onToggleLock={onToggleLock}
                />

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

                <McInventoryPanel 
                  inventory={player.inventory || []} 
                  onInspect={setInspectingItem} 
                  isEditing={isEditing}
                  onUpdatePlayer={(updates) => onUpdatePlayer({ ...player, ...updates })}
                  isLocked={player.lockedFields?.includes('inventory')}
                  onToggleLock={() => onToggleLock('inventory')}
                />
              </div>
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
