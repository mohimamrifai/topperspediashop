export const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin_leader: "Admin Leader",
  admin_staff: "Admin Staff",
};

export default function RoleBadge({ role }: { role: string }) {
  const map: Record<string, string> = {
    super_admin: "bg-purple-100 text-purple-700",
    admin_leader: "bg-indigo-100 text-indigo-700",
    admin_staff: "bg-sky-100 text-sky-700",
  };
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide sm:text-[11px] ${
        map[role] ?? "bg-zinc-100 text-zinc-700"
      }`}
    >
      {ROLE_LABELS[role] ?? role}
    </span>
  );
}