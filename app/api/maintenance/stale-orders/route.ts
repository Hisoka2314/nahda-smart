import { timingSafeEqual } from "node:crypto";
import { NextRequest } from "next/server";
import { errorJson, okJson } from "@/lib/api/responses";
import { cancelStalePendingOrders } from "@/lib/services/admin-orders";

export const runtime = "nodejs";

// Endpoint de maintenance a appeler depuis un cron du VPS, par exemple :
//   0 */6 * * * curl -s -X POST -H "Authorization: Bearer $MAINTENANCE_SECRET" \
//     http://localhost:3000/api/maintenance/stale-orders
// Il annule les commandes site restees en attente de confirmation depuis plus
// de 48h et libere leur stock reserve. Desactive si MAINTENANCE_SECRET absent.
export async function POST(request: NextRequest) {
  const secret = process.env.MAINTENANCE_SECRET;

  if (!secret || secret.length < 16) {
    return errorJson("Maintenance non configuree.", 503);
  }

  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";

  if (!isSameSecret(provided, secret)) {
    return errorJson("Non autorise.", 401);
  }

  try {
    const result = await cancelStalePendingOrders({});
    return okJson(result);
  } catch {
    return errorJson("La purge des commandes a echoue.", 500);
  }
}

function isSameSecret(provided: string, expected: string): boolean {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);

  if (providedBuffer.length !== expectedBuffer.length) return false;

  return timingSafeEqual(providedBuffer, expectedBuffer);
}
