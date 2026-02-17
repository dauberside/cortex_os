"use client";

import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const vpnSchema = z.object({
  measuredAt: z.string(),
  // V - Vital signs
  temperature: z.coerce.number().min(30).max(45).optional().or(z.literal("")),
  systolic: z.coerce.number().int().min(50).max(250).optional().or(z.literal("")),
  diastolic: z.coerce.number().int().min(30).max(150).optional().or(z.literal("")),
  pulse: z.coerce.number().int().min(30).max(200).optional().or(z.literal("")),
  spo2: z.coerce.number().int().min(50).max(100).optional().or(z.literal("")),
  weight: z.coerce.number().min(0).max(300).optional().or(z.literal("")),
  // P - Physical status
  consciousness: z.enum(["Clear", "Drowsy", "Stupor", "Coma", ""]).optional(),
  mobility: z.enum(["Independent", "Assisted", "Wheelchair", "Bedridden", ""]).optional(),
  skinCondition: z.enum(["Normal", "Dry", "Rash", "Wound", "Pressure", ""]).optional(),
  excretion: z.enum(["Normal", "Constipation", "Diarrhea", "Urinary", ""]).optional(),
  // N - Nutrition
  mealIntake: z.enum(["Full", "ThreeQuarters", "Half", "Quarter", "None", ""]).optional(),
  waterIntake: z.enum(["Adequate", "Insufficient", "Excessive", ""]).optional(),
  nutritionNote: z.string().optional(),
  notes: z.string().optional(),
});

type VPNFormData = z.infer<typeof vpnSchema>;

