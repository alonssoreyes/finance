import { PrismaClient, AccountType, BudgetScope, CardPaymentTracking, CategoryKind, InsightSeverity, PlannedPurchaseStatus, Priority, RecommendationType, RecurringFrequency, Role, TransactionCadence, TransactionPlanning, TransactionType } from "@prisma/client";
import { addDays, addMonths, formatISO, setDate, startOfMonth, subMonths } from "date-fns";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const now = new Date();
const monthStart = startOfMonth(now);

async function main() {
  await prisma.notification.deleteMany();
  await prisma.spendingInsight.deleteMany();
  await prisma.financialRule.deleteMany();
  await prisma.transactionTag.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.installmentPayment.deleteMany();
  await prisma.installmentPurchase.deleteMany();
  await prisma.recurringExpense.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.plannedPurchase.deleteMany();
  await prisma.purchaseSeasonality.deleteMany();
  await prisma.savingsGoal.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.subcategory.deleteMany();
  await prisma.category.deleteMany();
  await prisma.loan.deleteMany();
  await prisma.creditCard.deleteMany();
  await prisma.account.deleteMany();
  await prisma.settings.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await hash("Demo12345!", 10);

  const user = await prisma.user.create({
    data: {
      email: "demo@pennywise.local",
      passwordHash,
      name: "Alonso Reyes",
      role: Role.USER,
      settings: {
        create: {
          currency: "MXN",
          locale: "es-MX",
          paydayDays: [15, 30],
          projectedFlowMonths: 12
        }
      }
    }
  });

  const categories = await Promise.all([
    prisma.category.create({ data: { userId: user.id, name: "Nómina", kind: CategoryKind.INCOME, icon: "WalletCards", color: "#1098F7", isSystem: true } }),
    prisma.category.create({ data: { userId: user.id, name: "Supermercado", kind: CategoryKind.EXPENSE, icon: "ShoppingBasket", color: "#14C8B2" } }),
    prisma.category.create({ data: { userId: user.id, name: "Comida fuera", kind: CategoryKind.EXPENSE, icon: "UtensilsCrossed", color: "#0EA5A4" } }),
    prisma.category.create({ data: { userId: user.id, name: "Transporte", kind: CategoryKind.EXPENSE, icon: "CarFront", color: "#3B82F6" } }),
    prisma.category.create({ data: { userId: user.id, name: "Servicios", kind: CategoryKind.EXPENSE, icon: "ReceiptText", color: "#38BDF8" } }),
    prisma.category.create({ data: { userId: user.id, name: "Seguros", kind: CategoryKind.EXPENSE, icon: "ShieldCheck", color: "#1D4ED8" } }),
    prisma.category.create({ data: { userId: user.id, name: "MSI", kind: CategoryKind.DEBT, icon: "CalendarSync", color: "#F25F5C" } }),
    prisma.category.create({ data: { userId: user.id, name: "Ahorro", kind: CategoryKind.SAVINGS, icon: "PiggyBank", color: "#14C8B2" } }),
    prisma.category.create({ data: { userId: user.id, name: "Pago de deuda", kind: CategoryKind.DEBT, icon: "Landmark", color: "#0F172A" } })
  ]);

  const payroll = categories.find((item) => item.name === "Nómina")!;
  const grocery = categories.find((item) => item.name === "Supermercado")!;
  const dining = categories.find((item) => item.name === "Comida fuera")!;
  const utilities = categories.find((item) => item.name === "Servicios")!;
  const insurance = categories.find((item) => item.name === "Seguros")!;
  const savings = categories.find((item) => item.name === "Ahorro")!;
  const debt = categories.find((item) => item.name === "Pago de deuda")!;

  const diningSub = await prisma.subcategory.create({
    data: {
      userId: user.id,
      categoryId: dining.id,
      name: "Cafeterías"
    }
  });

  const tags = await Promise.all([
    prisma.tag.create({ data: { userId: user.id, name: "Quincena", color: "#14C8B2" } }),
    prisma.tag.create({ data: { userId: user.id, name: "Planeado", color: "#64748B" } }),
    prisma.tag.create({ data: { userId: user.id, name: "Impulso", color: "#F25F5C" } })
  ]);

  const checking = await prisma.account.create({
    data: {
      userId: user.id,
      name: "Cuenta principal",
      type: AccountType.CHECKING,
      institution: "BBVA",
      currentBalance: 42150,
      availableBalance: 42150,
      color: "#1098F7",
      icon: "Wallet"
    }
  });

  const cash = await prisma.account.create({
    data: {
      userId: user.id,
      name: "Efectivo",
      type: AccountType.CASH,
      currentBalance: 2450,
      availableBalance: 2450,
      color: "#14C8B2",
      icon: "Banknote"
    }
  });

  const savingsAccount = await prisma.account.create({
    data: {
      userId: user.id,
      name: "Apartados",
      type: AccountType.SAVINGS,
      institution: "Hey Banco",
      currentBalance: 18600,
      availableBalance: 18600,
      color: "#1D4ED8",
      icon: "PiggyBank"
    }
  });

  const cardAccount = await prisma.account.create({
    data: {
      userId: user.id,
      name: "AMEX Gold",
      type: AccountType.CREDIT_CARD,
      institution: "American Express",
      last4: "2401",
      currentBalance: -32850,
      availableBalance: 47150,
      creditLimit: 80000,
      color: "#1F2937",
      icon: "CreditCard",
      isLiquid: false
    }
  });

  const loanAccount = await prisma.account.create({
    data: {
      userId: user.id,
      name: "Préstamo personal",
      type: AccountType.LOAN,
      institution: "Nu",
      currentBalance: -68400,
      availableBalance: -68400,
      color: "#0F172A",
      icon: "Landmark",
      isLiquid: false
    }
  });

  const creditCard = await prisma.creditCard.create({
    data: {
      userId: user.id,
      accountId: cardAccount.id,
      name: "AMEX Gold",
      bank: "American Express",
      last4: "2401",
      statementClosingDay: 23,
      paymentDueDay: 10,
      creditLimit: 80000,
      annualInterestRate: 62.5,
      minimumPaymentRatio: 0.06,
      minimumDueAmount: 4200,
      paymentTracking: CardPaymentTracking.BOTH,
      statementBalance: 18420,
      payoffBalance: 32850,
      nextStatementDate: addDays(setDate(monthStart, 23), 0),
      nextDueDate: addMonths(setDate(monthStart, 10), 1),
      color: "#1F2937"
    }
  });

  const loan = await prisma.loan.create({
    data: {
      userId: user.id,
      accountId: loanAccount.id,
      name: "Préstamo personal",
      lender: "Nu",
      originalAmount: 120000,
      currentBalance: 68400,
      monthlyPayment: 5200,
      interestRate: 29.9,
      paymentDay: 12,
      priority: Priority.HIGH,
      strategyWeight: 78
    }
  });

  const emergencyGoal = await prisma.savingsGoal.create({
    data: {
      userId: user.id,
      linkedAccountId: savingsAccount.id,
      name: "Fondo de emergencia",
      targetAmount: 90000,
      currentAmount: 42000,
      targetDate: addMonths(now, 8),
      priority: Priority.CRITICAL,
      monthlySuggestedContribution: 6000,
      color: "#14C8B2",
      icon: "Shield"
    }
  });

  const iphoneGoal = await prisma.savingsGoal.create({
    data: {
      userId: user.id,
      linkedAccountId: savingsAccount.id,
      name: "Colchón para iPhone",
      targetAmount: 18000,
      currentAmount: 5400,
      targetDate: addMonths(now, 5),
      priority: Priority.MEDIUM,
      monthlySuggestedContribution: 2500,
      color: "#1098F7",
      icon: "Smartphone"
    }
  });

  await Promise.all([
    prisma.budget.create({
      data: {
        userId: user.id,
        scope: BudgetScope.CATEGORY,
        month: monthStart,
        categoryId: grocery.id,
        limitAmount: 6500,
        alertPercent: 80
      }
    }),
    prisma.budget.create({
      data: {
        userId: user.id,
        scope: BudgetScope.CATEGORY,
        month: monthStart,
        categoryId: dining.id,
        limitAmount: 4200,
        alertPercent: 75
      }
    }),
    prisma.budget.create({
      data: {
        userId: user.id,
        scope: BudgetScope.GLOBAL,
        month: monthStart,
        name: "Gasto variable",
        limitAmount: 18000,
        alertPercent: 85
      }
    })
  ]);

  await Promise.all([
    prisma.financialRule.create({
      data: {
        userId: user.id,
        name: "Comida fuera arriba de promedio",
        description: "Advierte cuando la categoría rebasa con claridad su ritmo histórico.",
        type: "THRESHOLD",
        severity: InsightSeverity.WARNING,
        config: {
          thresholdPercent: 20,
          categoryId: dining.id
        }
      }
    }),
    prisma.financialRule.create({
      data: {
        userId: user.id,
        name: "Microgastos acumulados",
        description: "Visibiliza cuando muchos gastos chicos ya están drenando flujo.",
        type: "ACCUMULATION",
        severity: InsightSeverity.INFO,
        config: {
          amountLimit: 250,
          transactionCount: 8
        }
      }
    }),
    prisma.financialRule.create({
      data: {
        userId: user.id,
        name: "Flujo comprometido alto",
        description: "Marca cuando el compromiso mensual ya está demasiado cargado.",
        type: "RISK",
        severity: InsightSeverity.CRITICAL,
        config: {
          thresholdPercent: 75
        }
      }
    })
  ]);

  await Promise.all([
    prisma.recurringExpense.create({
      data: {
        userId: user.id,
        name: "Renta",
        amount: 14500,
        frequency: RecurringFrequency.MONTHLY,
        nextDueDate: addDays(monthStart, 2),
        reminderDays: 5,
        isEssential: true,
        categoryId: utilities.id,
        paymentAccountId: checking.id
      }
    }),
    prisma.recurringExpense.create({
      data: {
        userId: user.id,
        name: "Seguro del auto",
        amount: 2100,
        frequency: RecurringFrequency.MONTHLY,
        nextDueDate: addDays(monthStart, 10),
        reminderDays: 4,
        isEssential: true,
        categoryId: insurance.id,
        paymentAccountId: checking.id
      }
    }),
    prisma.recurringExpense.create({
      data: {
        userId: user.id,
        name: "Spotify + iCloud",
        amount: 269,
        frequency: RecurringFrequency.MONTHLY,
        nextDueDate: addDays(monthStart, 16),
        reminderDays: 2,
        isEssential: false,
        categoryId: utilities.id,
        paymentAccountId: cardAccount.id
      }
    })
  ]);

  const installment = await prisma.installmentPurchase.create({
    data: {
      userId: user.id,
      creditCardId: creditCard.id,
      categoryId: categories.find((item) => item.name === "MSI")!.id,
      title: "MacBook Air 15",
      merchant: "Apple",
      totalAmount: 32999,
      purchaseDate: subMonths(now, 2),
      totalMonths: 12,
      monthlyAmount: 2749.92,
      firstChargeMonth: startOfMonth(subMonths(now, 1)),
      currentInstallment: 3,
      remainingBalance: 24749.28,
      status: "ACTIVE"
    }
  });

  for (let index = 0; index < 12; index += 1) {
    const chargeMonth = startOfMonth(addMonths(subMonths(now, 1), index));
    await prisma.installmentPayment.create({
      data: {
        purchaseId: installment.id,
        installmentNumber: index + 1,
        chargeMonth,
        dueDate: addDays(chargeMonth, 10),
        amount: 2749.92,
        remainingAfterPayment: Number((32999 - 2749.92 * (index + 1)).toFixed(2)),
        isPaid: index < 2,
        paidAt: index < 2 ? addDays(chargeMonth, 11) : null
      }
    });
  }

  const seasonalityPhone = await prisma.purchaseSeasonality.create({
    data: {
      title: "Smartphones premium",
      categoryKey: "smartphone",
      bestMonths: [7, 11],
      secondaryMonths: [3, 9],
      typicalRetailers: ["Amazon", "Liverpool", "MacStore"],
      recommendedSites: ["promodescuentos.com", "ddtech.mx", "amazon.com.mx"],
      priceRangeMin: 21999,
      priceRangeMax: 28999,
      guidance: "Los mejores descuentos suelen concentrarse en Hot Sale y Buen Fin. Si tu equipo actual aguanta, esperar noviembre suele bajar el costo efectivo o mejorar los bonos bancarios.",
      confidence: 82
    }
  });

  const seasonalityLaptop = await prisma.purchaseSeasonality.create({
    data: {
      title: "Laptops y computadoras",
      categoryKey: "laptop",
      bestMonths: [7, 11],
      secondaryMonths: [1, 5],
      typicalRetailers: ["Amazon", "Costco", "Office Depot"],
      recommendedSites: ["promodescuentos.com", "amazon.com.mx", "costco.com.mx"],
      priceRangeMin: 22999,
      priceRangeMax: 45999,
      guidance: "Conviene monitorear Hot Sale, regreso a clases y Buen Fin. En laptops, el diferencial de precio frente a MSI suele ser menor que en Apple, así que compara siempre costo de contado vs carga mensual.",
      confidence: 76
    }
  });

  const plannedPhone = await prisma.plannedPurchase.create({
    data: {
      userId: user.id,
      linkedGoalId: iphoneGoal.id,
      seasonalityId: seasonalityPhone.id,
      title: "iPhone 17 Pro",
      categoryKey: "smartphone",
      priority: Priority.MEDIUM,
      status: PlannedPurchaseStatus.RESEARCHING,
      recommendation: RecommendationType.WAIT,
      targetPrice: 24999,
      expectedMinPrice: 21999,
      expectedMaxPrice: 27999,
      currentlySaved: 5400,
      desiredDate: addMonths(now, 5),
      suggestedMonthlySaving: 3200,
      bestMonthNote: "Buen Fin o una promo bancaria en julio reduce mucho el costo total.",
      strategyNote: "Llegar con al menos 40% ahorrado antes de tomar MSI para no saturar el flujo.",
      preferredStores: ["Apple", "MacStore", "Amazon"],
      referenceSites: ["promodescuentos.com", "amazon.com.mx"]
    }
  });

  await prisma.plannedPurchase.create({
    data: {
      userId: user.id,
      seasonalityId: seasonalityLaptop.id,
      title: "TV OLED 55",
      categoryKey: "tv",
      priority: Priority.LOW,
      status: PlannedPurchaseStatus.IDEA,
      recommendation: RecommendationType.WAIT,
      targetPrice: 18999,
      expectedMinPrice: 15999,
      expectedMaxPrice: 22999,
      currentlySaved: 0,
      desiredDate: addMonths(now, 7),
      suggestedMonthlySaving: 2200,
      bestMonthNote: "Buen Fin concentra rebajas y cashback bancario para pantallas.",
      strategyNote: "No conviene comprarla antes de bajar la carga actual de MSI.",
      preferredStores: ["Liverpool", "Costco", "Amazon"],
      referenceSites: ["promodescuentos.com", "liverpool.com.mx"]
    }
  });

  const salaryDates = [
    addDays(monthStart, 0),
    addDays(monthStart, 14),
    addDays(subMonths(monthStart, 1), 0),
    addDays(subMonths(monthStart, 1), 14),
    addDays(subMonths(monthStart, 2), 0),
    addDays(subMonths(monthStart, 2), 14)
  ];

  for (const salaryDate of salaryDates) {
    await prisma.transaction.create({
      data: {
        userId: user.id,
        postedAt: salaryDate,
        amount: 27500,
        type: TransactionType.INCOME,
        cadence: TransactionCadence.RECURRING,
        planning: TransactionPlanning.PLANNED,
        description: "Depósito de nómina",
        categoryId: payroll.id,
        destinationAccountId: checking.id
      }
    });
  }

  const expenses: Array<{
    date: Date;
    amount: number;
    description: string;
    categoryId: string;
    sourceAccountId: string;
    subcategoryId?: string;
    destinationAccountId?: string;
    savingsGoalId?: string;
    installmentPurchaseId?: string;
    type?: TransactionType;
    cadence?: TransactionCadence;
    planning?: TransactionPlanning;
  }> = [
    { date: addDays(monthStart, 1), amount: 3250, description: "Walmart", categoryId: grocery.id, sourceAccountId: cardAccount.id },
    { date: addDays(monthStart, 3), amount: 560, description: "Coffee Collective", categoryId: dining.id, subcategoryId: diningSub.id, sourceAccountId: cardAccount.id },
    { date: addDays(monthStart, 4), amount: 840, description: "Uber y gasolina", categoryId: categories.find((item) => item.name === "Transporte")!.id, sourceAccountId: checking.id },
    { date: addDays(monthStart, 8), amount: 1380, description: "Superama", categoryId: grocery.id, sourceAccountId: checking.id },
    { date: addDays(monthStart, 10), amount: 920, description: "Restaurante", categoryId: dining.id, sourceAccountId: cardAccount.id },
    { date: addDays(monthStart, 11), amount: 2749.92, description: "MacBook Air MSI", categoryId: categories.find((item) => item.name === "MSI")!.id, sourceAccountId: cardAccount.id, cadence: TransactionCadence.INSTALLMENT, installmentPurchaseId: installment.id },
    { date: addDays(monthStart, 13), amount: 6000, description: "Aportación fondo de emergencia", categoryId: savings.id, sourceAccountId: checking.id, destinationAccountId: savingsAccount.id, type: TransactionType.SAVINGS_CONTRIBUTION, savingsGoalId: emergencyGoal.id, planning: TransactionPlanning.PLANNED },
    { date: addDays(monthStart, 12), amount: 5200, description: "Pago préstamo personal", categoryId: debt.id, sourceAccountId: checking.id, destinationAccountId: loanAccount.id, type: TransactionType.LOAN_PAYMENT, planning: TransactionPlanning.PLANNED },
    { date: addDays(monthStart, 9), amount: 18420, description: "Pago para no generar intereses", categoryId: debt.id, sourceAccountId: checking.id, destinationAccountId: cardAccount.id, type: TransactionType.CREDIT_CARD_PAYMENT, planning: TransactionPlanning.PLANNED }
  ];

  for (const expense of expenses) {
    await prisma.transaction.create({
      data: {
        userId: user.id,
        postedAt: expense.date,
        amount: expense.amount,
        type: expense.type ?? TransactionType.EXPENSE,
        cadence: expense.cadence ?? TransactionCadence.ONE_TIME,
        planning: expense.planning ?? TransactionPlanning.UNPLANNED,
        description: expense.description,
        categoryId: expense.categoryId,
        subcategoryId: "subcategoryId" in expense ? expense.subcategoryId : undefined,
        sourceAccountId: expense.sourceAccountId,
        destinationAccountId: expense.destinationAccountId,
        savingsGoalId: "savingsGoalId" in expense ? expense.savingsGoalId : undefined,
        installmentPurchaseId: "installmentPurchaseId" in expense ? expense.installmentPurchaseId : undefined
      }
    });
  }

  await prisma.financialRule.createMany({
    data: [
      {
        userId: user.id,
        name: "Alerta de comida fuera",
        description: "Detecta incrementos mayores al 20% vs promedio de 3 meses",
        type: "TREND",
        severity: InsightSeverity.WARNING,
        config: { lookbackMonths: 3, thresholdPct: 20, category: "Comida fuera" }
      },
      {
        userId: user.id,
        name: "Carga MSI",
        description: "Marca cuando los MSI consumen más del 15% del ingreso mensual",
        type: "RISK",
        severity: InsightSeverity.CRITICAL,
        config: { thresholdPct: 15 }
      }
    ]
  });

  await prisma.spendingInsight.createMany({
    data: [
      {
        userId: user.id,
        title: "Comida fuera acelerada",
        message: "Este mes llevas 28% más en comida fuera que tu promedio de los últimos 3 meses.",
        severity: InsightSeverity.WARNING,
        plannedPurchaseId: plannedPhone.id
      },
      {
        userId: user.id,
        title: "Carga comprometida alta",
        message: "Tu siguiente quincena ya tiene 61% comprometido entre deuda, MSI y gastos fijos.",
        severity: InsightSeverity.CRITICAL
      }
    ]
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: user.id,
        title: "Pago de tarjeta cercano",
        body: "AMEX Gold vence en 6 días. El monto para no generar intereses es de $18,420.",
        type: "PAYMENT_DUE",
        scheduledFor: addDays(now, 1),
        actionUrl: "/debts"
      },
      {
        userId: user.id,
        title: "Meta en riesgo",
        body: "Tu meta Colchón para iPhone necesita subir a $3,200 por mes para llegar a tiempo.",
        type: "GOAL_RISK",
        scheduledFor: addDays(now, 1),
        actionUrl: "/goals"
      }
    ]
  });

  console.log(`Seed completa para ${user.email}`);
  console.log(`Password demo: Demo12345!`);
  console.log(`Fecha de referencia: ${formatISO(now, { representation: "date" })}`);
  console.log(`Tags creados: ${tags.length}, efectivo disponible: ${cash.currentBalance.toString()}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
