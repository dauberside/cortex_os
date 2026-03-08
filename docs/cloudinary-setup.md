# Cloudinary セットアップガイド

このドキュメントでは、Cloudinaryの設定手順を説明します。

## 1. Cloudinaryアカウントの作成

1. [Cloudinary](https://cloudinary.com/)にアクセス
2. 「Sign Up for Free」をクリック
3. 必要情報を入力してアカウントを作成

## 2. API認証情報の取得

1. Cloudinaryダッシュボードにログイン
2. 左メニューから「Dashboard」を選択
3. 「Product Environment Credentials」セクションに以下の情報が表示されます：
   - **Cloud Name**: `your-cloud-name`
   - **API Key**: `123456789012345`
   - **API Secret**: `abcdefghijklmnopqrstuvwxyz`

## 3. 環境変数の設定

`.env`ファイルに以下を追加してください：

```bash
# Cloudinary (画像アップロード)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="123456789012345"
CLOUDINARY_API_SECRET="abcdefghijklmnopqrstuvwxyz"
```

**重要**: `.env`ファイルは`.gitignore`に含まれているため、Gitにコミットされません。

## 4. Vercelへのデプロイ時の設定

Vercelダッシュボードで以下の環境変数を設定してください：

1. プロジェクトの「Settings」→「Environment Variables」にアクセス
2. 以下の3つの変数を追加：
   - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`

## 5. アップロードプリセットの設定（任意）

より細かい制御が必要な場合：

1. Cloudinaryダッシュボードで「Settings」→「Upload」にアクセス
2. 「Upload presets」セクションで「Add upload preset」をクリック
3. Preset名を設定（例: `cortex_os_recipients`）
4. 以下の設定を推奨：
   - **Signing Mode**: Signed（セキュアなアップロード）
   - **Folder**: `recipients`（画像を整理）
   - **Max file size**: 5 MB
   - **Allowed formats**: jpg, png, webp

## 6. 無料プランの制限

- ストレージ: 25 GB
- 帯域幅: 25 GB/月
- 変換: 25,000 回/月

通常の利用であれば十分です。

## トラブルシューティング

### エラー: "Invalid cloud_name"

→ `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`が正しく設定されているか確認してください。

### エラー: "Invalid API credentials"

→ `CLOUDINARY_API_KEY`と`CLOUDINARY_API_SECRET`が正しいか確認してください。

### アップロードが失敗する

→ ブラウザのコンソールでエラーメッセージを確認し、ファイルサイズが5MB以下か確認してください。
