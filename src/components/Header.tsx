"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const NAV_ITEMS = [
  { href: "/dashboard", label: "ダッシュボード" },
  { href: "/recipients", label: "利用者管理" },
  { href: "/ai", label: "AIチャット" },
];

export default function Header() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // サインインページやローディング中は表示しない
  if (status === "loading" || !session || pathname?.startsWith("/auth")) {
    return null;
  }

  return (
    <header className="bg-background sticky top-0 z-50 border-b">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-lg font-bold">
            Cortex OS
          </Link>
          <nav className="hidden items-center gap-4 sm:flex">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm transition-colors hover:text-foreground ${
                  pathname?.startsWith(item.href)
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground hidden text-sm sm:block">
            {session.user?.email}
          </span>
          <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/auth/signin" })}>
            ログアウト
          </Button>
        </div>
      </div>
    </header>
  );
}
