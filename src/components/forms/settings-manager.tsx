"use client";

import { useActionState, useState } from "react";
import {
  deleteFinancialRuleAction,
  upsertFinancialRuleAction,
  upsertSettingsAction
} from "@/actions/finance";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import type { ActionState } from "@/validations/finance";

type SettingsInput = {
  currency: string;
  locale: string;
  dateFormat: string;
  incomeFrequency: string;
  paydayDays: number[];
  debtStrategy: string;
  defaultGoalPriority: string;
  cardStatementBufferDays: number;
  enableLocalInsights: boolean;
  weekStartsOn: number;
  projectedFlowMonths: number;
  categoryBudgetWarningPct: number;
  themeMode: string;
};

type SettingsDraft = {
  currency: string;
  locale: string;
  dateFormat: string;
  incomeFrequency: string;
  paydayDays: string;
  debtStrategy: string;
  defaultGoalPriority: string;
  cardStatementBufferDays: string;
  enableLocalInsights: boolean;
  weekStartsOn: string;
  projectedFlowMonths: string;
  categoryBudgetWarningPct: string;
  themeMode: string;
};

type RuleItem = {
  id: string;
  name: string;
  description?: string;
  type: string;
  severity: string;
  isEnabled: boolean;
  thresholdPercent?: number;
  amountLimit?: number;
  transactionCount?: number;
  daysWindow?: number;
  categoryId?: string;
  categoryName?: string;
};

type AlertItem = {
  title: string;
  message: string;
  severity: string;
};

type Props = {
  settings: SettingsInput;
  rules: RuleItem[];
  categories: Array<{ id: string; name: string; kind: string }>;
  alertsPreview: AlertItem[];
};

const defaultState: ActionState = {};

const blankRuleDraft = {
  id: "",
  name: "",
  description: "",
  type: "THRESHOLD",
  severity: "WARNING",
  thresholdPercent: "20",
  amountLimit: "",
  transactionCount: "",
  daysWindow: "7",
  categoryId: "",
  isEnabled: true
};

function getSeverityTone(severity: string) {
  if (severity === "CRITICAL") return "danger";
  if (severity === "WARNING") return "warning";
  if (severity === "POSITIVE") return "positive";
  return "info";
}

function getRuleHelper(type: string) {
  switch (type) {
    case "THRESHOLD":
      return "Compara gasto actual contra promedio histórico y dispara al rebasar un umbral.";
    case "TREND":
      return "Detecta crecimiento general de gasto frente al ritmo base reciente.";
    case "ACCUMULATION":
      return "Agrupa muchos gastos pequeños para evidenciar fugas de dinero.";
    case "CONCENTRATION":
      return "Marca cuando demasiados pagos se amontonan en pocos días.";
    case "RISK":
      return "Advierte presión de flujo, carga alta o saturación financiera.";
    default:
      return "Regla flexible preparada para lógica futura.";
  }
}

