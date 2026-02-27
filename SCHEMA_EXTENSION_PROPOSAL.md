# Prisma Schema 拡張提案

## 概要
引き継ぎ文書（`docs/archive/引き継ぎ用.md`）で特定された紙ベースのフェイスシート・アセスメントシートの全項目を、デジタル化するためのPrismaスキーマ拡張提案。

## 分析結果サマリー

### 既存のCareRecipientモデルの状況
- 基本情報の多くは実装済み（氏名、生年月日、性別、住所、電話など）
- サービス・受給者証情報は実装済み
- 障害福祉制度情報の基本は実装済み
- 性格・支援方法の基本は実装済み

### 不足している項目
以下のカテゴリーで追加フィールドが必要：
1. **書類ヘッダー情報**（作成日、法人名、サービス管理責任者名など）
2. **緊急連絡先詳細**（FAX番号）
3. **家族構成**（構造化データまたは自由記述）
4. **経済的状況詳細**（年金額、公費医療詳細、医療保険種別など）
5. **生活歴**（年表形式のデータ）
6. **医療情報詳細**（通院頻度、定期受診項目、服薬タイミングの詳細）
7. **趣味・関心・余暇・嗜好**（8カテゴリーの詳細）
8. **こだわり**（過去・現在）
9. **自傷・他害・パニック**（各詳細）
10. **感覚過敏・鈍麻**（音・光・味覚・触覚・におい）
11. **服薬詳細**（時間帯ごとの詳細、臨時薬）
12. **発作詳細**（起きやすい時間帯、頻度、対処法）
13. **人柄**（自由記述）

### 既存のAssessmentモデルの状況
- 基本的な評価項目は実装済み（ADL、コミュニケーション、認知など）
- しかし、紙のアセスメントシートの詳細項目とは一部異なる

## 拡張案1: CareRecipientモデルの拡張

### 1-1. 書類ヘッダー情報（オプション）
```prisma
model CareRecipient {
  // ... 既存フィールド ...

  // 書類ヘッダー情報
  faceSheetCreatedDate    DateTime?  // フェイスシート作成日
  corporationName         String?    // 法人名（例：特定非営利活動法人〜）
  groupHomeName           String?    // グループホーム名（既存のghNameと重複の可能性）
  serviceManagerName      String?    // サービス管理責任者名
}
```

**推奨**: これらは別途DocumentHeaderテーブルを作成する方が適切かもしれない（複数バージョン管理の観点から）

### 1-2. 緊急連絡先詳細
```prisma
model CareRecipient {
  // ... 既存フィールド ...

  // 緊急連絡先（既存のemergencyContact, emergencyRelationに追加）
  emergencyContactFax     String?    // 緊急連絡先FAX
}
```

### 1-3. 家族構成
```prisma
model CareRecipient {
  // ... 既存フィールド ...

  // 家族構成
  familyStructureDiagram  String?    // 家族構成図（自由記述・家系図形式）
}
```

**検討事項**: 将来的にFamilyMemberテーブルとして正規化するか？

### 1-4. 経済的状況詳細
```prisma
model CareRecipient {
  // ... 既存フィールド ...

  // 経済的状況
  pensionGrade            String?    // 障害基礎年金の級（1級/2級）
  pensionAmount           Int?       // 年金額（円）
  hasPublicMedical        Boolean?   // 公費医療の有無
  publicMedicalNote       String?    // 公費医療詳細

  // 医療保険種別（複数選択可能なため、JSON配列またはEnum配列）
  healthInsuranceTypes    String[]   @default([]) // ["本人", "家族", "国民健康保険", "共済組合", "医療券"]
  healthInsuranceOther    String?    // その他医療保険詳細

  economicNote            String?    // 経済状況その他
}
```

### 1-5. 生活歴（年表）
```prisma
model CareRecipient {
  // ... 既存フィールド ...

  // 生活歴
  lifeHistory             Json?      // 生活歴年表（JSON配列: [{year: "YYYY/MM", event: "入園"}]）
  finalEducation          String?    // 最終学歴（年月＋学校等）
  workHistory             Json?      // 主な職歴（JSON配列: [{period: "開始〜終了", content: "内容"}]）
}
```

