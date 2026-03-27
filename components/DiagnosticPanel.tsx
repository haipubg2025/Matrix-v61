
import React, { useState, useMemo, useEffect } from 'react';
import { GameLog, AppSettings, Player } from '../types';
import { AlertCircle, ChevronRight, Info, Wrench, Zap, X, ShieldAlert, Activity, Cpu, Terminal as TerminalIcon, RefreshCw, Maximize2, Minimize2, Database } from 'lucide-react';

interface DiagnosticPanelProps {
  logs: GameLog[];
  isMobile?: boolean;
  settings?: AppSettings;
  player?: Player;
  isOpen?: boolean;
  onClose?: () => void;
}

interface DiagnosticResult {
  type: string;
  cause: string;
  solution: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: number;
  rawContent: string;
}

export const DiagnosticPanel: React.FC<DiagnosticPanelProps> = ({ logs, isMobile, settings, player, isOpen: externalIsOpen, onClose }) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isExpanded = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsExpanded = onClose || setInternalIsOpen;

  const [lastSeenTimestamp, setLastSeenTimestamp] = useState<number>(Date.now());
  const [hasNewError, setHasNewError] = useState(false);

  const diagnostics = useMemo(() => {
    const errorLogs = logs.filter(log => log.type === 'error');
    // Chỉ lấy tối đa 10 lỗi gần nhất
    return errorLogs.slice(-10).map(log => {
      const content = (log.content || '').toLowerCase();
      let result: {
        type: string;
        cause: string;
        solution: string;
        severity: 'low' | 'medium' | 'high';
      } = {
        type: 'LỖI HỆ THỐNG KHÔNG XÁC ĐỊNH',
        cause: 'Mất đồng bộ trong dòng thời gian hoặc lỗi kết nối máy chủ không xác định.',
        solution: 'Thử lại hành động hoặc tải lại trang (F5).',
        severity: 'medium'
      };

      if (content.includes('api key') || content.includes('invalid')) {
        result = {
          type: 'LỖI XÁC THỰC MA TRẬN (API AUTH ERROR)',
          cause: 'Khóa API (API Key) không hợp lệ, đã hết hạn hoặc bị thu hồi.',
          solution: 'Vào Cài đặt (Settings) -> Kiểm tra lại danh sách API Key. Đảm bảo khóa đang hoạt động trên Google AI Studio.',
          severity: 'high'
        };
      } else if (content.includes('quota') || content.includes('rate limit')) {
        result = {
          type: 'HẾT HẠN MỨC TRUY XUẤT (QUOTA EXCEEDED)',
          cause: 'Tần suất gửi yêu cầu quá nhanh hoặc đã dùng hết hạn mức miễn phí của mô hình.',
          solution: 'Tạm dừng thao tác trong 60 giây. Nếu vẫn lỗi, hãy thêm nhiều API Key khác để hệ thống tự động luân chuyển.',
          severity: 'medium'
        };
      } else if (content.includes('safety') || content.includes('blocked')) {
        result = {
          type: 'BỘ LỌC AN TOÀN KÍCH HOẠT (SAFETY FILTER)',
          cause: 'Hành động hoặc lời dẫn truyện vi phạm chính sách nội dung (Bạo lực, Nhạy cảm quá mức...).',
          solution: 'Thay đổi cách diễn đạt hành động. Tránh các từ ngữ quá trực diện hoặc thô tục. Thử một hướng tiếp cận khác.',
          severity: 'medium'
        };
      } else if (content.includes('phân tích dữ liệu') || content.includes('json') || content.includes('parse_error')) {
        result = {
          type: 'LỖI CẤU TRÚC LƯỢNG TỬ (DATA PARSE ERROR)',
          cause: 'AI phản hồi dữ liệu bị lỗi cấu trúc JSON hoặc bị ngắt quãng giữa chừng.',
          solution: 'Nhấn F5 (Refresh) trình duyệt để đồng bộ lại thực tại. Nếu lặp lại, hãy thử "Tải Lại" (Retry) hành động trong khung chat.',
          severity: 'low'
        };
      } else if (content.includes('proxy')) {
        result = {
          type: 'LỖI MÁY CHỦ TRUNG GIAN (PROXY ERROR)',
          cause: 'Không thể kết nối tới Proxy hoặc Proxy Key/URL không hợp lệ.',
          solution: 'Kiểm tra lại cấu hình Proxy trong phần Cài đặt. Đảm bảo máy chủ Proxy đang hoạt động.',
          severity: 'high'
        };
      } else if (content.includes('network') || content.includes('fetch') || content.includes('kết nối') || content.includes('failed to fetch')) {
        result = {
          type: 'MẤT KẾT NỐI THỰC TẠI (NETWORK ERROR)',
          cause: 'Đường truyền internet không ổn định hoặc máy chủ Gemini không phản hồi.',
          solution: 'Kiểm tra kết nối mạng của bạn. Nhấn "Retry" để gửi lại yêu cầu.',
          severity: 'high'
        };
      }

      return { ...result, timestamp: log.timestamp, rawContent: log.content };
    });
  }, [logs]);

  useEffect(() => {
    const latestError = diagnostics[diagnostics.length - 1];
    if (latestError && latestError.timestamp > lastSeenTimestamp) {
      setHasNewError(true);
    }
  }, [diagnostics, lastSeenTimestamp]);

  const handleOpen = () => {
    setIsExpanded(true);
    setHasNewError(false);
    if (diagnostics.length > 0) {
      setLastSeenTimestamp(diagnostics[diagnostics.length - 1].timestamp);
    }
  };

  if (!isExpanded) return null;

  return (
    <div className="DiagnosticPanel fixed inset-0 z-[1000] bg-neutral-950 flex flex-col animate-in fade-in duration-300 overflow-hidden font-mono">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      
      {/* Header */}
      <div className="h-16 border-b border-white/10 bg-neutral-900/50 backdrop-blur-xl flex items-center justify-between px-6 relative z-10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-rose-500" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white uppercase tracking-[0.2em] italic">Hệ Thống Chẩn Đoán Ma Trận</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest">Status: Monitoring // Errors: {diagnostics.length}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsExpanded(false)}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black text-neutral-400 hover:text-white transition-all uppercase tracking-widest"
          >
            <Minimize2 className="w-3 h-3" /> Thu nhỏ
          </button>
          <button 
            onClick={() => setIsExpanded(false)}
            className="w-10 h-10 flex items-center justify-center bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-black rounded-xl border border-rose-500/20 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow overflow-hidden flex flex-col md:flex-row relative z-10">
        {/* Left Sidebar: Error List */}
        <div className="w-full md:w-96 border-r border-white/10 bg-black/20 flex flex-col shrink-0">
          <div className="p-4 border-b border-white/10 bg-white/5">
            <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Nhật ký lỗi (Error Logs)</span>
          </div>
          <div className="flex-grow overflow-y-auto custom-scrollbar p-2 space-y-2">
            {diagnostics.length > 0 ? (
              diagnostics.slice().reverse().map((diag, idx) => (
                <div 
                  key={idx} 
                  className={`p-4 rounded-xl border transition-all ${
                    diag.severity === 'high' 
                      ? 'bg-rose-500/5 border-rose-500/20' 
                      : diag.severity === 'medium'
                      ? 'bg-orange-500/5 border-orange-500/20'
                      : 'bg-blue-500/5 border-blue-500/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Activity className={`w-3 h-3 ${diag.severity === 'high' ? 'text-rose-500' : 'text-orange-500'}`} />
                      <span className="text-[10px] font-black text-white uppercase truncate max-w-[180px]">{diag.type}</span>
                    </div>
                    <span className="text-[8px] text-neutral-600 font-bold">{new Date(diag.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden mb-3">
                    <div className={`h-full ${diag.severity === 'high' ? 'w-full bg-rose-500' : diag.severity === 'medium' ? 'w-2/3 bg-orange-500' : 'w-1/3 bg-blue-500'}`}></div>
                  </div>
                  <p className="text-[9px] text-neutral-400 leading-relaxed line-clamp-2 italic">"{diag.cause}"</p>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-20 text-center p-8">
                <Zap className="w-12 h-12 mb-4 text-emerald-500" />
                <p className="text-[10px] font-black uppercase tracking-widest">Hệ thống ổn định</p>
                <p className="text-[8px] mt-2">Không phát hiện lỗi lượng tử nào.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Area: Detailed Report */}
        <div className="flex-grow overflow-y-auto custom-scrollbar p-6 md:p-12 bg-black/40">
          <div className="max-w-4xl mx-auto space-y-12">
            {/* Report Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 bg-rose-500 text-black text-[10px] font-black uppercase tracking-widest rounded">BÁO CÁO KHẨN CẤP</span>
                  <span className="text-[10px] text-neutral-500 font-bold mono">REF: {Date.now().toString(16).toUpperCase()}</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter italic leading-none">
                  PHÂN TÍCH LỖI HỆ THỐNG
                </h1>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Thời gian tạo báo cáo</p>
                <p className="text-sm text-white font-black mono">{new Date().toLocaleString()}</p>
              </div>
            </div>

            {/* Diagnostic Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 bg-neutral-900/50 border border-white/5 rounded-2xl">
                <Cpu className="w-6 h-6 text-blue-500 mb-4" />
                <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">Mô hình AI</h4>
                <p className="text-lg text-white font-black uppercase tracking-tight">
                  {(settings?.proxyUrl && settings?.proxyKey && settings?.proxyModel) ? settings.proxyModel : (settings?.aiModel || 'Unknown')}
                </p>
              </div>
              <div className="p-6 bg-neutral-900/50 border border-white/5 rounded-2xl">
                <Database className="w-6 h-6 text-amber-500 mb-4" />
                <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">Tiêu thụ Token</h4>
                <div className="flex items-baseline gap-2">
                  <p className="text-lg text-white font-black uppercase tracking-tight">{player?.tokenUsage?.latest?.toLocaleString() || 0}</p>
                  <span className="text-[10px] text-neutral-500 font-bold">/ {player?.tokenUsage?.total?.toLocaleString() || 0} TOTAL</span>
                </div>
                {/* Token History Visualization (Last 5 turns) */}
                <div className="mt-3 flex items-end gap-1 h-8">
                  {(player?.tokenUsage?.history || []).slice().reverse().map((tokens, i) => {
                    const max = Math.max(...(player?.tokenUsage?.history || [1]));
                    const height = Math.max(10, (tokens / max) * 100);
                    return (
                      <div 
                        key={i} 
                        className="flex-1 bg-amber-500/20 rounded-t-sm relative group"
                        style={{ height: `${height}%` }}
                      >
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-1.5 py-0.5 bg-black text-[6px] font-bold text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                          {tokens.toLocaleString()}
                        </div>
                        <div className="absolute inset-0 bg-amber-500/40 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </div>
                    );
                  })}
                  {(!player?.tokenUsage?.history || player.tokenUsage.history.length === 0) && (
                    <div className="w-full h-px bg-white/5 self-center"></div>
                  )}
                </div>
              </div>
              <div className="p-6 bg-neutral-900/50 border border-white/5 rounded-2xl">
                <Activity className="w-6 h-6 text-emerald-500 mb-4" />
                <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">Tình trạng Core</h4>
                <p className="text-lg text-white font-black uppercase tracking-tight">Ổn định (88%)</p>
              </div>
              <div className="p-6 bg-neutral-900/50 border border-white/5 rounded-2xl">
                <ShieldAlert className="w-6 h-6 text-rose-500 mb-4" />
                <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">Cấp độ đe dọa</h4>
                <p className="text-lg text-rose-500 font-black uppercase tracking-tight">
                  {diagnostics.some(d => d.severity === 'high') ? 'NGHIÊM TRỌNG' : diagnostics.length > 0 ? 'TRUNG BÌNH' : 'THẤP'}
                </p>
              </div>
            </div>

            {/* Detailed Diagnostic Items */}
            <div className="space-y-8">
              <h3 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-4">
                <TerminalIcon className="w-5 h-5 text-amber-500" /> CHI TIẾT CHẨN ĐOÁN
                <div className="h-px flex-grow bg-white/10"></div>
              </h3>

              {diagnostics.length > 0 ? (
                diagnostics.slice().reverse().map((diag, idx) => (
                  <div key={idx} className="group relative">
                    <div className="absolute -left-4 top-0 bottom-0 w-1 bg-rose-500/50 rounded-full group-hover:bg-rose-500 transition-all"></div>
                    <div className="bg-neutral-900/30 border border-white/5 rounded-3xl p-8 space-y-6 hover:bg-neutral-900/50 transition-all">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h4 className="text-2xl font-black text-white uppercase tracking-tight italic">{diag.type}</h4>
                        <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                          diag.severity === 'high' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-orange-500/10 border-orange-500/20 text-orange-500'
                        }`}>
                          SEVERITY: {diag.severity.toUpperCase()}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <h5 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                            <Info className="w-3 h-3" /> Nguyên nhân gốc rễ
                          </h5>
                          <p className="text-sm text-neutral-300 leading-relaxed font-medium">
                            {diag.cause}
                          </p>
                        </div>
                        <div className="space-y-3">
                          <h5 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                            <Wrench className="w-3 h-3" /> Giải pháp khắc phục
                          </h5>
                          <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                            <p className="text-sm text-emerald-400 font-bold leading-relaxed">
                              {diag.solution}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-white/5">
                        <h5 className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-3">Dữ liệu thô (Raw Log Data)</h5>
                        <div className="bg-black/60 rounded-xl p-4 font-mono text-[10px] text-neutral-500 overflow-x-auto whitespace-pre-wrap border border-white/5">
                          {diag.rawContent}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-24 border-2 border-dashed border-white/5 rounded-[3rem] flex flex-col items-center justify-center text-center opacity-20">
                  <RefreshCw className="w-16 h-16 mb-6 animate-spin-slow" />
                  <p className="text-xl font-black uppercase tracking-[0.3em]">Hệ thống đang quét...</p>
                  <p className="text-xs mt-2">Không tìm thấy bất thường nào trong cấu trúc thực tại.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 opacity-30">
              <div className="flex items-center gap-4">
                <Zap className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-[0.5em]">MATRIX_V4_STREAMING_DIAGNOSTICS</span>
              </div>
              <div className="flex gap-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-1 h-1 rounded-full bg-white"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
