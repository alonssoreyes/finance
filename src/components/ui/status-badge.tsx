import { cn } from "@/lib/utils";

type Props = {
  tone?: "default" | "positive" | "warning" | "danger" | "info";
  children: React.ReactNode;
};

export function StatusBadge({ tone = "default", children }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
        tone === "default" && "bg-black/5 text-surface-strong",
        tone === "positive" && "bg-accent-soft text-accent",
        tone === "warning" && "bg-[#DCF9F4] text-accent-warm",
        tone === "danger" && "bg-[#FDE7E6] text-accent-danger",
        tone === "info" && "bg-[#E8F3FF] text-[#1D4ED8]"
      )}
    >
      {children}
    </span>
  );
}
