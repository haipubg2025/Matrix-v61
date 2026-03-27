
import React from 'react';
import { Relationship, getAffinityLabel, getLoyaltyLabel, getLustLabel, getLibidoLabel, getWillpowerLabel } from '../types';
import { renderSafeText, toSentenceCase, DiffValue, LockToggle } from './NpcProfileBase';
import { NewIndicator } from './NewIndicator';

const StatBar = ({ label, field, value, subLabel, color, barColor, icon, isEditing, lastChanges, handleChange, npc, onUpdateNpc, max = 100 }: any) => {
  const displayValue = value === undefined || value === null ? 0 : value;
  const isPlaceholder = value === undefined || value === null;

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-end px-0.5">
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-neutral-600 font-black uppercase tracking-widest">{label}</span>
          {npc.newFields?.includes(field) && <NewIndicator />}
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-black uppercase ${color}`}>{icon} {subLabel}</span>
          {isEditing ? (
            <input 
              type="number"
              value={value || 0}
              onChange={(e) => handleChange(field, parseInt(e.target.value) || 0)}
              className="text-[9px] mono bg-white/10 px-1 rounded-sm w-12 outline-none border border-white/20"
            />
          ) : (
            <DiffValue fieldKey={field} current={value} lastChanges={lastChanges} color={color} className="text-[9px] mono bg-white/5 px-1 rounded-sm" />
          )}
          <LockToggle fieldKey={field} npc={npc} onUpdateNpc={onUpdateNpc} />
        </div>
      </div>
      <div className="h-1.5 w-full bg-black/60 rounded-full overflow-hidden border border-white/5 p-[1px]">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ${isPlaceholder ? 'bg-neutral-800' : barColor}`} 
          style={{ width: `${Math.min(100, Math.max(0, (displayValue / max) * 100))}%` }}
        ></div>
      </div>
    </div>
  );
};

