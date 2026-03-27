
import { useState, useCallback, useEffect } from 'react';
import { GameLog, GameArchetype, Player, SubScenario, Relationship, GameTime, GameGenre, AppSettings, AiModel, CodexEntry, getGenreMeta, ThinkingLevel, StudioParams, WritingStyle, NarrativePerspective, GalleryImage, WorldData } from '../types';
import { FanficWork, FanficCharacter } from '../fanfic/types';
import { gameAI } from '../services/geminiService';
import { dbService } from '../services/dbService';
import { memoryService } from '../services/memoryService';
import { uploadImage } from '../services/uploadService';
import { base64ToFile, isBase64 } from '../utils/imageUtils';
import { getDayOfWeek, getYearCanChi } from '../utils/timeUtils';
import { compensateNpcData, mergeNpcData, isValidValue, normalizeConditionsArray, syncBidirectionalRelationships } from '../services/npcService';
import { GAME_ARCHETYPES } from '../constants';
import { FANFIC_ARCHETYPE } from '../fanfic/constants';
import { FREE_STYLE_ARCHETYPE } from '../constants/freeStyle';

import { CUSTOM_CULTIVATION } from '../dataCustomCultivation';
import { CUSTOM_URBAN_NORMAL } from '../dataCustomUrbanNormal';
import { CUSTOM_WUXIA } from '../dataCustomWuxia';
import { CUSTOM_FANTASY_HUMAN } from '../dataCustomFantasyHuman';
import { CUSTOM_FANTASY_MULTI } from '../dataCustomFantasyMulti';
import { CUSTOM_URBAN_SUPER } from '../dataCustomUrbanSuper';

import { useToast } from './useToast';

export type ViewState = 'landing' | 'world-select' | 'context-select' | 'scenario-select' | 'playing' | 'fanfic-select' | 'world-creation';

export const INITIAL_PLAYER_STATE: Player = {
  name: '??',
  avatar: '',
  gender: '??' as any,
  age: 0,
  birthday: '',
  health: 100,
  maxHealth: 100,
  level: 1,
  gold: 0,
  exp: 0,
  stats: { strength: 0, intelligence: 0, agility: 0, charisma: 0, luck: 0, soul: 0, merit: 0 },
  systemName: '',
  personality: '??',
  appearance: '??',
  background: '??',
  goals: '??',
  skillsSummary: '??',
  currentLocation: 'Khởi đầu thực tại',
  assets: [],
  relationships: [],
  codex: [],
  quests: [],
  skills: [],
  inventory: [],
  identities: [],
  aiCompanion: {
    id: 'ai_companion_001',
    name: 'Hệ Thống',
    personality: 'Lạnh lùng, máy móc, tuân thủ quy tắc tuyệt đối.',
    tone: 'Trang trọng, súc tích',
    description: 'Một thực thể trí tuệ nhân tạo không có hình dạng vật lý, hỗ trợ người chơi trong hành trình.',
    isActive: false,
    role: 'system'
  },
  isQuestEnabled: true,
  customFields: [],
  nextNpcId: 1,
  turnCount: 0,
  backgroundAttributes: [],
  aiHints: { oneTurn: '', permanent: '', nsfwStyleHardcore: false, nsfwStylePsychological: false, customHints: [] },
  lockedFields: [],
  newFields: []
};

// Helper to normalize arrays of objects (inventory, skills, assets)
const normalizeObjectArray = (arr: any[]) => {
  if (!Array.isArray(arr)) return [];
  return arr.map(item => {
    if (typeof item === 'string') {
      return { name: item, description: 'Chưa có mô tả chi tiết.' };
    }
    if (item && typeof item === 'object') {
      const name = item.name || item.title || 'Vô danh';
      const description = item.description || item.desc || 'Chưa có mô tả chi tiết.';
      return {
        name: (name === undefined || name === null || String(name) === 'undefined') ? 'Vô danh' : String(name),
        description: (description === undefined || description === null || String(description) === 'undefined') ? 'Chưa có mô tả chi tiết.' : String(description)
      };
    }
    return { name: 'Vô danh', description: 'Chưa có mô tả chi tiết.' };
  });
};

const getImageStyleKeywords = (styleName: string) => {
  return {
    keywords: 'photorealistic, raw photo, 8k uhd, highly detailed photography, soft natural lighting, Fujifilm, Canon EOS R5, realistic skin texture, sharp focus, no filter',
    type: 'photograph',
    negative: 'cartoon, drawing, painting, art, render, 3d, blurry, low quality, distorted, deformed, anime, sketch'
  };
};

