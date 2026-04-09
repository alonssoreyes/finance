import { addDays, addMonths, endOfMonth, isSameMonth, startOfMonth } from "date-fns";
import { BudgetScope, CategoryKind, InsightStatus, type Account, type Budget, type CreditCard, type FinancialRule, type InstallmentPayment, type InstallmentPurchase, type Loan, type PlannedPurchase, type PurchaseSeasonality, type RecurringExpense, type SavingsGoal, type SpendingInsight, type Transaction } from "@prisma/client";
import { getPurchaseCycleSummary } from "@/lib/card-cycle";
import { prisma } from "@/lib/prisma";
import { percentage, toNumber } from "@/lib/utils";

type TransactionWithCategory = Transaction & {
  category: {
    id: string;
    name: string;
    kind: CategoryKind;
  } | null;
};

type InsightScope = "dashboard" | "projection" | "planned" | "debt" | "card";

type RealtimeInsight = {
  title: string;
  message: string;
  severity: "INFO" | "WARNING" | "CRITICAL" | "POSITIVE";
  scopes: InsightScope[];
};

function firstDayOfMonth(input = new Date()) {
  return startOfMonth(input);
}

function endMonth(input = new Date()) {
  return endOfMonth(input);
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function getMonthlyRecurringAmount(frequency: string, amount: number) {
  switch (frequency) {
    case "WEEKLY":
      return amount * 4.33;
    case "BIWEEKLY":
      return amount * 2.17;
    case "QUARTERLY":
      return amount / 3;
    case "SEMIANNUALLY":
      return amount / 6;
    case "YEARLY":
      return amount / 12;
    default:
      return amount;
  }
}

function readNumberConfig(config: unknown, key: string) {
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    return undefined;
  }

  const value = (config as Record<string, unknown>)[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function readStringConfig(config: unknown, key: string) {
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    return undefined;
  }

  const value = (config as Record<string, unknown>)[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function dedupeInsights(items: RealtimeInsight[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = `${item.title}:${item.message}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function sortInsights(items: RealtimeInsight[]) {
  const severityRank: Record<RealtimeInsight["severity"], number> = {
    CRITICAL: 0,
    WARNING: 1,
    INFO: 2,
    POSITIVE: 3
  };

  return [...items].sort((left, right) => severityRank[left.severity] - severityRank[right.severity]);
}

function filterInsights(items: RealtimeInsight[], scope: InsightScope, limit = 4) {
  return items.filter((item) => item.scopes.includes(scope)).slice(0, limit);
}

function simulateDebtPayoff(balance: number, monthlyPayment: number, apr: number) {
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

async function getBaseData(userId: string) {
  const now = new Date();
  const monthStart = firstDayOfMonth(now);
  const lastThreeMonths = addMonths(monthStart, -2);

  const [
    settings,
    accounts,
    cards,
    loans,
    goals,
    budgets,
    recurringExpenses,
    installmentPurchases,
    installmentPayments,
    transactions,
    financialRules,
    insights,
    plannedPurchases
  ] = await prisma.$transaction([
    prisma.settings.findUnique({ where: { userId } }),
    prisma.account.findMany({
      where: { userId, isArchived: false },
      orderBy: { createdAt: "asc" }
    }),
    prisma.creditCard.findMany({
      where: { userId },
      include: { account: true, installmentPurchases: true },
      orderBy: { createdAt: "asc" }
    }),
    prisma.loan.findMany({
      where: { userId },
      include: { account: true },
      orderBy: { createdAt: "asc" }
    }),
    prisma.savingsGoal.findMany({
      where: { userId },
      include: { linkedAccount: true },
      orderBy: { priority: "desc" }
    }),
    prisma.budget.findMany({
      where: {
        userId,
        month: monthStart
      },
      include: {
        category: true,
        subcategory: true
      }
    }),
    prisma.recurringExpense.findMany({
      where: { userId, isActive: true },
      include: { category: true, subcategory: true }
    }),
    prisma.installmentPurchase.findMany({
      where: { userId },
      include: {
        payments: {
          orderBy: { installmentNumber: "asc" }
        },
        creditCard: true,
        category: true
      }
    }),
    prisma.installmentPayment.findMany({
      where: {
        purchase: {
          userId
        },
        chargeMonth: {
          gte: monthStart
        }
      },
      include: {
        purchase: true
      },
      orderBy: { chargeMonth: "asc" }
    }),
    prisma.transaction.findMany({
      where: {
        userId,
        postedAt: {
          gte: lastThreeMonths,
          lte: endMonth(addMonths(monthStart, 1))
        }
      },
      include: {
        category: {
          select: { id: true, name: true, kind: true }
        }
      },
      orderBy: { postedAt: "desc" }
    }),
    prisma.financialRule.findMany({
      where: { userId, isEnabled: true },
      orderBy: { createdAt: "desc" }
    }),
    prisma.spendingInsight.findMany({
      where: { userId, status: InsightStatus.ACTIVE },
      orderBy: [{ severity: "desc" }, { createdAt: "desc" }]
    }),
    prisma.plannedPurchase.findMany({
      where: { userId },
      include: { seasonality: true, linkedGoal: true },
      orderBy: { createdAt: "asc" }
    })
  ]);

  return {
    now,
    settings,
    accounts,
    cards,
    loans,
    goals,
    budgets,
    recurringExpenses,
    installmentPurchases,
    installmentPayments,
    transactions: transactions as TransactionWithCategory[],
    financialRules,
    insights,
    plannedPurchases
  };
}

function buildProjection({
  transactions,
  recurringExpenses,
  loans,
  goals,
  installmentPayments,
  months = 12
}: {
  transactions: TransactionWithCategory[];
  recurringExpenses: RecurringExpense[];
  loans: Loan[];
  goals: SavingsGoal[];
  installmentPayments: (InstallmentPayment & { purchase: InstallmentPurchase })[];
  months?: number;
}) {
  const currentMonth = firstDayOfMonth();
  const incomeTransactions = transactions.filter((item) => item.type === "INCOME");
  const averageMonthlyIncome =
    incomeTransactions.reduce((sum, item) => sum + toNumber(item.amount), 0) / 3 || 0;

  const variableExpenses = transactions.filter(
    (item) =>
      item.type === "EXPENSE" &&
      item.category?.kind === "EXPENSE" &&
      item.cadence !== "INSTALLMENT"
  );
  const averageMonthlyVariable =
    variableExpenses.reduce((sum, item) => sum + toNumber(item.amount), 0) / 3 || 0;

  return Array.from({ length: months }).map((_, index) => {
    const monthDate = addMonths(currentMonth, index);
    const monthKey = monthDate.toISOString();
    const fixed = recurringExpenses.reduce(
      (sum, item) => sum + getMonthlyRecurringAmount(item.frequency, toNumber(item.amount)),
      0
    );
    const debt = loans.reduce((sum, loan) => sum + toNumber(loan.monthlyPayment), 0);
    const installments = installmentPayments
      .filter((payment) => isSameMonth(payment.chargeMonth, monthDate))
      .reduce((sum, payment) => sum + toNumber(payment.amount), 0);
    const savings = goals.reduce(
      (sum, goal) => sum + toNumber(goal.monthlySuggestedContribution),
      0
    );
    const income = averageMonthlyIncome;
    const variable = averageMonthlyVariable;
    const committed = fixed + debt + installments + savings;
    const net = income - committed - variable;

    return {
      month: monthKey,
      income: round(income),
      fixed: round(fixed),
      debt: round(debt),
      installments: round(installments),
      savings: round(savings),
      variable: round(variable),
      committed: round(committed),
      net: round(net),
      commitmentPct: round(percentage(committed, income))
    };
  });
}

function buildGoalProgress(goals: SavingsGoal[]) {
  const now = new Date();

  return goals.map((goal) => {
    const current = toNumber(goal.currentAmount);
    const target = toNumber(goal.targetAmount);
    const progressPct = percentage(current, target);
    const monthsLeft = goal.targetDate
      ? Math.max(
          1,
          (goal.targetDate.getFullYear() - now.getFullYear()) * 12 +
            goal.targetDate.getMonth() -
            now.getMonth()
        )
      : 1;
    const requiredMonthly = round((target - current) / monthsLeft);
    const suggestedMonthly = toNumber(goal.monthlySuggestedContribution);

    return {
      id: goal.id,
      name: goal.name,
      current,
      target,
      progressPct,
      targetDateLabel: goal.targetDate
        ? `Meta ${goal.targetDate.toLocaleDateString("es-MX", {
            month: "short",
            year: "numeric"
          })}`
        : "Sin fecha objetivo",
      onTrack: suggestedMonthly >= requiredMonthly,
      suggestedMonthly,
      suggestedWeekly: round(suggestedMonthly / 4.33),
      guidance:
        suggestedMonthly >= requiredMonthly
          ? `Mantén al menos ${Math.round(suggestedMonthly)} por mes para llegar en tiempo.`
          : `Necesitas subir a ${Math.round(requiredMonthly)} por mes para llegar a tiempo.`
    };
  });
}

function buildBudgetUsage(budgets: (Budget & { category: { name: string } | null; subcategory: { name: string } | null })[], transactions: TransactionWithCategory[]) {
  const monthStart = firstDayOfMonth();

  return budgets.map((budget) => {
    const label =
      budget.scope === BudgetScope.GLOBAL
        ? budget.name ?? "Presupuesto global"
        : budget.subcategory?.name ?? budget.category?.name ?? "Presupuesto";
    const spent = transactions
      .filter((transaction) => {
        if (!isSameMonth(transaction.postedAt, monthStart)) {
          return false;
        }

        if (budget.scope === BudgetScope.GLOBAL) {
          return transaction.type === "EXPENSE" && transaction.category?.kind === "EXPENSE";
        }

        if (budget.scope === BudgetScope.CATEGORY) {
          return transaction.categoryId === budget.categoryId;
        }

        return transaction.subcategoryId === budget.subcategoryId;
      })
      .reduce((sum, transaction) => sum + toNumber(transaction.amount), 0);

    const limit = toNumber(budget.limitAmount);

    return {
      label,
      spent: round(spent),
      limit,
      remaining: round(limit - spent),
      usagePct: round(percentage(spent, limit))
    };
  });
}

export async function getRealtimeInsights(userId: string) {
  const base = await getBaseData(userId);
  return compileRealtimeInsights(base);
}

function getExpenseSummary(
  transactions: TransactionWithCategory[],
  referenceMonth: Date,
  categoryId?: string
) {
  const expenseTransactions = transactions.filter((item) => {
    if (item.type !== "EXPENSE") {
      return false;
    }

    if (categoryId) {
      return item.categoryId === categoryId;
    }

    return item.category?.kind === "EXPENSE";
  });

  const current = expenseTransactions
    .filter((item) => isSameMonth(item.postedAt, referenceMonth))
    .reduce((sum, item) => sum + toNumber(item.amount), 0);

  const previousMonths = [1, 2].map((offset) => addMonths(referenceMonth, -offset));
  const previousAverage =
    previousMonths.reduce((sum, month) => {
      const amount = expenseTransactions
        .filter((item) => isSameMonth(item.postedAt, month))
        .reduce((transactionSum, item) => transactionSum + toNumber(item.amount), 0);
      return sum + amount;
    }, 0) / previousMonths.length;

  return {
    current: round(current),
    previousAverage: round(previousAverage)
  };
}

function buildAutomaticInsights(base: Awaited<ReturnType<typeof getBaseData>>) {
  const monthStart = firstDayOfMonth(base.now);
  const projection = buildProjection({
    transactions: base.transactions,
    recurringExpenses: base.recurringExpenses,
    loans: base.loans,
    goals: base.goals,
    installmentPayments: base.installmentPayments
  });
  const currentMonth = projection[0];
  const monthlyIncome = currentMonth?.income ?? 0;
  const monthlyCommitmentPct = currentMonth?.commitmentPct ?? 0;
  const diningCategory = base.transactions.find(
    (item) => item.category?.name === "Comida fuera" && item.category?.kind === "EXPENSE"
  )?.categoryId ?? undefined;
  const dining = getExpenseSummary(base.transactions, monthStart, diningCategory);
  const activeInstallments = base.installmentPurchases.filter((item) => item.status === "ACTIVE");
  const msiLoad = activeInstallments.reduce((sum, item) => sum + toNumber(item.monthlyAmount), 0);
  const smallExpenses = base.transactions.filter(
    (item) =>
      item.type === "EXPENSE" &&
      isSameMonth(item.postedAt, monthStart) &&
      toNumber(item.amount) <= 250
  );
  const smallExpenseTotal = smallExpenses.reduce((sum, item) => sum + toNumber(item.amount), 0);
  const nextFortnightNeed =
    base.cards.reduce((sum, card) => sum + toNumber(card.statementBalance), 0) / 2 +
    base.loans.reduce((sum, loan) => sum + toNumber(loan.monthlyPayment), 0) / 2 +
    base.recurringExpenses.reduce((sum, expense) => sum + toNumber(expense.amount), 0) / 2;
  const upcomingWeekPayments = [
    ...base.cards.map((card) => ({
      dueDate: card.nextDueDate ?? base.now,
      amount: toNumber(card.statementBalance)
    })),
    ...base.loans.map((loan) => ({
      dueDate: addDays(firstDayOfMonth(base.now), loan.paymentDay),
      amount: toNumber(loan.monthlyPayment)
    })),
    ...base.recurringExpenses.map((expense) => ({
      dueDate: expense.nextDueDate,
      amount: toNumber(expense.amount)
    }))
  ]
    .filter((item) => item.dueDate >= base.now && item.dueDate <= addDays(base.now, 7))
    .reduce((sum, item) => sum + item.amount, 0);

  const budgetUsage = buildBudgetUsage(base.budgets, base.transactions);
  const alerts: RealtimeInsight[] = [];

  if (dining.previousAverage > 0 && dining.current > dining.previousAverage * 1.2) {
    alerts.push({
      title: "Comida fuera acelerada",
      message: `Este mes llevas ${Math.round(((dining.current - dining.previousAverage) / dining.previousAverage) * 100)}% más en comida fuera que tu promedio reciente.`,
      severity: "WARNING",
      scopes: ["dashboard", "projection"]
    });
  }

  for (const budget of budgetUsage) {
    const limit = Math.max(budget.limit, 1);
    const warningPct =
      base.budgets.find((item) => {
        const label =
          item.scope === BudgetScope.GLOBAL
            ? item.name ?? "Presupuesto global"
            : item.subcategory?.name ?? item.category?.name ?? "Presupuesto";
        return label === budget.label;
      })?.alertPercent ?? base.settings?.categoryBudgetWarningPct ?? 80;

    if (budget.spent >= limit) {
      alerts.push({
        title: "Presupuesto rebasado",
        message: `${budget.label} ya superó su tope mensual por ${Math.round(budget.spent - limit)}.`,
        severity: "CRITICAL",
        scopes: ["dashboard", "projection"]
      });
    } else if (budget.usagePct >= warningPct) {
      alerts.push({
        title: "Presupuesto cerca del límite",
        message: `${budget.label} ya consumió ${Math.round(budget.usagePct)}% del presupuesto mensual.`,
        severity: "WARNING",
        scopes: ["dashboard", "projection"]
      });
    }
  }

  if (monthlyIncome > 0 && msiLoad > monthlyIncome * 0.15) {
    alerts.push({
      title: "Carga alta por MSI",
      message: `Tus MSI activas ya comprometen ${Math.round(percentage(msiLoad, monthlyIncome))}% del ingreso mensual base.`,
      severity: "CRITICAL",
      scopes: ["dashboard", "planned", "debt", "projection"]
    });
  }

  if (smallExpenses.length >= 8 && smallExpenseTotal >= 1000) {
    alerts.push({
      title: "Microgastos acumulados",
      message: `Llevas ${smallExpenses.length} gastos pequeños este mes y ya suman ${Math.round(smallExpenseTotal)}.`,
      severity: "INFO",
      scopes: ["dashboard", "projection"]
    });
  }

  if (monthlyIncome > 0 && nextFortnightNeed > monthlyIncome * 0.42) {
    alerts.push({
      title: "Quincena muy comprometida",
      message: `La próxima quincena ya tiene ${Math.round(percentage(nextFortnightNeed, monthlyIncome / 2 || 1))}% comprometido antes del gasto variable.`,
      severity: "CRITICAL",
      scopes: ["dashboard", "projection"]
    });
  }

  if (monthlyIncome > 0 && upcomingWeekPayments > monthlyIncome * 0.3) {
    alerts.push({
      title: "Pagos concentrados",
      message: `En los próximos 7 días se juntan pagos por ${Math.round(percentage(upcomingWeekPayments, monthlyIncome))}% de tu ingreso mensual base.`,
      severity: "WARNING",
      scopes: ["dashboard", "projection", "debt"]
    });
  }

  if (monthlyCommitmentPct >= 75) {
    alerts.push({
      title: "Flujo mensual saturado",
      message: `Tus compromisos fijos ya consumen ${Math.round(monthlyCommitmentPct)}% del ingreso mensual promedio.`,
      severity: monthlyCommitmentPct >= 90 ? "CRITICAL" : "WARNING",
      scopes: ["dashboard", "projection", "planned"]
    });
  }

  for (const goal of buildGoalProgress(base.goals)) {
    if (!goal.onTrack) {
      alerts.push({
        title: "Meta en riesgo",
        message: `${goal.name} requiere subir el ahorro mensual para llegar a tiempo.`,
        severity: "WARNING",
        scopes: ["dashboard", "planned", "projection"]
      });
    }
  }

  for (const card of base.cards) {
    const utilization = percentage(toNumber(card.payoffBalance), toNumber(card.creditLimit));
    if (utilization >= 70) {
      alerts.push({
        title: "Utilización alta de tarjeta",
        message: `${card.name} ya va en ${Math.round(utilization)}% de uso de línea.`,
        severity: utilization >= 90 ? "CRITICAL" : "WARNING",
        scopes: ["dashboard", "debt", "card"]
      });
    }
  }

  for (const purchase of base.plannedPurchases) {
    const targetPrice = toNumber(purchase.targetPrice);
    const saved = toNumber(purchase.currentlySaved);
    const savedPct = percentage(saved, targetPrice || 1);
    const daysUntilDesired = purchase.desiredDate
      ? Math.ceil((purchase.desiredDate.getTime() - base.now.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    if (
      purchase.status !== "BOUGHT" &&
      daysUntilDesired !== null &&
      daysUntilDesired <= 90 &&
      savedPct < 60
    ) {
      alerts.push({
        title: "Compra planeada sin colchón suficiente",
        message: `${purchase.title} se acerca y solo llevas ${Math.round(savedPct)}% del ahorro meta.`,
        severity: "WARNING",
        scopes: ["planned", "dashboard"]
      });
    }
  }

  return alerts;
}

function evaluateFinancialRules(
  base: Awaited<ReturnType<typeof getBaseData>>,
  projection: ReturnType<typeof buildProjection>
) {
  const monthStart = firstDayOfMonth(base.now);
  const monthlyIncome = projection[0]?.income ?? 0;
  const activeCommitmentPct = projection[0]?.commitmentPct ?? 0;
  const upcomingPayments = [
    ...base.cards.map((card) => ({
      dueDate: card.nextDueDate ?? base.now,
      amount: toNumber(card.statementBalance)
    })),
    ...base.loans.map((loan) => ({
      dueDate: addDays(firstDayOfMonth(base.now), loan.paymentDay),
      amount: toNumber(loan.monthlyPayment)
    })),
    ...base.recurringExpenses.map((expense) => ({
      dueDate: expense.nextDueDate,
      amount: toNumber(expense.amount)
    }))
  ];

  const alerts: RealtimeInsight[] = [];

  for (const rule of base.financialRules as FinancialRule[]) {
    const thresholdPercent = readNumberConfig(rule.config, "thresholdPercent") ?? 20;
    const amountLimit = readNumberConfig(rule.config, "amountLimit") ?? 250;
    const transactionCount = readNumberConfig(rule.config, "transactionCount") ?? 8;
    const daysWindow = readNumberConfig(rule.config, "daysWindow") ?? 7;
    const categoryId = readStringConfig(rule.config, "categoryId");

    if (rule.type === "THRESHOLD") {
      const summary = getExpenseSummary(base.transactions, monthStart, categoryId);
      if (summary.previousAverage > 0 && summary.current > summary.previousAverage * (1 + thresholdPercent / 100)) {
        const label =
          base.transactions.find((item) => item.categoryId === categoryId)?.category?.name ??
          "gasto variable";
        alerts.push({
          title: rule.name,
          message: `${label} está ${Math.round(((summary.current - summary.previousAverage) / summary.previousAverage) * 100)}% arriba de su promedio reciente.`,
          severity: rule.severity,
          scopes: ["dashboard", "projection"]
        });
      }
      continue;
    }

    if (rule.type === "TREND") {
      const summary = getExpenseSummary(base.transactions, monthStart);
      if (summary.previousAverage > 0 && summary.current > summary.previousAverage * (1 + thresholdPercent / 100)) {
        alerts.push({
          title: rule.name,
          message: `El gasto variable del mes va ${Math.round(((summary.current - summary.previousAverage) / summary.previousAverage) * 100)}% arriba del ritmo reciente.`,
          severity: rule.severity,
          scopes: ["dashboard", "projection"]
        });
      }
      continue;
    }

    if (rule.type === "ACCUMULATION") {
      const matching = base.transactions.filter(
        (item) =>
          item.type === "EXPENSE" &&
          isSameMonth(item.postedAt, monthStart) &&
          toNumber(item.amount) <= amountLimit &&
          (!categoryId || item.categoryId === categoryId)
      );
      const total = matching.reduce((sum, item) => sum + toNumber(item.amount), 0);

      if (matching.length >= transactionCount) {
        alerts.push({
          title: rule.name,
          message: `Se acumularon ${matching.length} movimientos pequeños y ya suman ${Math.round(total)}.`,
          severity: rule.severity,
          scopes: ["dashboard", "projection"]
        });
      }
      continue;
    }

    if (rule.type === "CONCENTRATION") {
      const concentrated = upcomingPayments
        .filter((item) => item.dueDate >= base.now && item.dueDate <= addDays(base.now, daysWindow))
        .reduce((sum, item) => sum + item.amount, 0);

      if (monthlyIncome > 0 && concentrated > monthlyIncome * (thresholdPercent / 100)) {
        alerts.push({
          title: rule.name,
          message: `Se concentran pagos por ${Math.round(percentage(concentrated, monthlyIncome))}% del ingreso mensual en los próximos ${daysWindow} días.`,
          severity: rule.severity,
          scopes: ["dashboard", "projection", "debt"]
        });
      }
      continue;
    }

    if (rule.type === "RISK" && activeCommitmentPct >= thresholdPercent) {
      alerts.push({
        title: rule.name,
        message: `El flujo comprometido ya está en ${Math.round(activeCommitmentPct)}% y rebasa tu umbral configurado.`,
        severity: rule.severity,
        scopes: ["dashboard", "projection", "planned", "debt"]
      });
    }
  }

  return alerts;
}

function compileRealtimeInsights(base: Awaited<ReturnType<typeof getBaseData>>) {
  const projection = buildProjection({
    transactions: base.transactions,
    recurringExpenses: base.recurringExpenses,
    loans: base.loans,
    goals: base.goals,
    installmentPayments: base.installmentPayments
  });

  const persisted: RealtimeInsight[] = base.insights.map((insight) => ({
    title: insight.title,
    message: insight.message,
    severity: insight.severity,
    scopes: ["dashboard", "projection", "planned", "debt"]
  }));

  const generated =
    base.settings?.enableLocalInsights === false
      ? []
      : [
          ...buildAutomaticInsights(base),
          ...evaluateFinancialRules(base, projection)
        ];

  return sortInsights(dedupeInsights([...persisted, ...generated]));
}

export async function getDashboardData(userId: string) {
  const base = await getBaseData(userId);
  const alerts = compileRealtimeInsights(base);
  const monthStart = firstDayOfMonth();
  const monthEnd = endMonth();
  const liquidTypes = new Set(["CHECKING", "DEBIT", "SAVINGS", "CASH"]);
  const availableBalance = base.accounts
    .filter((account) => liquidTypes.has(account.type))
    .reduce((sum, account) => sum + toNumber(account.availableBalance ?? account.currentBalance), 0);

  const currentMonthTransactions = base.transactions.filter(
    (transaction) => transaction.postedAt >= monthStart && transaction.postedAt <= monthEnd
  );
  const monthIncome = currentMonthTransactions
    .filter((transaction) => transaction.type === "INCOME")
    .reduce((sum, transaction) => sum + toNumber(transaction.amount), 0);
  const monthExpense = currentMonthTransactions
    .filter(
      (transaction) =>
        transaction.type === "EXPENSE" ||
        transaction.type === "LOAN_PAYMENT" ||
        transaction.type === "CREDIT_CARD_PAYMENT" ||
        transaction.type === "SAVINGS_CONTRIBUTION"
    )
    .reduce((sum, transaction) => sum + toNumber(transaction.amount), 0);

  const cardsDebt = base.cards.reduce((sum, card) => sum + toNumber(card.payoffBalance), 0);
  const loansDebt = base.loans.reduce((sum, loan) => sum + toNumber(loan.currentBalance), 0);
  const msiDebt = base.installmentPurchases
    .filter((item) => item.status === "ACTIVE")
    .reduce((sum, item) => sum + toNumber(item.remainingBalance), 0);
  const totalDebt = cardsDebt + loansDebt + msiDebt;
  const requiredThisMonth =
    base.cards.reduce((sum, card) => sum + toNumber(card.statementBalance), 0) +
    base.loans.reduce((sum, loan) => sum + toNumber(loan.monthlyPayment), 0) +
    base.installmentPurchases
      .filter((item) => item.status === "ACTIVE")
      .reduce((sum, item) => sum + toNumber(item.monthlyAmount), 0);

  const projection = buildProjection({
    transactions: base.transactions,
    recurringExpenses: base.recurringExpenses,
    loans: base.loans,
    goals: base.goals,
    installmentPayments: base.installmentPayments
  });

  const upcomingPayments = [
    ...base.cards.map((card) => ({
      title: card.name,
      dueDate: card.nextDueDate?.toISOString() ?? new Date().toISOString(),
      dueLabel: card.nextDueDate
        ? card.nextDueDate.toLocaleDateString("es-MX")
        : "Sin fecha",
      amount: toNumber(card.statementBalance),
      kind: "Tarjeta"
    })),
    ...base.loans.map((loan) => ({
      title: loan.name,
      dueDate: addDays(monthStart, loan.paymentDay).toISOString(),
      dueLabel: addDays(monthStart, loan.paymentDay).toLocaleDateString("es-MX"),
      amount: toNumber(loan.monthlyPayment),
      kind: "Préstamo"
    })),
    ...base.recurringExpenses.map((expense) => ({
      title: expense.name,
      dueDate: expense.nextDueDate.toISOString(),
      dueLabel: expense.nextDueDate.toLocaleDateString("es-MX"),
      amount: toNumber(expense.amount),
      kind: "Fijo"
    }))
  ]
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 6);

  const debtItems = [
    ...base.loans.map((loan) => ({
      name: loan.name,
      balance: toNumber(loan.currentBalance),
      progressPct: percentage(
        toNumber(loan.originalAmount) - toNumber(loan.currentBalance),
        toNumber(loan.originalAmount)
      ),
      helper: `${Math.ceil(toNumber(loan.currentBalance) / Math.max(toNumber(loan.monthlyPayment), 1))} meses restantes`
    })),
    ...base.cards.map((card) => ({
      name: card.name,
      balance: toNumber(card.payoffBalance),
      progressPct: percentage(
        Math.max(toNumber(card.creditLimit) - toNumber(card.payoffBalance), 0),
        Math.max(toNumber(card.creditLimit), 1)
      ),
      helper: `${Math.round(percentage(toNumber(card.payoffBalance), toNumber(card.creditLimit)))}% de línea usada`
    }))
  ];

  return {
    availableBalance: round(availableBalance),
    monthIncome: round(monthIncome),
    monthExpense: round(monthExpense),
    totalDebt: round(totalDebt),
    requiredThisMonth: round(requiredThisMonth),
    expenseVsIncomePct: percentage(monthExpense, monthIncome),
    projection,
    budgetUsage: buildBudgetUsage(base.budgets, base.transactions),
    goalProgress: buildGoalProgress(base.goals),
    debtProgress: {
      totalProgressPct: percentage(
        debtItems.reduce((sum, item) => sum + item.progressPct, 0),
        Math.max(debtItems.length * 100, 1)
      ),
      items: debtItems
    },
    upcomingPayments,
    alerts: filterInsights(alerts, "dashboard", 6)
  };
}

export async function getAccountsPageData(userId: string) {
  const base = await getBaseData(userId);

  return {
    accounts: base.accounts
      .filter((account) => ["CHECKING", "DEBIT", "SAVINGS", "CASH"].includes(account.type))
      .map((account) => ({
        id: account.id,
        name: account.name,
        typeLabel: account.type,
        balance: toNumber(account.currentBalance)
      })),
    cards: base.cards.map((card) => ({
      id: card.id,
      name: card.name,
      bank: card.bank,
      last4: card.last4,
      statementClosingDay: card.statementClosingDay,
      paymentDueDay: card.paymentDueDay,
      statementBalance: toNumber(card.statementBalance),
      minimumDueAmount: toNumber(card.minimumDueAmount),
      payoffBalance: toNumber(card.payoffBalance),
      nextDueDate: card.nextDueDate?.toISOString() ?? new Date().toISOString(),
      utilizationPct: percentage(toNumber(card.payoffBalance), toNumber(card.creditLimit))
    }))
  };
}

export async function getDebtsPageData(userId: string) {
  const base = await getBaseData(userId);
  const alerts = compileRealtimeInsights(base);
  const settings = base.settings;
  const activeInstallments = base.installmentPurchases.filter((item) => item.status === "ACTIVE");
  const totalDebt =
    base.cards.reduce((sum, card) => sum + toNumber(card.payoffBalance), 0) +
    base.loans.reduce((sum, loan) => sum + toNumber(loan.currentBalance), 0) +
    activeInstallments.reduce((sum, item) => sum + toNumber(item.remainingBalance), 0);
  const requiredThisMonth =
    base.cards.reduce((sum, card) => sum + toNumber(card.statementBalance), 0) +
    base.loans.reduce((sum, loan) => sum + toNumber(loan.monthlyPayment), 0) +
    activeInstallments.reduce((sum, item) => sum + toNumber(item.monthlyAmount), 0);
  const noInterestAmount = base.cards.reduce(
    (sum, card) => sum + toNumber(card.statementBalance),
    0
  );
  const minimumDueAmount = base.cards.reduce(
    (sum, card) => sum + toNumber(card.minimumDueAmount),
    0
  );
  const items = [
    ...base.cards.map((card) => ({
      id: card.id,
      type: "CARD",
      name: card.name,
      balance: toNumber(card.payoffBalance),
      monthsLeft: Math.ceil(toNumber(card.payoffBalance) / Math.max(toNumber(card.statementBalance), 1)),
      progressPct: percentage(
        Math.max(toNumber(card.creditLimit) - toNumber(card.payoffBalance), 0),
        Math.max(toNumber(card.creditLimit), 1)
      ),
      helper:
        toNumber(card.minimumDueAmount) > 0
          ? `Mínimo ${Math.round(toNumber(card.minimumDueAmount))} · no intereses ${Math.round(toNumber(card.statementBalance))}`
          : `Pago para no intereses ${Math.round(toNumber(card.statementBalance))}`,
      href: `/cards/${card.id}`,
      reason: toNumber(card.annualInterestRate) > 40 ? "Avalancha" : "Snowball",
      metric: toNumber(card.annualInterestRate),
      apr: toNumber(card.annualInterestRate),
      baselinePayment: Math.max(
        toNumber(card.minimumDueAmount) || toNumber(card.statementBalance),
        1
      )
    })),
    ...base.loans.map((loan) => ({
      id: loan.id,
      type: "LOAN",
      name: loan.name,
      balance: toNumber(loan.currentBalance),
      monthsLeft: Math.ceil(toNumber(loan.currentBalance) / Math.max(toNumber(loan.monthlyPayment), 1)),
      progressPct: percentage(
        toNumber(loan.originalAmount) - toNumber(loan.currentBalance),
        toNumber(loan.originalAmount)
      ),
      helper: `Pago mensual ${Math.round(toNumber(loan.monthlyPayment))}`,
      href: `/loans/${loan.id}`,
      reason: loan.priority === "HIGH" || loan.priority === "CRITICAL" ? "Personalizada" : "Base",
      metric: toNumber(loan.interestRate),
      apr: toNumber(loan.interestRate),
      baselinePayment: Math.max(toNumber(loan.monthlyPayment), 1)
    }))
  ];

  const ordered =
    settings?.debtStrategy === "SNOWBALL"
      ? [...items].sort((a, b) => a.balance - b.balance)
      : settings?.debtStrategy === "CUSTOM"
        ? [...items].sort((a, b) => b.metric - a.metric)
        : [...items].sort((a, b) => b.metric - a.metric);

  return {
    totalDebt: round(totalDebt),
    requiredThisMonth: round(requiredThisMonth),
    noInterestAmount: round(noInterestAmount),
    minimumDueAmount: round(minimumDueAmount),
    monthsToFreedom: Math.ceil(totalDebt / Math.max(requiredThisMonth, 1)),
    strategy: settings?.debtStrategy ?? "AVALANCHE",
    items,
    simulatorContext: {
      debts: items.map((item) => ({
        id: item.id,
        type: item.type,
        name: item.name,
        balance: item.balance,
        baselinePayment: item.baselinePayment,
        apr: item.apr
      }))
    },
    recommendedOrder: ordered.map((item, index) => ({
      name: item.name,
      reason: index === 0 ? "Atacar ahora" : "Después",
      explanation:
        settings?.debtStrategy === "SNOWBALL"
          ? "Saldo menor para ganar tracción psicológica y liberar flujo más rápido."
          : settings?.debtStrategy === "CUSTOM"
            ? "Orden según prioridad definida por el usuario."
            : "Mayor costo financiero o presión de saldo para minimizar intereses."
    })),
    alerts: filterInsights(alerts, "debt", 4)
  };
}

export async function getInstallmentsPageData(userId: string) {
  const base = await getBaseData(userId);
  const items = base.installmentPurchases.filter((item) => item.status === "ACTIVE");

  return {
    monthlyLoad: items.reduce((sum, item) => sum + toNumber(item.monthlyAmount), 0),
    remaining: items.reduce((sum, item) => sum + toNumber(item.remainingBalance), 0),
    reliefSoon: items
      .filter((item) => item.currentInstallment >= item.totalMonths - 2)
      .reduce((sum, item) => sum + toNumber(item.monthlyAmount), 0),
    items: items.map((item) => ({
      id: item.id,
      title: item.title,
      merchant: item.merchant ?? "Sin comercio",
      status: item.status,
      currentInstallment: item.currentInstallment,
      totalMonths: item.totalMonths,
      monthlyAmount: toNumber(item.monthlyAmount),
      remainingBalance: toNumber(item.remainingBalance),
      progressPct: percentage(item.currentInstallment, item.totalMonths),
      endsAt: addMonths(item.firstChargeMonth, item.totalMonths - 1).toISOString()
    })),
    schedule: base.installmentPayments.slice(0, 8).map((payment) => ({
      id: payment.id,
      purchaseTitle: payment.purchase.title,
      chargeMonth: payment.chargeMonth.toISOString(),
      amount: toNumber(payment.amount),
      remainingAfterPayment: Math.max(toNumber(payment.remainingAfterPayment), 0)
    }))
  };
}

export async function getGoalsPageData(userId: string) {
  const base = await getBaseData(userId);
  return {
    items: buildGoalProgress(base.goals)
  };
}

export async function getBudgetsPageData(userId: string) {
  const base = await getBaseData(userId);
  return {
    items: buildBudgetUsage(base.budgets, base.transactions)
  };
}

export async function getProjectionPageData(userId: string) {
  const base = await getBaseData(userId);
  const alerts = compileRealtimeInsights(base);
  const projection = buildProjection({
    transactions: base.transactions,
    recurringExpenses: base.recurringExpenses,
    loans: base.loans,
    goals: base.goals,
    installmentPayments: base.installmentPayments
  });

  return {
    projection,
    nextFortnightNeed: round(
      base.cards.reduce((sum, card) => sum + toNumber(card.statementBalance), 0) / 2 +
        base.loans.reduce((sum, loan) => sum + toNumber(loan.monthlyPayment), 0) / 2 +
        base.recurringExpenses.reduce((sum, expense) => sum + toNumber(expense.amount), 0) / 2
    ),
    nextMonthNeed: round(
      projection[0].fixed +
        projection[0].debt +
        projection[0].installments +
        projection[0].savings +
        projection[0].variable
    ),
    noSpendNextMonth: round(
      projection[0].fixed +
        projection[0].debt +
        projection[0].installments +
        projection[0].savings
    ),
    simulatorContext: {
      currentMonth: projection[0],
      averageIncome: projection[0]?.income ?? 0,
      averageFixed: projection[0]?.fixed ?? 0,
      averageDebt: projection[0]?.debt ?? 0,
      averageInstallments: projection[0]?.installments ?? 0,
      averageSavings: projection[0]?.savings ?? 0,
      averageVariable: projection[0]?.variable ?? 0
    },
    alerts: filterInsights(alerts, "projection", 4)
  };
}

export async function getPlannedPurchasesPageData(userId: string) {
  const base = await getBaseData(userId);
  const alerts = compileRealtimeInsights(base);
  const projection = buildProjection({
    transactions: base.transactions,
    recurringExpenses: base.recurringExpenses,
    loans: base.loans,
    goals: base.goals,
    installmentPayments: base.installmentPayments
  });
  const freeCash = Math.max(projection[0]?.net ?? 0, 1);
  const currentCommitted =
    (projection[0]?.fixed ?? 0) +
    (projection[0]?.debt ?? 0) +
    (projection[0]?.installments ?? 0) +
    (projection[0]?.savings ?? 0);
  const monthlyIncome = projection[0]?.income ?? 0;
  const currentInstallmentLoad = base.installmentPurchases
    .filter((item) => item.status === "ACTIVE")
    .reduce((sum, item) => sum + toNumber(item.monthlyAmount), 0);

  return {
    items: base.plannedPurchases.map((item) => {
      const targetPrice = toNumber(item.targetPrice);
      const minPrice = toNumber(item.expectedMinPrice ?? item.seasonality?.priceRangeMin);
      const maxPrice = toNumber(item.expectedMaxPrice ?? item.seasonality?.priceRangeMax);
      const saved = toNumber(item.currentlySaved);
      const msiMonthly = round(targetPrice / 12);
      return {
        id: item.id,
        title: item.title,
        bestWindow: item.bestMonthNote ?? item.seasonality?.guidance ?? "Ventana no definida",
        recommendationLabel: item.recommendation.replaceAll("_", " "),
        recommendationTone:
          item.recommendation === "WAIT"
            ? "warning"
            : item.recommendation === "BUY_NOW"
              ? "positive"
              : "default",
        saved,
        savedPct: percentage(saved, targetPrice),
        targetPrice,
        minPrice,
        maxPrice,
        stores: item.preferredStores.length ? item.preferredStores : item.seasonality?.typicalRetailers ?? [],
        guidance: item.strategyNote ?? item.seasonality?.guidance ?? "",
        cashBuffer: Math.max(targetPrice * 0.4, saved),
        msiMonthly,
        msiImpactPct: percentage(msiMonthly, freeCash)
      };
    }),
    simulatorContext: {
      freeCash,
      monthlyIncome,
      currentCommitted,
      currentInstallmentLoad,
      currentCommitmentPct: percentage(currentCommitted, monthlyIncome || 1)
    },
    alerts: filterInsights(alerts, "planned", 4)
  };
}

export async function getCardDetailData(userId: string, cardId: string) {
  const base = await getBaseData(userId);
  const card = base.cards.find((item) => item.id === cardId);

  if (!card) {
    return null;
  }

  const alerts = compileRealtimeInsights(base);
  const activeInstallments = base.installmentPurchases.filter(
    (item) => item.creditCardId === card.id && item.status === "ACTIVE"
  );
  const monthlyInstallmentLoad = activeInstallments.reduce(
    (sum, item) => sum + toNumber(item.monthlyAmount),
    0
  );
  const availableCredit = Math.max(toNumber(card.creditLimit) - toNumber(card.payoffBalance), 0);
  const upcomingCharges = activeInstallments
    .flatMap((purchase) =>
      purchase.payments
        .filter((payment) => !payment.isPaid)
        .map((payment) => ({
          id: payment.id,
          title: purchase.title,
          amount: toNumber(payment.amount),
          dueDate: payment.dueDate.toISOString(),
          chargeMonth: payment.chargeMonth.toISOString(),
          installmentNumber: payment.installmentNumber
        }))
    )
    .sort((left, right) => new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime())
    .slice(0, 6);

  const preview = getPurchaseCycleSummary({
    purchaseDate: new Date(),
    amount: 10000,
    installments: 12,
    closingDay: card.statementClosingDay,
    dueDay: card.paymentDueDay,
    creditLimit: toNumber(card.creditLimit),
    currentBalance: toNumber(card.payoffBalance)
  });

  return {
    id: card.id,
    name: card.name,
    bank: card.bank,
    statementClosingDay: card.statementClosingDay,
    paymentDueDay: card.paymentDueDay,
    creditLimit: toNumber(card.creditLimit),
    statementBalance: toNumber(card.statementBalance),
    minimumDueAmount: toNumber(card.minimumDueAmount),
    payoffBalance: toNumber(card.payoffBalance),
    availableCredit: round(availableCredit),
    monthlyInstallmentLoad: round(monthlyInstallmentLoad),
    nextDueDate: card.nextDueDate?.toISOString() ?? new Date().toISOString(),
    utilizationPct: percentage(toNumber(card.payoffBalance), toNumber(card.creditLimit)),
    alerts: filterInsights(alerts, "card", 4),
    simulatorContext: {
      closingDay: card.statementClosingDay,
      dueDay: card.paymentDueDay,
      creditLimit: toNumber(card.creditLimit),
      payoffBalance: toNumber(card.payoffBalance),
      sample: {
        closingDate: preview.closingDate.toISOString(),
        dueDate: preview.dueDate.toISOString(),
        firstChargeMonth: preview.firstChargeMonth.toISOString(),
        finalChargeMonth: preview.finalChargeMonth.toISOString(),
        statementBucket: preview.statementBucket,
        monthlyAmount: preview.monthlyAmount,
        utilizationAfter: preview.utilizationAfter,
        needsWithin15Days: preview.needsWithin15Days,
        needsWithin30Days: preview.needsWithin30Days
      }
    },
    upcomingCharges,
    installments: activeInstallments.map((item) => ({
      id: item.id,
      title: item.title,
      merchant: item.merchant ?? "Sin comercio",
      monthlyAmount: toNumber(item.monthlyAmount),
      remainingBalance: toNumber(item.remainingBalance),
      progressPct: percentage(item.currentInstallment, item.totalMonths),
      endsAt: addMonths(item.firstChargeMonth, item.totalMonths - 1).toISOString()
    }))
  };
}

export async function getLoanDetailData(userId: string, loanId: string) {
  const loan = await prisma.loan.findFirst({
    where: { id: loanId, userId }
  });

  if (!loan) {
    return null;
  }

  return {
    id: loan.id,
    name: loan.name,
    lender: loan.lender ?? "Sin institución",
    priority: loan.priority,
    originalAmount: toNumber(loan.originalAmount),
    currentBalance: toNumber(loan.currentBalance),
    monthlyPayment: toNumber(loan.monthlyPayment),
    interestRate: toNumber(loan.interestRate),
    monthlyInterestEstimate: round(
      toNumber(loan.currentBalance) * (toNumber(loan.interestRate) / 100 / 12)
    ),
    monthsLeft: Math.ceil(toNumber(loan.currentBalance) / Math.max(toNumber(loan.monthlyPayment), 1)),
    progressPct: percentage(
      toNumber(loan.originalAmount) - toNumber(loan.currentBalance),
      toNumber(loan.originalAmount)
    ),
    payoffScenarios: [1000, 2500, 5000].map((extra) => {
      const baseScenario = simulateDebtPayoff(
        toNumber(loan.currentBalance),
        toNumber(loan.monthlyPayment),
        toNumber(loan.interestRate)
      );
      const accelerated = simulateDebtPayoff(
        toNumber(loan.currentBalance),
        toNumber(loan.monthlyPayment) + extra,
        toNumber(loan.interestRate)
      );

      return {
        extraPayment: extra,
        monthsSaved: Math.max(baseScenario.months - accelerated.months, 0),
        interestSaved: Math.max(baseScenario.interestPaid - accelerated.interestPaid, 0)
      };
    }),
    guidance:
      toNumber(loan.interestRate) >= 30
        ? "La tasa ya es suficientemente alta para justificar aceleración si tu flujo lo soporta."
        : "La prioridad puede depender más de liberar flujo que de costo financiero puro."
  };
}
