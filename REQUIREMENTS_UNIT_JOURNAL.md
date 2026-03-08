# 業務日誌システム 要件定義書

**作成日**: 2026-02-17
**更新日**: 2026-02-18
**ステータス**: Draft（レビュー中）

---

## 1. 目的

グループホーム等のユニット（ハウス）単位で、職員が業務日誌を記録・共有できるシステムを構築する。
各ユニットの利用者・職員構成に応じた入力画面を提供し、紙による記録業務をデジタル化する。
引き継ぎ・監査・事故対応・ケアの質向上に資する記録を残すことを目的とする。

### 1.1 システムの主軸（Plan → Do → Fact → Safety）

重度障害領域で要件が崩れない骨格として、以下の4レイヤを主軸とする。
行政・実地指導で見られるのもこの整合である。

| レイヤ | 内容 | 対応機能 |
|--------|------|---------|
| L1: Plan（計画） | 個別支援計画（意向/目標/支援内容/留意事項）| 個別支援計画機能（Phase B） |
| L2: Do（実施） | 日々の支援記録・業務日誌 | 業務日誌（DailyLog/DailyLogEntry）|
| L3: Fact（実績） | サービス提供実績・請求の根拠 | 実績管理（ServiceDelivery）（Phase C） |
| L4: Safety（安全） | 事故・ヒヤリハット・感染症・虐待防止・苦情 | インシデント管理（Phase D） |

各画面・API・DBは必ずこのどれかに属させる。

---

## 2. ユニット構成

### 2.1 実在するユニット（初期データ）

| ユニット名 | サービス種別 | 構成 |
|-----------|------------|------|
| ハウスてんじん | グループホーム（GH） | 職員2名・利用者4名程度 |
| ハウスみその | グループホーム（GH） | 職員2名・利用者4名程度 |
| ハウスあかしあ | グループホーム（GH） | 職員2名・利用者4名程度 |
| ハウスくまのみや | グループホーム（GH） | 職員2名・利用者4名程度 |
| ハウスなかまち | グループホーム（GH） | 職員2名・利用者4名程度 |

### 2.2 将来追加予定のサービス種別

- 居宅介護
- 重度訪問介護
- ショートステイ

---

## 3. 職員管理

### 3.1 所属区分

| 区分 | 説明 |
|------|------|
| 固定担当（primary） | 特定のユニットに常時所属する職員 |
| 臨時（temporary） | 休み等の突発対応で入る職員。対象日を指定 |

### 3.2 業務日誌における担当者

- 業務日誌作成時、「固定担当職員 ＋ 当日付きで登録された臨時職員」が担当者候補として表示される
- 担当体制として役割（リーダー/見守り/服薬確認など）も記録可能にする

---

## 4. 業務日誌 要件（L2: Do）

### 4.1 日誌ヘッダー（ユニット単位の共通項目）

| 項目 | 内容 |
|------|------|
| 基準日（logDate） | 勤務開始日を基準日とする（例：2/16 22:00開始 → logDate = 2/16） |
| 勤務シフト | 日勤 / 遅番 / 夜勤 |
| 勤務時間 | 開始日時・終了日時（日跨ぎ対応。例：2/16 22:00〜2/17 7:00） |
| 担当者 | 固定担当＋臨時から選択。役割（リーダー等）も記録 |
| 利用者在籍状況 | 在寮 / 外泊 / 入院 / 帰省 / 外出中（人数サマリ） |
| 全体トピック | 事故・ヒヤリハット・苦情・感染症疑い・行政連絡などの重大イベント有無 |
| 申し送り事項 | 次シフトへのToDo・注意点・観察ポイント |
| 関連支援区分 | 食事 / 排泄 / 服薬 / 行動 / 外出 など（個別支援計画との整合用） |

**日跨ぎ仕様（確定）**
- `logDate`は勤務開始日を使用
- UI表示は「2/16 22:00〜2/17 7:00」形式で開始・終了時刻を両方表示
- 終了日時が開始日時より前の場合はバリデーションエラー

### 4.2 利用者別記録（グループホーム固有・時系列）

