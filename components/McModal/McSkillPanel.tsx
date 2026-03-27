
import React from 'react';
import { Skill, Player } from '../../types';
import { InspectType } from './McInspector';

interface McSkillPanelProps {
  skills: Skill[];
  skillLabel: string;
  onInspect: (data: { name: string; type: InspectType; description?: string }) => void;
  isEditing?: boolean;
  onUpdatePlayer?: (updates: Partial<Player>) => void;
  isLocked?: boolean;
  onToggleLock?: (field: string) => void;
  player?: Player;
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

export const McSkillPanel: React.FC<McSkillPanelProps> = ({ 
  skills, 
  skillLabel, 
  onInspect, 
  isEditing, 
  onUpdatePlayer,
  isLocked,
  onToggleLock,
  player
}) => {
  const handleSkillsChange = (text: string) => {
    if (onUpdatePlayer) {
      const lines = text.split('\n').filter(s => s.trim());
      const newSkills = lines.map(line => {
        const [name, ...descParts] = line.split('|');
        return {
          name: name.trim(),
          description: descParts.join('|').trim() || "Kỹ năng thần kinh/vật lý đã được mã hóa vào bản thể. Cho phép chủ thể can thiệp vào dòng chảy thực tại theo các quy luật đặc thù của thế giới hiện hành."
        };
      });
      onUpdatePlayer({ skills: newSkills });
    }
  };

  const handleAddSkill = () => {
    if (onUpdatePlayer) {
      onUpdatePlayer({ skills: [...(skills || []), { name: 'KỸ NĂNG MỚI', description: '' }] });
    }
  };

  const handleUpdateSkill = (index: number, updates: Partial<Skill>) => {
    if (onUpdatePlayer) {
      const newSkills = [...(skills || [])];
      newSkills[index] = { ...newSkills[index], ...updates };
      onUpdatePlayer({ skills: newSkills });
    }
  };

  const handleRemoveSkill = (index: number) => {
    if (onUpdatePlayer) {
      const newSkills = (skills || []).filter((_, i) => i !== index);
      onUpdatePlayer({ skills: newSkills });
    }
  };

  return (
    <section className="p-3 bg-[#0a0a0a] border border-white/10 rounded-sm space-y-3 h-full shadow-xl mono">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <span className="text-emerald-500 text-[10px] font-black uppercase tracking-widest">❯ {skillLabel}</span>
        {onToggleLock && (
          <LockIcon isLocked={isLocked || false} onClick={() => onToggleLock('skills')} />
        )}
      </div>
      <div className="grid grid-cols-1 gap-1.5 overflow-y-auto max-h-[450px] custom-scrollbar pr-1">
        {isEditing ? (
          <div className="space-y-2">
            {skills && skills.length > 0 ? skills.map((skill, i) => (
              <div key={i} className="bg-black/40 p-2 border border-white/10 rounded-sm space-y-1 relative group">
                <button 
                  onClick={() => handleRemoveSkill(i)}
                  className="absolute top-1 right-1 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >✕</button>
                <input 
                  value={skill?.name || ''}
                  onChange={(e) => handleUpdateSkill(i, { name: e.target.value })}
                  className="w-full bg-transparent text-[11px] font-black text-emerald-500 uppercase outline-none border-b border-white/5"
                  placeholder="Tên kỹ năng"
                />
                <textarea 
                  value={skill?.description || ''}
                  onChange={(e) => handleUpdateSkill(i, { description: e.target.value })}
                  className="w-full bg-transparent text-[10px] text-neutral-400 outline-none resize-none font-mono leading-tight"
                  rows={2}
                  placeholder="Mô tả"
                />
              </div>
            )) : (
              <div className="text-center py-4 text-[9px] text-neutral-700 italic uppercase border border-dashed border-white/5">Trống</div>
            )}
            <button 
              onClick={handleAddSkill}
              className="w-full py-2 bg-emerald-500/10 border border-dashed border-emerald-500/30 rounded-sm text-[9px] font-black text-emerald-500 uppercase hover:bg-emerald-500/20 transition-all"
            >
              + THÊM KỸ NĂNG
            </button>
            <div className="pt-2 border-t border-white/5">
              <span className="text-[7px] text-neutral-600 font-black uppercase block mb-1">Nhập nhanh (Tên | Mô tả):</span>
              <textarea 
                defaultValue={skills && skills.length > 0 ? skills.map(s => `${s?.name || 'Vô danh'} | ${s?.description || ''}`).join('\n') : ''}
                onBlur={(e) => handleSkillsChange(e.target.value)}
                className="w-full bg-black/40 text-[9px] p-2 border border-white/5 rounded-sm text-neutral-500 outline-none resize-none"
                rows={3}
                placeholder="Tên | Mô tả (Mỗi kỹ năng một dòng)"
              />
            </div>
          </div>
        ) : (
          skills && skills.length > 0 ? skills.map((skill, i) => (
            <div 
              key={i} 
              className="flex items-center justify-between p-2.5 bg-white/[0.03] border border-white/10 rounded-sm group hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all text-left"
            >
              <div 
                className="flex items-center gap-2 min-w-0 cursor-pointer flex-grow"
                onClick={() => onInspect({ name: skill.name, type: 'skill', description: skill.description })}
              >
                <span className="text-emerald-500 text-[8px] animate-pulse">◈</span>
                <span className="text-[11px] font-black text-neutral-300 uppercase truncate">{skill.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <LockIcon 
                  isLocked={player?.lockedFields?.includes(`skill.${skill.name}`) || false} 
                  onClick={() => onToggleLock?.(`skill.${skill.name}`)} 
                />
                <span 
                  onClick={() => onInspect({ name: skill.name, type: 'skill', description: skill.description })}
                  className="text-[7px] mono font-black text-emerald-500/30 uppercase shrink-0 group-hover:text-emerald-400 cursor-pointer"
                >
                  INFO
                </span>
              </div>
            </div>
          )) : <div className="text-[9px] text-neutral-700 italic p-6 text-center uppercase font-black">No_Abilities_Detected</div>
        )}
      </div>
    </section>
  );
};
