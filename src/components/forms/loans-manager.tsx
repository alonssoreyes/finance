"use client";

import { useActionState, useState } from "react";
import { deleteLoanAction, upsertLoanAction } from "@/actions/finance";
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
  lender?: string;
  originalAmount: number;
  currentBalance: number;
  monthlyPayment: number;
  interestRate?: number;
  paymentDay: number;
  priority: string;
  strategyWeight: number;
  openedAt: string;
  targetPayoffDate?: string;
  notes?: string;
};

const defaultState: ActionState = {};

const blankDraft = {
  id: "",
  accountId: "",
  name: "",
  lender: "",
  originalAmount: "",
  currentBalance: "",
  monthlyPayment: "",
  interestRate: "",
  paymentDay: "15",
  priority: "MEDIUM",
  strategyWeight: "50",
  openedAt: new Date().toISOString().slice(0, 10),
  targetPayoffDate: "",
  notes: ""
};

export function LoansManager({ items }: { items: Item[] }) {
  const [draft, setDraft] = useState(blankDraft);
  const [state, formAction] = useActionState(upsertLoanAction, defaultState);

  function startEdit(item: Item) {
    setDraft({
      id: item.id,
      accountId: item.accountId,
      name: item.name,
      lender: item.lender ?? "",
      originalAmount: String(item.originalAmount),
      currentBalance: String(item.currentBalance),
      monthlyPayment: String(item.monthlyPayment),
      interestRate: item.interestRate != null ? String(item.interestRate) : "",
      paymentDay: String(item.paymentDay),
      priority: item.priority,
      strategyWeight: String(item.strategyWeight),
      openedAt: item.openedAt.slice(0, 10),
      targetPayoffDate: item.targetPayoffDate?.slice(0, 10) ?? "",
      notes: item.notes ?? ""
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
            <p className="text-sm uppercase tracking-[0.18em] text-ink-muted">Préstamos</p>
            <h2 className="mt-2 text-xl font-semibold text-surface-strong">
              {draft.id ? "Editar préstamo" : "Nuevo préstamo"}
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
              label="Acreedor"
              name="lender"
              onChange={(event) => setDraft((current) => ({ ...current, lender: event.target.value }))}
              value={draft.lender}
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <Input
              label="Monto original"
              name="originalAmount"
              onChange={(event) =>
                setDraft((current) => ({ ...current, originalAmount: event.target.value }))
              }
              step="0.01"
              type="number"
              value={draft.originalAmount}
            />
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
              label="Pago mensual"
              name="monthlyPayment"
              onChange={(event) =>
                setDraft((current) => ({ ...current, monthlyPayment: event.target.value }))
              }
              step="0.01"
              type="number"
              value={draft.monthlyPayment}
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <Input
              label="Tasa"
              name="interestRate"
              onChange={(event) =>
                setDraft((current) => ({ ...current, interestRate: event.target.value }))
              }
              step="0.01"
              type="number"
              value={draft.interestRate}
            />
            <Input
              label="Día de pago"
              name="paymentDay"
              onChange={(event) =>
                setDraft((current) => ({ ...current, paymentDay: event.target.value }))
              }
              type="number"
              value={draft.paymentDay}
            />
            <Input
              label="Peso estrategia"
              name="strategyWeight"
              onChange={(event) =>
                setDraft((current) => ({ ...current, strategyWeight: event.target.value }))
              }
              type="number"
              value={draft.strategyWeight}
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
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
            <Input
              label="Apertura"
              name="openedAt"
              onChange={(event) => setDraft((current) => ({ ...current, openedAt: event.target.value }))}
              type="date"
              value={draft.openedAt}
            />
            <Input
              label="Meta de liquidación"
              name="targetPayoffDate"
              onChange={(event) =>
                setDraft((current) => ({ ...current, targetPayoffDate: event.target.value }))
              }
              type="date"
              value={draft.targetPayoffDate}
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
            {draft.id ? "Guardar préstamo" : "Crear préstamo"}
          </FormSubmitButton>
        </form>
      </section>

      <section className="glass-card min-w-0 rounded-[1.75rem] p-5">
        <div className="mb-5">
          <p className="text-sm uppercase tracking-[0.18em] text-ink-muted">Deuda estructurada</p>
          <h2 className="mt-2 text-xl font-semibold text-surface-strong">Préstamos activos</h2>
        </div>
        {items.length ? (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="rounded-2xl border border-black/5 bg-white/70 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-surface-strong">{item.name}</p>
                    <p className="text-sm text-ink-muted">
                      {item.lender ?? "Sin acreedor"} · {item.priority}
                    </p>
                  </div>
                  <p className="font-semibold text-surface-strong">{formatCurrency(item.currentBalance)}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.16em] text-ink-soft">
                  <span>{formatCurrency(item.monthlyPayment)}/mes</span>
                  <span>Día {item.paymentDay}</span>
                  <span>Apertura {formatDate(item.openedAt, "d MMM yyyy")}</span>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button onClick={() => startEdit(item)} type="button" variant="secondary">
                    Editar
                  </Button>
                  <form action={deleteLoanAction}>
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
          <EmptyState title="Sin préstamos" description="Agrega tus préstamos para proyectar pagos mensuales y salida de deuda." />
        )}
      </section>
    </div>
  );
}
