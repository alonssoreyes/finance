import { z } from "zod";

export const createTransactionSchema = z.object({
  postedAt: z.string(),
  amount: z.coerce.number().positive(),
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
  description: z.string().min(2),
  merchant: z.string().optional(),
  notes: z.string().optional(),
  categoryId: z.string().optional(),
  subcategoryId: z.string().optional(),
  sourceAccountId: z.string().optional(),
  destinationAccountId: z.string().optional(),
  savingsGoalId: z.string().optional(),
  recurringExpenseId: z.string().optional(),
  installmentPurchaseId: z.string().optional()
});
