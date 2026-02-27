# 実装計画書

## 概要
紙ベースのフェイスシート・アセスメントシートを完全にデジタル化するための段階的実装計画。

## 前提条件

### 完了済み
- ✅ スキーマ拡張提案書の作成（`SCHEMA_EXTENSION_PROPOSAL.md`）
- ✅ フェイスシート要件定義の更新（`REQUIREMENTS_FACE_SHEET.md`）
- ✅ アセスメントシート要件定義の更新（`REQUIREMENTS_ASSESSMENT_SHEET.md`）

### 実装前の確認事項
- [ ] スキーマ拡張提案のレビュー・承認
- [ ] データベースバックアップの取得
- [ ] 開発環境でのテスト環境構築

## Phase 1: 基盤整備（高優先度フィールドの追加）

### 目標
紙のフェイスシート・アセスメントシートで頻繁に使用される重要フィールドをデジタル化し、基本的な運用を可能にする。

### 1-1. Prismaスキーマの拡張

#### CareRecipientモデル - Phase 1フィールド追加

```prisma
model CareRecipient {
  // ... 既存フィールド ...

  // 【緊急連絡先詳細】
  emergencyContactFax     String?    // 緊急連絡先FAX

  // 【感覚詳細】（重要度：高）
  sensorySound            String?    // 音（好きな音/嫌いな音、特定の音に過敏等）
  sensoryLight            String?    // 光（過敏さ等）
  sensoryTaste            String?    // 味覚（偏食、味の好み、飲み込み等）
  sensoryTouch            String?    // 触覚（衣服の材質/タグ等へのこだわり、触れ方等）
  sensorySmell            String?    // におい（食事の好み、臭いに敏感等）
  sensoryOther            String?    // その他感覚

  // 【こだわり】（重要度：高）
  obsessionPast           String?    // 過去、こだわっていたこと
  obsessionCurrent        String?    // 現在、こだわっていること

  // 【自傷・他害・パニック】（重要度：高）
  selfHarmContent         String?    // 自傷の内容
  aggressionContent       String?    // 他害の内容
  panicContent            String?    // パニックの内容

  // 【趣味・関心・余暇・嗜好】（重要度：高）
  hobbyOuting             String?    // 外出（好きな外出先・嫌いな外出先等）
  hobbyTv                 String?    // TV（好きな番組・嫌いな番組）
  hobbyMusic              String?    // 音楽（好きな曲・嫌いな曲）
  hobbyBook               String?    // 本・雑誌（好きな本・嫌いな本）
  hobbyInterpersonal      String?    // 対人関係・遊び（2人以上で楽しめる遊び等）
  hobbyInterestScope      String?    // 趣味の範囲（特定なものへの関心等）
  hobbyFoodPreference     String?    // 嗜好物等（好きな食べ物・嫌いな食べ物等）
  hobbyOther              String?    // その他（その他の遊び、余暇活動）

  // 【服薬詳細】（重要度：高）
  medicationMorning       String?    // 朝食後の服薬内容
  medicationNoon          String?    // 昼食後の服薬内容
  medicationEvening       String?    // 夕食後の服薬内容
  medicationBedtime       String?    // 就寝前の服薬内容
  medicationOtherTime     String?    // その他時間帯の服薬（例：16時）
  medicationTimeSpecific  String?    // 時間で服薬するもの
  medicationNote          String?    // 服薬特記

  // 【臨時薬】（重要度：高）
  hasPrnMedication        Boolean?   // 臨時薬の有無
  prnMedicationContent    String?    // 臨時薬の内容
  prnMedicationTiming     String?    // どういうときに飲むか（例：不眠時）
  prnMedicationMemo       String?    // 臨時薬メモ（例：マイスリー）

  // 【発作詳細】（重要度：高）
  seizureTimePattern      String?    // 発作が起きやすい時間帯
  seizureResponse         String?    // 発作時の対処法
  seizureHistoryNote      String?    // 発作履歴補足（例：10年以上なし）

  // 【塗薬等】
  hasTopicalMedication    Boolean?   // 塗薬等の有無
  topicalMedicationNote   String?    // 塗薬等詳細

  // 【人柄】
  personality             String?    // 人柄（自由記述）
}
```

#### Assessmentモデル - Phase 1フィールド追加

