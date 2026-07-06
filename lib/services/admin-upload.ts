import crypto from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

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

  const uploadsRoot = path.join(process.cwd(), "public", "uploads", config.directory);
  const fileName = `${crypto.randomUUID()}.${extension}`;
  const diskPath = path.join(uploadsRoot, fileName);

  await mkdir(uploadsRoot, { recursive: true });
  await writeFile(diskPath, buffer, { flag: "wx" });

  return `/uploads/${config.directory}/${fileName}`;
}

export async function removeLocalPublicUpload(publicPath: string | null | undefined) {
  if (!publicPath?.startsWith("/uploads/")) return;

  const diskPath = path.join(process.cwd(), "public", publicPath);
  const uploadsRoot = path.normalize(path.join(process.cwd(), "public", "uploads"));
  const normalized = path.normalize(diskPath);

  if (!normalized.startsWith(uploadsRoot)) return;

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
