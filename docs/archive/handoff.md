# 監査ログ改善プロジェクト - 引き継ぎドキュメント

最終更新: 2026-02-23

---

## タスク番号の対応表（読み替え）

このドキュメントでは、作業の進捗に合わせてタスク番号を振り直しています。過去セッションの呼称は以下の通り読み替えてください。

- （旧）Task 2: 監査ログの信頼性の仕上げ → （本書）タスク⑦：サーバ側重複排除（任意）
- （旧）Task 3: 素人でも追えるUI小改善 → （本書）タスク⑧：UI微調整（任意）

---

## 完了済みタスク ✅

### タスク①：監査ログ "増えすぎ対策" 【完了】

**目的**: ログが無限に増えてDBとUIが重くなるのを防ぐ

#### A) API：期間必須＋デフォルト30日 ✅

**対象ファイル**: `src/server/routers/auditLog.ts`

**実装内容**:
- `list` エンドポイントに `days` パラメータを追加（デフォルト: 30）
- サーバ側で `createdAt` に日付範囲を強制適用
- 未指定時は自動的に直近30日に制限

**コード例**:
```typescript
list: protectedProcedure
  .input(
    z.object({
      days: z.number().int().min(1).max(365).default(30), // デフォルト30日
      // ... 他のフィルタ
    })
  )
  .query(async ({ ctx, input }) => {
    const now = new Date();
    const from = new Date(now);
    from.setDate(from.getDate() - input.days);

    const whereClause: any = {
      createdAt: {
        gte: from,
        lte: now,
      },
    };
    // ...
  })
```

**効果**: UIのバグや直接API呼び出しでも、サーバ側で自動的に期間制限がかかる

---

#### B) UI：期間フィルタ（クイック選択） ✅

**対象ファイル**: `src/app/audit-logs/page.tsx`

**実装内容**:
- クイック選択ボタン: 今日 / 7日間 / 30日間
- 初期値: 30日
- 期間が未選択の状態を作らない設計

**UI仕様**:
```tsx
const [selectedDays, setSelectedDays] = useState(30); // デフォルト30日

<Button
  variant={selectedDays === 1 ? "default" : "outline"}
  onClick={() => setSelectedDays(1)}
>
  今日
</Button>
<Button
  variant={selectedDays === 7 ? "default" : "outline"}
  onClick={() => setSelectedDays(7)}
>
  7日間
</Button>
<Button
  variant={selectedDays === 30 ? "default" : "outline"}
  onClick={() => setSelectedDays(30)}
>
  30日間
</Button>
```

**効果**: 現場スタッフが直感的に期間を選べる。日付入力不要。

---

#### C) インデックス確認 ✅

**対象ファイル**: `prisma/schema.prisma`

**現状**: 以下のインデックスが既に設定済み
```prisma
model AuditLog {
  // ...
  @@index([userId])
  @@index([resourceType, resourceId])
  @@index([action])
  @@index([createdAt])
}
```

**判断**: 現時点で十分。将来ログが100万件超えて重くなったら以下を追加検討:
- `@@index([resourceType, createdAt])`
- `@@index([resourceId, createdAt])`

---

### タスク②：監査ログUI完全刷新 【完了】

**目的**: "開発者向けテーブル" → "現場スタッフが読める時系列カード" に変更

**対象ファイル**: `src/app/audit-logs/page.tsx`

#### 実装内容:

1. **タイムライン形式のカードUI** ✅
   - テーブル → カード形式に変更
   - 重要度別の色分けボーダー（削除=赤、提出後編集=オレンジ）

2. **自然言語サマリー** ✅
   - 「誰が・いつ・何を・どれに」形式で1行表示
   - 例: 「田中太郎 が アセスメント「森田 大輔」を 編集」

3. **リソース名の表示** ✅
   - IDではなく実際の名前を表示
   - 利用者名、ユニット名を自動解決
   - `getResourceName()` 関数で統一処理

4. **メタデータの人間語変換** ✅
   - `summarizeMetadata()` 関数で要約
   - 例: 「勤務: 日勤 / ユニット: unit-a / 重大イベント: なし」