```prisma
model Assessment {
  // ... 既存フィールド ...

  // 【ヘッダー情報（スナップショット）】
  recipientGender         String?    // 性別（スナップショット）
  recipientDisabilityName String?    // 障害名（スナップショット）
  recipientSupportLevel   String?    // 支援区分（スナップショット）
  recipientHandbook       String?    // 障害者手帳（種別・等級）（スナップショット）
  recipientFacility       String?    // 事業所名（スナップショット）
  recipientAddress        String?    // 住所・連絡先（スナップショット）
  serviceManager          String?    // サービス管理責任者
  homeManager             String?    // ホーム長
  dayService              String?    // 通所先
  familyStatus            String?    // 家族の状況
  recentStatus            String?    // 最近の状況

  // 【社会性・対人行動】
  socialRelationship      String?    // 人との関係の取り方
  socialRules             String?    // 社会的なルールの理解

  // 【表現のコミュニケーション】
  commExpressionMethods   String[]   @default([]) // 表現手段（複数選択）
  commExpressionContent   String?    // 自発的に表現する内容
  commExpressionOther     String?    // その他

  // 【理解のコミュニケーション】
  commUnderstandMethods   String[]   @default([]) // 効果的な指示・伝え方（複数選択）
  commCognitionLevels     String[]   @default([]) // 認知レベル（わかるもの）（複数選択）
  commCognitionOther      String?    // その他

  // 【身辺自立（3段階評価）】
  adlEating               String?    // 食事（自立/ある程度できる/できない）
  adlEatingSupport        String?    // 食事支援メモ
  adlToiletSmall          String?    // トイレ小（自立/ある程度できる/できない）
  adlToiletSmallSupport   String?    // トイレ小支援メモ
  adlToiletLarge          String?    // トイレ大（自立/ある程度できる/できない）
  adlToiletLargeSupport   String?    // トイレ大支援メモ
  adlBathing              String?    // 入浴（自立/ある程度できる/できない）
  adlBathingSupport       String?    // 入浴支援メモ
  adlDressing             String?    // 着替え（自立/ある程度できる/できない）
  adlDressingSupport      String?    // 着替え支援メモ
  adlOther                String?    // その他
}
```

#### マイグレーションファイル作成

```bash
cd /Volumes/Extreme\ Pro/cortex_os
pnpm prisma migrate dev --name add_phase1_fields
```

### 1-2. tRPCルーターの更新

#### recipient.ts の更新

- `update` procedure: Phase 1フィールドのバリデーション追加
- 入力スキーマ（Zod）にPhase 1フィールドを追加

#### assessment.ts の更新

- `create` / `update` procedure: Phase 1フィールドのバリデーション追加
- 配列フィールド（commExpressionMethods等）の処理追加

### 1-3. UI実装

#### フェイスシート詳細ページ（`/recipients/[id]/page.tsx`）

**新規セクション追加:**
1. 趣味・関心セクション（hobbyOuting〜hobbyOther）
2. こだわりセクション（obsessionPast, obsessionCurrent）
3. 自傷・他害・パニックセクション（selfHarmContent等）
4. 感覚詳細セクション（sensorySound〜sensoryOther）
5. 服薬詳細セクション（medicationMorning〜prnMedicationMemo）
6. 発作詳細セクション（seizureTimePattern等）
7. 人柄セクション（personality）

**実装方針:**
- 既存のセクション折りたたみパターンを踏襲
- 値がある項目のみ表示
- アイコン・カラーリングは既存に準拠

#### 編集ページ（`/recipients/[id]/edit/page.tsx`）

**フォーム追加:**
- Phase 1フィールドの入力フォーム追加
- テキストエリアコンポーネントの活用
- チェックボックス（Boolean型フィールド）の追加

#### アセスメント作成ページ（新規作成）

**ファイル:** `/src/app/recipients/[id]/assessment/new/page.tsx`

**実装内容:**
1. ヘッダー情報入力フォーム
2. 社会性・対人行動入力
3. 表現のコミュニケーション（チェックボックス＋テキストエリア）
4. 理解のコミュニケーション（チェックボックス＋テキストエリア）
5. 身辺自立（3段階ラジオボタン＋テキストエリア）
6. 既存の1-5段階評価フォーム
7. 総合所見・支援目標

**使用コンポーネント:**
- Radix UI: RadioGroup, Checkbox
- React Hook Form: フォーム管理
- Zod: バリデーション

### 1-4. バリデーション

#### Zodスキーマ定義（新規ファイル）

**ファイル:** `/src/lib/validations/assessment.ts`

