"use client";

import { useActionState, useMemo, useState } from "react";
import { deleteBudgetAction, upsertBudgetAction } from "@/actions/finance";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import { formatCurrency } from "@/lib/format";
import type { ActionState } from "@/validations/finance";

type BudgetItem = {
  id: string;
  name?: string;
  scope: string;
  month: string;
  limitAmount: number;
  alertPercent: number;
  carryOver: boolean;
  categoryId?: string;
  categoryName?: string;
  subcategoryId?: string;
  subcategoryName?: string;
};

type Props = {
  items: BudgetItem[];
  categories: Array<{ id: string; name: string }>;
  subcategories: Array<{ id: string; name: string; categoryId: string }>;
};

const defaultState: ActionState = {};

const blankDraft = {
  id: "",
  name: "",
  scope: "CATEGORY",
  month: new Date().toISOString().slice(0, 7),
  limitAmount: "",
  alertPercent: "80",
  carryOver: false,
  categoryId: "",
  subcategoryId: ""
};

export function BudgetsManager({ items, categories, subcategories }: Props) {
  const [draft, setDraft] = useState(blankDraft);
  const [state, formAction] = useActionState(upsertBudgetAction, defaultState);

  const filteredSubcategories = useMemo(
    () =>
      draft.categoryId
        ? subcategories.filter((item) => item.categoryId === draft.categoryId)
        : [],
    [draft.categoryId, subcategories]
  );

  function startEdit(item: BudgetItem) {
    setDraft({
      id: item.id,
      name: item.name ?? "",
      scope: item.scope,
      month: item.month,
      limitAmount: String(item.limitAmount),
      alertPercent: String(item.alertPercent),
      carryOver: item.carryOver,
      categoryId: item.categoryId ?? "",
      subcategoryId: item.subcategoryId ?? ""
    });
  }

  function resetDraft() {
    setDraft(blankDraft);
  }

  return (
    <div className="grid gap-6 2xl:grid-cols-[0.88fr_1.12fr]">
      <section className="glass-card min-w-0 rounded-[1.75rem] p-5">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm uppercase tracking-[0.18em] text-ink-muted">Definición</p>
            <h2 className="mt-2 text-xl font-semibold text-surface-strong">
              {draft.id ? "Editar presupuesto" : "Nuevo presupuesto"}
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
          <div className="grid gap-4 lg:grid-cols-2">
            <Select
              label="Alcance"
              name="scope"
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  scope: event.target.value,
                  categoryId: "",
                  subcategoryId: ""
                }))
              }
              value={draft.scope}
            >
              <option value="GLOBAL">Global</option>
              <option value="CATEGORY">Categoría</option>
              <option value="SUBCATEGORY">Subcategoría</option>
            </Select>
            <Input
              label="Mes"
              name="month"
              onChange={(event) => setDraft((current) => ({ ...current, month: event.target.value }))}
              type="month"
              value={draft.month}
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Input
              label="Límite"
              name="limitAmount"
              onChange={(event) => setDraft((current) => ({ ...current, limitAmount: event.target.value }))}
              step="0.01"
              type="number"
              value={draft.limitAmount}
            />
            <Input
              label="Alerta (%)"
              name="alertPercent"
              onChange={(event) => setDraft((current) => ({ ...current, alertPercent: event.target.value }))}
              type="number"
              value={draft.alertPercent}
            />
          </div>

          {draft.scope === "GLOBAL" ? (
            <Input
              label="Nombre"
              name="name"
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              placeholder="Ej. Variable mensual"
              value={draft.name}
            />
          ) : null}

          {draft.scope !== "GLOBAL" ? (
            <Select
              label="Categoría"
              name="categoryId"
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  categoryId: event.target.value,
                  subcategoryId: ""
                }))
              }
              value={draft.categoryId}
            >
              <option value="">Selecciona categoría</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          ) : null}

          {draft.scope === "SUBCATEGORY" ? (
            <Select
              label="Subcategoría"
              name="subcategoryId"
              onChange={(event) => setDraft((current) => ({ ...current, subcategoryId: event.target.value }))}
              value={draft.subcategoryId}
            >
              <option value="">Selecciona subcategoría</option>
              {filteredSubcategories.map((subcategory) => (
                <option key={subcategory.id} value={subcategory.id}>
                  {subcategory.name}
                </option>
              ))}
            </Select>
          ) : null}

          <Toggle
            checked={draft.carryOver}
            label="Acumular remanente"
            name="carryOver"
            onChange={(event) =>
              setDraft((current) => ({ ...current, carryOver: event.target.checked }))
            }
          />

          {state.error ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {state.error}
            </p>
          ) : null}
          <FormSubmitButton className="w-full">
            {draft.id ? "Guardar presupuesto" : "Crear presupuesto"}
          </FormSubmitButton>
        </form>
      </section>

      <section className="glass-card min-w-0 rounded-[1.75rem] p-5">
        <div className="mb-5">
          <p className="text-sm uppercase tracking-[0.18em] text-ink-muted">Configurados</p>
          <h2 className="mt-2 text-xl font-semibold text-surface-strong">Presupuestos activos</h2>
        </div>

        {items.length ? (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="rounded-2xl border border-black/5 bg-white/70 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-surface-strong">
                      {item.name ?? item.subcategoryName ?? item.categoryName ?? "Presupuesto"}
                    </p>
                    <p className="text-sm text-ink-muted">
                      {item.scope} · {item.month}
                    </p>
                  </div>
                  <p className="font-semibold text-surface-strong">{formatCurrency(item.limitAmount)}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.16em] text-ink-soft">
                  <span>Alerta {item.alertPercent}%</span>
                  <span>{item.carryOver ? "Con rollover" : "Sin rollover"}</span>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button onClick={() => startEdit(item)} type="button" variant="secondary">
                    Editar
                  </Button>
                  <form action={deleteBudgetAction}>
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
          <EmptyState title="Sin presupuestos" description="Crea límites globales o por categoría para controlar gasto con intención." />
        )}
      </section>
    </div>
  );
}