export default function NewVPNPage() {
  const params = useParams();
  const router = useRouter();
  const recipientId = params.id as string;

  const { data: recipient } = trpc.recipient.get.useQuery({ id: recipientId });
  const createMutation = trpc.vitalSign.create.useMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VPNFormData>({
    resolver: zodResolver(vpnSchema) as any,
    defaultValues: {
      measuredAt: new Date().toISOString().slice(0, 16),
      consciousness: "",
      mobility: "",
      skinCondition: "",
      excretion: "",
      mealIntake: "",
      waterIntake: "",
    },
  });

  const onSubmit = async (data: VPNFormData) => {
    try {
      await createMutation.mutateAsync({
        recipientId,
        measuredAt: new Date(data.measuredAt),
        temperature: data.temperature ? Number(data.temperature) : undefined,
        systolic: data.systolic ? Number(data.systolic) : undefined,
        diastolic: data.diastolic ? Number(data.diastolic) : undefined,
        pulse: data.pulse ? Number(data.pulse) : undefined,
        spo2: data.spo2 ? Number(data.spo2) : undefined,
        weight: data.weight ? Number(data.weight) : undefined,
        consciousness: data.consciousness || undefined,
        mobility: data.mobility || undefined,
        skinCondition: data.skinCondition || undefined,
        excretion: data.excretion || undefined,
        mealIntake: data.mealIntake || undefined,
        waterIntake: data.waterIntake || undefined,
        nutritionNote: data.nutritionNote,
        notes: data.notes,
      });
      router.push(`/recipients/${recipientId}/vpn`);
    } catch (error) {
      console.error("VPN記録エラー:", error);
      alert("VPN記録の登録に失敗しました");
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Link href={`/recipients/${recipientId}/vpn`}>
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          VPN記録一覧に戻る
        </Button>
      </Link>

      <h1 className="text-3xl font-bold mb-2">VPN記録登録</h1>
      {recipient && (
        <p className="text-muted-foreground mb-8">
          {recipient.name} さんのVPN記録を登録します
        </p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* 測定日時 */}
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">測定日時</h2>
          <div>
            <label className="block text-sm font-medium mb-2">
              測定日時 <span className="text-destructive">*</span>
            </label>
            <input
              type="datetime-local"
              {...register("measuredAt")}
              className="w-full px-3 py-2 border rounded-md"
            />
            {errors.measuredAt && (
              <p className="text-sm text-destructive mt-1">
                {errors.measuredAt.message}
              </p>
            )}
          </div>
        </div>

        {/* V - Vital signs（バイタルサイン） */}
        <div className="bg-card border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold mb-4">V - Vital signs（バイタルサイン）</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">体温（℃）</label>
              <input
                type="number"
                step="0.1"
                {...register("temperature")}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="36.5"
              />
              {errors.temperature && (
                <p className="text-sm text-destructive mt-1">
                  {errors.temperature.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">体重（kg）</label>
              <input
                type="number"
                step="0.1"
                {...register("weight")}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="60.0"
              />
              {errors.weight && (
                <p className="text-sm text-destructive mt-1">
                  {errors.weight.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                血圧（収縮期/mmHg）
              </label>
              <input
                type="number"
                {...register("systolic")}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="120"
              />
              {errors.systolic && (
                <p className="text-sm text-destructive mt-1">
                  {errors.systolic.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                血圧（拡張期/mmHg）
              </label>
              <input
                type="number"
                {...register("diastolic")}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="80"
              />
              {errors.diastolic && (
                <p className="text-sm text-destructive mt-1">
                  {errors.diastolic.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">脈拍（回/分）</label>
              <input
                type="number"
                {...register("pulse")}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="72"
              />
              {errors.pulse && (
                <p className="text-sm text-destructive mt-1">
                  {errors.pulse.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">SpO2（%）</label>
              <input
                type="number"
                {...register("spo2")}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="98"
              />
              {errors.spo2 && (
                <p className="text-sm text-destructive mt-1">
                  {errors.spo2.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* P - Physical status（身体状態） */}
        <div className="bg-card border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold mb-4">P - Physical status（身体状態）</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">意識レベル</label>
              <select
                {...register("consciousness")}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">選択してください</option>
                <option value="Clear">清明</option>
                <option value="Drowsy">傾眠</option>
                <option value="Stupor">昏迷</option>
                <option value="Coma">昏睡</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">移動能力</label>
              <select
                {...register("mobility")}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">選択してください</option>
                <option value="Independent">自立</option>
                <option value="Assisted">介助あり</option>
                <option value="Wheelchair">車椅子</option>
                <option value="Bedridden">寝たきり</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">皮膚状態</label>
              <select
                {...register("skinCondition")}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">選択してください</option>
                <option value="Normal">正常</option>
                <option value="Dry">乾燥</option>
                <option value="Rash">発疹</option>
                <option value="Wound">創傷</option>
                <option value="Pressure">褥瘡</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">排泄状態</label>
              <select
                {...register("excretion")}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">選択してください</option>
                <option value="Normal">正常</option>
                <option value="Constipation">便秘</option>
                <option value="Diarrhea">下痢</option>
                <option value="Urinary">尿失禁</option>
              </select>
            </div>
          </div>
        </div>

        {/* N - Nutrition（栄養状態） */}
        <div className="bg-card border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold mb-4">N - Nutrition（栄養状態）</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">食事摂取量</label>
              <select
                {...register("mealIntake")}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">選択してください</option>
                <option value="Full">全量摂取</option>
                <option value="ThreeQuarters">3/4摂取</option>
                <option value="Half">半量摂取</option>
                <option value="Quarter">1/4摂取</option>
                <option value="None">未摂取</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">水分摂取量</label>
              <select
                {...register("waterIntake")}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">選択してください</option>
                <option value="Adequate">適切</option>
                <option value="Insufficient">不足</option>
                <option value="Excessive">過剰</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              栄養に関する特記事項
            </label>
            <textarea
              {...register("nutritionNote")}
              className="w-full px-3 py-2 border rounded-md"
              rows={3}
              placeholder="食事内容、嗜好、アレルギー対応など"
            />
          </div>
        </div>

        {/* 備考 */}
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">備考</h2>
          <div>
            <label className="block text-sm font-medium mb-2">その他の特記事項</label>
            <textarea
              {...register("notes")}
              className="w-full px-3 py-2 border rounded-md"
              rows={4}
              placeholder="その他気になることなど"
            />
          </div>
        </div>

        {/* 送信ボタン */}
        <div className="flex gap-4">
          <Button
            type="submit"
            size="lg"
            disabled={createMutation.isPending}
            className="flex-1"
          >
            {createMutation.isPending ? "登録中..." : "VPN記録を登録"}
          </Button>
          <Link href={`/recipients/${recipientId}/vpn`} className="flex-1">
            <Button type="button" variant="outline" size="lg" className="w-full">
              キャンセル
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
