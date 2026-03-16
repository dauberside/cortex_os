# Phase 6: 支援記録CRUD 実装計画

**開始日**: 2026-03-10
**目的**: 日々の支援記録を詳細に記録できる機能を実装する

---

## 1. 概要

### 目的
利用者の日常的な支援内容を、カテゴリ別に詳細に記録できるシステムを構築する。

### スコープ
- 食事、排泄、入浴、移動、コミュニケーション、健康状態の6カテゴリ
- CRUD操作（作成・閲覧・更新・削除）
- 利用者詳細画面への統合
- 職員による記録と閲覧

---

## 2. データベース設計

### 2.1 Prismaスキーマ

```prisma
model SupportRecord {
  id            String   @id @default(cuid())
  recipientId   String
  recipient     CareRecipient @relation(fields: [recipientId], references: [id], onDelete: Cascade)

  recordDate    DateTime @default(now()) @db.Timestamptz
  category      SupportCategory

  // カテゴリ別の詳細データ（JSON）
  content       Json     @db.JsonB

  // メモ・特記事項
  notes         String?  @db.Text

  // 記録者
  staffId       String
  staff         User     @relation("SupportRecordStaff", fields: [staffId], references: [id])

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([recipientId, recordDate])
  @@index([recipientId, category])
  @@index([staffId])
}

enum SupportCategory {
  MEAL          // 食事
  EXCRETION     // 排泄
  BATH          // 入浴
  MOBILITY      // 移動・外出
  COMMUNICATION // コミュニケーション
  HEALTH        // 健康状態
}
```

### 2.2 カテゴリ別のcontent構造

#### MEAL（食事）
```typescript
{
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
  intakeAmount: 'all' | 'most' | 'half' | 'little' | 'none',
  foodTexture: 'normal' | 'soft' | 'minced' | 'pureed' | 'liquid',
  assistanceLevel: 'independent' | 'verbal' | 'partial' | 'full',
  duration: number, // 分
  leftoverReason?: string,
}
```

#### EXCRETION（排泄）
```typescript
{
  type: 'urination' | 'defecation' | 'both',
  method: 'toilet' | 'portable_toilet' | 'diaper' | 'urinal',
  assistanceLevel: 'independent' | 'verbal' | 'partial' | 'full',
  amount: 'large' | 'medium' | 'small',
  condition: 'normal' | 'diarrhea' | 'constipation' | 'other',
  time: string, // HH:mm
}
```

#### BATH（入浴）
```typescript
{
  bathType: 'general' | 'mechanical' | 'shower' | 'partial',
  assistanceLevel: 'independent' | 'verbal' | 'partial' | 'full',
  duration: number, // 分
  waterTemperature: number, // 度
  skinCondition?: string,
}
```

#### MOBILITY（移動・外出）
```typescript
{
  activityType: 'indoor' | 'outdoor' | 'outing',
  destination?: string,
  purpose?: string,
  assistanceLevel: 'independent' | 'verbal' | 'partial' | 'full',
  mobilityAid?: string, // 車椅子、杖など
  duration: number, // 分
}
```

#### COMMUNICATION（コミュニケーション）
```typescript
{
  communicationType: 'verbal' | 'gesture' | 'writing' | 'device' | 'other',
  topic?: string,
  mood: 'good' | 'normal' | 'anxious' | 'irritated' | 'depressed',
  responseQuality: 'clear' | 'unclear' | 'difficult',
}
```

#### HEALTH（健康状態）
```typescript
{
  vitalSigns?: {
    bodyTemperature?: number,
    bloodPressureSystolic?: number,
    bloodPressureDiastolic?: number,
    pulse?: number,
    spO2?: number,
  },
  symptoms?: string[],
  painLevel?: number, // 0-10
  painLocation?: string,
  consciousness: 'clear' | 'drowsy' | 'confused' | 'unconscious',
}
```

---

## 3. バックエンド実装（tRPC）

### 3.1 ルーター: `src/server/routers/supportRecord.ts`

