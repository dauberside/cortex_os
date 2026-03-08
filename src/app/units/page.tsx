"use client";

import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Building2, Users, BookOpen, Plus } from "lucide-react";

const SERVICE_TYPE_LABELS: Record<string, string> = {
  GH: "グループホーム",
  KAIGO: "居宅介護",
  JUSHO: "重度訪問介護",
  SHORT: "ショートステイ",
};

const SERVICE_TYPE_COLORS: Record<string, string> = {
  GH: "bg-pink-100 text-pink-800",
  KAIGO: "bg-blue-100 text-blue-800",
  JUSHO: "bg-purple-100 text-purple-800",
  SHORT: "bg-yellow-100 text-yellow-800",
};

export default function UnitsPage() {
  const { data: units, isLoading } = trpc.unit.list.useQuery();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="mb-1 text-2xl font-bold">ユニット管理</h1>
          <p className="text-muted-foreground text-sm">
            グループホーム等のユニット（ハウス）を管理します
          </p>
        </div>
        <Link href="/units/new" className="shrink-0">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            新規ユニット登録
          </Button>
        </Link>
      </div>

      {!units || units.length === 0 ? (
        <div className="bg-card rounded-lg border p-12 text-center">
          <Building2 className="text-muted-foreground mx-auto mb-4 h-16 w-16" />
          <p className="text-muted-foreground mb-4 text-lg">
            登録されているユニットがありません
          </p>
          <Link href="/units/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              最初のユニットを登録
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {units.map((unit) => {
            const activeRecipients = unit.recipients.filter(
              (r) => !r.recipient.deletedAt
            );
            const primaryStaffs = unit.staffs.filter(
              (s) => s.role === "primary"
            );

            return (
              <Link key={unit.id} href={`/units/${unit.id}`}>
                <div className="bg-card hover:bg-accent cursor-pointer rounded-lg border p-6 transition-colors">
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-semibold">{unit.name}</h3>
                      <span
                        className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          SERVICE_TYPE_COLORS[unit.serviceType] ||
                          "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {SERVICE_TYPE_LABELS[unit.serviceType] ||
                          unit.serviceType}
                      </span>
                    </div>
                    <Building2 className="text-muted-foreground h-8 w-8" />
                  </div>

                  {unit.description && (
                    <p className="text-muted-foreground mb-4 text-sm">
                      {unit.description}
                    </p>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="text-muted-foreground h-4 w-4" />
                      <span>
                        利用者{" "}
                        <span className="font-semibold">
                          {activeRecipients.length}
                        </span>{" "}
                        名
                      </span>
                      <span className="text-muted-foreground">·</span>
                      <span>
                        固定職員{" "}
                        <span className="font-semibold">
                          {primaryStaffs.length}
                        </span>{" "}
                        名
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <BookOpen className="text-muted-foreground h-4 w-4" />
                      <span>
                        業務日誌{" "}
                        <span className="font-semibold">
                          {unit._count.dailyLogs}
                        </span>{" "}
                        件
                      </span>
                    </div>
                  </div>

                  {activeRecipients.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1">
                      {activeRecipients.slice(0, 4).map((ur) => (
                        <span
                          key={ur.recipient.id}
                          className="bg-muted text-muted-foreground rounded px-2 py-0.5 text-xs"
                        >
                          {ur.recipient.name}
                        </span>
                      ))}
                      {activeRecipients.length > 4 && (
                        <span className="bg-muted text-muted-foreground rounded px-2 py-0.5 text-xs">
                          +{activeRecipients.length - 4}名
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
