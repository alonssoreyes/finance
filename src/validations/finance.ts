import { z } from "zod";

export type ActionState = {
  error?: string;
};

const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

const optionalNumber = z.preprocess((value) => {
  if (value === "" || value == null) {
    return undefined;
  }
  return Number(value);
}, z.number().optional());

const optionalInteger = z.preprocess((value) => {
  if (value === "" || value == null) {
    return undefined;
  }
  return Number(value);
}, z.number().int().optional());

export const upsertTransactionSchema = z.object({
  id: optionalString,
  postedAt: z.string().min(1, "La fecha es obligatoria."),
  amount: z.coerce.number().positive("El monto debe ser mayor a 0."),
  type: z.enum([
    "INCOME",
    "EXPENSE",
    "TRANSFER",
    "CREDIT_CARD_PAYMENT",
    "LOAN_PAYMENT",
    "SAVINGS_CONTRIBUTION",
    "REFUND",
    "ADJUSTMENT"
  ]),
  cadence: z.enum(["ONE_TIME", "RECURRING", "INSTALLMENT"]).default("ONE_TIME"),
  planning: z.enum(["PLANNED", "UNPLANNED"]).default("UNPLANNED"),
  description: z.string().trim().min(2, "La descripción es obligatoria."),
  merchant: optionalString,
  notes: optionalString,
  categoryId: optionalString,
  subcategoryId: optionalString,
  sourceAccountId: optionalString,
  destinationAccountId: optionalString,
  savingsGoalId: optionalString,
  recurringExpenseId: optionalString,
  installmentPurchaseId: optionalString,
  tagNames: optionalString
});

export const upsertRecurringExpenseSchema = z.object({
  id: optionalString,
  name: z.string().trim().min(2, "El nombre es obligatorio."),
  amount: z.coerce.number().positive("El monto debe ser mayor a 0."),
  frequency: z.enum([
    "WEEKLY",
    "BIWEEKLY",
    "MONTHLY",
    "QUARTERLY",
    "SEMIANNUALLY",
    "YEARLY"
  ]),
  nextDueDate: z.string().min(1, "La próxima fecha es obligatoria."),
  reminderDays: z.coerce.number().int().min(0).max(30),
  isEssential: z.boolean(),
  isActive: z.boolean(),
  merchant: optionalString,
  notes: optionalString,
  categoryId: z.string().min(1, "Selecciona una categoría."),
  subcategoryId: optionalString,
  paymentAccountId: optionalString
});

export const upsertCategorySchema = z.object({
  id: optionalString,
  name: z.string().trim().min(2, "El nombre es obligatorio."),
  kind: z.enum(["INCOME", "EXPENSE", "SAVINGS", "DEBT", "TRANSFER"]),
  icon: optionalString,
  color: optionalString
});

export const upsertSubcategorySchema = z.object({
  id: optionalString,
  categoryId: z.string().min(1, "Selecciona una categoría."),
  name: z.string().trim().min(2, "El nombre es obligatorio.")
});

export const upsertTagSchema = z.object({
  id: optionalString,
  name: z.string().trim().min(2, "El nombre es obligatorio."),
  color: optionalString
});

export const upsertGoalSchema = z.object({
  id: optionalString,
  name: z.string().trim().min(2, "El nombre es obligatorio."),
  targetAmount: z.coerce.number().positive("El monto objetivo debe ser mayor a 0."),
  currentAmount: z.coerce.number().min(0, "El avance no puede ser negativo."),
  targetDate: optionalString,
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  monthlySuggestedContribution: z.coerce.number().min(0),
  linkedAccountId: optionalString,
  color: optionalString,
  icon: optionalString,
  notes: optionalString
});

export const upsertBudgetSchema = z.object({
  id: optionalString,
  name: optionalString,
  scope: z.enum(["GLOBAL", "CATEGORY", "SUBCATEGORY"]),
  month: z.string().min(1, "El mes es obligatorio."),
  limitAmount: z.coerce.number().positive("El límite debe ser mayor a 0."),
  alertPercent: z.coerce.number().int().min(1).max(100),
  carryOver: z.boolean(),
  categoryId: optionalString,
  subcategoryId: optionalString
});

export const upsertPlannedPurchaseSchema = z.object({
  id: optionalString,
  linkedGoalId: optionalString,
  seasonalityId: optionalString,
  title: z.string().trim().min(2, "El nombre de la compra es obligatorio."),
  categoryKey: z.string().trim().min(2, "La categoría base es obligatoria."),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  status: z.enum(["IDEA", "RESEARCHING", "SAVING", "READY", "BOUGHT", "SKIPPED"]),
  recommendation: z.enum(["WAIT", "BUY_NOW", "SAVE_MORE", "CONSIDER_MSI", "AVOID"]),
  targetPrice: z.coerce.number().positive("El precio meta debe ser mayor a 0."),
  expectedMinPrice: optionalNumber,
  expectedMaxPrice: optionalNumber,
  currentlySaved: z.coerce.number().min(0).default(0),
  desiredDate: optionalString,
  suggestedMonthlySaving: optionalNumber,
  bestMonthNote: optionalString,
  strategyNote: optionalString,
  preferredStores: optionalString,
  referenceSites: optionalString
});

