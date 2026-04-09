"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Select } from "@/components/ui/select";
import { formatCurrency } from "@/lib/format";

type Props = {
  context: {
    freeCash: number;
    monthlyIncome: number;
    currentCommitted: number;
    currentInstallmentLoad: number;
    currentCommitmentPct: number;
  };
};

export function PurchaseMsiSimulator({ context }: Props) {
  const [price, setPrice] = useState("24000");
  const [saved, setSaved] = useState("6000");
  const [months, setMonths] = useState("12");
  const [waitMonths, setWaitMonths] = useState("0");
  const [monthlySaveBeforeBuy, setMonthlySaveBeforeBuy] = useState("0");

  const result = useMemo(() => {
    const totalPrice = Math.max(Number(price) || 0, 0);
    const currentSaved = Math.max(Number(saved) || 0, 0);
    const term = Math.max(Number(months) || 1, 1);
    const monthsWaiting = Math.max(Number(waitMonths) || 0, 0);
    const preSave = Math.max(Number(monthlySaveBeforeBuy) || 0, 0);

    const savedAtPurchase = currentSaved + monthsWaiting * preSave;
    const financedAmount = Math.max(totalPrice - savedAtPurchase, 0);
    const msiMonthly = financedAmount / term;
    const cashPurchaseGap = Math.max(totalPrice - savedAtPurchase, 0);
    const newCommitted = context.currentCommitted + msiMonthly;
    const commitmentPct =
      context.monthlyIncome > 0 ? (newCommitted / context.monthlyIncome) * 100 : 0;

    return {
      totalPrice,
      savedAtPurchase,
      financedAmount,
      msiMonthly,
      cashPurchaseGap,
      newCommitted,
      commitmentPct
    };
  }, [context.currentCommitted, context.monthlyIncome, months, monthlySaveBeforeBuy, price, saved, waitMonths]);

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-5">
        <Input
          label="Precio"
          onChange={(event) => setPrice(event.target.value)}
          step="0.01"
          type="number"
          value={price}
        />
        <Input
          label="Ahorro actual"
          onChange={(event) => setSaved(event.target.value)}
          step="0.01"
          type="number"
          value={saved}
        />
        <Select
          label="MSI"
          onChange={(event) => setMonths(event.target.value)}
          value={months}
        >
          <option value="3">3 meses</option>
          <option value="6">6 meses</option>
          <option value="9">9 meses</option>
          <option value="12">12 meses</option>
          <option value="18">18 meses</option>
          <option value="24">24 meses</option>
        </Select>
        <Input
          label="Esperar (meses)"
          onChange={(event) => setWaitMonths(event.target.value)}
          type="number"
          value={waitMonths}
        />
        <Input
          label="Ahorro mensual previo"
          onChange={(event) => setMonthlySaveBeforeBuy(event.target.value)}
          step="0.01"
          type="number"
          value={monthlySaveBeforeBuy}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-black/5 bg-white/70 p-4">
          <p className="text-sm text-ink-muted">Mensualidad MSI</p>
          <p className="mt-2 text-xl font-semibold text-surface-strong">
            {formatCurrency(result.msiMonthly)}
          </p>
        </div>
        <div className="rounded-2xl border border-black/5 bg-white/70 p-4">
          <p className="text-sm text-ink-muted">Ahorro al momento de compra</p>
          <p className="mt-2 text-xl font-semibold text-surface-strong">
            {formatCurrency(result.savedAtPurchase)}
          </p>
        </div>
        <div className="rounded-2xl border border-black/5 bg-white/70 p-4">
          <p className="text-sm text-ink-muted">Faltante si compras de contado</p>
          <p className="mt-2 text-xl font-semibold text-surface-strong">
            {formatCurrency(result.cashPurchaseGap)}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-black/5 bg-white/70 p-4">
        <div className="flex items-center justify-between text-sm text-ink-muted">
          <span>Compromiso total si agregas esta compra</span>
          <span>{result.commitmentPct.toFixed(0)}%</span>
        </div>
        <div className="mt-3">
          <ProgressBar
            tone={
              result.commitmentPct > 80
                ? "danger"
                : result.commitmentPct > 65
                  ? "warning"
                  : "default"
            }
            value={Math.min(result.commitmentPct, 100)}
          />
        </div>
        <p className="mt-4 text-sm leading-6 text-ink-muted">
          {result.commitmentPct > 80
            ? `Agregar esta compra llevaría tu flujo a zona de presión. Conviene esperar o llegar con más ahorro previo.`
            : result.commitmentPct > 65
              ? `La compra es viable pero te deja con margen estrecho. Reducir gasto variable o ahorrar más antes de tomar MSI mejoraría el colchón.`
              : `La compra cabe con presión controlada. Aun así, llegar con más ahorro previo reduce riesgo y dependencia del siguiente corte.`}
        </p>
      </div>
    </div>
  );
}
