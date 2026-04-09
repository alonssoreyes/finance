import { cn } from "@/lib/utils";

type Props = {
  value: number;
  tone?: "default" | "warning" | "danger" | "utilization";
};

export function ProgressBar({ value, tone = "default" }: Props) {
  const safe = Math.max(0, Math.min(100, value));
  const utilizationHue = Math.max(4, 52 - safe * 0.48);
  const utilizationEndHue = Math.max(0, utilizationHue - 10);
  const utilizationStyle =
    tone === "utilization"
      ? {
          backgroundImage: `linear-gradient(90deg, hsl(${utilizationHue} 92% 58%), hsl(${utilizationEndHue} 90% 54%))`
        }
      : undefined;

  return (
    <div className="h-2.5 overflow-hidden rounded-full bg-black/6">
      <div
        className={cn(
          "h-full rounded-full transition-all",
          tone === "default" && "bg-gradient-to-r from-accent to-[#14C8B2]",
          tone === "warning" && "bg-gradient-to-r from-accent-warm to-[#66E2D5]",
          tone === "danger" && "bg-gradient-to-r from-accent-danger to-[#FF8E87]"
        )}
        style={{ width: `${safe}%`, ...utilizationStyle }}
      />
    </div>
  );
}
