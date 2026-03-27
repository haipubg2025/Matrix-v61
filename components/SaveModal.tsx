
import React, { useState, useEffect } from 'react';
import { Player } from '../types';
import { dbService, SaveMetadata } from '../services/dbService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  player: Player;
}

export const SaveModal: React.FC<Props> = ({ isOpen, onClose, player }) => {
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [slotsInfo, setSlotsInfo] = useState<Record<string, SaveMetadata | null>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [newSaveName, setNewSaveName] = useState('');

  const loadSlots = async () => {
    const info = await dbService.getSlotsInfo();
    setSlotsInfo(info);
  };

  useEffect(() => {
    if (isOpen) {
      loadSlots();
      setNewSaveName(`${player.name}_${Date.now().toString().slice(-4)}`);
    }
  }, [isOpen, player]);

  if (!isOpen) return null;

  const handleSave = async (slotId: string) => {
    setIsLoading(true);
    try {
      const currentData = await dbService.load('current_session');
      if (currentData) {
        await dbService.save(currentData, slotId);
        setSaveStatus(`Thực tại đã được phong ấn thành công!`);
        await loadSlots();
        setTimeout(() => setSaveStatus(null), 3000);
      } else {
        setSaveStatus("Không tìm thấy dữ liệu phiên hiện tại.");
      }
    } catch (err) {
      setSaveStatus("Lỗi kết nối Ma Trận.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNewSave = () => {
    if (!newSaveName.trim()) return;
    const sanitized = newSaveName.trim().replace(/[^a-zA-Z0-9_]/g, '_');
    const slotId = `manual_${sanitized}`;
    handleSave(slotId);
  };

  const manualSlots = Object.keys(slotsInfo)
    .filter(k => k.startsWith('manual_'))
    .sort((a, b) => (slotsInfo[b]?.timestamp || 0) - (slotsInfo[a]?.timestamp || 0));

  return (
    <div className="SaveModal fixed inset-0 z-[200] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4 animate-in fade-in duration-300 mono">
      <div className="w-full max-w-3xl bg-[#080808] border border-emerald-500/20 rounded-sm p-8 shadow-[0_0_100px_rgba(0,0,0,1)] relative overflow-hidden flex flex-col gap-6 max-h-[90vh]">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent"></div>
        
        <div className="flex justify-between items-end border-b border-white/5 pb-4">
          <div className="flex flex-col">
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">
              Phong ấn <span className="text-emerald-500 text-glow">Thực Tại</span>
            </h3>
            <span className="text-[9px] text-neutral-600 font-black uppercase tracking-widest mt-1 italic">Quantum_Memory_Bank_Access // Unrestricted_Slots_Active</span>
          </div>
          <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors text-xl">✕</button>
        </div>
        
        {saveStatus && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-sm text-emerald-400 text-center text-xs font-black animate-in slide-in-from-top-2">
            [ {saveStatus} ]
          </div>
        )}

        {/* New Save Input */}
        <div className="bg-white/[0.02] border border-white/10 p-6 rounded-sm space-y-4">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Định danh Thực tại mới</label>
            <div className="flex gap-3">
              <input 
                type="text" 
                value={newSaveName}
                onChange={(e) => setNewSaveName(e.target.value)}
                placeholder="Nhập tên tệp lưu..."
                className="flex-grow bg-black border border-white/10 px-4 py-3 text-sm font-bold text-white outline-none focus:border-emerald-500/50 transition-colors"
              />
              <button 
                onClick={handleCreateNewSave}
                disabled={isLoading || !newSaveName.trim()}
                className="px-8 py-3 bg-emerald-500 text-black font-black uppercase text-xs rounded-sm hover:bg-emerald-400 transition-all shadow-lg disabled:opacity-30"
              >
                Tạo Mới [+]
              </button>
            </div>
          </div>
        </div>

        {/* Existing Slots List */}
        <div className="flex-grow overflow-y-auto custom-scrollbar space-y-3 pr-2">
          <h4 className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] mb-4">Các điểm neo thực tại hiện có ({manualSlots.length})</h4>
          
          {manualSlots.length > 0 ? (
            manualSlots.map((slotId) => {
              const meta = slotsInfo[slotId];
              if (!meta) return null;
              return (
                <div 
                  key={slotId}
                  className="group relative p-4 bg-white/[0.01] border border-white/5 hover:border-emerald-500/30 transition-all flex items-center gap-6 overflow-hidden"
                >
                  <div className="w-12 aspect-[2/3] bg-black/40 border border-white/10 rounded-sm overflow-hidden shrink-0">
                    {meta.avatar ? (
                      <img src={meta.avatar} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" alt="Save" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-800 text-lg italic font-black">∅</div>
                    )}
                  </div>

                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-start mb-1">
                       <span className="text-[9px] font-black text-emerald-500/60 uppercase tracking-widest truncate max-w-[200px]">{slotId.replace('manual_', '')}</span>
                       <span className="text-[8px] font-bold text-neutral-600 uppercase">
                         {new Date(meta.timestamp).toLocaleString('vi-VN')}
                       </span>
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-black text-white uppercase truncate">{meta.playerName}</h4>
                      <div className="flex items-center gap-3">
                        <span className="text-[9px] font-bold text-emerald-400/60 uppercase">Lượt {meta.turnCount}</span>
                        <span className="w-1 h-1 bg-neutral-800 rounded-full"></span>
                        <span className="text-[9px] font-bold text-neutral-500 uppercase italic truncate">{meta.genre}</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    disabled={isLoading}
                    onClick={() => handleSave(slotId)}
                    className="px-5 py-2 bg-white/5 text-white border border-white/10 font-black uppercase text-[9px] rounded-sm hover:bg-emerald-500 hover:text-black hover:border-transparent transition-all shrink-0"
                  >
                    Ghi Đè
                  </button>
                </div>
              );
            })
          ) : (
            <div className="py-10 text-center border border-dashed border-white/5 opacity-20">
              <span className="text-xs font-bold uppercase italic tracking-widest">Chưa có điểm neo thủ công</span>
            </div>
          )}
        </div>

        <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-center">
           <p className="text-[8px] text-neutral-700 max-w-[60%] leading-relaxed font-black uppercase italic">
             * Hệ thống Reality_Vault cho phép lưu trữ không giới hạn. Tên trùng lặp sẽ tự động ghi đè lên dòng thời gian cũ.
           </p>
           <button onClick={onClose} className="px-8 py-3 bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-all rounded-sm border border-white/10 font-black uppercase text-xs">
            Đóng [ESC]
          </button>
        </div>
      </div>
      
      <style>{`
        .text-glow {
          text-shadow: 0 0 10px rgba(16, 185, 129, 0.4);
        }
      `}</style>
    </div>
  );
};