export const useGameLogic = () => {
  const { toasts, addToast, removeToast } = useToast();
  const [view, setView] = useState<ViewState>('landing');
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false);
  const [isGalleryLoaded, setIsGalleryLoaded] = useState(false);

  const [selectedWorld, setSelectedWorld] = useState<GameArchetype | null>(null);
  const [selectedContext, setSelectedContext] = useState<SubScenario | null>(null);
  const [logs, setLogs] = useState<GameLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStep, setLoadingStep] = useState('');
  const [isSavingStatus, setIsSaving] = useState(false);
  const [isBackupSaving, setIsBackupSaving] = useState(false);
  const [lastAction, setLastAction] = useState<{ command: string, timeCost?: number } | null>(null);
  const [lastGameState, setLastGameState] = useState<{ 
    player: Player, 
    gameTime: GameTime, 
    logs: GameLog[],
    memory: any
  } | null>(null);

  const [checkpointState, setCheckpointState] = useState<{
    player: Player,
    gameTime: GameTime,
    logs: GameLog[],
    memory: any,
    selectedWorld: GameArchetype | null,
    selectedContext: SubScenario | null,
    view: ViewState
  } | null>(null);
  
  const [settings, setSettings] = useState<AppSettings>(() => {
    const defaultSettings: AppSettings = {
      aiModel: AiModel.FLASH_3,
      thinkingBudget: 0,
      thinkingLevel: ThinkingLevel.HIGH,
      contextWindowSize: 100,
      isFullscreen: false,
      mobileMode: typeof window !== 'undefined' ? window.innerWidth < 768 : false,
      primaryColor: '#10b981',
      adultContent: true,
      difficulty: 'medium',
      effectsEnabled: true,
      theme: 'dark',
      userApiKeys: [],
      fontSize: 15,
      beautifyContent: false,
      maxNpcsToSendToAi: 5,
      proxyStatus: 'idle',
      autoGenerateImages: false,
      imageModel: 'gemini-2.5-flash-image',
      imageStyle: 'Chân thực (Photorealistic): Ảnh trông như được chụp bằng camera chuyên nghiệp.',
      imageQuality: '1K',
      temperature: 1.0,
      writingStyle: WritingStyle.DEFAULT,
      narrativePerspective: NarrativePerspective.THIRD_PERSON,
      apiKeyEnabled: true,
      proxyEnabled: true,
      streamingEnabled: true,
      storageMode: 'local',
      proxyList: []
    };
    return defaultSettings;
  });

  // Automatic mobile detection on resize
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      if (isMobile !== settings.mobileMode) {
        setSettings(prev => ({ ...prev, mobileMode: isMobile }));
      }
    };
    window.addEventListener('resize', handleResize);
    // Initial check
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [settings.mobileMode]);

  // Persist settings to IndexedDB/Firestore
  useEffect(() => {
    if (!isSettingsLoaded) return;
    
    const syncSettings = async () => {
      const { isFullscreen, proxyStatus, ...rest } = settings;
      
      // Save to Database for persistence
      try {
        await dbService.saveSettings(rest);
      } catch (err) {
        console.error("Failed to save settings to Database", err);
      }
    };
    syncSettings();
  }, [settings, isSettingsLoaded]);

  const [gameTime, setGameTime] = useState<GameTime>({
    year: 0, month: 0, day: 0, hour: 0, minute: 0
  });
  
  const [modals, setModals] = useState({
    identity: false, codex: false, 
    memory: false, library: false, npcProfile: false, save: false, history: false, 
    settings: false, customIdentity: false, saveManager: false,
    aiHint: false, memorySyncError: false, aiCompanion: false,
    importWorld: false
  });
  
  const [activeNpcProfile, setActiveNpcProfile] = useState<Relationship | null>(null);
  const [memorySyncData, setMemorySyncData] = useState<{ logs: GameLog[], turn: number } | null>(null);

  const handleRetryMemory = useCallback(async () => {
    if (!memorySyncData) return;
    setModals(prev => ({ ...prev, memorySyncError: false }));
    setIsLoading(true);
    setLoadingStep("Đang thử lại đồng bộ ký ức...");
    try {
      await memoryService.updateMemory(memorySyncData.logs, memorySyncData.turn, true, settings);
      addToast("Đồng bộ ký ức thành công!", "success");
      setMemorySyncData(null);
    } catch (err) {
      console.error("Memory Retry Failed:", err);
      setModals(prev => ({ ...prev, memorySyncError: true }));
    } finally {
      setIsLoading(false);
      setLoadingStep("");
    }
  }, [memorySyncData, addToast, settings]);

  const handleSkipMemory = useCallback(() => {
    setModals(prev => ({ ...prev, memorySyncError: false }));
    setMemorySyncData(null);
    addToast("Đã bỏ qua đồng bộ ký ức lượt này.", "info");
  }, [addToast]);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  
  const [player, setPlayer] = useState<Player>(() => JSON.parse(JSON.stringify(INITIAL_PLAYER_STATE)));

  // Apply primary color to CSS variables
  useEffect(() => {
    if (!settings.primaryColor) return;
    
    // Convert hex to RGB for the --primary-rgb variable
    const hex = settings.primaryColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
      document.documentElement.style.setProperty('--primary-color', settings.primaryColor);
      document.documentElement.style.setProperty('--primary-rgb', `${r}, ${g}, ${b}`);
    }
    document.documentElement.style.setProperty('--app-font-size', `${settings.fontSize || 15}px`);
    document.documentElement.style.setProperty('--app-font', settings.fontFamily || '"Inter"');
  }, [settings.primaryColor, settings.fontSize, settings.fontFamily]);

  useEffect(() => {
    const handleFsChange = () => {
      const isActualFs = !!document.fullscreenElement;
      setSettings(prev => (prev.isFullscreen !== isActualFs ? { ...prev, isFullscreen: isActualFs } : prev));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Persist gallery to IndexedDB
  useEffect(() => {
    if (!isGalleryLoaded) return;
    
    dbService.saveGallery(gallery).catch(err => console.error("Failed to save gallery", err));
  }, [gallery, isGalleryLoaded]);

  const loadSaveData = useCallback((data: any, shouldSetView: boolean = true) => {
    if (!data) return;
    const loadedPlayer = { 
      ...data.player, 
      quests: Array.isArray(data.player.quests) ? data.player.quests : [],
      currentLocation: data.player.currentLocation || 'Khởi đầu thực tại'
    };
    if (loadedPlayer.personality === 'Chưa thức tỉnh nhân cách') {
      loadedPlayer.personality = '';
    }
    setPlayer(loadedPlayer);
    setLogs(data.logs || []);
    setGameTime(data.gameTime);
    if (data.selectedWorld) {
      setSelectedWorld(data.selectedWorld);
      setSelectedContext(data.selectedContext || null);
      if (shouldSetView) setView(data.view || 'playing');
    } else {
      if (shouldSetView) setView('landing');
    }
    if (data.memory) memoryService.setState(data.memory);
  }, [setView]);

  const saveCheckpoint = useCallback(async (overrides?: any) => {
    const data = {
      player: overrides?.player || JSON.parse(JSON.stringify(player)),
      logs: overrides?.logs || [...logs],
      gameTime: overrides?.gameTime || { ...gameTime },
      memory: overrides?.memory || memoryService.getState(),
      selectedWorld: overrides?.selectedWorld || selectedWorld,
      selectedContext: overrides?.selectedContext || selectedContext,
      view: overrides?.view || view
    };
    setCheckpointState(data);
    try {
      await dbService.save(data, 'checkpoint_session');
    } catch (err) {
      console.error("Failed to save checkpoint:", err);
    }
  }, [player, logs, gameTime, selectedWorld, selectedContext, view]);

  useEffect(() => {
    const initLoad = async () => {
      try {
        // 1. Load settings (dbService handles local fallback)
        const dbSettings = await dbService.getSettings();
        console.log("Loaded settings from DB:", dbSettings);
        if (dbSettings) {
          setSettings(prev => ({ ...prev, ...dbSettings, isFullscreen: false }));
        }
        setIsSettingsLoaded(true);

        // 2. Load global gallery
        const globalGallery = await dbService.getGallery();
        setGallery(globalGallery);
        setIsGalleryLoaded(true);

        // 3. Load latest save
        const latest = await dbService.getLatestSave();
        if (latest?.data) {
          // Load data but force landing view on F5
          loadSaveData(latest.data, false);
          setView('landing');
        }

        // 4. Load checkpoint
        const checkpoint = await dbService.load('checkpoint_session');
        if (checkpoint) {
          setCheckpointState(checkpoint);
        }
      } catch (err) { 
        console.error("Initial Load Error", err); 
      }
    };
    initLoad();
  }, [loadSaveData, setView]);

  const triggerAutoSave = useCallback(async (overrides?: any) => {
    const currentPlayer = overrides?.player || player;
    const currentView = overrides?.view || view;
    const worldToSave = overrides?.selectedWorld || selectedWorld;

    if (!worldToSave && currentView === 'playing') {
      console.warn("AutoSave blocked: No selectedWorld while in playing view.");
      return;
    }

    setIsSaving(true);
    const slotIndex = currentPlayer.turnCount % 10;
    const slotId = `auto_slot_${slotIndex}`;
    
    const dataToSave = {
      player: currentPlayer,
      logs: overrides?.logs || logs,
      gameTime: overrides?.gameTime || gameTime,
      selectedWorld: worldToSave,
      selectedContext: overrides?.selectedContext || selectedContext,
      view: currentView,
      settings: overrides?.settings || settings,
      memory: memoryService.getState(),
    };
    try { 
      await dbService.save(dataToSave, slotId); 
      await dbService.save(dataToSave, 'current_session');
    } catch (err) {
      console.error("AutoSave failed:", err);
    } finally { 
      setTimeout(() => setIsSaving(false), 800); 
    }
  }, [player, logs, gameTime, selectedWorld, selectedContext, view, settings]);

  const saveBackupTurn = useCallback(async (overrides?: any) => {
    const currentPlayer = overrides?.player || player;
    const currentView = overrides?.view || view;
    const worldToSave = overrides?.selectedWorld || selectedWorld;

    if (!worldToSave && currentView === 'playing') return;

    setIsBackupSaving(true);
    
    const dataToSave = {
      player: currentPlayer,
      logs: overrides?.logs || logs,
      gameTime: overrides?.gameTime || gameTime,
      selectedWorld: worldToSave,
      selectedContext: overrides?.selectedContext || selectedContext,
      view: currentView,
      settings: overrides?.settings || settings,
      memory: memoryService.getState(),
      isBackup: true,
      backupTimestamp: Date.now()
    };

    try {
      await dbService.save(dataToSave, 'backup_turn_session');
    } catch (err) {
      console.error("Backup Save failed:", err);
    } finally {
      setTimeout(() => setIsBackupSaving(false), 1000);
    }
  }, [player, logs, gameTime, selectedWorld, selectedContext, view, settings]);

  const onUpdateLog = useCallback((index: number, newContent: string) => {
    setLogs(prev => {
      const newLogs = [...prev];
      if (index >= 0 && index < newLogs.length) {
        newLogs[index] = { ...newLogs[index], content: newContent };
      }
      return newLogs;
    });
  }, []);

  const formatGameTime = useCallback((t: GameTime) => {
    if (!t || t.year === 0) return "Ngày ??/??/???? | ??:??";
    const d = t.day ? t.day.toString().padStart(2, '0') : '??';
    const m = t.month ? t.month.toString().padStart(2, '0') : '??';
    const y = t.year || '????';
    const h = t.hour !== undefined ? t.hour.toString().padStart(2, '0') : '??';
    const min = t.minute !== undefined ? t.minute.toString().padStart(2, '0') : '??';
    
    const dayOfWeek = (t.year && t.month && t.day) ? getDayOfWeek(t.year, t.month, t.day) : "";
    const canChiYear = t.year ? ` (Năm ${getYearCanChi(t.year)})` : "";
    const dowStr = dayOfWeek ? `${dayOfWeek}, ` : "";
    
    return `${dowStr}Ngày ${d}/${m}/${y}${canChiYear} | ${h}:${min}`;
  }, []);

  const handleCommand = useCallback(async (command: string, timeCost?: number, overrideState?: { player: Player, logs: GameLog[], gameTime: GameTime, memory: any }) => {
    if (!command.trim() || isLoading || !selectedWorld) return;
    
    const startPlayer = overrideState ? overrideState.player : player;
    const startLogs = overrideState ? overrideState.logs : logs;
    const startTime = overrideState ? overrideState.gameTime : gameTime;
    const startMemory = overrideState ? overrideState.memory : memoryService.getState();

    // Save checkpoint before processing new command
    if (!overrideState) {
      saveCheckpoint();
      setLastGameState({
        player: JSON.parse(JSON.stringify(player)),
        logs: [...logs],
        gameTime: { ...gameTime },
        memory: memoryService.getState()
      });
    } else {
      memoryService.setState(startMemory);
    }

    let currentLogs = [...startLogs];
    
    const playerLog: GameLog = { content: command, type: 'player', timestamp: Date.now() };
    currentLogs.push(playerLog);
    setLogs(currentLogs);
    setPlayer(startPlayer);
    setGameTime(startTime);
    setLastAction({ command, timeCost });
    
    // Lưu Backup Turn ngay lập tức để bảo toàn trạng thái nếu AI gặp lỗi hoặc người dùng F5
    saveBackupTurn({ 
      logs: currentLogs, 
      player: startPlayer,
      gameTime: startTime
    });
    
    setIsLoading(true);
    setLoadingProgress(10);
    setLoadingStep('Khởi tạo yêu cầu...');
    
    const perfStartTime = performance.now();
    try {
      setLoadingProgress(30);
      setLoadingStep('Phân tích bối cảnh...');
      
      // Lịch sử nén: Giữ 2 lượt cuối chi tiết, còn lại tóm tắt
      const rawHistory = currentLogs.filter(l => (l.type === 'player' || l.type === 'narrator') && l.content !== command);
      const historyLimit = settings.contextWindowSize * 2;
      const recentTurns = rawHistory.slice(-4); // 2 cặp lượt cuối
      const olderTurns = rawHistory.slice(-historyLimit, -4);
      
      const history = [];
      
      if (olderTurns.length > 0) {
        const summaryText = olderTurns.map(l => {
          const content = l.summary || (l.content.length > 300 ? l.content.slice(0, 300) + "..." : l.content);
          return `${l.type[0].toUpperCase()}:${content.replace(/\|/g, ' ')}`;
        }).join('|');
        history.push({
          role: 'user',
          parts: [{ text: `[PREV_LOGS]:${summaryText}` }]
        });
        history.push({
          role: 'model',
          parts: [{ text: "ACK" }]
        });
      }
      
      recentTurns.forEach(l => {
        history.push({
          role: l.type === 'player' ? 'user' : 'model',
          parts: [{ text: l.type === 'player' ? l.content : (l.summary || l.content) }]
        });
      });
      
      setLoadingProgress(50);
      setLoadingStep('Kết nối Ma Trận AI...');
      
      const timeStr = startTime.year === 0 ? "Ngày ??/??/???? | ??:??" : formatGameTime(startTime);
      
      let update: any;
      const narratorLogId = Date.now();

      if (settings.streamingEnabled) {
        setLoadingStep('Matrix...');
        
        // Add placeholder narrator log for streaming
        const initialNarratorLog: GameLog = { 
          content: "Đang nhận dữ liệu...", 
          type: 'narrator', 
          timestamp: narratorLogId,
          isStreaming: true,
          metadata: { duration: "...", usedKeyIndex: 0, usedModel: settings.aiModel }
        };
        setLogs(prev => [...prev, initialNarratorLog]);

        let streamedText = "";
        let finalData: any = null;

        const stream = gameAI.getResponseStream(
          command, 
          history, 
          startPlayer, 
          selectedWorld?.genre || GameGenre.FREE_STYLE, 
          selectedWorld?.id?.startsWith('fanfic_') || false,
          selectedWorld?.systemInstruction || '', 
          settings, 
          (currentLogs[currentLogs.length - 1]?.metadata?.newNpcCount || 0), 
          timeStr
        );

        for await (const chunk of stream) {
          if (chunk.type === 'text') {
            streamedText += chunk.content;
            setLogs(prev => prev.map(l => 
              l.timestamp === narratorLogId ? { ...l, content: streamedText } : l
            ));
          } else if (chunk.type === 'data') {
            finalData = chunk.content;
          } else if (chunk.type === 'status') {
            setLoadingStep(chunk.content as string);
          }
        }

        if (!finalData) throw new Error("Không nhận được dữ liệu cuối cùng từ AI.");
        update = finalData;
      } else {
        update = await gameAI.getResponse(
          command, 
          history, 
          startPlayer, 
          selectedWorld?.genre || GameGenre.FREE_STYLE, 
          selectedWorld?.id?.startsWith('fanfic_') || false,
          selectedWorld?.systemInstruction || '', 
          settings, 
          (currentLogs[currentLogs.length - 1]?.metadata?.newNpcCount || 0), 
          timeStr
        );
      }
      
      setLoadingProgress(80);
      setLoadingStep('Đang nhận phản hồi...');
      
      const endTime = performance.now();
      const duration = ((endTime - perfStartTime) / 1000).toFixed(2);
      
      // Luôn cập nhật thông tin khi AI phản hồi thành công, bất kể là tải lại hay lượt mới
      let updatedPlayer = { ...startPlayer };
      updatedPlayer.turnCount++;
      
      // Update token usage
      const latestTokens = update.tokenUsage || 0;
      const totalTokens = (updatedPlayer.tokenUsage?.total || 0) + latestTokens;
      const oldHistory = updatedPlayer.tokenUsage?.history || [];
      const newHistory = [latestTokens, ...oldHistory].slice(0, 5);
      updatedPlayer.tokenUsage = {
        latest: latestTokens,
        total: totalTokens,
        history: newHistory
      };

      const narratorText = update.text || "";
      const usedKeyIndex = update.usedKeyIndex;
      const usedModel = update.usedModel;
      const usedProxy = update.usedProxy;
      
      const isProxy = !!usedProxy;
      const coreLabel = isProxy ? "PROXY_CORE" : `CORE_${usedKeyIndex}`;
      const modelLabel = usedModel ? ` | ${isProxy ? 'PROXY_MODEL' : 'MODEL'}: ${usedModel}` : "";
      const proxyLabel = usedProxy ? ` | GATEWAY: ${usedProxy}` : "";
      
      const justification = update.evolutionJustification;
      const newRelsRaw = Array.isArray(update.newRelationships) ? update.newRelationships : [];
      let currentRels: Relationship[] = [...updatedPlayer.relationships].map(r => ({ ...r, isPresent: false }));
      let newNpcCount = 0;
      newRelsRaw.forEach(rawNpc => {
        if (!rawNpc || (!rawNpc.id && !rawNpc.name)) return;
        
        // Tìm kiếm NPC cũ dựa trên ID hoặc Tên
        let existingIdx = currentRels.findIndex(r => rawNpc.id && r.id === rawNpc.id);
        
        // Nếu tìm thấy theo ID, kiểm tra xem tên có khớp không (tránh trường hợp AI gán nhầm ID cũ cho nhân vật mới)
        if (existingIdx > -1) {
          const oldName = currentRels[existingIdx].name || "";
          const newName = rawNpc.name || "";
          
          // Nếu tên khác hoàn toàn (không chứa nhau và không giống nhau), có thể AI đã gán nhầm ID
          // Trong trường hợp này, chúng ta sẽ thử tìm theo tên thay vì ID
          if (oldName && newName && !oldName.toLowerCase().includes(newName.toLowerCase()) && !newName.toLowerCase().includes(oldName.toLowerCase())) {
            const indexByName = currentRels.findIndex(r => r.name && newName && r.name.toLowerCase() === newName.toLowerCase());
            existingIdx = indexByName; // Có thể là -1 nếu không tìm thấy theo tên
          }
        } else {
          // Nếu không tìm thấy theo ID, thử tìm theo tên
          existingIdx = currentRels.findIndex(r => r.name && rawNpc.name && r.name.toLowerCase() === rawNpc.name.toLowerCase());
        }

        if (existingIdx > -1) {
          const oldAffinity = currentRels[existingIdx].affinity || 0;
          const oldLoyalty = currentRels[existingIdx].loyalty || 0;
          const oldLust = currentRels[existingIdx].lust || 0;
          const oldLibido = currentRels[existingIdx].libido || 0;

          currentRels[existingIdx] = mergeNpcData(currentRels[existingIdx], rawNpc, narratorText, startTime.year, justification);
          currentRels[existingIdx].isPresent = true;
          
          // Đồng bộ vị trí nếu NPC đang hiện diện
          const finalLoc = update.currentLocation || (update.statsUpdates?.currentLocation) || updatedPlayer.currentLocation;
          if (finalLoc) {
            currentRels[existingIdx].lastLocation = finalLoc;
          }

          // Detect changes for notification
          const newAffinity = currentRels[existingIdx].affinity || 0;
          const newLoyalty = currentRels[existingIdx].loyalty || 0;
          const newLust = currentRels[existingIdx].lust || 0;
          const newLibido = currentRels[existingIdx].libido || 0;
          const reason = rawNpc.affinityChangeReason || 
                         rawNpc.reason || 
                         (rawNpc as any).affinity_change_reason || 
                         (rawNpc as any).affinity_reason || 
                         (rawNpc as any).changeReason ||
                         "Tương tác tự nhiên";

          const createChangeLog = (label: string, oldVal: number, newVal: number) => {
            if (oldVal !== newVal) {
              const diff = newVal - oldVal;
              const sign = diff > 0 ? '+' : '';
              
              // Basic Auto-Audit Logic
              const negWords = ['giận', 'ghét', 'thất vọng', 'phản bội', 'khinh', 'tệ', 'xấu', 'đau', 'buồn', 'mất', 'hại', 'chán', 'phiền', 'nhạt', 'nguội', 'lạnh'];
              const posWords = ['vui', 'thích', 'yêu', 'mến', 'cảm động', 'ơn', 'tốt', 'đẹp', 'sướng', 'hạnh phúc', 'phê', 'cực khoái', 'khao khát', 'hưng phấn', 'thân', 'tình'];
              const reasonLower = reason.toLowerCase();
              const hasNeg = negWords.some(w => reasonLower.includes(w));
              const hasPos = posWords.some(w => reasonLower.includes(w));
              
              let auditWarning = "";
              if (diff > 0 && hasNeg && !hasPos) {
                auditWarning = " [ ⚠️ CẢNH BÁO LOGIC: Lý do tiêu cực nhưng điểm tăng ]";
              } else if (diff < 0 && hasPos && !hasNeg) {
                auditWarning = " [ ⚠️ CẢNH BÁO LOGIC: Lý do tích cực nhưng điểm giảm ]";
              }

              return `[ ${currentRels[existingIdx].name} ] [ ${label} ${sign}${diff} ] [ ${newVal}/1000 ] [ Lý do: ${reason} ]${auditWarning}`;
            }
            return null;
          };

          const affLog = createChangeLog('Thiện cảm', oldAffinity, newAffinity);
          const loyLog = createChangeLog('Trung thành', oldLoyalty, newLoyalty);
          const lustLog = createChangeLog('Hưng phấn', oldLust, newLust);
          const libidoLog = createChangeLog('Bản tính dâm', oldLibido, newLibido);

          const combinedNpcLogs = [affLog, loyLog, lustLog, libidoLog].filter(Boolean).join('\n');
          if (combinedNpcLogs) {
            currentLogs.push({
              content: `GM: ${combinedNpcLogs}`,
              type: 'system',
              timestamp: Date.now()
            });
          }
        } else {
          const npcWithId = { ...rawNpc, id: `npc_${String(updatedPlayer.nextNpcId++).padStart(6, '0')}` };
          const finalLoc = update.currentLocation || (update.statsUpdates?.currentLocation) || updatedPlayer.currentLocation;
          if (finalLoc) {
            npcWithId.lastLocation = finalLoc;
          }
          currentRels.push(compensateNpcData({ ...npcWithId, isPresent: true, viewed: false }, startTime.year));
          newNpcCount++;
        }
      });
      // Đồng bộ hóa các mối quan hệ đối xứng để đảm bảo tính nhất quán
      currentRels = syncBidirectionalRelationships(currentRels, updatedPlayer.name);
      
      updatedPlayer.relationships = currentRels;
      let finalNarratorText = narratorText;
      if (justification) {
        finalNarratorText += `\n\n[ GIẢI TRÌNH THAY ĐỔI ]: ${justification}`;
      }
      
      const wordCount = (update.text || "").trim().split(/\s+/).filter(Boolean).length;
      const tokenInfo = updatedPlayer.tokenUsage?.latest ? ` | TIÊU THỤ: ${updatedPlayer.tokenUsage.latest} TOKENS` : "";
      finalNarratorText += `\n\n[ THỜI GIAN KIẾN TẠO THỰC TẠI: ${duration} GIÂY | ${wordCount} CHỮ${tokenInfo} | ${coreLabel}${modelLabel}${proxyLabel} ]`;
      
      const narratorLog: GameLog = { 
        content: finalNarratorText, 
        type: 'narrator', 
        timestamp: settings.streamingEnabled ? narratorLogId : Date.now(), 
        suggestedActions: update.suggestedActions,
        summary: update.summary,
        metadata: { duration, usedKeyIndex, usedModel, usedProxy, newNpcCount }
      };
      
      // currentLogs đã chứa log người chơi và đã được dọn dẹp nếu là retry
      let finalLogs: GameLog[];
      if (settings.streamingEnabled) {
        // Cập nhật log đang stream trong state
        setLogs(prev => prev.map(l => l.timestamp === narratorLogId ? narratorLog : l));
        
        // Tạo finalLogs từ currentLogs (không chứa narratorLogId) và narratorLog mới
        // Điều này đảm bảo không có bản sao của narratorLogId trong finalLogs
        finalLogs = [...currentLogs, narratorLog];
      } else {
        finalLogs = [...currentLogs, narratorLog];
        setLogs(finalLogs);
      }
      
      // Tự động tạo ảnh mô tả nếu được bật
      let finalLogsWithImage = [...finalLogs];
      if (settings.autoGenerateImages) {
        setLoadingStep("Đang phác họa hình ảnh thực tại...");
        try {
          const styleConfig = getImageStyleKeywords(settings.imageStyle || 'Ảnh chụp');
          
          // Clean prompt: remove system metadata in brackets like [ KHỞI TẠO... ]
          const cleanDescription = narratorText.replace(/\[\s*(?:KHỞI TẠO|GIẢI TRÌNH|HỆ THỐNG|THÔNG BÁO)[^\]]+\]/gi, '').trim();
          
          const imagePrompt = `A high quality ${styleConfig.keywords} ${styleConfig.type} for a text-based game. Scene description: ${cleanDescription}. Genre: ${selectedWorld?.genre || GameGenre.FREE_STYLE}. SFW, high detail, masterpiece. If any text appears in the image, it must be correctly spelled in Vietnamese and use clear, high-quality fonts. Strictly adhere to the ${settings.imageStyle} style. Negative prompt: nsfw, nude, naked, deformed, blurry, low quality, bad anatomy, extra limbs, text, watermark, ${styleConfig.negative || ''}`;
          
          const imgStartTime = Date.now();
          let imageUrl = await gameAI.generateImage(imagePrompt, settings);
          const imgDuration = ((Date.now() - imgStartTime) / 1000).toFixed(2);
          const imgModel = settings.imageModel || 'gemini-2.5-flash-image';
          const imageMetadata = { duration: imgDuration, model: imgModel, style: settings.imageStyle || 'Mặc định' };

          if (imageUrl && isBase64(imageUrl)) {
            try {
              const file = base64ToFile(imageUrl, `scene-${Date.now()}.png`);
              const uploadedUrl = await uploadImage(file, 'cloud');
              if (uploadedUrl) imageUrl = uploadedUrl;
            } catch (uploadErr) {
              console.warn("Auto image upload failed, keeping base64:", uploadErr);
            }
          }

          if (imageUrl) {
            finalLogsWithImage = finalLogsWithImage.map((l, idx) => 
              idx === finalLogsWithImage.length - 1 ? { ...l, imageUrl, imageMetadata } : l
            );
            
            // Add to global gallery
            setGallery(prev => [{ url: imageUrl, tags: ['Mô Tả Truyện'], genre: selectedWorld?.genre || GameGenre.FREE_STYLE }, ...prev]);
          }
        } catch (err: any) {
          console.error("Failed to generate image:", err);
          const errorLog: GameLog = {
            content: `GM: ${err.message || "Phác họa hình ảnh thất bại."}`,
            type: 'error',
            timestamp: Date.now()
          };
          finalLogsWithImage.push(errorLog);
        }
      }

      // AI-driven time progression (Strictly AI-controlled)
      const nextTime = update.newTime || startTime;
      if (update.newTime) {
        // nextTime already calculated above
      }
      
      if (update.statsUpdates) {
        const s = update.statsUpdates;
        const newFields = updatedPlayer.newFields || [];

        const mergeNumericStat = (current: number, updateVal: any, isHealth: boolean = false): number => {
          const safeCurrent = (typeof current !== 'number' || isNaN(current)) ? 0 : current;
          if (updateVal === undefined || updateVal === null) return safeCurrent;
          
          let finalValue = safeCurrent;
          if (typeof updateVal === 'string') {
            const cleaned = updateVal.trim();
            if (cleaned.startsWith('+') && cleaned.length > 1) {
              const val = parseInt(cleaned.substring(1));
              finalValue = isNaN(val) ? safeCurrent : safeCurrent + val;
            } else if (cleaned.startsWith('-') && cleaned.length > 1) {
              const val = parseInt(cleaned.substring(1));
              finalValue = isNaN(val) ? safeCurrent : safeCurrent - val;
            } else {
              const val = parseInt(cleaned);
              finalValue = isNaN(val) ? safeCurrent : val;
            }
          } else if (typeof updateVal === 'number') {
            finalValue = isNaN(updateVal) ? safeCurrent : updateVal;
          }

          if (isHealth) {
            const safeMax = (typeof updatedPlayer.maxHealth !== 'number' || isNaN(updatedPlayer.maxHealth)) ? 100 : updatedPlayer.maxHealth;
            return Math.min(safeMax, Math.max(0, finalValue));
          }
          return Math.max(0, finalValue);
        };

        if (s.maxHealth !== undefined && !updatedPlayer.lockedFields?.includes('maxHealth')) {
          updatedPlayer.maxHealth = s.maxHealth;
        }
        if (s.health !== undefined && !updatedPlayer.lockedFields?.includes('health')) {
          updatedPlayer.health = mergeNumericStat(updatedPlayer.health, s.health, true);
        }
        if (s.gold !== undefined && !updatedPlayer.lockedFields?.includes('gold')) {
          updatedPlayer.gold = mergeNumericStat(updatedPlayer.gold, s.gold);
        }
        if (s.exp !== undefined && !updatedPlayer.lockedFields?.includes('exp')) {
          updatedPlayer.exp = mergeNumericStat(updatedPlayer.exp, s.exp);
        }
        if (s.level !== undefined && !updatedPlayer.lockedFields?.includes('level')) {
          updatedPlayer.level = s.level;
        }
        
        const canUpdate = (field: string, newVal: any, oldVal: any) => {
          if (newVal === undefined || newVal === null) return false;
          if (updatedPlayer.lockedFields?.includes(field)) return false;
          // Bảo vệ dữ liệu hợp lệ: Không cho phép ghi đè một giá trị hợp lệ bằng một placeholder
          if (isValidValue(oldVal) && !isValidValue(newVal)) return false;
          return newVal !== oldVal;
        };

        const trackField = (key: string, newVal: any, oldVal: any) => {
          if (canUpdate(key, newVal, oldVal)) {
            if (!isValidValue(oldVal) && isValidValue(newVal)) {
              if (!newFields.includes(key)) newFields.push(key);
            }
          }
        };

        if (canUpdate('name', s.name, updatedPlayer.name)) {
          trackField('name', s.name, updatedPlayer.name);
          updatedPlayer.name = s.name;
        }
        
        if (canUpdate('title', s.title, updatedPlayer.title)) {
          trackField('title', s.title, updatedPlayer.title);
          updatedPlayer.title = s.title;
        }
        
        if (canUpdate('currentLocation', s.currentLocation, updatedPlayer.currentLocation)) {
          trackField('currentLocation', s.currentLocation, updatedPlayer.currentLocation);
          updatedPlayer.currentLocation = s.currentLocation;
        }
        
        if (canUpdate('systemName', s.systemName, updatedPlayer.systemName)) {
          trackField('systemName', s.systemName, updatedPlayer.systemName);
          updatedPlayer.systemName = s.systemName;
        }
        
        if (canUpdate('systemDescription', s.systemDescription, updatedPlayer.systemDescription)) {
          trackField('systemDescription', s.systemDescription, updatedPlayer.systemDescription);
          updatedPlayer.systemDescription = s.systemDescription;
        }
        
        if (canUpdate('personality', s.personality, updatedPlayer.personality)) {
          trackField('personality', s.personality, updatedPlayer.personality);
          updatedPlayer.personality = s.personality;
        }
        
        if (canUpdate('gender', s.gender, updatedPlayer.gender)) {
          trackField('gender', s.gender, updatedPlayer.gender);
          updatedPlayer.gender = s.gender;
        }

        if (s.aiCompanion && updatedPlayer.aiCompanion) {
          updatedPlayer.aiCompanion = {
            ...updatedPlayer.aiCompanion,
            ...s.aiCompanion
          };
        }
        
        if (canUpdate('age', s.age, updatedPlayer.age)) {
          trackField('age', s.age, updatedPlayer.age);
          updatedPlayer.age = s.age;
        }
        
        if (canUpdate('birthday', s.birthday, updatedPlayer.birthday)) {
          trackField('birthday', s.birthday, updatedPlayer.birthday);
          updatedPlayer.birthday = s.birthday;
        }
        
        if (canUpdate('cultivation', s.cultivation, updatedPlayer.cultivation)) {
          trackField('cultivation', s.cultivation, updatedPlayer.cultivation);
          updatedPlayer.cultivation = s.cultivation;
        }

        if (canUpdate('customCultivation', s.customCultivation, updatedPlayer.customCultivation)) {
          trackField('customCultivation', s.customCultivation, updatedPlayer.customCultivation);
          updatedPlayer.customCultivation = s.customCultivation;
        }
        
        if (canUpdate('avatar', s.avatar, updatedPlayer.avatar)) {
          trackField('avatar', s.avatar, updatedPlayer.avatar);
          if (s.avatar && (s.avatar.startsWith('http') || s.avatar.startsWith('data:') || s.avatar.startsWith('/'))) {
            updatedPlayer.avatar = s.avatar;
          }
        }
        
        if (s.customCurrency && !updatedPlayer.lockedFields?.includes('customCurrency')) updatedPlayer.customCurrency = s.customCurrency;
        if (s.statLabels && !updatedPlayer.lockedFields?.includes('statLabels')) updatedPlayer.statLabels = { ...updatedPlayer.statLabels, ...s.statLabels };
        
        if (Array.isArray(s.customFields) && !updatedPlayer.lockedFields?.includes('customFields')) {
          const mergedCustomFields = [...updatedPlayer.customFields];
          s.customFields.forEach(newField => {
            if (!newField || !newField.label) return;
            const existingIdx = mergedCustomFields.findIndex(f => f.label === newField.label);
            if (existingIdx > -1) {
              const oldVal = mergedCustomFields[existingIdx].value;
              if (isValidValue(newField.value) || !isValidValue(oldVal)) {
                mergedCustomFields[existingIdx] = { ...mergedCustomFields[existingIdx], ...newField };
              }
            } else if (isValidValue(newField.value)) {
              mergedCustomFields.push(newField);
            }
          });
          updatedPlayer.customFields = mergedCustomFields;
        }
        
        if (Array.isArray(s.inventory) && !updatedPlayer.lockedFields?.includes('inventory')) updatedPlayer.inventory = normalizeObjectArray(s.inventory);
        if (Array.isArray(s.skills) && !updatedPlayer.lockedFields?.includes('skills')) updatedPlayer.skills = normalizeObjectArray(s.skills);
        if (Array.isArray(s.assets) && !updatedPlayer.lockedFields?.includes('assets')) updatedPlayer.assets = normalizeObjectArray(s.assets);
        if (Array.isArray(s.identities) && !updatedPlayer.lockedFields?.includes('identities')) updatedPlayer.identities = s.identities;
        if (Array.isArray(s.conditions) && !updatedPlayer.lockedFields?.includes('conditions')) updatedPlayer.conditions = normalizeConditionsArray(s.conditions);
        
        if (Array.isArray(s.backgroundAttributes) && !updatedPlayer.lockedFields?.includes('backgroundAttributes')) {
          const mergedAttrs = [...(updatedPlayer.backgroundAttributes || [])];
          s.backgroundAttributes.forEach(newAttr => {
            if (!newAttr || !newAttr.label) return;
            const existingIdx = mergedAttrs.findIndex(a => a.label === newAttr.label);
            if (existingIdx > -1) {
              mergedAttrs[existingIdx] = { ...mergedAttrs[existingIdx], ...newAttr };
            } else {
              mergedAttrs.push(newAttr);
            }
          });
          updatedPlayer.backgroundAttributes = mergedAttrs;
        }

        if (s.stats) {
          Object.entries(s.stats).forEach(([statKey, statVal]) => {
            const fieldKey = `stat_${statKey}`;
            const oldVal = (updatedPlayer.stats as any)[statKey];
            
            if (!updatedPlayer.lockedFields?.includes(fieldKey)) {
              const finalVal = mergeNumericStat(oldVal || 0, statVal);
              trackField(fieldKey, finalVal, oldVal);
              (updatedPlayer.stats as any)[statKey] = finalVal;
            }
          });
        }

        updatedPlayer.newFields = newFields;
      }
      if (update.currentLocation && !updatedPlayer.lockedFields?.includes('currentLocation')) updatedPlayer.currentLocation = update.currentLocation;

      if (Array.isArray(update.questUpdates) && !updatedPlayer.lockedFields?.includes('quests')) {
        let currentQuests = [...updatedPlayer.quests];
        update.questUpdates.forEach(q => {
          const idx = currentQuests.findIndex(cq => cq.id === q.id);
          if (idx > -1) {
            const oldStatus = currentQuests[idx].status;
            currentQuests[idx] = { ...currentQuests[idx], ...q };
            
            // Thông báo hoàn thành nhiệm vụ
            if (oldStatus !== 'completed' && q.status === 'completed') {
              addToast(`Nhiệm vụ hoàn thành: ${q.title}`, "success");
              currentLogs.push({
                content: `[ NHIỆM VỤ HOÀN THÀNH ]: ${q.title}`,
                type: 'system',
                timestamp: Date.now()
              });
            }
          } else {
            currentQuests.push(q);
            addToast(`Nhiệm vụ mới: ${q.title}`, "info");
            // Notify new quest
            currentLogs.push({
              content: `[ NHIỆM VỤ MỚI ]: ${q.title}`,
              type: 'system',
              timestamp: Date.now()
            });
          }
        });
        updatedPlayer.quests = currentQuests;
      }

      if (update.newCodexEntry) {
        const entry = { ...update.newCodexEntry, viewed: false };
        const exists = updatedPlayer.codex.some(c => c.title === entry.title);
        if (!exists) {
          updatedPlayer.codex = [...updatedPlayer.codex, entry];
          addToast(`Bản ghi mới: ${entry.title}`, "info");
        }
      }

      // Ensure genre entry exists in Codex
      const genreTitle = `Hệ Thống Thế Giới: ${selectedWorld?.genre || GameGenre.FREE_STYLE}`;
      const hasGenreEntry = updatedPlayer.codex.some(c => c.title.includes('Hệ Thống Thế Giới') || c.title.includes('Thể loại'));
      if (!hasGenreEntry) {
        const genreEntry: CodexEntry = {
          category: 'destiny',
          title: genreTitle,
          content: `### Phân Loại Thực Tại\n\nThế giới này được vận hành theo quy luật: **${selectedWorld?.genre || GameGenre.FREE_STYLE}**.\n\n### Đặc trưng thế giới\n\n${selectedWorld?.description || ''}\n\n### Tính năng cốt lõi\n\n${selectedWorld?.features?.map(f => `- ${f}`).join('\n') || ''}`,
          unlocked: true,
          viewed: false
        };
        updatedPlayer.codex = [...updatedPlayer.codex, genreEntry];
      }

      if (Array.isArray(update.newCodexEntries)) {
        update.newCodexEntries.forEach(entry => {
          const entryWithViewed = { ...entry, viewed: false };
          const exists = updatedPlayer.codex.some(c => c.title === entryWithViewed.title);
          if (!exists) updatedPlayer.codex.push(entryWithViewed);
        });
      }

      if (Array.isArray(update.newStoryNodes)) {
        const currentStoryNodes = [...(updatedPlayer.storyNodes || [])];
        update.newStoryNodes.forEach(node => {
          const exists = currentStoryNodes.some(n => n.id === node.id);
          if (!exists) {
            currentStoryNodes.push({
              ...node,
              timestamp: Date.now()
            });
          }
        });
        updatedPlayer.storyNodes = currentStoryNodes;
      }

      if (updatedPlayer.aiHints?.oneTurn) {
        updatedPlayer.aiHints = { ...updatedPlayer.aiHints, oneTurn: '' };
      }

      // Tự động cập nhật ký ức và tóm tắt lịch sử nếu quá dài
      if (true) {
        try {
          setLoadingStep("Đang kết tinh ký ức...");
          await memoryService.updateMemory(finalLogsWithImage, updatedPlayer.turnCount, true, settings);
          
          // Kiểm tra nếu lịch sử quá dài để tóm tắt vào Chronicle
          const historyThreshold = (settings.contextWindowSize || 100) * 2;
          const relevantLogs = finalLogsWithImage.filter(l => l.type === 'player' || l.type === 'narrator');
          
          if (relevantLogs.length > historyThreshold + 10) {
            setLoadingStep("Đang nén biên niên sử thế giới...");
            // Lấy 20 lượt cũ nhất chưa được tóm tắt (giả sử)
            // Để đơn giản, ta tóm tắt phần vượt quá ngưỡng
            const historyToSummarize = relevantLogs.slice(0, 20).map(l => ({
              role: l.type === 'player' ? 'user' : 'model',
              parts: [{ text: l.type === 'player' ? l.content : (l.summary || l.content) }]
            }));
            
            const currentMem = memoryService.getState();
            const newChronicle = await gameAI.summarizeHistory(historyToSummarize, currentMem.chronicle, settings);
            
            memoryService.setState({
              ...currentMem,
              chronicle: newChronicle
            });
            addToast("Biên niên sử thế giới đã được cập nhật và nén.", "success");
          } else {
            addToast("Ký ức đã được kết tinh tự động.", "success");
          }
        } catch (memError) {
          console.error("Automatic Memory Update Failed:", memError);
          setMemorySyncData({ logs: finalLogsWithImage, turn: updatedPlayer.turnCount });
          setModals(prev => ({ ...prev, memorySyncError: true }));
          addToast("Lỗi kết tinh ký ức! Hãy thử thêm Key API cá nhân để ổn định kết nối.", "error");
        }
      }

      // Đảm bảo các trạng thái game được cập nhật trước khi kết thúc lượt
      setLogs(finalLogsWithImage);
      setPlayer(updatedPlayer);
      setGameTime(nextTime);

      triggerAutoSave({ 
        player: updatedPlayer, 
        logs: finalLogsWithImage, 
        gameTime: nextTime,
      });
      
      setLoadingProgress(100);
      setLoadingStep('Đồng bộ thực tại...');
    } catch (error: any) {
      console.error("Game AI Error:", error);
      addToast("Lỗi kết nối Ma Trận AI!", "error");
      const coreIndex = error?.usedKeyIndex;
      const coreInfo = coreIndex && coreIndex > 0 ? ` (Core #${coreIndex})` : "";
      
      const errorMessage = error?.message?.includes("API_KEY_INVALID") 
        ? `API Key${coreInfo} không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại Ma Trận API.`
        : error?.message?.includes("quota")
        ? `Hết hạn mức API${coreInfo} (Rate Limit). Nguyên nhân: Bạn đang dùng Key miễn phí (giới hạn 15 lượt/phút) hoặc AI đang tạo ảnh song song. Hãy đợi 1 phút rồi thử lại, hoặc tắt 'Tự động tạo ảnh' trong Cài đặt.`
        : error?.message?.includes("SAFETY_BLOCK")
        ? `[BỘ LỌC AN TOÀN]: ${error.message.split(": ")[1] || "Nội dung bị chặn do quá nhạy cảm."}`
        : error?.message?.includes("PARSE_ERROR")
        ? `[LỖI DỮ LIỆU]: ${error.message.split(": ")[1] || "Lỗi phân tích lượng tử."}`
        : error?.message || "Không rõ nguyên nhân";
        
      setLogs(prev => {
        const newLogs = [...prev, { 
          content: `[ CẢNH BÁO HỆ THỐNG ]: ${errorMessage}`, 
          type: 'error', 
          timestamp: Date.now(),
          metadata: { usedKeyIndex: coreIndex }
        } as GameLog];
        // Save error state so user can refresh and still see the error and retry
        triggerAutoSave({ logs: newLogs, player: startPlayer, gameTime: startTime });
        return newLogs;
      });
    } finally { 
      setIsLoading(false); 
      setLoadingProgress(0);
      setLoadingStep('');
    }
  }, [logs, isLoading, selectedWorld, player, gameTime, formatGameTime, triggerAutoSave, settings]);

  const handleRegenerateImage = useCallback(async (logIndex: number) => {
    if (isLoading || !selectedWorld) return;
    
    const log = logs[logIndex];
    if (!log || log.type !== 'narrator') return;

    setIsLoading(true);
    setLoadingStep("Đang phác họa lại hình ảnh thực tại...");
    
    try {
      // Clean prompt: remove system metadata in brackets like [ KHỞI TẠO... ]
      const cleanDescription = log.content.replace(/\[\s*(?:KHỞI TẠO|GIẢI TRÌNH|HỆ THỐNG|THÔNG BÁO)[^\]]+\]/gi, '').trim();
      
      const styleConfig = getImageStyleKeywords(settings.imageStyle || 'Ảnh chụp');
      
      const imagePrompt = `A high quality ${styleConfig.keywords} ${styleConfig.type} for a text-based game. Scene description: ${cleanDescription}. Genre: ${selectedWorld?.genre || GameGenre.FREE_STYLE}. SFW, high detail, masterpiece. If any text appears in the image, it must be correctly spelled in Vietnamese and use clear, high-quality fonts. Strictly adhere to the ${settings.imageStyle} style. Negative prompt: nsfw, nude, naked, deformed, blurry, low quality, bad anatomy, extra limbs, text, watermark, ${styleConfig.negative || ''}`;
      
      const imgStartTime = Date.now();
      let imageUrl = await gameAI.generateImage(imagePrompt, settings);
      const imgDuration = ((Date.now() - imgStartTime) / 1000).toFixed(2);
      const imgModel = settings.imageModel || 'gemini-2.5-flash-image';
      const imageMetadata = { duration: imgDuration, model: imgModel, style: settings.imageStyle || 'Mặc định' };

      if (imageUrl && isBase64(imageUrl)) {
        try {
          const file = base64ToFile(imageUrl, `regen-${Date.now()}.png`);
          const uploadedUrl = await uploadImage(file, 'cloud');
          if (uploadedUrl) imageUrl = uploadedUrl;
        } catch (uploadErr) {
          console.warn("Regen image upload failed, keeping base64:", uploadErr);
        }
      }

      if (imageUrl) {
        const newLogs = logs.map((l, idx) => 
          idx === logIndex ? { ...l, imageUrl, imageMetadata } : l
        );
        
        setLogs(newLogs);

        // Add to global gallery
        setGallery(prev => [{ url: imageUrl, tags: ['Mô Tả Truyện'], genre: selectedWorld?.genre || GameGenre.FREE_STYLE }, ...prev]);

        triggerAutoSave({ logs: newLogs });
      }
    } catch (err: any) {
      console.error("Failed to regenerate image:", err);
      const errorLog: GameLog = {
        content: `GM: ${err.message || "Phác họa hình ảnh thất bại."}`,
        type: 'error',
        timestamp: Date.now()
      };
      setLogs([...logs, errorLog]);
    } finally {
      setIsLoading(false);
      setLoadingStep("");
    }
  }, [isLoading, selectedWorld, logs, settings, gameAI, triggerAutoSave]);

  // Fix: wrapped handleStartGame in useCallback to ensure stable reference for handleRetry
  const generateMatrixId = useCallback(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `matrix_${result}`;
  }, []);

  const handleStartGame = useCallback(async (scenarioText: string, overridePlayer?: Player, overrideWorld?: GameArchetype, overrideGameTime?: GameTime) => {
    const worldToUse = overrideWorld || selectedWorld;
    if (!worldToUse) return;
    
    const worldWithInstanceId = { ...worldToUse, instanceId: generateMatrixId() };
    setSelectedWorld(worldWithInstanceId);

    // Bắt buộc làm sạch gameplay trước khi AI chạy
    setIsLoading(true);
    setLoadingProgress(10);
    setLoadingStep('Khởi tạo thế giới...');
    
    // Hiển thị kịch bản khởi đầu trong terminal
    setLogs([{ content: `[ KHỞI TẠO THẾ GIỚI ]: ${scenarioText}`, type: 'system', timestamp: Date.now() }]); 
    setView('playing');
    
    // Use overrideGameTime if provided, otherwise zero placeholder
    const startTime: GameTime = overrideGameTime || { year: 0, month: 0, day: 0, hour: 0, minute: 0 };
    setGameTime(startTime);
    
    // Định dạng thời gian cho AI. Nếu là 0/0/0 thì dùng placeholder để AI tự quyết định
    const isTimeSet = startTime.year !== 0 || startTime.month !== 0 || startTime.day !== 0;
    const timeString = isTimeSet 
      ? `Ngày ${String(startTime.day).padStart(2, '0')}/${String(startTime.month).padStart(2, '0')}/${startTime.year} | ${String(startTime.hour).padStart(2, '0')}:${String(startTime.minute).padStart(2, '0')}`
      : "Ngày ??/??/???? | ??:??";

    // Ngẫu nhiên hóa một số thông tin cơ bản nếu người dùng chưa thiết lập
    // Use placeholders if user hasn't provided specific data
    const playerToUse = overridePlayer || player;
    const finalName = playerToUse.name !== '??' ? playerToUse.name : '??';
    const finalAge = playerToUse.age !== 0 ? playerToUse.age : 0;
    const finalGender = playerToUse.gender !== '??' ? playerToUse.gender : '??';

    let stats = { ...playerToUse.stats };
    const hasCustomStats = Object.values(stats).some(v => v !== 0);
    if (!hasCustomStats) {
      stats = { strength: 0, intelligence: 0, agility: 0, charisma: 0, luck: 0, soul: 0, merit: 0 };
    }

    const initialPlayer: Player = {
      ...playerToUse,
      health: 100,
      maxHealth: 100,
      level: 1,
      gold: playerToUse.gold,
      exp: 0,
      turnCount: 0,
      stats: stats,
      systemName: '',
      personality: playerToUse.personality || '??',
      currentLocation: 'Khởi đầu thực tại',
      assets: [],
      relationships: playerToUse.relationships || [],
      codex: [],
      quests: [],
      skills: [],
      inventory: [],
      nextNpcId: 1,
    };
    
    setPlayer(initialPlayer);
    setActiveNpcProfile(null);
    memoryService.setState({ 
      worldSummary: "Câu chuyện vừa bắt đầu.", 
      memories: [], 
      lastSummarizedTurn: 0 
    }); // Reset memory state

    // Save checkpoint for world creation (Turn 0)
    saveCheckpoint({
      player: initialPlayer,
      logs: [{ content: `[ KHỞI TẠO THẾ GIỚI ]: ${scenarioText}`, type: 'system', timestamp: Date.now() }],
      gameTime: startTime,
      selectedWorld: worldWithInstanceId,
      view: 'playing'
    });

    // Save initial state immediately so if AI fails or user refreshes, they are in the game
    triggerAutoSave({ 
      view: 'playing', 
      logs: [{ content: `[ KHỞI TẠO THẾ GIỚI ]: ${scenarioText}`, type: 'system', timestamp: Date.now() }], 
      player: initialPlayer, 
      gameTime: startTime,
      selectedWorld: worldWithInstanceId,
    });
    
    try {
      setLoadingProgress(40);
      setLoadingStep('Kiến tạo bối cảnh...');
      
      const perfStart = performance.now();
      
      setLoadingProgress(60);
      setLoadingStep('Kết nối Ma Trận AI...');
      
      const mcData = `
DỮ LIỆU NHÂN VẬT CHÍNH (MC) - NGƯỜI CHƠI ĐÃ THIẾT LẬP (BẮT BUỘC TUÂN THỦ 100%):
- Tên: ${initialPlayer.name}
- Tuổi: ${initialPlayer.age}
- Giới tính: ${initialPlayer.gender}
- Ngày sinh: ${initialPlayer.birthday}
- Danh hiệu: ${initialPlayer.title || 'Chưa có'}
${initialPlayer.backgroundAttributes?.map(attr => `- ${attr.label}: ${attr.value}`).join('\n') || ''}
- Tính cách: ${initialPlayer.personality}
- Chỉ số cơ bản: ${JSON.stringify(initialPlayer.stats)}
- Tài sản ban đầu: ${initialPlayer.gold} ${initialPlayer.customCurrency || 'Vàng'}
`;

      const startPrompt = `[ LỆNH KHỞI CHẠY VẬN MỆNH ]
Kịch bản bối cảnh: ${scenarioText}

${mcData}

YÊU CẦU TỐI CAO: AI phải tôn trọng TUYỆT ĐỐI và 100% dữ liệu nhân vật chính (MC) nêu trên. 
1. KHÔNG được tự ý thay đổi Tên, Tuổi, Giới tính, Tính cách hay bất kỳ thông tin cốt lõi nào người chơi đã nhập.
2. Sử dụng các thông tin này làm nền tảng để xây dựng nội dung dẫn truyện và các mối quan hệ ban đầu.
3. Nếu người chơi đã nhập dữ liệu cụ thể (không phải '??'), AI không được phép 'sáng tạo lại' các thông tin đó, trừ khi đó là các thuộc tính nền tảng cần sự mở rộng của AI.
4. AI CÓ TOÀN QUYỀN SÁNG TẠO và QUẢN LÝ các "Thuộc tính nền tảng" (backgroundAttributes) cho MC. AI có thể tự do thiết lập các thuộc tính như Gia Thế, Nghề Nghiệp, Huyết Mạch, Thiên Phú, hoặc bất kỳ thuộc tính nào khác phù hợp với bối cảnh câu chuyện để tăng tính hấp dẫn. Mỗi thuộc tính này PHẢI được đưa vào mảng "backgroundAttributes" với cấu trúc: { label: string, value: string, icon: string }. LƯU Ý QUAN TRỌNG: Tuyệt đối không tạo các nhãn (label) dư thừa hoặc trùng lặp với các thông tin đã có trong các trường khác (như Tiền mặt/Tài sản, Kỹ năng, Vật phẩm). Chỉ tạo thêm những thông tin thực sự cần thiết và chưa có.
5. Hãy bắt đầu câu chuyện ngay lập tức dựa trên kịch bản và nhân vật này.
6. BẮT BUỘC sử dụng các thực thể (NPCs, Địa danh, Vật phẩm) đã được cung cấp trong danh sách thực thể khởi tạo (nếu có) để làm phong phú thêm lời dẫn truyện ban đầu.
7. BẮT BUỘC khởi tạo 2 mục Codex Luật Lệ (category: 'rules') trong trường "newCodexEntries": "Những điều cần có" và "Những điều bị cấm" để thiết lập quy tắc cho thế giới mới này. Tuyệt đối không trình bày chúng trong lời dẫn truyện (text).`;

      let update: any;
      const narratorLogId = Date.now();

      if (settings.streamingEnabled) {
        setLoadingStep('Matrix...');
        
        const initialNarratorLog: GameLog = { 
          content: "Đang khởi tạo thực tại...", 
          type: 'narrator', 
          timestamp: narratorLogId,
          isStreaming: true,
          metadata: { duration: "...", usedKeyIndex: 0, usedModel: settings.aiModel }
        };
        setLogs(prev => [...prev, initialNarratorLog]);

        let streamedText = "";
        let finalData: any = null;

        const stream = gameAI.getResponseStream(
          startPrompt,
          [],
          initialPlayer,
          worldWithInstanceId.genre,
          false,
          worldWithInstanceId.systemInstruction,
          settings,
          0,
          timeString
        );

        for await (const chunk of stream) {
          if (chunk.type === 'text') {
            streamedText += chunk.content;
            setLogs(prev => prev.map(l => 
              l.timestamp === narratorLogId ? { ...l, content: streamedText } : l
            ));
          } else if (chunk.type === 'data') {
            finalData = chunk.content;
          }
        }

        if (!finalData) throw new Error("Không nhận được dữ liệu khởi tạo từ AI.");
        update = finalData;
      } else {
        update = await gameAI.getResponse(
          startPrompt,
          [],
          initialPlayer,
          worldWithInstanceId.genre,
          false,
          worldWithInstanceId.systemInstruction,
          settings,
          0,
          timeString
        );
      }
      
      setLoadingProgress(90);
      setLoadingStep('Đang nhận phản hồi...');
      
      const perfEnd = performance.now();
      const duration = ((perfEnd - perfStart) / 1000).toFixed(2);
      const usedKeyIndex = update.usedKeyIndex;
      const usedModel = update.usedModel;
      const usedProxy = update.usedProxy;
      
      const isProxy = !!usedProxy;
      const coreLabel = isProxy ? "PROXY_CORE" : `CORE_${usedKeyIndex}`;
      const modelLabel = usedModel ? ` | ${isProxy ? 'PROXY_MODEL' : 'MODEL'}: ${usedModel}` : "";
      const proxyLabel = usedProxy ? ` | GATEWAY: ${usedProxy}` : "";
      
      const newNpcCount = Array.isArray(update.newRelationships) ? update.newRelationships.length : 0;
      
      let updatedPlayer = { ...initialPlayer };

      // Update token usage
      const latestTokens = update.tokenUsage || 0;
      const totalTokens = (updatedPlayer.tokenUsage?.total || 0) + latestTokens;
      const oldHistory = updatedPlayer.tokenUsage?.history || [];
      const newHistory = [latestTokens, ...oldHistory].slice(0, 5);
      updatedPlayer.tokenUsage = {
        latest: latestTokens,
        total: totalTokens,
        history: newHistory
      };

      const narratorLog: GameLog = { 
        content: update.text + (update.evolutionJustification ? `\n\n[ GIẢI TRÌNH THAY ĐỔI ]: ${update.evolutionJustification}` : "") + `\n\n[ KHỞI TẠO THÀNH CÔNG | ${duration}s | ${coreLabel}${modelLabel}${proxyLabel} ]`, 
        type: 'narrator', 
        timestamp: settings.streamingEnabled ? narratorLogId : Date.now(), 
        suggestedActions: update.suggestedActions,
        metadata: { duration, usedKeyIndex, usedModel, usedProxy, newNpcCount }
      };
      // Giữ lại log khởi tạo và thêm log của AI
      if (settings.streamingEnabled) {
        setLogs(prev => prev.map(l => l.timestamp === narratorLogId ? narratorLog : l));
      } else {
        setLogs(prev => [...prev, narratorLog]);
      }
      
      // Add initial codex entries
      const initialCodexEntry: CodexEntry = {
        category: 'destiny',
        title: 'Khởi Chạy Vận Mệnh',
        content: `### Bối cảnh khởi đầu\n\n${scenarioText}\n\n### Dẫn nhập vận mệnh\n\n${update.text}`,
        unlocked: true,
        viewed: false
      };

      const genreEntry: CodexEntry = {
        category: 'world',
        title: `Hệ Thống Thế Giới: ${worldWithInstanceId.genre}`,
        content: `### Phân Loại Thực Tại\n\nThế giới này được vận hành theo quy luật: **${worldWithInstanceId.genre}**.\n\n### Đặc trưng thế giới\n\n${worldWithInstanceId.description}\n\n### Tính năng cốt lõi\n\n${worldWithInstanceId.features.map(f => `- ${f}`).join('\n')}\n\n### Quy tắc hệ thống\n\n${worldWithInstanceId.systemInstruction.split('\n').slice(0, 5).join('\n')}...`,
        unlocked: true,
        viewed: false
      };

      const basicRulesEntry: CodexEntry = {
        category: 'rules',
        title: 'Quy Tắc Thực Tại Cơ Bản',
        content: `### Các quy luật bất biến của ${worldWithInstanceId.genre}\n\n1. **Tính Nhất Quán**: Thế giới vận hành theo logic nội tại của thể loại ${worldWithInstanceId.genre}.\n2. **Nhân Quả**: Mọi hành động của bạn đều để lại dấu ấn và dẫn đến những hệ quả tương ứng.\n3. **Sự Tiến Hóa**: Thực tại không đứng yên, nó thay đổi dựa trên sự tương tác của bạn.\n\n### Đặc trưng thể loại\n${worldWithInstanceId.features.map(f => `- **${f}**: Quy tắc vận hành dựa trên yếu tố này.`).join('\n')}`,
        unlocked: true,
        viewed: false,
        isActive: true
      };

      updatedPlayer.codex = [initialCodexEntry, genreEntry, basicRulesEntry];

      if (update.newCodexEntry) {
        const entry = { ...update.newCodexEntry, viewed: false };
        const exists = updatedPlayer.codex.some(c => c.title === entry.title);
        if (!exists) updatedPlayer.codex.push(entry);
      }

      if (Array.isArray(update.newCodexEntries)) {
        update.newCodexEntries.forEach(entry => {
          const entryWithViewed = { ...entry, viewed: false };
          const exists = updatedPlayer.codex.some(c => c.title === entryWithViewed.title);
          if (!exists) updatedPlayer.codex.push(entryWithViewed);
        });
      }

      if (update.statsUpdates) {
        const s = update.statsUpdates;
        const canUpdate = (field: string, newVal: any, oldVal: any) => {
          if (newVal === undefined || newVal === null) return false;
          if (updatedPlayer.lockedFields?.includes(field)) return false;
          if (isValidValue(oldVal) && !isValidValue(newVal)) return false;
          return newVal !== oldVal;
        };

        if (canUpdate('name', s.name, updatedPlayer.name)) updatedPlayer.name = s.name!;
        if (canUpdate('title', s.title, updatedPlayer.title)) updatedPlayer.title = s.title;
        if (canUpdate('currentLocation', s.currentLocation, updatedPlayer.currentLocation)) updatedPlayer.currentLocation = s.currentLocation;
        if (canUpdate('systemName', s.systemName, updatedPlayer.systemName)) updatedPlayer.systemName = s.systemName;
        if (canUpdate('personality', s.personality, updatedPlayer.personality)) updatedPlayer.personality = s.personality;
        if (canUpdate('gender', s.gender, updatedPlayer.gender)) updatedPlayer.gender = s.gender;
        if (canUpdate('age', s.age, updatedPlayer.age)) updatedPlayer.age = s.age;
        if (canUpdate('birthday', s.birthday, updatedPlayer.birthday)) updatedPlayer.birthday = s.birthday;
        if (canUpdate('avatar', s.avatar, updatedPlayer.avatar)) updatedPlayer.avatar = s.avatar;
        
        if (s.customCurrency && !updatedPlayer.lockedFields?.includes('customCurrency')) updatedPlayer.customCurrency = s.customCurrency;
        if (s.statLabels && !updatedPlayer.lockedFields?.includes('statLabels')) updatedPlayer.statLabels = { ...updatedPlayer.statLabels, ...s.statLabels };
        
        if (Array.isArray(s.customFields) && !updatedPlayer.lockedFields?.includes('customFields')) {
          const mergedCustomFields = [...updatedPlayer.customFields];
          s.customFields.forEach(newField => {
            if (!newField || !newField.label) return;
            const existingIdx = mergedCustomFields.findIndex(f => f.label === newField.label);
            if (existingIdx > -1) {
              const oldVal = mergedCustomFields[existingIdx].value;
              if (isValidValue(newField.value) || !isValidValue(oldVal)) {
                mergedCustomFields[existingIdx] = { ...mergedCustomFields[existingIdx], ...newField };
              }
            } else if (isValidValue(newField.value)) {
              mergedCustomFields.push(newField);
            }
          });
          updatedPlayer.customFields = mergedCustomFields;
        }
        if (s.health !== undefined && !updatedPlayer.lockedFields?.includes('health')) updatedPlayer.health = s.health;
        if (s.maxHealth !== undefined && !updatedPlayer.lockedFields?.includes('maxHealth')) updatedPlayer.maxHealth = s.maxHealth;
        if (s.gold !== undefined && !updatedPlayer.lockedFields?.includes('gold')) updatedPlayer.gold = s.gold;
        if (s.level !== undefined && !updatedPlayer.lockedFields?.includes('level')) updatedPlayer.level = s.level;
        if (s.exp !== undefined && !updatedPlayer.lockedFields?.includes('exp')) updatedPlayer.exp = s.exp;
        
        if (Array.isArray(s.inventory) && !updatedPlayer.lockedFields?.includes('inventory')) updatedPlayer.inventory = normalizeObjectArray(s.inventory);
        if (Array.isArray(s.skills) && !updatedPlayer.lockedFields?.includes('skills')) updatedPlayer.skills = normalizeObjectArray(s.skills);
        if (Array.isArray(s.assets) && !updatedPlayer.lockedFields?.includes('assets')) updatedPlayer.assets = normalizeObjectArray(s.assets);
        if (Array.isArray(s.identities) && !updatedPlayer.lockedFields?.includes('identities')) updatedPlayer.identities = s.identities;

        if (s.stats) {
          Object.entries(s.stats).forEach(([statKey, statVal]) => {
            if (!updatedPlayer.lockedFields?.includes(`stat_${statKey}`)) {
              (updatedPlayer.stats as any)[statKey] = statVal;
            }
          });
        }
      }
      if (update.currentLocation && !updatedPlayer.lockedFields?.includes('currentLocation')) updatedPlayer.currentLocation = update.currentLocation;
      
      if (Array.isArray(update.questUpdates) && !updatedPlayer.lockedFields?.includes('quests')) {
        updatedPlayer.quests = update.questUpdates;
      }
      
      if (Array.isArray(update.newRelationships)) {
        const mergedRelationships = [...updatedPlayer.relationships];
        update.newRelationships.forEach(newNpc => {
          const existingIdx = mergedRelationships.findIndex(r => r.id === newNpc.id || r.name === newNpc.name);
          if (existingIdx >= 0) {
            mergedRelationships[existingIdx] = mergeNpcData(mergedRelationships[existingIdx], newNpc, update.text, update.newTime?.year || startTime.year, update.evolutionJustification);
          } else {
            const npcWithId = { ...newNpc, id: newNpc.id || `npc_${String(updatedPlayer.nextNpcId++).padStart(6, '0')}` };
            mergedRelationships.push(compensateNpcData({ ...npcWithId, isPresent: true, viewed: false }, update.newTime?.year || startTime.year));
          }
        });
        updatedPlayer.relationships = mergedRelationships;
      }
      
      // Final time sync from AI's first response
      const finalTime = update.newTime || startTime;
      if (update.newTime) {
        setGameTime(update.newTime);
      }
      
      setPlayer(updatedPlayer);
      memoryService.updateMemory([narratorLog], 0);
      triggerAutoSave({ 
        view: 'playing', 
        logs: [narratorLog], 
        player: updatedPlayer, 
        gameTime: finalTime,
        selectedWorld: worldWithInstanceId,
      });
      
      setLoadingProgress(100);
      setLoadingStep('Đồng bộ thực tại...');
    } catch (error: any) {
      console.error("Game Start Error:", error);
      const coreIndex = error?.usedKeyIndex;
      const coreInfo = coreIndex && coreIndex > 0 ? ` (Core #${coreIndex})` : "";
      
      const errorMessage = error?.message?.includes("API_KEY_INVALID") 
        ? `API Key${coreInfo} không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại Ma Trận API.`
        : error?.message?.includes("quota")
        ? `Hết hạn mức API${coreInfo} (Rate Limit). Nguyên nhân: Bạn đang dùng Key miễn phí (giới hạn 15 lượt/phút) hoặc AI đang tạo ảnh song song. Hãy đợi 1 phút rồi thử lại, hoặc tắt 'Tự động tạo ảnh' trong Cài đặt.`
        : error?.message?.includes("SAFETY_BLOCK")
        ? `[BỘ LỌC AN TOÀN]: ${error.message.split(": ")[1] || "Nội dung bị chặn do quá nhạy cảm."}`
        : error?.message?.includes("PARSE_ERROR")
        ? `[LỖI DỮ LIỆU]: ${error.message.split(": ")[1] || "Lỗi phân tích lượng tử."}`
        : error?.message || "Không rõ nguyên nhân";
        
      setLogs([{ 
        content: `[ CẢNH BÁO HỆ THỐNG ]: ${errorMessage}`, 
        type: 'error', 
        timestamp: Date.now(),
        metadata: { usedKeyIndex: coreIndex }
      }]);
      // Save error state
      triggerAutoSave({ 
        logs: [{ 
          content: `[ CẢNH BÁO HỆ THỐNG ]: ${errorMessage}`, 
          type: 'error', 
          timestamp: Date.now(),
          metadata: { usedKeyIndex: coreIndex }
        }], 
        view: 'playing', 
        player: initialPlayer, 
        selectedWorld: worldWithInstanceId 
      });
    } finally { 
      setIsLoading(false); 
      setLoadingProgress(0);
      setLoadingStep('');
    }
  }, [selectedWorld, player, formatGameTime, settings, triggerAutoSave]);

  const handleExit = useCallback(() => {
    setSelectedWorld(null);
    setSelectedContext(null);
    setLogs([]);
    setView('landing');
  }, [setView]);

  const handleBack = useCallback(() => {
    const flow: ViewState[] = ['landing', 'world-select', 'context-select', 'scenario-select', 'playing'];
    const currentIdx = flow.indexOf(view);
    
    if (view === 'fanfic-select') {
      setView('landing');
    } else if (view === 'scenario-select' && selectedWorld?.id === 'free_style_mode') {
      setView('landing');
    } else if (currentIdx > 0) {
      setView(flow[currentIdx - 1]);
    } else {
      setView('landing');
    }
  }, [view, setView, selectedWorld]);

  const markAsViewed = useCallback((id: string, type: 'codex' | 'npc') => {
    setPlayer(prev => {
      if (type === 'codex') {
        const exists = prev.codex.find(c => c.title === id);
        if (!exists || exists.viewed) return prev;
        return {
          ...prev,
          codex: prev.codex.map(c => c.title === id ? { ...c, viewed: true } : c)
        };
      } else {
        const exists = prev.relationships.find(r => r.id === id);
        if (!exists || exists.viewed) return prev;
        return {
          ...prev,
          relationships: prev.relationships.map(r => r.id === id ? { ...r, viewed: true } : r)
        };
      }
    });
  }, []);

  const handleManualSave = useCallback(async () => {
    if (!selectedWorld) {
      addToast("Hệ thống chưa xác định được thế giới hiện tại. Không thể phong ấn!", "error");
      return;
    }
    
    setIsSaving(true);
    try {
      const dataToSave = { 
        player, 
        logs, 
        gameTime, 
        selectedWorld, 
        selectedContext, 
        settings, 
        view,
        memory: memoryService.getState()
      };
      
      const slotId = `manual_${selectedWorld.id}`;
      
      await dbService.save(dataToSave, slotId);
      
      // Download to machine
      const metadata = {
        playerName: player.name,
        level: player.level,
        timestamp: Date.now(),
        genre: selectedWorld?.genre || GameGenre.FREE_STYLE,
        worldId: selectedWorld.id,
        turnCount: player.turnCount,
        avatar: player.avatar
      };
      const blob = new Blob([JSON.stringify({ ...dataToSave, metadata }, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const worldName = (selectedWorld.title || 'UnknownWorld').replace(/\s+/g, '_');
      const playerName = (player.name || 'Unknown').replace(/\s+/g, '_');
      a.download = `Matrix_${worldName}_${playerName}_Turn${player.turnCount}.json`;
      a.click();
      URL.revokeObjectURL(url);

      addToast("Đã phong ấn thực tại thành công!", "success");
    } catch (err) {
      console.error("Manual Save Error:", err);
      addToast("Lỗi phong ấn thực tại: " + (err instanceof Error ? err.message : String(err)), "error");
    } finally {
      setIsSaving(false);
    }
  }, [player, logs, gameTime, selectedWorld, selectedContext, settings, view, addToast]);

  const handleStartFanficGame = useCallback(async (work: FanficWork, mc: FanficCharacter, npcs: FanficCharacter[], customPrompt: string) => {
    // 1. Reset state to ensure no data carryover
    const freshPlayer = JSON.parse(JSON.stringify(INITIAL_PLAYER_STATE));
    const basePlayer = {
      ...freshPlayer
    };

    // 2. Setup the Fanfic Archetype
    const fanficArchetype: GameArchetype = {
      ...FANFIC_ARCHETYPE,
      id: `fanfic_${work.id}`,
      instanceId: generateMatrixId(),
      title: `${FANFIC_ARCHETYPE.title}: ${work.title}`,
      description: `${work.description}\n\n${FANFIC_ARCHETYPE.description}`,
      systemInstruction: `${FANFIC_ARCHETYPE.systemInstruction}\n\nTÁC PHẨM GỐC: ${work.title}\nBỐI CẢNH: ${work.description}\n\nNHÂN VẬT CHÍNH (MC): ${mc.name} (${mc.role})\n- Giới tính: ${mc.gender || '??'}\n- Tuổi: ${mc.age || '??'}\n\nDANH SÁCH NHÂN VẬT ĐÃ CÓ (NPCs - TUYỆT ĐỐI KHÔNG TẠO TRÙNG LẶP):\n${npcs.map(n => `- ${n.name} (ID: ${n.id}, Vai trò: ${n.role}, Giới tính: ${n.gender || '??'}, Tuổi: ${n.age || '??'})`).join('\n')}\n\nLƯU Ý QUAN TRỌNG VỀ ID & DỮ LIỆU NHÂN VẬT:\n1. Nếu bất kỳ nhân vật nào trong danh sách trên xuất hiện, bạn BẮT BUỘC phải sử dụng đúng ID đã được cung cấp ở trên. Tuyệt đối không tự tạo ID mới cho các nhân vật này.\n2. Nếu bạn tạo thêm NPC mới từ nguyên tác (những nhân vật chưa có trong danh sách trên), bạn BẮT BUỘC phải tìm hiểu kỹ về nguyên tác để cung cấp đúng Giới tính và Tuổi của họ. Gán cho họ một ID mới duy nhất theo định dạng npc_xxxxxx.\n3. Tuyệt đối không tạo các NPC "clone" hoặc bản sao của các nhân vật đã có.\n4. Mọi thông tin về nhân vật nguyên tác phải bám sát tác phẩm gốc nhất có thể.${player.loreLibrary && player.loreLibrary.length > 0 ? `\n\nTHƯ VIỆN TƯ LIỆU GỐC (Sử dụng các URL này làm nguồn tham khảo chính xác nhất cho nguyên tác):\n${player.loreLibrary.map(s => `- ${s.name} (${s.type}): ${s.url}`).join('\n')}` : ''}`
    };

    setSelectedWorld(fanficArchetype);
    setIsLoading(true);
    
    setLogs([]);
    
    setView('playing');

    memoryService.setState({ 
      worldSummary: "Câu chuyện vừa bắt đầu.", 
      memories: [], 
      lastSummarizedTurn: 0 
    }); // Reset memory state

    const startTime: GameTime = { year: 0, month: 0, day: 0, hour: 0, minute: 0 };
    setGameTime(startTime);

    // 3. Initialize Player with Fanfic data or placeholders
    const updatedPlayer: Player = {
      ...basePlayer,
      name: mc.name || '??',
      avatar: '',
      gender: mc.gender || '??', 
      age: mc.age || 0,
      health: 100,
      maxHealth: 100,
      level: 1,
      gold: 0,
      exp: 0,
      stats: { strength: 0, intelligence: 0, agility: 0, charisma: 0, luck: 0, soul: 0, merit: 0 },
      lineage: mc.role || '??',
      personality: mc.description || '??',
      currentLocation: work.title,
      turnCount: 0,
      systemName: '',
      assets: [],
      skills: [],
      inventory: [],
      codex: [],
      quests: [],
      nextNpcId: 1,
      relationships: [] // Start with empty relationships, AI will add them dynamically
    };

    const scenarioText = `Bắt đầu hành trình Đồng Nhân trong thế giới ${work.title}.\nNhân vật: ${mc.name}, giới tính ${updatedPlayer.gender}.\nBối cảnh: ${customPrompt || 'Theo dòng thời gian nguyên tác.'}\n\nYÊU CẦU:\n1. Khởi tạo 2 mục Codex Luật Lệ (category: 'rules') trong trường "newCodexEntries": "Những điều cần có" và "Những điều bị cấm" cho thế giới này. Tuyệt đối không trình bày chúng trong lời dẫn truyện (text).\n2. Tuyệt đối không tạo các nhãn (label) dư thừa hoặc trùng lặp với các thông tin đã có trong các trường khác (như Tiền mặt/Tài sản, Kỹ năng, Vật phẩm). Chỉ tạo thêm những thông tin thực sự cần thiết và chưa có.`;
    
    // Save checkpoint for fanfic creation
    saveCheckpoint({
      player: updatedPlayer,
      logs: [{ content: `[ KHỞI TẠO ĐỒNG NHÂN ]: ${scenarioText}`, type: 'system', timestamp: Date.now() }],
      gameTime: startTime,
      selectedWorld: fanficArchetype,
      view: 'playing'
    });

    // Hiển thị kịch bản khởi đầu trong terminal
    setLogs([{ content: `[ KHỞI TẠO ĐỒNG NHÂN ]: ${scenarioText}`, type: 'system', timestamp: Date.now() }]);

    // Save initial state immediately
    triggerAutoSave({ 
      view: 'playing', 
      logs: [{ content: `[ KHỞI TẠO ĐỒNG NHÂN ]: ${scenarioText}`, type: 'system', timestamp: Date.now() }], 
      player: updatedPlayer, 
      gameTime: startTime,
      selectedWorld: fanficArchetype,
    });

    const startTimePerf = performance.now();
    try {
      const update = await gameAI.getResponse(
        scenarioText,
        [],
        updatedPlayer,
        fanficArchetype.genre,
        true,
        fanficArchetype.systemInstruction,
        settings,
        updatedPlayer.relationships.length,
        "Ngày ??/??/???? | ??:??"
      );

      const endTimePerf = performance.now();
      const duration = ((endTimePerf - startTimePerf) / 1000).toFixed(2);
      const usedKeyIndex = update.usedKeyIndex;
      const usedModel = update.usedModel;
      const usedProxy = update.usedProxy;
      
      const isProxy = !!usedProxy;
      const coreLabel = isProxy ? "PROXY_CORE" : `CORE_${usedKeyIndex}`;
      const modelLabel = usedModel ? ` | ${isProxy ? 'PROXY_MODEL' : 'MODEL'}: ${usedModel}` : "";
      const proxyLabel = usedProxy ? ` | GATEWAY: ${usedProxy}` : "";
      
      const justification = update.evolutionJustification;

      // Update token usage
      const latestTokens = update.tokenUsage || 0;
      const totalTokens = (updatedPlayer.tokenUsage?.total || 0) + latestTokens;
      const oldHistory = updatedPlayer.tokenUsage?.history || [];
      const newHistory = [latestTokens, ...oldHistory].slice(0, 5);
      updatedPlayer.tokenUsage = {
        latest: latestTokens,
        total: totalTokens,
        history: newHistory
      };

      let finalNarratorText = update.text;
      if (justification) {
        finalNarratorText += `\n\n[ GIẢI TRÌNH THAY ĐỔI ]: ${justification}`;
      }
      const wordCount = (update.text || "").trim().split(/\s+/).filter(Boolean).length;
      finalNarratorText += `\n\n[ KHỞI TẠO ĐỒNG NHÂN THÀNH CÔNG | ${duration}s | ${wordCount} CHỮ | ${coreLabel}${modelLabel}${proxyLabel} ]`;

      const narratorLog: GameLog = {
        content: finalNarratorText,
        type: 'narrator',
        timestamp: Date.now(),
        suggestedActions: update.suggestedActions,
        metadata: { duration, usedKeyIndex, usedModel, usedProxy }
      };

      setLogs(prev => [...prev, narratorLog]);
      
      if (update.statsUpdates) {
        const s = update.statsUpdates;
        const canUpdate = (field: string, newVal: any, oldVal: any) => {
          if (newVal === undefined || newVal === null) return false;
          if (updatedPlayer.lockedFields?.includes(field)) return false;
          if (isValidValue(oldVal) && !isValidValue(newVal)) return false;
          return newVal !== oldVal;
        };

        if (canUpdate('name', s.name, updatedPlayer.name)) updatedPlayer.name = s.name!;
        if (canUpdate('title', s.title, updatedPlayer.title)) updatedPlayer.title = s.title;
        if (canUpdate('currentLocation', s.currentLocation, updatedPlayer.currentLocation)) updatedPlayer.currentLocation = s.currentLocation;
        if (canUpdate('systemName', s.systemName, updatedPlayer.systemName)) updatedPlayer.systemName = s.systemName;
        if (canUpdate('personality', s.personality, updatedPlayer.personality)) updatedPlayer.personality = s.personality;
        if (canUpdate('gender', s.gender, updatedPlayer.gender)) updatedPlayer.gender = s.gender;
        if (canUpdate('age', s.age, updatedPlayer.age)) updatedPlayer.age = s.age;
        if (canUpdate('birthday', s.birthday, updatedPlayer.birthday)) updatedPlayer.birthday = s.birthday;
        if (canUpdate('avatar', s.avatar, updatedPlayer.avatar)) updatedPlayer.avatar = s.avatar;
        
        if (s.customCurrency && !updatedPlayer.lockedFields?.includes('customCurrency')) updatedPlayer.customCurrency = s.customCurrency;
        if (s.statLabels && !updatedPlayer.lockedFields?.includes('statLabels')) updatedPlayer.statLabels = { ...updatedPlayer.statLabels, ...s.statLabels };
        
        if (Array.isArray(s.customFields) && !updatedPlayer.lockedFields?.includes('customFields')) {
          const mergedCustomFields = [...updatedPlayer.customFields];
          s.customFields.forEach(newField => {
            if (!newField || !newField.label) return;
            const existingIdx = mergedCustomFields.findIndex(f => f.label === newField.label);
            if (existingIdx > -1) {
              const oldVal = mergedCustomFields[existingIdx].value;
              if (isValidValue(newField.value) || !isValidValue(oldVal)) {
                mergedCustomFields[existingIdx] = { ...mergedCustomFields[existingIdx], ...newField };
              }
            } else if (isValidValue(newField.value)) {
              mergedCustomFields.push(newField);
            }
          });
          updatedPlayer.customFields = mergedCustomFields;
        }
        if (s.health !== undefined && !updatedPlayer.lockedFields?.includes('health')) updatedPlayer.health = s.health;
        if (s.maxHealth !== undefined && !updatedPlayer.lockedFields?.includes('maxHealth')) updatedPlayer.maxHealth = s.maxHealth;
        if (s.gold !== undefined && !updatedPlayer.lockedFields?.includes('gold')) updatedPlayer.gold = s.gold;
        if (s.level !== undefined && !updatedPlayer.lockedFields?.includes('level')) updatedPlayer.level = s.level;
        if (s.exp !== undefined && !updatedPlayer.lockedFields?.includes('exp')) updatedPlayer.exp = s.exp;
        
        if (Array.isArray(s.inventory) && !updatedPlayer.lockedFields?.includes('inventory')) updatedPlayer.inventory = normalizeObjectArray(s.inventory);
        if (Array.isArray(s.skills) && !updatedPlayer.lockedFields?.includes('skills')) updatedPlayer.skills = normalizeObjectArray(s.skills);
        if (Array.isArray(s.assets) && !updatedPlayer.lockedFields?.includes('assets')) updatedPlayer.assets = normalizeObjectArray(s.assets);
        if (Array.isArray(s.identities) && !updatedPlayer.lockedFields?.includes('identities')) updatedPlayer.identities = s.identities;

        if (s.stats) {
          Object.entries(s.stats).forEach(([statKey, statVal]) => {
            if (!updatedPlayer.lockedFields?.includes(`stat_${statKey}`)) {
              (updatedPlayer.stats as any)[statKey] = statVal;
            }
          });
        }
      }
      if (update.currentLocation && !updatedPlayer.lockedFields?.includes('currentLocation')) updatedPlayer.currentLocation = update.currentLocation;

      const finalTime = update.newTime || startTime;
      if (update.newTime) {
        setGameTime(update.newTime);
      }

      if (Array.isArray(update.newRelationships)) {
        updatedPlayer.relationships = update.newRelationships.map(r => {
          const npcWithId = { ...r, id: `npc_${String(updatedPlayer.nextNpcId++).padStart(6, '0')}` };
          return compensateNpcData({ ...npcWithId, isPresent: true, viewed: false }, update.newTime?.year || 0);
        });
      }

      if (Array.isArray(update.questUpdates)) {
        updatedPlayer.quests = update.questUpdates;
      }

      const initialCodexEntry: CodexEntry = {
        category: 'destiny',
        title: 'Vận Mệnh Đồng Nhân',
        content: `### Tác phẩm: ${work.title}\n\n${scenarioText}\n\n### Dẫn nhập\n\n${update.text}`,
        unlocked: true,
        viewed: false
      };

      const genreEntry: CodexEntry = {
        category: 'destiny',
        title: `Hệ Thống Thế Giới: ${fanficArchetype.genre}`,
        content: `### Phân Loại Thực Tại\n\nThế giới này được vận hành theo quy luật: **${fanficArchetype.genre}**.\n\n### Đặc trưng thế giới\n\n${fanficArchetype.description}\n\n### Quy tắc hệ thống\n\n${fanficArchetype.systemInstruction.split('\n').slice(0, 5).join('\n')}...`,
        unlocked: true,
        viewed: false
      };

      updatedPlayer.codex = [initialCodexEntry, genreEntry];

      if (update.newCodexEntry) {
        const entry = { ...update.newCodexEntry, viewed: false };
        const exists = updatedPlayer.codex.some(c => c.title === entry.title);
        if (!exists) updatedPlayer.codex.push(entry);
      }

      if (Array.isArray(update.newCodexEntries)) {
        update.newCodexEntries.forEach(entry => {
          const entryWithViewed = { ...entry, viewed: false };
          const exists = updatedPlayer.codex.some(c => c.title === entryWithViewed.title);
          if (!exists) updatedPlayer.codex.push(entryWithViewed);
        });
      }

      setPlayer(updatedPlayer);
      triggerAutoSave({ 
        view: 'playing', 
        logs: [narratorLog], 
        player: updatedPlayer, 
        gameTime: finalTime,
        selectedWorld: fanficArchetype,
      });
    } catch (error: any) {
      console.error("Fanfic start failed:", error);
      const errorMessage = error?.message || "Không rõ nguyên nhân";
      const errorLogs: GameLog[] = [{ 
        content: `[ LỖI KHỞI TẠO ]: Lỗi khởi tạo thế giới Đồng Nhân: ${errorMessage}. Vui lòng kiểm tra lại cấu hình hoặc thử lại.`, 
        type: 'narrator', 
        timestamp: Date.now() 
      }];
      setLogs(errorLogs);
      // Save error state
      triggerAutoSave({ logs: errorLogs, view: 'playing', player: updatedPlayer, selectedWorld: fanficArchetype });
    } finally {
      setIsLoading(false);
    }
  }, [player, settings, triggerAutoSave, formatGameTime]);

  const toggleLock = useCallback((field: string) => {
    setPlayer(prev => {
      const currentLocks = prev.lockedFields || [];
      const isLocked = currentLocks.includes(field);
      const nextLocks = isLocked 
        ? currentLocks.filter(f => f !== field)
        : [...currentLocks, field];
      return { ...prev, lockedFields: nextLocks };
    });
  }, []);

  const resetPlayer = useCallback(() => {
    const freshPlayer = JSON.parse(JSON.stringify(INITIAL_PLAYER_STATE));
    setPlayer(freshPlayer);
    setLogs([]);
    setGameTime({ year: 0, month: 0, day: 0, hour: 0, minute: 0 });
    setSelectedWorld(null);
    setSelectedContext(null);
    memoryService.setState({ 
      worldSummary: "Câu chuyện vừa bắt đầu.", 
      memories: [], 
      lastSummarizedTurn: 0 
    }); // Reset memory state
  }, []);

  const handleStartNewGameFlow = useCallback(() => {
    resetPlayer();
    setView('world-select');
  }, [resetPlayer]);

  const handleStartFreeStyle = useCallback(() => {
    resetPlayer();
    const world = { ...FREE_STYLE_ARCHETYPE, instanceId: generateMatrixId() };
    setSelectedWorld(world);
    setSelectedContext(FREE_STYLE_ARCHETYPE.subScenarios[0]);
    setView('scenario-select');
  }, [resetPlayer, generateMatrixId]);

  const handleStartWorldCreation = useCallback(() => {
    resetPlayer();
    setView('world-creation');
  }, [resetPlayer]);

  const handleStartImportedWorld = useCallback(async (worldData: any) => {
    setModals(prev => ({ ...prev, importWorld: false }));
    resetPlayer();
    
    const worldWithInstanceId = { 
      ...FREE_STYLE_ARCHETYPE, 
      instanceId: generateMatrixId(),
      title: worldData.title || 'Thế giới nhập khẩu',
      description: worldData.description || 'Thế giới được tạo từ ảnh hoặc card.'
    };

    const initialPlayer: Player = {
      ...INITIAL_PLAYER_STATE,
      name: worldData.player?.name || INITIAL_PLAYER_STATE.name,
      personality: worldData.player?.personality || INITIAL_PLAYER_STATE.personality,
      background: worldData.player?.background || INITIAL_PLAYER_STATE.background,
      relationships: worldData.npcs?.map((npc: any, index: number) => ({
        id: `npc_imported_${index}`,
        name: npc.name,
        personality: npc.personality,
        description: npc.description,
        isPresent: true,
        viewed: false,
        closeness: 10,
        trust: 10,
        affection: 0,
        lust: 0,
        status: 'Bình thường',
        history: [],
        conditions: [],
        memory: []
      })) || []
    };

    setSelectedWorld(worldWithInstanceId);
    setSelectedContext(worldWithInstanceId.subScenarios[0]);
    
    // Start the game with the imported scenario
    await handleStartGame(worldData.scenario, initialPlayer, worldWithInstanceId);
  }, [resetPlayer, generateMatrixId, handleStartGame, setModals]);

  const handleStartWorldGame = useCallback((worldData: WorldData) => {
    console.log("useGameLogic: handleStartWorldGame called", worldData);
    
    // Đồng bộ thiết lập từ World Creation vào App Settings
    if (worldData.config) {
      setSettings(prev => ({
        ...prev,
        difficulty: (worldData.config.difficulty as any) || prev.difficulty,
        narrativePerspective: (worldData.config.narrativePerspective as any) || prev.narrativePerspective
      }));
    }

    // Chuẩn bị danh sách thực thể để AI biết
    const npcsText = worldData.entities.npcs.map(n => `- ${n.name}${n.personality ? `: ${n.personality}` : ''}`).join('\n');
    const locationsText = worldData.entities.locations.map(l => `- ${l.name}${l.description ? `: ${l.description}` : ''}`).join('\n');
    const itemsText = worldData.entities.items.map(i => `- ${i.name}${i.description ? `: ${i.description}` : ''}`).join('\n');

    const entityContext = `
DANH SÁCH THỰC THỂ KHỞI TẠO (BẮT BUỘC TUÂN THỦ):
NPCs:
${npcsText || 'Chưa có'}

ĐỊA DANH:
${locationsText || 'Chưa có'}

VẬT PHẨM:
${itemsText || 'Chưa có'}
    `;

    const archetype: GameArchetype = {
      id: worldData.id || `world-${Date.now()}`,
      title: worldData.world.worldName,
      genre: worldData.world.genre,
      description: worldData.world.description,
      features: worldData.world.rules,
      systemInstruction: `Bạn là GM của thế giới ${worldData.world.worldName}. Thể loại: ${worldData.world.genre}. Bối cảnh: ${worldData.world.era}. Quy tắc: ${worldData.world.rules.join(', ')}.\n${entityContext}`,
      defaultMcNames: [worldData.player.name],
      subScenarios: [
        {
          id: 'start',
          title: 'Khởi đầu',
          description: `Bối cảnh: ${worldData.world.era} - ${worldData.world.time}`,
          scenarios: [worldData.world.initialScenario || worldData.world.description]
        }
      ]
    };
    
    setSelectedWorld(archetype);
    setSelectedContext(archetype.subScenarios[0]);
    setGameTime(worldData.gameTime);
    
    const scenario = worldData.world.initialScenario || worldData.world.description;
    console.log("useGameLogic: Triggering handleStartGame with scenario", scenario);
    
    // Gọi handleStartGame với dữ liệu ghi đè để tránh race condition với state
    handleStartGame(scenario, worldData.player, archetype, worldData.gameTime);
  }, [handleStartGame]);

  const handleRetry = useCallback(async () => {
    if (isLoading) return;

    // Use checkpoint state if available (this is the state BEFORE the failed action)
    if (checkpointState) {
      const { player: cpPlayer, logs: cpLogs, gameTime: cpTime, memory: cpMemory, selectedWorld: cpWorld, selectedContext: cpContext, view: cpView } = checkpointState;
      
      // Restore state
      setPlayer(cpPlayer);
      setLogs(cpLogs);
      setGameTime(cpTime);
      memoryService.setState(cpMemory);
      setSelectedWorld(cpWorld);
      setSelectedContext(cpContext);
      setView(cpView);

      // If it was a command retry
      if (lastAction) {
        await handleCommand(lastAction.command, lastAction.timeCost, { 
          player: cpPlayer, 
          logs: cpLogs, 
          gameTime: cpTime, 
          memory: cpMemory 
        });
      } else if (cpLogs.length > 0) {
        // If it was a world creation retry (logs will contain [ KHỞI TẠO ... ])
        const firstLog = cpLogs[0].content;
        if (firstLog.includes('[ KHỞI TẠO THẾ GIỚI ]')) {
          const scenario = firstLog.replace('[ KHỞI TẠO THẾ GIỚI ]: ', '');
          await handleStartGame(scenario, cpPlayer, cpWorld);
        } else if (firstLog.includes('[ KHỞI TẠO ĐỒNG NHÂN ]')) {
          const scenario = firstLog.replace('[ KHỞI TẠO ĐỒNG NHÂN ]: ', '');
          await handleStartGame(scenario, cpPlayer, cpWorld);
        }
      }
    } else if (lastAction && lastGameState) {
      // Fallback to old retry logic if checkpoint is missing
      memoryService.setState(lastGameState.memory);
      await handleCommand(lastAction.command, lastAction.timeCost, lastGameState);
    }
  }, [lastAction, isLoading, handleCommand, lastGameState, checkpointState, handleStartGame]);

  return {
    view, setView,
    handleStartNewGameFlow,
    handleStartFreeStyle,
    handleStartWorldCreation,
    handleStartImportedWorld,
    handleStartWorldGame,
    resetPlayer,
    selectedWorld, setSelectedWorld, selectedContext, setSelectedContext,
    logs, setLogs, isLoading, loadingProgress, loadingStep, isSavingStatus, isBackupSaving,
    gameTime, setGameTime, formatGameTime, modals, setModals, player, setPlayer,
    activeNpcProfile, setActiveNpcProfile, handleCommand, handleStartGame, handleBack, handleExit,
    triggerAutoSave, settings, setSettings, loadSaveData,
    handleStartFanficGame, handleRetry, lastAction,
    handleRetryMemory, handleSkipMemory,
    updateSettings: (s: Partial<AppSettings>) => {
      setSettings(prev => ({ ...prev, ...s, updatedAt: Date.now() }));

      if (s.isFullscreen !== undefined && s.isFullscreen !== settings.isFullscreen) {
        if (s.isFullscreen) {
          const docEl = document.documentElement as any;
          const requestFs = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.mozRequestFullScreen || docEl.msRequestFullscreen;
          if (requestFs) {
            requestFs.call(docEl).catch((err: any) => {
              console.error("Fullscreen request failed:", err);
              setSettings(prev => ({ ...prev, isFullscreen: false, updatedAt: Date.now() }));
            });
          } else {
            console.warn("Fullscreen API not supported");
            setSettings(prev => ({ ...prev, isFullscreen: false, updatedAt: Date.now() }));
          }
        } else if (document.fullscreenElement || (document as any).webkitFullscreenElement || (document as any).mozFullScreenElement || (document as any).msFullscreenElement) {
          const exitFs = document.exitFullscreen || (document as any).webkitExitFullscreen || (document as any).mozCancelFullScreen || (document as any).msExitFullscreen;
          if (exitFs) {
            exitFs.call(document).catch((err: any) => {
              console.error("Exit fullscreen failed:", err);
              setSettings(prev => ({ ...prev, isFullscreen: true, updatedAt: Date.now() }));
            });
          }
        }
      }
    },
    handleManualSave,
    onUpdateLog,
    generateAiAvatar: async (customPrompt?: string | StudioParams, npcId?: string) => {
      if (!selectedWorld) return;
      setIsLoading(true);
      setLoadingStep("Đang phác họa chân dung nhân vật...");
      try {
        let finalPrompt = "";
        let aspectRatio: StudioParams['aspectRatio'] = "1:1";

        const targetNpc = npcId ? player.relationships.find(r => r.id === npcId) : null;
        const name = targetNpc ? targetNpc.name : player.name;
        const gender = targetNpc ? targetNpc.gender : player.gender;
        const age = targetNpc ? targetNpc.age : player.age;
        const personality = targetNpc ? targetNpc.personality : player.personality;
        const location = targetNpc ? targetNpc.lastLocation : player.currentLocation;

        if (typeof customPrompt === 'object' && customPrompt !== null) {
          // Studio mode
          const params = customPrompt as StudioParams;
          aspectRatio = params.aspectRatio;
          
          const styleMap: Record<string, string> = {
            'anime': 'anime style, high quality anime art',
            'realistic': 'realistic photo, high detail photography, 8k',
            'cyberpunk': 'cyberpunk style, neon lights, futuristic',
            'fantasy': 'fantasy art, magical atmosphere, epic',
            'oil_painting': 'oil painting, thick brushstrokes, classical',
            'sketch': 'pencil sketch, hand drawn, artistic',
            '3d_render': '3D render, unreal engine 5, octane render',
            'cinematic': 'cinematic style, movie still, high production value',
            'digital_art': 'digital art, clean lines, vibrant colors',
            'manga': 'manga style, black and white, ink drawing',
            'watercolor': 'watercolor painting, soft colors, fluid',
            'pixel_art': 'pixel art, 8-bit, retro game style'
          };

          const lightingMap: Record<string, string> = {
            'cinematic': 'cinematic lighting',
            'soft': 'soft lighting, diffused light',
            'dramatic': 'dramatic lighting, high contrast, chiaroscuro',
            'neon': 'neon lighting, glowing accents',
            'natural': 'natural sunlight, golden hour',
            'studio': 'studio lighting, professional setup',
            'volumetric': 'volumetric lighting, god rays',
            'rim': 'rim lighting, backlight'
          };

          const cameraMap: Record<string, string> = {
            'portrait': 'portrait shot',
            'closeup': 'close-up shot',
            'full_body': 'full body shot',
            'wide_angle': 'wide angle shot',
            'low_angle': 'low angle shot, looking up',
            'high_angle': 'high angle shot, looking down',
            'side_view': 'side view, profile',
            'eye_level': 'eye level shot'
          };

          const style = styleMap[params.style] || params.style;
          const lighting = lightingMap[params.lighting] || params.lighting;
          const camera = cameraMap[params.camera] || params.camera;
          
          finalPrompt = `A high quality ${style} ${camera} of a character named ${name}. Gender: ${gender}. Age: ${age}. Personality: ${personality}. Genre: ${selectedWorld?.genre || GameGenre.FREE_STYLE}. Background: ${location}. ${lighting}. ${params.keywords}. SFW, high detail, masterpiece.`;
          if (params.negativePrompt) {
            finalPrompt += ` Negative prompt: ${params.negativePrompt}`;
          } else {
            finalPrompt += ` Negative prompt: nsfw, nude, naked, deformed, blurry, low quality, bad anatomy, extra limbs, text, watermark`;
          }
        } else {
          // Simple mode
          const styleMap: Record<string, string> = {
            'Ảnh chụp': 'realistic photo',
            'Anime': 'anime style',
            'Nghệ thuật số': 'digital art',
            'Tranh sơn dầu': 'oil painting',
            'Phác thảo': 'sketch',
            '3D Render': '3D render',
            'Cyberpunk': 'cyberpunk style',
            'Fantasy': 'fantasy art',
            'Điện ảnh': 'cinematic'
          };
          const style = styleMap[settings.imageStyle || ''] || styleMap['Ảnh chụp'];
          finalPrompt = (customPrompt as string) || `A high quality ${style} portrait of a character named ${name}. Gender: ${gender}. Age: ${age}. Personality: ${personality}. Genre: ${selectedWorld?.genre || GameGenre.FREE_STYLE}. Background: ${location}. SFW, high detail, cinematic lighting, masterpiece.`;
          finalPrompt += ` Negative prompt: nsfw, nude, naked, deformed, blurry, low quality, bad anatomy, extra limbs, text, watermark`;
        }
        
        let imageUrl = await gameAI.generateImage(finalPrompt, settings, aspectRatio);

        if (imageUrl && isBase64(imageUrl)) {
          try {
            const file = base64ToFile(imageUrl, `avatar-${Date.now()}.png`);
            const uploadedUrl = await uploadImage(file, 'cloud');
            if (uploadedUrl) imageUrl = uploadedUrl;
          } catch (uploadErr) {
            console.warn("Avatar upload failed, keeping base64:", uploadErr);
          }
        }

        if (imageUrl) {
          if (npcId) {
            setPlayer(prev => ({
              ...prev,
              relationships: prev.relationships.map(r => r.id === npcId ? { ...r, avatar: imageUrl } : r)
            }));
            setGallery(prev => [{ url: imageUrl, tags: ['avatar', name, 'npc'], genre: selectedWorld?.genre || GameGenre.FREE_STYLE }, ...prev]);
          } else {
            setPlayer(prev => ({
              ...prev,
              avatar: imageUrl
            }));
            setGallery(prev => [{ url: imageUrl, tags: ['avatar', name], genre: selectedWorld?.genre || GameGenre.FREE_STYLE }, ...prev]);
          }
          return imageUrl;
        }
      } catch (error: any) {
        console.error("Avatar generation failed:", error);
        const errorLog: GameLog = {
          content: `GM: ${error.message || "Phác họa chân dung thất bại."}`,
          type: 'error',
          timestamp: Date.now()
        };
        setLogs(prev => [...prev, errorLog]);
        throw error; // Re-throw to let caller know it failed
      } finally {
        setIsLoading(false);
      }
    },
    toggleLock,
    markAsViewed,
    deleteNpc: (id: string) => {
      setPlayer(prev => ({
        ...prev,
        relationships: prev.relationships.filter(r => r.id !== id)
      }));
      setModals(prev => ({ ...prev, npcProfile: false }));
      setActiveNpcProfile(null);
    },
    handleRegenerateImage,
    gallery, setGallery,
    toasts, addToast, removeToast
  };
};
