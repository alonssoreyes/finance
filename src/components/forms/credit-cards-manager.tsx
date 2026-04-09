"use client";

import { useActionState, useState } from "react";
import { deleteCreditCardAction, upsertCreditCardAction } from "@/actions/finance";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatDate } from "@/lib/format";
import type { ActionState } from "@/validations/finance";

type Item = {
  id: string;
  accountId: string;
  name: string;
  bank: string;
  last4: string;
  statementClosingDay: number;
  paymentDueDay: number;
  creditLimit: number;
  statementBalance: number;
  payoffBalance: number;
  minimumDueAmount?: number;
  annualInterestRate?: number;
  minimumPaymentRatio?: number;
  paymentTracking: string;
  nextStatementDate?: string;
  nextDueDate?: string;
  color?: string;
  icon?: string;
  notes?: string;
};

const defaultState: ActionState = {};

const blankDraft = {
  id: "",
  accountId: "",
  name: "",
  bank: "",
  last4: "",
  statementClosingDay: "1",
  paymentDueDay: "10",
  creditLimit: "",
  statementBalance: "0",
  payoffBalance: "0",
  minimumDueAmount: "",
  annualInterestRate: "",
  minimumPaymentRatio: "",
  paymentTracking: "BOTH",
  nextStatementDate: "",
  nextDueDate: "",
  color: "",
  icon: "",
  notes: ""
};

