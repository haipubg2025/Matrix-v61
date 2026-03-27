
import React, { useState, useRef } from 'react';
import { AppSettings, AiModel, ThinkingLevel, WritingStyle, NarrativePerspective, ResponseLength } from '../types';
import { 
  Trash2, 
  Plus, 
  Upload, 
  ShieldCheck, 
  Cpu, 
  Zap, 
  RefreshCw, 
  Image as ImageIcon, 
  X, 
  AlertTriangle,
  LogIn,
  LogOut,
  CheckCircle2,
  Info,
  Settings,
  Key
} from 'lucide-react';
import { gameAI } from '../services/geminiService';
import { MobileSettingsModal } from './Mobile/MobileSettingsModal';
import { ConfirmModal } from './ConfirmModal';
import { dbService } from '../services/dbService';

interface Props {
  isOpen: boolean;
  view: string;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
}

type Tab = 'general' | 'api' | 'storage';

const PRESET_COLORS = [
  { name: 'Lục bảo (Default)', hex: '#10b981' },
  { name: 'Thiên thanh', hex: '#0ea5e9' },
  { name: 'Hoa hồng', hex: '#f43f5e' },
  { name: 'Hổ phách', hex: '#f59e0b' },
  { name: 'Tím thạch anh', hex: '#8b5cf6' },
  { name: 'Ngọc bích', hex: '#06b6d4' },
];

const FONT_OPTIONS = [
  { name: 'Inter (Mặc định)', value: '"Inter"' },
  { name: 'Roboto', value: '"Roboto"' },
  { name: 'Open Sans', value: '"Open Sans"' },
  { name: 'Montserrat', value: '"Montserrat"' },
  { name: 'Playfair Display', value: '"Playfair Display"' },
  { name: 'Cormorant Garamond', value: '"Cormorant Garamond"' },
  { name: 'JetBrains Mono', value: '"JetBrains Mono"' },
  { name: 'Space Grotesk', value: '"Space Grotesk"' },
  { name: 'Be Vietnam Pro', value: '"Be Vietnam Pro"' },
  { name: 'Dancing Script', value: '"Dancing Script"' },
  { name: 'Noto Sans', value: '"Noto Sans"' },
  { name: 'Noto Serif', value: '"Noto Serif"' },
  { name: 'Lora', value: '"Lora"' },
  { name: 'Merriweather', value: '"Merriweather"' },
  { name: 'Oswald', value: '"Oswald"' },
  { name: 'Source Sans 3', value: '"Source Sans 3"' },
  { name: 'Quicksand', value: '"Quicksand"' },
  { name: 'Mulish', value: '"Mulish"' },
  { name: 'Cabin', value: '"Cabin"' },
  { name: 'Nunito', value: '"Nunito"' },
];

const DEFAULT_SETTINGS: AppSettings = {
  aiModel: AiModel.FLASH_3,
  thinkingBudget: 0,
  thinkingLevel: ThinkingLevel.HIGH,
  contextWindowSize: 100,
  isFullscreen: false,
  mobileMode: false,
  primaryColor: '#10b981',
  adultContent: true,
  difficulty: 'medium',
  effectsEnabled: true,
  theme: 'dark',
  userApiKeys: [],
  fontSize: 15,
  beautifyContent: false,
  maxNpcsToSendToAi: 5,
  proxyStatus: 'idle',
  autoGenerateImages: false,
  imageModel: 'gemini-2.5-flash-image',
  imageStyle: 'Chân thực (Photorealistic): Ảnh trông như được chụp bằng camera chuyên nghiệp.',
  imageQuality: '1K',
  temperature: 1.0,
  responseLength: ResponseLength.MEDIUM,
  writingStyle: WritingStyle.DEFAULT,
  narrativePerspective: NarrativePerspective.THIRD_PERSON,
  streamingEnabled: true,
  apiKeyEnabled: true,
  proxyEnabled: true,
  storageMode: 'local',
  proxyList: []
};

const IMAGE_STYLES = [
  'Chân thực (Photorealistic): Ảnh trông như được chụp bằng camera chuyên nghiệp.'
];

