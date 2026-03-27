
import React, { useState, useMemo } from 'react';
import { MemoryEntry, GameLog, AppSettings } from '../../types';
import { memoryService } from '../../services/memoryService';
import { Brain, Search, Filter, ArrowUpDown, Calendar, Star, Tag, ChevronRight, Trash2, X, Pin } from 'lucide-react';

interface MobileMemoryModalProps {
  onClose: () => void;
  logs: GameLog[];
  settings: AppSettings;
  turnCount: number;
  addToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

type SortBy = 'importance' | 'recent' | 'pinned';
type FilterType = 'all' | 'fact' | 'event' | 'relationship' | 'preference' | 'pinned';
type ScoreFilter = 'all' | 'high' | 'medium' | 'low';

export const MobileMemoryModal: React.FC<MobileMemoryModalProps> = ({ onClose, logs, settings, turnCount, addToast }) => {
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
    if (filterType === 'pinned') {
      result = result.filter(m => m.metadata.isPinned);
    } else if (filterType !== 'all') {
      result = result.filter(m => m.metadata.type === filterType);
    }

    if (scoreFilter === 'high') {
      result = result.filter(m => m.metadata.importance >= 90);
    } else if (scoreFilter === 'medium') {
      result = result.filter(m => m.metadata.importance >= 80 && m.metadata.importance < 90);
    } else if (scoreFilter === 'low') {
      result = result.filter(m => m.metadata.importance >= 70 && m.metadata.importance < 80);
    }

    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(m => (m.content || '').toLowerCase().includes(query));
    }

