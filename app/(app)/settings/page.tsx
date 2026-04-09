import { SettingsManager } from "@/components/forms/settings-manager";
import { PageHeader } from "@/components/ui/page-header";
import { requireUser } from "@/lib/auth";
import { getRealtimeInsights } from "@/server/dashboard";
import { getSettingsManagementData } from "@/server/management";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();
  const [management, alertsPreview] = await Promise.all([
    getSettingsManagementData(user.id),
    getRealtimeInsights(user.id)
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuración"
        description="Personaliza lógica de ingresos, estrategia de deuda y reglas del motor financiero."
      />

      <SettingsManager
        alertsPreview={alertsPreview.slice(0, 6)}
        categories={management.categories}
        rules={management.rules}
        settings={management.settings}
      />
    </div>
  );
}
