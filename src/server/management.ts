import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/utils";

function getRuleConfigValue<T>(config: unknown, key: string) {
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    return undefined as T | undefined;
  }

  return (config as Record<string, T | undefined>)[key];
}

export async function getTransactionsManagementData(userId: string) {
  const [transactions, accounts, categories, subcategories, goals] = await prisma.$transaction([
    prisma.transaction.findMany({
      where: { userId },
      include: {
        category: true,
        subcategory: true,
        sourceAccount: true,
        destinationAccount: true,
        tags: {
          include: {
            tag: true
          }
        }
      },
      orderBy: { postedAt: "desc" },
      take: 50
    }),
    prisma.account.findMany({
      where: { userId, isArchived: false },
      orderBy: { name: "asc" }
    }),
    prisma.category.findMany({
      where: { userId },
      orderBy: [{ kind: "asc" }, { name: "asc" }]
    }),
    prisma.subcategory.findMany({
      where: { userId },
      orderBy: { name: "asc" }
    }),
    prisma.savingsGoal.findMany({
      where: { userId },
      orderBy: { name: "asc" }
    })
  ]);

  return {
    items: transactions.map((transaction) => ({
      id: transaction.id,
      postedAt: transaction.postedAt.toISOString(),
      amount: toNumber(transaction.amount),
      type: transaction.type,
      cadence: transaction.cadence,
      planning: transaction.planning,
      description: transaction.description,
      merchant: transaction.merchant ?? undefined,
      notes: transaction.notes ?? undefined,
      categoryId: transaction.categoryId ?? undefined,
      categoryName: transaction.category?.name ?? undefined,
      subcategoryId: transaction.subcategoryId ?? undefined,
      subcategoryName: transaction.subcategory?.name ?? undefined,
      sourceAccountId: transaction.sourceAccountId ?? undefined,
      sourceAccountName: transaction.sourceAccount?.name ?? undefined,
      destinationAccountId: transaction.destinationAccountId ?? undefined,
      destinationAccountName: transaction.destinationAccount?.name ?? undefined,
      savingsGoalId: transaction.savingsGoalId ?? undefined,
      tags: transaction.tags.map((item) => item.tag.name)
    })),
    accounts: accounts.map((account) => ({
      id: account.id,
      name: account.name,
      meta: account.type
    })),
    categories: categories.map((category) => ({
      id: category.id,
      name: category.name,
      kind: category.kind
    })),
    subcategories: subcategories.map((subcategory) => ({
      id: subcategory.id,
      name: subcategory.name,
      categoryId: subcategory.categoryId
    })),
    goals: goals.map((goal) => ({
      id: goal.id,
      name: goal.name
    }))
  };
}

export async function getRecurringExpensesManagementData(userId: string) {
  const [items, categories, subcategories, accounts] = await prisma.$transaction([
    prisma.recurringExpense.findMany({
      where: { userId },
      include: {
        category: true,
        subcategory: true,
        paymentAccount: true
      },
      orderBy: { nextDueDate: "asc" }
    }),
    prisma.category.findMany({
      where: { userId, kind: "EXPENSE" },
      orderBy: { name: "asc" }
    }),
    prisma.subcategory.findMany({
      where: { userId },
      orderBy: { name: "asc" }
    }),
    prisma.account.findMany({
      where: { userId, isArchived: false },
      orderBy: { name: "asc" }
    })
  ]);

  return {
    items: items.map((item) => ({
      id: item.id,
      name: item.name,
      amount: toNumber(item.amount),
      frequency: item.frequency,
      nextDueDate: item.nextDueDate.toISOString(),
      reminderDays: item.reminderDays,
      isEssential: item.isEssential,
      isActive: item.isActive,
      merchant: item.merchant ?? undefined,
      notes: item.notes ?? undefined,
      categoryId: item.categoryId,
      categoryName: item.category.name,
      subcategoryId: item.subcategoryId ?? undefined,
      subcategoryName: item.subcategory?.name ?? undefined,
      paymentAccountId: item.paymentAccountId ?? undefined,
      paymentAccountName: item.paymentAccount?.name ?? undefined
    })),
    categories: categories.map((category) => ({
      id: category.id,
      name: category.name
    })),
    subcategories: subcategories.map((subcategory) => ({
      id: subcategory.id,
      name: subcategory.name,
      categoryId: subcategory.categoryId
    })),
    accounts: accounts.map((account) => ({
      id: account.id,
      name: account.name
    }))
  };
}

