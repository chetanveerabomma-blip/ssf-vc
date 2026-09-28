import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from "./rate-limit";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || "attendance_predictor_secret_key_2026",
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Registration Number & Password",
      credentials: {
        regNo: { label: "Registration No", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.regNo || !credentials?.password) {
          throw new Error("Registration number and password are required.");
        }

        const normalizedRegNo = credentials.regNo.trim().toUpperCase();

        // Validate format
        const regNoRegex = /^[A-Z]{2}\d{10,13}$/;
        if (!regNoRegex.test(normalizedRegNo)) {
          throw new Error("Invalid Registration Number format. Expected format like RA2611003010042.");
        }

        // Rate limiting check
        const ip = req?.headers?.["x-forwarded-for"] || "127.0.0.1";
        const rateLimitKey = `${ip}:${normalizedRegNo}`;
        const rateStatus = checkRateLimit(rateLimitKey);

        if (!rateStatus.allowed) {
          throw new Error(
            `Account temporarily locked due to 5 consecutive failed attempts. Try again in ${rateStatus.lockoutSeconds} seconds.`
          );
        }

        // Lookup user
        const user = await prisma.user.findUnique({
          where: { regNo: normalizedRegNo },
        });

        if (!user) {
          recordFailedAttempt(rateLimitKey);
          throw new Error("Invalid registration number or password.");
        }

        const isValidPassword = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValidPassword) {
          const attemptResult = recordFailedAttempt(rateLimitKey);
          if (!attemptResult.allowed) {
            throw new Error(
              `Maximum attempts exceeded. Account locked for ${attemptResult.lockoutSeconds} seconds.`
            );
          }
          throw new Error(
            `Invalid registration number or password. ${attemptResult.remainingAttempts} attempts remaining.`
          );
        }

        // Reset rate limit on successful authentication
        resetRateLimit(rateLimitKey);

        // Record audit log
        try {
          await prisma.auditLog.create({
            data: {
              action: "USER_LOGIN",
              details: `Successful login by ${user.role} ${user.regNo}`,
              userId: user.id,
            },
          });
        } catch {
          // Non-blocking
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          regNo: user.regNo,
          sectionId: user.sectionId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.regNo = (user as any).regNo;
        token.sectionId = (user as any).sectionId;
      }
      if (trigger === "update" && session) {
        if (session.name) token.name = session.name;
        if (session.sectionId) token.sectionId = session.sectionId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).regNo = token.regNo;
        (session.user as any).sectionId = token.sectionId;
      }
      return session;
    },
  },
};