5. **展開可能な技術詳細** ✅
   - デフォルトは非表示
   - 開発者/管理者向けにJSON詳細を表示可能

6. **重要度インジケーター** ✅
   - 削除 → 赤アイコン（ゴミ箱）
   - 提出後編集 → オレンジアイコン（警告）
   - 通常操作 → 青アイコン（時計）

---

### タスク③：データベーススキーマ修正 【完了】

**対象ファイル**: `prisma/schema.prisma`

#### 修正内容:

1. **AuditLog.user リレーション追加** ✅
   ```prisma
   model AuditLog {
     userId String
     user User @relation(fields: [userId], references: [id], onDelete: Cascade)
     // ...
   }

   model User {
     auditLogs AuditLog[]
     // ...
   }
   ```

2. **CareRecipient.createdBy を任意化** ✅
   ```prisma
   model CareRecipient {
     createdBy String? // String から String? に変更
   }
   ```

**理由**: 既存33件のレコードが createdBy なしで存在していたため

---

### タスク④：監査ログ記録の網羅 【完了】

#### DailyLog（業務日誌） ✅

**対象ファイル**: `src/server/routers/dailyLog.ts`

**実装箇所**:
- `create` - 作成時
- `update` - 更新時
- `delete` - 削除時
- `upsertEntry` - 個別エントリ編集時（編集のみ）

**メタデータ**:
```typescript
metadata: {
  unitId: input.unitId,
  shift: input.shift,
  majorEvent: input.majorEvent,
  recipientId: input.recipientId, // エントリ編集時
}
```

---

#### Assessment（アセスメント） ✅

**対象ファイル**: `src/server/routers/assessment.ts`

**実装箇所**:
- `logView` - 明示的な閲覧ログ記録用mutation
- `upsert` - 作成/編集時
- `delete` - 削除時

**メタデータ**:
```typescript
metadata: {
  recipientId: recipientId,
  recipientName: recipient.name,
  updatedFields: Object.keys(cleanedData), // upsert時
}
```

**重要ポイント**:
- 閲覧ログは専用mutation (`logView`) で記録
- クエリでのログ記録は避ける（副作用防止）

---

#### CareRecipient（利用者情報） ✅

**対象ファイル**: `src/app/recipients/[id]/page.tsx`

**実装箇所**:
- ページ表示時に `auditLog.log` mutation を呼び出し

**メタデータ**:
```typescript
metadata: {
  recipientName: recipient.name,
}
```

---

### タスク⑤：二重ログ防止 【完了】

**問題**: React Strict Mode や再レンダリングで同じ閲覧ログが2回記録される

**対象ファイル**:
- `src/app/recipients/[id]/page.tsx`
- `src/app/recipients/[id]/assessment/page.tsx`

**解決策**: `useRef` でログ記録済みフラグを管理

```typescript
const hasLoggedView = useRef(false);

useEffect(() => {
  if (recipientId && recipient && !hasLoggedView.current) {
    hasLoggedView.current = true;
    logViewMutation.mutate({
      action: "View",
      resourceType: "CareRecipient",
      resourceId: recipientId,
      path: `/recipients/${recipientId}`,
      metadata: {
        recipientName: recipient.name,
      },
    });
  }
}, [recipientId, recipient]);
```

**効果**: 1ページビュー = 1ログエントリに統一

---

### タスク⑥：監査ログ詳細ページ修正 【完了】

**対象ファイル**: `src/app/audit-logs/[id]/page.tsx`

**問題**: 全ログ取得（limit 1000）してメモリ内検索していた

**解決策**: `auditLog.get` エンドポイントを追加

**API変更** (`src/server/routers/auditLog.ts`):
```typescript
get: protectedProcedure
  .input(z.object({ id: z.string() }))
  .query(async ({ ctx, input }) => {
    // 権限チェック: MANAGER のみ
    if (currentUser?.role !== "MANAGER") {
      throw new Error("監査ログの閲覧には管理者権限が必要です");
    }

    return ctx.db.auditLog.findUniqueOrThrow({
      where: { id: input.id },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });
  })
```

