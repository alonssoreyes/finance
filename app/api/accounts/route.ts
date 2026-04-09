import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeMoney } from "@/lib/utils";
import { createAccountSchema } from "@/validations/account";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const accounts = await prisma.account.findMany({
    where: { userId: user.id, isArchived: false },
    orderBy: { createdAt: "asc" }
  });

  return NextResponse.json(
    accounts.map((account) => ({
      ...account,
      currentBalance: serializeMoney(account.currentBalance),
      availableBalance: serializeMoney(account.availableBalance),
      creditLimit: serializeMoney(account.creditLimit)
    }))
  );
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const payload = createAccountSchema.parse(await request.json());

  const account = await prisma.account.create({
    data: {
      ...payload,
      userId: user.id
    }
  });

  return NextResponse.json(
    {
      ...account,
      currentBalance: serializeMoney(account.currentBalance),
      availableBalance: serializeMoney(account.availableBalance),
      creditLimit: serializeMoney(account.creditLimit)
    },
    { status: 201 }
  );
}
