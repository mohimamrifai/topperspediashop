import { asc, gte } from "drizzle-orm";

import { getScope } from "@/lib/access";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";
import { shouldDeliverRealtimeEvent } from "@/lib/realtime/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function sleep(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    const timeout = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timeout);
        resolve();
      },
      { once: true },
    );
  });
}

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const scope = await getScope(session.user.id);
  if (!scope) {
    return new Response("Forbidden", { status: 403 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: unknown) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(payload)}\n\n`),
        );
      };

      let since = new Date(Date.now() - 5_000);
      const seenIds = new Set<string>();

      send({ type: "ready", at: new Date().toISOString() });

      while (!request.signal.aborted) {
        const rows = await db
          .select({
            id: auditLogs.id,
            action: auditLogs.action,
            actorId: auditLogs.actorId,
            targetId: auditLogs.targetId,
            createdAt: auditLogs.createdAt,
          })
          .from(auditLogs)
          .where(gte(auditLogs.createdAt, since))
          .orderBy(asc(auditLogs.createdAt));

        for (const row of rows) {
          if (seenIds.has(row.id)) continue;
          seenIds.add(row.id);

          if (seenIds.size > 200) {
            const firstId = seenIds.values().next().value;
            if (firstId) seenIds.delete(firstId);
          }

          if (!shouldDeliverRealtimeEvent(scope, row)) continue;

          send({
            type: "audit",
            id: row.id,
            action: row.action,
            createdAt: row.createdAt.toISOString(),
          });
        }

        if (rows.length > 0) {
          since = rows[rows.length - 1].createdAt;
        }

        await sleep(1_500, request.signal);
      }

      controller.close();
    },
    cancel() {},
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
