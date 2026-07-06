type LoginAttempt = {
  count: number;
  firstAttemptAt: number;
  blockedUntil?: number;
};

const WINDOW_MS = 15 * 60 * 1000;
const BLOCK_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const globalForRateLimit = globalThis as unknown as {
  nahdaAdminLoginAttempts?: Map<string, LoginAttempt>;
};

const attempts =
  globalForRateLimit.nahdaAdminLoginAttempts ??
  new Map<string, LoginAttempt>();

if (!globalForRateLimit.nahdaAdminLoginAttempts) {
  globalForRateLimit.nahdaAdminLoginAttempts = attempts;
}

export function buildLoginRateLimitKey(
  ipAddress: string | undefined,
  email: string,
): string {
  return `${ipAddress ?? "unknown"}:${email.trim().toLowerCase()}`;
}

export function isLoginRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry) return false;

  if (entry.blockedUntil && entry.blockedUntil > now) {
    return true;
  }

  if (now - entry.firstAttemptAt > WINDOW_MS) {
    attempts.delete(key);
    return false;
  }

  return false;
}

export function recordLoginFailure(key: string): void {
  const now = Date.now();
  const current = attempts.get(key);

  if (!current || now - current.firstAttemptAt > WINDOW_MS) {
    attempts.set(key, { count: 1, firstAttemptAt: now });
    return;
  }

  const nextCount = current.count + 1;
  attempts.set(key, {
    count: nextCount,
    firstAttemptAt: current.firstAttemptAt,
    blockedUntil: nextCount >= MAX_ATTEMPTS ? now + BLOCK_MS : undefined,
  });
}

export function clearLoginFailures(key: string): void {
  attempts.delete(key);
}
