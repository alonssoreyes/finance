"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma, TransactionType } from "@prisma/client";
import { startOfMonth } from "date-fns";
import { requireUser } from "@/lib/auth";
import { buildInstallmentSchedule } from "@/lib/card-cycle";
import { prisma } from "@/lib/prisma";
import {
  upsertAccountSchema,
  upsertBudgetSchema,
  upsertCategorySchema,
  createCardPaymentSchema,
  upsertCreditCardSchema,
  upsertFinancialRuleSchema,
  upsertGoalSchema,
  upsertInstallmentPurchaseSchema,
  upsertLoanSchema,
  upsertPlannedPurchaseSchema,
  upsertRecurringExpenseSchema,
  upsertSettingsSchema,
  upsertSubcategorySchema,
  upsertTagSchema,
  upsertTransactionSchema,
  type ActionState
} from "@/validations/finance";

function parseBoolean(value: FormDataEntryValue | null) {
  return value === "on" || value === "true";
}

function cleanString(value: string | undefined) {
  return value && value.trim().length > 0 ? value.trim() : undefined;
}

function extractTagNames(rawValue: string | undefined) {
  return Array.from(
    new Set(
      (rawValue ?? "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    )
  );
}

function splitCsv(rawValue: string | undefined) {
  return (rawValue ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitIntegerCsv(rawValue: string | undefined) {
  return Array.from(
    new Set(
      (rawValue ?? "")
        .split(",")
        .map((item) => Number(item.trim()))
        .filter((value) => Number.isInteger(value) && value >= 1 && value <= 31)
    )
  ).sort((left, right) => left - right);
}

type EffectInput = {
  type: TransactionType;
  amount: number;
  sourceAccountId?: string | null;
  destinationAccountId?: string | null;
  savingsGoalId?: string | null;
};

async function adjustAccountBalance(
  tx: Prisma.TransactionClient,
  accountId: string,
  amountDelta: number
) {
  const account = await tx.account.findUnique({
    where: { id: accountId },
    select: { currentBalance: true, availableBalance: true }
  });

  if (!account) {
    return;
  }

  const updateData: Prisma.AccountUpdateInput = {
    currentBalance: {
      increment: amountDelta
    }
  };

  if (account.availableBalance !== null) {
    updateData.availableBalance = {
      increment: amountDelta
    };
  }

  await tx.account.update({
    where: { id: accountId },
    data: updateData
  });
}

async function adjustSavingsGoal(
  tx: Prisma.TransactionClient,
  goalId: string,
  amountDelta: number
) {
  await tx.savingsGoal.update({
    where: { id: goalId },
    data: {
      currentAmount: {
        increment: amountDelta
      }
    }
  });
}

async function adjustCreditCardPaymentBalances(
  tx: Prisma.TransactionClient,
  destinationAccountId: string,
  amountDelta: number
) {
  const card = await tx.creditCard.findFirst({
    where: { accountId: destinationAccountId },
    select: {
      id: true,
      creditLimit: true,
      payoffBalance: true,
      statementBalance: true,
      minimumDueAmount: true
    }
  });

  if (!card) {
    return;
  }

  const payoffBalance = Math.max(Number(card.payoffBalance.toString()) - amountDelta, 0);
  const statementBalance = Math.max(Number(card.statementBalance.toString()) - amountDelta, 0);
  const minimumDueAmount = Math.max(Number(card.minimumDueAmount?.toString() ?? "0") - amountDelta, 0);

  await tx.creditCard.update({
    where: { id: card.id },
    data: {
      payoffBalance,
      statementBalance,
      minimumDueAmount
    }
  });

  await tx.account.update({
    where: { id: destinationAccountId },
    data: {
      currentBalance: -payoffBalance,
      availableBalance: Number(card.creditLimit.toString()) - payoffBalance,
      creditLimit: Number(card.creditLimit.toString())
    }
  });
}

async function applyTransactionEffects(
  tx: Prisma.TransactionClient,
  input: EffectInput,
  multiplier: 1 | -1
) {
  const signedAmount = input.amount * multiplier;

  switch (input.type) {
    case "INCOME":
      if (input.destinationAccountId) {
        await adjustAccountBalance(tx, input.destinationAccountId, signedAmount);
      }
      break;
    case "EXPENSE":
      if (input.sourceAccountId) {
        await adjustAccountBalance(tx, input.sourceAccountId, -signedAmount);
      }
      break;
    case "TRANSFER":
    case "CREDIT_CARD_PAYMENT":
    case "LOAN_PAYMENT":
    case "SAVINGS_CONTRIBUTION":
      if (input.sourceAccountId) {
        await adjustAccountBalance(tx, input.sourceAccountId, -signedAmount);
      }
      if (input.destinationAccountId) {
        await adjustAccountBalance(tx, input.destinationAccountId, signedAmount);
      }
      if (input.type === "CREDIT_CARD_PAYMENT" && input.destinationAccountId) {
        await adjustCreditCardPaymentBalances(tx, input.destinationAccountId, signedAmount);
      }
      if (input.type === "SAVINGS_CONTRIBUTION" && input.savingsGoalId) {
        await adjustSavingsGoal(tx, input.savingsGoalId, signedAmount);
      }
      break;
    case "REFUND":
      if (input.destinationAccountId) {
        await adjustAccountBalance(tx, input.destinationAccountId, signedAmount);
      } else if (input.sourceAccountId) {
        await adjustAccountBalance(tx, input.sourceAccountId, signedAmount);
      }
      break;
    case "ADJUSTMENT":
      if (input.sourceAccountId) {
        await adjustAccountBalance(tx, input.sourceAccountId, signedAmount);
      } else if (input.destinationAccountId) {
        await adjustAccountBalance(tx, input.destinationAccountId, signedAmount);
      }
      break;
  }
}

async function syncTransactionTags(
  tx: Prisma.TransactionClient,
  userId: string,
  transactionId: string,
  tagNames: string[]
) {
  await tx.transactionTag.deleteMany({
    where: { transactionId }
  });

  if (!tagNames.length) {
    return;
  }

  const tags = [];
  for (const tagName of tagNames) {
    const tag = await tx.tag.upsert({
      where: {
        userId_name: {
          userId,
          name: tagName
        }
      },
      update: {},
      create: {
        userId,
        name: tagName
      }
    });
    tags.push(tag);
  }

  await tx.transactionTag.createMany({
    data: tags.map((tag) => ({
      transactionId,
      tagId: tag.id
    }))
  });
}

export async function upsertTransactionAction(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();

  const parsed = upsertTransactionSchema.safeParse({
    id: formData.get("id"),
    postedAt: formData.get("postedAt"),
    amount: formData.get("amount"),
    type: formData.get("type"),
    cadence: formData.get("cadence"),
    planning: formData.get("planning"),
    description: formData.get("description"),
    merchant: formData.get("merchant"),
    notes: formData.get("notes"),
    categoryId: formData.get("categoryId"),
    subcategoryId: formData.get("subcategoryId"),
    sourceAccountId: formData.get("sourceAccountId"),
    destinationAccountId: formData.get("destinationAccountId"),
    savingsGoalId: formData.get("savingsGoalId"),
    recurringExpenseId: formData.get("recurringExpenseId"),
    installmentPurchaseId: formData.get("installmentPurchaseId"),
    tagNames: formData.get("tagNames")
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "No se pudo guardar el movimiento."
    };
  }

  const payload = parsed.data;
  const tagNames = extractTagNames(payload.tagNames);

  try {
    await prisma.$transaction(async (tx) => {
      if (payload.id) {
        const existing = await tx.transaction.findFirst({
          where: { id: payload.id, userId: user.id }
        });

        if (!existing) {
          throw new Error("Movimiento no encontrado.");
        }

        await applyTransactionEffects(
          tx,
          {
            type: existing.type,
            amount: Number(existing.amount.toString()),
            sourceAccountId: existing.sourceAccountId,
            destinationAccountId: existing.destinationAccountId,
            savingsGoalId: existing.savingsGoalId
          },
          -1
        );

        const updated = await tx.transaction.update({
          where: { id: payload.id },
          data: {
            postedAt: new Date(payload.postedAt),
            amount: payload.amount,
            type: payload.type,
            cadence: payload.cadence,
            planning: payload.planning,
            description: payload.description,
            merchant: cleanString(payload.merchant),
            notes: cleanString(payload.notes),
            categoryId: payload.categoryId,
            subcategoryId: payload.subcategoryId,
            sourceAccountId: payload.sourceAccountId,
            destinationAccountId: payload.destinationAccountId,
            savingsGoalId: payload.savingsGoalId
          }
        });

        await applyTransactionEffects(
          tx,
          {
            type: updated.type,
            amount: Number(updated.amount.toString()),
            sourceAccountId: updated.sourceAccountId,
            destinationAccountId: updated.destinationAccountId,
            savingsGoalId: updated.savingsGoalId
          },
          1
        );

        await syncTransactionTags(tx, user.id, updated.id, tagNames);
      } else {
        const created = await tx.transaction.create({
          data: {
            userId: user.id,
            postedAt: new Date(payload.postedAt),
            amount: payload.amount,
            type: payload.type,
            cadence: payload.cadence,
            planning: payload.planning,
            description: payload.description,
            merchant: cleanString(payload.merchant),
            notes: cleanString(payload.notes),
            categoryId: payload.categoryId,
            subcategoryId: payload.subcategoryId,
            sourceAccountId: payload.sourceAccountId,
            destinationAccountId: payload.destinationAccountId,
            savingsGoalId: payload.savingsGoalId
          }
        });

        await applyTransactionEffects(
          tx,
          {
            type: created.type,
            amount: Number(created.amount.toString()),
            sourceAccountId: created.sourceAccountId,
            destinationAccountId: created.destinationAccountId,
            savingsGoalId: created.savingsGoalId
          },
          1
        );

        await syncTransactionTags(tx, user.id, created.id, tagNames);
      }
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "No se pudo guardar el movimiento."
    };
  }

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/projection");
  revalidatePath("/accounts");
  revalidatePath("/goals");
  revalidatePath("/debts");
  redirect("/transactions");
}

export async function deleteTransactionAction(formData: FormData) {
  const user = await requireUser();
  const id = cleanString(String(formData.get("id") ?? ""));

  if (!id) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    const transaction = await tx.transaction.findFirst({
      where: { id, userId: user.id }
    });

    if (!transaction) {
      return;
    }

    await applyTransactionEffects(
      tx,
      {
        type: transaction.type,
        amount: Number(transaction.amount.toString()),
        sourceAccountId: transaction.sourceAccountId,
        destinationAccountId: transaction.destinationAccountId,
        savingsGoalId: transaction.savingsGoalId
      },
      -1
    );

    await tx.transaction.delete({
      where: { id }
    });
  });

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/projection");
  revalidatePath("/accounts");
  revalidatePath("/goals");
  revalidatePath("/debts");
  redirect("/transactions");
}

export async function upsertRecurringExpenseAction(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = upsertRecurringExpenseSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    amount: formData.get("amount"),
    frequency: formData.get("frequency"),
    nextDueDate: formData.get("nextDueDate"),
    reminderDays: formData.get("reminderDays"),
    isEssential: parseBoolean(formData.get("isEssential")),
    isActive: parseBoolean(formData.get("isActive")),
    merchant: formData.get("merchant"),
    notes: formData.get("notes"),
    categoryId: formData.get("categoryId"),
    subcategoryId: formData.get("subcategoryId"),
    paymentAccountId: formData.get("paymentAccountId")
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "No se pudo guardar el gasto fijo."
    };
  }

  const payload = parsed.data;

  if (payload.id) {
    await prisma.recurringExpense.updateMany({
      where: { id: payload.id, userId: user.id },
      data: {
        name: payload.name,
        amount: payload.amount,
        frequency: payload.frequency,
        nextDueDate: new Date(payload.nextDueDate),
        reminderDays: payload.reminderDays,
        isEssential: payload.isEssential,
        isActive: payload.isActive,
        merchant: cleanString(payload.merchant),
        notes: cleanString(payload.notes),
        categoryId: payload.categoryId,
        subcategoryId: payload.subcategoryId,
        paymentAccountId: payload.paymentAccountId
      }
    });
  } else {
    await prisma.recurringExpense.create({
      data: {
        userId: user.id,
        name: payload.name,
        amount: payload.amount,
        frequency: payload.frequency,
        nextDueDate: new Date(payload.nextDueDate),
        reminderDays: payload.reminderDays,
        isEssential: payload.isEssential,
        isActive: payload.isActive,
        merchant: cleanString(payload.merchant),
        notes: cleanString(payload.notes),
        categoryId: payload.categoryId,
        subcategoryId: payload.subcategoryId,
        paymentAccountId: payload.paymentAccountId
      }
    });
  }

  revalidatePath("/recurring-expenses");
  revalidatePath("/dashboard");
  revalidatePath("/projection");
  redirect("/recurring-expenses");
}

export async function deleteRecurringExpenseAction(formData: FormData) {
  const user = await requireUser();
  const id = cleanString(String(formData.get("id") ?? ""));

  if (!id) {
    return;
  }

  await prisma.recurringExpense.deleteMany({
    where: { id, userId: user.id }
  });

  revalidatePath("/recurring-expenses");
  revalidatePath("/dashboard");
  revalidatePath("/projection");
  redirect("/recurring-expenses");
}

export async function upsertCategoryAction(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = upsertCategorySchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    kind: formData.get("kind"),
    color: formData.get("color"),
    icon: formData.get("icon")
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "No se pudo guardar la categoría."
    };
  }

  const payload = parsed.data;

  try {
    if (payload.id) {
      await prisma.category.updateMany({
        where: { id: payload.id, userId: user.id },
        data: {
          name: payload.name,
          kind: payload.kind,
          color: cleanString(payload.color),
          icon: cleanString(payload.icon)
        }
      });
    } else {
      await prisma.category.create({
        data: {
          userId: user.id,
          name: payload.name,
          kind: payload.kind,
          color: cleanString(payload.color),
          icon: cleanString(payload.icon)
        }
      });
    }
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? "Ya existe una categoría con ese nombre y tipo."
          : "No se pudo guardar la categoría."
    };
  }

  revalidatePath("/categories");
  revalidatePath("/transactions");
  revalidatePath("/recurring-expenses");
  redirect("/categories");
}

