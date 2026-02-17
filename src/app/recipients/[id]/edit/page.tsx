"use client";

import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

const SERVICE_TYPES = [
  { value: "HomeHelp", label: "居宅介護" },
  { value: "VisitingCare", label: "重度訪問介護" },
  { value: "BehaviorSupport", label: "行動援護" },
  { value: "MobilitySupport", label: "同行援護" },
  { value: "DayCare", label: "生活介護" },
  { value: "ShortStay", label: "短期入所" },
  { value: "GroupHome", label: "グループホーム（共同生活援助）" },
];

const ALLOWANCE_OPTIONS = [
  { value: "IntensiveBehaviorSupport", label: "強度行動障害支援加算" },
  { value: "EmergencySupport", label: "緊急時対応加算" },
  { value: "SpecialArea", label: "特定地域加算" },
  { value: "EarlyMorning", label: "早朝加算（6時〜8時）" },
  { value: "LateNight", label: "深夜加算（22時〜6時）" },
  { value: "DeafBlindSupport", label: "盲ろう者向け通訳・介助員加算" },
  { value: "IntensiveSupportAddition", label: "集中的支援加算" },
  { value: "VisitingCareLevel2", label: "重度訪問介護（重度障害者等包括支援）" },
];

function DisabilitySystemSection({ register }: { register: any }) {
  return (
    <>
      <div className="bg-card border rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold mb-1">障害者手帳</h2>
        <p className="text-sm text-muted-foreground mb-4">所持している手帳を選択してください</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border rounded-lg p-4 space-y-3">
            <label className="flex items-center gap-2 font-medium text-sm">
              <input type="checkbox" {...register("physicalHandicapBook")} className="rounded" />
              身体障害者手帳
            </label>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">等級</label>
              <select {...register("physicalHandicapGrade")} className="w-full px-2 py-1.5 border rounded text-sm">
                <option value="">未設定</option>
                <option value="1">1級（最重度）</option>
                <option value="2">2級</option>
                <option value="3">3級</option>
                <option value="4">4級</option>
                <option value="5">5級</option>
                <option value="6">6級</option>
              </select>
            </div>
          </div>
          <div className="border rounded-lg p-4 space-y-3">
            <label className="flex items-center gap-2 font-medium text-sm">
              <input type="checkbox" {...register("intellectualHandicapBook")} className="rounded" />
              療育手帳（愛の手帳等）
            </label>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">等級</label>
              <select {...register("intellectualHandicapGrade")} className="w-full px-2 py-1.5 border rounded text-sm">
                <option value="">未設定</option>
                <option value="A1">A1（最重度）</option>
                <option value="A2">A2（重度）</option>
                <option value="B1">B1（中度）</option>
                <option value="B2">B2（軽度）</option>
              </select>
            </div>
          </div>
          <div className="border rounded-lg p-4 space-y-3">
            <label className="flex items-center gap-2 font-medium text-sm">
              <input type="checkbox" {...register("mentalHandicapBook")} className="rounded" />
              精神障害者保健福祉手帳
            </label>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">等級</label>
              <select {...register("mentalHandicapGrade")} className="w-full px-2 py-1.5 border rounded text-sm">
                <option value="">未設定</option>
                <option value="1">1級（重度）</option>
                <option value="2">2級</option>
                <option value="3">3級</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold mb-1">障害年金・各種手当</h2>
        <p className="text-sm text-muted-foreground mb-4">受給している年金・手当を選択してください</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border rounded-lg p-4 space-y-3">
            <label className="flex items-center gap-2 font-medium text-sm">
              <input type="checkbox" {...register("disabilityPension")} className="rounded" />
              障害年金
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">等級</label>
                <select {...register("disabilityPensionGrade")} className="w-full px-2 py-1.5 border rounded text-sm">
                  <option value="">未設定</option>
                  <option value="1">1級（重度）</option>
                  <option value="2">2級</option>
                  <option value="3">3級（厚年のみ）</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">種別</label>
                <select {...register("disabilityPensionType")} className="w-full px-2 py-1.5 border rounded text-sm">
                  <option value="">未設定</option>
                  <option value="National">障害基礎年金</option>
                  <option value="Employee">障害厚生年金</option>
                </select>
              </div>
            </div>
          </div>
          <div className="border rounded-lg p-4 space-y-2">
            <p className="font-medium text-sm mb-2">各種手当（該当するものを選択）</p>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register("specialChildAllowance")} className="rounded" />
              <span>特別児童扶養手当 <span className="text-xs text-muted-foreground">（20歳未満）</span></span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register("disabilityAllowance")} className="rounded" />
              <span>障害児福祉手当 <span className="text-xs text-muted-foreground">（20歳未満・重度）</span></span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register("specialDisabilityAllowance")} className="rounded" />
              <span>特別障害者手当 <span className="text-xs text-muted-foreground">（20歳以上・重度在宅）</span></span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register("nursingAllowance")} className="rounded" />
              <span>その他給付金・手当</span>
            </label>
          </div>
        </div>
      </div>

      <div className="bg-card border rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold mb-1">精神科・発達障害関連</h2>
        <p className="text-sm text-muted-foreground mb-4">精神疾患・発達障害の診断・支援制度を記録します</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">精神科診断名</label>
            <input {...register("psychiatricDiagnosis")} className="w-full px-3 py-2 border rounded-md text-sm" placeholder="統合失調症、うつ病 等" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">発達障害診断名</label>
            <input {...register("developmentalDiagnosis")} className="w-full px-3 py-2 border rounded-md text-sm" placeholder="ASD、ADHD、LD等" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">自閉スペクトラム症の程度</label>
            <select {...register("autismSpectrumLevel")} className="w-full px-3 py-2 border rounded-md text-sm">
              <option value="">未設定</option>
              <option value="Level1">レベル1（サポートが必要）</option>
              <option value="Level2">レベル2（十分なサポートが必要）</option>
              <option value="Level3">レベル3（非常に十分なサポートが必要）</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">自立支援医療（精神通院）</label>
            <select {...register("medicalFeeExemption")} className="w-full px-3 py-2 border rounded-md text-sm">
              <option value="">未設定</option>
              <option value="None">未申請</option>
              <option value="Applied">申請中</option>
              <option value="Approved">受給中（自己負担1割）</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("outpatientMedication")} className="rounded" />
            精神科通院・服薬中
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("medicalProtectionAdmission")} className="rounded" />
            医療保護入院歴あり
          </label>
        </div>
      </div>

      <div className="bg-card border rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold mb-1">高齢障害者・介護保険</h2>
        <p className="text-sm text-muted-foreground mb-4">65歳以上の方は介護保険が優先適用されます。</p>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" {...register("isElderly")} className="rounded" />
          65歳以上（介護保険優先適用対象）
        </label>
        <div className="border-l-4 border-amber-400 pl-4 space-y-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("careInsuranceCertified")} className="rounded" />
            介護保険認定済み
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">要介護度</label>
              <select {...register("careInsuranceLevel")} className="w-full px-3 py-2 border rounded-md text-sm">
                <option value="">未設定</option>
                <option value="Support1">要支援1</option>
                <option value="Support2">要支援2</option>
                <option value="Care1">要介護1</option>
                <option value="Care2">要介護2</option>
                <option value="Care3">要介護3</option>
                <option value="Care4">要介護4</option>
                <option value="Care5">要介護5（最重度）</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">介護保険認定有効期限</label>
              <input type="date" {...register("careInsuranceExpiry")} className="w-full px-3 py-2 border rounded-md text-sm" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("continuedDisabilityService")} className="rounded" />
            <span>障害福祉サービスの継続利用（共生型・経過措置）<span className="block text-xs text-muted-foreground mt-0.5">※65歳前から継続利用の場合、市町村の判断により継続可能</span></span>
          </label>
        </div>
      </div>
    </>
  );
}

