"use client";

import { useActionState, useMemo, useState } from "react";
import {
  deleteInstallmentPurchaseAction,
  settleInstallmentPurchaseAction,
  upsertInstallmentPurchaseAction
} from "@/actions/finance";
import { buildInstallmentSchedule, getClosingDateForPurchase } from "@/lib/card-cycle";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import { formatCurrency, formatDate, formatMonthLabel } from "@/lib/format";
import type { ActionState } from "@/validations/finance";

type Item = {
  id: string;
  creditCardId: string;
  creditCardName: string;
  categoryId?: string;
  categoryName?: string;
  title: string;
  merchant?: string;
  totalAmount: number;
  purchaseDate: string;
  totalMonths: number;
  monthlyAmount: number;
  firstChargeMonth: string;
  currentInstallment: number;
  remainingBalance: number;
  status: string;
  isManuallySettled: boolean;
  settledAt?: string;
  notes?: string;
};

type CardOption = {
  id: string;
  name: string;
  closingDay: number;
  dueDay: number;
};

const defaultState: ActionState = {};

const blankDraft = {
  id: "",
  creditCardId: "",
  categoryId: "",
  title: "",
  merchant: "",
  totalAmount: "",
  purchaseDate: new Date().toISOString().slice(0, 10),
  totalMonths: "12",
  firstChargeMonth: new Date().toISOString().slice(0, 7),
  currentInstallment: "1",
  status: "ACTIVE",
  isManuallySettled: false,
  settledAt: "",
  notes: ""
};

