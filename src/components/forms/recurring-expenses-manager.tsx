"use client";

import { useActionState, useMemo, useState } from "react";
import { deleteRecurringExpenseAction, upsertRecurringExpenseAction } from "@/actions/finance";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import { formatCurrency, formatDate } from "@/lib/format";
import type { ActionState } from "@/validations/finance";

type ExpenseItem = {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  nextDueDate: string;
  reminderDays: number;
  isEssential: boolean;
  isActive: boolean;
  merchant?: string;
  notes?: string;
  categoryId: string;
  categoryName: string;
  subcategoryId?: string;
  subcategoryName?: string;
  paymentAccountId?: string;
  paymentAccountName?: string;
};

type Option = {
  id: string;
  name: string;
};

type Props = {
  items: ExpenseItem[];
  categories: Option[];
  subcategories: Array<{ id: string; name: string; categoryId: string }>;
  accounts: Option[];
};

const defaultState: ActionState = {};

const blankDraft = {
  id: "",
  name: "",
  amount: "",
  frequency: "MONTHLY",
  nextDueDate: new Date().toISOString().slice(0, 10),
  reminderDays: "3",
  merchant: "",
  notes: "",
  categoryId: "",
  subcategoryId: "",
  paymentAccountId: "",
  isEssential: true,
  isActive: true
};

