# 重度障害者支援 業務日誌・記録システム 実装提案書

**作成日**: 2026-02-16
**更新日**: 2026-02-16
**ステータス**: 提案中（未承認）

## 概要

福祉・介護分野における重度障害者支援の業務日誌・記録システムを構築します。
日々の支援記録、バイタルサイン、ヒヤリハット、申し送り事項などを一元管理し、
利用者のQOL向上と支援の質の向上を目指します。

---

## 背景と課題

重度障害者支援の現場では、以下のような記録業務が必要です。

### 記録が必要な項目

- **日々の支援記録**（食事、入浴、排泄、医療的ケア、コミュニケーション）
- **バイタルサイン**（体温、血圧、脈拍、SpO2等）
- **服薬管理**（服薬時刻、薬剤名、実施者）
- **申し送り事項**（シフト間引継ぎ、医療連携）
- **ヒヤリハット・事故報告**（発生状況、対応、再発防止）
- **個別支援計画の実施記録**

### 現状の課題

- 紙の記録が多く、情報共有に時間がかかる
- 過去の記録を探すのが困難
- バイタルデータの推移が見えにくい
- 申し送り事項が口頭のみで記録が残らない
- ヒヤリハットの分析が難しい

---

## ゴール

### 実現したいこと

- **支援記録の一元管理**（日々の支援内容を簡単に記録）
- **バイタルサインの可視化**（グラフで推移を確認）
- **安全管理の強化**（ヒヤリハット・事故報告の記録と分析）
- **情報共有の効率化**（申し送り事項の確実な伝達）
- **個別支援計画との連携**（計画に基づく支援の実施記録）

### 非ゴール（MVPではやらない）

- 介護報酬請求システムとの連携
- 利用者家族向けポータル
- 外部医療機関との電子カルテ連携
- 音声入力機能

---

## 用語

- **利用者**: 支援を受ける重度障害者
- **支援者**: 介護職員、看護師、相談支援専門員等
- **支援記録**: 日々の支援内容を記録したもの
- **バイタルサイン**: 体温、血圧、脈拍、SpO2等の生体情報
- **ヒヤリハット**: 事故には至らなかったが、ヒヤリとした出来事
- **申し送り**: シフト間で伝達すべき情報

---

## 要件

### 1. 利用者管理

#### 基本情報

- 利用者ID、氏名、生年月日
- 障害区分（身体・知的・精神）、障害支援区分（1〜6）
- 主治医、緊急連絡先
- アレルギー情報、既往歴

#### 個別支援計画

- 支援目標
- 支援内容（生活支援、医療的ケア等）
- 実施頻度、担当者

---

### 2. 支援記録（業務日誌）

#### 日々の記録

- **記録日時**（夜勤・日跨ぎ対応）
- **支援カテゴリ**
  - 食事（摂取量、形態、介助レベル）
  - 排泄（時刻、形状、量、介助レベル）
  - 入浴・清拭（時刻、方法、状態）
  - 更衣（時刻、介助レベル）
  - 医療的ケア（吸引、経管栄養、導尿等）
  - コミュニケーション（様子、発言内容）
  - 余暇活動（内容、様子）
- **特記事項**（気づき、変化、本人の様子）
- **記録者**（職員名）

#### テンプレート機能

- 定型的な支援内容をテンプレート化
- ワンクリックで記録入力

---

### 3. バイタルサイン記録

#### 測定項目

- 体温（℃）
- 血圧（収縮期/拡張期 mmHg）
- 脈拍（回/分）
- SpO2（%）
- 体重（kg）
- その他（血糖値、尿量等）

#### 記録内容

- 測定日時
- 測定値
- 測定者
- 備考（異常時の対応等）

#### 可視化

- グラフ表示（日次、週次、月次）
- 異常値のアラート表示
- 前回値との比較

---

### 4. 服薬管理

#### 記録項目

- 服薬日時
- 薬剤名
- 用量
- 実施者
- 服薬方法（経口、注入等）
- 備考（拒薬、誤薬等）

#### チェック機能

- 服薬予定の表示
- 服薬漏れアラート
- 服薬履歴の確認

---

### 5. 申し送り・引継ぎ

#### 申し送り事項

