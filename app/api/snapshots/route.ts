import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const snapshots = await prisma.snapshot.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({ snapshots });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const body = await req.json();

  const { date, planningDate, payload } = body;
  if (!date || !planningDate || !payload) {
    return NextResponse.json({ error: "Missing required snapshot fields" }, { status: 400 });
  }

  const snapshot = await prisma.snapshot.create({
    data: {
      userId,
      date,
      planningDate,
      payload: typeof payload === "string" ? payload : JSON.stringify(payload),
    },
  });

  return NextResponse.json({ message: "Snapshot saved successfully!", snapshot }, { status: 201 });
}
