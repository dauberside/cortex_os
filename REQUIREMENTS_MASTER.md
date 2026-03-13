REQUIREMENTS_MASTER.md（統合版）目次案

0. ドキュメント運用ガバナンス（SSOT）

0.1 本書の位置づけ（Single Source of Truth）
0.2 用語・略語（Plan/Do/Fact/Safety、Recipient Hub、DailyLog、planItemRefs 等）
0.3 変更管理（RFC / Hotfix / レビュー頻度 / リリースゲート）
0.4 RACI（要件・設計・実装・運用・監査）
0.5 決定ログ（Decision Log）

**DL-001: Assessment編集機能の廃止 (2026-03-09)**
- **決定内容**: Assessmentテーブルの編集機能（upsert/delete mutation）を無効化
- **理由**:
  - 利用者基本情報（CareRecipient）とAssessmentで情報が重複し、メンテナンスコストが高い
  - 実運用では編集画面が存在せず、利用されていない
  - Assessmentデータは初期移行データとして存在するのみ
- **影響範囲**:
  - ✅ 残す: 参照API（getByRecipient/get）、印刷機能（/print/assessment）
  - ❌ 無効化: upsert mutation、delete mutation（エラー返却で無効化）
  - 📝 変更なし: CareRecipientテーブルで全情報を一元管理
- **実装**: `src/server/routers/assessment.ts` のupsert/deleteがFORBIDDENエラーを返す
- **将来計画**: データ移行後にAssessmentテーブル完全削除を検討

0.6 TBDレジスター（Blocker / 期限 / オーナー）
0.7 トレーサビリティ規約（要件ID → 設計 → テスト → 運用） ￼
0.8 実装状況ダッシュボード（Schema / Router / UI の一致を集約）
0.9 変更履歴（Changelog）

⸻

1. プロダクト概要

1.1 背景・課題（紙→デジタルのギャップ）
1.2 ゴール / 非ゴール（MVP と Phase 2+）
1.3 対象スコープ（単一事業所・Webアプリ・役割）
1.4 主要ユーザーと利用シーン（支援員 / リーダー / サビ管・管理者）
1.5 情報の「即確認」要件（紙ファイル同等の見渡し）

⸻

2. ドメイン骨格（Plan → Do → Fact → Safety）

2.1 レイヤ定義（各画面 / API / DB を必ず所属させる）
2.2 レイヤ間の紐付け方針
	•	Plan↔Do：planItemRefs（説明責任の起点）
	•	Do→Safety：majorEvent → Incident 起票
	•	Do→Fact：日誌→実績（重複入力回避）
2.3 ユニット運用の前提（GH / 居宅 / 重訪 / SS など拡張方針）

⸻

3. 運用フロー（RACI + タイムライン）※設計ブレ防止の基準

3.1 フェーズ別（即確認 / 記録 / 説明責任 / 保存・安全管理 / Safety）
3.2 役割別の責任（支援員R → リーダーA → サビ管A）
3.3 監査・説明責任の起点（Plan↔Do 紐付けの入力タイミング）
3.4 例：夜勤（基準日）と日跨ぎ運用（開始日を基準日とする）

⸻

4. 情報設計（Recipient Hub）

4.1 UX-Do-001 Recipient Hub（常時表示 + 深掘り導線）
4.2 「即確認」常時表示項目（4項目の定義）
	•	注意事項
	•	ADL
	•	服薬・禁忌
	•	連絡先（家族/主治医/緊急）
4.3 表示レイアウト方針（サマリー常時表示 + タブ）
4.4 タブ構成案
	•	情報表 / アセスメント / 支援計画
	•	日誌 / バイタル / 服薬 / 申し送り / 事故
4.5 一覧導線（利用者一覧 / ユニット一覧：検索・最近）

⸻

5. 機能要件（Functional Requirements）— レイヤ別

5A. Do（業務日誌）— ユニット日誌（DailyLog / DailyLogEntry）