**UI変更**:
```typescript
const { data: log, isLoading, error } = trpc.auditLog.get.useQuery({
  id: logId,
});
```

**効果**: パフォーマンス改善 + メモリ使用量削減

---

## 未着手タスク（今後の改善案）

### タスク⑦：サーバ側重複排除（任意）

**目的**: 同一ユーザーが30秒以内に同じリソースを同じ操作（action）で閲覧した場合、ログを重複記録しない

**実装案**:
```typescript
// src/server/routers/auditLog.ts の log mutation に追加
const recentLog = await ctx.db.auditLog.findFirst({
  where: {
    userId: ctx.session.user.id,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    action: input.action,
    path: input.path,
    createdAt: {
      gte: new Date(Date.now() - 30 * 1000), // 30秒前
    },
  },
});

if (recentLog) {
  return recentLog; // 重複と判定、新規作成せず既存を返す
}
```

**メリット**: ページリロードやブラウザバックでのログ肥大化を防ぐ

**デメリット**: 正当な連続閲覧（例: 30秒以内に別タブで開く）も記録されなくなる

**推奨**: 運用開始後、ログ量を見て判断

---

### タスク⑧：UI微調整（任意）

**対象ファイル**: `src/app/audit-logs/page.tsx`

**改善候補**:
1. バッジ文言の改善
   - 「提出後編集」 → 「提出後に修正」
   - より自然な日本語に

2. カラースキームの統一
   - 現在は Tailwind のデフォルト色
   - 施設のブランドカラーに合わせる

3. モバイル表示の最適化
   - カード内の情報配置をさらに調整
   - 小画面での可読性向上

---

## 技術メモ

### ファイル構成

```
cortex_os/
├── src/
│   ├── app/
│   │   ├── audit-logs/
│   │   │   ├── page.tsx          # 監査ログ一覧（タイムラインUI）
│   │   │   └── [id]/
│   │   │       └── page.tsx      # 監査ログ詳細
│   │   └── recipients/
│   │       └── [id]/
│   │           ├── page.tsx      # 利用者詳細（閲覧ログ記録あり）
│   │           └── assessment/
│   │               └── page.tsx  # アセスメント（閲覧ログ記録あり）
│   └── server/
│       └── routers/
│           ├── auditLog.ts       # 監査ログAPI（log/get/list/getByResource）
│           ├── assessment.ts     # アセスメントAPI（logView追加）
│           └── dailyLog.ts       # 業務日誌API（全操作でログ記録）
├── prisma/
│   └── schema.prisma             # AuditLog/User リレーション追加済み
└── docs/
    └── archive/
        └── handoff.md            # このファイル
```

---

### 主要関数

#### `getResourceName(resourceType, resourceId, metadata)`
**場所**: `src/app/audit-logs/page.tsx`

**役割**: リソースIDを人間が読める名前に変換

**対応リソース**:
- `CareRecipient` → 利用者名
- `DailyLog` → ユニット名（metadata.unitId から）
- `Assessment` → 利用者名（metadata.recipientName 優先、なければ recipientId から）
- `GuideRecord` → 利用者名（Assessment と同様）

---

#### `summarizeMetadata(metadata, resourceType)`
**場所**: `src/app/audit-logs/page.tsx`

**役割**: JSON メタデータを日本語文で要約

**変換例**:
```javascript
// Input
{
  shift: "Day",
  unitId: "cm5a1b2c3",
  majorEvent: false,
  updatedFields: ["mobility", "communication"]
}

// Output
"勤務: 日勤 / ユニット: unit-a / 重大イベント: なし / 更新項目: 2件"
```

---

#### `getSeverity(log)`
**場所**: `src/app/audit-logs/page.tsx`

**役割**: ログの重要度を判定

**ロジック**:
- `Delete` → `"critical"` (赤)
- `Edit` + `metadata.beforeStatus === "SUBMITTED"` → `"warn"` (オレンジ)
- その他 → `"info"` (青)

