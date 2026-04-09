import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeMoney } from "@/lib/utils";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const purchases = await prisma.plannedPurchase.findMany({
    where: { userId: user.id },
    include: { seasonality: true, linkedGoal: true },
    orderBy: { createdAt: "asc" }
  });

  return NextResponse.json(
    purchases.map((item) => ({
      ...item,
      targetPrice: serializeMoney(item.targetPrice),
      expectedMinPrice: serializeMoney(item.expectedMinPrice),
      expectedMaxPrice: serializeMoney(item.expectedMaxPrice),
      currentlySaved: serializeMoney(item.currentlySaved),
      suggestedMonthlySaving: serializeMoney(item.suggestedMonthlySaving),
      seasonality: item.seasonality
        ? {
            ...item.seasonality,
            priceRangeMin: serializeMoney(item.seasonality.priceRangeMin),
            priceRangeMax: serializeMoney(item.seasonality.priceRangeMax)
          }
        : null
    }))
  );
}
