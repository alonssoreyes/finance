import type { Route } from "next";
import Link from "next/link";
import { AccountsManager } from "@/components/forms/accounts-manager";
import { CreditCardsManager } from "@/components/forms/credit-cards-manager";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/progress-bar";
import { SectionCard } from "@/components/ui/section-card";
import { formatCurrency, formatDate } from "@/lib/format";
import { requireUser } from "@/lib/auth";
import { getAccountsPageData } from "@/server/dashboard";
import { getAccountsManagementData } from "@/server/management";

export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  const user = await requireUser();
  const [data, management] = await Promise.all([
    getAccountsPageData(user.id),
    getAccountsManagementData(user.id)
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cuentas y tarjetas"
        description="Liquidez, utilización de línea y fechas de corte visibles en un solo lugar."
      />

      <section className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Cuentas líquidas" description="Débito, ahorro y efectivo">
          <div className="space-y-3">
            {data.accounts.map((account) => (
              <div key={account.id} className="rounded-2xl border border-black/5 bg-white/70 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-surface-strong">{account.name}</p>
                    <p className="text-sm text-ink-muted">{account.typeLabel}</p>
                  </div>
                  <p className="font-semibold text-surface-strong">{formatCurrency(account.balance)}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Tarjetas de crédito" description="Utilización, corte y pago para no generar intereses">
          <div className="space-y-4">
            {data.cards.map((card) => (
              <div key={card.id} className="rounded-[1.75rem] border border-black/5 bg-[#1f2937] p-5 text-white">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-white/60">{card.bank}</p>
                    <h3 className="mt-1 text-xl font-semibold">{card.name}</h3>
                    <p className="mt-1 text-sm text-white/70">•••• {card.last4}</p>
                  </div>
                  <Link className="rounded-full border border-white/15 px-3 py-1 text-xs uppercase tracking-[0.18em] text-white/80" href={`/cards/${card.id}` as Route}>
                    Detalle
                  </Link>
                </div>
                <div className="grid gap-3 text-sm text-white/70 sm:grid-cols-2">
                  <p>Corte: {card.statementClosingDay}</p>
                  <p>Límite pago: {card.paymentDueDay}</p>
                  <p>No intereses: {formatCurrency(card.statementBalance)}</p>
                  <p>Mínimo actual: {formatCurrency(card.minimumDueAmount)}</p>
                  <p>Saldo total: {formatCurrency(card.payoffBalance)}</p>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm text-white/70">
                    <span>Utilización</span>
                    <span>{card.utilizationPct.toFixed(0)}%</span>
                  </div>
                  <ProgressBar value={card.utilizationPct} tone={card.utilizationPct > 35 ? "warning" : "default"} />
                  <p className="text-xs uppercase tracking-[0.18em] text-white/55">
                    Próximo vencimiento {formatDate(card.nextDueDate)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>

      <AccountsManager items={management.accounts} />
      <CreditCardsManager items={management.cards} />
    </div>
  );
}
