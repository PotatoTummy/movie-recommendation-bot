/**
 * In-memory sliding-window rate limiter for portfolio / demo protection.
 * Prevents API abuse and token exhaustion while allowing normal demo usage.
 */

interface RateLimitRecord {
  timestamps: number[];
}

const ipRequestMap = new Map<string, RateLimitRecord>();

// Clean up stale entries every 5 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function purgeExpired(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  const threshold = now - windowMs;
  for (const [ip, record] of ipRequestMap.entries()) {
    const valid = record.timestamps.filter((ts) => ts > threshold);
    if (valid.length === 0) {
      ipRequestMap.delete(ip);
    } else {
      record.timestamps = valid;
    }
  }
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetInSeconds: number;
}

export function checkRateLimit(
  identifier: string,
  limit: number = 6,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): RateLimitResult {
  purgeExpired(windowMs);

  const now = Date.now();
  const threshold = now - windowMs;

  const record = ipRequestMap.get(identifier) || { timestamps: [] };
  // Keep only timestamps within the sliding window
  const activeTimestamps = record.timestamps.filter((ts) => ts > threshold);

  if (activeTimestamps.length >= limit) {
    const oldest = activeTimestamps[0];
    const resetInSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    return {
      success: false,
      limit,
      remaining: 0,
      resetInSeconds,
    };
  }

  activeTimestamps.push(now);
  ipRequestMap.set(identifier, { timestamps: activeTimestamps });

  const remaining = Math.max(0, limit - activeTimestamps.length);
  const resetInSeconds = Math.ceil(windowMs / 1000);

  return {
    success: true,
    limit,
    remaining,
    resetInSeconds,
  };
}
