import Link from "next/link";
import { RecurringExpensesManager } from "@/components/forms/recurring-expenses-manager";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { formatCurrency } from "@/lib/format";
import { requireUser } from "@/lib/auth";
import { getRecurringExpensesManagementData } from "@/server/management";

export const dynamic = "force-dynamic";

export default async function RecurringExpensesPage() {
  const user = await requireUser();
  const data = await getRecurringExpensesManagementData(user.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <PageHeader
          title="Gastos Fijos"
          description="Administra suscripciones, rentas, servicios y también pagos mensuales de préstamos dentro del compromiso fijo total."
        />
        <div className="flex flex-wrap gap-2">
          <Link className="rounded-full border border-black/8 bg-white/70 px-4 py-2 text-sm font-medium text-surface-strong" href="/transactions">
            Movimientos
          </Link>
          <Link className="rounded-full border border-black/8 bg-white/70 px-4 py-2 text-sm font-medium text-surface-strong" href="/categories">
            Categorías y tags
          </Link>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SectionCard title="Gasto fijo recurrente" description={formatCurrency(data.summary.recurringMonthlyTotal)}>
          <p className="text-sm leading-6 text-ink-muted">{data.summary.recurringCount} cargos activos normalizados a mes.</p>
        </SectionCard>
        <SectionCard title="Pagos de préstamos" description={formatCurrency(data.summary.loansMonthlyTotal)}>
          <p className="text-sm leading-6 text-ink-muted">{data.summary.loanCount} obligaciones mensuales registradas.</p>
        </SectionCard>
        <SectionCard title="Compromiso fijo total" description={formatCurrency(data.summary.totalCommittedMonthly)}>
          <p className="text-sm leading-6 text-ink-muted">Suma gastos fijos más pagos mensuales de deuda.</p>
        </SectionCard>
        <SectionCard title="Gasto esencial" description={formatCurrency(data.summary.essentialMonthlyTotal)}>
          <p className="text-sm leading-6 text-ink-muted">Solo cargos recurrentes marcados como obligatorios.</p>
        </SectionCard>
      </section>

      <RecurringExpensesManager
        accounts={data.accounts}
        categories={data.categories}
        items={data.items}
        loanItems={data.loanItems}
        subcategories={data.subcategories}
      />
    </div>
  );
}
