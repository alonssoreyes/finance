import type { Route } from "next";
import { Bell } from "lucide-react";
import { signOutAction } from "@/actions/auth";
import { BottomNav } from "@/components/layout/bottom-nav";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/ui/logo-mark";

const navItems: Array<{
  href: Route;
  label: string;
  iconKey:
    | "dashboard"
    | "transactions"
    | "accounts"
    | "debts"
    | "goals"
    | "plannedPurchases"
    | "settings";
}> = [
  { href: "/dashboard", label: "Dashboard", iconKey: "dashboard" },
  { href: "/transactions", label: "Movs", iconKey: "transactions" },
  { href: "/accounts", label: "Cuentas", iconKey: "accounts" },
  { href: "/debts", label: "Deudas", iconKey: "debts" },
  { href: "/goals", label: "Metas", iconKey: "goals" },
  { href: "/planned-purchases", label: "Compras", iconKey: "plannedPurchases" },
  { href: "/settings", label: "Ajustes", iconKey: "settings" }
];

type Props = {
  user: {
    id: string;
    name: string;
    email: string;
  };
  children: React.ReactNode;
};

export function AppShell({ user, children }: Props) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1600px] gap-6 px-3 pb-24 pt-3 md:px-6 md:pb-10 md:pt-6">
      <aside className="hidden w-[280px] shrink-0 md:block">
        <div className="glass-card sticky top-6 flex min-h-[calc(100vh-3rem)] flex-col rounded-[2rem] p-5">
          <div className="flex items-center gap-3">
            <LogoMark />
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-ink-muted">
                Gastos App
              </p>
              <p className="text-sm text-ink-muted">Control y proyección</p>
            </div>
          </div>

          <SidebarNav items={navItems} />

          <div className="mt-auto rounded-[1.5rem] border border-black/5 bg-white/70 p-4">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted text-surface-strong">
                {user.name.slice(0, 1)}
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-surface-strong">{user.name}</p>
                <p className="truncate text-sm text-ink-muted">{user.email}</p>
              </div>
            </div>
            <form action={signOutAction}>
              <Button className="w-full" variant="secondary" type="submit">
                Cerrar sesión
              </Button>
            </form>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="glass-card mb-6 flex items-center justify-between rounded-[1.6rem] px-4 py-4 md:px-6">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-ink-muted">
              Resumen diario
            </p>
            <h1 className="mt-1 font-display text-2xl text-surface-strong">
              Hola, {user.name.split(" ")[0]}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative flex h-11 w-11 items-center justify-center rounded-full border border-black/5 bg-white/70 text-surface-strong">
              <Bell className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main>{children}</main>
      </div>

      <BottomNav items={navItems} />
    </div>
  );
}
