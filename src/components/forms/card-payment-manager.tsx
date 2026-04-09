"use client";

import { useActionState, useState } from "react";
import { createCardPaymentAction } from "@/actions/finance";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatDate } from "@/lib/format";
import type { ActionState } from "@/validations/finance";

type PaymentItem = {
  id: string;
  postedAt: string;
  amount: number;
  sourceAccountName?: string;
  description: string;
};

type Props = {
  cardId: string;
  cardName: string;
  currentStatementBalance: number;
  currentMinimumDue: number;
  sourceAccounts: Array<{ id: string; name: string }>;
  recentPayments: PaymentItem[];
};

const defaultState: ActionState = {};

export function CardPaymentManager({
  cardId,
  cardName,
  currentStatementBalance,
  currentMinimumDue,
  sourceAccounts,
  recentPayments
}: Props) {
  const [draft, setDraft] = useState({
    sourceAccountId: sourceAccounts[0]?.id ?? "",
    postedAt: new Date().toISOString().slice(0, 10),
    amount: currentMinimumDue > 0 ? String(currentMinimumDue) : "",
    description: `Abono a tarjeta ${cardName}`,
    notes: ""
  });
  const [state, formAction] = useActionState(createCardPaymentAction, defaultState);

  return (
    <div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
      <section className="rounded-2xl border border-black/5 bg-white/70 p-4">
        <div className="mb-4">
          <p className="text-sm uppercase tracking-[0.18em] text-ink-muted">Abono</p>
          <h3 className="mt-2 text-lg font-semibold text-surface-strong">
            Registrar pago a la tarjeta
          </h3>
          <p className="mt-2 text-sm leading-6 text-ink-muted">
            Si acabas de abonar a esta tarjeta, regístralo aquí para bajar el saldo total y el monto pendiente del corte.
          </p>
        </div>

        <form action={formAction} className="space-y-4">
          <input name="cardId" type="hidden" value={cardId} />
          <div className="grid gap-4 lg:grid-cols-2">
            <Select
              label="Cuenta desde la que pagaste"
              name="sourceAccountId"
              onChange={(event) =>
                setDraft((current) => ({ ...current, sourceAccountId: event.target.value }))
              }
              value={draft.sourceAccountId}
            >
              <option value="">Selecciona cuenta</option>
              {sourceAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </Select>
            <Input
              label="Fecha de pago"
              name="postedAt"
              onChange={(event) =>
                setDraft((current) => ({ ...current, postedAt: event.target.value }))
              }
              type="date"
              value={draft.postedAt}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Input
              label="Monto abonado"
              name="amount"
              onChange={(event) =>
                setDraft((current) => ({ ...current, amount: event.target.value }))
              }
              step="0.01"
              type="number"
              value={draft.amount}
            />
            <Input
              label="Descripción"
              name="description"
              onChange={(event) =>
                setDraft((current) => ({ ...current, description: event.target.value }))
              }
              value={draft.description}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-black/5 bg-black/[0.02] px-4 py-3 text-sm leading-6 text-ink-muted">
              Mínimo vigente: <span className="font-semibold text-surface-strong">{formatCurrency(currentMinimumDue)}</span>
            </div>
            <div className="rounded-2xl border border-black/5 bg-black/[0.02] px-4 py-3 text-sm leading-6 text-ink-muted">
              Pago para no generar intereses: <span className="font-semibold text-surface-strong">{formatCurrency(currentStatementBalance)}</span>
            </div>
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

          <FormSubmitButton className="w-full">Registrar abono</FormSubmitButton>
        </form>
      </section>

      <section className="rounded-2xl border border-black/5 bg-white/70 p-4">
        <div className="mb-4">
          <p className="text-sm uppercase tracking-[0.18em] text-ink-muted">Historial</p>
          <h3 className="mt-2 text-lg font-semibold text-surface-strong">Pagos recientes</h3>
        </div>

        <div className="space-y-3">
          {recentPayments.length ? (
            recentPayments.map((payment) => (
              <div key={payment.id} className="rounded-2xl border border-black/5 bg-white p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-surface-strong">{payment.description}</p>
                    <p className="text-sm text-ink-muted">
                      {payment.sourceAccountName ?? "Sin cuenta origen"} · {formatDate(payment.postedAt, "d MMM yyyy")}
                    </p>
                  </div>
                  <p className="font-semibold text-surface-strong">{formatCurrency(payment.amount)}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-2xl border border-black/5 bg-white px-4 py-6 text-sm leading-6 text-ink-muted">
              Todavía no hay abonos registrados para esta tarjeta.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
