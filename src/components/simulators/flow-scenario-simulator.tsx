"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { ProgressBar } from "@/components/ui/progress-bar";
import { formatCurrency } from "@/lib/format";

type ProjectionPoint = {
  month: string;
  income: number;
  fixed: number;
  debt: number;
  installments: number;
  savings: number;
  variable: number;
  committed: number;
  net: number;
  commitmentPct: number;
};

type Props = {
  projection: ProjectionPoint[];
  context: {
    averageIncome: number;
    averageFixed: number;
    averageDebt: number;
    averageInstallments: number;
    averageSavings: number;
    averageVariable: number;
  };
};

export function FlowScenarioSimulator({ projection, context }: Props) {
  const [variableCutPct, setVariableCutPct] = useState("20");
  const [extraSavings, setExtraSavings] = useState("0");
  const [newMsiMonthly, setNewMsiMonthly] = useState("0");
  const [extraDebtPayment, setExtraDebtPayment] = useState("0");

  const scenario = useMemo(() => {
    const cutFactor = Math.min(Math.max(Number(variableCutPct) || 0, 0), 100) / 100;
    const savingsDelta = Math.max(Number(extraSavings) || 0, 0);
    const msiDelta = Math.max(Number(newMsiMonthly) || 0, 0);
    const debtDelta = Math.max(Number(extraDebtPayment) || 0, 0);

    const months = projection.map((month) => {
      const variable = Math.max(month.variable * (1 - cutFactor), 0);
      const committed = month.fixed + month.debt + debtDelta + month.installments + msiDelta + month.savings + savingsDelta;
      const net = month.income - committed - variable;
      return {
        ...month,
        variable,
        committed,
        net,
        commitmentPct: month.income > 0 ? (committed / month.income) * 100 : 0
      };
    });

    return {
      months,
      nextMonth: months[0],
      afterThreeMonths: months[2]
    };
  }, [extraDebtPayment, extraSavings, newMsiMonthly, projection, variableCutPct]);

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <Input
          label="Recorte variable (%)"
          onChange={(event) => setVariableCutPct(event.target.value)}
          type="number"
          value={variableCutPct}
        />
        <Input
          label="Ahorro extra mensual"
          onChange={(event) => setExtraSavings(event.target.value)}
          step="0.01"
          type="number"
          value={extraSavings}
        />
        <Input
          label="Nueva carga MSI mensual"
          onChange={(event) => setNewMsiMonthly(event.target.value)}
          step="0.01"
          type="number"
          value={newMsiMonthly}
        />
        <Input
          label="Pago extra a deuda"
          onChange={(event) => setExtraDebtPayment(event.target.value)}
          step="0.01"
          type="number"
          value={extraDebtPayment}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-black/5 bg-white/70 p-4">
          <p className="text-sm text-ink-muted">Ingreso base</p>
          <p className="mt-2 text-xl font-semibold text-surface-strong">
            {formatCurrency(context.averageIncome)}
          </p>
        </div>
        <div className="rounded-2xl border border-black/5 bg-white/70 p-4">
          <p className="text-sm text-ink-muted">Neto próximo mes</p>
          <p className="mt-2 text-xl font-semibold text-surface-strong">
            {formatCurrency(scenario.nextMonth.net)}
          </p>
        </div>
        <div className="rounded-2xl border border-black/5 bg-white/70 p-4">
          <p className="text-sm text-ink-muted">Neto a 3 meses</p>
          <p className="mt-2 text-xl font-semibold text-surface-strong">
            {formatCurrency(scenario.afterThreeMonths?.net ?? scenario.nextMonth.net)}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-black/5 bg-white/70 p-4">
        <div className="flex items-center justify-between text-sm text-ink-muted">
          <span>Compromiso del próximo mes</span>
          <span>{scenario.nextMonth.commitmentPct.toFixed(0)}%</span>
        </div>
        <div className="mt-3">
          <ProgressBar
            tone={
              scenario.nextMonth.commitmentPct > 80
                ? "danger"
                : scenario.nextMonth.commitmentPct > 65
                  ? "warning"
                  : "default"
            }
            value={Math.min(scenario.nextMonth.commitmentPct, 100)}
          />
        </div>
        <p className="mt-4 text-sm leading-6 text-ink-muted">
          {scenario.nextMonth.net >= 0
            ? `Con este escenario sigues con holgura positiva de ${formatCurrency(scenario.nextMonth.net)} el siguiente mes.`
            : `Con este escenario entrarías en presión de flujo por ${formatCurrency(Math.abs(scenario.nextMonth.net))}.`}
        </p>
      </div>
    </div>
  );
}
