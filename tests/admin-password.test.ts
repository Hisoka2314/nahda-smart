import { randomBytes, scryptSync } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  hasUsableAdminPasswordHash,
  timingEqualizerHash,
  verifyAdminPassword,
} from "@/lib/auth/password";

function makeHash(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

describe("hasUsableAdminPasswordHash", () => {
  it("accepte un hash scrypt valide", () => {
    expect(hasUsableAdminPasswordHash(makeHash("secret"))).toBe(true);
  });

  it("rejette le placeholder et les formats invalides", () => {
    expect(hasUsableAdminPasswordHash("$2b$12$replace-with-a-secure-hash")).toBe(false);
    expect(hasUsableAdminPasswordHash(undefined)).toBe(false);
    expect(hasUsableAdminPasswordHash("")).toBe(false);
    expect(hasUsableAdminPasswordHash("md5:abc")).toBe(false);
  });
});

describe("verifyAdminPassword", () => {
  it("valide le bon mot de passe et rejette le mauvais", () => {
    const hash = makeHash("S3cure!Passw0rd");
    expect(verifyAdminPassword("S3cure!Passw0rd", hash)).toBe(true);
    expect(verifyAdminPassword("wrong", hash)).toBe(false);
    expect(verifyAdminPassword("", hash)).toBe(false);
  });

  it("le hash d'egalisation de timing ne valide jamais rien", () => {
    expect(verifyAdminPassword("anything", timingEqualizerHash)).toBe(false);
  });
});
