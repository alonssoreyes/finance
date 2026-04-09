import { CardPurchaseSimulator } from "@/components/simulators/card-purchase-simulator";
import { CardPaymentManager } from "@/components/forms/card-payment-manager";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/progress-bar";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatDate, formatMonthLabel } from "@/lib/format";
import { requireUser } from "@/lib/auth";
import { getCardDetailData } from "@/server/dashboard";

export const dynamic = "force-dynamic";

export default async function CardDetailPage({
  params
}: {
  params: Promise<{ cardId: string }>;
}) {
  const user = await requireUser();
  const { cardId } = await params;
  const data = await getCardDetailData(user.id, cardId);

  if (!data) {
    notFound();
  }

  const getTone = (severity: string) => {
    if (severity === "CRITICAL") return "danger";
    if (severity === "WARNING") return "warning";
    if (severity === "POSITIVE") return "positive";
    return "info";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={data.name}
        description={`${data.bank} · corte ${data.statementClosingDay} · pago ${data.paymentDueDay}`}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SectionCard title="Utilización" description={`${data.utilizationPct.toFixed(0)}%`}>
          <ProgressBar value={data.utilizationPct} tone="utilization" />
        </SectionCard>
        <SectionCard title="Pago para no generar intereses" description={formatCurrency(data.statementBalance)}>
          <p className="text-sm text-ink-muted">Vence el {formatDate(data.nextDueDate)}</p>
        </SectionCard>
        <SectionCard title="Pago mínimo" description={formatCurrency(data.minimumDueAmount)}>
          <p className="text-sm text-ink-muted">Tu obligación mínima vigente de este corte</p>
        </SectionCard>
        <SectionCard title="Saldo total" description={formatCurrency(data.payoffBalance)}>
          <p className="text-sm text-ink-muted">Límite {formatCurrency(data.creditLimit)}</p>
        </SectionCard>
        <SectionCard title="Línea disponible" description={formatCurrency(data.availableCredit)}>
          <p className="text-sm text-ink-muted">
            MSI activas cargan {formatCurrency(data.monthlyInstallmentLoad)} al mes
          </p>
        </SectionCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.86fr_1.14fr]">
        <SectionCard title="Señales de la tarjeta" description="Riesgo de línea, pago y carga futura">
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
              title="Sin alertas de tarjeta"
              description="Cuando suba demasiado la utilización o se concentre la presión del pago, se mostrará aquí."
            />
          )}
        </SectionCard>

        <SectionCard title="Próximos cargos MSI" description="Lo que seguirá pegando dentro de esta tarjeta">
          {data.upcomingCharges.length ? (
            <div className="space-y-3">
              {data.upcomingCharges.map((charge) => (
                <div key={charge.id} className="rounded-2xl border border-black/5 bg-white/70 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-surface-strong">{charge.title}</p>
                      <p className="text-sm text-ink-muted">
                        Mensualidad #{charge.installmentNumber} · cargo {formatMonthLabel(charge.chargeMonth)}
                      </p>
                    </div>
                    <p className="font-semibold text-surface-strong">{formatCurrency(charge.amount)}</p>
                  </div>
                  <p className="mt-3 text-xs uppercase tracking-[0.18em] text-ink-soft">
                    vence {formatDate(charge.dueDate, "d MMM yyyy")}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Sin cargos MSI próximos"
              description="Esta tarjeta no tiene mensualidades activas pendientes."
            />
          )}
        </SectionCard>
      </section>

      <SectionCard title="Compras MSI ligadas" description="Impacto futuro dentro de la tarjeta">
        {data.installments.length ? (
          <div className="space-y-4">
            {data.installments.map((item) => (
              <div key={item.id} className="rounded-2xl border border-black/5 bg-white/70 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-surface-strong">{item.title}</p>
                    <p className="text-sm text-ink-muted">{item.merchant}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-surface-strong">{formatCurrency(item.monthlyAmount)}</p>
                    <p className="text-sm text-ink-muted">{formatMonthLabel(item.endsAt)}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <ProgressBar value={item.progressPct} />
                </div>
                <p className="mt-3 text-xs uppercase tracking-[0.18em] text-ink-soft">
                  pendiente {formatCurrency(item.remainingBalance)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Sin MSI ligadas"
            description="Cuando registres compras a meses con esta tarjeta aparecerán aquí."
          />
        )}
      </SectionCard>

      <SectionCard title="Simulador de compra en tarjeta" description="En qué corte cae y cuándo te pegaría en flujo">
        <CardPurchaseSimulator context={data.simulatorContext} />
      </SectionCard>

      <SectionCard title="Abonos a la tarjeta" description="Registra pagos y actualiza el saldo al momento">
        <CardPaymentManager
          cardId={data.id}
          cardName={data.name}
          currentMinimumDue={data.minimumDueAmount}
          currentStatementBalance={data.statementBalance}
          recentPayments={data.recentPayments}
          sourceAccounts={data.sourceAccounts}
        />
      </SectionCard>
    </div>
  );
}