**推奨**: 将来的にLifeHistoryEventテーブルとして正規化

### 1-6. 医療情報詳細
```prisma
model CareRecipient {
  // ... 既存フィールド ...

  // 疾病・発作（既存のhealthNoteに加えて）
  hasDisease              Boolean?   // 疾病などの有無
  diseaseDetail           String?    // 疾病詳細
  hasSeizure              Boolean?   // 発作の有無（既存フィールドと重複確認）
  seizureFrequencyDetail  String?    // 発作頻度詳細
  seizureTimePattern      String?    // 発作が起きやすい時間帯
  seizureResponse         String?    // 発作時の対処法
  seizureHistoryNote      String?    // 発作履歴補足（例：10年以上なし）

  // 服薬詳細（既存のmedicationに加えて）
  medicationMorning       String?    // 朝食後の服薬内容
  medicationNoon          String?    // 昼食後の服薬内容
  medicationEvening       String?    // 夕食後の服薬内容
  medicationBedtime       String?    // 就寝前の服薬内容
  medicationOtherTime     String?    // その他時間帯の服薬（例：16時）
  medicationTimeSpecific  String?    // 時間で服薬するもの
  medicationNote          String?    // 服薬特記

  // 臨時薬（頓服・季節薬）
  hasPrnMedication        Boolean?   // 臨時薬の有無
  prnMedicationContent    String?    // 臨時薬の内容
  prnMedicationTiming     String?    // どういうときに飲むか（例：不眠時）
  prnMedicationMemo       String?    // 臨時薬メモ（例：マイスリー）

  // 塗薬等
  hasTopicalMedication    Boolean?   // 塗薬等の有無
  topicalMedicationNote   String?    // 塗薬等詳細

  // 通院詳細（既存のhospital, doctorに加えて）
  medicalVisits           Json?      // 通院情報（JSON配列: [{hospital: "", department: "", ended: false, frequency: ""}]）
  renalCheckFrequency     String?    // 腎機能チェック頻度
  dentalCheckFrequency    String?    // 歯科受診頻度
  medicalOtherNote        String?    // 医療関連その他（足のふくらみ/薬局等）
}
```

### 1-7. サービス利用状況詳細
```prisma
model CareRecipient {
  // ... 既存フィールド ...

  // サービス利用状況
  currentServices         Json?      // 現在利用しているサービス（JSON配列: [{name: "", frequency: "", note: ""}]）

  // 成年後見制度
  hasGuardianship         Boolean?   // 成年後見制度の利用
  guardianshipType        String?    // 種別（補助/補佐/後見）

  // 地域福祉権利擁護事業
  hasRightsAdvocacy       Boolean?   // 地域福祉権利擁護事業の利用
  rightsAdvocacyNote      String?    // 利用詳細
}
```

### 1-8. 趣味・関心・余暇・嗜好
```prisma
model CareRecipient {
  // ... 既存フィールド ...（既存のhobbiesに加えて）

  // 趣味・関心・余暇・嗜好（8カテゴリー）
  hobbyOuting             String?    // 外出（好きな外出先・嫌いな外出先等）
  hobbyTv                 String?    // TV（好きな番組・嫌いな番組）
  hobbyMusic              String?    // 音楽（好きな曲・嫌いな曲）
  hobbyBook               String?    // 本・雑誌（好きな本・嫌いな本）
  hobbyInterpersonal      String?    // 対人関係・遊び（2人以上で楽しめる遊び等）
  hobbyInterestScope      String?    // 趣味の範囲（特定なものへの関心等）
  hobbyFoodPreference     String?    // 嗜好物等（好きな食べ物・嫌いな食べ物等）
  hobbyOther              String?    // その他（その他の遊び、余暇活動）
}
```

### 1-9. こだわり
```prisma
model CareRecipient {
  // ... 既存フィールド ...

  // こだわり
  obsessionPast           String?    // 過去、こだわっていたこと
  obsessionCurrent        String?    // 現在、こだわっていること
}
```

