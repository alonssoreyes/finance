import { type ClassValue, clsx } from "clsx";
import { Decimal } from "@prisma/client/runtime/library";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toNumber(value: Decimal | number | string | null | undefined) {
  if (value == null) {
    return 0;
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    return Number(value);
  }

  return Number(value.toString());
}

export function serializeMoney(value: Decimal | null | undefined) {
  if (!value) {
    return null;
  }

  return Number(value.toString());
}

export function percentage(part: number, total: number) {
  if (!total) {
    return 0;
  }

  return (part / total) * 100;
}