export function SettingsManager({ settings, rules, categories, alertsPreview }: Props) {
  const [settingsDraft, setSettingsDraft] = useState({
    currency: settings.currency,
    locale: settings.locale,
    dateFormat: settings.dateFormat,
    incomeFrequency: settings.incomeFrequency,
    paydayDays: settings.paydayDays.join(", "),
    debtStrategy: settings.debtStrategy,
    defaultGoalPriority: settings.defaultGoalPriority,
    cardStatementBufferDays: String(settings.cardStatementBufferDays),
    enableLocalInsights: settings.enableLocalInsights,
    weekStartsOn: String(settings.weekStartsOn),
    projectedFlowMonths: String(settings.projectedFlowMonths),
    categoryBudgetWarningPct: String(settings.categoryBudgetWarningPct),
    themeMode: settings.themeMode
  });
  const [ruleDraft, setRuleDraft] = useState(blankRuleDraft);
  const [settingsState, settingsAction] = useActionState(upsertSettingsAction, defaultState);
  const [ruleState, ruleAction] = useActionState(upsertFinancialRuleAction, defaultState);

  function startEditRule(rule: RuleItem) {
    setRuleDraft({
      id: rule.id,
      name: rule.name,
      description: rule.description ?? "",
      type: rule.type,
      severity: rule.severity,
      thresholdPercent: rule.thresholdPercent != null ? String(rule.thresholdPercent) : "",
      amountLimit: rule.amountLimit != null ? String(rule.amountLimit) : "",
      transactionCount: rule.transactionCount != null ? String(rule.transactionCount) : "",
      daysWindow: rule.daysWindow != null ? String(rule.daysWindow) : "7",
      categoryId: rule.categoryId ?? "",
      isEnabled: rule.isEnabled
    });
  }

  function resetRuleDraft() {
    setRuleDraft(blankRuleDraft);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 2xl:grid-cols-[1.02fr_0.98fr]">
        <section className="glass-card min-w-0 rounded-[1.75rem] p-5">
          <div className="mb-5">
            <p className="text-sm uppercase tracking-[0.18em] text-ink-muted">Preferencias</p>
            <h2 className="mt-2 text-xl font-semibold text-surface-strong">
              Motor financiero y personalización
            </h2>
          </div>

          <form action={settingsAction} className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <Input
                label="Moneda"
                name="currency"
                onChange={(event) =>
                  setSettingsDraft((current) => ({ ...current, currency: event.target.value }))
                }
                value={settingsDraft.currency}
              />
              <Input
                label="Locale"
                name="locale"
                onChange={(event) =>
                  setSettingsDraft((current) => ({ ...current, locale: event.target.value }))
                }
                value={settingsDraft.locale}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Input
                label="Formato de fecha"
                name="dateFormat"
                onChange={(event) =>
                  setSettingsDraft((current) => ({ ...current, dateFormat: event.target.value }))
                }
                value={settingsDraft.dateFormat}
              />
              <Select
                label="Frecuencia de ingresos"
                name="incomeFrequency"
                onChange={(event) =>
                  setSettingsDraft((current) => ({
                    ...current,
                    incomeFrequency: event.target.value
                  }))
                }
                value={settingsDraft.incomeFrequency}
              >
                <option value="WEEKLY">Semanal</option>
                <option value="BIWEEKLY">Quincenal</option>
                <option value="MONTHLY">Mensual</option>
                <option value="CUSTOM">Personalizada</option>
              </Select>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Input
                label="Días de ingreso"
                name="paydayDays"
                onChange={(event) =>
                  setSettingsDraft((current) => ({ ...current, paydayDays: event.target.value }))
                }
                placeholder="15, 30"
                value={settingsDraft.paydayDays}
              />
              <Select
                label="Estrategia de deuda"
                name="debtStrategy"
                onChange={(event) =>
                  setSettingsDraft((current) => ({ ...current, debtStrategy: event.target.value }))
                }
                value={settingsDraft.debtStrategy}
              >
                <option value="SNOWBALL">Snowball</option>
                <option value="AVALANCHE">Avalanche</option>
                <option value="CUSTOM">Personalizada</option>
              </Select>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Select
                label="Prioridad base de metas"
                name="defaultGoalPriority"
                onChange={(event) =>
                  setSettingsDraft((current) => ({
                    ...current,
                    defaultGoalPriority: event.target.value
                  }))
                }
                value={settingsDraft.defaultGoalPriority}
              >
                <option value="LOW">Baja</option>
                <option value="MEDIUM">Media</option>
                <option value="HIGH">Alta</option>
                <option value="CRITICAL">Crítica</option>
              </Select>
              <Input
                label="Buffer de corte"
                name="cardStatementBufferDays"
                onChange={(event) =>
                  setSettingsDraft((current) => ({
                    ...current,
                    cardStatementBufferDays: event.target.value
                  }))
                }
                type="number"
                value={settingsDraft.cardStatementBufferDays}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <Input
                label="Meses de proyección"
                name="projectedFlowMonths"
                onChange={(event) =>
                  setSettingsDraft((current) => ({
                    ...current,
                    projectedFlowMonths: event.target.value
                  }))
                }
                type="number"
                value={settingsDraft.projectedFlowMonths}
              />
              <Input
                label="Alerta base de presupuesto %"
                name="categoryBudgetWarningPct"
                onChange={(event) =>
                  setSettingsDraft((current) => ({
                    ...current,
                    categoryBudgetWarningPct: event.target.value
                  }))
                }
                type="number"
                value={settingsDraft.categoryBudgetWarningPct}
              />
              <Select
                label="Inicio de semana"
                name="weekStartsOn"
                onChange={(event) =>
                  setSettingsDraft((current) => ({ ...current, weekStartsOn: event.target.value }))
                }
                value={settingsDraft.weekStartsOn}
              >
                <option value="0">Domingo</option>
                <option value="1">Lunes</option>
              </Select>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Select
                label="Tema"
                name="themeMode"
                onChange={(event) =>
                  setSettingsDraft((current) => ({ ...current, themeMode: event.target.value }))
                }
                value={settingsDraft.themeMode}
              >
                <option value="light">Light</option>
                <option value="system">System</option>
              </Select>
              <div className="grid content-end">
                <Toggle
                  checked={settingsDraft.enableLocalInsights}
                  label="Insights locales activos"
                  name="enableLocalInsights"
                  onChange={(event) =>
                    setSettingsDraft((current) => ({
                      ...current,
                      enableLocalInsights: event.target.checked
                    }))
                  }
                />
              </div>
            </div>

            {settingsState.error ? (
              <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {settingsState.error}
              </p>
            ) : null}

            <FormSubmitButton className="w-full">Guardar configuración</FormSubmitButton>
          </form>
        </section>

        <section className="glass-card min-w-0 rounded-[1.75rem] p-5">
          <div className="mb-5">
            <p className="text-sm uppercase tracking-[0.18em] text-ink-muted">Motor actual</p>
            <h2 className="mt-2 text-xl font-semibold text-surface-strong">
              Alertas que hoy sí mueven decisiones
            </h2>
          </div>

          {alertsPreview.length ? (
            <div className="space-y-3">
              {alertsPreview.map((alert) => (
                <div key={`${alert.title}-${alert.message}`} className="rounded-2xl border border-black/5 bg-white/70 p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="font-semibold text-surface-strong">{alert.title}</p>
                    <StatusBadge tone={getSeverityTone(alert.severity)}>
                      {alert.severity}
                    </StatusBadge>
                  </div>
                  <p className="text-sm leading-6 text-ink-muted">{alert.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Sin alertas activas"
              description="Cuando el motor detecte riesgo de flujo, presupuesto o metas, aparecerá aquí."
            />
          )}
        </section>
      </div>

      <div className="grid gap-6 2xl:grid-cols-[0.95fr_1.05fr]">
        <section className="glass-card min-w-0 rounded-[1.75rem] p-5">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm uppercase tracking-[0.18em] text-ink-muted">Reglas</p>
              <h2 className="mt-2 text-xl font-semibold text-surface-strong">
                {ruleDraft.id ? "Editar regla financiera" : "Nueva regla financiera"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-ink-muted">
                {getRuleHelper(ruleDraft.type)}
              </p>
            </div>
            {ruleDraft.id ? (
              <Button onClick={resetRuleDraft} type="button" variant="secondary">
                Cancelar
              </Button>
            ) : null}
          </div>

          <form action={ruleAction} className="space-y-4">
            <input name="id" type="hidden" value={ruleDraft.id} />
            <Input
              label="Nombre"
              name="name"
              onChange={(event) => setRuleDraft((current) => ({ ...current, name: event.target.value }))}
              value={ruleDraft.name}
            />

            <div className="grid gap-4 lg:grid-cols-2">
              <Select
                label="Tipo"
                name="type"
                onChange={(event) => setRuleDraft((current) => ({ ...current, type: event.target.value }))}
                value={ruleDraft.type}
              >
                <option value="THRESHOLD">Threshold</option>
                <option value="TREND">Trend</option>
                <option value="ACCUMULATION">Accumulation</option>
                <option value="CONCENTRATION">Concentration</option>
                <option value="RISK">Risk</option>
                <option value="CUSTOM">Custom</option>
              </Select>
              <Select
                label="Severidad"
                name="severity"
                onChange={(event) =>
                  setRuleDraft((current) => ({ ...current, severity: event.target.value }))
                }
                value={ruleDraft.severity}
              >
                <option value="INFO">Info</option>
                <option value="WARNING">Warning</option>
                <option value="CRITICAL">Critical</option>
                <option value="POSITIVE">Positive</option>
              </Select>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Input
                label="Umbral %"
                name="thresholdPercent"
                onChange={(event) =>
                  setRuleDraft((current) => ({
                    ...current,
                    thresholdPercent: event.target.value
                  }))
                }
                type="number"
                value={ruleDraft.thresholdPercent}
              />
              <Input
                label="Monto límite"
                name="amountLimit"
                onChange={(event) =>
                  setRuleDraft((current) => ({ ...current, amountLimit: event.target.value }))
                }
                placeholder="250"
                step="0.01"
                type="number"
                value={ruleDraft.amountLimit}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <Input
                label="Conteo mínimo"
                name="transactionCount"
                onChange={(event) =>
                  setRuleDraft((current) => ({
                    ...current,
                    transactionCount: event.target.value
                  }))
                }
                type="number"
                value={ruleDraft.transactionCount}
              />
              <Input
                label="Ventana en días"
                name="daysWindow"
                onChange={(event) =>
                  setRuleDraft((current) => ({ ...current, daysWindow: event.target.value }))
                }
                type="number"
                value={ruleDraft.daysWindow}
              />
              <Select
                label="Categoría"
                name="categoryId"
                onChange={(event) =>
                  setRuleDraft((current) => ({ ...current, categoryId: event.target.value }))
                }
                value={ruleDraft.categoryId}
              >
                <option value="">General</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name} · {category.kind}
                  </option>
                ))}
              </Select>
            </div>

            <Textarea
              label="Descripción"
              name="description"
              onChange={(event) =>
                setRuleDraft((current) => ({ ...current, description: event.target.value }))
              }
              value={ruleDraft.description}
            />

            <Toggle
              checked={ruleDraft.isEnabled}
              label="Regla activa"
              name="isEnabled"
              onChange={(event) =>
                setRuleDraft((current) => ({ ...current, isEnabled: event.target.checked }))
              }
            />

            {ruleState.error ? (
              <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {ruleState.error}
              </p>
            ) : null}

            <FormSubmitButton className="w-full">
              {ruleDraft.id ? "Guardar regla" : "Crear regla"}
            </FormSubmitButton>
          </form>
        </section>

        <section className="glass-card min-w-0 rounded-[1.75rem] p-5">
          <div className="mb-5">
            <p className="text-sm uppercase tracking-[0.18em] text-ink-muted">Cobertura</p>
            <h2 className="mt-2 text-xl font-semibold text-surface-strong">
              Reglas editables del motor
            </h2>
          </div>

          {rules.length ? (
            <div className="space-y-3">
              {rules.map((rule) => (
                <div key={rule.id} className="rounded-2xl border border-black/5 bg-white/70 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-surface-strong">{rule.name}</p>
                      <p className="text-sm text-ink-muted">
                        {rule.description ?? getRuleHelper(rule.type)}
                      </p>
                    </div>
                    <StatusBadge tone={rule.isEnabled ? "positive" : "default"}>
                      {rule.isEnabled ? "Activa" : "Pausada"}
                    </StatusBadge>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.16em] text-ink-soft">
                    <span>{rule.type}</span>
                    <span>{rule.severity}</span>
                    {rule.categoryName ? <span>{rule.categoryName}</span> : null}
                    {rule.thresholdPercent != null ? <span>{rule.thresholdPercent}%</span> : null}
                    {rule.amountLimit != null ? <span>monto {rule.amountLimit}</span> : null}
                    {rule.transactionCount != null ? <span>{rule.transactionCount} eventos</span> : null}
                    {rule.daysWindow != null ? <span>{rule.daysWindow} días</span> : null}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button onClick={() => startEditRule(rule)} type="button" variant="secondary">
                      Editar
                    </Button>
                    <form action={deleteFinancialRuleAction}>
                      <input name="id" type="hidden" value={rule.id} />
                      <Button type="submit" variant="secondary">
                        Eliminar
                      </Button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Sin reglas personalizadas"
              description="Puedes dejar el motor base o sumar reglas para presión de flujo, microgastos o categorías específicas."
            />
          )}
        </section>
      </div>
    </div>
  );
}
