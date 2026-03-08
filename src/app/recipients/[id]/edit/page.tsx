"use client";

import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import {
  ALLOWANCE_OPTIONS,
  DisabilitySystemSection,
  CollapsibleSection,
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
import { ContactPolicySection } from "@/components/recipients/ContactPolicySection";
import { EmergencyContactsSection } from "@/components/recipients/EmergencyContactsSection";
import { FamilyMembersSection } from "@/components/recipients/FamilyMembersSection";
import { HistorySection } from "@/components/recipients/HistorySection";

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
    watch,
    setValue,
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
        disabilityType: recipient.disabilityType as Array<
          "Physical" | "Intellectual" | "Mental"
        >,
        supportLevel: recipient.supportLevel || ("" as any),
        emergencyContact: recipient.emergencyContact || "",
        emergencyRelation: recipient.emergencyRelation || "",
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
          ? new Date((recipient as any).receivedDate)
              .toISOString()
              .split("T")[0]
          : "",
        validUntil: (recipient as any).validUntil
          ? new Date((recipient as any).validUntil).toISOString().split("T")[0]
          : "",
        behaviorSupportNeeded:
          (recipient as any).behaviorSupportNeeded || false,
        behaviorScore: (recipient as any).behaviorScore || ("" as any),
        allowances: (recipient as any).allowances || [],
        // 障害者手帳
        physicalHandicapBook: (recipient as any).physicalHandicapBook || false,
        physicalHandicapGrade: (recipient as any).physicalHandicapGrade || "",
        intellectualHandicapBook:
          (recipient as any).intellectualHandicapBook || false,
        intellectualHandicapGrade:
          (recipient as any).intellectualHandicapGrade || "",
        mentalHandicapBook: (recipient as any).mentalHandicapBook || false,
        mentalHandicapGrade: (recipient as any).mentalHandicapGrade || "",
        // 手当・給付
        specialChildAllowance:
          (recipient as any).specialChildAllowance || false,
        disabilityAllowance: (recipient as any).disabilityAllowance || false,
        specialDisabilityAllowance:
          (recipient as any).specialDisabilityAllowance || false,
        nursingAllowance: (recipient as any).nursingAllowance || false,
        disabilityPension: (recipient as any).disabilityPension || false,
        disabilityPensionGrade: (recipient as any).disabilityPensionGrade || "",
        disabilityPensionType: (recipient as any).disabilityPensionType || "",
        // 精神科・発達障害
        psychiatricDiagnosis: (recipient as any).psychiatricDiagnosis || "",
        developmentalDiagnosis: (recipient as any).developmentalDiagnosis || "",
        autismSpectrumLevel: (recipient as any).autismSpectrumLevel || "",
        medicalProtectionAdmission:
          (recipient as any).medicalProtectionAdmission || false,
        outpatientMedication: (recipient as any).outpatientMedication || false,
        medicalFeeExemption: (recipient as any).medicalFeeExemption || "",
        // 高齢障害者
        isElderly: (recipient as any).isElderly || false,
        careInsuranceCertified:
          (recipient as any).careInsuranceCertified || false,
        careInsuranceLevel: (recipient as any).careInsuranceLevel || "",
        careInsuranceExpiry: (recipient as any).careInsuranceExpiry
          ? new Date((recipient as any).careInsuranceExpiry)
              .toISOString()
              .split("T")[0]
          : "",
        continuedDisabilityService:
          (recipient as any).continuedDisabilityService || false,
        // サポート基本情報票
        photoUrl: (recipient as any).photoUrl || "",
        // 書類ヘッダー情報
        organizationName: (recipient as any).organizationName || "",
        documentHeaderGroupHomeName:
          (recipient as any).documentHeaderGroupHomeName || "",
        serviceManagerName: (recipient as any).serviceManagerName || "",
        school: (recipient as any).school || "",
        handbookType: (recipient as any).handbookType || "",
        handbookGrade: (recipient as any).handbookGrade || "",
        homeAddress: (recipient as any).homeAddress || "",
        homePhone: (recipient as any).homePhone || "",
        nearestStation: (recipient as any).nearestStation || "",
        walkingMinutes: (recipient as any).walkingMinutes || "",
        hasMobilePhone: (recipient as any).hasMobilePhone || false,
        mobilePhone: (recipient as any).mobilePhone || "",
        // GH情報
        livingType: (recipient as any).livingType || "",
        ghName: (recipient as any).ghName || "",
        ghAddress: (recipient as any).ghAddress || "",
        ghPhone: (recipient as any).ghPhone || "",
        ghCorporation: (recipient as any).ghCorporation || "",
        ghAccess: (recipient as any).ghAccess || "",
        // 運用ルール
        priorConfirmationNote: (recipient as any).priorConfirmationNote || "",
        hasRecordNote: (recipient as any).hasRecordNote || false,
        walletNote: (recipient as any).walletNote || "",
        cafeBreak: (recipient as any).cafeBreak || false,
        cafeCondition: (recipient as any).cafeCondition || "",
        trainDiscountType: (recipient as any).trainDiscountType || "",
        hasToeiPass: (recipient as any).hasToeiPass || false,
        hasRestrictionConsent:
          (recipient as any).hasRestrictionConsent || false,
        planConsultationOffice: (recipient as any).planConsultationOffice || "",
        planConsultant: (recipient as any).planConsultant || "",
        // アセスメント・健康
        disabilityName: (recipient as any).disabilityName || "",
        diseaseStatus: (recipient as any).diseaseStatus || "",
        hasSeizures: (recipient as any).hasSeizures || false,
        seizureFrequency: (recipient as any).seizureFrequency || "",
        seizureResponse: (recipient as any).seizureResponse || "",
        medication: Array.isArray((recipient as any).medication)
          ? (recipient as any).medication.join("\n")
          : (recipient as any).medication || "",
        hasPrnMedication: (recipient as any).hasPrnMedication || false,
        prnMedicationMethod: (recipient as any).prnMedicationMethod || "",
        hasSeasonalMedication:
          (recipient as any).hasSeasonalMedication || false,
        seasonalMedicationContent:
          (recipient as any).seasonalMedicationContent || "",
        healthNote: (recipient as any).healthNote || "",
        // 食事
        favoriteFoods: (recipient as any).favoriteFoods || "",
        dislikedFoods: (recipient as any).dislikedFoods || "",
        hasAllergy: (recipient as any).hasAllergy || false,
        allergyNote: (recipient as any).allergyNote || "",
        menuSelectionMethod: (recipient as any).menuSelectionMethod || "",
        eatingStyle: (recipient as any).eatingStyle || "",
        // 排泄
        toiletSign: (recipient as any).toiletSign || "",
        toiletFrequency: (recipient as any).toiletFrequency || "",
        toiletAssistMethod: (recipient as any).toiletAssistMethod || "",
        toiletNote: (recipient as any).toiletNote || "",
        // 移動
        mobilityMethod: (recipient as any).mobilityMethod || "",
        mobilityAssist: (recipient as any).mobilityAssist || "",
        mobilityNote: (recipient as any).mobilityNote || "",
        // コミュニケーション
        commVerbal: (recipient as any).commVerbal || "",
        commGesture: (recipient as any).commGesture || "",
        commExpression: (recipient as any).commExpression || "",
        commRequest: (recipient as any).commRequest || "",
        commRefusal: (recipient as any).commRefusal || "",
        commNote: (recipient as any).commNote || "",
        // こだわり・安全
        hasObsession: (recipient as any).hasObsession || false,
        obsessionSituation: (recipient as any).obsessionSituation || "",
        obsessionResponse: (recipient as any).obsessionResponse || "",
        hasSelfHarm: (recipient as any).hasSelfHarm || false,
        hasHarmToOthers: (recipient as any).hasHarmToOthers || false,
        safetyNote: (recipient as any).safetyNote || "",
        // その他
        hobbies: (recipient as any).hobbies || "",
        otherNotes: (recipient as any).otherNotes || "",
        hasPastIncidents: (recipient as any).hasPastIncidents || false,
        pastIncidentsNote: (recipient as any).pastIncidentsNote || "",
        // 性格・関わり方
        personalityNote: (recipient as any).personalityNote || "",
        interactionNote: (recipient as any).interactionNote || "",
        // 外出傾向
        outingRequestPattern: (recipient as any).outingRequestPattern || "",
        outingGroupPlanDeparture:
          (recipient as any).outingGroupPlanDeparture || "",
        outingGroupPlanNote: (recipient as any).outingGroupPlanNote || "",
        outingSpecificRequest1: (recipient as any).outingSpecificRequest1 || "",
        outingSpecificRequest2: (recipient as any).outingSpecificRequest2 || "",
        outingCasualDestination:
          (recipient as any).outingCasualDestination || "",
        outingIrregularNote: (recipient as any).outingIrregularNote || "",
        outingOtherNote: (recipient as any).outingOtherNote || "",
        // Phase 1追加フィールド: 感覚過敏・鈍麻
        sensorySound: (recipient as any).sensorySound || "",
        sensoryLight: (recipient as any).sensoryLight || "",
        sensoryTaste: (recipient as any).sensoryTaste || "",
        sensoryTouch: (recipient as any).sensoryTouch || "",
        sensorySmell: (recipient as any).sensorySmell || "",
        sensoryOther: (recipient as any).sensoryOther || "",
        // Phase 1追加フィールド: こだわり
        obsessionPast: (recipient as any).obsessionPast || "",
        obsessionCurrent: (recipient as any).obsessionCurrent || "",
        // Phase 1追加フィールド: 自傷・他害・パニック
        selfHarmContent: (recipient as any).selfHarmContent || "",
        aggressionContent: (recipient as any).aggressionContent || "",
        panicContent: (recipient as any).panicContent || "",
        // Phase 1追加フィールド: 趣味・関心8カテゴリー
        hobbyOuting: (recipient as any).hobbyOuting || "",
        hobbyTv: (recipient as any).hobbyTv || "",
        hobbyMusic: (recipient as any).hobbyMusic || "",
        hobbyBook: (recipient as any).hobbyBook || "",
        hobbyInterpersonal: (recipient as any).hobbyInterpersonal || "",
        hobbyInterestScope: (recipient as any).hobbyInterestScope || "",
        hobbyFoodPreference: (recipient as any).hobbyFoodPreference || "",
        hobbyOther: (recipient as any).hobbyOther || "",
        // Phase 1追加フィールド: 服薬詳細
        medicationMorning: (recipient as any).medicationMorning || "",
        medicationNoon: (recipient as any).medicationNoon || "",
        medicationEvening: (recipient as any).medicationEvening || "",
        medicationBedtime: (recipient as any).medicationBedtime || "",
        medicationTimeFixed: (recipient as any).medicationTimeFixed || "",
        medicationTimeFixedDetail:
          (recipient as any).medicationTimeFixedDetail || "",
        medicationNote: (recipient as any).medicationNote || "",
        // Phase 1追加フィールド: 臨時薬
        prnMedicationContent: (recipient as any).prnMedicationContent || "",
        prnMedicationTiming: (recipient as any).prnMedicationTiming || "",
        prnMedicationMemo: (recipient as any).prnMedicationMemo || "",
        // Phase 1追加フィールド: 発作詳細
        seizureTimePattern: (recipient as any).seizureTimePattern || "",
        seizureHistoryNote: (recipient as any).seizureHistoryNote || "",
        // Phase 1追加フィールド: 塗薬等
        hasTopicalMedication: (recipient as any).hasTopicalMedication || false,
        topicalMedicationNote: (recipient as any).topicalMedicationNote || "",
        // Phase 1追加フィールド: 人柄
        personality: (recipient as any).personality || "",
        // Phase 1追加フィールド: 社会性・対人行動
        socialRelationship: (recipient as any).socialRelationship || "",
        socialRules: (recipient as any).socialRules || "",
        // Phase 1追加フィールド: 表現のコミュニケーション
        commExpressionMethods: (recipient as any).commExpressionMethods || [],
        commExpressionContent: (recipient as any).commExpressionContent || "",
        commExpressionOther: (recipient as any).commExpressionOther || "",
        // Phase 1追加フィールド: 理解のコミュニケーション
        commUnderstandMethods: (recipient as any).commUnderstandMethods || [],
        commCognitionLevels: (recipient as any).commCognitionLevels || [],
        commUnderstandOther: (recipient as any).commUnderstandOther || "",
        commCognitionOther: (recipient as any).commCognitionOther || "",
        // Phase 1追加フィールド: 身辺自立（3段階評価）
        adlEating3Level: (recipient as any).adlEating3Level || "",
        adlEatingSupport: (recipient as any).adlEatingSupport || "",
        adlToiletSmall3Level: (recipient as any).adlToiletSmall3Level || "",
        adlToiletSmallSupport: (recipient as any).adlToiletSmallSupport || "",
        adlToiletLarge3Level: (recipient as any).adlToiletLarge3Level || "",
        adlToiletLargeSupport: (recipient as any).adlToiletLargeSupport || "",
        adlBathing3Level: (recipient as any).adlBathing3Level || "",
        adlBathingSupport: (recipient as any).adlBathingSupport || "",
        adlDressing3Level: (recipient as any).adlDressing3Level || "",
        adlDressingSupport: (recipient as any).adlDressingSupport || "",
        adlOther3Level: (recipient as any).adlOther3Level || "",
        // Phase 2フィールド
        emergencyContacts: (recipient as any).emergencyContacts || null,
        familyMembers: (recipient as any).familyMembers || null,
        contactPolicy: (recipient as any).contactPolicy || null,
      });
    }
  }, [recipient, reset]);

  const onSubmit = async (data: RecipientFormData) => {
    console.log("Form submitted with data:", data);
    console.log("Form errors:", errors);

    // walkingMinutesから数値のみを抽出（「徒歩8分」→「8」）
    let cleanedWalkingMinutes = data.walkingMinutes;
    if (cleanedWalkingMinutes) {
      const match = String(cleanedWalkingMinutes).match(/\d+/);
      cleanedWalkingMinutes = match ? match[0] : cleanedWalkingMinutes;
    }

    updateMutation.mutate({
      id: recipientId,
      ...data,
      walkingMinutes: cleanedWalkingMinutes,
      birthDate: new Date(data.birthDate),
      supportLevel: data.supportLevel ? Number(data.supportLevel) : undefined,
      serviceTypes: data.serviceTypes || [],
      allowances: data.allowances || [],
      receivedDate: data.receivedDate ? new Date(data.receivedDate) : undefined,
      validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
      behaviorScore: data.behaviorScore
        ? Number(data.behaviorScore)
        : undefined,
      careInsuranceExpiry: data.careInsuranceExpiry
        ? new Date(data.careInsuranceExpiry)
        : undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  if (!recipient) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-destructive text-lg">利用者が見つかりません</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Link href={`/recipients/${recipientId}`}>
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          利用者詳細に戻る
        </Button>
      </Link>

      <h1 className="mb-2 text-3xl font-bold">利用者情報の編集</h1>
      <p className="text-muted-foreground mb-8">
        {recipient.name} さんの情報を編集します
      </p>

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
                  onChange={(e) =>
                    setValue("emergencyRelation", e.target.value)
                  }
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
              </div>
            </div>
          </div>
        </div>

        {/* 障害情報 */}
        <CollapsibleSection
          title="障害情報"
          description="障害支援区分など、制度上の基本情報"
          defaultOpen
        >
          <div className="space-y-4">
            <div className="rounded-md bg-amber-50 p-4">
              <p className="text-sm text-amber-900">
                <strong>⚠️ 障害種別と手帳について</strong>
                <br />
                障害種別と障害者手帳は別々に管理します。重複障害（複数の障害を併せ持つ）の場合は、該当する障害種別を複数選択してください。
                <br />
                手帳情報は下記「制度情報」セクションで入力してください。
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                障害種別 <span className="text-xs text-gray-500">（複数選択可）</span>
              </label>
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
              <p className="mt-2 text-xs text-gray-500">
                ※重複障害の場合は複数選択してください
              </p>
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
            {/* 書類ヘッダー情報（フェイスシート用） */}
            <div className="border-b pb-4">
              <h3 className="mb-3 text-base font-semibold">
                書類ヘッダー情報（フェイスシート用）
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    法人/事業所名
                  </label>
                  <input
                    type="text"
                    {...register("organizationName")}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    placeholder="例: 社会福祉法人○○会 ○○事業所"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    グループホーム名（書類用）
                  </label>
                  <input
                    type="text"
                    {...register("documentHeaderGroupHomeName")}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    placeholder="未入力の場合、下記のGH名が使用されます"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    サービス管理責任者
                  </label>
                  <input
                    type="text"
                    {...register("serviceManagerName")}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>

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
                身体障害者手帳、愛の手帳（療育手帳）、精神障害者保健福祉手帳の3種類に対応しています。
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
                <input
                  type="text"
                  {...register("homePhone")}
                  className="w-full rounded-md border px-3 py-2 text-sm"
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
                  <input
                    type="text"
                    {...register("mobilePhone")}
                    placeholder="090-1234-5678"
                    className="w-full rounded-md border px-3 py-2 text-sm"
                  />
                )}
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
                    <input
                      type="text"
                      {...register("ghPhone")}
                      className="w-full rounded-md border px-3 py-2 text-sm"
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
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    {...register("hasPrnMedication")}
                    className="rounded"
                  />
                  頓服あり
                </label>
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    {...register("hasSeasonalMedication")}
                    className="rounded"
                  />
                  季節薬あり
                </label>
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

              {/* Phase 1追加: 発作詳細 */}
              {watch("hasSeizures") && (
                <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <h4 className="text-sm font-semibold text-blue-900">
                    発作の詳細情報
                  </h4>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        起きやすい時間帯
                      </label>
                      <input
                        type="text"
                        {...register("seizureTimePattern")}
                        className="w-full rounded-md border px-3 py-2 text-sm"
                        placeholder="例: 起床時、夜間など"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        発作履歴補足
                      </label>
                      <input
                        type="text"
                        {...register("seizureHistoryNote")}
                        className="w-full rounded-md border px-3 py-2 text-sm"
                        placeholder="例: 10年以上なし"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Phase 1追加: 服薬詳細（時間帯別） */}
              <div className="space-y-3 rounded-lg border border-purple-200 bg-purple-50 p-4">
                <h4 className="text-sm font-semibold text-purple-900">
                  服薬詳細（時間帯別）
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      朝食後
                    </label>
                    <textarea
                      {...register("medicationMorning")}
                      className="w-full rounded-md border px-3 py-2 text-sm"
                      rows={2}
                      placeholder="薬の名前と量"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      昼食後
                    </label>
                    <textarea
                      {...register("medicationNoon")}
                      className="w-full rounded-md border px-3 py-2 text-sm"
                      rows={2}
                      placeholder="薬の名前と量"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      夕食後
                    </label>
                    <textarea
                      {...register("medicationEvening")}
                      className="w-full rounded-md border px-3 py-2 text-sm"
                      rows={2}
                      placeholder="薬の名前と量"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      就寝前
                    </label>
                    <textarea
                      {...register("medicationBedtime")}
                      className="w-full rounded-md border px-3 py-2 text-sm"
                      rows={2}
                      placeholder="薬の名前と量"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        時間固定の服薬
                      </label>
                      <input
                        type="text"
                        {...register("medicationTimeFixed")}
                        className="w-full rounded-md border px-3 py-2 text-sm"
                        placeholder="例: 16時"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        時間固定の詳細
                      </label>
                      <input
                        type="text"
                        {...register("medicationTimeFixedDetail")}
                        className="w-full rounded-md border px-3 py-2 text-sm"
                        placeholder="薬の名前"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      服薬特記
                    </label>
                    <textarea
                      {...register("medicationNote")}
                      className="w-full rounded-md border px-3 py-2 text-sm"
                      rows={2}
                      placeholder="服薬に関する特記事項"
                    />
                  </div>
                </div>
              </div>

              {/* Phase 1追加: 臨時薬（頓服・季節薬） */}
              {(watch("hasPrnMedication") ||
                watch("hasSeasonalMedication")) && (
                <div className="space-y-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                  <h4 className="text-sm font-semibold text-yellow-900">
                    臨時薬（頓服・季節薬）
                  </h4>
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      薬の内容
                    </label>
                    <textarea
                      {...register("prnMedicationContent")}
                      className="w-full rounded-md border px-3 py-2 text-sm"
                      rows={2}
                      placeholder="臨時薬の内容"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      どういうときに飲むか
                    </label>
                    <input
                      type="text"
                      {...register("prnMedicationTiming")}
                      className="w-full rounded-md border px-3 py-2 text-sm"
                      placeholder="例: 不眠時、発熱時"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      メモ
                    </label>
                    <input
                      type="text"
                      {...register("prnMedicationMemo")}
                      className="w-full rounded-md border px-3 py-2 text-sm"
                      placeholder="例: マイスリー"
                    />
                  </div>
                </div>
              )}

              {/* Phase 1追加: 塗薬等 */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    {...register("hasTopicalMedication")}
                    className="rounded"
                  />
                  塗薬等あり
                </label>
              </div>
              {watch("hasTopicalMedication") && (
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    塗薬等の詳細
                  </label>
                  <textarea
                    {...register("topicalMedicationNote")}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    rows={2}
                    placeholder="塗薬の名前、使用箇所、頻度など"
                  />
                </div>
              )}
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

            {/* Phase 1追加: 感覚過敏・鈍麻 */}
            <div className="space-y-3 border-t pt-4">
              <h3 className="text-base font-semibold">感覚（具体的に）</h3>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  音（好きな音/嫌いな音、特定の音に過敏 等）
                </label>
                <textarea
                  {...register("sensorySound")}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  rows={2}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  光（過敏さ 等）
                </label>
                <textarea
                  {...register("sensoryLight")}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  rows={2}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  味覚（偏食、味の好み、飲み込み 等）
                </label>
                <textarea
                  {...register("sensoryTaste")}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  rows={2}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  触覚（衣服の材質/タグ等へのこだわり、触れ方 等）
                </label>
                <textarea
                  {...register("sensoryTouch")}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  rows={2}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  におい（食事の好み、臭いに敏感 等）
                </label>
                <textarea
                  {...register("sensorySmell")}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  rows={2}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">その他</label>
                <textarea
                  {...register("sensoryOther")}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  rows={2}
                />
              </div>
            </div>

            {/* Phase 1追加: こだわり【あれば記入】 */}
            <div className="space-y-3 border-t pt-4">
              <h3 className="text-base font-semibold">
                こだわり【あれば記入】
              </h3>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  過去、こだわっていたこと
                </label>
                <textarea
                  {...register("obsessionPast")}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  rows={3}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  現在、こだわっていること
                </label>
                <textarea
                  {...register("obsessionCurrent")}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  rows={3}
                />
              </div>
            </div>

            {/* Phase 1追加: 自傷・他害・パニック【あれば記入】 */}
            <div className="space-y-3 border-t pt-4">
              <h3 className="text-base font-semibold">
                自傷・他害・パニック【あれば記入】
              </h3>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  自傷（内容）
                </label>
                <textarea
                  {...register("selfHarmContent")}
                  className="w-full rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm"
                  rows={2}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  他害（内容）
                </label>
                <textarea
                  {...register("aggressionContent")}
                  className="w-full rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm"
                  rows={2}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  パニック（内容）
                </label>
                <textarea
                  {...register("panicContent")}
                  className="w-full rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm"
                  rows={2}
                />
              </div>
            </div>

            {/* Phase 1追加: 趣味・関心・余暇・嗜好【あれば記入】 */}
            <div className="space-y-3 border-t pt-4">
              <h3 className="text-base font-semibold">
                趣味・関心・余暇・嗜好【あれば記入】
              </h3>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  1. 外出（好きな外出先・嫌いな外出先 等）
                </label>
                <textarea
                  {...register("hobbyOuting")}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  rows={2}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  2. TV（好きな番組・嫌いな番組）
                </label>
                <textarea
                  {...register("hobbyTv")}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  rows={2}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  3. 音楽（好きな曲・嫌いな曲）
                </label>
                <textarea
                  {...register("hobbyMusic")}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  rows={2}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  4. 本・雑誌（好きな本・嫌いな本）
                </label>
                <textarea
                  {...register("hobbyBook")}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  rows={2}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  5. 対人関係・遊び（2人以上で楽しめる遊び 等）
                </label>
                <textarea
                  {...register("hobbyInterpersonal")}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  rows={2}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  6. 趣味の範囲（特定なものへの関心 等）
                </label>
                <textarea
                  {...register("hobbyInterestScope")}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  rows={2}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  7. 嗜好物等（好きな食べ物・嫌いな食べ物 等）
                </label>
                <textarea
                  {...register("hobbyFoodPreference")}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  rows={2}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  8. その他（その他の遊び、余暇活動）
                </label>
                <textarea
                  {...register("hobbyOther")}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  rows={2}
                />
              </div>
            </div>

            {/* Phase 1追加: 人柄 */}
            <div className="space-y-3 border-t pt-4">
              <h3 className="text-base font-semibold">人柄</h3>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  人柄（自由記述）
                </label>
                <textarea
                  {...register("personality")}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  rows={4}
                />
              </div>
            </div>

            {/* Phase 1追加: 社会性・対人行動 */}
            <div className="space-y-3 border-t pt-4">
              <h3 className="text-base font-semibold">社会性・対人行動</h3>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  人との関係の取り方
                </label>
                <textarea
                  {...register("socialRelationship")}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  rows={3}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  社会的なルールの理解
                </label>
                <textarea
                  {...register("socialRules")}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  rows={3}
                />
              </div>
            </div>

            {/* Phase 1追加: 表現のコミュニケーション */}
            <div className="space-y-3 border-t pt-4">
              <h3 className="text-base font-semibold">
                表現のコミュニケーション
              </h3>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  表現手段（複数選択可）
                </label>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                  {[
                    { value: "word", label: "ことば（単語）" },
                    { value: "sentence", label: "ことば（二語文以上）" },
                    { value: "text_word", label: "文字（単語）" },
                    { value: "text_sentence", label: "文字（二語文以上）" },
                    { value: "sign", label: "サイン言語" },
                    { value: "gesture", label: "ジェスチャー" },
                    { value: "picture", label: "絵・写真" },
                    { value: "object", label: "物を使う" },
                    { value: "direct", label: "直接動作" },
                    { value: "voice", label: "発声" },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        value={option.value}
                        {...register("commExpressionMethods")}
                        className="rounded"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  自発的に表現する内容
                </label>
                <textarea
                  {...register("commExpressionContent")}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  rows={3}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">その他</label>
                <textarea
                  {...register("commExpressionOther")}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  rows={2}
                />
              </div>
            </div>

            {/* Phase 1追加: 理解のコミュニケーション */}
            <div className="space-y-3 border-t pt-4">
              <h3 className="text-base font-semibold">
                理解のコミュニケーション
              </h3>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  効果的な指示・伝え方（複数選択可）
                </label>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                  {[
                    { value: "verbal_word", label: "言語指示（単語）" },
                    {
                      value: "verbal_sentence",
                      label: "言語指示（二語文以上）",
                    },
                    { value: "text_hiragana", label: "文字（ひらがな）" },
                    { value: "text_kanji", label: "文字（漢字）" },
                    { value: "text_simple", label: "簡単な文" },
                    { value: "gesture", label: "ジェスチャー" },
                    { value: "picture", label: "絵・写真" },
                    { value: "object", label: "物の提示" },
                    { value: "model", label: "見本の提示" },
                    { value: "hand_over_hand", label: "手添え" },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        value={option.value}
                        {...register("commUnderstandMethods")}
                        className="rounded"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  認知レベル（わかるもの）（複数選択可）
                </label>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                  {[
                    { value: "object_distinction", label: "物の区別" },
                    { value: "object_name", label: "物の名称" },
                    { value: "shape_color_distinction", label: "形・色の区別" },
                    { value: "shape_color_name", label: "形・色の名称" },
                    { value: "hiragana", label: "ひらがなが読める" },
                    {
                      value: "shape_color_matching",
                      label: "形・色のマッチング",
                    },
                    { value: "simple_word", label: "簡単な単語が読める" },
                    { value: "simple_sentence", label: "簡単な文が読める" },
                    { value: "money_distinction", label: "お金の区別" },
                    { value: "money_size", label: "金銭の大小" },
                    { value: "counting", label: "数える" },
                    { value: "clock", label: "時計が読める" },
                    { value: "math", label: "足し算・引き算" },
                    { value: "traffic_sign", label: "交通標識の意味" },
                    { value: "signal", label: "信号の意味" },
                    { value: "game_rules", label: "卓上ゲームのルール" },
                    { value: "danger", label: "危険の認識" },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        value={option.value}
                        {...register("commCognitionLevels")}
                        className="rounded"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  その他（理解・指示）
                </label>
                <textarea
                  {...register("commUnderstandOther")}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  rows={2}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  その他（認知レベル）
                </label>
                <textarea
                  {...register("commCognitionOther")}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  rows={2}
                />
              </div>
            </div>

            {/* Phase 1追加: 身辺自立【特に支援を要すること】 */}
            <div className="space-y-3 border-t pt-4">
              <h3 className="text-base font-semibold">
                身辺自立【特に支援を要すること】
              </h3>
              <div className="space-y-3">
                {[
                  {
                    levelField: "adlEating3Level",
                    supportField: "adlEatingSupport",
                    label: "1. 食事",
                  },
                  {
                    levelField: "adlToiletSmall3Level",
                    supportField: "adlToiletSmallSupport",
                    label: "2. トイレ小",
                  },
                  {
                    levelField: "adlToiletLarge3Level",
                    supportField: "adlToiletLargeSupport",
                    label: "3. トイレ大",
                  },
                  {
                    levelField: "adlBathing3Level",
                    supportField: "adlBathingSupport",
                    label: "4. 入浴",
                  },
                  {
                    levelField: "adlDressing3Level",
                    supportField: "adlDressingSupport",
                    label: "5. 着替え",
                  },
                ].map((item) => (
                  <div key={item.levelField} className="rounded-lg border p-3">
                    <label className="mb-2 block text-sm font-medium">
                      {item.label}
                    </label>
                    <div className="mb-2 flex gap-4">
                      {["自立", "ある程度できる", "できない"].map((level) => (
                        <label
                          key={level}
                          className="flex items-center gap-2 text-sm"
                        >
                          <input
                            type="radio"
                            value={level}
                            {...register(item.levelField as any)}
                          />
                          {level}
                        </label>
                      ))}
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-gray-600">
                        支援メモ
                      </label>
                      <textarea
                        {...register(item.supportField as any)}
                        className="w-full rounded-md border px-3 py-2 text-sm"
                        rows={2}
                        placeholder="支援が必要な点を記入"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  その他（自由記述）
                </label>
                <textarea
                  {...register("adlOther3Level")}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  rows={3}
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
                グループプラン（発着/特記）
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
            disabled={updateMutation.isPending}
            className="flex-1"
          >
            {updateMutation.isPending ? "更新中..." : "更新"}
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