export async function deleteCategoryAction(formData: FormData) {
  const user = await requireUser();
  const id = cleanString(String(formData.get("id") ?? ""));
  if (!id) {
    return;
  }

  await prisma.category.deleteMany({
    where: { id, userId: user.id }
  });

  revalidatePath("/categories");
  revalidatePath("/transactions");
  revalidatePath("/recurring-expenses");
  redirect("/categories");
}

export async function upsertSubcategoryAction(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = upsertSubcategorySchema.safeParse({
    id: formData.get("id"),
    categoryId: formData.get("categoryId"),
    name: formData.get("name")
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "No se pudo guardar la subcategoría."
    };
  }

  const payload = parsed.data;

  try {
    if (payload.id) {
      await prisma.subcategory.updateMany({
        where: { id: payload.id, userId: user.id },
        data: {
          name: payload.name,
          categoryId: payload.categoryId
        }
      });
    } else {
      await prisma.subcategory.create({
        data: {
          userId: user.id,
          name: payload.name,
          categoryId: payload.categoryId
        }
      });
    }
  } catch {
    return {
      error: "Ya existe una subcategoría con ese nombre dentro de la categoría."
    };
  }

  revalidatePath("/categories");
  revalidatePath("/transactions");
  revalidatePath("/recurring-expenses");
  redirect("/categories");
}

