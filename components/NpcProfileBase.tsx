
import React from 'react';
import { Lock, Unlock, Users } from 'lucide-react';
import { Relationship, getGenreMeta, GameGenre, Player, IdentityType, NpcNetwork } from '../types';

export const PLACEHOLDERS = ['??', '[Bị khóa]', '[Chưa tiết lộ]', '[Ẩn]', '[Cần khám phá]', '[Yêu cầu cấp độ X]', 'N/A', 'Chưa rõ', 'Unknown'];

export const isPlaceholder = (data: any): boolean => {
  if (typeof data !== 'string') return false;
  const trimmed = data.trim();
  return PLACEHOLDERS.includes(trimmed) || trimmed.includes('??') || (trimmed.startsWith('[') && trimmed.endsWith(']'));
};

export const renderSafeText = (data: any, fallback: string = '---'): string => {
  if (data === undefined || data === null || data === '') return fallback;
  if (isPlaceholder(data)) return data; // Keep placeholder as is for special rendering
  if (typeof data === 'string') return data;
  if (typeof data === 'number') return String(data);
  if (Array.isArray(data)) return data.length > 0 ? data.map(i => renderSafeText(i)).join(', ') : fallback;
  if (typeof data === 'object') return data.text || data.description || data.value || data.name || JSON.stringify(data);
  return String(data);
};

export const toSentenceCase = (text: any, fallback: string = ''): string => {
  const str = renderSafeText(text, fallback);
  if (!str || str === fallback) return fallback;
  let sentence = str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  return sentence.replace(/\bmc\b/gi, 'MC');
};

/**
 * Component hiển thị dữ liệu có sự thay đổi (Diff)
 */
export const DiffValue: React.FC<{ 
  fieldKey: string, 
  current: any, 
  lastChanges?: Record<string, {old: any, new: any}>,
  color?: string,
  className?: string
}> = ({ fieldKey, current, lastChanges, color = "text-white", className = "" }) => {
  const change = lastChanges?.[fieldKey];
  const safeCurrent = renderSafeText(current);
  const isLocked = isPlaceholder(safeCurrent);

  if (change && renderSafeText(change.old) !== renderSafeText(change.new)) {
    const isNewLocked = isPlaceholder(change.new);
    return (
      <span className={`flex flex-col items-end animate-in fade-in duration-500 ${className}`}>
        <span className="text-[9px] text-rose-500/50 line-through leading-none decoration-rose-500/40">{renderSafeText(change.old)}</span>
        <span className={`text-xs font-black ${isNewLocked ? 'text-neutral-600 italic' : color} leading-tight flex items-center gap-1`}>
          {isNewLocked && <Lock className="w-2 h-2" />}
          ❯ {renderSafeText(change.new)}
        </span>
      </span>
    );
  }

  return (
    <span className={`text-xs font-bold ${isLocked ? 'text-neutral-600 italic' : color} ${className} flex items-center gap-1`}>
      {isLocked && <Lock className="w-2 h-2 opacity-50" />}
      {safeCurrent}
    </span>
  );
};

