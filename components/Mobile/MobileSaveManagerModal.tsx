
import React, { useState, useEffect, useRef } from 'react';
import { dbService, SaveMetadata } from '../../services/dbService';
import { compressionService } from '../../services/compressionService';
import { Trash2, Download, Upload, RefreshCw, AlertTriangle, X } from 'lucide-react';
import { DEFAULT_AVATAR } from '../../constants';

interface MobileSaveManagerModalProps {
  onClose: () => void;
  onLoadSave: (slotId: string) => void;
}

export const MobileSaveManagerModal: React.FC<MobileSaveManagerModalProps> = ({ onClose, onLoadSave }) => {
  const [slots, setSlots] = useState<Record<string, SaveMetadata | null>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshSlots = async () => {
    const info = await dbService.getSlotsInfo();
    setSlots(info);
  };

  useEffect(() => {
    refreshSlots();
  }, []);

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

  const confirmClearAll = async () => {
    await dbService.clearAll();
    await refreshSlots();
    setShowConfirmClear(false);
    showMsg("Đã thanh trừng toàn bộ!");
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
        border: 'border-amber-500/20',
        text: 'text-amber-500',
        bg: 'bg-amber-500'
      },
      emerald: {
        border: 'border-emerald-500/20',
        text: 'text-emerald-500',
        bg: 'bg-emerald-500'
      }
    };

    const c = colors[color];
    
    return (
      <div key={key} className={`p-1 rounded-2xl bg-white/[0.02] border transition-all flex flex-col gap-3 ${meta ? c.border : 'border-dashed border-white/5 opacity-40'}`}>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-14 bg-black border border-white/5 rounded-lg overflow-hidden shrink-0`}>
              {meta?.avatar ? <img src={meta.avatar} className="w-full h-full object-cover" /> : <img src={DEFAULT_AVATAR} className="w-full h-full object-cover opacity-20" />}
            </div>
            <div className="flex flex-col min-w-0">
              <span className={`text-[8px] font-black ${c.text} uppercase tracking-widest`}>{label}</span>
              {meta ? (
                <>
                  <h4 className="text-sm font-black text-white uppercase truncate">{meta.playerName}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] text-neutral-600 font-bold uppercase">{meta.genre}</span>
                  </div>
                </>
              ) : <span className="text-[10px] font-bold text-neutral-700 italic">Dữ liệu trống...</span>}
            </div>
          </div>
          {meta && (
            <div className="flex flex-col items-end">
              <span className="text-[8px] font-bold text-neutral-600">{new Date(meta.timestamp).toLocaleDateString()}</span>
              <span className="text-[8px] font-bold text-neutral-600">{new Date(meta.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
          )}
        </div>

        {meta && (
          <div className="flex gap-2">
            <button 
              onClick={() => onLoadSave(key)}
              className={`flex-1 py-2 ${c.bg} text-black font-black uppercase text-[10px] rounded-xl active:scale-95 transition-all`}
            >
              Nạp
            </button>
            <button 
              onClick={() => handleExport(key)}
              className="p-2 bg-white/5 text-white rounded-xl border border-white/10 active:scale-90"
            >
              <Download size={14} />
            </button>
            <button 
              onClick={() => handleDeleteSlot(key)}
              className="p-2 bg-rose-500/10 text-rose-500 rounded-xl border border-rose-500/20 active:scale-90"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>
    );
  };

  const manualKeys = Object.keys(slots).filter(k => k.startsWith('manual_'));
  const autoKeys = Array.from({length: 10}, (_, i) => `auto_slot_${i}`);

  return (
    <div className="MobileSaveManagerModal fixed inset-0 z-[600] bg-black flex flex-col h-full overflow-hidden font-sans">
      <input type="file" ref={fileInputRef} onChange={handleImportFile} className="hidden" accept=".json,.mtx" multiple />
      
      {/* HEADER */}
      <div className="flex items-center justify-between p-2 border-b border-white/10 bg-black/40 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_#f59e0b]"></div>
          <h2 className="text-sm font-black text-white uppercase tracking-widest italic">SAVE_STATION</h2>
        </div>
        <button onClick={onClose} className="p-2 bg-white/5 text-neutral-400 rounded-xl border border-white/10 active:scale-90 transition-all">✕</button>
      </div>

      {/* ACTIONS BAR */}
      <div className="p-1 border-b border-white/5 bg-black/20 flex gap-2 shrink-0">
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isImporting}
          className="flex-1 py-3 bg-emerald-500 text-black rounded-xl flex items-center justify-center gap-2 mono text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50"
        >
          {isImporting ? (
            <>
              <div className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              <span>Đang nạp...</span>
            </>
          ) : (
            <>
              <Upload size={14} /> Nhập Tệp
            </>
          )}
        </button>
        <button 
          onClick={() => setShowConfirmClear(true)}
          className="px-4 py-3 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl active:scale-95 transition-all"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* MESSAGE POPUP */}
      {message && (
        <div className="absolute top-32 left-1/2 -translate-x-1/2 z-[700] px-6 py-2 bg-amber-500 text-black text-[10px] font-black uppercase rounded-full shadow-2xl animate-bounce">
          {message}
        </div>
      )}

      {/* CONTENT */}
      <div className="flex-grow overflow-y-auto custom-scrollbar p-1 space-y-1 pb-20">
        {/* MANUAL SAVES */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest italic">Hồ sơ Thủ công</h4>
            <span className="text-[8px] mono text-neutral-600 uppercase">{manualKeys.length} SLOTS</span>
          </div>
          <div className="space-y-3">
            {manualKeys.length > 0 ? manualKeys.map(key => renderSlot(key, 'Manual_Save', 'amber')) : (
              <div className="py-10 flex flex-col items-center justify-center opacity-20 text-center border border-dashed border-white/10 rounded-2xl">
                <span className="text-3xl mb-2">∅</span>
                <p className="text-[8px] font-black uppercase tracking-widest">Chưa có dữ liệu</p>
              </div>
            )}
          </div>
        </section>

        {/* AUTO SAVES */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic">Tự động Xoay vòng</h4>
            <span className="text-[8px] mono text-neutral-600 uppercase">10 SLOTS</span>
          </div>
          <div className="space-y-3">
            {autoKeys.map((key, i) => renderSlot(key, `Auto_Slot_${i}`, 'emerald'))}
          </div>
        </section>
      </div>

      {/* CONFIRM CLEAR MODAL */}
      {showConfirmClear && (
        <div className="fixed inset-0 z-[800] bg-black/90 backdrop-blur-md flex items-center justify-center p-1">
          <div className="bg-neutral-900 border border-rose-500/30 p-1 rounded-3xl w-full max-w-xs flex flex-col gap-6 animate-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-rose-500">
              <AlertTriangle size={24} />
              <h4 className="text-lg font-black uppercase italic">Cảnh báo</h4>
            </div>
            <p className="text-xs text-neutral-400 font-bold leading-relaxed">
              Bạn sắp xóa <span className="text-white">TOÀN BỘ</span> thực tại đã lưu. Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-2">
              <button onClick={confirmClearAll} className="flex-1 py-3 bg-rose-600 text-white font-black uppercase text-[10px] rounded-xl">Xác nhận</button>
              <button onClick={() => setShowConfirmClear(false)} className="flex-1 py-3 bg-white/5 text-neutral-400 font-black uppercase text-[10px] rounded-xl">Hủy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