export async function deleteSubcategoryAction(formData: FormData) {
  const user = await requireUser();
  const id = cleanString(String(formData.get("id") ?? ""));
  if (!id) {
    return;
  }

  await prisma.subcategory.deleteMany({
    where: { id, userId: user.id }
  });

  revalidatePath("/categories");
  revalidatePath("/transactions");
  revalidatePath("/recurring-expenses");
  redirect("/categories");
}

export async function upsertTagAction(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = upsertTagSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    color: formData.get("color")
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "No se pudo guardar la etiqueta."
    };
  }

  const payload = parsed.data;

  try {
    if (payload.id) {
      await prisma.tag.updateMany({
        where: { id: payload.id, userId: user.id },
        data: {
          name: payload.name,
          color: cleanString(payload.color)
        }
      });
    } else {
      await prisma.tag.create({
        data: {
          userId: user.id,
          name: payload.name,
          color: cleanString(payload.color)
        }
      });
    }
  } catch {
    return {
      error: "Ya existe una etiqueta con ese nombre."
    };
  }

  revalidatePath("/categories");
  revalidatePath("/transactions");
  redirect("/categories");
}

export async function deleteTagAction(formData: FormData) {
  const user = await requireUser();
  const id = cleanString(String(formData.get("id") ?? ""));
  if (!id) {
    return;
  }

  await prisma.tag.deleteMany({
    where: { id, userId: user.id }
  });

  revalidatePath("/categories");
  revalidatePath("/transactions");
  redirect("/categories");
}