```typescript
import { z } from "zod";

// 表現のコミュニケーション手段の選択肢
export const commExpressionMethodsEnum = z.enum([
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
]);

// 理解のコミュニケーション手段の選択肢
export const commUnderstandMethodsEnum = z.enum([
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
]);

// 認知レベルの選択肢
export const commCognitionLevelsEnum = z.enum([
  "物の区別",
  "物の名称",
  // ... 他の選択肢 ...
]);

// 身辺自立の3段階評価
export const adlLevelEnum = z.enum(["自立", "ある程度できる", "できない"]);

export const assessmentSchema = z.object({
  recipientId: z.string(),
  assessmentDate: z.date(),
  assessedBy: z.string().optional(),

  // ヘッダー情報
  serviceManager: z.string().optional(),
  homeManager: z.string().optional(),
  // ... 他のフィールド ...

  // 表現のコミュニケーション
  commExpressionMethods: z.array(commExpressionMethodsEnum).optional(),
  commExpressionContent: z.string().optional(),

  // 身辺自立
  adlEating: adlLevelEnum.optional(),
  adlEatingSupport: z.string().optional(),
  // ... 他のフィールド ...
});
```

### 1-5. 監査ログ統合

#### 新規フィールドのログ記録

- `src/components/recipients/ChangeHistory.tsx`の`FIELD_LABELS`に追加
- Phase 1フィールドの日本語名マッピング追加

### 1-6. テスト

#### 単体テスト
- [ ] tRPCルーターのテスト（新規フィールドのCRUD）
- [ ] バリデーションスキーマのテスト

#### E2Eテスト
- [ ] フェイスシート詳細ページの表示テスト
- [ ] 編集ページの入力テスト
- [ ] アセスメント作成ページのテスト

### 1-7. デプロイ

1. マイグレーションの本番適用
2. Vercelへのデプロイ
3. 本番環境での動作確認

### Phase 1の成果物

- ✅ Prismaスキーマ拡張（CareRecipient: 30+フィールド、Assessment: 20+フィールド）
- ✅ マイグレーションファイル
- ✅ tRPCルーター更新
- ✅ フェイスシート詳細ページ更新
- ✅ フェイスシート編集ページ更新
- ✅ アセスメント作成ページ（新規）
- ✅ バリデーションスキーマ
- ✅ 監査ログ統合

---

## Phase 2: 中優先度フィールドの追加

### 目標
経済状況、サービス利用状況、医療情報の詳細フィールドを追加し、紙のフェイスシートの全項目をカバーする。

### 2-1. Prismaスキーマの拡張

#### CareRecipientモデル - Phase 2フィールド追加

```prisma
model CareRecipient {
  // ... Phase 1までのフィールド ...

  // 【経済的状況詳細】
  pensionGrade            String?    // 障害基礎年金の級（1級/2級）
  pensionAmount           Int?       // 年金額（円）
  hasPublicMedical        Boolean?   // 公費医療の有無
  publicMedicalNote       String?    // 公費医療詳細
  healthInsuranceTypes    String[]   @default([]) // 医療保険種別（複数選択）
  healthInsuranceOther    String?    // その他医療保険詳細
  economicNote            String?    // 経済状況その他

  // 【サービス利用状況詳細】
  hasGuardianship         Boolean?   // 成年後見制度の利用
  guardianshipType        String?    // 種別（補助/補佐/後見）
  hasRightsAdvocacy       Boolean?   // 地域福祉権利擁護事業の利用
  rightsAdvocacyNote      String?    // 利用詳細

  // 【医療情報詳細】
  hasDisease              Boolean?   // 疾病などの有無
  diseaseDetail           String?    // 疾病詳細
  renalCheckFrequency     String?    // 腎機能チェック頻度
  dentalCheckFrequency    String?    // 歯科受診頻度
  medicalOtherNote        String?    // 医療関連その他（足のふくらみ/薬局等）

  // 【家族構成】（まずは自由記述で）
  familyStructureDiagram  String?    // 家族構成図（自由記述・家系図形式）

  // 【生活歴】（JSON配列で保存）
  lifeHistory             Json?      // 生活歴年表（JSON配列）
  finalEducation          String?    // 最終学歴（年月＋学校等）
  workHistory             Json?      // 主な職歴（JSON配列）

  // 【通院情報】（JSON配列で保存）
  medicalVisits           Json?      // 通院情報（JSON配列）

  // 【サービス利用】（JSON配列で保存）
  currentServices         Json?      // 現在利用しているサービス（JSON配列）
}
```

### 2-2. UI実装

#### フェイスシート詳細ページ更新
- 経済的状況セクション
- サービス利用状況セクション
- 家族構成セクション
- 生活歴セクション（年表表示）
- 通院情報セクション（テーブル表示）

#### 編集ページ更新
- Phase 2フィールドのフォーム追加
- 配列型フィールドの動的追加/削除UI
- JSONフィールドの入力UI（年表、職歴、通院情報）

### 2-3. コンポーネント作成

