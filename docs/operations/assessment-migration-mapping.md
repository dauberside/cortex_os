# Assessment → CareRecipient マッピング仕様

## 概要

Assessmentテーブルのデータを CareRecipient テーブルに統合するためのマッピング定義。

## マッピング方針

- **正（Single Source of Truth）**: CareRecipientを正とする
- **既存データの扱い**: Assessmentのデータは移行後も参照用に残す（削除しない）
- **マイグレーション戦略**: 既存のCareRecipientデータを上書きせず、Assessmentデータで補完する

---

## 項目マッピング一覧

### 1. ADL（日常生活動作）

| Assessment    | CareRecipient | 備考                                    | 移行方法                     |
| ------------- | ------------- | --------------------------------------- | ---------------------------- |
| `adlMovement` | ❌ なし       | CareRecipientには`mobilityMethod`がある | 移行不要（別の意味）         |
| `adlEating`   | ❌ なし       | 食事形態は`eatingStyle`で管理           | 移行不要                     |
| `adlToilet`   | ❌ なし       | 排泄は`toiletAssistMethod`で管理        | 移行不要                     |
| `adlBathing`  | ❌ なし       | 入浴情報なし                            | **新規フィールド追加を検討** |
| `adlDressing` | ❌ なし       | 更衣情報なし                            | **新規フィールド追加を検討** |
| `adlGrooming` | ❌ なし       | 整容情報なし                            | **新規フィールド追加を検討** |

**判定**: ADL項目は構造が異なるため、**移行しない**（必要に応じてフィールド追加を検討）

---

### 2. コミュニケーション

| Assessment    | CareRecipient    | マッピング         | 移行方法                                     |
| ------------- | ---------------- | ------------------ | -------------------------------------------- |
| `commMethod`  | ❌ なし          |                    | **新規フィールド追加**または`commNote`に統合 |
| `commVision`  | ❌ なし          |                    | **新規フィールド追加を検討**                 |
| `commHearing` | ❌ なし          |                    | **新規フィールド追加を検討**                 |
| `commSpeech`  | ❌ なし          |                    | **新規フィールド追加を検討**                 |
| -             | `commVerbal`     | 会話・発語の詳細   | CareRecipientにのみ存在                      |
| -             | `commGesture`    | ジェスチャーの詳細 | CareRecipientにのみ存在                      |
| -             | `commExpression` | 表情での表現       | CareRecipientにのみ存在                      |
| -             | `commRequest`    | 要求の表現         | CareRecipientにのみ存在                      |
| -             | `commRefusal`    | 拒否の表現         | CareRecipientにのみ存在                      |
| -             | `commNote`       | 留意点             | CareRecipientにのみ存在                      |

**判定**: Assessment側のコミュニケーション項目は、CareRecipient側の詳細項目とは構造が異なる。

- `commMethod` → `commNote`に統合して移行
- 視覚・聴覚・発語は**保留**（必要に応じてフィールド追加）

---

### 3. 行動特性

| Assessment    | CareRecipient     | マッピング  | 移行方法               |
| ------------- | ----------------- | ----------- | ---------------------- |
| `lifeRhythm`  | ❌ なし           |             | **`otherNotes`に統合** |
| `hobbies`     | `hobbies`         | ✅ 完全一致 | **直接マッピング**     |
| `personality` | `personalityNote` | ✅ ほぼ一致 | **直接マッピング**     |

**判定**:

- `hobbies` → `hobbies`（既存データがない場合のみ上書き）
- `personality` → `personalityNote`（既存データがない場合のみ上書き）
- `lifeRhythm` → `otherNotes`に追記形式で統合

---

### 4. 注意事項

| Assessment      | CareRecipient | マッピング | 移行方法                             |
| --------------- | ------------- | ---------- | ------------------------------------ |
| `cautions`      | `otherNotes`  | ⚠️ 類似    | **統合**（既存の`otherNotes`に追記） |
| `emergencyNote` | ❌ なし       |            | **`otherNotes`に統合**               |

**判定**:

