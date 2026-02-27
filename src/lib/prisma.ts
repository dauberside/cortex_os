import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const globalForPrisma = globalThis as unknown as {
  prisma: any;
};

function createPrismaClient() {
  const connectionString =
    process.env.DATABASE_URL ??
    process.env.CORTEX_DATABASE_DATABASE_URL ??
    process.env.CORTEX_DATABASE_POSTGRES_PRISMA_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL, CORTEX_DATABASE_DATABASE_URL, or CORTEX_DATABASE_POSTGRES_PRISMA_URL is not defined"
    );
  }

  const adapter = new PrismaNeon({ connectionString });

  return new (PrismaClient as any)({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
