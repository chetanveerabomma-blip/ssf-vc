import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const RegisterSchema = z
  .object({
    name: z.string().min(2, "Full name must be at least 2 characters"),
    regNo: z
      .string()
      .regex(/^[A-Za-z]{2}\d{10,13}$/, "Registration number must start with 2 letters followed by 10-13 digits"),
    email: z
      .string()
      .email("Must be a valid email address")
      .refine((val) => val.toLowerCase().endsWith("@srmtrichy.edu.in") || val.includes("@"), {
        message: "Please enter your college email",
      }),
    sectionId: z.string().min(1, "Please select your section"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[0-9]/, "Password must contain at least 1 number")
      .regex(/[A-Za-z]/, "Password must contain at least 1 letter"),
    confirmPassword: z.string(),
    terms: z.literal(true, {
      errorMap: () => ({ message: "You must accept the terms & conditions" }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = RegisterSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, regNo, email, sectionId, password } = result.data;
    const normalizedRegNo = regNo.trim().toUpperCase();
    const normalizedEmail = email.trim().toLowerCase();

    // Check duplicate regNo
    const existingReg = await prisma.user.findUnique({
      where: { regNo: normalizedRegNo },
    });
    if (existingReg) {
      return NextResponse.json(
        { error: "A student with this Registration Number already exists" },
        { status: 409 }
      );
    }

    // Check duplicate email
    const existingEmail = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingEmail) {
      return NextResponse.json(
        { error: "An account with this email address already exists" },
        { status: 409 }
      );
    }

    // Verify section exists
    const section = await prisma.section.findUnique({
      where: { id: sectionId },
    });
    if (!section) {
      return NextResponse.json({ error: "Selected section does not exist" }, { status: 400 });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        regNo: normalizedRegNo,
        email: normalizedEmail,
        passwordHash,
        role: "STUDENT",
        sectionId,
      },
      select: {
        id: true,
        regNo: true,
        name: true,
        email: true,
        role: true,
        sectionId: true,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: "USER_REGISTERED",
        details: `Student registered: ${user.regNo} (${user.name}) in ${sectionId}`,
        userId: user.id,
      },
    });

    return NextResponse.json(
      { message: "Registration successful! You can now log in.", user },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error during registration" },
      { status: 500 }
    );
  }
}
