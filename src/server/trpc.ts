import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";

/**
 * tRPC context: セッションとPrismaクライアントを含む
 */
export const createTRPCContext = async () => {
  const session = await auth();

  return {
    session,
    db: prisma,
    prisma, // 後方互換性のため残す
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
});

/**
 * Public procedure: 認証不要
 */
export const publicProcedure = t.procedure;

/**
 * Protected procedure: 認証必須、userId自動注入
 */
export const protectedProcedure = t.procedure.use(async (opts) => {
  const { ctx } = opts;

  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return opts.next({
    ctx: {
      ...ctx,
      session: ctx.session,
      userId: ctx.session.user.id,
    },
  });
});

export const router = t.router;
export const middleware = t.middleware;
