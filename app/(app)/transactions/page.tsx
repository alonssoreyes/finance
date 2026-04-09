import Link from "next/link";
import { TransactionsManager } from "@/components/forms/transactions-manager";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/auth";
import { getTransactionsManagementData } from "@/server/management";

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const user = await requireUser();
  const data = await getTransactionsManagementData(user.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <PageHeader
          title="Movimientos"
          description="Registra ingresos, gastos, transferencias, pagos de tarjeta, préstamos y aportaciones de ahorro con impacto real en tus cuentas."
        />
        <div className="flex flex-wrap gap-2">
          <Link className="rounded-full border border-black/8 bg-white/70 px-4 py-2 text-sm font-medium text-surface-strong" href="/recurring-expenses">
            Gastos fijos
          </Link>
          <Link className="rounded-full border border-black/8 bg-white/70 px-4 py-2 text-sm font-medium text-surface-strong" href="/categories">
            Categorías y tags
          </Link>
        </div>
      </div>

      <TransactionsManager
        accounts={data.accounts}
        categories={data.categories}
        goals={data.goals}
        items={data.items}
        subcategories={data.subcategories}
      />
    </div>
  );
}
