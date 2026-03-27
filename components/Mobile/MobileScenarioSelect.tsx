import React, { useState, useEffect } from 'react';
import { SubScenario, AppSettings } from '../../types';
import { ToastType } from '../Toast';
import { gameAI } from '../../services/geminiService';

interface Props {
  context: SubScenario;
  onSelect: (scenario: string | { id: string, label: string, description: string, icon: string }) => void;
  onBack: () => void;
  onMcSetup?: () => void;
  isFreeStyle?: boolean;
  onExport?: () => void;
  onImport?: () => void;
  settings: AppSettings;
  addToast?: (message: string, type?: ToastType) => void;
}

export const MobileScenarioSelect: React.FC<Props> = ({ context, onSelect, onBack, onMcSetup, isFreeStyle, onExport, onImport, settings, addToast }) => {
  const [customInput, setCustomInput] = useState('');
  const [scenarioMode, setScenarioMode] = useState<'full' | 'short' | 'manual'>('manual');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [genTime, setGenTime] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isAiGenerating) {
      setGenTime(0);
      interval = setInterval(() => {
        setGenTime(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isAiGenerating]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAiCreative = async () => {
    if (!customInput.trim() || isAiGenerating) return;
    setIsAiGenerating(true);
    const startTime = Date.now();
    try {
      const scenario = await gameAI.generateFreeStyleScenario(customInput, settings);
      if (scenario) {
        setCustomInput(scenario);
        setScenarioMode('full');
        if (addToast) {
          const duration = ((Date.now() - startTime) / 1000).toFixed(1);
          const modelInfo = settings.proxyEnabled && settings.proxyUrl && settings.proxyKey 
            ? `Proxy (${settings.proxyModel || settings.aiModel})` 
            : `API Key (${settings.aiModel})`;
          addToast(`Đã sáng tạo xong! Thời gian: ${duration}s. Model: ${modelInfo}`, 'success');
        }
      }
    } catch (error) {
      console.error("AI Creative failed:", error);
      if (addToast) addToast("Sáng tạo thất bại. Vui lòng kiểm tra cấu hình AI.", "error");
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleAiCreativeShort = async () => {
    if (!customInput.trim() || isAiGenerating) return;
    setIsAiGenerating(true);
    const startTime = Date.now();
    try {
      const scenario = await gameAI.generateFreeStyleScenario(customInput, settings, true);
      if (scenario) {
        setCustomInput(scenario);
        setScenarioMode('short');
        if (addToast) {
          const duration = ((Date.now() - startTime) / 1000).toFixed(1);
          const modelInfo = settings.proxyEnabled && settings.proxyUrl && settings.proxyKey 
            ? `Proxy (${settings.proxyModel || settings.aiModel})` 
            : `API Key (${settings.aiModel})`;
          addToast(`Đã sáng tạo xong kịch bản ngắn! Thời gian: ${duration}s. Model: ${modelInfo}`, 'success');
        }
      }
    } catch (error) {
      console.error("AI Creative Short failed:", error);
      if (addToast) addToast("Sáng tạo ngắn thất bại. Vui lòng kiểm tra cấu hình AI.", "error");
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleAiRewrite = async () => {
    if (isAiGenerating) return;
    setIsAiGenerating(true);
    const startTime = Date.now();
    try {
      let prompt = "";
      if (customInput.trim()) {
        if (scenarioMode === 'short') {
          prompt = `Hãy viết lại kịch bản ngắn này một cách trau chuốt và hấp dẫn hơn, nhưng phải bám sát ý tưởng ban đầu và không được sáng tạo quá xa: ${customInput.trim()}`;
        } else if (scenarioMode === 'full') {
          prompt = `Hãy viết lại kịch bản chi tiết này một cách trau chuốt và hấp dẫn hơn, nhưng phải bám sát ý tưởng ban đầu và không được sáng tạo quá xa: ${customInput.trim()}`;
        } else {
          prompt = `Hãy viết lại kịch bản này một cách trau chuốt và hấp dẫn hơn, bám sát ý tưởng gốc: ${customInput.trim()}`;
        }
      } else {
        prompt = "Hãy viết một kịch bản ngẫu nhiên và hấp dẫn cho một trò chơi nhập vai.";
      }
      
      const scenario = await gameAI.generateFreeStyleScenario(prompt, settings, scenarioMode === 'short');
      if (scenario) {
        setCustomInput(scenario);
        if (addToast) {
          const duration = ((Date.now() - startTime) / 1000).toFixed(1);
          const modelInfo = settings.proxyEnabled && settings.proxyUrl && settings.proxyKey 
            ? `Proxy (${settings.proxyModel || settings.aiModel})` 
            : `API Key (${settings.aiModel})`;
          addToast(`Đã viết lại kịch bản mới! Thời gian: ${duration}s. Model: ${modelInfo}`, 'success');
        }
      }
    } catch (error) {
      console.error("AI Rewrite failed:", error);
      if (addToast) addToast("Viết lại thất bại. Vui lòng kiểm tra cấu hình AI.", "error");
    } finally {
      setIsAiGenerating(false);
    }
  };

  return (
    <div className="MobileScenarioSelect flex-grow flex flex-col p-2 pb-8 overflow-y-auto custom-scrollbar bg-black">
      <div className="mb-8 mt-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
            <h2 className="text-base font-black text-white uppercase tracking-tighter italic">{isFreeStyle ? 'Kiến Tạo Thực Tại' : 'Chọn Thân Phận'}</h2>
          </div>
          <div className="flex items-center gap-2">
            {onImport && (
              <button 
                onClick={onImport}
                className="p-2 bg-blue-500/10 border border-dashed border-blue-500/40 rounded-xl text-blue-500 text-[10px] font-black uppercase tracking-widest active:scale-90 transition-all"
                title="Nhập"
              >
                📥
              </button>
            )}
            {onExport && (
              <button 
                onClick={onExport}
                className="p-2 bg-amber-500/10 border border-dashed border-amber-500/40 rounded-xl text-amber-500 text-[10px] font-black uppercase tracking-widest active:scale-90 transition-all"
                title="Xuất"
              >
                📤
              </button>
            )}
            {onMcSetup && (
              <button 
                onClick={onMcSetup}
                className="p-2 bg-blue-500/10 border border-dashed border-blue-500/40 rounded-xl text-blue-500 text-[10px] font-black uppercase tracking-widest active:scale-90 transition-all flex items-center gap-2"
              >
                <span>👤</span>
              </button>
            )}
            <button onClick={onBack} className="p-2 bg-white/5 border border-white/10 rounded-xl text-neutral-400 text-xs font-black uppercase tracking-widest active:scale-90 transition-all">
              ←
            </button>
          </div>
        </div>
        <p className="text-[10px] mono text-neutral-500 uppercase font-bold tracking-widest">{context.title} // {isFreeStyle ? 'Thiết lập bối cảnh' : 'Thiết lập nhân dạng'}</p>
        <p className="text-[8px] text-neutral-600 font-bold uppercase tracking-widest mt-1 italic">Bỏ qua thiết lập nhân vật chính cũng được, AI dùng mặc định</p>
      </div>

      {isFreeStyle ? (
        <div className="space-y-4">
          <div className="relative bg-neutral-900 border border-white/10 rounded-xl overflow-hidden shadow-inner">
            <textarea 
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Nhập bối cảnh thế giới của bạn tại đây..."
              className="w-full h-48 bg-transparent border-none outline-none p-4 text-white text-sm leading-relaxed resize-none mono custom-scrollbar"
            />
            <div className="px-3 py-2 bg-black/40 flex justify-between items-center border-t border-white/5">
              <div className="flex gap-3">
                <button 
                  onClick={handleAiCreative} 
                  disabled={!customInput.trim() || isAiGenerating}
                  className="text-[9px] font-black uppercase text-emerald-500 hover:text-emerald-400 active:text-emerald-300 transition-colors italic flex items-center gap-1 disabled:opacity-30"
                >
                  {isAiGenerating ? (
                    <>
                      <span className="w-2 h-2 border border-emerald-500 border-t-transparent rounded-full animate-spin"></span>
                      <span>{formatTime(genTime)}</span>
                    </>
                  ) : (
                    <>
                      <span>✨</span>
                      AI Sáng Tạo
                    </>
                  )}
                </button>
                <button 
                  onClick={handleAiCreativeShort}
                  disabled={isAiGenerating || !customInput.trim()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 active:bg-indigo-500 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-wider transition-all rounded-sm"
                >
                  {isAiGenerating ? (
                    <span className="w-2.5 h-2.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>✨</span>
                      <span>Ngắn</span>
                    </>
                  )}
                </button>
                <button 
                  onClick={handleAiRewrite}
                  disabled={isAiGenerating}
                  className="text-[9px] font-black uppercase text-blue-400 active:text-blue-300 transition-colors italic flex items-center gap-1 disabled:opacity-30"
                >
                  <span>🔄</span>
                  Viết lại
                </button>
                <button onClick={() => setCustomInput('')} className="text-[9px] font-black uppercase text-rose-500/50 active:text-rose-500 transition-colors italic">Xóa bộ đệm</button>
              </div>
              <p className="text-[7px] text-neutral-600 font-bold uppercase tracking-widest italic">Dữ liệu: {customInput.length} byte</p>
            </div>
          </div>

          <button 
            onClick={() => {
              if (!customInput.trim()) {
                alert("Vui lòng nhập bối cảnh!");
                return;
              }
              onSelect(customInput);
            }}
            disabled={isAiGenerating}
            className="w-full py-4 bg-emerald-500 text-black font-black uppercase tracking-widest rounded-xl active:scale-95 transition-all shadow-lg disabled:opacity-50"
          >
            Bắt đầu kiến tạo ❯
          </button>
          
          <div className="grid grid-cols-1 gap-2 mt-4">
            <p className="text-[8px] text-neutral-500 uppercase font-black tracking-widest mb-1">Gợi ý bối cảnh:</p>
            {context.scenarios.map((sc, idx) => (
              <button 
                key={idx}
                onClick={() => setCustomInput(sc)}
                className="p-3 bg-white/5 border border-white/5 rounded-lg text-[10px] text-neutral-400 text-left italic"
              >
                {sc}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-1">
          {context.scenarios.map((scenario, idx) => (
            <button
              key={idx}
              onClick={() => onSelect(scenario)}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/40 active:scale-[0.98] transition-all shadow-xl p-5 text-left"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-sm font-black text-white uppercase italic tracking-tight">{scenario}</h3>
                <span className="text-[16px] opacity-40 mono font-black text-amber-500">{idx + 1}</span>
              </div>
              
              <p className="text-[10px] text-neutral-300 leading-relaxed mb-4 italic">
                Khởi đầu cuộc hành trình với tư cách là {scenario} trong bối cảnh {context.title}.
              </p>
              
              <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                  <span className="text-[9px] mono text-amber-500 font-black uppercase tracking-widest">Sẵn sàng</span>
                </div>
                <span className="text-[10px] mono text-white font-black uppercase tracking-widest bg-amber-500 px-3 py-1 rounded-lg text-black">Bắt đầu ❯</span>
              </div>
            </button>
          ))}

          <button
            onClick={() => onSelect({ id: 'custom', label: 'Tự chọn', description: 'Tự thiết lập thân phận của riêng bạn', icon: '✨' })}
            className="group relative overflow-hidden rounded-2xl border border-dashed border-emerald-500/40 bg-emerald-500/5 active:scale-[0.98] transition-all p-5 text-center"
          >
            <span className="text-2xl mb-2 block">✨</span>
            <h3 className="text-sm font-black text-emerald-500 uppercase italic tracking-tight mb-1">Tự Chọn Thân Phận</h3>
            <p className="text-[10px] text-emerald-500/60 mono uppercase font-bold">Tùy chỉnh mọi thông số nhân vật</p>
          </button>
        </div>
      )}
      
      <button 
        onClick={onBack}
        className="mt-8 p-1 border border-white/10 bg-white/5 rounded-2xl text-neutral-400 mono text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
      >
        ← Quay Lại
      </button>
    </div>
  );
};
