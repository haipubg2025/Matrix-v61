
import React, { useState, useMemo } from 'react';
import { Player, CodexEntry, Relationship, getGenreMeta, GameGenre, IdentityType, AppSettings } from '../../types';
import { Globe, ScrollText, History as HistoryIcon, Users, Zap, Search, ChevronRight, Lock, Unlock, User, Heart, Shield, BookOpen, MapPin, Sparkles, X, Plus, Edit3, Trash2, GitBranch, Network } from 'lucide-react';
import { NpcSocialColumn } from '../NpcProfileBase';
import ReactMarkdown from 'react-markdown';
import { DEFAULT_AVATAR } from '../../constants';

interface MobileCodexModalProps {
  player: Player;
  genre?: GameGenre;
  onClose: () => void;
  markAsViewed: (id: string, type: 'codex' | 'npc') => void;
  settings: AppSettings;
  onUpdatePlayer: (player: Player) => void;
}

type TabType = 'world' | 'rules' | 'locations' | 'entities' | 'npcs' | 'story';

export const MobileCodexModal: React.FC<MobileCodexModalProps> = ({ player, genre, onClose, markAsViewed, settings, onUpdatePlayer }) => {
  const [activeTab, setActiveTab] = useState<TabType>('world');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const genreMeta = getGenreMeta(genre);
  
  const worldLabel = useMemo(() => {
    if (!genre) return "Thế giới";
    if (genre === GameGenre.FREE_STYLE) return "Tự Do";
    return genre;
  }, [genre]);

  const labels = genreMeta.codexLabels || {
    world: "Thế giới",
    locations: "Địa danh",
    history: "Biên niên sử",
    entities: "Kỳ trân",
    npcs: "Nhân vật"
  };

  const categories = [
    { id: 'world' as TabType, label: worldLabel, icon: Globe },
    { id: 'rules' as TabType, label: "Luật Lệ", icon: ScrollText },
    { id: 'story' as TabType, label: "Cốt Truyện", icon: GitBranch },
    { id: 'npcs' as TabType, label: labels.npcs, icon: Users },
  ];

  const safeCodex = player.codex || [];
  const safeRelationships = player.relationships || [];

  const filteredItems = useMemo(() => {
    const query = (searchQuery || '').toLowerCase().trim();
    if (activeTab === 'npcs') {
      return safeRelationships
        .filter(npc => (npc.name || '').toLowerCase().includes(query))
        .map(npc => ({
          id: npc.id,
          title: npc.name || 'Vô danh',
          subtitle: (npc.affinity || 0) >= 600 ? 'Hậu cung' : 'Xã hội',
          type: 'npc' as const,
          viewed: npc.viewed ?? true,
          data: npc
        }));
    } else if (activeTab === 'story') {
      return (player.storyNodes || [])
        .filter(node => (node.title || '').toLowerCase().includes(query) || (node.content || '').toLowerCase().includes(query))
        .map(node => ({
          id: node.id,
          title: node.title,
          subtitle: node.type === 'main' ? 'Chính tuyến' : node.type === 'branch' ? 'Nhánh' : 'Sự kiện',
          type: 'story' as const,
          viewed: true,
          data: node
        }));
    } else {
      return safeCodex
        .filter(entry => {
          return entry.category === activeTab;
        })
        .filter(entry => (entry.title || '').toLowerCase().includes(query) || (entry.content || '').toLowerCase().includes(query))
        .map(entry => ({
          id: entry.title || 'Không tiêu đề',
          title: entry.title || 'Không tiêu đề',
          subtitle: entry.unlocked ? 'Đã giải mã' : 'Bị khóa',
          type: 'codex' as const,
          viewed: entry.viewed ?? true,
          data: entry
        }));
    }
  }, [activeTab, searchQuery, safeCodex, safeRelationships]);

  const selectedItem = useMemo(() => {
    if (!selectedEntryId) return null;
    return filteredItems.find(item => item.id === selectedEntryId);
  }, [selectedEntryId, filteredItems]);

  const handleToggleRule = (title: string) => {
    const updatedCodex = player.codex.map(entry => {
      if (entry.title === title && entry.category === 'rules') {
        return { ...entry, isActive: entry.isActive === false ? true : false };
      }
      return entry;
    });
    onUpdatePlayer({ ...player, codex: updatedCodex });
  };

  const handleDeleteEntry = (id: string, type: 'codex' | 'story') => {
    if (!confirm('Bạn có chắc chắn muốn xóa mục này?')) return;
    
    if (type === 'story') {
      const updatedStoryNodes = (player.storyNodes || []).filter(node => node.id !== id);
      onUpdatePlayer({ ...player, storyNodes: updatedStoryNodes });
    } else {
      const updatedCodex = player.codex.filter(entry => !(entry.title === id && entry.category === activeTab));
      onUpdatePlayer({ ...player, codex: updatedCodex });
    }
    setSelectedEntryId(null);
  };

  const handleSaveEdit = () => {
    if (!selectedItem) return;
    
    if (selectedItem.type === 'story') {
      const updatedStoryNodes = (player.storyNodes || []).map(node => {
        if (node.id === selectedItem.id) {
          return { ...node, title: editTitle, content: editContent };
        }
        return node;
      });
      onUpdatePlayer({ ...player, storyNodes: updatedStoryNodes });
      setIsEditing(false);
    } else if (selectedItem.type === 'codex') {
      const updatedCodex = player.codex.map(entry => {
        if (entry.title === selectedItem.id && entry.category === activeTab) {
          return { ...entry, title: editTitle, content: editContent };
        }
        return entry;
      });
      onUpdatePlayer({ ...player, codex: updatedCodex });
      setIsEditing(false);
      setSelectedEntryId(editTitle);
    }
  };

  const handleAddRule = () => {
    if (!editTitle.trim() || !editContent.trim()) return;
    const newEntry: CodexEntry = {
      category: 'rules',
      title: editTitle,
      content: editContent,
      unlocked: true,
      viewed: true,
      isActive: true
    };
    onUpdatePlayer({ ...player, codex: [...player.codex, newEntry] });
    setIsAdding(false);
    setEditTitle('');
    setEditContent('');
    setSelectedEntryId(newEntry.title);
  };

  return (
    <div 
      className="MobileCodexModal fixed inset-0 z-[600] bg-black flex flex-col h-full overflow-hidden font-sans"
      style={{ 
        fontFamily: settings.fontFamily || 'Inter',
        fontSize: `${settings.fontSize || 16}px`
      }}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between p-2 border-b border-white/10 bg-black/40 shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-black text-white uppercase tracking-widest italic">CODEX_DATABASE</h2>
        </div>
        <button onClick={onClose} className="p-2 bg-white/5 text-neutral-400 rounded-xl border border-white/10 active:scale-90 transition-all">✕</button>
      </div>

      {/* TAB NAVIGATION */}
      <div className="flex overflow-x-auto bg-black/20 border-b border-white/5 shrink-0 custom-scrollbar">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => {
              setActiveTab(cat.id);
              setSelectedEntryId(null);
            }}
            className={`flex-1 min-w-[80px] py-1 flex flex-col items-center gap-1 transition-all relative ${activeTab === cat.id ? 'text-amber-500' : 'text-neutral-600'}`}
          >
            <cat.icon size={16} />
            <span className="text-[8px] font-black uppercase tracking-tighter">{cat.label}</span>
            {activeTab === cat.id && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500"></div>}
          </button>
        ))}
      </div>

      {/* SEARCH BAR */}
      <div className="p-1 border-b border-white/5 bg-black/20 shrink-0 flex items-center gap-2">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
          <input 
            type="text"
            placeholder="Tìm kiếm dữ liệu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-white placeholder:text-neutral-700 focus:outline-none focus:border-amber-500/50 transition-all"
          />
        </div>
        {activeTab === 'rules' && (
          <button 
            onClick={() => {
              setIsAdding(true);
              setEditTitle('');
              setEditContent('');
              setSelectedEntryId('new');
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-black rounded-xl border border-amber-500/20 active:scale-90 transition-all shadow-lg"
          >
            <Plus size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Thêm</span>
          </button>
        )}
      </div>

      {/* CONTENT AREA */}
      <div className="flex-grow overflow-y-auto custom-scrollbar relative">
        {isAdding ? (
          <div className="p-4 space-y-6 animate-in slide-in-from-bottom duration-300">
            <button 
              onClick={() => setIsAdding(false)}
              className="flex items-center gap-2 text-[10px] font-black text-amber-500 uppercase tracking-widest"
            >
              ❮ Hủy bỏ
            </button>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">Thêm Quy Tắc</h2>
            <div className="space-y-4">
              <input 
                type="text" 
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full bg-neutral-900 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
                placeholder="Tiêu đề quy tắc..."
              />
              <textarea 
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full h-40 bg-neutral-900 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500 resize-none"
                placeholder="Nội dung quy tắc..."
              />
              <button 
                onClick={handleAddRule}
                className="w-full bg-amber-500 text-black font-black uppercase py-4 rounded-xl active:scale-95 transition-all"
              >
                Lưu Quy Tắc
              </button>
            </div>
          </div>
        ) : selectedItem ? (
          <div className="p-4 pb-32 animate-in fade-in duration-300">
            <div className="mb-6 flex items-center justify-between w-full">
              <button 
                onClick={() => {
                  setSelectedEntryId(null);
                  setIsEditing(false);
                }}
                className="flex items-center gap-2 text-[10px] font-black text-amber-500 uppercase tracking-widest active:scale-95 transition-all"
              >
                ❮ Quay lại danh sách
              </button>
              {(activeTab === 'rules' || activeTab === 'world') && selectedItem.type === 'codex' && !isEditing && (
                <div className="flex gap-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditing(true);
                      setEditTitle(selectedItem.title);
                      setEditContent((selectedItem.data as CodexEntry).content || '');
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-neutral-400 active:bg-white/10"
                  >
                    <Edit3 size={14} />
                    <span className="text-[9px] font-black uppercase">Sửa</span>
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteEntry(selectedItem.id, 'codex');
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 active:bg-red-500 active:text-white"
                  >
                    <Trash2 size={14} />
                    <span className="text-[9px] font-black uppercase">Xóa</span>
                  </button>
                </div>
              )}
              {activeTab === 'story' && selectedItem.type === 'story' && !isEditing && (
                <div className="flex gap-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditing(true);
                      setEditTitle(selectedItem.title);
                      setEditContent((selectedItem.data as any).content || '');
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-neutral-400 active:bg-white/10"
                  >
                    <Edit3 size={14} />
                    <span className="text-[9px] font-black uppercase">Sửa</span>
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteEntry(selectedItem.id, 'story');
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 active:bg-red-500 active:text-white"
                  >
                    <Trash2 size={14} />
                    <span className="text-[9px] font-black uppercase">Xóa</span>
                  </button>
                </div>
              )}
            </div>

            {selectedItem.type === 'codex' ? (
              isEditing ? (
                <div className="space-y-6">
                  <input 
                    type="text" 
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="text-2xl font-black text-white uppercase tracking-tight bg-transparent border-b border-white/10 w-full focus:outline-none focus:border-amber-500"
                  />
                  <textarea 
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full h-64 bg-neutral-900/50 border border-white/10 rounded-xl p-4 text-sm text-neutral-300 focus:outline-none focus:border-amber-500 resize-none"
                  />
                  <div className="flex gap-2">
                    <button 
                      onClick={handleSaveEdit}
                      className="flex-1 bg-amber-500 text-black font-black uppercase py-3 rounded-xl active:scale-95 transition-all"
                    >
                      Lưu
                    </button>
                    <button 
                      onClick={() => setIsEditing(false)}
                      className="flex-1 bg-white/5 text-white font-black uppercase py-3 rounded-xl active:scale-95 transition-all"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-[8px] text-amber-500 font-black uppercase tracking-widest">
                      ARCHIVE_{activeTab.toUpperCase()}
                    </span>
                  </div>
                  {selectedItem.title !== "Những điều cần có" && selectedItem.title !== "Những điều bị cấm" && (
                    <h1 className="text-2xl font-black text-white uppercase tracking-tight leading-tight">
                      {selectedItem.title}
                    </h1>
                  )}
                  <div className="markdown-body prose prose-invert max-w-none text-sm text-neutral-300 leading-relaxed">
                    <ReactMarkdown>{(selectedItem.data as CodexEntry).content || ''}</ReactMarkdown>
                  </div>
                </div>
              )
            ) : selectedItem.type === 'story' ? (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-[8px] text-amber-500 font-black uppercase tracking-widest">
                    STORY_NODE_{selectedItem.subtitle.toUpperCase()}
                  </span>
                </div>
                <h1 className="text-2xl font-black text-white uppercase tracking-tight leading-tight">
                  {selectedItem.title}
                </h1>
                <div className="markdown-body prose prose-invert max-w-none text-sm text-neutral-300 leading-relaxed">
                  <ReactMarkdown>{(selectedItem.data as any).content || ''}</ReactMarkdown>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-6">
                  <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                    <span className="block text-[8px] text-neutral-600 font-black uppercase mb-1">Loại</span>
                    <span className="text-xs font-bold text-white">{selectedItem.subtitle}</span>
                  </div>
                  <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                    <span className="block text-[8px] text-neutral-600 font-black uppercase mb-1">Lượt chơi</span>
                    <span className="text-xs font-bold text-white">Lượt {(selectedItem.data as any).turnCount || 0}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="flex gap-1 items-start">
                  <div className={`w-32 aspect-[3/4] rounded-2xl border-4 bg-neutral-900 overflow-hidden shrink-0 ${((selectedItem.data as Relationship).affinity || 0) >= 600 ? 'border-pink-500/20' : 'border-cyan-500/20'}`}>
                    {(selectedItem.data as Relationship).avatar ? (
                      <img src={(selectedItem.data as Relationship).avatar} className="w-full h-full object-cover" />
                    ) : (
                      <img src={DEFAULT_AVATAR} className="w-full h-full object-cover opacity-20" />
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-black text-white uppercase tracking-tight leading-none">{selectedItem.title}</h1>
                    
                    {/* Relationship Network Section - Moved to top for prominence */}
                    <div className="mt-4">
                      <NpcSocialColumn 
                        npc={selectedItem.data as Relationship}
                        player={player}
                        onSwitchNpc={(target) => setSelectedEntryId(target.id)}
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[8px] font-black text-neutral-400 uppercase">{selectedItem.subtitle}</span>
                      <span className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[8px] font-black text-neutral-400 uppercase">{(selectedItem.data as Relationship).status}</span>
                    </div>
                    <div className="flex gap-1 mt-2">
                      <div className="flex items-center gap-2">
                        <Heart size={12} className="text-rose-500 fill-rose-500" />
                        <span className="mono text-[10px] font-black text-white">{(selectedItem.data as Relationship).affinity}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield size={12} className="text-cyan-500" />
                        <span className="mono text-[10px] font-black text-white">{(selectedItem.data as Relationship).loyalty || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="mono text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div> Ấn tượng
                  </h4>
                  <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl italic text-sm text-neutral-300 leading-relaxed">
                    "{(selectedItem.data as Relationship).impression || 'Dữ liệu sơ cấp...'}"
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="mono text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2">
                    <Lock size={12} /> Vạn Giới Thân Phận
                  </h4>
                  <div className="space-y-2">
                    {(selectedItem.data as Relationship).identities?.map((sid, idx) => (
                      <div key={idx} className={`p-4 border rounded-2xl flex flex-col gap-1 transition-all ${sid.isRevealed ? 'bg-rose-500/5 border-rose-500/20' : 'bg-neutral-900 border-white/5 opacity-50'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`text-[7px] font-black uppercase px-1 py-0.5 rounded border ${
                              sid.type === IdentityType.FANFIC ? 'bg-purple-500/20 border-purple-500/40 text-purple-400' :
                              sid.type === IdentityType.DESTINY ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' :
                              sid.type === IdentityType.LEGENDARY ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400' :
                              'bg-white/5 border-white/10 text-white/40'
                            }`}>
                              {sid.type || IdentityType.NORMAL}
                            </span>
                            <span className="text-[8px] font-black uppercase tracking-widest text-rose-500">Thân phận {(selectedItem.data as Relationship).identities!.length > 1 ? `#${idx + 1}` : ''}</span>
                          </div>
                          {sid.isRevealed ? <Unlock size={12} className="text-rose-500" /> : <Lock size={12} className="text-neutral-700" />}
                        </div>
                        {sid.isRevealed ? (
                          <>
                            <span className="text-xs font-black text-white uppercase tracking-tight">{sid.name}</span>
                            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-tighter">{sid.role}</span>
                            <p className="text-[10px] text-neutral-400 italic mt-1">{sid.description}</p>
                          </>
                        ) : (
                          <span className="text-[10px] font-black text-neutral-700 uppercase tracking-widest">Dữ liệu bị ẩn</span>
                        )}
                      </div>
                    ))}
                    {Array.isArray((selectedItem.data as Relationship).secrets) && (selectedItem.data as Relationship).secrets!.length > 0 ? (
                      (selectedItem.data as Relationship).secrets!.map((s, i) => (
                        <div key={i} className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-center gap-3">
                          <span className="text-sm">🗝️</span>
                          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-tight leading-tight">{s}</span>
                        </div>
                      ))
                    ) : (
                      !(selectedItem.data as Relationship).identities?.length && (
                        <div className="py-8 border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center opacity-20">
                          <Lock size={24} className="mb-2" />
                          <p className="mono text-[8px] font-black uppercase tracking-widest">Chưa có bí mật</p>
                        </div>
                      )
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-1 bg-white/5 border border-white/10 rounded-2xl">
                    <span className="block text-[8px] text-neutral-600 font-black uppercase mb-1">Tuổi</span>
                    <span className="text-xs font-bold text-white">{(selectedItem.data as Relationship).age || '??'}</span>
                  </div>
                  <div className="p-1 bg-white/5 border border-white/10 rounded-2xl">
                    <span className="block text-[8px] text-neutral-600 font-black uppercase mb-1">Chủng tộc</span>
                    <span className="text-xs font-bold text-white">{(selectedItem.data as Relationship).race || 'Nhân loại'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-1 space-y-2">
            {filteredItems.length > 0 ? (
              filteredItems.map((item, idx) => (
                <button
                  key={`${item.type}-${item.id}-${idx}`}
                  onClick={() => {
                    setSelectedEntryId(item.id);
                    markAsViewed(item.id, item.type);
                  }}
                  className="w-full text-left p-1 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-4 active:bg-amber-500/10 active:border-amber-500/40 transition-all relative"
                >
                  {!item.viewed && (
                    <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_6px_#f59e0b]"></div>
                  )}
                  <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center shrink-0 text-neutral-500">
                    {item.type === 'npc' ? <User size={20} /> : item.type === 'story' ? <GitBranch size={20} /> : <ScrollText size={20} />}
                  </div>
                  <div className="flex-grow min-w-0">
                    <h4 className="text-xs font-black uppercase tracking-tight truncate text-neutral-300">{item.title}</h4>
                    <p className="text-[8px] mono font-bold text-neutral-600 uppercase tracking-widest mt-0.5">{item.subtitle}</p>
                  </div>
                  <ChevronRight size={16} className="text-neutral-700" />
                </button>
              ))
            ) : (
              <div className="py-20 flex flex-col items-center justify-center opacity-20 text-center">
                <Lock size={48} className="mb-4" />
                <p className="mono text-[10px] font-black uppercase tracking-widest">Dữ liệu bị khóa</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
