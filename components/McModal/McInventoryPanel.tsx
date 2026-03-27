
import { InventoryItem } from '../../types';
import { InspectType } from './McInspector';

interface McInventoryPanelProps {
  inventory: InventoryItem[];
  onInspect: (data: { name: string; type: InspectType; description?: string }) => void;
  isEditing?: boolean;
  onUpdatePlayer?: (player: any) => void;
  isLocked?: boolean;
  onToggleLock?: () => void;
}

export const McInventoryPanel: React.FC<McInventoryPanelProps> = ({ 
  inventory, 
  onInspect, 
  isEditing, 
  onUpdatePlayer,
  isLocked,
  onToggleLock
}) => {
  const handleInventoryChange = (text: string) => {
    if (onUpdatePlayer) {
      const lines = text.split('\n').filter(s => s.trim());
      const newInventory = lines.map(line => {
        const [name, ...descParts] = line.split('|');
        return {
          name: name.trim(),
          description: descParts.join('|').trim() || "Vật thể mang năng lượng tích hợp. Có thể sử dụng để thay đổi trạng thái bản thân hoặc tương tác với các thực thể khác trong Matrix."
        };
      });
      onUpdatePlayer({ inventory: newInventory });
    }
  };

  const handleAddItem = () => {
    if (onUpdatePlayer) {
      onUpdatePlayer({ inventory: [...(inventory || []), { name: 'VẬT PHẨM MỚI', description: '' }] });
    }
  };

  const handleUpdateItem = (index: number, updates: Partial<InventoryItem>) => {
    if (onUpdatePlayer) {
      const newInventory = [...(inventory || [])];
      newInventory[index] = { ...newInventory[index], ...updates };
      onUpdatePlayer({ inventory: newInventory });
    }
  };

  const handleRemoveItem = (index: number) => {
    if (onUpdatePlayer) {
      const newInventory = (inventory || []).filter((_, i) => i !== index);
      onUpdatePlayer({ inventory: newInventory });
    }
  };

  return (
    <section className="p-3 bg-[#0a0a0a] border border-white/10 rounded-sm space-y-3 h-full shadow-xl mono">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <span className="text-emerald-500 text-[10px] font-black uppercase tracking-widest">❯ TÚI ĐỒ / VẬT PHẨM</span>
        {onToggleLock && (
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleLock(); }}
            className={`ml-1 p-1.5 transition-all hover:scale-110 active:scale-90 ${isLocked ? 'text-amber-500' : 'text-neutral-700 hover:text-neutral-500'}`}
            title={isLocked ? "Đã khóa - AI không thể thay đổi" : "Chưa khóa - AI có thể thay đổi"}
          >
            {isLocked ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
            )}
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 gap-1.5 overflow-y-auto max-h-[450px] custom-scrollbar pr-1">
        <span className="text-[8px] text-neutral-600 font-black uppercase px-1 italic">Vật dụng, công cụ, giấy tờ, trang bị:</span>
        {isEditing ? (
          <div className="space-y-2">
            {inventory && inventory.length > 0 ? inventory.map((item, i) => (
              <div key={i} className="bg-black/40 p-2 border border-white/10 rounded-sm space-y-1 relative group">
                <button 
                  onClick={() => handleRemoveItem(i)}
                  className="absolute top-1 right-1 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >✕</button>
                <input 
                  value={item?.name || ''}
                  onChange={(e) => handleUpdateItem(i, { name: e.target.value })}
                  className="w-full bg-transparent text-[10px] font-black text-emerald-500 uppercase outline-none border-b border-white/5"
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
              className="w-full py-2 bg-emerald-500/10 border border-dashed border-emerald-500/30 rounded-sm text-[9px] font-black text-emerald-500 uppercase hover:bg-emerald-500/20 transition-all"
            >
              + THÊM VẬT PHẨM
            </button>
            <div className="pt-2 border-t border-white/5">
              <span className="text-[7px] text-neutral-600 font-black uppercase block mb-1">Nhập nhanh (Tên | Mô tả):</span>
              <textarea 
                defaultValue={inventory && inventory.length > 0 ? inventory.map(i => `${i?.name || 'Vô danh'} | ${i?.description || ''}`).join('\n') : ''}
                onBlur={(e) => handleInventoryChange(e.target.value)}
                className="w-full bg-black/40 text-[9px] p-2 border border-white/5 rounded-sm text-neutral-500 outline-none resize-none"
                rows={3}
                placeholder="Tên | Mô tả (Mỗi vật phẩm một dòng)"
              />
            </div>
          </div>
        ) : (
          inventory && inventory.length > 0 ? inventory.map((item, i) => (
            <button 
              key={i} 
              onClick={() => onInspect({ name: item.name, type: 'item', description: item.description })}
              className="text-left text-[10px] p-2.5 bg-white/[0.03] border border-white/10 rounded-sm text-neutral-400 flex items-center gap-3 group hover:text-white hover:border-emerald-500/30 hover:bg-white/5 transition-all"
            >
              <span className="text-emerald-500 opacity-40 shrink-0 group-hover:opacity-100 group-hover:rotate-12 transition-all">📦</span>
              <span className="font-bold uppercase tracking-tight truncate flex-grow leading-tight">{item.name}</span>
              <span className="text-[7px] font-black opacity-0 group-hover:opacity-100 transition-opacity">SCAN</span>
            </button>
          )) : <div className="py-10 text-center border border-dashed border-white/10 rounded-sm opacity-10 italic text-[9px] font-black uppercase">Buffer_Empty</div>
        )}
      </div>
    </section>
  );
};
