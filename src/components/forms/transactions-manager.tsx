"use client";

import { useActionState, useMemo, useState } from "react";
import { upsertTransactionAction, deleteTransactionAction } from "@/actions/finance";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatDate } from "@/lib/format";
import type { ActionState } from "@/validations/finance";

type TransactionItem = {
  id: string;
  postedAt: string;
  amount: number;
  type: string;
  cadence: string;
  planning: string;
  description: string;
  merchant?: string;
  notes?: string;
  categoryId?: string;
  categoryName?: string;
  subcategoryId?: string;
  subcategoryName?: string;
  sourceAccountId?: string;
  sourceAccountName?: string;
  destinationAccountId?: string;
  destinationAccountName?: string;
  savingsGoalId?: string;
  tags: string[];
};

type Option = {
  id: string;
  name: string;
  meta?: string;
};

type Props = {
  items: TransactionItem[];
  accounts: Option[];
  categories: Array<{ id: string; name: string; kind: string }>;
  subcategories: Array<{ id: string; name: string; categoryId: string }>;
  goals: Option[];
};

const defaultState: ActionState = {};

const blankDraft = {
  id: "",
  postedAt: new Date().toISOString().slice(0, 10),
  amount: "",
  type: "EXPENSE",
  cadence: "ONE_TIME",
  planning: "UNPLANNED",
  description: "",
  merchant: "",
  notes: "",
  categoryId: "",
  subcategoryId: "",
  sourceAccountId: "",
  destinationAccountId: "",
  savingsGoalId: "",
  tagNames: ""
};

