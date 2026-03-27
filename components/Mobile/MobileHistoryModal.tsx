
import React, { useState, useEffect, useMemo } from 'react';
import { GameLog } from '../../types';
import { dbService, SaveMetadata } from '../../services/dbService';
import { ChevronRight, History, Save } from 'lucide-react';
import { DEFAULT_AVATAR } from '../../constants';

interface MobileHistoryModalProps {
  onClose: () => void;
  logs: GameLog[];
  onLoadSave: (slotId: string) => void;
}

interface Turn {
  id: number;
  playerLog: GameLog | null;
  narratorLogs: GameLog[];
  systemLogs: GameLog[];
  timestamp: number;
}

export const MobileHistoryModal: React.FC<MobileHistoryModalProps> = ({ onClose, logs, onLoadSave }) => {
  const [slotsInfo, setSlotsInfo] = useState<Record<string, SaveMetadata | null>>({});
  const [activeTab, setActiveTab] = useState<'history' | 'saves'>('history');

  useEffect(() => {
    const fetchSlots = async () => {
      const info = await dbService.getSlotsInfo();
      setSlotsInfo(info);
    };
    fetchSlots();
  }, []);

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
    return groupedTurns.reverse().slice(0, 10);
  }, [logs]);

  return (
    <div className="MobileHistoryModal fixed inset-0 z-[600] bg-black flex flex-col h-full overflow-hidden font-sans">
      {/* HEADER */}
      <div className="flex items-center justify-between p-3 border-b border-white/10 bg-black/40 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_#3b82f6]"></div>
          <h2 className="text-sm font-black text-white uppercase tracking-widest italic">CHRONO_LOGS</h2>
        </div>
        <button onClick={onClose} className="p-2 bg-white/5 text-neutral-400 rounded-xl border border-white/10 active:scale-90 transition-all">✕</button>
      </div>

      {/* TABS */}
      <div className="flex border-b border-white/5 bg-black/20 shrink-0">
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-3 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'text-cyan-400 bg-cyan-500/10' : 'text-neutral-500'}`}
        >
          <History size={14} />
          Lịch sử
        </button>
        <button 
          onClick={() => setActiveTab('saves')}
          className={`flex-1 py-3 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'saves' ? 'text-emerald-400 bg-emerald-500/10' : 'text-neutral-500'}`}
        >
          <Save size={14} />
          Điểm lưu
        </button>
      </div>

      {/* CONTENT */}
      <div className="flex-grow overflow-y-auto custom-scrollbar p-3 relative">
        {activeTab === 'history' ? (
          <div className="space-y-4 animate-in slide-in-from-left duration-300 pb-20">
            {turns.length > 0 ? (
              turns.map((turn) => (
                <div key={turn.id} className="bg-white/[0.02] border border-white/5 p-3 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] font-black text-cyan-500 uppercase tracking-widest">BẢN GHI #{turn.id.toString().padStart(3, '0')}</span>
                    <span className="text-[8px] text-neutral-600 font-bold mono">{new Date(turn.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                  
                  {turn.playerLog && (
                    <div className="mb-2 pl-2 border-l-2 border-emerald-500/30">
                      <p className="text-emerald-400/90 text-xs font-bold italic line-clamp-2">{turn.playerLog.content}</p>
                    </div>
                  )}

                  {turn.narratorLogs.length > 0 && (
                    <div className="bg-white/[0.01] p-2 rounded-lg border border-white/5">
                      <p className="text-neutral-400 text-[11px] leading-relaxed">
                        {turn.narratorLogs.map(l => {
                          if (l.summary) return l.summary;
                          // Legacy fallback
                          const cleanContent = l.content.replace(/\[\s*(?:KHỞI TẠO|GIẢI TRÌNH|HỆ THỐNG|THÔNG BÁO|THỜI GIAN)[^\]]+\]/gi, '').trim();
                          return cleanContent.length > 150 ? cleanContent.substring(0, 150) + "..." : cleanContent;
                        }).join('\n')}
                      </p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="h-40 flex items-center justify-center opacity-20">
                <span className="text-4xl font-black italic text-cyan-500">NULL</span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 animate-in slide-in-from-right duration-300 pb-20">
            <div className="px-1">
              <h3 className="text-lg font-black text-white uppercase tracking-tighter italic">Điểm <span className="text-emerald-500">Khôi Phục</span></h3>
              <p className="text-[9px] text-neutral-600 font-bold uppercase tracking-widest">Tự động lưu 10 lượt gần nhất</p>
            </div>

            <div className="space-y-3">
              {Array.from({ length: 10 }, (_, i) => {
                const slotId = `auto_slot_${i}`;
                const meta = slotsInfo[slotId];
                
                return (
                  <div 
                    key={slotId}
                    onClick={() => meta && onLoadSave(slotId)}
                    className={`p-2 rounded-2xl border transition-all flex items-center gap-4 ${
                      meta 
                      ? 'bg-emerald-500/5 border-emerald-500/20 active:scale-95' 
                      : 'bg-black border-dashed border-white/5 opacity-30'
                    }`}
                  >
                    <div className="w-12 aspect-[2/3] bg-black border border-white/10 rounded-xl overflow-hidden shrink-0">
                      {meta?.avatar ? (
                        <img src={meta.avatar} className="w-full h-full object-cover" />
                      ) : (
                        <img src={DEFAULT_AVATAR} className="w-full h-full object-cover opacity-20" />
                      )}
                    </div>

                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Slot_{i}</span>
                        {meta && <span className="text-[8px] font-bold text-neutral-700">{new Date(meta.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>}
                      </div>
                      {meta ? (
                        <div className="space-y-0">
                          <h4 className="text-sm font-black text-white uppercase truncate">{meta.playerName}</h4>
                          <div className="text-[8px] font-black text-neutral-500 uppercase">Lượt {meta.turnCount} // {meta.genre}</div>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-neutral-800 uppercase italic">Trống</span>
                      )}
                    </div>
                    {meta && <ChevronRight size={16} className="text-emerald-500 mr-2" />}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