FR-Do-010 ユニット（Unit）管理
FR-Do-020 職員所属（UnitStaff）管理（primary / temporary）
FR-Do-030 利用者所属（UnitRecipient）管理（在籍 / 退所）
FR-Do-040 業務日誌ヘッダー（DailyLog：logDate/shift/shiftStart/shiftEnd/担当者/申し送り/重大イベント）
FR-Do-050 利用者別記録（DailyLogEntry：状態/生活支援/服薬/外出/拒否/特記事項）
FR-Do-060 服薬スケジュール（MedicationSchedule）とチェックUI
FR-Do-070 申し送り（handover）と未確認管理
FR-Do-080 CSV入出力（利用者/ユニット/日誌：範囲・権限・フォーマット）
UX-Do-0xx 日跨ぎ入力（開始/終了、バリデーション、表示形式）

5B. Plan（個別支援計画）

FR-Plan-010 支援計画（SupportPlan）
FR-Plan-020 目標（Goal：長期/短期）
FR-Plan-030 支援項目（SupportItem：頻度/注意点）
FR-Plan-040 Plan↔Do 紐付けUI（planItemRefs：選択/複数/履歴）

5C. Fact（実績）

FR-Fact-010 サービス提供実績（ServiceDelivery）
FR-Fact-020 日誌→実績の二重入力防止導線
FR-Fact-030 集計（期間/ユニット/利用者/職員）

5D. Safety（安全）

FR-Safety-010 重大イベントフラグ（majorEvent）
FR-Safety-020 Incident 起票導線（業務日誌内別枠）
FR-Safety-030 リスクプロフィール（RiskProfile）
FR-Safety-040 行動エピソード（BehaviorEpisode）
FR-Safety-050 分析（件数推移、分類別、利用者別）

⸻

6. データ要件（Data Requirements）

