# 業務日誌休憩時間対応 設計書

> 本ドキュメントは `/docs/archive/引き継ぎ用.md` の要求に基づいて作成されています。

## 推奨結論（一文で）

**`DailyLog` に `breakMinutes: Int @default(0)` を追加し、ServiceRecord 生成時に休憩控除した実働時間を `duration` に格納する方式を第一候補とする。既存データは `breakMinutes = 0` として保持できるためスキーマ互換性は確保できるが、`duration` の意味はリリース境界日を境に「総時間」から「実働時間」へ変わるため、集計・監査では境界日管理を前提とする。**

---

## 1. 推奨方針

### 採用案：選択肢A（DailyLog に休憩時間フィールド追加）

#### なぜこの方針が妥当か

1. **勤怠管理との一貫性**
   - `ShiftType`, `Shift`, `AttendanceRecord` は全て `breakMinutes` を持つ
   - 業務日誌も同じ命名規則に従うことで、理解しやすく保守しやすい

2. **説明可能性・監査対応**
   - 休憩時間が明示的にデータとして記録される
   - 推測ロジックではなく、実績値として保存
   - 監査時に「なぜこの時間なのか」を説明可能

3. **柔軟性**
   - シフト種別ごとに異なる休憩時間に対応可能
   - 将来的に複数回休憩、時間帯別休憩への拡張も可能

#### MVP と将来拡張

**MVP（Phase 1）**
- `DailyLog.breakMinutes: Int @default(0)` のみ追加
- UI で休憩時間を分単位で入力（例：120分）
- ServiceRecord 生成時に `duration = totalMinutes - breakMinutes`

**将来拡張（Phase 2以降）**
- 休憩の開始・終了時刻を記録する場合
  - 案1: `breakStart: DateTime?`, `breakEnd: DateTime?` を追加
  - 案2: 別テーブル `DailyLogBreak` を作成（複数回休憩対応）
- 時間帯別記録（`timeSlotRecords`）と連動
  - 休憩時間帯を自動検出して `breakMinutes` に反映

#### 補助的扱いとする範囲

**固定ルール（補助的）**
- 業務日誌作成時に、対応する `Shift` が存在すれば `Shift.breakMinutes` をデフォルト値として提案
- `Shift` がなければ `ShiftType.breakMinutes` をフォールバック
- ユーザーが手動で上書き可能

**推測ロジック（採用しない）**
- `timeSlotRecords` から休憩を自動推測することはMVPでは行わない
- 理由：推測の精度が不明確で、監査時に説明できない

---

## 2. 要件定義の見直し案

### 2.1 DailyLog への追加項目

```prisma
model DailyLog {
  // ... 既存フィールド

  breakMinutes Int @default(0) // 休憩時間（分）

  // 将来拡張用（Phase 2以降）
  // breakStart   DateTime?
  // breakEnd     DateTime?
}
```

**フィールド仕様**
- `breakMinutes`: 休憩時間の合計（分単位）
- デフォルト値: `0`（休憩なし）
- NOT NULL 制約あり（`@default(0)` により既存データも安全）

### 2.2 ServiceRecord の表現方法

#### 適用ルール（重要）

**⚠️ DailyLog 由来と GuideRecord 由来で扱いが異なる**

- **`dailyLogEntryId != null` の ServiceRecord**: `breakMinutes` を適用する（本設計の対象）
  - DailyLog の `breakMinutes` を使用して休憩控除を行う
  - `duration` = 総時間 - `breakMinutes`（実働時間）

- **`guideRecordId != null` の ServiceRecord**: `breakMinutes = 0` とし、従来ロジックを維持する
  - GuideRecord には休憩時間の概念がない（個別記録のため）
  - `duration` = 総時間（変更なし）
  - 将来的に GuideRecord に休憩を追加する場合は別途検討

**理由:**
- DailyLog は事業所全体のシフト管理のため、休憩時間が明確
- GuideRecord は個別支援記録のため、休憩の扱いが異なる
- Phase 1 では DailyLog のみに休憩機能を追加し、GuideRecord は現状維持

**⚠️ `ServiceRecord.duration` の意味統一について:**

`ServiceRecord.duration` の意味を「実働時間」に統一する場合、GuideRecord 由来の ServiceRecord についても duration の意味を揃える必要があります。

**GuideRecord 由来の場合の意味整合性:**
- GuideRecord は休憩概念がない → `breakMinutes = 0`
- その結果、`duration = 総時間 - 0 = 総時間 = 実働時間`
- つまり、**休憩がないため総時間と実働時間が一致する**という解釈で意味統一できる

**確認事項:**
- GuideRecord の記録時間帯に休憩が含まれないことをユーザー操作・UI設計で保証する
- もし GuideRecord でも休憩を記録する必要が生じた場合は、別途設計を行う

#### 比較検討

| 案 | duration の意味 | breakMinutes | 互換性 | 推奨度 |
|----|----------------|--------------|--------|--------|
| **案1** | **実働時間** | **あり** | **△ (意味変更)** | **★推奨（MVP向け）** |
| 案2 | 総時間（変更なし） | あり | ○ (真の互換) | - |
| 案3 | 実働時間 + totalMinutes 追加 | あり | ○ (真の互換) | - |
| **案4** | **duration維持 + workedMinutes追加** | **あり** | **◎ (完全互換)** | **○（安全重視向け）** |

**互換性の評価基準:**
- ◎ = 既存APIレスポンス・集計ロジックに変更なし（完全互換）
- ○ = フィールド追加のみ、既存フィールドの意味不変（真の互換）
- △ = 既存フィールドの意味が変更される（リリース前後でデータの意味が異なる）

**推奨度の基準:**
- ★推奨（MVP向け）= 実装コスト最小、スピード重視、境界日管理が可能な場合
- ○（安全重視向け）= リスク許容度が低い、監査要件が厳しい、段階的移行を希望する場合

#### 推奨案：案1（duration = 実働時間）

**理由**
1. **意味の明確化**: `duration` は少なくとも利用者支援の実績時間を表す値として扱う方が自然
2. **給付費請求**: 実績計上すべきは実働時間
3. **MVP実装として収まりがよい**: フィールド追加を最小限に抑えつつ、休憩控除を導入できる
4. **新規データでの一貫性**: `breakMinutes = 0` の場合、既存と同じ値になる

**⚠️ 重要な注意点: 既存データとの意味混在リスク**

この方針を採用する場合、以下のリスクを認識し対処する必要があります:

- **新規データ（リリース後）**: `duration` = 実働時間（休憩控除後）
- **既存データ（リリース前）**: `duration` = 総時間（休憩含む）
- **結果**: 同じフィールドで意味が混在する（後方互換ではなく、フィールド意味の途中変更）

**必須対応:**
1. `duration`の意味はリリース以後「実働時間」に統一する
2. 既存データは暫定的に「総時間のまま残る」ため、履歴データには意味差がある
3. 月次集計・レポートでは切替日（リリース日）以前/以後をまたぐ集計に注意する
4. 集計画面・帳票・監査資料ではリリース境界日を明示する
5. 必要に応じて移行フラグや注記を表示する

**データ構造**
```prisma
model ServiceRecord {
  // ... 既存フィールド

  duration     Int  // 実働時間（分）= 総時間 - 休憩時間
  breakMinutes Int  @default(0) // 休憩時間（分）

  // 総時間は計算可能: totalMinutes = (endTime - startTime) / 60000
}
```