export function CreditCardsManager({ items }: { items: Item[] }) {
  const [draft, setDraft] = useState(blankDraft);
  const [state, formAction] = useActionState(upsertCreditCardAction, defaultState);

  function startEdit(item: Item) {
    setDraft({
      id: item.id,
      accountId: item.accountId,
      name: item.name,
      bank: item.bank,
      last4: item.last4,
      statementClosingDay: String(item.statementClosingDay),
      paymentDueDay: String(item.paymentDueDay),
      creditLimit: String(item.creditLimit),
      statementBalance: String(item.statementBalance),
      payoffBalance: String(item.payoffBalance),
      minimumDueAmount: item.minimumDueAmount != null ? String(item.minimumDueAmount) : "",
      annualInterestRate: item.annualInterestRate != null ? String(item.annualInterestRate) : "",
      minimumPaymentRatio: item.minimumPaymentRatio != null ? String(item.minimumPaymentRatio) : "",
      paymentTracking: item.paymentTracking,
      nextStatementDate: item.nextStatementDate?.slice(0, 10) ?? "",
      nextDueDate: item.nextDueDate?.slice(0, 10) ?? "",
      color: item.color ?? "",
      icon: item.icon ?? "",
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
            <p className="text-sm uppercase tracking-[0.18em] text-ink-muted">Tarjetas</p>
            <h2 className="mt-2 text-xl font-semibold text-surface-strong">
              {draft.id ? "Editar tarjeta" : "Nueva tarjeta"}
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
          <input name="accountId" type="hidden" value={draft.accountId} />
          <div className="grid gap-4 lg:grid-cols-2">
            <Input
              label="Nombre"
              name="name"
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              value={draft.name}
            />
            <Input
              label="Banco"
              name="bank"
              onChange={(event) => setDraft((current) => ({ ...current, bank: event.target.value }))}
              value={draft.bank}
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <Input
              label="Últimos 4"
              maxLength={4}
              name="last4"
              onChange={(event) => setDraft((current) => ({ ...current, last4: event.target.value }))}
              value={draft.last4}
            />
            <Input
              label="Día de corte"
              name="statementClosingDay"
              onChange={(event) =>
                setDraft((current) => ({ ...current, statementClosingDay: event.target.value }))
              }
              type="number"
              value={draft.statementClosingDay}
            />
            <Input
              label="Día límite pago"
              name="paymentDueDay"
              onChange={(event) =>
                setDraft((current) => ({ ...current, paymentDueDay: event.target.value }))
              }
              type="number"
              value={draft.paymentDueDay}
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <Input
              label="Límite"
              name="creditLimit"
              onChange={(event) =>
                setDraft((current) => ({ ...current, creditLimit: event.target.value }))
              }
              step="0.01"
              type="number"
              value={draft.creditLimit}
            />
            <Input
              label="Pago para no generar intereses"
              name="statementBalance"
              onChange={(event) =>
                setDraft((current) => ({ ...current, statementBalance: event.target.value }))
              }
              step="0.01"
              type="number"
              value={draft.statementBalance}
            />
            <Input
              label="Saldo total"
              name="payoffBalance"
              onChange={(event) =>
                setDraft((current) => ({ ...current, payoffBalance: event.target.value }))
              }
              step="0.01"
              type="number"
              value={draft.payoffBalance}
            />
          </div>
          <p className="text-sm leading-6 text-ink-muted">
            `Pago para no generar intereses` es el monto de tu corte vigente que debes cubrir para evitar intereses.
            `Saldo total` es todo lo que debes hoy en esa tarjeta, incluyendo compras que todavía no vencen.
          </p>
          <div className="rounded-2xl border border-black/5 bg-black/[0.02] px-4 py-3 text-sm leading-6 text-ink-muted">
            Usa estos campos para capturar tu estado actual del corte.
            Si hoy es 8 y una tarjeta vence el 14, registra aquí el monto mínimo, el monto para no generar intereses y la fecha real de vencimiento.
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <Input
              label="Pago mínimo actual"
              name="minimumDueAmount"
              onChange={(event) =>
                setDraft((current) => ({ ...current, minimumDueAmount: event.target.value }))
              }
              step="0.01"
              type="number"
              value={draft.minimumDueAmount}
            />
            <Input
              label="Próximo corte"
              name="nextStatementDate"
              onChange={(event) =>
                setDraft((current) => ({ ...current, nextStatementDate: event.target.value }))
              }
              type="date"
              value={draft.nextStatementDate}
            />
            <Input
              label="Próximo vencimiento real"
              name="nextDueDate"
              onChange={(event) =>
                setDraft((current) => ({ ...current, nextDueDate: event.target.value }))
              }
              type="date"
              value={draft.nextDueDate}
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <Input
              label="Tasa anual"
              name="annualInterestRate"
              onChange={(event) =>
                setDraft((current) => ({ ...current, annualInterestRate: event.target.value }))
              }
              step="0.01"
              type="number"
              value={draft.annualInterestRate}
            />
            <Input
              label="Ratio mínimo"
              name="minimumPaymentRatio"
              onChange={(event) =>
                setDraft((current) => ({ ...current, minimumPaymentRatio: event.target.value }))
              }
              step="0.01"
              type="number"
              value={draft.minimumPaymentRatio}
            />
            <Select
              label="Seguimiento"
              name="paymentTracking"
              onChange={(event) =>
                setDraft((current) => ({ ...current, paymentTracking: event.target.value }))
              }
              value={draft.paymentTracking}
            >
              <option value="MINIMUM">Mínimo</option>
              <option value="FULL_STATEMENT">Pago para no generar intereses</option>
              <option value="BOTH">Ambos</option>
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
            {draft.id ? "Guardar tarjeta" : "Crear tarjeta"}
          </FormSubmitButton>
        </form>
      </section>

      <section className="glass-card min-w-0 rounded-[1.75rem] p-5">
        <div className="mb-5">
          <p className="text-sm uppercase tracking-[0.18em] text-ink-muted">Crédito</p>
          <h2 className="mt-2 text-xl font-semibold text-surface-strong">Tarjetas activas</h2>
        </div>
        {items.length ? (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="rounded-[1.6rem] border border-black/5 bg-[linear-gradient(155deg,#0b1628_0%,#102342_54%,#1098f7_100%)] p-4 text-white shadow-card">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-white/70">
                      {item.bank} · •••• {item.last4}
                    </p>
                  </div>
                  <p className="font-semibold">{formatCurrency(item.payoffBalance)}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.16em] text-white/60">
                  <span>Corte {item.statementClosingDay}</span>
                  <span>Pago {item.paymentDueDay}</span>
                  {item.minimumDueAmount != null ? (
                    <span>Mínimo {formatCurrency(item.minimumDueAmount)}</span>
                  ) : null}
                  {item.nextDueDate ? <span>{formatDate(item.nextDueDate, "d MMM yyyy")}</span> : null}
                </div>
                <div className="mt-4 flex gap-2">
                  <Button onClick={() => startEdit(item)} type="button" variant="secondary">
                    Editar
                  </Button>
                  <form action={deleteCreditCardAction}>
                    <input name="id" type="hidden" value={item.id} />
                    <input name="accountId" type="hidden" value={item.accountId} />
                    <Button type="submit" variant="secondary">
                      Eliminar
                    </Button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Sin tarjetas" description="Agrega tarjetas con corte, vencimiento y saldo para proyectar pagos reales." />
        )}
      </section>
    </div>
  );
}
