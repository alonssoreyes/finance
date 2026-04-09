import { cn } from "@/lib/utils";

type Props = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
};

export function Select({ label, className, children, ...props }: Props) {
  return (
    <label className="grid min-w-0 gap-2">
      <span className="text-sm font-medium text-surface-strong">{label}</span>
      <select
        className={cn(
          "h-12 w-full min-w-0 rounded-2xl border border-black/8 bg-white/70 px-4 text-surface-strong outline-none transition focus:border-accent",
          className
        )}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}
