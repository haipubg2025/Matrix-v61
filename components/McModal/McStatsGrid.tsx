
import React from 'react';
import { Player, getGenreMeta, GameGenre } from '../../types';
import { NewIndicator } from '../NewIndicator';
import { InspectType } from './McInspector';

interface StatsGridProps {
  player: Player;
  genre?: GameGenre;
  isEditing: boolean;
  onUpdatePlayer: (player: Player) => void;
  onToggleLock?: (field: string) => void;
  onInspect?: (item: any) => void;
}

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

export const McStatsGrid: React.FC<StatsGridProps> = ({ player, genre, isEditing, onUpdatePlayer, onToggleLock, onInspect }) => {
  const meta = getGenreMeta(genre);
  const statsDef = meta.statsDef || [];

  const handleStatChange = (key: string, val: number) => {
    onUpdatePlayer({
      ...player,
      stats: {
        ...player.stats,
        [key]: val
      }
    });
  };
  
  const gridColsClass = 
    statsDef.length <= 3 ? 'lg:grid-cols-3' :
    statsDef.length === 4 ? 'lg:grid-cols-4' :
    'lg:grid-cols-4 xl:grid-cols-7';

  return (
    <div className="space-y-2">
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${gridColsClass} gap-1 mono`}>
        {statsDef.map((s, i) => {
          const value = (player.stats as any)[s.key] ?? 10;
          
          return (
            <div key={i} className={`${s.bg} border border-white/5 p-1.5 rounded-sm group hover:border-emerald-500/30 transition-all relative overflow-hidden`}>
              <div className="absolute top-0 right-0 p-0.5 opacity-10 text-[8px] font-black select-none uppercase tracking-widest z-0">
                {s.key.substring(0, 3).toUpperCase()}
              </div>
              
              <div className="relative z-10">
                <span className="block text-[7px] font-black text-neutral-500 uppercase mb-0.5 tracking-widest flex items-center gap-1">
                   {s.icon} 
                   {isEditing ? (
                     <input 
                       value={player.statLabels?.[s.key] || s.label}
                       onChange={(e) => {
                         onUpdatePlayer({
                           ...player,
                           statLabels: {
                             ...(player.statLabels || {}),
                             [s.key]: e.target.value
                           }
                         });
                       }}
                       className="bg-transparent border-b border-white/10 outline-none focus:border-emerald-500/50 w-20"
                     />
                   ) : (
                     player.statLabels?.[s.key] || s.label
                   )}
                   <LockIcon isLocked={player.lockedFields?.includes(`stat_${s.key}`) || false} onClick={() => onToggleLock?.(`stat_${s.key}`)} />
                   {player.newFields?.includes(`stat_${s.key}`) && <NewIndicator />}
                </span>
                <div className="flex items-baseline gap-1.5">
                  {isEditing ? (
                    <input 
                      type="number"
                      value={value}
                      onChange={(e) => handleStatChange(s.key, parseInt(e.target.value) || 0)}
                      className={`w-20 bg-transparent text-2xl font-black ${s.color} tabular-nums outline-none`}
                    />
                  ) : (
                    <span className={`text-2xl font-black ${s.color} tabular-nums group-hover:scale-105 transition-transform origin-left leading-none`}>
                      {value}
                    </span>
                  )}
                  <div className="h-0.5 flex-grow bg-white/5 rounded-full overflow-hidden self-center mb-1">
                     <div 
                      className={`h-full ${s.color.replace('text-', 'bg-')} rounded-full opacity-40 shadow-[0_0_10px_currentColor]`} 
                      style={{ width: `${Math.min(100, (value/150)*100)}%` }}
                     ></div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom Fields (Widgets) */}
      {player.customFields && player.customFields.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1 mono">
          {player.customFields.map((field, i) => (
            <div key={`custom-${i}`} className="bg-white/[0.03] border border-white/5 p-1.5 rounded-sm group hover:border-white/20 transition-all relative overflow-hidden">
               {isEditing && (
                 <button 
                   onClick={() => {
                     const newFields = player.customFields?.filter((_, idx) => idx !== i);
                     onUpdatePlayer({ ...player, customFields: newFields });
                   }}
                   className="absolute top-0 right-0 p-1 text-rose-500 hover:text-rose-400 z-20 opacity-0 group-hover:opacity-100 transition-opacity"
                 >
                   ✕
                 </button>
               )}
               <div className="relative z-10">
                <div className="flex items-center gap-1 mb-0.5">
                  {isEditing ? (
                    <div className="flex items-center w-full">
                      <input 
                        value={field.label}
                        onChange={(e) => {
                          const newFields = [...(player.customFields || [])];
                          newFields[i] = { ...field, label: e.target.value };
                          onUpdatePlayer({ ...player, customFields: newFields });
                        }}
                        className="bg-transparent text-[7px] font-black text-neutral-500 uppercase tracking-widest outline-none border-b border-white/5 w-full"
                        placeholder="Tên Widget"
                      />
                      <LockIcon isLocked={player.lockedFields?.includes(`customField.${field.label}.label`) || false} onClick={() => onToggleLock?.(`customField.${field.label}.label`)} />
                    </div>
                  ) : (
                    <span className="block text-[7px] font-black text-neutral-500 uppercase tracking-widest flex items-center gap-1">
                       {field.icon || '💠'} {field.label}
                       <LockIcon isLocked={player.lockedFields?.includes(`customField.${field.label}.label`) || false} onClick={() => onToggleLock?.(`customField.${field.label}.label`)} />
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1.5">
                  {isEditing ? (
                    <div className="flex items-center w-full">
                      <input 
                        value={field.value}
                        onChange={(e) => {
                          const newFields = [...(player.customFields || [])];
                          newFields[i] = { ...field, value: e.target.value };
                          onUpdatePlayer({ ...player, customFields: newFields });
                        }}
                        className="w-full bg-transparent text-lg font-black text-white tabular-nums outline-none border-b border-white/10"
                        placeholder="Giá trị"
                      />
                      <LockIcon isLocked={player.lockedFields?.includes(`customField.${field.label}.value`) || false} onClick={() => onToggleLock?.(`customField.${field.label}.value`)} />
                    </div>
                  ) : (
                    <div 
                      className="flex flex-col w-full cursor-pointer"
                      onClick={() => onInspect?.({
                        name: field.label,
                        type: 'customField',
                        description: `Giá trị: ${field.value}`
                      })}
                    >
                      <div className="flex items-center">
                        <span className="text-lg font-black text-white tabular-nums group-hover:text-emerald-400 transition-colors leading-none">
                          {field.value}
                        </span>
                        <LockIcon isLocked={player.lockedFields?.includes(`customField.${field.label}.value`) || false} onClick={() => onToggleLock?.(`customField.${field.label}.value`)} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isEditing && (
        <div className="flex justify-center pt-2">
          <button 
            onClick={() => {
              const newFields = [...(player.customFields || []), { label: 'MỚI', value: '?', icon: '💠' }];
              onUpdatePlayer({ ...player, customFields: newFields });
            }}
            className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-sm text-[9px] font-black text-emerald-500 uppercase tracking-widest hover:bg-emerald-500/20 transition-all"
          >
            + THÊM CUSTOM WIDGET
          </button>
        </div>
      )}
    </div>
  );
};
