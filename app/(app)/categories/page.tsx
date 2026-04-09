import Link from "next/link";
import { TaxonomyManager } from "@/components/forms/taxonomy-manager";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/auth";
import { getTaxonomyManagementData } from "@/server/management";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const user = await requireUser();
  const data = await getTaxonomyManagementData(user.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <PageHeader
          title="Categorías y Etiquetas"
          description="Personaliza categorías, subcategorías y etiquetas para adaptar el producto a tu realidad financiera."
        />
        <div className="flex flex-wrap gap-2">
          <Link className="rounded-full border border-black/8 bg-white/70 px-4 py-2 text-sm font-medium text-surface-strong" href="/transactions">
            Movimientos
          </Link>
          <Link className="rounded-full border border-black/8 bg-white/70 px-4 py-2 text-sm font-medium text-surface-strong" href="/recurring-expenses">
            Gastos fijos
          </Link>
        </div>
      </div>

      <TaxonomyManager
        categories={data.categories}
        subcategories={data.subcategories}
        tags={data.tags}
      />
    </div>
  );
}
