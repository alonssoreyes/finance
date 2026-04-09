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
        tone === "warning" && "bg-[#F3E7D7] text-accent-warm",
        tone === "danger" && "bg-[#F0DEDC] text-accent-danger",
        tone === "info" && "bg-[#E4EBF2] text-[#43617A]"
      )}
    >
      {children}
    </span>
  );
}
