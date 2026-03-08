"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  ALLOWANCE_OPTIONS,
  CollapsibleSection,
  DisabilitySystemSection,
  getEnabledServiceTypes,
} from "@/components/recipients/RecipientFormComponents";
import {
  recipientSchema,
  type RecipientFormData,
} from "@/lib/validations/recipientSchema";
import {
  FormErrorSummary,
  FieldError,
} from "@/components/recipients/FormErrorDisplay";
import {
  PhoneInput,
  KanaInput,
} from "@/components/recipients/EnhancedFormInputs";
import { ImageUpload } from "@/components/recipients/ImageUpload";
import { calculateAge } from "@/lib/utils/age";
import { parseCSV, csvRowToRecipient } from "@/lib/csv";
import { ContactPolicySection } from "@/components/recipients/ContactPolicySection";
import { EmergencyContactsSection } from "@/components/recipients/EmergencyContactsSection";
import { FamilyMembersSection } from "@/components/recipients/FamilyMembersSection";
import { HistorySection } from "@/components/recipients/HistorySection";

export default function NewRecipientPage() {
  const router = useRouter();
  const createMutation = trpc.recipient.create.useMutation();
  const [csvError, setCsvError] = useState<string>("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<RecipientFormData>({
    resolver: zodResolver(recipientSchema) as any,
    defaultValues: {
      gender: "Male",
      disabilityType: [],
      emergencyRelation: "",
    },
  });

  const handleCSVUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCsvError("");
    try {
      const text = await file.text();
      const rows = parseCSV(text);

      if (rows.length === 0) {
        setCsvError("CSVファイルにデータが含まれていません");
        return;
      }

      // 最初の行のデータを使用
      const csvData = csvRowToRecipient(rows[0]);

      // フォームに値を設定
      reset({
        ...csvData,
        birthDate: csvData.birthDate
          ? csvData.birthDate.toISOString().split("T")[0]
          : "",
        receivedDate: csvData.receivedDate
          ? csvData.receivedDate.toISOString().split("T")[0]
          : undefined,
        validUntil: csvData.validUntil
          ? csvData.validUntil.toISOString().split("T")[0]
          : undefined,
        careInsuranceExpiry: csvData.careInsuranceExpiry
          ? csvData.careInsuranceExpiry.toISOString().split("T")[0]
          : undefined,
        disabilityType: csvData.disabilityType || [],
        serviceTypes: csvData.serviceTypes || [],
        allowances: csvData.allowances || [],
      } as any);

      alert("CSVファイルからデータを読み込みました");
    } catch (error) {
      console.error("CSV読み込みエラー:", error);
      setCsvError(
        error instanceof Error
          ? error.message
          : "CSVファイルの読み込みに失敗しました"
      );
    }
  };

  const onSubmit = async (data: RecipientFormData) => {
    console.log("Form data:", data);
    console.log("emergencyContact:", data.emergencyContact);
    console.log("emergencyRelation:", data.emergencyRelation);

    // walkingMinutesから数値のみを抽出（「徒歩8分」→「8」）
    let cleanedWalkingMinutes = data.walkingMinutes;
    if (cleanedWalkingMinutes) {
      const match = String(cleanedWalkingMinutes).match(/\d+/);
      cleanedWalkingMinutes = match ? match[0] : cleanedWalkingMinutes;
    }

    try {
      const result = await createMutation.mutateAsync({
        ...data,
        walkingMinutes: cleanedWalkingMinutes,
        birthDate: new Date(data.birthDate),
        supportLevel: data.supportLevel ? Number(data.supportLevel) : undefined,
        serviceTypes: data.serviceTypes || [],
        allowances: data.allowances || [],
        receivedDate: data.receivedDate
          ? new Date(data.receivedDate)
          : undefined,
        validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
        behaviorScore: data.behaviorScore
          ? Number(data.behaviorScore)
          : undefined,
        careInsuranceExpiry: data.careInsuranceExpiry
          ? new Date(data.careInsuranceExpiry)
          : undefined,
      });
      router.push(`/recipients/${result.id}`);
    } catch (error) {
      console.error("利用者登録エラー:", error);
      alert("利用者の登録に失敗しました");
    }
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Link href="/recipients">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          利用者一覧に戻る
        </Button>
      </Link>

      <h1 className="mb-2 text-3xl font-bold">新規利用者登録</h1>
      <p className="text-muted-foreground mb-8">
        新しい利用者の基本情報を入力してください
      </p>

      {/* CSVアップロード */}
      <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <Upload className="mt-0.5 h-5 w-5 text-blue-600" />
          <div className="flex-1">
            <h3 className="mb-2 font-semibold text-blue-900">
              CSVファイルから情報を読み込む
            </h3>
            <p className="mb-3 text-sm text-blue-800">
              利用者登録テンプレートCSVファイルをアップロードすると、フォームに自動入力されます。
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              className="block w-full cursor-pointer text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-700"
            />
            {csvError && (
              <p className="mt-2 text-sm text-red-600">{csvError}</p>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* エラーサマリー */}
        <FormErrorSummary errors={errors} />

        {/* 基本情報 */}
        <div className="bg-card space-y-4 rounded-lg border p-6">
          <h2 className="mb-4 text-xl font-semibold">基本情報</h2>

          {/* 写真アップロード */}
          <ImageUpload
            currentImageUrl={watch("photoUrl")}
            onImageUrlChange={(url) => setValue("photoUrl", url)}
          />

          <div>
            <label className="mb-2 block text-sm font-medium">
              氏名 <span className="text-destructive">*</span>
            </label>
            <input
              {...register("name")}
              className={`w-full rounded-md border px-3 py-2 ${errors.name ? "border-red-500" : ""}`}
              placeholder="山田 太郎"
            />
            <FieldError message={errors.name?.message} />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              氏名（カナ）
            </label>
            <KanaInput {...register("nameKana")} hasError={!!errors.nameKana} />
            <FieldError message={errors.nameKana?.message} />
            <p className="mt-1 text-xs text-gray-500">
              ※ひらがなで入力するとカタカナに自動変換されます
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              生年月日 <span className="text-destructive">*</span>
            </label>
            <input
              type="date"
              {...register("birthDate")}
              className={`w-full rounded-md border px-3 py-2 ${errors.birthDate ? "border-red-500" : ""}`}
            />
            <FieldError message={errors.birthDate?.message} />
            {watch("birthDate") && (
              <p className="mt-1 text-sm text-gray-600">
                現在{calculateAge(watch("birthDate"))}歳
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              性別 <span className="text-destructive">*</span>
            </label>
            <select
              {...register("gender")}
              className="w-full rounded-md border px-3 py-2"
            >
              <option value="Male">男性</option>
              <option value="Female">女性</option>
              <option value="Other">その他</option>
            </select>
          </div>

          {/* 緊急連絡先 */}
          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-amber-900">
              緊急連絡先（ご家族など）
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  電話番号
                </label>
                <PhoneInput
                  {...register("emergencyContact")}
                  hasError={!!errors.emergencyContact}
                />
                <FieldError message={errors.emergencyContact?.message} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">続柄</label>
                <select
                  value={watch("emergencyRelation") || ""}
                  onChange={(e) => {
                    console.log("続柄が変更されました:", e.target.value);
                    setValue("emergencyRelation", e.target.value);
                  }}
                  className={`w-full rounded-md border px-3 py-2 ${errors.emergencyRelation ? "border-red-500" : ""}`}
                >
                  <option value="">選択してください</option>
                  <option value="父">父</option>
                  <option value="母">母</option>
                  <option value="兄">兄</option>
                  <option value="姉">姉</option>
                  <option value="弟">弟</option>
                  <option value="妹">妹</option>
                  <option value="配偶者">配偶者</option>
                  <option value="祖父">祖父</option>
                  <option value="祖母">祖母</option>
                  <option value="その他">その他</option>
                </select>
                <FieldError message={errors.emergencyRelation?.message} />
                <p className="mt-1 text-xs text-gray-500">
                  現在の値: {watch("emergencyRelation") || "(未選択)"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 障害情報 */}
        <CollapsibleSection
          title="障害情報"
          description="障害種別・障害支援区分など、制度上の基本情報"
          defaultOpen
        >
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">障害種別</label>
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
              <label className="mb-2 block text-sm font-medium">
                障害支援区分
              </label>
              <select
                {...register("supportLevel")}
                className="w-full rounded-md border px-3 py-2"
              >
                <option value="">未設定</option>
                <option value="1">区分1（支援の必要の程度が比較的低い）</option>
                <option value="2">区分2</option>
                <option value="3">区分3</option>
                <option value="4">区分4</option>
                <option value="5">区分5</option>
                <option value="6">区分6（支援の必要の程度が最も高い）</option>
              </select>
              <p className="text-muted-foreground mt-2 text-xs">
                ※障害支援区分は、障害の多様な特性その他心身の状態に応じて必要とされる標準的な支援の度合いを総合的に示すものです。
                <br />
                ※知的障害・精神障害の方は、認定調査と医師意見書を基に審査会で判定されます。
              </p>
            </div>
          </div>
        </CollapsibleSection>

        {/* 医療情報 */}
        <CollapsibleSection
          title="医療情報"
          description="主治医・医療機関・既往歴など"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">主治医</label>
                <input
                  {...register("doctor")}
                  className="w-full rounded-md border px-3 py-2"
                  placeholder="田中医師"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  医療機関
                </label>
                <input
                  {...register("hospital")}
                  className="w-full rounded-md border px-3 py-2"
                  placeholder="○○総合病院"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                アレルギー情報
              </label>
              <textarea
                {...register("allergies")}
                className="w-full rounded-md border px-3 py-2"
                rows={2}
                placeholder="食物アレルギー、薬剤アレルギーなど"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">既往歴</label>
              <textarea
                {...register("medicalHistory")}
                className="w-full rounded-md border px-3 py-2"
                rows={3}
                placeholder="過去の病歴、手術歴など"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">備考</label>
              <textarea
                {...register("notes")}
                className="w-full rounded-md border px-3 py-2"
                rows={3}
                placeholder="その他の特記事項"
              />
            </div>
          </div>
        </CollapsibleSection>

        {/* サービス情報 */}
        <CollapsibleSection
          title="サービス情報"
          description="利用サービス・受給者証・加算など"
          defaultOpen
        >
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">
                利用サービス種別
              </label>
              <div className="grid grid-cols-2 gap-2">
                {getEnabledServiceTypes().map((type) => (
                  <label
                    key={type.value}
                    className="flex items-center gap-2 text-sm"
                  >
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
              <label className="mb-2 block text-sm font-medium">利用状況</label>
              <select
                {...register("utilizationStatus")}
                className="w-full rounded-md border px-3 py-2"
              >
                <option value="">未設定</option>
                <option value="Home">在宅</option>
                <option value="Facility">入所施設</option>
                <option value="DayCare">通所</option>
                <option value="GroupHome">グループホーム</option>
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  受給者番号
                </label>
                <input
                  {...register("recipientNumber")}
                  className="w-full rounded-md border px-3 py-2"
                  placeholder="受給者証番号"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">
                  受給者証交付日
                </label>
                <input
                  type="date"
                  {...register("receivedDate")}
                  className="w-full rounded-md border px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">
                  受給者証有効期限
                </label>
                <input
                  type="date"
                  {...register("validUntil")}
                  className="w-full rounded-md border px-3 py-2"
                />
              </div>
            </div>

            <div className="rounded-lg border bg-red-50/50 p-4">
              <h3 className="mb-3 text-sm font-semibold text-red-800">
                行動援護・強度行動障害
              </h3>
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
                  <label className="mb-1 block text-sm font-medium">
                    行動関連項目合計点数
                  </label>
                  <input
                    type="number"
                    {...register("behaviorScore")}
                    className="w-32 rounded-md border px-3 py-2 text-sm"
                    placeholder="0"
                    min="0"
                    max="100"
                  />
                  <p className="text-muted-foreground mt-1 text-xs">
                    ※10点以上で行動援護の対象となります
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">適用加算</label>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {ALLOWANCE_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-2 text-sm"
                  >
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
        </CollapsibleSection>

        {/* 制度情報 */}
        <CollapsibleSection
          title="制度情報（手帳・年金/手当・精神科/発達・介護保険）"
          description="手帳の等級、年金・各種手当、診断名、65歳以上の介護保険など"
        >
          <div className="space-y-6">
            <DisabilitySystemSection register={register} />
          </div>
        </CollapsibleSection>

        {/* サポート基本情報票の追加項目 */}
        <CollapsibleSection
          title="サポート基本情報票（追加項目）"
          description="基本情報票に合わせた追加情報（住所・GH・運用ルールなど）"
        >
          <div className="space-y-4">
            {/* 通所先 */}
            <div>
              <label className="mb-1 block text-sm font-medium">
                通所（学）先
              </label>
              <input
                type="text"
                {...register("school")}
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>

            {/* 手帳情報の参照 */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm text-blue-900">
                <strong>📖 手帳情報について</strong>
                <br />
                手帳の種別・等級は上記「制度情報（手帳・年金/手当・精神科/発達・介護保険）」セクションに入力してください。
                <br />
                身体障害者手帳、療育手帳、精神障害者保健福祉手帳の3種類に対応しています。
              </p>
            </div>

            {/* 住所・連絡先 */}
            <div>
              <label className="mb-1 block text-sm font-medium">自宅住所</label>
              <input
                type="text"
                {...register("homeAddress")}
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  自宅電話
                </label>
                <PhoneInput
                  {...register("homePhone")}
                  hasError={!!errors.homePhone}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  <div className="mb-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      {...register("hasMobilePhone")}
                      className="rounded"
                    />
                    本人携帯あり
                  </div>
                </label>
                {watch("hasMobilePhone") && (
                  <PhoneInput
                    {...register("mobilePhone")}
                    hasError={!!errors.mobilePhone}
                    placeholder="090-1234-5678"
                  />
                )}
                <FieldError message={errors.mobilePhone?.message} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  最寄り駅
                </label>
                <input
                  type="text"
                  {...register("nearestStation")}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  徒歩分数
                </label>
                <input
                  type="text"
                  {...register("walkingMinutes")}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  placeholder="例: 10"
                />
              </div>
            </div>

            {/* GH情報 */}
            <div className="border-t pt-4">
              <h3 className="mb-3 text-base font-semibold">
                GH（グループホーム）情報
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    生活形態
                  </label>
                  <select
                    {...register("livingType")}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                  >
                    <option value="">未設定</option>
                    <option value="家族と同居">家族と同居</option>
                    <option value="一人暮らし">一人暮らし</option>
                    <option value="GH入居">GH入居</option>
                    <option value="入所施設">入所施設</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    GH名称
                  </label>
                  <input
                    type="text"
                    {...register("ghName")}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    GH住所
                  </label>
                  <input
                    type="text"
                    {...register("ghAddress")}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      GH電話
                    </label>
                    <PhoneInput
                      {...register("ghPhone")}
                      hasError={!!errors.ghPhone}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      GH法人名
                    </label>
                    <input
                      type="text"
                      {...register("ghCorporation")}
                      className="w-full rounded-md border px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    GHアクセス
                  </label>
                  <input
                    type="text"
                    {...register("ghAccess")}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* 運用ルール */}
            <div className="border-t pt-4">
              <h3 className="mb-3 text-base font-semibold">運用ルール</h3>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    前日確認の特記
                  </label>
                  <textarea
                    {...register("priorConfirmationNote")}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      {...register("hasRecordNote")}
                      className="rounded"
                    />
                    ノート（記録）あり
                  </label>
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      {...register("hasToeiPass")}
                      className="rounded"
                    />
                    都営乗車券等あり
                  </label>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    ガイドのお財布特記
                  </label>
                  <textarea
                    {...register("walletNote")}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <input
                        type="checkbox"
                        {...register("cafeBreak")}
                        className="rounded"
                      />
                      休憩時の喫茶入店を希望する
                    </label>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      喫茶条件
                    </label>
                    <input
                      type="text"
                      {...register("cafeCondition")}
                      className="w-full rounded-md border px-3 py-2 text-sm"
                      placeholder="例: 300円以内"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      電車割引種別
                    </label>
                    <input
                      type="text"
                      {...register("trainDiscountType")}
                      className="w-full rounded-md border px-3 py-2 text-sm"
                      placeholder="例: 1種/2種"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      {...register("hasRestrictionConsent")}
                      className="rounded"
                    />
                    行動制限の同意書あり
                  </label>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      計画相談事業所
                    </label>
                    <input
                      type="text"
                      {...register("planConsultationOffice")}
                      className="w-full rounded-md border px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      担当者名
                    </label>
                    <input
                      type="text"
                      {...register("planConsultant")}
                      className="w-full rounded-md border px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* アセスメント・支援上の留意点 */}
        <CollapsibleSection
          title="アセスメント・支援上の留意点"
          description="健康・服薬、食事、排泄、移動、コミュニケーション等"
          defaultOpen={false}
        >
          <div className="space-y-4">
            {/* 健康・服薬 */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold">健康・服薬</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    障害名
                  </label>
                  <input
                    type="text"
                    {...register("disabilityName")}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      {...register("hasSeizures")}
                      className="rounded"
                    />
                    発作あり
                  </label>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  疾病状況
                </label>
                <textarea
                  {...register("diseaseStatus")}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    発作頻度
                  </label>
                  <input
                    type="text"
                    {...register("seizureFrequency")}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    発作対処方法
                  </label>
                  <input
                    type="text"
                    {...register("seizureResponse")}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  服薬（朝/昼/夕/就寝前など、1行ずつ）
                </label>
                <textarea
                  {...register("medication")}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  rows={4}
                  placeholder="1行ずつ入力してください"
                />
              </div>
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    {...register("hasPrnMedication")}
                    className="rounded"
                  />
                  頓服あり
                </label>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    頓服服薬方法
                  </label>
                  <textarea
                    {...register("prnMedicationMethod")}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    rows={2}
                    placeholder="頓服の服用タイミングや方法を入力"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    {...register("hasSeasonalMedication")}
                    className="rounded"
                  />
                  季節薬あり
                </label>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    季節薬内容
                  </label>
                  <textarea
                    {...register("seasonalMedicationContent")}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    rows={2}
                    placeholder="季節薬の種類や使用時期を入力"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  健康・服薬の留意点
                </label>
                <textarea
                  {...register("healthNote")}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  rows={3}
                />
              </div>
            </div>

            {/* 食事 */}
            <div className="space-y-3 border-t pt-4">
              <h3 className="text-base font-semibold">食事</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    好きなもの
                  </label>
                  <textarea
                    {...register("favoriteFoods")}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    嫌いなもの
                  </label>
                  <textarea
                    {...register("dislikedFoods")}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    rows={2}
                  />
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    {...register("hasAllergy")}
                    className="rounded"
                  />
                  アレルギーあり（要注意）
                </label>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  アレルギー詳細
                </label>
                <textarea
                  {...register("allergyNote")}
                  className="w-full rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    メニューの選び方
                  </label>
                  <input
                    type="text"
                    {...register("menuSelectionMethod")}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    食事形態
                  </label>
                  <input
                    type="text"
                    {...register("eatingStyle")}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    placeholder="例: はし/スプーン"
                  />
                </div>
              </div>
            </div>

            {/* 排泄・移動・コミュニケーション */}
            <div className="space-y-3 border-t pt-4">
              <h3 className="text-base font-semibold">排泄</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    サイン・頻度
                  </label>
                  <input
                    type="text"
                    {...register("toiletSign")}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">頻度</label>
                  <input
                    type="text"
                    {...register("toiletFrequency")}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  介助方法
                </label>
                <textarea
                  {...register("toiletAssistMethod")}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  rows={2}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">留意点</label>
                <textarea
                  {...register("toiletNote")}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  rows={2}
                />
              </div>
            </div>

            <div className="space-y-3 border-t pt-4">
              <h3 className="text-base font-semibold">移動</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">手段</label>
                  <input
                    type="text"
                    {...register("mobilityMethod")}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    介助方法
                  </label>
                  <input
                    type="text"
                    {...register("mobilityAssist")}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">留意点</label>
                <textarea
                  {...register("mobilityNote")}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  rows={2}
                />
              </div>
            </div>

            <div className="space-y-3 border-t pt-4">
              <h3 className="text-base font-semibold">コミュニケーション</h3>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  会話・発語
                </label>
                <textarea
                  {...register("commVerbal")}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  rows={2}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  ジェスチャー
                </label>
                <textarea
                  {...register("commGesture")}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  rows={2}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  表情での表現
                </label>
                <textarea
                  {...register("commExpression")}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    要求の表現
                  </label>
                  <textarea
                    {...register("commRequest")}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    拒否の表現
                  </label>
                  <textarea
                    {...register("commRefusal")}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    rows={2}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">留意点</label>
                <textarea
                  {...register("commNote")}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  rows={2}
                />
              </div>
            </div>

            {/* こだわり・安全・その他 */}
            <div className="space-y-3 border-t pt-4">
              <h3 className="text-base font-semibold">こだわり等</h3>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  {...register("hasObsession")}
                  className="rounded"
                />
                こだわりあり
              </label>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">状況</label>
                  <textarea
                    {...register("obsessionSituation")}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">対応</label>
                  <textarea
                    {...register("obsessionResponse")}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 border-t pt-4">
              <h3 className="text-base font-semibold">安全・行動</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    {...register("hasSelfHarm")}
                    className="rounded"
                  />
                  自傷あり
                </label>
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    {...register("hasHarmToOthers")}
                    className="rounded"
                  />
                  他害あり
                </label>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  安全に関する留意点
                </label>
                <textarea
                  {...register("safetyNote")}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  rows={2}
                />
              </div>
            </div>

            <div className="space-y-3 border-t pt-4">
              <h3 className="text-base font-semibold">その他</h3>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  趣味・好きなこと
                </label>
                <textarea
                  {...register("hobbies")}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  rows={2}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  その他、注意点
                </label>
                <textarea
                  {...register("otherNotes")}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  rows={3}
                />
              </div>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  {...register("hasPastIncidents")}
                  className="rounded"
                />
                過去のサポートでのパニック・事故等あり
              </label>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  過去のインシデント詳細
                </label>
                <textarea
                  {...register("pastIncidentsNote")}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  rows={2}
                />
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* 性格・関わり方 */}
        <CollapsibleSection
          title="性格・関わり方のワンポイント"
          description="関わり方のコツや注意点"
          defaultOpen={false}
        >
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">性格</label>
              <textarea
                {...register("personalityNote")}
                className="w-full rounded-md border px-3 py-2 text-sm"
                rows={4}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">関わり方</label>
              <textarea
                {...register("interactionNote")}
                className="w-full rounded-md border px-3 py-2 text-sm"
                rows={4}
              />
            </div>
          </div>
        </CollapsibleSection>

        {/* 連絡ルール */}
        <CollapsibleSection
          title="連絡ルール・緊急連絡先"
          description="支援時の連絡方法、緊急連絡先の登録"
          defaultOpen={false}
        >
          <div className="space-y-6">
            <ContactPolicySection
              register={register}
              watch={watch}
              setValue={setValue}
            />
            <hr className="my-6" />
            <EmergencyContactsSection watch={watch} setValue={setValue} />
          </div>
        </CollapsibleSection>

        {/* 家族構成 */}
        <CollapsibleSection
          title="家族構成"
          description="ご家族の情報を登録"
          defaultOpen={false}
        >
          <FamilyMembersSection watch={watch} setValue={setValue} />
        </CollapsibleSection>

        {/* 生活歴・通院情報 */}
        <CollapsibleSection
          title="生活歴・通院情報"
          description="これまでの経緯や通院先の記録"
          defaultOpen={false}
        >
          <HistorySection register={register} />
        </CollapsibleSection>

        {/* 外出の主な傾向 */}
        <CollapsibleSection
          title="外出の主な傾向"
          description="依頼パターン、グループプラン、定番外出先など"
          defaultOpen={false}
        >
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                外出先の依頼パターン
              </label>
              <input
                type="text"
                {...register("outingRequestPattern")}
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="例: 毎月利用/グループプラン/特定の場所/おまかせ/不定期"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                グループプラン発着
              </label>
              <input
                type="text"
                {...register("outingGroupPlanDeparture")}
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="例: 自宅発着/GH発着/事業所発着"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                グループプラン特記
              </label>
              <textarea
                {...register("outingGroupPlanNote")}
                className="w-full rounded-md border px-3 py-2 text-sm"
                rows={2}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                特定の外出依頼内容①
              </label>
              <textarea
                {...register("outingSpecificRequest1")}
                className="w-full rounded-md border px-3 py-2 text-sm"
                rows={2}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                特定の外出依頼内容②
              </label>
              <textarea
                {...register("outingSpecificRequest2")}
                className="w-full rounded-md border px-3 py-2 text-sm"
                rows={2}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                おまかせの人の行先
              </label>
              <textarea
                {...register("outingCasualDestination")}
                className="w-full rounded-md border px-3 py-2 text-sm"
                rows={2}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">不定期</label>
              <textarea
                {...register("outingIrregularNote")}
                className="w-full rounded-md border px-3 py-2 text-sm"
                rows={2}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                その他 特記事項
              </label>
              <textarea
                {...register("outingOtherNote")}
                className="w-full rounded-md border px-3 py-2 text-sm"
                rows={3}
              />
            </div>
          </div>
        </CollapsibleSection>

        {/* 送信ボタン */}
        <div className="flex gap-4">
          <Button
            type="submit"
            size="lg"
            disabled={createMutation.isPending}
            className="flex-1"
          >
            {createMutation.isPending ? "登録中..." : "利用者を登録"}
          </Button>
          <Link href="/recipients" className="flex-1">
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