#### A. 状態（体調・メンタル・リスク）

| 項目 | 内容 |
|------|------|
| バイタル | 体温・血圧・SpO2（必要な利用者のみ）・異常値フラグ |
| 睡眠 | 就寝時刻・覚醒・再入眠・夜間覚醒の原因（トイレ/不穏/疼痛など） |
| 行動・心理状態 | 不穏・自傷他害リスクの兆候・対応内容・結果（症状→対応→結果の形式） |

#### B. 生活支援（食事・水分・排泄・整容）

| 項目 | 内容 |
|------|------|
| 食事 | 摂取量・食事形態・むせ/誤嚥兆候 |
| 水分 | 摂取量（簡易）・脱水リスクの有無 |
| 排泄 | 排尿・排便・浣腸の有無、時刻、異常（下痢・便秘・血尿等） |
| 入浴/清拭 | 実施有無・拒否があれば理由 |
| 口腔ケア | 実施有無・拒否があれば理由 |
| 更衣 | 実施有無 |

#### C. 服薬

| 項目 | 内容 |
|------|------|
| 定時薬 | 利用者ごとに事前設定したスケジュール（朝/昼/夕/就寝前）をチェックボックスで表示。実施者・拒否/吐薬/副作用・見守り要否を記録 |
| 臨時薬 | 投薬理由・時刻・薬名・効果判定（効いた/未評価） |

#### D. 外出・外泊・帰寮

| 項目 | 内容 |
|------|------|
| 外出先 | 行き先 |
| 付き添い者 | 職員名または家族名 |
| 帰宅予定/実績 | 予定時刻・実際の帰寮時刻 |
| 帰寮時の様子 | 体調・気分・トラブル有無 |
| 外泊 | 外泊先・期間 |

#### E. 拒否記録

食事・服薬・入浴などの拒否が発生した場合：
- 拒否内容 → 声かけ内容 → 結果（受け入れ/引き続き拒否）

#### F. 個別支援計画との紐づけ

- `supportTags`：実施した支援区分（食事/排泄/服薬/行動・心理/移動など）を選択式で記録
- `planItemRefs`：個別支援計画のどの支援項目（SupportItem/Goal）に対する実施かを参照

#### G. 特記事項

- 自由記述欄（気づき・変化・本人の発言など）

### 4.3 事故・ヒヤリハット（業務日誌内の別枠・L4: Safety）

業務日誌内に「重大イベント有無」フラグがある場合、以下を記録する。
（`majorEvent=true` の場合、Incidentテーブルへ起票する導線を設ける）

| 項目 | 内容 |
|------|------|
| 発生区分 | 転倒 / 誤薬 / 行方不明 / 他害 / 物損 / 誤嚥 / 救急搬送 など |
| 発生日時・場所 | 5W1H（いつ/どこで/誰が/何を/なぜ/どう） |
| 初動 | 観察値・応急対応・連絡先（管理者/家族/医療/警察） |
| 再発防止メモ | 環境要因・対応改善点（簡易） |
| 参照マニュアル | 対応したマニュアル名（GHでは事故/緊急/感染症/虐待防止等） |

### 4.4 居宅介護・重度訪問介護固有項目（将来実装）

| 項目 | 内容 |
|------|------|
| 訪問開始・終了時刻 | ヘルパーの訪問時間 |
| サービス提供内容 | 身体介護・家事援助などチェック形式 |
| 移動・外出支援 | ガイド記録との連携または記録 |
| 申し送り・緊急連絡 | 次回訪問に向けた引き継ぎ |

---

## 5. 服薬スケジュール設定（MedicationSchedule）

利用者ごとに服薬スケジュールを事前設定する。

| 項目 | 内容 |
|------|------|
| 利用者 | 対象の利用者 |
| タイミング | 朝 / 昼 / 夕 / 就寝前 |
| 薬名 | 薬剤名（複数登録可） |
| 備考 | 用量・注意事項など |

業務日誌作成時、設定済みのスケジュールを元にチェックボックスを自動生成する。
異常値（バイタル）が発生した場合は「異常値→対応→連絡先（医療機関/家族/管理者）」をテンプレ表示する。