export function InstallmentsManager({
  items,
  cards,
  categories
}: {
  items: Item[];
  cards: CardOption[];
  categories: Array<{ id: string; name: string }>;
}) {
  const [draft, setDraft] = useState(blankDraft);
  const [state, formAction] = useActionState(upsertInstallmentPurchaseAction, defaultState);

  const selectedCard = useMemo(
    () => cards.find((card) => card.id === draft.creditCardId),
    [cards, draft.creditCardId]
  );

  const preview = useMemo(() => {
    if (!selectedCard || !draft.totalAmount) {
      return null;
    }

    const purchaseDate = new Date(draft.purchaseDate);
    const firstChargeMonth = draft.firstChargeMonth
      ? new Date(`${draft.firstChargeMonth}-01`)
      : getClosingDateForPurchase(purchaseDate, selectedCard.closingDay);

    const schedule = buildInstallmentSchedule({
      totalAmount: Number(draft.totalAmount),
      totalMonths: Number(draft.totalMonths) || 1,
      firstChargeMonth,
      dueDay: selectedCard.dueDay
    });

    return {
      monthlyAmount: schedule[0]?.amount ?? 0,
      firstDueDate: schedule[0]?.dueDate,
      lastDueDate: schedule.at(-1)?.dueDate,
      schedule: schedule.slice(0, 4)
    };
  }, [draft.firstChargeMonth, draft.purchaseDate, draft.totalAmount, draft.totalMonths, selectedCard]);

  function startEdit(item: Item) {
    setDraft({
      id: item.id,
      creditCardId: item.creditCardId,
      categoryId: item.categoryId ?? "",
      title: item.title,
      merchant: item.merchant ?? "",
      totalAmount: String(item.totalAmount),
      purchaseDate: item.purchaseDate.slice(0, 10),
      totalMonths: String(item.totalMonths),
      firstChargeMonth: item.firstChargeMonth.slice(0, 7),
      currentInstallment: String(item.currentInstallment),
      status: item.status,
      isManuallySettled: item.isManuallySettled,
      settledAt: item.settledAt?.slice(0, 10) ?? "",
      notes: item.notes ?? ""
    });
  }

  function resetDraft() {
    setDraft(blankDraft);
  }

  function handleCardChange(value: string) {
    const card = cards.find((item) => item.id === value);
    const purchaseDate = new Date(draft.purchaseDate);
    const suggestedMonth = card
      ? getClosingDateForPurchase(purchaseDate, card.closingDay).toISOString().slice(0, 7)
      : draft.firstChargeMonth;

    setDraft((current) => ({
      ...current,
      creditCardId: value,
      firstChargeMonth: suggestedMonth
    }));
  }

  return (
    <div className="grid gap-6 2xl:grid-cols-[0.96fr_1.04fr]">
      <section className="glass-card min-w-0 rounded-[1.75rem] p-5">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm uppercase tracking-[0.18em] text-ink-muted">MSI</p>
            <h2 className="mt-2 text-xl font-semibold text-surface-strong">
              {draft.id ? "Editar compra MSI" : "Nueva compra MSI"}
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
            label="Producto o descripción"
            name="title"
            onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
            value={draft.title}
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <Input
              label="Tienda"
              name="merchant"
              onChange={(event) => setDraft((current) => ({ ...current, merchant: event.target.value }))}
              value={draft.merchant}
            />
            <Select
              label="Tarjeta"
              name="creditCardId"
              onChange={(event) => handleCardChange(event.target.value)}
              value={draft.creditCardId}
            >
              <option value="">Selecciona tarjeta</option>
              {cards.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <Input
              label="Monto total"
              name="totalAmount"
              onChange={(event) => setDraft((current) => ({ ...current, totalAmount: event.target.value }))}
              step="0.01"
              type="number"
              value={draft.totalAmount}
            />
            <Input
              label="Fecha de compra"
              name="purchaseDate"
              onChange={(event) => setDraft((current) => ({ ...current, purchaseDate: event.target.value }))}
              type="date"
              value={draft.purchaseDate}
            />
            <Input
              label="Meses"
              name="totalMonths"
              onChange={(event) => setDraft((current) => ({ ...current, totalMonths: event.target.value }))}
              type="number"
              value={draft.totalMonths}
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <Input
              label="Primer mes de cargo"
              name="firstChargeMonth"
              onChange={(event) => setDraft((current) => ({ ...current, firstChargeMonth: event.target.value }))}
              type="month"
              value={draft.firstChargeMonth}
            />
            <Input
              label="Mensualidad actual #"
              name="currentInstallment"
              onChange={(event) => setDraft((current) => ({ ...current, currentInstallment: event.target.value }))}
              type="number"
              value={draft.currentInstallment}
            />
            <Select
              label="Estado"
              name="status"
              onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))}
              value={draft.status}
            >
              <option value="ACTIVE">Activa</option>
              <option value="COMPLETED">Completada</option>
              <option value="PAID_OFF">Liquidada</option>
              <option value="EARLY_SETTLED">Liquidación anticipada</option>
              <option value="CANCELLED">Cancelada</option>
            </Select>
          </div>
          <Select
            label="Categoría"
            name="categoryId"
            onChange={(event) => setDraft((current) => ({ ...current, categoryId: event.target.value }))}
            value={draft.categoryId}
          >
            <option value="">Sin categoría</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
          <Toggle
            checked={draft.isManuallySettled}
            label="Marcada como liquidada manualmente"
            name="isManuallySettled"
            onChange={(event) =>
              setDraft((current) => ({ ...current, isManuallySettled: event.target.checked }))
            }
          />
          <Input
            label="Fecha de liquidación"
            name="settledAt"
            onChange={(event) => setDraft((current) => ({ ...current, settledAt: event.target.value }))}
            type="date"
            value={draft.settledAt}
          />
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
            {draft.id ? "Guardar compra MSI" : "Crear compra MSI"}
          </FormSubmitButton>
        </form>
      </section>

      <section className="glass-card min-w-0 rounded-[1.75rem] p-5">
        <div className="mb-5">
          <p className="text-sm uppercase tracking-[0.18em] text-ink-muted">Preview</p>
          <h2 className="mt-2 text-xl font-semibold text-surface-strong">
            Calendario generado
          </h2>
        </div>

        {preview ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-black/5 bg-white/70 p-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <p className="text-sm text-ink-muted">Mensualidad estimada</p>
                  <p className="mt-1 font-semibold text-surface-strong">
                    {formatCurrency(preview.monthlyAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-ink-muted">Último cargo</p>
                  <p className="mt-1 font-semibold text-surface-strong">
                    {preview.lastDueDate ? formatDate(preview.lastDueDate, "d MMM yyyy") : "N/A"}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-ink-muted">
                Primer vencimiento {preview.firstDueDate ? formatDate(preview.firstDueDate, "d MMM yyyy") : "N/A"}.
              </p>
            </div>

            <div className="space-y-3">
              {preview.schedule.map((payment) => (
                <div key={payment.installmentNumber} className="rounded-2xl border border-black/5 bg-white/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-surface-strong">
                      Mensualidad {payment.installmentNumber}
                    </p>
                    <p className="text-sm text-ink-muted">
                      {formatCurrency(payment.amount)}
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-ink-muted">
                    Cargo {formatMonthLabel(payment.chargeMonth)} · vence {formatDate(payment.dueDate, "d MMM yyyy")}
                  </p>
                </div>
              ))}
            </div>

          </div>
        ) : (
          <EmptyState title="Completa la compra" description="Selecciona tarjeta, monto y meses para generar la amortización inicial." />
        )}

        <div className="mt-6 space-y-3">
          {items.length ? (
            items.map((item) => (
              <div key={item.id} className="rounded-2xl border border-black/5 bg-white/70 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-surface-strong">{item.title}</p>
                    <p className="text-sm text-ink-muted">
                      {item.creditCardName}
                      {item.merchant ? ` · ${item.merchant}` : ""}
                    </p>
                  </div>
                  <p className="font-semibold text-surface-strong">
                    {formatCurrency(item.monthlyAmount)}
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.16em] text-ink-soft">
                  <span>{item.currentInstallment}/{item.totalMonths}</span>
                  <span>{item.status}</span>
                  <span>Pendiente {formatCurrency(item.remainingBalance)}</span>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button onClick={() => startEdit(item)} type="button" variant="secondary">
                    Editar
                  </Button>
                  {item.remainingBalance > 0 && item.status === "ACTIVE" ? (
                    <form action={settleInstallmentPurchaseAction}>
                      <input name="id" type="hidden" value={item.id} />
                      <Button type="submit" variant="secondary">
                        Liquidar hoy
                      </Button>
                    </form>
                  ) : null}
                  <form action={deleteInstallmentPurchaseAction}>
                    <input name="id" type="hidden" value={item.id} />
                    <Button type="submit" variant="secondary">
                      Eliminar
                    </Button>
                  </form>
                </div>
              </div>
            ))
          ) : (
            <EmptyState title="Sin compras MSI" description="Registra compras a meses para proyectar carga, fin de mensualidades y alivio futuro." />
          )}
        </div>
      </section>
    </div>
  );
}
