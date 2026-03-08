import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";

export const authConfig = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, _request) {
        // TODO: 実際の認証ロジックを実装
        // 現在は開発用の簡易実装
        if (!credentials?.email) {
          return null;
        }

        // ユーザーを取得または作成（開発用）
        const user = await prisma.user.upsert({
          where: { email: credentials.email as string },
          update: {},
          create: {
            email: credentials.email as string,
            name: credentials.email as string,
            role: "STAFF", // デフォルトロール
          },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            role: true,
          },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role as "STAFF" | "LEAD" | "MANAGER",
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as "STAFF" | "LEAD" | "MANAGER";
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
      }
      return token;
    },
    async redirect({ url, baseUrl }) {
      // 相対URLの場合はリクエスト元のベースURLを使用
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      // 同じオリジンの場合は許可
      else if (new URL(url).origin === baseUrl) {
        return url;
      }
      // それ以外はリクエスト元のベースURLにリダイレクト
      return baseUrl;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
  // 開発環境ではlocalhostを使用
  basePath: "/api/auth",
  trustHost: true,
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
