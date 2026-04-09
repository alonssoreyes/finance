import { cn } from "@/lib/utils";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
  isLoading?: boolean;
};

export function Button({
  className,
  variant = "primary",
  isLoading = false,
  children,
  ...props
}: Props) {
  return (
    <button
      className={cn(
        "inline-flex h-12 items-center justify-center rounded-full px-5 text-sm font-semibold transition",
        variant === "primary" && "bg-surface-strong text-white hover:opacity-95",
        variant === "secondary" && "border border-black/8 bg-white/70 text-surface-strong",
        className
      )}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? "Procesando..." : children}
    </button>
  );
}
