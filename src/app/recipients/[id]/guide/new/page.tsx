"use client";

import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

const TRANSPORT_OPTIONS = [
  "徒歩",
  "電車",
  "バス",
  "タクシー",
  "車椅子対応タクシー",
  "福祉車両",
  "自転車",
  "その他",
];

const MEAL_AMOUNT_OPTIONS = ["全量", "半量", "食べず"] as const;

const guideSchema = z.object({
  startedAt: z.string().min(1, "開始日時は必須です"),
  endedAt: z.string().optional(),
  destination: z.string().optional(),
  purpose: z.string().optional(),

  // 集合・解散情報
  assemblyLocation: z.string().optional(),
  dismissalLocation: z.string().optional(),

  // 経路情報（文字列配列）
  route: z.array(z.string()).default([]),

  transport: z.array(z.string()).default([]),
  supportContent: z.string().optional(),
  userCondition: z.string().optional(),

  // 金銭管理
  cashHandled: z.boolean().default(false),
  handedAmount: z.coerce.number().int().min(0).optional().or(z.literal("")),
  returnedAmount: z.coerce.number().int().min(0).optional().or(z.literal("")),
  cashNote: z.string().optional(),

  // 金銭詳細内訳
  transportExpenses: z.array(z.object({
    amount: z.coerce.number().int().min(0),
    description: z.string().optional(), // 交通機関の区間（例：「○○駅から△△駅」）
  })).default([]),
  foodExpenses: z.array(z.object({
    amount: z.coerce.number().int().min(0),
    description: z.string().optional(), // 飲食の品名（例：「ラーメン」）
  })).default([]),
  otherExpenses: z.array(z.object({
    amount: z.coerce.number().int().min(0),
    description: z.string().optional(), // その他の品目（例：「入場料」）
  })).default([]),
  staffMealExpense: z.coerce.number().int().min(0).optional().or(z.literal("")),

  // 食事情報
  mealContent: z.string().optional(),
  mealAmount: z.enum(MEAL_AMOUNT_OPTIONS).optional(),

  // 服薬情報
  medicationTaken: z.boolean().default(false),
  medicationTime: z.string().optional(),

  notes: z.string().optional(),
});

type GuideFormData = z.infer<typeof guideSchema>;