export function TransactionsManager({
  items,
  accounts,
  categories,
  subcategories,
  goals
}: Props) {
  const [draft, setDraft] = useState(blankDraft);
  const [state, formAction] = useActionState(upsertTransactionAction, defaultState);

  const filteredSubcategories = useMemo(
    () =>
      draft.categoryId
        ? subcategories.filter((item) => item.categoryId === draft.categoryId)
        : [],
    [draft.categoryId, subcategories]
  );

  function startEdit(item: TransactionItem) {
    setDraft({
      id: item.id,
      postedAt: item.postedAt.slice(0, 10),
      amount: String(item.amount),
      type: item.type,
      cadence: item.cadence,
      planning: item.planning,
      description: item.description,
      merchant: item.merchant ?? "",
      notes: item.notes ?? "",
      categoryId: item.categoryId ?? "",
      subcategoryId: item.subcategoryId ?? "",
      sourceAccountId: item.sourceAccountId ?? "",
      destinationAccountId: item.destinationAccountId ?? "",
      savingsGoalId: item.savingsGoalId ?? "",
      tagNames: item.tags.join(", ")
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
            <p className="text-sm uppercase tracking-[0.18em] text-ink-muted">
              Formulario
            </p>
            <h2 className="mt-2 text-xl font-semibold text-surface-strong">
              {draft.id ? "Editar movimiento" : "Nuevo movimiento"}
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
              label="Fecha"
              name="postedAt"
              onChange={(event) => setDraft((current) => ({ ...current, postedAt: event.target.value }))}
              type="date"
              value={draft.postedAt}
            />
            <Input
              label="Monto"
              name="amount"
              onChange={(event) => setDraft((current) => ({ ...current, amount: event.target.value }))}
              placeholder="0"
              step="0.01"
              type="number"
              value={draft.amount}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <Select
              label="Tipo"
              name="type"
              onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value }))}
              value={draft.type}
            >
              <option value="INCOME">Ingreso</option>
              <option value="EXPENSE">Gasto</option>
              <option value="TRANSFER">Transferencia</option>
              <option value="CREDIT_CARD_PAYMENT">Pago de tarjeta</option>
              <option value="LOAN_PAYMENT">Abono a préstamo</option>
              <option value="SAVINGS_CONTRIBUTION">Aportación a ahorro</option>
              <option value="REFUND">Reembolso</option>
              <option value="ADJUSTMENT">Ajuste</option>
            </Select>
            <Select
              label="Cadencia"
              name="cadence"
              onChange={(event) => setDraft((current) => ({ ...current, cadence: event.target.value }))}
              value={draft.cadence}
            >
              <option value="ONE_TIME">Único</option>
              <option value="RECURRING">Recurrente</option>
              <option value="INSTALLMENT">MSI</option>
            </Select>
            <Select
              label="Planeación"
              name="planning"
              onChange={(event) => setDraft((current) => ({ ...current, planning: event.target.value }))}
              value={draft.planning}
            >
              <option value="PLANNED">Planeado</option>
              <option value="UNPLANNED">No planeado</option>
            </Select>
          </div>

          <Input
            label="Descripción"
            name="description"
            onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
            placeholder="Ej. Supermercado, nómina, pago AMEX"
            value={draft.description}
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <Input
              label="Comercio"
              name="merchant"
              onChange={(event) => setDraft((current) => ({ ...current, merchant: event.target.value }))}
              placeholder="Opcional"
              value={draft.merchant}
            />
            <Input
              label="Etiquetas"
              name="tagNames"
              onChange={(event) => setDraft((current) => ({ ...current, tagNames: event.target.value }))}
              placeholder="Quincena, Viaje, Impulso"
              value={draft.tagNames}
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
              <option value="">Sin categoría</option>
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
            <Select
              label="Cuenta origen"
              name="sourceAccountId"
              onChange={(event) => setDraft((current) => ({ ...current, sourceAccountId: event.target.value }))}
              value={draft.sourceAccountId}
            >
              <option value="">Sin cuenta origen</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </Select>
            <Select
              label="Cuenta destino"
              name="destinationAccountId"
              onChange={(event) => setDraft((current) => ({ ...current, destinationAccountId: event.target.value }))}
              value={draft.destinationAccountId}
            >
              <option value="">Sin cuenta destino</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </Select>
          </div>

          <Select
            label="Meta de ahorro"
            name="savingsGoalId"
            onChange={(event) => setDraft((current) => ({ ...current, savingsGoalId: event.target.value }))}
            value={draft.savingsGoalId}
          >
            <option value="">Sin meta ligada</option>
            {goals.map((goal) => (
              <option key={goal.id} value={goal.id}>
                {goal.name}
              </option>
            ))}
          </Select>

          <Textarea
            label="Notas"
            name="notes"
            onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
            placeholder="Contexto adicional, reglas personales o comentario del movimiento."
            value={draft.notes}
          />

          {state.error ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {state.error}
            </p>
          ) : null}

          <FormSubmitButton className="w-full">
            {draft.id ? "Guardar cambios" : "Crear movimiento"}
          </FormSubmitButton>
        </form>
      </section>

      <section className="glass-card min-w-0 rounded-[1.75rem] p-5">
        <div className="mb-5">
          <p className="text-sm uppercase tracking-[0.18em] text-ink-muted">
            Historial
          </p>
          <h2 className="mt-2 text-xl font-semibold text-surface-strong">
            Movimientos recientes
          </h2>
        </div>

        {items.length ? (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="rounded-2xl border border-black/5 bg-white/70 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-surface-strong">{item.description}</p>
                    <p className="truncate text-sm text-ink-muted">
                      {item.categoryName ?? "Sin categoría"}
                      {item.subcategoryName ? ` · ${item.subcategoryName}` : ""}
                      {item.sourceAccountName ? ` · ${item.sourceAccountName}` : ""}
                    </p>
                  </div>
                  <p className="shrink-0 font-semibold text-surface-strong">
                    {formatCurrency(item.amount)}
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.16em] text-ink-soft">
                  <span>{item.type}</span>
                  <span>{formatDate(item.postedAt, "d MMM")}</span>
                  <span>{item.planning}</span>
                  {item.tags.map((tag) => (
                    <span key={tag}>#{tag}</span>
                  ))}
                </div>
                <div className="mt-4 flex gap-2">
                  <Button onClick={() => startEdit(item)} type="button" variant="secondary">
                    Editar
                  </Button>
                  <form action={deleteTransactionAction}>
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
            title="Sin movimientos capturados"
            description="Registra ingresos, gastos, transferencias o pagos para empezar a poblar tu flujo real."
          />
        )}
      </section>
    </div>
  );
}
