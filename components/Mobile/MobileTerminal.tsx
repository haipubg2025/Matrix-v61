
import React, { useState, useEffect, useRef } from 'react';
import { GameLog, Player, GameGenre, getGenreMeta, AppSettings } from '../../types';
import { Send, Sparkles, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, Copy, Check, RefreshCw } from 'lucide-react';
import { dbService } from '../../services/dbService';

interface MobileTerminalProps {
  logs: GameLog[];
  onCommand: (cmd: string, timeCost?: number) => void;
  onOpenAiHint?: () => void;
  onRetry?: () => void;
  onRegenerateImage?: (logIndex: number) => Promise<void>;
  onUpdateLog?: (index: number, newContent: string) => void;
  onToggleDiagnostics?: () => void;
  lastAction?: { command: string, timeCost?: number } | null;
  isLoading: boolean;
  placeholder?: string;
  player: Player;
  genre?: GameGenre;
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
      <div className="my-2 w-full aspect-video bg-white/5 animate-pulse rounded-xl flex items-center justify-center border border-white/5">
        <RefreshCw className="w-5 h-5 text-emerald-500/50 animate-spin" />
      </div>
    );
  }

  if (!resolvedUrl) return null;

  return (
    <div className="rounded-xl overflow-hidden border border-white/5 shadow-2xl animate-in fade-in zoom-in duration-700 relative">
      <img 
        src={resolvedUrl} 
        alt={alt} 
        className="w-full h-auto object-cover max-h-[300px]"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

export const MobileTerminal: React.FC<MobileTerminalProps> = ({ 
  logs, onCommand, onOpenAiHint, onRetry, onRegenerateImage, onToggleDiagnostics, isLoading, placeholder = "Gõ hành động...", 
  player, genre, settings, lastAction, onUpdateLog
}) => {
  const [input, setInput] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isInputCollapsed, setIsInputCollapsed] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastLogRef = useRef<HTMLDivElement>(null);
  const currentTurnRef = useRef<HTMLDivElement>(null);

  const { aiTheme } = getGenreMeta(genre);

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

  const [isAtBottom, setIsAtBottom] = useState(true);

  // Auto-switch to last page when new logs arrive
  useEffect(() => {
    if (totalPages > currentPage) {
      setCurrentPage(totalPages);
    }
  }, [groupedTurns.length, totalPages]);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const atBottom = scrollHeight - scrollTop - clientHeight < 100;
      setIsAtBottom(atBottom);
      setShowScrollBottom(!atBottom);
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  };

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


  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 120);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [input]);

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

      // If we are in a special block, keep adding lines
      if (currentSpecialBlock) {
        currentSpecialBlock.lines.push(line);
        return;
      }

      // Dialogue detection
      const dialogueMatch = trimmed.match(/^\[([^\]]+)\](?:\s*(?:nói|bảo|hỏi|đáp|thì thầm|hét lên))?:\s*"(.*)"$/i) || 
                           trimmed.match(/^([^:\[\]]+):\s*"(.*)"$/i);
      if (dialogueMatch) {
        groups.push({ specialType: 'dialogue', dialogueName: dialogueMatch[1].trim(), dialogueText: dialogueMatch[2].trim(), lines: [line] });
        return;
      }

      // Thought detection
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
      <div className="space-y-3">
        {groups.map((group, gIdx) => {
          if (group.specialType === 'dialogue') {
            const dName = group.dialogueName || '';
            const pName = player.name || '';
            const isMC = dName.toLowerCase() === pName.toLowerCase() || 
                         dName.toLowerCase() === 'bạn' || 
                         dName.toLowerCase() === 'mc' ||
                         dName.toLowerCase() === 'tôi';
            
            return (
              <div key={gIdx} className={`flex ${isMC ? 'justify-end' : 'justify-start'} my-2 animate-in fade-in slide-in-from-${isMC ? 'right' : 'left'}-2 duration-300`}>
                <div className={`max-w-[90%] space-y-1`}>
                  <div className={`flex items-center gap-1.5 ${isMC ? 'flex-row-reverse' : 'flex-row'}`}>
                    <span className={`mono text-[9px] font-black uppercase tracking-widest ${isMC ? 'text-emerald-400' : 'text-blue-400'}`}>{group.dialogueName}</span>
                    <div className={`w-1 h-1 rounded-full ${isMC ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.5)]'}`}></div>
                  </div>
                  <div className={`px-4 py-2 rounded-2xl ${isMC ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-50 shadow-md rounded-tr-none' : 'bg-blue-600/15 border border-blue-500/30 text-blue-50 shadow-md rounded-tl-none'}`}>
                    <p className={`${fontSizeClass} leading-[24px]`}>"{group.dialogueText}"</p>
                  </div>
                </div>
              </div>
            );
          }

          if (group.specialType === 'thought') {
            return (
              <div key={gIdx} className="my-2 px-3 py-2 bg-purple-500/5 border-l-2 border-purple-500/30 italic text-purple-200/80 animate-in fade-in duration-500 rounded-r-lg">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px]">💭</span>
                  <span className="mono text-[8px] font-black uppercase tracking-widest text-purple-400">Suy nghĩ</span>
                </div>
                <p className={`${fontSizeClass} leading-[24px]`}>{group.thoughtText}</p>
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
              bgColor = "bg-indigo-500/10";
              borderColor = "border-indigo-500/30";
              textColor = "text-indigo-200";
              icon = "💬";
              label = "TIN NHẮN";
            } else if (group.specialType === 'email') {
              bgColor = "bg-cyan-500/10";
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
              bgColor = "bg-rose-500/10";
              borderColor = "border-rose-500/30";
              textColor = "text-rose-200";
              icon = "⚠️";
              label = "HỆ THỐNG";
            }

            return (
              <div key={gIdx} className={`my-2 ${bgColor} border ${borderColor} rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500 shadow-lg`}>
                <div className={`px-2 py-1 border-b ${borderColor} flex items-center justify-between bg-black/40`}>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px]">{icon}</span>
                    <span className={`mono text-[8px] font-black uppercase tracking-widest ${textColor}`}>{label}</span>
                  </div>
                  <div className={`mono text-[8px] font-bold opacity-60 ${textColor}`}>
                    {headerText.split(':').pop()?.trim()}
                  </div>
                </div>
                <div className="p-3 space-y-1.5">
                  {body.map((line, lIdx) => (
                    <div key={lIdx} className={`whitespace-pre-wrap ${fontSizeClass} ${group.specialType === 'letter' ? 'font-serif italic leading-relaxed' : 'mono'}`}>
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          if (!group.npc) {
            // Normal text rendering
            return (
              <div key={gIdx} className={`block ${type === 'system' ? 'bg-cyan-500/5 border-y border-cyan-500/10 p-1 relative' : ''}`}>
                <div className={type === 'system' ? 'pl-1' : ''}>
                  {group.lines.map((line, lIdx) => {
                    const parts = line.split(/(\[[^\]]+\])/g);
                    return (
                      <React.Fragment key={lIdx}>
                        {parts.map((part, pIdx) => {
                          if (!part) return null;
                          const trimmedPart = part.trim();

                          // Handle GM: prefix visually
                          if (pIdx === 0 && trimmedPart.startsWith('GM:')) {
                            return (
                              <span key={pIdx} className="inline-flex items-center gap-1 px-1 py-0.5 bg-cyan-500/20 border border-cyan-500/40 rounded-sm text-cyan-400 mono text-[9px] font-black mr-1.5">
                                GM
                              </span>
                            );
                          }

                          const isSystemBlock = trimmedPart.startsWith('[') && trimmedPart.endsWith(']');
                          
                          if (isSystemBlock) {
                            return (
                              <span key={pIdx} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded-sm text-emerald-300 mono text-[10px] font-black tracking-tight leading-tight italic uppercase mr-1 my-0.5">
                                {part.replace(/[\[\]]/g, '').trim()}
                              </span>
                            );
                          }
                          return <span key={pIdx} className={`whitespace-pre-wrap ${fontSizeClass} leading-[22px]`}>{part}</span>;
                        })}
                        {lIdx < group.lines.length - 1 && <div className="h-1" />}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            );
          }

          // Grouped NPC notifications
          return (
            <div key={gIdx} className="my-1 bg-emerald-500/5 border border-emerald-500/20 rounded-sm p-2 space-y-1 animate-in fade-in slide-in-from-left-2 duration-300 relative overflow-hidden">
              <div className="absolute left-0 top-0 w-0.5 h-full bg-emerald-500/30"></div>
              {group.isGM && (
                <div className="flex items-center gap-1.5 mb-1.5 border-b border-emerald-500/10 pb-0.5">
                  <span className="px-1 py-0.5 bg-cyan-500/20 border border-cyan-500/40 rounded-sm text-cyan-400 mono text-[8px] font-black">GM</span>
                  <span className="text-[8px] text-emerald-500/60 font-black uppercase tracking-widest">Cập nhật thực thể</span>
                </div>
              )}
              {group.lines.map((line, lIdx) => {
                const parts = line.split(/(\[[^\]]+\])/g);
                return (
                  <div key={lIdx} className="flex flex-wrap items-center gap-1">
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
                          <span key={pIdx} className={`inline-flex items-center gap-1 px-1 py-0.5 rounded-sm mono text-[9px] font-black tracking-tight leading-tight italic uppercase ${isNpcName ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-200' : 'bg-white/5 border border-white/10 text-emerald-400/80'}`}>
                            {blockText}
                          </span>
                        );
                      }
                      return <span key={pIdx} className="text-[9px] text-neutral-500 italic">{part}</span>;
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

  const scrollToTop = () => {
    scrollToNearestAction('up');
  };

  const getAiProcessingStep = (seconds: number) => {
    if (seconds < 5) return "Đang liên kết Ma Trận...";
    if (seconds < 10) return "Phân tích bối cảnh...";
    if (seconds < 15) return "Truy vấn vạn giới...";
    if (seconds < 20) return "Kiến tạo phản hồi...";
    return "Đồng bộ thực tại...";
  };

  const getAiProcessingLabel = (seconds: number) => {
    if (seconds < 5) return "KẾT NỐI";
    if (seconds < 10) return "PHÂN TÍCH";
    if (seconds < 15) return "TRUY VẤN";
    if (seconds < 20) return "KHỞI TẠO";
    return "HOÀN TẤT";
  };

  const getFontSizeClass = () => {
    return 'text-base';
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
    <div className="MobileTerminal flex flex-col h-full bg-[var(--bg)] overflow-hidden relative selection:bg-emerald-500/30">
      <div 
        ref={scrollRef} 
        onScroll={handleScroll}
        className="flex-grow overflow-y-auto p-2 space-y-4 custom-scrollbar scroll-smooth pb-20"
      >
        {displayTurns.map((turn, tIdx) => {
          const actualTurnIndex = (currentPage - 1) * turnsPerPage + tIdx;

          return (
            <div key={actualTurnIndex} className="turn-group space-y-3">
              <div className="flex items-center gap-2 mb-2 mt-4 player-action-marker">
                 <div className="h-px flex-grow bg-emerald-500/10"></div>
                 <div className="px-2 py-0.5 bg-emerald-500/5 border border-emerald-500/10 rounded-full">
                    <span className="text-[7px] mono font-black text-emerald-500/60 uppercase tracking-[0.2em] whitespace-nowrap">HÀNH_ĐỘNG_{actualTurnIndex.toString().padStart(3, '0')}</span>
                 </div>
                 <div className="h-px flex-grow bg-emerald-500/10"></div>
              </div>
              {turn.map((log, i) => {
                const actualIndex = logs.findIndex(l => l.timestamp === log.timestamp && l.content === log.content);
                const isLast = actualIndex === logs.length - 1;
                const isLastPlayer = actualIndex === lastPlayerIndex;
          
          if (log.type === 'system') {
            return (
              <div key={actualIndex} ref={isLast ? lastLogRef : null} className="my-1 px-2 py-1 bg-cyan-500/5 border-l border-cyan-500/30 rounded-r-sm">
                <div className="text-cyan-400/80 mono text-[10px] font-black uppercase tracking-tight italic">
                  {renderContent(log.content, log.type)}
                </div>
              </div>
            );
          }

          return (
            <div key={actualIndex} ref={isLast ? lastLogRef : (isLastPlayer ? currentTurnRef : null)} className={`animate-in fade-in slide-in-from-bottom-1 duration-300 ${log.type === 'player' ? 'text-emerald-400' : log.type === 'error' ? 'text-rose-400' : 'text-neutral-300'}`}>
              <div className="flex gap-2">
                <span className={`text-[10px] mt-1 font-black mono ${log.type === 'player' ? 'text-emerald-500' : 'opacity-10'}`}>
                  {log.type === 'player' ? '❯' : '•'}
                </span>
                <div className="flex-grow flex flex-col min-w-0">
                  <div className={`mono ${fontSizeClass} leading-relaxed relative group/log`}>
                    {editingIndex === actualIndex ? (
                      <div className="space-y-2 w-full my-2">
                        <textarea
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-full p-3 bg-black/40 border border-emerald-500/30 rounded-xl text-white font-sans text-[16px] leading-relaxed focus:outline-none focus:border-emerald-500/60 custom-scrollbar min-h-[300px]"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleSaveEdit(actualIndex)}
                            className="flex-1 py-3 bg-emerald-500 text-black text-[11px] font-black uppercase rounded-xl active:bg-emerald-400 transition-all shadow-lg active:scale-95"
                          >
                            Lưu thay đổi
                          </button>
                          <button 
                            onClick={handleCancelEdit}
                            className="flex-1 py-3 bg-white/5 border border-white/10 text-white text-[11px] font-black uppercase rounded-xl active:bg-white/10 transition-all active:scale-95"
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
                            className="absolute -top-1 -right-1 p-2 bg-neutral-900 border border-white/10 rounded-lg text-neutral-500 active:text-emerald-500 opacity-40 active:opacity-100 transition-all shadow-xl z-10"
                            title="Chỉnh sửa nội dung (Edit Draw)"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  {log.type === 'narrator' && onRegenerateImage && (
                    <div className="mt-3 mb-2">
                       <button 
                          onClick={() => onRegenerateImage(actualIndex)}
                          disabled={isLoading}
                          className="px-3 py-1.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 rounded-lg active:bg-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95"
                        >
                          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                          <span className="text-[9px] font-black uppercase tracking-widest">
                            {log.imageUrl ? 'Tạo lại ảnh' : 'Tạo ảnh'}
                          </span>
                        </button>
                    </div>
                  )}

                  {log.imageUrl && (
                    <div className="space-y-1.5 my-2">
                      <NarratorImage imageUrl={log.imageUrl} alt="Scene illustration" />
                      {log.imageMetadata && (
                        <div className="flex flex-wrap items-center gap-2 px-2 py-1 bg-black/40 border border-white/5 rounded-lg">
                          <span className="text-[7px] mono font-black text-emerald-500/60 uppercase tracking-widest">[ SYNC_OK ]</span>
                          <span className="text-[7px] mono text-neutral-600 font-bold uppercase">{log.imageMetadata.duration}s</span>
                          <span className="text-[7px] mono text-neutral-600 font-bold uppercase">{log.imageMetadata.model}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {log.type === 'narrator' && log.suggestedActions && log.suggestedActions.length > 0 && actualIndex === lastNarratorIndex && (
                    <div className="flex flex-col gap-2 mt-4">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[8px] mono font-black text-emerald-500/40 uppercase tracking-widest">Gợi ý hành động</span>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {log.suggestedActions.map((sObj: any, idx: number) => {
                          const actionText = typeof sObj === 'string' ? sObj : (sObj.action || "Tiếp tục");
                          const actionTime = typeof sObj === 'string' ? 15 : (sObj.time || 15);
                          return (
                            <div key={idx} className="flex items-stretch gap-1 animate-in fade-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${idx * 100}ms` }}>
                              <button
                                onClick={() => !isLoading && handleSubmit(undefined, actionText, actionTime)}
                                disabled={isLoading}
                                className={`flex-grow p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 mono text-[11px] uppercase font-black active:scale-[0.98] active:bg-emerald-500/10 transition-all flex items-center justify-between gap-3 shadow-lg ${isLoading ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer'}`}
                              >
                                <div className="flex items-center gap-2 text-left">
                                  <span className="text-emerald-500/30 shrink-0">❯</span>
                                  <span className="leading-tight">{actionText}</span>
                                </div>
                                <span className="px-1.5 py-0.5 bg-black/60 rounded-lg text-[8px] text-emerald-500/40 border border-white/5 shrink-0">
                                  {formatActionTime(actionTime)}
                                </span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopy(actionText, idx);
                                }}
                                className="px-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl active:scale-90 transition-all shadow-lg flex items-center justify-center"
                              >
                                {copiedIndex === idx ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5 text-emerald-500/30" />
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
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

      {/* Floating Scroll to Bottom Button */}
      {showScrollBottom && (
        <button 
          onClick={scrollToBottom}
          className="absolute bottom-32 right-4 w-10 h-10 rounded-full bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.5)] flex items-center justify-center z-50 animate-in fade-in zoom-in duration-300 active:scale-90"
        >
          <ArrowDown className="w-5 h-5" />
        </button>
      )}

      <form onSubmit={handleSubmit} className="bg-[var(--bg)] border-t border-white/10 shrink-0 relative pb-safe">
        {isLoading && (
          <div className="absolute inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-in fade-in duration-500 overflow-hidden">
            <div className="absolute inset-0 pointer-events-none opacity-10">
              <div className={`absolute top-0 left-0 w-full h-0.5 ${aiTheme.scanline} animate-[scan_2s_linear_infinite]`}></div>
            </div>
            
            <div className="w-full max-w-xs space-y-6 relative z-10">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative">
                  <div className={`w-16 h-16 border-2 ${aiTheme.primary.replace('text-', 'border-')}/20 rounded-full animate-spin`}></div>
                  <div className={`absolute inset-0 border-t-2 ${aiTheme.primary.replace('text-', 'border-')} rounded-full animate-[spin_1s_linear_infinite]`}></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className={`w-6 h-6 ${aiTheme.iconColor} animate-pulse`} />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className={`${aiTheme.primary} mono text-base font-black tracking-[0.3em] uppercase italic`}>
                    {aiTheme.label}
                  </h3>
                  <p className={`${aiTheme.secondary} mono text-[9px] font-bold uppercase tracking-widest opacity-60`}>
                    {getAiProcessingStep(elapsedTime)}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-end px-1">
                  <span className={`text-[8px] mono font-black ${aiTheme.secondary} uppercase tracking-tighter`}>Neural_Sync: {Math.min(100, Math.floor((elapsedTime / 25) * 100))}%</span>
                  <span className={`${aiTheme.primary} mono text-xl font-black tabular-nums`}>{formatTime(elapsedTime)}</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/10">
                  <div 
                    className={`h-full bg-gradient-to-r ${aiTheme.accent} transition-all duration-1000 ease-out ${aiTheme.glow}`}
                    style={{ width: `${Math.min((elapsedTime / 25) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex justify-center -mt-3 mb-1">
          <button 
            type="button"
            onClick={() => setIsInputCollapsed(!isInputCollapsed)}
            className="w-14 h-6 flex items-center justify-center rounded-t-xl bg-neutral-900 border-x border-t border-white/10 text-neutral-500 shadow-lg active:bg-neutral-800 transition-colors"
          >
            {isInputCollapsed ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
          </button>
        </div>

        {isInputCollapsed ? (
          <div className="p-2 flex items-center gap-2 animate-in slide-in-from-bottom-2 duration-300">
            <button 
              type="button"
              onClick={() => setIsInputCollapsed(false)}
              className="flex-grow p-3 rounded-xl border border-white/5 bg-black/20 text-neutral-500 text-left text-xs mono italic"
            >
              Chạm để mở bảng điều khiển...
            </button>
            <button 
              type="submit"
              disabled={isLoading || !input.trim()}
              className="w-12 h-12 rounded-xl bg-emerald-500 text-black flex items-center justify-center shadow-lg active:scale-90 disabled:opacity-20 transition-all"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {/* Mobile Pagination & Controls */}
            <div className="flex items-center justify-between px-2 py-1.5 bg-black/40 border border-white/5 rounded-xl shrink-0">
              <div className="flex items-center gap-1">
                <button 
                  type="button"
                  onClick={() => {
                    setCurrentPage(prev => Math.max(1, prev - 1));
                    if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: 'auto' });
                  }}
                  disabled={currentPage === 1}
                  className="p-2 text-neutral-500 active:text-emerald-500 disabled:opacity-20 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="px-2 py-0.5 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                  <span className="mono text-[9px] font-black text-emerald-500/80 uppercase">
                    {currentPage}/{totalPages}
                  </span>
                </div>
                <button 
                  type="button"
                  onClick={() => {
                    setCurrentPage(prev => Math.min(totalPages, prev + 1));
                    if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: 'auto' });
                  }}
                  disabled={currentPage === totalPages}
                  className="p-2 text-neutral-500 active:text-emerald-500 disabled:opacity-20 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button 
                  type="button"
                  onClick={() => scrollToNearestAction('up')}
                  className="p-2 text-neutral-500 active:text-cyan-400 transition-colors"
                  title="Hành động trước"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button 
                  type="button"
                  onClick={() => scrollToNearestAction('down')}
                  className="p-2 text-neutral-500 active:text-cyan-400 transition-colors"
                  title="Hành động sau"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-white/5 mx-1"></div>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/5 rounded-lg">
                  <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="mono text-[8px] font-black text-neutral-500 uppercase tracking-tighter">Matrix</span>
                </div>
              </div>
            </div>

            <div className={`flex flex-col gap-2 bg-black/20 border p-2 rounded-2xl transition-all relative overflow-hidden ${isLoading ? 'border-emerald-500/20' : 'border-white/5 focus-within:border-emerald-500/40 shadow-2xl'}`}>
              <div className="flex items-start gap-2">
                <span className="mt-1 font-black mono text-emerald-500 text-lg opacity-40">❯</span>
                <div className="flex-grow flex flex-col gap-1">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
                    disabled={isLoading}
                    rows={1}
                    placeholder={isLoading ? "Đang xử lý..." : placeholder}
                    className={`w-full bg-transparent border-none outline-none text-white ${fontSizeClass} mono resize-none py-1 max-h-[120px] placeholder:text-neutral-700`}
                  />
                  {!input && lastAction?.command && !isLoading && (
                    <button
                      type="button"
                      onClick={() => setInput(lastAction.command)}
                      className="self-start px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-[8px] text-neutral-600 active:text-emerald-500 active:bg-emerald-500/10 transition-all flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      Khôi phục: <span className="italic truncate max-w-[120px]">{lastAction.command}</span>
                    </button>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                <div className="flex gap-1 flex-1">
                  {onRetry && (
                    <button 
                      type="button"
                      onClick={onRetry}
                      disabled={isLoading}
                      className={`flex-1 py-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all active:scale-95 disabled:opacity-50 ${logs.length > 0 && logs[logs.length - 1].type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-white/5 border-white/10 text-neutral-500'}`}
                      title="Tải lại"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                      <span className="text-[8px] font-black uppercase">Tải Lại</span>
                    </button>
                  )}
                  <button 
                    type="button"
                    onClick={onOpenAiHint}
                    disabled={isLoading}
                    className="flex-1 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex flex-col items-center justify-center gap-1 active:scale-95 disabled:opacity-50 transition-all"
                    title="Nhắc AI"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span className="text-[8px] font-black uppercase">Nhắc AI</span>
                  </button>
                  <button 
                    type="button"
                    onClick={onToggleDiagnostics}
                    className="flex-1 py-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex flex-col items-center justify-center gap-1 active:scale-95 transition-all"
                    title="Chẩn đoán"
                  >
                    <ArrowUp className="w-3 h-3 rotate-45" />
                    <span className="text-[8px] font-black uppercase">Diag</span>
                  </button>
                </div>

                <button 
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="flex-[2] py-3 rounded-xl bg-emerald-500 text-black mono text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all"
                >
                  <Send className="w-4 h-4" />
                  Gửi lệnh
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