export default function NewGuideRecordPage() {
  const params = useParams();
  const router = useRouter();
  const recipientId = params.id as string;

  const { data: recipient } = trpc.recipient.get.useQuery({ id: recipientId });
  const createMutation = trpc.guideRecord.create.useMutation();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<GuideFormData>({
    resolver: zodResolver(guideSchema) as any,
    defaultValues: {
      startedAt: new Date().toISOString().slice(0, 16),
      transport: [],
      cashHandled: false,
      medicationTaken: false,
      route: [""],
      transportExpenses: Array(6).fill(null).map(() => ({ amount: 0, description: "" })),
      foodExpenses: Array(4).fill(null).map(() => ({ amount: 0, description: "" })),
      otherExpenses: Array(4).fill(null).map(() => ({ amount: 0, description: "" })),
    },
  });

  const cashHandled = watch("cashHandled");
  const selectedTransport = watch("transport");
  const medicationTaken = watch("medicationTaken");
  const handedAmount = watch("handedAmount");
  const transportExpenses = watch("transportExpenses");
  const foodExpenses = watch("foodExpenses");
  const otherExpenses = watch("otherExpenses");
  const staffMealExpense = watch("staffMealExpense");
  const route = watch("route");

  // 金銭計算
  const totalTransportExpenses = transportExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalFoodExpenses = foodExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalOtherExpenses = otherExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalStaffMealExpense = Number(staffMealExpense) || 0;
  const totalExpenses = totalTransportExpenses + totalFoodExpenses + totalOtherExpenses + totalStaffMealExpense;

  const calculatedReturnedAmount =
    handedAmount && String(handedAmount) !== ""
      ? Number(handedAmount) - totalExpenses
      : null;

  const toggleTransport = (value: string) => {
    const current = selectedTransport ?? [];
    if (current.includes(value)) {
      setValue(
        "transport",
        current.filter((v) => v !== value)
      );
    } else {
      setValue("transport", [...current, value]);
    }
  };

  const addRouteItem = () => {
    setValue("route", [...route, ""]);
  };

  const removeRouteItem = (index: number) => {
    setValue(
      "route",
      route.filter((_, i) => i !== index)
    );
  };

  const updateRouteItem = (index: number, value: string) => {
    const newRoute = [...route];
    newRoute[index] = value;
    setValue("route", newRoute);
  };

  const onSubmit = async (data: GuideFormData) => {
    try {
      await createMutation.mutateAsync({
        recipientId,
        startedAt: new Date(data.startedAt),
        endedAt: data.endedAt ? new Date(data.endedAt) : undefined,
        destination: data.destination || undefined,
        purpose: data.purpose || undefined,
        assemblyLocation: data.assemblyLocation || undefined,
        dismissalLocation: data.dismissalLocation || undefined,
        route: data.route.filter((r) => r.trim() !== ""),
        transport: data.transport ?? [],
        supportContent: data.supportContent || undefined,
        userCondition: data.userCondition || undefined,
        cashHandled: data.cashHandled,
        handedAmount: data.handedAmount && String(data.handedAmount) !== "" ? Number(data.handedAmount) : undefined,
        returnedAmount: calculatedReturnedAmount !== null ? calculatedReturnedAmount : undefined,
        cashNote: data.cashNote || undefined,
        transportExpenses: data.transportExpenses.filter((e) => e.amount > 0),
        foodExpenses: data.foodExpenses.filter((e) => e.amount > 0),
        otherExpenses: data.otherExpenses.filter((e) => e.amount > 0),
        staffMealExpense: data.staffMealExpense && String(data.staffMealExpense) !== "" ? Number(data.staffMealExpense) : undefined,
        mealContent: data.mealContent || undefined,
        mealAmount: data.mealAmount || undefined,
        medicationTaken: data.medicationTaken,
        medicationTime: data.medicationTime || undefined,
        notes: data.notes || undefined,
      });
      router.push(`/recipients/${recipientId}/guide`);
    } catch (error) {
      console.error("ガイド記録エラー:", error);
      alert("ガイド記録の登録に失敗しました");
    }
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <Link href={`/recipients/${recipientId}/guide`}>
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          ガイド記録一覧に戻る
        </Button>
      </Link>

      <h1 className="mb-2 text-3xl font-bold">ガイド記録登録</h1>
      {recipient && (
        <p className="text-muted-foreground mb-8">
          {recipient.name} さんのガイド記録を登録します
        </p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* 支援日時 */}
        <div className="bg-card rounded-lg border p-6">
          <h2 className="mb-4 text-xl font-semibold">支援日時</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">
                開始日時 <span className="text-destructive">*</span>
              </label>
              <input
                type="datetime-local"
                {...register("startedAt")}
                className="w-full rounded-md border px-3 py-2"
              />
              {errors.startedAt && (
                <p className="text-destructive mt-1 text-sm">
                  {errors.startedAt.message}
                </p>
              )}
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">終了日時</label>
              <input
                type="datetime-local"
                {...register("endedAt")}
                className="w-full rounded-md border px-3 py-2"
              />
            </div>
          </div>
        </div>

        {/* 外出情報 */}
        <div className="bg-card space-y-4 rounded-lg border p-6">
          <h2 className="mb-4 text-xl font-semibold">外出情報</h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">外出先</label>
              <input
                type="text"
                {...register("destination")}
                className="w-full rounded-md border px-3 py-2"
                placeholder="○○病院、△△スーパーなど"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">目的</label>
              <input
                type="text"
                {...register("purpose")}
                className="w-full rounded-md border px-3 py-2"
                placeholder="通院、買い物、散歩など"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">集合場所</label>
              <input
                type="text"
                {...register("assemblyLocation")}
                className="w-full rounded-md border px-3 py-2"
                placeholder="ご自宅、○○駅など"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">解散場所</label>
              <input
                type="text"
                {...register("dismissalLocation")}
                className="w-full rounded-md border px-3 py-2"
                placeholder="ご自宅、○○駅など"
              />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-medium">経路</label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addRouteItem}
              >
                <Plus className="mr-1 h-4 w-4" />
                経由地を追加
              </Button>
            </div>
            <div className="space-y-2">
              {route.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => updateRouteItem(index, e.target.value)}
                    className="flex-1 rounded-md border px-3 py-2"
                    placeholder={`経由地 ${index + 1}`}
                  />
                  {route.length > 1 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removeRouteItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">移動手段</label>
            <div className="flex flex-wrap gap-2">
              {TRANSPORT_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggleTransport(opt)}
                  className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                    selectedTransport?.includes(opt)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-gray-300 hover:border-gray-500"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 金銭管理 */}
        <div className="bg-card space-y-4 rounded-lg border p-6">
          <h2 className="mb-4 text-xl font-semibold">金銭管理</h2>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="cashHandled"
              {...register("cashHandled")}
              className="h-4 w-4"
            />
            <label htmlFor="cashHandled" className="text-sm font-medium">
              金銭の管理・使用あり
            </label>
          </div>

          {cashHandled && (
            <div className="space-y-4 border-l-2 border-orange-200 pl-4">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  最初にあったお金（円）
                </label>
                <input
                  type="number"
                  min="0"
                  {...register("handedAmount")}
                  className="w-full rounded-md border px-3 py-2"
                  placeholder="3000"
                />
              </div>

              {/* 交通費 */}
              <div>
                <label className="mb-2 block text-sm font-medium">交通費（6行）</label>
                <div className="space-y-2">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <div key={`transport-${i}`} className="flex gap-2">
                      <input
                        type="text"
                        value={transportExpenses[i]?.description || ""}
                        onChange={(e) => {
                          const newExpenses = [...transportExpenses];
                          newExpenses[i] = { ...newExpenses[i], description: e.target.value };
                          setValue("transportExpenses", newExpenses);
                        }}
                        className="flex-1 rounded-md border px-3 py-2"
                        placeholder="○○駅から△△駅"
                      />
                      <input
                        type="number"
                        min="0"
                        value={transportExpenses[i]?.amount || ""}
                        onChange={(e) => {
                          const newExpenses = [...transportExpenses];
                          newExpenses[i] = { ...newExpenses[i], amount: Number(e.target.value) || 0 };
                          setValue("transportExpenses", newExpenses);
                        }}
                        className="w-24 rounded-md border px-3 py-2"
                        placeholder="0"
                      />
                      <span className="flex items-center text-sm">円</span>
                    </div>
                  ))}
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  合計: {totalTransportExpenses.toLocaleString()}円
                </p>
              </div>

              {/* 飲食費 */}
              <div>
                <label className="mb-2 block text-sm font-medium">飲食費（4行）</label>
                <div className="space-y-2">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={`food-${i}`} className="flex gap-2">
                      <input
                        type="text"
                        value={foodExpenses[i]?.description || ""}
                        onChange={(e) => {
                          const newExpenses = [...foodExpenses];
                          newExpenses[i] = { ...newExpenses[i], description: e.target.value };
                          setValue("foodExpenses", newExpenses);
                        }}
                        className="flex-1 rounded-md border px-3 py-2"
                        placeholder="ラーメン、お弁当など"
                      />
                      <input
                        type="number"
                        min="0"
                        value={foodExpenses[i]?.amount || ""}
                        onChange={(e) => {
                          const newExpenses = [...foodExpenses];
                          newExpenses[i] = { ...newExpenses[i], amount: Number(e.target.value) || 0 };
                          setValue("foodExpenses", newExpenses);
                        }}
                        className="w-24 rounded-md border px-3 py-2"
                        placeholder="0"
                      />
                      <span className="flex items-center text-sm">円</span>
                    </div>
                  ))}
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  合計: {totalFoodExpenses.toLocaleString()}円
                </p>
              </div>

              {/* その他 */}
              <div>
                <label className="mb-2 block text-sm font-medium">その他（4行）</label>
                <div className="space-y-2">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={`other-${i}`} className="flex gap-2">
                      <input
                        type="text"
                        value={otherExpenses[i]?.description || ""}
                        onChange={(e) => {
                          const newExpenses = [...otherExpenses];
                          newExpenses[i] = { ...newExpenses[i], description: e.target.value };
                          setValue("otherExpenses", newExpenses);
                        }}
                        className="flex-1 rounded-md border px-3 py-2"
                        placeholder="入場料、お土産など"
                      />
                      <input
                        type="number"
                        min="0"
                        value={otherExpenses[i]?.amount || ""}
                        onChange={(e) => {
                          const newExpenses = [...otherExpenses];
                          newExpenses[i] = { ...newExpenses[i], amount: Number(e.target.value) || 0 };
                          setValue("otherExpenses", newExpenses);
                        }}
                        className="w-24 rounded-md border px-3 py-2"
                        placeholder="0"
                      />
                      <span className="flex items-center text-sm">円</span>
                    </div>
                  ))}
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  合計: {totalOtherExpenses.toLocaleString()}円
                </p>
              </div>

              {/* サポーター食事代 */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  サポーター食事代（円）
                </label>
                <input
                  type="number"
                  min="0"
                  {...register("staffMealExpense")}
                  className="w-full rounded-md border px-3 py-2"
                  placeholder="0"
                />
              </div>

              {/* 合計・残金 */}
              <div className="rounded-md border border-orange-200 bg-orange-50 px-4 py-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">最初にあったお金</span>
                  <span>{Number(handedAmount || 0).toLocaleString()}円</span>
                </div>

                {/* 使用内訳 */}
                <div className="mt-2 space-y-1 border-t border-orange-200 pt-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="pl-2">交通費</span>
                    <span>{totalTransportExpenses.toLocaleString()}円</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="pl-2">飲食費</span>
                    <span>{totalFoodExpenses.toLocaleString()}円</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="pl-2">その他</span>
                    <span>{totalOtherExpenses.toLocaleString()}円</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="pl-2">サポーター食事代</span>
                    <span>{totalStaffMealExpense.toLocaleString()}円</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-medium pt-1">
                    <span className="text-muted-foreground">使用合計</span>
                    <span>{totalExpenses.toLocaleString()}円</span>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between border-t border-orange-200 pt-2 font-semibold">
                  <span>のこったお金</span>
                  <span
                    className={
                      calculatedReturnedAmount !== null && calculatedReturnedAmount < 0
                        ? "text-destructive"
                        : "text-orange-700"
                    }
                  >
                    {calculatedReturnedAmount !== null
                      ? calculatedReturnedAmount.toLocaleString()
                      : "—"}
                    円
                  </span>
                </div>
                {calculatedReturnedAmount !== null && calculatedReturnedAmount < 0 && (
                  <p className="text-destructive mt-1 text-xs">
                    使用金額が最初にあったお金を超えています
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  金銭内訳・備考
                </label>
                <textarea
                  {...register("cashNote")}
                  className="w-full rounded-md border px-3 py-2"
                  rows={3}
                  placeholder="詳細な内訳や備考があればご記入ください"
                />
              </div>
            </div>
          )}
        </div>

        {/* 食事情報 */}
        <div className="bg-card space-y-4 rounded-lg border p-6">
          <h2 className="mb-4 text-xl font-semibold">食事情報</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">食事内容</label>
              <input
                type="text"
                {...register("mealContent")}
                className="w-full rounded-md border px-3 py-2"
                placeholder="ラーメン、お弁当など"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">食事量</label>
              <select
                {...register("mealAmount")}
                className="w-full rounded-md border px-3 py-2"
              >
                <option value="">選択してください</option>
                {MEAL_AMOUNT_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 服薬情報 */}
        <div className="bg-card space-y-4 rounded-lg border p-6">
          <h2 className="mb-4 text-xl font-semibold">服薬情報</h2>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="medicationTaken"
              {...register("medicationTaken")}
              className="h-4 w-4"
            />
            <label htmlFor="medicationTaken" className="text-sm font-medium">
              服薬あり
            </label>
          </div>
          {medicationTaken && (
            <div>
              <label className="mb-2 block text-sm font-medium">服薬時間</label>
              <input
                type="time"
                {...register("medicationTime")}
                className="w-full rounded-md border px-3 py-2"
              />
            </div>
          )}
        </div>

        {/* 支援内容・利用者の様子 */}
        <div className="bg-card space-y-4 rounded-lg border p-6">
          <h2 className="mb-4 text-xl font-semibold">支援内容・利用者の様子</h2>

          <div>
            <label className="mb-2 block text-sm font-medium">支援内容</label>
            <textarea
              {...register("supportContent")}
              className="w-full rounded-md border px-3 py-2"
              rows={4}
              placeholder="支援中の具体的な内容、実施したこと"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              利用者の様子・状態
            </label>
            <textarea
              {...register("userCondition")}
              className="w-full rounded-md border px-3 py-2"
              rows={4}
              placeholder="利用者の気分、体調、反応など"
            />
          </div>
        </div>

        {/* 特記事項 */}
        <div className="bg-card rounded-lg border p-6">
          <h2 className="mb-4 text-xl font-semibold">特記事項</h2>
          <textarea
            {...register("notes")}
            className="w-full rounded-md border px-3 py-2"
            rows={4}
            placeholder="その他気になること、次回への申し送りなど"
          />
        </div>

        {/* 送信ボタン */}
        <div className="flex gap-4">
          <Button
            type="submit"
            size="lg"
            disabled={createMutation.isPending}
            className="flex-1"
          >
            {createMutation.isPending ? "登録中..." : "ガイド記録を登録"}
          </Button>
          <Link href={`/recipients/${recipientId}/guide`} className="flex-1">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full"
            >
              キャンセル
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