---

## 6. 画面構成

```
/units                        ユニット一覧
/units/[id]                   ユニット詳細（所属職員・利用者一覧）
/units/[id]/log               業務日誌一覧
/units/[id]/log/new           業務日誌作成（当日分）
/units/[id]/log/[logId]       業務日誌詳細・編集

/recipients/[id]/plan         個別支援計画（将来）
/recipients/[id]/plan/new     個別支援計画作成（将来）
```

---

## 7. データベース設計

### 7.1 追加済みテーブル

#### Unit（ユニット）

```prisma
model Unit {
  id          String   @id @default(cuid())
  name        String                          // ハウスてんじん等
  serviceType String                          // GH/居宅介護/重度訪問介護/ショートステイ
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  staffs     UnitStaff[]
  recipients UnitRecipient[]
}
```

#### UnitStaff（職員とユニットの紐づけ）

```prisma
model UnitStaff {
  id           String    @id @default(cuid())
  unitId       String
  userId       String
  role         String                          // primary / temporary
  assignedDate DateTime?                       // temporaryの場合のみ対象日
  createdAt    DateTime  @default(now())
}
```

#### UnitRecipient（利用者とユニットの紐づけ）

```prisma
model UnitRecipient {
  id          String    @id @default(cuid())
  unitId      String
  recipientId String
  joinedAt    DateTime  @default(now())
  leftAt      DateTime?                        // 退所時に設定
}
```

### 7.2 追加予定テーブル（Phase A: Do）

#### MedicationSchedule（服薬スケジュール設定）

