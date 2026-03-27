
import React from 'react';
import { Player } from '../../types';

export type InspectType = 'asset' | 'skill' | 'item' | 'quest' | 'system' | 'customField';

interface McInspectorProps {
  item: {
    name: string;
    type: InspectType;
    description?: string;
    reward?: string;
    status?: string;
    questGroup?: string;
    questKind?: string;
    progress?: string;
  };
  player: Player;
  onClose: () => void;
}

export const McInspector: React.FC<McInspectorProps> = ({ item, player, onClose }) => {
  const getDisplayDescription = () => {
    if (item.type === 'quest' || item.type === 'system') return item.description;
    if (item.description) return item.description;
    
    switch(item.type) {
      case 'asset': return `Thực thể sở hữu có giá trị kinh tế/vận mệnh cao. Đã được Quantum_Core xác thực tính chính danh và quyền kiểm soát tuyệt đối của chủ thể.`;
      case 'skill': return `Kỹ năng thần kinh/vật lý đã được mã hóa vào bản thể. Cho phép chủ thể can thiệp vào dòng chảy thực tại theo các quy luật đặc thù của thế giới hiện hành.`;
      case 'item': return `Vật thể mang năng lượng tích hợp. Có thể sử dụng để thay đổi trạng thái bản thân hoặc tương tác với các thực thể khác trong Matrix.`;
      default: return "";
    }
  };

  return (
    <div className="absolute inset-0 z-[400] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in slide-in-from-bottom-10 duration-300 mono">
      <div className="w-full max-w-lg bg-neutral-900 border border-emerald-500/30 rounded-2xl p-8 shadow-[0_0_50px_rgba(16,185,129,0.2)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent"></div>
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors uppercase font-black text-[10px]"
        >
          [ Đóng ]
        </button>

        <div className="flex flex-col gap-6">
          <div>
            <span className="text-[8px] mono font-black text-emerald-500 uppercase tracking-[0.4em] block mb-2">❯ System_Inspector_Module</span>
            <h3 className="text-3xl font-black text-white uppercase tracking-tighter italic">{item.name}</h3>
            <div className="flex items-center gap-2 mt-2">
               <span className={`px-2 py-0.5 rounded-sm text-[8px] font-black uppercase ${
                 item.type === 'skill' ? 'bg-purple-500/20 text-purple-400' : 
                 item.type === 'asset' ? 'bg-amber-500/20 text-amber-400' : 
                 item.type === 'quest' ? (item.questGroup === 'main' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400') :
                 item.type === 'system' ? 'bg-cyan-500/20 text-cyan-400' :
                 item.type === 'customField' ? 'bg-emerald-500/20 text-emerald-400' :
                 'bg-blue-500/20 text-blue-400'
               }`}>
                 Phân loại: {item.type === 'quest' ? (item.questGroup === 'main' ? 'CHÍNH TUYẾN' : 'PHỤ TUYẾN') : item.type.toUpperCase()}
               </span>
               {item.type === 'quest' && (
                 <span className="px-2 py-0.5 rounded-sm text-[8px] font-black uppercase bg-white/5 text-neutral-400">
                   Loại: {item.questKind === 'chain' ? `CHUỖI (${item.progress})` : 'ĐƠN LẺ'}
                 </span>
               )}
               <div className="h-px flex-grow bg-white/5"></div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-black/40 border border-white/5 rounded-xl">
              <span className="text-[8px] text-neutral-600 font-black uppercase mb-2 block tracking-widest">Dữ liệu phân tích:</span>
              <p className="text-sm text-neutral-300 leading-relaxed italic">
                "{getDisplayDescription()}"
              </p>
            </div>

            {item.type === 'quest' ? (
              <div className="grid grid-cols-2 gap-4">
                 <div className="p-3 bg-white/[0.03] border border-white/5 rounded-lg">
                    <span className="text-[7px] text-neutral-600 font-black uppercase block mb-1">Trạng thái</span>
                    <span className={`text-[10px] font-black uppercase ${item.status === 'active' ? 'text-yellow-500 animate-pulse' : 'text-neutral-500'}`}>
                      {item.status === 'active' ? '● Đang thực hiện' : '○ Đã kết thúc'}
                    </span>
                 </div>
                 <div className="p-3 bg-white/[0.03] border border-white/5 rounded-lg">
                    <span className="text-[7px] text-neutral-600 font-black uppercase block mb-1">Phần thưởng</span>
                    <span className="text-[10px] font-black text-yellow-500 uppercase italic">
                      {item.reward || 'Tài sản Mới'}
                    </span>
                 </div>
              </div>
            ) : item.type === 'system' ? (
              <div className="grid grid-cols-2 gap-4">
                 <div className="p-3 bg-white/[0.03] border border-white/5 rounded-lg">
                    <span className="text-[7px] text-neutral-600 font-black uppercase block mb-1">Tỷ lệ đồng bộ</span>
                    <span className="text-[10px] font-black text-cyan-400 uppercase italic animate-pulse">
                      98.4% [Optimal]
                    </span>
                 </div>
                 <div className="p-3 bg-white/[0.03] border border-white/5 rounded-lg">
                    <span className="text-[7px] text-neutral-600 font-black uppercase block mb-1">Quyền hạn</span>
                    <span className="text-[10px] font-black text-emerald-500 uppercase italic">
                      [Root_Access]
                    </span>
                 </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <span className="text-[7px] text-neutral-700 font-black uppercase">Độ quý hiếm (Rarity)</span>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{width: '75%'}}></div>
                    </div>
                </div>
                <div className="space-y-1">
                    <span className="text-[7px] text-neutral-700 font-black uppercase">Tương thích (Sync)</span>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-400" style={{width: '92%'}}></div>
                    </div>
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={onClose}
            className="w-full py-3 bg-emerald-500 text-black font-black uppercase text-xs rounded-xl hover:bg-emerald-400 transition-all shadow-lg active:scale-95"
          >
            Xác nhận & Quay lại
          </button>
        </div>
      </div>
    </div>
  );
};
