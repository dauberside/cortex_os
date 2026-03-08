# Assessment → CareRecipient データ移行ガイド

## 概要

このガイドでは、Assessmentテーブルのデータを CareRecipient テーブルに移行する手順を説明します。

---

## 事前準備

### 1. データベースバックアップ

**必ず実行してください**

```bash
# PostgreSQLの場合
pg_dump -U your_username -d your_database > backup_$(date +%Y%m%d_%H%M%S).sql

# または、Prisma経由でエクスポート
npx prisma db pull
```

### 2. 移行前の確認

```bash
# Assessmentデータの件数確認
npx prisma studio
# → Assessmentテーブルを確認
```

---

## 移行手順

### ステップ1: DRY RUNで確認

実際のデータを変更せず、移行内容をプレビューします。

```bash
cd /Volumes/Extreme\ Pro/cortex_os
npx tsx scripts/migrate-assessment-to-recipient.ts --dry-run
```

**出力例:**

```
🚀 Assessment → CareRecipient データ移行スクリプト

📊 移行対象: 15件のアセスメント
🔍 DRY RUN モード（実際の更新は行いません）

✅ 山田 太郎 (ID: cmm49f8j...)
   - 趣味: "映画鑑賞、散歩"
   - 性格: "穏やかで協調性がある..."
   - 健康メモに服薬詳細を追加
   - その他メモに3項目を追加

⏭️ 佐藤 花子 (ID: cmm49f9k...)
   - 移行対象データなし

============================================================
📈 移行結果サマリー
============================================================
総数:       15件
成功:       12件
スキップ:   3件
エラー:     0件
============================================================

ℹ️  DRY RUNモードで実行しました。実際のデータは変更されていません。
ℹ️  実際に移行を実行する場合は、--dry-runオプションを外して実行してください。
```

### ステップ2: 特定の利用者でテスト

本番実行前に、特定の利用者のみで試します。

```bash
# 利用者IDを指定してテスト実行
npx tsx scripts/migrate-assessment-to-recipient.ts --recipient-id=cmm49f8jf000fx08oy2hvqorx
```

**確認ポイント:**

- データが正しく統合されているか
- 既存のCareRecipientデータが保護されているか
- フォーマットが読みやすいか

### ステップ3: 本番実行

問題がなければ、全データを移行します。

```bash
# 全データ移行（DRY RUNなし）
npx tsx scripts/migrate-assessment-to-recipient.ts
```

**⚠️ 注意:**

- このコマンドは実際にデータを更新します
- 必ずバックアップを取得してから実行してください

---

## 移行後の確認

### 1. データ確認

```bash
# Prisma Studioで確認
npx prisma studio
```

**確認項目:**

- CareRecipientの各フィールドにデータが正しく移行されているか
- 既存データが上書きされていないか
- テキストフィールドのフォーマットが適切か

### 2. アプリケーション動作確認

1. 開発サーバーを起動: `pnpm dev`
2. ブラウザで https://localhost:3443 にアクセス
3. 利用者詳細ページを確認
4. 利用者編集ページで各フィールドを確認

### 3. Assessmentページの確認

- `/recipients/[id]/assessment` にアクセス
- 警告バナーが表示されているか
- フォームが読み取り専用になっているか
- 「利用者編集ページへ移動」ボタンが機能するか

---

## トラブルシューティング

### エラーが発生した場合

#### 1. Prisma接続エラー

```
Error: Can't reach database server
```

**解決方法:**

- `.env`ファイルの`DATABASE_URL`を確認
- データベースが起動しているか確認

#### 2. 型エラー

```
Type error: Property 'xxx' does not exist
```

**解決方法:**

```bash
# Prismaクライアントを再生成
npx prisma generate
```

#### 3. データ整合性エラー

```
Error: Foreign key constraint failed
```

**解決方法:**

- 移行対象のAssessmentに対応するCareRecipientが存在するか確認
- データベースの整合性をチェック

### ロールバック方法

移行後に問題が発生した場合:

```bash
# バックアップから復元（PostgreSQLの場合）
psql -U your_username -d your_database < backup_YYYYMMDD_HHMMSS.sql
```

---

## 移行仕様の詳細

詳細なマッピング仕様は以下を参照してください:

📄 [assessment-migration-mapping.md](./assessment-migration-mapping.md)

---

## よくある質問（FAQ）

### Q1: Assessmentテーブルは削除されますか？

**A:** いいえ、削除されません。移行後もAssessmentテーブルは参照用として残ります。

### Q2: 既存のCareRecipientデータは上書きされますか？

**A:** いいえ、既存データが存在する場合は上書きされず、Assessmentデータで補完されます。

### Q3: 移行は何回でも実行できますか？

**A:** はい、べき等性があるため、何度実行しても同じ結果になります。ただし、テキストフィールドへの追記は重複する可能性があるため、本番実行は1回のみを推奨します。

### Q4: 移行後、Assessmentページは使えなくなりますか？

**A:** 読み取り専用として引き続き使用できますが、編集はできません。編集は利用者編集ページから行ってください。

---

## 次のステップ

移行が完了したら:

1. ✅ データ移行完了
2. ⏳ Assessmentページを完全廃止（リダイレクト設定）
3. ⏳ AuditLog活用強化（変更履歴UI追加）

---

## サポート

問題が発生した場合は、以下の情報を含めて報告してください:

- エラーメッセージ全文
- 実行したコマンド
- DRY RUN時の出力結果
- データベースのバージョン