const recipientSchema = z.object({
  name: z.string().min(1, "氏名は必須です"),
  nameKana: z.string().optional(),
  birthDate: z.string().min(1, "生年月日は必須です"),
  gender: z.enum(["Male", "Female", "Other"]),
  disabilityType: z.array(z.enum(["Physical", "Intellectual", "Mental"])),
  supportLevel: z.coerce.number().int().min(1).max(6).optional().or(z.literal("")),
  emergencyContact: z.string().optional(),
  doctor: z.string().optional(),
  hospital: z.string().optional(),
  allergies: z.string().optional(),
  medicalHistory: z.string().optional(),
  notes: z.string().optional(),
  // サービス情報
  serviceTypes: z.array(z.string()).optional(),
  utilizationStatus: z.string().optional(),
  recipientNumber: z.string().optional(),
  receivedDate: z.string().optional(),
  validUntil: z.string().optional(),
  behaviorSupportNeeded: z.boolean().optional(),
  behaviorScore: z.coerce.number().int().optional().or(z.literal("")),
  allowances: z.array(z.string()).optional(),
  // 障害者手帳
  physicalHandicapBook: z.boolean().optional(),
  physicalHandicapGrade: z.string().optional(),
  intellectualHandicapBook: z.boolean().optional(),
  intellectualHandicapGrade: z.string().optional(),
  mentalHandicapBook: z.boolean().optional(),
  mentalHandicapGrade: z.string().optional(),
  // 手当・給付
  specialChildAllowance: z.boolean().optional(),
  disabilityAllowance: z.boolean().optional(),
  specialDisabilityAllowance: z.boolean().optional(),
  nursingAllowance: z.boolean().optional(),
  disabilityPension: z.boolean().optional(),
  disabilityPensionGrade: z.string().optional(),
  disabilityPensionType: z.string().optional(),
  // 精神科・発達障害
  psychiatricDiagnosis: z.string().optional(),
  developmentalDiagnosis: z.string().optional(),
  autismSpectrumLevel: z.string().optional(),
  medicalProtectionAdmission: z.boolean().optional(),
  outpatientMedication: z.boolean().optional(),
  medicalFeeExemption: z.string().optional(),
  // 高齢障害者
  isElderly: z.boolean().optional(),
  careInsuranceCertified: z.boolean().optional(),
  careInsuranceLevel: z.string().optional(),
  careInsuranceExpiry: z.string().optional(),
  continuedDisabilityService: z.boolean().optional(),
});

