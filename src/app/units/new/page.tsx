"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const SERVICE_TYPES = [
  { value: "GH", label: "グループホーム" },
  { value: "KAIGO", label: "居宅介護" },
  { value: "JUSHO", label: "重度訪問介護" },
  { value: "SHORT", label: "ショートステイ" },
];

export default function NewUnitPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [serviceType, setServiceType] = useState("GH");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const createMutation = trpc.unit.create.useMutation({
    onSuccess: (unit) => {
      router.push(`/units/${unit.id}`);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("ユニット名は必須です");
      return;
    }
    createMutation.mutate({
      name: name.trim(),
      serviceType,
      description: description.trim() || undefined,
    });
  };

  return (
    <div className="container mx-auto max-w-xl px-4 py-8">
      <div className="mb-6">
        <Link
          href="/units"
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          ユニット一覧に戻る
        </Link>
      </div>

      <h1 className="mb-6 text-2xl font-bold">新規ユニット登録</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-card space-y-6 rounded-lg border p-6"
      >
        <div>
          <label className="mb-1 block text-sm font-medium">
            ユニット名 <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: ハウスてんじん"
            className="w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-offset-1 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            サービス種別 <span className="text-destructive">*</span>
          </label>
          <select
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-offset-1 focus:outline-none"
          >
            {SERVICE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">備考</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="ユニットの説明・備考"
            rows={3}
            className="w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-offset-1 focus:outline-none"
          />
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <div className="flex justify-end gap-2">
          <Link href="/units">
            <Button type="button" variant="outline">
              キャンセル
            </Button>
          </Link>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "登録中..." : "登録する"}
          </Button>
        </div>
      </form>
    </div>
  );
}
