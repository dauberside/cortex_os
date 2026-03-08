import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { PrismaClient } from "@prisma/client";

// Prisma Client のインスタンス作成（Edge Runtime 対応のため、グローバルではなくローカルで作成）
// NOTE: Edge Runtime では Prisma が制限されるため、監査ログは Route Handler で実装する方が適切
// このミドルウェアではパスの検出のみ行い、実際のログ記録は各ページコンポーネントで実施

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // 認証されていない場合はログ記録をスキップ
  if (!token) {
    return NextResponse.next();
  }

  const pathname = request.nextUrl.pathname;

  // Recipient Hub 閲覧（/recipients/[id] および /recipients/[id]/assessment）
  const recipientHubMatch = pathname.match(
    /^\/recipients\/([a-z0-9]+)(?:\/assessment)?$/
  );

  if (recipientHubMatch) {
    const recipientId = recipientHubMatch[1];
    const userId = token.sub as string;

    // レスポンスヘッダーに監査ログ用の情報を追加
    // 実際のログ記録は各ページコンポーネントで useEffect を使用して実施
    const response = NextResponse.next();
    response.headers.set("X-Audit-Action", "View");
    response.headers.set("X-Audit-ResourceType", "CareRecipient");
    response.headers.set("X-Audit-ResourceId", recipientId);
    response.headers.set("X-Audit-Path", pathname);
    response.headers.set("X-Audit-UserId", userId);

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
