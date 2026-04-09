import { notFound } from "next/navigation";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/progress-bar";
import { SectionCard } from "@/components/ui/section-card";
import { formatCurrency } from "@/lib/format";
import { requireUser } from "@/lib/auth";
import { getLoanDetailData } from "@/server/dashboard";

export const dynamic = "force-dynamic";

export default async function LoanDetailPage({
  params
}: {
  params: Promise<{ loanId: string }>;
}) {
  const user = await requireUser();
  const { loanId } = await params;
  const data = await getLoanDetailData(user.id, loanId);

  if (!data) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader title={data.name} description={`${data.lender} · prioridad ${data.priority}`} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SectionCard title="Saldo actual" description={formatCurrency(data.currentBalance)}>
          <p className="text-sm text-ink-muted">Monto original {formatCurrency(data.originalAmount)}</p>
        </SectionCard>
        <SectionCard title="Pago mensual" description={formatCurrency(data.monthlyPayment)}>
          <p className="text-sm text-ink-muted">Tasa {data.interestRate ? `${data.interestRate}%` : "N/A"}</p>
        </SectionCard>
        <SectionCard title="Meses restantes" description={`${data.monthsLeft} meses`}>
          <p className="text-sm text-ink-muted">Estimado con pago actual</p>
        </SectionCard>
        <SectionCard title="Interés del mes" description={formatCurrency(data.monthlyInterestEstimate)}>
          <p className="text-sm text-ink-muted">Costo financiero aproximado al saldo actual</p>
        </SectionCard>
      </section>

      <SectionCard title="Progreso de liquidación" description={`${data.progressPct.toFixed(0)}% pagado`}>
        <ProgressBar value={data.progressPct} tone="danger" />
        <p className="mt-4 text-sm leading-6 text-ink-muted">{data.guidance}</p>
      </SectionCard>

      <SectionCard title="Escenarios de aceleración" description="Qué pasa si metes dinero extra cada mes">
        {data.payoffScenarios.length ? (
          <div className="grid gap-4 md:grid-cols-3">
            {data.payoffScenarios.map((scenario) => (
              <div key={scenario.extraPayment} className="rounded-2xl border border-black/5 bg-white/70 p-4">
                <p className="text-sm uppercase tracking-[0.18em] text-ink-soft">
                  +{formatCurrency(scenario.extraPayment)}/mes
                </p>
                <p className="mt-3 text-lg font-semibold text-surface-strong">
                  {scenario.monthsSaved} meses menos
                </p>
                <p className="mt-2 text-sm text-ink-muted">
                  Interés evitado {formatCurrency(scenario.interestSaved)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Sin escenarios"
            description="No fue posible calcular escenarios de aceleración para este préstamo."
          />
        )}
      </SectionCard>
    </div>
  );
}