```typescript
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

// カテゴリ別のスキーマ
const mealContentSchema = z.object({
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  intakeAmount: z.enum(['all', 'most', 'half', 'little', 'none']),
  foodTexture: z.enum(['normal', 'soft', 'minced', 'pureed', 'liquid']),
  assistanceLevel: z.enum(['independent', 'verbal', 'partial', 'full']),
  duration: z.number().optional(),
  leftoverReason: z.string().optional(),
});

// 他のカテゴリのスキーマも同様に定義...

export const supportRecordRouter = router({
  // 一覧取得
  list: protectedProcedure
    .input(
      z.object({
        recipientId: z.string(),
        category: z.enum(['MEAL', 'EXCRETION', 'BATH', 'MOBILITY', 'COMMUNICATION', 'HEALTH']).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      // 権限チェック: 利用者へのアクセス権限確認

      return await ctx.prisma.supportRecord.findMany({
        where: {
          recipientId: input.recipientId,
          category: input.category,
          recordDate: {
            gte: input.startDate,
            lte: input.endDate,
          },
        },
        include: {
          staff: {
            select: { id: true, name: true },
          },
        },
        orderBy: { recordDate: 'desc' },
        take: input.limit,
      });
    }),

  // 詳細取得
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const record = await ctx.prisma.supportRecord.findUnique({
        where: { id: input.id },
        include: {
          recipient: true,
          staff: {
            select: { id: true, name: true },
          },
        },
      });

      if (!record) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      // 権限チェック

      return record;
    }),

  // 作成
  create: protectedProcedure
    .input(
      z.object({
        recipientId: z.string(),
        recordDate: z.date(),
        category: z.enum(['MEAL', 'EXCRETION', 'BATH', 'MOBILITY', 'COMMUNICATION', 'HEALTH']),
        content: z.any(), // カテゴリ別に検証
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 権限チェック

      return await ctx.prisma.supportRecord.create({
        data: {
          recipientId: input.recipientId,
          recordDate: input.recordDate,
          category: input.category,
          content: input.content,
          notes: input.notes,
          staffId: ctx.session.user.id,
        },
      });
    }),

  // 更新
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        recordDate: z.date().optional(),
        content: z.any().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 権限チェック: 自分の記録のみ編集可能（LEAD/MANAGERは全て編集可能）

      return await ctx.prisma.supportRecord.update({
        where: { id: input.id },
        data: {
          recordDate: input.recordDate,
          content: input.content,
          notes: input.notes,
        },
      });
    }),

  // 削除
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // 権限チェック: 自分の記録のみ削除可能（LEAD/MANAGERは全て削除可能）

      return await ctx.prisma.supportRecord.delete({
        where: { id: input.id },
      });
    }),

  // 日別サマリー
  getDailySummary: protectedProcedure
    .input(
      z.object({
        recipientId: z.string(),
        date: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      const startOfDay = new Date(input.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(input.date);
      endOfDay.setHours(23, 59, 59, 999);

      return await ctx.prisma.supportRecord.findMany({
        where: {
          recipientId: input.recipientId,
          recordDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        include: {
          staff: {
            select: { id: true, name: true },
          },
        },
        orderBy: { recordDate: 'asc' },
      });
    }),
});
```

---

## 4. フロントエンド実装

### 4.1 ページ構成

```
src/app/
  recipients/
    [id]/
      support-records/
        page.tsx              // 支援記録一覧
        new/
          page.tsx            // 新規作成
        [recordId]/
          page.tsx            // 詳細表示
          edit/
            page.tsx          // 編集
```

### 4.2 コンポーネント構成

```
src/components/
  support-records/
    SupportRecordList.tsx           // 記録一覧
    SupportRecordCard.tsx           // 記録カード
    SupportRecordForm.tsx           // 記録フォーム
    category-forms/
      MealForm.tsx                  // 食事フォーム
      ExcretionForm.tsx            // 排泄フォーム
      BathForm.tsx                 // 入浴フォーム
      MobilityForm.tsx             // 移動フォーム
      CommunicationForm.tsx        // コミュニケーションフォーム
      HealthForm.tsx               // 健康状態フォーム
    SupportRecordTimeline.tsx      // タイムライン表示
```

