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

export function SidebarNav({ items }: { items: Item[] }) {
  const pathname = usePathname();

  return (
    <nav className="mt-8 space-y-1">
      {items.map((item) => {
        const active = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center justify-between rounded-[1.2rem] px-4 py-3 text-sm font-medium text-ink-muted transition",
              active && "bg-surface-muted text-surface-strong"
            )}
          >
            <span>{item.label}</span>
            <span
              aria-hidden="true"
              className={cn(
                "h-2.5 w-2.5 rounded-full bg-transparent transition",
                active && "bg-accent"
              )}
            />
          </Link>
        );
      })}
    </nav>
  );
}
