# 勤怠管理システム実装計画

## 目次
1. [概要](#概要)
2. [データベース設計](#データベース設計)
3. [API設計（tRPCルーター）](#api設計trpcルーター)
4. [UI設計](#ui設計)
5. [実装フェーズ](#実装フェーズ)
6. [工数見積もり](#工数見積もり)

---

## 概要

### 目的
福祉事業所向けの勤怠管理システムを構築し、以下を実現する：
- シフト作成・共有の効率化
- 出退勤記録の整備と勤怠集計の自動化（休憩打刻はMVP2以降で拡張）
- 打刻修正・シフト変更の承認フロー統一
- ガイド記録との整合性確保

### スコープ（MVP1）
1. シフト表作成・閲覧（Unitフィルタ、公開）
2. 出勤/退勤打刻（スマホ対応、休憩打刻は対象外）
3. 勤務時間集計（実働/残業/深夜/休日の基本）
4. 打刻修正申請＋承認
5. 月次締め＋CSV出力
6. ガイド記録は参照表示＋差異アラート（連携A）

---

## データベース設計

### 新規モデル

#### 1. ShiftType（勤務区分マスタ）
勤務パターンのテンプレート（早番/日勤/遅番/夜勤等）

```prisma
model ShiftType {
  id          String   @id @default(cuid())
  name        String   // 早番/日勤/遅番/夜勤
  code        String   @unique // EARLY/DAY/LATE/NIGHT
  description String?

  // 基本時間設定
  startTime   String   // 開始時刻（例："07:00"）
  endTime     String   // 終了時刻（例："16:00"）
  breakMinutes Int     @default(0) // 休憩時間（分）

  // 日跨ぎ設定
  crossesDay  Boolean  @default(false) // 日跨ぎ勤務か（夜勤等）

  // 計算設定
  standardWorkMinutes Int // 標準労働時間（分）

  // 色設定（UI表示用）
  color       String?  // カレンダー表示時の背景色

  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // リレーション
  shifts      Shift[]

  @@index([code])
  @@index([isActive])
  @@map("shift_types")
}
```

#### 2. Shift（シフト予定）
スタッフの勤務予定

**設計方針:**
- 同一スタッフ・同一日に複数シフトを許可（日勤+夜勤など）
- `date`は勤務開始日基準（夜勤の場合も出勤日を基準日とする）
- `@@unique([staffId, date])`は設けない

```prisma
enum ShiftStatus {
  DRAFT      // 下書き
  PUBLISHED  // 公開済み
  CONFIRMED  // 確定
  LOCKED     // ロック（締め後）
}

model Shift {
  id            String      @id @default(cuid())
  staffId       String      // スタッフID
  unitId        String      // ユニットID
  shiftTypeId   String      // 勤務区分ID

  // 日時（基準日は勤務開始日）
  date          DateTime    @db.Date // 勤務日（基準日 = 勤務開始日）
  startAt       DateTime    // 開始日時
  endAt         DateTime    // 終了日時（日跨ぎ対応）
  breakMinutes  Int         @default(0) // 休憩時間（分）

  // ステータス
  status        ShiftStatus @default(DRAFT)
  publishedAt   DateTime?   // 公開日時
  publishedBy   String?     // 公開者ID

  // 備考
  notes         String?     @db.Text

  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  createdBy     String      // 作成者ID

  // リレーション
  staff         User        @relation(fields: [staffId], references: [id], onDelete: Cascade)
  unit          Unit        @relation(fields: [unitId], references: [id], onDelete: Cascade)
  shiftType     ShiftType   @relation(fields: [shiftTypeId], references: [id])

  @@index([staffId, date])
  @@index([unitId, date])
  @@index([date, status])
  // 注: @@unique([staffId, date]) は設けない（1日複数シフト対応）
  @@map("shifts")
}
```

#### 3. TimeClockEvent（打刻イベント）
実際の打刻記録

**設計方針:**
- 生イベントとして扱い、AttendanceRecordとのリレーションは持たない
- 疎結合設計：集約ロジックで動的に紐付け
- MVP1では`CLOCK_IN`/`CLOCK_OUT`のみ実装（休憩打刻は将来拡張）

```prisma
enum ClockEventType {
  CLOCK_IN       // 出勤（MVP1実装対象）
  CLOCK_OUT      // 退勤（MVP1実装対象）
  BREAK_START    // 休憩開始（MVP2以降）
  BREAK_END      // 休憩終了（MVP2以降）
  VISIT_START    // 訪問開始（将来）
  VISIT_END      // 訪問終了（将来）
}

model TimeClockEvent {
  id            String          @id @default(cuid())
  staffId       String          // スタッフID
  type          ClockEventType  // イベントタイプ
  occurredAt    DateTime        // 発生日時

  // 位置情報（任意）
  latitude      Float?          // 緯度
  longitude     Float?          // 経度
  accuracy      Float?          // 精度（メートル）

  // デバイス情報
  device        String?         // デバイス種別（mobile/tablet/pc）
  ipAddress     String?         // IPアドレス
  userAgent     String?         // ユーザーエージェント

  // 備考
  notes         String?         @db.Text

  // 修正履歴
  isModified    Boolean         @default(false) // 修正済みか
  modifiedBy    String?         // 修正者ID
  modifiedAt    DateTime?       // 修正日時
  modifiedReason String?        @db.Text // 修正理由
  originalOccurredAt DateTime?  // 修正前の日時

  createdAt     DateTime        @default(now())

  // リレーション
  staff         User            @relation(fields: [staffId], references: [id], onDelete: Cascade)
  // 注: attendanceRecordId を削除（疎結合化）

  @@index([staffId, occurredAt])
  @@index([type])
  @@map("time_clock_events")
}
```

#### 4. AttendanceRecord（勤怠実績）
日次集約された勤怠実績

**設計方針:**
- MVP1では1日1レコード運用（`@@unique([staffId, date])`）
- `date`は勤務開始日基準（夜勤も開始日で管理）
- 同日に複数シフトがある場合も日単位で集約
- `clockInAt`/`clockOutAt`は代表値（最初の出勤/最後の退勤）
- TimeClockEventとはリレーションなし（集約ロジックで動的に紐付け）

```prisma
enum AttendanceStatus {
  OPEN      // 未確定
  SUBMITTED // 提出済み
  APPROVED  // 承認済み
  LOCKED    // ロック（締め後）
}

model AttendanceRecord {
  id            String            @id @default(cuid())
  staffId       String            // スタッフID
  date          DateTime          @db.Date // 勤務日（基準日 = 勤務開始日）

  // 時刻（代表値）
  clockInAt     DateTime?         // 最初の出勤時刻
  clockOutAt    DateTime?         // 最後の退勤時刻

  // 時間集計（分単位）- 日次合算値
  workMinutes      Int  @default(0) // 実働時間
  breakMinutes     Int  @default(0) // 休憩時間
  overtimeMinutes  Int  @default(0) // 残業時間（8時間超）
  midnightMinutes  Int  @default(0) // 深夜時間（22:00-5:00）
  holidayMinutes   Int  @default(0) // 休日勤務時間

  // ステータス
  status        AttendanceStatus  @default(OPEN)
  submittedAt   DateTime?         // 提出日時
  approvedAt    DateTime?         // 承認日時
  approvedBy    String?           // 承認者ID

  // 備考
  notes         String?           @db.Text

  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt

  // リレーション
  staff         User              @relation(fields: [staffId], references: [id], onDelete: Cascade)
  // 注: shiftId を削除（日単位集約のため複数シフトから生成される）
  // 注: clockEvents リレーションを削除（疎結合化）

  @@unique([staffId, date])  // 1日1レコード制約
  @@index([staffId, date])
  @@index([date, status])
  @@map("attendance_records")
}
```

#### 5. ApprovalRequest（申請）
打刻修正・シフト変更の申請

```prisma
enum ApprovalRequestType {
  TIME_EDIT     // 打刻修正
  SHIFT_CHANGE  // シフト変更
}

enum ApprovalRequestStatus {
  PENDING    // 承認待ち
  APPROVED   // 承認済み
  REJECTED   // 却下
  CANCELLED  // 取り下げ
}

model ApprovalRequest {
  id            String                  @id @default(cuid())
  type          ApprovalRequestType     // 申請種別
  requesterId   String                  // 申請者ID

  // 申請内容（JSON）
  // TIME_EDIT: {clockEventId, before, after, reason}
  // SHIFT_CHANGE: {shiftId, changes, reason}
  payload       Json                    @db.JsonB

  // 承認フロー
  status        ApprovalRequestStatus   @default(PENDING)
  approverChain Json?                   @db.JsonB // 承認者リスト（順序付き）
  currentStep   Int                     @default(0) // 現在のステップ

  // 承認情報
  approvedBy    String?                 // 承認者ID
  approvedAt    DateTime?               // 承認日時
  rejectedBy    String?                 // 却下者ID
  rejectedAt    DateTime?               // 却下日時
  rejectReason  String?                 @db.Text // 却下理由

  createdAt     DateTime                @default(now())
  updatedAt     DateTime                @updatedAt

  // リレーション
  requester     User                    @relation(fields: [requesterId], references: [id], onDelete: Cascade)

  @@index([requesterId])
  @@index([status])
  @@index([type])
  @@map("approval_requests")
}
```

#### 6. MonthlyClosing（月次締め）
月次勤怠の締め処理

```prisma
model MonthlyClosing {
  id            String   @id @default(cuid())
  yearMonth     String   // YYYY-MM形式
  unitId        String?  // ユニットID（null=全体）

  closedAt      DateTime // 締め日時
  closedBy      String   // 締め処理者ID

  // 集計情報（JSON）
  summary       Json     @db.JsonB // {totalStaff, totalWorkMinutes, totalOvertime, etc.}

  // 差戻し
  reopenedAt    DateTime?
  reopenedBy    String?
  reopenReason  String?  @db.Text

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // リレーション
  closer        User     @relation("ClosedBy", fields: [closedBy], references: [id])
  reopener      User?    @relation("ReopenedBy", fields: [reopenedBy], references: [id])
  unit          Unit?    @relation(fields: [unitId], references: [id], onDelete: Cascade)

  @@unique([yearMonth, unitId])
  @@index([yearMonth])
  @@index([unitId])
  @@map("monthly_closings")
}
```

### 既存モデルへの追加

#### User モデル
```prisma
// リレーション追加
shifts                Shift[]
timeClockEvents       TimeClockEvent[]
attendanceRecords     AttendanceRecord[]
approvalRequests      ApprovalRequest[]
monthlyClosingsCreated MonthlyClosing[] @relation("ClosedBy")
monthlyClosingsReopened MonthlyClosing[] @relation("ReopenedBy")
```

#### Unit モデル
```prisma
// リレーション追加
shifts                Shift[]
monthlyClosings       MonthlyClosing[]
```

---

## API設計（tRPCルーター）

### 1. shiftTypeRouter（勤務区分マスタ）

```typescript
// src/server/routers/shiftType.ts

export const shiftTypeRouter = router({
  // 全勤務区分取得（アクティブのみ）
  list: protectedProcedure
    .query(async ({ ctx }) => {
      return await ctx.prisma.shiftType.findMany({
        where: { isActive: true },
        orderBy: { code: 'asc' }
      });
    }),

  // 勤務区分作成（MANAGER権限）
  create: managerProcedure
    .input(shiftTypeSchema)
    .mutation(async ({ ctx, input }) => { /* ... */ }),

  // 勤務区分更新（MANAGER権限）
  update: managerProcedure
    .input(z.object({ id: z.string(), data: shiftTypeSchema }))
    .mutation(async ({ ctx, input }) => { /* ... */ }),

  // 勤務区分無効化（MANAGER権限）
  deactivate: managerProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => { /* ... */ }),
});
```

### 2. shiftRouter（シフト管理）

```typescript
// src/server/routers/shift.ts

export const shiftRouter = router({
  // シフト一覧取得（月次・週次・日次）
  list: protectedProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
      unitId: z.string().optional(),
      staffId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => { /* ... */ }),

  // 自分のシフト取得（STAFF権限）
  getMyShifts: protectedProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
    }))
    .query(async ({ ctx, input }) => { /* ... */ }),

  // シフト作成（LEAD/MANAGER権限）
  create: leadProcedure
    .input(shiftSchema)
    .mutation(async ({ ctx, input }) => { /* ... */ }),

  // 一括シフト作成（LEAD/MANAGER権限）
  bulkCreate: leadProcedure
    .input(z.object({ shifts: z.array(shiftSchema) }))
    .mutation(async ({ ctx, input }) => { /* ... */ }),

  // シフト更新（LEAD/MANAGER権限）
  update: leadProcedure
    .input(z.object({ id: z.string(), data: shiftSchema }))
    .mutation(async ({ ctx, input }) => { /* ... */ }),

  // シフト削除（LEAD/MANAGER権限）
  delete: leadProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => { /* ... */ }),

  // シフト公開（LEAD/MANAGER権限）
  publish: leadProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
      unitId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => { /* ... */ }),

  // 配置チェック（警告取得）
  validateStaffing: leadProcedure
    .input(z.object({
      date: z.string(),
      unitId: z.string(),
    }))
    .query(async ({ ctx, input }) => { /* ... */ }),
});
```

### 3. timeClockRouter（打刻）

```typescript
// src/server/routers/timeClock.ts

export const timeClockRouter = router({
  // 今日の打刻状態取得（STAFF権限）
  getTodayStatus: protectedProcedure
    .query(async ({ ctx }) => { /* ... */ }),

  // 出勤打刻（STAFF権限）
  clockIn: protectedProcedure
    .input(clockEventSchema)
    .mutation(async ({ ctx, input }) => { /* ... */ }),

  // 退勤打刻（STAFF権限）
  clockOut: protectedProcedure
    .input(clockEventSchema)
    .mutation(async ({ ctx, input }) => { /* ... */ }),

  // 打刻履歴取得（STAFF権限：自分のみ）
  getMyEvents: protectedProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
    }))
    .query(async ({ ctx, input }) => { /* ... */ }),

  // 全打刻履歴取得（LEAD/MANAGER権限）
  listEvents: leadProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
      staffId: z.string().optional(),
      unitId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => { /* ... */ }),
});
```

### 4. attendanceRouter（勤怠実績）

```typescript
// src/server/routers/attendance.ts

export const attendanceRouter = router({
  // 勤怠実績取得（STAFF権限：自分のみ）
  getMyRecords: protectedProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
    }))
    .query(async ({ ctx, input }) => { /* ... */ }),

  // 勤怠実績一覧（LEAD/MANAGER権限）
  list: leadProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
      staffId: z.string().optional(),
      unitId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => { /* ... */ }),

  // 勤怠実績自動計算（打刻から実績生成）
  calculate: protectedProcedure
    .input(z.object({
      staffId: z.string(),
      date: z.string(),
    }))
    .mutation(async ({ ctx, input }) => { /* ... */ }),

  // 月次集計取得（LEAD/MANAGER権限）
  getMonthlySummary: leadProcedure
    .input(z.object({
      yearMonth: z.string(), // YYYY-MM
      staffId: z.string().optional(),
      unitId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => { /* ... */ }),

  // CSV出力（MANAGER権限）
  exportCSV: managerProcedure
    .input(z.object({
      yearMonth: z.string(),
      unitId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => { /* ... */ }),
});
```

### 5. approvalRouter（申請・承認）

```typescript
// src/server/routers/approval.ts

export const approvalRouter = router({
  // 打刻修正申請（STAFF権限）
  requestTimeEdit: protectedProcedure
    .input(timeEditRequestSchema)
    .mutation(async ({ ctx, input }) => { /* ... */ }),

  // シフト変更申請（STAFF権限）
  requestShiftChange: protectedProcedure
    .input(shiftChangeRequestSchema)
    .mutation(async ({ ctx, input }) => { /* ... */ }),

  // 申請一覧取得（承認者用・LEAD/MANAGER権限）
  getPendingRequests: leadProcedure
    .input(z.object({
      type: z.enum(['TIME_EDIT', 'SHIFT_CHANGE']).optional(),
      unitId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => { /* ... */ }),

  // 自分の申請履歴取得（STAFF権限）
  getMyRequests: protectedProcedure
    .input(z.object({
      status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
    }))
    .query(async ({ ctx, input }) => { /* ... */ }),

  // 承認（LEAD/MANAGER権限）
  approve: leadProcedure
    .input(z.object({
      requestId: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => { /* ... */ }),

  // 却下（LEAD/MANAGER権限）
  reject: leadProcedure
    .input(z.object({
      requestId: z.string(),
      reason: z.string(),
    }))
    .mutation(async ({ ctx, input }) => { /* ... */ }),
});
```

### 6. monthlyClosingRouter（月次締め）

```typescript
// src/server/routers/monthlyClosing.ts

export const monthlyClosingRouter = router({
  // 締め処理（MANAGER権限）
  close: managerProcedure
    .input(z.object({
      yearMonth: z.string(),
      unitId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => { /* ... */ }),

  // 差戻し（MANAGER権限）
  reopen: managerProcedure
    .input(z.object({
      closingId: z.string(),
      reason: z.string(),
    }))
    .mutation(async ({ ctx, input }) => { /* ... */ }),

  // 締め状態確認
  getStatus: leadProcedure
    .input(z.object({
      yearMonth: z.string(),
      unitId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => { /* ... */ }),

  // 締め履歴取得
  list: managerProcedure
    .input(z.object({
      limit: z.number().default(10),
    }))
    .query(async ({ ctx, input }) => { /* ... */ }),
});
```

---

## UI設計

### ページ構成

```
/attendance
  /shifts                      # シフト表（月次/週次）
    /calendar                  # カレンダービュー
    /[id]                      # シフト詳細・編集（LEAD/MANAGER）
    /new                       # シフト作成（LEAD/MANAGER）

  /clock                       # 打刻（スマホ最適化）
    /today                     # 今日の打刻（STAFF）
    /history                   # 打刻履歴（STAFF）

  /records                     # 勤怠実績
    /my                        # 自分の勤怠（STAFF）
    /list                      # 勤怠一覧（LEAD/MANAGER）
    /monthly                   # 月次集計（LEAD/MANAGER）

  /approvals                   # 申請・承認
    /requests                  # 申請一覧（LEAD/MANAGER）
    /my-requests               # 自分の申請（STAFF）
    /new                       # 新規申請（STAFF）

  /settings                    # 設定（MANAGER）
    /shift-types               # 勤務区分マスタ
    /closing                   # 月次締め
```

### 主要コンポーネント

#### 1. シフトカレンダー（/attendance/shifts/calendar）

**機能**
- 月次/週次表示切替
- Unitフィルタ
- スタッフ別/日別の切替
- 配置不足/資格不足の警告バッジ
- ドラッグ&ドロップでシフト編集（LEAD/MANAGER）

**コンポーネント構成**
```
ShiftCalendarPage
├── ShiftCalendarHeader（期間切替・フィルタ）
├── ShiftCalendarGrid（カレンダー本体）
│   ├── ShiftCell（セル単位）
│   └── StaffingWarningBadge（警告表示）
├── ShiftEditor（編集モーダル）
└── PublishButton（公開ボタン・LEAD/MANAGER）
```

#### 2. 打刻画面（/attendance/clock/today）

**機能（スマホ最適化）**
- 今日の状態（未出勤/勤務中/退勤済み）を大きく表示
- 出勤/退勤ボタン（MVP1）
- GPS位置取得（設定に応じて）
- 打刻履歴表示

**コンポーネント構成**
```
ClockTodayPage
├── ClockStatusCard（現在の状態）
├── ClockButton（出勤/退勤）
├── LocationIndicator（GPS状態）
└── TodayClockHistory（今日の打刻履歴）
```

#### 3. 勤怠実績一覧（/attendance/records/list）

**機能（LEAD/MANAGER）**
- 日次打刻一覧
- 未打刻/異常アラート表示
- フィルタ（Unit/スタッフ/日付範囲）
- 実績承認

**コンポーネント構成**
```
AttendanceRecordsPage
├── AttendanceFilter（フィルタ）
├── AttendanceTable（実績一覧）
│   ├── AttendanceRow（行単位）
│   └── AnomalyBadge（異常表示）
└── ApprovalButton（承認ボタン）
```

#### 4. 月次集計（/attendance/records/monthly）

**機能（LEAD/MANAGER）**
- スタッフ別集計表
- 実働/残業/深夜/休日時間
- 締め処理
- CSV出力

**コンポーネント構成**
```
MonthlySummaryPage
├── MonthSelector（月選択）
├── SummaryTable（集計表）
│   └── StaffSummaryRow（スタッフ行）
├── ClosingButton（締めボタン・MANAGER）
└── ExportCSVButton（CSV出力）
```

#### 5. 申請一覧（/attendance/approvals/requests）

**機能（LEAD/MANAGER）**
- 承認待ち申請一覧
- 打刻修正/シフト変更の区別
- 差分表示
- 承認/却下

**コンポーネント構成**
```
ApprovalRequestsPage
├── RequestFilter（フィルタ）
├── RequestList（申請一覧）
│   ├── RequestCard（申請カード）
│   └── DiffViewer（差分表示）
└── ApprovalActions（承認/却下ボタン）
```

#### 6. ガイド記録連携表示（/attendance/records/list内）

**機能（MVP1: 参照表示＋差異アラート）**
- 勤怠実績とガイド記録の比較表示
- 差異検知アラート
  - 実績合計 > 勤怠実働
  - 実績が勤務時間外に存在
  - 実績の開始/終了が未入力

**コンポーネント構成**
```
GuideRecordComparisonSection
├── ComparisonTable（比較表）
│   ├── AttendanceColumn（勤怠実績）
│   ├── GuideRecordColumn（ガイド記録）
│   └── DifferenceIndicator（差異表示）
└── AlertList（差異アラート一覧）
```

---

## 実装前に追記すべき要件

### 1. 勤怠実績の管理単位
- `AttendanceRecord` は **MVP1では1日1レコード運用** を前提とする。
- 同日に複数勤務（午前勤務・夕方勤務など）がある場合も、MVP1では日単位で集約して管理する。
- 将来的に1日複数勤務レコードが必要になった場合は、MVP2以降で拡張を検討する。
- 夜勤を含む日跨ぎ勤務は **勤務開始日を基準日** として扱う。

### 2. 休憩時間の扱い
- MVP1では休憩打刻（`BREAK_START` / `BREAK_END`）は必須機能としない。
- 休憩時間はまず **シフトに設定された `breakMinutes`** を基準値として扱う。
- 必要に応じて勤怠実績側で補正できるようにするが、詳細な休憩打刻運用はMVP2で拡張する。
- したがって、MVP1の主要打刻機能は **出勤 / 退勤** を優先して実装する。

### 3. 権限範囲（Unit境界）
- **STAFF**: 自分自身のシフト・打刻・勤怠実績・申請のみ閲覧/操作可能。
- **LEAD**: 原則として **担当Unit内のスタッフ** に関するシフト管理、勤怠確認、申請承認のみ可能。
- **MANAGER**: 全Unitを対象に閲覧・操作可能。
- LEADが他Unitのデータを閲覧・承認できないよう、API・UIの両方で制限する。

### 4. 締め後の編集制御
- 月次締め後は、対象期間の `AttendanceRecord` と関連する承認対象データを **LOCKED** として扱う。
- 締め後は **STAFF / LEAD による直接編集・申請を不可** とする。
- 修正が必要な場合は、**MANAGERが差戻し（reopen）を行った後に再編集** する運用とする。
- 締め解除の履歴（日時・実施者・理由）は必ず保持する。

### 5. CSV出力仕様
- MVP1のCSVは **月次集計ベース** を基本とする。
- 1行の単位は **スタッフ × 対象月** を基本とする。
- 出力項目は最低限、以下を含む:
  - スタッフ名
  - 所属Unit
  - 対象年月
  - 出勤日数
  - 実働時間
  - 休憩時間
  - 残業時間
  - 深夜時間
  - 休日勤務時間
- 文字コードや列順は、給与連携要件が確定していない限り UTF-8 を基本とし、必要に応じて将来拡張する。

### 6. ガイド記録との差異判定ルール
- MVP1では **差異の可視化と警告表示** を目的とし、自動補正は行わない。
- 最低限、以下を差異として検知する:
  - ガイド記録の合計時間が勤怠実績の実働時間を超える
  - ガイド記録が勤務時間外に存在する
  - ガイド記録の開始時刻または終了時刻が未入力
- 夜勤など日跨ぎ勤務の差異判定は、**勤務開始日基準** で比較する。
- 警告閾値（何分以上の差で警告にするか）は、MVP1では厳密閾値を設けず、該当データをそのまま警告対象として表示する。

### 7. 実装前の合意事項
以下は着手前に関係者で明示的に合意しておくこと:
- MVP1は **日単位集計を優先** し、複雑な勤務パターンへの完全対応は行わない。
- MVP1は **出退勤打刻を最優先** とし、休憩打刻や訪問打刻は将来拡張扱いとする。
- 承認・閲覧権限は **Unit境界を厳守** する。
- 締め後の修正は通常運用では認めず、**差戻し前提** とする。
- 差異検知は警告表示までを行い、運用判断はLEAD/MANAGERが行う。

---

## 勤怠管理の詳細運用ルール

### 8. シフト未作成時の基準日決定ルール

勤怠実績（AttendanceRecord）の基準日は、原則として勤務開始日を採用する。シフトが未作成である場合は、**最初の出勤打刻（`CLOCK_IN`）が記録された日付を基準日**として扱う。

#### 実装ルール
- 日勤・夜勤を問わず、出勤打刻が存在する場合は当該打刻日時の暦日を `AttendanceRecord.date` に設定する
- 夜勤のように退勤が翌日にまたがる場合であっても、基準日は出勤打刻日とする
- 出勤打刻が存在せず退勤打刻のみが存在する場合は、勤怠実績を正常な勤務実績として確定せず、**警告対象**として取り扱う
- 後続の打刻修正申請または管理者確認により補正することを前提とする

#### 後からシフトを登録した場合の挙動
- 打刻ベースで決定された`date`とシフトの`date`が一致するかを検証
- 不一致の場合は警告を表示し、LEAD/MANAGERがシフトまたは打刻を修正

---

### 9. 休憩時間（breakMinutes）の取扱い

MVP1では休憩打刻（`BREAK_START` / `BREAK_END`）を実装対象外とするため、休憩時間は以下の優先順位に従って決定する。

#### 優先順位
1. **既存の勤怠実績に対して管理者等が手動補正した休憩時間**（最優先）
2. **シフトに設定された `breakMinutes` の合計値**
3. **上記いずれにも該当しない場合は 0 分**

#### 計算式
```typescript
workMinutes = (clockOutAt - clockInAt) - breakMinutes
```

#### 複数シフトの場合
複数シフトが同日に存在する場合、MVP1では日単位集約を前提とし、各シフトに設定された `breakMinutes` を合算して日次実績に反映する。

#### 注意事項
- シフト間の空白時間は休憩時間として自動計上しない
- 実際の休憩時間とシステム上の設定値に差異が生じる場合は、LEAD または MANAGER が手動で補正する運用とする

---

### 10. 打刻マッチング失敗時の取扱い

シフトに対応する打刻イベントが不足している場合、該当日の勤怠実績は削除せず、**部分的な実績として保持**したうえで警告表示を行う。

#### マッチング失敗パターンと対処

##### パターン1: 出勤打刻のみ（退勤打刻漏れ）
```typescript
{
  clockInAt: "2026-03-09T09:05:00",
  clockOutAt: null,  // null のまま記録
  workMinutes: 0,    // 計算不可のため0
  _warnings: ["退勤打刻が見つかりません"]
}
```

##### パターン2: 退勤打刻のみ（出勤打刻漏れ）
```typescript
{
  clockInAt: null,   // null のまま記録
  clockOutAt: "2026-03-09T18:10:00",
  workMinutes: 0,
  _warnings: ["出勤打刻が見つかりません"]
}
```

##### パターン3: 両方の打刻漏れ
```typescript
{
  clockInAt: null,
  clockOutAt: null,
  workMinutes: 0,
  _warnings: ["出勤・退勤打刻が見つかりません"]
}
```

#### マッチングアルゴリズム
- 打刻イベントの自動マッチングは、**シフト開始時刻および終了時刻の前後一定範囲（MVP1では原則±2時間以内）**で機械的に判定
- 複数の候補がある場合は、最もシフト時刻に近い打刻を自動選択
- 完全一致は要求しない

#### 警告レベル分類
- **ERROR**: 出勤打刻または退勤打刻の欠損、実働時間 0 分等（対応必須）
- **WARNING**: 大幅な遅刻・早退、長時間労働等（確認推奨）
- **INFO**: 軽微な時刻ずれ等（参考情報）

#### 後続対応
- 打刻修正申請が承認された場合、該当日の勤怠実績は自動再計算対象とする
- 未補正のまま残存する異常値については、勤怠一覧または要対応一覧で継続して確認できる状態を維持する

---

### 11. 日次集約の詳細方針

`AttendanceRecord` は MVP1において **1日1レコード運用**を前提とする。同一スタッフに対して同一基準日内に複数のシフトが存在する場合でも、勤怠実績は日単位で 1件に集約する。

#### 集約時の代表値
- **`clockInAt`**: 当該基準日に属する最初の出勤打刻
- **`clockOutAt`**: 当該基準日に対応する最後の退勤打刻（日跨ぎ含む）
- **`workMinutes`**: 当該日の対象勤務を合算して算出
- **`breakMinutes`**: 当該日の全シフトの休憩時間を合算
- **`midnightMinutes`**: 当該日の全勤務の深夜時間を合算

#### 夜勤の扱い
夜勤を含む日跨ぎ勤務については、`Shift.date` および `AttendanceRecord.date` のいずれも**勤務開始日を基準として統一**する。

#### 具体例：日勤+夜勤
```typescript
// シフト1: 日勤 (09:00-17:00)
// シフト2: 夜勤 (15:30-翌09:30) ※実運用の基本時間帯

// 集約結果（1日1レコード）
{
  date: "2026-03-09",                    // 勤務開始日
  clockInAt: "2026-03-09T09:05:00",     // 最初の出勤
  clockOutAt: "2026-03-10T09:35:00",    // 最後の退勤
  workMinutes: 1020,                     // 合算（休憩除く）
  breakMinutes: 120,                     // 60 + 60
  midnightMinutes: 420                   // 夜勤の深夜帯（22:00-05:00）
}
```

**注**: 実運用では夜勤の基本時間帯は「15:30入り / 翌9:30明け」となっています。MVP1の打刻判定ロジックでは、この運用を考慮して前日15:30以降の打刻も参照します。

---

### 12. 警告表示と後続対応フロー

打刻漏れ、時刻不整合、長時間労働等の異常値については、**勤怠実績を破棄せず警告として可視化**する。MVP1では自動補正は行わず、警告の確認・是正は LEAD または MANAGER による運用対応を前提とする。

#### UI上での対応フロー
1. **要対応一覧画面**: ERROR/WARNING/INFOレベル別に表示
2. **詳細画面**: 具体的な警告内容と対応アクション（打刻修正申請、確認済みマーク等）
3. **自動再計算**: 打刻修正申請承認後に自動実行

---

### 13. MVP1における制約事項の再確認

MVP1では、運用の簡素化と早期導入を優先し、以下の制約を設ける。

- 休憩打刻は実装しない
- 勤怠実績は日単位集約を前提とし、1日複数実績への分割管理は行わない
- シフト間の空白時間を自動的に休憩時間として扱わない
- 打刻マッチングは機械的な近似判定（±2時間）を採用し、最終的な整合確認は運用で補完する
- 残業計算は1日8時間超の単純計算とし、変形労働制や複雑な残業計算ロジックは MVP2以降で検討する
- シフト未作成時は最初の出勤打刻日を基準日とする。退勤打刻のみの場合も部分実績として保持し、警告対象として運用対応する

---

## 実装フェーズ

### Phase 0: 準備（0.5日）
- [ ] Prismaスキーマ追加
- [ ] マイグレーション実行
- [ ] 初期データ投入（ShiftType基本パターン）

### Phase 1: シフト管理（2日）
- [ ] ShiftType CRUD（マスタ管理・MANAGER）
- [ ] Shift CRUD（シフト作成・編集・LEAD/MANAGER）
- [ ] シフトカレンダーUI（月次表示）
- [ ] シフト公開機能

### Phase 2: 打刻機能（2日）
- [ ] TimeClockEvent API（出勤/退勤）
- [ ] 打刻画面UI（スマホ最適化）
- [ ] 今日の状態表示（未出勤/勤務中/退勤済み）
- [ ] GPS位置取得（任意）

### Phase 3: 勤怠実績・計算（2日）
- [ ] AttendanceRecord自動計算ロジック
  - 日次集約ロジック（1日1AttendanceRecord）
  - 実働時間計算
  - 残業時間計算（8時間超）
  - 深夜時間計算（22:00-5:00）
  - 休日勤務判定
  - 部分実績保持（打刻欠損時も削除せず警告化）
  - 打刻修正申請承認後の再計算
- [ ] 勤怠実績一覧UI（LEAD/MANAGER）
- [ ] 自分の勤怠表示（STAFF）

### Phase 4: 申請・承認フロー（2日）
- [ ] ApprovalRequest API（申請/承認/却下）
- [ ] 打刻修正申請UI
- [ ] シフト変更申請UI
- [ ] 申請一覧・承認UI（LEAD/MANAGER）
- [ ] 監査ログ記録（AuditLog連携）

### Phase 5: 月次締め・出力（1.5日）
- [ ] MonthlyClosing API（締め/差戻し）
- [ ] 月次集計ロジック
- [ ] 月次集計UI
- [ ] CSV出力機能

### Phase 6: ガイド記録連携（1日）
- [ ] ガイド記録参照表示
- [ ] 差異検知ロジック
  - 実績合計 > 勤怠実働チェック
  - 時間外実績チェック
  - 未入力実績チェック
- [ ] 差異アラート表示UI

### Phase 7: テスト・調整（1日）
- [ ] E2Eテスト（主要フロー）
- [ ] 権限チェック検証
- [ ] パフォーマンス確認
- [ ] UI/UX調整

---

## 工数見積もり

| フェーズ | 内容 | 工数 |
|---------|------|------|
| Phase 0 | 準備（スキーマ・マイグレーション） | 0.5日 |
| Phase 1 | シフト管理 | 2日 |
| Phase 2 | 打刻機能 | 2日 |
| Phase 3 | 勤怠実績・計算 | 2日 |
| Phase 4 | 申請・承認フロー | 2日 |
| Phase 5 | 月次締め・出力 | 1.5日 |
| Phase 6 | ガイド記録連携 | 1日 |
| Phase 7 | テスト・調整 | 1日 |
| **合計** | **MVP1完成** | **12日** |

### 前提条件
- 1日 = 6-8時間の実装作業
- バックエンド（tRPC）とフロントエンド（React）を並行実装
- 既存のAuth/権限システム、Unit管理、GuideRecord連携を活用

---

## 技術スタック

### バックエンド
- **tRPC 11**: Type-safe API routing
- **Prisma 7**: ORM（PostgreSQL/Neon）
- **Zod**: スキーマバリデーション

### フロントエンド
- **Next.js 16 App Router**: ページルーティング
- **React 19**: UI構築
- **Tailwind CSS**: スタイリング
- **shadcn/ui**: UIコンポーネント
- **date-fns**: 日時計算

### 認証・権限
- **NextAuth.js**: 認証
- **UserRole（STAFF/LEAD/MANAGER）**: 権限制御

---

## セキュリティ・監査

### 権限制御
- **STAFF**: 自分の打刻・シフト閲覧・申請のみ
- **LEAD**: 担当Unitのシフト作成・申請承認
- **MANAGER**: 全体管理・締め処理・マスタ管理

### 監査ログ（AuditLog連携）
以下の操作を記録：
- 打刻（CLOCK_IN/CLOCK_OUT）
- 打刻修正（承認/却下含む）
- シフト作成/編集/公開
- 月次締め/差戻し

### データ保護
- 位置情報（GPS）は設定に応じて取得
- 保存期間/閲覧権限を限定（LEAD/MANAGER以上）

---

## 将来拡張（MVP2以降）

### MVP2
- 休憩打刻（BREAK_START/BREAK_END）
- 訪問開始/終了打刻（VISIT_START/VISIT_END）
- GPS必須化オプション（事業所設定）
- 資格/配置ルールの強化（ブロック機能）
- ガイド記録→訪問イベント自動生成（連携B）

### MVP3
- 変形労働制対応（週/月単位の柔軟な残業計算）
- 直行直帰対応（訪問先打刻）
- スマホアプリ（PWA/ネイティブ）
- AI自動シフト生成（最適化アルゴリズム）
- 給与ソフト連携（CSV/API）

---

## リスク・課題

### リスク
1. **複雑な勤務パターン**: 夜勤（日跨ぎ）の計算ロジックが複雑
   - **対策**: 開始日基準で統一、深夜時間（22-5）を明確に定義

2. **打刻漏れ**: スタッフが打刻を忘れる
   - **対策**: 部分実績保持、警告表示、未打刻リスト表示、修正申請フロー

3. **ガイド記録との差異**: 実績と勤怠のズレ
   - **対策**: 差異検知アラート、定期的なLEAD確認

### 課題
1. **GPS精度**: 屋内・地下で位置取得失敗の可能性
   - **対策**: GPS取得失敗時も打刻可能（任意設定）

2. **オフライン対応**: ネットワーク断絶時の打刻
   - **対策**: MVP1では非対応、MVP2でPWA化してローカルストレージ活用

3. **変形労働制**: 複雑な残業計算
   - **対策**: MVP1では1日8時間超のみ、MVP3で拡張

---

## 受け入れ条件（Acceptance Criteria）

### MVP1完了の定義

- [ ] シフトが月次で作成・公開でき、スタッフは自分のシフトを閲覧できる
- [ ] 出勤→退勤の打刻ができ、日次集約された実働が自動計算される
- [ ] 打刻漏れや時刻不整合があっても、実績は部分保持され、警告として可視化される
- [ ] 夜勤（日跨ぎ、実運用15:30-翌9:30）でも深夜時間（22-5）が正しく算出される
- [ ] 打刻修正は申請→承認が必要で、監査ログが残る
- [ ] 月次締めを行うとロックされ、CSV出力できる
- [ ] ガイド記録と勤怠の差異（実績が勤務外、実績合計>実働等）がアラート表示される
- [ ] STAFF/LEAD/MANAGER権限が正しく動作する

---

## 参考資料

- 要件定義: `勤怠管理（福祉事業所向け）要件定義.md`
- Prismaスキーマ: `prisma/schema.prisma`
- 既存実装:
  - Unit管理: `src/server/routers/unit.ts`
  - GuideRecord: `src/server/routers/guideRecord.ts`
  - AuditLog: `src/server/routers/auditLog.ts`
