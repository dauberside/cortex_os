# SSOT整合性チェック表

**作成日**: 2026-03-02
**目的**: 画面/ルート/API/DB/帳票がどのSSOT（Single Source of Truth）を参照しているかを明確化し、データの重複や不整合を防ぐ

---

## 0. SSOT定義

| SSOT名            | モデル                                 | 役割                                                      | 状態                                   |
| ----------------- | -------------------------------------- | --------------------------------------------------------- | -------------------------------------- |
| **CareRecipient** | `CareRecipient`                        | 利用者の唯一の正。全ての表示・編集・印刷の中心            | ✅ 実装済み（正）                      |
| **Assessment**    | `Assessment`                           | アセスメント情報。参照のみ/段階廃止またはスナップショット | ⚠️ 参照専用（整理必要）                |
| **GuideRecord**   | `GuideRecord`                          | 外出支援記録（Do層）                                      | ✅ 実装済み                            |
| **ServiceRecord** | `ServiceRecord`                        | サービス提供実績（Fact層）                                | ✅ 実装済み（GuideRecordから自動生成） |
| **DailyLog**      | `DailyLog` + `DailyLogEntry`           | 業務日誌（Do層）                                          | ✅ 実装済み                            |
| **Unit**          | `Unit` + `UnitStaff` + `UnitRecipient` | ユニット管理                                              | ✅ 実装済み                            |
| **AuditLog**      | `AuditLog`                             | 監査ログ（横断）                                          | ✅ 実装済み                            |

---

## 1. 画面ルート × SSOT参照マップ

### 1.1 利用者管理（Recipient）

| ルート                                   | 画面名                 | 参照SSOT               | 編集SSOT      | 備考                                         | 状態        |
| ---------------------------------------- | ---------------------- | ---------------------- | ------------- | -------------------------------------------- | ----------- |
| `/recipients`                            | 利用者一覧             | CareRecipient          | -             | 検索・CSV出力                                | ✅ 実装済み |
| `/recipients/new`                        | 利用者新規作成         | -                      | CareRecipient | CSV一括取込も可能                            | ✅ 実装済み |
| `/recipients/[id]`                       | 利用者詳細             | CareRecipient          | -             | タブ構造（基本情報/支援記録/ガイド記録）     | ✅ 実装済み |
| `/recipients/[id]/edit`                  | 利用者編集             | CareRecipient          | CareRecipient | フルフォーム編集                             | ✅ 実装済み |
| `/recipients/[id]/print/face`            | フェイスシート印刷     | **CareRecipient のみ** | -             | 紙帳票再現                                   | ✅ 実装済み |
| `/recipients/[id]/print/assessment`      | アセスメントシート印刷 | **CareRecipient のみ** | -             | 紙帳票再現（Assessmentテーブルは参照しない） | ✅ 実装済み |
| `/recipients/[id]/support-profile/print` | サポート基本情報票印刷 | **CareRecipient のみ** | -             | ガイドヘルプ用帳票（2枚構成）                | ✅ 実装済み |

**重要**: 印刷帳票は全て **CareRecipient のみ** を参照する。Assessmentテーブルは参照しない。

---

### 1.2 ガイド記録（GuideRecord - Do層）

| ルート                                   | 画面名         | 参照SSOT                | 編集SSOT    | 備考                                         | 状態        |
| ---------------------------------------- | -------------- | ----------------------- | ----------- | -------------------------------------------- | ----------- |
| `/recipients/[id]/guide`                 | ガイド記録一覧 | GuideRecord             | -           | 利用者ごとの外出支援記録                     | ✅ 実装済み |
| `/recipients/[id]/guide/new`             | ガイド記録作成 | CareRecipient（氏名等） | GuideRecord | DRAFT状態で作成                              | ✅ 実装済み |
| `/recipients/[id]/guide/[recordId]`      | ガイド記録詳細 | GuideRecord             | -           | 状態バッジ表示                               | ✅ 実装済み |
| `/recipients/[id]/guide/[recordId]/edit` | ガイド記録編集 | GuideRecord             | GuideRecord | DRAFT時のみ編集可（SUBMITTED後は差戻し必須） | ✅ 実装済み |

**データフロー**:

