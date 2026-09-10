import type { NextRequest } from "next/server";

import { eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { getUploadedFileBlob } from "@/lib/storage/local-storage";

async function canAccessFile(
  request: NextRequest,
  ownerUserId: string | null,
  visibility: string,
) {
  if (visibility === "public") {
    return true;
  }

  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return false;
  }

  if (ownerUserId && ownerUserId === session.user.id) {
    return true;
  }

  const [profile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, session.user.id))
    .limit(1);

  return Boolean(profile && profile.role !== "member");
}

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ fileId: string }> },
) {
  const { fileId } = await ctx.params;
  const file = await getUploadedFileBlob(fileId);

  if (!file) {
    return new Response("File tidak ditemukan.", { status: 404 });
  }

  const allowed = await canAccessFile(
    request,
    file.record.ownerUserId ?? null,
    file.record.visibility,
  );
  if (!allowed) {
    return new Response("Forbidden", { status: 403 });
  }

  return new Response(file.buffer, {
    status: 200,
    headers: {
      "Content-Type": file.record.mimeType,
      "Content-Length": String(file.size),
      "Cache-Control":
        file.record.visibility === "public"
          ? "public, max-age=31536000, immutable"
          : "private, no-store",
      "Content-Disposition": `inline; filename="${file.record.storedName}"`,
    },
  });
}
