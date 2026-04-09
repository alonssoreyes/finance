import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { signUpAction } from "@/actions/auth";

export default function SignUpPage() {
  return (
    <div className="glass-card w-full max-w-xl rounded-[2rem] p-6 sm:p-8">
      <p className="text-sm uppercase tracking-[0.24em] text-ink-muted">
        Nueva cuenta
      </p>
      <h1 className="mt-3 font-display text-4xl text-surface-strong">
        Configura tu espacio financiero
      </h1>
      <p className="mt-3 text-sm leading-6 text-ink-muted">
        La arquitectura ya queda lista para OAuth futuro, pero hoy puedes entrar con email y contraseña sin depender de servicios externos.
      </p>

      <div className="mt-8">
        <AuthForm
          action={signUpAction}
          submitLabel="Crear cuenta"
          includeName
          footer={
            <p className="text-sm text-ink-muted">
              ¿Ya tienes cuenta?{" "}
              <Link className="font-semibold text-surface-strong" href="/sign-in">
                Iniciar sesión
              </Link>
            </p>
          }
        />
      </div>
    </div>
  );
}