- 記録日時
- 申し送り内容（重要度レベル付き）
- 対象利用者
- 記録者
- 確認者（引継ぎ先職員）
- 期限（いつまでに対応が必要か）

#### 表示

- 未確認の申し送りを強調表示
- 期限切れアラート
- 利用者別の申し送り一覧

---

### 6. ヒヤリハット・事故報告

#### 報告項目

- 発生日時
- 発生場所
- 当事者（利用者）
- 発見者・報告者
- 事象の種類（転倒、誤薬、離設等）
- 重要度レベル（レベル0〜5）
  - レベル0: 事故には至らなかったが気づいた
  - レベル1: 処置や治療は不要
  - レベル2: 簡単な処置や治療が必要
  - レベル3: 医療機関での治療が必要
  - レベル4: 生命に影響する障害が発生
  - レベル5: 死亡
- 発生状況（詳細）
- 発生要因（環境、人、設備、手順等）
- 対応内容
- 再発防止策
- 報告日時、報告者

#### 分析機能

- 発生件数の推移（グラフ）
- 事象別・利用者別の集計
- 再発防止策の実施状況

---

### 7. 勤務管理（支援者側）

#### 勤務記録

- 勤務日（基準日）
- 勤務開始時刻、終了時刻（夜勤・日跨ぎ対応）
- 休憩時間（複数回対応）
- 実働時間の自動計算
- 勤務内容（担当利用者、主な業務）

#### 統計

- 週次/月次の勤務時間集計
- 夜勤回数
- 担当利用者別の勤務時間

---

## データベーススキーマ案

### 利用者管理

```prisma
// 利用者（重度障害者）
model CareRecipient {
  id              String   @id @default(cuid())
  userId          String   // 施設・事業所のユーザーID
  name            String
  nameKana        String?
  birthDate       DateTime
  gender          String   // Male/Female/Other

  // 障害情報
  disabilityType  String[] // Physical/Intellectual/Mental
  supportLevel    Int?     // 障害支援区分 1-6

  // 連絡先
  emergencyContact String?
  doctor          String?
  hospital        String?

  // その他
  allergies       String?
  medicalHistory  String?  @db.Text
  notes           String?  @db.Text

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  deletedAt       DateTime? // 論理削除

  // リレーション
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  careRecords     CareRecord[]
  vitalSigns      VitalSign[]
  medications     Medication[]
  handovers       Handover[]
  incidents       Incident[]

  @@index([userId])
  @@index([userId, deletedAt])
  @@map("care_recipients")
}
```

### 支援記録

```prisma
// 支援記録（業務日誌）
model CareRecord {
  id            String   @id @default(cuid())
  recipientId   String
  userId        String   // 記録者

  recordDate    DateTime // 記録日時
  category      String   // Meal/Excretion/Bath/Medical/Communication/Activity
  content       String   @db.Text
  notes         String?  @db.Text

  // 食事記録用
  mealAmount    String?  // 全量/半量/少量
  mealTexture   String?  // 常食/刻み/ミキサー

  // 排泄記録用
  excretionType String?  // Urine/Feces
  excretionForm String?  // 正常/軟便/下痢/便秘

  // 入浴記録用
  bathType      String?  // 入浴/シャワー/清拭

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // リレーション
  recipient     CareRecipient @relation(fields: [recipientId], references: [id], onDelete: Cascade)
  user          User          @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([recipientId, recordDate])
  @@index([userId])
  @@map("care_records")
}
```

### バイタルサイン

```prisma
// バイタルサイン記録
model VitalSign {
  id            String   @id @default(cuid())
  recipientId   String
  userId        String   // 測定者

  measuredAt    DateTime

  temperature   Float?   // 体温（℃）
  systolic      Int?     // 収縮期血圧（mmHg）
  diastolic     Int?     // 拡張期血圧（mmHg）
  pulse         Int?     // 脈拍（回/分）
  spo2          Int?     // SpO2（%）
  weight        Float?   // 体重（kg）

  notes         String?  @db.Text

  createdAt     DateTime @default(now())

  // リレーション
  recipient     CareRecipient @relation(fields: [recipientId], references: [id], onDelete: Cascade)
  user          User          @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([recipientId, measuredAt])
  @@index([userId])
  @@map("vital_signs")
}
```

### 服薬管理