export async function upsertGoalAction(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = upsertGoalSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    targetAmount: formData.get("targetAmount"),
    currentAmount: formData.get("currentAmount"),
    targetDate: formData.get("targetDate"),
    priority: formData.get("priority"),
    monthlySuggestedContribution: formData.get("monthlySuggestedContribution"),
    linkedAccountId: formData.get("linkedAccountId"),
    color: formData.get("color"),
    icon: formData.get("icon"),
    notes: formData.get("notes")
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "No se pudo guardar la meta."
    };
  }

  const payload = parsed.data;

  if (payload.id) {
    await prisma.savingsGoal.updateMany({
      where: { id: payload.id, userId: user.id },
      data: {
        name: payload.name,
        targetAmount: payload.targetAmount,
        currentAmount: payload.currentAmount,
        targetDate: payload.targetDate ? new Date(payload.targetDate) : null,
        priority: payload.priority,
        monthlySuggestedContribution: payload.monthlySuggestedContribution,
        linkedAccountId: payload.linkedAccountId,
        color: cleanString(payload.color),
        icon: cleanString(payload.icon),
        notes: cleanString(payload.notes)
      }
    });
  } else {
    await prisma.savingsGoal.create({
      data: {
        userId: user.id,
        name: payload.name,
        targetAmount: payload.targetAmount,
        currentAmount: payload.currentAmount,
        targetDate: payload.targetDate ? new Date(payload.targetDate) : null,
        priority: payload.priority,
        monthlySuggestedContribution: payload.monthlySuggestedContribution,
        linkedAccountId: payload.linkedAccountId,
        color: cleanString(payload.color),
        icon: cleanString(payload.icon),
        notes: cleanString(payload.notes)
      }
    });
  }

  revalidatePath("/goals");
  revalidatePath("/dashboard");
  revalidatePath("/projection");
  redirect("/goals");
}

export async function deleteGoalAction(formData: FormData) {
  const user = await requireUser();
  const id = cleanString(String(formData.get("id") ?? ""));
  if (!id) {
    return;
  }

  await prisma.savingsGoal.deleteMany({
    where: { id, userId: user.id }
  });

  revalidatePath("/goals");
  revalidatePath("/dashboard");
  revalidatePath("/projection");
  redirect("/goals");
}

export async function upsertBudgetAction(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = upsertBudgetSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    scope: formData.get("scope"),
    month: formData.get("month"),
    limitAmount: formData.get("limitAmount"),
    alertPercent: formData.get("alertPercent"),
    carryOver: parseBoolean(formData.get("carryOver")),
    categoryId: formData.get("categoryId"),
    subcategoryId: formData.get("subcategoryId")
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "No se pudo guardar el presupuesto."
    };
  }

  const payload = parsed.data;
  const month = startOfMonth(new Date(`${payload.month}-01`));

  if (payload.id) {
    await prisma.budget.updateMany({
      where: { id: payload.id, userId: user.id },
      data: {
        name: cleanString(payload.name),
        scope: payload.scope,
        month,
        limitAmount: payload.limitAmount,
        alertPercent: payload.alertPercent,
        carryOver: payload.carryOver,
        categoryId: payload.scope === "CATEGORY" ? payload.categoryId : null,
        subcategoryId: payload.scope === "SUBCATEGORY" ? payload.subcategoryId : null
      }
    });
  } else {
    await prisma.budget.create({
      data: {
        userId: user.id,
        name: cleanString(payload.name),
        scope: payload.scope,
        month,
        limitAmount: payload.limitAmount,
        alertPercent: payload.alertPercent,
        carryOver: payload.carryOver,
        categoryId: payload.scope === "CATEGORY" ? payload.categoryId : null,
        subcategoryId: payload.scope === "SUBCATEGORY" ? payload.subcategoryId : null
      }
    });
  }

  revalidatePath("/budgets");
  revalidatePath("/dashboard");
  redirect("/budgets");
}

export async function deleteBudgetAction(formData: FormData) {
  const user = await requireUser();
  const id = cleanString(String(formData.get("id") ?? ""));
  if (!id) {
    return;
  }

  await prisma.budget.deleteMany({
    where: { id, userId: user.id }
  });

  revalidatePath("/budgets");
  revalidatePath("/dashboard");
  redirect("/budgets");
}

export async function upsertPlannedPurchaseAction(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = upsertPlannedPurchaseSchema.safeParse({
    id: formData.get("id"),
    linkedGoalId: formData.get("linkedGoalId"),
    seasonalityId: formData.get("seasonalityId"),
    title: formData.get("title"),
    categoryKey: formData.get("categoryKey"),
    priority: formData.get("priority"),
    status: formData.get("status"),
    recommendation: formData.get("recommendation"),
    targetPrice: formData.get("targetPrice"),
    expectedMinPrice: formData.get("expectedMinPrice"),
    expectedMaxPrice: formData.get("expectedMaxPrice"),
    currentlySaved: formData.get("currentlySaved"),
    desiredDate: formData.get("desiredDate"),
    suggestedMonthlySaving: formData.get("suggestedMonthlySaving"),
    bestMonthNote: formData.get("bestMonthNote"),
    strategyNote: formData.get("strategyNote"),
    preferredStores: formData.get("preferredStores"),
    referenceSites: formData.get("referenceSites")
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "No se pudo guardar la compra planeada."
    };
  }

  const payload = parsed.data;

  const data = {
    linkedGoalId: payload.linkedGoalId,
    seasonalityId: payload.seasonalityId,
    title: payload.title,
    categoryKey: payload.categoryKey,
    priority: payload.priority,
    status: payload.status,
    recommendation: payload.recommendation,
    targetPrice: payload.targetPrice,
    expectedMinPrice: payload.expectedMinPrice ?? null,
    expectedMaxPrice: payload.expectedMaxPrice ?? null,
    currentlySaved: payload.currentlySaved,
    desiredDate: payload.desiredDate ? new Date(payload.desiredDate) : null,
    suggestedMonthlySaving: payload.suggestedMonthlySaving ?? null,
    bestMonthNote: cleanString(payload.bestMonthNote),
    strategyNote: cleanString(payload.strategyNote),
    preferredStores: splitCsv(payload.preferredStores),
    referenceSites: splitCsv(payload.referenceSites)
  };

  if (payload.id) {
    await prisma.plannedPurchase.updateMany({
      where: { id: payload.id, userId: user.id },
      data
    });
  } else {
    await prisma.plannedPurchase.create({
      data: {
        userId: user.id,
        ...data
      }
    });
  }

  revalidatePath("/planned-purchases");
  revalidatePath("/dashboard");
  redirect("/planned-purchases");
}

