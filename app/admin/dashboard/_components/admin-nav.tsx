"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ChevronDown,
  ClipboardList,
  CreditCard,
  Globe,
  Headphones,
  KeyRound,
  Landmark,
  LayoutDashboard,
  Menu,
  Package,
  Percent,
  ScrollText,
  UserCog,
  Users,
  Users2,
  X,
} from "lucide-react";

import { AdminLogoutButton } from "../../_components/admin-logout-button";

type Item = {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  superAdminOnly?: boolean;
  leaderOrSuperOnly?: boolean;
  /**
   * Butuh izin `channelCrud` di access_overrides (untuk admin leader/staff).
   * Super Admin otomatis lolos.
   */
  requiresChannelCrud?: boolean;
  /**
   * Butuh izin `depositBankCrud` di access_overrides (khusus admin leader).
   * Super Admin otomatis lolos.
   */
  requiresDepositBankCrud?: boolean;
};

type Section = {
  title: string;
  items: Item[];
};

// Susunan menu dikelompokan untuk mengurangi panjang list dan menambah kejelasan peran.
const sections: Section[] = [
  {
    title: "Ringkasan",
    items: [
      { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "Operasional",
    items: [
      { label: "Tugas", href: "/admin/task", icon: ClipboardList },
      { label: "Deposit", href: "/admin/rechargelist", icon: ArrowDownToLine },
      {
        label: "Penarikan",
        href: "/admin/withdrawlist",
        icon: ArrowUpFromLine,
      },
    ],
  },
  {
    title: "Keuangan",
    items: [
      { label: "Rekening", href: "/admin/account", icon: CreditCard },
      {
        label: "Tujuan Deposit",
        href: "/admin/deposit-bank",
        icon: Landmark,
        requiresDepositBankCrud: true,
      },
    ],
  },
  {
    title: "Tim & Komisi",
    items: [
      { label: "Tim", href: "/admin/team", icon: Users, leaderOrSuperOnly: true },
      {
        label: "Semua Staff",
        href: "/admin/staff",
        icon: UserCog,
        leaderOrSuperOnly: true,
      },
      {
        label: "Komisi",
        href: "/admin/commission",
        icon: Percent,
        leaderOrSuperOnly: true,
      },
      {
        label: "Izin Akses",
        href: "/admin/permissions",
        icon: KeyRound,
        superAdminOnly: true,
      },
    ],
  },
  {
    title: "Master Data",
    items: [
      { label: "Anggota", href: "/admin/users", icon: Users2 },
      { label: "Cek IP Member", href: "/admin/member-ip", icon: Globe },
      { label: "Produk", href: "/admin/product", icon: Package },
      {
        label: "Pelayanan",
        href: "/admin/pelayanan",
        icon: Headphones,
        requiresChannelCrud: true,
      },
    ],
  },
  {
    title: "Audit",
    items: [
      {
        label: "Audit Log",
        href: "/admin/audit-logs",
        icon: ScrollText,
        superAdminOnly: true,
      },
    ],
  },
];

type Props = {
  isSuperAdmin?: boolean;
  isLeader?: boolean;
  canManageChannels?: boolean;
  canManageDepositBankCrud?: boolean;
};

export function AdminNav({
  isSuperAdmin = false,
  isLeader = false,
  canManageChannels = false,
  canManageDepositBankCrud = false,
}: Props) {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Hitung section yang visible (semua item di section harus lewat filter akses)
  const visibleSections = useMemo(() => {
    return sections
      .map((s) => ({
        ...s,
        items: s.items.filter((i) => {
          if (i.superAdminOnly && !isSuperAdmin) return false;
          if (i.leaderOrSuperOnly && !isSuperAdmin && !isLeader) return false;
          if (i.requiresChannelCrud && !canManageChannels) return false;
          if (i.requiresDepositBankCrud && !canManageDepositBankCrud) {
            return false;
          }
          return true;
        }),
      }))
      .filter((s) => s.items.length > 0);
  }, [isSuperAdmin, isLeader, canManageChannels, canManageDepositBankCrud]);

  // Tentukan href yang sedang aktif (match persis atau prefix nested).
  // Digunakan untuk highlight link & buka otomatis section berisi halaman aktif.
  const activeHref = useMemo(() => {
    const allHrefs = sections.flatMap((s) => s.items.map((i) => i.href));
    if (allHrefs.includes(pathname)) return pathname;
    const sorted = [...new Set(allHrefs)].sort((a, b) => b.length - a.length);
    for (const href of sorted) {
      if (pathname.startsWith(href + "/")) return href;
    }
    return "";
  }, [pathname]);

  // Label item yang sedang aktif (untuk header mobile).
  const activeLabel = useMemo(() => {
    if (!activeHref) return "Admin";
    const found = sections
      .flatMap((s) => s.items)
      .find((i) => i.href === activeHref);
    return found?.label ?? "Admin";
  }, [activeHref]);

  // Buka section yang berisi halaman aktif; tutup section lainnya (accordion).
  useEffect(() => {
    if (!activeHref) return;
    const activeSection = visibleSections.find((s) =>
      s.items.some((i) => i.href === activeHref),
    );
    if (!activeSection) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setExpandedSection(activeSection.title);
  }, [activeHref, visibleSections]);

  // Tutup drawer mobile saat route berubah
  useEffect(() => {
    if (open)
      // Tutup drawer saat route aktif berubah; side effect terhadap route change.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeHref]);

  // Tutup drawer saat klik di luar (mobile)
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-admin-nav-drawer]")) {
        setOpen(false);
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [open]);

  const toggleSection = (title: string) => {
    setExpandedSection((current) => (current === title ? null : title));
  };

  return (
    <>
      {/* === Top bar (mobile only) === */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-700 bg-slate-800 px-3 py-2.5 text-slate-300 sm:hidden">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Tutup menu" : "Buka menu"}
          aria-expanded={open}
          className="rounded-md p-1.5 transition hover:bg-slate-700 hover:text-white"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
        <span className="text-sm font-semibold text-white">
          {activeLabel}
        </span>
        <AdminLogoutButton variant="icon" />
      </header>

      {/* === Drawer (mobile) === */}
      <div
        data-admin-nav-drawer
        className={`fixed inset-y-0 left-0 z-40 w-72 max-w-[85vw] transform border-r border-slate-700 bg-slate-800 text-slate-300 transition-transform duration-200 sm:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!open}
      >
        <SidebarContent
          visibleSections={visibleSections}
          activeHref={activeHref}
          expandedSection={expandedSection}
          toggleSection={toggleSection}
        />
      </div>

      {/* Backdrop (mobile) */}
      {open && (
        <button
          type="button"
          aria-label="Tutup menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/50 sm:hidden"
        />
      )}

      {/* === Sidebar (desktop, fixed) === */}
      <aside className="fixed left-0 top-0 z-20 hidden h-screen w-60 shrink-0 border-r border-slate-700 bg-slate-800 text-slate-300 sm:block">
        <SidebarContent
          visibleSections={visibleSections}
          activeHref={activeHref}
          expandedSection={expandedSection}
          toggleSection={toggleSection}
        />
      </aside>
    </>
  );
}

function SidebarContent({
  visibleSections,
  activeHref,
  expandedSection,
  toggleSection,
}: {
  visibleSections: Section[];
  activeHref: string;
  expandedSection: string | null;
  toggleSection: (title: string) => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-slate-700 px-4 py-3.5">
        <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
          <LayoutDashboard className="size-3.5" />
        </div>
        <span className="text-sm font-bold tracking-tight text-white">
          TopperspediaShop
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-2.5 py-3">
        {visibleSections.map((section, idx) => {
          const isCollapsible = section.items.length > 1;
          const isExpanded =
            !isCollapsible || expandedSection === section.title;
          const isActiveInSection = section.items.some(
            (i) => i.href === activeHref,
          );
          return (
            <div
              key={section.title}
              className={idx === 0 ? "" : "mt-4"}
            >
              {isCollapsible ? (
                <button
                  type="button"
                  onClick={() => toggleSection(section.title)}
                  aria-expanded={isExpanded}
                  className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition hover:text-white ${
                    isActiveInSection ? "text-white" : "text-slate-400"
                  }`}
                >
                  <span>{section.title}</span>
                  <ChevronDown
                    className={`size-3.5 transition-transform duration-200 ${
                      isExpanded ? "rotate-0" : "-rotate-90"
                    }`}
                  />
                </button>
              ) : (
                <div className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  {section.title}
                </div>
              )}

              {isExpanded && (
                <ul className="mt-0.5 space-y-0.5">
                  {section.items.map(({ label, href, icon: Icon }) => {
                    const isActive = href === activeHref;
                    return (
                      <li key={label}>
                        <Link
                          href={href}
                          aria-current={isActive ? "page" : undefined}
                          className={`flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition ${
                            isActive
                              ? "bg-indigo-600 font-medium text-white shadow-sm"
                              : "text-slate-300 hover:bg-slate-700/60 hover:text-white"
                          }`}
                        >
                          <Icon className="size-4 shrink-0" />
                          <span className="truncate">{label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-slate-700 p-2.5">
        <AdminLogoutButton className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm font-medium text-slate-300 transition hover:bg-rose-600/20 hover:text-rose-300" />
      </div>
    </div>
  );
}
