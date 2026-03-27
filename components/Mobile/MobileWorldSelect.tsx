import React from 'react';
import { GameArchetype } from '../../types';

interface Props {
  archetypes: GameArchetype[];
  onSelect: (world: GameArchetype) => void;
  onBack: () => void;
}

export const MobileWorldSelect: React.FC<Props> = ({ archetypes, onSelect, onBack }) => {
  return (
    <div className="flex-grow flex flex-col p-1 pb-8 overflow-y-auto custom-scrollbar bg-[#020202]">
      <div className="mb-8 mt-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
            <h2 className="text-base font-black text-white uppercase tracking-tighter italic">Chọn Thế Giới</h2>
          </div>
          <button onClick={onBack} className="p-2 bg-white/5 border border-white/10 rounded-xl text-neutral-400 text-xs font-black uppercase tracking-widest active:scale-90 transition-all">
            ←
          </button>
        </div>
        <p className="text-[10px] mono text-neutral-500 uppercase font-bold tracking-widest">Lựa chọn ma trận để khởi tạo thực tại</p>
      </div>

      <div className="grid grid-cols-1 gap-1">
        {archetypes.map((world) => (
          <button
            key={world.genre}
            onClick={() => onSelect(world)}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/40 active:scale-[0.98] transition-all shadow-xl"
          >
            <div className="p-1 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-emerald-500/20 transition-all duration-500"></div>
              
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-0.5 bg-emerald-500 text-black text-[8px] mono font-black uppercase rounded-sm">
                  {world.genre}
                </span>
              </div>
              <h3 className="text-sm font-black text-white uppercase italic tracking-tight mb-2">{world.title}</h3>
              <p className="text-[10px] text-neutral-400 leading-relaxed line-clamp-3 italic mb-4">
                {world.description}
              </p>
              
              <div className="flex flex-wrap gap-1.5 mb-4">
                {world.features.slice(0, 3).map((f, i) => (
                  <span key={i} className="text-[7px] mono font-black uppercase tracking-widest text-neutral-500 px-1.5 py-0.5 bg-white/5 rounded-md">
                    {f}
                  </span>
                ))}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <span className="text-[8px] mono text-neutral-600 uppercase font-black tracking-widest">{world.subScenarios.length} Bối cảnh</span>
                <span className="text-[9px] mono text-emerald-500 font-black uppercase tracking-widest">Khởi tạo ❯</span>
              </div>
            </div>
          </button>
        ))}
      </div>
      
      <button 
        onClick={onBack}
        className="mt-8 p-1 border border-white/10 bg-white/5 rounded-2xl text-neutral-400 mono text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
      >
        ← Quay Lại
      </button>
    </div>
  );
};
