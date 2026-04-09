import { FlowScenarioSimulator } from "@/components/simulators/flow-scenario-simulator";
import { ProjectionChart } from "@/components/charts/projection-chart";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatMonthLabel } from "@/lib/format";
import { requireUser } from "@/lib/auth";
import { getProjectionPageData } from "@/server/dashboard";

export const dynamic = "force-dynamic";

export default async function ProjectionPage() {
  const user = await requireUser();
  const data = await getProjectionPageData(user.id);
  const getTone = (severity: string) => {
    if (severity === "CRITICAL") return "danger";
    if (severity === "WARNING") return "warning";
    if (severity === "POSITIVE") return "positive";
    return "info";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Planeación de flujo"
        description="Proyecciones para 3, 6 y 12 meses con escenarios de compromiso."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <SectionCard title="Próxima quincena" description={formatCurrency(data.nextFortnightNeed)}>
          <p className="text-sm leading-6 text-ink-muted">Pagos ya comprometidos antes de gasto variable.</p>
        </SectionCard>
        <SectionCard title="Siguiente mes" description={formatCurrency(data.nextMonthNeed)}>
          <p className="text-sm leading-6 text-ink-muted">Incluye fijos, deuda, MSI y ahorro sugerido.</p>
        </SectionCard>
        <SectionCard title="Si dejas de gastar hoy" description={formatCurrency(data.noSpendNextMonth)}>
          <p className="text-sm leading-6 text-ink-muted">Escenario conservador sin gasto variable adicional.</p>
        </SectionCard>
      </section>

      <SectionCard title="Proyección consolidada" description="Ingreso vs compromiso mensual">
        <ProjectionChart data={data.projection} />
      </SectionCard>

      <SectionCard title="Simulador de flujo" description="Recortes, ahorro extra, nueva MSI o pago adicional">
        <FlowScenarioSimulator context={data.simulatorContext} projection={data.projection} />
      </SectionCard>

      <SectionCard title="Señales de presión" description="Riesgos visibles para la siguiente ventana de flujo">
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
            title="Sin señales críticas"
            description="Cuando el flujo se tense por pagos, presupuesto o metas, aparecerá aquí."
          />
        )}
      </SectionCard>

      <SectionCard title="Detalle 12 meses" description="Mes a mes con presión de flujo">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data.projection.map((month) => (
            <div key={month.month} className="rounded-2xl border border-black/5 bg-white/70 p-4">
              <p className="font-semibold text-surface-strong">{formatMonthLabel(month.month)}</p>
              <div className="mt-3 space-y-1 text-sm text-ink-muted">
                <p>Ingreso: {formatCurrency(month.income)}</p>
                <p>Compromisos: {formatCurrency(month.fixed + month.debt + month.installments + month.savings)}</p>
                <p>Variable base: {formatCurrency(month.variable)}</p>
                <p>Neto proyectado: {formatCurrency(month.net)}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