```prisma
// 服薬記録
model Medication {
  id            String   @id @default(cuid())
  recipientId   String
  userId        String   // 実施者

  medicatedAt   DateTime // 服薬日時
  medicationName String
  dosage        String
  method        String?  // Oral/Injection/Tube

  status        String   @default("Completed") // Completed/Refused/Error
  notes         String?  @db.Text

  createdAt     DateTime @default(now())

  // リレーション
  recipient     CareRecipient @relation(fields: [recipientId], references: [id], onDelete: Cascade)
  user          User          @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([recipientId, medicatedAt])
  @@index([userId])
  @@map("medications")
}
```

### 申し送り

```prisma
// 申し送り事項
model Handover {
  id            String    @id @default(cuid())
  recipientId   String?   // NULL = 全体への申し送り
  userId        String    // 記録者

  content       String    @db.Text
  priority      String    @default("Normal") // High/Normal/Low
  dueDate       DateTime? // 対応期限

  confirmedBy   String?   // 確認者ID
  confirmedAt   DateTime?

  createdAt     DateTime  @default(now())

  // リレーション
  recipient     CareRecipient? @relation(fields: [recipientId], references: [id], onDelete: Cascade)
  user          User           @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([recipientId])
  @@index([userId])
  @@index([confirmedBy, confirmedAt])
  @@map("handovers")
}
```

### ヒヤリハット・事故報告

```prisma
// ヒヤリハット・事故報告
model Incident {
  id            String   @id @default(cuid())
  recipientId   String
  userId        String   // 報告者

  occurredAt    DateTime // 発生日時
  discoveredBy  String   // 発見者名
  location      String   // 発生場所

  incidentType  String   // Fall/Medication/Wandering/Injury/Other
  severityLevel Int      // 0-5

  situation     String   @db.Text // 発生状況
  cause         String?  @db.Text // 発生要因
  response      String?  @db.Text // 対応内容
  prevention    String?  @db.Text // 再発防止策

  reportedAt    DateTime @default(now())

  // リレーション
  recipient     CareRecipient @relation(fields: [recipientId], references: [id], onDelete: Cascade)
  user          User          @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([recipientId, occurredAt])
  @@index([userId])
  @@index([severityLevel])
  @@map("incidents")
}
```

---

## UI構成

### 1. ダッシュボード

- 今日の利用者一覧
- 未確認の申し送り件数
- 本日のバイタル測定予定
- 服薬予定一覧
- 最近のヒヤリハット件数

### 2. 利用者一覧・詳細

- 利用者の基本情報
- 最新のバイタルサイン
- 直近の支援記録
- 個別支援計画

### 3. 支援記録入力

- 利用者選択
- カテゴリ選択（食事/排泄/入浴等）
- テンプレート選択
- 詳細入力
- 特記事項

### 4. バイタルサイン入力・表示

- 測定値入力フォーム
- グラフ表示（日次/週次/月次）
- 異常値アラート

### 5. 申し送り管理

- 申し送り一覧（未確認/確認済み）
- 新規申し送り作成
- 確認チェック

### 6. ヒヤリハット報告

- 報告フォーム
- 報告一覧
- 統計・分析画面

### 7. 勤務管理

- 勤務記録入力
- 勤務実績一覧
- 統計表示

---

## 実装スケジュール（MVP）

### フェーズ1: 基本機能（5-6時間）

1. **データベース設計・実装**（90分）
   - Prismaスキーマ作成
   - マイグレーション実行

2. **バックエンド実装**（120分）
   - tRPCルーター作成
     - recipient (CRUD)
     - careRecord (CRUD, list)
     - vitalSign (CRUD, list, stats)
     - medication (CRUD, list)
     - handover (CRUD, list, confirm)
     - incident (CRUD, list, stats)

3. **フロントエンド実装**（150分）
   - 利用者管理画面
   - 支援記録入力画面
   - バイタルサイン記録・表示
   - 申し送り管理画面
   - ダッシュボード

4. **テスト・調整**（60分）
   - 機能テスト
   - UI調整
   - データ整合性確認

---

## セキュリティ・プライバシー配慮

### 個人情報保護

- 利用者情報は暗号化して保存
- アクセスログの記録
- 権限管理（閲覧・編集権限の分離）

### データ保存

- 論理削除（物理削除しない）
- バックアップの定期取得
- 監査証跡の保持

