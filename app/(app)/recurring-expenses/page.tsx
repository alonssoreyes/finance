import Link from "next/link";
import { RecurringExpensesManager } from "@/components/forms/recurring-expenses-manager";
import { PageHeader } from "@/components/ui/page-header";
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
          description="Administra suscripciones, rentas, servicios y cargos periódicos con alertas y peso real sobre el flujo mensual."
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

      <RecurringExpensesManager
        accounts={data.accounts}
        categories={data.categories}
        items={data.items}
        subcategories={data.subcategories}
      />
    </div>
  );
}
