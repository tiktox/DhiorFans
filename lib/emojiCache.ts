// Cache optimizado para emojis con compresión y persistencia
class EmojiCache {
  private cache = new Map<string, any>();
  private loadingPromises = new Map<string, Promise<any>>();
  private readonly CACHE_KEY = 'dhirofans_emoji_cache';
  private readonly MAX_CACHE_SIZE = 50;
  private readonly CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 horas

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem(this.CACHE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (Date.now() - data.timestamp < this.CACHE_EXPIRY) {
          Object.entries(data.emojis).forEach(([id, emoji]) => {
            this.cache.set(id, emoji);
          });
        }
      }
    } catch (error) {
      console.warn('Error loading emoji cache:', error);
    }
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;
    
    try {
      const data = {
        timestamp: Date.now(),
        emojis: Object.fromEntries(this.cache)
      };
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('Error saving emoji cache:', error);
    }
  }

  async get(emojiId: string, emojiPath: string): Promise<any> {
    // Retornar desde cache si existe
    if (this.cache.has(emojiId)) {
      return this.cache.get(emojiId);
    }

    // Si ya está cargando, retornar la promesa existente
    if (this.loadingPromises.has(emojiId)) {
      return this.loadingPromises.get(emojiId);
    }

    // Crear nueva promesa de carga
    const loadPromise = this.loadEmoji(emojiId, emojiPath);
    this.loadingPromises.set(emojiId, loadPromise);

    try {
      const result = await loadPromise;
      this.loadingPromises.delete(emojiId);
      return result;
    } catch (error) {
      this.loadingPromises.delete(emojiId);
      throw error;
    }
  }

  private async loadEmoji(emojiId: string, emojiPath: string): Promise<any> {
    try {
      const response = await fetch(emojiPath);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      // Optimizar datos del emoji
      const optimizedData = this.optimizeEmojiData(data);
      
      // Guardar en cache
      this.cache.set(emojiId, optimizedData);
      
      // Limpiar cache si es muy grande
      if (this.cache.size > this.MAX_CACHE_SIZE) {
        this.cleanupCache();
      }
      
      // Guardar en localStorage
      this.saveToStorage();
      
      return optimizedData;
    } catch (error) {
      console.error(`Error loading emoji ${emojiId}:`, error);
      throw error;
    }
  }

  private optimizeEmojiData(data: any): any {
    // Reducir precisión de números para menor tamaño
    const optimized = JSON.parse(JSON.stringify(data, (key, value) => {
      if (typeof value === 'number' && !Number.isInteger(value)) {
        return Math.round(value * 100) / 100;
      }
      return value;
    }));

    // Remover propiedades innecesarias
    if (optimized.metadata) {
      delete optimized.metadata;
    }
    
    return optimized;
  }

  private cleanupCache() {
    // Remover los primeros elementos (FIFO)
    const keysToRemove = Array.from(this.cache.keys()).slice(0, 10);
    keysToRemove.forEach(key => this.cache.delete(key));
  }

  preload(emojiIds: string[], emojiPaths: string[]) {
    // Precargar emojis populares en background
    emojiIds.forEach((id, index) => {
      if (!this.cache.has(id) && !this.loadingPromises.has(id)) {
        setTimeout(() => {
          this.get(id, emojiPaths[index]).catch(() => {
            // Ignorar errores en precarga
          });
        }, index * 100);
      }
    });
  }

  clear() {
    this.cache.clear();
    this.loadingPromises.clear();
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.CACHE_KEY);
    }
  }

  getStats() {
    return {
      cacheSize: this.cache.size,
      loadingCount: this.loadingPromises.size,
      maxSize: this.MAX_CACHE_SIZE
    };
  }
}

export const emojiCache = new EmojiCache();