import type { CacheEntry } from './types';

const CACHE_PREFIX = 'ccpm-cache:';
const MAX_ENTRIES = 200;

export const BOARD_TTL = 30000;
export const COMMENT_TTL = 15000;

export class ApiCache {
  get<T>(key: string): CacheEntry<T> | null {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    try {
      const entry: CacheEntry<T> = JSON.parse(raw);
      if (Date.now() > entry.timestamp + entry.ttl) {
        localStorage.removeItem(CACHE_PREFIX + key);
        return null;
      }
      return entry;
    } catch {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
  }

  set<T>(key: string, data: T, etag: string | null, ttl: number): void {
    const entry: CacheEntry<T> = { data, etag, timestamp: Date.now(), ttl };
    this.evictIfNeeded();
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  }

  clear(): void {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(CACHE_PREFIX)) keys.push(k);
    }
    for (const k of keys) localStorage.removeItem(k);
  }

  private evictIfNeeded(): void {
    const entries: { key: string; timestamp: number }[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith(CACHE_PREFIX)) continue;
      try {
        const raw = localStorage.getItem(k);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        entries.push({ key: k, timestamp: parsed.timestamp ?? 0 });
      } catch {
        // skip corrupt entries
      }
    }
    if (entries.length < MAX_ENTRIES) return;
    entries.sort((a, b) => a.timestamp - b.timestamp);
    const toRemove = entries.length - MAX_ENTRIES + 1;
    for (let i = 0; i < toRemove; i++) {
      localStorage.removeItem(entries[i].key);
    }
  }
}
