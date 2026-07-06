import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { stdin as input, stdout as output } from "node:process";

function readHiddenLine(prompt) {
  return new Promise((resolve) => {
    const bytes = [];
    const wasRaw = input.isRaw;

    output.write(prompt);
    input.resume();
    input.setEncoding("utf8");
    input.setRawMode?.(true);

    function cleanup() {
      input.off("data", onData);
      input.setRawMode?.(wasRaw);
      input.pause();
      output.write("\n");
    }

    function onData(chunk) {
      for (const char of chunk) {
        const code = char.charCodeAt(0);

        if (code === 3) {
          cleanup();
          process.exit(130);
        }

        if (code === 13 || code === 10) {
          cleanup();
          resolve(bytes.join(""));
          return;
        }

        if (code === 8 || code === 127) {
          bytes.pop();
          continue;
        }

        bytes.push(char);
      }
    }

    input.on("data", onData);
  });
}

const password = await readHiddenLine("Mot de passe admin local a hasher: ");
const confirm = await readHiddenLine("Confirmer le mot de passe: ");

if (!password || password.length < 12) {
  console.error("Le mot de passe doit contenir au moins 12 caracteres.");
  process.exit(1);
}

if (
  password.length !== confirm.length ||
  !timingSafeEqual(Buffer.from(password), Buffer.from(confirm))
) {
  console.error("Les mots de passe ne correspondent pas.");
  process.exit(1);
}

const salt = randomBytes(16).toString("hex");
const keyLength = 64;
const hash = scryptSync(password, salt, keyLength).toString("hex");

console.log("\nAjoutez cette valeur dans .env :");
console.log(`ADMIN_PASSWORD_HASH="scrypt:${salt}:${hash}"`);
