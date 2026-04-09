import { PlannedPurchasesManager } from "@/components/forms/planned-purchases-manager";
import { PurchaseMsiSimulator } from "@/components/simulators/purchase-msi-simulator";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/progress-bar";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency } from "@/lib/format";
import { requireUser } from "@/lib/auth";
import { getPlannedPurchasesPageData } from "@/server/dashboard";
import { getPlannedPurchasesManagementData } from "@/server/management";

export const dynamic = "force-dynamic";

export default async function PlannedPurchasesPage() {
  const user = await requireUser();
  const [data, management] = await Promise.all([
    getPlannedPurchasesPageData(user.id),
    getPlannedPurchasesManagementData(user.id)
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
        title="Compras planeadas"
        description="Temporada estimada, ahorro previo y costo de contado vs MSI."
      />

      <section className="grid gap-4 lg:grid-cols-2">
        {data.items.map((item) => (
          <SectionCard key={item.id} title={item.title} description={item.bestWindow}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <StatusBadge tone={item.recommendationTone as "default" | "positive" | "warning"}>
                  {item.recommendationLabel}
                </StatusBadge>
                <p className="text-sm text-ink-muted">
                  {formatCurrency(item.saved)} / {formatCurrency(item.targetPrice)}
                </p>
              </div>
              <ProgressBar value={item.savedPct} />
              <div className="grid gap-2 text-sm text-ink-muted">
                <p>Rango esperado: {formatCurrency(item.minPrice)} a {formatCurrency(item.maxPrice)}</p>
                <p>Tiendas típicas: {item.stores.join(", ")}</p>
                <p>{item.guidance}</p>
                <p>Contado sugerido: {formatCurrency(item.cashBuffer)}</p>
                <p>Si tomas 12 MSI: {formatCurrency(item.msiMonthly)} por mes</p>
              </div>
            </div>
          </SectionCard>
        ))}
      </section>

      <SectionCard title="Simulador de compra" description="Esperar, ahorrar más o tomar MSI con contexto real de flujo">
        <PurchaseMsiSimulator context={data.simulatorContext} />
      </SectionCard>

      <SectionCard title="Lectura de conveniencia" description="Señales para decidir si esperar, ahorrar o financiar">
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
            title="Sin fricciones activas"
            description="Cuando una compra futura apriete tu flujo o ahorro, se mostrará aquí."
          />
        )}
      </SectionCard>

      <PlannedPurchasesManager
        goals={management.goals}
        items={management.items}
        seasonality={management.seasonality}
      />
    </div>
  );
}
