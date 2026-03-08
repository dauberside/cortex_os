import { z } from "zod";

// カスタムバリデーション関数
const japanesePhoneNumber = z
  .string()
  .optional()
  .refine(
    (val) => {
      if (!val) return true;
      // 日本の電話番号形式: 090-1234-5678, 03-1234-5678, 0312345678など
      const phoneRegex = /^0\d{1,4}-?\d{1,4}-?\d{4}$/;
      return phoneRegex.test(val.replace(/\s/g, ""));
    },
    { message: "有効な電話番号を入力してください（例: 090-1234-5678）" }
  );

const emailAddress = z
  .string()
  .optional()
  .refine(
    (val) => {
      if (!val) return true;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(val);
    },
    { message: "有効なメールアドレスを入力してください" }
  );

const url = z
  .string()
  .optional()
  .refine(
    (val) => {
      if (!val) return true;
      try {
        new URL(val);
        return true;
      } catch {
        return false;
      }
    },
    { message: "有効なURLを入力してください（例: https://example.com）" }
  );

const postalCode = z
  .string()
  .optional()
  .refine(
    (val) => {
      if (!val) return true;
      const postalRegex = /^\d{3}-?\d{4}$/;
      return postalRegex.test(val);
    },
    { message: "有効な郵便番号を入力してください（例: 123-4567）" }
  );

const katakana = z
  .string()
  .optional()
  .refine(
    (val) => {
      if (!val) return true;
      // カタカナ、全角スペース、中点を許可
      const katakanaRegex = /^[ァ-ヶー\s　・]+$/;
      return katakanaRegex.test(val);
    },
    { message: "カタカナで入力してください（例: ヤマダ タロウ）" }
  );

const pastDate = z
  .string()
  .min(1, "日付を入力してください")
  .refine(
    (val) => {
      const date = new Date(val);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date <= today;
    },
    { message: "過去または今日の日付を入力してください" }
  );

const futureDate = z
  .string()
  .optional()
  .refine(
    (val) => {
      if (!val) return true;
      const date = new Date(val);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today;
    },
    { message: "今日以降の日付を入力してください" }
  );

const positiveInteger = z.coerce
  .number()
  .int("整数を入力してください")
  .positive("正の数を入力してください")
  .optional()
  .or(z.literal(""));

// ============================================
// Phase 2: フェイスシート拡張フィールド（JSON型）
// ============================================

// 連絡先種別
export const ContactTarget = z.enum(["FAMILY", "GH", "OTHER"]);

// 遅刻・キャンセル時の連絡先優先
export const LateCancelPolicy = z.enum(["GH_FIRST", "FAMILY_FIRST"]);

// contactPolicy（連絡ルール）
export const ContactPolicySchema = z
  .object({
    dayPrimary: ContactTarget,
    nightPrimary: ContactTarget,
    emergencyOrder: z.array(ContactTarget).min(1, "緊急時連絡順序は最低1件必要です"),
    lateCancel: LateCancelPolicy,
    notes: z.string().optional().default(""),
  })
  .strict();

// 緊急連絡先（複数）
export const EmergencyContactSchema = z
  .object({
    name: z.string().min(1, "氏名は必須です"),
    nameKana: z.string().optional().default(""),
    relationship: z.string().optional().default(""),
    phone: z.string().optional().default(""),
    fax: z.string().optional().default(""),
  })
  .strict();

export const EmergencyContactsSchema = z.array(EmergencyContactSchema).optional();

// 家族構成（複数）
export const FamilyMemberSchema = z
  .object({
    relation: z.string().min(1, "続柄は必須です"),
    name: z.string().optional().default(""),
    age: z.number().int().min(0).optional(),
    livingTogether: z.boolean().optional(),
    notes: z.string().optional().default(""),
  })
  .strict();

export const FamilyMembersSchema = z
  .object({
    diagram: z.string().optional().default(""),
    members: z.array(FamilyMemberSchema).optional().default([]),
  })
  .strict()
  .optional();

// サービス利用状況（複数）
export const CurrentServiceSchema = z
  .object({
    serviceName: z.string().min(1, "サービス名は必須です"),
    frequency: z.string().optional().default(""),
    remarks: z.string().optional().default(""),
  })
  .strict();

export const CurrentServicesSchema = z.array(CurrentServiceSchema).optional();

// 医療保険種別（JSON配列）
export const MedicalInsuranceTypesSchema = z.array(z.string()).optional();