- GuideRecord（DRAFT） → 提出 → GuideRecord（SUBMITTED） → **ServiceRecord自動生成（upsert）**
- 承認時: GuideRecord（APPROVED） + ServiceRecord（isApproved=true）
- 差戻し時: GuideRecord（DRAFT）に戻る、ServiceRecordは保持

---

### 1.3 サービス提供実績（ServiceRecord - Fact層）

| ルート                  | 画面名   | 参照SSOT      | 編集SSOT | 備考                      | 状態        |
| ----------------------- | -------- | ------------- | -------- | ------------------------- | ----------- |
| `/service-records`      | 実績一覧 | ServiceRecord | -        | 全利用者の実績を表示      | ✅ 実装済み |
| `/service-records/[id]` | 実績詳細 | ServiceRecord | -        | GuideRecordとの紐付け表示 | ✅ 実装済み |

**編集方針**: ServiceRecordは **GuideRecordから自動生成** されるため、直接編集UIは提供しない（将来的に手動補正が必要な場合は要検討）

---

### 1.4 業務日誌（DailyLog - Do層）

| ルート                    | 画面名       | 参照SSOT                         | 編集SSOT                 | 備考                             | 状態        |
| ------------------------- | ------------ | -------------------------------- | ------------------------ | -------------------------------- | ----------- |
| `/units`                  | ユニット一覧 | Unit                             | -                        | -                                | ✅ 実装済み |
| `/units/[id]`             | ユニット詳細 | Unit + UnitStaff + UnitRecipient | -                        | 所属職員・利用者一覧             | ✅ 実装済み |
| `/units/[id]/log`         | 業務日誌一覧 | DailyLog                         | -                        | ユニット単位の日誌               | ✅ 実装済み |
| `/units/[id]/log/new`     | 業務日誌作成 | Unit, CareRecipient              | DailyLog + DailyLogEntry | ユニット利用者全員分の記録を作成 | ✅ 実装済み |
| `/units/[id]/log/[logId]` | 業務日誌詳細 | DailyLog + DailyLogEntry         | DailyLog + DailyLogEntry | 編集可能                         | ✅ 実装済み |

---

### 1.5 監査ログ（AuditLog - 横断）

| ルート             | 画面名       | 参照SSOT | 編集SSOT | 備考             | 状態        |
| ------------------ | ------------ | -------- | -------- | ---------------- | ----------- |
| `/audit-logs`      | 監査ログ一覧 | AuditLog | -        | 全操作履歴を表示 | ✅ 実装済み |
| `/audit-logs/[id]` | 監査ログ詳細 | AuditLog | -        | -                | ✅ 実装済み |

---

### 1.6 その他

| ルート            | 画面名           | 参照SSOT                             | 編集SSOT     | 備考                   | 状態        |
| ----------------- | ---------------- | ------------------------------------ | ------------ | ---------------------- | ----------- |
| `/dashboard`      | ダッシュボード   | CareRecipient, GuideRecord, DailyLog | -            | 統計表示               | ✅ 実装済み |
| `/incidents`      | インシデント一覧 | CareIncident                         | -            | 事故・ヒヤリハット管理 | ✅ 実装済み |
| `/incidents/[id]` | インシデント詳細 | CareIncident                         | CareIncident | -                      | ✅ 実装済み |

---

## 2. tRPCルーター × SSOT参照マップ

| ルーター           | 主要エンドポイント                                              | 参照SSOT                         | 編集SSOT                            | 備考                                         |
| ------------------ | --------------------------------------------------------------- | -------------------------------- | ----------------------------------- | -------------------------------------------- |
| `recipient.ts`     | list, get, create, update, delete, bulkUpsert                   | CareRecipient                    | CareRecipient                       | 利用者CRUD                                   |
| `assessment.ts`    | get, upsert                                                     | Assessment                       | Assessment                          | ⚠️ 段階的に廃止予定（CareRecipientへ統合）   |
| `guideRecord.ts`   | list, get, create, update, delete, submit, approve, backToDraft | GuideRecord                      | GuideRecord → ServiceRecord（自動） | ワークフロー管理                             |
| `serviceRecord.ts` | list, get                                                       | ServiceRecord                    | -                                   | 実績は自動生成のため、編集エンドポイントなし |
| `dailyLog.ts`      | list, get, create, update, delete                               | DailyLog + DailyLogEntry         | DailyLog + DailyLogEntry            | 業務日誌CRUD                                 |
| `unit.ts`          | list, get, create, update, delete                               | Unit + UnitStaff + UnitRecipient | Unit + UnitStaff + UnitRecipient    | ユニット管理                                 |
| `auditLog.ts`      | list, get, create                                               | AuditLog                         | AuditLog                            | 監査ログ記録・参照                           |

