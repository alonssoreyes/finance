"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type Item = {
  href: Route;
  label: string;
  iconKey: string;
};

export function BottomNav({ items }: { items: Item[] }) {
  const pathname = usePathname();

  return (
    <nav className="glass-card fixed inset-x-3 bottom-3 z-50 rounded-[1.7rem] px-2 py-2 md:hidden">
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center rounded-[1.2rem] px-2 py-2 text-[11px] font-medium text-ink-muted transition",
                active && "bg-surface-muted text-surface-strong"
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "mb-1 h-1.5 w-6 rounded-full bg-black/8 transition",
                  active && "bg-accent"
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