**新規コンポーネント:**
- `LifeHistoryTable`: 生活歴年表の表示・編集
- `MedicalVisitTable`: 通院情報の表示・編集
- `ServiceUsageTable`: サービス利用状況の表示・編集

### Phase 2の成果物

- ✅ Prismaスキーマ拡張（CareRecipient: 20+フィールド）
- ✅ マイグレーションファイル
- ✅ UI更新（詳細ページ・編集ページ）
- ✅ 動的配列入力コンポーネント
- ✅ JSON配列表示コンポーネント

---

## Phase 3: データ正規化とテーブル分割

### 目標
JSON配列フィールドを専用テーブルに正規化し、データ整合性とクエリパフォーマンスを向上させる。

### 3-1. 新規テーブル作成

#### FamilyMemberテーブル

```prisma
model FamilyMember {
  id              String        @id @default(cuid())
  recipientId     String
  recipient       CareRecipient @relation(fields: [recipientId], references: [id], onDelete: Cascade)

  name            String        // 氏名
  relationship    String        // 続柄
  age             Int?          // 年齢
  isLivingTogether Boolean?     // 同居の有無
  notes           String?       // メモ

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  deletedAt       DateTime?

  @@index([recipientId])
}
```

#### LifeHistoryEventテーブル

```prisma
model LifeHistoryEvent {
  id              String        @id @default(cuid())
  recipientId     String
  recipient       CareRecipient @relation(fields: [recipientId], references: [id], onDelete: Cascade)

  eventDate       String        // 年月（YYYY/MM形式）
  eventType       String        // イベント種類（入園/入学/卒業/入職等）
  description     String        // 詳細
  sortOrder       Int?          // 並び順

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  deletedAt       DateTime?

  @@index([recipientId])
  @@index([eventDate])
}
```

#### MedicalVisitテーブル

```prisma
model MedicalVisit {
  id              String        @id @default(cuid())
  recipientId     String
  recipient       CareRecipient @relation(fields: [recipientId], references: [id], onDelete: Cascade)

  hospitalName    String        // 医療機関名
  department      String?       // 受診科
  frequency       String?       // 頻度
  isEnded         Boolean       @default(false) // 利用終了
  notes           String?       // 備考

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  deletedAt       DateTime?

  @@index([recipientId])
}
```

#### ServiceUsageテーブル

```prisma
model ServiceUsage {
  id              String        @id @default(cuid())
  recipientId     String
  recipient       CareRecipient @relation(fields: [recipientId], references: [id], onDelete: Cascade)

  serviceName     String        // サービス名
  frequency       String?       // 利用頻度
  notes           String?       // 備考
  isActive        Boolean       @default(true) // 現在利用中

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  deletedAt       DateTime?

  @@index([recipientId])
}
```

### 3-2. データ移行スクリプト

**ファイル:** `/scripts/migrate-json-to-tables.ts`

```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function migrateLifeHistory() {
  const recipients = await prisma.careRecipient.findMany({
    where: { lifeHistory: { not: null } },
  });

  for (const recipient of recipients) {
    const lifeHistory = recipient.lifeHistory as any[];

    if (Array.isArray(lifeHistory)) {
      for (const [index, event] of lifeHistory.entries()) {
        await prisma.lifeHistoryEvent.create({
          data: {
            recipientId: recipient.id,
            eventDate: event.year,
            eventType: event.event,
            description: event.description || "",
            sortOrder: index,
          },
        });
      }
    }
  }
}

// 他のテーブルも同様に移行...

async function main() {
  await migrateLifeHistory();
  // await migrateMedicalVisits();
  // await migrateServiceUsage();
  // await migrateFamilyMembers();
}

main();
```

### 3-3. tRPCルーター追加

**新規ルーター:**
- `familyMember.ts`
- `lifeHistoryEvent.ts`
- `medicalVisit.ts`
- `serviceUsage.ts`

各ルーターに基本的なCRUD操作を実装。

### 3-4. UI更新

#### 詳細ページ
- 正規化テーブルからデータを取得して表示

#### 編集ページ
- 関連テーブルの編集UI（追加/編集/削除）

### Phase 3の成果物

- ✅ 4つの新規テーブル作成
- ✅ データ移行スクリプト
- ✅ 4つの新規tRPCルーター
- ✅ UI更新（詳細・編集ページ）
- ✅ 既存JSON配列フィールドの非推奨化（deprecated）

---

## Phase 4: 最適化と拡張機能

### 目標
システム全体のパフォーマンスを最適化し、将来の拡張に備える。

### 4-1. 書類ヘッダー管理

#### DocumentHeaderテーブル作成

