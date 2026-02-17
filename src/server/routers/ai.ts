import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { OpenAI } from "openai";
import { TRPCError } from "@trpc/server";

// OpenAI クライアントの初期化
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

// Zodスキーマ定義
export const sendMessageSchema = z.object({
  message: z.string().min(1, "メッセージは必須です"),
  conversationId: z.string().optional(),
  noteId: z.string().cuid().optional(),
});

export const getConversationSchema = z.object({
  conversationId: z.string(),
});

export const deleteConversationSchema = z.object({
  conversationId: z.string(),
});

// AI Router
export const aiRouter = router({
  // メッセージ送信とAI応答取得
  sendMessage: protectedProcedure
    .input(sendMessageSchema)
    .mutation(async ({ ctx, input }) => {
      // OpenAI API キーチェック
      if (!openai) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "OpenAI APIキーが設定されていません。.envにOPENAI_API_KEYを設定してください。",
        });
      }

      // conversationId生成（新規の場合）
      const conversationId = input.conversationId || crypto.randomUUID();

      // noteIdの権限チェック（指定されている場合）
      if (input.noteId) {
        const note = await ctx.prisma.note.findFirst({
          where: {
            id: input.noteId,
            userId: ctx.userId,
            deletedAt: null,
          },
        });

        if (!note) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "ノートが見つかりません",
          });
        }
      }

      // ユーザーメッセージを保存
      const userMessage = await ctx.prisma.aIMessage.create({
        data: {
          userId: ctx.userId,
          conversationId,
          noteId: input.noteId,
          role: "user",
          content: input.message,
        },
      });

      // 会話履歴を取得（コンテキスト用）
      const conversationHistory = await ctx.prisma.aIMessage.findMany({
        where: {
          userId: ctx.userId,
          conversationId,
        },
        orderBy: {
          createdAt: "asc",
        },
        select: {
          role: true,
          content: true,
        },
      });

      // ノート文脈がある場合、システムメッセージを追加
      let systemMessage = "あなたは親切で知識豊富なAIアシスタントです。";
      if (input.noteId) {
        const note = await ctx.prisma.note.findUnique({
          where: { id: input.noteId },
          select: { title: true, content: true },
        });
        if (note) {
          systemMessage = `あなたは親切で知識豊富なAIアシスタントです。以下のノートに関する質問に答えてください。

ノートタイトル: ${note.title}
ノート内容:
${note.content}`;
        }
      }

      try {
        // OpenAI APIを呼び出し
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemMessage },
            ...conversationHistory.map((msg) => ({
              role: msg.role as "user" | "assistant",
              content: msg.content,
            })),
          ],
          max_tokens: 1000,
          temperature: 0.7,
        });

        const aiResponse = completion.choices[0]?.message?.content || "";

        // AI応答を保存
        const assistantMessage = await ctx.prisma.aIMessage.create({
          data: {
            userId: ctx.userId,
            conversationId,
            noteId: input.noteId,
            role: "assistant",
            content: aiResponse,
            metadata: completion.usage
              ? {
                  model: completion.model,
                  usage: {
                    prompt_tokens: completion.usage.prompt_tokens,
                    completion_tokens: completion.usage.completion_tokens,
                    total_tokens: completion.usage.total_tokens,
                  },
                }
              : { model: completion.model },
          },
        });

        return {
          userMessage,
          assistantMessage,
          conversationId,
        };
      } catch (error) {
        // OpenAI APIエラーハンドリング
        console.error("OpenAI API Error:", error);

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "AI応答の生成に失敗しました",
        });
      }
    }),

  // 会話履歴取得
  getConversation: protectedProcedure
    .input(getConversationSchema)
    .query(async ({ ctx, input }) => {
      const messages = await ctx.prisma.aIMessage.findMany({
        where: {
          userId: ctx.userId,
          conversationId: input.conversationId,
        },
        orderBy: {
          createdAt: "asc",
        },
        include: {
          note: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      return messages;
    }),

  // 全会話一覧取得
  listConversations: protectedProcedure.query(async ({ ctx }) => {
    const conversations = await ctx.prisma.aIMessage.groupBy({
      by: ["conversationId"],
      where: {
        userId: ctx.userId,
        conversationId: { not: null },
      },
      _max: {
        createdAt: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _max: {
          createdAt: "desc",
        },
      },
    });

    // 各会話の最初のメッセージを取得してタイトルとして使用
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conv) => {
        const firstMessage = await ctx.prisma.aIMessage.findFirst({
          where: {
            userId: ctx.userId,
            conversationId: conv.conversationId,
            role: "user",
          },
          orderBy: {
            createdAt: "asc",
          },
          select: {
            content: true,
          },
        });

        return {
          conversationId: conv.conversationId!,
          messageCount: conv._count.id,
          lastMessageAt: conv._max.createdAt!,
          previewText:
            firstMessage?.content.slice(0, 50) + "..." || "会話を開始",
        };
      })
    );

    return conversationsWithDetails;
  }),

  // 会話削除
  deleteConversation: protectedProcedure
    .input(deleteConversationSchema)
    .mutation(async ({ ctx, input }) => {
      // 権限チェック
      const messageCount = await ctx.prisma.aIMessage.count({
        where: {
          userId: ctx.userId,
          conversationId: input.conversationId,
        },
      });

      if (messageCount === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "会話が見つかりません",
        });
      }

      // 会話内の全メッセージを削除
      await ctx.prisma.aIMessage.deleteMany({
        where: {
          userId: ctx.userId,
          conversationId: input.conversationId,
        },
      });

      return { success: true };
    }),
});
