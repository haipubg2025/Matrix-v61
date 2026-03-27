import React from 'react';
import { GameArchetype } from '../types';

interface GameCardProps {
  archetype: GameArchetype;
  onSelect: (id: string) => void;
}

export const GameCard: React.FC<GameCardProps> = ({ archetype, onSelect }) => {
  return (
    <div 
      onClick={() => onSelect(archetype.id)}
      className="group bg-neutral-900 border border-neutral-800 p-8 rounded-[2rem] hover:border-emerald-500 hover:bg-emerald-500/5 transition-all cursor-pointer flex flex-col h-full relative overflow-hidden shadow-2xl"
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-emerald-500/20 transition-all duration-500"></div>
      
      <div className="flex items-center justify-between mb-6">
        <span className="text-[10px] mono uppercase tracking-[0.2em] text-emerald-400 font-black bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-400/20">
          {archetype.genre}
        </span>
      </div>
      
      <h3 className="text-2xl font-black mb-3 group-hover:text-emerald-400 transition-colors uppercase tracking-tighter leading-tight">
        {archetype.title}
      </h3>
      
      <p className="text-neutral-500 text-xs mb-8 flex-grow leading-relaxed font-medium">
        {archetype.description}
      </p>
      
      <div className="flex items-center gap-2 mb-6">
        <div className="px-2 py-1 bg-white/5 rounded border border-white/10">
          <span className="text-[8px] mono font-black text-neutral-400 uppercase tracking-widest">
            {archetype.subScenarios.length} Thân phận khả dụng
          </span>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 pt-4 border-t border-white/5">
        {archetype.features.map((f, i) => (
          <span key={i} className="text-[9px] mono font-black uppercase tracking-widest text-neutral-400 px-2 py-1 bg-neutral-800/50 rounded-lg group-hover:text-emerald-500 transition-colors">
            {f}
          </span>
        ))}
      </div>
      
      <div className="mt-6 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-[10px] mono font-black uppercase text-emerald-500 tracking-widest">Khởi hành ngay</span>
        <span className="text-xl text-emerald-500">→</span>
      </div>
    </div>
  );
};