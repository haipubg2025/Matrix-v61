
import React, { useState, useMemo, useEffect } from 'react';
import { GameLog, AppSettings } from '../types';
import { dbService, SaveMetadata } from '../services/dbService';
import { MobileHistoryModal } from './Mobile/MobileHistoryModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  logs: GameLog[];
  onLoadSave: (slotId: string) => void;
  settings: AppSettings;
}

interface Turn {
  id: number;
  playerLog: GameLog | null;
  narratorLogs: GameLog[];
  systemLogs: GameLog[];
  timestamp: number;
  slotId?: string;
}

export const HistoryModal: React.FC<Props> = ({ isOpen, onClose, logs, onLoadSave, settings }) => {
  const [slotsInfo, setSlotsInfo] = useState<Record<string, SaveMetadata | null>>({});

  useEffect(() => {
    if (isOpen) {
      const fetchSlots = async () => {
        const info = await dbService.getSlotsInfo();
        setSlotsInfo(info);
      };
      fetchSlots();
    }
  }, [isOpen]);

  // Nhóm logs thành 10 lượt hội thoại gần nhất
  const turns = useMemo(() => {
    const groupedTurns: Turn[] = [];
    let currentTurn: Turn | null = null;

    logs.forEach((log) => {
      if (log.type === 'player' || (currentTurn === null && (log.type === 'narrator' || log.type === 'system'))) {
        if (currentTurn) groupedTurns.push(currentTurn);
        currentTurn = {
          id: groupedTurns.length + 1,
          playerLog: log.type === 'player' ? log : null,
          narratorLogs: [],
          systemLogs: [],
          timestamp: log.timestamp
        };
      } else if (currentTurn) {
        if (log.type === 'narrator') currentTurn.narratorLogs.push(log);
        if (log.type === 'system' || log.type === 'error') currentTurn.systemLogs.push(log);
      }
    });

    if (currentTurn) groupedTurns.push(currentTurn);
    
    // Đảo ngược và lấy 10 lượt mới nhất
    return groupedTurns.reverse().slice(0, 10);
  }, [logs]);

  if (settings.mobileMode && isOpen) {
    return <MobileHistoryModal onClose={onClose} logs={logs} onLoadSave={onLoadSave} />;
  }

  if (!isOpen) return null;

  return (
    <div className="HistoryModal fixed inset-0 z-[450] bg-black flex flex-col animate-in fade-in duration-300 mono">
      <div className="w-full h-full bg-[#050505] flex flex-col overflow-hidden relative">
        
        {/* SCANLINE EFFECT */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-50 bg-[size:100%_4px,3px_100%]"></div>

        {/* HEADER HUD */}
        <div className="flex justify-between items-center p-6 border-b border-white/10 bg-cyan-500/5 shrink-0 relative z-10">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-4">
              <div className="w-3 h-3 rounded-full bg-cyan-500 shadow-[0_0_10px_#06b6d4] animate-pulse"></div>
              <h2 className="text-2xl font-black text-cyan-400 tracking-[0.3em] uppercase italic">Hồ Sơ Truy Hồi Thực Tại</h2>
            </div>
            <span className="text-[9px] text-neutral-600 font-black uppercase tracking-[0.5em] ml-7">System_Rotation_Archive_v20.4_Stable</span>
          </div>
          <button 
            onClick={onClose} 
            className="px-10 py-3 bg-white/5 hover:bg-rose-500/20 text-neutral-500 hover:text-rose-400 rounded-sm border border-white/10 hover:border-rose-500/40 transition-all font-black uppercase text-xs shadow-2xl active:scale-95"
          >
            Ngắt Kết Nối [ESC]
          </button>
        </div>

        {/* CONTENT AREA: 2 COLUMNS */}
        <div className="flex-grow flex overflow-hidden relative z-10">
          
          {/* LEFT: RECENT TURNS TIMELINE */}
          <div className="flex-grow overflow-y-auto custom-scrollbar p-6 space-y-4 bg-[radial-gradient(circle_at_left,rgba(34,211,238,0.03),transparent)] border-r border-white/5">
            <div className="mb-6 flex items-center justify-between px-2">
              <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest italic">❯ 10 Bản ghi gần nhất</h3>
              <span className="text-[8px] mono text-cyan-500/40 font-bold uppercase">Timeline_Density: Optimized</span>
            </div>

            {turns.length > 0 ? (
              turns.map((turn) => (
                <div key={turn.id} className="group relative bg-white/[0.02] border border-white/5 p-4 rounded-sm hover:border-cyan-500/30 transition-all">
                  {/* Turn Tag */}
                  <div className="absolute -left-2 top-4 w-10 h-6 bg-neutral-900 border border-white/10 flex items-center justify-center shadow-xl">
                    <span className="text-[9px] font-black text-neutral-500 group-hover:text-cyan-400 transition-colors">#{turn.id.toString().padStart(3, '0')}</span>
                  </div>

                  <div className="ml-10 space-y-3">
                    {/* Condensed Player Action */}
                    {turn.playerLog && (
                      <div className="flex gap-3 items-baseline">
                        <span className="text-emerald-500 text-xs shrink-0 font-black mono">❯</span>
                        <p className="text-emerald-400/90 text-sm font-bold line-clamp-1 italic group-hover:line-clamp-none transition-all duration-500">
                          {turn.playerLog.content}
                        </p>
                      </div>
                    )}

                    {/* Condensed Narrator Response */}
                    {turn.narratorLogs.length > 0 && (
                      <div className="flex gap-3 items-start">
                        <span className="text-cyan-500 text-xs shrink-0 font-black mono mt-0.5">•</span>
                        <div className="text-neutral-400 text-[13px] leading-relaxed bg-white/[0.01] p-2 rounded-sm border-l border-white/5">
                          {turn.narratorLogs.map(l => {
                            if (l.summary) return l.summary;
                            // Legacy fallback: Truncate content if summary is missing
                            const cleanContent = l.content.replace(/\[\s*(?:KHỞI TẠO|GIẢI TRÌNH|HỆ THỐNG|THÔNG BÁO|THỜI GIAN)[^\]]+\]/gi, '').trim();
                            return cleanContent.length > 200 ? cleanContent.substring(0, 200) + "..." : cleanContent;
                          }).join('\n')}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-end pt-1">
                       <span className="text-[8px] text-neutral-700 font-bold uppercase mono">{new Date(turn.timestamp).toLocaleTimeString('vi-VN')}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center opacity-10">
                <span className="text-8xl font-black italic select-none text-cyan-500">NULL</span>
              </div>
            )}
          </div>

          {/* RIGHT: AUTO-SAVE VAULT CONTROL */}
          <div className="w-[28rem] shrink-0 bg-black/40 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-white/10 bg-emerald-500/5">
              <h3 className="text-sm font-black text-emerald-500 uppercase tracking-[0.2em] italic mb-1">Điểm Khôi Phục Lượng Tử</h3>
              <p className="text-[9px] text-neutral-600 font-bold uppercase tracking-widest leading-tight">Chọn một tệp lưu để quay lại thực tại tương ứng.</p>
            </div>

            <div className="flex-grow overflow-y-auto custom-scrollbar p-4 space-y-2">
              {Array.from({ length: 10 }, (_, i) => {
                const slotId = `auto_slot_${i}`;
                const meta = slotsInfo[slotId];
                
                return (
                  <div 
                    key={slotId}
                    onClick={() => meta && onLoadSave(slotId)}
                    className={`group/slot relative p-3 border transition-all cursor-pointer flex items-center gap-4 overflow-hidden ${
                      meta 
                      ? 'bg-emerald-500/[0.02] border-emerald-500/20 hover:bg-emerald-500/10 hover:border-emerald-500/50 hover:translate-x-1' 
                      : 'bg-black border-dashed border-white/5 opacity-30 grayscale'
                    }`}
                  >
                    <div className="absolute top-0 right-0 w-8 h-8 bg-emerald-500/5 rotate-45 translate-x-4 -translate-y-4"></div>
                    
                    <div className="w-10 aspect-[2/3] bg-black/60 border border-white/10 rounded-sm overflow-hidden shrink-0 shadow-lg">
                      {meta?.avatar ? (
                        <img src={meta.avatar} className="w-full h-full object-cover group-hover/slot:scale-110 transition-transform" alt="Preview" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-800 text-[10px] font-black italic">∅</div>
                      )}
                    </div>

                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter">Auto_Slot_{i}</span>
                        {meta && <span className="text-[7px] font-bold text-neutral-700">{new Date(meta.timestamp).toLocaleTimeString('vi-VN')}</span>}
                      </div>
                      {meta ? (
                        <div className="space-y-0">
                          <h4 className="text-xs font-black text-white uppercase truncate tracking-tight">{meta.playerName}</h4>
                          <div className="flex items-center gap-2 text-[8px] font-black text-emerald-400/60 uppercase italic">
                            <span>LƯỢT {meta.turnCount}</span>
                            <span className="w-0.5 h-0.5 bg-neutral-700 rounded-full"></span>
                            <span className="truncate">{meta.genre}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-neutral-800 uppercase italic">Buffer_Empty</span>
                      )}
                    </div>

                    {meta && (
                      <div className="opacity-0 group-hover/slot:opacity-100 transition-opacity bg-emerald-500 text-black px-3 py-1.5 rounded-sm font-black text-[9px] uppercase shadow-[0_0_15px_#10b981]">
                        QUAY LẠI
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* FOOTER INFO */}
        <div className="p-3 border-t border-white/5 bg-black/60 flex justify-between items-center shrink-0 relative z-10 px-8">
           <div className="flex gap-6 items-center">
              <div className="flex items-center gap-2">
                 <div className="w-1 h-1 bg-cyan-500 rounded-full"></div>
                 <span className="text-[8px] text-neutral-600 font-black uppercase tracking-widest">Total_Turns_Logged: {logs.length}</span>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-1 h-1 bg-emerald-500 rounded-full"></div>
                 <span className="text-[8px] text-neutral-600 font-black uppercase tracking-widest">Active_Timeline: Stable</span>
              </div>
           </div>
           <span className="text-[8px] text-neutral-800 font-black uppercase tracking-[0.5em] italic">Quantum_Reality_Rotation_System</span>
        </div>
      </div>
    </div>
  );
};