---

## 3. データベースモデル × SSOT整合性

### 3.1 CareRecipient（利用者の正）

**フィールド構成**:

- **基本プロフィール**: 氏名、生年月日、住所、連絡先等
- **アセスメント情報**: 障害名、服薬、ADL、コミュニケーション、こだわり等
- **外出傾向**: 外出先パターン、グループプラン等
- **Phase 1/2拡張**: 感覚過敏、趣味、人柄、緊急連絡先（JSON）、家族構成（JSON）等

**リレーション**:

- 1:1 Assessment（⚠️ 段階廃止予定）
- 1:N GuideRecord（外出支援記録）
- 1:N ServiceRecord（サービス提供実績）
- 1:N DailyLogEntry（業務日誌明細）
- 1:N UnitRecipient（ユニット所属）

**状態**: ✅ 正（SSOT）として確立

---

### 3.2 Assessment（アセスメント - 段階廃止予定）

**現状**:

- CareRecipientと1:1の関係
- ADL、コミュニケーション、排泄ケア等のフィールドを保持

**問題点**:

- CareRecipientと重複するフィールドが多数存在
- どちらを「正」とするかが曖昧

**方針**:

1. **短期（Phase A）**: Assessmentは **参照専用** とし、新規編集はCareRecipientで行う
2. **中期（Phase B）**: Assessmentを **スナップショット** として扱う（過去のアセスメント履歴保存用）
3. **長期（Phase C）**: Assessmentテーブルを廃止し、CareRecipientに完全統合

**状態**: ⚠️ 整理が必要

---

### 3.3 GuideRecord（外出支援記録 - Do層）

**状態遷移**:

- DRAFT（下書き） → SUBMITTED（提出済み）

**レビューフラグ**:

- `reviewedAt`, `reviewedBy`（LEAD/MANAGER用）

**ServiceRecordとの関係**:

- GuideRecordがSUBMITTED状態に遷移した際、ServiceRecordを **upsert** で自動生成
- `guideRecordId`で1:1紐付け

**状態**: ✅ 実装済み

---

### 3.4 ServiceRecord（サービス提供実績 - Fact層）

**生成元**:

- GuideRecordから自動生成（upsert）

**承認状態**:

- `isApproved`, `approvedAt`, `approvedBy`（GuideRecordのAPPROVED時に同期）

**編集可否**:

- 原則、ServiceRecordは直接編集しない
- 修正が必要な場合は、GuideRecordを差戻し → 再提出

**状態**: ✅ 実装済み

---

### 3.5 DailyLog + DailyLogEntry（業務日誌 - Do層）

**構造**:

- DailyLog: ユニット・シフト単位のヘッダー
- DailyLogEntry: 利用者ごとの明細（バイタル、食事、排泄、服薬等）

**ServiceRecordとの関係**:

- 将来的にDailyLogからServiceRecordを自動生成する可能性あり（Phase C）

**状態**: ✅ 実装済み

---

## 4. 帳票 × SSOT参照マップ

| 帳票名                 | 参照SSOT               | 出力形式     | 備考                           | 状態        |
| ---------------------- | ---------------------- | ------------ | ------------------------------ | ----------- |
| **フェイスシート**     | **CareRecipient のみ** | A4縦 3ページ | Assessmentテーブルは参照しない | ✅ 実装済み |
| **アセスメントシート** | **CareRecipient のみ** | A4縦 2ページ | Assessmentテーブルは参照しない | ✅ 実装済み |
| **サポート基本情報票** | **CareRecipient のみ** | A4縦 2ページ | ガイドヘルプ用（2022年8月版）  | ✅ 実装済み |

**重要原則**: 全ての印刷帳票は **CareRecipient のみ** を参照する。Assessmentテーブルは一切参照しない。

---

## 5. 問題点と改善提案

### 5.1 🔴 重大: Assessment vs CareRecipient の重複

**問題**:

