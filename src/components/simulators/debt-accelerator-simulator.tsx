"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ProgressBar } from "@/components/ui/progress-bar";
import { formatCurrency } from "@/lib/format";

type Debt = {
  id: string;
  type: string;
  name: string;
  balance: number;
  baselinePayment: number;
  apr: number;
};

type Props = {
  debts: Debt[];
};

function simulateMonths(balance: number, monthlyPayment: number, apr: number) {
  const monthlyRate = Math.max(apr, 0) / 100 / 12;
  let remaining = balance;
  let months = 0;
  let interestPaid = 0;

  while (remaining > 0.01 && months < 600) {
    const interest = remaining * monthlyRate;
    interestPaid += interest;
    remaining = remaining + interest - monthlyPayment;
    months += 1;

    if (remaining > 0 && monthlyPayment <= interest) {
      return {
        months: 600,
        interestPaid,
        stalled: true
      };
    }
  }

  return {
    months,
    interestPaid,
    stalled: false
  };
}

export function DebtAcceleratorSimulator({ debts }: Props) {
  const [selectedDebtId, setSelectedDebtId] = useState(debts[0]?.id ?? "");
  const [extraPayment, setExtraPayment] = useState("1000");

  const selectedDebt = useMemo(
    () => debts.find((debt) => debt.id === selectedDebtId) ?? debts[0],
    [debts, selectedDebtId]
  );

  const results = useMemo(() => {
    if (!selectedDebt) {
      return null;
    }

    const extra = Math.max(Number(extraPayment) || 0, 0);
    const base = simulateMonths(
      selectedDebt.balance,
      selectedDebt.baselinePayment,
      selectedDebt.apr
    );
    const accelerated = simulateMonths(
      selectedDebt.balance,
      selectedDebt.baselinePayment + extra,
      selectedDebt.apr
    );

    return {
      extra,
      base,
      accelerated,
      monthsSaved: Math.max(base.months - accelerated.months, 0),
      interestSaved: Math.max(base.interestPaid - accelerated.interestPaid, 0),
      paymentIncreasePct:
        selectedDebt.baselinePayment > 0
          ? ((selectedDebt.baselinePayment + extra) / selectedDebt.baselinePayment) * 100
          : 100
    };
  }, [extraPayment, selectedDebt]);

  if (!selectedDebt || !results) {
    return null;
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Select
          label="Deuda a acelerar"
          onChange={(event) => setSelectedDebtId(event.target.value)}
          value={selectedDebtId}
        >
          {debts.map((debt) => (
            <option key={debt.id} value={debt.id}>
              {debt.name}
            </option>
          ))}
        </Select>
        <Input
          label="Pago extra mensual"
          onChange={(event) => setExtraPayment(event.target.value)}
          step="0.01"
          type="number"
          value={extraPayment}
        />
      </div>

      <div className="rounded-2xl border border-black/5 bg-white/70 p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <p className="text-sm text-ink-muted">Pago actual</p>
            <p className="mt-1 font-semibold text-surface-strong">
              {formatCurrency(selectedDebt.baselinePayment)}
            </p>
          </div>
          <div>
            <p className="text-sm text-ink-muted">Pago acelerado</p>
            <p className="mt-1 font-semibold text-surface-strong">
              {formatCurrency(selectedDebt.baselinePayment + results.extra)}
            </p>
          </div>
          <div>
            <p className="text-sm text-ink-muted">Meses ahorrados</p>
            <p className="mt-1 font-semibold text-accent">
              {results.monthsSaved} meses
            </p>
          </div>
          <div>
            <p className="text-sm text-ink-muted">Interés estimado evitado</p>
            <p className="mt-1 font-semibold text-accent">
              {formatCurrency(results.interestSaved)}
            </p>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm text-ink-muted">
            <span>Intensidad del esfuerzo</span>
            <span>{results.paymentIncreasePct.toFixed(0)}% del pago base</span>
          </div>
          <ProgressBar
            tone={results.paymentIncreasePct > 160 ? "warning" : "default"}
            value={Math.min(results.paymentIncreasePct, 100)}
          />
        </div>
        <p className="mt-4 text-sm leading-6 text-ink-muted">
          {results.monthsSaved > 0
            ? `Si sostienes este pago extra, ${selectedDebt.name} se liquidaría aproximadamente ${results.monthsSaved} meses antes.`
            : `Con este monto extra el efecto es bajo; subirlo un poco más daría una aceleración visible.`}
        </p>
      </div>
    </div>
  );
}
