import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeMoney } from "@/lib/utils";
import { createTransactionSchema } from "@/validations/transaction";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const transactions = await prisma.transaction.findMany({
    where: { userId: user.id },
    orderBy: { postedAt: "desc" },
    take: 50
  });

  return NextResponse.json(
    transactions.map((transaction) => ({
      ...transaction,
      amount: serializeMoney(transaction.amount)
    }))
  );
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const payload = createTransactionSchema.parse(await request.json());

  const transaction = await prisma.transaction.create({
    data: {
      ...payload,
      userId: user.id,
      postedAt: new Date(payload.postedAt)
    }
  });

  return NextResponse.json(
    {
      ...transaction,
      amount: serializeMoney(transaction.amount)
    },
    { status: 201 }
  );
}
