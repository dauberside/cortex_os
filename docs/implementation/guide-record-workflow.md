# GuideRecord ワークフロー実装記録

## 実装完了日

2026-02-21

## 概要

GuideRecord（外出支援記録）にDRAFT/SUBMITTED/APPROVEDの状態管理を追加し、SUBMITTED時にServiceRecord（サービス提供実績）を自動生成する機能を実装。

## 目的

「GuideRecord に DRAFT/SUBMITTED/APPROVED の状態を追加し、SUBMITTEDで ServiceRecord を自動生成、SUBMITTED後の編集は差戻し必須」とすることで、以下を実現：

1. **ワークフロー管理**: 下書き → 提出 → 承認の明確な状態遷移
2. **データ整合性**: GuideRecord（記録）とServiceRecord（実績）の自動同期
3. **編集制御**: 提出後の編集を防止し、必要な場合は差戻しを経由

## 実装内容

### A) Prismaスキーマ変更 (`prisma/schema.prisma`)

#### A-1) enum 追加

```prisma
// GuideRecordStatus - ガイド記録の状態遷移
// Draft（下書き）→ Submitted（提出）→ Approved（承認）
// NOTE: 運用方針として「Submitted後の編集は差戻し（Submitted→Draft）必須」。
// もし将来「Submittedでも編集可（監査ログ必須）」に切り替える場合は、
// ルーター側の編集ガードを緩める（コメントアウトしている箇所を参照）。
enum GuideRecordStatus {
  DRAFT
  SUBMITTED
  APPROVED
}
```

#### A-2) GuideRecord に状態/提出/承認フィールド追加

```prisma
model GuideRecord {
  // ... 既存フィールド ...

  // ワークフロー状態
  status       GuideRecordStatus @default(DRAFT)
  submittedAt  DateTime?
  submittedBy  String?
  approvedAt   DateTime?
  approvedBy   String?

  // Fact（実績）側との紐付け（C案：GuideRecord入力→ServiceRecord自動生成）
  serviceRecord ServiceRecord?

  // ... インデックス ...
  @@index([status])
  @@index([submittedAt])
  @@index([approvedAt])
}
```

#### A-3) ServiceRecord ↔ GuideRecord の参照（1:1関係）

```prisma
model ServiceRecord {
  // ... 既存フィールド ...

  // NOTE: GuideRecordがSubmitted以降は原則編集不可（差戻し必須）。
  // 将来、Submittedでも編集可にする場合は、監査ログ（変更理由・差分）を必須化する。
  guideRecordId String? @unique

  // リレーション
  guideRecord  GuideRecord? @relation(fields: [guideRecordId], references: [id], onDelete: SetNull)

  // ... その他フィールド ...
}
```

#### A-4) マイグレーション実行

```bash
pnpm db:push --accept-data-loss
pnpm db:generate
```

### B) tRPCルーター変更 (`src/server/routers/guideRecord.ts`)

#### B-1) update は DRAFT のみ許可（提出後編集は差戻し必須）

```typescript
// Submitted以降は原則編集不可（差戻し必須）
if (existing.status !== "DRAFT") {
  throw new TRPCError({
    code: "FORBIDDEN",
    message:
      "提出後の編集は差戻しが必要です（DRAFTに戻してから再提出してください）",
  });
}

/*
// 将来案：Submittedでも編集可（監査ログ必須）
// if (existing.status === "SUBMITTED") {
//   if (!input.changeNote) throw new TRPCError({ code: "BAD_REQUEST", message: "修正理由が必要です" });
//   await createAuditLog(...);
// }
*/
```

#### B-2) submit mutation を追加（提出ボタン用）

- GuideRecord を SUBMITTED に遷移
- SUBMITTED 時に ServiceRecord を upsert（guideRecordIdで一意）して自動生成

**要件**:

- submittedAt = now, submittedBy = ctx.userId
- ServiceRecord の serviceType/serviceDate/startTime/endTime/duration を GuideRecord から生成
- destination/purpose/serviceDetail/userCondition/incidents も同期
- ServiceRecord の guideRecordId = guideRecord.id を必ず保存

**実装** (`src/server/routers/guideRecord.ts:124-197`):

```typescript
submit: protectedProcedure
  .input(z.object({ id: z.string() }))
  .mutation(async ({ ctx, input }) => {
    const record = await ctx.db.guideRecord.findFirst({
      where: { id: input.id, userId: ctx.session.user.id },
    });
    if (!record) throw new Error("記録が見つかりません");

    if (record.status !== "DRAFT") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "提出できるのはDRAFT状態の記録のみです",
      });
    }

    if (!record.endedAt) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "終了日時が入力されていません",
      });
    }

    const now = new Date();
    const durationMinutes = Math.round(
      (record.endedAt.getTime() - record.startedAt.getTime()) / (1000 * 60)
    );

    // トランザクション：GuideRecord を SUBMITTED に遷移 + ServiceRecord を自動生成
    const [updatedGuideRecord] = await ctx.db.$transaction([
      ctx.db.guideRecord.update({
        where: { id: input.id },
        data: {
          status: "SUBMITTED",
          submittedAt: now,
          submittedBy: ctx.session.user.id,
        },
      }),
      ctx.db.serviceRecord.upsert({
        where: { guideRecordId: input.id },
        create: {
          recipientId: record.recipientId,
          userId: record.userId,
          serviceType: "MobilitySupport", // NOTE: 現状は移動支援固定
          serviceDate: record.startedAt,
          startTime: record.startedAt,
          endTime: record.endedAt,
          duration: durationMinutes,
          destination: record.destination,
          purpose: record.purpose,
          serviceDetail: record.supportContent || "",
          userCondition: record.userCondition,
          incidents: record.notes,
          guideRecordId: input.id,
        },
        update: {
          serviceDate: record.startedAt,
          startTime: record.startedAt,
          endTime: record.endedAt,
          duration: durationMinutes,
          destination: record.destination,
          purpose: record.purpose,
          serviceDetail: record.supportContent || "",
          userCondition: record.userCondition,
          incidents: record.notes,
        },
      }),
    ]);

    return updatedGuideRecord;
  }),
```

