# ガイド記録 印刷フォーマット要件定義書

## 1. 概要

「ともにネット 外出サポートの記録」の印刷フォーマットを2種類実装する：

- **利用者控え**: ご家族向けのシンプルな記録（個人情報保護・見やすさ重視）
- **事務所用**: 事業所管理用の詳細記録（完全な情報記録）

## 2. 共通仕様

### 2.1 用紙設定

- **用紙サイズ**: A4縦（210mm × 297mm）
- **余白**: 上下10mm、左右12mm
- **コンテンツ幅**: 186mm
- **フォント**: MS Gothic / Yu Gothic / Hiragino Sans
- **基本フォントサイズ**: 8.5pt
- **行間**: 1.2

### 2.2 白銀比の適用

- A4用紙自体が白銀比（1:√2）に基づいているため、余白も調和を保つ

## 3. 利用者控えフォーマット（viewType="family"）

### 3.1 目的

- ご家族が見て分かりやすい記録
- 個人情報の保護（金銭の詳細は省略）
- 外出の様子を伝えることに重点

### 3.2 レイアウト構成

#### ヘッダー部

```
【左側】ともにネット　外出サポートの記録（利用者控）
【右側】印（12mm×12mm の枠）
```

#### 基本情報セクション

- 利用者名: ○○ 様
- サポーター: ○○
- 日付時刻: yyyy年 MM月 dd日（E） HH:mm 〜 HH:mm

#### メインコンテンツ（左右2カラム構成）

**【左カラム 38%】金銭管理表**

```
最初にあったお金 【空欄】円

交通費（6行）
  【空欄】円
  【空欄】円
  【空欄】円
  【空欄】円
  【空欄】円
  【空欄】円

飲食費（4行）
  【空欄】円
  【空欄】円
  【空欄】円
  【空欄】円

その他（4行）
  【空欄】円
  【空欄】円
  【空欄】円
  【空欄】円

サポーター食事代 【空欄】円
合計 【計算値】円
のこったお金 【残金】円
```

**【右カラム 62%】行先・経路・様子**

```
行先 【destination】

集合【　】 | 解散【　】

経路【集→　　　　　　　　散】
→　　→　　→
→　　→　　→
→　　→　　→

食事内容 【空欄】

様子（80mm、罫線入り）
【userCondition】
```

#### 下部セクション（食事・服薬）

```
・食事内容（　　）　□全量　□半量　□食べず
・服薬　□あり　□なし　　服薬時間（　：　）
```

### 3.3 CSS仕様（利用者控え）

```css
/* 行高 */
.money-row: 5.5mm
.destination-row: 5.5mm
.assembly-row: 5.5mm
.route-row: 5.5mm
.meal-row: 5.5mm

/* 様子枠 */
.condition-box:
  min-height: 80mm
  罫線間隔: 5mm
  font-size: 8.5pt
  line-height: 1.5
```

## 4. 事務所用フォーマット（viewType="office"）

### 4.1 目的

- 事業所の記録管理・監査対応
- 完全な情報の保存
- 特記事項・手順書の記録

### 4.2 レイアウト構成

#### ヘッダー〜メインコンテンツ

利用者控えと同じ構成

#### 下部セクション（事務所用追加項目）

**食事・服薬セクション**
利用者控えと同じ

**サポート中の特記事項（事務所報告用）**

```
【見出し】サポート中の特記事項（事務所報告用）

【記入欄】
min-height: 40mm
罫線間隔: 5mm
内容: notes フィールドの値
```

**手順書**

```
【見出し】手順書

【記入欄】
min-height: 40mm
罫線間隔: 5mm
内容: 空欄（手書き用）
```

**インシデントチェック**

```
ありに○（□パニック / □発作 / □事故）
```

### 4.3 CSS仕様（事務所用）

```css
.office-notes-box:
  min-height: 40mm
  罫線間隔: 5mm
  font-size: 8.5pt
  line-height: 1.5
  background-image: repeating-linear-gradient(
    transparent,
    transparent 5mm,
    #ddd 5mm,
    #ddd calc(5mm + 0.5pt)
  )

.incident-checks:
  margin-top: 0.5mm
  font-size: 8pt
```

## 5. 技術仕様

### 5.1 印刷CSS

