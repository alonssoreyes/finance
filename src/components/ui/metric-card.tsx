import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: string;
  helper: string;
  tone?: "default" | "positive" | "warning" | "danger";
};

export function MetricCard({
  label,
  value,
  helper,
  tone = "default"
}: Props) {
  return (
    <div className="glass-card rounded-[1.75rem] p-5">
      <p className="text-sm text-ink-muted">{label}</p>
      <p
        className={cn(
          "mt-3 text-3xl font-semibold tracking-tight text-surface-strong",
          tone === "positive" && "text-accent",
          tone === "warning" && "text-accent-warm",
          tone === "danger" && "text-accent-danger"
        )}
      >
        {value}
      </p>
      <p className="mt-2 text-sm leading-6 text-ink-muted">{helper}</p>
    </div>
  );
}