### 4.3 主要機能

#### 記録一覧ページ
- カテゴリ別フィルタリング
- 日付範囲指定
- カード形式表示
- 新規作成ボタン

#### 記録作成/編集フォーム
- カテゴリ選択
- 日時選択
- カテゴリ別動的フォーム
- メモ入力
- 保存・キャンセル

#### 利用者詳細画面への統合
- 「支援記録」タブ追加
- 直近の支援記録表示（最新5件）
- カテゴリ別サマリー

---

## 5. UI/UX設計

### 5.1 カテゴリアイコン・色分け

| カテゴリ | アイコン | カラー |
|---------|---------|--------|
| MEAL | UtensilsCrossed | Orange |
| EXCRETION | Droplet | Blue |
| BATH | Droplets | Cyan |
| MOBILITY | PersonStanding | Green |
| COMMUNICATION | MessageCircle | Purple |
| HEALTH | Heart | Red |

### 5.2 フォームレイアウト

1. **カテゴリ選択** - タブまたはドロップダウン
2. **日時選択** - デフォルトは現在時刻
3. **カテゴリ別フィールド** - 動的に表示
4. **メモ欄** - 自由記述
5. **保存ボタン** - バリデーション後に有効化

---

## 6. 権限設計

### 6.1 閲覧権限
- STAFF: 自分が担当する利用者の記録を閲覧可能
- LEAD/MANAGER: 全利用者の記録を閲覧可能

### 6.2 編集権限
- STAFF: 自分が作成した記録のみ編集可能（24時間以内）
- LEAD/MANAGER: 全ての記録を編集可能

### 6.3 削除権限
- STAFF: 自分が作成した記録のみ削除可能（24時間以内）
- LEAD/MANAGER: 全ての記録を削除可能

---

## 7. 実装順序

### Step 1: データベース
1. Prismaスキーマ追加
2. マイグレーション実行
3. Prisma Client再生成

### Step 2: バックエンド
1. tRPCルーター実装
2. 権限チェック実装
3. バリデーションスキーマ定義

### Step 3: フロントエンド（基本）
1. 記録一覧ページ
2. 記録詳細ページ
3. カテゴリ選択UI

### Step 4: フロントエンド（フォーム）
1. 各カテゴリ専用フォーム作成
2. 記録作成ページ
3. 記録編集ページ

### Step 5: 統合
1. 利用者詳細画面への統合
2. ナビゲーション追加
3. アクセスログ記録

### Step 6: テスト
1. テストデータ作成
2. CRUD操作テスト
3. 権限テスト

---

## 8. テスト計画

### 8.1 単体テスト
- [ ] 各カテゴリのバリデーション
- [ ] 権限チェック
- [ ] CRUD操作

### 8.2 統合テスト
- [ ] 記録作成フロー
- [ ] 記録編集フロー
- [ ] フィルタリング機能

### 8.3 受け入れテスト
- [ ] STAFF権限での記録作成・編集
- [ ] MANAGER権限での全記録閲覧
- [ ] カテゴリ別フォームの動作確認

---

## 9. 工数見積

| タスク | 工数 |
|-------|------|
| データベース設計・実装 | 0.5日 |
| tRPCルーター実装 | 1日 |
| 記録一覧・詳細ページ | 0.5日 |
| カテゴリ別フォーム実装 | 1.5日 |
| 利用者詳細画面統合 | 0.5日 |
| テスト・修正 | 1日 |
| **合計** | **5日** |

---

## 10. 今後の拡張候補

### Phase 6.1
- 記録のテンプレート機能
- 一括入力機能
- 印刷機能

### Phase 6.2
- グラフ・チャート表示
- 統計レポート
- 傾向分析

### Phase 6.3
- 写真添付機能
- 音声入力
- モバイル最適化

---

**Phase 6 実装計画 完了**