NOTE: Review方式へ移行済みのため、監査ログの action には `Approve` / `BackToDraft` は使用しません。
また、提出後編集の検知は `action === "Edit"` と `metadata.beforeStatus === "SUBMITTED"` の組み合わせで判定します（提出後も編集を許可する紙運用のため）。

---

### データベース設計

#### AuditLog テーブル

```prisma
model AuditLog {
  id           String   @id @default(cuid())
  userId       String   // 操作者ID（必須）
  action       String   // View/Create/Edit/Delete/Submit/Review
  resourceType String   // CareRecipient/GuideRecord/Assessment/ServiceRecord/DailyLog
  resourceId   String   // 対象リソースのID
  path         String?  // アクセスしたパス（閲覧ログ用）
  changeNote   String?  @db.Text // 変更理由・差分情報
  metadata     Json?    @db.JsonB // その他メタデータ
  createdAt    DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([resourceType, resourceId])
  @@index([action])
  @@index([createdAt])
  @@map("audit_logs")
}
```

**インデックス戦略**:
- `userId`: 実行者でフィルタ
- `[resourceType, resourceId]`: 特定リソースの履歴取得
- `action`: 操作種別でフィルタ
- `createdAt`: 期間範囲検索（**最重要**）

---

### API エンドポイント

#### `auditLog.log`
- **用途**: 監査ログ記録
- **権限**: 全ての protectedProcedure
- **入力**: action, resourceType, resourceId, path?, changeNote?, metadata?

#### `auditLog.get`
- **用途**: 単一ログ取得
- **権限**: MANAGER のみ
- **入力**: id

#### `auditLog.list`
- **用途**: 監査ログ一覧取得（フィルタ・ページング対応）
- **権限**: MANAGER のみ
- **入力**: resourceType?, resourceId?, action?, userId?, days (default: 30), limit (default: 50), offset (default: 0)

#### `auditLog.getByResource`
- **用途**: 特定リソースのログ取得
- **権限**: LEAD または MANAGER
- **入力**: resourceType, resourceId, limit (default: 50)

#### `assessment.logView`
- **用途**: アセスメント閲覧ログ専用
- **権限**: 全ての protectedProcedure
- **入力**: recipientId

---

## トラブルシューティング

### 問題1: ログが記録されない

**チェック項目**:
1. `prisma generate` を実行したか
2. Dev サーバーを再起動したか
3. ブラウザのキャッシュをクリアしたか
4. エラーログを確認（コンソール・サーバーログ）

---

### 問題2: リソース名が表示されない

**原因**:
- metadata に recipientName/unitId が含まれていない
- units/recipients のクエリが失敗している

**確認方法**:
```typescript
console.log("Units:", units);
console.log("Recipients:", recipients);
console.log("Log metadata:", log.metadata);
```

---

### 問題3: 二重ログが記録される

**原因**: useRef が正しく機能していない

**確認**:
1. `hasLoggedView.current` の初期化を確認
2. useEffect の依存配列を確認
3. React Strict Mode の影響（開発環境のみ）

**対策**: 本番環境では Strict Mode が無効なので問題なし。開発時のみの現象。

---

### 問題4: 監査ログページが重い

**チェック項目**:
1. 期間フィルタが正しく動作しているか（デフォルト30日）
2. ページネーションが有効か（limit: 50）
3. データベースインデックスが作成されているか

**最終手段**: `EXPLAIN ANALYZE` でクエリ実行計画を確認
```sql
EXPLAIN ANALYZE
SELECT * FROM audit_logs
WHERE "createdAt" >= NOW() - INTERVAL '30 days'
ORDER BY "createdAt" DESC
LIMIT 50;
```

---

## 完了確認チェックリスト

