
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Player, AppSettings } from '../../types';
import { X, Sparkles, Clock, Infinity as InfinityIcon, Save, Layers, ShieldCheck, User, Book, Brain, ChevronDown, ScrollText } from 'lucide-react';

interface MobileAiHintModalProps {
  onClose: () => void;
  player: Player;
  onUpdatePlayer: (player: Player) => void;
  settings: AppSettings;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
}

const ContextToggle: React.FC<{ label: string; enabled: boolean; onChange: (val: boolean) => void }> = ({ label, enabled, onChange }) => (
  <button 
    onClick={() => onChange(!enabled)}
    className={`w-full p-3 rounded-xl border transition-all flex items-center justify-between group ${enabled ? 'bg-white/5 border-white/10' : 'bg-black/20 border-white/5 opacity-50'}`}
  >
    <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors text-left pr-2 ${enabled ? 'text-white' : 'text-neutral-600'}`}>
      {label}
    </span>
    <div className={`w-8 h-4 rounded-full transition-all relative shrink-0 ${enabled ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.3)]' : 'bg-neutral-800'}`}>
      <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${enabled ? 'left-4.5' : 'left-0.5'}`} />
    </div>
  </button>
);

export const MobileAiHintModal: React.FC<MobileAiHintModalProps> = ({ onClose, player, onUpdatePlayer, settings, onUpdateSettings }) => {
  const [activeTab, setActiveTab] = useState<'oneTurn' | 'permanent' | 'writingStyle' | 'contextWindow'>('oneTurn');
  const [oneTurnHint, setOneTurnHint] = useState(player.aiHints?.oneTurn || '');
  const [permanentHint, setPermanentHint] = useState(player.aiHints?.permanent || '');
  const [writingStyle, setWritingStyle] = useState(player.aiHints?.writingStyle || '');
  const [forbiddenWords, setForbiddenWords] = useState(player.aiHints?.forbiddenWords || '');
  const [nsfwStyleHardcore, setNsfwStyleHardcore] = useState(player.aiHints?.nsfwStyleHardcore || false);
  const [nsfwStyleHardcoreContent, setNsfwStyleHardcoreContent] = useState(player.aiHints?.nsfwStyleHardcoreContent || "");
  const [showHardcoreEditor, setShowHardcoreEditor] = useState(false);
  const [nsfwStylePsychological, setNsfwStylePsychological] = useState(player.aiHints?.nsfwStylePsychological || false);
  const [nsfwStylePsychologicalContent, setNsfwStylePsychologicalContent] = useState(player.aiHints?.nsfwStylePsychologicalContent || "");
  const [showPsychologicalEditor, setShowPsychologicalEditor] = useState(false);
  const [nsfwStyleAction, setNsfwStyleAction] = useState(player.aiHints?.nsfwStyleAction || false);
  const [nsfwStyleActionContent, setNsfwStyleActionContent] = useState(player.aiHints?.nsfwStyleActionContent || "");
  const [showActionEditor, setShowActionEditor] = useState(false);
  const [customHints, setCustomHints] = useState<{ id: string; text: string; enabled: boolean }[]>(player.aiHints?.customHints || []);
  const [contextSettings, setContextSettings] = useState(player.aiHints?.contextSettings || {
    includeNpcBase: true,
    includeNpcSocial: true,
    includeNpcMental: true,
    includeNpcDesires: true,
    includeNpcGoals: true,
    includeNpcSecrets: true,
    includeNpcAnatomy: true,
    includeNpcStatusSkills: true,
    includeNpcList: true,
    includePlayerStats: true,
    includePlayerInventory: true,
    includePlayerSkills: true,
    includePlayerIdentities: true,
    includeCodexWorld: true,
    includeCodexRules: true,
    includeCodexEntities: true,
    includeQuests: true,
    includeMemories: true,
    includeWorldSummary: true,
  });
  const [newHintText, setNewHintText] = useState('');

  useEffect(() => {
    setOneTurnHint(player.aiHints?.oneTurn || '');
    setPermanentHint(player.aiHints?.permanent || '');
    setWritingStyle(player.aiHints?.writingStyle || '');
    setForbiddenWords(player.aiHints?.forbiddenWords || '');
    setNsfwStyleHardcore(player.aiHints?.nsfwStyleHardcore || false);
    setNsfwStyleHardcoreContent(player.aiHints?.nsfwStyleHardcoreContent || "");
    setNsfwStylePsychological(player.aiHints?.nsfwStylePsychological || false);
    setNsfwStylePsychologicalContent(player.aiHints?.nsfwStylePsychologicalContent || "");
    setNsfwStyleAction(player.aiHints?.nsfwStyleAction || false);
    setNsfwStyleActionContent(player.aiHints?.nsfwStyleActionContent || "");
    setCustomHints(player.aiHints?.customHints || []);
    setContextSettings(player.aiHints?.contextSettings || {
      includeNpcBase: true,
      includeNpcSocial: true,
      includeNpcMental: true,
      includeNpcDesires: true,
      includeNpcGoals: true,
      includeNpcSecrets: true,
      includeNpcAnatomy: true,
      includeNpcStatusSkills: true,
      includeNpcList: true,
      includePlayerStats: true,
      includePlayerInventory: true,
      includePlayerSkills: true,
      includePlayerIdentities: true,
      includeCodexWorld: true,
      includeCodexRules: true,
      includeCodexEntities: true,
      includeQuests: true,
      includeMemories: true,
      includeWorldSummary: true,
    });
  }, [player.aiHints]);

  const handleSave = () => {
    onUpdatePlayer({
      ...player,
      aiHints: {
        oneTurn: oneTurnHint,
        permanent: permanentHint,
        writingStyle: writingStyle,
        forbiddenWords: forbiddenWords,
        nsfwStyleHardcore: nsfwStyleHardcore,
        nsfwStyleHardcoreContent: nsfwStyleHardcoreContent,
        nsfwStylePsychological: nsfwStylePsychological,
        nsfwStylePsychologicalContent: nsfwStylePsychologicalContent,
        nsfwStyleAction: nsfwStyleAction,
        nsfwStyleActionContent: nsfwStyleActionContent,
        customHints: customHints,
        contextSettings: contextSettings
      }
    });
    onClose();
  };

  const addCustomHint = () => {
    if (!newHintText.trim()) return;
    const newHint = {
      id: Date.now().toString(),
      text: newHintText.trim(),
      enabled: true
    };
    setCustomHints([...customHints, newHint]);
    setNewHintText('');
  };

  const toggleCustomHint = (id: string) => {
    setCustomHints(customHints.map(h => h.id === id ? { ...h, enabled: !h.enabled } : h));
  };

  const removeCustomHint = (id: string) => {
    setCustomHints(customHints.filter(h => h.id !== id));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="MobileAiHintModal fixed inset-0 z-[600] bg-[#0a0a0a] flex flex-col h-full overflow-hidden font-sans"
    >
      {/* HEADER */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-neutral-900/50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            <Sparkles className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white uppercase tracking-wider leading-none">Nhắc AI</h2>
            <p className="text-[8px] text-neutral-500 font-bold uppercase tracking-widest mt-1">Gợi ý hướng đi cho thực tại</p>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="w-10 h-10 flex items-center justify-center bg-white/5 text-neutral-400 rounded-xl border border-white/10 active:scale-90 transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* TABS DROPDOWN */}
      <div className="px-4 py-3 border-b border-white/5 bg-black/40 shrink-0">
        <div className="relative">
          <select 
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as any)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest text-indigo-400 appearance-none outline-none focus:border-indigo-500/50"
          >
            <option value="oneTurn">1 Lượt (Chỉ thị tạm thời)</option>
            <option value="permanent">Vĩnh Viễn (Chỉ thị cố định)</option>
            <option value="writingStyle">Văn phong & Từ cấm</option>
            <option value="contextWindow">Cửa sổ Ngữ cảnh (Tối ưu AI)</option>
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500">
            <ChevronDown size={16} />
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-grow overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {activeTab === 'oneTurn' ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
            <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-xl">
              <p className="text-[10px] text-indigo-300/80 italic leading-relaxed">
                "MỆNH LỆNH TỐI CAO: Chỉ thị này sẽ được AI ưu tiên thực hiện tuyệt đối trong 1 lượt kế tiếp. Sau đó sẽ tự động xóa bỏ."
              </p>
            </div>
            <textarea
              value={oneTurnHint}
              onChange={(e) => setOneTurnHint(e.target.value)}
              placeholder="Ví dụ: Hãy để NPC A tỏ ra ghen tuông, hoặc mô tả chi tiết cảnh chiến đấu này..."
              className="w-full h-64 bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white placeholder:text-neutral-700 focus:border-indigo-500/50 outline-none transition-all resize-none"
            />
          </div>
        ) : activeTab === 'permanent' ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-4">
              <p className="text-[10px] text-amber-300/80 italic leading-relaxed">
                "CHỈ THỊ VĨNH VIỄN: AI sẽ luôn tuân thủ mệnh lệnh này trong mọi lượt chơi."
              </p>
            </div>

            {/* Custom Hints List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Danh sách chỉ thị</h3>
                <span className="text-[8px] text-neutral-500 mono uppercase">{customHints.length} mục</span>
              </div>

              <div className="space-y-2">
                {customHints.map(hint => (
                  <div key={hint.id} className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between gap-4">
                    <div className="flex-grow overflow-hidden">
                      <p className={`text-xs transition-all truncate ${hint.enabled ? 'text-white' : 'text-neutral-600 line-through'}`}>{hint.text}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <button 
                        onClick={() => toggleCustomHint(hint.id)}
                        className={`w-10 h-5 rounded-full transition-all relative ${hint.enabled ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-neutral-800'}`}
                      >
                        <motion.div 
                          animate={{ x: hint.enabled ? 20 : 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          className="absolute top-1 left-1 w-3 h-3 rounded-full bg-white shadow-sm"
                        />
                      </button>
                      <button 
                        onClick={() => removeCustomHint(hint.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-rose-500/10 text-rose-500 active:scale-90 transition-all"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input 
                  type="text"
                  value={newHintText}
                  onChange={(e) => setNewHintText(e.target.value)}
                  placeholder="Thêm chỉ thị mới..."
                  className="flex-grow bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder:text-neutral-700 focus:border-indigo-500/50 outline-none transition-all"
                />
                <button 
                  onClick={addCustomHint}
                  className="px-4 py-3 bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase active:scale-95 shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                >
                  Thêm
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Ghi chú bổ sung</h3>
              <textarea
                value={permanentHint}
                onChange={(e) => setPermanentHint(e.target.value)}
                placeholder="Ví dụ: Luôn mô tả MC với phong thái lạnh lùng..."
                className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white placeholder:text-neutral-700 focus:border-amber-500/50 outline-none transition-all resize-none custom-scrollbar"
              />
            </div>
          </div>
        ) : activeTab === 'writingStyle' ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-xl space-y-4">
              <p className="text-[10px] text-rose-300/80 italic leading-relaxed">
                "KIỂM SOÁT VĂN PHONG: Tùy chỉnh cách AI diễn đạt và danh sách các từ ngữ tuyệt đối không được xuất hiện."
              </p>

              <div className="grid grid-cols-1 gap-2 pt-2 border-t border-rose-500/10">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                  <div 
                    className="flex flex-col flex-grow cursor-pointer"
                    onClick={() => setShowHardcoreEditor(!showHardcoreEditor)}
                  >
                    <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest leading-tight flex items-center gap-1">
                      NSFW Hardcore
                      <Sparkles className="w-2 h-2 opacity-50" />
                    </span>
                    <span className="text-[8px] text-neutral-500 font-bold">Thô tục & Trực diện (Nhấn để sửa)</span>
                  </div>
                  <button 
                    onClick={() => setNsfwStyleHardcore(!nsfwStyleHardcore)}
                    className={`w-10 h-5 rounded-full transition-all relative shrink-0 ${nsfwStyleHardcore ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 'bg-neutral-800'}`}
                  >
                    <motion.div 
                      animate={{ x: nsfwStyleHardcore ? 16 : 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className="absolute top-1 left-1 w-3 h-3 rounded-full bg-white shadow-sm"
                    />
                  </button>
                </div>

                {showHardcoreEditor && (
                  <div className="p-4 bg-black/40 border border-rose-500/20 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-rose-300 uppercase tracking-widest">Chi tiết NSFW Hardcore</span>
                      <button 
                        onClick={() => setShowHardcoreEditor(false)}
                        className="text-[8px] font-black text-neutral-500 uppercase hover:text-white transition-colors"
                      >
                        Đóng
                      </button>
                    </div>
                    <textarea
                      value={nsfwStyleHardcoreContent}
                      onChange={(e) => setNsfwStyleHardcoreContent(e.target.value)}
                      className="w-full h-48 bg-black/60 border border-white/10 rounded-lg p-3 text-xs text-white placeholder:text-neutral-700 focus:border-rose-500/50 outline-none transition-all resize-none custom-scrollbar font-mono leading-relaxed"
                      placeholder="Nhập các quy tắc Hardcore NSFW tại đây..."
                    />
                    <div className="flex justify-end">
                      <button 
                        onClick={() => setNsfwStyleHardcoreContent("")}
                        className="text-[8px] font-black text-rose-500/50 uppercase hover:text-rose-500 transition-colors"
                      >
                        Xóa nội dung
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                  <div 
                    className="flex flex-col flex-grow cursor-pointer"
                    onClick={() => setShowPsychologicalEditor(!showPsychologicalEditor)}
                  >
                    <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest leading-tight flex items-center gap-1">
                      NSFW Tâm lý
                      <Sparkles className="w-2 h-2 opacity-50" />
                    </span>
                    <span className="text-[8px] text-neutral-500 font-bold">Hình tượng & Phản ứng (Nhấn để sửa)</span>
                  </div>
                  <button 
                    onClick={() => setNsfwStylePsychological(!nsfwStylePsychological)}
                    className={`w-10 h-5 rounded-full transition-all relative shrink-0 ${nsfwStylePsychological ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 'bg-neutral-800'}`}
                  >
                    <motion.div 
                      animate={{ x: nsfwStylePsychological ? 16 : 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className="absolute top-1 left-1 w-3 h-3 rounded-full bg-white shadow-sm"
                    />
                  </button>
                </div>

                {showPsychologicalEditor && (
                  <div className="p-4 bg-black/40 border border-rose-500/20 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-rose-300 uppercase tracking-widest">Chi tiết NSFW Tâm lý</span>
                      <button 
                        onClick={() => setShowPsychologicalEditor(false)}
                        className="text-[8px] font-black text-neutral-500 uppercase hover:text-white transition-colors"
                      >
                        Đóng
                      </button>
                    </div>
                    <textarea
                      value={nsfwStylePsychologicalContent}
                      onChange={(e) => setNsfwStylePsychologicalContent(e.target.value)}
                      className="w-full h-48 bg-black/60 border border-white/10 rounded-lg p-3 text-xs text-white placeholder:text-neutral-700 focus:border-rose-500/50 outline-none transition-all resize-none custom-scrollbar font-mono leading-relaxed"
                      placeholder="Nhập các quy tắc Tâm lý NSFW tại đây..."
                    />
                    <div className="flex justify-end">
                      <button 
                        onClick={() => setNsfwStylePsychologicalContent("")}
                        className="text-[8px] font-black text-rose-500/50 uppercase hover:text-rose-500 transition-colors"
                      >
                        Xóa nội dung
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                  <div 
                    className="flex flex-col flex-grow cursor-pointer"
                    onClick={() => setShowActionEditor(!showActionEditor)}
                  >
                    <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest leading-tight flex items-center gap-1">
                      NSFW Hành động
                      <Sparkles className="w-2 h-2 opacity-50" />
                    </span>
                    <span className="text-[8px] text-neutral-500 font-bold">Xác thịt & Kỹ năng (Nhấn để sửa)</span>
                  </div>
                  <button 
                    onClick={() => setNsfwStyleAction(!nsfwStyleAction)}
                    className={`w-10 h-5 rounded-full transition-all relative shrink-0 ${nsfwStyleAction ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 'bg-neutral-800'}`}
                  >
                    <motion.div 
                      animate={{ x: nsfwStyleAction ? 16 : 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className="absolute top-1 left-1 w-3 h-3 rounded-full bg-white shadow-sm"
                    />
                  </button>
                </div>

                {showActionEditor && (
                  <div className="p-4 bg-black/40 border border-rose-500/20 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-rose-300 uppercase tracking-widest">Chi tiết NSFW Hành động</span>
                      <button 
                        onClick={() => setShowActionEditor(false)}
                        className="text-[8px] font-black text-neutral-500 uppercase hover:text-white transition-colors"
                      >
                        Đóng
                      </button>
                    </div>
                    <textarea
                      value={nsfwStyleActionContent}
                      onChange={(e) => setNsfwStyleActionContent(e.target.value)}
                      className="w-full h-48 bg-black/60 border border-white/10 rounded-lg p-3 text-xs text-white placeholder:text-neutral-700 focus:border-rose-500/50 outline-none transition-all resize-none custom-scrollbar font-mono leading-relaxed"
                      placeholder="Nhập các quy tắc hành động NSFW tại đây..."
                    />
                    <div className="flex justify-end">
                      <button 
                        onClick={() => setNsfwStyleActionContent("")}
                        className="text-[8px] font-black text-rose-500/50 uppercase hover:text-rose-500 transition-colors"
                      >
                        Xóa nội dung
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <ScrollText className="w-3 h-3 text-indigo-400" />
                  <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Chỉnh sửa Văn phong</h3>
                </div>
                <textarea
                  value={writingStyle}
                  onChange={(e) => setWritingStyle(e.target.value)}
                  placeholder="Ví dụ: Hãy viết theo phong cách kiếm hiệp cổ điển..."
                  className="w-full h-40 bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white placeholder:text-neutral-700 focus:border-indigo-500/50 outline-none transition-all resize-none"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <X className="w-3 h-3 text-rose-500" />
                  <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Danh sách Từ cấm</h3>
                </div>
                <textarea
                  value={forbiddenWords}
                  onChange={(e) => setForbiddenWords(e.target.value)}
                  placeholder="Ví dụ: hiện đại, điện thoại, máy bay..."
                  className="w-full h-40 bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white placeholder:text-neutral-700 focus:border-rose-500/50 outline-none transition-all resize-none"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
              <p className="text-[10px] text-emerald-300/80 italic leading-relaxed">
                "CỬA SỔ NGỮ CẢNH: Tùy chỉnh các thông tin sẽ được gửi cho AI xử lý mỗi lượt. Tắt bớt các thông tin không cần thiết để AI tập trung hơn."
              </p>
            </div>

            <div className="space-y-4">
               <div className="flex items-center gap-2 px-1">
                  <Layers className="w-3 h-3 text-emerald-400" />
                  <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Cấu hình Toàn cục</h3>
               </div>
               
               <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Độ dài Ngữ cảnh</span>
                    <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5">
                      <input 
                        type="number"
                        min="1"
                        max="1000"
                        value={settings.contextWindowSize}
                        onChange={(e) => onUpdateSettings({ contextWindowSize: Math.max(1, parseInt(e.target.value) || 1) })}
                        className="bg-transparent mono text-emerald-400 text-sm font-black w-12 outline-none text-center"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Giới hạn NPC</span>
                    <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5">
                      <input 
                        type="number"
                        min="1"
                        max="50"
                        value={settings.maxNpcsToSendToAi || 5}
                        onChange={(e) => onUpdateSettings({ maxNpcsToSendToAi: Math.max(1, parseInt(e.target.value) || 1) })}
                        className="bg-transparent mono text-emerald-400 text-sm font-black w-12 outline-none text-center"
                      />
                    </div>
                  </div>
               </div>
            </div>

            <div className="space-y-6 pb-4">
              {/* NPC Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <User className="w-3 h-3 text-indigo-400" />
                  <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Thông tin NPC</h3>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <ContextToggle 
                    label="Thông tin Cơ bản" 
                    enabled={contextSettings.includeNpcBase} 
                    onChange={(val) => setContextSettings({...contextSettings, includeNpcBase: val})} 
                  />
                  <ContextToggle 
                    label="Quan hệ & Xã hội" 
                    enabled={contextSettings.includeNpcSocial} 
                    onChange={(val) => setContextSettings({...contextSettings, includeNpcSocial: val})} 
                  />
                  <ContextToggle 
                    label="Tâm lý & Tính cách" 
                    enabled={contextSettings.includeNpcMental} 
                    onChange={(val) => setContextSettings({...contextSettings, includeNpcMental: val})} 
                  />
                  <ContextToggle 
                    label="Dục vọng & Xu hướng" 
                    enabled={contextSettings.includeNpcDesires} 
                    onChange={(val) => setContextSettings({...contextSettings, includeNpcDesires: val})} 
                  />
                  <ContextToggle 
                    label="Mục tiêu & Tham vọng" 
                    enabled={contextSettings.includeNpcGoals} 
                    onChange={(val) => setContextSettings({...contextSettings, includeNpcGoals: val})} 
                  />
                  <ContextToggle 
                    label="Bí mật & Ký ức" 
                    enabled={contextSettings.includeNpcSecrets} 
                    onChange={(val) => setContextSettings({...contextSettings, includeNpcSecrets: val})} 
                  />
                  <ContextToggle 
                    label="Giải phẫu Cơ thể" 
                    enabled={contextSettings.includeNpcAnatomy} 
                    onChange={(val) => setContextSettings({...contextSettings, includeNpcAnatomy: val})} 
                  />
                  <ContextToggle 
                    label="Trạng thái & Kỹ năng" 
                    enabled={contextSettings.includeNpcStatusSkills} 
                    onChange={(val) => setContextSettings({...contextSettings, includeNpcStatusSkills: val})} 
                  />
                  <ContextToggle 
                    label="Danh sách NPC tổng hợp" 
                    enabled={contextSettings.includeNpcList} 
                    onChange={(val) => setContextSettings({...contextSettings, includeNpcList: val})} 
                  />
                </div>
              </div>

              {/* Player Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Thông tin Người chơi</h3>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <ContextToggle 
                    label="Chỉ số & Thuộc tính" 
                    enabled={contextSettings.includePlayerStats} 
                    onChange={(val) => setContextSettings({...contextSettings, includePlayerStats: val})} 
                  />
                  <ContextToggle 
                    label="Túi đồ & Vật phẩm" 
                    enabled={contextSettings.includePlayerInventory} 
                    onChange={(val) => setContextSettings({...contextSettings, includePlayerInventory: val})} 
                  />
                  <ContextToggle 
                    label="Kỹ năng & Võ học" 
                    enabled={contextSettings.includePlayerSkills} 
                    onChange={(val) => setContextSettings({...contextSettings, includePlayerSkills: val})} 
                  />
                  <ContextToggle 
                    label="Thân phận & Bí mật" 
                    enabled={contextSettings.includePlayerIdentities} 
                    onChange={(val) => setContextSettings({...contextSettings, includePlayerIdentities: val})} 
                  />
                </div>
              </div>

              {/* Codex Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <Book className="w-3 h-3 text-amber-400" />
                  <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Thư viện (Codex)</h3>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <ContextToggle 
                    label="Thế giới & Địa danh" 
                    enabled={contextSettings.includeCodexWorld} 
                    onChange={(val) => setContextSettings({...contextSettings, includeCodexWorld: val})} 
                  />
                  <ContextToggle 
                    label="Quy tắc & Thiết lập" 
                    enabled={contextSettings.includeCodexRules} 
                    onChange={(val) => setContextSettings({...contextSettings, includeCodexRules: val})} 
                  />
                  <ContextToggle 
                    label="Thực thể & Vật phẩm" 
                    enabled={contextSettings.includeCodexEntities} 
                    onChange={(val) => setContextSettings({...contextSettings, includeCodexEntities: val})} 
                  />
                </div>
              </div>

              {/* System Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <Brain className="w-3 h-3 text-rose-400" />
                  <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Hệ thống & Ký ức</h3>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <ContextToggle 
                    label="Nhiệm vụ hiện tại" 
                    enabled={contextSettings.includeQuests} 
                    onChange={(val) => setContextSettings({...contextSettings, includeQuests: val})} 
                  />
                  <ContextToggle 
                    label="Ký ức & Sự kiện" 
                    enabled={contextSettings.includeMemories} 
                    onChange={(val) => setContextSettings({...contextSettings, includeMemories: val})} 
                  />
                  <ContextToggle 
                    label="Tóm tắt thế giới" 
                    enabled={contextSettings.includeWorldSummary} 
                    onChange={(val) => setContextSettings({...contextSettings, includeWorldSummary: val})} 
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="p-4 bg-black/60 border-t border-white/10 shrink-0">
        <button
          onClick={handleSave}
          className="w-full py-3.5 bg-indigo-500 text-white rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2 active:scale-95 transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)]"
        >
          <Save size={16} /> Lưu Chỉ Thị
        </button>
      </div>
    </motion.div>
  );
};