type RecipientFormData = z.infer<typeof recipientSchema>;

export default function EditRecipientPage() {
  const params = useParams();
  const router = useRouter();
  const recipientId = params.id as string;

  const { data: recipient, isLoading } = trpc.recipient.get.useQuery({
    id: recipientId,
  });

  const updateMutation = trpc.recipient.update.useMutation({
    onSuccess: () => {
      alert("利用者情報を更新しました");
      router.push(`/recipients/${recipientId}`);
    },
    onError: (error) => {
      alert(`更新に失敗しました: ${error.message}`);
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RecipientFormData>({
    resolver: zodResolver(recipientSchema) as any,
    defaultValues: {
      gender: "Male",
      disabilityType: [],
    },
  });

  // データが取得できたらフォームにセット
  useEffect(() => {
    if (recipient) {
      reset({
        name: recipient.name,
        nameKana: recipient.nameKana || "",
        birthDate: new Date(recipient.birthDate).toISOString().split("T")[0],
        gender: recipient.gender as "Male" | "Female" | "Other",
        disabilityType: recipient.disabilityType as Array<"Physical" | "Intellectual" | "Mental">,
        supportLevel: recipient.supportLevel || ("" as any),
        emergencyContact: recipient.emergencyContact || "",
        doctor: recipient.doctor || "",
        hospital: recipient.hospital || "",
        allergies: recipient.allergies || "",
        medicalHistory: recipient.medicalHistory || "",
        notes: recipient.notes || "",
        // サービス情報
        serviceTypes: (recipient as any).serviceTypes || [],
        utilizationStatus: (recipient as any).utilizationStatus || "",
        recipientNumber: (recipient as any).recipientNumber || "",
        receivedDate: (recipient as any).receivedDate
          ? new Date((recipient as any).receivedDate).toISOString().split("T")[0]
          : "",
        validUntil: (recipient as any).validUntil
          ? new Date((recipient as any).validUntil).toISOString().split("T")[0]
          : "",
        behaviorSupportNeeded: (recipient as any).behaviorSupportNeeded || false,
        behaviorScore: (recipient as any).behaviorScore || ("" as any),
        allowances: (recipient as any).allowances || [],
        // 障害者手帳
        physicalHandicapBook: (recipient as any).physicalHandicapBook || false,
        physicalHandicapGrade: (recipient as any).physicalHandicapGrade || "",
        intellectualHandicapBook: (recipient as any).intellectualHandicapBook || false,
        intellectualHandicapGrade: (recipient as any).intellectualHandicapGrade || "",
        mentalHandicapBook: (recipient as any).mentalHandicapBook || false,
        mentalHandicapGrade: (recipient as any).mentalHandicapGrade || "",
        // 手当・給付
        specialChildAllowance: (recipient as any).specialChildAllowance || false,
        disabilityAllowance: (recipient as any).disabilityAllowance || false,
        specialDisabilityAllowance: (recipient as any).specialDisabilityAllowance || false,
        nursingAllowance: (recipient as any).nursingAllowance || false,
        disabilityPension: (recipient as any).disabilityPension || false,
        disabilityPensionGrade: (recipient as any).disabilityPensionGrade || "",
        disabilityPensionType: (recipient as any).disabilityPensionType || "",
        // 精神科・発達障害
        psychiatricDiagnosis: (recipient as any).psychiatricDiagnosis || "",
        developmentalDiagnosis: (recipient as any).developmentalDiagnosis || "",
        autismSpectrumLevel: (recipient as any).autismSpectrumLevel || "",
        medicalProtectionAdmission: (recipient as any).medicalProtectionAdmission || false,
        outpatientMedication: (recipient as any).outpatientMedication || false,
        medicalFeeExemption: (recipient as any).medicalFeeExemption || "",
        // 高齢障害者
        isElderly: (recipient as any).isElderly || false,
        careInsuranceCertified: (recipient as any).careInsuranceCertified || false,
        careInsuranceLevel: (recipient as any).careInsuranceLevel || "",
        careInsuranceExpiry: (recipient as any).careInsuranceExpiry
          ? new Date((recipient as any).careInsuranceExpiry).toISOString().split("T")[0]
          : "",
        continuedDisabilityService: (recipient as any).continuedDisabilityService || false,
      });
    }
  }, [recipient, reset]);

  const onSubmit = async (data: RecipientFormData) => {
    try {
      await updateMutation.mutateAsync({
        id: recipientId,
        ...data,
        birthDate: new Date(data.birthDate),
        supportLevel: data.supportLevel ? Number(data.supportLevel) : undefined,
        serviceTypes: data.serviceTypes || [],
        allowances: data.allowances || [],
        receivedDate: data.receivedDate ? new Date(data.receivedDate) : undefined,
        validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
        behaviorScore: data.behaviorScore ? Number(data.behaviorScore) : undefined,
        careInsuranceExpiry: data.careInsuranceExpiry ? new Date(data.careInsuranceExpiry) : undefined,
      });
    } catch (error) {
      console.error("利用者更新エラー:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  if (!recipient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-destructive">利用者が見つかりません</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <Link href={`/recipients/${recipientId}`}>
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          利用者詳細に戻る
        </Button>
      </Link>

      <h1 className="text-3xl font-bold mb-2">利用者情報の編集</h1>
      <p className="text-muted-foreground mb-8">
        {recipient.name} さんの情報を編集します
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* 基本情報 */}
        <div className="bg-card border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold mb-4">基本情報</h2>

          <div>
            <label className="block text-sm font-medium mb-2">
              氏名 <span className="text-destructive">*</span>
            </label>
            <input
              {...register("name")}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="山田 太郎"
            />
            {errors.name && (
              <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">氏名（カナ）</label>
            <input
              {...register("nameKana")}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="ヤマダ タロウ"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              生年月日 <span className="text-destructive">*</span>
            </label>
            <input
              type="date"
              {...register("birthDate")}
              className="w-full px-3 py-2 border rounded-md"
            />
            {errors.birthDate && (
              <p className="text-sm text-destructive mt-1">
                {errors.birthDate.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              性別 <span className="text-destructive">*</span>
            </label>
            <select {...register("gender")} className="w-full px-3 py-2 border rounded-md">
              <option value="Male">男性</option>
              <option value="Female">女性</option>
              <option value="Other">その他</option>
            </select>
          </div>
        </div>

        {/* 障害情報 */}
        <div className="bg-card border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold mb-4">障害情報</h2>

          <div>
            <label className="block text-sm font-medium mb-2">障害種別</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  value="Physical"
                  {...register("disabilityType")}
                  className="mr-2"
                />
                身体障害
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  value="Intellectual"
                  {...register("disabilityType")}
                  className="mr-2"
                />
                知的障害
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  value="Mental"
                  {...register("disabilityType")}
                  className="mr-2"
                />
                精神障害
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">障害支援区分</label>
            <select
              {...register("supportLevel")}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">未設定</option>
              <option value="1">区分1</option>
              <option value="2">区分2</option>
              <option value="3">区分3</option>
              <option value="4">区分4</option>
              <option value="5">区分5</option>
              <option value="6">区分6</option>
            </select>
          </div>
        </div>

        {/* 連絡先・医療情報 */}
        <div className="bg-card border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold mb-4">連絡先・医療情報</h2>

          <div>
            <label className="block text-sm font-medium mb-2">緊急連絡先</label>
            <input
              {...register("emergencyContact")}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="090-1234-5678"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">主治医</label>
            <input
              {...register("doctor")}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="田中医師"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">医療機関</label>
            <input
              {...register("hospital")}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="○○総合病院"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              アレルギー情報
            </label>
            <textarea
              {...register("allergies")}
              className="w-full px-3 py-2 border rounded-md"
              rows={2}
              placeholder="食物アレルギー、薬剤アレルギーなど"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">既往歴</label>
            <textarea
              {...register("medicalHistory")}
              className="w-full px-3 py-2 border rounded-md"
              rows={4}
              placeholder="過去の病歴、手術歴など"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">備考</label>
            <textarea
              {...register("notes")}
              className="w-full px-3 py-2 border rounded-md"
              rows={4}
              placeholder="その他の特記事項"
            />
          </div>
        </div>

        {/* サービス情報 */}
        <div className="bg-card border rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold mb-4">サービス情報</h2>

          <div>
            <label className="block text-sm font-medium mb-2">利用サービス種別</label>
            <div className="grid grid-cols-2 gap-2">
              {SERVICE_TYPES.map((type) => (
                <label key={type.value} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    value={type.value}
                    {...register("serviceTypes")}
                    className="rounded"
                  />
                  {type.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">利用状況</label>
            <select
              {...register("utilizationStatus")}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">未設定</option>
              <option value="Home">在宅</option>
              <option value="Facility">入所施設</option>
              <option value="DayCare">通所</option>
              <option value="GroupHome">グループホーム</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">受給者番号</label>
              <input
                {...register("recipientNumber")}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="受給者証番号"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">受給者証交付日</label>
              <input
                type="date"
                {...register("receivedDate")}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">受給者証有効期限</label>
              <input
                type="date"
                {...register("validUntil")}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>

          <div className="border rounded-lg p-4 bg-red-50/50">
            <h3 className="text-sm font-semibold mb-3 text-red-800">行動援護・強度行動障害</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  {...register("behaviorSupportNeeded")}
                  className="rounded"
                />
                行動援護サービスが必要（行動障害スコア10点以上）
              </label>
              <div>
                <label className="block text-sm font-medium mb-1">
                  行動関連項目合計点数
                </label>
                <input
                  type="number"
                  {...register("behaviorScore")}
                  className="w-32 px-3 py-2 border rounded-md text-sm"
                  placeholder="0"
                  min="0"
                  max="100"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  ※10点以上で行動援護の対象となります
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">適用加算</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {ALLOWANCE_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    value={opt.value}
                    {...register("allowances")}
                    className="rounded"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* 制度情報 */}
        <DisabilitySystemSection register={register} />

        {/* 送信ボタン */}
        <div className="flex gap-4">
          <Button
            type="submit"
            size="lg"
            disabled={updateMutation.isPending}
            className="flex-1"
          >
            {updateMutation.isPending ? "更新中..." : "更新"}
          </Button>
          <Link href={`/recipients/${recipientId}`} className="flex-1">
            <Button type="button" variant="outline" size="lg" className="w-full">
              キャンセル
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
