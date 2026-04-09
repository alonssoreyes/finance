"use client";

import { useActionState, useState } from "react";
import { deleteAccountAction, upsertAccountAction } from "@/actions/finance";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import { formatCurrency } from "@/lib/format";
import type { ActionState } from "@/validations/finance";

type Item = {
  id: string;
  name: string;
  type: string;
  institution?: string;
  last4?: string;
  currentBalance: number;
  availableBalance?: number;
  color?: string;
  icon?: string;
  includeInNetWorth: boolean;
  isLiquid: boolean;
  notes?: string;
};

const defaultState: ActionState = {};

const blankDraft = {
  id: "",
  name: "",
  type: "CHECKING",
  institution: "",
  last4: "",
  currentBalance: "0",
  availableBalance: "",
  color: "",
  icon: "",
  includeInNetWorth: true,
  isLiquid: true,
  notes: ""
};

export function AccountsManager({ items }: { items: Item[] }) {
  const [draft, setDraft] = useState(blankDraft);
  const [state, formAction] = useActionState(upsertAccountAction, defaultState);

  function startEdit(item: Item) {
    setDraft({
      id: item.id,
      name: item.name,
      type: item.type,
      institution: item.institution ?? "",
      last4: item.last4 ?? "",
      currentBalance: String(item.currentBalance),
      availableBalance: item.availableBalance != null ? String(item.availableBalance) : "",
      color: item.color ?? "",
      icon: item.icon ?? "",
      includeInNetWorth: item.includeInNetWorth,
      isLiquid: item.isLiquid,
      notes: item.notes ?? ""
    });
  }

  function resetDraft() {
    setDraft(blankDraft);
  }

  return (
    <div className="grid gap-6 2xl:grid-cols-[0.95fr_1.05fr]">
      <section className="glass-card min-w-0 rounded-[1.75rem] p-5">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm uppercase tracking-[0.18em] text-ink-muted">Cuentas</p>
            <h2 className="mt-2 text-xl font-semibold text-surface-strong">
              {draft.id ? "Editar cuenta" : "Nueva cuenta"}
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
            <Select
              label="Tipo"
              name="type"
              onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value }))}
              value={draft.type}
            >
              <option value="CHECKING">Cuenta principal</option>
              <option value="DEBIT">Débito</option>
              <option value="SAVINGS">Ahorro</option>
              <option value="CASH">Efectivo</option>
              <option value="INVESTMENT">Inversión</option>
              <option value="OTHER">Otra</option>
            </Select>
            <Input
              label="Institución"
              name="institution"
              onChange={(event) =>
                setDraft((current) => ({ ...current, institution: event.target.value }))
              }
              value={draft.institution}
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Input
              label="Saldo actual"
              name="currentBalance"
              onChange={(event) =>
                setDraft((current) => ({ ...current, currentBalance: event.target.value }))
              }
              step="0.01"
              type="number"
              value={draft.currentBalance}
            />
            <Input
              label="Saldo disponible"
              name="availableBalance"
              onChange={(event) =>
                setDraft((current) => ({ ...current, availableBalance: event.target.value }))
              }
              step="0.01"
              type="number"
              value={draft.availableBalance}
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Input
              label="Últimos 4"
              maxLength={4}
              name="last4"
              onChange={(event) => setDraft((current) => ({ ...current, last4: event.target.value }))}
              value={draft.last4}
            />
            <Input
              label="Color"
              name="color"
              onChange={(event) => setDraft((current) => ({ ...current, color: event.target.value }))}
              value={draft.color}
            />
          </div>
          <Input
            label="Icono"
            name="icon"
            onChange={(event) => setDraft((current) => ({ ...current, icon: event.target.value }))}
            value={draft.icon}
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <Toggle
              checked={draft.includeInNetWorth}
              label="Incluir en patrimonio"
              name="includeInNetWorth"
              onChange={(event) =>
                setDraft((current) => ({ ...current, includeInNetWorth: event.target.checked }))
              }
            />
            <Toggle
              checked={draft.isLiquid}
              label="Cuenta líquida"
              name="isLiquid"
              onChange={(event) =>
                setDraft((current) => ({ ...current, isLiquid: event.target.checked }))
              }
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
            {draft.id ? "Guardar cuenta" : "Crear cuenta"}
          </FormSubmitButton>
        </form>
      </section>

      <section className="glass-card min-w-0 rounded-[1.75rem] p-5">
        <div className="mb-5">
          <p className="text-sm uppercase tracking-[0.18em] text-ink-muted">Cuentas líquidas</p>
          <h2 className="mt-2 text-xl font-semibold text-surface-strong">Base operativa</h2>
        </div>
        {items.length ? (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="rounded-2xl border border-black/5 bg-white/70 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-surface-strong">{item.name}</p>
                    <p className="text-sm text-ink-muted">
                      {item.type}
                      {item.institution ? ` · ${item.institution}` : ""}
                    </p>
                  </div>
                  <p className="font-semibold text-surface-strong">{formatCurrency(item.currentBalance)}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.16em] text-ink-soft">
                  <span>{item.isLiquid ? "Líquida" : "No líquida"}</span>
                  <span>{item.includeInNetWorth ? "Incluida" : "Excluida"} en patrimonio</span>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button onClick={() => startEdit(item)} type="button" variant="secondary">
                    Editar
                  </Button>
                  <form action={deleteAccountAction}>
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
          <EmptyState title="Sin cuentas" description="Agrega cuentas de efectivo, débito, ahorro o inversión para operar la app con saldo real." />
        )}
      </section>
    </div>
  );
}