**計算式**
```typescript
const totalMinutes = Math.round(
  (endTime.getTime() - startTime.getTime()) / (1000 * 60)
);
const breakMinutes = dailyLog.breakMinutes || 0;
const duration = totalMinutes - breakMinutes; // 実働時間
```

#### 案2・案3を見送る理由

**案2（duration = 総時間のまま）**
- ❌ `duration` という名前から「実働時間」を期待するユーザーが混乱
- ❌ 給付費請求の根拠として不適切
- ❌ 既存の月次集計ロジックが実働時間を得るために `duration - breakMinutes` の計算が必要

**案3（totalMinutes を追加）**
- ❌ フィールドが増えて複雑化
- ❌ `totalMinutes` は `endTime - startTime` で計算可能なので冗長
- ❌ マイグレーションコストが高い

**案4（workedMinutes を新設し、duration は維持）- より安全な代替案**

意味混在のリスクを避けたい場合、以下の方針も検討可能:

```prisma
model ServiceRecord {
  duration      Int  // 既存のまま維持（後方互換のため総時間のまま）
  breakMinutes  Int  @default(0)
  workedMinutes Int? // 新設（実働時間 = duration - breakMinutes）
}
```

**メリット:**
- ✅ 既存データとの意味混在が起きない
- ✅ 段階的な移行が可能（workedMinutes 優先 → duration 非推奨 → duration 削除）
- ✅ 集計ロジックの切り替えが明確

**デメリット:**
- ❌ フィールドが増える
- ❌ workedMinutes が NULL の場合の扱いが必要
- ❌ 実装コストがやや高い

**判断基準:**
- リスク許容度が低い場合、または監査要件が厳しい場合は案4を推奨
- スピード重視で、リリース境界日の管理が可能な場合は案1を推奨

### 2.3 勤怠との責務分担

| 対象 | 責務 | 休憩の意味 |
|------|------|-----------|
| **Shift** | 職員のシフト予定 | 職員の休憩時間 |
| **AttendanceRecord** | 職員の勤怠実績 | 職員の実際の休憩時間 |
| **DailyLog** | 利用者へのサービス提供記録 | サービス提供の中断時間 |
| **ServiceRecord** | 給付費請求の根拠 | 請求対象外の時間 |

**設計原則**
- 業務日誌の休憩時間は、職員の休憩時間と **通常は一致する** が、別管理
- 例：職員2名体制で交代休憩の場合、業務日誌の休憩は0分（常に誰かがサービス提供）
- 基本的には `Shift.breakMinutes` をコピーして使用

### 2.4 夜勤・日跨ぎの扱い

#### 基準日の定義

**結論：勤務開始日を基準日とする**

- `DailyLog.logDate` = 勤務開始日（15:30開始なら当日）
- `ServiceRecord.serviceDate` = `DailyLog.logDate` を引き継ぐ

**例：2026/3/14 15:30 ～ 2026/3/15 09:30 の夜勤**
```
DailyLog.logDate        = 2026-03-14
DailyLog.shiftStart     = 2026-03-14 15:30:00+09:00
DailyLog.shiftEnd       = 2026-03-15 09:30:00+09:00
DailyLog.breakMinutes   = 120

ServiceRecord.serviceDate = 2026-03-14
ServiceRecord.startTime   = 2026-03-14 15:30:00+09:00
ServiceRecord.endTime     = 2026-03-15 09:30:00+09:00
ServiceRecord.duration    = 960  // 1080 - 120（実働時間）
ServiceRecord.breakMinutes = 120
ServiceRecord.timeBand    = "CROSSES_BANDS"  // ⚠️ 拘束時間ベースで判定（12時間以上は必ず時間帯跨ぎ）
```

#### 時間帯（timeBand）判定の重要な仕様

**⚠️ 時間帯判定は拘束時間（shiftStart ～ shiftEnd）ベースで行う**

- `timeBand` の判定には `startTime` と `endTime` を使用（休憩時間は考慮しない）
- 理由：
  - 早朝・深夜加算は「その時間帯に勤務していたか」で判定される
  - 休憩中も事業所に拘束されている時間として扱う
  - 実働時間（`duration`）ではなく、拘束時間で時間帯を判定する必要がある

**現行実装の判定ロジック（`src/server/lib/timeBand.ts`）:**
1. **12時間以上の勤務は必ず `CROSSES_BANDS`**（日跨ぎ判定）
2. 開始・終了が両方とも DAYTIME 内 → `DAYTIME`
3. 開始・終了が両方とも EARLY_LATE 内 → `EARLY_LATE`
4. それ以外（どちらか一方のみが該当） → `CROSSES_BANDS`

**例：夜勤（15:30-09:30、休憩120分）**
```typescript
// ✅ 正しい判定（拘束時間ベース）
timeBand = calculateTimeBand(
  shiftStart: new Date('2026-03-14T15:30:00+09:00'),  // 拘束開始
  shiftEnd: new Date('2026-03-15T09:30:00+09:00')     // 拘束終了（翌日）
)
// → 18時間勤務（12時間以上）のため "CROSSES_BANDS"
// （現行実装では日跨ぎ長時間勤務は必ず時間帯跨ぎとして扱われる）

// ❌ 誤った判定（実働時間ベース）
// 休憩時間を引いた「実働16時間」で判定してはならない
```

**⚠️ 注意:**
- 上記の例は現行の `calculateTimeBand` 実装に基づく
- TimeBandRule の設定内容によって結果は変わる可能性がある
- 実際の判定結果は `calculateTimeBand(db, shiftStart, shiftEnd)` の返り値に依存

#### 休憩が日跨ぎする場合

休憩開始・終了時刻は MVP では記録しないため、計算への影響なし。
将来的に `breakStart` / `breakEnd` を追加する場合も、`breakMinutes` が正確であれば問題ない。

---

## 3. Prisma schema の改修案

### 3.1 最小変更案（MVP / Phase 1）

```prisma
model DailyLog {
  id               String        @id @default(cuid())
  unitId           String
  logDate          DateTime      @db.Date
  shift            String        // "Day" / "Late" / "Night"
  shiftStart       DateTime
  shiftEnd         DateTime
  staffId          String
  staffRole        String?
  residentSummary  Json?
  majorEvent       Boolean       @default(false)
  handover         String?       @db.Text

  // ✅ 追加フィールド
  breakMinutes     Int           @default(0) // 休憩時間（分）

  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt

  unit             Unit          @relation(fields: [unitId], references: [id], onDelete: Cascade)
  staff            User          @relation(fields: [staffId], references: [id])
  entries          DailyLogEntry[]

  @@index([unitId, logDate])
  @@index([logDate, shift])
  @@map("daily_logs")
}

model ServiceRecord {
  id                  String    @id @default(cuid())
  recipientId         String
  userId              String
  serviceType         String
  serviceDate         DateTime  @db.Date
  startTime           DateTime
  endTime             DateTime
  duration            Int       // ✅ 意味変更：実働時間（休憩控除後）
  serviceDetail       String    @db.Text
  userCondition       String?   @db.Text
  incidents           String?   @db.Text

  // ✅ 追加フィールド
  breakMinutes        Int       @default(0) // 休憩時間（分）

  timeBand            String?   // "DAYTIME" / "EARLY_LATE" / "CROSSES_BANDS"
  appliedRuleVersion  String?
  dailyLogEntryId     String?   @unique
  guideRecordId       String?   @unique
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  recipient           CareRecipient  @relation(fields: [recipientId], references: [id], onDelete: Cascade)
  user                User           @relation(fields: [userId], references: [id])
  dailyLogEntry       DailyLogEntry? @relation(fields: [dailyLogEntryId], references: [id])
  guideRecord         GuideRecord?   @relation(fields: [guideRecordId], references: [id])

  @@index([recipientId, serviceDate])
  @@index([userId, serviceDate])
  @@index([serviceDate])
  @@index([serviceType])
  @@index([timeBand])
  @@map("service_records")
}
```