    result.sort((a, b) => {
      if (sortBy === 'pinned') {
        if (a.metadata.isPinned && !b.metadata.isPinned) return -1;
        if (!a.metadata.isPinned && b.metadata.isPinned) return 1;
        return b.metadata.lastUpdated - a.metadata.lastUpdated;
      }
      if (sortBy === 'importance') return b.metadata.importance - a.metadata.importance;
      return b.metadata.lastUpdated - a.metadata.lastUpdated;
    });
    return result;
  }, [memories, filterType, scoreFilter, searchQuery, sortBy, refreshTick]);

  const handleDelete = (id: string) => {
    memoryService.deleteMemory(id);
    setSelectedId(null);
    forceUpdate();
  };

  const handleBulkDelete = () => {
    const idsToDelete = filteredAndSortedMemories.map(m => m.id);
    memoryService.bulkDelete(m => idsToDelete.includes(m.id));
    setSelectedId(null);
    forceUpdate();
  };

  const selectedMemory = useMemo(() => memories.find(m => m.id === selectedId), [memories, selectedId]);

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
    <div className="MobileMemoryModal fixed inset-0 z-[600] bg-black flex flex-col h-full overflow-hidden font-sans">
      {/* HEADER */}
      <div className="flex items-center justify-between p-2 border-b border-white/10 bg-black/40 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse shadow-[0_0_8px_#a855f7]"></div>
          <h2 className="text-sm font-black text-white uppercase tracking-widest italic">MEMORY_CORE</h2>
        </div>
        <button onClick={onClose} className="p-2 bg-white/5 text-neutral-400 rounded-xl border border-white/10 active:scale-90 transition-all">✕</button>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="p-1 border-b border-white/5 bg-black/20 shrink-0 space-y-2">
        <button 
          onClick={handleGenerateMemory}
          disabled={isGenerating}
          className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border ${
            isGenerating 
              ? "bg-purple-500/20 text-purple-400 border-purple-500/30 animate-pulse" 
              : "bg-purple-600 text-white border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
          }`}
        >
          <Brain size={14} className={isGenerating ? "animate-spin" : ""} />
          {isGenerating ? "Đang trích xuất..." : "Tạo Ký Ức Mới (AI)"}
        </button>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
          <input 
            type="text"
            placeholder="Tìm kiếm ký ức..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs font-medium text-white placeholder:text-neutral-700 focus:outline-none focus:border-purple-500/50 transition-all"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as FilterType)}
            className="bg-white/5 border border-white/10 rounded-lg py-1.5 px-2 text-[9px] font-black uppercase tracking-widest text-neutral-400 outline-none min-w-[100px]"
          >
            <option value="all">Loại: Tất cả</option>
            <option value="pinned">Đã ghim 📌</option>
            <option value="fact">Sự thật</option>
            <option value="event">Sự kiện</option>
            <option value="relationship">Quan hệ</option>
            <option value="preference">Sở thích</option>
          </select>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="bg-white/5 border border-white/10 rounded-lg py-1.5 px-2 text-[9px] font-black uppercase tracking-widest text-neutral-400 outline-none min-w-[100px]"
          >
            <option value="recent">Sắp xếp: Mới</option>
            <option value="pinned">Ưu tiên ghim</option>
            <option value="importance">Quan trọng</option>
            <option value="turn">Số lượt</option>
          </select>
          <select 
            value={scoreFilter}
            onChange={(e) => setScoreFilter(e.target.value as ScoreFilter)}
            className="bg-white/5 border border-white/10 rounded-lg py-1.5 px-2 text-[9px] font-black uppercase tracking-widest text-neutral-400 outline-none min-w-[100px]"
          >
            <option value="all">Điểm: Tất cả</option>
            <option value="high">Rất cao (&gt;= 90)</option>
            <option value="medium">Cao (80-89)</option>
            <option value="low">Trung bình (70-79)</option>
          </select>
          <button 
            onClick={handleBulkDelete}
            disabled={filteredAndSortedMemories.length === 0}
            className="bg-red-500/10 border border-red-500/20 rounded-lg py-1.5 px-3 text-[9px] font-black uppercase tracking-widest text-red-500 whitespace-nowrap disabled:opacity-30"
          >
            Xóa Ký Ức
          </button>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-grow overflow-y-auto custom-scrollbar relative">
        {selectedMemory ? (
          <div className="p-1 pb-32 animate-in fade-in duration-300 space-y-1">
            <button 
              onClick={() => setSelectedId(null)}
              className="flex items-center gap-2 text-[10px] font-black text-purple-500 uppercase tracking-widest"
            >
              ❮ Quay lại danh sách
            </button>

            <div className="space-y-6">
              <div className="flex flex-wrap gap-3">
                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${getTypeColor(selectedMemory.metadata.type)}`}>
                  {getTypeLabel(selectedMemory.metadata.type)}
                </span>
                <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[8px] text-neutral-500 font-black uppercase tracking-widest">
                  {new Date(selectedMemory.metadata.timestamp).toLocaleDateString()}
                </span>
                <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-[8px] text-amber-500 font-black uppercase tracking-widest">
                  ★ {selectedMemory.metadata.importance}/100
                </span>
              </div>

              <div className="p-1 bg-white/[0.02] border border-white/5 rounded-[2.5rem] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
                <p className="text-xl text-neutral-200 font-serif italic leading-relaxed">
                  {selectedMemory.content}
                </p>
              </div>

              {selectedMemory.metadata.reasoning && (
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-[8px] font-black text-purple-400 uppercase tracking-widest">
                    <Brain size={10} /> Phân tích hệ thống
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-relaxed italic">
                    {selectedMemory.metadata.reasoning}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3">
                <div className="p-1 bg-white/5 border border-white/10 rounded-2xl">
                  <span className="block text-[8px] text-neutral-600 font-black uppercase mb-1">Ghi nhận lúc</span>
                  <span className="text-xs font-bold text-neutral-400">{new Date(selectedMemory.metadata.timestamp).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => handleDelete(selectedMemory.id)}
                  className="w-full py-3 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <Trash2 size={14} /> Xóa vĩnh viễn ký ức
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-1 space-y-4">
            {/* World Summary & Chronicle */}
            <div className="space-y-4 p-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-px flex-grow bg-gradient-to-r from-transparent to-purple-500/20"></div>
                  <span className="text-[8px] text-purple-400 font-black uppercase tracking-widest">Tóm tắt thế giới</span>
                  <div className="h-px flex-grow bg-gradient-to-l from-transparent to-purple-500/20"></div>
                </div>
                <div className="p-4 bg-purple-500/5 border border-purple-500/10 rounded-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-0.5 h-full bg-purple-500/40"></div>
                  <p className="text-xs text-neutral-400 font-serif italic leading-relaxed">
                    "{worldSummary}"
                  </p>
                </div>
              </div>

              {chronicle && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-grow bg-gradient-to-r from-transparent to-amber-500/20"></div>
                    <span className="text-[8px] text-amber-400 font-black uppercase tracking-widest">Biên niên sử</span>
                    <div className="h-px flex-grow bg-gradient-to-l from-transparent to-amber-500/20"></div>
                  </div>
                  <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-0.5 h-full bg-amber-500/40"></div>
                    <div className="text-[11px] text-neutral-400 font-serif italic leading-relaxed whitespace-pre-wrap">
                      {chronicle}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <div className="h-px flex-grow bg-gradient-to-r from-transparent to-white/10"></div>
                <span className="text-[8px] text-neutral-500 font-black uppercase tracking-widest">Danh sách ký ức</span>
                <div className="h-px flex-grow bg-gradient-to-l from-transparent to-white/10"></div>
              </div>
            </div>

            {filteredAndSortedMemories.length > 0 ? (
              filteredAndSortedMemories.map((memory) => (
                <button
                  key={memory.id}
                  onClick={() => setSelectedId(memory.id)}
                  className="w-full text-left p-1 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-2 active:bg-purple-500/10 active:border-purple-500/40 transition-all"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-widest border ${getTypeColor(memory.metadata.type)}`}>
                        {getTypeLabel(memory.metadata.type)}
                      </span>
                      {memory.metadata.isPinned && (
                        <Pin size={10} className="text-amber-500 fill-amber-500" />
                      )}
                    </div>
                    <span className="text-[8px] mono text-neutral-600 font-black">{new Date(memory.metadata.timestamp).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs font-medium text-neutral-300 leading-relaxed line-clamp-2">{memory.content}</p>
                  <div className="flex justify-end">
                    <span className="text-amber-500 text-[8px] font-black">★ {memory.metadata.importance}</span>
                  </div>
                </button>
              ))
            ) : (
              <div className="py-20 flex flex-col items-center justify-center opacity-20 text-center">
                <Brain size={48} className="mb-4" />
                <p className="mono text-[10px] font-black uppercase tracking-widest">Vùng nhớ trống</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
