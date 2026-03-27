
import React from 'react';
import { Quest } from '../../types';
import { InspectType } from './McInspector';

interface McQuestPanelProps {
  quests: Quest[];
  hasSystem: boolean;
  systemName: string;
  onInspect: (data: { name: string; type: InspectType; description?: string; reward?: string; status?: string; questGroup?: string; questKind?: string; progress?: string }) => void;
  playerLevel: number | string;
  isEditing?: boolean;
  onUpdatePlayer?: (player: any) => void;
  player?: any;
  onToggleLock?: (field: string) => void;
}

export const McQuestPanel: React.FC<McQuestPanelProps> = ({ quests, hasSystem, systemName, onInspect, playerLevel, isEditing, onUpdatePlayer, player, onToggleLock }) => {
  // Fail-safe: Đảm bảo quests luôn là mảng
  const safeQuests = Array.isArray(quests) ? quests : [];
  
  const handleQuestsChange = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed) && onUpdatePlayer) {
        // Đảm bảo mỗi nhiệm vụ có ID duy nhất
        const withIds = parsed.map((q: any) => ({
          ...q,
          id: q.id || `q-${Math.random().toString(36).substr(2, 9)}`
        }));
        onUpdatePlayer({ quests: withIds });
      }
    } catch (e) {
      // Invalid JSON, ignore or show error
    }
  };

  const isQuestsLocked = player?.lockedFields?.includes('quests');
  const isQuestEnabled = player?.isQuestEnabled !== false;
  const isSystemEnabled = !!player?.systemName;
  const isSystemLocked = player?.lockedFields?.includes('hasSystem');
  const isSystemNameLocked = player?.lockedFields?.includes('systemName');
  const isSystemDescriptionLocked = player?.lockedFields?.includes('systemDescription');

  const toggleQuestSystem = () => {
    onUpdatePlayer?.({ isQuestEnabled: !isQuestEnabled });
  };

  const toggleSystemCore = () => {
    if (isSystemEnabled) {
      onUpdatePlayer?.({ systemName: "", systemDescription: "" });
    } else {
      onUpdatePlayer?.({ 
        systemName: "Hệ Thống Vạn Giới", 
        systemDescription: "Giao diện trung gian giữa não bộ chủ thể và Ma Trận Lượng Tử. Hệ thống cho phép truy cập các chức năng 'Cheat' thực tại, giao nhiệm vụ định mệnh và cung cấp phần thưởng vượt xa quy luật vật lý thông thường." 
      });
    }
  };

  const LockIcon = ({ isLocked, onClick, className = "" }: { isLocked: boolean, onClick?: () => void, className?: string }) => (
    <span 
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onClick?.(); } }}
      className={`ml-1 p-1.5 transition-all hover:scale-110 active:scale-90 cursor-pointer inline-flex items-center justify-center ${isLocked ? 'text-amber-500' : 'text-neutral-700 hover:text-neutral-500'} ${className}`}
      title={isLocked ? "Đã khóa - AI không thể thay đổi" : "Chưa khóa - AI có thể thay đổi"}
      role="button"
      tabIndex={0}
    >
      {isLocked ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
      )}
    </span>
  );

  const mainActive = safeQuests.filter(q => q && q.group === 'main' && q.status === 'active');
  const sideActive = safeQuests.filter(q => q && q.group === 'side' && q.status === 'active');
  const finished = safeQuests.filter(q => q && q.status !== 'active');

  const renderQuestCard = (q: Quest) => (
    <div key={q.id || `temp-${Math.random()}`} className="relative group/card">
      <button 
        onClick={() => onInspect({ 
          name: q.title, 
          type: 'quest', 
          description: q.description, 
          reward: q.reward, 
          status: q.status,
          questGroup: q.group,
          questKind: q.kind,
          progress: q.kind === 'chain' ? `${q.currentStep}/${q.totalSteps}` : undefined
        })}
        className={`w-full text-left p-2.5 border rounded-sm group transition-all relative overflow-hidden ${q.group === 'main' ? 'bg-yellow-500/5 border-yellow-500/30 hover:border-yellow-500' : 'bg-blue-500/5 border-blue-500/30 hover:border-blue-500'}`}
      >
        <div className="flex justify-between items-start mb-1">
          <div className="flex items-center gap-1.5">
            <span className={`text-[8px] font-black uppercase tracking-tighter ${q.group === 'main' ? 'text-yellow-500' : 'text-blue-400'}`}>
              [{q.kind === 'chain' ? 'CHUỖI' : 'ĐƠN'}]
            </span>
            {q.kind === 'chain' && (
              <span className="text-[7px] mono text-white/40 font-bold bg-white/5 px-1 rounded-sm">
                {q.currentStep}/{q.totalSteps}
              </span>
            )}
          </div>
          <span className="text-[7px] text-neutral-600 font-black uppercase group-hover:text-white transition-colors">SCAN ❯</span>
        </div>
        <h4 className="text-xs font-black text-white uppercase tracking-tight mb-1 truncate">{q.title}</h4>
        <p className="text-[10px] text-neutral-400 leading-tight italic line-clamp-2 mb-2">{q.description}</p>
        
        {q.reward && (
          <div className="flex items-center gap-1 mt-1 pt-1 border-t border-white/5">
            <span className="text-[8px] text-emerald-500 font-black uppercase">Phần thưởng:</span>
            <span className="text-[9px] text-emerald-400 font-bold truncate italic">{q.reward}</span>
          </div>
        )}

        {q.kind === 'chain' && (
          <div className="mt-2 h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${q.group === 'main' ? 'bg-yellow-500' : 'bg-blue-500'}`}
              style={{ width: `${((q.currentStep || 1) / (q.totalSteps || 1)) * 100}%` }}
            ></div>
          </div>
        )}
      </button>
      {isEditing && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            if (!q.id) return;
            const newQuests = safeQuests.filter(sq => sq.id !== q.id);
            onUpdatePlayer?.({ quests: newQuests });
          }}
          className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] font-black shadow-lg opacity-100 transition-opacity z-30 hover:bg-rose-600 active:scale-90"
          title="Xóa nhiệm vụ"
        >
          ✕
        </button>
      )}
    </div>
  );

  return (
    <section className="p-3 bg-[#0a0a0a] border border-white/10 rounded-sm space-y-3 h-full shadow-xl flex flex-col min-h-[600px] mono">
      <div className="flex-grow overflow-y-auto custom-scrollbar space-y-6 pr-1">
         {isEditing && (
           <div className="space-y-4 mb-6">
             {/* System & Quest Configuration */}
             <div className="p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-sm space-y-4">
               <div className="flex items-center justify-between border-b border-yellow-500/20 pb-2">
                 <span className="text-[10px] text-yellow-500 font-black uppercase tracking-widest">Cấu hình Hệ Thống & Nhiệm Vụ</span>
               </div>

               <div className="grid grid-cols-2 gap-2">
                 <div className="space-y-1">
                   <span className="text-[8px] text-neutral-500 uppercase font-bold">Hệ Thống Matrix:</span>
                   <button 
                     onClick={toggleSystemCore}
                     className={`w-full px-2 py-1.5 rounded-sm text-[8px] font-black uppercase transition-all ${isSystemEnabled ? 'bg-yellow-500 text-black' : 'bg-white/5 text-neutral-500 border border-white/10'}`}
                   >
                     {isSystemEnabled ? 'ĐANG BẬT' : 'ĐANG TẮT'}
                   </button>
                 </div>
                 <div className="space-y-1">
                   <span className="text-[8px] text-neutral-500 uppercase font-bold">Hệ Thống Nhiệm Vụ:</span>
                   <button 
                     onClick={toggleQuestSystem}
                     className={`w-full px-2 py-1.5 rounded-sm text-[8px] font-black uppercase transition-all ${isQuestEnabled ? 'bg-emerald-500 text-black' : 'bg-white/5 text-neutral-500 border border-white/10'}`}
                   >
                     {isQuestEnabled ? 'ĐANG BẬT' : 'ĐANG TẮT'}
                   </button>
                 </div>
               </div>
               
               {isSystemEnabled && (
                 <div className="space-y-3 pt-2 border-t border-yellow-500/10">
                   <div className="space-y-1.5">
                     <div className="flex items-center justify-between">
                       <span className="text-[8px] text-neutral-600 font-black uppercase">Tên Hệ Thống:</span>
                       <LockIcon isLocked={isSystemNameLocked} onClick={() => onToggleLock?.('systemName')} />
                     </div>
                     <input 
                       value={player?.systemName || ""}
                       onChange={(e) => onUpdatePlayer?.({ systemName: e.target.value })}
                       placeholder="Nhập tên hệ thống (Vd: Hệ Thống Matrix...)"
                       className="w-full bg-black/40 border border-white/10 rounded-sm px-2 py-1.5 text-[11px] text-white font-black italic outline-none focus:border-yellow-500 transition-all"
                     />
                   </div>

                   <div className="space-y-1.5">
                     <div className="flex items-center justify-between">
                       <span className="text-[8px] text-neutral-600 font-black uppercase">Dữ liệu phân tích (Mô tả):</span>
                       <LockIcon isLocked={isSystemDescriptionLocked} onClick={() => onToggleLock?.('systemDescription')} />
                     </div>
                     <textarea 
                       value={player?.systemDescription || ""}
                       onChange={(e) => onUpdatePlayer?.({ systemDescription: e.target.value })}
                       placeholder={`Giao diện trung gian giữa não bộ chủ thể và Ma Trận Lượng Tử. ${systemName} cho phép truy cập các chức năng 'Cheat' thực tại, giao nhiệm vụ định mệnh và cung cấp phần thưởng vượt xa quy luật vật lý thông thường.`}
                       className="w-full bg-black/40 border border-white/10 rounded-sm px-2 py-1.5 text-[10px] text-neutral-300 italic outline-none focus:border-yellow-500 transition-all min-h-[60px] resize-none"
                     />
                   </div>
                 </div>
               )}
             </div>

             <div className="space-y-2">
               <div className="flex items-center justify-between">
                 <span className="text-[10px] text-emerald-500 font-black uppercase">Chỉnh sửa Nhiệm vụ (JSON):</span>
                 <LockIcon isLocked={isQuestsLocked} onClick={() => onToggleLock?.('quests')} />
               </div>
               <textarea 
                 defaultValue={JSON.stringify(safeQuests, null, 2)}
                 onBlur={(e) => handleQuestsChange(e.target.value)}
                 className="w-full bg-black/60 text-[10px] p-2.5 border border-white/10 rounded-sm text-neutral-300 outline-none resize-none font-mono"
                 rows={15}
               />
               <p className="text-[8px] text-neutral-600 italic">* Nhấn ra ngoài để lưu thay đổi JSON.</p>
             </div>
           </div>
         )}

         {!isQuestEnabled && !isEditing && (
           <div className="py-20 text-center border border-dashed border-white/10 rounded-sm bg-white/[0.02]">
             <div className="mb-4 flex justify-center">
               <div className="w-12 h-12 rounded-full border-2 border-neutral-800 flex items-center justify-center">
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-700"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m14.5 9-5 5"/><path d="m9.5 9 5 5"/></svg>
               </div>
             </div>
             <h3 className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.3em]">Hệ Thống Nhiệm Vụ: OFFLINE</h3>
             <p className="text-[8px] text-neutral-700 mt-2 italic px-10">Không có liên kết định mệnh nào được thiết lập trong thực tại này.</p>
           </div>
         )}

         {(isQuestEnabled || isEditing) && (
           <>
             {isSystemEnabled && !isEditing && (
                  <div 
                    onClick={() => onInspect({
                      name: systemName,
                      type: 'system',
                      description: player?.systemDescription || `Giao diện trung gian giữa não bộ chủ thể và Ma Trận Lượng Tử. ${systemName} cho phép truy cập các chức năng 'Cheat' thực tại, giao nhiệm vụ định mệnh và cung cấp phần thưởng vượt xa quy luật vật lý thông thường.`
                    })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onInspect({
                          name: systemName,
                          type: 'system',
                          description: player?.systemDescription || `Giao diện trung gian giữa não bộ chủ thể và Ma Trận Lượng Tử. ${systemName} cho phép truy cập các chức năng 'Cheat' thực tại, giao nhiệm vụ định mệnh và cung cấp phần thưởng vượt xa quy luật vật lý thông thường.`
                        });
                      }
                    }}
                    className="w-full text-left flex flex-col bg-yellow-500/10 p-2.5 rounded-sm border border-yellow-500/40 group hover:border-yellow-500 transition-all relative overflow-hidden cursor-pointer"
                    role="button"
                    tabIndex={0}
                  >
                    <div className="flex items-center justify-between mb-1 relative z-10">
                      <div className="flex items-center gap-1">
                        <span className="text-[8px] text-yellow-500 font-black uppercase tracking-[0.2em] italic">💎 MATRIX_CORE_LINK:</span>
                        <LockIcon isLocked={isSystemLocked} onClick={() => onToggleLock?.('hasSystem')} />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[7px] text-yellow-500 font-bold uppercase animate-pulse">Connected</span>
                        <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full shadow-[0_0_5px_currentColor]"></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 relative z-10">
                      <span className="text-[13px] font-black text-white uppercase tracking-tight italic truncate">{systemName}</span>
                      <LockIcon isLocked={isSystemNameLocked} onClick={() => onToggleLock?.('systemName')} />
                    </div>
                    <div className="absolute inset-0 bg-yellow-500/[0.03] -translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
                    <div className="mt-1.5 pt-1.5 border-t border-yellow-500/20 relative z-10">
                       <span className="text-[7px] text-neutral-500 font-black uppercase block mb-1">Dữ liệu phân tích:</span>
                       <p className="text-[9px] text-neutral-400 italic line-clamp-2">
                         {player?.systemDescription || `Giao diện trung gian giữa não bộ chủ thể và Ma Trận Lượng Tử. ${systemName} cho phép truy cập các chức năng 'Cheat' thực tại...`}
                       </p>
                    </div>
                  </div>
                )}

             <div className="space-y-2.5">
                <div className="flex items-center justify-between border-l-2 border-yellow-500 pl-2 py-0.5 bg-yellow-500/5">
                   <span className="text-[9px] font-black text-yellow-500 uppercase tracking-widest">Mục tiêu Vận mệnh (Chính)</span>
                   {(!isSystemEnabled || isEditing) && <LockIcon isLocked={isQuestsLocked} onClick={() => onToggleLock?.('quests')} />}
                </div>
                <div className="space-y-2">
                  {mainActive.length > 0 ? mainActive.map(renderQuestCard) : (
                    <div className="py-6 text-center border border-dashed border-white/5 rounded-sm opacity-20">
                       <p className="text-[7px] font-black uppercase italic tracking-widest">No_Destiny_Task</p>
                    </div>
                  )}
                </div>
             </div>

             <div className="space-y-2.5">
                <div className="flex items-center gap-2 border-l-2 border-blue-400 pl-2 py-0.5 bg-blue-500/5">
                   <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Duyên kiếp bên lề (Phụ)</span>
                </div>
                <div className="space-y-2">
                  {sideActive.length > 0 ? sideActive.map(renderQuestCard) : (
                    <div className="py-6 text-center border border-dashed border-white/5 rounded-sm opacity-20">
                       <p className="text-[7px] font-black uppercase italic tracking-widest">No_Side_Task</p>
                    </div>
                  )}
                </div>
             </div>

             {finished.length > 0 && (
               <div className="pt-4 border-t border-white/5 space-y-2">
                 <span className="text-[7px] font-black text-neutral-700 uppercase tracking-widest block px-1 italic">Vùng nhớ Lịch sử (Finished)</span>
                 <div className="space-y-1.5 opacity-40 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-500">
                   {finished.map(q => (
                     <div key={q.id || `finished-${Math.random()}`} className="relative group/card">
                       <button 
                         onClick={() => onInspect({ 
                           name: q.title, 
                           type: 'quest', 
                           description: q.description, 
                           reward: q.reward, 
                           status: q.status,
                           questGroup: q.group,
                           questKind: q.kind
                         })}
                         className="w-full text-left p-2 bg-white/[0.02] border border-white/5 rounded-sm flex justify-between items-center"
                       >
                         <span className="text-[9px] font-bold text-neutral-500 line-through truncate flex-grow mr-2">{q.title}</span>
                         <span className={`text-[7px] font-black uppercase shrink-0 ${q.status === 'completed' ? 'text-emerald-500' : 'text-red-500'}`}>{q.status}</span>
                       </button>
                       {isEditing && (
                         <button 
                           onClick={(e) => {
                             e.stopPropagation();
                             if (!q.id) return;
                             const newQuests = safeQuests.filter(sq => sq.id !== q.id);
                             onUpdatePlayer?.({ quests: newQuests });
                           }}
                           className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full flex items-center justify-center text-[8px] font-black shadow-lg z-30 hover:bg-rose-600 active:scale-90"
                         >
                           ✕
                         </button>
                       )}
                     </div>
                   ))}
                 </div>
               </div>
             )}
           </>
         )}
      </div>
    </section>
  );
};