// メインスキーマ
export const recipientSchema = z
  .object({
    // 基本情報（必須）
    name: z
      .string()
      .min(1, "氏名は必須です")
      .max(100, "氏名は100文字以内で入力してください"),
    nameKana: katakana,
    birthDate: pastDate,
    gender: z.enum(["Male", "Female", "Other"], {
      message: "性別を選択してください",
    }),

    // 障害情報
    disabilityType: z
      .array(z.enum(["Physical", "Intellectual", "Mental"]))
      .default([]),
    supportLevel: z.coerce
      .number()
      .int("整数を入力してください")
      .min(1, "1以上の値を入力してください")
      .max(6, "6以下の値を入力してください")
      .optional()
      .or(z.literal("")),

    // 連絡先情報
    emergencyContact: japanesePhoneNumber,
    emergencyRelation: z.string().optional(),

    // 医療情報
    doctor: z
      .string()
      .max(100, "主治医名は100文字以内で入力してください")
      .optional(),
    hospital: z
      .string()
      .max(200, "医療機関名は200文字以内で入力してください")
      .optional(),
    allergies: z
      .string()
      .max(500, "アレルギー情報は500文字以内で入力してください")
      .optional(),
    medicalHistory: z
      .string()
      .max(2000, "既往歴は2000文字以内で入力してください")
      .optional(),
    notes: z
      .string()
      .max(2000, "備考は2000文字以内で入力してください")
      .optional(),

    // サービス情報
    serviceTypes: z.array(z.string()).default([]),
    utilizationStatus: z.string().optional(),
    recipientNumber: z
      .string()
      .max(50, "受給者番号は50文字以内で入力してください")
      .optional(),
    receivedDate: z.string().optional(),
    validUntil: futureDate,
    behaviorSupportNeeded: z.boolean().optional(),
    behaviorScore: z.coerce
      .number()
      .int("整数を入力してください")
      .min(0, "0以上の値を入力してください")
      .max(100, "100以下の値を入力してください")
      .optional()
      .or(z.literal("")),
    allowances: z.array(z.string()).default([]),

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
    psychiatricDiagnosis: z
      .string()
      .max(200, "診断名は200文字以内で入力してください")
      .optional(),
    developmentalDiagnosis: z
      .string()
      .max(200, "診断名は200文字以内で入力してください")
      .optional(),
    autismSpectrumLevel: z.string().optional(),
    medicalProtectionAdmission: z.boolean().optional(),
    outpatientMedication: z.boolean().optional(),
    medicalFeeExemption: z.string().optional(),

    // 高齢障害者
    isElderly: z.boolean().optional(),
    careInsuranceCertified: z.boolean().optional(),
    careInsuranceLevel: z.string().optional(),
    careInsuranceExpiry: futureDate,
    continuedDisabilityService: z.boolean().optional(),

    // サポート基本情報票
    photoUrl: url,
    school: z
      .string()
      .max(200, "通所先名は200文字以内で入力してください")
      .optional(),
    handbookType: z.string().optional(),
    handbookGrade: z.string().optional(),
    homeAddress: z
      .string()
      .max(500, "住所は500文字以内で入力してください")
      .optional(),
    homePhone: japanesePhoneNumber,
    nearestStation: z
      .string()
      .max(100, "駅名は100文字以内で入力してください")
      .optional(),
    walkingMinutes: z
      .string()
      .max(20, "徒歩分数は20文字以内で入力してください")
      .optional(),
    hasMobilePhone: z.boolean().optional(),
    mobilePhone: japanesePhoneNumber,

    // GH情報
    livingType: z.string().optional(),
    ghName: z
      .string()
      .max(200, "GH名称は200文字以内で入力してください")
      .optional(),
    ghAddress: z
      .string()
      .max(500, "GH住所は500文字以内で入力してください")
      .optional(),
    ghPhone: japanesePhoneNumber,
    ghCorporation: z
      .string()
      .max(200, "法人名は200文字以内で入力してください")
      .optional(),
    ghAccess: z
      .string()
      .max(500, "アクセス情報は500文字以内で入力してください")
      .optional(),

    // 運用ルール
    priorConfirmationNote: z
      .string()
      .max(1000, "特記事項は1000文字以内で入力してください")
      .optional(),
    hasRecordNote: z.boolean().optional(),
    walletNote: z
      .string()
      .max(1000, "特記事項は1000文字以内で入力してください")
      .optional(),
    cafeBreak: z.boolean().optional(),
    cafeCondition: z
      .string()
      .max(200, "条件は200文字以内で入力してください")
      .optional(),
    trainDiscountType: z
      .string()
      .max(50, "割引種別は50文字以内で入力してください")
      .optional(),
    hasToeiPass: z.boolean().optional(),
    hasRestrictionConsent: z.boolean().optional(),
    planConsultationOffice: z
      .string()
      .max(200, "事業所名は200文字以内で入力してください")
      .optional(),
    planConsultant: z
      .string()
      .max(100, "担当者名は100文字以内で入力してください")
      .optional(),

    // アセスメント・健康
    disabilityName: z
      .string()
      .max(200, "障害名は200文字以内で入力してください")
      .optional(),
    diseaseStatus: z
      .string()
      .max(2000, "疾病状況は2000文字以内で入力してください")
      .optional(),
    hasSeizures: z.boolean().optional(),
    seizureFrequency: z
      .string()
      .max(200, "頻度は200文字以内で入力してください")
      .optional(),
    seizureResponse: z
      .string()
      .max(1000, "対処方法は1000文字以内で入力してください")
      .optional(),
    medication: z
      .string()
      .max(2000, "服薬情報は2000文字以内で入力してください")
      .optional(),
    hasPrnMedication: z.boolean().optional(),
    prnMedicationMethod: z
      .string()
      .max(1000, "服薬方法は1000文字以内で入力してください")
      .optional(),
    hasSeasonalMedication: z.boolean().optional(),
    seasonalMedicationContent: z
      .string()
      .max(1000, "内容は1000文字以内で入力してください")
      .optional(),
    healthNote: z
      .string()
      .max(2000, "留意点は2000文字以内で入力してください")
      .optional(),

    // 食事
    favoriteFoods: z
      .string()
      .max(500, "好きなものは500文字以内で入力してください")
      .optional(),
    dislikedFoods: z
      .string()
      .max(500, "嫌いなものは500文字以内で入力してください")
      .optional(),
    hasAllergy: z.boolean().optional(),
    allergyNote: z
      .string()
      .max(1000, "アレルギー詳細は1000文字以内で入力してください")
      .optional(),
    menuSelectionMethod: z
      .string()
      .max(500, "選び方は500文字以内で入力してください")
      .optional(),
    eatingStyle: z
      .string()
      .max(200, "食事形態は200文字以内で入力してください")
      .optional(),

    // 排泄
    toiletSign: z
      .string()
      .max(500, "サインは500文字以内で入力してください")
      .optional(),
    toiletFrequency: z
      .string()
      .max(200, "頻度は200文字以内で入力してください")
      .optional(),
    toiletAssistMethod: z
      .string()
      .max(1000, "介助方法は1000文字以内で入力してください")
      .optional(),
    toiletNote: z
      .string()
      .max(1000, "留意点は1000文字以内で入力してください")
      .optional(),

    // 移動
    mobilityMethod: z
      .string()
      .max(500, "手段は500文字以内で入力してください")
      .optional(),
    mobilityAssist: z
      .string()
      .max(1000, "介助方法は1000文字以内で入力してください")
      .optional(),
    mobilityNote: z
      .string()
      .max(1000, "留意点は1000文字以内で入力してください")
      .optional(),

    // コミュニケーション
    commVerbal: z
      .string()
      .max(1000, "会話・発語は1000文字以内で入力してください")
      .optional(),
    commGesture: z
      .string()
      .max(1000, "ジェスチャーは1000文字以内で入力してください")
      .optional(),
    commExpression: z
      .string()
      .max(1000, "表情での表現は1000文字以内で入力してください")
      .optional(),
    commRequest: z
      .string()
      .max(1000, "要求の表現は1000文字以内で入力してください")
      .optional(),
    commRefusal: z
      .string()
      .max(1000, "拒否の表現は1000文字以内で入力してください")
      .optional(),
    commNote: z
      .string()
      .max(1000, "留意点は1000文字以内で入力してください")
      .optional(),

    // こだわり・安全
    hasObsession: z.boolean().optional(),
    obsessionSituation: z
      .string()
      .max(1000, "状況は1000文字以内で入力してください")
      .optional(),
    obsessionResponse: z
      .string()
      .max(1000, "対応は1000文字以内で入力してください")
      .optional(),
    hasSelfHarm: z.boolean().optional(),
    hasHarmToOthers: z.boolean().optional(),
    safetyNote: z
      .string()
      .max(2000, "留意点は2000文字以内で入力してください")
      .optional(),

    // その他
    hobbies: z
      .string()
      .max(1000, "趣味・好きなことは1000文字以内で入力してください")
      .optional(),
    otherNotes: z
      .string()
      .max(2000, "その他の注意点は2000文字以内で入力してください")
      .optional(),
    hasPastIncidents: z.boolean().optional(),
    pastIncidentsNote: z
      .string()
      .max(2000, "詳細は2000文字以内で入力してください")
      .optional(),

    // 性格・関わり方
    personalityNote: z
      .string()
      .max(2000, "性格は2000文字以内で入力してください")
      .optional(),
    interactionNote: z
      .string()
      .max(2000, "関わり方は2000文字以内で入力してください")
      .optional(),

    // 外出傾向
    outingRequestPattern: z
      .string()
      .max(500, "依頼パターンは500文字以内で入力してください")
      .optional(),
    outingGroupPlanDeparture: z
      .string()
      .max(200, "発着は200文字以内で入力してください")
      .optional(),
    outingGroupPlanNote: z
      .string()
      .max(1000, "特記事項は1000文字以内で入力してください")
      .optional(),
    outingSpecificRequest1: z
      .string()
      .max(1000, "依頼内容は1000文字以内で入力してください")
      .optional(),
    outingSpecificRequest2: z
      .string()
      .max(1000, "依頼内容は1000文字以内で入力してください")
      .optional(),
    outingCasualDestination: z
      .string()
      .max(1000, "行先は1000文字以内で入力してください")
      .optional(),
    outingIrregularNote: z
      .string()
      .max(1000, "不定期の内容は1000文字以内で入力してください")
      .optional(),
    outingOtherNote: z
      .string()
      .max(2000, "特記事項は2000文字以内で入力してください")
      .optional(),

    // ============================================
    // Phase 1追加フィールド
    // ============================================

    // 感覚過敏・鈍麻
    sensorySound: z
      .string()
      .max(1000, "音の感覚は1000文字以内で入力してください")
      .optional(),
    sensoryLight: z
      .string()
      .max(1000, "光の感覚は1000文字以内で入力してください")
      .optional(),
    sensoryTaste: z
      .string()
      .max(1000, "味覚は1000文字以内で入力してください")
      .optional(),
    sensoryTouch: z
      .string()
      .max(1000, "触覚は1000文字以内で入力してください")
      .optional(),
    sensorySmell: z
      .string()
      .max(1000, "嗅覚は1000文字以内で入力してください")
      .optional(),
    sensoryOther: z
      .string()
      .max(1000, "その他の感覚は1000文字以内で入力してください")
      .optional(),

    // こだわり詳細
    obsessionPast: z
      .string()
      .max(2000, "過去のこだわりは2000文字以内で入力してください")
      .optional(),
    obsessionCurrent: z
      .string()
      .max(2000, "現在のこだわりは2000文字以内で入力してください")
      .optional(),

    // 自傷・他害・パニック
    selfHarmContent: z
      .string()
      .max(2000, "自傷の内容は2000文字以内で入力してください")
      .optional(),
    aggressionContent: z
      .string()
      .max(2000, "他害の内容は2000文字以内で入力してください")
      .optional(),
    panicContent: z
      .string()
      .max(2000, "パニックの内容は2000文字以内で入力してください")
      .optional(),

    // 趣味・関心8カテゴリー
    hobbyOuting: z
      .string()
      .max(1000, "外出の趣味は1000文字以内で入力してください")
      .optional(),
    hobbyTv: z
      .string()
      .max(1000, "TVの好みは1000文字以内で入力してください")
      .optional(),
    hobbyMusic: z
      .string()
      .max(1000, "音楽の好みは1000文字以内で入力してください")
      .optional(),
    hobbyBook: z
      .string()
      .max(1000, "本・雑誌の好みは1000文字以内で入力してください")
      .optional(),
    hobbyInterpersonal: z
      .string()
      .max(1000, "対人関係・遊びの好みは1000文字以内で入力してください")
      .optional(),
    hobbyInterestScope: z
      .string()
      .max(1000, "趣味の範囲は1000文字以内で入力してください")
      .optional(),
    hobbyFoodPreference: z
      .string()
      .max(1000, "嗜好物等は1000文字以内で入力してください")
      .optional(),
    hobbyOther: z
      .string()
      .max(1000, "その他の趣味は1000文字以内で入力してください")
      .optional(),

    // 服薬詳細
    medicationMorning: z
      .string()
      .max(1000, "朝食後の服薬は1000文字以内で入力してください")
      .optional(),
    medicationNoon: z
      .string()
      .max(1000, "昼食後の服薬は1000文字以内で入力してください")
      .optional(),
    medicationEvening: z
      .string()
      .max(1000, "夕食後の服薬は1000文字以内で入力してください")
      .optional(),
    medicationBedtime: z
      .string()
      .max(1000, "就寝前の服薬は1000文字以内で入力してください")
      .optional(),
    medicationTimeFixed: z
      .string()
      .max(200, "時間固定の服薬は200文字以内で入力してください")
      .optional(),
    medicationTimeFixedDetail: z
      .string()
      .max(1000, "時間固定の詳細は1000文字以内で入力してください")
      .optional(),
    medicationNote: z
      .string()
      .max(2000, "服薬特記は2000文字以内で入力してください")
      .optional(),

    // 臨時薬
    prnMedicationContent: z
      .string()
      .max(1000, "臨時薬の内容は1000文字以内で入力してください")
      .optional(),
    prnMedicationTiming: z
      .string()
      .max(500, "臨時薬のタイミングは500文字以内で入力してください")
      .optional(),
    prnMedicationMemo: z
      .string()
      .max(500, "臨時薬のメモは500文字以内で入力してください")
      .optional(),

    // 発作詳細
    seizureTimePattern: z
      .string()
      .max(500, "発作の時間帯は500文字以内で入力してください")
      .optional(),
    seizureHistoryNote: z
      .string()
      .max(1000, "発作履歴補足は1000文字以内で入力してください")
      .optional(),

    // 塗薬等
    hasTopicalMedication: z.boolean().optional(),
    topicalMedicationNote: z
      .string()
      .max(1000, "塗薬等の詳細は1000文字以内で入力してください")
      .optional(),

    // 人柄
    personality: z
      .string()
      .max(2000, "人柄は2000文字以内で入力してください")
      .optional(),

    // 社会性・対人行動
    socialRelationship: z
      .string()
      .max(2000, "人との関係の取り方は2000文字以内で入力してください")
      .optional(),
    socialRules: z
      .string()
      .max(2000, "社会的なルールの理解は2000文字以内で入力してください")
      .optional(),

    // 表現のコミュニケーション
    commExpressionMethods: z.array(z.string()).default([]),
    commExpressionContent: z
      .string()
      .max(2000, "自発的に表現する内容は2000文字以内で入力してください")
      .optional(),
    commExpressionOther: z
      .string()
      .max(500, "その他の表現方法は500文字以内で入力してください")
      .optional(),

    // 理解のコミュニケーション
    commUnderstandMethods: z.array(z.string()).default([]),
    commCognitionLevels: z.array(z.string()).default([]),
    commUnderstandOther: z
      .string()
      .max(500, "その他の理解方法は500文字以内で入力してください")
      .optional(),
    commCognitionOther: z
      .string()
      .max(500, "その他の認知レベルは500文字以内で入力してください")
      .optional(),

    // 身辺自立（3段階評価）
    adlEating3Level: z.string().optional(),
    adlEatingSupport: z
      .string()
      .max(500, "食事の支援メモは500文字以内で入力してください")
      .optional(),
    adlToiletSmall3Level: z.string().optional(),
    adlToiletSmallSupport: z
      .string()
      .max(500, "トイレ小の支援メモは500文字以内で入力してください")
      .optional(),
    adlToiletLarge3Level: z.string().optional(),
    adlToiletLargeSupport: z
      .string()
      .max(500, "トイレ大の支援メモは500文字以内で入力してください")
      .optional(),
    adlBathing3Level: z.string().optional(),
    adlBathingSupport: z
      .string()
      .max(500, "入浴の支援メモは500文字以内で入力してください")
      .optional(),
    adlDressing3Level: z.string().optional(),
    adlDressingSupport: z
      .string()
      .max(500, "着替えの支援メモは500文字以内で入力してください")
      .optional(),
    adlOther3Level: z
      .string()
      .max(1000, "その他の身辺自立メモは1000文字以内で入力してください")
      .optional(),

    // ============================================
    // Phase 2: フェイスシート拡張フィールド
    // ============================================

    // 書類ヘッダー情報
    documentCreatedDate: z.string().optional(),
    organizationName: z
      .string()
      .max(200, "法人/事業所名は200文字以内で入力してください")
      .optional(),
    documentHeaderGroupHomeName: z
      .string()
      .max(200, "GH名称は200文字以内で入力してください")
      .optional(),
    serviceManagerName: z
      .string()
      .max(100, "氏名は100文字以内で入力してください")
      .optional(),
    documentEnteredBy: z
      .string()
      .max(100, "記入者名は100文字以内で入力してください")
      .optional(),
    documentEnteredAt: z.string().optional(),

    // 基本情報拡張
    postalCode: postalCode,
    livingArrangement: z
      .string()
      .max(100, "生活形態は100文字以内で入力してください")
      .optional(),
    householdSeparation: z.boolean().optional(),

    // 緊急連絡先（JSON型）
    emergencyContacts: EmergencyContactsSchema.nullable(),

    // 家族構成（JSON型）
    familyMembers: FamilyMembersSchema.nullable(),

    // 経済的状況
    disabilityPensionAmount: z.coerce
      .number()
      .int("整数を入力してください")
      .min(0, "0以上の値を入力してください")
      .optional()
      .or(z.literal("")),
    publicMedicalCare: z
      .string()
      .max(500, "公費医療は500文字以内で入力してください")
      .optional(),
    medicalInsuranceTypes: MedicalInsuranceTypesSchema,
    medicalInsuranceDetail: z
      .string()
      .max(500, "詳細は500文字以内で入力してください")
      .optional(),

    // 障害の状況詳細
    disabilityCause: z
      .string()
      .max(500, "障害の起因は500文字以内で入力してください")
      .optional(),
    disabilityDetail: z
      .string()
      .max(2000, "障害の内容は2000文字以内で入力してください")
      .optional(),

    // 生活歴（Text型・自由記述）
    lifeHistory: z
      .string()
      .max(5000, "生活歴は5000文字以内で入力してください")
      .optional(),
    finalEducation: z
      .string()
      .max(200, "最終学歴は200文字以内で入力してください")
      .optional(),
    workHistory: z
      .string()
      .max(2000, "職歴は2000文字以内で入力してください")
      .optional(),

    // 医療情報拡張
    hospitalVisits: z
      .string()
      .max(2000, "通院情報は2000文字以内で入力してください")
      .optional(),
    regularCheckups: z
      .string()
      .max(1000, "定期受診情報は1000文字以内で入力してください")
      .optional(),
    medicalRemarks: z
      .string()
      .max(2000, "医療備考は2000文字以内で入力してください")
      .optional(),

    // サービス利用状況（JSON型）
    currentServices: CurrentServicesSchema,
    guardianshipType: z
      .string()
      .max(50, "成年後見制度は50文字以内で入力してください")
      .optional(),
    welfareRightsAdvocacy: z.boolean().optional(),
    welfareRightsDetail: z
      .string()
      .max(1000, "詳細は1000文字以内で入力してください")
      .optional(),

    // 特記事項
    specialRemarks: z
      .string()
      .max(5000, "特記事項は5000文字以内で入力してください")
      .optional(),

    // 連絡ルール（JSON型）
    contactPolicy: ContactPolicySchema.nullable().optional(),
  })
  .refine(
    (data) => {
      // 行動援護スコアが10点以上の場合、behaviorSupportNeededがtrueであることを推奨
      if (data.behaviorScore && data.behaviorScore >= 10) {
        return data.behaviorSupportNeeded === true;
      }
      return true;
    },
    {
      message:
        "行動関連項目が10点以上の場合、行動援護サービスが必要にチェックを入れてください",
      path: ["behaviorSupportNeeded"],
    }
  )
  .refine(
    (data) => {
      // アレルギーがある場合、アレルギー詳細の入力を推奨
      if (data.hasAllergy) {
        return data.allergyNote && data.allergyNote.length > 0;
      }
      return true;
    },
    {
      message: "アレルギーありの場合、詳細を入力してください",
      path: ["allergyNote"],
    }
  )
  .refine(
    (data) => {
      // 緊急連絡先がある場合、続柄も入力を推奨
      const hasContact = data.emergencyContact && data.emergencyContact.trim().length > 0;
      if (!hasContact) return true; // 連絡先がなければOK

      const relation = data.emergencyRelation || "";
      const hasRelation = relation.trim().length > 0 && relation !== "";

      return hasRelation;
    },
    {
      message: "緊急連絡先が入力されている場合、続柄も入力してください",
      path: ["emergencyRelation"],
    }
  );

export type RecipientFormData = z.infer<typeof recipientSchema>;
