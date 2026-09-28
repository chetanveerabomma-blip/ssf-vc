interface RateLimitEntry {
  count: number;
  firstAttempt: number;
}

const loginAttempts = new Map<string, RateLimitEntry>();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

/**
 * Checks and records a login attempt.
 * Returns { allowed: boolean, remainingAttempts: number, lockoutSeconds: number }
 */
export function checkRateLimit(key: string): {
  allowed: boolean;
  remainingAttempts: number;
  lockoutSeconds: number;
} {
  const now = Date.now();
  const entry = loginAttempts.get(key);

  if (!entry) {
    return {
      allowed: true,
      remainingAttempts: MAX_ATTEMPTS,
      lockoutSeconds: 0,
    };
  }

  // Check if window has expired
  if (now - entry.firstAttempt > WINDOW_MS) {
    loginAttempts.delete(key);
    return {
      allowed: true,
      remainingAttempts: MAX_ATTEMPTS,
      lockoutSeconds: 0,
    };
  }

  if (entry.count >= MAX_ATTEMPTS) {
    const lockoutSeconds = Math.ceil((entry.firstAttempt + WINDOW_MS - now) / 1000);
    return {
      allowed: false,
      remainingAttempts: 0,
      lockoutSeconds,
    };
  }

  return {
    allowed: true,
    remainingAttempts: MAX_ATTEMPTS - entry.count,
    lockoutSeconds: 0,
  };
}

export function recordFailedAttempt(key: string): {
  allowed: boolean;
  remainingAttempts: number;
  lockoutSeconds: number;
} {
  const now = Date.now();
  const entry = loginAttempts.get(key);

  if (!entry || now - entry.firstAttempt > WINDOW_MS) {
    loginAttempts.set(key, { count: 1, firstAttempt: now });
    return {
      allowed: true,
      remainingAttempts: MAX_ATTEMPTS - 1,
      lockoutSeconds: 0,
    };
  }

  entry.count += 1;
  loginAttempts.set(key, entry);

  if (entry.count >= MAX_ATTEMPTS) {
    const lockoutSeconds = Math.ceil((entry.firstAttempt + WINDOW_MS - now) / 1000);
    return {
      allowed: false,
      remainingAttempts: 0,
      lockoutSeconds,
    };
  }

  return {
    allowed: true,
    remainingAttempts: MAX_ATTEMPTS - entry.count,
    lockoutSeconds: 0,
  };
}

export function resetRateLimit(key: string): void {
  loginAttempts.delete(key);
}