---

## 将来的な拡張案

- 介護報酬請求システム連携
- 利用者家族向けポータル（支援記録の共有）
- 音声入力対応
- スマートフォンアプリ化
- 複数事業所の統合管理
- AI による支援内容の分析・提案

---

**作成者**: Claude Code
**承認待ち**: ユーザー
**次のアクション**: 承認後、実装開始

# 重度障害者支援 業務日誌・記録システム 要件定義書

**作成日**: 2026-02-16  
**更新日**: 2026-02-16  
**ステータス**: Draft（未承認）

---

## 0. 目的・前提

### 0.1 目的

福祉・介護分野における重度障害者支援の現場で、日々の支援記録（業務日誌）・バイタル・服薬・申し送り・ヒヤリハット/事故報告を**安全に、抜け漏れなく、検索可能な形で**一元管理する。

### 0.2 背景

- 紙・口頭中心の運用は、検索性・引継ぎ・監査証跡・品質改善（再発防止/傾向分析）に弱い
- 端末事情（片手操作、電波不安定、夜勤、端末共有）に適したUIが必要

### 0.3 スコープ

**MVP（Phase 1）対象**

- 事業所/施設内での記録・共有（職員/管理者）
- 利用者（ケア対象者）情報
- 支援記録（業務日誌）
- バイタル記録
- 服薬記録
- 申し送り（引継ぎ）
- ヒヤリハット/事故報告
- 利用者一覧（検索/最近）
- CSV入出力（利用者情報の取り込み/書き出し）

**MVP外（Phase 2以降）**

- 家族向けポータル（閲覧）
- 外部医療機関/電子カルテ連携
- 介護報酬請求システム連携
- 高度な異常値アラート（運用設計を伴う）
- 音声入力、オフラインファースト同期

### 0.4 非ゴール

- 個別支援計画そのものの策定/承認ワークフロー（記録への紐付けは将来）
- 監査対応の完了（MVPは基礎機能と方針の確立まで）

---

## 1. ステークホルダー・ユーザー

### 1.1 役割（RBACの前提）

- **支援者（Staff）**: 記録の作成/閲覧、申し送り確認
- **管理者（Admin）**: 全体閲覧、集計、運用設定、権限管理
- **監査閲覧（Auditor/ReadOnly）**: 参照のみ（将来）
- **家族（Family）**: 参照のみ（将来）

### 1.2 代表的な運用シナリオ

1. 支援者がログイン → 利用者一覧から対象者を選択
2. 支援記録（食事/排泄/入浴/医療的ケア等）をテンプレで迅速に記録
3. バイタル/服薬を記録（必要なら備考）
4. 重要事項を申し送りとして登録 → 次シフトが未確認を確認
5. ヒヤリハット/事故が発生 → 報告フォームから登録 → 管理者が集計

---

## 2. 情報分類・権限・監査（必須）

### 2.1 情報分類（運用ポリシー）

- **利用者基本情報**: 個人情報
- **医療関連情報（既往歴/アレルギー/投薬/バイタル/医療的ケア）**: 要配慮情報に相当し得る（取り扱いを厳格化）
- **業務日誌（支援記録）**: 個人情報を含み得る
- **ヒヤリハット/事故報告**: 機微性高（閲覧範囲を制限できる設計が望ましい）

### 2.2 アクセス制御（RBAC）

- Staff: 担当範囲の利用者を閲覧・記録（初期は「事業所内全員閲覧」でも可、将来は担当制へ拡張）
- Admin: 全件閲覧・編集・削除（論理削除）、CSVインポート権限
- ReadOnly: 閲覧のみ

### 2.3 監査証跡（MVPで最低限やること）

- **編集履歴**: 重要データ（利用者基本情報、事故報告、服薬）の更新者/更新日時を保持（DBの updatedAt だけでも最低限）
- **アクセスログ**: Phase 2で詳細化（誰がいつ閲覧したか）
- **削除ポリシー**: 物理削除を原則禁止、論理削除（deletedAt）を基本

---

## 3. 機能要件（Functional Requirements）

> すべてのデータ操作は「認証済みユーザー（userId）でスコープ」し、事業所境界を跨がないこと。

### 3.1 MVP（Phase 1）

#### FR-001 利用者管理（CareRecipient）

