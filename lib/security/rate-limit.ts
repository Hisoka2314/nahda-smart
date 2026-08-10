import type { NextRequest } from "next/server";

type RateLimitEntry = {
  count: number;
  firstHitAt: number;
  blockedUntil?: number;
};

type RateLimitRule = {
  windowMs: number;
  max: number;
  blockMs?: number;
};

const globalForRateLimit = globalThis as unknown as {
  nahdaRateLimits?: Map<string, RateLimitEntry>;
};

const buckets =
  globalForRateLimit.nahdaRateLimits ?? new Map<string, RateLimitEntry>();

if (!globalForRateLimit.nahdaRateLimits) {
  globalForRateLimit.nahdaRateLimits = buckets;
}

// Sans eviction, la Map grossissait indefiniment : chaque IP distincte y
// laissait une entree permanente, ce qui constitue une fuite memoire lente
// sur un serveur de longue duree.
const EVICTION_INTERVAL_MS = 5 * 60 * 1000;
const ENTRY_MAX_IDLE_MS = 60 * 60 * 1000;
let lastEvictionAt = 0;

function evictStaleEntries(now: number) {
  if (now - lastEvictionAt < EVICTION_INTERVAL_MS) return;

  lastEvictionAt = now;

  for (const [key, entry] of buckets) {
    const blocked = entry.blockedUntil && entry.blockedUntil > now;

    if (!blocked && now - entry.firstHitAt > ENTRY_MAX_IDLE_MS) {
      buckets.delete(key);
    }
  }
}

export function checkRateLimit({
  scope,
  key,
  rule,
}: {
  scope: string;
  key: string;
  rule: RateLimitRule;
}): { limited: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  evictStaleEntries(now);
  const bucketKey = `${scope}:${key}`;
  const current = buckets.get(bucketKey);

  if (current?.blockedUntil && current.blockedUntil > now) {
    return {
      limited: true,
      retryAfterSeconds: Math.ceil((current.blockedUntil - now) / 1000),
    };
  }

  if (!current || now - current.firstHitAt > rule.windowMs) {
    buckets.set(bucketKey, { count: 1, firstHitAt: now });
    return { limited: false };
  }

  const nextCount = current.count + 1;
  const limited = nextCount > rule.max;
  const blockedUntil =
    limited && rule.blockMs ? now + rule.blockMs : current.blockedUntil;

  buckets.set(bucketKey, {
    count: nextCount,
    firstHitAt: current.firstHitAt,
    blockedUntil,
  });

  return {
    limited,
    retryAfterSeconds: limited
      ? Math.ceil(((blockedUntil ?? current.firstHitAt + rule.windowMs) - now) / 1000)
      : undefined,
  };
}

export function getRequestIdentity(request: NextRequest): string {
  return identityFromHeaders(request.headers);
}

export function identityFromHeaders(headers: Pick<Headers, "get">): string {
  const userAgent = headers.get("user-agent") ?? "unknown";

  return `${ipFromHeaders(headers)}:${userAgent.slice(0, 80)}`;
}

// Clé basée sur l'IP seule : le User-Agent est trivial à faire tourner,
// il ne doit pas permettre de contourner la limite sur les mutations publiques.
export function ipFromHeaders(headers: Pick<Headers, "get">): string {
  const forwardedFor = headers.get("x-forwarded-for");

  return (
    forwardedFor?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    "local"
  );
}

export function isSameOriginRequest(request: NextRequest): boolean {
  const origin = request.headers.get("origin");

  if (!origin) return true;

  try {
    return new URL(origin).host === request.nextUrl.host;
  } catch {
    return false;
  }
}

export function publicMutationRateLimit(
  request: NextRequest,
  scope: "checkout" | "quote" | "contact" | "tracking",
) {
  const rules: Record<typeof scope, RateLimitRule> = {
    checkout: { windowMs: 10 * 60 * 1000, max: 10, blockMs: 10 * 60 * 1000 },
    quote: { windowMs: 10 * 60 * 1000, max: 8, blockMs: 10 * 60 * 1000 },
    contact: { windowMs: 10 * 60 * 1000, max: 8, blockMs: 10 * 60 * 1000 },
    tracking: { windowMs: 5 * 60 * 1000, max: 20, blockMs: 5 * 60 * 1000 },
  };

  return checkRateLimit({
    scope: `api:${scope}`,
    key: ipFromHeaders(request.headers),
    rule: rules[scope],
  });
}

// Limiteur pour les server actions publiques (newsletter, avis) : pas de
// NextRequest disponible, on passe les headers de la requete (via `headers()`).
export function publicActionRateLimit(
  headers: Pick<Headers, "get">,
  scope: "newsletter" | "review",
) {
  const rules: Record<typeof scope, RateLimitRule> = {
    newsletter: { windowMs: 10 * 60 * 1000, max: 10, blockMs: 10 * 60 * 1000 },
    review: { windowMs: 10 * 60 * 1000, max: 6, blockMs: 10 * 60 * 1000 },
  };

  return checkRateLimit({
    scope: `action:${scope}`,
    key: ipFromHeaders(headers),
    rule: rules[scope],
  });
}

export function searchRateLimit(headers: Pick<Headers, "get">) {
  return checkRateLimit({
    scope: "public:search",
    key: identityFromHeaders(headers),
    rule: { windowMs: 60 * 1000, max: 60, blockMs: 60 * 1000 },
  });
}
