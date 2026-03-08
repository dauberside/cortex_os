# 🚨 重大なDB スキーマ問題の発見と対応

**発見日時**: 2026-03-03
**重要度**: CRITICAL - MVP Tests 1-3 の実行をブロック
**影響範囲**: 権限制御、ガイド記録UI、全機能

---

## 🔴 発見された問題

### 1. **users テーブルに `role` 列が存在しない**

**問題の詳細**:

- `prisma/schema.prisma` には `role UserRole @default(STAFF)` が定義されている
- しかし、実際のDBテーブル（migration/20260217143912）には `role` 列が含まれていない
- **結果**: 権限制御（STAFF/LEAD/MANAGER）が完全に機能しない

**影響**:

- ✅ GuideRecordWorkflowActions の「提出」「レビュー済み」ボタン制御が動作しない
- ✅ アクセス制御（誰が何を編集できるか）が動作しない
- ✅ Test 4/5（権限テスト）が実行不可
- ✅ Test 1-3 でも一部のボタン表示が意図通りに動作しない可能性

**根本原因**:

- schema.prisma と migration が同期していない
- `role` 列を追加する migration が実行されていない

---

## ✅ 作成した対応策

### Migration ファイルの作成

新しい migration を作成しました：

**ファイルパス**: `prisma/migrations/20260303_add_user_role/migration.sql`

**内容**:

```sql
-- Create UserRole enum
DO $$ BEGIN
  CREATE TYPE "UserRole" AS ENUM ('STAFF', 'LEAD', 'MANAGER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add role column to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role" "UserRole" NOT NULL DEFAULT 'STAFF';

-- Create index on role
CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users"("role");
```

---

## 🚧 現在の状況

### ブロッカー

**Neon データベースへの接続に失敗**:

```
Error: P1001: Can't reach database server at 'ep-broad-haze-ai5806b4.c-4.us-east-1.aws.neon.tech:5432'
```

**原因**:

- ネットワーク接続の問題
- Neon DB のスリープ状態（可能性）
- DIRECT_URL の接続制限

---

## 📋 次のアクション（優先順位順）

### Option A: Neon DB 接続を復旧（推奨）

1. **Neon Console で DB の状態を確認**
   - https://console.neon.tech/
   - プロジェクトが Active かチェック
   - Compute が起動しているか確認

2. **DIRECT_URL が正しいか確認**

   ```bash
   cat .env | grep DIRECT_URL
   ```

3. **接続テスト**

   ```bash
   cd "/Volumes/Extreme Pro/cortex_os"
   pnpm prisma db push
   ```

4. **Migration を適用**
   ```bash
   # 手動でSQLを実行
   psql "$DIRECT_URL" < prisma/migrations/20260303_add_user_role/migration.sql
   ```

### Option B: アプリケーション側で回避（一時的）

1. **デフォルトroleを MANAGER に設定**
   - すべてのユーザーを一時的に MANAGER として扱う
   - 権限チェックをスキップ

2. **NextAuth.js で role を強制設定**
   - サインイン時に session.user.role = 'MANAGER' を注入

**注意**: Option B は一時的な回避策であり、本番環境では使用不可

---

## 🧪 修正後の確認手順

Migration 適用後、以下を確認：

### 1. DB スキーマの確認

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
```

**期待される結果**:

```
column_name | data_type
------------|----------
...
role        | USER-DEFINED (UserRole)
...
```

### 2. テストユーザーの role を設定

```sql
-- STAFFユーザー
UPDATE users SET role = 'STAFF' WHERE email = 'staff@example.com';

-- LEADユーザー
UPDATE users SET role = 'LEAD' WHERE email = 'lead@example.com';

-- MANAGERユーザー
UPDATE users SET role = 'MANAGER' WHERE email = 'manager@example.com';
```

### 3. アプリケーションで確認

1. ブラウザで `https://localhost:3443` にアクセス
2. `staff@example.com` でサインイン
3. コンソールで session を確認:
   ```javascript
   // ブラウザコンソールで実行
   fetch("/api/auth/session")
     .then((r) => r.json())
     .then(console.log);
   ```
4. `session.user.role` が `'STAFF'` であることを確認

---

## 📊 影響を受けるファイル

### 権限チェックを行っているファイル

1. **src/components/guide/GuideRecordWorkflowActions.tsx**
   - `session?.user?.role` を参照
   - 「提出」「レビュー済み」ボタンの表示制御

2. **src/server/routers/recipient.ts**
   - `ctx.session.user.role` で権限チェック

3. **src/middleware.ts** (もし存在する場合)
   - ロールベースのルート保護

4. **src/app/api/auth/[...nextauth]/route.ts**
   - NextAuth の session callback で `user.role` を設定

---

## 🎯 MVP への影響

**現在の MVP 達成度**: 60% → **0%**（権限制御が動作しないため）

**ブロックされるテスト**:

- ❌ Test 1: DRAFT 作成（ボタン制御が動作しない可能性）
- ❌ Test 2: DRAFT→SUBMITTED 遷移（権限チェック失敗）
- ❌ Test 3: ServiceRecord 自動生成（権限チェック失敗でAPIエラー）
- ❌ Test 4: レビュー済みマーク（LEAD/MANAGER判定不可）
- ❌ Test 5: 権限制御テスト（完全に動作しない）

**Migration 適用後の MVP 達成度**: 0% → **80%**（Tests 1-3 が成功すれば）

---

## 📝 まとめ

### 緊急対応が必要

1. ✅ **Migration ファイル作成済み**
2. ⚠️ **Neon DB 接続復旧が必要**
3. ⚠️ **Migration 適用が必要**
4. ⚠️ **テストユーザーの role 設定が必要**

### 次のステップ

**Neon Console で DB を確認し、接続を復旧させてください。**

接続が復旧したら：

```bash
cd "/Volumes/Extreme Pro/cortex_os"
psql "$DIRECT_URL" < prisma/migrations/20260303_add_user_role/migration.sql
```

---

**最終更新日**: 2026-03-03
**作成者**: Claude Code