**ユーザーストーリー**

- 支援者として、利用者の基本情報を確認して適切な支援に活用したい
- 管理者として、利用者情報を一括登録（CSV）し、運用を立ち上げたい

**要件**

- 作成/閲覧/更新/論理削除
- 氏名・かな・生年月日・性別・障害区分・支援区分・緊急連絡先・主治医/病院・アレルギー・既往歴・メモ
- 利用者一覧：検索（氏名/かな）・最近（最終更新）

**受け入れ基準（例）**

- Given 管理者、When 利用者を作成、Then 一覧に表示され詳細が確認できる
- Given 利用者、When 論理削除、Then 通常一覧から除外されるがDBからは消えない
- Given 検索語、When 一覧検索、Then 氏名/かなに部分一致する利用者が表示される

---

#### FR-002 支援記録（業務日誌：CareRecord）

**ユーザーストーリー**

- 支援者として、カテゴリ別に支援内容を素早く記録したい
- 管理者として、後から検索/確認できる形で記録を残したい

**要件**

- 記録日時（recordDate）を必須
- カテゴリ（Meal/Excretion/Bath/Medical/Communication/Activity 等）
- 内容（content）と特記事項（notes）
- カテゴリに応じた補助フィールド（食事量/形態、排泄種別/性状、入浴方法など）
- テンプレート（定型文挿入）

**受け入れ基準（例）**

- Given 利用者A、When 支援記録を保存、Then recordDate/category/content/記録者が保存される
- Given 食事カテゴリ、When 量/形態を入力、Then 保存され詳細画面で確認できる

---

#### FR-003 バイタルサイン記録（VitalSign）

**要件**

- 測定日時（measuredAt）と測定者（userId）
- 体温、血圧（収縮/拡張）、脈拍、SpO2、体重、備考
- 利用者詳細で直近N件表示

**受け入れ基準（例）**

- Given 利用者A、When バイタルを記録、Then 一覧に測定日時順で表示される

---

#### FR-004 服薬管理（Medication）

**要件**

- 服薬日時（medicatedAt）
- 薬剤名、用量、方法、ステータス（Completed/Refused/Error）、備考

**受け入れ基準（例）**

- Given 利用者A、When 服薬記録を保存、Then 履歴に追加される
- Given Refused、When 保存、Then ステータスが Refused として表示される

---

#### FR-005 申し送り・引継ぎ（Handover）

**要件**

- 申し送り内容、重要度（High/Normal/Low）、期限（dueDate）
- 対象利用者（任意：全体申し送りの場合はNULL）
- 確認（confirmedBy/confirmedAt）
- 未確認を強調表示

**受け入れ基準（例）**

- Given 未確認申し送り、When 一覧表示、Then 未確認が強調される
- Given 申し送り、When 確認、Then confirmedBy/confirmedAt が設定される

---

#### FR-006 ヒヤリハット・事故報告（Incident）

**要件**

- 発生日時、場所、当事者（利用者）、発見者/報告者
- 事象種別、重要度（0〜5）、状況、要因、対応、再発防止策
- 一覧・検索（MVPは期間フィルタ程度でOK）

**受け入れ基準（例）**

- Given 必須項目が揃っている、When 保存、Then 事故一覧に表示される

---

#### FR-007 CSV入出力（利用者：CareRecipient）

**ユーザーストーリー**

- 管理者として、既存の名簿をCSVで取り込みたい
- 管理者として、利用者一覧をCSVに書き出して共有/保管したい

**要件（CSV列：MVP）**

- `recipientId`（任意：空なら新規作成）
- `name`（必須）
- `nameKana`（任意）
- `birthDate`（必須：YYYY-MM-DD）
- `gender`（任意）
- `supportLevel`（任意：1-6）
- `disabilityType`（任意：カンマ区切り）
- `status`（任意：active/inactive）※ inactive は論理削除ではなく運用上の無効化

**動作**

- インポートは `recipientId` があれば upsert、なければ新規
- バリデーション（必須欠け/日付形式不正）で行単位エラーを返す
- エクスポートは検索結果/全件（選択可）

**受け入れ基準（例）**

- Given 正しいCSV、When インポート、Then 利用者が作成/更新される
- Given 不正な行、When インポート、Then その行のみエラーとして返り他行は処理される