6.1 データ分類（PII / 要配慮 / 高機微：事故・医療・服薬）
6.2 保存・削除ポリシー（論理削除 / アーカイブ / 保持期間）
6.3 監査証跡（更新者/更新日時/編集履歴/アクセスログ方針）
6.4 JSONカラム運用ルール（toiletRecords / medicationChecks / refusalRecords 等）
6.5 ID参照規約（planItemRefs 等の参照整合性）
### 6.6 DR-Fact-Settings-010 市ルール設定（TimeBandRule：時間帯定義）
**目的**：移動支援（MobilitySupport）の「日中 / 早朝・夜間」区分を運用者の記憶に依存させず、請求・監査で再現可能にする。
**背景**：小平市の移動支援は報酬単価が時間帯区分を持つ（単価表参照）。また、請求は毎月10日までに請求書・明細書・実績記録票を提出する運用であり、月次集計に耐える“ルールの固定”が必要。 [小平市：移動支援事業（請求）](https://www.city.kodaira.lg.jp/kurashi/094/094955.html?utm_source=chatgpt.com)

**データモデル（最小）**
- TimeBandRule
  - municipality: "Kodaira"（固定）
  - serviceKind: "MobilitySupport"（固定）
  - effectiveFrom: date（必須）
  - effectiveTo: date（任意）
  - timeBands: 配列（必須、少なくとも2件）
    - code: "DAYTIME" | "EARLY_LATE"
    - startTime: "HH:mm"（必須）
    - endTime: "HH:mm"（必須）
    - note: string（任意）
  - sourceRef: string（必須）
    - 参照資料（小平市の請求ページURL、単価表PDF等） [小平市：移動支援事業（請求）](https://www.city.kodaira.lg.jp/kurashi/094/094955.html?utm_source=chatgpt.com)
  - version: int（必須、1から開始）
  - createdBy / createdAt（必須）
  - supersedesRuleId（任意：前バージョン参照）

**受け入れ条件**
- Given 管理者が時間帯定義を登録する
- When 保存
- Then municipality+serviceKind+effectiveFrom+version が一意で保存される
- Then sourceRef が必須（空なら保存不可）
- Then timeBands に DAYTIME/EARLY_LATE が両方含まれない場合は保存不可

---

### 6.7 DR-Fact-Settings-020 市ルール変更の監査（特記・振り返り）
**目的**：時間帯定義は忘れやすく、運用ズレが請求差異に直結するため、変更理由と振り返りを必ず残す。

**要件**
- TimeBandRule には以下を必須で保持する
  - changeNote（必須）：変更の理由（例：年度更新、自治体資料更新、運用判断）
  - reviewMemo（必須）：振り返りメモ（「忘れやすいのでここを確認」等の特記事項）
  - changedBy / changedAt（必須）

**受け入れ条件**
- Given 既存のTimeBandRuleがある
- When 新しいバージョンを作成する
- Then changeNote と reviewMemo が未入力なら保存不可
- Then 既存バージョンは編集不可（上書き禁止、版追加のみ）

---

### 6.8 FR-Guide-Mobility-030 時間帯区分の自動判定（GuideRecordへの反映）
**目的**：記録（Do）から請求（Fact）へ接続するため、GuideRecordは市ルールを参照して時間帯区分を自動判定できる。

**要件**
- GuideRecord（serviceKind=MobilitySupport）は startedAt / endedAt を必須とする
- 保存時または月次締め時に、適用中のTimeBandRuleを参照して以下を算出する
  - computedTimeBand: "DAYTIME" | "EARLY_LATE" | "CROSSES_BANDS"
  - crossesBands: boolean（時間帯跨ぎ検出）
  - appliedRuleVersion: int（参照したルールのversion）

**受け入れ条件**
- Given MobilitySupportのGuideRecordがある
- When startedAt/endedAt を入力して保存する
- Then appliedRuleVersion が保存される
- Then 計算結果（computedTimeBand）が保存される
- Then 時間帯を跨ぐ場合、crossesBands=true となりレビュー対象として表示される

⸻

7. 非機能要件（NFR）

7.1 セキュリティ（認証/認可/RBAC/ログ/PII取扱い）
7.2 可用性・信頼性（バックアップ、復旧、運用手順）
7.3 パフォーマンス（一覧/検索/ページネーション）
7.4 アクセシビリティ（タブレット・片手操作・視認性）
7.5 SLI/SLO・エラーバジェット（測定方法まで）

⸻

8. アーキテクチャ・技術要件

8.1 全体構成（Next.js App Router / tRPC / Prisma / Postgres）
8.2 DB接続方針（pool/direct、環境変数、migrate運用）※Neon想定
8.3 キャッシュ戦略（RSC + Server Actions / TanStack Query）
8.4 デプロイ/環境（Vercel、Preview/Prod、シークレット管理）
8.5 ロギング/監視（Sentry 等、個人情報マスキング）
### 8.6 NFR/Tech-DB-010 Neon + Prisma 接続方針（pooled/direct の分離）
**目的**：serverless/多接続環境での接続枯渇・タイムアウトを避けつつ、Prisma CLI（migrate/push等）を安定運用する。

**要件**
- ランタイム（tRPC/Next.js）は pooled 接続を利用する
  - DATABASE_URL は Neon の pooler ホストを使用（hostnameに `-pooler` を含む） [Prisma: Neon guide](https://www.prisma.io/docs/guides/database/neon?utm_source=chatgpt.com)
- Prisma CLI（migrations, db push, introspection 等）は direct 接続を利用する
  - DIRECT_URL を用意し、schema.prisma の datasource に `directUrl = env("DIRECT_URL")` を設定する [Prisma: Neon guide](https://www.prisma.io/docs/guides/database/neon?utm_source=chatgpt.com)
- 原則：Neon の pooler は最新の PgBouncer を前提とし、通常は `pgbouncer=true` を付与しない（prepared statements 互換の問題が出た場合のみ検討する）[Prisma: Configure PgBouncer](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management/configure-pg-bouncer?utm_source=chatgpt.com)
- 互換問題が発生した場合のみ：pooled 接続（DATABASE_URL）に `pgbouncer=true` を付与し、症状が解消するか検証する（恒久対応は Prisma/Neon の推奨に追従する）[Prisma: Configure PgBouncer](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management/configure-pg-bouncer?utm_source=chatgpt.com)

**受け入れ条件**
- Given 本番/Preview 環境
- When Prisma Client が初回クエリを実行
- Then DATABASE_URL（pooled）を使用して接続する
- When `prisma migrate dev` / `prisma db push` を実行
- Then DIRECT_URL（direct）で接続する

**補足（Prisma v6 以降の構成差異）**
- Prisma のバージョン/構成によっては、`schema.prisma` の `directUrl` に加えて `prisma.config.ts` で migration/CLI 用の direct 接続を明示し、runtime では adapter（例：Neon/pg）＋ pooled を使う運用を採用してよい（採用する場合は本章を更新する）。[Prisma: Databases & connections](https://docs.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections?utm_source=chatgpt.com)

---

### 8.7 NFR/Tech-OPS-010 市ルール（TimeBandRule）運用手順
**目的**：時間帯定義の変更を“個人の記憶”ではなく、運用手順として固定する。

**運用要件**
- ルールの更新は「版追加」で行い、既存版の上書きを禁止する（DR-Fact-Settings-020準拠）
- 年度更新や自治体資料更新があった場合は、必ず
  1) sourceRef を更新（小平市の請求ページ/単価表PDF）
  2) changeNote / reviewMemo を入力
  3) effectiveFrom を設定
  を満たす
- 月次締め（毎月10日提出運用を想定）に向け、締め処理では appliedRuleVersion を必ず参照して集計する [小平市：移動支援事業（請求）](https://www.city.kodaira.lg.jp/kurashi/094/094955.html?utm_source=chatgpt.com)

**受け入れ条件**
- Given ルールが更新された
- When 月次締めを実行
- Then すべての MobilitySupport 記録は appliedRuleVersion を保持しており、後から同条件で再計算できる

---

### 8.8 UX/Tech-UI-010 管理者画面（市ルール設定）
**要件**
- 管理者のみがアクセス可能な設定画面を提供する
  - 例：`/admin/rules/kodaira/mobility-support`
- 設定画面では以下が可能
  - DAYTIME / EARLY_LATE の startTime/endTime を編集（新バージョン作成）
  - sourceRef を編集（URL/ファイル添付）
  - changeNote / reviewMemo を必須入力
  - 変更履歴（version一覧）閲覧
- ルール適用範囲（effectiveFrom/effectiveTo）が視覚的に分かる

**受け入れ条件**
- Given 管理者
- When ルールを更新して保存
- Then 新しい version が作成され、旧versionは読み取り専用となる
- Then changeNote / reviewMemo が空なら保存できない

⸻

9. 画面一覧・ルーティング

9.1 画面一覧（/recipients, /units, /units/[id]/log, …）
9.2 主要フロー（勤務開始→即確認→記録→申し送り→事故）
9.3 主要コンポーネント（カレンダー日跨ぎ、タブ、サマリー）

⸻

10. テスト要件（Verification）

10.1 受け入れ基準テンプレ（Given/When/Then）
10.2 E2Eシナリオ（夜勤日跨ぎ、服薬チェック、未確認申し送り）
10.3 監査観点テスト（編集履歴、権限境界、論理削除）

⸻

11. リリース計画（Phase）

11.1 Phase A（Do：ユニット日誌）
11.2 Phase B（Plan：支援計画 + planItemRefs）
11.3 Phase C（Fact：実績）
11.4 Phase D（Safety：事故・リスク）
11.5 横断（権限/監査/CSV/バックアップ）

⸻

12. 付録（Proposals / Drafts / 過去版）

A. 提案書：Care Journal（背景・比較・概算・非ゴール）
B. 提案書：Work Journal（勤怠の扱い、採用する/しない判断と理由）
C. 旧要件・差分ログ（統合前 4 ファイルの差分一覧）
D. 用語集（福祉ドメイン・ユニット運用・監査用語）