export const SettingsModal: React.FC<Props> = ({ isOpen, view, onClose, settings, onUpdateSettings }) => {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [newKey, setNewKey] = useState('');
  const [proxyError, setProxyError] = useState('');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [proxyModelsMap, setProxyModelsMap] = useState<Record<string, string[]>>({});
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  React.useEffect(() => {
    if (isOpen && (!settings.proxyList || settings.proxyList.length === 0)) {
      onUpdateSettings({ proxyList: [{ url: '', key: '' }] });
    }
  }, [isOpen, settings.proxyList, onUpdateSettings]);
  const [showProxyKeys, setShowProxyKeys] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const proxyImportRef = useRef<HTMLInputElement>(null);

  if (settings.mobileMode && isOpen) {
    return <MobileSettingsModal onClose={onClose} view={view} settings={settings} onUpdateSettings={onUpdateSettings} />;
  }

  if (!isOpen) return null;

  const maxBudget = (settings.aiModel === AiModel.PRO_31 || settings.aiModel === AiModel.PRO_25) ? 16384 : 8192;

  const handleAddKey = () => {
    if (!newKey.trim()) return;
    
    // Split by newlines, commas, or spaces to support bulk pasting
    const extractedKeys = newKey
      .split(/[\n,\r\s]+/)
      .map(k => k.trim())
      .filter(k => k.length > 20); // Basic validation for Gemini keys (usually ~39-40 chars)

    if (extractedKeys.length === 0) {
      setNewKey('');
      return;
    }

    const currentKeys = settings.userApiKeys || [];
    const uniqueNewKeys = extractedKeys.filter(k => !currentKeys.includes(k));
    
    if (uniqueNewKeys.length > 0) {
      onUpdateSettings({ userApiKeys: [...currentKeys, ...uniqueNewKeys] });
      gameAI.resetBlacklist(); // Reset blacklist on manual change
    }
    
    setNewKey('');
  };

  const handleRemoveKey = (keyToRemove: string) => {
    const currentKeys = settings.userApiKeys || [];
    onUpdateSettings({ userApiKeys: currentKeys.filter(k => k !== keyToRemove) });
    gameAI.resetBlacklist(); // Reset blacklist on manual change
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const lines = content.split(/[\n,\r]+/);
      const newApiKeys: string[] = [];
      const newProxies: { url: string; key: string }[] = [];

      lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;

        if (trimmed.startsWith('http')) {
          newProxies.push({ url: trimmed, key: '' });
        } else if (trimmed.startsWith('sk-')) {
          if (newProxies.length > 0 && !newProxies[newProxies.length - 1].key) {
            newProxies[newProxies.length - 1].key = trimmed;
          } else {
            newProxies.push({ url: '', key: trimmed });
          }
        } else if (trimmed.startsWith('AIza')) {
          newApiKeys.push(trimmed);
        } else if (trimmed.length > 20) {
          // If it follows a URL and doesn't have sk- prefix, still check if it's likely a proxy key
          if (newProxies.length > 0 && !newProxies[newProxies.length - 1].key && !trimmed.startsWith('AIza')) {
            newProxies[newProxies.length - 1].key = trimmed;
          } else if (trimmed.startsWith('AIza')) {
            newApiKeys.push(trimmed);
          } else {
            // Default to API Key if length > 20 and not obviously a proxy key following a URL
            newApiKeys.push(trimmed);
          }
        }
      });

      const currentKeys = settings.userApiKeys || [];
      const uniqueNewKeys = newApiKeys.filter(k => !currentKeys.includes(k));
      
      let updatedProxyUrl = settings.proxyUrl || '';
      let updatedProxyKey = settings.proxyKey || '';
      let updatedProxyList = [...(settings.proxyList || [])];
      
      const proxiesToProcess = newProxies.filter(p => p.url);
      
      proxiesToProcess.forEach(p => {
        // 1. Check primary
        if (!updatedProxyUrl) {
          updatedProxyUrl = p.url;
          updatedProxyKey = p.key;
          return;
        }
        
        // 2. Check existing list for empty slots
        const emptySlotIndex = updatedProxyList.findIndex(item => !item.url);
        if (emptySlotIndex !== -1) {
          updatedProxyList[emptySlotIndex] = { ...updatedProxyList[emptySlotIndex], url: p.url, key: p.key };
          return;
        }
        
        // 3. Check if already exists to avoid duplicates
        const exists = (updatedProxyUrl === p.url) || updatedProxyList.some(cp => cp.url === p.url);
        if (!exists) {
          updatedProxyList.push({ url: p.url, key: p.key });
        }
      });

      onUpdateSettings({ 
        userApiKeys: [...currentKeys, ...uniqueNewKeys],
        proxyUrl: updatedProxyUrl,
        proxyKey: updatedProxyKey,
        proxyList: updatedProxyList
      });
      gameAI.resetBlacklist();
      
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleResetBlacklist = () => {
    gameAI.resetBlacklist();
    alert("Đã làm mới danh sách lỗi. Tất cả các Key sẽ được thử lại.");
  };

  const handleLoadAllModels = async () => {
    if (!settings.proxyUrl && (!settings.proxyList || settings.proxyList.length === 0)) {
      alert("Vui lòng cấu hình ít nhất một Proxy trước khi tải Model.");
      return;
    }

    setIsLoadingModels(true);
    const newMap: Record<string, string[]> = {};
    let updatedProxyModel = settings.proxyModel;
    let updatedProxyList = settings.proxyList ? [...settings.proxyList] : [];
    
    const tasks = [];
    
    // Primary Proxy
    if (settings.proxyUrl && settings.proxyKey) {
      tasks.push((async () => {
        try {
          const response = await fetch(`${settings.proxyUrl}/models`, {
            headers: { 
              'Authorization': `Bearer ${settings.proxyKey}`,
              'Content-Type': 'application/json'
            }
          });
          if (response.ok) {
            const data = await response.json();
            if (data && Array.isArray(data.data)) {
              const models = data.data.map((m: any) => m.id).sort();
              newMap['primary'] = models;
              setAvailableModels(models); // Keep for backward compatibility if needed
              if (models.length > 0 && !updatedProxyModel) {
                updatedProxyModel = models[0];
              }
            }
          }
        } catch (e) {
          console.error("Error loading models for Primary Proxy:", e);
        }
      })());
    }
    
    // Proxy List
    if (settings.proxyList) {
      settings.proxyList.forEach((proxy, idx) => {
        if (proxy.url && proxy.key) {
          tasks.push((async () => {
            try {
              const response = await fetch(`${proxy.url}/models`, {
                headers: { 
                  'Authorization': `Bearer ${proxy.key}`,
                  'Content-Type': 'application/json'
                }
              });
              if (response.ok) {
                const data = await response.json();
                if (data && Array.isArray(data.data)) {
                  const models = data.data.map((m: any) => m.id).sort();
                  newMap[`proxy_${idx}`] = models;
                  if (models.length > 0 && !updatedProxyList[idx].model) {
                    updatedProxyList[idx] = { ...updatedProxyList[idx], model: models[0] };
                  }
                }
              }
            } catch (e) {
              console.error(`Error loading models for Proxy #${idx + 2}:`, e);
            }
          })());
        }
      });
    }
    
    await Promise.all(tasks);
    setProxyModelsMap(newMap);
    onUpdateSettings({ 
      proxyModel: updatedProxyModel,
      proxyList: updatedProxyList,
      proxyStatus: 'success'
    });
    setIsLoadingModels(false);
    alert("Đã hoàn tất tải danh sách Model cho tất cả Proxy.");
  };

  return (
    <div className="SettingsModal fixed inset-0 z-[500] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-1 md:p-2 animate-in zoom-in duration-300">
      <div className="w-[99%] h-[99%] bg-[#080808] border border-white/10 rounded-2xl shadow-[0_0_120px_rgba(0,0,0,1)] relative overflow-hidden flex flex-col">
        
        <div className="flex shrink-0 border-b border-white/5 bg-black/40 px-8 items-center justify-between">
          <div className="flex gap-1">
            <button 
              onClick={() => setActiveTab('general')}
              className={`py-5 px-8 mono text-xs font-black uppercase tracking-[0.3em] transition-all relative ${activeTab === 'general' ? 'text-emerald-400' : 'text-neutral-600 hover:text-neutral-300'}`}
            >
              Chung
              {activeTab === 'general' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500 shadow-[0_0_10px_currentColor]"></div>}
            </button>
            <button 
              onClick={() => setActiveTab('api')}
              className={`py-5 px-8 mono text-xs font-black uppercase tracking-[0.3em] transition-all relative ${activeTab === 'api' ? 'text-emerald-400' : 'text-neutral-600 hover:text-neutral-300'}`}
            >
              API
              {activeTab === 'api' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500 shadow-[0_0_10px_currentColor]"></div>}
            </button>
            <button 
              onClick={() => setActiveTab('storage')}
              className={`py-5 px-8 mono text-xs font-black uppercase tracking-[0.3em] transition-all relative ${activeTab === 'storage' ? 'text-emerald-400' : 'text-neutral-600 hover:text-neutral-300'}`}
            >
              AI
              {activeTab === 'storage' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500 shadow-[0_0_10px_currentColor]"></div>}
            </button>
          </div>
          
          <div className="hidden md:flex items-center gap-4">
             <span className="mono text-[10px] text-neutral-700 font-black uppercase tracking-widest">Reality_Sync_v20.5_MultiCore</span>
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]"></div>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto custom-scrollbar p-6 md:px-12 md:py-8 bg-[radial-gradient(circle_at_top_right,rgba(var(--primary-rgb),0.03),transparent)]">
          <div className="max-w-full mx-auto w-full">
            {activeTab === 'general' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-4">
                  {/* FONT CHỮ */}
                  <div className="p-5 rounded-2xl border bg-white/[0.02] border-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-xs font-black uppercase tracking-widest text-neutral-400">Phông chữ hệ thống</span>
                        <p className="text-[9px] text-neutral-600 font-bold uppercase leading-relaxed max-w-sm">Thay đổi phông chữ hiển thị cho toàn bộ gameplay.</p>
                      </div>
                      <select
                        value={settings.fontFamily || 'Inter'}
                        onChange={(e) => onUpdateSettings({ fontFamily: e.target.value })}
                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-black uppercase text-emerald-400 outline-none focus:border-emerald-500/50 transition-all"
                      >
                        {FONT_OPTIONS.map(font => (
                          <option key={font.value} value={font.value} className="bg-[#080808] text-white">
                            {font.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="h-px bg-white/5 w-full" />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-xs font-black uppercase tracking-widest text-neutral-400">Cỡ chữ cho nội dung</span>
                        <p className="text-[9px] text-neutral-600 font-bold uppercase leading-relaxed max-w-sm">Điều chỉnh kích thước văn bản trong gameplay (mặc định: 15px).</p>
                      </div>
                      <div className="flex items-center gap-3 bg-black/40 border border-white/10 rounded-xl px-2 py-1">
                        <button 
                          onClick={() => onUpdateSettings({ fontSize: Math.max(8, (settings.fontSize || 15) - 1) })}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 transition-all"
                        >
                          -
                        </button>
                        <span className="mono text-emerald-400 text-sm font-black w-8 text-center">{settings.fontSize || 15}</span>
                        <button 
                          onClick={() => onUpdateSettings({ fontSize: Math.min(32, (settings.fontSize || 15) + 1) })}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 transition-all"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* NỘI DUNG 18+ */}
                  <div 
                    onClick={() => onUpdateSettings({ adultContent: !settings.adultContent })}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer group flex items-center justify-between ${settings.adultContent ? 'bg-rose-500/5 border-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.05)]' : 'bg-white/[0.02] border-white/5 hover:border-white/20'}`}
                  >
                    <div className="space-y-0.5">
                      <span className={`text-xs font-black uppercase tracking-widest transition-colors ${settings.adultContent ? 'text-rose-400' : 'text-neutral-400'}`}>Kích hoạt Nội dung 18+</span>
                      <p className="text-[9px] text-neutral-600 font-bold uppercase leading-relaxed max-w-sm">Cho phép AI tạo ra các tình huống và miêu tả chi tiết, nhạy cảm.</p>
                    </div>
                    <div className={`w-12 h-6 rounded-full relative transition-all duration-500 ${settings.adultContent ? 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]' : 'bg-neutral-800'}`}>
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-lg transition-all duration-500 ${settings.adultContent ? 'left-7' : 'left-1'}`}></div>
                    </div>
                  </div>

                  {/* ĐỘ KHÓ THỰC TẠI */}
                  <div className="p-5 rounded-2xl border bg-white/[0.02] border-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-xs font-black uppercase tracking-widest text-neutral-400">Độ Khó Thực Tại</span>
                        <p className="text-[9px] text-neutral-600 font-bold uppercase leading-relaxed max-w-sm">Ảnh hưởng đến tỷ lệ thành công và hậu quả của các hành động.</p>
                      </div>
                      <select
                        value={settings.difficulty}
                        onChange={(e) => onUpdateSettings({ difficulty: e.target.value as any })}
                        className="bg-neutral-900 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-black uppercase text-neutral-400 focus:outline-none focus:border-white/30 transition-all cursor-pointer appearance-none min-w-[200px]"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23a3a3a3'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1rem' }}
                      >
                        <option value="easy">Dễ (Dành cho người mới)</option>
                        <option value="medium">Trung Bình (Mặc định)</option>
                        <option value="hard">Khó (Thử thách)</option>
                        <option value="hell">Địa Ngục (Cực kỳ khắc nghiệt)</option>
                        <option value="asian">Asian (Độ khó của mẹ bạn)</option>
                      </select>
                    </div>
                  </div>

                  {/* LÀM ĐẸP NỘI DUNG */}
                  <div 
                    onClick={() => onUpdateSettings({ beautifyContent: !settings.beautifyContent })}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer group flex items-center justify-between ${settings.beautifyContent ? 'bg-emerald-500/5 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.05)]' : 'bg-white/[0.02] border-white/5 hover:border-white/20'}`}
                  >
                    <div className="space-y-0.5">
                      <span className={`text-xs font-black uppercase tracking-widest transition-colors ${settings.beautifyContent ? 'text-emerald-400' : 'text-neutral-400'}`}>Làm đẹp cho nội dung</span>
                      <p className="text-[9px] text-neutral-600 font-bold uppercase leading-relaxed max-w-sm">Hiển thị lời thoại, suy nghĩ và tin nhắn dưới dạng bong bóng chat và phong cách riêng biệt.</p>
                    </div>
                    <div className={`w-12 h-6 rounded-full relative transition-all duration-500 ${settings.beautifyContent ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-neutral-800'}`}>
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-lg transition-all duration-500 ${settings.beautifyContent ? 'left-7' : 'left-1'}`}></div>
                    </div>
                  </div>



                  {/* CHẾ ĐỘ STREAMING */}
                  <div 
                    onClick={() => onUpdateSettings({ streamingEnabled: !settings.streamingEnabled })}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer group flex items-center justify-between ${settings.streamingEnabled ? 'bg-cyan-500/5 border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.05)]' : 'bg-white/[0.02] border-white/5 hover:border-white/20'}`}
                  >
                    <div className="space-y-0.5">
                      <span className={`text-xs font-black uppercase tracking-widest transition-colors ${settings.streamingEnabled ? 'text-cyan-400' : 'text-neutral-400'}`}>Chế độ Streaming (Matrix)</span>
                      <p className="text-[9px] text-neutral-600 font-bold uppercase leading-relaxed max-w-sm">AI sẽ phản hồi theo thời gian thực (streaming), giúp bạn thấy câu chuyện được viết ra từng chữ.</p>
                    </div>
                    <div className={`w-12 h-6 rounded-full relative transition-all duration-500 ${settings.streamingEnabled ? 'bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)]' : 'bg-neutral-800'}`}>
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-lg transition-all duration-500 ${settings.streamingEnabled ? 'left-7' : 'left-1'}`}></div>
                    </div>
                  </div>

                  {/* HIỆU ỨNG HÌNH ẢNH */}
                  <div 
                    onClick={() => onUpdateSettings({ effectsEnabled: !settings.effectsEnabled })}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer group flex items-center justify-between ${settings.effectsEnabled ? 'bg-emerald-500/5 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.05)]' : 'bg-white/[0.02] border-white/5 hover:border-white/20'}`}
                  >
                    <div className="space-y-0.5">
                      <span className={`text-xs font-black uppercase tracking-widest transition-colors ${settings.effectsEnabled ? 'text-emerald-400' : 'text-neutral-400'}`}>Hiệu ứng Hình ảnh</span>
                      <p className="text-[9px] text-neutral-600 font-bold uppercase leading-relaxed max-w-sm">Kích hoạt các hiệu ứng ánh sáng, chuyển động và làm mờ.</p>
                    </div>
                    <div className={`w-12 h-6 rounded-full relative transition-all duration-500 ${settings.effectsEnabled ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-neutral-800'}`}>
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-lg transition-all duration-500 ${settings.effectsEnabled ? 'left-7' : 'left-1'}`}></div>
                    </div>
                  </div>

                  {/* CHẾ ĐỘ NỀN SÁNG */}
                  <div 
                    onClick={() => onUpdateSettings({ theme: settings.theme === 'light' ? 'dark' : 'light' })}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer group flex items-center justify-between ${settings.theme === 'light' ? 'bg-amber-500/5 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.05)]' : 'bg-white/[0.02] border-white/5 hover:border-white/20'}`}
                  >
                    <div className="space-y-0.5">
                      <span className={`text-xs font-black uppercase tracking-widest transition-colors ${settings.theme === 'light' ? 'text-amber-400' : 'text-neutral-400'}`}>Chế độ Nền sáng</span>
                      <p className="text-[9px] text-neutral-600 font-bold uppercase leading-relaxed max-w-sm">Chuyển đổi giao diện sang tông màu sáng.</p>
                    </div>
                    <div className={`w-12 h-6 rounded-full relative transition-all duration-500 ${settings.theme === 'light' ? 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-neutral-800'}`}>
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-lg transition-all duration-500 ${settings.theme === 'light' ? 'left-7' : 'left-1'}`}></div>
                    </div>
                  </div>

                  {/* CHẾ ĐỘ TOÀN MÀN HÌNH */}
                  <div 
                    onClick={() => onUpdateSettings({ isFullscreen: !settings.isFullscreen })}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer group flex items-center justify-between ${settings.isFullscreen ? 'bg-blue-500/5 border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.05)]' : 'bg-white/[0.02] border-white/5 hover:border-white/20'}`}
                  >
                    <div className="space-y-0.5">
                      <span className={`text-xs font-black uppercase tracking-widest transition-colors ${settings.isFullscreen ? 'text-blue-400' : 'text-neutral-400'}`}>Chế độ Toàn màn hình</span>
                      <p className="text-[9px] text-neutral-600 font-bold uppercase leading-relaxed max-w-sm">Loại bỏ các yếu tố gây xao nhãng của hệ thống.</p>
                    </div>
                    <div className={`w-12 h-6 rounded-full relative transition-all duration-500 ${settings.isFullscreen ? 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-neutral-800'}`}>
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-lg transition-all duration-500 ${settings.isFullscreen ? 'left-7' : 'left-1'}`}></div>
                    </div>
                  </div>

                </div>

                <div className="space-y-4">
                  {/* VĂN PHONG & NGÔI KỂ */}
                  <div className="p-5 rounded-2xl border bg-white/[0.02] border-white/5 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-xs font-black uppercase tracking-widest text-neutral-400">Văn phong câu chuyện</span>
                        <p className="text-[9px] text-neutral-600 font-bold uppercase leading-relaxed max-w-sm">Chọn phong cách viết mà AI sẽ sử dụng.</p>
                      </div>
                      <select
                        value={settings.writingStyle || WritingStyle.DEFAULT}
                        onChange={(e) => onUpdateSettings({ writingStyle: e.target.value as WritingStyle })}
                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-black uppercase text-emerald-400 outline-none focus:border-emerald-500/50 transition-all"
                      >
                        {Object.values(WritingStyle).map(style => (
                          <option key={style} value={style} className="bg-[#080808] text-white">
                            {style}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="h-px bg-white/5 w-full" />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-xs font-black uppercase tracking-widest text-neutral-400">Ngôi kể (Perspective)</span>
                        <p className="text-[9px] text-neutral-600 font-bold uppercase leading-relaxed max-w-sm">Chọn ngôi kể cho câu chuyện.</p>
                      </div>
                      <select
                        value={settings.narrativePerspective || NarrativePerspective.THIRD_PERSON}
                        onChange={(e) => onUpdateSettings({ narrativePerspective: e.target.value as NarrativePerspective })}
                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-black uppercase text-emerald-400 outline-none focus:border-emerald-500/50 transition-all"
                      >
                        {Object.values(NarrativePerspective).map(p => (
                          <option key={p} value={p} className="bg-[#080808] text-white">
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="h-px bg-white/5 w-full" />

                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="text-xs font-black uppercase tracking-widest text-neutral-400">Thiết lập độ dài (Output Length)</span>
                          <p className="text-[9px] text-neutral-600 font-bold uppercase leading-relaxed max-w-sm">Kiểm soát mục tiêu số từ AI sẽ tạo ra.</p>
                        </div>
                        <select
                          value={settings.responseLength || ResponseLength.MEDIUM}
                          onChange={(e) => onUpdateSettings({ responseLength: e.target.value as ResponseLength })}
                          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-black uppercase text-emerald-400 outline-none focus:border-emerald-500/50 transition-all"
                        >
                          {Object.values(ResponseLength).map(length => (
                            <option key={length} value={length} className="bg-[#080808] text-white">
                              {length}
                            </option>
                          ))}
                        </select>
                      </div>

                      {settings.responseLength === ResponseLength.CUSTOM && (
                        <div className="flex items-center gap-4 pl-4 border-l-2 border-emerald-500/20 animate-in fade-in slide-in-from-left-2 duration-300">
                          <div className="flex flex-col gap-1">
                            <label className="text-[8px] font-black uppercase text-neutral-500">Từ tối thiểu</label>
                            <input 
                              type="number"
                              value={settings.minWords || 5500}
                              onChange={(e) => onUpdateSettings({ minWords: parseInt(e.target.value) })}
                              className="w-24 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] font-black text-emerald-400 outline-none focus:border-emerald-500/50"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[8px] font-black uppercase text-neutral-500">Từ tối đa</label>
                            <input 
                              type="number"
                              value={settings.maxWords || 8000}
                              onChange={(e) => onUpdateSettings({ maxWords: parseInt(e.target.value) })}
                              className="w-24 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] font-black text-emerald-400 outline-none focus:border-emerald-500/50"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="h-px bg-white/5 w-full" />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-xs font-black uppercase tracking-widest text-neutral-400">Giới hạn Token (Max Output)</span>
                        <p className="text-[9px] text-neutral-600 font-bold uppercase leading-relaxed max-w-sm">Giới hạn cứng số lượng token AI có thể tạo ra (mặc định: tự động).</p>
                      </div>
                      <div className="flex items-center gap-3 bg-black/40 border border-white/10 rounded-xl px-4 py-2">
                        <input 
                          type="number"
                          min="100"
                          max="65000"
                          placeholder="65000"
                          value={settings.maxOutputTokens || ''}
                          onChange={(e) => onUpdateSettings({ maxOutputTokens: parseInt(e.target.value) || undefined })}
                          className="bg-transparent mono text-emerald-400 text-lg font-black w-20 outline-none text-center"
                        />
                      </div>
                    </div>
                  </div>

                  {/* MÀU SẮC CHỦ ĐẠO */}
                  <div className="bg-black/60 p-6 rounded-2xl border border-white/5 space-y-5 shadow-xl">
                    <div className="flex items-center gap-2 mb-2">
                       <span className="text-xs font-black uppercase tracking-widest text-neutral-400">Màu sắc chủ đạo Ma Trận</span>
                    </div>
                    <div className="grid grid-cols-12 gap-2">
                      {PRESET_COLORS.map(color => (
                        <button 
                          key={color.hex}
                          onClick={() => onUpdateSettings({ primaryColor: color.hex })}
                          title={color.name}
                          className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 flex items-center justify-center ${settings.primaryColor === color.hex ? 'border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'border-transparent'}`}
                          style={{ backgroundColor: color.hex }}
                        >
                           {settings.primaryColor === color.hex && <span className="text-white text-[10px] drop-shadow-md font-bold">✓</span>}
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="mono text-[9px] font-black text-neutral-600 uppercase tracking-[0.2em]">Tùy chỉnh mã HEX Lượng tử</label>
                      <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-lg border border-white/10 shrink-0 shadow-lg" style={{ backgroundColor: settings.primaryColor }}></div>
                        <input 
                          type="text"
                          value={settings.primaryColor}
                          onChange={(e) => onUpdateSettings({ primaryColor: e.target.value })}
                          className="flex-grow bg-white/5 border border-white/10 rounded-lg px-4 mono text-xs font-black text-white outline-none focus:border-emerald-500/50 shadow-inner"
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'storage' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-4">
                  {/* MÔ HÌNH AI */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 px-2">
                       <span className="text-xs font-black uppercase tracking-widest text-neutral-400">Mô Hình AI Gemini</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button 
                        onClick={() => onUpdateSettings({ aiModel: AiModel.PRO_31 })}
                        className={`p-5 rounded-2xl border transition-all text-left group relative overflow-hidden ${settings.aiModel === AiModel.PRO_31 ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)]' : 'bg-white/[0.02] border-white/5 hover:border-white/20'}`}
                      >
                        <span className={`block mono text-[8px] font-black uppercase mb-1 tracking-widest ${settings.aiModel === AiModel.PRO_31 ? 'text-emerald-400' : 'text-neutral-600'}`}>Gemini_PRO_3.1</span>
                        <span className="text-base font-black text-white uppercase tracking-tighter">Gemini 3.1 Pro</span>
                        <p className="text-[9px] text-neutral-500 font-bold mt-1.5 leading-relaxed">Phiên bản Pro 3.1, cân bằng nhất.</p>
                        {settings.aiModel === AiModel.PRO_31 && <div className="absolute top-0.5 right-0 w-8 h-8 bg-emerald-500/20 rounded-bl-2xl flex items-center justify-center text-[8px]">✓</div>}
                      </button>

                      <button 
                        onClick={() => onUpdateSettings({ aiModel: AiModel.FLASH_3 })}
                        className={`p-5 rounded-2xl border transition-all text-left group relative overflow-hidden ${settings.aiModel === AiModel.FLASH_3 ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)]' : 'bg-white/[0.02] border-white/5 hover:border-white/20'}`}
                      >
                        <span className={`block mono text-[8px] font-black uppercase mb-1 tracking-widest ${settings.aiModel === AiModel.FLASH_3 ? 'text-emerald-400' : 'text-neutral-600'}`}>Gemini_FLASH_3</span>
                        <span className="text-base font-black text-white uppercase tracking-tighter">Gemini 3 Flash</span>
                        <p className="text-[9px] text-neutral-500 font-bold mt-1.5 leading-relaxed">Mặc định, phản hồi siêu tốc.</p>
                        {settings.aiModel === AiModel.FLASH_3 && <div className="absolute top-0.5 right-0 w-8 h-8 bg-emerald-500/20 rounded-bl-2xl flex items-center justify-center text-[8px]">✓</div>}
                      </button>

                      <button 
                        onClick={() => onUpdateSettings({ aiModel: AiModel.PRO_25 })}
                        className={`p-5 rounded-2xl border transition-all text-left group relative overflow-hidden ${settings.aiModel === AiModel.PRO_25 ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)]' : 'bg-white/[0.02] border-white/5 hover:border-white/20'}`}
                      >
                        <span className={`block mono text-[8px] font-black uppercase mb-1 tracking-widest ${settings.aiModel === AiModel.PRO_25 ? 'text-emerald-400' : 'text-neutral-600'}`}>Gemini_PRO_2.5</span>
                        <span className="text-base font-black text-white uppercase tracking-tighter">Gemini 2.5 Pro</span>
                        <p className="text-[9px] text-neutral-500 font-bold mt-1.5 leading-relaxed">Logic ổn định, miêu tả sâu.</p>
                        {settings.aiModel === AiModel.PRO_25 && <div className="absolute top-0.5 right-0 w-8 h-8 bg-emerald-500/20 rounded-bl-2xl flex items-center justify-center text-[8px]">✓</div>}
                      </button>

                      <button 
                        onClick={() => onUpdateSettings({ aiModel: AiModel.FLASH_25 })}
                        className={`p-5 rounded-2xl border transition-all text-left group relative overflow-hidden ${settings.aiModel === AiModel.FLASH_25 ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)]' : 'bg-white/[0.02] border-white/5 hover:border-white/20'}`}
                      >
                        <span className={`block mono text-[8px] font-black uppercase mb-1 tracking-widest ${settings.aiModel === AiModel.FLASH_25 ? 'text-emerald-400' : 'text-neutral-600'}`}>Gemini_FLASH_2.5</span>
                        <span className="text-base font-black text-white uppercase tracking-tighter">Phiên bản 2.5 Flash</span>
                        <p className="text-[9px] text-neutral-500 font-bold mt-1.5 leading-relaxed">Phiên bản 2.5 Flash, ổn định.</p>
                        {settings.aiModel === AiModel.FLASH_25 && <div className="absolute top-0.5 right-0 w-8 h-8 bg-emerald-500/20 rounded-bl-2xl flex items-center justify-center text-[8px]">✓</div>}
                      </button>
                    </div>
                  </div>

                  {/* CỬA SỔ NGỮ CẢNH */}
                  <div className="p-5 rounded-2xl border bg-white/[0.02] border-white/5">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-xs font-black uppercase tracking-widest text-neutral-400">Cửa sổ Ngữ cảnh</span>
                        <p className="text-[9px] text-neutral-600 font-bold uppercase leading-relaxed max-w-sm">Số lượng lượt hội thoại AI sẽ ghi nhớ thông qua bản Tóm tắt cô đọng để duy trì tính nhất quán dài hạn.</p>
                      </div>
                      <div className="flex items-center gap-3 bg-black/40 border border-white/10 rounded-xl px-4 py-2">
                        <input 
                          type="number"
                          min="1"
                          max="1000"
                          value={settings.contextWindowSize}
                          onChange={(e) => onUpdateSettings({ contextWindowSize: Math.max(1, parseInt(e.target.value) || 1) })}
                          className="bg-transparent mono text-emerald-400 text-lg font-black w-16 outline-none text-center"
                        />
                        <span className="text-[9px] text-neutral-700 font-black uppercase tracking-widest">Lượt</span>
                      </div>
                    </div>
                  </div>

                  {/* GIỚI HẠN NPC GỬI CHO AI */}
                  <div className="p-5 rounded-2xl border bg-white/[0.02] border-white/5">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-xs font-black uppercase tracking-widest text-neutral-400">Giới hạn NPC gửi cho AI</span>
                        <p className="text-[9px] text-neutral-600 font-bold uppercase leading-relaxed max-w-sm">Số lượng NPC tối đa được gửi kèm trong dữ liệu thực tại (Mặc định: 5). Giúp tiết kiệm tài nguyên và tăng tốc độ xử lý.</p>
                      </div>
                      <div className="flex items-center gap-3 bg-black/40 border border-white/10 rounded-xl px-4 py-2">
                        <input 
                          type="number"
                          min="1"
                          max="50"
                          value={settings.maxNpcsToSendToAi || 5}
                          onChange={(e) => onUpdateSettings({ maxNpcsToSendToAi: Math.max(1, parseInt(e.target.value) || 1) })}
                          className="bg-transparent mono text-emerald-400 text-lg font-black w-16 outline-none text-center"
                        />
                        <span className="text-[9px] text-neutral-700 font-black uppercase tracking-widest">NPC</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* TEMPERATURE (ĐỘ SÁNG TẠO) */}
                  <div className="space-y-6 p-6 rounded-2xl border bg-white/[0.02] border-white/5">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-xs font-black uppercase tracking-widest text-neutral-400">Độ Sáng Tạo (Temperature)</span>
                        <p className="text-[9px] text-neutral-600 font-bold uppercase leading-relaxed max-w-sm">Kiểm soát mức độ ngẫu nhiên và bay bổng của AI trong lời dẫn.</p>
                      </div>
                      <span className="mono text-emerald-400 text-xl font-black">{settings.temperature?.toFixed(1) || '1.0'}</span>
                    </div>
                    <div className="bg-black/60 p-6 rounded-2xl border border-white/5 shadow-inner">
                      <input 
                        type="range" min="0" max="2" step="0.1"
                        value={settings.temperature || 1.0}
                        onChange={(e) => onUpdateSettings({ temperature: parseFloat(e.target.value) })}
                        className="w-full h-1 bg-neutral-800 rounded-full appearance-none cursor-pointer accent-emerald-500"
                      />
                      <div className="mt-4 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <span className="text-[9px] text-blue-400 font-black uppercase tracking-wider">Thấp (0.0 - 0.5)</span>
                            <p className="text-[8px] text-neutral-500 font-bold uppercase leading-relaxed">Logic, nhất quán, bám sát thực tế. Phù hợp trinh thám, lịch sử.</p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[9px] text-emerald-400 font-black uppercase tracking-wider">Trung bình (0.7 - 1.0)</span>
                            <p className="text-[8px] text-neutral-500 font-bold uppercase leading-relaxed">Cân bằng giữa logic và sáng tạo. Phù hợp hầu hết thể loại.</p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[9px] text-purple-400 font-black uppercase tracking-wider">Cao (1.2 - 2.0)</span>
                            <p className="text-[8px] text-neutral-500 font-bold uppercase leading-relaxed">Cực kỳ bay bổng, bất ngờ. Phù hợp tiên hiệp, huyền huyễn.</p>
                          </div>
                        </div>
                        <div className="pt-3 border-t border-white/5">
                          <p className="text-[9px] text-amber-500 font-black uppercase italic tracking-wider">
                            * Lưu ý cho Đồng Nhân (Fanfic): Để AI bám sát nguyên tác và giữ đúng tính cách nhân vật nhất, mức **0.7 - 0.8** là lý tưởng. Nếu bạn muốn câu chuyện có nhiều biến số bất ngờ và sáng tạo đột phá, hãy chọn mức **1.0 - 1.2**.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* NGÂN SÁCH SUY LUẬN */}
                  {settings.aiModel.includes('gemini-3') && (
                    <div className="space-y-6 p-6 rounded-2xl border bg-white/[0.02] border-white/5">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="text-xs font-black uppercase tracking-widest text-neutral-400">Cấp độ Suy luận (Thinking Level)</span>
                          <p className="text-[9px] text-neutral-600 font-bold uppercase leading-relaxed max-w-sm">Chỉ áp dụng cho Gemini 3 series. HIGH để tư duy sâu, LOW để phản hồi nhanh.</p>
                        </div>
                        <div className="flex gap-2">
                          {[
                            { id: ThinkingLevel.LOW, label: 'LOW (Nhanh)', color: 'blue' },
                            { id: ThinkingLevel.HIGH, label: 'HIGH (Sâu)', color: 'emerald' }
                          ].map((l) => (
                            <button
                              key={l.id}
                              disabled={settings.thinkingBudget > 0}
                              onClick={() => onUpdateSettings({ thinkingLevel: l.id })}
                              className={`px-4 py-2 rounded-xl border text-[10px] font-black uppercase transition-all ${settings.thinkingBudget > 0 ? 'opacity-20 cursor-not-allowed grayscale' : ''} ${settings.thinkingLevel === l.id ? `bg-${l.color}-500/20 border-${l.color}-500 text-${l.color}-400 shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]` : 'bg-white/5 border-white/10 text-neutral-500 hover:border-white/20'}`}
                            >
                              {l.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4 pt-4 border-t border-white/5">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <span className="text-xs font-black uppercase tracking-widest text-neutral-400">Ngân sách Suy luận (Thinking Budget)</span>
                            <p className="text-[9px] text-neutral-600 font-bold uppercase leading-relaxed max-w-sm">Giới hạn số lượng token dành cho quá trình tư duy ngầm.</p>
                          </div>
                          <span className="mono text-emerald-400 text-xl font-black">{settings.thinkingBudget.toLocaleString()} <span className="text-[9px] text-neutral-700">TOKENS</span></span>
                        </div>
                        <div className="bg-black/60 p-6 rounded-2xl border border-white/5 shadow-inner">
                          <input 
                            type="range" min="0" max={maxBudget} step="512"
                            value={settings.thinkingBudget}
                            onChange={(e) => onUpdateSettings({ thinkingBudget: parseInt(e.target.value) })}
                            className="w-full h-1 bg-neutral-800 rounded-full appearance-none cursor-pointer accent-emerald-500"
                          />
                          <div className="mt-4 flex flex-col gap-1">
                            <p className="text-[9px] text-amber-500/80 font-bold uppercase italic tracking-wider">
                              * Mặc định: 0 Tokens.
                            </p>
                            <p className="text-[9px] text-neutral-500 font-bold uppercase italic leading-relaxed">
                              * Lưu ý: Nếu Ngân sách &gt; 0, hệ thống sẽ ưu tiên dùng Ngân sách và tự động vô hiệu hóa Cấp độ suy luận. Để dùng Cấp độ suy luận, hãy kéo Ngân sách về 0.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TỰ ĐỘNG TẠO ẢNH MÔ TẢ */}
                  <div className="p-5 rounded-2xl border bg-white/[0.02] border-white/5 space-y-6">
                    <div 
                      onClick={() => onUpdateSettings({ autoGenerateImages: !settings.autoGenerateImages })}
                      className={`flex items-center justify-between cursor-pointer group`}
                    >
                      <div className="space-y-0.5">
                        <span className={`text-xs font-black uppercase tracking-widest transition-colors ${settings.autoGenerateImages ? 'text-cyan-400' : 'text-neutral-400'}`}>Tự động tạo ảnh mô tả</span>
                        <p className="text-[9px] text-neutral-600 font-bold uppercase leading-relaxed max-w-sm">AI sẽ tự động tạo một hình ảnh minh họa cho mỗi lượt chơi dựa trên nội dung dẫn truyện.</p>
                      </div>
                      <div className={`w-12 h-6 rounded-full relative transition-all duration-500 ${settings.autoGenerateImages ? 'bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)]' : 'bg-neutral-800'}`}>
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-lg transition-all duration-500 ${settings.autoGenerateImages ? 'left-7' : 'left-1'}`}></div>
                      </div>
                    </div>

                    {settings.autoGenerateImages && (
                      <div className="space-y-4 pt-4 border-t border-white/5 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Phong cách ảnh (Style)</label>
                          <div className="relative">
                            <select
                              value={settings.imageStyle || 'Ảnh chụp'}
                              onChange={(e) => onUpdateSettings({ imageStyle: e.target.value })}
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase text-cyan-400 outline-none focus:border-cyan-500/50 transition-all appearance-none"
                            >
                              <option value="Ảnh chụp">Ảnh chụp (Realistic)</option>
                              <option value="Anime">Anime / Manga</option>
                              <option value="Digital Art">Digital Art</option>
                              <option value="Cyberpunk">Cyberpunk</option>
                              <option value="Oil Painting">Tranh sơn dầu</option>
                              <option value="Sketch">Phác họa (Sketch)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'api' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-in fade-in duration-500 min-h-[40rem]">
                {/* CỘT TRÁI: API KEY CÁ NHÂN */}
                <div className="space-y-8 flex flex-col">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xl text-emerald-400">
                        <ShieldCheck size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xl font-black text-white uppercase tracking-tighter italic">Khóa Cá Nhân</h4>
                          <div 
                            onClick={() => onUpdateSettings({ apiKeyEnabled: !settings.apiKeyEnabled })}
                            className={`w-10 h-5 rounded-full relative transition-all cursor-pointer ${settings.apiKeyEnabled ? 'bg-emerald-500' : 'bg-neutral-800'}`}
                          >
                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${settings.apiKeyEnabled ? 'left-[22px]' : 'left-0.5'}`}></div>
                          </div>
                          <div className={`w-2 h-2 rounded-full shadow-[0_0_8px] transition-all duration-500 ${
                            settings.userApiKeys && settings.userApiKeys.length > 0 
                              ? 'bg-emerald-500 shadow-emerald-500/50 animate-pulse' 
                              : 'bg-neutral-700 shadow-transparent'
                          }`} />
                        </div>
                        <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest">User API Key Matrix</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                       <button 
                          onClick={() => {
                            setConfirmConfig({
                              isOpen: true,
                              title: 'Xác nhận Reset API',
                              message: 'Bạn có chắc chắn muốn xóa toàn bộ API Key và cấu hình Proxy không?',
                              onConfirm: () => {
                                onUpdateSettings({
                                  userApiKeys: [],
                                  proxyUrl: '',
                                  proxyKey: '',
                                  proxyModel: '',
                                  proxyStatus: 'idle'
                                });
                                setAvailableModels([]);
                                gameAI.resetBlacklist();
                              },
                              type: 'danger'
                            });
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg mono text-[10px] font-black text-rose-400 transition-all"
                       >
                          <RefreshCw size={14} />
                          RESET TAB API
                       </button>
                       <input 
                          type="file" 
                          accept=".txt" 
                          className="hidden" 
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                       />
                       <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg mono text-[10px] font-black text-neutral-400 hover:text-white transition-all"
                       >
                          <Upload size={14} />
                          TẢI TỆP .TXT
                       </button>
                    </div>
                  </div>

                  <div className="flex-grow flex flex-col gap-4">
                    {/* Input Area */}
                    <div className="flex gap-2 items-start">
                      <textarea 
                        value={newKey}
                        onChange={(e) => setNewKey(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleAddKey();
                          }
                        }}
                        placeholder="Dán một hoặc nhiều API Key (cách nhau bởi dấu phẩy, khoảng trắng hoặc xuống dòng)..."
                        className="flex-grow bg-black/40 border border-white/10 rounded-xl px-4 py-3 mono text-xs font-black text-emerald-400 outline-none focus:border-emerald-500/50 transition-all min-h-[46px] max-h-[120px] resize-none"
                        rows={1}
                      />
                      <button 
                        onClick={handleAddKey}
                        className="p-3 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl transition-all shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)] active:scale-95 shrink-0"
                      >
                        <Plus size={20} />
                      </button>
                    </div>

                    {/* Keys List */}
                    <div className="flex-grow bg-black/20 border border-white/5 rounded-2xl overflow-hidden flex flex-col min-h-[200px]">
                       <div className="p-3 bg-white/5 border-b border-white/5 flex justify-between items-center">
                          <span className="mono text-[9px] font-black text-neutral-500 uppercase tracking-widest">Danh sách Khóa ({settings.userApiKeys?.length || 0})</span>
                          <div className="flex gap-2">
                             {settings.userApiKeys && settings.userApiKeys.length > 0 && (
                               <button 
                                 onClick={handleResetBlacklist}
                                 title="Làm mới danh sách lỗi"
                                 className="p-1.5 text-neutral-500 hover:text-emerald-400 transition-colors"
                               >
                                 <RefreshCw size={12} />
                               </button>
                             )}
                             {settings.userApiKeys && settings.userApiKeys.length > 0 && (
                               <span className="text-[8px] mono font-black text-emerald-500 animate-pulse">LOAD_BALANCING_ACTIVE</span>
                             )}
                          </div>
                       </div>
                       <div className="flex-grow overflow-y-auto custom-scrollbar p-2 space-y-2">
                          {(!settings.userApiKeys || settings.userApiKeys.length === 0) ? (
                            <div className="h-full flex flex-col items-center justify-center text-neutral-700 space-y-2 opacity-50 py-12">
                               <Zap size={32} strokeWidth={1} />
                               <p className="mono text-[9px] font-black uppercase tracking-widest">Chưa có khóa cá nhân</p>
                            </div>
                          ) : (
                            settings.userApiKeys.map((key, idx) => (
                              <div key={idx} className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl group hover:border-emerald-500/30 transition-all">
                                 <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-[10px] font-black text-emerald-500 mono">
                                    {idx + 1}
                                 </div>
                                 <div className="flex-grow mono text-[10px] text-neutral-400 truncate">
                                    {key.substring(0, 8)}••••••••••••••••{key.substring(key.length - 4)}
                                 </div>
                                 <button 
                                    onClick={() => handleRemoveKey(key)}
                                    className="p-2 text-neutral-600 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                                 >
                                    <Trash2 size={14} />
                                 </button>
                              </div>
                            ))
                          )}
                       </div>
                    </div>
                  </div>

                  <p className="text-[9px] text-neutral-600 font-bold italic leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">
                    * Hệ thống sẽ tự động luân chuyển (Load Balancing) giữa các API Key bạn cung cấp để tối ưu hóa hạn mức và tốc độ phản hồi.
                  </p>
                </div>

                {/* CỘT PHẢI: API KEY HỆ THỐNG */}
                <div className="space-y-8 flex flex-col">
                  {/* REVERSE PROXY CONFIGURATION */}
                  <div className="p-6 bg-purple-500/5 border border-purple-500/10 rounded-2xl space-y-6 shadow-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                         <Zap size={18} className="text-purple-400" />
                         <span className="text-sm font-black uppercase tracking-widest text-purple-400 italic">Reverse Proxy (AI Gateway)</span>
                         <div 
                            onClick={() => onUpdateSettings({ proxyEnabled: !settings.proxyEnabled })}
                            className={`w-10 h-5 rounded-full relative transition-all cursor-pointer ${settings.proxyEnabled ? 'bg-purple-500' : 'bg-neutral-800'}`}
                          >
                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${settings.proxyEnabled ? 'left-[22px]' : 'left-0.5'}`}></div>
                          </div>
                         <div className={`w-2 h-2 rounded-full shadow-[0_0_8px] transition-all duration-500 ${
                           settings.proxyStatus === 'success' ? 'bg-emerald-500 shadow-emerald-500/50' :
                           settings.proxyStatus === 'testing' ? 'bg-yellow-500 shadow-yellow-500/50 animate-pulse' :
                           settings.proxyStatus === 'error' ? 'bg-rose-500 shadow-rose-500/50' :
                           'bg-neutral-700 shadow-transparent'
                         }`} />
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={handleLoadAllModels}
                          disabled={isLoadingModels}
                          className="flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-lg mono text-[8px] font-black text-purple-400 transition-all active:scale-95 disabled:opacity-50"
                        >
                          {isLoadingModels ? <RefreshCw size={10} className="animate-spin" /> : <RefreshCw size={10} />}
                          LOAD MODELS
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                      {/* Proxy #1 (Primary) */}
                      <div className="p-5 bg-purple-500/5 border border-purple-500/20 rounded-2xl space-y-4 relative">
                        <div className="space-y-1.5">
                          <label className="mono text-[9px] font-black text-neutral-500 uppercase tracking-widest">Proxy #1 URL (Chính)</label>
                          <input 
                            type="text"
                            value={settings.proxyUrl || ''}
                            onChange={(e) => onUpdateSettings({ proxyUrl: e.target.value })}
                            placeholder="https://openrouter.ai/api/v1"
                            className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 mono text-xs text-purple-300 outline-none focus:border-purple-500/50 transition-all"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <label className="mono text-[9px] font-black text-neutral-500 uppercase tracking-widest">Proxy #1 Key</label>
                            <button 
                              onClick={() => setShowProxyKeys(!showProxyKeys)}
                              className="mono text-[8px] font-black text-neutral-600 hover:text-purple-400 uppercase tracking-widest transition-colors"
                            >
                              {showProxyKeys ? 'Ẩn' : 'Hiện'}
                            </button>
                          </div>
                          <div className="relative">
                            <input 
                              type={showProxyKeys ? "text" : "password"}
                              value={settings.proxyKey || ''}
                              onChange={(e) => onUpdateSettings({ proxyKey: e.target.value })}
                              placeholder="sk-or-v1-..."
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 mono text-xs text-purple-300 outline-none focus:border-purple-500/50 transition-all"
                            />
                            {!showProxyKeys && settings.proxyKey && (
                              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none mono text-xs text-purple-300/50 bg-black/40 pr-4">
                                {settings.proxyKey.substring(0, 8)}••••••••{settings.proxyKey.substring(settings.proxyKey.length - 4)}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Proxy Model Selection */}
                        {(proxyModelsMap['primary']?.length > 0 || settings.proxyModel) && (
                          <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                            <label className="mono text-[9px] font-black text-neutral-500 uppercase tracking-widest">Proxy #1 Model</label>
                            <div className="relative">
                              <select 
                                value={settings.proxyModel || ''}
                                onChange={(e) => onUpdateSettings({ proxyModel: e.target.value })}
                                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 mono text-xs text-purple-300 outline-none focus:border-purple-500/50 transition-all appearance-none"
                              >
                                {!settings.proxyModel && <option value="">-- Chọn Model --</option>}
                                {(proxyModelsMap['primary'] || (settings.proxyModel ? [settings.proxyModel] : [])).map(m => (
                                  <option key={m} value={m} className="bg-[#080808] text-white">{m}</option>
                                ))}
                              </select>
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-purple-500/50">
                                ▼
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Proxy #2 (Secondary) */}
                      <div className="p-5 bg-purple-500/5 border border-purple-500/20 rounded-2xl space-y-4 relative">
                        <div className="space-y-1.5">
                          <label className="mono text-[9px] font-black text-neutral-500 uppercase tracking-widest">Proxy #2 URL</label>
                          <input 
                            type="text"
                            value={settings.proxyList?.[0]?.url || ''}
                            onChange={(e) => {
                              const newList = [...(settings.proxyList || [])];
                              if (newList.length === 0) newList.push({ url: '', key: '' });
                              newList[0].url = e.target.value;
                              onUpdateSettings({ proxyList: newList });
                            }}
                            placeholder="https://openrouter.ai/api/v1"
                            className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 mono text-xs text-purple-300 outline-none focus:border-purple-500/50 transition-all"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <label className="mono text-[9px] font-black text-neutral-500 uppercase tracking-widest">Proxy #2 Key</label>
                            <button 
                              onClick={() => setShowProxyKeys(!showProxyKeys)}
                              className="mono text-[8px] font-black text-neutral-600 hover:text-purple-400 uppercase tracking-widest transition-colors"
                            >
                              {showProxyKeys ? 'Ẩn' : 'Hiện'}
                            </button>
                          </div>
                          <div className="relative">
                            <input 
                              type={showProxyKeys ? "text" : "password"}
                              value={settings.proxyList?.[0]?.key || ''}
                              onChange={(e) => {
                                const newList = [...(settings.proxyList || [])];
                                if (newList.length === 0) newList.push({ url: '', key: '' });
                                newList[0].key = e.target.value;
                                onUpdateSettings({ proxyList: newList });
                              }}
                              placeholder="sk-or-v1-..."
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 mono text-xs text-purple-300 outline-none focus:border-purple-500/50 transition-all"
                            />
                            {!showProxyKeys && settings.proxyList?.[0]?.key && (
                              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none mono text-xs text-purple-300/50 bg-black/40 pr-4">
                                {settings.proxyList[0].key.substring(0, 8)}••••••••{settings.proxyList[0].key.substring(settings.proxyList[0].key.length - 4)}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Proxy #2 Model Selection */}
                        {(proxyModelsMap['proxy_0']?.length > 0 || settings.proxyList?.[0]?.model) && (
                          <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                            <label className="mono text-[9px] font-black text-neutral-500 uppercase tracking-widest">Proxy #2 Model</label>
                            <div className="relative">
                              <select 
                                value={settings.proxyList?.[0]?.model || ''}
                                onChange={(e) => {
                                  const newList = [...(settings.proxyList || [])];
                                  if (newList.length === 0) newList.push({ url: '', key: '' });
                                  newList[0].model = e.target.value;
                                  onUpdateSettings({ proxyList: newList });
                                }}
                                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 mono text-xs text-purple-300 outline-none focus:border-purple-500/50 transition-all appearance-none"
                              >
                                {!settings.proxyList?.[0]?.model && <option value="">-- Chọn Model --</option>}
                                {(proxyModelsMap['proxy_0'] || (settings.proxyList?.[0]?.model ? [settings.proxyList[0].model] : [])).map(m => (
                                  <option key={m} value={m} className="bg-[#080808] text-white">{m}</option>
                                ))}
                              </select>
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-purple-500/50">
                                ▼
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-4 bg-black/40 border border-white/5 rounded-xl">
                      <p className="text-[9px] text-neutral-600 font-bold italic leading-relaxed">
                        * Hệ thống hỗ trợ các Proxy tương thích chuẩn <span className="text-purple-400">OpenAI API</span> (như OpenRouter, Groq, DeepSeek...).
                      </p>
                      <p className="text-[9px] text-neutral-600 font-bold italic leading-relaxed mt-1">
                        * Chỉ cần tải Model thành công và chọn Model, thông tin sẽ được lưu tự động. Hệ thống sẽ ưu tiên sử dụng Proxy này. Nếu để trống, hệ thống sẽ dùng Key AI Studio.
                      </p>
                      {proxyError && (
                        <p className="mt-2 text-[9px] text-rose-400 mono font-black uppercase text-center animate-pulse">
                          &gt; ERROR: {proxyError}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 bg-black/80 border-t border-white/5 flex justify-center gap-4 shrink-0">
          <button 
            onClick={() => {
              setConfirmConfig({
                isOpen: true,
                title: 'Khôi phục cài đặt gốc',
                message: 'Bạn có chắc chắn muốn khôi phục toàn bộ cài đặt về mặc định không? (Bao gồm cả API Key)',
                onConfirm: () => {
                  onUpdateSettings(DEFAULT_SETTINGS);
                  gameAI.resetBlacklist();
                },
                type: 'danger'
              });
            }}
            className="flex-1 max-w-xs py-5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 rounded-xl mono text-xs font-black uppercase transition-all tracking-[0.2em] shadow-2xl active:scale-[0.99]"
          >
            Khôi phục cài đặt gốc
          </button>
          <button 
            onClick={onClose} 
            className="flex-[2] max-w-lg py-5 bg-white/5 hover:bg-emerald-500/10 text-neutral-500 hover:text-emerald-400 border border-white/10 hover:border-emerald-500/40 rounded-xl mono text-xs font-black uppercase transition-all tracking-[0.4em] shadow-2xl active:scale-[0.99] group"
          >
            <span className="group-hover:translate-x-1 inline-block transition-transform">
              {view === 'playing' ? 'Lưu & Tiếp Tục Game' : 'Lưu & Về Sảnh'}
            </span>
          </button>
        </div>
        
        <ConfirmModal 
          isOpen={confirmConfig.isOpen}
          title={confirmConfig.title}
          message={confirmConfig.message}
          onConfirm={confirmConfig.onConfirm}
          onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
          type={confirmConfig.type}
        />
      </div>
    </div>
  );
};
