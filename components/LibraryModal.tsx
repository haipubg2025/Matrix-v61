
import React, { useRef, useState, useEffect } from 'react';
import { Player, GameGenre, GalleryImage, AppSettings } from '../types';
import { dbService } from '../services/dbService';
import { uploadImage, uploadImageFromUrl, fetchUserImages, deleteImageFromCloud, checkSystemHealth } from '../services/uploadService';
import { MobileLibraryModal } from './Mobile/MobileLibraryModal';
import { ResolvedImage } from './ResolvedImage';

interface Props {
  player: Player;
  gallery: GalleryImage[];
  isOpen: boolean;
  onClose: () => void;
  onUpdatePlayer: (player: Player) => void;
  onUpdateGallery: (gallery: GalleryImage[]) => void;
  settings: AppSettings;
}

export const LibraryModal: React.FC<Props> = ({ player, gallery, isOpen, onClose, onUpdatePlayer, onUpdateGallery, settings }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cloudGallery, setCloudGallery] = useState<string[]>([]);
  const [localGallery, setLocalGallery] = useState<GalleryImage[]>([]);
  const [libraryMode, setLibraryMode] = useState<'shared' | 'local'>('local');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<GameGenre | 'All'>('All');
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const [newTag, setNewTag] = useState('');
  const [systemMode, setSystemMode] = useState<'full' | 'basic'>('basic');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [tempUrl, setTempUrl] = useState('');
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const initLibrary = async () => {
    setIsLoading(true);
    try {
      const health = await checkSystemHealth();
      setSystemMode(health ? 'full' : 'basic');
      
      const cloudImages = await fetchUserImages();
      setCloudGallery(cloudImages);
    } catch (err) {
      console.error("Init library error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadGallery = async () => {
    await initLibrary();
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const mode = libraryMode === 'shared' ? 'cloud' : 'local';
      const uploadPromises = Array.from(files).map(file => uploadImage(file, mode));
      const uploadedUrls = await Promise.all(uploadPromises);
      
      if (mode === 'cloud') {
        const cloudImages = await fetchUserImages();
        setCloudGallery(cloudImages);
        
        // Also add to local gallery metadata so it can be tagged and filtered
        const newGallery = [...gallery];
        uploadedUrls.forEach(url => {
          if (!newGallery.find(g => g.url === url)) {
            newGallery.unshift({ url, tags: ['cloud', 'shared'], genre: undefined });
          }
        });
        onUpdateGallery(newGallery);
        
        alert("Đã tải ảnh lên Đám Mây!");
      } else {
        const newGallery = [...gallery];
        uploadedUrls.forEach(url => {
          if (!newGallery.find(g => g.url === url)) {
            newGallery.unshift({ url, tags: [], genre: undefined });
          }
        });
        onUpdateGallery(newGallery);
        alert("Đã lưu ảnh vào Máy!");
      }
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Tải ảnh thất bại.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlSubmit = async () => {
    if (!tempUrl.trim()) return;
    const url = tempUrl.trim();
    setIsUploading(true);
    try {
      const mode = libraryMode === 'shared' ? 'cloud' : 'local';
      const finalUrl = await uploadImageFromUrl(url, mode);
      
      // Lưu URL vào gallery (metadata)
      const newGallery = [...gallery];
      if (!newGallery.find(g => g.url === finalUrl)) {
        newGallery.unshift({ 
          url: finalUrl, 
          tags: finalUrl === url ? ["external"] : ["cloud", "shared"], 
          genre: undefined 
        });
      }
      onUpdateGallery(newGallery);
      
      if (mode === 'cloud' && finalUrl !== url) {
        const cloudImages = await fetchUserImages();
        setCloudGallery(cloudImages);
      }
      
      setShowUrlInput(false);
      setTempUrl('');
      alert("Đã nạp ảnh từ URL thành công!");
    } catch (error) {
      console.error("URL submit failed:", error);
      alert("Lỗi khi nạp ảnh từ URL.");
    } finally {
      setIsUploading(false);
    }
  };

  const permanentDelete = async (url: string) => {
    const newGallery = gallery.filter(img => img.url !== url);
    onUpdateGallery(newGallery);
  };

  const setAsPcAvatar = (image: string) => {
    onUpdatePlayer({ ...player, avatar: image });
    alert("Đã cập nhật ảnh đại diện MC!");
  };

  const addTag = async (url: string) => {
    if (!newTag.trim()) return;
    const newGallery = gallery.map(img => {
      if (img.url === url) {
        const tags = img.tags.includes(newTag.trim()) ? img.tags : [...img.tags, newTag.trim()];
        return { ...img, tags };
      }
      return img;
    });
    onUpdateGallery(newGallery);
    setNewTag('');
  };

  const removeTag = async (url: string, tag: string) => {
    const newGallery = gallery.map(img => {
      if (img.url === url) {
        return { ...img, tags: img.tags.filter(t => t !== tag) };
      }
      return img;
    });
    onUpdateGallery(newGallery);
  };

  const setGenre = async (url: string, genre: GameGenre | 'All') => {
    const newGallery = gallery.map(img => {
      if (img.url === url) {
        return { ...img, genre: genre === 'All' ? undefined : genre };
      }
      return img;
    });
    onUpdateGallery(newGallery);
  };

  const handleDownload = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      
      // Try to extract filename from URL or use a default
      const filename = url.split('/').pop()?.split('?')[0] || 'image.png';
      link.download = filename.endsWith('.png') || filename.endsWith('.jpg') || filename.endsWith('.jpeg') || filename.endsWith('.webp') 
        ? filename 
        : `${filename}.png`;
        
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
      // Fallback: open in new tab if fetch fails (CORS)
      window.open(url, '_blank');
    }
  };

  useEffect(() => {
    if (isOpen) {
      initLibrary();
    }
  }, [isOpen]);

  if (settings.mobileMode && isOpen) {
    return <MobileLibraryModal onClose={onClose} player={player} onUpdatePlayer={onUpdatePlayer} gallery={gallery} onUpdateGallery={onUpdateGallery} />;
  }

  if (!isOpen) return null;

  // Use gallery or cloudGallery based on mode
  const displayGallery: GalleryImage[] = libraryMode === 'local' 
    ? gallery 
    : cloudGallery.map(url => ({ url, tags: ['shared'], genre: undefined }));

  // Filter by tab
  const customCategories = ['Hot Girl', '210', 'Segg', 'Anime', 'shared'];
  const tabs = ['All', ...Object.values(GameGenre), ...customCategories];

  const filteredGallery = activeTab === 'All' 
    ? displayGallery 
    : displayGallery.filter(img => {
        if (Object.values(GameGenre).includes(activeTab as any)) {
          return img.genre === activeTab;
        }
        if (customCategories.includes(activeTab)) {
          return img.tags.includes(activeTab);
        }
        return false;
      });

  return (
    <div className="LibraryModal fixed inset-0 z-[150] bg-neutral-950 flex flex-col animate-in fade-in duration-300 overflow-hidden">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleUpload} 
        className="hidden" 
        accept="image/*" 
        multiple
      />

      {showUrlInput && (
        <div className="fixed inset-0 z-[1001] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-neutral-900 border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-indigo-400 uppercase tracking-widest border-b border-white/5 pb-4">THÊM ẢNH TỪ URL</h3>
            <div className="space-y-4">
              <input 
                autoFocus
                value={tempUrl}
                onChange={(e) => setTempUrl(e.target.value)}
                placeholder="https://example.com/image.png"
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-4 text-white text-sm outline-none focus:border-indigo-500 transition-all"
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
                  className="flex-1 py-4 bg-indigo-500 text-black font-black uppercase text-xs rounded-xl hover:opacity-90 transition-all"
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
          <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
          <span className="text-indigo-500 font-black uppercase tracking-[0.4em] text-xs animate-pulse">Synchronizing_Cloud_Data...</span>
        </div>
      )}

      {zoomedImage && (
        <div 
          className="fixed inset-0 z-[2000] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-10 animate-in fade-in zoom-in-95 duration-300 cursor-zoom-out"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-full max-h-full flex flex-col items-center gap-6" onClick={e => e.stopPropagation()}>
            <img 
              src={zoomedImage} 
              alt="Zoomed" 
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/10"
              referrerPolicy="no-referrer"
            />
            
            <div className="flex gap-4">
              <button 
                onClick={() => handleDownload(zoomedImage)}
                className="px-8 py-3 bg-indigo-500 text-black font-black uppercase text-xs rounded-xl hover:bg-indigo-400 transition-all shadow-lg flex items-center gap-2"
              >
                TẢI VỀ MÁY 📥
              </button>
              <button 
                onClick={() => setZoomedImage(null)}
                className="px-8 py-3 bg-white/10 text-white font-black uppercase text-xs rounded-xl hover:bg-white/20 transition-all border border-white/10"
              >
                ĐÓNG [X]
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center p-6 border-b border-white/5 bg-indigo-500/5 shrink-0">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></div>
            <h2 className="text-sm font-black text-indigo-400 mono tracking-[0.4em] uppercase">
              {libraryMode === 'local' ? '[ MACHINE_MEDIA_VAULT ]' : '[ SHARED_MEDIA_VAULT ]'}
            </h2>
          </div>

          <div className="flex bg-black/40 p-1 rounded-xl border border-white/10">
            <button 
              onClick={() => setLibraryMode('local')}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${libraryMode === 'local' ? 'bg-indigo-500 text-black shadow-lg' : 'text-neutral-500 hover:text-white'}`}
            >
              Ảnh Trong Máy
            </button>
            <button 
              onClick={() => setLibraryMode('shared')}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${libraryMode === 'shared' ? 'bg-indigo-500 text-black shadow-lg' : 'text-neutral-500 hover:text-white'}`}
            >
              Kho Lưu Trữ
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end mr-6">
            <span className="text-[8px] mono text-neutral-600 font-black uppercase tracking-widest">
              IndexedDB_Persistent_Storage
            </span>
            <span className="text-[10px] mono text-indigo-400/60 font-black">{displayGallery.length} Assets Detected</span>
          </div>
          
          <button 
            onClick={() => onUpdateGallery([])}
            className="px-4 py-2 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white transition-all rounded-xl border border-red-500/30 font-black uppercase text-[10px]"
          >
            Xóa hết [!]
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-6 py-2 bg-indigo-500 text-black font-black uppercase text-[10px] rounded-xl hover:bg-indigo-400 transition-all shadow-lg disabled:opacity-50"
          >
            {isUploading ? "Đang nạp..." : "Nạp ảnh mới [+]"}
          </button>
          <button 
            onClick={() => setShowUrlInput(true)}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-indigo-400 transition-all rounded-xl border border-indigo-500/20 font-black uppercase text-[10px]"
          >
            Dán URL 🔗
          </button>
          
          <button onClick={onClose} className="px-6 py-2 bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-all rounded-xl border border-white/10 font-black uppercase text-[10px]">
            Đóng [ESC]
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-4 bg-black/20 border-b border-white/5 overflow-x-auto custom-scrollbar shrink-0">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all whitespace-nowrap border ${
              activeTab === tab 
                ? 'bg-indigo-500 text-black border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.3)]' 
                : 'bg-white/5 text-neutral-500 border-white/10 hover:bg-white/10'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-grow overflow-y-auto custom-scrollbar p-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center">
             <div className="w-16 h-16 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-6"></div>
             <span className="text-indigo-400 font-black uppercase tracking-[0.5em] animate-pulse">Accessing_Cloud_Vault...</span>
          </div>
        ) : filteredGallery.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8 max-w-[140rem] mx-auto">
            {filteredGallery.map((img, idx) => (
              <div key={idx} className="group flex flex-col bg-black/40 border border-white/5 rounded-[2rem] overflow-hidden hover:border-indigo-500/50 transition-all shadow-xl">
                <div className="relative aspect-[2/3] overflow-hidden">
                  <ResolvedImage src={img.url} alt={`Gallery ${idx}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 backdrop-blur-sm pointer-events-none group-hover:pointer-events-auto">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setZoomedImage(img.url); }}
                      className="px-4 py-1.5 bg-white/10 text-white text-[8px] font-black uppercase rounded-lg hover:bg-white/20 transition-all w-32 pointer-events-auto border border-white/20 flex items-center justify-center gap-2"
                    >
                      PHÓNG TO 🔍
                    </button>

                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDownload(img.url); }}
                      className="px-4 py-1.5 bg-indigo-500/20 text-indigo-400 text-[8px] font-black uppercase rounded-lg hover:bg-indigo-500 hover:text-black transition-all w-32 pointer-events-auto border border-indigo-500/30 flex items-center justify-center gap-2"
                    >
                      TẢI VỀ 📥
                    </button>

                    <div className="w-24 h-[1px] bg-white/10 my-1"></div>

                    <button 
                      onClick={(e) => { e.stopPropagation(); setAsPcAvatar(img.url); }}
                      className="px-4 py-1.5 bg-emerald-500 text-black text-[8px] font-black uppercase rounded-lg hover:bg-emerald-400 transition-all w-32 pointer-events-auto"
                    >
                      Dùng cho MC
                    </button>
                    
                    <button 
                      onClick={(e) => { e.stopPropagation(); permanentDelete(img.url); }}
                      className="px-4 py-1.5 bg-red-600 text-white text-[8px] font-black uppercase rounded-lg hover:bg-red-500 transition-all w-32 pointer-events-auto shadow-lg"
                    >
                      Xóa khỏi thế giới
                    </button>
                  </div>

                  <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
                    {img.genre && (
                      <span className="px-2 py-0.5 bg-indigo-500 text-black text-[7px] font-black uppercase rounded shadow-lg">
                        {img.genre}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4 flex flex-col gap-3 bg-black/20">
                  {/* Genre Selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] mono text-neutral-600 font-black uppercase">Genre:</span>
                    <select 
                      value={img.genre || 'All'} 
                      onChange={(e) => setGenre(img.url, e.target.value as any)}
                      className="bg-white/5 border border-white/10 text-[8px] font-black text-indigo-400 uppercase rounded px-1 outline-none"
                    >
                      {tabs.map(t => <option key={t} value={t} className="bg-neutral-900">{t}</option>)}
                    </select>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 min-h-[20px]">
                    {img.tags.map(tag => (
                      <span key={tag} className="flex items-center gap-1 px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[7px] font-bold text-neutral-400 group/tag">
                        {tag}
                        <button onClick={() => removeTag(img.url, tag)} className="hover:text-red-500">×</button>
                      </span>
                    ))}
                    <button 
                      onClick={() => setEditingImage(editingImage === img.url ? null : img.url)}
                      className="text-[7px] font-black text-indigo-500 hover:text-indigo-400 uppercase"
                    >
                      {editingImage === img.url ? '[Đóng]' : '[+ Tag]'}
                    </button>
                  </div>

                  {/* Quick Tags Section */}
                  <div className="flex flex-wrap gap-1 border-t border-white/5 pt-2">
                    {customCategories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => {
                          if (img.tags.includes(cat)) {
                            removeTag(img.url, cat);
                          } else {
                            const newTagVal = cat;
                            const newGallery = gallery.map(g => {
                              if (g.url === img.url) {
                                const tags = g.tags.includes(newTagVal) ? g.tags : [...g.tags, newTagVal];
                                return { ...g, tags };
                              }
                              return g;
                            });
                            onUpdateGallery(newGallery);
                          }
                        }}
                        className={`px-2 py-0.5 rounded text-[7px] font-black uppercase transition-all ${
                          img.tags.includes(cat)
                            ? 'bg-indigo-500 text-black'
                            : 'bg-white/5 text-neutral-600 hover:bg-white/10'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {editingImage === img.url && (
                    <div className="flex gap-1 animate-in slide-in-from-top-1">
                      <input 
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addTag(img.url)}
                        placeholder="Nhập tag..."
                        className="flex-grow bg-white/5 border border-indigo-500/30 rounded px-2 py-1 text-[9px] text-white outline-none"
                      />
                      <button 
                        onClick={() => addTag(img.url)}
                        className="px-2 py-1 bg-indigo-500 text-black text-[9px] font-black rounded uppercase"
                      >
                        OK
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
            <div className="text-[12rem] mb-8 select-none font-black italic text-indigo-500">EMPTY</div>
            <h3 className="text-3xl font-black text-white mono uppercase tracking-[0.5em]">Kho ảnh trống</h3>
          </div>
        )}
      </div>
    </div>
  );
};
