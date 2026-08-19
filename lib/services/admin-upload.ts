import crypto from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { getUploadsRoot } from "@/lib/uploads-path";

type UploadKind = "products" | "brands" | "categories";

const uploadConfig: Record<
  UploadKind,
  {
    directory: string;
    maxBytes: number;
    allowedTypes: Record<string, string>;
  }
> = {
  products: {
    directory: "products",
    maxBytes: 5 * 1024 * 1024,
    allowedTypes: {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    },
  },
  brands: {
    directory: "brands",
    maxBytes: 2 * 1024 * 1024,
    allowedTypes: {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    },
  },
  categories: {
    directory: "categories",
    maxBytes: 4 * 1024 * 1024,
    allowedTypes: {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    },
  },
};

export async function saveAdminImageUpload(file: File, kind: UploadKind) {
  const config = uploadConfig[kind];

  if (!file || file.size === 0) {
    throw new Error("Aucun fichier fourni.");
  }

  if (file.size > config.maxBytes) {
    throw new Error("Fichier trop volumineux.");
  }

  const extension = config.allowedTypes[file.type];

  if (!extension) {
    throw new Error("Format image non autorise. Utilisez JPG, PNG ou WebP.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (!hasValidImageSignature(buffer, file.type)) {
    throw new Error("Le contenu du fichier ne correspond pas au format annonce.");
  }

  // turbopackIgnore : la racine vient de UPLOADS_DIR, donc inconnue a la
  // compilation. Sans ce marqueur, Turbopack trace tout le projet et embarque
  // les sources et le dossier public dans le bundle serveur. Le chemin est
  // valide a l'execution, et la garde de traversee reste en place plus bas.
  const uploadsRoot = path.join(
    /* turbopackIgnore: true */ getUploadsRoot(),
    config.directory,
  );
  const fileName = `${crypto.randomUUID()}.${extension}`;
  const diskPath = path.join(/* turbopackIgnore: true */ uploadsRoot, fileName);

  await mkdir(uploadsRoot, { recursive: true });
  await writeFile(diskPath, buffer, { flag: "wx" });

  return `/uploads/${config.directory}/${fileName}`;
}

export async function removeLocalPublicUpload(publicPath: string | null | undefined) {
  if (!publicPath?.startsWith("/uploads/")) return;

  const uploadsRoot = getUploadsRoot();
  // publicPath vaut "/uploads/<kind>/<fichier>" : on retire le prefixe pour le
  // rattacher a la racine reelle, qui n'est plus forcement dans public/.
  const relative = publicPath.replace(/^\/uploads\//, "");
  const normalized = path.normalize(path.join(uploadsRoot, relative));

  // Separateur final obligatoire : cf. app/uploads/[...path]/route.ts.
  if (!normalized.startsWith(uploadsRoot + path.sep)) return;

  try {
    await unlink(normalized);
  } catch {
    // File may already be gone; DB state remains authoritative.
  }
}

function hasValidImageSignature(buffer: Buffer, mimeType: string) {
  if (mimeType === "image/jpeg") {
    return buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  if (mimeType === "image/png") {
    return (
      buffer.length > 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    );
  }

  if (mimeType === "image/webp") {
    return (
      buffer.length > 12 &&
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP"
    );
  }

  return false;
}