---

### 3.2 Phase 2（拡張）

- バイタルのグラフ（日次/週次/月次）
- 異常値アラート（閾値・通知・責任範囲の運用設計を含む）
- 事故分析（件数推移、分類別、利用者別）
- 家族向け閲覧（権限/マスキング/公開範囲の合意が前提）
- オフライン入力→同期、音声入力

---

## 4. UI/UX要件

### 4.1 画面一覧（MVP）

- ログイン
- ダッシュボード（未確認申し送り、最近更新された利用者、今日の重要事項）
- 利用者一覧（検索/最近）
- 利用者詳細（タブ：支援記録/バイタル/服薬/申し送り/事故）
- 各入力フォーム（支援記録、バイタル、服薬、申し送り、事故）
- 管理（CSVインポート/エクスポート）

### 4.2 利用者一覧（検索/最近）

- 検索: 氏名/かな 部分一致
- 最近: `updatedAt` 降順（将来は lastViewedAt も検討）
- 表示: 氏名、支援区分、注意アイコン（アレルギー等がある場合）

### 4.3 日跨ぎ（カレンダー/日時入力）

**要件**

- 支援記録・服薬・バイタル等は「単一日時」入力
- 勤務管理（将来）またはシフト記録がある場合は **開始日時** と **終了日時** を別々に入力できること

**日跨ぎの受け入れ例**

- Given 開始: 2026-02-16 22:00、終了: 2026-02-17 07:00、When 保存、Then 有効として登録される
- Given 終了 < 開始、When 保存、Then エラーで保存されない

### 4.4 入力補助

- テンプレ挿入（支援記録）
- 必須項目の明確化、エラーは項目単位で表示
- 片手操作を想定（主要操作は画面下部/右下に配置）

---

## 5. 非機能要件（NFR）

### 5.1 セキュリティ

- 認証必須（Auth.js v5/NextAuth）
- APIは userId スコープで認可（tRPC protectedProcedure）
- セッション管理、CSRF対策（Auth.js標準）
- 重要情報の取り扱い（ログ出力に個人情報を含めない）

### 5.2 プライバシー

- 個人情報の最小化（CSV含む）
- 端末共有を想定し、短いセッション/自動ログアウトのオプション（Phase 2）

### 5.3 可用性・信頼性

- MVP: ローカル/単一DBでの安定動作
- バックアップ: 日次バックアップ（運用手順を定義）

### 5.4 パフォーマンス

- 利用者一覧: 1,000件での検索が実用（部分一致はインデックス設計/検索方式を検討）
- 直近N件表示はページネーション

### 5.5 アクセシビリティ

- フォームのラベル、エラーのaria属性
- コントラスト/フォーカス可視性

---

## 6. データ要件（DB）

### 6.1 エンティティ一覧

- CareRecipient（利用者）
- CareRecord（支援記録）
- VitalSign（バイタル）
- Medication（服薬）
- Handover（申し送り）
- Incident（事故/ヒヤリハット）

### 6.2 Prismaスキーマ案

#### 利用者（CareRecipient）

```prisma
model CareRecipient {
  id              String   @id @default(cuid())
  userId          String   // 施設・事業所のユーザーID
  name            String
  nameKana        String?
  birthDate       DateTime
  gender          String   // Male/Female/Other

  // 障害情報
  disabilityType  String[] // Physical/Intellectual/Mental
  supportLevel    Int?     // 障害支援区分 1-6

  // 連絡先
  emergencyContact String?
  doctor          String?
  hospital        String?

  // その他
  allergies       String?
  medicalHistory  String?  @db.Text
  notes           String?  @db.Text

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  deletedAt       DateTime? // 論理削除

  // リレーション
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  careRecords     CareRecord[]
  vitalSigns      VitalSign[]
  medications     Medication[]
  handovers       Handover[]
  incidents       Incident[]

  @@index([userId])
  @@index([userId, deletedAt])
  @@map("care_recipients")
}
```

#### 支援記録（CareRecord）