export async function getTaxonomyManagementData(userId: string) {
  const [categories, subcategories, tags] = await prisma.$transaction([
    prisma.category.findMany({
      where: { userId },
      include: {
        _count: {
          select: { subcategories: true }
        }
      },
      orderBy: [{ kind: "asc" }, { name: "asc" }]
    }),
    prisma.subcategory.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { name: "asc" }
    }),
    prisma.tag.findMany({
      where: { userId },
      orderBy: { name: "asc" }
    })
  ]);

  return {
    categories: categories.map((category) => ({
      id: category.id,
      name: category.name,
      kind: category.kind,
      color: category.color ?? undefined,
      icon: category.icon ?? undefined,
      subcategoriesCount: category._count.subcategories
    })),
    subcategories: subcategories.map((subcategory) => ({
      id: subcategory.id,
      name: subcategory.name,
      categoryId: subcategory.categoryId,
      categoryName: subcategory.category.name
    })),
    tags: tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      color: tag.color ?? undefined
    }))
  };
}

export async function getGoalsManagementData(userId: string) {
  const [goals, accounts] = await prisma.$transaction([
    prisma.savingsGoal.findMany({
      where: { userId },
      include: { linkedAccount: true },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }]
    }),
    prisma.account.findMany({
      where: { userId, isArchived: false },
      orderBy: { name: "asc" }
    })
  ]);

  return {
    items: goals.map((goal) => ({
      id: goal.id,
      name: goal.name,
      targetAmount: toNumber(goal.targetAmount),
      currentAmount: toNumber(goal.currentAmount),
      targetDate: goal.targetDate?.toISOString() ?? undefined,
      priority: goal.priority,
      monthlySuggestedContribution: toNumber(goal.monthlySuggestedContribution),
      linkedAccountId: goal.linkedAccountId ?? undefined,
      linkedAccountName: goal.linkedAccount?.name ?? undefined,
      color: goal.color ?? undefined,
      icon: goal.icon ?? undefined,
      notes: goal.notes ?? undefined
    })),
    accounts: accounts.map((account) => ({
      id: account.id,
      name: account.name
    }))
  };
}

export async function getBudgetsManagementData(userId: string) {
  const [budgets, categories, subcategories] = await prisma.$transaction([
    prisma.budget.findMany({
      where: { userId },
      include: { category: true, subcategory: true },
      orderBy: [{ month: "desc" }, { createdAt: "desc" }]
    }),
    prisma.category.findMany({
      where: { userId },
      orderBy: { name: "asc" }
    }),
    prisma.subcategory.findMany({
      where: { userId },
      orderBy: { name: "asc" }
    })
  ]);

  return {
    items: budgets.map((budget) => ({
      id: budget.id,
      name: budget.name ?? undefined,
      scope: budget.scope,
      month: budget.month.toISOString().slice(0, 7),
      limitAmount: toNumber(budget.limitAmount),
      alertPercent: budget.alertPercent,
      carryOver: budget.carryOver,
      categoryId: budget.categoryId ?? undefined,
      categoryName: budget.category?.name ?? undefined,
      subcategoryId: budget.subcategoryId ?? undefined,
      subcategoryName: budget.subcategory?.name ?? undefined
    })),
    categories: categories.map((category) => ({
      id: category.id,
      name: category.name
    })),
    subcategories: subcategories.map((subcategory) => ({
      id: subcategory.id,
      name: subcategory.name,
      categoryId: subcategory.categoryId
    }))
  };
}

