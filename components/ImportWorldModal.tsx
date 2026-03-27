
import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Image as ImageIcon, FileJson, Zap, RefreshCw, AlertTriangle, Clock, User, Users } from 'lucide-react';
import { AppSettings, Player } from '../types';
import { gameAI } from '../services/geminiService';
import extract from 'png-chunks-extract';
import { Buffer } from 'buffer';
import pako from 'pako';

interface ImportWorldModalProps {
  onClose: () => void;
  onImport: (data: { 
    title: string; 
    description: string; 
    scenario: string; 
    player?: Partial<Player>;
    npcs?: any[];
  }) => void;
  settings: AppSettings;
  cache: {
    activeTab: 'image' | 'st-card';
    image: {
      previewUrl: string | null;
      concept: string;
      importedData: any | null;
      lastFile: File | null;
    };
    stCard: {
      previewUrl: string | null;
      concept: string;
      stRawData: any | null;
      importedData: any | null;
      lastFile: File | null;
    };
  };
  onUpdateCache: (newCache: any) => void;
}

type ImportTab = 'image' | 'st-card';

export const ImportWorldModal: React.FC<ImportWorldModalProps> = ({ onClose, onImport, settings, cache, onUpdateCache }) => {
  const [activeTab, setActiveTab] = useState<ImportTab>(cache.activeTab);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derived states from cache based on activeTab
  const currentTabCache = activeTab === 'image' ? cache.image : cache.stCard;
  const previewUrl = currentTabCache.previewUrl;
  const concept = currentTabCache.concept;
  const importedData = currentTabCache.importedData;
  const stRawData = activeTab === 'st-card' ? cache.stCard.stRawData : null;
  const lastFile = currentTabCache.lastFile;

  const updateTabCache = (tab: ImportTab, data: any) => {
    onUpdateCache((prev: any) => ({
      ...prev,
      [tab === 'image' ? 'image' : 'stCard']: {
        ...prev[tab === 'image' ? 'image' : 'stCard'],
        ...data
      }
    }));
  };

  const handleTabChange = (tab: ImportTab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    onUpdateCache((prev: any) => ({ ...prev, activeTab: tab }));
    setError(null);
    setIsProcessing(false);
  };

  const handleReset = () => {
    setError(null);
    setIsProcessing(false);
    updateTabCache(activeTab, {
      previewUrl: null,
      concept: '',
      importedData: null,
      stRawData: null,
      lastFile: null
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleReroll = async () => {
    if (!lastFile || isProcessing) return;
    setError(null);
    updateTabCache(activeTab, { importedData: null });
    setIsProcessing(true);
    try {
      if (activeTab === 'image') {
        if (previewUrl) {
          await processGeneralImage(previewUrl, concept);
        } else {
          const reader = new FileReader();
          reader.onload = async (e) => {
            const base64 = e.target?.result as string;
            updateTabCache('image', { previewUrl: base64 });
            await processGeneralImage(base64, concept);
          };
          reader.readAsDataURL(lastFile);
        }
      } else {
        await handleProcessStCard();
      }
    } catch (err: any) {
      setError(err.message || "Reroll failed");
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    let interval: any;
    if (isProcessing) {
      interval = setInterval(() => {
        setTimer(t => t + 1);
      }, 1000);
    } else {
      setTimer(0);
    }
    return () => clearInterval(interval);
  }, [isProcessing]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    
    // Special handling for JSON files in ST-Card tab
    if (activeTab === 'st-card' && (file.type === 'application/json' || file.name.endsWith('.json'))) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const content = event.target?.result as string;
        try {
          const data = JSON.parse(content);
          updateTabCache('st-card', {
            stRawData: data.data || data,
            previewUrl: data.data?.avatar || data.avatar || null,
            concept: '',
            importedData: null,
            lastFile: file
          });
        } catch (e) {
          setError("File JSON không hợp lệ.");
        }
      };
      reader.readAsText(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // 1. Generate preview immediately
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      
      // Update cache with preview and reset other fields
      updateTabCache(activeTab, {
        previewUrl: base64,
        concept: '',
        importedData: null,
        stRawData: null,
        lastFile: file
      });

      // 2. Start processing
      try {
        if (activeTab === 'image') {
          setIsProcessing(true);
          await processGeneralImage(base64, '');
        } else {
          await prepareStCard(file);
        }
      } catch (err: any) {
        console.error("Import failed:", err);
        setError(err.message || "Đã xảy ra lỗi trong quá trình xử lý.");
        setIsProcessing(false);
      }
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processGeneralImage = async (base64: string, userConcept: string) => {
    // Send to Gemini
    try {
      const result = await gameAI.generateWorldFromImage(base64, settings, userConcept);
      if (result) {
        updateTabCache('image', {
          importedData: {
            title: result.title || "Thế giới từ hình ảnh",
            description: result.description || "Một thế giới được kiến tạo từ dữ liệu hình ảnh.",
            scenario: result.scenario || "Bắt đầu cuộc hành trình trong thực tại mới.",
            player: result.player || { name: "Vô Danh", personality: "Chưa rõ", background: "Chưa rõ" },
            npcs: result.npcs || []
          }
        });
      } else {
        throw new Error("AI không thể phân tích hình ảnh này.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const prepareStCard = async (file: File) => {
    const buffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(buffer);

    if (file.type === 'image/png' || file.name.endsWith('.png')) {
      const chunks = extract(uint8);
      
      const charaChunk = chunks.find(chunk => {
        const name = chunk.name;
        if (name === 'tEXt' || name === 'iTXt' || name === 'zTXt') {
          const data = Buffer.from(chunk.data);
          const nullIndex = data.indexOf(0);
          const keyword = data.slice(0, nullIndex).toString('utf8');
          return keyword === 'chara';
        }
        return false;
      });

      if (!charaChunk) {
        throw new Error("Không tìm thấy dữ liệu nhân vật (chara chunk) trong file PNG này.");
      }

      let jsonStr = '';
      const data = Buffer.from(charaChunk.data);
      const nullIndex = data.indexOf(0);

      if (charaChunk.name === 'tEXt') {
        // Keyword\0Text
        const textData = data.slice(nullIndex + 1).toString('utf8');
        jsonStr = Buffer.from(textData, 'base64').toString('utf8');
      } else if (charaChunk.name === 'zTXt') {
        // Keyword\0CompressionMethod\0CompressedText
        const compressedData = data.slice(nullIndex + 2);
        const decompressed = pako.inflate(compressedData);
        const base64Data = Buffer.from(decompressed).toString('utf8');
        jsonStr = Buffer.from(base64Data, 'base64').toString('utf8');
      } else if (charaChunk.name === 'iTXt') {
        // Keyword\0CompressionFlag\0CompressionMethod\0LanguageTag\0TranslatedKeyword\0Text
        const compressionFlag = data[nullIndex + 1];
        // Find the end of TranslatedKeyword (the 2nd null byte after Method)
        let currentPos = nullIndex + 3; // Skip Flag and Method
        let nullCount = 0;
        while (nullCount < 2 && currentPos < data.length) {
          if (data[currentPos] === 0) nullCount++;
          currentPos++;
        }
        const textData = data.slice(currentPos);
        
        if (compressionFlag === 1) {
          const decompressed = pako.inflate(textData);
          const base64Data = Buffer.from(decompressed).toString('utf8');
          jsonStr = Buffer.from(base64Data, 'base64').toString('utf8');
        } else {
          const base64Data = textData.toString('utf8');
          jsonStr = Buffer.from(base64Data, 'base64').toString('utf8');
        }
      }

      try {
        const parsed = JSON.parse(jsonStr);
        updateTabCache('st-card', { stRawData: parsed.data || parsed });
      } catch (e) {
        throw new Error("Lỗi khi giải mã dữ liệu Card ST.");
      }
    } else if (file.type === 'image/webp' || file.name.endsWith('.webp')) {
      // Basic WebP support: search for JSON pattern
      const text = new TextDecoder().decode(uint8);
      const startIdx = text.indexOf('{"name":');
      if (startIdx !== -1) {
        // Find matching closing brace
        let braceCount = 0;
        let endIdx = -1;
        for (let i = startIdx; i < text.length; i++) {
          if (text[i] === '{') braceCount++;
          if (text[i] === '}') braceCount--;
          if (braceCount === 0) {
            endIdx = i + 1;
            break;
          }
        }
        if (endIdx !== -1) {
          try {
            const jsonStr = text.substring(startIdx, endIdx);
            const parsed = JSON.parse(jsonStr);
            updateTabCache('st-card', { stRawData: parsed.data || parsed });
            return;
          } catch (e) {}
        }
      }
      throw new Error("Không thể trích xuất dữ liệu từ WebP. Hãy thử chuyển sang định dạng PNG hoặc JSON.");
    } else {
      throw new Error("Định dạng file không được hỗ trợ cho Card ST.");
    }
  };

  const handleProcessStCard = async () => {
    if (!stRawData) return;
    
    setIsProcessing(true);
    setError(null);

    try {
      // Use AI to enhance the ST card data and create a world around it
      const result = await gameAI.generateWorldFromStCard(stRawData, settings, concept);
      
      if (result) {
        updateTabCache('st-card', {
          importedData: {
            title: result.title || "Thế giới từ ST Card",
            description: result.description || "Một thế giới được kiến tạo từ dữ liệu SillyTavern.",
            scenario: result.scenario || "Bắt đầu cuộc hành trình mới.",
            player: result.player || { name: "Vô Danh", personality: "Chưa rõ", background: "Chưa rõ" },
            npcs: result.npcs || []
          }
        });
      } else {
        throw new Error("AI không thể phân tích dữ liệu Card này.");
      }
    } catch (err: any) {
      setError(err.message || "Lỗi xử lý Card ST.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDataChange = (field: string, value: any) => {
    if (!importedData) return;
    const newData = { ...importedData };
    
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      newData[parent] = { ...newData[parent], [child]: value };
    } else {
      newData[field] = value;
    }
    
    updateTabCache(activeTab, { importedData: newData });
  };

  const handleNpcChange = (index: number, field: string, value: any) => {
    if (!importedData) return;
    const newNpcs = [...importedData.npcs];
    newNpcs[index] = { ...newNpcs[index], [field]: value };
    updateTabCache(activeTab, { importedData: { ...importedData, npcs: newNpcs } });
  };

  return (
    <div className="fixed inset-0 z-[700] bg-[#050505] animate-in fade-in duration-500 flex flex-col">
      {/* Header with Tabs */}
      <div className="border-b border-white/5 bg-black/40 flex items-stretch shrink-0">
        <div className="flex flex-1">
          <button 
            onClick={() => handleTabChange('image')}
            className={`flex-1 py-6 flex items-center justify-center gap-4 transition-all relative group ${activeTab === 'image' ? 'text-emerald-400' : 'text-neutral-600 hover:text-neutral-400'}`}
          >
            <ImageIcon size={24} />
            <span className="text-sm font-black uppercase tracking-[0.2em]">Ảnh</span>
            {activeTab === 'image' && <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>}
          </button>
          <button 
            onClick={() => handleTabChange('st-card')}
            className={`flex-1 py-6 flex items-center justify-center gap-4 transition-all relative group ${activeTab === 'st-card' ? 'text-purple-400' : 'text-neutral-600 hover:text-neutral-400'}`}
          >
            <FileJson size={24} />
            <span className="text-sm font-black uppercase tracking-[0.2em]">SillyTavern</span>
            {activeTab === 'st-card' && <div className="absolute bottom-0 left-0 w-full h-1 bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]"></div>}
          </button>
        </div>
        <div className="flex items-stretch">
          <button 
            onClick={handleReset}
            className="px-6 flex items-center justify-center hover:bg-white/5 transition-all text-neutral-500 hover:text-emerald-500 group border-l border-white/5"
            title="Reset"
          >
            <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
          </button>
          <button 
            onClick={onClose} 
            className="px-8 flex items-center justify-center hover:bg-white/5 transition-all text-neutral-500 hover:text-white group border-l border-white/5"
          >
            <X size={32} className="group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-grow overflow-y-auto p-4 md:p-8 custom-scrollbar bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.03)_0%,transparent_70%)]">
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch animate-in fade-in slide-in-from-bottom-8 duration-700">
          
          {/* Left Column: Upload Area & Processing Status */}
          <div className="space-y-8 flex flex-col">
            <div 
              onClick={() => !isProcessing && fileInputRef.current?.click()}
              className={`group relative min-h-[300px] lg:min-h-[400px] border-2 border-dashed rounded-[3rem] flex flex-col items-center justify-center space-y-6 cursor-pointer transition-all duration-500 ${activeTab === 'image' ? 'border-emerald-500/20 hover:border-emerald-500/50 hover:bg-emerald-500/5 shadow-2xl' : 'border-purple-500/20 hover:border-purple-500/50 hover:bg-purple-500/5 shadow-2xl'} ${isProcessing ? 'opacity-50 cursor-wait' : ''}`}
            >
              {previewUrl ? (
                <div className="absolute inset-0 p-8">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-contain rounded-[2rem] shadow-2xl" />
                  {!isProcessing && (
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-[2rem] backdrop-blur-sm">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
                          <RefreshCw size={32} className="text-white" />
                        </div>
                        <p className="text-sm font-black text-white uppercase tracking-[0.3em]">Thay đổi tệp tin</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className={`w-24 h-24 rounded-3xl flex items-center justify-center transition-all duration-500 ${activeTab === 'image' ? 'bg-emerald-500/10 text-emerald-500 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(16,185,129,0.3)]' : 'bg-purple-500/10 text-purple-400 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(168,85,247,0.3)]'}`}>
                    <Upload size={48} />
                  </div>
                  <div className="text-center space-y-3">
                    <p className="text-xl font-black text-white uppercase tracking-[0.2em]">Nhấp để tải lên dữ liệu</p>
                    <p className="text-xs mono text-neutral-500 uppercase tracking-widest">Hỗ trợ: PNG, JPG, WEBP, JSON (Max 10MB)</p>
                  </div>
                  
                  {/* Decorative corners */}
                  <div className={`absolute top-8 left-8 w-12 h-12 border-t-2 border-l-2 rounded-tl-2xl transition-colors ${activeTab === 'image' ? 'border-emerald-500/20 group-hover:border-emerald-500/50' : 'border-purple-500/20 group-hover:border-purple-500/50'}`}></div>
                  <div className={`absolute bottom-8 right-8 w-12 h-12 border-b-2 border-r-2 rounded-br-2xl transition-colors ${activeTab === 'image' ? 'border-emerald-500/20 group-hover:border-emerald-500/50' : 'border-purple-500/20 group-hover:border-purple-500/50'}`}></div>
                </>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept={activeTab === 'st-card' ? '.png' : 'image/*'} 
                className="hidden" 
              />
            </div>

            {/* Concept Input - Always Visible */}
            <div className={`p-8 rounded-[2.5rem] border transition-all duration-500 ${activeTab === 'image' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-purple-500/5 border-purple-500/20'} space-y-4`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Zap size={18} className={activeTab === 'image' ? 'text-emerald-500' : 'text-purple-500'} />
                  <h4 className="text-xs font-black text-white uppercase tracking-widest">Ý Tưởng Bổ Sung (Concept)</h4>
                </div>
                {previewUrl && !isProcessing && (
                  <button 
                    onClick={handleReroll}
                    className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-all ${activeTab === 'image' ? 'text-emerald-400' : 'text-purple-400'}`}
                  >
                    Gửi Lại
                  </button>
                )}
              </div>
              <textarea 
                value={concept}
                onChange={(e) => updateTabCache(activeTab, { concept: e.target.value })}
                placeholder={activeTab === 'image' ? "Mô tả thêm về thế giới bạn muốn tạo từ ảnh này..." : "Hướng dẫn AI cách xây dựng thế giới quanh nhân vật này..."}
                className={`w-full bg-black/40 border border-white/5 rounded-2xl px-4 py-3 text-neutral-300 text-xs leading-relaxed h-24 resize-none outline-none custom-scrollbar transition-all ${activeTab === 'image' ? 'focus:border-emerald-500/50' : 'focus:border-purple-500/50'}`}
              />
              <p className="text-[9px] mono text-neutral-600 uppercase tracking-widest italic">
                * AI sẽ sử dụng ý tưởng này để định hướng quá trình kiến tạo.
              </p>
            </div>

            {/* ST Card Info - Always Visible if exists */}
            {activeTab === 'st-card' && stRawData && (
              <div className="p-6 bg-purple-500/5 border border-purple-500/20 rounded-[2.5rem] space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-3 text-purple-400">
                  <FileJson size={18} />
                  <h4 className="text-xs font-black uppercase tracking-widest">Thông Tin Thẻ ST</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[8px] mono text-neutral-600 uppercase">Tên Nhân Vật</p>
                    <p className="text-sm font-bold text-white">{stRawData.name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] mono text-neutral-600 uppercase">Phiên Bản</p>
                    <p className="text-sm font-bold text-white">{stRawData.creator_notes || stRawData.version || 'N/A'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[8px] mono text-neutral-600 uppercase">Kịch Bản</p>
                    <p className="text-[10px] text-neutral-400 line-clamp-2 italic">
                      {stRawData.scenario || "Mặc định"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] mono text-neutral-600 uppercase">Lời Chào</p>
                    <p className="text-[10px] text-neutral-400 line-clamp-2 italic">
                      {stRawData.first_mes || "Mặc định"}
                    </p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[8px] mono text-neutral-600 uppercase">Mô Tả Gốc</p>
                  <p className="text-[10px] text-neutral-400 line-clamp-4 leading-relaxed italic">
                    {stRawData.description || stRawData.personality || "Không có mô tả chi tiết."}
                  </p>
                </div>
              </div>
            )}

            {/* Processing Indicator */}
            {isProcessing && (
              <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className={`w-12 h-12 border-2 rounded-full animate-spin ${activeTab === 'image' ? 'border-emerald-500/20 border-t-emerald-500' : 'border-purple-500/20 border-t-purple-500'}`}></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Zap size={16} className={activeTab === 'image' ? 'text-emerald-500' : 'text-purple-500'} />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-widest">Đang Phân Tích Lượng Tử...</h4>
                    <p className="text-[10px] mono text-neutral-500 uppercase tracking-widest mt-1">Vui lòng giữ kết nối ổn định</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 bg-black/40 rounded-xl border border-white/5">
                  <Clock size={14} className="text-neutral-500" />
                  <span className="text-sm mono font-bold text-white">{formatTime(timer)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Data Info */}
          <div className="space-y-8 flex flex-col h-full">
            {importedData ? (
              <div className="flex-grow space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                <div className={`p-6 lg:p-10 rounded-[2.5rem] border ${activeTab === 'image' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-purple-500/5 border-purple-500/20'} space-y-8`}>
                  
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-white uppercase tracking-widest italic flex items-center gap-3">
                      <Zap size={20} className={activeTab === 'image' ? "text-emerald-500" : "text-purple-500"} />
                      Dữ Liệu Kiến Tạo
                    </h3>
                    <button 
                      onClick={handleReroll}
                      disabled={isProcessing}
                      className={`flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-neutral-400 transition-all border border-white/5 disabled:opacity-50 ${activeTab === 'image' ? 'hover:text-emerald-400' : 'hover:text-purple-400'}`}
                    >
                      <RefreshCw size={12} className={isProcessing ? "animate-spin" : ""} />
                      Reroll
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* World Info */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] mono text-neutral-500 uppercase tracking-[0.3em]">Tên Thế Giới</label>
                        <input 
                          type="text"
                          value={importedData.title}
                          onChange={(e) => handleDataChange('title', e.target.value)}
                          className={`w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white text-lg font-bold outline-none ${activeTab === 'image' ? 'focus:border-emerald-500/50' : 'focus:border-purple-500/50'}`}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] mono text-neutral-500 uppercase tracking-[0.3em]">Mô Tả Thế Giới</label>
                        <textarea 
                          value={importedData.description}
                          onChange={(e) => handleDataChange('description', e.target.value)}
                          className={`w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-neutral-300 text-sm leading-relaxed h-24 resize-none outline-none custom-scrollbar ${activeTab === 'image' ? 'focus:border-emerald-500/50' : 'focus:border-purple-500/50'}`}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] mono text-neutral-500 uppercase tracking-[0.3em]">Kịch Bản Khởi Đầu</label>
                        <textarea 
                          value={importedData.scenario}
                          onChange={(e) => handleDataChange('scenario', e.target.value)}
                          className={`w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-neutral-400 text-xs italic leading-relaxed h-24 resize-none outline-none custom-scrollbar ${activeTab === 'image' ? 'focus:border-emerald-500/50' : 'focus:border-purple-500/50'}`}
                        />
                      </div>
                    </div>

                    {/* MC Info */}
                    <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-4">
                      <div className={`flex items-center gap-2 ${activeTab === 'image' ? 'text-emerald-500' : 'text-purple-500'}`}>
                        <User size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Nhân Vật Chính (MC)</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[8px] mono text-neutral-600 uppercase">Tên</label>
                          <input 
                            type="text"
                            value={importedData.player?.name}
                            onChange={(e) => handleDataChange('player.name', e.target.value)}
                            className={`w-full bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-xs text-white outline-none ${activeTab === 'image' ? 'focus:border-emerald-500/50' : 'focus:border-purple-500/50'}`}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] mono text-neutral-600 uppercase">Tính Cách</label>
                          <input 
                            type="text"
                            value={importedData.player?.personality}
                            onChange={(e) => handleDataChange('player.personality', e.target.value)}
                            className={`w-full bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-xs text-white outline-none ${activeTab === 'image' ? 'focus:border-emerald-500/50' : 'focus:border-purple-500/50'}`}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] mono text-neutral-600 uppercase">Tiểu Sử</label>
                        <textarea 
                          value={importedData.player?.background}
                          onChange={(e) => handleDataChange('player.background', e.target.value)}
                          className={`w-full bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-[10px] text-neutral-400 h-16 resize-none outline-none custom-scrollbar ${activeTab === 'image' ? 'focus:border-emerald-500/50' : 'focus:border-purple-500/50'}`}
                        />
                      </div>
                    </div>

                    {/* NPCs Info */}
                    {importedData.npcs && importedData.npcs.length > 0 && (
                      <div className="space-y-4">
                        <div className={`flex items-center gap-2 ${activeTab === 'image' ? 'text-blue-500' : 'text-purple-500'}`}>
                          <Users size={16} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Các NPC Quan Trọng ({importedData.npcs.length})</span>
                        </div>
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                          {importedData.npcs.map((npc: any, idx: number) => (
                            <div key={idx} className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <input 
                                  type="text"
                                  value={npc.name}
                                  onChange={(e) => handleNpcChange(idx, 'name', e.target.value)}
                                  placeholder="Tên NPC"
                                  className={`bg-black/20 border border-white/5 rounded-lg px-3 py-1.5 text-[10px] text-white outline-none ${activeTab === 'image' ? 'focus:border-blue-500/50' : 'focus:border-purple-500/50'}`}
                                />
                                <input 
                                  type="text"
                                  value={npc.personality}
                                  onChange={(e) => handleNpcChange(idx, 'personality', e.target.value)}
                                  placeholder="Tính cách"
                                  className={`bg-black/20 border border-white/5 rounded-lg px-3 py-1.5 text-[10px] text-white outline-none ${activeTab === 'image' ? 'focus:border-blue-500/50' : 'focus:border-purple-500/50'}`}
                                />
                              </div>
                              <textarea 
                                value={npc.description}
                                onChange={(e) => handleNpcChange(idx, 'description', e.target.value)}
                                placeholder="Mô tả NPC"
                                className={`w-full bg-black/20 border border-white/5 rounded-lg px-3 py-1.5 text-[10px] text-neutral-400 h-12 resize-none outline-none custom-scrollbar ${activeTab === 'image' ? 'focus:border-blue-500/50' : 'focus:border-purple-500/50'}`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={() => onImport(importedData)}
                    className={`w-full py-6 rounded-2xl font-black text-white uppercase tracking-[0.3em] transition-all active:scale-95 shadow-2xl ${activeTab === 'image' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20' : 'bg-purple-600 hover:bg-purple-500 shadow-purple-500/20'}`}
                  >
                    Bắt Đầu
                  </button>
                </div>
              </div>
            ) : stRawData ? (
              <div className="flex-grow flex flex-col items-center justify-center p-12 border border-purple-500/20 rounded-[3rem] bg-purple-500/5 animate-in fade-in duration-500">
                <div className="w-20 h-20 rounded-3xl bg-purple-500/20 flex items-center justify-center text-purple-400 mb-8 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                  <FileJson size={40} />
                </div>
                <h4 className="text-xl font-black text-white uppercase tracking-[0.2em] text-center">Dữ Liệu Card Đã Sẵn Sàng</h4>
                <p className="text-xs text-neutral-400 uppercase tracking-widest mt-4 text-center max-w-xs leading-relaxed">
                  Nhân vật <span className="text-purple-400 font-bold">{stRawData.name}</span> đã được tải. Nhấn nút bên dưới để AI bắt đầu kiến tạo thế giới.
                </p>
                <button 
                  onClick={handleProcessStCard}
                  disabled={isProcessing}
                  className="mt-10 px-12 py-5 bg-purple-600 hover:bg-purple-500 text-white font-black uppercase tracking-[0.3em] rounded-2xl transition-all active:scale-95 shadow-2xl shadow-purple-500/20 disabled:opacity-50"
                >
                  Xử Lý Dữ Liệu
                </button>
              </div>
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center p-12 border border-white/5 rounded-[3rem] bg-white/[0.01] border-dashed">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-neutral-700 mb-6">
                  <Zap size={40} />
                </div>
                <h4 className="text-lg font-black text-neutral-500 uppercase tracking-[0.2em] text-center">Chờ Đợi Dữ Liệu...</h4>
                <p className="text-xs text-neutral-600 uppercase tracking-widest mt-2 text-center">Tải lên tệp tin để bắt đầu quá trình trích xuất</p>
                
                {activeTab === 'st-card' && !stRawData && (
                  <div className="mt-8 p-4 bg-purple-500/5 border border-purple-500/20 rounded-2xl text-center max-w-xs">
                    <p className="text-[10px] text-purple-400 font-bold uppercase tracking-widest leading-relaxed">
                      Lưu ý: Hỗ trợ Card ST định dạng PNG (V1/V2), WebP và JSON.
                    </p>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-[2rem] flex items-start gap-4 animate-in shake duration-300">
                <AlertTriangle className="text-rose-500 shrink-0 mt-1" size={24} />
                <div>
                  <h5 className="text-sm font-black text-rose-500 uppercase tracking-widest mb-1">Lỗi Hệ Thống</h5>
                  <p className="text-xs text-rose-400 font-bold uppercase leading-relaxed">{error}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Removed */}

      <style>{`
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
