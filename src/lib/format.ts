import { format } from "date-fns";

export function formatCurrency(value: number, currency = "MXN", locale = "es-MX") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(value);
}

export function formatDate(value: string | Date, pattern = "d MMM yyyy") {
  return format(new Date(value), pattern);
}

export function formatMonthLabel(value: string | Date) {
  return format(new Date(value), "MMM yyyy");
}
