import { InstallmentsManager } from "@/components/forms/installments-manager";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/progress-bar";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatMonthLabel } from "@/lib/format";
import { requireUser } from "@/lib/auth";
import { getInstallmentsPageData } from "@/server/dashboard";
import { getInstallmentsManagementData } from "@/server/management";

export const dynamic = "force-dynamic";

export default async function InstallmentsPage() {
  const user = await requireUser();
  const [data, management] = await Promise.all([
    getInstallmentsPageData(user.id),
    getInstallmentsManagementData(user.id)
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compras a MSI"
        description="Carga mensual, amortización simplificada y alivio futuro visible."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <SectionCard title="Carga mensual actual" description={formatCurrency(data.monthlyLoad)}>
          <p className="text-sm leading-6 text-ink-muted">Lo que tus MSI activas ya exigen cada mes.</p>
        </SectionCard>
        <SectionCard title="Pendiente por liquidar" description={formatCurrency(data.remaining)}>
          <p className="text-sm leading-6 text-ink-muted">Saldo total que aún falta cubrir en mensualidades.</p>
        </SectionCard>
        <SectionCard title="Baja próxima" description={formatCurrency(data.reliefSoon)}>
          <p className="text-sm leading-6 text-ink-muted">Monto que se libera cuando terminen los MSI más cercanos.</p>
        </SectionCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard title="Compras activas" description="Cada compra con progreso y saldo pendiente">
          <div className="space-y-4">
            {data.items.map((item) => (
              <div key={item.id} className="rounded-2xl border border-black/5 bg-white/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-surface-strong">{item.title}</p>
                    <p className="text-sm text-ink-muted">{item.merchant}</p>
                  </div>
                  <StatusBadge tone="default">{item.status}</StatusBadge>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm text-ink-muted">
                    <span>Mensualidad {item.currentInstallment} / {item.totalMonths}</span>
                    <span>{formatCurrency(item.monthlyAmount)}</span>
                  </div>
                  <ProgressBar value={item.progressPct} />
                  <p className="text-xs uppercase tracking-[0.18em] text-ink-soft">
                    Pendiente {formatCurrency(item.remainingBalance)} · termina {formatMonthLabel(item.endsAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Amortización próxima" description="Cargos futuros simplificados">
          <div className="overflow-hidden rounded-2xl border border-black/5 bg-white/70">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-black/5 bg-black/[0.03] text-ink-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Mes</th>
                  <th className="px-4 py-3 font-medium">Compra</th>
                  <th className="px-4 py-3 font-medium">Mensualidad</th>
                  <th className="px-4 py-3 font-medium">Restante</th>
                </tr>
              </thead>
              <tbody>
                {data.schedule.map((payment) => (
                  <tr key={payment.id} className="border-b border-black/5 last:border-0">
                    <td className="px-4 py-3">{formatMonthLabel(payment.chargeMonth)}</td>
                    <td className="px-4 py-3 text-surface-strong">{payment.purchaseTitle}</td>
                    <td className="px-4 py-3">{formatCurrency(payment.amount)}</td>
                    <td className="px-4 py-3">{formatCurrency(payment.remainingAfterPayment)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </section>

      <InstallmentsManager
        cards={management.cards}
        categories={management.categories}
        items={management.items}
      />
    </div>
  );
}
