/**
 * Prisma Client Singleton
 * در حالت dev، Next.js فایل‌ها رو Hot-Reload می‌کنه که باعث می‌شه هر بار
 * یک PrismaClient جدید ساخته بشه و به‌مرور Connection Pool دیتابیس پر بشه.
 * این الگو (نگه‌داشتن instance روی globalThis) این مشکل رو حل می‌کنه.
 */
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
