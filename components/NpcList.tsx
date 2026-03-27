
import React from 'react';
import { Relationship, Player } from '../types';
import { renderSafeText } from './NpcProfileBase';
import { ResolvedImage } from './ResolvedImage';
import { DEFAULT_AVATAR } from '../constants';

interface NpcListProps {
  npcs: Relationship[];
  player: Player;
  onSelectNpc: (npc: Relationship) => void;
  isCollapsed?: boolean;
  genre?: any;
}

export const NpcList: React.FC<NpcListProps> = ({ npcs, player, onSelectNpc, isCollapsed, genre }) => {
  return (
    <div className="space-y-2">
      {npcs.map((npc, idx) => {
        const isPresent = npc.isPresent;
        const isNearby = !isPresent && npc.lastLocation === player.currentLocation;
        
        const genderChar = npc.gender === 'Nữ' ? '♀' : '♂';
        const genderColor = npc.gender === 'Nữ' ? 'text-pink-500' : 'text-blue-500';

        const rightBorderColor = 'bg-cyan-500';
        const rightBorderShadow = 'shadow-[0_0_10px_#06b6d4]';

        return (
          <div 
            key={idx} 
            onClick={() => onSelectNpc(npc)}
            className={`group/item relative p-1.5 rounded-sm border transition-all cursor-pointer overflow-hidden ${
              npc.isDead
              ? 'bg-red-950/20 border-red-900/40 grayscale shadow-[inset_0_0_15px_rgba(127,29,29,0.1)]'
              : isPresent 
              ? 'bg-emerald-500/[0.08] border-emerald-500/40 shadow-[inset_0_0_15px_rgba(16,185,129,0.05)]' 
              : 'bg-cyan-500/[0.04] border-cyan-500/10 hover:border-cyan-500/30'
            } ${isCollapsed ? 'flex justify-center p-1' : ''}`}
          >
            {npc.isDead && (
              <div className="absolute top-0 left-0 w-0.5 h-full bg-red-600 shadow-[0_0_10px_#dc2626]"></div>
            )}
            {isPresent && !npc.isDead && (
              <div className="absolute top-0 left-0 w-0.5 h-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></div>
            )}
            <div className={`absolute top-0 right-0 w-0.5 h-full ${npc.isDead ? 'bg-red-900' : rightBorderColor} ${npc.isDead ? 'shadow-[0_0_10px_#7f1d1d]' : rightBorderShadow} opacity-40 group-hover/item:opacity-100 transition-opacity`}></div>

            <div className={`flex gap-2 items-center relative z-10 ${isCollapsed ? 'flex-col gap-1' : ''}`}>
              <div className="relative shrink-0">
                <div className={`${isCollapsed ? 'w-5' : 'w-8'} aspect-[2/3] rounded-sm overflow-hidden border transition-all ${
                  isPresent ? 'border-emerald-500/50' : 'border-white/10 bg-neutral-900'
                }`}>
                  {npc.avatar ? (
                    <ResolvedImage src={npc.avatar} alt={npc.name} className="w-full h-full object-cover" loading="lazy" fallback={DEFAULT_AVATAR} />
                  ) : (
                    <img src={DEFAULT_AVATAR} alt={npc.name} className="w-full h-full object-cover opacity-40" loading="lazy" />
                  )}
                </div>
              </div>

              {!isCollapsed && (
                <div className="flex-grow min-w-0 flex flex-col gap-0">
                  <div className="flex justify-between items-center gap-1">
                    <div className="flex items-center gap-1 min-w-0">
                      <h4 className={`text-[11px] font-black uppercase tracking-tight truncate ${isPresent ? 'text-white' : isNearby ? 'text-neutral-200' : 'text-neutral-400'}`}>
                        {npc.name}
                      </h4>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <span className={`text-[9px] font-black ${genderColor}`}>{genderChar}</span>
                        <span className="text-[8px] font-bold text-neutral-500 mono">[{npc.age}]</span>
                      </div>
                    </div>
                    <span className={`mono text-[9px] font-black shrink-0 ${npc.affinity > 700 ? 'text-pink-400' : npc.affinity > 400 ? 'text-emerald-400' : 'text-neutral-600'}`}>
                      {npc.affinity}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-1">
                     <div className="flex flex-col min-w-0 w-full">
                        <div className="flex justify-between items-center gap-1">
                          <span className="text-[7px] mono text-neutral-500 font-black uppercase truncate">
                            {npc.powerLevel || 'Thực thể'}
                          </span>
                          {npc.isDead ? (
                            <span className="text-[6px] px-1 bg-red-600 text-white font-black rounded-sm">ĐÃ CHẾT</span>
                          ) : isPresent ? (
                            <span className="text-[6px] px-1 bg-emerald-500 text-black font-black rounded-sm animate-pulse">CÓ MẶT</span>
                          ) : isNearby ? (
                            <span className="text-[6px] px-1 bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 font-black rounded-sm">Ở GẦN</span>
                          ) : (
                            <span className="text-[6px] px-1 bg-neutral-800 text-neutral-500 font-black rounded-sm">Ở XA</span>
                          )}
                        </div>
                        <div className="mt-0.5 border-t border-white/5 pt-0.5">
                          <div className="text-[7px] mono leading-tight flex flex-wrap gap-x-2">
                            <span className="inline-flex items-center gap-0.5">
                              <span className="opacity-50">📍</span>
                              <span className="text-neutral-400 font-bold uppercase truncate max-w-[60px]">{npc.lastLocation || 'Chưa rõ'}</span>
                            </span>
                            <span className="inline-flex items-center gap-0.5">
                              <span className="opacity-50">⚡</span>
                              <span className="text-emerald-500/80 font-black uppercase truncate max-w-[80px]">{npc.status || 'Đang chờ...'}</span>
                            </span>
                          </div>
                          {npc.mood && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-[7px] opacity-50">🎭</span>
                              <span className="text-[7px] mono text-pink-400/70 font-black italic uppercase tracking-tighter truncate">
                                {npc.mood}
                              </span>
                            </div>
                          )}
                        </div>
                     </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
