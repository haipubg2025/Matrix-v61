
import { Asset } from '../../types';
import { InspectType } from './McInspector';

interface McAssetPanelProps {
  gold: number;
  assets: Asset[];
  onInspect: (data: { name: string; type: InspectType; description?: string }) => void;
  isEditing?: boolean;
  onUpdatePlayer?: (player: any) => void;
  player?: any;
  onToggleLock?: (field: string) => void;
}

export const McAssetPanel: React.FC<McAssetPanelProps> = ({ gold, assets, onInspect, isEditing, onUpdatePlayer, player, onToggleLock }) => {
  const handleGoldChange = (val: number) => {
    if (onUpdatePlayer) onUpdatePlayer({ gold: val });
  };

  const handleCurrencyChange = (val: string) => {
    if (onUpdatePlayer) onUpdatePlayer({ customCurrency: val });
  };

  const handleAssetsChange = (text: string) => {
    if (onUpdatePlayer) {
      const lines = text.split('\n').filter(s => s.trim());
      const newAssets = lines.map(line => {
        const [name, ...descParts] = line.split('|');
        return {
          name: name.trim(),
          description: descParts.join('|').trim() || "Thực thể sở hữu có giá trị kinh tế/vận mệnh cao. Đã được Quantum_Core xác thực tính chính danh và quyền kiểm soát tuyệt đối của chủ thể."
        };
      });
      onUpdatePlayer({ assets: newAssets });
    }
  };

  const handleAddAsset = () => {
    if (onUpdatePlayer) {
      onUpdatePlayer({ assets: [...(assets || []), { name: 'TÀI SẢN MỚI', description: '' }] });
    }
  };

  const handleUpdateAsset = (index: number, updates: Partial<Asset>) => {
    if (onUpdatePlayer) {
      const newAssets = [...(assets || [])];
      newAssets[index] = { ...newAssets[index], ...updates };
      onUpdatePlayer({ assets: newAssets });
    }
  };

  const handleRemoveAsset = (index: number) => {
    if (onUpdatePlayer) {
      const newAssets = (assets || []).filter((_, i) => i !== index);
      onUpdatePlayer({ assets: newAssets });
    }
  };

  const isGoldLocked = player?.lockedFields?.includes('gold');
  const isCurrencyLocked = player?.lockedFields?.includes('customCurrency');
  const isAssetsLocked = player?.lockedFields?.includes('assets');

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

  return (
    <section className="p-3 bg-emerald-500/[0.02] border border-emerald-500/20 rounded-sm space-y-3 h-full shadow-xl mono">
      <div className="flex justify-between items-center border-b border-emerald-500/10 pb-2">
         <div className="flex items-center gap-1">
           <span className="text-emerald-500 text-[10px] font-black uppercase tracking-widest">❯ TÀI SẢN</span>
           <LockIcon isLocked={isAssetsLocked} onClick={() => onToggleLock?.('assets')} />
         </div>
         <span className="text-[8px] text-emerald-700 font-bold uppercase mono italic bg-emerald-500/5 px-1.5 rounded-sm">SECURE_VAULT</span>
      </div>

      {/* Balance Section */}
      <div className="bg-black/20 p-2 rounded-sm border border-emerald-500/10 space-y-2">
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              {isEditing ? (
                <input 
                  value={player?.customCurrency || "Tiền mặt / Số dư"}
                  onChange={(e) => handleCurrencyChange(e.target.value)}
                  className="bg-transparent text-[7px] text-neutral-600 font-black uppercase tracking-widest outline-none border-b border-white/5 w-24"
                />
              ) : (
                <span className="text-[7px] text-neutral-600 font-black uppercase tracking-widest">
                  {player?.customCurrency || "Tiền mặt / Số dư"}
                </span>
              )}
              <LockIcon isLocked={isCurrencyLocked} onClick={() => onToggleLock?.('customCurrency')} />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-emerald-500 font-black text-sm">$</span>
              {isEditing ? (
                <input 
                  type="number"
                  value={gold}
                  onChange={(e) => handleGoldChange(parseInt(e.target.value) || 0)}
                  className="bg-transparent text-lg font-black text-white tabular-nums outline-none border-b border-emerald-500/20 w-32"
                />
              ) : (
                <span className="text-lg font-black text-white tabular-nums">
                  {gold.toLocaleString()}
                </span>
              )}
              <LockIcon isLocked={isGoldLocked} onClick={() => onToggleLock?.('gold')} />
            </div>
          </div>
          <div className="h-10 w-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 text-xl shadow-[0_0_15px_rgba(16,185,129,0.1)]">
            💰
          </div>
        </div>
      </div>

      <div className="space-y-1.5 flex-grow">
         <span className="text-[8px] text-neutral-600 font-black uppercase px-1 italic">Bất động sản, phương tiện, cổ phần, vật phẩm giá trị cao:</span>
         <div className="grid grid-cols-1 gap-1.5 max-h-[300px] overflow-y-auto custom-scrollbar">
            {isEditing ? (
              <div className="space-y-2">
                {assets && assets.length > 0 ? assets.map((asset, i) => (
                  <div key={i} className="bg-black/40 p-2 border border-emerald-500/20 rounded-sm space-y-1 relative group">
                    <button 
                      onClick={() => handleRemoveAsset(i)}
                      className="absolute top-1 right-1 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >✕</button>
                    <input 
                      value={asset.name}
                      onChange={(e) => handleUpdateAsset(i, { name: e.target.value })}
                      className="w-full bg-transparent text-[10px] font-black text-emerald-400 uppercase outline-none border-b border-emerald-500/10"
                      placeholder="Tên tài sản"
                    />
                    <textarea 
                      value={asset.description}
                      onChange={(e) => handleUpdateAsset(i, { description: e.target.value })}
                      className="w-full bg-transparent text-[9px] text-emerald-400/60 outline-none resize-none font-mono leading-tight"
                      rows={2}
                      placeholder="Mô tả"
                    />
                  </div>
                )) : (
                  <div className="text-center py-4 text-[8px] text-neutral-600 italic uppercase border border-dashed border-white/5">Trống</div>
                )}
                <button 
                  onClick={handleAddAsset}
                  className="w-full py-2 bg-emerald-500/10 border border-dashed border-emerald-500/30 rounded-sm text-[9px] font-black text-emerald-500 uppercase hover:bg-emerald-500/20 transition-all"
                >
                  + THÊM TÀI SẢN
                </button>
                <div className="pt-2 border-t border-white/5">
                  <span className="text-[7px] text-neutral-600 font-black uppercase block mb-1">Nhập nhanh (Tên | Mô tả):</span>
                  <textarea 
                    defaultValue={assets && assets.length > 0 ? assets.map(a => `${a.name} | ${a.description}`).join('\n') : ''}
                    onBlur={(e) => handleAssetsChange(e.target.value)}
                    className="w-full bg-black/40 text-[8px] p-2 border border-white/5 rounded-sm text-emerald-400/40 outline-none resize-none"
                    rows={3}
                    placeholder="Tên | Mô tả (Mỗi tài sản một dòng)"
                  />
                </div>
              </div>
            ) : (
              assets && assets.length > 0 ? assets.map((asset, i) => (
                <button 
                  key={i} 
                  onClick={() => onInspect({ name: asset.name, type: 'asset', description: asset.description })}
                  className="text-left text-[10px] p-2.5 bg-emerald-500/5 border border-emerald-500/20 rounded-sm text-emerald-400 flex items-center gap-3 group hover:bg-emerald-500/10 hover:border-emerald-500 transition-all"
                >
                   <span className="shrink-0 text-emerald-500 group-hover:scale-110 transition-transform">🏛️</span>
                   <span className="font-black uppercase tracking-tight truncate flex-grow">{asset.name}</span>
                   <span className="text-[8px] opacity-0 group-hover:opacity-40 transition-opacity">SCAN❯</span>
                </button>
              )) : (
                 <div className="py-10 text-center border border-dashed border-white/10 rounded-sm opacity-10 italic">
                    <p className="text-[8px] font-black uppercase tracking-tighter">No_Holdings_In_Matrix</p>
                 </div>
              )
            )}
         </div>
      </div>
    </section>
  );
};
