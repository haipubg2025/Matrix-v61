
import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="Footer h-10 bg-black border-t border-white/5 flex items-center justify-between px-10 shrink-0">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3">
           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
           <span className="text-[9px] mono text-emerald-500/60 uppercase tracking-[0.2em] font-black">Sync_Status: Online</span>
        </div>
        <span className="text-[9px] mono text-neutral-700 uppercase tracking-widest font-black italic">Matrix_v4_Streaming_Engine</span>
      </div>
    </footer>
  );
};
