
import React, { useState, useEffect, useRef } from 'react';
import { dbService, SaveMetadata } from '../services/dbService';
import { compressionService } from '../services/compressionService';
import { MobileSaveManagerModal } from './Mobile/MobileSaveManagerModal';
import { AppSettings } from '../types';
import { DEFAULT_AVATAR } from '../constants';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLoadSave: (data: any) => void;
  settings: AppSettings;
}

export const SaveManagerModal: React.FC<Props> = ({ isOpen, onClose, onLoadSave, settings }) => {
  if (settings.mobileMode && isOpen) {
    return <MobileSaveManagerModal onClose={onClose} onLoadSave={onLoadSave} />;
  }

  const [slots, setSlots] = useState<Record<string, SaveMetadata | null>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshSlots = async () => {
    const info = await dbService.getSlotsInfo();
    setSlots(info);
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    showMsg("Đang đồng bộ với đám mây...");
    const success = await dbService.syncAll();
    if (success) {
      await refreshSlots();
      showMsg("Đồng bộ thành công!");
    } else {
      showMsg("Đồng bộ thất bại. Kiểm tra kết nối.");
    }
    setIsSyncing(false);
  };

  useEffect(() => {
    if (isOpen) refreshSlots();
  }, [isOpen]);

  if (!isOpen) return null;

  const showMsg = (txt: string) => {
    setMessage(txt);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleExport = async (slotId: string) => {
    const data = await dbService.load(slotId);
    if (!data) return showMsg("Không có dữ liệu.");
    
    // Use strongest compression (binary blob)
    const blob = compressionService.compressToBlob(data);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const worldName = (data.selectedWorld?.title || 'UnknownWorld').replace(/\s+/g, '_');
    const playerName = (data.metadata?.playerName || 'Unknown').replace(/\s+/g, '_');
    const turnCount = data.metadata?.turnCount ?? 0;
    // Change extension to .mtx to indicate compressed Matrix file
    a.download = `Matrix_${worldName}_${playerName}_Turn${turnCount}.mtx`;
    a.click();
    URL.revokeObjectURL(url);
    showMsg("Đã xuất tệp thực tại (Nén tối đa)!");
  };

  const handleDeleteSlot = async (slotId: string) => {
    await dbService.delete(slotId);
    await refreshSlots();
    showMsg("Đã xóa thực tại!");
  };

  const handleClearAll = async () => {
    setShowConfirmClear(true);
  };

  const confirmClearAll = async () => {
    await dbService.clearAll();
    await refreshSlots();
    setShowConfirmClear(false);
    showMsg("Đã thanh trừng toàn bộ thực tại!");
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsImporting(true);
    showMsg("Đang nạp dữ liệu thực tại...");
    
    let successCount = 0;
    let failCount = 0;
    
    const processFile = (file: File): Promise<void> => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const buffer = event.target?.result as ArrayBuffer;
            if (!buffer) throw new Error("Tệp trống");
            
            let data: any = null;
            
            // Try to decompress first (it's binary)
            data = compressionService.decompressFromBuffer(buffer);
            
            // If decompression failed, maybe it's a plain JSON string
            if (!data) {
              const text = new TextDecoder().decode(buffer);
              data = JSON.parse(text);
            }

            if (!data || (!data.player && !data.metadata)) {
              throw new Error("Không phải tệp lưu của Matrix hoặc dữ liệu bị hỏng");
            }

            const worldId = data.metadata?.worldId || data.selectedWorld?.id || `imported_${Date.now()}`;
            const randomSuffix = Math.random().toString(36).substring(2, 9);
            const slotId = `manual_${worldId}_${randomSuffix}`;
            
            await dbService.save(data, slotId);
            successCount++;
            resolve();
          } catch (err: any) { 
            console.error("Import error:", err);
            failCount++;
            resolve();
          }
        };
        reader.onerror = () => {
          failCount++;
          resolve();
        };
        reader.readAsArrayBuffer(file);
      });
    };

    try {
      const promises = Array.from(files).map(file => processFile(file));
      await Promise.all(promises);
      
      await refreshSlots();
      
      if (failCount === 0) {
        showMsg(`Đã nạp thành công ${successCount} thực tại!`);
      } else if (successCount > 0) {
        showMsg(`Nạp xong: ${successCount} thành công, ${failCount} thất bại.`);
      } else {
        showMsg("Lỗi: Không có tệp nào hợp lệ.");
      }
    } catch (err) {
      showMsg("Lỗi hệ thống khi nạp tệp.");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const renderSlot = (key: string, label: string, color: 'amber' | 'emerald') => {
    const meta = slots[key];
    
    const colors = {
      amber: {
        border: 'border-amber-500/20 hover:border-amber-500/50',
        text: 'text-amber-500',
        textLight: 'text-amber-400',
        bg: 'bg-amber-600'
      },
      emerald: {
        border: 'border-emerald-500/20 hover:border-emerald-500/50',
        text: 'text-emerald-500',
        textLight: 'text-emerald-400',
        bg: 'bg-emerald-600'
      }
    };

    const c = colors[color];

    return (
      <div key={key} className={`group relative p-4 bg-white/[0.02] border transition-all flex items-center gap-6 ${meta ? c.border : 'border-dashed border-white/5 opacity-40'}`}>
        <div className={`w-14 aspect-[2/3] bg-black border border-white/5 rounded-sm overflow-hidden shrink-0`}>
          {meta?.avatar ? <img src={meta.avatar} className="w-full h-full object-cover" /> : <img src={DEFAULT_AVATAR} className="w-full h-full object-cover opacity-20" />}
        </div>
        <div className="flex-grow min-w-0">
          <div className="flex justify-between items-start mb-1">
            <span className={`text-[9px] font-black ${c.text} uppercase tracking-widest`}>{label}</span>
            {meta && <span className="text-[8px] font-bold text-neutral-600">{new Date(meta.timestamp).toLocaleString()}</span>}
          </div>
          {meta ? (
            <div className="space-y-0.5">
              <h4 className="text-base font-black text-white uppercase truncate">{meta.playerName}</h4>
              <div className="flex items-center gap-3 text-[10px] font-bold text-neutral-500">
                <span className={c.textLight}>Lượt: {meta.turnCount}</span>
                <span>•</span>
                <span className="italic">{meta.genre}</span>
              </div>
            </div>
          ) : <span className="text-xs font-bold text-neutral-700 italic">Dữ liệu trống...</span>}
        </div>
        <div className="flex gap-2 relative z-10">
          {meta && (
            <>
              <button onClick={() => onLoadSave(key)} className={`px-4 py-2 ${c.bg} text-black font-black uppercase text-[9px] rounded-sm hover:brightness-110`}>Nạp</button>
              <button onClick={() => handleExport(key)} className="px-3 py-2 bg-white/5 text-white text-[9px] font-black uppercase rounded-sm hover:bg-white/10">Xuất</button>
              <button onClick={() => handleDeleteSlot(key)} className="px-3 py-2 bg-red-600/20 text-red-500 text-[9px] font-black uppercase rounded-sm hover:bg-red-600 hover:text-white transition-colors">Xóa</button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="SaveManagerModal fixed inset-0 z-[400] bg-black flex flex-col animate-in fade-in duration-300 mono">
      <input type="file" ref={fileInputRef} onChange={handleImportFile} className="hidden" accept=".json,.mtx" multiple />
      
      <div className="flex justify-between items-center p-6 border-b border-white/10 bg-neutral-900/50 shrink-0">
        <div className="flex items-center gap-6">
          <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse shadow-[0_0_15px_#f59e0b]"></div>
          <div>
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic leading-none">Cơ sở <span className="text-amber-500">Dữ liệu Thực Tại</span></h3>
            <span className="text-[10px] text-neutral-600 font-black uppercase mt-1 block">Quantum_Vault & Auto_Rotation_Core // Multi_World_Sync_Active</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleSyncNow} 
            disabled={isSyncing}
            className="px-6 py-2.5 bg-blue-600/20 text-blue-400 border border-blue-600/30 font-black uppercase text-xs rounded-sm hover:bg-blue-600 hover:text-white transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            {isSyncing ? (
              <>
                <div className="w-3 h-3 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                <span>Đang đồng bộ...</span>
              </>
            ) : (
              <span>Đồng bộ ngay [⟳]</span>
            )}
          </button>
          <button onClick={handleClearAll} className="px-6 py-2.5 bg-red-600/20 text-red-500 border border-red-600/30 font-black uppercase text-xs rounded-sm hover:bg-red-600 hover:text-white transition-all active:scale-95">Thanh trừng tất cả [!]</button>
          <button 
            onClick={() => fileInputRef.current?.click()} 
            disabled={isImporting}
            className="px-8 py-2.5 bg-emerald-500 text-black font-black uppercase text-xs rounded-sm hover:bg-emerald-400 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isImporting ? (
              <>
                <div className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                <span>Đang nạp...</span>
              </>
            ) : (
              <span>Nhập từ máy [+]</span>
            )}
          </button>
          <button onClick={onClose} className="px-8 py-2.5 bg-white/5 hover:bg-white/10 text-neutral-500 hover:text-white rounded-sm border border-white/10 font-black uppercase text-xs transition-all active:scale-95">Đóng [ESC]</button>
        </div>
      </div>

      {message && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 px-10 py-3 bg-amber-500 text-black text-xs font-black uppercase animate-bounce shadow-[0_0_30px_rgba(245,158,11,0.5)]">
          [ {message} ]
        </div>
      )}

      <div className="flex-grow flex overflow-hidden">
        {/* Column 1: Manual Saves */}
        <div className="flex-1 border-r border-white/5 flex flex-col overflow-hidden bg-black/20">
          <div className="p-4 border-b border-white/5 bg-amber-500/5 flex items-center justify-between">
            <h4 className="text-xs font-black text-amber-500 uppercase tracking-[0.3em]">Vault: Lưu trữ Thủ công (Không giới hạn Slot)</h4>
            <span className="text-[10px] mono text-neutral-700 font-black uppercase">Manual_Saves: {Object.keys(slots).filter(k => k.startsWith('manual_')).length}</span>
          </div>
          <div className="flex-grow overflow-y-auto custom-scrollbar p-6 space-y-4">
            {Object.keys(slots).filter(k => k.startsWith('manual_')).length > 0 ? (
              Object.keys(slots).filter(k => k.startsWith('manual_')).map(key => renderSlot(key, 'Hồ sơ thủ công', 'amber'))
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-10 grayscale">
                <span className="text-6xl mb-4 italic font-black">∅</span>
                <span className="text-sm font-black uppercase tracking-widest">Chưa có dữ liệu phong ấn</span>
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Auto Saves */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-white/5 bg-emerald-500/5 flex items-center justify-between">
            <h4 className="text-xs font-black text-emerald-500 uppercase tracking-[0.3em]">Xoay vòng: Lưu trữ Tự động (10 Slots)</h4>
            <span className="text-[10px] mono text-neutral-700 font-black uppercase">Auto_Saves: {Object.keys(slots).filter(k => k.startsWith('auto_slot_')).length}</span>
          </div>
          <div className="flex-grow overflow-y-auto custom-scrollbar p-6 space-y-4">
            {Array.from({length: 10}, (_, i) => renderSlot(`auto_slot_${i}`, `Slot Tự Động ${i}`, 'emerald'))}
          </div>
        </div>
      </div>

      {showConfirmClear && (
        <div className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#101010] border border-red-500/30 p-8 max-w-md w-full rounded-sm shadow-[0_0_50px_rgba(220,38,38,0.2)] flex flex-col gap-6">
            <div className="flex items-center gap-4 text-red-500">
              <span className="text-4xl">⚠️</span>
              <h4 className="text-xl font-black uppercase tracking-tighter">Cảnh báo thanh trừng</h4>
            </div>
            <p className="text-sm text-neutral-400 leading-relaxed font-bold">
              Bạn đang yêu cầu xóa <span className="text-white">TOÀN BỘ</span> dữ liệu thực tại trong kho lưu trữ. Hành động này sẽ phá hủy mọi dòng thời gian đã phong ấn và <span className="text-red-500">KHÔNG THỂ HOÀN TÁC</span>.
            </p>
            <div className="flex gap-3 mt-2">
              <button 
                onClick={confirmClearAll}
                className="flex-1 py-3 bg-red-600 text-white font-black uppercase text-xs hover:bg-red-500 transition-all shadow-lg shadow-red-900/20"
              >
                Xác nhận xóa sạch
              </button>
              <button 
                onClick={() => setShowConfirmClear(false)}
                className="flex-1 py-3 bg-white/5 text-neutral-400 font-black uppercase text-xs hover:bg-white/10 transition-all border border-white/10"
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
