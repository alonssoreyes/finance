import {
  addDays,
  addMonths,
  differenceInCalendarMonths,
  endOfMonth,
  isAfter,
  isBefore,
  startOfMonth
} from "date-fns";

function clampDayToMonth(year: number, monthIndex: number, day: number) {
  const lastDay = endOfMonth(new Date(year, monthIndex, 1)).getDate();
  return new Date(year, monthIndex, Math.min(day, lastDay));
}

export function getClosingDateForPurchase(purchaseDate: Date, closingDay: number) {
  const year = purchaseDate.getFullYear();
  const month = purchaseDate.getMonth();

  if (purchaseDate.getDate() <= closingDay) {
    return clampDayToMonth(year, month, closingDay);
  }

  return clampDayToMonth(year, month + 1, closingDay);
}

export function getDueDateForClosingDate(closingDate: Date, dueDay: number) {
  const nextMonth = addMonths(closingDate, 1);
  return clampDayToMonth(nextMonth.getFullYear(), nextMonth.getMonth(), dueDay);
}

export function getUpcomingClosingDate(today: Date, closingDay: number) {
  return getClosingDateForPurchase(today, closingDay);
}

export function getPurchaseCycleSummary(params: {
  purchaseDate: Date;
  amount: number;
  installments: number;
  closingDay: number;
  dueDay: number;
  creditLimit: number;
  currentBalance: number;
  today?: Date;
}) {
  const today = params.today ?? new Date();
  const closingDate = getClosingDateForPurchase(params.purchaseDate, params.closingDay);
  const dueDate = getDueDateForClosingDate(closingDate, params.dueDay);
  const upcomingClosingDate = getUpcomingClosingDate(today, params.closingDay);
  const monthsDelta = differenceInCalendarMonths(
    startOfMonth(closingDate),
    startOfMonth(upcomingClosingDate)
  );
  const statementBucket =
    monthsDelta <= 0 ? "Cae en el próximo corte" : monthsDelta === 1 ? "Cae en el corte siguiente" : `Cae ${monthsDelta + 1} cortes adelante`;

  const monthlyAmount =
    params.installments > 1 ? Number((params.amount / params.installments).toFixed(2)) : params.amount;
  const utilizationAfter = params.creditLimit
    ? ((params.currentBalance + params.amount) / params.creditLimit) * 100
    : 0;

  const next15 = addDays(today, 15);
  const next30 = addDays(today, 30);
  const firstChargeAmount = params.installments > 1 ? monthlyAmount : params.amount;

  return {
    closingDate,
    dueDate,
    firstChargeMonth: startOfMonth(closingDate),
    finalChargeMonth: addMonths(startOfMonth(closingDate), Math.max(params.installments - 1, 0)),
    statementBucket,
    monthlyAmount,
    utilizationAfter,
    needsWithin15Days:
      (isBefore(dueDate, next15) || dueDate.getTime() === next15.getTime()) && !isAfter(dueDate, today)
        ? 0
        : isBefore(dueDate, next15) || dueDate.getTime() === next15.getTime()
          ? firstChargeAmount
          : 0,
    needsWithin30Days:
      isBefore(dueDate, next30) || dueDate.getTime() === next30.getTime() ? firstChargeAmount : 0
  };
}

export function buildInstallmentSchedule(params: {
  totalAmount: number;
  totalMonths: number;
  firstChargeMonth: Date;
  dueDay: number;
  today?: Date;
}) {
  const today = params.today ?? new Date();
  const baseMonthly = Number((params.totalAmount / params.totalMonths).toFixed(2));
  const payments: Array<{
    installmentNumber: number;
    chargeMonth: Date;
    dueDate: Date;
    amount: number;
    isPaid: boolean;
  }> = [];
  let accumulated = 0;

  for (let index = 0; index < params.totalMonths; index += 1) {
    const chargeMonth = addMonths(startOfMonth(params.firstChargeMonth), index);
    const amount =
      index === params.totalMonths - 1
        ? Number((params.totalAmount - accumulated).toFixed(2))
        : baseMonthly;
    accumulated += amount;
    const dueDate = clampDayToMonth(
      addMonths(chargeMonth, 1).getFullYear(),
      addMonths(chargeMonth, 1).getMonth(),
      params.dueDay
    );

    payments.push({
      installmentNumber: index + 1,
      chargeMonth,
      dueDate,
      amount,
      isPaid: dueDate < today
    });
  }

  return payments.map((payment, index) => ({
    ...payment,
    remainingAfterPayment: Number(
      (
        params.totalAmount -
        payments.slice(0, index + 1).reduce((sum, item) => sum + item.amount, 0)
      ).toFixed(2)
    )
  }));
}
