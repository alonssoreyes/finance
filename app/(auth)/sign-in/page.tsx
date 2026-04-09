import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { signInAction } from "@/actions/auth";

export default function SignInPage() {
  return (
    <div className="grid w-full max-w-5xl gap-10 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="hidden rounded-[2rem] border border-white/60 bg-[radial-gradient(circle_at_top_left,_rgba(16,152,247,0.22),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(20,200,178,0.18),_transparent_28%),linear-gradient(160deg,_rgba(255,255,255,0.96),_rgba(231,239,248,0.9))] p-10 shadow-card lg:block">
        <div className="flex h-full flex-col justify-between">
          <div>
            <p className="mb-3 text-sm uppercase tracking-[0.24em] text-ink-muted">
              Pennywise
            </p>
            <h1 className="max-w-xl text-5xl font-semibold leading-tight tracking-[-0.05em] text-surface-strong">
              A sharper way to manage cards, debt and forward cash flow.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-ink-muted">
              Built for real personal finance: statement dates, installment purchases, savings goals and purchase decisions with context.
            </p>
          </div>

          <div className="grid gap-3 rounded-[1.5rem] border border-black/5 bg-white/70 p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-ink-muted">Disponible estimado</span>
              <span className="font-semibold text-accent">$60,750</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-ink-muted">Carga fija + deuda</span>
              <span className="font-semibold text-surface-strong">61% próxima quincena</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-black/5">
              <div className="h-full w-[61%] rounded-full bg-gradient-to-r from-accent to-accent-warm" />
            </div>
          </div>
        </div>
      </section>

      <section className="glass-card rounded-[2rem] p-6 sm:p-8">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.24em] text-ink-muted">
            Acceso
          </p>
          <h2 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-surface-strong">
            Inicia sesión
          </h2>
          <p className="mt-3 text-sm leading-6 text-ink-muted">
            Demo incluida: <span className="font-semibold">demo@pennywise.local</span> /{" "}
            <span className="font-semibold">Demo12345!</span>
          </p>
        </div>

        <AuthForm
          action={signInAction}
          submitLabel="Entrar"
          footer={
            <p className="text-sm text-ink-muted">
              ¿Primera vez?{" "}
              <Link className="font-semibold text-surface-strong" href="/sign-up">
                Crear cuenta
              </Link>
            </p>
          }
        />
      </section>
    </div>
  );
}
