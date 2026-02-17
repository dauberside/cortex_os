"use client";

import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Upload, Download } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";

const assessmentSchema = z.object({
  // ADL
  adlMovement: z
    .enum(["Independent", "Assisted", "Wheelchair", "Bedridden", ""])
    .optional(),
  adlEating: z.enum(["Independent", "Partial", "Full", ""]).optional(),
  adlToilet: z.enum(["Independent", "Partial", "Full", ""]).optional(),
  adlBathing: z.enum(["Independent", "Partial", "Full", ""]).optional(),
  adlDressing: z.enum(["Independent", "Partial", "Full", ""]).optional(),
  adlGrooming: z.enum(["Independent", "Partial", "Full", ""]).optional(),
  // コミュニケーション
  commMethod: z.string().optional(),
  commVision: z.enum(["Normal", "Weak", "Blind", ""]).optional(),
  commHearing: z.enum(["Normal", "Weak", "Deaf", ""]).optional(),
  commSpeech: z.enum(["Normal", "Difficult", "None", ""]).optional(),
  // 行動特性
  lifeRhythm: z.string().optional(),
  hobbies: z.string().optional(),
  personality: z.string().optional(),
  // 注意事項
  cautions: z.string().optional(),
  emergencyNote: z.string().optional(),
  // 服薬情報詳細
  medicationDetails: z.string().optional(),
  // その他
  familyStructure: z.string().optional(),
  supportSystem: z.string().optional(),
});

type AssessmentFormData = z.infer<typeof assessmentSchema>;

