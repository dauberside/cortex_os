# 本番環境マイグレーション手順

本番環境（Neon PostgreSQL on Vercel）へのデータベースマイグレーション手順書です。

## ⚠️ 重要な原則

1. **絶対にビルドプロセスに `prisma migrate` や `prisma db push` を含めない**
   - データ損失のリスクがあるため
   - Vercelビルド時の自動実行は危険

2. **マイグレーションは手動で実行する**
   - 営業時間外に実施
   - 事前にバックアップを取得
   - ロールバック手順を確認

3. **マイグレーション前の確認事項**
   - ローカルで `pnpm tsc --noEmit` が通ること
   - マイグレーションSQLファイルの内容を確認（特にDROP文がないこと）
   - 影響範囲を理解
   - 本番DB接続文字列（DIRECT_URL）の用意

---

## 事前準備: 本番DB接続文字列の取得

マイグレーション実行前に、本番DBへの接続文字列を用意します。

```bash
# Vercelから環境変数を取得
npx vercel env pull .env.local

# .env.localにDIRECT_URLが含まれていることを確認
grep DIRECT_URL .env.local
```

または、Vercel Dashboardから手動でコピー：

- Project Settings > Environment Variables > Production
- `DIRECT_URL` または `DATABASE_URL` をコピー

---

## Phase 2マイグレーション（フェイスシート拡張）

**マイグレーション:** `20260302121008_add_face_sheet_fields`

**追加フィールド数:** CareRecipientモデルに27フィールド

**影響範囲:**

- 既存データ: 影響なし（全てOptionalフィールド）
- 後方互換性: 完全互換
- ダウンタイム: なし

### 手順0: 本番DBテーブル名の確認

マイグレーション実行前に、本番DBの実際のテーブル名を確認します。

```bash
node -e "
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

(async () => {
  const client = new Client({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  const result = await client.query(\`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name LIKE '%recipient%'
    ORDER BY table_name
  \`);

  console.log('利用者関連テーブル:');
  result.rows.forEach(row => console.log('  -', row.table_name));

  await client.end();
})();
"
```

**確認ポイント:** `care_recipients` が存在することを確認（`@@map` ディレクティブにより小文字）

### 手順1: マイグレーションSQLの確認

```bash
cat prisma/migrations/20260302121008_add_face_sheet_fields/migration.sql
```

**確認ポイント:**

- ✅ `ALTER TABLE` のみで `DROP` 文がないこと
- ✅ `IF NOT EXISTS` が含まれているかを確認（含まれている場合は再実行可能）
- ✅ 追加カラムが27個であること

### 手順2: 本番DBへのマイグレーション実行

**方法A: Node.js pgクライアント経由（推奨）**

`scripts/run-phase2-migration.js` を作成して実行：

```javascript
const fs = require("fs");
const { Client } = require("pg");
require("dotenv").config();

async function runMigration() {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

  if (!connectionString) {
    console.error("❌ No DATABASE_URL or DIRECT_URL found");
    process.exit(1);
  }

  console.log("🔗 Connecting to Neon database...");

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log("✅ Connected successfully\\n");

    // マイグレーションSQL読み込み
    const sql = fs.readFileSync(
      "./prisma/migrations/20260302121008_add_face_sheet_fields/migration.sql",
      "utf8"
    );

    console.log("🚀 Executing Phase 2 migration (27 fields)...");
    await client.query(sql);
    console.log("✅ Migration completed!\\n");

    // 確認: 新規フィールドが追加されたか
    const verify = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'care_recipients'
        AND column_name IN ('documentCreatedDate', 'emergencyContacts', 'contactPolicy')
      ORDER BY column_name
    `);

    console.log("🔍 Verifying new fields:");
    verify.rows.forEach((row) => console.log(`  ✅ ${row.column_name}`));

    if (verify.rows.length === 3) {
      console.log("\\n✨ Phase 2 migration successful!");
    } else {
      console.log(
        "\\n⚠️  Warning: Expected 3 verification fields, found",
        verify.rows.length
      );
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
```

実行：

```bash
node scripts/run-phase2-migration.js
```

**方法B: Prisma migrate deploy（ローカルでテスト後のみ）**

⚠️ ローカルで完全にテストした後のみ使用：

```bash
# 本番DB接続で実行（要注意）
npx prisma migrate deploy
```

### 手順3: マイグレーション後の確認

```bash
# care_recipientsテーブルのカラム数確認
node -e "
const { Client } = require('pg');
require('dotenv').config();

(async () => {
  const client = new Client({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  const result = await client.query(\`
    SELECT COUNT(*) as column_count
    FROM information_schema.columns
    WHERE table_name = 'care_recipients'
  \`);

  console.log('care_recipients total columns:', result.rows[0].column_count);
  console.log('Expected: 189 (162 from Phase 1 + 27 from Phase 2)');

  await client.end();
})();
"
```

### 手順4: アプリケーションのデプロイ

マイグレーション成功後、Vercelにデプロイ：

```bash
git add .
git commit -m "feat: add 27 face sheet fields for Phase 2 (帳票レンダリング用)"
git push origin master
```

---

## ロールバック手順

Phase 2フィールドは全てOptionalなので、ロールバックは不要です。

万が一必要な場合は、以下のSQLで全フィールドを削除：

```sql
-- ⚠️ 本番環境では実行しないこと
ALTER TABLE "care_recipients"
  DROP COLUMN IF EXISTS "documentCreatedDate",
  DROP COLUMN IF EXISTS "organizationName",
  DROP COLUMN IF EXISTS "documentHeaderGroupHomeName",
  -- ... (27フィールド全て)
  DROP COLUMN IF EXISTS "contactPolicy";
```

---

## トラブルシューティング

### エラー: `relation "care_recipients" does not exist`

→ 初回マイグレーションから実行してください（`scripts/run-all-migrations.js`）

### エラー: `column "XXX" already exists`

→ 既にマイグレーション済みです。

**対処法:**

1. マイグレーションSQLに `IF NOT EXISTS` が含まれているか確認
2. 含まれている場合は再実行しても安全（冪等性あり）
3. 含まれていない場合は、既存カラムを確認してマイグレーションをスキップ

### Drift検出エラー (`prisma migrate` 実行時)

**エラー内容:** "Your database schema is not in sync with your migration history"

**原因:** 本番DBとローカルマイグレーション履歴の不一致（手動SQLで本番を進めたため）

**対処法:**

1. **現状確認:** 本番DBの実際の状態を確認

   ```bash
   node scripts/run-phase2-migration.js --dry-run  # 実行前シミュレーション
   ```

2. **運用方針の決定:**
   - **A. 手動SQL運用を継続** → Driftは許容し、本番を手動管理（現在の方針）
   - **B. Prisma migrate に戻す** → baseline戦略で履歴を再同期（将来の選択肢）

3. **ログ記録:** どちらの方針を選んだか、チームで共有・記録

**注意:** "無視してOK"という判断は状況依存です。必ず本番DBの現状と比較してください。

---

## 次のステップ

Phase 2マイグレーション完了後：

1. **Step 2: バリデーション追加** (`src/lib/validations/recipientSchema.ts`)
2. **Step 3: tRPCルーター更新** (`src/server/routers/recipient.ts`)
3. **Step 4: UI更新** (フォーム・詳細ページ)
4. **Step 5: 帳票レンダリング** (A4印刷レイアウト)

詳細は `/Users/krinkcrank/.claude/plans/calm-doodling-kurzweil.md` を参照。
