import { idbService, STORES } from './idbService';
import { compressionService } from './compressionService';

export interface SaveMetadata {
  playerName: string;
  level: number;
  timestamp: number;
  genre: string;
  worldId: string;
  turnCount: number;
  avatar?: string;
}

export class DBService {
  async saveImage(base64Data: string): Promise<string> {
    const id = `local_img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await idbService.set(STORES.IMAGES, id, base64Data);
    return id;
  }

  async loadImage(imageId: string): Promise<string | null> {
    return await idbService.get(STORES.IMAGES, imageId);
  }

  async init(): Promise<void> {
    return Promise.resolve();
  }

  async save(data: any, slot: string, customMetadata?: SaveMetadata): Promise<void> {
    const metadata: SaveMetadata = customMetadata || {
      playerName: data.player?.name || 'Vô Danh',
      level: data.player?.level || 1,
      timestamp: Date.now(),
      genre: data.selectedWorld?.genre || 'Chưa rõ',
      worldId: data.selectedWorld?.id || 'unknown',
      turnCount: data.player?.turnCount || 0,
      avatar: data.player?.avatar
    };

    const compressedData = compressionService.compress(data);
    const dataToSave = { compressedData, metadata };

    try {
      await idbService.set(STORES.SAVES, slot, dataToSave);
      const slotsInfo = await idbService.get(STORES.SLOTS_INFO, 'current') || {};
      slotsInfo[slot] = metadata;
      await idbService.set(STORES.SLOTS_INFO, 'current', slotsInfo);
      console.log(`Saved to local store, slot: ${slot}`);
    } catch (e) {
      console.error(`Local save failed`, e);
    }
  }

  async load(slot: string): Promise<any> {
    try {
      const saved = await idbService.get(STORES.SAVES, slot);
      if (saved && saved.compressedData) {
        return { ...compressionService.decompress(saved.compressedData), metadata: saved.metadata };
      }
    } catch (e) {
      console.error(`Local load failed`, e);
    }
    return null;
  }

  async delete(slot: string): Promise<void> {
    try {
      await idbService.delete(STORES.SAVES, slot);
      const slotsInfo = await idbService.get(STORES.SLOTS_INFO, 'current') || {};
      if (slotsInfo[slot]) {
        delete slotsInfo[slot];
        await idbService.set(STORES.SLOTS_INFO, 'current', slotsInfo);
      }
      console.log(`Deleted slot: ${slot}`);
    } catch (e) {
      console.error(`Local delete failed`, e);
    }
  }

  async getLatestSave(): Promise<{slot: string, data: any} | null> {
    try {
      const slotsInfo = await idbService.get(STORES.SLOTS_INFO, 'current') || {};
      let latestSlot = null;
      let latestTime = 0;
      
      for (const slot in slotsInfo) {
        if (slotsInfo[slot].timestamp > latestTime) {
          latestTime = slotsInfo[slot].timestamp;
          latestSlot = slot;
        }
      }
      
      if (latestSlot) {
        const data = await this.load(latestSlot);
        return { slot: latestSlot, data };
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  async getSlotsInfo(): Promise<Record<string, SaveMetadata | null>> {
    return await idbService.get(STORES.SLOTS_INFO, 'current') || {};
  }

  async getAllSaves(): Promise<any[]> {
    try {
      const slotsInfo = await idbService.get(STORES.SLOTS_INFO, 'current') || {};
      const allData: any[] = [];
      for (const slot in slotsInfo) {
        const data = await this.load(slot);
        if (data) allData.push({ ...data, id: slot });
      }
      return allData;
    } catch (e) {
      return [];
    }
  }

  async clearAll(): Promise<void> {
    await idbService.clear(STORES.SAVES);
    await idbService.delete(STORES.SLOTS_INFO, 'current');
  }

  async saveSettings(settings: any): Promise<void> {
    const settingsWithTimestamp = {
      ...settings,
      updatedAt: settings.updatedAt || Date.now()
    };
    await idbService.set(STORES.SETTINGS, 'current', settingsWithTimestamp);
  }

  async getSettings(): Promise<any | null> {
    return await idbService.get(STORES.SETTINGS, 'current');
  }

  async saveGallery(gallery: any[]): Promise<void> {
    const galleryData = { items: gallery, updatedAt: Date.now() };
    await idbService.set(STORES.GALLERY, 'global', galleryData);
  }

  async getGallery(): Promise<any[]> {
    const saved = await idbService.get(STORES.GALLERY, 'global');
    return saved?.items || [];
  }

  async saveAutosave(saveData: { id: string, name: string, createdAt: number, updatedAt: number, data: any }): Promise<void> {
    const metadata: SaveMetadata = {
      playerName: saveData.data.player?.name || 'Vô Danh',
      level: saveData.data.player?.level || 1,
      timestamp: saveData.updatedAt,
      genre: saveData.data.world?.genre || 'Chưa rõ',
      worldId: saveData.data.world?.id || 'unknown',
      turnCount: saveData.data.player?.turnCount || 0,
      avatar: saveData.data.player?.avatar
    };
    
    return this.save(saveData.data, saveData.id, metadata);
  }

  async clearAllData(): Promise<void> {
    await idbService.clear(STORES.SAVES);
    await idbService.clear(STORES.SETTINGS);
    await idbService.clear(STORES.GALLERY);
    await idbService.clear(STORES.SLOTS_INFO);
    await idbService.clear(STORES.IMAGES);
  }

  async syncAll(): Promise<boolean> {
    // No-op in offline mode
    return Promise.resolve(true);
  }
}

export const dbService = new DBService();
