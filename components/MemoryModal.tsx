import React, { useState, useMemo } from 'react';
import { MemoryEntry, GameLog } from '../types';
import { memoryService } from '../services/memoryService';
import { 
  Brain, 
  X, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Calendar, 
  Star, 
  Tag,
  ChevronRight,
  Trash2,
  Pin
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { MobileMemoryModal } from './Mobile/MobileMemoryModal';
import { AppSettings } from '../types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  logs: GameLog[];
  turnCount: number;
  addToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

type SortBy = 'importance' | 'recent' | 'pinned';
type FilterType = 'all' | 'fact' | 'event' | 'relationship' | 'preference' | 'pinned';
type ScoreFilter = 'all' | 'high' | 'medium' | 'low';

export const MemoryModal: React.FC<Props> = ({ isOpen, onClose, settings, logs, turnCount, addToast }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('recent');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [scoreFilter, setScoreFilter] = useState<ScoreFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  const forceUpdate = () => setRefreshTick(prev => prev + 1);

  const memoryState = memoryService.getState();
  const memories = memoryState.memories;
  const worldSummary = memoryState.worldSummary;
  const chronicle = memoryState.chronicle;

  const handleGenerateMemory = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      await memoryService.updateMemory(logs, turnCount, true, settings);
      addToast("Đã trích xuất ký ức thành công!", "success");
      forceUpdate();
    } catch (error) {
      console.error("Memory generation error:", error);
      addToast("Lỗi khi trích xuất ký ức. Vui lòng thử lại hoặc Thêm key Api cá nhân.", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredAndSortedMemories = useMemo(() => {
    let result = [...memories];

    // Filter by type
    if (filterType === 'pinned') {
      result = result.filter(m => m.metadata.isPinned);
    } else if (filterType !== 'all') {
      result = result.filter(m => m.metadata.type === filterType);
    }

    // Filter by score
    if (scoreFilter === 'high') {
      result = result.filter(m => m.metadata.importance >= 90);
    } else if (scoreFilter === 'medium') {
      result = result.filter(m => m.metadata.importance >= 80 && m.metadata.importance < 90);
    } else if (scoreFilter === 'low') {
      result = result.filter(m => m.metadata.importance >= 70 && m.metadata.importance < 80);
    }

    // Filter by search query
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(m => (m.content || '').toLowerCase().includes(query));
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'pinned') {
        if (a.metadata.isPinned && !b.metadata.isPinned) return -1;
        if (!a.metadata.isPinned && b.metadata.isPinned) return 1;
        return b.metadata.lastUpdated - a.metadata.lastUpdated;
      }
      if (sortBy === 'importance') {
        return b.metadata.importance - a.metadata.importance;
      } else {
        return b.metadata.lastUpdated - a.metadata.lastUpdated;
      }
    });

    return result;
  }, [memories, filterType, scoreFilter, searchQuery, sortBy, refreshTick]);

  const handleDelete = (id: string) => {
    memoryService.deleteMemory(id);
    if (selectedId === id) setSelectedId(null);
    forceUpdate();
  };

  const handleBulkDelete = () => {
    const idsToDelete = filteredAndSortedMemories.map(m => m.id);
    memoryService.bulkDelete(m => idsToDelete.includes(m.id));
    setSelectedId(null);
    forceUpdate();
  };

  const selectedMemory = useMemo(() => {
    return memories.find(m => m.id === selectedId);
  }, [memories, selectedId]);

  if (!isOpen) return null;

  if (settings.mobileMode) {
    return (
      <MobileMemoryModal 
        onClose={onClose} 
        logs={logs} 
        settings={settings} 
        turnCount={turnCount}
        addToast={addToast} 
      />
    );
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'fact': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'event': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'relationship': return 'text-pink-400 bg-pink-400/10 border-pink-400/20';
      case 'preference': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      default: return 'text-neutral-400 bg-neutral-400/10 border-neutral-400/20';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'fact': return 'Sự thật';
      case 'event': return 'Sự kiện';
      case 'relationship': return 'Quan hệ';
      case 'preference': return 'Sở thích';
      default: return 'Khác';
    }
  };

  return (
    <div className="MemoryModal fixed inset-0 z-[500] bg-neutral-950 flex animate-in fade-in duration-300 overflow-hidden">
      {/* Left Sidebar: Controls & List */}
      <div className="w-96 border-r border-white/5 bg-neutral-900/30 flex flex-col shrink-0">
        <div className="p-6 border-b border-white/5 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                <Brain className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-tighter italic leading-none">Ký Ức</h2>
                <p className="text-[9px] mono font-black text-neutral-500 uppercase tracking-widest mt-1">Quantum Memory Palace</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
              <X className="w-5 h-5 text-neutral-500" />
            </button>
          </div>

          <div className="space-y-3">
            <button 
              onClick={handleGenerateMemory}
              disabled={isGenerating}
              className={cn(
                "w-full h-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border",
                isGenerating 
                  ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/30 animate-pulse cursor-wait"
                  : "bg-indigo-500 text-white border-indigo-600 hover:bg-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.3)]"
              )}
            >
              <Brain size={14} className={isGenerating ? "animate-spin" : ""} />
              {isGenerating ? "Đang trích xuất..." : "Tạo Ký Ức Mới"}
            </button>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
              <input 
                type="text"
                placeholder="Tìm kiếm ký ức..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/40 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-white placeholder:text-neutral-700 focus:outline-none focus:border-indigo-500/50 transition-all"
              />
            </div>

            <div className="flex gap-2">
              <div className="flex-grow relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-600" />
                <select 
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as FilterType)}
                  className="w-full bg-black/40 border border-white/5 rounded-xl py-2 pl-8 pr-4 text-[10px] font-black uppercase tracking-widest text-neutral-400 appearance-none focus:outline-none focus:border-indigo-500/50"
                >
                  <option value="all">Tất cả loại</option>
                  <option value="pinned">Đã ghim 📌</option>
                  <option value="fact">Sự thật</option>
                  <option value="event">Sự kiện</option>
                  <option value="relationship">Quan hệ</option>
                  <option value="preference">Sở thích</option>
                </select>
              </div>
              <div className="flex-grow relative">
                <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-600" />
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortBy)}
                  className="w-full bg-black/40 border border-white/5 rounded-xl py-2 pl-8 pr-4 text-[10px] font-black uppercase tracking-widest text-neutral-400 appearance-none focus:outline-none focus:border-indigo-500/50"
                >
                  <option value="recent">Mới nhất</option>
                  <option value="pinned">Ưu tiên ghim</option>
                  <option value="importance">Quan trọng</option>
                  <option value="turn">Số lượt</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <div className="flex-grow relative">
                <Star className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-600" />
                <select 
                  value={scoreFilter}
                  onChange={(e) => setScoreFilter(e.target.value as ScoreFilter)}
                  className="w-full bg-black/40 border border-white/5 rounded-xl py-2 pl-8 pr-4 text-[10px] font-black uppercase tracking-widest text-neutral-400 appearance-none focus:outline-none focus:border-indigo-500/50"
                >
                  <option value="all">Tất cả điểm</option>
                  <option value="high">Rất cao (&gt;= 90)</option>
                  <option value="medium">Cao (80-89)</option>
                  <option value="low">Trung bình (70-79)</option>
                </select>
              </div>
              <button 
                onClick={handleBulkDelete}
                disabled={filteredAndSortedMemories.length === 0}
                className="px-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[9px] font-black text-red-500 uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center gap-2 disabled:opacity-30"
              >
                <Trash2 size={12} /> Xóa Ký Ức
              </button>
            </div>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto custom-scrollbar p-4 space-y-2">
          {filteredAndSortedMemories.length > 0 ? (
            filteredAndSortedMemories.map((memory) => (
              <button
                key={memory.id}
                onClick={() => setSelectedId(memory.id)}
                className={cn(
                  "w-full text-left p-4 rounded-2xl transition-all group border relative overflow-hidden",
                  selectedId === memory.id
                    ? "bg-indigo-500/10 border-indigo-500/30 shadow-lg"
                    : "bg-neutral-900/20 border-white/5 hover:bg-white/5"
                )}
              >
                {selectedId === memory.id && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                )}
                
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border",
                      getTypeColor(memory.metadata.type)
                    )}>
                      {getTypeLabel(memory.metadata.type)}
                    </span>
                    {memory.metadata.isPinned && (
                      <Pin size={10} className="text-amber-500 fill-amber-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-[9px] mono font-black text-neutral-500">
                      <Calendar size={10} />
                      {new Date(memory.metadata.timestamp).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1 text-[9px] mono font-black text-amber-500">
                      <Star size={10} fill="currentColor" />
                      {memory.metadata.importance}
                    </div>
                  </div>
                </div>

                <p className={cn(
                  "text-xs font-medium leading-relaxed line-clamp-2",
                  selectedId === memory.id ? "text-white" : "text-neutral-400 group-hover:text-neutral-200"
                )}>
                  {memory.content}
                </p>
              </button>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center opacity-20 text-center p-8">
              <Brain className="w-12 h-12 mb-4" />
              <p className="mono text-[10px] font-black uppercase tracking-[0.2em]">Không tìm thấy ký ức</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Content: Detail View */}
      <div className="flex-grow bg-black relative flex flex-col overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        
        {selectedMemory ? (
          <div className="flex-grow overflow-y-auto custom-scrollbar relative z-10">
            <div className="max-w-4xl mx-auto px-8 py-24 md:px-16">
              <div className="flex items-center gap-4 mb-12">
                <div className="h-px flex-grow bg-gradient-to-r from-transparent to-indigo-500/20"></div>
                <span className="px-4 py-1.5 bg-indigo-500/5 border border-indigo-500/20 rounded-full text-[10px] text-indigo-400 font-black uppercase tracking-[0.4em]">
                  MEMORY_FRAGMENT_{selectedMemory.id.toUpperCase()}
                </span>
                <div className="h-px flex-grow bg-gradient-to-l from-transparent to-indigo-500/20"></div>
              </div>

              <div className="space-y-12">
                <div className="flex flex-wrap gap-6">
                  <div className="space-y-2">
                    <span className="text-[9px] mono font-black text-neutral-600 uppercase tracking-widest">Thời điểm</span>
                    <div className="flex items-center gap-3 text-2xl font-black text-white italic">
                      <Calendar className="text-indigo-500" />
                      {new Date(selectedMemory.metadata.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="w-px h-12 bg-white/10 hidden md:block"></div>
                  <div className="space-y-2">
                    <span className="text-[9px] mono font-black text-neutral-600 uppercase tracking-widest">Độ quan trọng</span>
                    <div className="flex items-center gap-3 text-2xl font-black text-amber-500 italic">
                      <Star fill="currentColor" />
                      {selectedMemory.metadata.importance}/100
                    </div>
                  </div>
                  <div className="w-px h-12 bg-white/10 hidden md:block"></div>
                  <div className="space-y-2">
                    <span className="text-[9px] mono font-black text-neutral-600 uppercase tracking-widest">Phân loại</span>
                    <div className={cn(
                      "flex items-center gap-3 text-2xl font-black italic",
                      getTypeColor(selectedMemory.metadata.type).split(' ')[0]
                    )}>
                      <Tag />
                      {getTypeLabel(selectedMemory.metadata.type)}
                    </div>
                  </div>
                </div>

                <div className="p-12 bg-neutral-900/40 border border-white/5 rounded-[3rem] relative group">
                  <div className="absolute -top-6 -left-6 w-16 h-16 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all"></div>
                  <p className="text-3xl md:text-4xl text-neutral-200 font-serif italic leading-relaxed first-letter:text-7xl first-letter:font-black first-letter:text-indigo-500 first-letter:mr-4 first-letter:float-left first-letter:leading-none">
                    {selectedMemory.content}
                  </p>
                </div>

                {selectedMemory.metadata.reasoning && (
                  <div className="p-8 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2 text-[9px] mono font-black text-indigo-400 uppercase tracking-widest">
                      <Brain size={12} /> Phân tích hệ thống
                    </div>
                    <p className="text-sm text-neutral-400 leading-relaxed italic">
                      {selectedMemory.metadata.reasoning}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-2">
                    <span className="text-[9px] mono font-black text-neutral-600 uppercase tracking-widest">Ghi nhận lúc</span>
                    <p className="text-xs font-bold text-neutral-400">
                      {new Date(selectedMemory.metadata.timestamp).toLocaleString('vi-VN')}
                    </p>
                  </div>
                  <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-2">
                    <span className="text-[9px] mono font-black text-neutral-600 uppercase tracking-widest">Cập nhật cuối</span>
                    <p className="text-xs font-bold text-neutral-400">
                      {new Date(selectedMemory.metadata.lastUpdated).toLocaleString('vi-VN')}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-12">
                  <button 
                    onClick={() => handleDelete(selectedMemory.id)}
                    className="px-6 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] font-black text-red-500 uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
                  >
                    <Trash2 size={14} /> Xóa vĩnh viễn
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col overflow-y-auto custom-scrollbar p-12 relative z-10">
            <div className="max-w-4xl mx-auto w-full space-y-12">
              <div className="text-center">
                <div className="relative inline-block mb-8">
                  <div className="absolute inset-0 bg-indigo-500/20 blur-[100px] rounded-full"></div>
                  <Brain className="w-24 h-24 text-indigo-500/40 relative z-10 animate-pulse" />
                </div>
                <h3 className="text-4xl font-black text-white mono uppercase tracking-[0.4em] mb-4 opacity-20">
                  MEMORY_PALACE
                </h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-px flex-grow bg-gradient-to-r from-transparent to-indigo-500/20"></div>
                  <span className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.3em]">Tóm tắt thế giới hiện tại</span>
                  <div className="h-px flex-grow bg-gradient-to-l from-transparent to-indigo-500/20"></div>
                </div>
                <div className="p-8 bg-indigo-500/5 border border-indigo-500/10 rounded-[2rem] relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/40"></div>
                  <p className="text-lg text-neutral-400 font-serif italic leading-relaxed">
                    "{worldSummary}"
                  </p>
                </div>
              </div>

              {chronicle && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-px flex-grow bg-gradient-to-r from-transparent to-amber-500/20"></div>
                    <span className="text-[10px] text-amber-400 font-black uppercase tracking-[0.3em]">Biên niên sử thế giới</span>
                    <div className="h-px flex-grow bg-gradient-to-l from-transparent to-amber-500/20"></div>
                  </div>
                  <div className="p-8 bg-amber-500/5 border border-amber-500/10 rounded-[2rem] relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-amber-500/40"></div>
                    <div className="text-sm text-neutral-400 font-serif italic leading-relaxed whitespace-pre-wrap">
                      {chronicle}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl text-center space-y-2">
                  <span className="text-[9px] mono font-black text-neutral-600 uppercase tracking-widest">Tổng số ký ức</span>
                  <p className="text-2xl font-black text-white">{memories.length}</p>
                </div>
                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl text-center space-y-2">
                  <span className="text-[9px] mono font-black text-neutral-600 uppercase tracking-widest">Lượt tóm tắt cuối</span>
                  <p className="text-2xl font-black text-white">{memoryState.lastSummarizedTurn}</p>
                </div>
                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl text-center space-y-2">
                  <span className="text-[9px] mono font-black text-neutral-600 uppercase tracking-widest">Trạng thái Neural</span>
                  <p className="text-2xl font-black text-emerald-500">STABLE</p>
                </div>
              </div>

              <p className="text-center text-neutral-700 mono text-[10px] font-bold uppercase tracking-widest leading-relaxed pt-8">
                Chọn một mảnh ký ức từ danh sách bên trái để xem chi tiết, hoặc nhấn "Tạo Ký Ức Mới" để AI quét lại lịch sử.
              </p>
            </div>
          </div>
        )}

        {/* Top Header Bar */}
        <div className="absolute top-0 left-0 right-0 h-16 border-b border-white/5 bg-black/40 backdrop-blur-md flex items-center justify-between px-8 z-20">
          <div className="flex items-center gap-4">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
            <span className="mono text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em]">
              Neural_Link: Stable // Synapse_Sync: 100%
            </span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-1 h-3 bg-indigo-500/20"></div>
              <div className="w-1 h-3 bg-indigo-500/40"></div>
              <div className="w-1 h-3 bg-indigo-500/60"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
