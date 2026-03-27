import React from 'react';
import { SubScenario, GameArchetype } from '../../types';

interface Props {
  world: GameArchetype;
  onSelect: (context: SubScenario) => void;
  onBack: () => void;
  onCustom?: () => void;
  onMcSetup?: () => void;
}

export const MobileContextSelect: React.FC<Props> = ({ world, onSelect, onBack, onCustom, onMcSetup }) => {
  return (
    <div className="flex-grow flex flex-col p-1 pb-8 overflow-y-auto custom-scrollbar bg-[#020202]">
      <div className="mb-8 mt-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
            <h2 className="text-base font-black text-white uppercase tracking-tighter italic">Chọn Bối Cảnh</h2>
          </div>
          <div className="flex items-center gap-2">
            {onMcSetup && (
              <button 
                onClick={onMcSetup}
                className="p-2 bg-blue-500/10 border border-dashed border-blue-500/40 rounded-xl text-blue-500 text-[10px] font-black uppercase tracking-widest active:scale-90 transition-all flex items-center gap-2"
              >
                <span>👤</span>
              </button>
            )}
            {onCustom && (
              <button 
                onClick={onCustom}
                className="p-2 bg-emerald-500/10 border border-dashed border-emerald-500/40 rounded-xl text-emerald-500 text-[10px] font-black uppercase tracking-widest active:scale-90 transition-all flex items-center gap-2"
              >
                <span>✨</span>
              </button>
            )}
            <button onClick={onBack} className="p-2 bg-white/5 border border-white/10 rounded-xl text-neutral-400 text-xs font-black uppercase tracking-widest active:scale-90 transition-all">
              ←
            </button>
          </div>
        </div>
        <p className="text-[10px] mono text-neutral-500 uppercase font-bold tracking-widest">{world.genre} // Xác định tọa độ thời không</p>
        <p className="text-[8px] text-neutral-600 font-bold uppercase tracking-widest mt-1 italic">Bỏ qua củng được, AI dùng mặc định</p>
      </div>

      <div className="grid grid-cols-1 gap-1">
        {world.subScenarios.map((context) => (
          <button
            key={context.id}
            onClick={() => onSelect(context)}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/40 active:scale-[0.98] transition-all shadow-xl p-1 text-left"
          >
            <div className="flex items-start gap-1">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-xl font-black text-blue-500 shrink-0 mono">
                {context.id.charAt(0).toUpperCase()}
              </div>
              <div className="flex-grow min-w-0">
                <h3 className="text-xs font-black text-white uppercase italic tracking-tight mb-1">{context.title}</h3>
                <p className="text-[10px] text-neutral-400 leading-relaxed line-clamp-2 italic">
                  {context.description}
                </p>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
              <span className="text-[8px] mono text-neutral-600 uppercase font-black tracking-widest">Kịch bản: {context.scenarios.length}</span>
              <span className="text-[9px] mono text-blue-400 font-black uppercase tracking-widest">Lựa chọn ❯</span>
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
