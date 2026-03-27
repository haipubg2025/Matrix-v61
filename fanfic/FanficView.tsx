import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Search, User, Users, BookOpen, Send, Sparkles, Plus, Trash2, LayoutGrid, PenTool, ChevronDown, ChevronUp, X, Home, Download, Upload, RotateCcw } from 'lucide-react';
import { FANFIC_WORKS } from './data';
import { FanficWork, FanficCharacter, FanficCountry } from './types';
import { AppSettings } from '../types';

import { idbService, STORES } from '../services/idbService';

type FanficTab = 'preset' | 'custom' | 'remix';

interface Props {
  onBack: () => void;
  onExit: () => void;
  onStartGame: (work: FanficWork, mc: FanficCharacter, npcs: FanficCharacter[], customPrompt: string) => void;
  settings: AppSettings;
}

export const FanficView: React.FC<Props> = ({ onBack, onExit, onStartGame, settings }) => {
  const [activeTab, setActiveTab] = useState<FanficTab>('preset');
  const [works, setWorks] = useState<FanficWork[]>(FANFIC_WORKS);
  const [selectedWork, setSelectedWork] = useState<FanficWork | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load from IndexedDB on mount
  useEffect(() => {
    const loadWorks = async () => {
      const savedWorks = await idbService.get(STORES.FANFIC_WORKS, 'custom_list');
      if (savedWorks && Array.isArray(savedWorks)) {
        setWorks(savedWorks);
      }
    };
    loadWorks();
  }, []);

  // Save to IndexedDB whenever works change
  useEffect(() => {
    const saveWorks = async () => {
      if (works !== FANFIC_WORKS) {
        await idbService.set(STORES.FANFIC_WORKS, 'custom_list', works);
      }
    };
    saveWorks();
  }, [works]);

  const handleExport = () => {
    const dataStr = JSON.stringify(works, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `fanfic_works_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          // Basic validation
          const isValid = parsed.every(w => w.id && w.title && Array.isArray(w.characters));
          if (isValid) {
            // Merge logic: Add new works, avoid duplicates by ID
            setWorks(prevWorks => {
              const existingIds = new Set(prevWorks.map(w => w.id));
              const newWorks = parsed.filter(w => !existingIds.has(w.id));
              return [...prevWorks, ...newWorks];
            });
            setSelectedWork(null);
            // Success import
          } else {
            // Invalid format
          }
        }
      } catch (err) {
        // Read error
      }
    };
    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleReset = async () => {
    if (window.confirm('Bạn có chắc chắn muốn khôi phục danh sách tác phẩm gốc? Toàn bộ thay đổi đã nhập sẽ bị mất.')) {
      setWorks(FANFIC_WORKS);
      await idbService.delete(STORES.FANFIC_WORKS, 'custom_list');
      setSelectedWork(null);
      // Reset success
    }
  };

  const [selectedMc, setSelectedMc] = useState<FanficCharacter | null>(null);
  const [isCreatingNewMc, setIsCreatingNewMc] = useState(false);
  const [newMcData, setNewMcData] = useState<FanficCharacter>({ id: `mc_${Date.now()}`, name: '', gender: 'Nam', age: '', role: '', description: '' });
  const [customPrompt, setCustomPrompt] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<FanficCountry | 'Tất cả'>('Tất cả');
  const [isWorksCollapsed, setIsWorksCollapsed] = useState(false);
  const [isCharListCollapsed, setIsCharListCollapsed] = useState(false);

  // Custom Work State
  const [customWork, setCustomWork] = useState<Partial<FanficWork>>({
    title: '',
    description: '',
    characters: []
  });
  const [customMc, setCustomMc] = useState<FanficCharacter>({ id: `mc_${Date.now()}`, name: '', gender: 'Nam', age: '', role: '', description: '' });
  const [customNpcs, setCustomNpcs] = useState<FanficCharacter[]>([]);

  // Remix State
  const [remixSelectedWorkIds, setRemixSelectedWorkIds] = useState<string[]>([]);
  const [remixMc, setRemixMc] = useState<FanficCharacter>({ id: `mc_${Date.now()}`, name: '', gender: 'Nam', age: '', role: '', description: '' });
  const [remixSearchTerm, setRemixSearchTerm] = useState('');
  const [remixSelectedCountry, setRemixSelectedCountry] = useState<FanficCountry | 'Tất cả'>('Tất cả');

  const filteredWorks = works.filter(w => {
    const matchesSearch = w.title.toLowerCase().includes(searchTerm.toLowerCase());
    if (selectedCountry === 'Tất cả') return matchesSearch;
    if (selectedCountry === 'Khác') return matchesSearch && !['Trung', 'Nhật', 'Hàn', 'Việt Nam'].includes(w.country || '');
    return matchesSearch && w.country === selectedCountry;
  });

  const countryCounts = {
    'Tất cả': works.length,
    'Trung': works.filter(w => w.country === 'Trung').length,
    'Nhật': works.filter(w => w.country === 'Nhật').length,
    'Hàn': works.filter(w => w.country === 'Hàn').length,
    'Việt Nam': works.filter(w => w.country === 'Việt Nam').length,
    'Khác': works.filter(w => !w.country || !['Trung', 'Nhật', 'Hàn', 'Việt Nam'].includes(w.country)).length,
  };

  const handleStart = () => {
    if (activeTab === 'preset') {
      if (selectedWork && (selectedMc || (isCreatingNewMc && newMcData.name))) {
        const finalMc = isCreatingNewMc ? newMcData : selectedMc!;
        const finalNpcs = selectedWork.characters.filter(c => c.name !== finalMc.name);
        onStartGame(selectedWork, finalMc, finalNpcs, customPrompt);
      }
    } else if (activeTab === 'custom') {
      if (customWork.title && customMc.name) {
        const fullWork: FanficWork = {
          id: `custom_${Date.now()}`,
          title: customWork.title,
          description: customWork.description || '',
          characters: [customMc, ...customNpcs]
        };
        onStartGame(fullWork, customMc, customNpcs, customPrompt);
      }
    } else if (activeTab === 'remix') {
      if (remixSelectedWorkIds.length > 0 && remixMc.name) {
        const selectedWorks = works.filter(w => remixSelectedWorkIds.includes(w.id));
        const combinedTitle = `Remix: ${selectedWorks.map(w => w.title).join(' x ')}`;
        const combinedDescription = `Thế giới hỗn hợp giữa: ${selectedWorks.map(w => w.title).join(', ')}.`;
        
        // Collect all NPCs from all selected works
        const allNpcs: FanficCharacter[] = [];
        selectedWorks.forEach(w => {
          w.characters.forEach(c => {
            if (c.name !== remixMc.name) {
              allNpcs.push(c);
            }
          });
        });

        const fullWork: FanficWork = {
          id: `remix_${Date.now()}`,
          title: combinedTitle,
          description: combinedDescription,
          characters: [remixMc, ...allNpcs]
        };
        
        const remixPrompt = `Đây là một thế giới Remix (Crossover) giữa các tác phẩm: ${selectedWorks.map(w => w.title).join(', ')}.\n` + 
                           `Hãy kết hợp các hệ thống sức mạnh, bối cảnh và nhân vật của các thế giới này một cách logic và hấp dẫn.\n` +
                           (customPrompt ? `Yêu cầu bổ sung: ${customPrompt}` : "");

        onStartGame(fullWork, remixMc, allNpcs, remixPrompt);
      }
    }
  };

  const addCustomNpc = () => {
    setCustomNpcs([...customNpcs, { id: `npc_${Date.now()}_${customNpcs.length}`, name: '', gender: 'Nam', age: '', role: '', description: '' }]);
  };

  const removeCustomNpc = (index: number) => {
    setCustomNpcs(customNpcs.filter((_, i) => i !== index));
  };

  const updateCustomNpc = (index: number, field: keyof FanficCharacter, value: string) => {
    const newNpcs = [...customNpcs];
    newNpcs[index] = { ...newNpcs[index], [field]: value };
    setCustomNpcs(newNpcs);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0a] text-white overflow-hidden flex flex-col">
      {/* Header */}
      <header className="p-4 md:p-6 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between bg-black/40 backdrop-blur-md gap-4">
        <div className="flex items-center justify-between md:justify-start gap-4">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                if (selectedWork) setSelectedWork(null);
                else onBack();
              }}
              className="p-2 hover:bg-white/10 rounded-full transition-colors flex items-center gap-2 group"
              title="Quay lại"
            >
              <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
              <span className="hidden md:block text-xs font-bold uppercase tracking-widest opacity-50 group-hover:opacity-100 transition-opacity">Quay Lại</span>
            </button>

            <button 
              onClick={onExit}
              className="p-2 hover:bg-red-500/20 text-neutral-500 hover:text-red-500 rounded-full transition-all flex items-center gap-2 group"
              title="Thoát về trang chủ"
            >
              <Home className="w-6 h-6 group-hover:scale-110 transition-transform" />
              <span className="hidden md:block text-xs font-bold uppercase tracking-widest opacity-50 group-hover:opacity-100 transition-opacity">Trang Chủ</span>
            </button>
          </div>

          <div className="text-right md:text-left">
            <h1 className="text-lg md:text-2xl font-bold tracking-tight flex items-center justify-end md:justify-start gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Đồng Nhân
            </h1>
          </div>
        </div>

        {/* Import/Export Buttons */}
        <div className="flex items-center gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImport} 
            accept=".json" 
            className="hidden" 
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all"
            title="Nhập dữ liệu"
          >
            <Upload className="w-3 h-3" />
            Nhập
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all"
            title="Xuất dữ liệu"
          >
            <Download className="w-3 h-3" />
            Xuất
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-red-500/20 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all text-neutral-500 hover:text-red-400"
            title="Khôi phục gốc"
          >
            <RotateCcw className="w-3 h-3" />
            Gốc
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 self-start md:self-center">
          <button
            onClick={() => setActiveTab('preset')}
            className={`flex items-center gap-0.5 md:gap-2 px-1.5 md:px-6 py-0.5 md:py-2 rounded-xl text-[8px] md:text-sm font-bold transition-all ${
              activeTab === 'preset' 
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' 
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <LayoutGrid className="w-3 h-3 md:w-4 md:h-4" />
            Có Sẵn
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`flex items-center gap-0.5 md:gap-2 px-1.5 md:px-6 py-0.5 md:py-2 rounded-xl text-[8px] md:text-sm font-bold transition-all ${
              activeTab === 'custom' 
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' 
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <PenTool className="w-3 h-3 md:w-4 md:h-4" />
            Tự Do
          </button>
          <button
            onClick={() => setActiveTab('remix')}
            className={`flex items-center gap-0.5 md:gap-2 px-1.5 md:px-6 py-0.5 md:py-2 rounded-xl text-[8px] md:text-sm font-bold transition-all ${
              activeTab === 'remix' 
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' 
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <RotateCcw className="w-3 h-3 md:w-4 md:h-4" />
            Remix
          </button>
        </div>
      </header>

      <div className="flex-grow overflow-y-auto md:overflow-hidden flex flex-col md:flex-row custom-scrollbar">
        {activeTab === 'preset' ? (
          <>
            {/* Left Panel: Work Selection */}
            <div className={`w-full md:w-1/3 border-r border-white/10 flex flex-col bg-neutral-900/20 ${selectedWork && settings.mobileMode ? 'hidden' : 'flex'}`}>
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2 text-purple-400">
                  <LayoutGrid className="w-4 h-4" />
                  <h3 className="font-bold uppercase text-[10px] tracking-[0.2em]">Danh Sách Tác Phẩm</h3>
                </div>
                <button 
                  onClick={() => setIsWorksCollapsed(!isWorksCollapsed)}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                >
                  {isWorksCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </button>
              </div>

              <AnimatePresence>
                {!isWorksCollapsed && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="flex flex-col overflow-hidden"
                  >
                    <div className="p-2 md:p-4 border-b border-white/10 space-y-2 md:space-y-4">
                      {/* Country Filter */}
                      <div className="flex flex-wrap gap-1 md:gap-2">
                        {(['Tất cả', 'Trung', 'Nhật', 'Hàn', 'Việt Nam', 'Khác'] as const).map((country) => (
                          <button
                            key={country}
                            onClick={() => setSelectedCountry(country)}
                            className={`px-2 py-1 md:px-3 md:py-1.5 rounded-lg text-[8px] md:text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 md:gap-2 ${
                              selectedCountry === country
                                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                                : 'bg-white/5 text-neutral-500 hover:bg-white/10 hover:text-neutral-300'
                            }`}
                          >
                            {country}
                            <span className={`px-1 py-0.5 rounded-md text-[7px] md:text-[9px] ${
                              selectedCountry === country ? 'bg-white/20' : 'bg-white/5'
                            }`}>
                              {countryCounts[country]}
                            </span>
                          </button>
                        ))}
                      </div>

                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 md:w-4 md:h-4 text-neutral-500" />
                        <input 
                          type="text"
                          placeholder="Tìm kiếm tác phẩm..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-1.5 md:py-2 pl-8 md:pl-10 pr-4 text-xs md:text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
                        />
                      </div>
                    </div>
                    
                    <div className="max-h-[300px] md:max-h-none overflow-y-auto p-1 md:p-4 space-y-1 md:space-y-3 md:custom-scrollbar">
                      {filteredWorks.map(work => (
                        <button
                          key={work.id}
                          onClick={() => {
                            setSelectedWork(work);
                            setSelectedMc(null);
                            setIsCreatingNewMc(false);
                            setNewMcData({ name: '', role: '', description: '' });
                          }}
                          className={`w-full text-left p-2 md:p-4 rounded-lg md:rounded-2xl border transition-all group relative overflow-hidden ${
                            selectedWork?.id === work.id 
                              ? 'bg-purple-500/10 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.15)]' 
                              : 'bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex gap-2 md:gap-4 items-center relative z-10">
                            <div className="flex-grow">
                              <h3 className="font-bold text-xs md:text-sm group-hover:text-purple-400 transition-colors">{work.title}</h3>
                              {work.country && (
                                <span className="text-[9px] uppercase tracking-widest font-black text-neutral-500 mt-1 block">
                                  {work.country}
                                </span>
                              )}
                            </div>
                          </div>
                          {selectedWork?.id === work.id && (
                            <motion.div 
                              layoutId="active-work"
                              className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent pointer-events-none"
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right Panel: Configuration */}
            <div className={`flex-grow md:overflow-y-auto p-2 md:p-8 md:custom-scrollbar bg-black/20 ${!selectedWork && settings.mobileMode ? 'hidden' : 'flex flex-col'}`}>
              <AnimatePresence mode="wait">
                {selectedWork ? (
                  <motion.div
                    key={selectedWork.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="w-full space-y-4 md:space-y-8"
                  >
                    {/* Mobile Back Button */}
                    <button 
                      onClick={() => setSelectedWork(null)}
                      className="md:hidden flex items-center gap-2 text-purple-400 font-bold text-xs mb-4"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Quay lại danh sách
                    </button>

                    {/* Work Info */}
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <h2 className="text-3xl font-black tracking-tight">{selectedWork.title}</h2>
                        <p className="text-neutral-400 text-sm leading-relaxed">{selectedWork.description}</p>
                      </div>

                      {selectedWork.plot && (
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
                          <h3 className="text-xs font-bold uppercase tracking-widest text-purple-400">Cốt Truyện</h3>
                          <p className="text-sm text-neutral-300 leading-relaxed">{selectedWork.plot}</p>
                        </div>
                      )}

                      {selectedWork.worldSetting && (
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
                          <h3 className="text-xs font-bold uppercase tracking-widest text-blue-400">Bối Cảnh Thế Giới</h3>
                          <p className="text-sm text-neutral-300 leading-relaxed">{selectedWork.worldSetting}</p>
                        </div>
                      )}
                    </div>

                    {/* Character Selection */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-purple-400">
                        <div className="flex items-center gap-2">
                          <User className="w-5 h-5" />
                          <h3 className="font-bold uppercase text-xs tracking-widest">Chọn Nhân Vật Của Bạn</h3>
                        </div>
                        <button 
                          onClick={() => setIsCharListCollapsed(!isCharListCollapsed)}
                          className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                        >
                          {isCharListCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                        </button>
                      </div>
                      
                      <AnimatePresence>
                        {!isCharListCollapsed && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-2 overflow-hidden"
                          >
                            {/* New Character Option */}
                            <div className={`transition-all duration-300 ${isCreatingNewMc ? 'col-span-full' : ''}`}>
                              <button
                                onClick={() => {
                                  if (isCreatingNewMc) {
                                    setIsCreatingNewMc(false);
                                  } else {
                                    setIsCreatingNewMc(true);
                                    setSelectedMc(null);
                                  }
                                }}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                                  isCreatingNewMc
                                    ? 'bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-600/20'
                                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                                }`}
                              >
                                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                                  <Plus className="w-4 h-4 text-purple-400" />
                                </div>
                                <div className="flex-grow">
                                  <div className="text-sm font-bold">Nhân Vật Mới</div>
                                  <div className={`text-[10px] ${isCreatingNewMc ? 'text-purple-100' : 'text-neutral-500'}`}>Tạo nhân vật của riêng bạn</div>
                                </div>
                                {isCreatingNewMc && <ChevronUp className="w-4 h-4 text-purple-200" />}
                              </button>

                              <AnimatePresence>
                                {isCreatingNewMc && (
                                  <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-2 p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl space-y-3 overflow-hidden"
                                  >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      <div className="space-y-1">
                                        <label className="text-[8px] uppercase tracking-widest text-purple-300 ml-1">Tên Nhân Vật</label>
                                        <input 
                                          type="text"
                                          placeholder="Nhập tên..."
                                          value={newMcData.name}
                                          onChange={(e) => setNewMcData({...newMcData, name: e.target.value})}
                                          className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500/50"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[8px] uppercase tracking-widest text-purple-300 ml-1">Vai Trò / Thân Phận</label>
                                        <input 
                                          type="text"
                                          placeholder="Ví dụ: Học sinh, Tướng quân..."
                                          value={newMcData.role}
                                          onChange={(e) => setNewMcData({...newMcData, role: e.target.value})}
                                          className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-purple-500/50"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[8px] uppercase tracking-widest text-purple-300 ml-1">Giới Tính</label>
                                        <select 
                                          value={newMcData.gender}
                                          onChange={(e) => setNewMcData({...newMcData, gender: e.target.value})}
                                          className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-purple-500/50"
                                        >
                                          <option value="Nam">Nam</option>
                                          <option value="Nữ">Nữ</option>
                                          <option value="Khác">Khác</option>
                                        </select>
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[8px] uppercase tracking-widest text-purple-300 ml-1">Tuổi</label>
                                        <input 
                                          type="text"
                                          placeholder="Ví dụ: 18, 1000..."
                                          value={newMcData.age}
                                          onChange={(e) => setNewMcData({...newMcData, age: e.target.value})}
                                          className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-purple-500/50"
                                        />
                                      </div>
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[8px] uppercase tracking-widest text-purple-300 ml-1">Mô Tả / Tính Cách</label>
                                      <textarea 
                                        placeholder="Mô tả tính cách, khả năng hoặc xuất thân..."
                                        value={newMcData.description}
                                        onChange={(e) => setNewMcData({...newMcData, description: e.target.value})}
                                        className="w-full h-20 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-purple-500/50 resize-none"
                                      />
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>

                            {selectedWork.characters.map(char => (
                              <div key={char.name} className={`transition-all duration-300 ${selectedMc?.name === char.name ? 'col-span-full' : ''}`}>
                                <button
                                  onClick={() => {
                                    if (selectedMc?.name === char.name) {
                                      setSelectedMc(null);
                                    } else {
                                      setSelectedMc(char);
                                      setIsCreatingNewMc(false);
                                    }
                                  }}
                                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                                    selectedMc?.name === char.name
                                      ? 'bg-purple-500 border-purple-400 text-white shadow-lg shadow-purple-500/20'
                                      : 'bg-white/5 border-white/5 hover:bg-white/10'
                                  }`}
                                >
                                  <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-[10px] font-bold">
                                    {char.name[0]}
                                  </div>
                                  <div className="flex-grow">
                                    <div className="text-sm font-bold">{char.name}</div>
                                    <div className="flex items-center gap-2">
                                      <div className={`text-[10px] ${selectedMc?.name === char.name ? 'text-purple-100' : 'text-neutral-500'}`}>{char.role}</div>
                                      <div className="flex items-center gap-1">
                                        <span className={`text-[9px] font-bold ${char.gender === 'Nữ' ? 'text-pink-400' : 'text-blue-400'}`}>
                                          {char.gender === 'Nữ' ? '♀' : '♂'}
                                        </span>
                                        <span className="text-[9px] text-neutral-500 font-mono">[{char.age}]</span>
                                      </div>
                                    </div>
                                  </div>
                                  {selectedMc?.name === char.name && (
                                    <div className="flex items-center gap-2">
                                      <div className="px-2 py-0.5 bg-white/20 rounded text-[8px] font-black uppercase tracking-widest">MC</div>
                                      <ChevronUp className="w-4 h-4 text-purple-200" />
                                    </div>
                                  )}
                                </button>

                                <AnimatePresence>
                                  {selectedMc?.name === char.name && (
                                    <motion.div 
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      exit={{ opacity: 0, height: 0 }}
                                      className="mt-2 p-4 bg-white/5 border border-white/10 rounded-xl space-y-3 overflow-hidden"
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                          {char.gender && (
                                            <div className="flex flex-col">
                                              <span className="text-[8px] uppercase tracking-widest text-neutral-500">Giới Tính</span>
                                              <span className="text-xs font-bold">{char.gender}</span>
                                            </div>
                                          )}
                                          {char.age && (
                                            <div className="flex flex-col">
                                              <span className="text-[8px] uppercase tracking-widest text-neutral-500">Tuổi</span>
                                              <span className="text-xs font-bold">{char.age}</span>
                                            </div>
                                          )}
                                          <div className="flex flex-col">
                                            <span className="text-[8px] uppercase tracking-widest text-neutral-500">Vai Trò</span>
                                            <span className="text-xs font-bold text-purple-400">{char.role}</span>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="space-y-1">
                                        <span className="text-[8px] uppercase tracking-widest text-neutral-500">Thông Tin Chi Tiết</span>
                                        <p className="text-xs text-neutral-300 leading-relaxed italic">
                                          "{char.description}"
                                        </p>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Custom Prompt */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-emerald-400">
                        <BookOpen className="w-5 h-5" />
                        <h3 className="font-bold uppercase text-xs tracking-widest">Nội dung tùy ý / Điểm khởi đầu</h3>
                      </div>
                      <textarea
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder="Ví dụ: Tôi muốn xuyên không vào thân xác Đường Tam lúc 6 tuổi, hoặc bắt đầu tại Làng Lá sau cuộc tấn công của Cửu Vĩ..."
                        className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors resize-none"
                      />
                    </div>

                    {/* Action */}
                    <div className="pt-8">
                      <button
                        onClick={handleStart}
                        disabled={!selectedMc && (!isCreatingNewMc || !newMcData.name)}
                        className={`w-full py-4 rounded-2xl font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all ${
                          selectedMc || (isCreatingNewMc && newMcData.name)
                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 shadow-xl shadow-purple-500/20 active:scale-[0.98]' 
                            : 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
                        }`}
                      >
                        <Send className="w-5 h-5" />
                        Khởi Tạo Thực Tại Đồng Nhân
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                    <BookOpen className="w-16 h-16 text-neutral-700" />
                    <div>
                      <h3 className="text-xl font-bold">Chọn một tác phẩm gốc</h3>
                      <p className="text-sm text-neutral-500">Bắt đầu hành trình sáng tạo của bạn từ danh sách bên trái</p>
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </>
        ) : activeTab === 'custom' ? (
          /* Custom Mode */
          <div className={`flex-grow md:overflow-y-auto p-2 md:p-8 md:custom-scrollbar bg-black/20`}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full space-y-4 md:space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                {/* Work Details */}
                <div className="space-y-3 md:space-y-6">
                  <div className="flex items-center gap-2 text-purple-400">
                    <BookOpen className="w-5 h-5" />
                    <h3 className="font-bold uppercase text-xs tracking-widest">Thông Tin Tác Phẩm</h3>
                  </div>
                  
                  <div className="space-y-2 md:space-y-4">
                    <div className="relative group">
                      <label className="block text-[10px] uppercase tracking-widest text-neutral-500 mb-1 ml-1">Tên Tác Phẩm</label>
                      <div className="relative">
                        <Plus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 group-focus-within:text-purple-400 transition-colors" />
                        <input 
                          type="text"
                          placeholder="Ví dụ: Harry Potter, Naruto..."
                          value={customWork.title}
                          onChange={(e) => setCustomWork({...customWork, title: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 md:py-3 text-sm focus:outline-none focus:border-purple-500/50 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-neutral-500 mb-1 ml-1">Mô Tả Thế Giới</label>
                      <textarea 
                        placeholder="Mô tả ngắn về bối cảnh, hệ thống sức mạnh..."
                        value={customWork.description}
                        onChange={(e) => setCustomWork({...customWork, description: e.target.value})}
                        className="w-full h-24 bg-white/5 border border-white/10 rounded-xl px-3 md:px-4 py-2 md:py-3 text-sm focus:outline-none focus:border-purple-500/50 resize-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* MC Details */}
                <div className="space-y-3 md:space-y-6">
                  <div className="flex items-center gap-2 text-blue-400">
                    <User className="w-5 h-5" />
                    <h3 className="font-bold uppercase text-xs tracking-widest">Nhân Vật Chính (MC)</h3>
                  </div>
                  
                  <div className="space-y-2 md:space-y-4">
                    <div className="relative group">
                      <label className="block text-[10px] uppercase tracking-widest text-neutral-500 mb-1 ml-1">Tên Nhân Vật</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 group-focus-within:text-blue-400 transition-colors" />
                        <input 
                          type="text"
                          placeholder="Tên của bạn trong truyện..."
                          value={customMc.name}
                          onChange={(e) => setCustomMc({...customMc, name: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 md:py-3 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-neutral-500 mb-1 ml-1">Giới Tính</label>
                        <select 
                          value={customMc.gender}
                          onChange={(e) => setCustomMc({...customMc, gender: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 md:px-4 py-2 md:py-3 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                        >
                          <option value="Nam">Nam</option>
                          <option value="Nữ">Nữ</option>
                          <option value="Khác">Khác</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-neutral-500 mb-1 ml-1">Tuổi</label>
                        <input 
                          type="text"
                          placeholder="Tuổi..."
                          value={customMc.age}
                          onChange={(e) => setCustomMc({...customMc, age: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 md:px-4 py-2 md:py-3 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-neutral-500 mb-1 ml-1">Vai Trò / Thân Phận</label>
                      <input 
                        type="text"
                        placeholder="Ví dụ: Học sinh Hogwarts, Ninja Làng Lá..."
                        value={customMc.role}
                        onChange={(e) => setCustomMc({...customMc, role: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 md:px-4 py-2 md:py-3 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-neutral-500 mb-1 ml-1">Tính Cách / Đặc Điểm</label>
                      <textarea 
                        placeholder="Mô tả tính cách hoặc khả năng đặc biệt..."
                        value={customMc.description}
                        onChange={(e) => setCustomMc({...customMc, description: e.target.value})}
                        className="w-full h-24 bg-white/5 border border-white/10 rounded-xl px-3 md:px-4 py-2 md:py-3 text-sm focus:outline-none focus:border-blue-500/50 resize-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* NPCs */}
              <div className="space-y-3 md:space-y-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <Users className="w-5 h-5" />
                      <h3 className="font-bold uppercase text-xs tracking-widest">Nhân Vật Phụ (NPCs)</h3>
                    </div>
                    <button 
                      onClick={addCustomNpc}
                      className="flex items-center gap-2 px-3 md:px-6 py-2 md:py-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20 text-[10px] md:text-xs font-black hover:bg-emerald-500 hover:text-black transition-all shadow-[0_0_20px_rgba(16,185,129,0.1)] active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                      Thêm NPC
                    </button>
                  </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
                  {customNpcs.map((npc, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/10 rounded-xl md:rounded-2xl p-2 md:p-4 space-y-1 md:space-y-3 relative group">
                      <button 
                        onClick={() => removeCustomNpc(idx)}
                        className="absolute top-1 right-1 p-1 text-neutral-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                      </button>
                      <input 
                        type="text"
                        placeholder="Tên NPC"
                        value={npc.name}
                        onChange={(e) => updateCustomNpc(idx, 'name', e.target.value)}
                        className="w-full bg-black/20 border border-white/5 rounded-lg px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm focus:outline-none focus:border-emerald-500/30"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <select 
                          value={npc.gender}
                          onChange={(e) => updateCustomNpc(idx, 'gender', e.target.value)}
                          className="w-full bg-black/20 border border-white/5 rounded-lg px-2 md:px-3 py-1.5 md:py-2 text-[10px] focus:outline-none focus:border-emerald-500/30"
                        >
                          <option value="Nam">Nam</option>
                          <option value="Nữ">Nữ</option>
                          <option value="Khác">Khác</option>
                        </select>
                        <input 
                          type="text"
                          placeholder="Tuổi"
                          value={npc.age}
                          onChange={(e) => updateCustomNpc(idx, 'age', e.target.value)}
                          className="w-full bg-black/20 border border-white/5 rounded-lg px-2 md:px-3 py-1.5 md:py-2 text-[10px] focus:outline-none focus:border-emerald-500/30"
                        />
                      </div>
                      <input 
                        type="text"
                        placeholder="Vai trò"
                        value={npc.role}
                        onChange={(e) => updateCustomNpc(idx, 'role', e.target.value)}
                        className="w-full bg-black/20 border border-white/5 rounded-lg px-2 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs focus:outline-none focus:border-emerald-500/30"
                      />
                    </div>
                  ))}
                  {customNpcs.length === 0 && (
                    <div className="col-span-full py-4 md:py-8 border-2 border-dashed border-white/5 rounded-2xl md:rounded-3xl flex flex-col items-center justify-center text-neutral-600">
                      <Users className="w-6 h-6 md:w-8 md:h-8 mb-1 md:mb-2 opacity-20" />
                      <p className="text-[10px] md:text-xs uppercase tracking-widest">Chưa có NPC nào</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Custom Prompt */}
              <div className="space-y-2 md:space-y-4">
                <div className="flex items-center gap-2 text-amber-400">
                  <BookOpen className="w-5 h-5" />
                  <h3 className="font-bold uppercase text-xs tracking-widest">Điểm khởi đầu / Kịch bản</h3>
                </div>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Mô tả cảnh mở đầu bạn muốn..."
                  className="w-full h-24 md:h-32 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl p-3 md:p-4 text-xs md:text-sm focus:outline-none focus:border-amber-500/50 transition-colors resize-none"
                />
              </div>

              {/* Action */}
              <div className="pt-4 md:pt-8">
                <button
                  onClick={handleStart}
                  disabled={!customWork.title || !customMc.name}
                  className={`w-full py-3 md:py-4 rounded-xl md:rounded-2xl font-black uppercase tracking-[0.2em] md:tracking-[0.3em] flex items-center justify-center gap-2 md:gap-3 transition-all ${
                    customWork.title && customMc.name
                      ? 'bg-gradient-to-r from-purple-600 to-emerald-600 hover:from-purple-500 hover:to-emerald-500 shadow-xl shadow-purple-500/20 active:scale-[0.98]' 
                      : 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-4 h-4 md:w-5 md:h-5" />
                  Khởi Tạo Thế Giới Tự Do
                </button>
              </div>
            </motion.div>
          </div>
        ) : (
          /* Remix Mode */
          <div className={`flex-grow md:overflow-y-auto p-2 md:p-8 md:custom-scrollbar bg-black/20`}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full space-y-4 md:space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                {/* Work Selection for Remix */}
                <div className="space-y-3 md:space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-purple-400">
                      <LayoutGrid className="w-5 h-5" />
                      <h3 className="font-bold uppercase text-xs tracking-widest">Chọn Các Tác Phẩm Phối Trộn</h3>
                    </div>
                    <span className="text-[10px] font-black text-purple-500/60 mono">[{remixSelectedWorkIds.length} Đã Chọn]</span>
                  </div>

                  {/* Remix Filters */}
                  <div className="space-y-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                    <div className="flex flex-wrap gap-1.5">
                      {(['Tất cả', 'Trung', 'Nhật', 'Hàn', 'Việt Nam', 'Khác'] as const).map((country) => (
                        <button
                          key={country}
                          onClick={() => setRemixSelectedCountry(country)}
                          className={`px-2 py-1 rounded-lg text-[8px] font-bold uppercase tracking-wider transition-all ${
                            remixSelectedCountry === country
                              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                              : 'bg-white/5 text-neutral-500 hover:bg-white/10 hover:text-neutral-300'
                          }`}
                        >
                          {country}
                        </button>
                      ))}
                    </div>

                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                      <input 
                        type="text"
                        placeholder="Tìm kiếm tác phẩm để remix..."
                        value={remixSearchTerm}
                        onChange={(e) => setRemixSearchTerm(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Selected Works List (Horizontal) */}
                  <AnimatePresence>
                    {remixSelectedWorkIds.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-wrap gap-2 p-3 bg-purple-500/5 border border-purple-500/20 rounded-2xl overflow-hidden"
                      >
                        {works.filter(w => remixSelectedWorkIds.includes(w.id)).map(work => (
                          <div 
                            key={work.id}
                            className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest animate-in zoom-in-95 duration-200"
                          >
                            {work.title}
                            <button 
                              onClick={() => setRemixSelectedWorkIds(remixSelectedWorkIds.filter(id => id !== work.id))}
                              className="hover:text-red-300 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {works.filter(w => {
                      const matchesSearch = w.title.toLowerCase().includes(remixSearchTerm.toLowerCase());
                      if (remixSelectedCountry === 'Tất cả') return matchesSearch;
                      if (remixSelectedCountry === 'Khác') return matchesSearch && !['Trung', 'Nhật', 'Hàn', 'Việt Nam'].includes(w.country || '');
                      return matchesSearch && w.country === remixSelectedCountry;
                    }).map(work => (
                      <button
                        key={work.id}
                        onClick={() => {
                          if (remixSelectedWorkIds.includes(work.id)) {
                            setRemixSelectedWorkIds(remixSelectedWorkIds.filter(id => id !== work.id));
                          } else {
                            setRemixSelectedWorkIds([...remixSelectedWorkIds, work.id]);
                          }
                        }}
                        className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                          remixSelectedWorkIds.includes(work.id)
                            ? 'bg-purple-500/20 border-purple-500 text-white'
                            : 'bg-white/5 border-white/5 text-neutral-400 hover:border-white/20'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-bold">{work.title}</span>
                          <span className="text-[8px] uppercase tracking-widest opacity-50">{work.country}</span>
                        </div>
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                          remixSelectedWorkIds.includes(work.id) ? 'bg-purple-500 border-purple-400' : 'border-white/20'
                        }`}>
                          {remixSelectedWorkIds.includes(work.id) && <Plus className="w-3 h-3 text-white" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* MC Details for Remix */}
                <div className="space-y-3 md:space-y-6">
                  <div className="flex items-center gap-2 text-blue-400">
                    <User className="w-5 h-5" />
                    <h3 className="font-bold uppercase text-xs tracking-widest">Nhân Vật Chính (MC)</h3>
                  </div>
                  
                  <div className="space-y-2 md:space-y-4">
                    <div className="relative group">
                      <label className="block text-[10px] uppercase tracking-widest text-neutral-500 mb-1 ml-1">Tên Nhân Vật</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 group-focus-within:text-blue-400 transition-colors" />
                        <input 
                          type="text"
                          placeholder="Tên của bạn..."
                          value={remixMc.name}
                          onChange={(e) => setRemixMc({...remixMc, name: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 md:py-3 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-neutral-500 mb-1 ml-1">Giới Tính</label>
                        <select 
                          value={remixMc.gender}
                          onChange={(e) => setRemixMc({...remixMc, gender: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 md:px-4 py-2 md:py-3 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                        >
                          <option value="Nam">Nam</option>
                          <option value="Nữ">Nữ</option>
                          <option value="Khác">Khác</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-neutral-500 mb-1 ml-1">Tuổi</label>
                        <input 
                          type="text"
                          placeholder="Tuổi..."
                          value={remixMc.age}
                          onChange={(e) => setRemixMc({...remixMc, age: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 md:px-4 py-2 md:py-3 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-neutral-500 mb-1 ml-1">Vai Trò / Thân Phận</label>
                      <input 
                        type="text"
                        placeholder="Ví dụ: Kẻ xuyên không, Ma thần..."
                        value={remixMc.role}
                        onChange={(e) => setRemixMc({...remixMc, role: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 md:px-4 py-2 md:py-3 text-sm focus:outline-none focus:border-blue-500/50 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-neutral-500 mb-1 ml-1">Tính Cách / Đặc Điểm</label>
                      <textarea 
                        placeholder="Mô tả tính cách hoặc khả năng đặc biệt..."
                        value={remixMc.description}
                        onChange={(e) => setRemixMc({...remixMc, description: e.target.value})}
                        className="w-full h-24 bg-white/5 border border-white/10 rounded-xl px-3 md:px-4 py-2 md:py-3 text-sm focus:outline-none focus:border-blue-500/50 resize-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Custom Prompt for Remix */}
              <div className="space-y-2 md:space-y-4">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Sparkles className="w-5 h-5" />
                  <h3 className="font-bold uppercase text-xs tracking-widest">Hướng dẫn Phối Trộn (Remix Instructions)</h3>
                </div>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Mô tả cách bạn muốn các thế giới này giao thoa (Vd: Hệ thống chakra của Naruto tồn tại trong thế giới Harry Potter...)"
                  className="w-full h-24 md:h-32 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl p-3 md:p-4 text-xs md:text-sm focus:outline-none focus:border-emerald-500/50 transition-colors resize-none"
                />
              </div>

              {/* Action */}
              <div className="pt-4 md:pt-8">
                <button
                  onClick={handleStart}
                  disabled={remixSelectedWorkIds.length === 0 || !remixMc.name}
                  className={`w-full py-3 md:py-4 rounded-xl md:rounded-2xl font-black uppercase tracking-[0.2em] md:tracking-[0.3em] flex items-center justify-center gap-2 md:gap-3 transition-all ${
                    remixSelectedWorkIds.length > 0 && remixMc.name
                      ? 'bg-gradient-to-r from-purple-600 to-emerald-600 hover:from-purple-500 hover:to-emerald-500 shadow-xl shadow-purple-500/20 active:scale-[0.98]' 
                      : 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
                  }`}
                >
                  <RotateCcw className="w-4 h-4 md:w-5 md:h-5" />
                  Khởi Tạo Thế Giới Remix
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};
