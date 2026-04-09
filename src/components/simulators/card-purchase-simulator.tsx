"use client";

import { useMemo, useState } from "react";
import { getPurchaseCycleSummary } from "@/lib/card-cycle";
import { Input } from "@/components/ui/input";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Select } from "@/components/ui/select";
import { formatCurrency, formatDate, formatMonthLabel } from "@/lib/format";

type Props = {
  context: {
    closingDay: number;
    dueDay: number;
    creditLimit: number;
    payoffBalance: number;
  };
};

export function CardPurchaseSimulator({ context }: Props) {
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState("10000");
  const [mode, setMode] = useState("INSTALLMENT");
  const [months, setMonths] = useState("12");

  const result = useMemo(() => {
    const total = Math.max(Number(amount) || 0, 0);
    const installments = mode === "INSTALLMENT" ? Math.max(Number(months) || 1, 1) : 1;
    return getPurchaseCycleSummary({
      purchaseDate: new Date(purchaseDate),
      amount: total,
      installments,
      closingDay: context.closingDay,
      dueDay: context.dueDay,
      creditLimit: context.creditLimit,
      currentBalance: context.payoffBalance
    });
  }, [amount, context.closingDay, context.creditLimit, context.dueDay, context.payoffBalance, mode, months, purchaseDate]);

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <Input
          label="Fecha de compra"
          onChange={(event) => setPurchaseDate(event.target.value)}
          type="date"
          value={purchaseDate}
        />
        <Input
          label="Monto"
          onChange={(event) => setAmount(event.target.value)}
          step="0.01"
          type="number"
          value={amount}
        />
        <Select label="Modo" onChange={(event) => setMode(event.target.value)} value={mode}>
          <option value="INSTALLMENT">MSI</option>
          <option value="FULL">Contado</option>
        </Select>
        {mode === "INSTALLMENT" ? (
          <Select label="Meses" onChange={(event) => setMonths(event.target.value)} value={months}>
            <option value="3">3</option>
            <option value="6">6</option>
            <option value="9">9</option>
            <option value="12">12</option>
            <option value="18">18</option>
            <option value="24">24</option>
          </Select>
        ) : (
          <div className="rounded-2xl border border-black/8 bg-white/70 px-4 py-3 text-sm text-ink-muted">
            Cargo único
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-black/5 bg-white/70 p-4">
          <p className="text-sm text-ink-muted">Cierre asignado</p>
          <p className="mt-2 font-semibold text-surface-strong">
            {formatDate(result.closingDate, "d MMM yyyy")}
          </p>
        </div>
        <div className="rounded-2xl border border-black/5 bg-white/70 p-4">
          <p className="text-sm text-ink-muted">Primer vencimiento</p>
          <p className="mt-2 font-semibold text-surface-strong">
            {formatDate(result.dueDate, "d MMM yyyy")}
          </p>
        </div>
        <div className="rounded-2xl border border-black/5 bg-white/70 p-4">
          <p className="text-sm text-ink-muted">Primer mes de cargo</p>
          <p className="mt-2 font-semibold text-surface-strong">
            {formatMonthLabel(result.firstChargeMonth)}
          </p>
        </div>
        <div className="rounded-2xl border border-black/5 bg-white/70 p-4">
          <p className="text-sm text-ink-muted">Mensualidad / impacto</p>
          <p className="mt-2 font-semibold text-surface-strong">
            {formatCurrency(result.monthlyAmount)}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-black/5 bg-white/70 p-4">
        <div className="flex items-center justify-between text-sm text-ink-muted">
          <span>Utilización proyectada</span>
          <span>{result.utilizationAfter.toFixed(0)}%</span>
        </div>
        <div className="mt-3">
          <ProgressBar
            tone={result.utilizationAfter > 50 ? "warning" : "default"}
            value={Math.min(result.utilizationAfter, 100)}
          />
        </div>
        <div className="mt-4 grid gap-2 text-sm text-ink-muted md:grid-cols-2">
          <p>{result.statementBucket}</p>
          <p>Necesidad en 30 días: {formatCurrency(result.needsWithin30Days)}</p>
        </div>
      </div>
    </div>
  );
}
