import { BudgetUsageChart } from "@/components/charts/budget-usage-chart";
import { BudgetsManager } from "@/components/forms/budgets-manager";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/progress-bar";
import { SectionCard } from "@/components/ui/section-card";
import { formatCurrency } from "@/lib/format";
import { requireUser } from "@/lib/auth";
import { getBudgetsPageData } from "@/server/dashboard";
import { getBudgetsManagementData } from "@/server/management";

export const dynamic = "force-dynamic";

export default async function BudgetsPage() {
  const user = await requireUser();
  const [data, management] = await Promise.all([
    getBudgetsPageData(user.id),
    getBudgetsManagementData(user.id)
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Presupuestos"
        description="Usado, restante y alertas discretas donde sí importa."
      />

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <SectionCard title="Visión general" description="Presupuesto mensual por categoría">
          <BudgetUsageChart data={data.items} />
        </SectionCard>
        <SectionCard title="Detalle" description="Consumo y colchón restante">
          <div className="space-y-4">
            {data.items.map((budget) => (
              <div key={budget.label} className="rounded-2xl border border-black/5 bg-white/70 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-surface-strong">{budget.label}</p>
                    <p className="text-sm text-ink-muted">
                      {formatCurrency(budget.spent)} de {formatCurrency(budget.limit)}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-surface-strong">{budget.usagePct.toFixed(0)}%</p>
                </div>
                <ProgressBar value={budget.usagePct} tone={budget.usagePct > 100 ? "danger" : budget.usagePct > 80 ? "warning" : "default"} />
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-ink-soft">
                  Restante {formatCurrency(budget.remaining)}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>

      <BudgetsManager
        categories={management.categories}
        items={management.items}
        subcategories={management.subcategories}
      />
    </div>
  );
}
