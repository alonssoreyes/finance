import { cn } from "@/lib/utils";

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
};

export function Textarea({ label, className, ...props }: Props) {
  return (
    <label className="grid min-w-0 gap-2">
      <span className="text-sm font-medium text-surface-strong">{label}</span>
      <textarea
        className={cn(
          "min-h-28 w-full min-w-0 rounded-2xl border border-black/8 bg-white/70 px-4 py-3 text-surface-strong outline-none transition focus:border-accent",
          className
        )}
        {...props}
      />
    </label>
  );
}
