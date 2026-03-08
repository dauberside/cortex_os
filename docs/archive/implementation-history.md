# 利用者登録フォーム改善 - 実装履歴

最終更新: 2026-02-25

---

## ✅ 完了した改善項目

### 1. MobilitySupport（同行援護）フィルタの実装

**実装日**: 2026-02-25

**目的**: 現在対応していない「同行援護」サービスをUI上で非表示にする

**実装内容**:

1. **`src/components/recipients/RecipientFormComponents.tsx`** にallowlistを追加:

```typescript
// 現在有効なサービス種別（同行援護は対応準備中のため非表示）
export const ENABLED_SERVICE_TYPES = [
  "HomeHelp",
  "VisitingCare",
  "BehaviorSupport",
  // "MobilitySupport", // 対応準備中
  "DayCare",
  "ShortStay",
  "GroupHome",
] as const;

// フィルタ済みサービス種別を取得するヘルパー
export const getEnabledServiceTypes = () =>
  SERVICE_TYPES.filter((type) =>
    ENABLED_SERVICE_TYPES.includes(type.value as any)
  );
```

2. **適用済みページ**:
   - ✅ `src/app/recipients/new/page.tsx` - `getEnabledServiceTypes().map()` に変更
   - ✅ `src/app/recipients/[id]/edit/page.tsx` - `getEnabledServiceTypes().map()` に変更

**効果**:

- `/recipients/new` と `/recipients/[id]/edit` の両方で「同行援護」が非表示になった
- 将来同行援護を有効化する場合は、`ENABLED_SERVICE_TYPES` 配列の `// "MobilitySupport",` のコメントを外すだけで全画面に反映される

**変更ファイル**:

- `src/components/recipients/RecipientFormComponents.tsx`
- `src/app/recipients/new/page.tsx`
- `src/app/recipients/[id]/edit/page.tsx`

---

### 2. 手帳情報の重複解消

**実装日**: 2026-02-25

**目的**: 「制度情報」セクションと「サポート基本情報」セクションで重複している手帳情報を統一

**実装内容**:

1. **削除したフィールド**:
   - `handbookType`（手帳種別）- サポート基本情報セクションから削除
   - `handbookGrade`（手帳等級）- サポート基本情報セクションから削除

2. **追加した説明文** (両ページ共通):

```tsx
{
  /* 手帳情報の参照 */
}
<div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
  <p className="text-sm text-blue-900">
    <strong>📖 手帳情報について</strong>
    <br />
    手帳の種別・等級は上記「制度情報（手帳・年金/手当・精神科/発達・介護保険）」セクションに入力してください。
    <br />
    身体障害者手帳、療育手帳、精神障害者保健福祉手帳の3種類に対応しています。
  </p>
</div>;
```

**効果**:

- 手帳情報の入力箇所が「制度情報」セクションに統一された（SSOT原則）
- データの不整合リスクが解消
- ユーザーに対して明確な案内が表示される

**変更ファイル**:

- `src/app/recipients/new/page.tsx`
- `src/app/recipients/[id]/edit/page.tsx`

---

## 🔄 進行中の改善項目

なし

---

## 📋 未着手の改善項目

### 3. 緊急連絡先の続柄を必須化するかの判断

~~削除済み - 上記の「2. 手帳情報の重複解消」を参照~~

---

### 緊急連絡先の続柄を必須化するかの判断

**現状**:

- `emergencyContact`（電話番号）: 任意
- `emergencyRelation`（続柄）: 任意

**検討事項**:

- 電話番号のみ必須にするか
- 電話番号 + 続柄の両方を必須にするか

**推奨**: 電話番号のみ必須、続柄は推奨（任意）

- 理由: 電話番号があれば緊急時の連絡は可能。続柄は有用だが入力負担とのバランスで推奨レベルで十分

**優先度**: 低

---

### 必須フィールドの追加

**現状**: 必須フィールドは3つのみ（氏名/生年月日/性別）

**追加候補**:

- `emergencyContact` - 緊急連絡先電話番号
- `livingType` - 居住形態
- `serviceTypes` - 利用サービス種別（1つ以上）

**優先度**: 中

---

## 📝 実装メモ

### フィールド名の確認結果（2026-02-25時点）

実際のコードで確認した結果、以下のフィールド名で実装されている：

**✅ 存在確認済み**:

- `emergencyContact` - 緊急連絡先電話番号（基本情報セクション）
- `emergencyRelation` - 緊急連絡先続柄（基本情報セクション）
- `livingType` - 居住形態（支援基本情報セクション）
- `serviceTypes` - 利用サービス種別（サービス情報セクション）

**📝 運用上の注意**:

- `unitId` - 登録時には入力せず、後から設定する運用のため、新規登録フォームには含まれていない

---

## 🎯 次のアクション

1. **手帳情報の重複解消**を実装する
2. 運用開始後のフィードバックを元に必須フィールドの追加を検討する

---

**作成者**: Claude Code
**最終更新日**: 2026-02-25
**プロジェクト**: Cortex OS - 利用者登録フォーム改善
