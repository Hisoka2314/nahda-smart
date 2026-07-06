import { describe, expect, it } from "vitest";
import { checkRateLimit, ipFromHeaders } from "@/lib/security/rate-limit";

function fakeHeaders(entries: Record<string, string>) {
  return {
    get: (name: string) => entries[name.toLowerCase()] ?? null,
  };
}

describe("checkRateLimit", () => {
  it("bloque au-dela du plafond et pose un Retry-After", () => {
    const rule = { windowMs: 60_000, max: 3, blockMs: 60_000 };
    const key = `test-${Date.now()}-limit`;

    for (let i = 0; i < 3; i += 1) {
      expect(checkRateLimit({ scope: "t", key, rule }).limited).toBe(false);
    }

    const blocked = checkRateLimit({ scope: "t", key, rule });
    expect(blocked.limited).toBe(true);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("isole les cles entre elles", () => {
    const rule = { windowMs: 60_000, max: 1, blockMs: 60_000 };
    const keyA = `test-${Date.now()}-a`;
    const keyB = `test-${Date.now()}-b`;

    checkRateLimit({ scope: "t", key: keyA, rule });
    checkRateLimit({ scope: "t", key: keyA, rule });
    expect(checkRateLimit({ scope: "t", key: keyB, rule }).limited).toBe(false);
  });
});

describe("ipFromHeaders", () => {
  it("prend la premiere IP de x-forwarded-for", () => {
    expect(
      ipFromHeaders(fakeHeaders({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" })),
    ).toBe("1.2.3.4");
  });

  it("ne depend pas du user-agent (anti-contournement)", () => {
    const a = ipFromHeaders(
      fakeHeaders({ "x-forwarded-for": "1.2.3.4", "user-agent": "bot-1" }),
    );
    const b = ipFromHeaders(
      fakeHeaders({ "x-forwarded-for": "1.2.3.4", "user-agent": "bot-2" }),
    );
    expect(a).toBe(b);
  });

  it("retombe sur x-real-ip puis local", () => {
    expect(ipFromHeaders(fakeHeaders({ "x-real-ip": "5.6.7.8" }))).toBe("5.6.7.8");
    expect(ipFromHeaders(fakeHeaders({}))).toBe("local");
  });
});
