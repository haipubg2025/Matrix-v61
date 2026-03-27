
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Camera, Lightbulb, Palette, Type, X, Wand2, Image as ImageIcon, RefreshCw } from 'lucide-react';
import { AppSettings, GameGenre, StudioParams } from '../types';

interface AiImageStudioProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (params: StudioParams) => Promise<void>;
  playerName: string;
  playerGender: string;
  playerAge: number;
  playerPersonality: string;
  currentLocation: string;
  genre?: GameGenre;
  settings: AppSettings;
  themeColor?: string;
}

const STYLES = [
  { id: 'anime', label: 'Anime', icon: '🎨', prompt: 'anime style, high quality anime art' },
  { id: 'realistic', label: 'Tả Thực', icon: '📸', prompt: 'realistic photo, high detail photography, 8k' },
  { id: 'cyberpunk', label: 'Cyberpunk', icon: '🌃', prompt: 'cyberpunk style, neon lights, futuristic' },
  { id: 'fantasy', label: 'Fantasy', icon: '🧙', prompt: 'fantasy art, magical atmosphere, epic' },
  { id: 'oil_painting', label: 'Sơn Dầu', icon: '🖼️', prompt: 'oil painting, thick brushstrokes, classical' },
  { id: 'sketch', label: 'Phác Thảo', icon: '✏️', prompt: 'pencil sketch, hand drawn, artistic' },
  { id: '3d_render', label: '3D Render', icon: '🧊', prompt: '3D render, unreal engine 5, octane render' },
  { id: 'cinematic', label: 'Điện Ảnh', icon: '🎬', prompt: 'cinematic style, movie still, high production value' },
  { id: 'digital_art', label: 'Digital Art', icon: '💻', prompt: 'digital art, clean lines, vibrant colors' },
  { id: 'manga', label: 'Manga', icon: '📖', prompt: 'manga style, black and white, ink drawing' },
  { id: 'watercolor', label: 'Màu Nước', icon: '🖌️', prompt: 'watercolor painting, soft colors, fluid' },
  { id: 'pixel_art', label: 'Pixel Art', icon: '👾', prompt: 'pixel art, 8-bit, retro game style' },
];

const LIGHTING = [
  { id: 'cinematic', label: 'Điện Ảnh', prompt: 'cinematic lighting' },
  { id: 'soft', label: 'Ánh Sáng Mềm', prompt: 'soft lighting, diffused light' },
  { id: 'dramatic', label: 'Kịch Tính', prompt: 'dramatic lighting, high contrast, chiaroscuro' },
  { id: 'neon', label: 'Đèn Neon', prompt: 'neon lighting, glowing accents' },
  { id: 'natural', label: 'Tự Nhiên', prompt: 'natural sunlight, golden hour' },
  { id: 'studio', label: 'Phòng Chụp', prompt: 'studio lighting, professional setup' },
  { id: 'volumetric', label: 'Luồng Sáng', prompt: 'volumetric lighting, god rays' },
  { id: 'rim', label: 'Ánh Sáng Viền', prompt: 'rim lighting, backlight' },
];

const CAMERA = [
  { id: 'portrait', label: 'Chân Dung', prompt: 'portrait shot' },
  { id: 'closeup', label: 'Cận Cảnh', prompt: 'close-up shot' },
  { id: 'full_body', label: 'Toàn Thân', prompt: 'full body shot' },
  { id: 'wide_angle', label: 'Góc Rộng', prompt: 'wide angle shot' },
  { id: 'low_angle', label: 'Góc Thấp', prompt: 'low angle shot, looking up' },
  { id: 'high_angle', label: 'Góc Cao', prompt: 'high angle shot, looking down' },
  { id: 'side_view', label: 'Góc Nghiêng', prompt: 'side view, profile' },
  { id: 'eye_level', label: 'Ngang Mắt', prompt: 'eye level shot' },
];

const ASPECT_RATIOS: { id: StudioParams['aspectRatio'], label: string }[] = [
  { id: '1:1', label: '1:1 (Vuông)' },
  { id: '3:4', label: '3:4 (Dọc)' },
  { id: '4:3', label: '4:3 (Ngang)' },
  { id: '9:16', label: '9:16 (Story)' },
  { id: '16:9', label: '16:9 (Widescreen)' },
];

