
import React from 'react';
import { Relationship, BodyDescription, NpcCondition } from '../types';
import { renderSafeText, toSentenceCase, DiffValue, LockToggle } from './NpcProfileBase';
import { NewIndicator } from './NewIndicator';

const formatBiometric = (value: any, unit: string): string => {
  const safe = renderSafeText(value, '---');
  if (safe === '---') return safe;
  if (/[a-zA-Z]/.test(safe)) return safe;
  return `${safe}${unit}`;
};

export const NpcPhysicalColumn: React.FC<{ 
  npc: Relationship, 
  themeColor: string,
  isEditing?: boolean,
  onUpdateNpc?: (npc: Relationship) => void
}> = ({ npc, themeColor, isEditing, onUpdateNpc }) => {
  const bd = npc.bodyDescription || {};

  const handleChange = (field: keyof BodyDescription, value: string) => {
    if (onUpdateNpc) {
      const newLastChanges = { ...(npc.lastChanges || {}) };
      delete newLastChanges[`body_${field}`];
      // Handle special biometric keys
      if (field === 'measurements') delete newLastChanges['body_measurements'];
      if (field === 'height') delete newLastChanges['body_height'];
      if (field === 'weight') delete newLastChanges['body_weight'];

      onUpdateNpc({
        ...npc,
        bodyDescription: {
          ...bd,
          [field]: value
        },
        lastChanges: newLastChanges
      });
    }
  };

  const bodyGroups = [
    { title: "Thần Kinh & Khuôn Mặt", items: [{ l: "Tóc", k: "hair" }, { l: "Mặt", k: "face" }, { l: "Mắt", k: "eyes" }, { l: "Tai", k: "ears" }, { l: "Môi", k: "lips" }] },
    { title: "Khung Thân Trên", items: [{ l: "Vóc dáng", k: "torso" }, { l: "Vai", k: "shoulders" }, { l: "Cổ", k: "neck" }, { l: "Vú", k: "breasts" }, { l: "Núm vú", k: "nipples" }, { l: "Rãnh ngực", k: "cleavage" }] },
    { title: "Vùng Eo & Trung Tâm", items: [{ l: "Eo", k: "waist" }, { l: "Hông", k: "hips" }, { l: "Bụng", k: "abdomen" }, { l: "Rốn", k: "navel" }, { l: "Lưng", k: "back" }] },
    { title: "Hệ Vận Động", items: [{ l: "Tứ chi", k: "limbs" }, { l: "Mông", k: "buttocks" }, { l: "Đùi", k: "thighs" }, { l: "Chân", k: "legs" }, { l: "Bàn tay", k: "hands" }, { l: "Bàn chân", k: "feet" }] },
    { title: "Bề Mặt & Mùi Hương", items: [{ l: "Làn da", k: "skin" }, { l: "Mùi hương", k: "scent" }] }
  ];

  return (
    <div className="p-4 bg-[#050505] border border-white/10 rounded-sm mono shadow-2xl relative shrink-0">
      <div className={`absolute top-0 left-0 w-1 h-full bg-${themeColor}-500/20`}></div>
      <div className="flex justify-between items-center mb-3 px-1">
        <div className="flex items-center gap-2">
          <h3 className={`text-[10px] font-black text-${themeColor}-500 uppercase tracking-widest`}>Báo Cáo Quét Hình Thể</h3>
          <LockToggle fieldKey="bodyDescription" npc={npc} onUpdateNpc={onUpdateNpc} />
        </div>
        <div className="flex gap-1">
          <div className="w-4 h-1 bg-white/10"></div>
          <div className="w-2 h-1 bg-emerald-500"></div>
        </div>
      </div>
      
      <div className="bg-white/[0.02] p-2.5 rounded-sm border border-white/5 mb-3 relative overflow-hidden">
        <div className="absolute top-1 right-1 w-6 h-6 border-r border-t border-white/10"></div>
        
        <div className="flex items-baseline justify-between gap-2 overflow-hidden">
          <div className="flex items-baseline gap-2 min-w-0 flex-grow">
            {isEditing ? (
              <input 
                value={bd.measurements || ''} 
                onChange={(e) => handleChange('measurements', e.target.value)}
                className="bg-transparent text-[18px] font-black tracking-tighter text-white outline-none border-b border-white/10 w-full"
                placeholder="Số đo (e.g. 90-60-90)"
              />
            ) : (
              <div className="flex items-center gap-1">
                <DiffValue fieldKey="body_measurements" current={bd.measurements} lastChanges={npc.lastChanges} color="text-white" className="text-[18px] font-black tracking-tighter" />
                {npc.newFields?.includes('body_measurements') && <NewIndicator />}
              </div>
            )}
            <LockToggle fieldKey="body_measurements" npc={npc} onUpdateNpc={onUpdateNpc} />
          </div>
          
          <div className="flex items-center gap-3 shrink-0 bg-black/40 px-3 py-1 rounded-sm border border-white/5">
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1">
                {npc.newFields?.includes('body_height') && <NewIndicator />}
                <span className="text-[7px] text-neutral-600 font-black uppercase tracking-tighter leading-none">Height</span>
                <LockToggle fieldKey="body_height" npc={npc} onUpdateNpc={onUpdateNpc} />
              </div>
              {isEditing ? (
                <input 
                  value={bd.height || ''} 
                  onChange={(e) => handleChange('height', e.target.value)}
                  className="bg-transparent text-[11px] text-emerald-400 font-black outline-none w-12 text-right"
                />
              ) : (
                <DiffValue fieldKey="body_height" current={formatBiometric(bd.height, 'cm')} lastChanges={npc.lastChanges} color="text-emerald-400" className="text-[11px]" />
              )}
            </div>
            <div className="w-px h-4 bg-white/10"></div>
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1">
                {npc.newFields?.includes('body_weight') && <NewIndicator />}
                <span className="text-[7px] text-neutral-600 font-black uppercase tracking-tighter leading-none">Weight</span>
                <LockToggle fieldKey="body_weight" npc={npc} onUpdateNpc={onUpdateNpc} />
              </div>
              {isEditing ? (
                <input 
                  value={bd.weight || ''} 
                  onChange={(e) => handleChange('weight', e.target.value)}
                  className="bg-transparent text-[11px] text-blue-400 font-black outline-none w-12 text-right"
                />
              ) : (
                <DiffValue fieldKey="body_weight" current={formatBiometric(bd.weight, 'kg')} lastChanges={npc.lastChanges} color="text-blue-400" className="text-[11px]" />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {bodyGroups.map((group, idx) => {
          const activeItems = isEditing ? group.items : group.items.filter(i => (bd as any)[i.k] && (bd as any)[i.k] !== '');
          if (!activeItems.length) return null;
          return (
            <div key={idx} className="group/sec">
              <div className="flex items-center gap-2 mb-1 px-1 opacity-60">
                 <span className="text-[8px] font-black text-neutral-500 uppercase tracking-widest">{group.title}</span>
                 <div className="h-px flex-grow bg-white/5"></div>
              </div>
              <div className="space-y-1.5 px-1">
                {activeItems.map((item, i) => (
                  <div key={i} className="flex flex-col gap-0.5 border-l border-white/5 pl-2 group-hover/sec:border-emerald-500/30 transition-all relative">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className={`text-[9px] font-black uppercase tracking-tighter text-${themeColor}-600/80`}>{item.l}</span>
                        {npc.newFields?.includes(`body_${item.k}`) && <NewIndicator />}
                      </div>
                      <LockToggle fieldKey={`body_${item.k}`} npc={npc} onUpdateNpc={onUpdateNpc} />
                    </div>
                    {isEditing ? (
                      <input 
                        value={(bd as any)[item.k] || ''} 
                        onChange={(e) => handleChange(item.k as keyof BodyDescription, e.target.value)}
                        className="bg-transparent text-[13px] font-bold text-neutral-300 outline-none border-b border-white/5 focus:border-white/20 w-full"
                      />
                    ) : (
                      <DiffValue fieldKey={`body_${item.k}`} current={(bd as any)[item.k]} lastChanges={npc.lastChanges} color="text-neutral-300" className="text-[13px] font-bold leading-tight" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const NpcPrivateWidget: React.FC<{ 
  npc: Relationship,
  isEditing?: boolean,
  onUpdateNpc?: (npc: Relationship) => void
}> = ({ npc, isEditing, onUpdateNpc }) => {
  const bd = npc.bodyDescription || {};

  const handleChange = (field: keyof BodyDescription, value: string) => {
    if (onUpdateNpc) {
      const newLastChanges = { ...(npc.lastChanges || {}) };
      delete newLastChanges[`body_${field}`];

      onUpdateNpc({
        ...npc,
        bodyDescription: {
          ...bd,
          [field]: value
        },
        lastChanges: newLastChanges
      });
    }
  };

  const allItems = [
    { l: "Gò mu", k: "monsPubis" }, { l: "Lông mu", k: "pubicHair" }, 
    { l: "Môi vùng kín", k: "labia" }, { l: "Hạt le", k: "clitoris" }, 
    { l: "Màng trinh", k: "hymen" }, { l: "Hậu môn", k: "anus" }
  ];
  const items = isEditing ? allItems : allItems.filter(i => (bd as any)[i.k] && (bd as any)[i.k] !== '');

  if (!items.length && !bd.genitals && !bd.internal && !isEditing) return null;

  return (
    <div className="p-4 bg-rose-500/15 border-2 border-rose-500/50 rounded-sm mono shadow-[0_0_30px_rgba(244,63,94,0.15)] relative overflow-hidden shrink-0 min-h-[120px] animate-in fade-in duration-700">
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-rose-500 to-transparent shadow-[0_0_10px_#f43f5e]"></div>
      <div className="absolute -right-4 -top-4 text-4xl opacity-10 rotate-12 font-black select-none text-rose-900">TRUY CẬP HẠN CHẾ</div>
      <h3 className="text-[12px] font-black text-rose-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
        <span className="w-2.5 h-2.5 bg-rose-500 animate-ping rounded-full shadow-[0_0_12px_#f43f5e]"></span> Cảm Biến Vùng Kín
      </h3>
      
      <div className="space-y-3">
        {(bd.genitals || isEditing) && (
          <div className="bg-black/60 p-2 border-l-2 border-rose-500/40 rounded-r-sm">
             <div className="flex items-center justify-between mb-1">
               <div className="flex items-center gap-1">
                 <span className="block text-[8px] text-rose-600 font-black uppercase">Tổng Quan Thị Giác</span>
                 {npc.newFields?.includes('body_genitals') && <NewIndicator />}
               </div>
               <LockToggle fieldKey="body_genitals" npc={npc} onUpdateNpc={onUpdateNpc} />
             </div>
             {isEditing ? (
               <textarea 
                 value={bd.genitals || ''} 
                 onChange={(e) => handleChange('genitals', e.target.value)}
                 className="w-full bg-transparent text-[13px] text-rose-100 italic outline-none resize-none border-b border-rose-500/20"
                 rows={2}
               />
             ) : (
               <DiffValue fieldKey="body_genitals" current={bd.genitals} lastChanges={npc.lastChanges} color="text-rose-100" className="text-[13px] italic" />
             )}
          </div>
        )}
        
        <div className="grid grid-cols-1 gap-1.5">
          {items.map((item, i) => (
            <div key={i} className="flex flex-col p-1.5 bg-black/20 border border-white/5 rounded-sm">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-rose-600 font-black uppercase tracking-tighter">{item.l}</span>
                <LockToggle fieldKey={`body_${item.k}`} npc={npc} onUpdateNpc={onUpdateNpc} />
              </div>
              {isEditing ? (
                <input 
                  value={(bd as any)[item.k] || ''} 
                  onChange={(e) => handleChange(item.k as keyof BodyDescription, e.target.value)}
                  className="bg-transparent text-xs text-rose-200/80 outline-none border-b border-rose-500/10 w-full"
                />
              ) : (
                <DiffValue fieldKey={`body_${item.k}`} current={(bd as any)[item.k]} lastChanges={npc.lastChanges} color="text-rose-200/80" className="text-xs" />
              )}
            </div>
          ))}
        </div>

        {(bd.internal || isEditing) && (
          <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-sm">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1">
                <span className="text-[9px] text-rose-400 font-black uppercase block">Cấu Trúc Nội Thể</span>
                {npc.newFields?.includes('body_internal') && <NewIndicator />}
              </div>
              <LockToggle fieldKey="body_internal" npc={npc} onUpdateNpc={onUpdateNpc} />
            </div>
            {isEditing ? (
               <textarea 
                 value={bd.internal || ''} 
                 onChange={(e) => handleChange('internal', e.target.value)}
                 className="w-full bg-transparent text-xs text-rose-50 font-black italic outline-none resize-none border-b border-rose-500/20"
                 rows={2}
               />
             ) : (
               <DiffValue fieldKey="body_internal" current={bd.internal} lastChanges={npc.lastChanges} color="text-rose-50" className="text-xs italic" />
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export const NpcFashionWidget: React.FC<{ 
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
    <div className="p-4 bg-fuchsia-500/[0.03] border border-fuchsia-500/20 rounded-sm mono shadow-lg shrink-0">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[10px] font-black text-fuchsia-400 uppercase tracking-widest flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-fuchsia-500 rotate-45 shadow-[0_0_5px_currentColor]"></span> Đồng Bộ Thẩm Mỹ
        </h3>
      </div>
      <div className="space-y-2">
        <div className="p-2 bg-black/40 border-l-2 border-fuchsia-500/40 rounded-r-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="text-[8px] text-fuchsia-600 font-black uppercase">Trang Phục Hiện Tại</span>
              {npc.newFields?.includes('currentOutfit') && <NewIndicator />}
            </div>
            <LockToggle fieldKey="currentOutfit" npc={npc} onUpdateNpc={onUpdateNpc} />
          </div>
          {isEditing ? (
            <input 
              value={npc.currentOutfit || ''} 
              onChange={(e) => handleChange('currentOutfit', e.target.value)}
              className="w-full bg-transparent text-[13px] text-white outline-none border-b border-fuchsia-500/20"
            />
          ) : (
            <DiffValue fieldKey="currentOutfit" current={npc.currentOutfit} lastChanges={npc.lastChanges} color="text-white" className="text-[13px] mt-1" />
          )}
        </div>
        <div className="p-2 bg-black/20 border border-white/5 rounded-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="text-[8px] text-neutral-600 font-black uppercase italic">Phân Tích Gu Mặc</span>
              {npc.newFields?.includes('fashionStyle') && <NewIndicator />}
            </div>
            <LockToggle fieldKey="fashionStyle" npc={npc} onUpdateNpc={onUpdateNpc} />
          </div>
          {isEditing ? (
            <input 
              value={npc.fashionStyle || ''} 
              onChange={(e) => handleChange('fashionStyle', e.target.value)}
              className="w-full bg-transparent text-[11px] text-neutral-400 outline-none border-b border-white/10"
            />
          ) : (
            <DiffValue fieldKey="fashionStyle" current={npc.fashionStyle} lastChanges={npc.lastChanges} color="text-neutral-400" className="text-[11px] mt-0.5" />
          )}
        </div>
      </div>
    </div>
  );
};

export const NpcPhysiologyWidget: React.FC<{ 
  npc: Relationship,
  isEditing?: boolean,
  onUpdateNpc?: (npc: Relationship) => void
}> = ({ npc, isEditing, onUpdateNpc }) => {
  const bd = npc.bodyDescription || {};
  
  const handleChange = (field: keyof Relationship, value: any) => {
    if (onUpdateNpc) {
      const newLastChanges = { ...(npc.lastChanges || {}) };
      delete newLastChanges[field];
      onUpdateNpc({ ...npc, [field]: value, lastChanges: newLastChanges });
    }
  };

  const handleBodyChange = (field: keyof BodyDescription, value: string) => {
    if (onUpdateNpc) {
      const newLastChanges = { ...(npc.lastChanges || {}) };
      delete newLastChanges[`body_${field}`];
      onUpdateNpc({
        ...npc,
        bodyDescription: {
          ...bd,
          [field]: value
        },
        lastChanges: newLastChanges
      });
    }
  };

  const handleConditionChange = (idx: number, field: keyof NpcCondition, value: string) => {
    if (onUpdateNpc && Array.isArray(npc.conditions)) {
      const newConditions = [...npc.conditions];
      newConditions[idx] = { ...newConditions[idx], [field]: value };
      onUpdateNpc({ ...npc, conditions: newConditions });
    }
  };

  const addCondition = () => {
    if (onUpdateNpc) {
      const newConditions = Array.isArray(npc.conditions) ? [...npc.conditions] : [];
      newConditions.push({ name: 'Trạng thái mới', type: 'temporary', description: 'Mô tả...' });
      onUpdateNpc({ ...npc, conditions: newConditions });
    }
  };

  const removeCondition = (idx: number) => {
    if (onUpdateNpc && Array.isArray(npc.conditions)) {
      onUpdateNpc({ ...npc, conditions: npc.conditions.filter((_, i) => i !== idx) });
    }
  };

  const rawConditions = Array.isArray(npc.conditions) ? npc.conditions : [];
  
  const filteredConditions = rawConditions.filter(c => 
    isEditing || (c.name && c.name.trim() !== '') || (c.description && c.description.trim() !== '')
  );

  return (
    <div className="p-4 bg-indigo-500/[0.03] border border-indigo-500/20 rounded-sm mono shadow-lg shrink-0">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span> Trạng Thái Cơ Thể
        </h3>
        <div className="flex items-center gap-2">
          {isEditing && (
            <button onClick={addCondition} className="text-[9px] font-black text-emerald-500 uppercase hover:text-emerald-400 transition-colors">
              [+] THÊM
            </button>
          )}
          <LockToggle fieldKey="conditions" npc={npc} onUpdateNpc={onUpdateNpc} />
        </div>
      </div>

      <div className="space-y-1.5">
        {/* Trường Trinh Tiết luôn tồn tại ở đầu */}
        <div className="p-2 rounded-sm border bg-indigo-500/10 border-indigo-500/30 flex flex-col gap-1">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-black uppercase text-indigo-300">Trinh Tiết</span>
              {npc.newFields?.includes('body_virginity') && <NewIndicator />}
            </div>
            <LockToggle fieldKey="body_virginity" npc={npc} onUpdateNpc={onUpdateNpc} />
          </div>
          {isEditing ? (
            <select 
              value={bd.virginity || 'Không Rõ'} 
              onChange={(e) => handleBodyChange('virginity', e.target.value)}
              className="bg-black text-[11px] text-indigo-200 font-bold italic outline-none border-b border-indigo-500/20 w-full py-0.5"
            >
              <option value="Còn Trinh">Còn Trinh</option>
              <option value="Mất Trinh">Mất Trinh</option>
              <option value="Không Rõ">Không Rõ</option>
            </select>
          ) : (
            <DiffValue fieldKey="body_virginity" current={bd.virginity || 'Không Rõ'} lastChanges={npc.lastChanges} color="text-indigo-200" className="text-[11px] font-bold italic" />
          )}
        </div>

        {filteredConditions.map((c, i) => (
          <div key={i} className={`p-2 rounded-sm border flex flex-col gap-1 ${c.type === 'permanent' ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-rose-500/10 border-rose-500/30 animate-[pulse_2s_infinite]'}`}>
            <div className="flex justify-between items-center">
              {isEditing ? (
                <div className="flex items-center gap-2 flex-grow">
                  <input 
                    value={c.name} 
                    onChange={(e) => handleConditionChange(i, 'name', e.target.value)}
                    className={`bg-transparent text-[10px] font-black uppercase outline-none border-b border-white/10 flex-grow ${c.type === 'permanent' ? 'text-indigo-300' : 'text-rose-300'}`}
                  />
                  <select 
                    value={c.type} 
                    onChange={(e) => handleConditionChange(i, 'type', e.target.value as any)}
                    className="bg-black text-[7px] px-1 rounded-sm text-neutral-500 font-black outline-none"
                  >
                    <option value="temporary">TẠM THỜI</option>
                    <option value="permanent">VĨNH VIỄN</option>
                  </select>
                  <button onClick={() => removeCondition(i)} className="text-rose-500 text-[10px] font-black hover:text-rose-400">×</button>
                </div>
              ) : (
                <>
                  <span className={`text-[10px] font-black uppercase ${c.type === 'permanent' ? 'text-indigo-300' : 'text-rose-300'}`}>{toSentenceCase(c.name, 'Trạng thái không tên')}</span>
                  <span className="text-[7px] px-1 bg-black/40 rounded-sm text-neutral-500 font-black">{c.type === 'permanent' ? 'VĨNH VIỄN' : 'TẠM THỜI'}</span>
                </>
              )}
            </div>
            {isEditing ? (
              <input 
                value={c.description} 
                onChange={(e) => handleConditionChange(i, 'description', e.target.value)}
                className="bg-transparent text-[11px] text-neutral-400 font-bold leading-tight italic outline-none border-b border-white/5"
              />
            ) : (
              <span className="text-[11px] text-neutral-400 font-bold leading-tight italic">"{toSentenceCase(c.description, '??')}"</span>
            )}
          </div>
        ))}
        {!filteredConditions.length && !isEditing && (
          <div className="text-[10px] text-neutral-800 font-black text-center py-3 uppercase border border-dashed border-white/5">??</div>
        )}
      </div>
    </div>
  );
};
