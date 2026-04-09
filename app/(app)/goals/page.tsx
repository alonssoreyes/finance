import { GoalsManager } from "@/components/forms/goals-manager";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/progress-bar";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency } from "@/lib/format";
import { requireUser } from "@/lib/auth";
import { getGoalsPageData } from "@/server/dashboard";
import { getGoalsManagementData } from "@/server/management";

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const user = await requireUser();
  const [data, management] = await Promise.all([
    getGoalsPageData(user.id),
    getGoalsManagementData(user.id)
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Metas de ahorro"
        description="Cuánto apartar, si vas atrasado y qué ajustar para llegar a tiempo."
      />

      <section className="grid gap-4 lg:grid-cols-2">
        {data.items.map((goal) => (
          <SectionCard key={goal.id} title={goal.name} description={`${formatCurrency(goal.current)} de ${formatCurrency(goal.target)}`}>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-ink-muted">
                <span>Progreso</span>
                <StatusBadge tone={goal.onTrack ? "positive" : "warning"}>
                  {goal.onTrack ? "En ruta" : "Ajustar"}
                </StatusBadge>
              </div>
              <ProgressBar value={goal.progressPct} />
              <div className="grid gap-2 text-sm text-ink-muted">
                <p>Aportación sugerida: {formatCurrency(goal.suggestedMonthly)} por mes</p>
                <p>Ritmo semanal: {formatCurrency(goal.suggestedWeekly)}</p>
                <p>{goal.guidance}</p>
              </div>
            </div>
          </SectionCard>
        ))}
      </section>

      <GoalsManager accounts={management.accounts} items={management.items} />
    </div>
  );
}