### 3.2 マイグレーション戦略

```prisma
// migration.sql の例
-- Step 1: DailyLog に breakMinutes 追加
ALTER TABLE "daily_logs"
ADD COLUMN "break_minutes" INTEGER NOT NULL DEFAULT 0;

-- Step 2: ServiceRecord に breakMinutes 追加
ALTER TABLE "service_records"
ADD COLUMN "break_minutes" INTEGER NOT NULL DEFAULT 0;

-- Step 3: 既存データは breakMinutes = 0 として扱う（デフォルト値により自動対応）

-- Step 4: コメント追加（ドキュメント用）
COMMENT ON COLUMN "daily_logs"."break_minutes" IS '休憩時間（分）';
COMMENT ON COLUMN "service_records"."break_minutes" IS '休憩時間（分）';
COMMENT ON COLUMN "service_records"."duration" IS '実働時間（分）= 総時間 - 休憩時間';
```

### 3.3 拡張案（Phase 2以降）

```prisma
// 案1: DailyLog に時刻フィールド追加
model DailyLog {
  // ...
  breakMinutes Int      @default(0)
  breakStart   DateTime? // 休憩開始時刻
  breakEnd     DateTime? // 休憩終了時刻
}

// 案2: 別テーブルで複数休憩対応
model DailyLogBreak {
  id          String   @id @default(cuid())
  dailyLogId  String
  startTime   DateTime
  endTime     DateTime
  durationMinutes Int  // endTime - startTime (分)
  note        String?
  createdAt   DateTime @default(now())

  dailyLog    DailyLog @relation(fields: [dailyLogId], references: [id], onDelete: Cascade)

  @@index([dailyLogId])
  @@map("daily_log_breaks")
}

model DailyLog {
  // ...
  breakMinutes Int              @default(0) // 合計休憩時間
  breaks       DailyLogBreak[]  // 複数休憩対応
}
```

**Phase 2 の判断基準**
- 複数回休憩が必要になったとき
- 休憩時刻の記録が監査要件になったとき
- 休憩時刻と時間帯判定の連動が必要になったとき

---

## 4. 初期値・計算ルール

### 4.1 breakMinutes の初期値取得ロジック

**優先順位**
```typescript
function getDefaultBreakMinutes(
  shift?: Shift,
  shiftType?: ShiftType
): number {
  // 1. 紐づくShiftがあればそれを優先
  if (shift?.breakMinutes != null) {
    return shift.breakMinutes;
  }

  // 2. ShiftTypeをフォールバック
  if (shiftType?.breakMinutes != null) {
    return shiftType.breakMinutes;
  }

  // 3. どちらもなければ0
  return 0;
}
```

**実装箇所**
- フロントエンド：業務日誌作成フォームの初期値
- バックエンド：`dailyLog.create` API（オプション）

### 4.2 ServiceRecord 生成時の計算式

```typescript
// src/server/routers/dailyLog.ts の upsertEntry 内
async function generateServiceRecord(dailyLog: DailyLog, entry: DailyLogEntry) {
  // 総時間を計算（ミリ秒 → 分）
  const totalMinutes = Math.round(
    (dailyLog.shiftEnd.getTime() - dailyLog.shiftStart.getTime()) / (1000 * 60)
  );

  // 休憩時間を取得（nullの場合は0）
  const breakMinutes = dailyLog.breakMinutes ?? 0;

  // 実働時間 = 総時間 - 休憩時間
  const duration = totalMinutes - breakMinutes;

  // duration が負にならないよう検証
  if (duration < 0) {
    throw new Error(
      `休憩時間が総時間を超えています: 総${totalMinutes}分 - 休憩${breakMinutes}分`
    );
  }

  // 時間帯を計算
  const { timeBand, ruleVersion } = await calculateTimeBand(
    ctx.db,
    dailyLog.shiftStart,
    dailyLog.shiftEnd
  );

  // ServiceRecord データ
  const serviceRecordData = {
    recipientId: entry.recipientId,
    userId: dailyLog.staffId,
    serviceType: /* サービス種別マッピング */,
    serviceDate: dailyLog.logDate,
    startTime: dailyLog.shiftStart,
    endTime: dailyLog.shiftEnd,
    duration,            // ✅ 実働時間
    breakMinutes,        // ✅ 休憩時間
    serviceDetail,
    userCondition: entry.behaviorNote || null,
    incidents: entry.notes || null,
    timeBand,
    appliedRuleVersion: ruleVersion,
  };

  return serviceRecordData;
}
```

### 4.3 breakMinutes: Int vs Int?

**結論：`Int @default(0)` を採用**

| 観点 | `Int @default(0)` | `Int?` |
|------|-------------------|--------|
| データ移行 | ◎ 自動で0埋め | △ NULL許容が増える |
| 既存互換性 | ◎ 計算式が単純 | △ NULL チェック必須 |
| UI実装 | ◎ 空欄 = 0 で自然 | △ 空欄 = NULL の扱い |
| 意味の明確性 | ◎ 休憩なし = 0 | △ NULL = 未入力 or 休憩なし？ |

**推奨：`Int @default(0)`**
- 理由：休憩なしは「0分」という明確な値
- NULL は「不明」を意味してしまい、監査時に説明しづらい

### 4.4 既存データとの互換性

#### 既存 DailyLog の扱い

```sql
-- マイグレーション時
ALTER TABLE "daily_logs"
ADD COLUMN "break_minutes" INTEGER NOT NULL DEFAULT 0;

-- 既存レコードは全て breakMinutes = 0 になる
```

**⚠️ 重要な解釈上の注意:**
1. マイグレーション後、既存レコードには `breakMinutes = 0` が入る
2. ただし、これは「当時休憩がなかった」ことを保証するものではなく、休憩情報が未管理だった結果として0で保持される
3. 実際には休憩があった可能性が高い夜勤データも `breakMinutes = 0` となるが、これは技術的制約による暫定値である

#### 既存 ServiceRecord の再計算

**方針：再計算しない（現状維持）**

**理由**
1. 既存の `ServiceRecord.duration` は総時間として記録されている
2. 既存レコードには休憩情報が存在しないため、移行後は `breakMinutes = 0` が入る
3. ただし、これは「当時休憩がなかった」ことを保証するものではなく、休憩情報が未管理だった結果として0で保持される
4. 過去データの遡及修正は監査上のリスク

**⚠️ GuideRecord 由来の ServiceRecord について:**
- GuideRecord から生成される ServiceRecord は、リリース後も `breakMinutes = 0` のまま
- GuideRecord には休憩時間の概念がない（個別支援記録のため）
- `guideRecordId != null` の場合、`duration` は総時間だが、休憩がない前提では実働時間と一致する
- よって、`duration` の意味（実働時間）は DailyLog 由来と整合する

**⚠️ 重大なリスク**
- 過去の夜勤データは実績が過大計上されたまま（実際には休憩があった可能性が高いが記録がない）
- 月次集計の過去データに誤差が残る
- **`duration`フィールドの意味が、リリース前後で異なる状態が永続化する**
  - リリース前: `duration` = 総時間（休憩情報なし）
  - リリース後: `duration` = 実働時間（休憩控除済み）