export async function deletePlannedPurchaseAction(formData: FormData) {
  const user = await requireUser();
  const id = cleanString(String(formData.get("id") ?? ""));
  if (!id) {
    return;
  }

  await prisma.plannedPurchase.deleteMany({
    where: { id, userId: user.id }
  });

  revalidatePath("/planned-purchases");
  revalidatePath("/dashboard");
  redirect("/planned-purchases");
}

export async function upsertAccountAction(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = upsertAccountSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    type: formData.get("type"),
    institution: formData.get("institution"),
    last4: formData.get("last4"),
    currentBalance: formData.get("currentBalance"),
    availableBalance: formData.get("availableBalance"),
    color: formData.get("color"),
    icon: formData.get("icon"),
    includeInNetWorth: parseBoolean(formData.get("includeInNetWorth")),
    isLiquid: parseBoolean(formData.get("isLiquid")),
    notes: formData.get("notes")
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "No se pudo guardar la cuenta."
    };
  }

  const payload = parsed.data;

  if (payload.id) {
    await prisma.account.updateMany({
      where: { id: payload.id, userId: user.id, creditCardProfile: null, loanProfile: null },
      data: {
        name: payload.name,
        type: payload.type,
        institution: cleanString(payload.institution),
        last4: cleanString(payload.last4),
        currentBalance: payload.currentBalance,
        availableBalance: payload.availableBalance ?? payload.currentBalance,
        color: cleanString(payload.color),
        icon: cleanString(payload.icon),
        includeInNetWorth: payload.includeInNetWorth,
        isLiquid: payload.isLiquid,
        notes: cleanString(payload.notes)
      }
    });
  } else {
    await prisma.account.create({
      data: {
        userId: user.id,
        name: payload.name,
        type: payload.type,
        institution: cleanString(payload.institution),
        last4: cleanString(payload.last4),
        currentBalance: payload.currentBalance,
        availableBalance: payload.availableBalance ?? payload.currentBalance,
        color: cleanString(payload.color),
        icon: cleanString(payload.icon),
        includeInNetWorth: payload.includeInNetWorth,
        isLiquid: payload.isLiquid,
        notes: cleanString(payload.notes)
      }
    });
  }

  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  redirect("/accounts");
}

export async function deleteAccountAction(formData: FormData) {
  const user = await requireUser();
  const id = cleanString(String(formData.get("id") ?? ""));
  if (!id) {
    return;
  }

  await prisma.account.deleteMany({
    where: {
      id,
      userId: user.id,
      creditCardProfile: null,
      loanProfile: null
    }
  });

  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  redirect("/accounts");
}

export async function upsertCreditCardAction(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = upsertCreditCardSchema.safeParse({
    id: formData.get("id"),
    accountId: formData.get("accountId"),
    name: formData.get("name"),
    bank: formData.get("bank"),
    last4: formData.get("last4"),
    statementClosingDay: formData.get("statementClosingDay"),
    paymentDueDay: formData.get("paymentDueDay"),
    creditLimit: formData.get("creditLimit"),
    statementBalance: formData.get("statementBalance"),
    payoffBalance: formData.get("payoffBalance"),
    minimumDueAmount: formData.get("minimumDueAmount"),
    annualInterestRate: formData.get("annualInterestRate"),
    minimumPaymentRatio: formData.get("minimumPaymentRatio"),
    paymentTracking: formData.get("paymentTracking"),
    nextStatementDate: formData.get("nextStatementDate"),
    nextDueDate: formData.get("nextDueDate"),
    color: formData.get("color"),
    icon: formData.get("icon"),
    notes: formData.get("notes")
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "No se pudo guardar la tarjeta."
    };
  }

  const payload = parsed.data;

  await prisma.$transaction(async (tx) => {
    if (payload.id && payload.accountId) {
      await tx.account.updateMany({
        where: { id: payload.accountId, userId: user.id },
        data: {
          name: payload.name,
          type: "CREDIT_CARD",
          institution: payload.bank,
          last4: payload.last4,
          currentBalance: -payload.payoffBalance,
          availableBalance: payload.creditLimit - payload.payoffBalance,
          creditLimit: payload.creditLimit,
          color: cleanString(payload.color),
          icon: cleanString(payload.icon),
          isLiquid: false,
          notes: cleanString(payload.notes)
        }
      });

      await tx.creditCard.updateMany({
        where: { id: payload.id, userId: user.id },
        data: {
          name: payload.name,
          bank: payload.bank,
          last4: payload.last4,
          statementClosingDay: payload.statementClosingDay,
          paymentDueDay: payload.paymentDueDay,
          creditLimit: payload.creditLimit,
          statementBalance: payload.statementBalance,
          payoffBalance: payload.payoffBalance,
          minimumDueAmount: payload.minimumDueAmount ?? null,
          annualInterestRate: payload.annualInterestRate ?? null,
          minimumPaymentRatio: payload.minimumPaymentRatio ?? null,
          paymentTracking: payload.paymentTracking,
          nextStatementDate: payload.nextStatementDate ? new Date(payload.nextStatementDate) : null,
          nextDueDate: payload.nextDueDate ? new Date(payload.nextDueDate) : null,
          color: cleanString(payload.color),
          icon: cleanString(payload.icon),
          notes: cleanString(payload.notes)
        }
      });
    } else {
      const account = await tx.account.create({
        data: {
          userId: user.id,
          name: payload.name,
          type: "CREDIT_CARD",
          institution: payload.bank,
          last4: payload.last4,
          currentBalance: -payload.payoffBalance,
          availableBalance: payload.creditLimit - payload.payoffBalance,
          creditLimit: payload.creditLimit,
          color: cleanString(payload.color),
          icon: cleanString(payload.icon),
          includeInNetWorth: false,
          isLiquid: false,
          notes: cleanString(payload.notes)
        }
      });

      await tx.creditCard.create({
        data: {
          userId: user.id,
          accountId: account.id,
          name: payload.name,
          bank: payload.bank,
          last4: payload.last4,
          statementClosingDay: payload.statementClosingDay,
          paymentDueDay: payload.paymentDueDay,
          creditLimit: payload.creditLimit,
          statementBalance: payload.statementBalance,
          payoffBalance: payload.payoffBalance,
          minimumDueAmount: payload.minimumDueAmount ?? null,
          annualInterestRate: payload.annualInterestRate ?? null,
          minimumPaymentRatio: payload.minimumPaymentRatio ?? null,
          paymentTracking: payload.paymentTracking,
          nextStatementDate: payload.nextStatementDate ? new Date(payload.nextStatementDate) : null,
          nextDueDate: payload.nextDueDate ? new Date(payload.nextDueDate) : null,
          color: cleanString(payload.color),
          icon: cleanString(payload.icon),
          notes: cleanString(payload.notes)
        }
      });
    }
  });

  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  revalidatePath("/debts");
  redirect("/accounts");
}

