import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeMoney } from "@/lib/utils";
import { createGoalSchema } from "@/validations/goal";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const goals = await prisma.savingsGoal.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" }
  });

  return NextResponse.json(
    goals.map((goal) => ({
      ...goal,
      targetAmount: serializeMoney(goal.targetAmount),
      currentAmount: serializeMoney(goal.currentAmount),
      monthlySuggestedContribution: serializeMoney(goal.monthlySuggestedContribution)
    }))
  );
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const payload = createGoalSchema.parse(await request.json());

  const goal = await prisma.savingsGoal.create({
    data: {
      ...payload,
      userId: user.id,
      targetDate: payload.targetDate ? new Date(payload.targetDate) : null
    }
  });

  return NextResponse.json(
    {
      ...goal,
      targetAmount: serializeMoney(goal.targetAmount),
      currentAmount: serializeMoney(goal.currentAmount),
      monthlySuggestedContribution: serializeMoney(goal.monthlySuggestedContribution)
    },
    { status: 201 }
  );
}