- **`breakMinutes = 0` が「休憩なし」と「休憩情報なし」の両方を表す二重の意味を持つ**

**リスク軽減策**
- マイグレーション時に警告ログを出力
- 必要に応じて手動で過去の夜勤データを修正するスクリプトを提供（後述）
- **監査時の説明資料を用意（重要）**:
  - 「既存データの `breakMinutes = 0` は休憩情報が未管理だった結果であり、実際に休憩がなかったことを意味しない」
  - 「移行日以前のデータは総時間、以降は実働時間として記録されている」
- **月次集計・レポート機能に「リリース境界日」を記録・表示する機能を追加**
- 集計画面に注記を表示:
  ```
  ⚠️ 2026年XX月XX日以前のデータは休憩時間情報がないため、
     実際の休憩時間が含まれた値として記録されています。
  ```

**再計算スクリプト（オプション）**

⚠️ **このスクリプトは非常にリスクが高いため、慎重に設計・実行すること**

**再計算禁止条件（絶対に修正してはならないデータ）:**
- 月次締め済みデータ（締め処理フラグがある場合）
- 請求提出済みデータ（給付費請求済みの場合）
- 監査対象期間の確定済みデータ
- 会計年度をまたぐ過去データ（原則として修正不可）

⚠️ **現時点のスクリプトは、再計算禁止条件のうち一部が TODO です。**
**本番利用前に、月次締めフラグ・請求提出フラグ・監査確定フラグを実データ上で必ず判定する実装を追加してください。**

**再計算時の必須要件:**
1. **ドライラン対応**: 実際の更新前に影響範囲を確認できること
2. **更新前後ログの保存**: 変更内容を完全に記録（監査証跡）
3. **対象期間・対象件数の明示**: 何件のデータを修正するか事前確認
4. **ロールバック手順の用意**: トランザクションまたは復元SQLの準備
   - `generateRollbackSQL` は本番実行時に自動でファイル保存する実装まで接続すること
   - 未接続のままなら「将来実装予定」と明記し、ロールバック手順を別紙で定義すること
5. **承認プロセス**: 管理者・監査担当者の承認を得ること
6. **バックアップ**: 実行前に必ずデータベース全体をバックアップ
7. **二重実行防止**: 同一期間・同一対象への再計算スクリプトの重複実行を防ぐため、実行履歴テーブルまたは実行ログ管理を行う
8. **実行者記録**: 本番実行時は「実行者」「承認者」「実行日時」「対象件数」を必ず保存する（監査対応）

**再計算対象の絞り込み:**
- 暫定的には夜勤（`shift = 'Night'`）を優先対象とするが、仕様上は `breakMinutes > 0` のすべての DailyLog が再計算候補である
- `shift = 'Night'` に限定する場合は、その理由（影響範囲の限定、誤更新防止など）を明記する
- 実際の対象範囲は運用方針に応じて調整すること

```typescript
// scripts/recalculate-service-records-with-break.ts
//
// 用途：過去の夜勤データで明らかに休憩がある場合に手動で修正
// 実行条件：監査対応などで過去データの修正が必要な場合のみ
//
// ⚠️ 警告：このスクリプトは給付費請求・監査に影響する重大な操作です
//          必ず承認を得てから実行してください

import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

// 実行モード
const DRY_RUN = process.env.DRY_RUN !== 'false'; // デフォルトはドライラン

// 再計算禁止期間（例：2026年3月以前は修正不可）
const RECALCULATION_CUTOFF_DATE = new Date('2026-03-01');

async function recalculateWithBreak() {
  console.log('🔍 ServiceRecord 休憩時間再計算スクリプト');
  console.log(`モード: ${DRY_RUN ? 'ドライラン（実際には更新しません）' : '本番実行'}`);
  console.log(`再計算禁止期間: ${RECALCULATION_CUTOFF_DATE.toISOString()} 以前\n`);

  // ログファイル準備
  const logFile = `recalculation-log-${new Date().toISOString()}.json`;
  const changes: any[] = [];

  // 1. 夜勤のDailyLogで breakMinutes > 0 のものを取得
  const nightShiftLogs = await prisma.dailyLog.findMany({
    where: {
      shift: 'Night',
      breakMinutes: { gt: 0 },
      logDate: { gte: RECALCULATION_CUTOFF_DATE }, // ⚠️ 禁止期間を除外
    },
    include: {
      entries: {
        include: {
          serviceRecord: true
        }
      }
    },
  });

  console.log(`対象 DailyLog: ${nightShiftLogs.length}件\n`);

  let updateCount = 0;
  let skipCount = 0;

  // 2. 対応するServiceRecordを再計算
  for (const log of nightShiftLogs) {
    for (const entry of log.entries) {
      if (!entry.serviceRecord) continue;

      // ⚠️ 禁止条件チェック（拡張可能）
      // TODO: 月次締めフラグ、請求提出フラグなどを確認
      // if (entry.serviceRecord.isMonthClosed || entry.serviceRecord.isBilled) {
      //   console.log(`❌ スキップ（締め済み）: ${entry.serviceRecord.id}`);
      //   skipCount++;
      //   continue;
      // }

      const totalMinutes = Math.round(
        (log.shiftEnd.getTime() - log.shiftStart.getTime()) / (1000 * 60)
      );
      const newDuration = totalMinutes - log.breakMinutes;

      // バリデーション
      if (newDuration < 0) {
        console.log(`⚠️ スキップ（不正な値）: ${entry.serviceRecord.id} (duration would be negative)`);
        skipCount++;
        continue;
      }

      // 変更ログ記録
      const change = {
        serviceRecordId: entry.serviceRecord.id,
        dailyLogId: log.id,
        logDate: log.logDate,
        before: {
          duration: entry.serviceRecord.duration,
          breakMinutes: entry.serviceRecord.breakMinutes,
        },
        after: {
          duration: newDuration,
          breakMinutes: log.breakMinutes,
        },
        timestamp: new Date().toISOString(),
      };
      changes.push(change);

      console.log(`${DRY_RUN ? '🔍' : '✅'} 更新: ${entry.serviceRecord.id}`);
      console.log(`   日付: ${log.logDate.toISOString().split('T')[0]}`);
      console.log(`   duration: ${entry.serviceRecord.duration} → ${newDuration}`);
      console.log(`   breakMinutes: ${entry.serviceRecord.breakMinutes} → ${log.breakMinutes}\n`);

      // 本番実行時のみ更新
      if (!DRY_RUN) {
        await prisma.serviceRecord.update({
          where: { id: entry.serviceRecord.id },
          data: {
            duration: newDuration,
            breakMinutes: log.breakMinutes,
          },
        });
      }

      updateCount++;
    }
  }

  // ログ保存
  fs.writeFileSync(logFile, JSON.stringify(changes, null, 2));

  // ⚠️ ロールバックSQL保存（本番実行時のみ）
  if (!DRY_RUN && changes.length > 0) {
    const rollbackSQL = generateRollbackSQL(changes);
    const rollbackFile = `rollback-${new Date().toISOString()}.sql`;
    fs.writeFileSync(rollbackFile, rollbackSQL);
    console.log(`\n💾 ロールバックSQL保存: ${rollbackFile}`);
  }

  // サマリー表示
  console.log('\n📊 実行結果サマリー');
  console.log(`対象レコード: ${updateCount}件`);
  console.log(`スキップ: ${skipCount}件`);
  console.log(`変更ログ: ${logFile}`);

  if (DRY_RUN) {
    console.log('\n⚠️ これはドライランです。実際の更新は行われていません。');
    console.log('本番実行する場合は DRY_RUN=false を設定してください。');
  } else {
    console.log('\n✅ 本番実行が完了しました。');
    console.log('⚠️ ログファイルとロールバックSQLを必ず保管してください（監査資料）。');
  }

  await prisma.$disconnect();
}

// ロールバックSQL生成
function generateRollbackSQL(changes: any[]): string {
  const header = `-- Rollback SQL for ServiceRecord break_minutes recalculation
