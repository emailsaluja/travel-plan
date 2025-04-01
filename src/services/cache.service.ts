export interface CacheItem<T> {
    data: T;
    timestamp: number;
}

export class CacheService {
    private static cache: Map<string, CacheItem<any>> = new Map();
    private static DEFAULT_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    static set<T>(key: string, data: T, duration: number = this.DEFAULT_CACHE_DURATION): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now() + duration
        });
    }

    static get<T>(key: string): T | null {
        const item = this.cache.get(key);
        if (!item) return null;

        if (Date.now() > item.timestamp) {
            this.cache.delete(key);
            return null;
        }

        return item.data as T;
    }

    static clear(key?: string): void {
        if (key) {
            this.cache.delete(key);
        } else {
            this.cache.clear();
        }
    }
} 