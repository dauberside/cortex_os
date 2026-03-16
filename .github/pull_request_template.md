> このPRは CORTEX OS 実装時チェックリスト（L1）を基準に確認してください。
> 該当しない項目は未チェックのままで構いません。
> 該当するのに未確認の項目がある場合は、レビューで確認してください。

## 概要
- このPRで何を変更したかを簡潔に記載してください。
- 背景、目的、影響範囲があればあわせて記載してください。

## 変更内容
-
-
-

## 確認ポイント（実装時チェックリスト）

### 1. API / tRPC / Prisma
- [ ] input は zod で定義している
- [ ] 認証と認可の責務を分離している
- [ ] 複数テーブル更新・整合性必須処理は transaction を使用している
- [ ] response shape は select / include で明示している
- [ ] Create / Update / Delete が監査ログ対象か確認している
- [ ] not found の扱いが統一されている

### 2. データ取得 / Next.js
- [ ] 初期表示は RSC / fetch で扱うべきか確認している
- [ ] 動的操作は TanStack Query / mutation で扱っている
- [ ] use client は本当に必要な箇所に限定している
- [ ] loading.tsx / error.tsx / not-found.tsx の要否を確認している
- [ ] loading / error / empty state を用意している
- [ ] invalidate は最小粒度で実行している
- [ ] server truth 優先で状態同期している

### 3. フォーム
- [ ] RHF + Zod の利用を検討し、必要な箇所で適用している
- [ ] submit 中の disable により二重送信を防止している
- [ ] 送信前バリデーションを実装している
- [ ] 値変換は送信直前に実施している
- [ ] 成功時に toast → close / reset → invalidate / redirect の流れを整理している
- [ ] エラー表示の責務（field / form / toast）が明確である

### 4. 削除 / 監査
- [ ] confirm が必要な操作か確認している
- [ ] soft delete 対象か物理削除かを明確にしている
- [ ] 復元要件の有無を確認している
- [ ] toast 文言が既存ルールに沿っている
- [ ] 監査ログ必須対象か確認している
- [ ] onDelete / 関連削除の整合性を確認している

### 5. UI / 権限
- [ ] filter / sort / pagination / search params の必要性を確認している
- [ ] empty state / loading state を実装している
- [ ] RBAC が UI 層と API 層の両方で担保されている
- [ ] redirect 後の導線が自然である

## 動作確認
- [ ] ローカルで動作確認した
- [ ] 型チェックを通した
- [ ] lint / format を実行した
- [ ] 主要な成功系を確認した
- [ ] 主要な異常系を確認した

## 影響範囲
- [ ] UI のみ
- [ ] API のみ
- [ ] DB スキーマあり
- [ ] 権限影響あり
- [ ] 既存機能影響あり

## 補足
- レビュー時に特に見てほしい点
- 未対応事項
- 後続PRで対応する内容