-- Generated: ${new Date().toISOString()}
-- Total changes: ${changes.length}
-- ⚠️ WARNING: Execute this SQL only if rollback is necessary
-- ⚠️ Verify the target database before execution

BEGIN;
`;

  const sql = changes.map(c =>
    `UPDATE service_records SET duration = ${c.before.duration}, break_minutes = ${c.before.breakMinutes} WHERE id = '${c.serviceRecordId}'; -- Date: ${c.logDate}`
  ).join('\n');

  const footer = `
COMMIT;

-- Rollback verification query:
-- SELECT id, duration, break_minutes, updated_at FROM service_records WHERE id IN ('${changes.map(c => c.serviceRecordId).join("','")}');
`;

  return header + sql + footer;
}

recalculateWithBreak().catch(console.error);
```

**実行例:**
```bash
# ドライラン（デフォルト）
npx tsx scripts/recalculate-service-records-with-break.ts

# 本番実行（承認後のみ）
DRY_RUN=false npx tsx scripts/recalculate-service-records-with-break.ts
```

---

## 5. 実装順序

### Phase 1: MVP実装

#### ステップ1：要件整理・設計確定 ✅
- 本ドキュメントのレビュー
- フィールド名・計算式・基準日の確定
- ステークホルダー承認

#### ステップ2：Prisma スキーマ修正
```bash
# 1. schema.prisma 修正
# 2. マイグレーション作成
npx prisma migrate dev --name add_break_minutes_to_daily_log_and_service_record

# 3. マイグレーション実行確認
npx prisma migrate status

# 4. Prisma Client 再生成
npx prisma generate
```

**修正ファイル**
- `prisma/schema.prisma`: DailyLog と ServiceRecord に `breakMinutes` 追加

#### ステップ3：バックエンドロジック修正

**ファイル: `src/server/routers/dailyLog.ts`**

```typescript
// create: breakMinutes を受け取る
create: protectedProcedure
  .input(
    z.object({
      // ... 既存フィールド
      breakMinutes: z.number().int().min(0).default(0), // ✅ 追加
    })
  )
  .mutation(async ({ ctx, input }) => {
    const dailyLog = await ctx.db.dailyLog.create({
      data: {
        ...input,
        staffId: ctx.session.user.id,
        entries: {
          create: activeRecipientIds.map((recipientId) => ({ recipientId })),
        },
      },
      // ...
    });
    // ...
  }),

// update: breakMinutes を受け取る
update: protectedProcedure
  .input(
    z.object({
      id: z.string(),
      breakMinutes: z.number().int().min(0).optional(), // ✅ 追加
      // ... 既存フィールド
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { id, changeNote, ...data } = input;

    const dailyLog = await ctx.db.dailyLog.update({
      where: { id },
      data
    });

    // breakMinutes が変更された場合、関連する ServiceRecord を更新
    if (data.breakMinutes != null) {
      const entries = await ctx.db.dailyLogEntry.findMany({
        where: { dailyLogId: id },
        include: { serviceRecord: true },
      });

      const updatedDailyLog = await ctx.db.dailyLog.findUniqueOrThrow({
        where: { id },
        select: { shiftStart: true, shiftEnd: true, breakMinutes: true },
      });

      const totalMinutes = Math.round(
        (updatedDailyLog.shiftEnd.getTime() - updatedDailyLog.shiftStart.getTime()) / (1000 * 60)
      );
      const duration = totalMinutes - updatedDailyLog.breakMinutes;

      // 各エントリの ServiceRecord を更新
      for (const entry of entries) {
        if (entry.serviceRecord) {
          await ctx.db.serviceRecord.update({
            where: { id: entry.serviceRecord.id },
            data: {
              duration,
              breakMinutes: updatedDailyLog.breakMinutes,
            },
          });
        }
      }
    }
    // ...
  }),

// upsertEntry: ServiceRecord 生成時に休憩控除
upsertEntry: protectedProcedure
  .input(/* ... */)
  .mutation(async ({ ctx, input }) => {
    // ... 既存処理

    if (shouldGenerateServiceRecord) {
      // ✅ 休憩控除を含む計算（DailyLog 由来のみ）
      const totalMinutes = Math.round(
        (dailyLog.shiftEnd.getTime() - dailyLog.shiftStart.getTime()) / (1000 * 60)
      );
      const breakMinutes = dailyLog.breakMinutes ?? 0;
      const duration = totalMinutes - breakMinutes;

      // ⚠️ 時間帯判定は拘束時間（shiftStart ～ shiftEnd）ベースで行う
      // 理由: 早朝・深夜加算は「その時間帯に勤務していたか」で判定されるため、
      //       休憩中も含めた拘束時間で判定する必要がある
      const { timeBand, ruleVersion } = await calculateTimeBand(
        ctx.db,
        dailyLog.shiftStart,
        dailyLog.shiftEnd
      );

      // ✅ バリデーション
      if (duration < 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `休憩時間が総時間を超えています（総${totalMinutes}分 - 休憩${breakMinutes}分）`,
        });
      }

      const serviceRecordData = {
        recipientId,
        userId: dailyLog.staffId,
        serviceType: /* ... */,
        serviceDate: dailyLog.logDate,
        startTime: dailyLog.shiftStart,
        endTime: dailyLog.shiftEnd,
        duration,          // ✅ 実働時間（DailyLog 由来）
        breakMinutes,      // ✅ 休憩時間（DailyLog 由来）
        serviceDetail,
        userCondition: data.behaviorNote || null,
        incidents: data.notes || null,
        timeBand,
        appliedRuleVersion: ruleVersion,
        dailyLogEntryId: entry.id,  // ⚠️ DailyLog 由来であることを記録
      };

      // ... ServiceRecord 作成/更新
    }
  }),
```

**新規ファイル: `scripts/validate-break-minutes.ts`**
```typescript
// 既存データの整合性チェックスクリプト
// 実行タイミング：マイグレーション後、本番デプロイ前

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function validateBreakMinutes() {
  console.log('🔍 休憩時間の整合性チェック中...\n');

  const records = await prisma.serviceRecord.findMany({
    where: {
      dailyLogEntryId: { not: null },
    },
    include: {
      dailyLogEntry: {
        include: {
          dailyLog: true,
        },
      },
    },
  });

  let errorCount = 0;

  for (const record of records) {
    const dailyLog = record.dailyLogEntry?.dailyLog;
    if (!dailyLog) continue;

    const totalMinutes = Math.round(
      (dailyLog.shiftEnd.getTime() - dailyLog.shiftStart.getTime()) / (1000 * 60)
    );
    const expectedDuration = totalMinutes - record.breakMinutes;

    if (record.duration !== expectedDuration) {
      console.error(`❌ 不整合: ServiceRecord ${record.id}`);
      console.error(`   duration: ${record.duration}, 期待値: ${expectedDuration}`);
      errorCount++;
    }
  }

  if (errorCount === 0) {
    console.log('✅ 整合性チェック完了：問題なし');
  } else {
    console.log(`\n⚠️ ${errorCount}件の不整合を検出`);
  }

  await prisma.$disconnect();
}

validateBreakMinutes();
```

