import http from "node:http";
import https from "node:https";
import { loadLocalEnv } from "./prod-maintenance-utils.mjs";

loadLocalEnv();

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const routes = [
  "/",
  "/catalogue",
  "/categorie/pc-portables",
  "/produit/hp-probook-450-g10",
  "/recherche?q=hp",
  "/checkout",
  "/suivre-commande",
];
const sensitiveTokens = [
  "priceBuy",
  "passwordHash",
  "tokenHash",
  "AdminLog",
  "SupplierPurchase",
  "internalNote",
  "internalNotes",
  "DATABASE_URL",
  "ADMIN_PASSWORD_HASH",
];
let failed = false;

for (const route of routes) {
  const url = new URL(route, siteUrl);
  const { status, body } = await get(url);
  const leaks = sensitiveTokens.filter((token) => body.includes(token));

  console.log(`${route} -> ${status}${leaks.length ? ` | leaks: ${leaks.join(", ")}` : ""}`);

  if (status >= 500 || leaks.length) {
    failed = true;
  }
}

if (failed) {
  console.error("Scan public echoue: fuite potentielle ou erreur serveur.");
  process.exit(1);
}

console.log("Scan public OK: aucune fuite sensible connue detectee.");

function get(url) {
  const client = url.protocol === "https:" ? https : http;

  return new Promise((resolve, reject) => {
    const request = client.get(url, (response) => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        body += chunk;
      });
      response.on("end", () => {
        resolve({ status: response.statusCode ?? 0, body });
      });
    });

    request.setTimeout(15000, () => {
      request.destroy(new Error(`Timeout: ${url.href}`));
    });
    request.on("error", reject);
  });
}
