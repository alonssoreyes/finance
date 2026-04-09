"use client";

import { useActionState, useState } from "react";
import { deleteGoalAction, upsertGoalAction } from "@/actions/finance";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatDate } from "@/lib/format";
import type { ActionState } from "@/validations/finance";

type GoalItem = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  priority: string;
  monthlySuggestedContribution: number;
  linkedAccountId?: string;
  linkedAccountName?: string;
  color?: string;
  icon?: string;
  notes?: string;
};

type Props = {
  items: GoalItem[];
  accounts: Array<{ id: string; name: string }>;
};

const defaultState: ActionState = {};

const blankDraft = {
  id: "",
  name: "",
  targetAmount: "",
  currentAmount: "0",
  targetDate: "",
  priority: "MEDIUM",
  monthlySuggestedContribution: "0",
  linkedAccountId: "",
  color: "",
  icon: "",
  notes: ""
};

export function GoalsManager({ items, accounts }: Props) {
  const [draft, setDraft] = useState(blankDraft);
  const [state, formAction] = useActionState(upsertGoalAction, defaultState);

  function startEdit(item: GoalItem) {
    setDraft({
      id: item.id,
      name: item.name,
      targetAmount: String(item.targetAmount),
      currentAmount: String(item.currentAmount),
      targetDate: item.targetDate?.slice(0, 10) ?? "",
      priority: item.priority,
      monthlySuggestedContribution: String(item.monthlySuggestedContribution),
      linkedAccountId: item.linkedAccountId ?? "",
      color: item.color ?? "",
      icon: item.icon ?? "",
      notes: item.notes ?? ""
    });
  }

  function resetDraft() {
    setDraft(blankDraft);
  }

  return (
    <div className="grid gap-6 2xl:grid-cols-[0.9fr_1.1fr]">
      <section className="glass-card min-w-0 rounded-[1.75rem] p-5">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm uppercase tracking-[0.18em] text-ink-muted">Edición</p>
            <h2 className="mt-2 text-xl font-semibold text-surface-strong">
              {draft.id ? "Editar meta" : "Nueva meta"}
            </h2>
          </div>
          {draft.id ? (
            <Button onClick={resetDraft} type="button" variant="secondary">
              Cancelar
            </Button>
          ) : null}
        </div>

        <form action={formAction} className="space-y-4">
          <input name="id" type="hidden" value={draft.id} />
          <Input
            label="Nombre"
            name="name"
            onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
            value={draft.name}
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <Input
              label="Monto objetivo"
              name="targetAmount"
              onChange={(event) => setDraft((current) => ({ ...current, targetAmount: event.target.value }))}
              step="0.01"
              type="number"
              value={draft.targetAmount}
            />
            <Input
              label="Avance actual"
              name="currentAmount"
              onChange={(event) => setDraft((current) => ({ ...current, currentAmount: event.target.value }))}
              step="0.01"
              type="number"
              value={draft.currentAmount}
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Input
              label="Fecha objetivo"
              name="targetDate"
              onChange={(event) => setDraft((current) => ({ ...current, targetDate: event.target.value }))}
              type="date"
              value={draft.targetDate}
            />
            <Select
              label="Prioridad"
              name="priority"
              onChange={(event) => setDraft((current) => ({ ...current, priority: event.target.value }))}
              value={draft.priority}
            >
              <option value="LOW">Baja</option>
              <option value="MEDIUM">Media</option>
              <option value="HIGH">Alta</option>
              <option value="CRITICAL">Crítica</option>
            </Select>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Input
              label="Aportación sugerida mensual"
              name="monthlySuggestedContribution"
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  monthlySuggestedContribution: event.target.value
                }))
              }
              step="0.01"
              type="number"
              value={draft.monthlySuggestedContribution}
            />
            <Select
              label="Cuenta asociada"
              name="linkedAccountId"
              onChange={(event) => setDraft((current) => ({ ...current, linkedAccountId: event.target.value }))}
              value={draft.linkedAccountId}
            >
              <option value="">Sin cuenta asociada</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Input
              label="Color"
              name="color"
              onChange={(event) => setDraft((current) => ({ ...current, color: event.target.value }))}
              value={draft.color}
            />
            <Input
              label="Icono"
              name="icon"
              onChange={(event) => setDraft((current) => ({ ...current, icon: event.target.value }))}
              value={draft.icon}
            />
          </div>
          <Textarea
            label="Notas"
            name="notes"
            onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
            value={draft.notes}
          />
          {state.error ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {state.error}
            </p>
          ) : null}
          <FormSubmitButton className="w-full">
            {draft.id ? "Guardar meta" : "Crear meta"}
          </FormSubmitButton>
        </form>
      </section>

      <section className="glass-card min-w-0 rounded-[1.75rem] p-5">
        <div className="mb-5">
          <p className="text-sm uppercase tracking-[0.18em] text-ink-muted">Metas activas</p>
          <h2 className="mt-2 text-xl font-semibold text-surface-strong">Captura y seguimiento</h2>
        </div>
        {items.length ? (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="rounded-2xl border border-black/5 bg-white/70 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-surface-strong">{item.name}</p>
                    <p className="text-sm text-ink-muted">
                      {formatCurrency(item.currentAmount)} de {formatCurrency(item.targetAmount)}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-surface-strong">{item.priority}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.16em] text-ink-soft">
                  <span>{item.linkedAccountName ?? "Sin cuenta"}</span>
                  {item.targetDate ? <span>{formatDate(item.targetDate, "d MMM yyyy")}</span> : null}
                  <span>{formatCurrency(item.monthlySuggestedContribution)}/mes</span>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button onClick={() => startEdit(item)} type="button" variant="secondary">
                    Editar
                  </Button>
                  <form action={deleteGoalAction}>
                    <input name="id" type="hidden" value={item.id} />
                    <Button type="submit" variant="secondary">
                      Eliminar
                    </Button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Sin metas" description="Agrega metas para llevar ahorro, colchón y compras futuras con intención." />
        )}
      </section>
    </div>
  );
}
