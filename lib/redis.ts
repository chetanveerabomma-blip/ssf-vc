import { Redis } from "@upstash/redis";

interface MemoryEntry {
  value: any;
  expiresAt: number | null; // epoch ms
}

class InMemoryRedis {
  private store = new Map<string, MemoryEntry>();

  async get<T = any>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set(key: string, value: any, options?: { ex?: number; px?: number }): Promise<"OK"> {
    let expiresAt: number | null = null;
    if (options?.ex) {
      expiresAt = Date.now() + options.ex * 1000;
    } else if (options?.px) {
      expiresAt = Date.now() + options.px;
    }
    this.store.set(key, { value, expiresAt });
    return "OK";
  }

  async del(key: string): Promise<number> {
    const deleted = this.store.delete(key);
    return deleted ? 1 : 0;
  }

  async keys(pattern: string): Promise<string[]> {
    const now = Date.now();
    const result: string[] = [];
    const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");

    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.store.delete(key);
        continue;
      }
      if (regex.test(key)) {
        result.push(key);
      }
    }
    return result;
  }

  async incr(key: string): Promise<number> {
    const cur = await this.get<number>(key);
    const newVal = (typeof cur === "number" ? cur : 0) + 1;
    await this.set(key, newVal);
    return newVal;
  }

  async expire(key: string, seconds: number): Promise<number> {
    const entry = this.store.get(key);
    if (!entry) return 0;
    entry.expiresAt = Date.now() + seconds * 1000;
    return 1;
  }
}

const hasUpstash =
  Boolean(process.env.UPSTASH_REDIS_REST_URL) &&
  Boolean(process.env.UPSTASH_REDIS_REST_TOKEN);

export const redis = hasUpstash
  ? Redis.fromEnv()
  : (new InMemoryRedis() as unknown as Redis);

export const isRedisRemote = hasUpstash;
