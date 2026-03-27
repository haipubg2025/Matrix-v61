
import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Copy, Check, RefreshCw } from 'lucide-react';
import { GameLog, Player, GameGenre, getGenreMeta, AppSettings } from '../types';
import { MobileTerminal } from './Mobile/MobileTerminal';
import { dbService } from '../services/dbService';

interface TerminalProps {
  logs: GameLog[];
  onCommand: (cmd: string, timeCost?: number) => void;
  onOpenAiHint?: () => void;
  onRetry?: () => void;
  onRegenerateImage?: (logIndex: number) => Promise<void>;
  onUpdateLog?: (index: number, newContent: string) => void;
  onToggleDiagnostics?: () => void;
  lastAction?: { command: string, timeCost?: number } | null;
  isLoading: boolean;
  loadingProgress?: number;
  loadingStep?: string;
  placeholder?: string;
  player: Player;
  genre?: GameGenre;
  isMobile?: boolean;
  settings: AppSettings;
}

const NarratorImage: React.FC<{ imageUrl: string; alt: string }> = ({ imageUrl, alt }) => {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    if (!imageUrl) return;

    if (imageUrl.startsWith('http') || imageUrl.startsWith('data:')) {
      setResolvedUrl(imageUrl);
      return;
    }

    // It's an image ID, resolve it
    setIsResolving(true);
    dbService.loadImage(imageUrl).then(data => {
      if (data) setResolvedUrl(data);
      setIsResolving(false);
    }).catch(err => {
      console.error("Failed to resolve image ID:", err);
      setIsResolving(false);
    });
  }, [imageUrl]);

  if (isResolving) {
    return (
      <div className="mt-4 w-full aspect-video bg-white/5 animate-pulse rounded-xl flex items-center justify-center border border-white/10">
        <RefreshCw className="w-6 h-6 text-emerald-500/50 animate-spin" />
      </div>
    );
  }

  if (!resolvedUrl) return null;

  return (
    <div className="mt-4 rounded-xl overflow-hidden border border-white/10 shadow-2xl animate-in fade-in zoom-in duration-1000 max-w-2xl relative group/img">
      <img 
        src={resolvedUrl} 
        alt={alt} 
        className="w-full h-auto object-cover"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

export const Terminal: React.FC<TerminalProps> = (props) => {
  const { 
    logs, onCommand, onOpenAiHint, onRetry, onRegenerateImage, onToggleDiagnostics, isLoading, loadingProgress = 0, loadingStep = '',
    placeholder = "Gõ hành động hoặc lời nói của bạn...", 
    player, genre, isMobile, settings, lastAction, onUpdateLog
  } = props;

  if (isMobile) {
    return <MobileTerminal {...props} placeholder={placeholder} />;
  }

  const [input, setInput] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleStartEdit = (index: number, content: string) => {
    setEditingIndex(index);
    setEditValue(content);
  };

  const handleSaveEdit = (index: number) => {
    if (onUpdateLog) {
      onUpdateLog(index, editValue);
    }
    setEditingIndex(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditValue('');
  };

  const genreMeta = getGenreMeta(genre);
  const aiTheme = genreMeta.aiTheme;

  const turnsPerPage = 20;
  
  // Group logs into turns. A turn starts with a 'player' log.
  // Logs before the first 'player' log are grouped as Turn 0.
  const groupedTurns = (() => {
    const result: GameLog[][] = [];
    let currentTurn: GameLog[] = [];
    
    logs.forEach((log) => {
      if (log.type === 'player') {
        if (currentTurn.length > 0) {
          result.push(currentTurn);
        }
        currentTurn = [log];
      } else {
        currentTurn.push(log);
      }
    });
    
    if (currentTurn.length > 0) {
      result.push(currentTurn);
    }
    
    return result;
  })();

  const totalPages = Math.max(1, Math.ceil(groupedTurns.length / turnsPerPage));

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [isInputCollapsed, setIsInputCollapsed] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      // Allow 100px margin for "at bottom" detection
      const atBottom = scrollHeight - scrollTop - clientHeight < 100;
      setIsAtBottom(atBottom);
    }
  };

  // Auto-switch to last page when new logs arrive
  useEffect(() => {
    if (totalPages > currentPage) {
      setCurrentPage(totalPages);
    }
  }, [groupedTurns.length, totalPages]);

  const meta = getGenreMeta(genre);

  const getRankLabel = (level: number, ranks: string[]) => {

    if (!ranks || ranks.length === 0) return 'Vô Danh';

    const rankIndex = Math.min(Math.floor(level / 10), ranks.length - 1);

    return ranks[rankIndex];

  };



  const lastLogRef = useRef<HTMLDivElement>(null);
  const currentTurnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {

    if (textareaRef.current) {

      textareaRef.current.style.height = 'auto';

      const newHeight = Math.min(textareaRef.current.scrollHeight, 150);

      textareaRef.current.style.height = `${newHeight}px`;

    }

  }, [input]);



  useEffect(() => {

    if (!isLoading && textareaRef.current) {

      textareaRef.current.focus();

    }

  }, [isLoading]);



  useEffect(() => {

    let interval: number;

    if (isLoading) {

      setElapsedTime(0);

      interval = window.setInterval(() => {

        setElapsedTime(prev => prev + 1);

      }, 1000);

    }

    return () => {

      if (interval) clearInterval(interval);

    };

  }, [isLoading]);



  const formatTime = (seconds: number) => {

    const mins = Math.floor(seconds / 60);

    const secs = seconds % 60;

    return `${mins}:${secs.toString().padStart(2, '0')}`;

  };



  const handleSubmit = (e?: React.FormEvent, customCmd?: string, timeCost?: number) => {

    if (e) e.preventDefault();

    const finalCmd = customCmd || input;

    if (finalCmd.trim() && !isLoading) {

      onCommand(finalCmd.trim(), timeCost);

      setInput('');

      if (textareaRef.current) {

        textareaRef.current.style.height = 'auto';

      }

    }

  };



  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {

    if (e.key === 'Enter' && !e.shiftKey) {

      e.preventDefault();

      handleSubmit();

    }

  };



  const formatActionTime = (mins: any) => {

    const m = parseInt(mins) || 15;

    if (m >= 60) {

      const h = Math.floor(m / 60);

      const rem = m % 60;

      return rem > 0 ? `${h}h${rem}p` : `${h}h`;

    }

    return `${m}p`;

  };



  const renderContent = (content: any, type?: string) => {
    if (!content) return null;
    let safeContent = typeof content === 'string' ? content : (content.text || JSON.stringify(content));
    
    // Split into lines
    const lines = safeContent.split('\n');
    
    // Grouping logic: group consecutive lines that start with the same [NPC NAME]
    // or are part of a special block (Message, Email, Letter)
    const groups: { 
      npc?: string, 
      lines: string[], 
      isGM?: boolean, 
      specialType?: 'message' | 'email' | 'letter' | 'system' | 'dialogue' | 'thought',
      dialogueName?: string,
      dialogueText?: string,
      thoughtText?: string
    }[] = [];
    
    let currentSpecialBlock: { type: 'message' | 'email' | 'letter' | 'system', lines: string[] } | null = null;

    lines.forEach(line => {
      let trimmed = line.trim();
      if (!trimmed) {
        if (currentSpecialBlock) {
          currentSpecialBlock.lines.push(line);
        } else {
          groups.push({ lines: [line] });
        }
        return;
      }

      // Detect special block headers
      const messageMatch = trimmed.match(/^\[(?:TIN NHẮN|MESSAGE)(?:\s+TỪ)?:\s*([^\]]+)\]/i);
      const emailMatch = trimmed.match(/^\[EMAIL(?:\s+TỪ)?:\s*([^\]]+)\]/i);
      const letterMatch = trimmed.match(/^\[(?:THƯ|LETTER)(?:\s+TỪ)?:\s*([^\]]+)\]/i);
      const systemMatch = trimmed.match(/^\[(?:THÔNG BÁO|HỆ THỐNG|SYSTEM|GM):?\s*([^\]]*)\]/i);

      if (messageMatch || emailMatch || letterMatch || systemMatch) {
        // If we were in a special block, close it
        if (currentSpecialBlock) {
          groups.push({ specialType: currentSpecialBlock.type, lines: currentSpecialBlock.lines });
          currentSpecialBlock = null;
        }
        
        const type = messageMatch ? 'message' : emailMatch ? 'email' : letterMatch ? 'letter' : 'system';
        currentSpecialBlock = { type, lines: [line] };
        return;
      }

      // If we are in a special block, keep adding lines until we hit a blank line or another block
      if (currentSpecialBlock) {
        currentSpecialBlock.lines.push(line);
        return;
      }

      // Dialogue detection: [Name]: "text" or Name: "text"
      const dialogueMatch = trimmed.match(/^\[([^\]]+)\](?:\s*(?:nói|bảo|hỏi|đáp|thì thầm|hét lên))?:\s*"(.*)"$/i) || 
                           trimmed.match(/^([^:\[\]]+):\s*"(.*)"$/i);
      if (dialogueMatch) {
        groups.push({ specialType: 'dialogue', dialogueName: dialogueMatch[1].trim(), dialogueText: dialogueMatch[2].trim(), lines: [line] });
        return;
      }

      // Thought detection: (text) or *text* or [Name] nghĩ: text
      const thoughtMatch = trimmed.match(/^\((.*)\)$/) || 
                          trimmed.match(/^\*(.*)\*$/) ||
                          trimmed.match(/^\[([^\]]+)\]\s*(?:thầm nghĩ|nghĩ):\s*(.*)$/i) ||
                          trimmed.match(/^(?:Suy nghĩ|Nghĩ):\s*(.*)$/i);
      if (thoughtMatch) {
        const text = thoughtMatch.length > 2 ? thoughtMatch[2].trim() : thoughtMatch[1].trim();
        groups.push({ specialType: 'thought', thoughtText: text, lines: [line] });
        return;
      }

      if (settings.beautifyContent) {
        // Other beautification logic could go here if needed
      }

      // Handle GM: prefix
      const isGM = trimmed.startsWith('GM:');
      if (isGM) {
        trimmed = trimmed.replace(/^GM:\s*/, '').trim();
      }
      
      // Match [NPC NAME] at the start of the line
      const match = trimmed.match(/^\[([^\]]+)\]/);
      if (match) {
        const npcName = match[1].trim();
        // Only group if it's likely a status update (multiple brackets in the line)
        const bracketCount = (trimmed.match(/\[/g) || []).length;
        
        const lastGroup = groups[groups.length - 1];
        if (lastGroup && lastGroup.npc === npcName && bracketCount > 1) {
          lastGroup.lines.push(trimmed);
        } else if (bracketCount > 1) {
          groups.push({ npc: npcName, lines: [trimmed], isGM });
        } else {
          groups.push({ lines: [line] });
        }
      } else {
        groups.push({ lines: [line] });
      }
    });

    // Close any remaining special block
    if (currentSpecialBlock) {
      groups.push({ specialType: currentSpecialBlock.type, lines: currentSpecialBlock.lines });
    }

    return (
      <div className="space-y-4">
        {groups.map((group: any, gIdx) => {
          if (group.specialType === 'dialogue') {
            const dName = group.dialogueName || '';
            const pName = player.name || '';
            const isMC = dName.toLowerCase() === pName.toLowerCase() || 
                         dName.toLowerCase() === 'bạn' || 
                         dName.toLowerCase() === 'mc' ||
                         dName.toLowerCase() === 'tôi';
            
            return (
              <div key={gIdx} className={`flex ${isMC ? 'justify-end' : 'justify-start'} my-4 animate-in fade-in slide-in-from-${isMC ? 'right' : 'left'}-4 duration-500`}>
                <div className={`max-w-[85%] space-y-1.5`}>
                  <div className={`flex items-center gap-2 ${isMC ? 'flex-row-reverse' : 'flex-row'}`}>
                    <span className={`mono text-[11px] font-black uppercase tracking-widest ${isMC ? 'text-emerald-400' : 'text-blue-400'}`}>{group.dialogueName}</span>
                    <div className={`w-1.5 h-1.5 rounded-full ${isMC ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'}`}></div>
                  </div>
                  <div className={`px-5 py-3 rounded-2xl ${isMC ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-50 shadow-[0_4px_15px_rgba(0,0,0,0.3)] rounded-tr-none' : 'bg-blue-600/15 border border-blue-500/40 text-blue-50 shadow-[0_4px_15px_rgba(0,0,0,0.3)] rounded-tl-none'}`}>
                    <p className={`text-[18px] leading-[28px] font-sans not-italic font-medium tracking-wide`}>"{group.dialogueText}"</p>
                  </div>
                </div>
              </div>
            );
          }

          if (group.specialType === 'thought') {
            return (
              <div key={gIdx} className="my-4 px-5 py-3 bg-purple-500/5 border-l-4 border-purple-500/40 italic text-purple-200/80 animate-in fade-in duration-700 rounded-r-xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[12px]">💭</span>
                  <span className="mono text-[10px] font-black uppercase tracking-[0.2em] text-purple-400">Suy nghĩ nội tâm</span>
                </div>
                <p className={`text-[18px] leading-[28px] font-sans not-italic opacity-90`}>{group.thoughtText}</p>
              </div>
            );
          }

          if (group.specialType) {
            const header = group.lines[0];
            const body = group.lines.slice(1);
            const headerText = header.replace(/[\[\]]/g, '').trim();

            let bgColor = "bg-neutral-900/50";
            let borderColor = "border-neutral-700";
            let textColor = "text-neutral-300";
            let icon = "✉️";
            let label = "THÔNG TIN";

            if (group.specialType === 'message') {
              bgColor = "bg-indigo-500/5";
              borderColor = "border-indigo-500/30";
              textColor = "text-indigo-200";
              icon = "💬";
              label = "TIN NHẮN";
            } else if (group.specialType === 'email') {
              bgColor = "bg-cyan-500/5";
              borderColor = "border-cyan-500/30";
              textColor = "text-cyan-200";
              icon = "📧";
              label = "EMAIL";
            } else if (group.specialType === 'letter') {
              bgColor = "bg-amber-900/10";
              borderColor = "border-amber-700/30";
              textColor = "text-amber-100/90";
              icon = "📜";
              label = "THƯ TÍN";
            } else if (group.specialType === 'system') {
              bgColor = "bg-rose-500/5";
              borderColor = "border-rose-500/30";
              textColor = "text-rose-200";
              icon = "⚠️";
              label = "HỆ THỐNG";
            }

            return (
              <div key={gIdx} className={`my-4 ${bgColor} border ${borderColor} rounded-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 shadow-xl`}>
                <div className={`px-3 py-1.5 border-b ${borderColor} flex items-center justify-between bg-black/40`}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs">{icon}</span>
                    <span className={`mono text-[10px] font-black uppercase tracking-widest ${textColor}`}>{label}</span>
                  </div>
                  <div className={`mono text-[9px] font-bold opacity-60 ${textColor}`}>
                    {headerText.split(':').pop()?.trim()}
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  {body.map((line: string, lIdx: number) => (
                    <div key={lIdx} className={`whitespace-pre-wrap ${fontSizeClass} ${group.specialType === 'letter' ? 'font-serif italic leading-relaxed' : 'mono'}`}>
                      {line}
                    </div>
                  ))}
                </div>
                <div className={`px-3 py-1 border-t ${borderColor} flex justify-end bg-black/20`}>
                   <span className={`mono text-[8px] font-black opacity-30 ${textColor}`}>END_OF_TRANSMISSION</span>
                </div>
              </div>
            );
          }

          if (!group.npc) {
            // Normal text rendering
            return (
              <div key={gIdx} className={`block ${type === 'system' ? 'bg-cyan-500/5 border-y border-cyan-500/10 p-2 relative overflow-hidden' : ''}`}>
                {type === 'system' && <div className="absolute left-0 top-0 w-1 h-full bg-cyan-500/50"></div>}
                <div className={type === 'system' ? 'pl-2' : ''}>
                  {group.lines.map((line: string, lIdx: number) => {
                    const parts = line.split(/(\[[^\]]+\])/g);
                    return (
                      <React.Fragment key={lIdx}>
                        {parts.map((part, pIdx) => {
                          if (!part) return null;
                          const trimmedPart = part.trim();
                          
                          // Handle GM: prefix visually
                          if (pIdx === 0 && trimmedPart.startsWith('GM:')) {
                            return (
                              <span key={pIdx} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-cyan-500/20 border border-cyan-500/40 rounded-sm text-cyan-400 mono text-[10px] font-black mr-2">
                                GM
                              </span>
                            );
                          }

                          const isSystemBlock = trimmedPart.startsWith('[') && trimmedPart.endsWith(']');
                          
                          if (isSystemBlock) {
                            return (
                              <span key={pIdx} className="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-md text-emerald-300 mono text-[11px] font-black tracking-tight leading-tight italic uppercase mr-2 my-1">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                {part.replace(/[\[\]]/g, '').trim()}
                              </span>
                            );
                          }
                          return <span key={pIdx} className={`whitespace-pre-wrap ${fontSizeClass} leading-[26px]`}>{part}</span>;
                        })}
                        {lIdx < group.lines.length - 1 && <div className="h-2" />}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            );
          }

          // Grouped NPC notifications
          return (
            <div key={gIdx} className="my-2 bg-emerald-500/5 border border-emerald-500/20 rounded-sm p-3 space-y-1.5 animate-in fade-in slide-in-from-left-4 duration-500 relative overflow-hidden">
              <div className="absolute left-0 top-0 w-1 h-full bg-emerald-500/30"></div>
              {group.isGM && (
                <div className="flex items-center gap-2 mb-2 border-b border-emerald-500/10 pb-1">
                  <span className="px-1.5 py-0.5 bg-cyan-500/20 border border-cyan-500/40 rounded-sm text-cyan-400 mono text-[9px] font-black">GM</span>
                  <span className="text-[9px] text-emerald-500/60 font-black uppercase tracking-widest">Cập nhật thực thể</span>
                </div>
              )}
              {group.lines.map((line: string, lIdx: number) => {
                const parts = line.split(/(\[[^\]]+\])/g);
                return (
                  <div key={lIdx} className="flex flex-wrap items-center gap-1.5">
                    {parts.map((part, pIdx) => {
                      if (!part || !part.trim()) return null;
                      const trimmedPart = part.trim();
                      const isSystemBlock = trimmedPart.startsWith('[') && trimmedPart.endsWith(']');
                      
                      if (isSystemBlock) {
                        const blockText = part.replace(/[\[\]]/g, '').trim();
                        const isNpcName = blockText === group.npc;
                        
                        // If it's the NPC name and NOT the first line of the group, skip it to avoid redundancy
                        if (isNpcName && lIdx > 0) return null;

                        return (
                          <span key={pIdx} className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm mono text-[10px] font-black tracking-tight leading-tight italic uppercase ${isNpcName ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-200' : 'bg-white/5 border border-white/10 text-emerald-400/80'}`}>
                            {isNpcName && <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></span>}
                            {blockText}
                          </span>
                        );
                      }
                      return <span key={pIdx} className="text-[10px] text-neutral-500 italic font-medium">{part}</span>;
                    })}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };



  let playerCommandCounter = 0;



  const scrollToNearestAction = (direction: 'up' | 'down') => {
    if (!scrollRef.current) return;
    
    const container = scrollRef.current;
    const actions = Array.from(container.querySelectorAll('.player-action-marker'));
    
    if (actions.length === 0) {
      if (direction === 'up') {
        container.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      }
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const currentScrollTop = container.scrollTop;

    // Get positions of all actions relative to the container's top
    const positions = actions.map(el => {
      const rect = el.getBoundingClientRect();
      return rect.top - containerRect.top + currentScrollTop;
    });

    if (direction === 'up') {
      // Find the last marker that is at least 5px above the current scroll position
      const targetIndex = [...positions].reverse().findIndex(top => top < currentScrollTop - 5);
      if (targetIndex !== -1) {
        // Since we reversed, the actual index is:
        const actualIndex = positions.length - 1 - targetIndex;
        container.scrollTo({ top: positions[actualIndex], behavior: 'smooth' });
      } else {
        container.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      // Find the first marker that is at least 5px below the current scroll position
      const targetIndex = positions.findIndex(top => top > currentScrollTop + 5);
      if (targetIndex !== -1) {
        container.scrollTo({ top: positions[targetIndex], behavior: 'smooth' });
      } else {
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      }
    }
  };


  const scrollToTop = () => {
    scrollToNearestAction('up');
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  };

  const getAiProcessingStep = (seconds: number) => {
    if (seconds < 5) return "Đang thiết lập liên kết với Ma Trận...";
    if (seconds < 10) return "Đọc hiểu bối cảnh thực tại...";
    if (seconds < 15) return "Tìm kiếm dữ liệu trong vạn giới...";
    if (seconds < 20) return "Đang kiến tạo phản hồi lượng tử...";
    return "Đang đồng bộ hóa thực tại mới...";
  };

  const getAiProcessingLabel = (seconds: number) => {
    if (seconds < 5) return "KẾT NỐI";
    if (seconds < 10) return "PHÂN TÍCH";
    if (seconds < 15) return "TRUY VẤN";
    if (seconds < 20) return "KHỞI TẠO";
    return "HOÀN TẤT";
  };

  const getFontSizeClass = () => {
    return 'text-[16px]';
  };

  const fontSizeClass = getFontSizeClass();

  const displayTurns = groupedTurns.slice((currentPage - 1) * turnsPerPage, currentPage * turnsPerPage);
  
  // Find the index of the last player log to scroll to it
  let lastPlayerIndex = -1;
  for (let i = logs.length - 1; i >= 0; i--) {
    if (logs[i].type === 'player') {
      lastPlayerIndex = i;
      break;
    }
  }

  // Find the index of the last narrator log to show suggested actions
  let lastNarratorIndex = -1;
  for (let i = logs.length - 1; i >= 0; i--) {
    if (logs[i].type === 'narrator') {
      lastNarratorIndex = i;
      break;
    }
  }

  return (
    <div className="Terminal flex flex-col h-full bg-[var(--bg)]/90 border border-white/5 rounded-sm overflow-hidden backdrop-blur-3xl shadow-2xl relative">
      <div 
        ref={scrollRef} 
        onScroll={handleScroll}
        className="flex-grow overflow-y-auto p-5 space-y-6 custom-scrollbar scroll-smooth"
      >
        {displayTurns.map((turn, tIdx) => {
          const actualTurnIndex = (currentPage - 1) * turnsPerPage + tIdx;

          return (
            <div key={actualTurnIndex} className="turn-group space-y-4">
              <div className="flex items-center gap-3 mb-3 mt-4 player-action-marker">
                 <div className="h-px flex-grow bg-emerald-500/20"></div>
                 <div className="px-3 py-1 bg-emerald-500/5 border border-emerald-500/20 rounded-full">
                    <span className="text-[10px] mono font-black text-emerald-500/90 uppercase tracking-[0.2em] whitespace-nowrap">HÀNH_ĐỘNG_{actualTurnIndex.toString().padStart(3, '0')}</span>
                 </div>
                 <div className="h-px flex-grow bg-emerald-500/20"></div>
              </div>
              {turn.map((log, i) => {
                const actualIndex = logs.findIndex(l => l.timestamp === log.timestamp && l.content === log.content);
                const isLast = actualIndex === logs.length - 1;
                const isLastPlayer = actualIndex === lastPlayerIndex;

          if (log.type === 'system') {
            return (
              <div key={actualIndex} ref={isLast ? lastLogRef : null} className="my-2 animate-in fade-in zoom-in duration-500">
                <div className="text-cyan-400 mono text-[11px] font-black uppercase tracking-tight italic">
                  {renderContent(log.content, log.type)}
                </div>
              </div>
            );
          }

          return (
            <div key={actualIndex} ref={isLast ? lastLogRef : (isLastPlayer ? currentTurnRef : null)} className={`animate-in fade-in slide-in-from-bottom-2 duration-500 ${log.type === 'player' ? 'text-emerald-400' : log.type === 'error' ? 'text-rose-400' : 'text-neutral-300'}`}>
              <div className="flex gap-3">
                <div className="flex flex-col items-center min-w-[12px] mt-1">
                  <span className={`text-[8px] leading-[10px] font-normal select-none mono ${log.type === 'player' ? 'text-emerald-500 animate-pulse' : 'opacity-20'}`}>
                    {log.type === 'player' ? '❯' : '•'}
                  </span>
                </div>
                <div className="flex-grow flex flex-col min-w-0">
                  <div className={`mono ${fontSizeClass} leading-relaxed selection:bg-emerald-500 selection:text-black relative group/log`}>
                    {editingIndex === actualIndex ? (
                      <div className="space-y-2 w-full">
                        <textarea
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-full p-3 bg-black/40 border border-emerald-500/30 rounded-lg text-white font-sans text-[16px] leading-relaxed focus:outline-none focus:border-emerald-500/60 custom-scrollbar min-h-[300px]"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleSaveEdit(actualIndex)}
                            className="px-3 py-1 bg-emerald-500 text-black text-[10px] font-black uppercase rounded hover:bg-emerald-400 transition-all"
                          >
                            Lưu thay đổi
                          </button>
                          <button 
                            onClick={handleCancelEdit}
                            className="px-3 py-1 bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase rounded hover:bg-white/10 transition-all"
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {renderContent(log.content, log.type)}
                        {(log.type === 'player' || log.type === 'narrator') && !isLoading && (
                          <button 
                            onClick={() => handleStartEdit(actualIndex, log.content)}
                            className="absolute -top-1 -right-1 p-1.5 bg-neutral-900 border border-white/10 rounded-md text-neutral-500 hover:text-emerald-500 opacity-0 group-hover/log:opacity-100 transition-all shadow-xl z-10"
                            title="Chỉnh sửa nội dung (Edit Draw)"
                          >
                            <Sparkles className="w-3 h-3" />
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  {log.type === 'narrator' && onRegenerateImage && (
                    <div className="mt-3 mb-4">
                       <button 
                          onClick={() => onRegenerateImage(actualIndex)}
                          disabled={isLoading}
                          className="px-4 py-2 bg-emerald-500 text-black border border-emerald-400 rounded-lg hover:bg-emerald-400 transition-all flex items-center gap-2 disabled:opacity-50 shadow-[0_0_20px_rgba(16,185,129,0.4)] active:scale-95 group"
                        >
                          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                          <span className="text-[10px] font-bold leading-[15px] uppercase tracking-widest">
                            {log.imageUrl ? 'Tạo lại ảnh mô tả' : 'Tạo ảnh mô tả'}
                          </span>
                        </button>
                    </div>
                  )}

                  {log.imageUrl && (
                    <div className="space-y-2">
                      <NarratorImage imageUrl={log.imageUrl} alt="Scene illustration" />
                      {log.imageMetadata && (
                        <div className="flex flex-wrap items-center gap-3 px-2 py-1 bg-emerald-500/5 border border-emerald-500/10 rounded-lg animate-in fade-in slide-in-from-top-2 duration-500 max-w-2xl">
                          <span className="text-[10px] mono font-black text-emerald-500 uppercase tracking-widest">[ KHỞI TẠO THÀNH CÔNG ]</span>
                          <div className="h-3 w-px bg-white/10"></div>
                          <span className="text-[9px] mono text-neutral-500 font-bold uppercase">Thời gian: {log.imageMetadata.duration}s</span>
                          <span className="text-[9px] mono text-neutral-500 font-bold uppercase">Model: {log.imageMetadata.model}</span>
                          <span className="text-[9px] mono text-neutral-500 font-bold uppercase">Style: {log.imageMetadata.style}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {log.type === 'narrator' && log.suggestedActions && log.suggestedActions.length > 0 && actualIndex === lastNarratorIndex && (
            <div className={`flex flex-wrap gap-2 mt-5 animate-in fade-in slide-in-from-left-4 duration-700 ${isMobile ? 'grid grid-cols-1 sm:grid-cols-2' : ''}`}>
              {log.suggestedActions.map((sObj: any, idx) => {
                const actionText = typeof sObj === 'string' ? sObj : (sObj.action || "Tiếp tục");
                const actionTime = typeof sObj === 'string' ? 15 : (sObj.time || 15);
                return (
                  <div key={idx} className="flex items-center gap-1 group/action">
                    <div
                      onClick={() => !isLoading && handleSubmit(undefined, actionText, actionTime)}
                      className={`${isMobile ? 'p-4 text-[12px]' : 'px-4 py-2 text-[10px]'} flex-grow rounded-sm border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 mono uppercase font-black hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-500/60 transition-all active:scale-95 flex items-center justify-between gap-2 shadow-lg ${isLoading ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="opacity-40">❯</span>
                        {actionText}
                      </div>
                      <span className="px-1.5 py-0.5 bg-black/40 rounded-sm text-[8px] text-emerald-500/60 border border-white/5 shrink-0">
                        {formatActionTime(actionTime)}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(actionText, idx);
                      }}
                      className="p-2 bg-emerald-500/5 border border-emerald-500/20 rounded-sm hover:bg-emerald-500/20 hover:border-emerald-500/40 transition-all shadow-lg shrink-0"
                      title="Sao chép hành động"
                    >
                      {copiedIndex === idx ? (
                        <Check className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <Copy className="w-3 h-3 text-emerald-500/40 group-hover/action:text-emerald-500/80" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  })}

        


      </div>



      <form onSubmit={handleSubmit} className={`bg-[var(--bg)]/90 border-t border-white/10 backdrop-blur-3xl shrink-0 relative ${isMobile ? 'pb-8' : ''}`}>
        {isLoading && (
          <div className="absolute inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in duration-500 overflow-hidden">
            {/* Genre-Specific Background Animation */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.1)_0%,transparent_70%)]"></div>
              <div className={`absolute top-0 left-0 w-full h-1 ${aiTheme.scanline} shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-[scan_3s_linear_infinite]`}></div>
              <div className="absolute inset-0 grid grid-cols-12 gap-4 opacity-10">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className={`h-full border-r ${aiTheme.primary.replace('text-', 'border-')}/20 animate-pulse`} style={{ animationDelay: `${i * 0.2}s` }}></div>
                ))}
              </div>
            </div>

            <div className="w-full max-w-2xl space-y-6 relative z-10">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative">
                  <div className={`w-20 h-20 border-4 ${aiTheme.primary.replace('text-', 'border-')}/20 rounded-full animate-[spin_10s_linear_infinite]`}></div>
                  <div className={`absolute inset-0 border-t-4 ${aiTheme.primary.replace('text-', 'border-')} rounded-full animate-[spin_2s_linear_infinite]`}></div>
                  <div className={`absolute inset-4 border-b-4 border-cyan-500 rounded-full animate-[spin_3s_linear_infinite_reverse]`}></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className={`w-8 h-8 ${aiTheme.iconColor} animate-pulse`} />
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className={`${aiTheme.primary} mono text-xl font-black tracking-[0.5em] uppercase italic`}>
                    {aiTheme.label}
                  </h3>
                  <p className={`${aiTheme.secondary} mono text-xs font-bold uppercase tracking-widest animate-pulse`}>
                    {loadingStep || getAiProcessingStep(elapsedTime)}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-end px-1">
                  <div className={`flex gap-4 text-[10px] mono font-black ${aiTheme.secondary} uppercase`}>
                    <span>Core_Sync: {loadingProgress || Math.min(100, Math.floor((elapsedTime / 25) * 100))}%</span>
                    <span>Buffer: Stable</span>
                  </div>
                  <span className={`${aiTheme.primary} mono text-2xl font-black tabular-nums`}>{formatTime(elapsedTime)}</span>
                </div>
                
                <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/10 p-0.5">
                  <div 
                    className={`h-full bg-gradient-to-r ${aiTheme.accent} transition-all duration-500 ease-out ${aiTheme.glow} rounded-full relative`}
                    style={{ width: `${loadingProgress || Math.min((elapsedTime / 25) * 100, 100)}%` }}
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.3)_50%,transparent_100%)] animate-[shimmer_2s_infinite]"></div>
                  </div>
                </div>

                <div className={`flex justify-between text-[8px] mono ${aiTheme.primary}/20 font-black uppercase tracking-[0.2em]`}>
                  <span>Neural_Matrix_v5_Firebase_Active</span>
                  <span className="animate-pulse">Quantum_Reality_Shifting...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="flex justify-center -mt-3 mb-1">
          <button 
            type="button"
            onClick={() => setIsInputCollapsed(!isInputCollapsed)}
            className="w-12 h-6 flex items-center justify-center rounded-t-lg bg-neutral-900 border-x border-t border-white/10 text-neutral-500 hover:text-white transition-all z-20"
            title={isInputCollapsed ? "Mở rộng khung lệnh" : "Thu gọn khung lệnh"}
          >
            {isInputCollapsed ? '▲' : '▼'}
          </button>
        </div>

        {!isInputCollapsed && (
          <div className={isMobile ? 'p-2' : 'p-4'}>
            {/* Pagination Controls Moved Here */}
            <div className="flex items-center justify-between mb-3 px-2 py-1 bg-black/20 border border-white/5 rounded-sm shrink-0">
              <div className="flex items-center gap-3">
                <button 
                  type="button"
                  onClick={() => {
                    setCurrentPage(prev => Math.max(1, prev - 1));
                    if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: 'auto' });
                  }}
                  disabled={currentPage === 1}
                  className="p-1 text-neutral-500 hover:text-emerald-500 disabled:opacity-20 transition-colors"
                  title="Trang trước"
                >
                  <span className="mono text-[10px] font-black">❮</span>
                </button>
                <div className="px-2 py-0.5 bg-emerald-500/5 border border-emerald-500/10 rounded-sm">
                  <span className="mono text-[9px] font-black text-emerald-500/60 uppercase tracking-widest">
                    P.{currentPage}/{totalPages}
                  </span>
                </div>
                <button 
                  type="button"
                  onClick={() => {
                    setCurrentPage(prev => Math.min(totalPages, prev + 1));
                    if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: 'auto' });
                  }}
                  disabled={currentPage === totalPages}
                  className="p-1 text-neutral-500 hover:text-emerald-500 disabled:opacity-20 transition-colors"
                  title="Trang sau"
                >
                  <span className="mono text-[10px] font-black">❯</span>
                </button>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 border-x border-white/5 px-3">
                  <button 
                    type="button"
                    onClick={() => scrollToNearestAction('up')}
                    className="p-1 text-neutral-500 hover:text-cyan-400 transition-colors flex items-center gap-1"
                    title="Hành động trước"
                  >
                    <span className="mono text-[9px] font-black uppercase">Trước</span>
                    <span className="text-[10px]">▲</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => scrollToNearestAction('down')}
                    className="p-1 text-neutral-500 hover:text-cyan-400 transition-colors flex items-center gap-1"
                    title="Hành động sau"
                  >
                    <span className="mono text-[9px] font-black uppercase">Sau</span>
                    <span className="text-[10px]">▼</span>
                  </button>
                </div>
                <div className="flex items-center gap-1.5 opacity-30">
                  <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                  <span className="mono text-[8px] font-black text-neutral-500 uppercase tracking-tighter">Matrix</span>
                </div>
              </div>
            </div>

            <div className={`flex items-end gap-2 bg-[var(--bg)]/10 border p-2 rounded-sm transition-all relative overflow-hidden ${isLoading ? 'border-emerald-500/20' : 'border-neutral-800 focus-within:border-emerald-500/40 shadow-inner'} ${isMobile ? 'flex-col items-stretch' : ''}`}>
              <div className="flex items-end gap-2 flex-grow">
                <div className="mb-2 shrink-0">
                   <span className={`font-black mono text-lg ${isLoading ? 'text-neutral-700' : 'text-emerald-500'}`}>❯</span>
                </div>
                
                <div className="flex-grow flex flex-col gap-1">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                    autoFocus
                    rows={1}
                    placeholder={isLoading ? "Vạn giới đang xoay chuyển..." : placeholder}
                    className={`w-full bg-transparent border-none outline-none text-white ${fontSizeClass} font-medium placeholder:text-neutral-800 tracking-tight mono resize-none custom-scrollbar py-1 max-h-[150px] selection:bg-emerald-500 selection:text-black`}
                  />
                  {!input && lastAction?.command && !isLoading && (
                    <button
                      type="button"
                      onClick={() => setInput(lastAction.command)}
                      className="self-start px-2 py-1 bg-white/5 border border-white/10 rounded text-[9px] text-neutral-500 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2"
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      Khôi phục văn bản: <span className="italic opacity-60 truncate max-w-[200px]">{lastAction.command}</span>
                    </button>
                  )}
                </div>
              </div>
              
              <div className={`flex ${isMobile ? 'justify-between' : 'flex-col items-end'} gap-1`}>
                 <div className="flex gap-1 w-full">
                   {onRetry && (
                     <button 
                       type="button"
                       onClick={onRetry}
                       disabled={isLoading}
                       className={`${isMobile ? 'flex-1 py-3' : 'px-3 py-2'} ${logs.length > 0 && logs[logs.length - 1].type === 'error' ? 'bg-rose-500/20 border-rose-500/40 text-rose-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-500/60'} border font-black uppercase text-[10px] rounded-sm hover:bg-amber-500 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-1 disabled:opacity-20`}
                       title="Thử lại lượt chơi cuối"
                     >
                       <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                       Tải Lại
                     </button>
                   )}
                   <button 
                     type="button"
                     onClick={onOpenAiHint}
                     className={`${isMobile ? 'flex-1 py-3' : 'px-3 py-2'} bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 font-black uppercase text-[10px] rounded-sm hover:bg-indigo-500 hover:text-white transition-all active:scale-95`}
                   >
                     Nhắc AI
                   </button>
                   <button 
                     type="button"
                     onClick={onToggleDiagnostics}
                     className={`${isMobile ? 'flex-1 py-3' : 'px-3 py-2'} bg-rose-500/20 border border-rose-500/40 text-rose-400 font-black uppercase text-[10px] rounded-sm hover:bg-rose-500 hover:text-white transition-all active:scale-95`}
                     title="Mở chẩn đoán"
                   >
                     Diag
                   </button>
                   <button 
                     type="submit" 
                     disabled={!input.trim() || isLoading} 
                     className={`${isMobile ? 'flex-[2] py-3' : 'px-6 py-2'} bg-emerald-500 text-black font-black uppercase text-[11px] rounded-sm disabled:opacity-0 transition-all hover:bg-emerald-400 active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.3)]`}
                   >
                     Gửi lệnh
                   </button>
                 </div>
                 {!isMobile && <span className="text-[8px] mono text-neutral-700 font-black uppercase tracking-tighter">Shift+Enter cho dòng mới</span>}
              </div>
            </div>
          </div>
        )}
      </form>

    </div>

  );

};