export async function deleteCreditCardAction(formData: FormData) {
  const user = await requireUser();
  const id = cleanString(String(formData.get("id") ?? ""));
  const accountId = cleanString(String(formData.get("accountId") ?? ""));
  if (!id || !accountId) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.creditCard.deleteMany({
      where: { id, userId: user.id }
    });

    await tx.account.deleteMany({
      where: { id: accountId, userId: user.id }
    });
  });

  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  revalidatePath("/debts");
  redirect("/accounts");
}

export async function upsertLoanAction(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = upsertLoanSchema.safeParse({
    id: formData.get("id"),
    accountId: formData.get("accountId"),
    name: formData.get("name"),
    lender: formData.get("lender"),
    originalAmount: formData.get("originalAmount"),
    currentBalance: formData.get("currentBalance"),
    monthlyPayment: formData.get("monthlyPayment"),
    interestRate: formData.get("interestRate"),
    paymentDay: formData.get("paymentDay"),
    priority: formData.get("priority"),
    strategyWeight: formData.get("strategyWeight"),
    openedAt: formData.get("openedAt"),
    targetPayoffDate: formData.get("targetPayoffDate"),
    notes: formData.get("notes")
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "No se pudo guardar el préstamo."
    };
  }

  const payload = parsed.data;

  await prisma.$transaction(async (tx) => {
    if (payload.id && payload.accountId) {
      await tx.account.updateMany({
        where: { id: payload.accountId, userId: user.id },
        data: {
          name: payload.name,
          type: "LOAN",
          institution: cleanString(payload.lender),
          currentBalance: -payload.currentBalance,
          availableBalance: -payload.currentBalance,
          includeInNetWorth: false,
          isLiquid: false,
          notes: cleanString(payload.notes)
        }
      });

      await tx.loan.updateMany({
        where: { id: payload.id, userId: user.id },
        data: {
          name: payload.name,
          lender: cleanString(payload.lender),
          originalAmount: payload.originalAmount,
          currentBalance: payload.currentBalance,
          monthlyPayment: payload.monthlyPayment,
          interestRate: payload.interestRate ?? null,
          paymentDay: payload.paymentDay,
          priority: payload.priority,
          strategyWeight: payload.strategyWeight,
          openedAt: payload.openedAt ? new Date(payload.openedAt) : undefined,
          targetPayoffDate: payload.targetPayoffDate ? new Date(payload.targetPayoffDate) : null,
          notes: cleanString(payload.notes)
        }
      });
    } else {
      const account = await tx.account.create({
        data: {
          userId: user.id,
          name: payload.name,
          type: "LOAN",
          institution: cleanString(payload.lender),
          currentBalance: -payload.currentBalance,
          availableBalance: -payload.currentBalance,
          includeInNetWorth: false,
          isLiquid: false,
          notes: cleanString(payload.notes)
        }
      });

      await tx.loan.create({
        data: {
          userId: user.id,
          accountId: account.id,
          name: payload.name,
          lender: cleanString(payload.lender),
          originalAmount: payload.originalAmount,
          currentBalance: payload.currentBalance,
          monthlyPayment: payload.monthlyPayment,
          interestRate: payload.interestRate ?? null,
          paymentDay: payload.paymentDay,
          priority: payload.priority,
          strategyWeight: payload.strategyWeight,
          openedAt: payload.openedAt ? new Date(payload.openedAt) : undefined,
          targetPayoffDate: payload.targetPayoffDate ? new Date(payload.targetPayoffDate) : null,
          notes: cleanString(payload.notes)
        }
      });
    }
  });

  revalidatePath("/debts");
  revalidatePath("/dashboard");
  revalidatePath("/accounts");
  redirect("/debts");
}

export async function deleteLoanAction(formData: FormData) {
  const user = await requireUser();
  const id = cleanString(String(formData.get("id") ?? ""));
  const accountId = cleanString(String(formData.get("accountId") ?? ""));
  if (!id || !accountId) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.loan.deleteMany({
      where: { id, userId: user.id }
    });
    await tx.account.deleteMany({
      where: { id: accountId, userId: user.id }
    });
  });

  revalidatePath("/debts");
  revalidatePath("/dashboard");
  revalidatePath("/accounts");
  redirect("/debts");
}

