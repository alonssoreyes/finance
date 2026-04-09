import { BudgetUsageChart } from "@/components/charts/budget-usage-chart";
import { ProjectionChart } from "@/components/charts/projection-chart";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/progress-bar";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatMonthLabel } from "@/lib/format";
import { requireUser } from "@/lib/auth";
import { getDashboardData } from "@/server/dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const data = await getDashboardData(user.id);
  const getTone = (severity: string) => {
    if (severity === "CRITICAL") return "danger";
    if (severity === "WARNING") return "warning";
    if (severity === "POSITIVE") return "positive";
    return "info";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Visión financiera clara para deuda, flujo, metas y decisiones próximas."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Saldo disponible estimado" value={formatCurrency(data.availableBalance)} helper="Efectivo + cuentas líquidas" tone="default" />
        <MetricCard label="Ingresos del mes" value={formatCurrency(data.monthIncome)} helper="Comparado contra tus gastos reales" tone="positive" />
        <MetricCard label="Gastos del mes" value={formatCurrency(data.monthExpense)} helper={`${data.expenseVsIncomePct.toFixed(0)}% del ingreso mensual`} tone="warning" />
        <MetricCard label="Deuda total actual" value={formatCurrency(data.totalDebt)} helper={`${formatCurrency(data.requiredThisMonth)} comprometidos este mes`} tone="danger" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <SectionCard title="Flujo proyectado" description="Compromisos visibles para 3 meses">
          <ProjectionChart data={data.projection.slice(0, 3)} />
        </SectionCard>

        <SectionCard title="Alertas e inteligencia" description="Reglas locales y señales accionables">
          <div className="space-y-3">
            {data.alerts.length > 0 ? (
              data.alerts.map((alert) => (
                <div key={alert.title} className="rounded-2xl border border-black/5 bg-white/70 p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="font-semibold text-surface-strong">{alert.title}</p>
                    <StatusBadge tone={getTone(alert.severity)}>{alert.severity}</StatusBadge>
                  </div>
                  <p className="text-sm leading-6 text-ink-muted">{alert.message}</p>
                </div>
              ))
            ) : (
              <EmptyState
                title="Sin alertas críticas"
                description="Cuando aparezcan riesgos de flujo, presupuesto o metas, se mostrarán aquí."
              />
            )}
          </div>
        </SectionCard>
      </section>

      <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <SectionCard title="Metas de ahorro" description="Motivación visual con proyección">
          <div className="space-y-4">
            {data.goalProgress.map((goal) => (
              <div key={goal.name} className="space-y-2 rounded-2xl border border-black/5 bg-white/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-surface-strong">{goal.name}</p>
                    <p className="text-sm text-ink-muted">
                      {formatCurrency(goal.current)} de {formatCurrency(goal.target)}
                    </p>
                  </div>
                  <StatusBadge tone={goal.onTrack ? "positive" : "warning"}>
                    {goal.onTrack ? "En ritmo" : "Atrasada"}
                  </StatusBadge>
                </div>
                <ProgressBar value={goal.progressPct} />
                <p className="text-xs uppercase tracking-[0.18em] text-ink-soft">
                  {goal.targetDateLabel} · sugerido {formatCurrency(goal.suggestedMonthly)}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Deuda total" description="Pago total y estrategia visible">
          <div className="space-y-4">
            <div className="rounded-2xl border border-black/5 bg-white/70 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-semibold text-surface-strong">Liquidación total</p>
                <span className="text-sm text-ink-muted">
                  {data.debtProgress.totalProgressPct.toFixed(0)}%
                </span>
              </div>
              <ProgressBar value={data.debtProgress.totalProgressPct} tone="danger" />
            </div>
            {data.debtProgress.items.map((item) => (
              <div key={item.name} className="space-y-2 rounded-2xl border border-black/5 bg-white/70 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-surface-strong">{item.name}</p>
                  <span className="text-sm text-ink-muted">{formatCurrency(item.balance)}</span>
                </div>
                <ProgressBar value={item.progressPct} tone="danger" />
                <p className="text-xs uppercase tracking-[0.18em] text-ink-soft">
                  {item.helper}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Presupuesto mensual" description="Categorías que sí mueven decisiones">
          <BudgetUsageChart data={data.budgetUsage} />
        </SectionCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard title="Pagos próximos" description="Próximos 30 días ya comprometidos">
          <div className="space-y-3">
            {data.upcomingPayments.map((payment) => (
              <div key={`${payment.title}-${payment.dueDate}`} className="flex items-center justify-between rounded-2xl border border-black/5 bg-white/70 px-4 py-3">
                <div>
                  <p className="font-medium text-surface-strong">{payment.title}</p>
                  <p className="text-sm text-ink-muted">{payment.dueLabel}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-surface-strong">{formatCurrency(payment.amount)}</p>
                  <p className="text-xs uppercase tracking-[0.18em] text-ink-soft">{payment.kind}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Resumen de flujo comprometido" description="Escenario base para tomar decisiones">
          <div className="space-y-3">
            {data.projection.slice(0, 3).map((month) => (
              <div key={month.month} className="rounded-2xl border border-black/5 bg-white/70 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-semibold text-surface-strong">{formatMonthLabel(month.month)}</p>
                  <StatusBadge tone={month.net >= 0 ? "positive" : "danger"}>
                    {month.net >= 0 ? "Holgura" : "Presión"}
                  </StatusBadge>
                </div>
                <div className="grid gap-2 text-sm text-ink-muted sm:grid-cols-2">
                  <p>Ingreso: {formatCurrency(month.income)}</p>
                  <p>Fijos: {formatCurrency(month.fixed)}</p>
                  <p>Deuda + MSI: {formatCurrency(month.debt + month.installments)}</p>
                  <p>Ahorro: {formatCurrency(month.savings)}</p>
                </div>
                <div className="mt-4">
                  <ProgressBar value={month.commitmentPct} tone={month.commitmentPct > 70 ? "warning" : "default"} />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>
    </div>
  );
}
