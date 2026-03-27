
import React from 'react';
import { Player, NpcCondition } from '../../types';
import { NewIndicator } from '../NewIndicator';

interface McConditionPanelProps {
  player: Player;
  isEditing: boolean;
  onUpdatePlayer: (player: Player) => void;
  onToggleLock?: (field: string) => void;
}

const LockIcon = ({ isLocked, onClick, className = "" }: { isLocked: boolean, onClick?: () => void, className?: string }) => (
  <span 
    onClick={(e) => { e.stopPropagation(); onClick?.(); }}
    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onClick?.(); } }}
    className={`ml-1 transition-all hover:scale-110 active:scale-90 cursor-pointer inline-flex items-center justify-center ${isLocked ? 'text-amber-500' : 'text-neutral-700 hover:text-neutral-500'} ${className}`}
    title={isLocked ? "Đã khóa - AI không thể thay đổi" : "Chưa khóa - AI có thể thay đổi"}
    role="button"
    tabIndex={0}
  >
    {isLocked ? (
      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
    )}
  </span>
);

export const McConditionPanel: React.FC<McConditionPanelProps> = ({ 
  player, isEditing, onUpdatePlayer, onToggleLock 
}) => {
  const conditions = player.conditions || [];

  const handleConditionChange = (idx: number, field: keyof NpcCondition, value: string) => {
    const newConditions = [...conditions];
    newConditions[idx] = { ...newConditions[idx], [field]: value };
    onUpdatePlayer({ ...player, conditions: newConditions });
  };

  const addCondition = () => {
    const newConditions: NpcCondition[] = [...conditions, { name: 'Trạng thái mới', type: 'temporary' as const, description: 'Mô tả...' }];
    onUpdatePlayer({ ...player, conditions: newConditions });
  };

  const removeCondition = (idx: number) => {
    onUpdatePlayer({ ...player, conditions: conditions.filter((_, i) => i !== idx) });
  };

  return (
    <div className="flex flex-col bg-white/[0.03] p-1.5 rounded-sm border border-white/5 mono">
      <div className="flex justify-between items-center mb-1 px-0.5">
        <div className="flex items-center gap-1">
          <span className="text-[7px] text-emerald-600 font-black uppercase tracking-widest">Trạng thái & Hiệu ứng</span>
          <LockIcon isLocked={player.lockedFields?.includes('conditions') || false} onClick={() => onToggleLock?.('conditions')} />
          {player.newFields?.includes('conditions') && <NewIndicator />}
        </div>
        {isEditing && (
          <button 
            onClick={addCondition}
            className="text-[8px] font-black text-emerald-500 hover:text-emerald-400 transition-colors uppercase"
          >
            [+] Thêm
          </button>
        )}
      </div>

      <div className="space-y-1 mt-1">
        {conditions.length > 0 ? (
          conditions.map((c, i) => (
            <div 
              key={i} 
              className={`p-2 rounded-sm border relative group ${
                c.type === 'permanent' 
                  ? 'bg-emerald-500/5 border-emerald-500/20' 
                  : 'bg-rose-500/5 border-rose-500/20 animate-pulse'
              }`}
            >
              {isEditing && (
                <button 
                  onClick={() => removeCondition(i)}
                  className="absolute top-1 right-1 text-rose-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >
                  ✕
                </button>
              )}
              
              <div className="flex justify-between items-center mb-0.5">
                {isEditing ? (
                  <div className="flex items-center gap-1 w-full mr-4">
                    <input 
                      value={c.name} 
                      onChange={(e) => handleConditionChange(i, 'name', e.target.value)}
                      className={`bg-transparent text-[9px] font-black uppercase outline-none border-b border-white/10 flex-grow ${
                        c.type === 'permanent' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    />
                    <select 
                      value={c.type} 
                      onChange={(e) => handleConditionChange(i, 'type', e.target.value as any)}
                      className="bg-black text-[7px] px-1 rounded-sm text-neutral-500 font-black outline-none border border-white/5"
                    >
                      <option value="temporary">TẠM THỜI</option>
                      <option value="permanent">VĨNH VIỄN</option>
                    </select>
                  </div>
                ) : (
                  <>
                    <span className={`text-[9px] font-black uppercase ${
                      c.type === 'permanent' ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {c.name || 'Không tên'}
                    </span>
                    <span className="text-[6px] px-1 bg-black/40 rounded-sm text-neutral-500 font-black uppercase">
                      {c.type === 'permanent' ? 'VĨNH VIỄN' : 'TẠM THỜI'}
                    </span>
                  </>
                )}
              </div>

              {isEditing ? (
                <textarea 
                  value={c.description} 
                  onChange={(e) => handleConditionChange(i, 'description', e.target.value)}
                  className="w-full bg-transparent text-[10px] text-neutral-400 font-bold leading-tight italic outline-none resize-none"
                  rows={1}
                />
              ) : (
                <p className="text-[10px] text-neutral-400 font-bold leading-tight italic">
                  "{c.description || '??'}"
                </p>
              )}
            </div>
          ))
        ) : (
          !isEditing && (
            <div className="text-[8px] text-neutral-800 font-black text-center py-2 uppercase border border-dashed border-white/5 rounded-sm">
              Trạng thái bình thường
            </div>
          )
        )}
      </div>
    </div>
  );
};
