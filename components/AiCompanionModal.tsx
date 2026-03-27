
import React, { useState, useEffect } from 'react';
import { Player, AppSettings, AICompanionConfig } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface AiCompanionModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player;
  onUpdatePlayer: (p: Player) => void;
  settings: AppSettings;
}

export const AiCompanionModal: React.FC<AiCompanionModalProps> = ({ isOpen, onClose, player, onUpdatePlayer, settings }) => {
  const [config, setConfig] = useState<AICompanionConfig>(player.aiCompanion || {
    id: 'ai_companion_001',
    name: 'Hệ Thống',
    personality: 'Lạnh lùng, máy móc, tuân thủ quy tắc tuyệt đối.',
    tone: 'Trang trọng, súc tích',
    description: 'Một thực thể trí tuệ nhân tạo không có hình dạng vật lý, hỗ trợ người chơi trong hành trình.',
    isActive: true,
    role: 'system',
    gender: 'Không xác định'
  });

  useEffect(() => {
    if (player.aiCompanion) {
      setConfig(player.aiCompanion);
    }
  }, [player.aiCompanion]);

  const getDescriptionPlaceholder = (role: string) => {
    switch (role) {
      case 'system': return "Vd: Một giao diện bán trong suốt lơ lửng, hoặc chỉ là tiếng vang trong tâm trí...";
      case 'assistant': return "Vd: Một khối cầu ánh sáng xanh nhạt, hoặc hình chiếu hologram...";
      case 'soul': return "Vd: Một bóng ma mờ ảo của một người phụ nữ trẻ, hoặc linh hồn ẩn trong mặt dây chuyền...";
      case 'remnant': return "Vd: Một tia tàn hồn rách nát của một vị lão tổ, ẩn trong nhẫn trữ vật...";
      case 'deity': return "Vd: Một ý chí vĩ đại bao trùm, hoặc hình ảnh một vị thần uy nghiêm thu nhỏ...";
      default: return "Mô tả hình dạng hoặc sự hiện diện của AI Companion...";
    }
  };

  const handleSave = () => {
    onUpdatePlayer({
      ...player,
      aiCompanion: config
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-2xl bg-neutral-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.1)] flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-black/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-2xl">
                {config.role === 'system' || config.role === 'assistant' ? '🤖' : config.role === 'deity' ? '✨' : '👻'}
              </div>
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">Thiết Lập <span className="text-emerald-500">AI Companion</span></h2>
                <p className="text-[10px] mono text-neutral-500 font-bold uppercase tracking-widest">Tùy chỉnh trí tuệ nhân tạo đồng hành</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400 hover:bg-rose-500 hover:text-black transition-all"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="flex-grow overflow-y-auto custom-scrollbar p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest ml-1">Tên AI / Companion</label>
                <input 
                  type="text"
                  value={config.name}
                  onChange={(e) => setConfig({ ...config, name: e.target.value })}
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold focus:border-emerald-500 focus:bg-emerald-500/5 outline-none transition-all"
                  placeholder="Vd: Jarvis, Hệ Thống, Lão Tổ..."
                />
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest ml-1">Giới Tính</label>
                <input 
                  type="text"
                  value={config.gender || ''}
                  onChange={(e) => setConfig({ ...config, gender: e.target.value })}
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold focus:border-emerald-500 focus:bg-emerald-500/5 outline-none transition-all"
                  placeholder="Vd: Nam, Nữ, Không xác định..."
                />
              </div>
            </div>

            {/* Role */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest ml-1">Loại Companion / Vai Trò</label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                {[
                  { id: 'system', label: 'Hệ Thống' },
                  { id: 'assistant', label: 'Trợ Lý AI' },
                  { id: 'soul', label: 'Linh Hồn' },
                  { id: 'remnant', label: 'Tàn Hồn' },
                  { id: 'deity', label: 'Vị Thần' }
                ].map((role) => (
                  <button 
                    key={role.id}
                    onClick={() => setConfig({ ...config, role: role.id as any })}
                    className={`py-3 rounded-xl border font-black uppercase text-[8px] tracking-widest transition-all ${config.role === role.id ? 'bg-emerald-500 text-black border-transparent shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-white/5 text-neutral-400 border-white/10 hover:bg-white/10'}`}
                  >
                    {role.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Personality */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest ml-1">Tính Cách</label>
              <textarea 
                value={config.personality}
                onChange={(e) => setConfig({ ...config, personality: e.target.value })}
                className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold focus:border-emerald-500 focus:bg-emerald-500/5 outline-none transition-all min-h-[80px] resize-none"
                placeholder="Vd: Lạnh lùng, trung thành, đôi khi mỉa mai..."
              />
            </div>

            {/* Tone */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest ml-1">Giọng Điệu / Cách Xưng Hô</label>
              <input 
                type="text"
                value={config.tone}
                onChange={(e) => setConfig({ ...config, tone: e.target.value })}
                className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold focus:border-emerald-500 focus:bg-emerald-500/5 outline-none transition-all"
                placeholder="Vd: Trang trọng, xưng 'Ký chủ' - 'Hệ thống'..."
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest ml-1">Mô Tả Hình Dạng / Sự Hiện Diện</label>
              <textarea 
                value={config.description}
                onChange={(e) => setConfig({ ...config, description: e.target.value })}
                className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold focus:border-emerald-500 focus:bg-emerald-500/5 outline-none transition-all min-h-[100px] resize-none"
                placeholder={getDescriptionPlaceholder(config.role)}
              />
            </div>

            {/* Active Toggle */}
            <div className="p-6 bg-white/5 border border-white/10 rounded-[2rem] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-tight">Kích Hoạt AI Companion</h3>
                <p className="text-[10px] text-neutral-500 font-bold">Cho phép AI tham gia vào cốt truyện</p>
              </div>
              <button 
                onClick={() => setConfig({ ...config, isActive: !config.isActive })}
                className={`w-14 h-8 rounded-full relative transition-all ${config.isActive ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-neutral-800'}`}
              >
                <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${config.isActive ? 'left-7' : 'left-1'}`}></div>
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-6 border-t border-white/5 bg-black/20 flex gap-4">
            <button 
              onClick={onClose}
              className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl text-neutral-400 font-black uppercase text-xs tracking-widest hover:bg-white/10 transition-all"
            >
              Hủy Bỏ
            </button>
            <button 
              onClick={handleSave}
              className="flex-[2] py-4 bg-emerald-500 text-black font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-emerald-400 transition-all shadow-[0_10px_30px_rgba(16,185,129,0.2)]"
            >
              Lưu Thiết Lập
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