### 1-10. 自傷・他害・パニック
```prisma
model CareRecipient {
  // ... 既存フィールド ...

  // 自傷・他害・パニック
  selfHarmContent         String?    // 自傷の内容
  aggressionContent       String?    // 他害の内容
  panicContent            String?    // パニックの内容
}
```

### 1-11. 感覚（過敏・鈍麻）
```prisma
model CareRecipient {
  // ... 既存フィールド ...（既存のsensoryNoteに加えて）

  // 感覚詳細
  sensorySound            String?    // 音（好きな音/嫌いな音、特定の音に過敏等）
  sensoryLight            String?    // 光（過敏さ等）
  sensoryTaste            String?    // 味覚（偏食、味の好み、飲み込み等）
  sensoryTouch            String?    // 触覚（衣服の材質/タグ等へのこだわり、触れ方等）
  sensorySmell            String?    // におい（食事の好み、臭いに敏感等）
  sensoryOther            String?    // その他感覚
}
```

### 1-12. 人柄
```prisma
model CareRecipient {
  // ... 既存フィールド ...（既存のpersonalityNoteと重複確認）

  // 人柄
  personality             String?    // 人柄（自由記述）
}
```

**注**: 既存の`personalityNote`と統合するか、使い分けるか検討

## 拡張案2: Assessmentモデルの拡張

紙のアセスメントシートとの対応を確認し、以下の項目を追加・調整：

### 2-1. ヘッダー情報の追加
```prisma
model Assessment {
  // ... 既存フィールド ...

  // ヘッダー情報（既存のrecipient relationから取得可能だが、スナップショットとして保存）
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
}
```

### 2-2. 表現のコミュニケーション（チェックボックス形式）
```prisma
model Assessment {
  // ... 既存フィールド ...

  // 表現手段（複数選択可能）
  commExpressionMethods   String[]   @default([]) // ["ことば単語", "ことば二語文以上", "文字単語", "文字二語文以上", "サイン言語", "ジェスチャー", "絵・写真", "物を使う", "直接動作", "発声", "その他"]
  commExpressionContent   String?    // 自発的に表現する内容
  commExpressionOther     String?    // その他
}
```

### 2-3. 理解のコミュニケーション（チェックボックス形式）
```prisma
model Assessment {
  // ... 既存フィールド ...

  // 効果的な指示・伝え方（複数選択可能）
  commUnderstandMethods   String[]   @default([]) // ["言語指示単語", "言語指示二語文以上", "文字ひらがな", "文字漢字", "簡単な文", "ジェスチャー", "絵・写真", "物の提示", "見本の提示", "手添え", "その他"]

  // 認知レベル（わかるもの）（複数選択可能）
  commCognitionLevels     String[]   @default([]) // ["物の区別", "物の名称", "形・色の区別", "形・色の名称", "ひらがなが読める", "形・色のマッチング", "簡単な単語が読める", "簡単な文が読める", "お金の区別", "金銭の大小", "数える一けた", "数える二けた", "時計アナログ", "時計デジタル", "簡単な計算", "交通標識の意味", "信号の意味", "卓上ゲームのルール", "危険の認識", "その他"]
  commCognitionOther      String?    // その他
}
```

