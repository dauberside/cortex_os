import { z } from "zod";

// ============================================
// 表現のコミュニケーション手段の選択肢
// ============================================
export const commExpressionMethodsOptions = [
  "ことば単語",
  "ことば二語文以上",
  "文字単語",
  "文字二語文以上",
  "サイン言語",
  "ジェスチャー",
  "絵・写真",
  "物を使う",
  "直接動作",
  "発声",
  "その他",
] as const;

export const commExpressionMethodsEnum = z.enum(commExpressionMethodsOptions);

// ============================================
// 理解のコミュニケーション手段の選択肢
// ============================================
export const commUnderstandMethodsOptions = [
  "言語指示単語",
  "言語指示二語文以上",
  "文字ひらがな",
  "文字漢字",
  "簡単な文",
  "ジェスチャー",
  "絵・写真",
  "物の提示",
  "見本の提示",
  "手添え",
  "その他",
] as const;

export const commUnderstandMethodsEnum = z.enum(commUnderstandMethodsOptions);

// ============================================
// 認知レベルの選択肢
// ============================================
export const commCognitionLevelsOptions = [
  "物の区別",
  "物の名称",
  "形・色の区別",
  "形・色の名称",
  "ひらがなが読める",
  "形・色のマッチング",
  "簡単な単語が読める",
  "簡単な文が読める",
  "お金の区別",
  "金銭の大小",
  "数える一けた",
  "数える二けた",
  "時計アナログ",
  "時計デジタル",
  "簡単な計算",
  "交通標識の意味",
  "信号の意味",
  "卓上ゲームのルール",
  "危険の認識",
  "その他",
] as const;

export const commCognitionLevelsEnum = z.enum(commCognitionLevelsOptions);

// ============================================
// 身辺自立の3段階評価
// ============================================
export const adl3LevelOptions = ["自立", "ある程度できる", "できない"] as const;

export const adl3LevelEnum = z.enum(adl3LevelOptions);

// ============================================
// アセスメントスキーマ（Phase 1フィールド含む）
// ============================================
export const assessmentSchema = z.object({
  recipientId: z.string().cuid(),

  // ============================================
  // ヘッダー情報（スナップショット）
  // ============================================
  recipientGender: z.string().optional(),
  recipientDisabilityName: z.string().optional(),
  recipientSupportLevel: z.string().optional(),
  recipientHandbook: z.string().optional(),
  recipientFacility: z.string().optional(),
  recipientAddress: z.string().optional(),
  serviceManager: z.string().optional(),
  homeManager: z.string().optional(),
  dayService: z.string().optional(),
  familyStatus: z.string().optional(),
  recentStatus: z.string().optional(),

  // ============================================
  // 社会性・対人行動
  // ============================================
  socialRelationship: z.string().optional(),
  socialRules: z.string().optional(),

  // ============================================
  // 表現のコミュニケーション
  // ============================================
  commExpressionMethods: z.array(commExpressionMethodsEnum).optional(),
  commExpressionContent: z.string().optional(),
  commExpressionOther: z.string().optional(),

  // ============================================
  // 理解のコミュニケーション
  // ============================================
  commUnderstandMethods: z.array(commUnderstandMethodsEnum).optional(),
  commCognitionLevels: z.array(commCognitionLevelsEnum).optional(),
  commCognitionOther: z.string().optional(),

  // ============================================
  // 身辺自立（3段階評価）
  // ============================================
  adlEating3Level: adl3LevelEnum.optional(),
  adlEatingSupport: z.string().optional(),
  adlToiletSmall3Level: adl3LevelEnum.optional(),
  adlToiletSmallSupport: z.string().optional(),
  adlToiletLarge3Level: adl3LevelEnum.optional(),
  adlToiletLargeSupport: z.string().optional(),
  adlBathing3Level: adl3LevelEnum.optional(),
  adlBathingSupport: z.string().optional(),
  adlDressing3Level: adl3LevelEnum.optional(),
  adlDressingSupport: z.string().optional(),
  adlOther3Level: z.string().optional(),

  // ============================================
  // 既存フィールド
  // ============================================
  adlMovement: z.string().optional(),
  adlEating: z.string().optional(),
  adlToilet: z.string().optional(),
  adlBathing: z.string().optional(),
  adlDressing: z.string().optional(),
  adlGrooming: z.string().optional(),

  commMethod: z.string().optional(),
  commVision: z.string().optional(),
  commHearing: z.string().optional(),
  commSpeech: z.string().optional(),

  lifeRhythm: z.string().optional(),
  hobbies: z.string().optional(),
  personality: z.string().optional(),

  cautions: z.string().optional(),
  emergencyNote: z.string().optional(),

  medicationDetails: z.string().optional(),

  toiletCareTypes: z.array(z.string()).optional(),
  toiletInterval: z.string().optional(),
  toiletNote: z.string().optional(),

  familyStructure: z.string().optional(),
  supportSystem: z.string().optional(),
});

export type AssessmentInput = z.infer<typeof assessmentSchema>;

// ============================================
// アセスメント更新用スキーマ（idを含む）
// ============================================
export const assessmentUpdateSchema = assessmentSchema.extend({
  id: z.string().cuid(),
});

export type AssessmentUpdateInput = z.infer<typeof assessmentUpdateSchema>;