export function RecurringExpensesManager({
  items,
  categories,
  subcategories,
  accounts
}: Props) {
  const [draft, setDraft] = useState(blankDraft);
  const [state, formAction] = useActionState(upsertRecurringExpenseAction, defaultState);

  const filteredSubcategories = useMemo(
    () =>
      draft.categoryId
        ? subcategories.filter((item) => item.categoryId === draft.categoryId)
        : [],
    [draft.categoryId, subcategories]
  );

  function startEdit(item: ExpenseItem) {
    setDraft({
      id: item.id,
      name: item.name,
      amount: String(item.amount),
      frequency: item.frequency,
      nextDueDate: item.nextDueDate.slice(0, 10),
      reminderDays: String(item.reminderDays),
      merchant: item.merchant ?? "",
      notes: item.notes ?? "",
      categoryId: item.categoryId,
      subcategoryId: item.subcategoryId ?? "",
      paymentAccountId: item.paymentAccountId ?? "",
      isEssential: item.isEssential,
      isActive: item.isActive
    });
  }

  function resetDraft() {
    setDraft(blankDraft);
  }

  return (
    <div className="grid gap-6 2xl:grid-cols-[0.92fr_1.08fr]">
      <section className="glass-card min-w-0 rounded-[1.75rem] p-5">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm uppercase tracking-[0.18em] text-ink-muted">
              Configuración
            </p>
            <h2 className="mt-2 text-xl font-semibold text-surface-strong">
              {draft.id ? "Editar gasto fijo" : "Nuevo gasto fijo"}
            </h2>
          </div>
          {draft.id ? (
            <Button onClick={resetDraft} type="button" variant="secondary">
              Cancelar edición
            </Button>
          ) : null}
        </div>

        <form action={formAction} className="space-y-4">
          <input name="id" type="hidden" value={draft.id} />
          <div className="grid gap-4 lg:grid-cols-2">
            <Input
              label="Nombre"
              name="name"
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              placeholder="Ej. Renta, Spotify, Seguro"
              value={draft.name}
            />
            <Input
              label="Monto"
              name="amount"
              onChange={(event) => setDraft((current) => ({ ...current, amount: event.target.value }))}
              step="0.01"
              type="number"
              value={draft.amount}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <Select
              label="Frecuencia"
              name="frequency"
              onChange={(event) => setDraft((current) => ({ ...current, frequency: event.target.value }))}
              value={draft.frequency}
            >
              <option value="WEEKLY">Semanal</option>
              <option value="BIWEEKLY">Quincenal</option>
              <option value="MONTHLY">Mensual</option>
              <option value="QUARTERLY">Trimestral</option>
              <option value="SEMIANNUALLY">Semestral</option>
              <option value="YEARLY">Anual</option>
            </Select>
            <Input
              label="Próxima fecha"
              name="nextDueDate"
              onChange={(event) => setDraft((current) => ({ ...current, nextDueDate: event.target.value }))}
              type="date"
              value={draft.nextDueDate}
            />
            <Input
              label="Recordatorio (días)"
              name="reminderDays"
              onChange={(event) => setDraft((current) => ({ ...current, reminderDays: event.target.value }))}
              type="number"
              value={draft.reminderDays}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
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
              <option value="">Selecciona una categoría</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
            <Select
              label="Subcategoría"
              name="subcategoryId"
              onChange={(event) => setDraft((current) => ({ ...current, subcategoryId: event.target.value }))}
              value={draft.subcategoryId}
            >
              <option value="">Sin subcategoría</option>
              {filteredSubcategories.map((subcategory) => (
                <option key={subcategory.id} value={subcategory.id}>
                  {subcategory.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Input
              label="Comercio"
              name="merchant"
              onChange={(event) => setDraft((current) => ({ ...current, merchant: event.target.value }))}
              placeholder="Opcional"
              value={draft.merchant}
            />
            <Select
              label="Cuenta de pago"
              name="paymentAccountId"
              onChange={(event) => setDraft((current) => ({ ...current, paymentAccountId: event.target.value }))}
              value={draft.paymentAccountId}
            >
              <option value="">Sin cuenta asignada</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Toggle
              checked={draft.isEssential}
              label="Obligatorio"
              name="isEssential"
              onChange={(event) =>
                setDraft((current) => ({ ...current, isEssential: event.target.checked }))
              }
            />
            <Toggle
              checked={draft.isActive}
              label="Activo"
              name="isActive"
              onChange={(event) =>
                setDraft((current) => ({ ...current, isActive: event.target.checked }))
              }
            />
          </div>

          <Textarea
            label="Notas"
            name="notes"
            onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
            placeholder="Condiciones, referencia de cobro o comentario."
            value={draft.notes}
          />

          {state.error ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {state.error}
            </p>
          ) : null}

          <FormSubmitButton className="w-full">
            {draft.id ? "Guardar cambios" : "Crear gasto fijo"}
          </FormSubmitButton>
        </form>
      </section>

      <section className="glass-card min-w-0 rounded-[1.75rem] p-5">
        <div className="mb-5">
          <p className="text-sm uppercase tracking-[0.18em] text-ink-muted">
            Calendario
          </p>
          <h2 className="mt-2 text-xl font-semibold text-surface-strong">
            Próximos cobros
          </h2>
        </div>

        {items.length ? (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="rounded-2xl border border-black/5 bg-white/70 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-surface-strong">{item.name}</p>
                    <p className="text-sm text-ink-muted">
                      {item.categoryName}
                      {item.subcategoryName ? ` · ${item.subcategoryName}` : ""}
                      {item.paymentAccountName ? ` · ${item.paymentAccountName}` : ""}
                    </p>
                  </div>
                  <p className="font-semibold text-surface-strong">
                    {formatCurrency(item.amount)}
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.16em] text-ink-soft">
                  <span>{item.frequency}</span>
                  <span>{formatDate(item.nextDueDate, "d MMM yyyy")}</span>
                  <span>{item.isEssential ? "Obligatorio" : "Prescindible"}</span>
                  <span>{item.isActive ? "Activo" : "Pausado"}</span>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button onClick={() => startEdit(item)} type="button" variant="secondary">
                    Editar
                  </Button>
                  <form action={deleteRecurringExpenseAction}>
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
          <EmptyState
            title="Sin gastos fijos"
            description="Agrega rentas, suscripciones o cargos periódicos para proyectar mejor tu flujo."
          />
        )}
      </section>
    </div>
  );
}