```css
@media print {
  @page {
    size: A4 portrait;
    margin: 10mm 12mm 10mm 12mm;
  }

  .no-print {
    display: none !important;
  }

  .print-container {
    width: 186mm;
    font-family: "MS Gothic", "Yu Gothic", "Hiragino Sans";
    font-size: 8.5pt;
    line-height: 1.2;
  }
}
```

### 5.2 レイアウト構造

```typescript
// 左右2カラム
.two-column-layout {
  display: table;
  width: 100%;
  border-spacing: 0;
}

.left-column {
  display: table-cell;
  width: 38%;
  vertical-align: top;
  padding-right: 2mm;
}

.right-column {
  display: table-cell;
  width: 62%;
  vertical-align: top;
}
```

### 5.3 罫線入りテキストエリア

```css
background-image: repeating-linear-gradient(
  transparent,
  transparent 5mm,
  #ddd 5mm,
  #ddd calc(5mm + 0.5pt)
);
```

## 6. データマッピング

### 6.1 利用者控えで表示する項目

- ✅ 利用者名（recipient.name）
- ✅ サポーター名（user.name）
- ✅ 日付時刻（startedAt, endedAt）
- ✅ 行先（destination）
- ✅ 様子（userCondition）
- ✅ 残金（returnedAmount）
- ✅ 使用金額（handedAmount - returnedAmount）
- ❌ 金銭の詳細内訳（省略）
- ❌ 特記事項（省略）

### 6.2 事務所用で表示する項目

- ✅ 利用者控えの全項目
- ✅ 特記事項（notes）
- ✅ 手順書欄（空欄）
- ✅ インシデントチェック

## 7. 今後の拡張予定

### 7.1 利用者控えの改善（TODO）

- ご家族向けにさらに見やすいレイアウトを検討
- フォントサイズの最適化
- 色使いの検討（モノクロ印刷前提）

### 7.2 データ項目の追加（完了）

- ✅ 集合場所
- ✅ 解散場所
- ✅ 経路の詳細（複数経由地）
- ✅ 食事内容の詳細
- ✅ 服薬情報
- ✅ 金銭詳細内訳（交通費・飲食費・その他・サポーター食事代）

### 7.3 DBスキーマ拡張（完了）

```prisma
model GuideRecord {
  // 既存フィールド...

  // 追加完了フィールド
  assemblyLocation   String?   // 集合場所
  dismissalLocation  String?   // 解散場所

  route              Json?     @db.JsonB // 経路情報（配列）

  transportExpenses  Json?     @db.JsonB // 交通費内訳
  foodExpenses       Json?     @db.JsonB // 飲食費内訳
  otherExpenses      Json?     @db.JsonB // その他費用内訳
  staffMealExpense   Int?                // サポーター食事代

  mealContent        String?   // 食事内容
  mealAmount         String?   // 全量/半量/食べず

  medicationTaken    Boolean?  // 服薬あり/なし
  medicationTime     String?   // 服薬時間

  procedure          String?   @db.Text // 手順書
  incidents          Json?     @db.JsonB // インシデント情報
}
```

## 8. 印刷実装の完了状況

### 8.1 完了項目

- ✅ A4サイズ対応
- ✅ 左右2カラムレイアウト
- ✅ 金銭管理表（交通費6行、飲食費4行、その他4行）
- ✅ 行先・集合/解散・経路セクション
- ✅ 経路グリッド（3×3、矢印表示）
- ✅ 様子枠（罫線入り、80mm）
- ✅ 食事・服薬セクション
- ✅ 事務所用: 特記事項（40mm）
- ✅ 事務所用: 手順書（40mm）
- ✅ 事務所用: インシデントチェック
- ✅ 白銀比の余白設定

### 8.2 実装完了項目（フォーム改正）

- ✅ 集合/解散の場所入力
- ✅ 経路の詳細入力（動的追加・削除）
- ✅ 金銭詳細内訳（交通費6行、飲食費4行、その他4行、サポーター食事代）
- ✅ 食事内容・食事量の入力
- ✅ 服薬情報の入力

### 8.3 未実装項目（次回以降）

- ❌ 利用者控えの独自デザイン調整
- ❌ 印刷フォーマットへの実データ反映

## 9. 備考

- 現在の実装は「紙フォーマットの再現」を優先
- 利用者控えは今後、ご家族の視点で再デザインが必要
- 事務所用は監査対応を考慮した完全な記録を保持
