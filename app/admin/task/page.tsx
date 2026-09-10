import { desc, eq, inArray, sql } from "drizzle-orm";
import { redirect } from "next/navigation";

import { getScope } from "@/lib/access";
import { db } from "@/lib/db";
import { products, profiles, taskRequests, tasks } from "@/lib/db/schema";
import { type Level } from "@/lib/levels";
import { getCurrentProfile } from "@/lib/auth/session";

import { TasksTable } from "./_components/tasks-table";

export default async function AdminTaskPage() {
  // Identifikasi admin yang login
  const profile = await getCurrentProfile();
  if (!profile || profile.role === "member") redirect("/admin/login");

  const scope = await getScope(profile.id);
  // memberIds null = unrestricted (super admin). [] = no access.
  const memberIds = scope?.memberIds ?? null;
  const unrestricted = scope?.unrestricted ?? false;

  // Query tugas nyata + request pending dengan filter scope
  const taskWhere = unrestricted
    ? undefined
    : memberIds && memberIds.length > 0
      ? inArray(tasks.memberId, memberIds)
      : eq(tasks.memberId, "00000000-0000-0000-0000-000000000000");

  const requestWhere = unrestricted
    ? undefined
    : memberIds && memberIds.length > 0
      ? inArray(taskRequests.memberId, memberIds)
      : eq(taskRequests.memberId, "00000000-0000-0000-0000-000000000000");

  const memberRowsPromise = unrestricted
    ? db
        .select({
          id: profiles.id,
          username: profiles.username,
          level: profiles.level,
          status: profiles.status,
        })
        .from(profiles)
        .where(eq(profiles.role, "member"))
        .orderBy(profiles.username)
    : memberIds && memberIds.length > 0
      ? db
          .select({
            id: profiles.id,
            username: profiles.username,
            level: profiles.level,
            status: profiles.status,
          })
          .from(profiles)
          .where(inArray(profiles.id, memberIds))
          .orderBy(profiles.username)
      : Promise.resolve([] as {
          id: string;
          username: string;
          level: Level;
          status: string;
        }[]);

  const productRowsPromise = db
    .select({
      id: products.id,
      name: products.name,
      price: products.price,
      imageUrl: products.imageUrl,
      isActive: products.isActive,
    })
    .from(products)
    .orderBy(products.name);

  const baseTaskQuery = db
    .select({
      id: tasks.id,
      kind: sql<"task">`'task'`,
      memberId: tasks.memberId,
      productId: tasks.productId,
      price: tasks.price,
      commission: tasks.commission,
      status: tasks.status,
      queue: tasks.queue,
      createdAt: tasks.createdAt,
      completedAt: tasks.completedAt,
      memberUsername: profiles.username,
      memberBalance: profiles.balance,
      productName: products.name,
    })
    .from(tasks)
    .leftJoin(profiles, eq(tasks.memberId, profiles.id))
    .leftJoin(products, eq(tasks.productId, products.id));

  const baseRequestQuery = db
    .select({
      id: taskRequests.id,
      kind: sql<"request">`'request'`,
      memberId: taskRequests.memberId,
      productId: sql<number | null>`NULL`,
      price: sql<string>`'0'`,
      commission: sql<string>`'0'`,
      status: sql<string>`'menunggu'`,
      queue: sql<number | null>`NULL`,
      createdAt: taskRequests.createdAt,
      completedAt: sql<Date | null>`NULL`,
      memberUsername: profiles.username,
      memberBalance: profiles.balance,
      productName: sql<string | null>`NULL`,
    })
    .from(taskRequests)
    .leftJoin(profiles, eq(taskRequests.memberId, profiles.id));

  const [memberRows, productRows, taskRows, requestRows] = await Promise.all([
    memberRowsPromise,
    productRowsPromise,
    taskWhere
      ? baseTaskQuery.where(taskWhere).orderBy(desc(tasks.createdAt))
      : baseTaskQuery.orderBy(desc(tasks.createdAt)),
    requestWhere
      ? baseRequestQuery.where(requestWhere).orderBy(desc(taskRequests.requestedAt))
      : baseRequestQuery.orderBy(desc(taskRequests.requestedAt)),
  ]);

  const allRows = [...requestRows, ...taskRows];

  // Hitung nomor urut kronologis per member (gabungan task + request).
  // 1 = baris paling lama milik member tsb. Pengurutan ASC agar counter naik
  // sesuai urutan waktu dibuat; tie-breaker id agar deterministik.
  const keByRowKey = new Map<string, number>();
  {
    const sortedAsc = [...allRows].sort((a, b) => {
      const dt = a.createdAt.getTime() - b.createdAt.getTime();
      if (dt !== 0) return dt;
      return a.kind === b.kind
        ? a.id - b.id
        : a.kind.localeCompare(b.kind);
    });
    const counters = new Map<string, number>();
    for (const r of sortedAsc) {
      const next = (counters.get(r.memberId) ?? 0) + 1;
      counters.set(r.memberId, next);
      keByRowKey.set(`${r.kind}-${r.id}`, next);
    }
  }

  const rows = allRows
    .map((r) => ({ ...r, ke: keByRowKey.get(`${r.kind}-${r.id}`) ?? 0 }))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-4 sm:space-y-5 sm:py-5">
      <TasksTable
        initialTasks={rows.map((r) => ({
          id: r.id,
          kind: r.kind,
          memberId: r.memberId,
          memberUsername: r.memberUsername ?? "(user dihapus)",
          memberBalance: String(r.memberBalance ?? "0"),
          productName: r.productName,
          price: r.price,
          commission: r.commission,
          status: r.status,
          queue: r.queue,
          createdAt: r.createdAt.toISOString(),
          productId: r.productId,
          ke: r.ke,
        }))}
        members={memberRows.map((m) => ({
          id: m.id,
          username: m.username,
          level: m.level,
          status: m.status,
        }))}
        products={productRows.map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          imageUrl: p.imageUrl,
          isActive: p.isActive,
        }))}
      />
    </div>
  );
}