```prisma
model MedicationSchedule {
  id             String   @id @default(cuid())
  recipientId    String
  timing         String                        // Morning/Noon/Evening/Bedtime
  medicationName String
  notes          String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

#### DailyLog（業務日誌ヘッダー）

```prisma
model DailyLog {
  id              String   @id @default(cuid())
  unitId          String
  logDate         DateTime                     // 基準日（勤務開始日）
  shift           String                       // Day/Late/Night
  shiftStart      DateTime                     // 勤務開始日時
  shiftEnd        DateTime                     // 勤務終了日時（日跨ぎあり）
  staffId         String                       // 作成者
  staffRole       String?                      // リーダー/見守り/服薬確認など
  residentSummary Json?                        // {inHouse, outing, overnight, hospital, homeLeave}
  majorEvent      Boolean  @default(false)     // 重大イベント有無フラグ
  handover        String?  @db.Text           // 申し送り事項
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  entries         DailyLogEntry[]
}
```

#### DailyLogEntry（利用者ごとの記録）

```prisma
model DailyLogEntry {
  id          String @id @default(cuid())
  dailyLogId  String
  recipientId String

  // A. 状態
  temperature   Float?
  bloodPressure String?                        // 例："120/80"
  spo2          Int?
  vitalAlert    Boolean @default(false)        // 異常値フラグ
  sleepTime     DateTime?
  wakeTime      DateTime?
  nightWaking   String?                        // 夜間覚醒の原因
  behaviorNote  String? @db.Text              // 行動・心理状態と対応結果

  // B. 生活支援
  mealAmount      String?
  mealTexture     String?
  swallowNote     String?
  waterIntake     String?
  dehydrationRisk Boolean @default(false)
  toiletRecords   Json?                        // [{time: ISO8601, type: Urine/Feces/Enema, note?}]
  bathDone        Boolean @default(false)
  bathRefusal     String?
  oralCareDone    Boolean @default(false)
  dressingDone    Boolean @default(false)

  // C. 服薬
  medicationChecks Json?                       // [{scheduleId, done, staffId, refusal?, sideEffect?, note?}]
  prnMedications   Json?                       // [{name, reason, time: ISO8601, effect?}]

  // D. 外出・外泊・帰寮
  outingDestination String?
  outingCompanion   String?
  plannedReturnTime DateTime?
  returnTime        DateTime?
  returnCondition   String?
  overnightStay     Boolean @default(false)
  overnightDest     String?

  // E. 拒否記録
  refusalRecords Json?                         // [{category, refusal, approach, result}]

  // F. 個別支援計画との紐づけ
  supportTags    String[] @default([])         // 実施した支援区分
  planItemRefs   String[] @default([])         // SupportItem/GoalのID参照

  // G. 特記事項
  notes         String? @db.Text

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

### 7.3 追加予定テーブル（Phase B: Plan）

```prisma
// 個別支援計画
model SupportPlan {
  id          String   @id @default(cuid())
  recipientId String
  startDate   DateTime                         // 計画開始日
  endDate     DateTime                         // 計画終了日
  policy      String?  @db.Text              // 総合方針
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  goals       Goal[]
}

// 目標（長期/短期）
model Goal {
  id            String   @id @default(cuid())
  supportPlanId String
  type          String                         // Long / Short
  content       String   @db.Text
  createdAt     DateTime @default(now())

  items         SupportItem[]
}

// 支援内容（手段/頻度/注意点）
model SupportItem {
  id        String   @id @default(cuid())
  goalId    String
  category  String                             // 食事/排泄/服薬/行動/移動など
  content   String   @db.Text
  frequency String?                            // 毎日/週3回など
  notes     String?
  createdAt DateTime @default(now())
}
```

### 7.4 追加予定テーブル（Phase C: Fact）

```prisma
// サービス提供実績（請求の根拠）
model ServiceDelivery {
  id          String   @id @default(cuid())
  dailyLogId  String?                          // 日誌との紐づけ
  recipientId String
  staffId     String
  serviceType String                           // GH/居宅介護/重度訪問介護など
  startTime   DateTime
  endTime     DateTime
  allowances  String[] @default([])           // 適用加算
  staffCount  Int      @default(1)            // 二人派遣対応
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### 7.5 追加予定テーブル（Phase D: Safety）

```prisma
// リスクプロフィール（利用者ごとの既知リスク）
model RiskProfile {
  id          String   @id @default(cuid())
  recipientId String
  riskType    String                           // Fall/SelfHarm/Seizure/Aspiration/Wandering
  description String   @db.Text
  prevention  String?  @db.Text
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// 行動エピソード（兆候→介入→結果）
model BehaviorEpisode {
  id          String   @id @default(cuid())
  recipientId String
  dailyLogId  String?
  occurredAt  DateTime
  trigger     String?  @db.Text              // 兆候・きっかけ
  intervention String? @db.Text             // 介入内容
  result      String?  @db.Text             // 結果
  prevention  String?  @db.Text             // 次回の予防策
  createdAt   DateTime @default(now())
}
```

### 7.6 JSONカラムの運用ルール

初期実装はJSONカラムで柔軟に持つが、以下の方針で運用する。

| カラム | スキーマ定義 | 将来対応 |
|--------|------------|---------|
| `toiletRecords` | `[{time: ISO8601, type: "Urine"\|"Feces"\|"Enema", note?: string}]` | 排泄回数集計が必要になったらテーブル分割 |
| `medicationChecks` | `[{scheduleId: string, done: boolean, staffId: string, refusal?: string, sideEffect?: string, note?: string}]` | 誤薬集計が必要になったらテーブル分割 |
| `prnMedications` | `[{name: string, reason: string, time: ISO8601, effect?: string}]` | 同上 |
| `refusalRecords` | `[{category: string, refusal: string, approach: string, result: string}]` | 拒否頻度分析が必要になったらテーブル分割 |
| `residentSummary` | `{inHouse: number, outing: number, overnight: number, hospital: number, homeLeave: number}` | 集計用途がなければJSONのまま |
| `timeSlotRecords` | `[{time: string, water?: string, meal?: string, leisure?: string, oral?: boolean, bath?: boolean, condition?: string, toilet?: string, sleep?: string, notes?: string}]` | 時間帯別の詳細分析が必要になったらテーブル分割 |

**注**: `timeSlotRecords`は夜勤シフト（15:00〜翌9:30）を30分刻みで記録する時系列データ。既存フィールド（temperature, mealAmount等）は日次サマリーとして併用。

---

## 8. アーキテクチャ方針

| 用途 | 実装方法 |
|------|---------|
| 初期表示（一覧・詳細） | RSC + Server Action（Next.js推奨） |
| 動的操作（CRUD・記録入力） | tRPC + TanStack Query（キャッシュ/楽観更新） |
| キャッシュ | 記録系は「常に最新」を前提にDynamic（古いデータ表示事故を防ぐ） |
| 認可 | tRPC `protectedProcedure` で unitId/recipientId/userId スコープを強制 |

---

## 9. 権限・監査・保存

### 9.1 ロール定義

| ロール | 権限 |
|--------|------|
| 管理者（Admin） | 全ユニット閲覧・編集・削除、CSV出力、権限管理 |
| 職員（Staff） | 担当ユニットの日誌作成・閲覧・編集 |
| 臨時職員 | 当日担当ユニットのみ記録可能 |
| 閲覧のみ（Auditor） | 参照のみ（監査用・将来実装） |

### 9.2 監査ログ

- 業務日誌の作成・更新・削除（論理削除）の履歴を保持
- 記録者（userId）と日時（createdAt/updatedAt）をすべてのテーブルで保持
- 物理削除は原則禁止、`deletedAt`による論理削除を基本とする

### 9.3 保存期間

- 障害福祉サービスの記録の保存期限：**サービス提供日から5年**（基準省令等で規定）
- システム上は保存期間を設定可能にし、期限切れデータはアーカイブフラグを立てる（削除しない）

### 9.4 外部公開に関する注意

- Tailscale Funnel等による外部公開は**デモ・開発用途に限定**
- 実際の利用者データを含む状態での外部公開は行わない

---

## 10. エクスポート/インポート

### 10.1 CSV出力（管理者のみ）

- 利用者一覧のCSVエクスポート（項目：利用者ID・氏名・かな・生年月日・ユニット名など）
- 業務日誌のCSVエクスポート（期間指定）
- 文字コード：UTF-8（BOM付き、Excel対応）
- 個人情報を含むため、エクスポートはAdmin権限のみ

### 10.2 CSVインポート

- 利用者一覧のCSVインポート（利用者IDがあればupsert、なければ新規）
- バリデーション：必須項目欠け・日付形式不正は行単位でエラー返却

### 10.3 バックアップ

- DBの日次バックアップを運用手順として定義する

---

## 11. 検索・集計

### 11.1 業務日誌の検索

- ユニット・日付・シフト・担当者での絞り込み
- 申し送り内容のテキスト検索

### 11.2 集計（将来実装）

- 拒否頻度（利用者別・カテゴリ別）
- 排泄回数の推移
- 誤薬・事故の件数推移
- バイタル異常値アラートの履歴

---

## 12. 未確定事項（要確認）

- ショートステイの入退所管理の詳細仕様
- 居宅介護・重度訪問介護の業務日誌の詳細項目
- 業務日誌の承認フロー（管理者確認の有無）
- バイタルは全員必須か、必要な利用者のみか（利用者プロフィールで設定する方向が現実的）

---

## 13. 実装フェーズ

### Phase A: Do（業務日誌）
1. Unit / UnitStaff / UnitRecipient のCRUD＋紐づけ画面
2. 服薬スケジュール設定（利用者プロフィール内）
3. DailyLog（ヘッダー）作成→保存→一覧→詳細
4. DailyLogEntry（利用者別）の時系列入力UI

### Phase B: Plan（個別支援計画）
5. SupportPlan / Goal / SupportItem の追加
6. DailyLogEntry に `planItemRefs` の紐づけ（選択式）

### Phase C: Fact（実績）
7. ServiceDelivery（提供実績）の追加
8. 日誌と実績を同画面で登録できる導線（二重入力を避ける）

### Phase D: Safety（事故・ヒヤリハット）
9. `majorEvent=true` → Incident 起票の導線
10. RiskProfile / BehaviorEpisode の追加

### 横断対応
- 権限管理（ロール別アクセス制御）
- CSV出力
- 居宅介護・重度訪問介護対応
