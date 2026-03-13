# DailyLog → ServiceRecord 自動連携仕様

**実装日**: 2026-03-13
**目的**: 業務日誌（DailyLog）からサービス提供実績（ServiceRecord）を自動生成し、Fact層への二重入力を防止する

---

## 概要

グループホーム・生活介護・居宅介護などの日常的サービスでは、業務日誌（DailyLog）の記録がそのままサービス提供実績となります。この自動連携により、Do層（業務日誌）からFact層（サービス実績）への手動転記が不要になります。

---

## 自動生成の条件

### 対象ユニット

以下のサービス種別（`Unit.serviceType`）のユニットが対象です：

- **GH** (グループホーム) → ServiceRecord.serviceType = "GroupHome"
- **KAIGO** (生活介護) → ServiceRecord.serviceType = "DayCare"
- **JUSHO** (居宅介護) → ServiceRecord.serviceType = "HomeHelp"

### 生成タイミング

- **DailyLogEntry の upsert 時**（`dailyLog.upsertEntry` mutation）
- 利用者ごとに個別の ServiceRecord が生成される

---

## データマッピング

### 基本情報

| ServiceRecord フィールド | 元データ | 備考 |
|------------------------|---------|------|
| `recipientId` | `DailyLogEntry.recipientId` | 利用者ID |
| `userId` | `DailyLog.staffId` | サービス提供者（シフト担当者） |
| `serviceType` | `Unit.serviceType` から変換 | GH/KAIGO/JUSHO → GroupHome/DayCare/HomeHelp |
| `serviceDate` | `DailyLog.logDate` | サービス提供日（基準日） |
| `startTime` | `DailyLog.shiftStart` | 勤務開始日時 |
| `endTime` | `DailyLog.shiftEnd` | 勤務終了日時 |
| `duration` | 自動計算 | (shiftEnd - shiftStart) を分単位で計算 |
| `dailyLogEntryId` | `DailyLogEntry.id` | 1:1 紐付け（unique制約） |

### サービス詳細（serviceDetail）

以下の情報を集約して自動生成：

- **食事**: `mealAmount` (例: "食事: 全量")
- **水分**: `waterIntake` (例: "水分: 200ml×5回")
- **入浴**: `bathDone` が true の場合 "入浴: 実施"
- **口腔ケア**: `oralCareDone` が true の場合 "口腔ケア: 実施"
- **服薬**: `medicationChecks` が存在する場合 "服薬: 実施"
- **様子**: `behaviorNote` (例: "様子: 穏やかに過ごす")
- **特記**: `notes` (例: "特記: 家族来訪あり")

記録がない場合のデフォルト: `"業務日誌による日常生活支援"`

### その他のフィールド

- `userCondition`: `behaviorNote` をコピー
- `incidents`: `notes` をコピー

---

## 更新・削除ポリシー

### DailyLogEntry 更新時

- 既存の ServiceRecord がある場合は **upsert**（重複作成なし）
- `dailyLogEntryId` で 1:1 対応を保証

### DailyLog ヘッダー（時刻）更新時

`shiftStart` または `shiftEnd` が変更された場合：

1. 該当する DailyLog に紐づく全 DailyLogEntry を取得
2. 各 DailyLogEntry の ServiceRecord の以下を更新：
   - `startTime`
   - `endTime`
   - `duration` (再計算)

### DailyLogEntry 削除時

- **Cascade 削除**: DailyLogEntry が削除されると、紐づく ServiceRecord も自動削除
- Prisma スキーマ: `onDelete: Cascade`

### DailyLog 削除時

1. DailyLog → DailyLogEntry が Cascade 削除
2. DailyLogEntry → ServiceRecord が Cascade 削除
3. 結果として、DailyLog 削除で関連する全 ServiceRecord も削除される

---

## 実装詳細

### Prisma スキーマ変更

```prisma
model ServiceRecord {
  // ...
  dailyLogEntryId String? @unique
  dailyLogEntry   DailyLogEntry? @relation(fields: [dailyLogEntryId], references: [id], onDelete: Cascade)
}

model DailyLogEntry {
  // ...
  serviceRecord ServiceRecord? // 1:1 逆参照
}
```

### 主要コード

- **自動生成ロジック**: `src/server/routers/dailyLog.ts:264-370`
- **時刻更新時の連動**: `src/server/routers/dailyLog.ts:162-215`

---

## テスト観点

### 必須テストケース

1. ✅ **GHユニットの日誌保存で ServiceRecord が新規作成される**
2. ✅ **同じ DailyLogEntry の再保存で重複せず upsert される**
3. ✅ **GH 以外の対象外ユニットでは生成されない**
4. ✅ **シフト時刻変更時に duration / start / end が期待どおり更新される**
5. ✅ **DailyLogEntry 削除時に ServiceRecord も削除される**

### 回帰テスト

- ✅ **GuideRecord → ServiceRecord の自動生成が影響を受けていない**

---

## 既知の制約・将来拡張

### 現在の制約

- ServiceRecord の `staff1` / `staff2` フィールドは未使用（複数職員対応は未実装）
- 時間帯ルール（`timeBand`）は未設定（移動支援専用機能）

### 将来拡張

- **時間帯別記録の反映**: `timeSlotRecords` を serviceDetail に詳細展開
- **加算の自動判定**: 重度障害者支援加算などの自動計算
- **複数職員対応**: シフトに複数職員が割り当てられた場合の対応

---

## 関連ドキュメント

- **要件定義**: `REQUIREMENTS_MASTER.md` (FR-Do-050, FR-Fact-010)
- **スキーマ**: `prisma/schema.prisma:817-871, 984-1049`
- **引き継ぎ資料**: `docs/archive/引き継ぎ用.md`