- CareRecipientとAssessmentに同じフィールドが存在（ADL、服薬、コミュニケーション等）
- どちらを「正」とするかが要件で明記されていない
- 旧ルート `/recipients/[id]/assessment/page.tsx` が削除されたが、要件書には残っている可能性

**改善提案**:

1. **要件書の更新**: 「Assessmentは参照専用/段階廃止」と明記
2. **データ移行**: 既存Assessmentデータを段階的にCareRecipientへ統合
3. **APIの整理**: `assessment.ts`ルーターを参照専用に制限（updateエンドポイントを削除）

**優先度**: Must

---

### 5.2 🟡 中程度: GuideRecord → ServiceRecord の自動生成ロジックの可視化

**問題**:

- GuideRecordがSUBMITTED時にServiceRecordを自動生成するロジックが、要件書に詳細記載されているが、実装コードとの照合が必要

**改善提案**:

1. **トランザクション処理の明示**: `guideRecord.ts`のsubmit mutationでトランザクション境界を明確化
2. **エラーハンドリング**: ServiceRecord生成失敗時のロールバック処理を要件書に追記
3. **テストケース**: 自動生成ロジックの受け入れ基準を追加

**優先度**: High

---

### 5.3 🟡 中程度: DailyLog → ServiceRecord の自動生成（Phase C）

**問題**:

- 業務日誌（DailyLog）からサービス提供実績（ServiceRecord）を自動生成する要件が、REQUIREMENTS_UNIT_JOURNAL.mdに記載されているが、実装は未着手

**改善提案**:

1. **Phase分け**: Phase Cとして明確にスケジュール化
2. **データマッピング**: DailyLogEntryのどのフィールドをServiceRecordにマッピングするかを定義
3. **重複防止**: GuideRecordとDailyLogの両方からServiceRecordが生成される場合の整合性確保

**優先度**: Medium（Phase C）

---

### 5.4 🟢 軽度: CSV出力の参照元の明確化

**問題**:

- 利用者一覧のCSV出力が、CareRecipient + Assessment の両方を参照している可能性

**改善提案**:

1. **CSV出力仕様の明記**: `src/lib/csv.ts`がCareRecipient のみを参照することを要件書に明記
2. **テスト**: CSV出力結果がCareRecipientのフィールドのみであることを確認

**優先度**: Medium

---

## 6. アクションアイテム

| 項目                                                                     | 優先度 | 担当 | 期限          | 状態    |
| ------------------------------------------------------------------------ | ------ | ---- | ------------- | ------- |
| 1. Assessment段階廃止の方針を要件書に明記                                | Must   | TL   | 即時          | ⬜ TODO |
| 2. 印刷帳票が全てCareRecipientのみを参照することを要件書に明記           | Must   | TL   | 即時          | ⬜ TODO |
| 3. GuideRecord → ServiceRecord自動生成ロジックのテストケース追加         | High   | Dev  | 1週間         | ⬜ TODO |
| 4. DailyLog → ServiceRecord自動生成のデータマッピング定義（Phase C）     | Medium | TL   | Phase C開始時 | ⬜ TODO |
| 5. CSV出力がCareRecipientのみを参照することを確認                        | Medium | Dev  | 1週間         | ⬜ TODO |
| 6. `/recipients/[id]/assessment/page.tsx` が削除されたことを要件書に反映 | Medium | TL   | 即時          | ⬜ TODO |

---

## 7. まとめ

### ✅ 確立されているSSOT

- **CareRecipient**: 利用者情報の唯一の正として確立
- **GuideRecord**: 外出支援記録（Do層）として確立
- **ServiceRecord**: サービス提供実績（Fact層）として確立（GuideRecordから自動生成）
- **DailyLog**: 業務日誌（Do層）として確立

### ⚠️ 整理が必要なSSOT

- **Assessment**: CareRecipientとの重複が多数。段階廃止の方針を要件書に明記し、データ移行を計画する必要がある

### 🔧 今後の改善方針

1. **要件書の更新**: Assessmentの扱いを明確化
2. **データ移行**: 既存AssessmentデータをCareRecipientへ統合
3. **テスト強化**: 自動生成ロジック（GuideRecord → ServiceRecord）のテストケース追加
4. **Phase C計画**: DailyLog → ServiceRecord自動生成の設計

---

**最終更新日**: 2026-03-02
**レビュー担当**: TL（兼任）