export default function AssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const recipientId = params.id as string;
  const utils = trpc.useUtils();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: recipient } = trpc.recipient.get.useQuery({ id: recipientId });
  const { data: assessment, isLoading } = trpc.assessment.get.useQuery({
    recipientId,
  });

  const exportMutation = trpc.recipient.exportCSV.useQuery(undefined, {
    enabled: false,
  });

  const upsertMutation = trpc.assessment.upsert.useMutation({
    onSuccess: () => {
      alert("アセスメント情報を保存しました");
      utils.assessment.get.invalidate({ recipientId });
    },
    onError: (error) => {
      alert(`保存に失敗しました: ${error.message}`);
    },
  });

  const handleExportTemplate = async () => {
    try {
      const result = await exportMutation.refetch();
      if (result.data) {
        const blob = new Blob([result.data.content], {
          type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = result.data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      alert("テンプレートのダウンロードに失敗しました");
      console.error(error);
    }
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AssessmentFormData>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: {
      adlMovement: "",
      adlEating: "",
      adlToilet: "",
      adlBathing: "",
      adlDressing: "",
      adlGrooming: "",
      commVision: "",
      commHearing: "",
      commSpeech: "",
    },
  });

  // アセスメントデータが取得できたらフォームにセット
  useEffect(() => {
    if (assessment) {
      reset({
        adlMovement: (assessment.adlMovement as any) || "",
        adlEating: (assessment.adlEating as any) || "",
        adlToilet: (assessment.adlToilet as any) || "",
        adlBathing: (assessment.adlBathing as any) || "",
        adlDressing: (assessment.adlDressing as any) || "",
        adlGrooming: (assessment.adlGrooming as any) || "",
        commMethod: assessment.commMethod || "",
        commVision: (assessment.commVision as any) || "",
        commHearing: (assessment.commHearing as any) || "",
        commSpeech: (assessment.commSpeech as any) || "",
        lifeRhythm: assessment.lifeRhythm || "",
        hobbies: assessment.hobbies || "",
        personality: assessment.personality || "",
        cautions: assessment.cautions || "",
        emergencyNote: assessment.emergencyNote || "",
        medicationDetails: assessment.medicationDetails || "",
        familyStructure: assessment.familyStructure || "",
        supportSystem: assessment.supportSystem || "",
      });
    }
  }, [assessment, reset]);

  const onSubmit = async (data: AssessmentFormData) => {
    try {
      await upsertMutation.mutateAsync({
        recipientId,
        ...data,
      });
    } catch (error) {
      console.error("アセスメント保存エラー:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Link href={`/recipients/${recipientId}`}>
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          利用者詳細に戻る
        </Button>
      </Link>

      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold">アセスメント情報</h1>
          {recipient && (
            <p className="text-muted-foreground">
              {recipient.name} さんのアセスメント情報
            </p>
          )}
        </div>
        <Button
          variant="outline"
          onClick={handleExportTemplate}
          disabled={exportMutation.isFetching}
        >
          <Download className="mr-2 h-4 w-4" />
          CSVテンプレート
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* ADL（日常生活動作） */}
        <div className="bg-card space-y-4 rounded-lg border p-6">
          <h2 className="mb-4 text-xl font-semibold">ADL（日常生活動作）</h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">移動</label>
              <select
                {...register("adlMovement")}
                className="w-full rounded-md border px-3 py-2"
              >
                <option value="">未設定</option>
                <option value="Independent">自立</option>
                <option value="Assisted">介助あり</option>
                <option value="Wheelchair">車椅子</option>
                <option value="Bedridden">寝たきり</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">食事</label>
              <select
                {...register("adlEating")}
                className="w-full rounded-md border px-3 py-2"
              >
                <option value="">未設定</option>
                <option value="Independent">自立</option>
                <option value="Partial">一部介助</option>
                <option value="Full">全介助</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">排泄</label>
              <select
                {...register("adlToilet")}
                className="w-full rounded-md border px-3 py-2"
              >
                <option value="">未設定</option>
                <option value="Independent">自立</option>
                <option value="Partial">一部介助</option>
                <option value="Full">全介助</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">入浴</label>
              <select
                {...register("adlBathing")}
                className="w-full rounded-md border px-3 py-2"
              >
                <option value="">未設定</option>
                <option value="Independent">自立</option>
                <option value="Partial">一部介助</option>
                <option value="Full">全介助</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">更衣</label>
              <select
                {...register("adlDressing")}
                className="w-full rounded-md border px-3 py-2"
              >
                <option value="">未設定</option>
                <option value="Independent">自立</option>
                <option value="Partial">一部介助</option>
                <option value="Full">全介助</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">整容</label>
              <select
                {...register("adlGrooming")}
                className="w-full rounded-md border px-3 py-2"
              >
                <option value="">未設定</option>
                <option value="Independent">自立</option>
                <option value="Partial">一部介助</option>
                <option value="Full">全介助</option>
              </select>
            </div>
          </div>
        </div>

        {/* コミュニケーション */}
        <div className="bg-card space-y-4 rounded-lg border p-6">
          <h2 className="mb-4 text-xl font-semibold">コミュニケーション</h2>

          <div>
            <label className="mb-2 block text-sm font-medium">
              意思疎通の方法
            </label>
            <textarea
              {...register("commMethod")}
              className="w-full rounded-md border px-3 py-2"
              rows={3}
              placeholder="言葉、ジェスチャー、文字盤など"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium">視覚</label>
              <select
                {...register("commVision")}
                className="w-full rounded-md border px-3 py-2"
              >
                <option value="">未設定</option>
                <option value="Normal">正常</option>
                <option value="Weak">弱視</option>
                <option value="Blind">全盲</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">聴覚</label>
              <select
                {...register("commHearing")}
                className="w-full rounded-md border px-3 py-2"
              >
                <option value="">未設定</option>
                <option value="Normal">正常</option>
                <option value="Weak">難聴</option>
                <option value="Deaf">全聾</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">発語</label>
              <select
                {...register("commSpeech")}
                className="w-full rounded-md border px-3 py-2"
              >
                <option value="">未設定</option>
                <option value="Normal">可能</option>
                <option value="Difficult">困難</option>
                <option value="None">不可</option>
              </select>
            </div>
          </div>
        </div>

        {/* 行動特性 */}
        <div className="bg-card space-y-4 rounded-lg border p-6">
          <h2 className="mb-4 text-xl font-semibold">行動特性</h2>

          <div>
            <label className="mb-2 block text-sm font-medium">生活リズム</label>
            <textarea
              {...register("lifeRhythm")}
              className="w-full rounded-md border px-3 py-2"
              rows={3}
              placeholder="起床・就寝時間、日中の過ごし方など"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">趣味・嗜好</label>
            <textarea
              {...register("hobbies")}
              className="w-full rounded-md border px-3 py-2"
              rows={3}
              placeholder="好きなこと、得意なこと、楽しみなど"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">性格・特徴</label>
            <textarea
              {...register("personality")}
              className="w-full rounded-md border px-3 py-2"
              rows={3}
              placeholder="性格、行動の特徴など"
            />
          </div>
        </div>

        {/* 医療・服薬情報 */}
        <div className="bg-card space-y-4 rounded-lg border p-6">
          <h2 className="mb-4 text-xl font-semibold">医療・服薬情報</h2>

          <div>
            <label className="mb-2 block text-sm font-medium">
              服薬内容詳細
            </label>
            <textarea
              {...register("medicationDetails")}
              className="w-full rounded-md border px-3 py-2"
              rows={4}
              placeholder="定期薬、頓服薬の詳細"
            />
          </div>
        </div>

        {/* 注意事項 */}
        <div className="bg-card space-y-4 rounded-lg border p-6">
          <h2 className="mb-4 text-xl font-semibold">注意事項</h2>

          <div>
            <label className="mb-2 block text-sm font-medium">
              特記事項・注意事項
            </label>
            <textarea
              {...register("cautions")}
              className="w-full rounded-md border px-3 py-2"
              rows={4}
              placeholder="支援時の注意点、配慮事項など"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">緊急時対応</label>
            <textarea
              {...register("emergencyNote")}
              className="w-full rounded-md border px-3 py-2"
              rows={4}
              placeholder="緊急時の対応方法、連絡先など"
            />
          </div>
        </div>

        {/* その他 */}
        <div className="bg-card space-y-4 rounded-lg border p-6">
          <h2 className="mb-4 text-xl font-semibold">その他</h2>

          <div>
            <label className="mb-2 block text-sm font-medium">家族構成</label>
            <textarea
              {...register("familyStructure")}
              className="w-full rounded-md border px-3 py-2"
              rows={3}
              placeholder="家族関係、同居状況など"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">支援体制</label>
            <textarea
              {...register("supportSystem")}
              className="w-full rounded-md border px-3 py-2"
              rows={3}
              placeholder="ケアマネージャー、サービス事業所など"
            />
          </div>
        </div>

        {/* 保存ボタン */}
        <div className="flex gap-4">
          <Button
            type="submit"
            size="lg"
            disabled={upsertMutation.isPending}
            className="flex-1"
          >
            <Save className="mr-2 h-4 w-4" />
            {upsertMutation.isPending ? "保存中..." : "保存"}
          </Button>
          <Link href={`/recipients/${recipientId}`} className="flex-1">
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