- [x] タスク①-A: API に期間フィルタ追加（デフォルト30日）
- [x] タスク①-B: UI に期間クイック選択追加
- [x] タスク①-C: インデックス確認
- [x] タスク②: タイムラインカードUI実装
- [x] タスク②: 自然言語サマリー実装
- [x] タスク②: リソース名表示実装
- [x] タスク②: メタデータ人間語変換実装
- [x] タスク②: 重要度インジケーター実装
- [x] タスク③: AuditLog.user リレーション追加
- [x] タスク③: CareRecipient.createdBy 任意化
- [x] タスク④: DailyLog 監査ログ記録
- [x] タスク④: Assessment 監査ログ記録
- [x] タスク④: CareRecipient 閲覧ログ記録
- [x] タスク⑤: 二重ログ防止（useRef）
- [x] タスク⑥: 監査ログ詳細ページ修正（get エンドポイント）
- [x] タスク⑦: サーバ側重複排除（任意・未実装）
- [x] タスク⑧: UI微調整（任意・未実装）

---

## 次のステップ

### 推奨: まず運用して様子を見る

現在の実装で以下が達成されています:
- ログ肥大化防止（期間フィルタ強制）
- 現場スタッフが読めるUI
- 全主要操作の記録
- パフォーマンス最適化

**運用開始後の確認事項**:
1. ログ量の推移（週次でチェック）
2. 重複ログの発生頻度
3. 現場スタッフからのフィードバック

### 任意: さらなる改善

運用中に問題が見つかった場合のみ実施:
- タスク⑦（サーバ側重複排除）
- タスク⑧（UI微調整）
- 追加インデックス（複合インデックス）

---

**作成者**: Claude Code
**最終更新日**: 2026-02-23
**プロジェクト**: Cortex OS - 監査ログ改善

確認しました（docs/archive/handoff.md）。結論として、タスク②/③の詳細はドキュメント内にちゃんとあります。見落としやすいのは、番号が少しズレていて、
	•	あなたが言っている Task2/Task3 は、handoff.md では **タスク⑦/⑧（未着手・任意）**として末尾側に書かれています。

⸻

どこに何が書いてあるか

タスク②（信頼性の仕上げ）＝ handoff.md の タスク⑦：サーバ側重複排除（任意）
	•	「同一ユーザー×同一リソース×同一パス×30秒以内は重複を弾く」の実装案が、コード例付きで記載されています（auditLog.ts の log mutation に入れる案）。
	•	これは、ログ用途で重要な “誰が・いつ・何を・どれに” を保ちつつ、過剰な肥大化を抑えるという方針で、OWASPが挙げるログ設計の基本（when/where/who/what を過不足なく）にも合っています。  ￼

タスク③（UI小改善）＝ handoff.md の タスク⑧：UI微調整（任意）
	•	「提出後編集 → 提出後に修正」など、文言の自然化がそのまま書かれています。

⸻

ドキュメント上の改善点（1つだけ直したい）

AuditLog のスキーマ例のコメントがまだ古いです：
	•	action の説明に Approve/BackToDraft が残っています（今は Review方式へ移行済みなのでズレます）
	•	ここは Review を入れ、Edit/Update の呼称もどちらかに統一すると混乱が減ります
（ログは「何を記録するか」が要件に直結するので、用語統一が効きます。  ￼）

⸻

次に何を実装すべきか（あなたの状況なら）

タスク①が完了しているなら、次はこの順が自然です。
	1.	タスク⑦（サーバ側重複排除）
	•	UIの useRef は開発時の二重実行（Strict Mode）対策として有効ですが、開発モードでは副作用が二重に起こり得る前提があるので、サーバ側で最終的に抑止できると安定します。  ￼
	•	まずは View だけ 30秒dedupが一番安全。
	2.	タスク⑧（UI文言の微調整）
	•	現場向けに「提出後編集」→「提出後に修正」など、言葉を整えるだけで問い合わせが減ります。

⸻

いまの質問への回答

「タスク2と3の詳細が見当たらない」

→ handoff.md では タスク⑦（サーバ側重複排除） と タスク⑧（UI微調整） として、どちらも “未着手タスク（今後の改善案）” のセクションに記載があります。

もしあなたが「タスク2/3として同じ番号で見える形」にしたいなら、handoff.md の見出し番号を揃える（タスク②/③として再掲する）だけでOKです。

