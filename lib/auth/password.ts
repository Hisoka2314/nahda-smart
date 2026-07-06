import { scryptSync, timingSafeEqual } from "node:crypto";

const placeholderAdminHash = "$2b$12$replace-with-a-secure-hash";

// Hash factice au format scrypt valide : verifie quand le compte n'existe pas
// (ou est inactif) pour que le temps de reponse ne revele pas l'existence
// d'un email admin.
export const timingEqualizerHash = `scrypt:timing-equalizer:${"0".repeat(128)}`;

export function hasUsableAdminPasswordHash(hash: string | undefined): boolean {
  return (
    typeof hash === "string" &&
    hash.trim().length > 24 &&
    hash !== placeholderAdminHash &&
    hash.startsWith("scrypt:")
  );
}

export function verifyAdminPassword(password: string, passwordHash: string): boolean {
  if (!password || !hasUsableAdminPasswordHash(passwordHash)) return false;

  const [, salt, expectedHash] = passwordHash.split(":");

  if (!salt || !expectedHash || !/^[a-f0-9]+$/i.test(expectedHash)) {
    return false;
  }

  const expected = Buffer.from(expectedHash, "hex");
  const actual = scryptSync(password, salt, expected.length);

  if (actual.length !== expected.length) return false;

  return timingSafeEqual(actual, expected);
}