#### ステップ4：フロントエンド修正

**ファイル: `src/app/units/[id]/log/new/page.tsx`**

```tsx
// 業務日誌作成フォーム

const schema = z.object({
  // ... 既存フィールド
  breakMinutes: z.number().int().min(0).default(0), // ✅ 追加
});

export default function NewDailyLogPage() {
  const form = useForm({
    defaultValues: {
      // ...
      breakMinutes: 0, // ✅ 初期値
    },
  });

  return (
    <form>
      {/* ... 既存フィールド */}

      {/* ✅ 休憩時間入力欄 */}
      <div>
        <label htmlFor="breakMinutes">休憩時間</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            id="breakMinutes"
            min="0"
            step="15"
            {...form.register('breakMinutes', { valueAsNumber: true })}
          />
          <span>分</span>
        </div>
        <p className="text-sm text-gray-500">
          一般的な休憩時間: 日勤 60分、夜勤 120分
        </p>
      </div>
    </form>
  );
}
```

**ファイル: `src/app/units/[id]/log/[logId]/page.tsx`**

```tsx
// 業務日誌詳細画面

export default function DailyLogDetailPage() {
  const { data: log } = trpc.dailyLog.get.useQuery({ id: logId });

  return (
    <div>
      {/* ... 既存表示 */}

      {/* ✅ 休憩時間表示 */}
      <div>
        <dt>シフト時間</dt>
        <dd>
          {formatTime(log.shiftStart)} ～ {formatTime(log.shiftEnd)}
          {log.breakMinutes > 0 && (
            <span className="ml-2 text-sm text-gray-600">
              （休憩 {log.breakMinutes}分）
            </span>
          )}
        </dd>
      </div>

      {/* ✅ 実働時間表示 */}
      <div>
        <dt>実働時間</dt>
        <dd>
          {calculateWorkMinutes(log.shiftStart, log.shiftEnd, log.breakMinutes)}分
          （{formatHours(calculateWorkMinutes(...))}）
        </dd>
      </div>
    </div>
  );
}

function calculateWorkMinutes(start: Date, end: Date, breakMinutes: number): number {
  const total = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
  return total - breakMinutes;
}

function formatHours(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}時間${mins}分` : `${hours}時間`;
}
```

#### ステップ5：テスト

**テストケース**

1. **日勤（休憩なし）**
   ```
   シフト: 09:00-18:00
   休憩: 0分
   期待duration: 540分
   ```

2. **日勤（休憩あり）**
   ```
   シフト: 09:00-18:00
   休憩: 60分
   期待duration: 480分
   ```

3. **夜勤（休憩あり）**
   ```
   シフト: 15:30-09:30
   休憩: 120分
   期待duration: 960分
   ```

4. **バリデーション：休憩時間が総時間を超える**
   ```
   シフト: 09:00-12:00
   休憩: 240分
   期待結果: エラー
   ```

5. **既存データ互換性**
   ```
   breakMinutes: null または undefined
   期待結果: 0 として扱われる
   ```

**テストスクリプト例**
```typescript
// test/dailyLog.test.ts

describe('DailyLog with breakMinutes', () => {
  it('日勤（休憩なし）の ServiceRecord 生成', async () => {
    const dailyLog = await createDailyLog({
      shiftStart: new Date('2026-03-15T00:00:00Z'), // 09:00 JST
      shiftEnd: new Date('2026-03-15T09:00:00Z'),   // 18:00 JST
      breakMinutes: 0,
    });

    const entry = await upsertEntry(dailyLog.id, recipient.id, {});
    const serviceRecord = await getServiceRecord(entry.id);

    expect(serviceRecord.duration).toBe(540);
    expect(serviceRecord.breakMinutes).toBe(0);
  });

  it('夜勤（休憩120分）の ServiceRecord 生成', async () => {
    const dailyLog = await createDailyLog({
      shiftStart: new Date('2026-03-14T06:30:00Z'), // 15:30 JST
      shiftEnd: new Date('2026-03-15T00:30:00Z'),   // 09:30 JST 翌日
      breakMinutes: 120,
    });

    const entry = await upsertEntry(dailyLog.id, recipient.id, {});
    const serviceRecord = await getServiceRecord(entry.id);

    expect(serviceRecord.duration).toBe(960); // 1080 - 120
    expect(serviceRecord.breakMinutes).toBe(120);
  });

  it('休憩時間が総時間を超える場合はエラー', async () => {
    const dailyLog = await createDailyLog({
      shiftStart: new Date('2026-03-15T00:00:00Z'),
      shiftEnd: new Date('2026-03-15T03:00:00Z'),
      breakMinutes: 240,
    });

    await expect(
      upsertEntry(dailyLog.id, recipient.id, {})
    ).rejects.toThrow('休憩時間が総時間を超えています');
  });
});
```

---

## 6. フィールド命名の比較

`ServiceRecord.duration` の意味を変更する場合、既存互換性のために別名を検討する可能性があります。

| 命名案 | 意味 | 誤解のリスク | 推奨度 |
|--------|------|-------------|--------|
| **duration** | **実働時間** | **低** | **★推奨** |
| workedMinutes | 実働時間 | 低 | ○ |
| serviceMinutes | サービス提供時間 | 低 | ○ |
| totalMinutes | 総時間（拘束時間） | 中（実働と誤解） | △ |
| netMinutes | 正味時間 | 中（専門用語） | △ |

**結論：`duration` をそのまま使用**

**理由**
1. **意味の直感性**: duration は「実働時間」を意味するのが自然
2. **APIの一貫性**: 既存の他システムとの連携で `duration` が一般的
3. **コスト**: 名前を変えるとマイグレーションコストが高い
4. **互換性**: `breakMinutes = 0` の場合、既存と同じ値

**代替案を採用する場合**
- `workedMinutes`: 最も明確だが、冗長
- `serviceMinutes`: サービス提供時間として意味が明確
- いずれも採用するなら、既存 `duration` を `totalMinutes` にリネーム必要

---

## 7. 既存 duration 依存箇所の段階移行

### 7.1 影響範囲の特定

**依存箇所**
1. **月次集計**: `serviceRecord.monthlySummary`
2. **Excel 出力**: 業務日誌の利用者別記録エクスポート
3. **API レスポンス**: `serviceRecord.list`, `serviceRecord.get`
4. **フロントエンド表示**: サービス実績一覧、詳細画面

### 7.2 段階移行戦略

#### Phase 1: MVP（後方互換性を保ちつつ新機能追加）

**方針**
- `duration` = 実働時間に変更
- `breakMinutes = 0` により既存データは影響なし
- API レスポンスに `breakMinutes` 追加
- フロントエンドは両方を表示可能にする

**API レスポンス（変更後）**
```typescript
// ServiceRecord レスポンス
{
  id: "xxx",
  duration: 960,        // 実働時間
  breakMinutes: 120,    // 休憩時間
  startTime: "2026-03-14T15:30:00+09:00",
  endTime: "2026-03-15T09:30:00+09:00",
  // ...
}

