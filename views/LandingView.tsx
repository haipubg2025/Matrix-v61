
import React, { useEffect, useState } from 'react';
import { GAME_ARCHETYPES } from '../constants';
import { dbService, SaveMetadata } from '../services/dbService';
import { Player, AppSettings, GalleryImage } from '../types';
import { ResolvedImage } from '../components/ResolvedImage';

interface Props {
  player: Player;
  gallery: GalleryImage[];
  settings: AppSettings;
  onUpdateSettings: (s: Partial<AppSettings>) => void;
  onStart: () => void;
  onStartFanfic?: () => void;
  onStartFreeStyle?: () => void;
  onStartWorldCreation?: () => void;
  onOpenImportWorld: () => void;
  onContinue: (slotId: string) => void;
  onOpenSaveManager: () => void;
  onOpenSettings: () => void;
}

const FALLBACK_BEAUTIES = [
  { name: "Lâm Nhã Thi", title: "Tần Phu Nhân", genre: "Đô Thị", color: "from-pink-500", img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&auto=format&fit=crop" },
  { name: "Diệp Tử Yên", title: "Thần Y Trẻ Tuổi", genre: "Tu Tiên", color: "from-emerald-500", img: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&auto=format&fit=crop" },
  { name: "Tần Tuyết Dao", title: "CEO Băng Lãnh", genre: "Đô Thị", color: "from-blue-500", img: "https://images.unsplash.com/photo-1554151228-14d9def656e4?w=800&auto=format&fit=crop" },
  { name: "Thánh Nữ Dao Trì", title: "Thiên Kiêu", genre: "Tu Tiên", color: "from-purple-500", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&auto=format&fit=crop" },
  { name: "Mạn Ny", title: "Ảnh Hậu", genre: "Đô Thị", color: "from-rose-500", img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop" },
  { name: "Hàn Tuyết", title: "Nữ Thần Băng Giá", genre: "Fantasy", color: "from-cyan-500", img: "https://images.unsplash.com/photo-1503104834685-7205e8607eb9?w=800&auto=format&fit=crop" },
  { name: "Tô Mỹ nhân", title: "Tiên Tử Hạ Giới", genre: "Tu Tiên", color: "from-yellow-500", img: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=800&auto=format&fit=crop" },
  { name: "Vương Yến", title: "Đệ Nhất Kiếm Hiệp", genre: "Võ Lâm", color: "from-red-500", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&auto=format&fit=crop" },
  { name: "X-01", title: "Nữ Chiến Binh Cơ Khí", genre: "Tương Lai", color: "from-blue-400", img: "https://images.unsplash.com/photo-1542332213-31f87348057f?w=800&auto=format&fit=crop" },
  { name: "Trần Huyền Cơ", title: "Công Chúa Đại Việt", genre: "Lịch Sử", color: "from-amber-500", img: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&auto=format&fit=crop" },
  { name: "An Nhiên", title: "Cô Giáo Tình Nguyện", genre: "Thuần Phong", color: "from-green-400", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&auto=format&fit=crop" },
];

export const LandingView: React.FC<Props> = ({ player, gallery, settings, onUpdateSettings, onStart, onStartFanfic, onStartFreeStyle, onStartWorldCreation, onOpenImportWorld, onContinue, onOpenSaveManager, onOpenSettings }) => {
  const [latestSave, setLatestSave] = useState<{slot: string, metadata: SaveMetadata} | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  const displayList = gallery.length > 0 
    ? gallery.map((img, idx) => ({
        name: `Thực Thể #${(idx + 1).toString().padStart(3, '0')}`,
        title: "Dữ liệu nạp từ bộ nhớ",
        genre: img.genre || "ARCHIVE",
        color: "from-emerald-500",
        img: img.url
      }))
    : FALLBACK_BEAUTIES;

  useEffect(() => {
    const checkSave = async () => {
      const latest = await dbService.getLatestSave();
      if (latest && latest.data && latest.data.metadata) {
        setLatestSave({
          slot: latest.slot,
          metadata: latest.data.metadata
        });
      }
    };
    checkSave();
  }, []);

  // Fix: changed s.initialChoices.length to s.scenarios.length as initialChoices is not a property of SubScenario
  const totalScenarios = GAME_ARCHETYPES.reduce((acc, w) => 
    acc + w.subScenarios.reduce((sAcc, s) => sAcc + s.scenarios.length, 0), 0
  );

  const apiStatus = (() => {
    if (settings.proxyUrl && settings.proxyUrl.trim() !== "") {
      return {
        text: `PROXY ACTIVE | MODEL: ${settings.proxyModel || 'Auto'}`,
        color: 'text-blue-400',
        dotColor: 'bg-blue-400 shadow-[0_0_10px_#60a5fa]'
      };
    }
    if (settings.userApiKeys && settings.userApiKeys.length > 0 && settings.userApiKeys.some(k => k.trim() !== "")) {
      return {
        text: `API KEY ACTIVE | MODEL: ${settings.aiModel}`,
        color: 'text-emerald-400',
        dotColor: 'bg-emerald-500 shadow-[0_0_10px_#10b981]'
      };
    }
    return {
      text: 'REQUIRE API KEY / PROXY',
      color: 'text-red-500 animate-pulse',
      dotColor: 'bg-red-500 shadow-[0_0_10px_#ef4444]'
    };
  })();

  return (
    <div className={`LandingView absolute inset-0 bg-[#020202] flex animate-in fade-in duration-1000 overflow-hidden font-sans ${settings.mobileMode ? 'flex-col' : 'flex-col md:flex-row'}`}>
      
      {/* 1. DYNAMIC BACKGROUND EFFECTS */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[150px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[150px] animate-pulse delay-1000"></div>
        
        {/* Moving Grid Lines */}
        <div className="h-full w-full opacity-10 bg-[linear-gradient(rgba(16,185,129,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.1)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]"></div>
        
        {/* Scanning Line Effect */}
        <div className="absolute left-0 w-full h-[1px] bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-scan"></div>
      </div>

      {/* 2. LEFT SIDEBAR: QUANTUM CONSOLE */}
      <div className={`${settings.mobileMode ? 'w-full h-full p-6 overflow-y-auto custom-scrollbar' : 'w-full md:w-[28rem] p-10'} border-r border-white/10 bg-black/40 backdrop-blur-3xl flex flex-col justify-between relative z-20 shrink-0 shadow-[20px_0_50px_rgba(0,0,0,0.5)]`}>
        
        <div className={settings.mobileMode ? 'space-y-8' : 'space-y-12'}>
          {/* BRANDING AREA */}
          <div className="relative group">
            <div className="absolute -inset-4 bg-emerald-500/5 rounded-2xl blur-xl group-hover:bg-emerald-500/10 transition-all duration-500"></div>
            <div className="relative flex items-center gap-5">
              <div className={`${settings.mobileMode ? 'w-12 h-12 text-xl' : 'w-16 h-16 text-3xl'} bg-emerald-500 rounded-2xl flex items-center justify-center font-black text-black shadow-[0_0_30px_rgba(16,185,129,0.4)] animate-float`}>M</div>
              <div className="flex-grow">
                <h2 className={`${settings.mobileMode ? 'text-xl' : 'text-[17px]'} font-black text-white uppercase tracking-tighter not-italic leading-[16px]`} style={{ fontSize: '17px' }}>
                  <span className="text-emerald-500 text-glow">MATRIX</span>
                </h2>
                <div className="flex items-center gap-2 mt-2">
                   <div className="h-0.5 w-12 bg-emerald-500 rounded-full"></div>
                </div>
              </div>

              {/* Login/Logout Section removed */}
            </div>
          </div>

          {/* MAIN NAV HUD */}
          <nav className="flex flex-col gap-3 md:gap-4">
            <button 
              onClick={onStart} 
              className="group relative p-4 md:p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl text-left hover:border-emerald-500 hover:bg-emerald-500/10 transition-all overflow-hidden shadow-lg active:scale-95"
            >
              <div className="absolute left-0 top-0 w-1 h-full bg-emerald-500 -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
              <div className="flex justify-between items-center relative z-10">
                <div className="space-y-1">
                  <span className="mono text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-emerald-400 block group-hover:text-white transition-colors">Khởi Chạy Vận Mệnh</span>
                  <span className="text-[8px] md:text-[9px] mono text-neutral-600 font-bold uppercase block">Kịch Bản Phân Nhánh: {totalScenarios.toLocaleString()}</span>
                </div>
                <span className="text-xl md:text-2xl opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300">❯</span>
              </div>
            </button>

            <button 
              onClick={onStartFanfic || onStart} 
              className="group relative p-4 md:p-5 bg-purple-500/5 border border-purple-500/20 rounded-2xl text-left hover:border-purple-500 hover:bg-purple-500/10 transition-all overflow-hidden shadow-lg active:scale-95"
            >
              <div className="absolute left-0 top-0 w-1 h-full bg-purple-500 -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
              <div className="flex justify-between items-center relative z-10">
                <div className="space-y-1">
                  <span className="mono text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-purple-400 block group-hover:text-white transition-colors">Khởi Chạy Vận Mệnh Đồng Nhân</span>
                  <span className="text-[8px] md:text-[9px] mono text-neutral-600 font-bold uppercase block">Thế Giới Sáng Tạo: Fan-Fiction Mode</span>
                </div>
                <span className="text-xl md:text-2xl opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300">❯</span>
              </div>
            </button>

            <button 
              onClick={onOpenImportWorld} 
              className="group relative p-4 md:p-5 bg-emerald-500/5 border border-dashed border-emerald-500/30 rounded-2xl text-left hover:border-emerald-500 hover:bg-emerald-500/10 transition-all overflow-hidden shadow-lg active:scale-95"
            >
              <div className="absolute left-0 top-0 w-1 h-full bg-emerald-500 -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
              <div className="flex justify-between items-center relative z-10">
                <div className="space-y-1">
                  <span className="mono text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-emerald-400 block group-hover:text-white transition-colors">Kiến Tạo Từ Dữ Liệu Ngoài</span>
                  <span className="text-[8px] md:text-[9px] mono text-neutral-600 font-bold uppercase block">Nhập dữ liệu từ SillyTavern hoặc Hình ảnh</span>
                </div>
                <span className="text-xl md:text-2xl opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300">✨</span>
              </div>
            </button>

            <button 
              onClick={onStartWorldCreation || onStartFreeStyle || onStart} 
              className="group relative p-4 md:p-5 bg-amber-500/5 border border-amber-500/20 rounded-2xl text-left hover:border-amber-500 hover:bg-amber-500/10 transition-all overflow-hidden shadow-lg active:scale-95"
            >
              <div className="absolute left-0 top-0 w-1 h-full bg-amber-500 -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
              <div className="flex justify-between items-center relative z-10">
                <div className="space-y-1">
                  <span className="mono text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-amber-400 block group-hover:text-white transition-colors">Khởi Chạy Vận Mệnh Tự Do</span>
                  <span className="text-[8px] md:text-[9px] mono text-neutral-600 font-bold uppercase block">Thế Giới Sandbox: Free-Style Mode</span>
                </div>
                <span className="text-xl md:text-2xl opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300">❯</span>
              </div>
            </button>

            <button 
              onClick={() => latestSave && onContinue(latestSave.slot)} 
              disabled={!latestSave} 
              className={`group relative p-4 md:p-5 bg-blue-500/5 border border-blue-500/20 rounded-2xl text-left transition-all overflow-hidden shadow-lg active:scale-95 ${latestSave ? 'hover:border-blue-400 hover:bg-blue-500/10' : 'opacity-20 grayscale cursor-not-allowed'}`}
            >
              <div className="absolute left-0 top-0 w-1 h-full bg-blue-500 -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
              <div className="flex justify-between items-center relative z-10">
                <div className="space-y-1">
                  <span className="mono text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-blue-400 block group-hover:text-white transition-colors">Tiếp Tục Thực Tại</span>
                  {latestSave ? (
                    <span className="text-[8px] md:text-[9px] mono text-blue-500/40 font-bold uppercase block truncate max-w-[15rem]">{latestSave.metadata.playerName} // Lượt {latestSave.metadata.turnCount}</span>
                  ) : (
                    <span className="text-[8px] md:text-[9px] mono text-neutral-700 font-bold uppercase block">Không tìm thấy tệp lưu</span>
                  )}
                </div>
                <span className="text-xl md:text-2xl opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300">❯</span>
              </div>
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={onOpenSaveManager} 
                className="p-3 md:p-4 bg-white/[0.03] border border-white/10 rounded-2xl hover:bg-amber-500/10 hover:border-amber-500/50 transition-all text-center group active:scale-95 shadow-md"
              >
                <span className="block text-lg mb-1 group-hover:scale-110 transition-transform">💾</span>
                <span className="mono text-[8px] md:text-[9px] font-black text-neutral-500 group-hover:text-amber-400 uppercase tracking-widest">Dữ Liệu</span>
              </button>
              <button 
                onClick={onOpenSettings} 
                className="p-3 md:p-4 bg-white/[0.03] border border-white/10 rounded-2xl hover:bg-white/10 hover:border-white/40 transition-all text-center group active:scale-95 shadow-md"
              >
                <span className="block text-lg mb-1 group-hover:scale-110 transition-transform">⚙️</span>
                <span className="mono text-[8px] md:text-[9px] font-black text-neutral-500 group-hover:text-white uppercase tracking-widest">Cấu Hình</span>
              </button>
            </div>

            <button 
              onClick={() => onUpdateSettings({ mobileMode: !settings.mobileMode })} 
              className={`w-full p-3 md:p-4 border rounded-2xl transition-all flex items-center justify-center gap-3 group active:scale-95 shadow-md ${settings.mobileMode ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-white/[0.03] border-white/10 text-neutral-500 hover:bg-white/10 hover:border-white/40'}`}
            >
              <span className="text-xl group-hover:scale-110 transition-transform">{settings.mobileMode ? '📱' : '💻'}</span>
              <span className="mono text-[9px] md:text-[10px] font-black uppercase tracking-widest">
                {settings.mobileMode ? 'Chế độ: DI ĐỘNG' : 'Chế độ: MÁY TÍNH'}
              </span>
            </button>
          </nav>

          {/* MOBILE GALLERY PREVIEW */}
          {settings.mobileMode && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h4 className="text-[10px] mono font-black text-emerald-500 uppercase tracking-widest italic">Phòng Trưng Bày</h4>
                <span className="text-[8px] mono text-neutral-600 uppercase">{displayList.length} ARCHIVES</span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar snap-x">
                {displayList.map((beauty, i) => (
                  <div key={i} className="shrink-0 w-24 aspect-[2/3] rounded-xl border border-white/10 overflow-hidden snap-start relative group">
                    <ResolvedImage src={beauty.img} alt={beauty.name} className="w-full h-full object-cover brightness-75" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                    <div className="absolute bottom-1 left-1 right-1">
                      <p className="text-[6px] font-black text-white truncate uppercase">{beauty.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}


        </div>

        {/* VERSION & CONSOLE LINK */}
        <div className={`flex flex-col gap-2 px-2 mt-8`}>
           <div className="flex items-center gap-3">
              <span className={`w-2 h-2 rounded-full ${apiStatus.dotColor}`}></span>
              <span className={`text-[8px] leading-[9px] mono font-black uppercase tracking-widest italic ${apiStatus.color}`}>
                {apiStatus.text}
              </span>
           </div>
           <div className="flex items-center gap-3 opacity-40">
              <div className="w-2 h-2"></div>
            <span className="text-[8px] md:text-[9px] mono text-neutral-700 font-black uppercase tracking-widest italic">Matrix by Thích Ma Đạo</span>
           </div>
        </div>
      </div>

      {/* 3. RIGHT AREA: BEAUTY GALLERY HOLOGRAM GRID - HIDE ON MOBILE TO SHOW DIFFERENCE */}
      {!settings.mobileMode && (
        <div className="flex-grow relative flex flex-col bg-[#050505]/40 overflow-hidden">
          {/* Header HUD - Minimalist */}
          <div className="p-10 pb-4 z-10 flex justify-between items-end relative shrink-0">
             <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 bg-emerald-500 text-black text-[8px] mono font-black uppercase tracking-[0.2em] rounded-sm">ACTIVE_SCAN</span>
                  <h4 className="text-[11px] mono font-black text-emerald-500 uppercase tracking-[0.5em]">Mỹ Nhân Đồ // Archive_01</h4>
                </div>
                <h2 className="text-6xl font-black text-white uppercase tracking-tighter italic opacity-90 leading-none">PHÒNG_TRƯNG_BÀY</h2>
             </div>
             <div className="text-right flex flex-col items-end gap-3">
                <div className="px-4 py-2 bg-black/60 border border-white/5 rounded-xl backdrop-blur-md">
                   <span className="text-[10px] mono font-black text-emerald-400 uppercase tracking-widest italic">Mật Độ Bộ Nhớ: <span className="text-white">CAO</span></span>
                </div>
                <div className="flex gap-1.5">
                  {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="w-1.5 h-1.5 bg-emerald-500/30 rounded-full animate-pulse" style={{animationDelay: `${i*150}ms`}}></div>)}
                </div>
             </div>
          </div>

          {/* Hologram Card Grid */}
          <div className="flex-grow overflow-y-auto custom-scrollbar p-10 pt-2 overscroll-contain">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-5 md:gap-6">
              {displayList.map((beauty, i) => (
                <div 
                  key={i}
                  className="relative group transition-all duration-700 hover:z-20 perspective-1000"
                  style={{ 
                    animationDelay: `${i * 60}ms`,
                    animation: 'fade-in-up 1s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                    opacity: 0
                  }}
                >
                  {/* 3D Tilt Effect Wrapper */}
                  <div className="relative transition-all duration-700 group-hover:scale-110 group-hover:-translate-y-4">
                    
                    {/* Outer Glow */}
                    <div className={`absolute -inset-1 bg-gradient-to-t ${beauty.color} to-transparent blur-[20px] opacity-0 group-hover:opacity-60 transition-opacity duration-700`}></div>
                    
                    {/* Card Frame */}
                    <div className="relative aspect-[2/3] rounded-2xl border border-white/10 bg-neutral-950 overflow-hidden shadow-2xl group-hover:border-emerald-500/50 transition-all duration-700">
                      
                      {/* Character Image */}
                      <ResolvedImage 
                        src={beauty.img} 
                        alt={beauty.name} 
                        className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-125 brightness-75 group-hover:brightness-100"
                      />
                      
                      {/* Holographic Scan Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                      <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-10 transition-opacity duration-700">
                         <div className="w-full h-full bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,#fff_2px,#fff_3px)]"></div>
                      </div>

                      {/* Corner Borders */}
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-emerald-500/0 group-hover:border-emerald-500/40 rounded-tr-2xl transition-all duration-700"></div>
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-emerald-500/0 group-hover:border-emerald-500/40 rounded-bl-2xl transition-all duration-700"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="h-32"></div>
          </div>

          {/* DECORATIVE HUD BACKGROUND TEXT */}
          <div className="absolute bottom-10 right-10 flex flex-col items-end opacity-[0.03] pointer-events-none z-0 select-none">
             <span className="mono text-sm font-black text-emerald-500 uppercase tracking-[2em] mb-4 italic">GENESIS_PROTOCOL_ACTIVE</span>
             <span className="mono text-[250px] font-black text-white uppercase leading-none">MA_TRẬN</span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes scan {
          0% { top: 0; opacity: 0; }
          50% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-scan {
          animation: scan 8s linear infinite;
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .text-glow {
          text-shadow: 0 0 20px rgba(16, 185, 129, 0.6);
        }
        .perspective-1000 {
          perspective: 1000px;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.01);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(16, 185, 129, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(16, 185, 129, 0.5);
        }
      `}</style>
    </div>
  );
};
