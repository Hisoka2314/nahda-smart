import { describe, expect, it } from "vitest";
import { isSameOriginRequest } from "@/lib/security/rate-limit";

type FakeRequest = Parameters<typeof isSameOriginRequest>[0];

function build(origin: string | null, headers: Record<string, string>, nextUrlHost: string) {
  const all = new Map(
    Object.entries({ ...headers, ...(origin ? { origin } : {}) }).map(([k, v]) => [
      k.toLowerCase(),
      v,
    ]),
  );

  return {
    headers: { get: (name: string) => all.get(name.toLowerCase()) ?? null },
    nextUrl: { host: nextUrlHost },
  } as unknown as FakeRequest;
}

describe("isSameOriginRequest derriere un reverse proxy", () => {
  it("accepte une origine identique au Host transmis par nginx", () => {
    // nextUrl pointe sur l'adresse interne : c'est le cas reel en production.
    const request = build(
      "https://nahdasmart.duckdns.org",
      { host: "nahdasmart.duckdns.org" },
      "127.0.0.1:3000",
    );

    expect(isSameOriginRequest(request)).toBe(true);
  });

  it("accepte via x-forwarded-host", () => {
    const request = build(
      "https://nahdasmart.duckdns.org",
      { "x-forwarded-host": "nahdasmart.duckdns.org" },
      "127.0.0.1:3000",
    );

    expect(isSameOriginRequest(request)).toBe(true);
  });

  it("rejette une origine tierce, meme derriere le proxy", () => {
    const request = build(
      "https://evil.ma",
      { host: "nahdasmart.duckdns.org" },
      "127.0.0.1:3000",
    );

    expect(isSameOriginRequest(request)).toBe(false);
  });

  it("accepte l'absence d'Origin (appels serveur a serveur)", () => {
    expect(isSameOriginRequest(build(null, { host: "x.ma" }, "x.ma"))).toBe(true);
  });

  it("rejette une origine illisible", () => {
    const request = build("pas-une-url", { host: "x.ma" }, "x.ma");

    expect(isSameOriginRequest(request)).toBe(false);
  });
});