// 互換性のため、クライアント側で総時間を計算可能
const totalMinutes = (endTime - startTime) / 60000;
const actualDuration = duration; // 実働時間
const breakTime = breakMinutes;
```

**月次集計の修正**
```typescript
// src/server/routers/serviceRecord.ts

// ⚠️ リリース境界日（この日以降は duration = 実働時間）
const BREAK_FEATURE_RELEASE_DATE = new Date('2026-XX-XX'); // 実際のリリース日を設定

monthlySummary: protectedProcedure
  .query(async ({ ctx, input }) => {
    const records = await ctx.db.serviceRecord.findMany({
      where: whereClause,
    });

    let totalDuration = 0;
    let totalBreakMinutes = 0; // ✅ 追加
    let hasLegacyData = false; // ⚠️ 旧データ混在フラグ

    records.forEach((record) => {
      totalDuration += record.duration; // 実働時間の合計
      totalBreakMinutes += record.breakMinutes; // ✅ 休憩の合計

      // ⚠️ 旧新データ判定（serviceDate ベースで判定）
      // 注意: createdAt では過去勤務の後追い登録で誤判定する可能性があるため、
      //       serviceDate を使用する（または専用の意味バージョン管理項目）
      if (record.serviceDate < BREAK_FEATURE_RELEASE_DATE) {
        hasLegacyData = true;
      }
    });

    return {
      totalRecords: records.length,
      totalDuration,              // 実働時間の合計
      totalBreakMinutes,          // ✅ 休憩時間の合計
      totalHours: Math.floor(totalDuration / 60),
      totalMinutes: totalDuration % 60,
      hasLegacyData,              // ⚠️ 注記表示用フラグ
      releaseDate: BREAK_FEATURE_RELEASE_DATE, // ⚠️ 境界日
      // ...
    };
  }),
```

**⚠️ 旧新データ判定の注意点:**
- `createdAt` のみに依存すると、過去勤務の後追い登録で誤判定する可能性がある
- **推奨**: `serviceDate` 基準、または専用の意味バージョン管理項目（`breakFeatureVersion`, `durationSemanticsVersion` など）で判定する
- データ移行で `createdAt` だけが新しい場合も考慮が必要

**フロントエンドでの表示例:**
```tsx
{summary.hasLegacyData && (
  <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm">
    ⚠️ {format(summary.releaseDate, 'yyyy年MM月dd日')}以前のデータは休憩時間情報がないため、
    実際の休憩時間が含まれた値として記録されています。
    正確な実働時間を確認する場合は個別レコードをご確認ください。
  </div>
)}
```

**Excel 出力の修正**
```typescript
// src/app/units/[id]/log/[logId]/page.tsx の exportTimeSlotExcel

// ヘッダー行は既存のまま
const wsData: any[][] = [
  ["業務日誌", `利用者名（${entry.recipient.name}）`, `${year}年${month}月${day}日`],
  [`記録責任者（${staffName}）`],
  ["時間", "水分量", "食事量", "余暇", "口腔", "入浴", "体調", "服薬", "トイレ", "睡眠", "特記事項"],
];

// データ行
timeSlots.forEach((time) => {
  const slot = timeSlotMap.get(time);
  wsData.push([
    time,
    slot?.water || "",
    // ...
  ]);
});

// ✅ シート末尾にサマリー追加（ヘッダー行には列追加しない）
const totalMinutes = Math.round(
  (log.shiftEnd.getTime() - log.shiftStart.getTime()) / (1000 * 60)
);
const breakMinutes = log.breakMinutes || 0;
const workMinutes = totalMinutes - breakMinutes;

wsData.push([]);
wsData.push(["シフト時間", `${formatTime(log.shiftStart)} ～ ${formatTime(log.shiftEnd)}`]);
wsData.push(["拘束時間", `${totalMinutes}分（${formatHours(totalMinutes)}）`]);
wsData.push(["休憩時間", `${breakMinutes}分（${formatHours(breakMinutes)}）`]);
wsData.push(["実働時間", `${workMinutes}分（${formatHours(workMinutes)}）`]);
```

#### Phase 2: 表示の充実化

**フロントエンドでの表示分離**

サービス実績一覧画面:
```
┌──────────────────────────────────────────────────┐
│ 日付       │ 時間              │ 実働  │ (拘束) │
├──────────────────────────────────────────────────┤
│ 2026/3/14  │ 16:00-翌10:00    │ 16h   │ (18h)  │
│ 2026/3/12  │ 09:00-18:00      │ 9h    │ (9h)   │
└──────────────────────────────────────────────────┘
```

**日跨ぎ表記ルール:**
- 同日内: `09:00-18:00`
- 翌日跨ぎ: `16:00-翌10:00` または `16:00-翌日10:00`

サービス実績詳細画面:
```
勤務時間: 15:30 ～ 翌09:30
拘束時間: 18時間（1080分）
休憩時間: 2時間（120分）
実働時間: 16時間（960分）← これが請求対象
```

#### Phase 3: 監査・レポート機能

**休憩時間の監査レポート**
- 休憩なし（0分）の長時間勤務を検出
- 休憩時間が異常に長いケースを検出
- 月次での休憩時間の集計

---

## 8. 採用しなかった案（B/C）を見送る理由

### 選択肢B：DailyLogEntry から休憩時間を推測

**見送り理由**

1. **推測精度の問題**
   - `timeSlotRecords` の `sleep: "休憩"` は入力者の判断に依存
   - 30分単位のため、正確な休憩時間を推測できない
   - 未入力の場合、推測不可能

2. **監査対応の困難さ**
   - 「なぜこの時間なのか？」を説明できない
   - 推測ロジックの変更で過去データの意味が変わる

3. **実装コストと複雑性**
   - 推測ロジックの実装・テストが必要
   - エッジケースへの対応が困難

**補助的利用の可能性**
- Phase 2以降、UI補助として：
  - ⚠️ `timeSlotRecords` の `sleep: "休憩"` は睡眠記録欄を転用する形になり、意味がずれるため非推奨
  - より適切な方法：
    - 専用の「休憩」フィールドを `timeSlotRecords` に追加
    - または業務日誌作成時に別途「休憩時間帯」入力UIを設ける
  - 検出した休憩時間帯をもとに合計分数を計算し、ユーザーに「休憩120分を入力しますか？」と提案
  - 最終的にはユーザーが確定

### 選択肢C：ServiceRecord 計算時に固定ルールで休憩を引く

**見送り理由**

1. **柔軟性の欠如**
   - 夜勤 = 2時間休憩は固定的すぎる
   - 施設・シフトによって休憩時間は異なる
   - 将来的な変更に対応できない

2. **説明可能性の問題**
   - 「なぜ2時間なのか？」の根拠が不明確
   - 実際と異なる場合、修正手段がない

3. **保守性の問題**
   - ルール変更時にコード修正が必要
   - 過去データとの整合性が取れなくなる

**補助的利用の可能性**
- デフォルト値の提案として：
  - 夜勤作成時に「休憩120分」を初期値として提案
  - ユーザーが上書き可能
  - `ShiftType.breakMinutes` からの取得が理想

---

## まとめ：issue / design doc 用要約

```markdown
## Issue: 業務日誌に休憩時間を追加し、サービス実績の過大計上を防ぐ

### 背景
- 現在、業務日誌（DailyLog）には休憩時間の概念がない
- 夜勤（15:30～09:30、実際は休憩2時間あり）のServiceRecordが1080分で記録される
- 正しくは 960分（16時間）だが、120分過大計上されている
- 勤怠管理（Shift/AttendanceRecord）には休憩があり、整合性がない