```prisma
model CareRecord {
  id            String   @id @default(cuid())
  recipientId   String
  userId        String   // 記録者

  recordDate    DateTime // 記録日時
  category      String   // Meal/Excretion/Bath/Medical/Communication/Activity
  content       String   @db.Text
  notes         String?  @db.Text

  // 食事記録用
  mealAmount    String?  // 全量/半量/少量
  mealTexture   String?  // 常食/刻み/ミキサー

  // 排泄記録用
  excretionType String?  // Urine/Feces
  excretionForm String?  // 正常/軟便/下痢/便秘

  // 入浴記録用
  bathType      String?  // 入浴/シャワー/清拭

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  recipient     CareRecipient @relation(fields: [recipientId], references: [id], onDelete: Cascade)
  user          User          @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([recipientId, recordDate])
  @@index([userId])
  @@map("care_records")
}
```

#### バイタル（VitalSign）

```prisma
model VitalSign {
  id            String   @id @default(cuid())
  recipientId   String
  userId        String   // 測定者

  measuredAt    DateTime

  temperature   Float?
  systolic      Int?
  diastolic     Int?
  pulse         Int?
  spo2          Int?
  weight        Float?

  notes         String?  @db.Text

  createdAt     DateTime @default(now())

  recipient     CareRecipient @relation(fields: [recipientId], references: [id], onDelete: Cascade)
  user          User          @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([recipientId, measuredAt])
  @@index([userId])
  @@map("vital_signs")
}
```

#### 服薬（Medication）

```prisma
model Medication {
  id            String   @id @default(cuid())
  recipientId   String
  userId        String   // 実施者

  medicatedAt   DateTime
  medicationName String
  dosage        String
  method        String?

  status        String   @default("Completed")
  notes         String?  @db.Text

  createdAt     DateTime @default(now())

  recipient     CareRecipient @relation(fields: [recipientId], references: [id], onDelete: Cascade)
  user          User          @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([recipientId, medicatedAt])
  @@index([userId])
  @@map("medications")
}
```

#### 申し送り（Handover）

```prisma
model Handover {
  id            String    @id @default(cuid())
  recipientId   String?
  userId        String

  content       String    @db.Text
  priority      String    @default("Normal")
  dueDate       DateTime?

  confirmedBy   String?
  confirmedAt   DateTime?

  createdAt     DateTime  @default(now())

  recipient     CareRecipient? @relation(fields: [recipientId], references: [id], onDelete: Cascade)
  user          User           @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([recipientId])
  @@index([userId])
  @@index([confirmedBy, confirmedAt])
  @@map("handovers")
}
```

#### 事故（Incident）

```prisma
model Incident {
  id            String   @id @default(cuid())
  recipientId   String
  userId        String

  occurredAt    DateTime
  discoveredBy  String
  location      String

  incidentType  String
  severityLevel Int

  situation     String   @db.Text
  cause         String?  @db.Text
  response      String?  @db.Text
  prevention    String?  @db.Text

  reportedAt    DateTime @default(now())

  recipient     CareRecipient @relation(fields: [recipientId], references: [id], onDelete: Cascade)
  user          User          @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([recipientId, occurredAt])
  @@index([userId])
  @@index([severityLevel])
  @@map("incidents")
}
```

---

## 7. 外部インターフェース（入出力）

### 7.1 CSV

- 入力: UTF-8（Excel運用が必要なら Shift-JIS もPhase 2で検討）
- 出力: UTF-8（BOM付与は必要に応じて）

### 7.2 将来のPDF

- 期間指定で支援記録/申し送り/事故のPDF出力（Phase 2）

---

## 8. 運用・保守

- アカウント管理（退職/異動時の無効化）
- バックアップ（手順の定義）
- 障害時の復旧（DB復元・ロールバック）

---

## 9. リリース計画

### Phase 1（MVP）

- FR-001〜006 + FR-007（CSV）
- 主要画面と基本一覧/検索

### Phase 2

- グラフ/分析/アラート
- 家族閲覧
- オフライン/音声入力
- 外部連携（医療/請求）

---

## 10. リスクと対策

- **個人情報の取り扱い**: ログ・権限・削除ポリシーをMVPから固定
- **現場入力負荷**: テンプレ/入力補助/最小項目で導線を短く
- **誤入力**: 日跨ぎ/必須項目/形式のバリデーション
- **運用合意不足**: 申し送りの重要度・確認フローを明文化

---

## 11. 承認

- 作成者: （記入）
- 承認者: （記入）
- 承認日: （記入）
