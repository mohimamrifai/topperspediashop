import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { uploadedFiles } from "@/lib/db/schema";

const ROOT_DIR = path.join(process.cwd(), "src", "uploaded");
const ALLOWED_IMAGE_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

export type UploadCategory =
  | "products"
  | "deposit-proof"
  | "withdraw-proof"
  | "profile-image"
  | "misc";

export type UploadVisibility = "private" | "public";

export type SaveUploadedFileInput = {
  file: File;
  category: UploadCategory;
  visibility?: UploadVisibility;
  ownerUserId?: string | null;
  createdBy?: string | null;
  productId?: number | null;
  depositId?: number | null;
  withdrawalId?: number | null;
  profileId?: string | null;
};

function categoryDir(category: UploadCategory) {
  switch (category) {
    case "products":
      return "products";
    case "deposit-proof":
      return "deposits";
    case "withdraw-proof":
      return "withdrawals";
    case "profile-image":
      return "profiles";
    default:
      return "misc";
  }
}

function extFromMime(mime: string) {
  switch (mime) {
    case "image/jpeg":
    case "image/jpg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "bin";
  }
}

function sanitizeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function ensureUploadDirectories() {
  await Promise.all(
    ["products", "deposits", "withdrawals", "profiles", "misc", "tmp"].map(
      (dir) => mkdir(path.join(ROOT_DIR, dir), { recursive: true }),
    ),
  );
}

export async function saveUploadedFile(input: SaveUploadedFileInput) {
  const visibility = input.visibility ?? "private";
  const file = input.file;

  if (file.size <= 0) {
    throw new Error("File kosong tidak dapat disimpan.");
  }

  const ext = extFromMime(file.type);
  const categoryPath = categoryDir(input.category);
  const storedName = `${Date.now()}-${randomUUID()}.${ext}`;
  const relativePath = path.posix.join(categoryPath, storedName);
  const absolutePath = path.join(ROOT_DIR, relativePath);

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const checksumSha256 = createHash("sha256").update(buffer).digest("hex");
  let disk: "local" | "db" = "local";
  let inlineDataBase64: string | null = null;

  // Coba tulis ke filesystem lokal. Di Vercel/serverless, filesystem read-only
  // sehingga mkdir/writeFile akan throw — fallback ke inline base64 DB.
  try {
    await ensureUploadDirectories();
    await writeFile(absolutePath, buffer);
  } catch (err) {
    console.warn(
      "[storage] filesystem tidak writable, fallback ke inline base64:",
      err instanceof Error ? err.message : err,
    );
    disk = "db";
    inlineDataBase64 = buffer.toString("base64");
  }

  const [row] = await db
    .insert(uploadedFiles)
    .values({
      disk,
      category: input.category,
      originalName: sanitizeName(file.name || storedName),
      storedName,
      relativePath,
      inlineDataBase64,
      mimeType: file.type || "application/octet-stream",
      extension: ext,
      sizeBytes: file.size,
      checksumSha256,
      visibility,
      ownerUserId: input.ownerUserId ?? null,
      createdBy: input.createdBy ?? null,
      productId: input.productId ?? null,
      depositId: input.depositId ?? null,
      withdrawalId: input.withdrawalId ?? null,
      profileId: input.profileId ?? null,
    })
    .returning({
      id: uploadedFiles.id,
      relativePath: uploadedFiles.relativePath,
      mimeType: uploadedFiles.mimeType,
      visibility: uploadedFiles.visibility,
    });

  return {
    ...row,
    url: buildUploadedFileUrl(row.id),
  };
}

export async function deleteUploadedFile(fileId: string) {
  const [row] = await db
    .select({
      id: uploadedFiles.id,
      disk: uploadedFiles.disk,
      relativePath: uploadedFiles.relativePath,
    })
    .from(uploadedFiles)
    .where(eq(uploadedFiles.id, fileId))
    .limit(1);

  if (!row) return;

  if (row.disk === "local") {
    const absolutePath = path.join(ROOT_DIR, row.relativePath);
    await rm(absolutePath, { force: true });
  }
  await db.delete(uploadedFiles).where(eq(uploadedFiles.id, fileId));
}

export async function deleteUploadedFileByUrl(url: string | null | undefined) {
  const fileId = extractUploadedFileId(url);
  if (!fileId) return;
  await deleteUploadedFile(fileId);
}

export function buildUploadedFileUrl(fileId: string) {
  return `/api/files/${fileId}`;
}

export function extractUploadedFileId(url: string | null | undefined) {
  if (!url) return null;
  const match = url.match(/\/api\/files\/([a-f0-9-]+)$/i);
  return match?.[1] ?? null;
}

export function isAllowedImageMime(mime: string) {
  return ALLOWED_IMAGE_MIME.has(mime);
}

export async function getUploadedFileRecord(fileId: string) {
  const [row] = await db
    .select()
    .from(uploadedFiles)
    .where(eq(uploadedFiles.id, fileId))
    .limit(1);
  return row ?? null;
}

export async function getUploadedFileBlob(fileId: string) {
  const row = await getUploadedFileRecord(fileId);
  if (!row) return null;

  if (row.disk === "db") {
    if (!row.inlineDataBase64) {
      return null;
    }

    const buffer = Buffer.from(row.inlineDataBase64, "base64");
    return {
      record: row,
      buffer,
      size: buffer.length,
      absolutePath: null,
    };
  }

  const absolutePath = path.join(ROOT_DIR, row.relativePath);
  const [buffer, info] = await Promise.all([readFile(absolutePath), stat(absolutePath)]);

  return {
    record: row,
    buffer,
    size: info.size,
    absolutePath,
  };
}

export async function attachUploadedFileToProduct(fileId: string, productId: number) {
  await db
    .update(uploadedFiles)
    .set({ productId, updatedAt: new Date() })
    .where(eq(uploadedFiles.id, fileId));
}

export async function attachUploadedFileToDeposit(fileId: string, depositId: number) {
  await db
    .update(uploadedFiles)
    .set({ depositId, updatedAt: new Date() })
    .where(eq(uploadedFiles.id, fileId));
}

export async function findUploadedFileByProduct(productId: number) {
  const [row] = await db
    .select()
    .from(uploadedFiles)
    .where(and(eq(uploadedFiles.productId, productId), eq(uploadedFiles.category, "products")))
    .limit(1);
  return row ?? null;
}