### 2-4. 身辺自立（3段階評価＋支援メモ）
```prisma
model Assessment {
  // ... 既存フィールド ...

  // 身辺自立（既存のADL評価と重複するため、統合または調整が必要）
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

**注**: 既存のAssessmentモデルにある1-5段階評価（eatingLevel, toiletingLevel, bathingLevel, dressingLevel）と、紙のアセスメントシートの3段階評価（自立/ある程度できる/できない）の統合方法を検討する必要がある。

## 拡張案3: 新規テーブルの作成（正規化アプローチ）

データの正規化と将来の拡張性を考慮し、以下のテーブル作成を推奨：

### 3-1. FamilyMember（家族構成）
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

### 3-2. LifeHistoryEvent（生活歴）
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

### 3-3. MedicalVisit（通院情報）
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

### 3-4. ServiceUsage（サービス利用状況）
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

## 実装推奨順序

### Phase 1: 即時実装（高優先度）
CareRecipientモデルに追加:
1. 緊急連絡先FAX（emergencyContactFax）
2. 感覚詳細フィールド（sensorySound, sensoryLight, sensoryTaste, sensoryTouch, sensorySmell, sensoryOther）
3. こだわり（obsessionPast, obsessionCurrent）
4. 自傷・他害・パニック（selfHarmContent, aggressionContent, panicContent）
5. 趣味詳細（8カテゴリー）
6. 服薬詳細（時間帯別、臨時薬）
7. 発作詳細（seizureTimePattern, seizureResponse, seizureHistoryNote）

Assessmentモデルに追加:
1. ヘッダー情報（スナップショット）
2. 表現のコミュニケーション（配列フィールド）
3. 理解のコミュニケーション（配列フィールド）

### Phase 2: 中期実装（中優先度）
1. 経済的状況詳細（年金、医療保険）
2. サービス利用状況詳細（成年後見制度、権利擁護事業）
3. 医療情報詳細（通院詳細、塗薬等）
4. 家族構成（まずはfamilyStructureDiagramで自由記述、後にFamilyMemberテーブル化）

### Phase 3: 長期実装（正規化）
1. FamilyMemberテーブル作成
2. LifeHistoryEventテーブル作成
3. MedicalVisitテーブル作成
4. ServiceUsageテーブル作成
5. 既存データの移行

### Phase 4: 最適化
1. 書類ヘッダー情報の管理方法検討（DocumentHeaderテーブル？）
2. JSON配列フィールドの専用テーブル化検討
3. パフォーマンス最適化（インデックス追加等）

## データ型とバリデーションの推奨

### String[] 配列フィールドの使用
以下のフィールドは複数選択可能なため、String配列を推奨：
- healthInsuranceTypes
- commExpressionMethods
- commUnderstandMethods
- commCognitionLevels

### Enumの検討
以下のフィールドはEnum化を検討：
- guardianshipType: "補助" | "補佐" | "後見"
- adlEating, adlToiletSmall, etc.: "自立" | "ある程度できる" | "できない"

### Jsonフィールドの使用
以下のフィールドは構造化データのためJsonを推奨（Phase 3で正規化）：
- lifeHistory
- workHistory
- medicalVisits
- currentServices

## バックワード互換性

既存データとの互換性を保つため：
1. 新規フィールドはすべて`optional`（?）とする
2. 既存フィールドとの重複がある場合は、既存フィールドを優先的に使用
3. データ移行スクリプトを用意する（例：既存のsensoryNoteをsensoryOtherに移行）

## マイグレーション戦略

1. **開発環境でテスト**: まずローカル環境で全フィールドを追加
2. **段階的デプロイ**: Phase 1のフィールドから順次本番環境に適用
3. **データ移行**: 既存データが影響を受けないことを確認
4. **UI実装**: フィールド追加後、UI側で入力・表示機能を実装
5. **バリデーション追加**: 入力値の妥当性検証を追加

## 次のステップ

1. ✅ **Step 1完了**: このスキーマ拡張提案を作成
2. ⏳ **Step 2**: 要件定義書の更新
   - `REQUIREMENTS_FACE_SHEET.md`に詳細フィールドリストを追加
   - `REQUIREMENTS_ASSESSMENT_SHEET.md`に詳細フィールドリストを追加
3. ⏳ **Step 3**: 実装計画の策定
   - Phase 1のマイグレーションファイル作成
   - tRPCルーターの更新計画
   - UI実装計画

## 質問・検討事項

1. **既存フィールドとの重複**: `personalityNote` vs `personality`、`sensoryNote` vs 個別sensoryフィールドの使い分けは？
2. **Assessmentモデルの評価スケール**: 1-5段階評価 vs 3段階評価（自立/ある程度/できない）の統合方法は？
3. **正規化のタイミング**: Phase 3の正規化テーブル作成のタイミングはいつが適切？
4. **書類バージョン管理**: フェイスシートの作成日や複数バージョンの管理は必要？

---

**作成日**: 2026-02-27
**ベース**: `docs/archive/引き継ぎ用.md`
**既存スキーマ**: `prisma/schema.prisma` (lines 211-510)