export const LockToggle: React.FC<{
  fieldKey: string,
  npc: Relationship,
  onUpdateNpc?: (npc: Relationship) => void
}> = ({ fieldKey, npc, onUpdateNpc }) => {
  if (!onUpdateNpc) return null;
  
  const isLocked = npc.lockedFields?.includes(fieldKey);
  
  const toggleLock = (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentLocked = npc.lockedFields || [];
    const newLocked = isLocked 
      ? currentLocked.filter(f => f !== fieldKey)
      : [...currentLocked, fieldKey];
    
    onUpdateNpc({ ...npc, lockedFields: newLocked });
  };

  return (
    <button 
      onClick={toggleLock}
      className={`ml-1.5 p-1 rounded-sm transition-all ${isLocked ? 'text-amber-500 bg-amber-500/10' : 'text-neutral-700 hover:text-neutral-400 hover:bg-white/5'}`}
      title={isLocked ? "Đã khóa - AI không thể thay đổi" : "Mở khóa - AI có thể cập nhật"}
    >
      {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
    </button>
  );
};

const BioItem = ({ label, field, color = "text-white", isEditing, npc, lastChanges, handleChange, onUpdateNpc }: any) => (
  <div className="group flex justify-between items-start p-2 bg-white/[0.02] border border-white/5 rounded-sm hover:bg-white/[0.05] transition-all">
    <span className="text-[10px] text-neutral-500 font-black uppercase tracking-tighter shrink-0 mt-0.5">{label}</span>
    <div className="flex items-center justify-end flex-grow ml-4 min-w-0">
      {isEditing ? (
        <input 
          value={(npc as any)[field] || ''} 
          onChange={(e) => handleChange(field, e.target.value)}
          className={`bg-transparent text-xs font-black ${color} text-right outline-none border-b border-white/10 focus:border-white/30 w-full`}
        />
      ) : (
        <DiffValue fieldKey={field} current={(npc as any)[field]} lastChanges={lastChanges} color={color} className="text-right" />
      )}
      <LockToggle fieldKey={field} npc={npc} onUpdateNpc={onUpdateNpc} />
    </div>
  </div>
);

export const NpcSidebarBio: React.FC<{ 
  npc: Relationship, 
  themeColor: string, 
  genre?: GameGenre,
  isEditing?: boolean,
  onUpdateNpc?: (npc: Relationship) => void
}> = ({ npc, themeColor, genre, isEditing, onUpdateNpc }) => {
  const meta = getGenreMeta(genre);
  const labels = meta.npcLabels;

  const handleChange = (field: keyof Relationship, value: any) => {
    if (onUpdateNpc) {
      const newLastChanges = { ...(npc.lastChanges || {}) };
      delete newLastChanges[field];
      onUpdateNpc({ ...npc, [field]: value, lastChanges: newLastChanges });
    }
  };

  return (
    <div className="space-y-1.5 mono shrink-0">
      <div className="grid grid-cols-1 gap-1">
        <BioItem label={labels.race} field="race" isEditing={isEditing} npc={npc} lastChanges={npc.lastChanges} handleChange={handleChange} onUpdateNpc={onUpdateNpc} />
      </div>

      <div className="pt-2 border-t border-white/10 grid grid-cols-1 gap-1">
        <BioItem label="Hoạt động" field="status" color="text-cyan-400" isEditing={isEditing} npc={npc} lastChanges={npc.lastChanges} handleChange={handleChange} onUpdateNpc={onUpdateNpc} />
        <BioItem label={labels.power} field="powerLevel" color={`text-${themeColor}-400`} isEditing={isEditing} npc={npc} lastChanges={npc.lastChanges} handleChange={handleChange} onUpdateNpc={onUpdateNpc} />
        <BioItem label={labels.faction} field="faction" isEditing={isEditing} npc={npc} lastChanges={npc.lastChanges} handleChange={handleChange} onUpdateNpc={onUpdateNpc} />
        <BioItem label={labels.alignment} field="alignment" color="text-cyan-400" isEditing={isEditing} npc={npc} lastChanges={npc.lastChanges} handleChange={handleChange} onUpdateNpc={onUpdateNpc} />
        
        {npc.backgroundAttributes?.map((attr, idx) => (
          <div key={idx} className="group flex justify-between items-start p-2 bg-white/[0.02] border border-white/5 rounded-sm hover:bg-white/[0.05] transition-all">
            <span className="text-[10px] text-neutral-500 font-black uppercase tracking-tighter shrink-0 mt-0.5">{attr.label}</span>
            <div className="flex items-center justify-end flex-grow ml-4 min-w-0">
               <DiffValue fieldKey={`bg_attr_${idx}`} current={attr.value} lastChanges={npc.lastChanges} color="text-emerald-400" className="text-right" />
               <LockToggle fieldKey={`backgroundAttributes.${idx}.value`} npc={npc} onUpdateNpc={onUpdateNpc} />
            </div>
          </div>
        ))}
        
        {(npc.identities || []).filter(i => i.isRevealed).map((identity, idx) => (
          <div key={idx} className="p-2 border border-rose-500/30 bg-rose-500/10 rounded-sm mt-1 flex flex-col gap-1 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className={`text-[6px] font-black uppercase px-1 py-0.5 rounded border ${
                  identity.type === IdentityType.FANFIC ? 'bg-purple-500/20 border-purple-500/40 text-purple-400' :
                  identity.type === IdentityType.DESTINY ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' :
                  identity.type === IdentityType.LEGENDARY ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400' :
                  'bg-white/5 border-white/10 text-white/40'
                }`}>
                  {identity.type || IdentityType.NORMAL}
                </span>
                <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest">Thân phận Lộ Diện</span>
              </div>
              <Unlock className="w-2.5 h-2.5 text-rose-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-white uppercase">{identity.name}</span>
              <span className="text-[8px] font-bold text-rose-400 uppercase tracking-tighter">{identity.role}</span>
            </div>
          </div>
        ))}
        <BioItem label="Vị trí cuối" field="lastLocation" isEditing={isEditing} npc={npc} lastChanges={npc.lastChanges} handleChange={handleChange} onUpdateNpc={onUpdateNpc} />
      </div>

      {(npc.systemName || npc.systemDescription || isEditing) && (
        <div className="p-2.5 bg-emerald-500/5 border border-emerald-500/20 rounded-sm space-y-2 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent"></div>
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></span> SYSTEM_CORE
            </span>
            <div className="flex items-center gap-1">
              <LockToggle fieldKey="systemName" npc={npc} onUpdateNpc={onUpdateNpc} />
              <LockToggle fieldKey="systemDescription" npc={npc} onUpdateNpc={onUpdateNpc} />
            </div>
          </div>
          <div className="space-y-1.5">
            {isEditing ? (
              <div className="flex flex-col gap-1.5">
                <input 
                  value={npc.systemName || ''} 
                  onChange={(e) => handleChange('systemName', e.target.value)}
                  className="w-full bg-black/40 border border-emerald-500/10 rounded px-2 py-1 text-[9px] font-black text-emerald-400 uppercase outline-none focus:border-emerald-500/40"
                  placeholder="Tên Hệ Thống"
                />
                <textarea 
                  value={npc.systemDescription || ''} 
                  onChange={(e) => handleChange('systemDescription', e.target.value)}
                  className="w-full bg-black/40 border border-emerald-500/10 rounded px-2 py-1 text-[8px] text-neutral-400 italic leading-relaxed outline-none focus:border-emerald-500/40"
                  rows={2}
                  placeholder="Mô tả Hệ Thống"
                />
              </div>
            ) : (
              <div className="flex flex-col gap-0.5">
                <div className="text-[9px] font-black text-emerald-400 uppercase tracking-tighter">
                  {npc.systemName || "CHƯA ĐỒNG BỘ"}
                </div>
                <div className="text-[8px] text-neutral-500 italic leading-tight line-clamp-2 group-hover:line-clamp-none transition-all">
                  {npc.systemDescription || "Đang chờ dữ liệu..."}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="p-2.5 bg-black/40 border border-white/10 rounded-sm space-y-3 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent"></div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></span> Sở thích
            </span>
            <LockToggle fieldKey="likes" npc={npc} onUpdateNpc={onUpdateNpc} />
          </div>
          {isEditing ? (
            <input 
              value={Array.isArray(npc.likes) ? npc.likes.join(', ') : ''} 
              onChange={(e) => handleChange('likes', e.target.value.split(',').map(s => s.trim()))}
              className="w-full bg-transparent text-[9px] text-emerald-400 font-black italic outline-none border-b border-emerald-500/20"
              placeholder="Sở thích (cách nhau bằng dấu phẩy)"
            />
          ) : (
            <div className="flex flex-wrap gap-1">
              {Array.isArray(npc.likes) && npc.likes.length ? npc.likes.map((l, i) => (
                <span key={i} className="px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-sm text-[9px] text-emerald-400 font-black italic shrink-0">{toSentenceCase(l)}</span>
              )) : <span className="text-[9px] text-neutral-700 italic">Dữ liệu trống</span>}
            </div>
          )}
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1 h-1 bg-rose-500 rounded-full animate-pulse"></span> Chán ghét
            </span>
            <LockToggle fieldKey="dislikes" npc={npc} onUpdateNpc={onUpdateNpc} />
          </div>
          {isEditing ? (
            <input 
              value={Array.isArray(npc.dislikes) ? npc.dislikes.join(', ') : ''} 
              onChange={(e) => handleChange('dislikes', e.target.value.split(',').map(s => s.trim()))}
              className="w-full bg-transparent text-[9px] text-rose-400 font-black italic outline-none border-b border-rose-500/20"
              placeholder="Chán ghét (cách nhau bằng dấu phẩy)"
            />
          ) : (
            <div className="flex flex-wrap gap-1">
              {Array.isArray(npc.dislikes) && npc.dislikes.length ? npc.dislikes.map((d, i) => (
                <span key={i} className="px-1.5 py-0.5 bg-rose-500/10 border border-rose-500/20 rounded-sm text-[9px] text-rose-400 font-black italic shrink-0">{toSentenceCase(d)}</span>
              )) : <span className="text-[9px] text-neutral-700 italic">Dữ liệu trống</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const NpcSkillsWidget: React.FC<{
  npc: Relationship,
  genre?: GameGenre,
  isEditing?: boolean,
  onUpdateNpc?: (npc: Relationship) => void,
  onInspect?: (data: { name: string; type: any; description?: string }) => void
}> = ({ npc, genre, isEditing, onUpdateNpc, onInspect }) => {
  const meta = getGenreMeta(genre);
  const skillLabel = meta.skillLabel || 'KỸ NĂNG & NĂNG LỰC';

  const handleSkillsChange = (text: string) => {
    if (onUpdateNpc) {
      const lines = text.split('\n').filter(s => s.trim());
      const newSkills = lines.map(line => {
        const [name, ...descParts] = line.split('|');
        return {
          name: name.trim(),
          description: descParts.join('|').trim() || "Kỹ năng/năng lực đã được ghi nhận trong hồ sơ thực thể."
        };
      });
      onUpdateNpc({ ...npc, skills: newSkills });
    }
  };

  const handleAddSkill = () => {
    if (onUpdateNpc) {
      onUpdateNpc({ ...npc, skills: [...(npc.skills || []), { name: 'KỸ NĂNG MỚI', description: '' }] });
    }
  };

  const handleUpdateSkill = (index: number, updates: Partial<any>) => {
    if (onUpdateNpc) {
      const newSkills = [...(npc.skills || [])];
      newSkills[index] = { ...newSkills[index], ...updates };
      onUpdateNpc({ ...npc, skills: newSkills });
    }
  };

  const handleRemoveSkill = (index: number) => {
    if (onUpdateNpc) {
      const newSkills = (npc.skills || []).filter((_, i) => i !== index);
      onUpdateNpc({ ...npc, skills: newSkills });
    }
  };

  return (
    <div className="p-4 bg-indigo-500/10 border-2 border-indigo-500/40 rounded-sm mono relative overflow-hidden shadow-[0_0_25px_rgba(99,102,241,0.1)] shrink-0 animate-in fade-in duration-700">
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent shadow-[0_0_8px_#6366f1]"></div>
      <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
        <h3 className="text-[12px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
           <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full shadow-[0_0_10px_#6366f1] animate-pulse"></span> {skillLabel}
        </h3>
        <LockToggle fieldKey="skills" npc={npc} onUpdateNpc={onUpdateNpc} />
      </div>

      <div className={isEditing ? "space-y-2 w-full" : "flex flex-wrap gap-1.5"}>
        {isEditing ? (
          <div className="space-y-2 w-full">
            {npc.skills && npc.skills.length > 0 ? npc.skills.map((skill, i) => (
              <div key={i} className="bg-black/40 p-2 border border-white/10 rounded-sm space-y-1 relative group">
                <button 
                  onClick={() => handleRemoveSkill(i)}
                  className="absolute top-1 right-1 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >✕</button>
                <input 
                  value={skill?.name || ''}
                  onChange={(e) => handleUpdateSkill(i, { name: e.target.value })}
                  className="w-full bg-transparent text-[10px] font-black text-indigo-400 uppercase outline-none border-b border-white/5"
                  placeholder="Tên kỹ năng"
                />
                <textarea 
                  value={skill?.description || ''}
                  onChange={(e) => handleUpdateSkill(i, { description: e.target.value })}
                  className="w-full bg-transparent text-[9px] text-neutral-400 outline-none resize-none font-mono leading-tight"
                  rows={2}
                  placeholder="Mô tả"
                />
              </div>
            )) : (
              <div className="text-center py-4 text-[9px] text-neutral-700 italic uppercase border border-dashed border-white/5">Trống</div>
            )}
            <button 
              onClick={handleAddSkill}
              className="w-full py-2 bg-indigo-500/10 border border-dashed border-indigo-500/30 rounded-sm text-[9px] font-black text-indigo-400 uppercase hover:bg-indigo-500/20 transition-all"
            >
              + THÊM KỸ NĂNG
            </button>
            <div className="pt-2 border-t border-white/5">
              <span className="text-[7px] text-neutral-600 font-black uppercase block mb-1">Nhập nhanh (Tên | Mô tả):</span>
              <textarea 
                defaultValue={npc.skills && npc.skills.length > 0 ? npc.skills.map(s => `${s?.name || 'Vô danh'} | ${s?.description || ''}`).join('\n') : ''}
                onBlur={(e) => handleSkillsChange(e.target.value)}
                className="w-full bg-black/40 text-[9px] p-2 border border-white/5 rounded-sm text-neutral-500 outline-none resize-none"
                rows={3}
                placeholder="Tên | Mô tả (Mỗi kỹ năng một dòng)"
              />
            </div>
          </div>
        ) : (
          Array.isArray(npc.skills) && npc.skills.length ? npc.skills.map((skill, i) => (
            <span 
              key={i} 
              onClick={() => onInspect?.({ name: skill.name, type: 'skill', description: skill.description })}
              className="px-2 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-sm text-[10px] text-indigo-300 font-black uppercase tracking-tight hover:bg-indigo-500/20 transition-all flex items-center gap-1 cursor-pointer group"
            >
              <DiffValue fieldKey={`skill_${i}`} current={skill.name} lastChanges={npc.lastChanges} color="text-indigo-300" className="text-[10px]" />
              <span className="text-[8px] opacity-0 group-hover:opacity-100 transition-opacity ml-1">ℹ️</span>
              <LockToggle fieldKey={`skill.${skill.name}`} npc={npc} onUpdateNpc={onUpdateNpc} />
            </span>
          )) : <div className="text-[10px] text-neutral-700 font-bold text-center py-4 italic uppercase w-full">Dữ_Liệu_Năng_Lực_Trống</div>
        )}
      </div>
    </div>
  );
};

export const NpcSocialColumn: React.FC<{ 
  npc: Relationship, 
  player: Player, 
  onSwitchNpc: (npc: Relationship) => void,
  isEditing?: boolean,
  onUpdateNpc?: (npc: Relationship) => void
}> = ({ npc, player, onSwitchNpc, isEditing, onUpdateNpc }) => {
  const network = (npc.network && npc.network.length > 0) ? npc.network : [
    ...((npc as any).mcRelatives || []),
    ...((npc as any).npcRelatives || [])
  ];

  const handleAddRelation = () => {
    if (onUpdateNpc) {
      onUpdateNpc({ 
        ...npc, 
        network: [...network, { npcId: '', npcName: '', relation: 'Người quen', description: '', affinity: 500 }] 
      });
    }
  };

  const handleUpdateRelation = (index: number, updates: Partial<NpcNetwork>) => {
    if (onUpdateNpc) {
      const newNetwork = [...network];
      newNetwork[index] = { ...newNetwork[index], ...updates };
      onUpdateNpc({ ...npc, network: newNetwork });
    }
  };

  const handleRemoveRelation = (index: number) => {
    if (onUpdateNpc) {
      const newNetwork = network.filter((_, i) => i !== index);
      onUpdateNpc({ ...npc, network: newNetwork });
    }
  };

  return (
    <div className="p-4 bg-cyan-500/10 border-2 border-cyan-500/40 rounded-sm mono relative overflow-hidden shadow-[0_0_25px_rgba(6,182,212,0.1)] shrink-0 animate-in fade-in duration-700">
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent shadow-[0_0_8px_#06b6d4]"></div>
      <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
        <div className="flex flex-col">
          <span className="text-[7px] text-cyan-500/50 font-black uppercase tracking-[0.3em] mb-0.5">MATRIX_NETWORK_v2.0</span>
          <h3 className="text-[12px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2">
             <Users className="w-4 h-4" /> Mạng lưới quan hệ
          </h3>
        </div>
        <LockToggle fieldKey="network" npc={npc} onUpdateNpc={onUpdateNpc} />
      </div>

      <div className="space-y-2">
        {network.map((rel, idx) => {
          const isMc = rel.npcId === "mc_player";
          const targetNpc = isMc ? null : player.relationships.find(r => r.id === rel.npcId);
          const displayName = isMc 
            ? (player.name || "Nhân vật chính") 
            : (targetNpc ? targetNpc.name : (rel.npcName || "Thực thể không xác định"));
          
          return (
            <div key={idx} className="bg-black/40 border border-white/5 p-2 rounded-sm flex flex-col gap-2 group">
              <div className="flex items-center justify-between">
                <div className="flex flex-col min-w-0 flex-grow">
                  {isEditing ? (
                    <div className="flex flex-col gap-1">
                      <select 
                        value={rel.npcId}
                        onChange={(e) => {
                          const selectedId = e.target.value;
                          const selectedNpc = player.relationships.find(r => r.id === selectedId);
                          handleUpdateRelation(idx, { 
                            npcId: selectedId, 
                            npcName: selectedId === 'mc_player' ? (player.name || 'Nhân vật chính') : (selectedNpc?.name || '')
                          });
                        }}
                        className="bg-black/60 text-[10px] font-black text-white uppercase outline-none border border-white/10 rounded px-1 w-full"
                      >
                        <option value="">Chọn nhân vật...</option>
                        <option value="mc_player">{player.name || "Nhân vật chính"} (MC)</option>
                        {player.relationships.filter(r => r.id !== npc.id).map(r => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                      <input 
                        value={rel.relation}
                        onChange={(e) => handleUpdateRelation(idx, { relation: e.target.value })}
                        className="bg-transparent text-[9px] text-cyan-400 font-black italic outline-none border-b border-cyan-500/20"
                        placeholder="Mối quan hệ (Vd: Chị gái)"
                      />
                    </div>
                  ) : (
                    <div 
                      className={`${!isMc && targetNpc ? 'cursor-pointer hover:opacity-80' : ''} transition-opacity`}
                      onClick={() => !isMc && targetNpc && onSwitchNpc(targetNpc)}
                    >
                      <div className="text-[10px] font-black text-white uppercase truncate flex items-center gap-1">
                        {displayName} {isMc && <span className="text-[8px] text-cyan-500/50">[MC]</span>}
                      </div>
                      <div className="text-[9px] text-cyan-400 font-black italic">
                        {rel.relation}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 ml-2">
                  {isEditing ? (
                    <button 
                      onClick={() => handleRemoveRelation(idx)}
                      className="text-rose-500 hover:text-rose-400"
                    >✕</button>
                  ) : (
                    <div className="flex flex-col items-end">
                      <div className="text-[8px] text-neutral-500 uppercase font-black">Thiện cảm</div>
                      <div className="text-[10px] font-black text-cyan-500">{rel.affinity || 500}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Description field */}
              <div className="border-t border-white/5 pt-1">
                {isEditing ? (
                  <textarea
                    value={rel.description || ''}
                    onChange={(e) => handleUpdateRelation(idx, { description: e.target.value })}
                    className="w-full bg-black/20 text-[9px] text-neutral-400 p-1 outline-none border border-white/5 rounded-sm resize-none"
                    placeholder="Mô tả chi tiết mối quan hệ..."
                    rows={2}
                  />
                ) : (
                  rel.description && (
                    <div className="text-[8px] text-neutral-500 italic leading-tight">
                      {rel.description}
                    </div>
                  )
                )}
              </div>
            </div>
          );
        })}

        {network.length === 0 && (
          <div className="text-[10px] text-neutral-700 font-bold text-center py-4 italic uppercase w-full">Mạng_Lưới_Trống</div>
        )}

        {isEditing && (
          <button 
            onClick={handleAddRelation}
            className="w-full py-2 bg-cyan-500/10 border border-dashed border-cyan-500/30 rounded-sm text-[9px] font-black text-cyan-400 uppercase hover:bg-cyan-500/20 transition-all"
          >
            + THÊM QUAN HỆ
          </button>
        )}
      </div>
    </div>
  );
};

export const NpcInventoryWidget: React.FC<{
  npc: Relationship,
  isEditing?: boolean,
  onUpdateNpc?: (npc: Relationship) => void,
  onInspect?: (data: { name: string; type: any; description?: string }) => void
}> = ({ npc, isEditing, onUpdateNpc, onInspect }) => {
  const handleInventoryChange = (text: string) => {
    if (onUpdateNpc) {
      const lines = text.split('\n').filter(s => s.trim());
      const newInventory = lines.map(line => {
        const [name, ...descParts] = line.split('|');
        return {
          name: name.trim(),
          description: descParts.join('|').trim() || "Vật thể mang năng lượng tích hợp."
        };
      });
      onUpdateNpc({ ...npc, inventory: newInventory });
    }
  };

  const handleAddItem = () => {
    if (onUpdateNpc) {
      onUpdateNpc({ ...npc, inventory: [...(npc.inventory || []), { name: 'VẬT PHẨM MỚI', description: '' }] });
    }
  };

  const handleUpdateItem = (index: number, updates: Partial<any>) => {
    if (onUpdateNpc) {
      const newInventory = [...(npc.inventory || [])];
      newInventory[index] = { ...newInventory[index], ...updates };
      onUpdateNpc({ ...npc, inventory: newInventory });
    }
  };

  const handleRemoveItem = (index: number) => {
    if (onUpdateNpc) {
      const newInventory = (npc.inventory || []).filter((_, i) => i !== index);
      onUpdateNpc({ ...npc, inventory: newInventory });
    }
  };

  return (
    <div className="p-4 bg-emerald-500/10 border-2 border-emerald-500/40 rounded-sm mono relative overflow-hidden shadow-[0_0_25px_rgba(16,185,129,0.1)] shrink-0 animate-in fade-in duration-700">
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent shadow-[0_0_8px_#10b981]"></div>
      <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
        <h3 className="text-[12px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
           <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981] animate-pulse"></span> TÚI ĐỒ (INVENTORY)
        </h3>
        <LockToggle fieldKey="inventory" npc={npc} onUpdateNpc={onUpdateNpc} />
      </div>

      <div className={isEditing ? "space-y-2 w-full" : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5"}>
        {isEditing ? (
          <div className="space-y-2 w-full">
            {npc.inventory && npc.inventory.length > 0 ? npc.inventory.map((item, i) => (
              <div key={i} className="bg-black/40 p-2 border border-white/10 rounded-sm space-y-1 relative group">
                <button 
                  onClick={() => handleRemoveItem(i)}
                  className="absolute top-1 right-1 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >✕</button>
                <input 
                  value={item?.name || ''}
                  onChange={(e) => handleUpdateItem(i, { name: e.target.value })}
                  className="w-full bg-transparent text-[10px] font-black text-emerald-400 uppercase outline-none border-b border-white/5"
                  placeholder="Tên vật phẩm"
                />
                <textarea 
                  value={item?.description || ''}
                  onChange={(e) => handleUpdateItem(i, { description: e.target.value })}
                  className="w-full bg-transparent text-[9px] text-neutral-400 outline-none resize-none font-mono leading-tight"
                  rows={2}
                  placeholder="Mô tả"
                />
              </div>
            )) : (
              <div className="text-center py-4 text-[9px] text-neutral-700 italic uppercase border border-dashed border-white/5">Trống</div>
            )}
            <button 
              onClick={handleAddItem}
              className="w-full py-2 bg-emerald-500/10 border border-dashed border-emerald-500/30 rounded-sm text-[9px] font-black text-emerald-400 uppercase hover:bg-emerald-500/20 transition-all"
            >
              + THÊM VẬT PHẨM
            </button>
            <div className="pt-2 border-t border-white/5">
              <span className="text-[7px] text-neutral-600 font-black uppercase block mb-1">Nhập nhanh (Tên | Mô tả):</span>
              <textarea 
                defaultValue={npc.inventory && npc.inventory.length > 0 ? npc.inventory.map(i => `${i?.name || 'Vô danh'} | ${i?.description || ''}`).join('\n') : ''}
                onBlur={(e) => handleInventoryChange(e.target.value)}
                className="w-full bg-black/40 text-[9px] p-2 border border-white/5 rounded-sm text-neutral-500 outline-none resize-none"
                rows={3}
                placeholder="Tên | Mô tả (Mỗi vật phẩm một dòng)"
              />
            </div>
          </div>
        ) : (
          npc.inventory && npc.inventory.length > 0 ? npc.inventory.map((item, i) => (
            <div 
              key={i} 
              onClick={() => onInspect?.({ name: item.name, type: 'item', description: item.description })}
              className="p-1.5 bg-white/[0.03] border border-white/5 rounded-sm flex flex-col gap-0.5 hover:bg-white/[0.06] transition-colors group min-w-0 cursor-pointer"
            >
              <DiffValue fieldKey={`inv_${i}_name`} current={item.name} lastChanges={npc.lastChanges} color="text-emerald-400" className="text-[10px] uppercase truncate" />
              <DiffValue fieldKey={`inv_${i}_desc`} current={item.description} lastChanges={npc.lastChanges} color="text-neutral-500" className="text-[8px] italic leading-tight line-clamp-1 group-hover:line-clamp-none transition-all" />
            </div>
          )) : <div className="text-[10px] text-neutral-700 font-bold text-center py-4 italic uppercase w-full col-span-full">Túi_Đồ_Trống</div>
        )}
      </div>
    </div>
  );
};

export const NpcCustomFieldsWidget: React.FC<{
  npc: Relationship,
  isEditing?: boolean,
  onUpdateNpc?: (npc: Relationship) => void,
  onInspect?: (data: { name: string; type: any; description?: string }) => void
}> = ({ npc, isEditing, onUpdateNpc, onInspect }) => {
  const fields = npc.customFields || [];

  return (
    <div className="p-4 bg-white/[0.03] border-2 border-white/10 rounded-sm mono relative overflow-hidden shrink-0 animate-in fade-in duration-700">
      <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
        <h3 className="text-[12px] font-black text-neutral-400 uppercase tracking-widest flex items-center gap-2">
           <span className="w-2.5 h-2.5 bg-neutral-500 rotate-45 animate-pulse"></span> THÔNG TIN TÙY CHỈNH
        </h3>
        <LockToggle fieldKey="customFields" npc={npc} onUpdateNpc={onUpdateNpc} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {fields.map((field, i) => (
          <div key={i} className="bg-black/40 border border-white/5 p-2 rounded-sm group relative">
            {isEditing && (
              <button 
                onClick={() => {
                  const newFields = fields.filter((_, idx) => idx !== i);
                  onUpdateNpc?.({ ...npc, customFields: newFields });
                }}
                className="absolute top-1 right-1 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity z-10"
              >✕</button>
            )}
            <div className="flex flex-col gap-1">
              {isEditing ? (
                <>
                  <div className="flex items-center justify-between">
                    <input 
                      value={field.label}
                      onChange={(e) => {
                        const newFields = [...fields];
                        newFields[i] = { ...field, label: e.target.value };
                        onUpdateNpc?.({ ...npc, customFields: newFields });
                      }}
                      className="bg-transparent text-[8px] font-black text-neutral-500 uppercase outline-none border-b border-white/5 flex-grow"
                      placeholder="Tên"
                    />
                    <LockToggle fieldKey={`customField.${field.label}.label`} npc={npc} onUpdateNpc={onUpdateNpc} />
                  </div>
                  <div className="flex items-center justify-between">
                    <input 
                      value={field.value}
                      onChange={(e) => {
                        const newFields = [...fields];
                        newFields[i] = { ...field, value: e.target.value };
                        onUpdateNpc?.({ ...npc, customFields: newFields });
                      }}
                      className="bg-transparent text-xs font-black text-white outline-none border-b border-white/10 flex-grow"
                      placeholder="Giá trị"
                    />
                    <LockToggle fieldKey={`customField.${field.label}.value`} npc={npc} onUpdateNpc={onUpdateNpc} />
                  </div>
                </>
              ) : (
                <div 
                  className="cursor-pointer"
                  onClick={() => onInspect?.({ name: field.label, type: 'customField', description: String(field.value) })}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-black text-neutral-500 uppercase tracking-widest">{field.icon || '💠'} {field.label}</span>
                    <LockToggle fieldKey={`customField.${field.label}.label`} npc={npc} onUpdateNpc={onUpdateNpc} />
                  </div>
                  <div className="flex items-center justify-between">
                    <DiffValue fieldKey={`custom_${i}_value`} current={field.value} lastChanges={npc.lastChanges} color="text-white" className="text-xs" />
                    <LockToggle fieldKey={`customField.${field.label}.value`} npc={npc} onUpdateNpc={onUpdateNpc} />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {isEditing && (
        <button 
          onClick={() => {
            const newFields = [...fields, { label: 'MỚI', value: '?', icon: '💠' }];
            onUpdateNpc?.({ ...npc, customFields: newFields });
          }}
          className="w-full mt-3 py-2 bg-white/5 border border-dashed border-white/20 rounded-sm text-[9px] font-black text-neutral-500 uppercase hover:bg-white/10 transition-all"
        >
          + THÊM WIDGET
        </button>
      )}
    </div>
  );
};
