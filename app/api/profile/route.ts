import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const body = await req.json();
  const { sectionId, currentPassword, newPassword } = body;

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const updateData: any = {};

  if (sectionId) {
    const section = await prisma.section.findUnique({ where: { id: sectionId } });
    if (!section) {
      return NextResponse.json({ error: "Invalid section" }, { status: 400 });
    }
    updateData.sectionId = sectionId;
  }

  if (newPassword) {
    if (!currentPassword) {
      return NextResponse.json({ error: "Current password is required to change password" }, { status: 400 });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    if (newPassword.length < 8 || !/[0-9]/.test(newPassword) || !/[A-Za-z]/.test(newPassword)) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters with at least 1 number and 1 letter" },
        { status: 400 }
      );
    }

    const salt = await bcrypt.genSalt(10);
    updateData.passwordHash = await bcrypt.hash(newPassword, salt);
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: { id: true, name: true, email: true, regNo: true, sectionId: true, role: true },
  });

  await prisma.auditLog.create({
    data: {
      action: "USER_UPDATED_PROFILE",
      details: `Profile updated by ${user.regNo}`,
      userId,
    },
  });

  return NextResponse.json({ message: "Profile updated successfully", user: updatedUser });
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  await prisma.auditLog.create({
    data: {
      action: "USER_ACCOUNT_DELETED",
      details: `User account deleted: ${(session.user as any).regNo}`,
      userId,
    },
  });

  await prisma.user.delete({
    where: { id: userId },
  });

  return NextResponse.json({ message: "Account deleted successfully" });
}