export const upsertAccountSchema = z.object({
  id: optionalString,
  name: z.string().trim().min(2, "El nombre es obligatorio."),
  type: z.enum(["CHECKING", "DEBIT", "SAVINGS", "CASH", "INVESTMENT", "OTHER"]),
  institution: optionalString,
  last4: optionalString,
  currentBalance: z.coerce.number(),
  availableBalance: optionalNumber,
  color: optionalString,
  icon: optionalString,
  includeInNetWorth: z.boolean(),
  isLiquid: z.boolean(),
  notes: optionalString
});

export const upsertCreditCardSchema = z.object({
  id: optionalString,
  accountId: optionalString,
  name: z.string().trim().min(2, "El nombre es obligatorio."),
  bank: z.string().trim().min(2, "El banco es obligatorio."),
  last4: z.string().trim().min(4).max(4, "Usa exactamente 4 dígitos."),
  statementClosingDay: z.coerce.number().int().min(1).max(31),
  paymentDueDay: z.coerce.number().int().min(1).max(31),
  creditLimit: z.coerce.number().positive("El límite debe ser mayor a 0."),
  statementBalance: z.coerce.number().min(0),
  payoffBalance: z.coerce.number().min(0),
  minimumDueAmount: optionalNumber,
  annualInterestRate: optionalNumber,
  minimumPaymentRatio: optionalNumber,
  paymentTracking: z.enum(["MINIMUM", "FULL_STATEMENT", "BOTH"]),
  nextStatementDate: optionalString,
  nextDueDate: optionalString,
  color: optionalString,
  icon: optionalString,
  notes: optionalString
});

export const upsertLoanSchema = z.object({
  id: optionalString,
  accountId: optionalString,
  name: z.string().trim().min(2, "El nombre es obligatorio."),
  lender: optionalString,
  originalAmount: z.coerce.number().positive("El monto original debe ser mayor a 0."),
  currentBalance: z.coerce.number().min(0, "El saldo no puede ser negativo."),
  monthlyPayment: z.coerce.number().positive("El pago mensual debe ser mayor a 0."),
  interestRate: optionalNumber,
  paymentDay: z.coerce.number().int().min(1).max(31),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  strategyWeight: z.coerce.number().int().min(0).max(100),
  openedAt: optionalString,
  targetPayoffDate: optionalString,
  notes: optionalString
});

export const upsertInstallmentPurchaseSchema = z.object({
  id: optionalString,
  creditCardId: z.string().min(1, "Selecciona la tarjeta."),
  categoryId: optionalString,
  title: z.string().trim().min(2, "El nombre de la compra es obligatorio."),
  merchant: optionalString,
  totalAmount: z.coerce.number().positive("El monto total debe ser mayor a 0."),
  purchaseDate: z.string().min(1, "La fecha de compra es obligatoria."),
  totalMonths: z.coerce.number().int().min(1).max(36),
  firstChargeMonth: z.string().min(1, "El primer mes de cargo es obligatorio."),
  currentInstallment: z.coerce.number().int().min(1).max(36),
  status: z.enum(["ACTIVE", "COMPLETED", "PAID_OFF", "EARLY_SETTLED", "CANCELLED"]),
  isManuallySettled: z.boolean(),
  settledAt: optionalString,
  notes: optionalString
});

export const createCardPaymentSchema = z.object({
  cardId: z.string().min(1, "Tarjeta inválida."),
  sourceAccountId: z.string().min(1, "Selecciona la cuenta desde la que pagaste."),
  postedAt: z.string().min(1, "La fecha de pago es obligatoria."),
  amount: z.coerce.number().positive("El monto debe ser mayor a 0."),
  description: optionalString,
  notes: optionalString
});

export const upsertSettingsSchema = z.object({
  currency: z.string().trim().min(3, "La moneda es obligatoria.").max(8),
  locale: z.string().trim().min(2, "El locale es obligatorio."),
  dateFormat: z.string().trim().min(2, "El formato de fecha es obligatorio."),
  incomeFrequency: z.enum(["WEEKLY", "BIWEEKLY", "MONTHLY", "CUSTOM"]),
  paydayDays: z.string().trim().min(1, "Define al menos un día de ingreso."),
  debtStrategy: z.enum(["SNOWBALL", "AVALANCHE", "CUSTOM"]),
  defaultGoalPriority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  cardStatementBufferDays: z.coerce.number().int().min(0).max(15),
  enableLocalInsights: z.boolean(),
  weekStartsOn: z.coerce.number().int().min(0).max(6),
  projectedFlowMonths: z.coerce.number().int().min(3).max(24),
  categoryBudgetWarningPct: z.coerce.number().int().min(50).max(100),
  themeMode: z.string().trim().min(2).max(20)
});

export const upsertFinancialRuleSchema = z.object({
  id: optionalString,
  name: z.string().trim().min(2, "El nombre de la regla es obligatorio."),
  description: optionalString,
  type: z.enum(["THRESHOLD", "TREND", "ACCUMULATION", "CONCENTRATION", "RISK", "CUSTOM"]),
  severity: z.enum(["INFO", "WARNING", "CRITICAL", "POSITIVE"]),
  thresholdPercent: optionalNumber,
  amountLimit: optionalNumber,
  transactionCount: optionalInteger,
  daysWindow: optionalInteger,
  categoryId: optionalString,
  isEnabled: z.boolean()
});