export const AiImageStudio: React.FC<AiImageStudioProps> = ({
  isOpen, onClose, onGenerate, playerName, playerGender, playerAge, playerPersonality, currentLocation, genre, settings, themeColor = 'emerald'
}) => {
  const [params, setParams] = useState<StudioParams>({
    style: 'realistic',
    lighting: 'cinematic',
    camera: 'portrait',
    keywords: '',
    negativePrompt: 'nsfw, nude, naked, deformed, blurry, low quality, bad anatomy, extra limbs, text, watermark',
    aspectRatio: '1:1'
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      await onGenerate(params);
      onClose();
    } catch (err: any) {
      console.error("Studio generation failed:", err);
      setError(err.message || "Lỗi không xác định khi tạo ảnh.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[2000] bg-black/95 backdrop-blur-xl flex flex-col overflow-hidden mono"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-black/50">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 bg-${themeColor}-500/20 border border-${themeColor}-500/40 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(var(--theme-rgb),0.2)]`}>
              <Sparkles className={`w-6 h-6 text-${themeColor}-400`} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">AI <span className={`text-${themeColor}-500`}>Image Studio</span></h2>
              <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">Kiến tạo chân dung thực tại tối thượng</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-neutral-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-grow overflow-y-auto custom-scrollbar p-6 md:p-12">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Left Column: Settings */}
            <div className="lg:col-span-8 space-y-12">
              
              {/* Art Style */}
              <section className="space-y-6">
                <div className="flex items-center gap-4">
                  <Palette className={`w-5 h-5 text-${themeColor}-500`} />
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">1. Phong Cách Nghệ Thuật</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {STYLES.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setParams(prev => ({ ...prev, style: s.id }))}
                      className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-3 group ${
                        params.style === s.id 
                          ? `bg-${themeColor}-500 border-${themeColor}-400 text-black shadow-[0_0_20px_rgba(var(--theme-rgb),0.3)]` 
                          : 'bg-white/5 border-white/10 text-neutral-400 hover:border-white/20 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-2xl group-hover:scale-110 transition-transform">{s.icon}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest">{s.label}</span>
                    </button>
                  ))}
                </div>
              </section>

              {/* Lighting & Camera */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Lighting */}
                <section className="space-y-6">
                  <div className="flex items-center gap-4">
                    <Lightbulb className={`w-5 h-5 text-${themeColor}-500`} />
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">2. Ánh Sáng</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {LIGHTING.map(l => (
                      <button
                        key={l.id}
                        onClick={() => setParams(prev => ({ ...prev, lighting: l.id }))}
                        className={`px-4 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                          params.lighting === l.id 
                            ? `bg-${themeColor}-500 border-${themeColor}-400 text-black` 
                            : 'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10'
                        }`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </section>

                {/* Camera */}
                <section className="space-y-6">
                  <div className="flex items-center gap-4">
                    <Camera className={`w-5 h-5 text-${themeColor}-500`} />
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">3. Góc Máy</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {CAMERA.map(c => (
                      <button
                        key={c.id}
                        onClick={() => setParams(prev => ({ ...prev, camera: c.id }))}
                        className={`px-4 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                          params.camera === c.id 
                            ? `bg-${themeColor}-500 border-${themeColor}-400 text-black` 
                            : 'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </section>
              </div>

              {/* Custom Keywords */}
              <section className="space-y-6">
                <div className="flex items-center gap-4">
                  <Type className={`w-5 h-5 text-${themeColor}-500`} />
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">4. Mô Tả Chi Tiết (Prompt)</h3>
                </div>
                <div className="space-y-4">
                  <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest italic">
                    * Nhập các chi tiết bạn muốn AI tập trung vào (ngoại hình, trang phục, vật phẩm...)
                  </p>
                  <textarea 
                    value={params.keywords}
                    onChange={(e) => setParams(prev => ({ ...prev, keywords: e.target.value }))}
                    placeholder="Vd: mặc giáp long lân, tay cầm kiếm phát sáng, tóc trắng, mắt xanh, hào quang bí ẩn..."
                    className={`w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-6 text-white text-sm focus:border-${themeColor}-500 focus:outline-none transition-all custom-scrollbar resize-none`}
                  />
                  <div className="flex flex-wrap gap-2">
                    {['vết sẹo', 'áo choàng', 'cánh tiên', 'hào quang', 'vũ khí', 'mắt đỏ', 'tóc trắng', 'vẻ mặt lạnh lùng', 'mỉm cười'].map(tag => (
                      <button 
                        key={tag}
                        onClick={() => setParams(prev => ({ ...prev, keywords: prev.keywords ? `${prev.keywords}, ${tag}` : tag }))}
                        className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] text-neutral-400 hover:text-white hover:bg-white/10 transition-all uppercase font-black"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              {/* Negative Prompt */}
              <section className="space-y-6">
                <div className="flex items-center gap-4">
                  <X className="w-5 h-5 text-rose-500" />
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">5. Từ Khóa Loại Trừ (Negative)</h3>
                </div>
                <input 
                  value={params.negativePrompt}
                  onChange={(e) => setParams(prev => ({ ...prev, negativePrompt: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-neutral-400 text-xs focus:border-rose-500 focus:outline-none transition-all"
                />
              </section>
            </div>

            {/* Right Column: Preview & Generate */}
            <div className="lg:col-span-4 space-y-8">
              <div className="sticky top-12 space-y-8">
                {/* Aspect Ratio */}
                <section className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] space-y-6">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest text-center">Tỷ Lệ Ảnh</h3>
                  <div className="flex flex-wrap justify-center gap-2">
                    {ASPECT_RATIOS.map(ar => (
                      <button
                        key={ar.id}
                        onClick={() => setParams(prev => ({ ...prev, aspectRatio: ar.id }))}
                        className={`px-4 py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${
                          params.aspectRatio === ar.id 
                            ? `bg-${themeColor}-500 border-${themeColor}-400 text-black` 
                            : 'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10'
                        }`}
                      >
                        {ar.label}
                      </button>
                    ))}
                  </div>
                </section>

                {/* Summary Card */}
                <div className={`p-8 bg-${themeColor}-500/5 border border-${themeColor}-500/20 rounded-[2.5rem] space-y-6 relative overflow-hidden`}>
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <ImageIcon className={`w-24 h-24 text-${themeColor}-500`} />
                  </div>
                  
                  <h3 className={`text-xs font-black text-${themeColor}-500 uppercase tracking-widest`}>Cấu Hình Hiện Tại</h3>
                  
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl"
                    >
                      <p className="text-[10px] text-rose-400 font-black uppercase leading-relaxed">
                        ⚠️ {error}
                      </p>
                    </motion.div>
                  )}

                  <div className="space-y-4 relative z-10">
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <span className="text-[10px] text-neutral-500 font-black uppercase">Nhân Vật</span>
                      <span className="text-[10px] text-white font-black uppercase">{playerName}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <span className="text-[10px] text-neutral-500 font-black uppercase">Phong Cách</span>
                      <span className="text-[10px] text-white font-black uppercase">{STYLES.find(s => s.id === params.style)?.label}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <span className="text-[10px] text-neutral-500 font-black uppercase">Góc Máy</span>
                      <span className="text-[10px] text-white font-black uppercase">{CAMERA.find(c => c.id === params.camera)?.label}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <span className="text-[10px] text-neutral-500 font-black uppercase">Tỷ Lệ</span>
                      <span className="text-[10px] text-white font-black uppercase">{params.aspectRatio}</span>
                    </div>

                    <div className="pt-2">
                      <span className="text-[8px] text-neutral-500 font-black uppercase tracking-widest block mb-2">Prompt Dự Kiến:</span>
                      <div className="p-3 bg-black/40 border border-white/5 rounded-xl text-[9px] text-neutral-400 leading-relaxed italic max-h-24 overflow-y-auto custom-scrollbar">
                        {`A high quality ${STYLES.find(s => s.id === params.style)?.prompt} ${CAMERA.find(c => c.id === params.camera)?.prompt} of a character named ${playerName}. Gender: ${playerGender}. Age: ${playerAge}. Personality: ${playerPersonality}. Genre: ${genre || 'General'}. Background: ${currentLocation}. ${LIGHTING.find(l => l.id === params.lighting)?.prompt}. ${params.keywords}. SFW, high detail, masterpiece.`}
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className={`w-full h-20 bg-${themeColor}-500 text-black font-black uppercase text-sm rounded-2xl hover:opacity-90 transition-all shadow-[0_10px_40px_rgba(var(--theme-rgb),0.3)] active:scale-95 flex items-center justify-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed group`}
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-6 h-6 animate-spin" />
                        <span className="tracking-[0.2em]">ĐANG KIẾN TẠO...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                        <span className="tracking-[0.2em]">BẮT ĐẦU TẠO ẢNH</span>
                      </>
                    )}
                  </button>

                  <p className="text-[9px] text-neutral-500 text-center font-bold uppercase tracking-widest italic">
                    * Quá trình tạo ảnh có thể mất 10-20 giây tùy thuộc vào độ phức tạp của cấu hình.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
