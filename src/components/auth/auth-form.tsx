"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  action: (
    state: { error?: string },
    formData: FormData
  ) => Promise<{ error?: string }>;
  submitLabel: string;
  footer?: React.ReactNode;
  includeName?: boolean;
};

export function AuthForm({
  action,
  submitLabel,
  footer,
  includeName = false
}: Props) {
  const [state, formAction, isPending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-4">
      {includeName ? <Input name="name" label="Nombre" placeholder="Tu nombre" /> : null}
      <Input name="email" type="email" label="Email" placeholder="tu@email.com" />
      <Input name="password" type="password" label="Contraseña" placeholder="••••••••" />

      {state.error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <Button className="w-full" isLoading={isPending} type="submit">
        {submitLabel}
      </Button>
      {footer}
    </form>
  );
}
