
import React from 'react';
import { Identity, IdentityType } from '../types';
import { NewIndicator } from './NewIndicator';

interface IdentityPanelProps {
  identities: Identity[];
  isEditing: boolean;
  onUpdate: (identities: Identity[]) => void;
  title?: string;
  isLocked?: boolean;
  onToggleLock?: () => void;
}

export const IdentityPanel: React.FC<IdentityPanelProps> = ({ 
  identities, 
  isEditing, 
  onUpdate,
  title = "Vạn Giới Thân Phận",
  isLocked,
  onToggleLock
}) => {
  const isNpc = title !== "Vạn Giới Thân Phận" || identities.length === 0; // Simple heuristic or we could pass a prop

  const handleAddIdentity = () => {
    const newIdentity: Identity = {
      name: '',
      role: '',
      description: '',
      isRevealed: false,
      type: IdentityType.NORMAL
    };
    onUpdate([...identities, newIdentity]);
  };

  const handleUpdateIdentity = (index: number, updates: Partial<Identity>) => {
    const next = [...identities];
    next[index] = { ...next[index], ...updates };
    onUpdate(next);
  };

  const handleRemoveIdentity = (index: number) => {
    const next = identities.filter((_, i) => i !== index);
    onUpdate(next);
  };

  return (
    <div className="flex flex-col shrink-0 bg-black/60 border border-amber-500/30 rounded-sm overflow-hidden group hover:border-amber-500/50 transition-all shadow-2xl">
      <div className="p-2.5 border-b border-amber-500/20 bg-amber-500/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-amber-500 text-xs">🎭</span>
          <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{title}</h3>
          {title === "Vạn Giới Thân Phận" && identities.some((_, i) => i === identities.length - 1) && <NewIndicator />} 
          {onToggleLock && (
            <button 
              onClick={(e) => { e.stopPropagation(); onToggleLock(); }}
              className={`ml-1 transition-all ${isLocked ? 'text-amber-500' : 'text-neutral-700 hover:text-neutral-500'}`}
              title={isLocked ? "Đã khóa - AI không thể thay đổi" : "Chưa khóa - AI có thể thay đổi"}
            >
              {isLocked ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
              )}
            </button>
          )}
        </div>
        {isEditing && (
          <button 
            onClick={handleAddIdentity}
            className="text-[8px] font-black uppercase bg-amber-500 text-black px-2 py-0.5 rounded-sm hover:bg-amber-400 transition-colors"
          >
            + THÊM MỚI
          </button>
        )}
      </div>

      <div className="flex-grow overflow-y-auto custom-scrollbar p-2 space-y-2">
        {identities.length > 0 ? (
          identities.map((identity, idx) => (
            <div 
              key={idx} 
              className={`p-2 rounded-sm border transition-all relative group/item ${
                identity.isRevealed 
                  ? 'bg-rose-500/5 border-rose-500/20 hover:border-rose-500/40' 
                  : 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40'
              }`}
            >
              {isEditing ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <select 
                      value={identity.type || IdentityType.NORMAL}
                      onChange={(e) => handleUpdateIdentity(idx, { type: e.target.value as IdentityType })}
                      className="bg-black/60 border border-white/10 text-[8px] text-amber-500 font-black uppercase outline-none px-1 py-0.5 rounded-sm"
                    >
                      {Object.values(IdentityType).map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <input 
                      value={identity.name} 
                      onChange={(e) => handleUpdateIdentity(idx, { name: e.target.value })}
                      className="flex-grow bg-black/40 border border-white/10 text-[10px] text-white font-black uppercase outline-none px-1.5 py-0.5"
                      placeholder="Tên thân phận..."
                    />
                  </div>
                  <input 
                    value={identity.role} 
                    onChange={(e) => handleUpdateIdentity(idx, { role: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 text-[9px] text-white/60 font-black uppercase outline-none px-1.5 py-0.5"
                    placeholder="Vai trò / Vị thế..."
                  />
                  <textarea 
                    value={identity.description} 
                    onChange={(e) => handleUpdateIdentity(idx, { description: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 text-[9px] text-white/40 font-black outline-none px-1.5 py-0.5 resize-none"
                    rows={2}
                    placeholder="Mô tả chi tiết về thân phận này..."
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleUpdateIdentity(idx, { isRevealed: !identity.isRevealed })}
                        className={`text-[7px] font-black uppercase px-2 py-0.5 rounded-full border transition-all ${
                          identity.isRevealed 
                            ? 'bg-rose-500 text-black border-rose-400' 
                            : 'bg-amber-500 text-black border-amber-400'
                        }`}
                      >
                        {identity.isRevealed ? 'ĐÃ BỊ LỘ' : 'ĐANG ẨN MÌNH'}
                      </button>
                      <button 
                        onClick={() => handleRemoveIdentity(idx)}
                        className="flex items-center gap-1 px-2 py-0.5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-black rounded-sm transition-all text-[7px] font-black uppercase border border-rose-500/20"
                        title="Xóa thân phận ngay lập tức"
                      >
                        <span>✕</span>
                        <span>XÓA BẢN THỂ</span>
                      </button>
                    </div>
                    <span className="text-[6px] text-neutral-600 font-black uppercase italic">ID: {idx + 1}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[6px] font-black uppercase px-1 py-0.5 rounded-sm border ${
                        identity.type === IdentityType.FANFIC ? 'bg-purple-500/20 border-purple-500/40 text-purple-400' :
                        identity.type === IdentityType.DESTINY ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' :
                        identity.type === IdentityType.LEGENDARY ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400' :
                        'bg-white/5 border-white/10 text-white/40'
                      }`}>
                        {identity.type || IdentityType.NORMAL}
                      </span>
                      <h4 className="text-[11px] text-white font-black uppercase tracking-tight">
                        {identity.name || "Ẩn Danh"}
                      </h4>
                    </div>
                    {identity.isRevealed && (
                      <span className="text-[6px] font-black uppercase bg-rose-500/20 text-rose-500 border border-rose-500/30 px-1 rounded-sm animate-pulse">EXPOSED</span>
                    )}
                  </div>
                  <p className="text-[9px] text-amber-500/60 font-black uppercase italic">
                    {identity.role || "Chưa xác định vai trò"}
                  </p>
                  <p className="text-[9px] text-white/40 font-black leading-tight mt-1 line-clamp-2 italic">
                    {identity.description || "Không có dữ liệu bổ sung."}
                  </p>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-10 px-4">
            <div className="relative mb-3">
              <span className="text-3xl opacity-20">🎭</span>
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full animate-ping opacity-40"></div>
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-500/40 text-center">Dữ Liệu Thân Phận Trống</span>
            <span className="text-[7px] text-neutral-600 font-bold uppercase mt-2 text-center leading-relaxed">
              Thực thể này hiện chỉ tồn tại với một bản thể duy nhất trong dòng thời gian hiện tại
            </span>
            {isEditing && (
              <button 
                onClick={handleAddIdentity}
                className="mt-4 text-[8px] font-black uppercase bg-amber-500/10 text-amber-500 border border-amber-500/30 px-4 py-2 rounded-sm hover:bg-amber-500 hover:text-black transition-all"
              >
                + KHỞI TẠO THÂN PHẬN MỚI
              </button>
            )}
          </div>
        )}
      </div>
      
      <div className="p-1.5 bg-black/20 border-t border-white/5 flex justify-between items-center shrink-0">
        <span className="text-[6px] text-neutral-600 font-black uppercase tracking-tighter">Identity_Matrix_v2.0</span>
        <div className="flex gap-1">
          <div className="w-1 h-1 rounded-full bg-amber-500/20"></div>
          <div className="w-1 h-1 rounded-full bg-amber-500/40"></div>
          <div className="w-1 h-1 rounded-full bg-amber-500/60"></div>
        </div>
      </div>
    </div>
  );
};