export const NpcRelationshipDashboard: React.FC<{ 
  npc: Relationship,
  isEditing?: boolean,
  onUpdateNpc?: (npc: Relationship) => void
}> = ({ npc, isEditing, onUpdateNpc }) => {
  const aff = getAffinityLabel(npc.affinity);
  const loy = getLoyaltyLabel(npc.loyalty);
  const lust = getLustLabel(npc.lust);
  const lib = getLibidoLabel(npc.libido);
  const will = getWillpowerLabel(npc.willpower);

  const handleChange = (field: keyof Relationship, value: any) => {
    if (onUpdateNpc) {
      const newLastChanges = { ...(npc.lastChanges || {}) };
      delete newLastChanges[field];
      onUpdateNpc({ ...npc, [field]: value, lastChanges: newLastChanges });
    }
  };

  return (
    <div className="p-4 bg-[#0a0a0a] border border-white/10 rounded-sm space-y-4 shadow-2xl mono relative overflow-hidden shrink-0">
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-500/20 via-white/5 to-rose-500/20"></div>
      
      <StatBar 
        label="Hưng Phấn Tức Thời" 
        field="lust" 
        value={npc.lust} 
        subLabel={lust.label} 
        color={lust.color} 
        barColor="bg-rose-600 shadow-[0_0_10px_#e11d48]" 
        icon="🌋" 
        isEditing={isEditing} 
        lastChanges={npc.lastChanges} 
        handleChange={handleChange} 
        npc={npc}
        onUpdateNpc={onUpdateNpc}
        max={1000}
      />

      <StatBar 
        label="Bản Tính Dâm Đãng" 
        field="libido" 
        value={npc.libido} 
        subLabel={lib.label} 
        color={lib.color} 
        barColor="bg-fuchsia-600 shadow-[0_0_10px_#a21caf]" 
        icon="🧬" 
        isEditing={isEditing} 
        lastChanges={npc.lastChanges} 
        handleChange={handleChange} 
        npc={npc}
        onUpdateNpc={onUpdateNpc}
        max={1000}
      />

      <StatBar 
        label="Ý Chí Kháng Cự" 
        field="willpower" 
        value={npc.willpower} 
        subLabel={will.label} 
        color={will.color} 
        barColor="bg-blue-600 shadow-[0_0_10px_#2563eb]" 
        icon="🛡️" 
        isEditing={isEditing} 
        lastChanges={npc.lastChanges} 
        handleChange={handleChange} 
        npc={npc}
        onUpdateNpc={onUpdateNpc}
        max={1000}
      />
      
      <StatBar 
        label="Độ Thiện Cảm" 
        field="affinity"
        value={npc.affinity} 
        subLabel={aff.label} 
        color={aff.color} 
        barColor={npc.affinity > 550 ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-rose-500 shadow-[0_0_10px_#f43f5e]'} 
        icon="♥" 
        isEditing={isEditing}
        lastChanges={npc.lastChanges}
        handleChange={handleChange}
        npc={npc}
        onUpdateNpc={onUpdateNpc}
        max={1000}
      />

      <StatBar 
        label="Độ Trung Thành" 
        field="loyalty"
        value={npc.loyalty} 
        subLabel={loy.label} 
        color={loy.color} 
        barColor="bg-cyan-500 shadow-[0_0_10px_#06b6d4]" 
        icon="🛡️" 
        isEditing={isEditing}
        lastChanges={npc.lastChanges}
        handleChange={handleChange}
        npc={npc}
        onUpdateNpc={onUpdateNpc}
        max={1000}
      />

      {npc.affinityChangeReason && (
        <div className="mt-4 p-2 bg-emerald-500/5 border border-emerald-500/20 rounded-sm animate-in fade-in slide-in-from-top-1 duration-500">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Biến động gần nhất:</span>
          </div>
          <p className="text-[11px] text-neutral-300 italic leading-relaxed">
            "{npc.affinityChangeReason}"
          </p>
        </div>
      )}

      <div className="pt-2 border-t border-white/5 flex items-center justify-between">
         <div className="flex items-center gap-1">
           <span className="text-[9px] text-neutral-600 font-black uppercase tracking-widest italic">Cảm xúc:</span>
           {npc.newFields?.includes('mood') && <NewIndicator />}
         </div>
         <div className="flex items-center gap-1">
           <DiffValue fieldKey="mood" current={npc.mood} lastChanges={npc.lastChanges} color="text-white" className="text-sm font-black italic tracking-tight" />
           <LockToggle fieldKey="mood" npc={npc} onUpdateNpc={onUpdateNpc} />
         </div>
      </div>
    </div>
  );
};

const GoalCard = ({ title, field, value, icon, color, isEditing, lastChanges, handleChange, npc, onUpdateNpc }: any) => (
  <div className={`p-2 bg-${color}-500/[0.03] border border-${color}-500/20 rounded-sm group/goal transition-all hover:bg-${color}-500/[0.06]`}>
    <div className="flex items-center justify-between mb-1">
      <div className="flex items-center gap-2">
        <span className={`text-xs text-${color}-400`}>{icon}</span>
        <span className={`text-[9px] font-black uppercase tracking-widest text-${color}-500/80`}>{title}</span>
        {npc.newFields?.includes(field) && <NewIndicator />}
      </div>
      <LockToggle fieldKey={field} npc={npc} onUpdateNpc={onUpdateNpc} />
    </div>
    {isEditing ? (
      <textarea 
        value={value || ''} 
        onChange={(e) => handleChange(field, e.target.value)}
        className="w-full bg-transparent text-[11.5px] text-neutral-200 italic outline-none resize-none border-b border-white/10"
        rows={2}
      />
    ) : (
      <DiffValue fieldKey={field} current={value} lastChanges={lastChanges} color="text-neutral-200" className="text-[11.5px] px-1 italic" />
    )}
  </div>
);

export const NpcPsychologyWidget: React.FC<{ 
  npc: Relationship,
  isEditing?: boolean,
  onUpdateNpc?: (npc: Relationship) => void
}> = ({ npc, isEditing, onUpdateNpc }) => {
  const handleChange = (field: keyof Relationship, value: any) => {
    if (onUpdateNpc) {
      const newLastChanges = { ...(npc.lastChanges || {}) };
      delete newLastChanges[field];
      onUpdateNpc({ ...npc, [field]: value, lastChanges: newLastChanges });
    }
  };

  return (
    <div className="p-4 bg-black/40 border border-white/10 rounded-sm mono shadow-lg space-y-4 shrink-0">
      <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-emerald-500 shadow-[0_0_5px_#10b981]"></span>
          <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Ma Trận Tâm Lý</h3>
          {npc.newFields?.includes('personality') && <NewIndicator />}
        </div>
        <LockToggle fieldKey="personality" npc={npc} onUpdateNpc={onUpdateNpc} />
      </div>

      <div className="flex flex-wrap gap-1">
        {isEditing ? (
          <input 
            value={npc.personality || ''} 
            onChange={(e) => handleChange('personality', e.target.value)}
            className="w-full bg-transparent text-[9px] text-neutral-400 uppercase outline-none border-b border-white/10"
            placeholder="Tính cách"
          />
        ) : (
          <DiffValue fieldKey="personality" current={npc.personality} lastChanges={npc.lastChanges} color="text-neutral-400" className="text-[9px] uppercase" />
        )}
      </div>

      <div className="grid grid-cols-1 gap-1.5">
        <GoalCard 
          title="Dục vọng (Lust)" 
          field="physicalLust" 
          value={npc.physicalLust} 
          icon="🔥" 
          color="rose" 
          isEditing={isEditing} 
          lastChanges={npc.lastChanges} 
          handleChange={handleChange} 
          npc={npc} 
          onUpdateNpc={onUpdateNpc} 
        />
        <GoalCard title="Tham vọng (Ambition)" field="soulAmbition" value={npc.soulAmbition} icon="👑" color="amber" isEditing={isEditing} lastChanges={npc.lastChanges} handleChange={handleChange} npc={npc} onUpdateNpc={onUpdateNpc} />
        <GoalCard title="Ngắn hạn (Immediate)" field="shortTermGoal" value={npc.shortTermGoal} icon="⚡" color="cyan" isEditing={isEditing} lastChanges={npc.lastChanges} handleChange={handleChange} npc={npc} onUpdateNpc={onUpdateNpc} />
        <GoalCard title="Ước mơ (Destiny)" field="longTermDream" value={npc.longTermDream} icon="💠" color="indigo" isEditing={isEditing} lastChanges={npc.lastChanges} handleChange={handleChange} npc={npc} onUpdateNpc={onUpdateNpc} />
      </div>

      {/* TIỂU SỬ & KHÓ KHĂN DƯỚI MA TRẬN TÂM LÝ */}
      <div className="space-y-2 pt-2 border-t border-white/5">
        <div className="p-2.5 bg-white/[0.02] border border-white/5 rounded-sm space-y-1.5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-[1px] h-full bg-neutral-700"></div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Tiểu Sử & Thân Phận</span>
              {npc.newFields?.includes('background') && <NewIndicator />}
            </div>
            <LockToggle fieldKey="background" npc={npc} onUpdateNpc={onUpdateNpc} />
          </div>
          {isEditing ? (
            <textarea 
              value={npc.background || ''} 
              onChange={(e) => handleChange('background', e.target.value)}
              className="w-full bg-transparent text-[11px] text-neutral-400 font-medium italic outline-none resize-none border-b border-white/10"
              rows={3}
            />
          ) : (
            <DiffValue fieldKey="background" current={npc.background} lastChanges={npc.lastChanges} color="text-neutral-400" className="text-[11px] font-medium italic leading-relaxed" />
          )}
        </div>

        <div className="p-2.5 bg-rose-500/[0.03] border border-rose-500/10 rounded-sm space-y-1.5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-[1px] h-full bg-rose-900/50"></div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-black text-rose-500/80 uppercase tracking-widest">Khó Khăn & Nghịch Cảnh</span>
              {npc.newFields?.includes('hardships') && <NewIndicator />}
            </div>
            <LockToggle fieldKey="hardships" npc={npc} onUpdateNpc={onUpdateNpc} />
          </div>
          {isEditing ? (
            <textarea 
              value={Array.isArray(npc.hardships) ? npc.hardships.join('\n') : ''} 
              onChange={(e) => handleChange('hardships', e.target.value.split('\n').filter(s => s.trim()))}
              className="w-full bg-transparent text-[11px] text-rose-200/60 font-medium italic outline-none resize-none border-b border-rose-500/10"
              rows={3}
              placeholder="Mỗi khó khăn một dòng..."
            />
          ) : (
            <div className="space-y-1.5">
              {Array.isArray(npc.hardships) && npc.hardships.length ? npc.hardships.map((h, i) => (
                <div key={i} className="text-[11px] text-rose-200/60 font-medium italic leading-tight flex gap-2">
                  <span className="shrink-0 opacity-40">❯</span>
                  <DiffValue fieldKey={`hardships_${i}`} current={h} lastChanges={npc.lastChanges} color="text-rose-200/60" className="text-[11px]" />
                </div>
              )) : <span className="text-[11px] text-neutral-700 italic">Không có khó khăn đáng kể.</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const NpcOpinionWidget: React.FC<{ 
  npc: Relationship,
  isEditing?: boolean,
  onUpdateNpc?: (npc: Relationship) => void
}> = ({ npc, isEditing, onUpdateNpc }) => {
  const handleChange = (field: keyof Relationship, value: any) => {
    if (onUpdateNpc) {
      const newLastChanges = { ...(npc.lastChanges || {}) };
      delete newLastChanges[field];
      onUpdateNpc({ ...npc, [field]: value, lastChanges: newLastChanges });
    }
  };

  return (
    <div className="p-2 bg-cyan-500/[0.04] border border-cyan-500/20 rounded-sm mono shadow-inner relative">
      <div className="absolute top-0 right-0 p-1 opacity-20 text-[8px] font-black text-cyan-600 uppercase">Luồng Tức Thời</div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1">
          <span className="block text-[9px] font-black text-cyan-600 uppercase tracking-widest">Phản hồi vừa qua:</span>
          {npc.newFields?.includes('currentOpinion') && <NewIndicator />}
        </div>
        <LockToggle fieldKey="currentOpinion" npc={npc} onUpdateNpc={onUpdateNpc} />
      </div>
      {isEditing ? (
        <textarea 
          value={npc.currentOpinion || ''} 
          onChange={(e) => handleChange('currentOpinion', e.target.value)}
          className="w-full bg-transparent text-xs text-cyan-50/80 outline-none resize-none border-b border-cyan-500/20"
          rows={2}
        />
      ) : (
        <DiffValue fieldKey="currentOpinion" current={npc.currentOpinion} lastChanges={npc.lastChanges} color="text-cyan-50/80" className="text-xs" />
      )}
    </div>
  );
};

export const NpcImpressionWidget: React.FC<{ 
  npc: Relationship, 
  themeColor: string,
  isEditing?: boolean,
  onUpdateNpc?: (npc: Relationship) => void
}> = ({ npc, themeColor, isEditing, onUpdateNpc }) => {
  const handleChange = (field: keyof Relationship, value: any) => {
    if (onUpdateNpc) {
      const newLastChanges = { ...(npc.lastChanges || {}) };
      delete newLastChanges[field];
      onUpdateNpc({ ...npc, [field]: value, lastChanges: newLastChanges });
    }
  };

  return (
    <div className="p-4 bg-black/80 border border-white/10 rounded-sm mono relative group shrink-0">
      <div className={`absolute top-0 left-0 w-1 h-full bg-${themeColor}-500/40 group-hover:bg-${themeColor}-500 transition-all`}></div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1">
          <span className="block text-[9px] text-neutral-600 font-black uppercase tracking-widest italic">Ấn Tượng Với MC:</span>
          {npc.newFields?.includes('impression') && <NewIndicator />}
        </div>
        <LockToggle fieldKey="impression" npc={npc} onUpdateNpc={onUpdateNpc} />
      </div>
      {isEditing ? (
        <textarea 
          value={npc.impression || ''} 
          onChange={(e) => handleChange('impression', e.target.value)}
          className="w-full bg-transparent text-[13px] text-neutral-200 outline-none resize-none border-b border-white/10"
          rows={2}
        />
      ) : (
        <DiffValue fieldKey="impression" current={npc.impression} lastChanges={npc.lastChanges} color="text-neutral-200" className="text-[13px]" />
      )}
    </div>
  );
};

export const NpcSecretsWidget: React.FC<{ 
  npc: Relationship,
  isEditing?: boolean,
  onUpdateNpc?: (npc: Relationship) => void
}> = ({ npc, isEditing, onUpdateNpc }) => {
  const handleChange = (field: keyof Relationship, value: any) => {
    if (onUpdateNpc) {
      const newLastChanges = { ...(npc.lastChanges || {}) };
      delete newLastChanges[field];
      onUpdateNpc({ ...npc, [field]: value, lastChanges: newLastChanges });
    }
  };

  return (
    <div className="p-4 bg-black/40 border border-white/10 rounded-sm mono shadow-2xl space-y-4 shrink-0">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest flex items-center gap-2">
          <span className="w-1.5 h-[1px] bg-neutral-700"></span> Bí Mật Đã Giải Mã
          {npc.newFields?.includes('secrets') && <NewIndicator />}
        </h3>
        <LockToggle fieldKey="secrets" npc={npc} onUpdateNpc={onUpdateNpc} />
      </div>
      <div className="space-y-1.5">
        {isEditing ? (
          <textarea 
            value={Array.isArray(npc.secrets) ? npc.secrets.join('\n') : ''} 
            onChange={(e) => handleChange('secrets', e.target.value.split('\n').filter(s => s.trim()))}
            className="w-full bg-transparent text-[11px] font-black text-neutral-400 uppercase outline-none resize-none border border-white/10 p-1"
            rows={4}
            placeholder="Mỗi bí mật một dòng"
          />
        ) : (
          Array.isArray(npc.secrets) && npc.secrets.length ? npc.secrets.map((s, i) => (
            <div key={i} className="group p-2.5 bg-neutral-900 border border-white/5 rounded-sm flex items-start gap-3 hover:border-red-500/30 transition-all cursor-default">
              <span className="text-lg opacity-40 group-hover:opacity-100 transition-opacity">🔒</span>
              <span className="text-[11px] font-black text-neutral-400 uppercase leading-tight tracking-tight group-hover:text-red-400 transition-colors">{renderSafeText(s)}</span>
            </div>
          )) : <div className="py-6 text-center opacity-5 grayscale select-none"><span className="text-3xl">🔏</span></div>
        )}
      </div>
    </div>
  );
};

export const NpcInnerSelfWidget: React.FC<{ 
  npc: Relationship,
  isEditing?: boolean,
  onUpdateNpc?: (npc: Relationship) => void
}> = ({ npc, isEditing, onUpdateNpc }) => {
  const handleChange = (field: keyof Relationship, value: any) => {
    if (onUpdateNpc) {
      const newLastChanges = { ...(npc.lastChanges || {}) };
      delete newLastChanges[field];
      onUpdateNpc({ ...npc, [field]: value, lastChanges: newLastChanges });
    }
  };

  return (
    <div className="p-4 bg-purple-500/[0.03] border border-purple-500/10 rounded-sm mono space-y-3 shadow-xl shrink-0">
      <div className="flex items-center justify-between border-b border-purple-600/20 pb-1">
        <h3 className="text-[9px] font-black text-purple-400 uppercase tracking-widest flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-purple-500 shadow-[0_0_5px_#a855f7]"></span>
          Nội Tâm Thực Tại
          {npc.newFields?.includes('innerSelf') && <NewIndicator />}
        </h3>
        <LockToggle fieldKey="innerSelf" npc={npc} onUpdateNpc={onUpdateNpc} />
      </div>
      <div className="p-2 bg-black/40 border border-white/5 rounded-sm">
        {isEditing ? (
          <textarea 
            value={npc.innerSelf || ''} 
            onChange={(e) => handleChange('innerSelf', e.target.value)}
            className="w-full bg-transparent text-[11px] text-purple-200/80 font-medium italic outline-none resize-none"
            rows={3}
            placeholder="Mô tả thế giới nội tâm thầm kín..."
          />
        ) : (
          <DiffValue fieldKey="innerSelf" current={npc.innerSelf} lastChanges={npc.lastChanges} color="text-purple-200/80" className="text-[11px] font-medium italic leading-relaxed" />
        )}
      </div>
    </div>
  );
};

export const NpcFetishWidget: React.FC<{ 
  npc: Relationship,
  isEditing?: boolean,
  onUpdateNpc?: (npc: Relationship) => void
}> = ({ npc, isEditing, onUpdateNpc }) => {
  const handleChange = (field: keyof Relationship, value: any) => {
    if (onUpdateNpc) {
      const newLastChanges = { ...(npc.lastChanges || {}) };
      delete newLastChanges[field];
      onUpdateNpc({ ...npc, [field]: value, lastChanges: newLastChanges });
    }
  };

  if (!npc.fetish && !isEditing) return null;

  return (
    <div className="p-4 bg-red-500/15 border-2 border-red-500/50 rounded-sm relative overflow-hidden group shadow-[0_0_25px_rgba(239,68,68,0.15)] mono shrink-0 min-h-[100px] animate-in fade-in duration-700">
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_10px_#ef4444]"></div>
      <div className="absolute top-0 right-0 w-8 h-8 bg-red-500/20 rotate-45 translate-x-4 -translate-y-4"></div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[12px] text-red-400 font-black uppercase flex items-center gap-2 tracking-widest">
          <span className="w-2.5 h-2.5 bg-red-500 animate-pulse rounded-full shadow-[0_0_12px_#ef4444]"></span>
          Sở Thích Fetish
          {npc.newFields?.includes('fetish') && <NewIndicator />}
        </h3>
        <LockToggle fieldKey="fetish" npc={npc} onUpdateNpc={onUpdateNpc} />
      </div>
      {isEditing ? (
        <input 
          value={npc.fetish || ''} 
          onChange={(e) => handleChange('fetish', e.target.value)}
          className="w-full bg-transparent text-[12px] text-red-100 italic outline-none border-b border-red-500/20"
          placeholder="Nhập sở thích đặc biệt..."
        />
      ) : (
        <DiffValue fieldKey="fetish" current={npc.fetish} lastChanges={npc.lastChanges} color="text-red-100" className="text-[12px] italic" />
      )}
    </div>
  );
};

export const NpcSexualPreferencesWidget: React.FC<{ 
  npc: Relationship,
  isEditing?: boolean,
  onUpdateNpc?: (npc: Relationship) => void
}> = ({ npc, isEditing, onUpdateNpc }) => {
  const handleChange = (field: keyof Relationship, value: any) => {
    if (onUpdateNpc) {
      const newLastChanges = { ...(npc.lastChanges || {}) };
      delete newLastChanges[field];
      onUpdateNpc({ ...npc, [field]: value, lastChanges: newLastChanges });
    }
  };

  if (!isEditing && (!npc.sexualPreferences || npc.sexualPreferences.length === 0)) return null;

  return (
    <div className="p-4 bg-pink-500/15 border-2 border-pink-500/50 rounded-sm relative overflow-hidden group shadow-[0_0_25px_rgba(236,72,153,0.15)] mono shrink-0 min-h-[100px] animate-in fade-in duration-700">
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-pink-500 to-transparent shadow-[0_0_10px_#ec4899]"></div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[12px] text-pink-400 font-black uppercase flex items-center gap-2 tracking-widest">
          <span className="w-2.5 h-2.5 bg-pink-500 animate-pulse rounded-full shadow-[0_0_12px_#ec4899]"></span>
          Sở Thích Tình Yêu & Tình Dục
          {npc.newFields?.includes('sexualPreferences') && <NewIndicator />}
        </h3>
        <LockToggle fieldKey="sexualPreferences" npc={npc} onUpdateNpc={onUpdateNpc} />
      </div>
      
      <div className="flex flex-wrap gap-1.5">
        {isEditing ? (
          <textarea 
            value={Array.isArray(npc.sexualPreferences) ? npc.sexualPreferences.join(', ') : ''} 
            onChange={(e) => handleChange('sexualPreferences', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
            className="w-full bg-black/60 text-[11px] p-2 border border-pink-500/20 rounded-sm text-pink-100 outline-none resize-none font-mono italic"
            rows={3}
            placeholder="Nhập hành động, tư thế... (cách nhau bằng dấu phẩy)"
          />
        ) : (
          Array.isArray(npc.sexualPreferences) && npc.sexualPreferences.length ? npc.sexualPreferences.map((pref, i) => (
            <span key={i} className="px-2 py-1 bg-pink-500/10 border border-pink-500/30 rounded-sm text-[11px] text-pink-200 italic font-bold hover:bg-pink-500/20 transition-all">
              <DiffValue fieldKey={`sexualPref_${i}`} current={pref} lastChanges={npc.lastChanges} color="text-pink-200" className="text-[11px]" />
            </span>
          )) : <div className="text-[10px] text-neutral-700 font-bold text-center py-4 italic uppercase w-full">Dữ_Liệu_Trống</div>
        )}
      </div>
    </div>
  );
};

export const NpcSexualArchetypeWidget: React.FC<{ 
  npc: Relationship,
  isEditing?: boolean,
  onUpdateNpc?: (npc: Relationship) => void
}> = ({ npc, isEditing, onUpdateNpc }) => {
  const handleChange = (field: keyof Relationship, value: any) => {
    if (onUpdateNpc) {
      const newLastChanges = { ...(npc.lastChanges || {}) };
      delete newLastChanges[field];
      onUpdateNpc({ ...npc, [field]: value, lastChanges: newLastChanges });
    }
  };

  const archetypes = [
    { id: 'Ngây thơ trong sáng', label: 'Ngây thơ trong sáng', icon: '🕊️', color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { id: 'Đã biết qua sách báo/porn', label: 'Đã biết qua sách báo/porn', icon: '📖', color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { id: 'Đã có kinh nghiệm (vài lần)', label: 'Đã có kinh nghiệm (vài lần)', icon: '💃', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { id: 'Dâm đãng/Nhiều kinh nghiệm', label: 'Dâm đãng/Nhiều kinh nghiệm', icon: '🔥', color: 'text-rose-400', bg: 'bg-rose-500/10' }
  ];

  if (!npc.sexualArchetype && !isEditing) return null;

  return (
    <div className="p-4 bg-black/40 border border-white/10 rounded-sm mono shadow-lg space-y-3 shrink-0">
      <div className="flex items-center justify-between border-b border-white/5 pb-1">
        <h3 className="text-[9px] font-black text-neutral-500 uppercase tracking-widest flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-neutral-600"></span>
          Phân Loại Kiến Thức Tình Dục
          {npc.newFields?.includes('sexualArchetype') && <NewIndicator />}
        </h3>
        <LockToggle fieldKey="sexualArchetype" npc={npc} onUpdateNpc={onUpdateNpc} />
      </div>

      <div className="flex flex-col gap-2">
        {isEditing ? (
          <div className="grid grid-cols-1 gap-2">
            {archetypes.map((arch) => (
              <button
                key={arch.id}
                onClick={() => handleChange('sexualArchetype', arch.id)}
                className={`flex items-center gap-3 p-2 rounded-sm border transition-all text-left ${
                  npc.sexualArchetype === arch.id 
                    ? `bg-white/10 border-white/30 text-white` 
                    : 'bg-transparent border-white/5 text-neutral-500 hover:border-white/10'
                }`}
              >
                <span className="text-sm">{arch.icon}</span>
                <span className="text-[10px] font-black uppercase tracking-tight">{arch.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className={`flex items-center gap-3 p-3 rounded-sm border border-white/5 bg-white/[0.02]`}>
             <span className="text-xl">
               {archetypes.find(a => a.id === npc.sexualArchetype)?.icon || '❓'}
             </span>
             <div className="flex flex-col">
               <span className="text-[8px] text-neutral-600 font-black uppercase tracking-widest mb-0.5">Hồ sơ kiến thức:</span>
               <span className="text-xs font-black text-white uppercase tracking-tight italic">
                 {npc.sexualArchetype || 'Chưa xác định'}
               </span>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const NpcLogsWidget: React.FC<{ 
  npc: Relationship,
  isEditing?: boolean,
  onUpdateNpc?: (npc: Relationship) => void
}> = ({ npc, isEditing, onUpdateNpc }) => {
  const handleChange = (field: keyof Relationship, value: any) => {
    if (onUpdateNpc) {
      const newLastChanges = { ...(npc.lastChanges || {}) };
      delete newLastChanges[field];
      onUpdateNpc({ ...npc, [field]: value, lastChanges: newLastChanges });
    }
  };

  return (
    <div className="p-4 bg-amber-500/[0.03] border border-amber-500/10 rounded-sm mono space-y-4 shadow-xl shrink-0">
      <div className="space-y-2">
        <div className="flex items-center justify-between border-b border-amber-600/20 pb-1">
          <div className="flex items-center gap-1">
            <h3 className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Sự Kiện Đã Chứng Kiến</h3>
            {npc.newFields?.includes('witnessedEvents') && <NewIndicator />}
          </div>
          <LockToggle fieldKey="witnessedEvents" npc={npc} onUpdateNpc={onUpdateNpc} />
        </div>
        <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar pr-1">
          {isEditing ? (
            <textarea 
              value={Array.isArray(npc.witnessedEvents) ? npc.witnessedEvents.join('\n') : ''} 
              onChange={(e) => handleChange('witnessedEvents', e.target.value.split('\n').filter(s => s.trim()))}
              className="w-full bg-transparent text-[11px] text-amber-200/60 font-bold outline-none resize-none border border-amber-500/20 p-1"
              rows={3}
              placeholder="Mỗi sự kiện một dòng"
            />
          ) : (
            Array.isArray(npc.witnessedEvents) && npc.witnessedEvents.length ? npc.witnessedEvents.map((ev, i) => (
              <div key={i} className="text-[11px] text-amber-200/60 font-bold leading-tight border-l-2 border-amber-500/30 pl-2 py-1.5 bg-white/[0.02] rounded-r-sm hover:bg-white/[0.04]">
                {toSentenceCase(ev)}
              </div>
            )) : <div className="text-[9px] text-neutral-800 font-black italic p-2">TRỐNG</div>
          )}
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between border-b border-cyan-600/20 pb-1">
          <div className="flex items-center gap-1">
            <h3 className="text-[9px] font-black text-cyan-600 uppercase tracking-widest">Kiến Thức Đã Biết</h3>
            {npc.newFields?.includes('knowledgeBase') && <NewIndicator />}
          </div>
          <LockToggle fieldKey="knowledgeBase" npc={npc} onUpdateNpc={onUpdateNpc} />
        </div>
        <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar pr-1">
          {isEditing ? (
            <textarea 
              value={Array.isArray(npc.knowledgeBase) ? npc.knowledgeBase.join('\n') : ''} 
              onChange={(e) => handleChange('knowledgeBase', e.target.value.split('\n').filter(s => s.trim()))}
              className="w-full bg-transparent text-[11px] text-cyan-200/60 font-bold outline-none resize-none border border-cyan-500/20 p-1"
              rows={3}
              placeholder="Mỗi kiến thức một dòng"
            />
          ) : (
            Array.isArray(npc.knowledgeBase) && npc.knowledgeBase.length ? npc.knowledgeBase.map((kn, i) => (
              <div key={i} className="text-[11px] text-cyan-200/60 font-bold leading-tight border-l-2 border-cyan-500/30 pl-2 py-1.5 bg-white/[0.02] rounded-r-sm hover:bg-white/[0.04]">
                 {toSentenceCase(kn)}
              </div>
            )) : <div className="text-[9px] text-neutral-800 font-black italic p-2">TRỐNG</div>
          )}
        </div>
      </div>
    </div>
  );
};