### 解決策
- `DailyLog.breakMinutes: Int @default(0)` を追加
- `ServiceRecord.breakMinutes: Int @default(0)` を追加
- `ServiceRecord.duration` を実働時間（休憩控除後）に変更
- `ServiceRecord.timeBand` は拘束時間（startTime ～ endTime）ベースで判定
- 既存データは `breakMinutes = 0` として扱う

### ⚠️ 重要なリスクと対策
**リスク:**
- `duration`の意味がリリース前後で異なる状態が永続化
  - リリース前: `duration` = 総時間
  - リリース後: `duration` = 実働時間

**対策:**
- 月次集計・レポートにリリース境界日を記録・表示
- 集計画面に注記「XX年XX月XX日以前のデータは休憩時間が含まれた値」を表示
- 監査資料の準備
- 必要に応じて過去データの手動修正スクリプトを提供

### 影響範囲
- Prisma スキーマ：2テーブル修正
- バックエンド：
  - `dailyLog.ts` の create/update/upsertEntry 修正（DailyLog 由来のみ）
  - `guideRecord.ts` は変更なし（GuideRecord 由来は `breakMinutes = 0` で維持）
  - 月次集計にリリース境界日チェック追加
- フロントエンド：業務日誌作成・詳細画面、サービス実績表示、集計画面の注記表示
- 月次集計・Excel出力：休憩時間の表示追加、旧データ注記

### 実装順序
1. Prisma マイグレーション
2. バックエンドAPI修正（リリース境界日対応含む）
3. フロントエンドUI修正（注記表示含む）
4. テスト（日勤・夜勤・バリデーション・旧データ混在）
5. 本番デプロイ（リリース日を記録）

### 既存データの扱い
- 既存DailyLog: `breakMinutes = 0`（休憩情報なし）として保持
- 既存ServiceRecord: 再計算しない（現状維持、意味混在を許容）
- ⚠️ `breakMinutes = 0` は「休憩なし」ではなく「休憩情報が未管理」を意味する
- 必要に応じて手動修正スクリプトを提供
- 監査時の説明資料を準備

### 代替案（より安全だが実装コスト増）
- `workedMinutes: Int?` を新設し、`duration` は既存のまま維持
- 段階的に `workedMinutes` へ移行
```

### Prisma diff（たたき台）

```diff
model DailyLog {
  id               String        @id @default(cuid())
  unitId           String
  logDate          DateTime      @db.Date
  shift            String
  shiftStart       DateTime
  shiftEnd         DateTime
  staffId          String
  staffRole        String?
  residentSummary  Json?
  majorEvent       Boolean       @default(false)
  handover         String?       @db.Text
+ breakMinutes     Int           @default(0) // 休憩時間（分）
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt

  unit             Unit          @relation(fields: [unitId], references: [id], onDelete: Cascade)
  staff            User          @relation(fields: [staffId], references: [id])
  entries          DailyLogEntry[]

  @@index([unitId, logDate])
  @@index([logDate, shift])
  @@map("daily_logs")
}

model ServiceRecord {
  id                  String    @id @default(cuid())
  recipientId         String
  userId              String
  serviceType         String
  serviceDate         DateTime  @db.Date
  startTime           DateTime
  endTime             DateTime
- duration            Int       // 総時間（休憩含む）
+ duration            Int       // 実働時間（休憩控除後）
  serviceDetail       String    @db.Text
  userCondition       String?   @db.Text
  incidents           String?   @db.Text
+ breakMinutes        Int       @default(0) // 休憩時間（分）
  timeBand            String?
  appliedRuleVersion  String?
  dailyLogEntryId     String?   @unique
  guideRecordId       String?   @unique
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  recipient           CareRecipient  @relation(fields: [recipientId], references: [id], onDelete: Cascade)
  user                User           @relation(fields: [userId], references: [id])
  dailyLogEntry       DailyLogEntry? @relation(fields: [dailyLogEntryId], references: [id])
  guideRecord         GuideRecord?   @relation(fields: [guideRecordId], references: [id])

  @@index([recipientId, serviceDate])
  @@index([userId, serviceDate])
  @@index([serviceDate])
  @@index([serviceType])
  @@index([timeBand])
  @@map("service_records")
}
```

---

## 次のステップ

### 実装着手の前提

- **Phase 1 の対象**: `DailyLog.breakMinutes` 追加と、DailyLog 由来 ServiceRecord 生成時の休憩控除までとする
- **再計算スクリプトの扱い**: 設計・試験実装の対象に含めるが、禁止条件チェックと運用管理機能が揃うまで本番利用しない

### ステップ

1. **本設計書のレビュー**
   - ステークホルダー承認
   - 残課題の確認
   - リスク・制約事項の合意

2. **Phase 1 実装着手（レビュー承認後）**
   - ステップ2（Prismaスキーマ修正）から開始
   - バックエンドAPI修正（DailyLog 由来のみ）
   - フロントエンドUI修正
   - 各ステップでレビュー・承認

3. **本番展開**
   - ステージング環境でテスト
   - 本番マイグレーション実行
   - 監視・検証
   - リリース境界日の記録

4. **Phase 2 以降（将来検討）**
   - 再計算スクリプトの本番投入（禁止条件実装後）
   - GuideRecord への休憩機能追加（必要に応じて）
   - 複数回休憩対応
   - 時間帯別休憩記録

---

## 本番利用前に必須の未実装項目

以下の項目は本設計書で方針を示していますが、実装が完了していません。本番環境で運用する前に必ず対応してください。

### 1. 再計算スクリプトの禁止条件チェック

**現状**: TODOコメントのみで実装されていない
**必要な実装**:
- 月次締めフラグの判定ロジック
- 請求提出フラグの判定ロジック
- 監査確定フラグの判定ロジック
- 各フラグが実データ項目として存在しない場合は、スキーマ設計から実施

### 2. ロールバックSQLの実運用フロー接続

**現状**: `generateRollbackSQL` 関数は実装済みだが、自動保存が未接続だった（修正済み）
**確認事項**:
- ロールバックSQLファイルの保管場所・保管期間の決定
- ロールバック実行手順の文書化
- ロールバック実行権限の管理

### 3. 旧新データ判定ロジックの精緻化

**現状**: `serviceDate` ベースでの判定を推奨しているが、専用バージョン管理項目はない
**推奨される対応**:
- 専用の意味バージョン管理項目の追加を検討
  - 例: `ServiceRecord.durationSemanticsVersion: String?`
  - 値例: `"legacy"` / `"v1"` / `"v2"`
- または、リリース境界日を環境変数・設定テーブルで管理

### 4. GuideRecord由来のduration意味統一の確認

**現状**: 設計上は意味統一できると整理したが、実運用での確認が未実施
**必要な確認**:
- GuideRecord の記録時間帯に休憩が含まれないことをユーザー操作・UI設計で保証
- 実際のGuideRecordデータで `duration` = 総時間 = 実働時間 が成立するか検証
- 成立しない場合は GuideRecord にも `breakMinutes` 追加を検討

### 5. 再計算スクリプトの運用管理機能

**現状**: スクリプトは存在するが、運用管理機能が未実装
**必要な実装**:
- 実行履歴テーブルの設計・実装（二重実行防止）
- 実行者・承認者記録の実装
- 実行ログの長期保管（監査対応）

---

**作成日**: 2026-03-14
**最終更新日**: 2026-03-14
**バージョン**: 1.1
**ステータス**: レビュー待ち
