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
  const leaves = await prisma.leaveEntry.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ leaves });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const body = await req.json();

  const {
    type,
    startDate,
    endDate,
    isHalfDay,
    halfDayType,
    scope,
    medicalApproved,
    isAlreadyTaken,
    note,
  } = body;

  if (!type || !startDate || !endDate) {
    return NextResponse.json({ error: "Missing required leave parameters" }, { status: 400 });
  }

  const leave = await prisma.leaveEntry.create({
    data: {
      userId,
      type,
      startDate,
      endDate,
      isHalfDay: !!isHalfDay,
      halfDayType: halfDayType || null,
      scope: scope || "ALL",
      medicalApproved: !!medicalApproved,
      isAlreadyTaken: !!isAlreadyTaken,
      note: note || null,
    },
  });

  return NextResponse.json({ message: "Leave scenario recorded", leave }, { status: 201 });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { searchParams } = new URL(req.url);
  const leaveId = searchParams.get("id");
  const clearAll = searchParams.get("clearAll");

  if (clearAll === "true") {
    await prisma.leaveEntry.deleteMany({
      where: { userId },
    });
    return NextResponse.json({ message: "All leave entries cleared" });
  }

  if (leaveId) {
    await prisma.leaveEntry.delete({
      where: { id: leaveId, userId },
    });
    return NextResponse.json({ message: "Leave entry deleted" });
  }

  return NextResponse.json({ error: "Missing leave ID or clearAll parameter" }, { status: 400 });
}