export async function upsertInstallmentPurchaseAction(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = upsertInstallmentPurchaseSchema.safeParse({
    id: formData.get("id"),
    creditCardId: formData.get("creditCardId"),
    categoryId: formData.get("categoryId"),
    title: formData.get("title"),
    merchant: formData.get("merchant"),
    totalAmount: formData.get("totalAmount"),
    purchaseDate: formData.get("purchaseDate"),
    totalMonths: formData.get("totalMonths"),
    firstChargeMonth: formData.get("firstChargeMonth"),
    currentInstallment: formData.get("currentInstallment"),
    status: formData.get("status"),
    isManuallySettled: parseBoolean(formData.get("isManuallySettled")),
    settledAt: formData.get("settledAt"),
    notes: formData.get("notes")
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "No se pudo guardar la compra MSI."
    };
  }

  const payload = parsed.data;
  const creditCard = await prisma.creditCard.findFirst({
    where: { id: payload.creditCardId, userId: user.id }
  });

  if (!creditCard) {
    return {
      error: "La tarjeta seleccionada no existe."
    };
  }

  const schedule = buildInstallmentSchedule({
    totalAmount: payload.totalAmount,
    totalMonths: payload.totalMonths,
    firstChargeMonth: new Date(`${payload.firstChargeMonth}-01`),
    dueDay: creditCard.paymentDueDay
  });

  const paidCount = Math.min(Math.max(payload.currentInstallment - 1, 0), payload.totalMonths);
  const remainingBalance = Number(
    schedule
      .slice(paidCount)
      .reduce((sum, payment) => sum + payment.amount, 0)
      .toFixed(2)
  );
  const monthlyAmount = schedule[0]?.amount ?? Number((payload.totalAmount / payload.totalMonths).toFixed(2));

  await prisma.$transaction(async (tx) => {
    let purchaseId = payload.id;

    if (payload.id) {
      await tx.installmentPayment.deleteMany({
        where: { purchaseId: payload.id }
      });

      await tx.installmentPurchase.updateMany({
        where: { id: payload.id, userId: user.id },
        data: {
          creditCardId: payload.creditCardId,
          categoryId: payload.categoryId,
          title: payload.title,
          merchant: cleanString(payload.merchant),
          totalAmount: payload.totalAmount,
          purchaseDate: new Date(payload.purchaseDate),
          totalMonths: payload.totalMonths,
          monthlyAmount,
          firstChargeMonth: new Date(`${payload.firstChargeMonth}-01`),
          currentInstallment: payload.currentInstallment,
          remainingBalance,
          status: payload.status,
          isManuallySettled: payload.isManuallySettled,
          settledAt: payload.settledAt ? new Date(payload.settledAt) : null,
          notes: cleanString(payload.notes)
        }
      });
    } else {
      const created = await tx.installmentPurchase.create({
        data: {
          userId: user.id,
          creditCardId: payload.creditCardId,
          categoryId: payload.categoryId,
          title: payload.title,
          merchant: cleanString(payload.merchant),
          totalAmount: payload.totalAmount,
          purchaseDate: new Date(payload.purchaseDate),
          totalMonths: payload.totalMonths,
          monthlyAmount,
          firstChargeMonth: new Date(`${payload.firstChargeMonth}-01`),
          currentInstallment: payload.currentInstallment,
          remainingBalance,
          status: payload.status,
          isManuallySettled: payload.isManuallySettled,
          settledAt: payload.settledAt ? new Date(payload.settledAt) : null,
          notes: cleanString(payload.notes)
        }
      });
      purchaseId = created.id;
    }

    if (!purchaseId) {
      throw new Error("No se pudo persistir la compra MSI.");
    }

    await tx.installmentPayment.createMany({
      data: schedule.map((payment, index) => ({
        purchaseId,
        installmentNumber: payment.installmentNumber,
        chargeMonth: payment.chargeMonth,
        dueDate: payment.dueDate,
        amount: payment.amount,
        remainingAfterPayment: Math.max(payment.remainingAfterPayment, 0),
        isPaid: index < paidCount,
        paidAt: index < paidCount ? payment.dueDate : null
      }))
    });
  });

  revalidatePath("/installments");
  revalidatePath("/accounts");
  revalidatePath(`/cards/${payload.creditCardId}`);
  revalidatePath("/dashboard");
  revalidatePath("/debts");
  redirect("/installments");
}

export async function deleteInstallmentPurchaseAction(formData: FormData) {
  const user = await requireUser();
  const id = cleanString(String(formData.get("id") ?? ""));
  if (!id) {
    return;
  }

  await prisma.installmentPurchase.deleteMany({
    where: { id, userId: user.id }
  });

  revalidatePath("/installments");
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  revalidatePath("/debts");
  redirect("/installments");
}

export async function settleInstallmentPurchaseAction(formData: FormData) {
  const user = await requireUser();
  const id = cleanString(String(formData.get("id") ?? ""));
  const settledAtRaw = cleanString(String(formData.get("settledAt") ?? ""));

  if (!id) {
    return;
  }

  const settledAt = settledAtRaw ? new Date(settledAtRaw) : new Date();

  const purchase = await prisma.installmentPurchase.findFirst({
    where: { id, userId: user.id },
    select: { id: true, creditCardId: true, totalMonths: true }
  });

  if (!purchase) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.installmentPurchase.update({
      where: { id: purchase.id },
      data: {
        status: "EARLY_SETTLED",
        isManuallySettled: true,
        settledAt,
        currentInstallment: purchase.totalMonths,
        remainingBalance: 0
      }
    });

    await tx.installmentPayment.updateMany({
      where: {
        purchaseId: purchase.id,
        isPaid: false
      },
      data: {
        isPaid: true,
        paidAt: settledAt,
        remainingAfterPayment: 0
      }
    });
  });

  revalidatePath("/installments");
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  revalidatePath("/debts");
  revalidatePath(`/cards/${purchase.creditCardId}`);
  redirect("/installments");
}

