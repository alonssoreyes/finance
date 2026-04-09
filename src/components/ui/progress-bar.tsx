import { cn } from "@/lib/utils";

type Props = {
  value: number;
  tone?: "default" | "warning" | "danger";
};

export function ProgressBar({ value, tone = "default" }: Props) {
  const safe = Math.max(0, Math.min(100, value));

  return (
    <div className="h-2.5 overflow-hidden rounded-full bg-black/6">
      <div
        className={cn(
          "h-full rounded-full transition-all",
          tone === "default" && "bg-gradient-to-r from-accent to-[#6D8B74]",
          tone === "warning" && "bg-gradient-to-r from-accent-warm to-[#D1AE78]",
          tone === "danger" && "bg-gradient-to-r from-accent-danger to-[#C56F69]"
        )}
        style={{ width: `${safe}%` }}
      />
    </div>
  );
}
