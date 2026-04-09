"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

type Props = {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
};

export function FormSubmitButton({ children, variant, className }: Props) {
  const { pending } = useFormStatus();

  return (
    <Button className={className} variant={variant} isLoading={pending} type="submit">
      {children}
    </Button>
  );
}