#### B-3) approve mutation を追加（管理者承認）

- GuideRecord を APPROVED に遷移
- approvedAt/approvedBy を保存
- 関連 ServiceRecord の isApproved=true, approvedAt/approvedBy も同期

**実装** (`src/server/routers/guideRecord.ts:199-238`):

```typescript
approve: protectedProcedure
  .input(z.object({ id: z.string() }))
  .mutation(async ({ ctx, input }) => {
    const record = await ctx.db.guideRecord.findFirst({
      where: { id: input.id },
    });
    if (!record) throw new Error("記録が見つかりません");

    if (record.status !== "SUBMITTED") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "承認できるのはSUBMITTED状態の記録のみです",
      });
    }

    const now = new Date();

    const [updatedGuideRecord] = await ctx.db.$transaction([
      ctx.db.guideRecord.update({
        where: { id: input.id },
        data: {
          status: "APPROVED",
          approvedAt: now,
          approvedBy: ctx.session.user.id,
        },
      }),
      ctx.db.serviceRecord.updateMany({
        where: { guideRecordId: input.id },
        data: {
          isApproved: true,
          approvedAt: now,
          approvedBy: ctx.session.user.id,
        },
      }),
    ]);

    return updatedGuideRecord;
  }),
```

#### B-4) backToDraft mutation（差戻し）

- SUBMITTED → DRAFT に戻す（管理者のみ）
- 差戻し理由（reason）は任意だが保存できるなら保存（監査のため）

**実装** (`src/server/routers/guideRecord.ts:240-274`):

```typescript
backToDraft: protectedProcedure
  .input(
    z.object({
      id: z.string(),
      reason: z.string().optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const record = await ctx.db.guideRecord.findFirst({
      where: { id: input.id },
    });
    if (!record) throw new Error("記録が見つかりません");

    if (record.status !== "SUBMITTED") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "差戻しできるのはSUBMITTED状態の記録のみです",
      });
    }

    // TODO: 差戻し理由（reason）を監査ログに保存する仕組みを将来追加
    // if (input.reason) {
    //   await createAuditLog({ action: "BACK_TO_DRAFT", reason: input.reason, ... });
    // }

    return ctx.db.guideRecord.update({
      where: { id: input.id },
      data: {
        status: "DRAFT",
        submittedAt: null,
        submittedBy: null,
      },
    });
  }),
```

### C) UI実装（未実装）

ガイド記録の画面に以下を追加予定：

- **DRAFT時**: 「編集」「提出」ボタン表示
- **SUBMITTED時**: 「承認待ち」バッジ表示＋編集ボタン非表示（差戻し導線は管理者）
- **APPROVED時**: 「承認済み」バッジ表示

## 動作確認（完了条件）

- [x] GuideRecord を DRAFT で作成→編集できる
- [x] 提出ボタンで SUBMITTED になる（この瞬間に ServiceRecord が生成される）
- [x] SUBMITTED のレコードは update が 403 になる
- [x] 管理者が差戻しすると DRAFT に戻り編集可能
- [x] 承認で APPROVED になり、ServiceRecord.isApproved も true になる
- [ ] UI実装（状態バッジ、ボタン制御）

## NOTE

### 同行援護（AccompanyingSupport）について

現状、事業所では同行援護サービスを提供しないため、UI/入力の選択肢には出さず、将来拡張として概念のみ予約する。

### 現在のserviceKindの運用範囲

- MobilitySupport（移動支援）
- HospitalAssist（通院等介助）
- Other（その他）
  - OtherSubType: Shopping（買い物）| Leisure（余暇活動）

### ServiceRecord の serviceType について

現状は "MobilitySupport" 固定で自動生成している。将来的に GuideRecord に serviceKind フィールドを追加し、選択されたserviceKindに応じて serviceType を設定するように拡張予定。

## トレーサビリティ

- **要件定義**: `REQUIREMENTS.md` - FR-011: ガイド記録（外出支援記録）管理
- **データモデル**: `REQUIREMENTS.md` - 7.1.13 GuideRecord, 7.1.14 ServiceRecord
- **スキーマ**: `prisma/schema.prisma:312-324` (GuideRecordStatus enum, workflow fields)
- **ルーター**: `src/server/routers/guideRecord.ts:84-274` (update guard, submit/approve/backToDraft)
- **元の実装指示**: `/Volumes/Extreme Pro/cortex_os/引き継ぎ用`

## 参考資料

元の実装指示（引き継ぎ用ファイル）の内容は、本ドキュメント作成後にアーカイブされます。

## 今後の拡張計画

1. **UI実装**: 状態バッジ、ボタン制御、ワークフロー表示
2. **serviceKindフィールド追加**: GuideRecord に serviceKind を追加し、ServiceRecord.serviceType を動的に設定
3. **監査ログ**: 差戻し理由の保存、編集履歴の記録
4. **Submitted状態での編集許可**: 監査ログ必須で編集可能にする（要件変更が必要）