- `cautions` + `emergencyNote` → `otherNotes`に統合

---

### 5. 服薬情報

| Assessment          | CareRecipient | マッピング | 移行方法                       |
| ------------------- | ------------- | ---------- | ------------------------------ |
| `medicationDetails` | `healthNote`  | ⚠️ 類似    | **統合**（`healthNote`に追記） |

**判定**:

- `medicationDetails` → `healthNote`に統合

---

### 6. 排泄ケア設定

| Assessment        | CareRecipient     | マッピング  | 移行方法                                       |
| ----------------- | ----------------- | ----------- | ---------------------------------------------- |
| `toiletCareTypes` | ❌ なし           |             | **新規フィールド追加**または`toiletNote`に統合 |
| `toiletInterval`  | `toiletFrequency` | ⚠️ 類似     | **直接マッピング**                             |
| `toiletNote`      | `toiletNote`      | ✅ 完全一致 | **直接マッピング（マージ）**                   |

**判定**:

- `toiletCareTypes` → `toiletNote`に統合（配列→文字列変換）
- `toiletInterval` → `toiletFrequency`（既存データがない場合のみ）
- `toiletNote` → `toiletNote`（マージ）

---

### 7. その他

| Assessment        | CareRecipient | マッピング | 移行方法               |
| ----------------- | ------------- | ---------- | ---------------------- |
| `familyStructure` | ❌ なし       |            | **`otherNotes`に統合** |
| `supportSystem`   | ❌ なし       |            | **`otherNotes`に統合** |

**判定**:

- `familyStructure` + `supportSystem` → `otherNotes`に統合

---

## マイグレーション戦略

### フェーズ1: データ補完（非破壊的）

既存のCareRecipientデータを保護しながら、Assessmentデータで補完する。

```typescript
// 例: hobbiesフィールド
careRecipient.hobbies = careRecipient.hobbies || assessment.hobbies;
```

### フェーズ2: データ統合（追記形式）

複数フィールドを1つに統合する場合、既存データを保持しつつ追記。

```typescript
// 例: otherNotes への統合
const additionalNotes = [];
if (assessment.lifeRhythm)
  additionalNotes.push(`【生活リズム】\n${assessment.lifeRhythm}`);
if (assessment.cautions)
  additionalNotes.push(`【特記事項】\n${assessment.cautions}`);
if (assessment.emergencyNote)
  additionalNotes.push(`【緊急時対応】\n${assessment.emergencyNote}`);

if (additionalNotes.length > 0) {
  const newContent = additionalNotes.join("\n\n");
  careRecipient.otherNotes = careRecipient.otherNotes
    ? `${careRecipient.otherNotes}\n\n---\n【Assessmentからの移行データ】\n${newContent}`
    : newContent;
}
```

---

## 移行対象フィールドまとめ

### 直接マッピング（上書きなし）

- `hobbies` → `hobbies`
- `personality` → `personalityNote`
- `toiletInterval` → `toiletFrequency`

### 統合マッピング（追記形式）

- `medicationDetails` → `healthNote`
- `toiletNote` → `toiletNote`（マージ）
- `lifeRhythm` + `cautions` + `emergencyNote` + `familyStructure` + `supportSystem` → `otherNotes`
- `commMethod` → `commNote`

### 新規フィールド追加を検討

- `toiletCareTypes` → 新フィールドまたは`toiletNote`に文字列化して統合
- ADL項目（`adlBathing`, `adlDressing`, `adlGrooming`）
- コミュニケーション項目（`commVision`, `commHearing`, `commSpeech`）

---

## 次のステップ

1. ✅ マッピング仕様作成 ← **完了**
2. ⏳ マイグレーションスクリプト作成
3. ⏳ テストデータでの検証
4. ⏳ 本番実行

---

## 注意事項

- **既存データの保護**: CareRecipientに既にデータがある場合は上書きしない
- **可逆性**: Assessmentテーブルは削除せず、参照用に残す
- **監査ログ**: マイグレーション実行時に監査ログを記録
- **バックアップ**: 実行前に必ずデータベースバックアップを取得
