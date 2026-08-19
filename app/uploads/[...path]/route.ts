import { readFile } from "node:fs/promises";
import path from "node:path";
import { getUploadsRoot } from "@/lib/uploads-path";

// Next.js ne sert que les fichiers public/ presents au build : les uploads
// effectues a l'execution (logos, images produits) passent par cette route.
const uploadsRoot = getUploadsRoot();

const contentTypes: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;
  const diskPath = path.normalize(path.join(uploadsRoot, ...segments));

  // Le separateur final est indispensable : sans lui, startsWith laissait
  // passer les repertoires freres (public/uploads-prive correspondait au
  // prefixe public/uploads).
  if (!diskPath.startsWith(uploadsRoot + path.sep)) {
    return new Response("Not found", { status: 404 });
  }

  const contentType = contentTypes[path.extname(diskPath).toLowerCase()];

  if (!contentType) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const file = await readFile(diskPath);

    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type": contentType,
        // Noms de fichiers en UUID : contenu immuable, cache long autorise.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