```prisma
model DocumentHeader {
  id                      String        @id @default(cuid())
  recipientId             String
  recipient               CareRecipient @relation(fields: [recipientId], references: [id], onDelete: Cascade)

  documentType            String        // フェイスシート/アセスメント等
  version                 Int           @default(1)
  createdDate             DateTime      @default(now())
  corporationName         String?       // 法人名
  facilityName            String?       // 事業所名/GH名
  serviceManagerName      String?       // サービス管理責任者名

  createdAt               DateTime      @default(now())
  updatedAt               DateTime      @updatedAt

  @@index([recipientId])
  @@index([documentType, version])
}
```

### 4-2. パフォーマンス最適化

#### インデックスの追加
- 頻繁に検索されるフィールドにインデックス追加
- 複合インデックスの検討

#### クエリの最適化
- N+1問題の解消（includeの適切な使用）
- ページネーション実装
- 無限スクロール（オプション）

### 4-3. CSV一括インポート/エクスポート改善

#### インポート機能強化
- Phase 1〜3で追加したフィールドの対応
- バリデーション強化
- エラーハンドリング改善

#### エクスポート機能強化
- 全フィールドのエクスポート対応
- カスタム出力フォーマット

### 4-4. PDF出力機能

#### サポート基本情報票の改善
- Phase 1〜3のフィールド含む
- レイアウト最適化
- 印刷プレビュー機能

#### アセスメントシートPDF
- レーダーチャート表示
- 推移グラフ表示

### Phase 4の成果物

- ✅ DocumentHeaderテーブル
- ✅ インデックス最適化
- ✅ CSV機能改善
- ✅ PDF機能改善
- ✅ パフォーマンステスト結果

---

## タイムライン（目安）

### Phase 1: 2週間
- Week 1: スキーマ拡張、マイグレーション、tRPC更新
- Week 2: UI実装、テスト、デプロイ

### Phase 2: 1.5週間
- Week 3: スキーマ拡張、UI実装
- Week 4 (前半): テスト、デプロイ

### Phase 3: 2週間
- Week 4 (後半): テーブル設計、データ移行スクリプト
- Week 5: tRPCルーター、UI更新
- Week 6: テスト、デプロイ

### Phase 4: 1週間
- Week 7: 最適化、CSV/PDF改善、最終テスト

**合計: 約6.5週間**

---

## リスク管理

### 主要リスク

1. **データ移行の失敗**
   - 対策: 本番環境の完全バックアップ
   - 対策: ステージング環境での事前テスト
   - 対策: ロールバック計画の策定

2. **パフォーマンス劣化**
   - 対策: フィールド追加前後のベンチマーク
   - 対策: インデックスの適切な配置
   - 対策: クエリのプロファイリング

3. **既存データとの互換性**
   - 対策: 新規フィールドはすべてoptional
   - 対策: デフォルト値の適切な設定
   - 対策: 既存データの移行スクリプト

4. **UI/UXの複雑化**
   - 対策: セクション折りたたみによる情報整理
   - 対策: 必須項目と任意項目の明確化
   - 対策: ユーザーテストの実施

---

## チェックリスト

### Phase 1開始前
- [ ] スキーマ拡張提案のレビュー完了
- [ ] データベースバックアップ取得
- [ ] 開発環境セットアップ
- [ ] テスト計画作成

### Phase 1完了基準
- [ ] マイグレーション成功
- [ ] tRPCテスト全てパス
- [ ] UI動作確認完了
- [ ] 監査ログ記録確認
- [ ] 本番デプロイ完了

### Phase 2完了基準
- [ ] Phase 2フィールドすべて実装
- [ ] JSON配列入力UI動作確認
- [ ] テスト全てパス
- [ ] 本番デプロイ完了

### Phase 3完了基準
- [ ] 4テーブル作成完了
- [ ] データ移行成功
- [ ] tRPCルーター実装完了
- [ ] UI更新完了
- [ ] パフォーマンステストパス

### Phase 4完了基準
- [ ] 全機能実装完了
- [ ] パフォーマンス最適化完了
- [ ] CSV/PDF機能改善完了
- [ ] 最終テスト完了
- [ ] ドキュメント更新完了

---

## 参考資料

- スキーマ拡張提案: `SCHEMA_EXTENSION_PROPOSAL.md`
- フェイスシート要件: `REQUIREMENTS_FACE_SHEET.md`
- アセスメント要件: `REQUIREMENTS_ASSESSMENT_SHEET.md`
- 引き継ぎ文書: `docs/archive/引き継ぎ用.md`

---

**作成日**: 2026-02-27
**最終更新**: 2026-02-27
**ステータス**: Draft