export async function createCardPaymentAction(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = createCardPaymentSchema.safeParse({
    cardId: formData.get("cardId"),
    sourceAccountId: formData.get("sourceAccountId"),
    postedAt: formData.get("postedAt"),
    amount: formData.get("amount"),
    description: formData.get("description"),
    notes: formData.get("notes")
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "No se pudo registrar el pago."
    };
  }

  const payload = parsed.data;

  const card = await prisma.creditCard.findFirst({
    where: { id: payload.cardId, userId: user.id },
    select: {
      id: true,
      name: true,
      accountId: true
    }
  });

  if (!card) {
    return {
      error: "Tarjeta no encontrada."
    };
  }

  const debtCategory = await prisma.category.findFirst({
    where: {
      userId: user.id,
      kind: "DEBT",
      name: "Pago de deuda"
    },
    select: { id: true }
  });

  try {
    await prisma.$transaction(async (tx) => {
      const created = await tx.transaction.create({
        data: {
          userId: user.id,
          postedAt: new Date(payload.postedAt),
          amount: payload.amount,
          type: "CREDIT_CARD_PAYMENT",
          cadence: "ONE_TIME",
          planning: "PLANNED",
          description:
            cleanString(payload.description) ?? `Abono a tarjeta ${card.name}`,
          notes: cleanString(payload.notes),
          categoryId: debtCategory?.id,
          sourceAccountId: payload.sourceAccountId,
          destinationAccountId: card.accountId
        }
      });

      await applyTransactionEffects(
        tx,
        {
          type: created.type,
          amount: Number(created.amount.toString()),
          sourceAccountId: created.sourceAccountId,
          destinationAccountId: created.destinationAccountId
        },
        1
      );
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "No se pudo registrar el pago."
    };
  }

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/projection");
  revalidatePath("/accounts");
  revalidatePath("/debts");
  revalidatePath(`/cards/${card.id}`);
  redirect(`/cards/${card.id}`);
}

export async function upsertSettingsAction(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = upsertSettingsSchema.safeParse({
    currency: formData.get("currency"),
    locale: formData.get("locale"),
    dateFormat: formData.get("dateFormat"),
    incomeFrequency: formData.get("incomeFrequency"),
    paydayDays: formData.get("paydayDays"),
    debtStrategy: formData.get("debtStrategy"),
    defaultGoalPriority: formData.get("defaultGoalPriority"),
    cardStatementBufferDays: formData.get("cardStatementBufferDays"),
    enableLocalInsights: parseBoolean(formData.get("enableLocalInsights")),
    weekStartsOn: formData.get("weekStartsOn"),
    projectedFlowMonths: formData.get("projectedFlowMonths"),
    categoryBudgetWarningPct: formData.get("categoryBudgetWarningPct"),
    themeMode: formData.get("themeMode")
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "No se pudo guardar la configuración."
    };
  }

  const payload = parsed.data;
  const paydayDays = splitIntegerCsv(payload.paydayDays);

  if (!paydayDays.length) {
    return {
      error: "Define al menos un día de ingreso válido entre 1 y 31."
    };
  }

  await prisma.settings.upsert({
    where: { userId: user.id },
    update: {
      currency: payload.currency.toUpperCase(),
      locale: payload.locale,
      dateFormat: payload.dateFormat,
      incomeFrequency: payload.incomeFrequency,
      paydayDays,
      debtStrategy: payload.debtStrategy,
      defaultGoalPriority: payload.defaultGoalPriority,
      cardStatementBufferDays: payload.cardStatementBufferDays,
      enableLocalInsights: payload.enableLocalInsights,
      weekStartsOn: payload.weekStartsOn,
      projectedFlowMonths: payload.projectedFlowMonths,
      categoryBudgetWarningPct: payload.categoryBudgetWarningPct,
      themeMode: payload.themeMode
    },
    create: {
      userId: user.id,
      currency: payload.currency.toUpperCase(),
      locale: payload.locale,
      dateFormat: payload.dateFormat,
      incomeFrequency: payload.incomeFrequency,
      paydayDays,
      debtStrategy: payload.debtStrategy,
      defaultGoalPriority: payload.defaultGoalPriority,
      cardStatementBufferDays: payload.cardStatementBufferDays,
      enableLocalInsights: payload.enableLocalInsights,
      weekStartsOn: payload.weekStartsOn,
      projectedFlowMonths: payload.projectedFlowMonths,
      categoryBudgetWarningPct: payload.categoryBudgetWarningPct,
      themeMode: payload.themeMode
    }
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/projection");
  revalidatePath("/planned-purchases");
  revalidatePath("/debts");
  redirect("/settings");
}

export async function upsertFinancialRuleAction(
  _previousState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = upsertFinancialRuleSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    description: formData.get("description"),
    type: formData.get("type"),
    severity: formData.get("severity"),
    thresholdPercent: formData.get("thresholdPercent"),
    amountLimit: formData.get("amountLimit"),
    transactionCount: formData.get("transactionCount"),
    daysWindow: formData.get("daysWindow"),
    categoryId: formData.get("categoryId"),
    isEnabled: parseBoolean(formData.get("isEnabled"))
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "No se pudo guardar la regla financiera."
    };
  }

  const payload = parsed.data;
  const config = {
    thresholdPercent: payload.thresholdPercent,
    amountLimit: payload.amountLimit,
    transactionCount: payload.transactionCount,
    daysWindow: payload.daysWindow,
    categoryId: payload.categoryId
  };

  if (payload.id) {
    await prisma.financialRule.updateMany({
      where: { id: payload.id, userId: user.id },
      data: {
        name: payload.name,
        description: cleanString(payload.description),
        type: payload.type,
        severity: payload.severity,
        config,
        isEnabled: payload.isEnabled
      }
    });
  } else {
    await prisma.financialRule.create({
      data: {
        userId: user.id,
        name: payload.name,
        description: cleanString(payload.description),
        type: payload.type,
        severity: payload.severity,
        config,
        isEnabled: payload.isEnabled
      }
    });
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/projection");
  revalidatePath("/planned-purchases");
  revalidatePath("/debts");
  redirect("/settings");
}

export async function deleteFinancialRuleAction(formData: FormData) {
  const user = await requireUser();
  const id = cleanString(String(formData.get("id") ?? ""));
  if (!id) {
    return;
  }

  await prisma.financialRule.deleteMany({
    where: { id, userId: user.id }
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/projection");
  revalidatePath("/planned-purchases");
  revalidatePath("/debts");
  redirect("/settings");
}
