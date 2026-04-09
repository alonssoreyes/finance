import type { Route } from "next";
import Link from "next/link";
import { LoansManager } from "@/components/forms/loans-manager";
import { DebtAcceleratorSimulator } from "@/components/simulators/debt-accelerator-simulator";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/progress-bar";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { requireUser } from "@/lib/auth";
import { getDebtsPageData } from "@/server/dashboard";
import { getLoansManagementData } from "@/server/management";

export const dynamic = "force-dynamic";

export default async function DebtsPage() {
  const user = await requireUser();
  const [data, management] = await Promise.all([
    getDebtsPageData(user.id),
    getLoansManagementData(user.id)
  ]);
  const getTone = (severity: string) => {
    if (severity === "CRITICAL") return "danger";
    if (severity === "WARNING") return "warning";
    if (severity === "POSITIVE") return "positive";
    return "info";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Deudas y préstamos"
        description="Cuánto debes, qué toca pagar y cuál deuda conviene atacar primero."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SectionCard title="Deuda total" description={formatCurrency(data.totalDebt)}>
          <p className="text-sm leading-6 text-ink-muted">Incluye tarjetas, préstamo personal y carga MSI pendiente.</p>
        </SectionCard>
        <SectionCard title="Pago del mes" description={formatCurrency(data.requiredThisMonth)}>
          <p className="text-sm leading-6 text-ink-muted">Solo obligaciones de deuda que vencen en el mes actual según sus fechas reales.</p>
        </SectionCard>
        <SectionCard title="Mínimos tarjeta" description={formatCurrency(data.minimumDueAmount)}>
          <p className="text-sm leading-6 text-ink-muted">Suma de mínimos de tarjetas cuyo vencimiento cae este mes.</p>
        </SectionCard>
        <SectionCard title="Pago para no generar intereses" description={formatCurrency(data.noInterestAmount)}>
          <p className="text-sm leading-6 text-ink-muted">Suma de pagos vigentes para no generar intereses con vencimiento este mes.</p>
        </SectionCard>
        <SectionCard title="Meses para salir" description={`${data.monthsToFreedom} meses`}>
          <p className="text-sm leading-6 text-ink-muted">Estimación base usando tu servicio mensual de deuda proyectado.</p>
        </SectionCard>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <SectionCard title="Prioridad de ataque" description={`Estrategia actual: ${data.strategy}`}>
          <div className="space-y-3">
            {data.recommendedOrder.map((item, index) => (
              <div key={item.name} className="rounded-2xl border border-black/5 bg-white/70 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-ink-soft">#{index + 1}</p>
                    <p className="font-semibold text-surface-strong">{item.name}</p>
                  </div>
                  <StatusBadge tone={index === 0 ? "danger" : "default"}>{item.reason}</StatusBadge>
                </div>
                <p className="mt-2 text-sm leading-6 text-ink-muted">{item.explanation}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Detalle por deuda" description="Progreso visual y meses restantes">
          <div className="space-y-4">
            {data.items.map((item) => (
              <div key={item.id} className="rounded-2xl border border-black/5 bg-white/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-surface-strong">{item.name}</p>
                    <p className="text-sm text-ink-muted">{item.helper}</p>
                  </div>
                  <Link className="text-sm font-semibold text-surface-strong" href={item.href as Route}>
                    Ver detalle
                  </Link>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm text-ink-muted">
                    <span>Saldo actual</span>
                    <span>{formatCurrency(item.balance)}</span>
                  </div>
                  <ProgressBar value={item.progressPct} tone="danger" />
                  <p className="text-xs uppercase tracking-[0.18em] text-ink-soft">
                    {item.monthsLeft} meses restantes estimados
                  </p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>

      <SectionCard title="Calendario de deuda" description="Próximos pagos de tarjetas, préstamos y MSI">
        {data.paymentSchedule.length ? (
          <div className="space-y-3">
            {data.paymentSchedule.map((payment) => (
              <div key={`${payment.title}-${payment.dueDate}-${payment.kind}`} className="flex items-center justify-between rounded-2xl border border-black/5 bg-white/70 px-4 py-3">
                <div>
                  <p className="font-medium text-surface-strong">{payment.title}</p>
                  <p className="text-sm text-ink-muted">{formatDate(payment.dueDate)}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-surface-strong">{formatCurrency(payment.amount)}</p>
                  <p className="text-xs uppercase tracking-[0.18em] text-ink-soft">{payment.kind}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Sin pagos próximos"
            description="Cuando existan vencimientos de tarjetas, préstamos o MSI, aparecerán aquí."
          />
        )}
      </SectionCard>

      <SectionCard title="Simulador de pago extra" description="Cuánto aceleras la salida si atacas una deuda hoy">
        <DebtAcceleratorSimulator debts={data.simulatorContext.debts} />
      </SectionCard>

      <SectionCard title="Señales de deuda" description="Alertas que afectan costo financiero o presión de pago">
        {data.alerts.length ? (
          <div className="space-y-3">
            {data.alerts.map((alert) => (
              <div key={`${alert.title}-${alert.message}`} className="rounded-2xl border border-black/5 bg-white/70 p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="font-semibold text-surface-strong">{alert.title}</p>
                  <StatusBadge tone={getTone(alert.severity)}>{alert.severity}</StatusBadge>
                </div>
                <p className="text-sm leading-6 text-ink-muted">{alert.message}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Sin alertas de deuda"
            description="Cuando se concentren pagos o suba demasiado la presión por saldo, se mostrará aquí."
          />
        )}
      </SectionCard>

      <LoansManager items={management.items} />
    </div>
  );
}