export async function getPlannedPurchasesManagementData(userId: string) {
  const [items, goals, seasonality] = await prisma.$transaction([
    prisma.plannedPurchase.findMany({
      where: { userId },
      include: {
        linkedGoal: true,
        seasonality: true
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.savingsGoal.findMany({
      where: { userId },
      orderBy: { name: "asc" }
    }),
    prisma.purchaseSeasonality.findMany({
      where: {
        OR: [{ userId }, { userId: null }]
      },
      orderBy: { title: "asc" }
    })
  ]);

  return {
    items: items.map((item) => ({
      id: item.id,
      linkedGoalId: item.linkedGoalId ?? undefined,
      linkedGoalName: item.linkedGoal?.name ?? undefined,
      seasonalityId: item.seasonalityId ?? undefined,
      seasonalityTitle: item.seasonality?.title ?? undefined,
      title: item.title,
      categoryKey: item.categoryKey,
      priority: item.priority,
      status: item.status,
      recommendation: item.recommendation,
      targetPrice: toNumber(item.targetPrice),
      expectedMinPrice: item.expectedMinPrice ? toNumber(item.expectedMinPrice) : undefined,
      expectedMaxPrice: item.expectedMaxPrice ? toNumber(item.expectedMaxPrice) : undefined,
      currentlySaved: toNumber(item.currentlySaved),
      desiredDate: item.desiredDate?.toISOString() ?? undefined,
      suggestedMonthlySaving: item.suggestedMonthlySaving
        ? toNumber(item.suggestedMonthlySaving)
        : undefined,
      bestMonthNote: item.bestMonthNote ?? undefined,
      strategyNote: item.strategyNote ?? undefined,
      preferredStores: item.preferredStores,
      referenceSites: item.referenceSites
    })),
    goals: goals.map((goal) => ({
      id: goal.id,
      name: goal.name
    })),
    seasonality: seasonality.map((item) => ({
      id: item.id,
      title: item.title
    }))
  };
}

export async function getAccountsManagementData(userId: string) {
  const [accounts, cards] = await prisma.$transaction([
    prisma.account.findMany({
      where: {
        userId,
        isArchived: false,
        creditCardProfile: null,
        loanProfile: null
      },
      orderBy: { createdAt: "asc" }
    }),
    prisma.creditCard.findMany({
      where: { userId },
      include: { account: true },
      orderBy: { createdAt: "asc" }
    })
  ]);

  return {
    accounts: accounts.map((account) => ({
      id: account.id,
      name: account.name,
      type: account.type,
      institution: account.institution ?? undefined,
      last4: account.last4 ?? undefined,
      currentBalance: toNumber(account.currentBalance),
      availableBalance: account.availableBalance ? toNumber(account.availableBalance) : undefined,
      color: account.color ?? undefined,
      icon: account.icon ?? undefined,
      includeInNetWorth: account.includeInNetWorth,
      isLiquid: account.isLiquid,
      notes: account.notes ?? undefined
    })),
    cards: cards.map((card) => ({
      id: card.id,
      accountId: card.accountId,
      name: card.name,
      bank: card.bank,
      last4: card.last4,
      statementClosingDay: card.statementClosingDay,
      paymentDueDay: card.paymentDueDay,
      creditLimit: toNumber(card.creditLimit),
      statementBalance: toNumber(card.statementBalance),
      payoffBalance: toNumber(card.payoffBalance),
      minimumDueAmount: card.minimumDueAmount ? toNumber(card.minimumDueAmount) : undefined,
      annualInterestRate: card.annualInterestRate ? toNumber(card.annualInterestRate) : undefined,
      minimumPaymentRatio: card.minimumPaymentRatio ? toNumber(card.minimumPaymentRatio) : undefined,
      paymentTracking: card.paymentTracking,
      nextStatementDate: card.nextStatementDate?.toISOString() ?? undefined,
      nextDueDate: card.nextDueDate?.toISOString() ?? undefined,
      color: card.color ?? undefined,
      icon: card.icon ?? undefined,
      notes: card.notes ?? undefined
    }))
  };
}

export async function getLoansManagementData(userId: string) {
  const loans = await prisma.loan.findMany({
    where: { userId },
    include: { account: true },
    orderBy: { createdAt: "asc" }
  });

  return {
    items: loans.map((loan) => ({
      id: loan.id,
      accountId: loan.accountId,
      name: loan.name,
      lender: loan.lender ?? undefined,
      originalAmount: toNumber(loan.originalAmount),
      currentBalance: toNumber(loan.currentBalance),
      monthlyPayment: toNumber(loan.monthlyPayment),
      interestRate: loan.interestRate ? toNumber(loan.interestRate) : undefined,
      paymentDay: loan.paymentDay,
      priority: loan.priority,
      strategyWeight: loan.strategyWeight,
      openedAt: loan.openedAt.toISOString(),
      targetPayoffDate: loan.targetPayoffDate?.toISOString() ?? undefined,
      notes: loan.notes ?? undefined
    }))
  };
}

export async function getInstallmentsManagementData(userId: string) {
  const [items, cards, categories] = await prisma.$transaction([
    prisma.installmentPurchase.findMany({
      where: { userId },
      include: {
        creditCard: true,
        category: true
      },
      orderBy: { purchaseDate: "desc" }
    }),
    prisma.creditCard.findMany({
      where: { userId },
      orderBy: { name: "asc" }
    }),
    prisma.category.findMany({
      where: { userId, kind: { in: ["EXPENSE", "DEBT"] } },
      orderBy: { name: "asc" }
    })
  ]);

  return {
    items: items.map((item) => ({
      id: item.id,
      creditCardId: item.creditCardId,
      creditCardName: item.creditCard.name,
      categoryId: item.categoryId ?? undefined,
      categoryName: item.category?.name ?? undefined,
      title: item.title,
      merchant: item.merchant ?? undefined,
      totalAmount: toNumber(item.totalAmount),
      purchaseDate: item.purchaseDate.toISOString(),
      totalMonths: item.totalMonths,
      monthlyAmount: toNumber(item.monthlyAmount),
      firstChargeMonth: item.firstChargeMonth.toISOString(),
      currentInstallment: item.currentInstallment,
      remainingBalance: toNumber(item.remainingBalance),
      status: item.status,
      isManuallySettled: item.isManuallySettled,
      settledAt: item.settledAt?.toISOString() ?? undefined,
      notes: item.notes ?? undefined
    })),
    cards: cards.map((card) => ({
      id: card.id,
      name: card.name,
      closingDay: card.statementClosingDay,
      dueDay: card.paymentDueDay
    })),
    categories: categories.map((category) => ({
      id: category.id,
      name: category.name
    }))
  };
}

export async function getSettingsManagementData(userId: string) {
  const [settings, rules, categories] = await prisma.$transaction([
    prisma.settings.findUnique({
      where: { userId }
    }),
    prisma.financialRule.findMany({
      where: { userId },
      orderBy: [{ isEnabled: "desc" }, { createdAt: "desc" }]
    }),
    prisma.category.findMany({
      where: { userId, kind: { in: ["EXPENSE", "DEBT", "SAVINGS"] } },
      orderBy: [{ kind: "asc" }, { name: "asc" }]
    })
  ]);

  return {
    settings: {
      currency: settings?.currency ?? "MXN",
      locale: settings?.locale ?? "es-MX",
      dateFormat: settings?.dateFormat ?? "dd/MM/yyyy",
      incomeFrequency: settings?.incomeFrequency ?? "BIWEEKLY",
      paydayDays: settings?.paydayDays ?? [15, 30],
      debtStrategy: settings?.debtStrategy ?? "AVALANCHE",
      defaultGoalPriority: settings?.defaultGoalPriority ?? "MEDIUM",
      cardStatementBufferDays: settings?.cardStatementBufferDays ?? 3,
      enableLocalInsights: settings?.enableLocalInsights ?? true,
      weekStartsOn: settings?.weekStartsOn ?? 1,
      projectedFlowMonths: settings?.projectedFlowMonths ?? 12,
      categoryBudgetWarningPct: settings?.categoryBudgetWarningPct ?? 80,
      themeMode: settings?.themeMode ?? "light"
    },
    rules: rules.map((rule) => ({
      id: rule.id,
      name: rule.name,
      description: rule.description ?? undefined,
      type: rule.type,
      severity: rule.severity,
      isEnabled: rule.isEnabled,
      thresholdPercent: getRuleConfigValue<number>(rule.config, "thresholdPercent"),
      amountLimit: getRuleConfigValue<number>(rule.config, "amountLimit"),
      transactionCount: getRuleConfigValue<number>(rule.config, "transactionCount"),
      daysWindow: getRuleConfigValue<number>(rule.config, "daysWindow"),
      categoryId: getRuleConfigValue<string>(rule.config, "categoryId"),
      categoryName:
        categories.find(
          (category) => category.id === getRuleConfigValue<string>(rule.config, "categoryId")
        )?.name ?? undefined
    })),
    categories: categories.map((category) => ({
      id: category.id,
      name: category.name,
      kind: category.kind
    }))
  };
}
