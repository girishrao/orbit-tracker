import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@/app/generated/prisma/client";

function createPrismaClient() {
  const adapter = new PrismaLibSql({
    url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
