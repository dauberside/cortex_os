# 重度障害者支援 業務日誌・記録システム - 要件定義書

> この要件定義書は「作って終わり」ではなく、運用しながら更新される"生きた仕様"として扱う。
> 運用フロー表（RACI + タイムライン）を前提として、法令遵守とUX最適化を両立する。

## 0. ドキュメント運用ガバナンス（持続的運営の仕組み）

### 0.1 目的と適用範囲

- 本書は 重度障害者支援システム の **要件の唯一の正**（Single Source of Truth）として扱う
- 設計書・実装・テスト・運用手順は、本書の要件IDと紐付けて管理する
- **運用フロー表（RACI + タイムライン）** を前提とし、法令要件→UX→機能の順で要件を整理する

### 0.2 ロールと責任（RACI）

#### 開発チーム

| 領域                                   | Responsible（実行） | Accountable（最終責任） | Consulted（相談）    | Informed（共有） |
| -------------------------------------- | ------------------- | ----------------------- | -------------------- | ---------------- |
| 要件追加・変更提案                     | PO / TL             | PO                      | Design / QA / SRE    | Team             |
| 非機能要件（性能/可用性/セキュリティ） | TL / SRE            | TL                      | PO / QA              | Team             |
| データ要件（PII/保持/削除）            | TL                  | TL                      | PO / Legal（必要時） | Team             |
| UI/UX要件                              | Design              | Design Lead             | PO / TL              | Team             |
| 変更レビュー/承認                      | TL / PO             | PO                      | Stakeholders         | Team             |

#### 運用チーム（現場）

| 領域                                | Responsible（実行） | Accountable（最終責任） | Consulted（相談）  | Informed（共有） |
| ----------------------------------- | ------------------- | ----------------------- | ------------------ | ---------------- |
| 即確認（注意事項/ADL/服薬/連絡先）  | 支援員              | リーダー                | サビ管/管理者      | —                |
| 記録（ケア記録/日誌）               | 支援員              | リーダー                | —                  | サビ管/管理者    |
| 日誌レビュー/品質チェック           | リーダー            | リーダー                | サビ管/管理者      | 支援員           |
| Plan↔Do紐付け（planItemRefs）       | 支援員              | リーダー                | サビ管/管理者      | —                |
| 計画と記録の整合レビュー            | リーダー            | サビ管/管理者           | —                  | 支援員           |
| 計画更新時の記録テンプレート反映    | サビ管/管理者       | サビ管/管理者           | リーダー           | 支援員           |
| アクセス制御/アクセス記録           | サビ管/管理者       | サビ管/管理者           | リーダー           | 支援員           |
| incident起票（ヒヤリハット/事故）   | 支援員              | リーダー                | サビ管/管理者      | —                |
| incident振り返り・再発防止          | サビ管/管理者       | サビ管/管理者           | リーダー           | 支援員           |

### 0.3 更新フロー（Change Management）

- 変更は必ず **要件変更提案（RFC）** として起票し、影響範囲（設計・実装・テスト・運用）を記載する
- 承認後に本書へ反映し、**変更履歴** と **トレーサビリティ** を更新する
- 「緊急変更（Hotfix）」は例外フロー：事後24時間以内に本書へ反映し、レビューで追認する

### 0.4 レビュー頻度と品質ゲート

- 定例レビュー：毎週（または隔週）にTBD/進捗/リスクを棚卸し
- リリースゲート：
  - MVPリリース前：Must要件の受け入れ基準が全て合格、NFRのSLO達成、運用手順（Runbook）準備
  - Phase追加前：既存のKPI/SLO悪化がないこと、監視・アラートの妥当性確認

### 0.5 トレーサビリティ方針（要件→設計→テスト→運用）

- 要件は必ず **要件ID** を付与する（例：FR-001, NFR-001, DR-001, UX-001, INT-001）
- 各要件に以下を紐付ける：
  - 設計：ADR/設計ドキュメントID
  - テスト：テストケースID（Unit/Integration/E2E）
  - 運用：監視指標・アラート・Runbook

### 0.6 TBD（未決定事項）管理

- TBDは必ず **TBD-ID** を付与し、オーナーと期限を設定する
- リリースゲートまでに解消が必要なTBDは「Blocker」に分類する

#### TBDレジスター

| TBD-ID  | 内容                       | オーナー                | 期限       | 重要度  | 状態                        |
| ------- | -------------------------- | ----------------------- | ---------- | ------- | --------------------------- |
| TBD-001 | 状態管理の選定             | TL（兼任）, Dev（兼任） | 2026-02-14 | Blocker | Done（Zustand採用）         |
| TBD-002 | データフェッチングの選定   | TL（兼任）, Dev（兼任） | 2026-02-14 | Blocker | Done（Next.js fetch採用）   |
| TBD-003 | バックエンドAPIの選定      | TL（兼任）, Dev（兼任） | 2026-02-14 | Blocker | Done（tRPC採用）            |
| TBD-004 | データベースの選定         | TL（兼任）, Dev（兼任） | 2026-02-14 | Blocker | Done（PostgreSQL採用）      |
| TBD-005 | ORMの選定                  | TL（兼任）, Dev（兼任） | 2026-02-14 | Blocker | Done（Prisma採用）          |
| TBD-006 | 認証システムの選定         | TL（兼任）, Dev（兼任） | 2026-02-14 | Blocker | Done（NextAuth.js採用）     |
| TBD-007 | フォーム管理の選定         | TL（兼任）, Dev（兼任） | 2026-02-14 | Blocker | Done（React Hook Form採用） |
| TBD-008 | バリデーションの選定       | TL（兼任）, Dev（兼任） | 2026-02-14 | Blocker | Done（Zod採用）             |
| TBD-009 | テストフレームワークの選定 | TL（兼任）, Dev（兼任） | 2026-02-14 | High    | Done（Vitest採用）          |
| TBD-010 | E2Eテストツールの選定      | TL（兼任）, Dev（兼任） | 2026-02-14 | High    | Done（Playwright採用）      |
| TBD-011 | デプロイ先の選定           | TL（兼任）, Dev（兼任） | 2026-02-14 | Blocker | Done（Vercel採用）          |

### 0.7 決定ログ（Decision Log）

| 日付       | Decision-ID | 決定事項                                                                          | 理由                                                                                         | 影響範囲                                                    | 参加者                  |
| ---------- | ----------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ----------------------- |
| 2026-02-16 | DEC-001     | プロジェクト方針：重度障害者支援 業務日誌・記録システム                           | 福祉・介護現場の業務効率化、支援の質向上、安全管理強化を実現                                 | プロジェクト全体、機能要件、UI/UX設計                       | PO（兼任）              |
| 2026-02-16 | DEC-002     | 技術スタック：tRPC + Prisma + PostgreSQL                                          | 型安全性重視、エンドツーエンドTypeScript、開発効率とスケーラビリティのバランス               | バックエンド設計、API設計、DB設計                           | TL（兼任）, Dev（兼任） |
| 2026-02-16 | DEC-003     | 状態管理：Zustand採用                                                             | 軽量、シンプル、TypeScriptフレンドリー、グローバル状態管理に適する                           | フロントエンド設計、データフロー                            | TL（兼任）, Dev（兼任） |
| 2026-02-16 | DEC-004     | 認証：NextAuth.js (Auth.js v5)採用                                                | Next.js統合、無料、カスタマイズ性高、職員アカウント管理に適する                              | ユーザー管理、セキュリティ設計                              | TL（兼任）, Dev（兼任） |
| 2026-02-16 | DEC-005     | デプロイ：Vercel採用                                                              | Next.js最適化、簡単デプロイ、Postgres/Blob統合、開発体験優秀                                 | インフラ設計、運用コスト                                    | TL（兼任）, Dev（兼任） |
| 2026-02-16 | DEC-006     | MVP範囲：シングル施設、Webアプリのみ                                              | 初期開発の集中、コア機能の検証優先、複雑性の削減                                             | 機能要件、リリース計画                                      | PO（兼任）, TL（兼任）  |
| 2026-02-16 | DEC-007     | データ取得戦略：初期表示は Next.js fetch（RSC）、動的操作は TanStack Query を併用 | 初期表示の高速化（RSC/キャッシュ）と、CRUD操作の再試行・キャッシュ・楽観的更新を両立するため | FR-001〜（CRUD/検索）, NFR（性能/エラー率）, テスト（回帰） | TL（兼任）, Dev（兼任） |
| 2026-02-16 | DEC-008     | フォーム管理：React Hook Form採用                                                 | 再レンダリングが少なく性能が良い。Zodと統合しやすく知見が多い                                | FR-001〜（作成/編集）, UX（入力体験）                       | TL（兼任）, Dev（兼任） |
| 2026-02-16 | DEC-009     | バリデーション：Zod採用                                                           | TypeScript親和性が高く、tRPC/RHFでスキーマ共有しやすい                                       | FR-001〜（入力検証）, NFR（セキュリティ）                   | TL（兼任）, Dev（兼任） |
| 2026-02-16 | DEC-010     | テスト：Vitest + React Testing Library採用                                        | 高速でPR単位の回帰を回しやすい。RTLでユーザー操作ベースのテストが書ける                      | テスト要件（回帰）, FR-001〜                                | TL（兼任）, Dev（兼任） |
| 2026-02-16 | DEC-011     | E2E：Playwright採用                                                               | 並列/トレース等が強く、主要ユーザーフローの回帰に向く                                        | リリースゲート（回帰）, FR-001〜                            | TL（兼任）, Dev（兼任） |
| 2026-02-16 | DEC-012     | データ設計：利用者情報と支援記録を分離                                            | 個人情報保護、論理削除対応、監査証跡の保持                                                   | データベース設計、セキュリティ、プライバシー保護            | TL（兼任）, Dev（兼任） |
| 2026-02-21 | DEC-013     | 運用フロー表ベースの要件再構成                                                    | 法令遵守（サービス提供記録/5年保存）とUX最適化（Recipient Hub）を両立                        | REQUIREMENTS.md全体、UX-001, FR-xxx, DR-xxx                 | PO（兼任）, TL（兼任）  |

### 0.8 変更履歴（Changelog）

| バージョン | 日付       | 変更概要                                       | 変更者 | 承認者 |
| ---------- | ---------- | ---------------------------------------------- | ------ | ------ |
| 1.0        | 2026-02-14 | 初版（テンプレート）                           | [名前] | [名前] |
| 2.0        | 2026-02-16 | 重度障害者支援システムへ要件定義を変更         | Claude | 未承認 |
| 3.0        | 2026-02-21 | 運用フロー表ベースで要件を5階層構造へ再構成    | Claude | 未承認 |
| 3.1        | 2026-02-21 | FR-011追加: ガイド記録管理（ワークフロー・ServiceRecord自動生成）| Claude | 未承認 |

## 1. プロジェクト概要

### 1.1 プロジェクト名

重度障害者支援 業務日誌・記録システム

### 1.2 目的

福祉・介護分野における重度障害者支援の業務日誌・記録システムを構築します。
日々の支援記録、バイタルサイン、ヒヤリハット、申し送り事項などを一元管理し、
利用者のQOL向上と支援の質の向上を目指します。

**主要な価値提供**:

- 支援記録の一元管理（日々の支援内容を簡単に記録）
- **法令遵守**（サービス提供記録・個別支援計画の整合性・5年保存・アクセス制御）
- バイタルサインの可視化（グラフで推移を確認）
- 安全管理の強化（ヒヤリハット・事故報告の記録と分析）
- 情報共有の効率化（申し送り事項の確実な伝達）
- 個別支援計画との連携（計画に基づく支援の実施記録）
- **Recipient Hub**: 紙ファイルと同等の即確認性（注意事項/ADL/服薬/連絡先を常時表示）

### 1.3 対象ユーザー

- **プライマリユーザー**: 福祉・介護現場の支援者
  - 介護職員、看護師、相談支援専門員等
  - 重度障害者への日常的な支援を行う職員
  - シフト勤務（夜勤・日跨ぎ勤務含む）を行う職員
- **セカンダリユーザー**: 管理者・責任者
  - 施設長、サービス管理責任者（サビ管）、管理者
  - ヒヤリハット分析や統計データを必要とする管理職
  - 実地指導・監査対応を行う責任者

### 1.4 スコープ

- **対象範囲**（MVP）:
  - 利用者（重度障害者）管理：基本情報、障害区分、緊急連絡先、アレルギー情報
  - **Recipient Hub**: 利用者サマリー常時表示（注意事項/ADL/服薬・禁忌/連絡先）+ タブで深掘り
  - 支援記録（業務日誌）：食事、排泄、入浴、医療的ケア、コミュニケーション記録
  - **Plan↔Do紐付け**: 支援記録に個別支援計画項目を紐付け（`planItemRefs`）
  - バイタルサイン記録：体温、血圧、脈拍、SpO2、体重等の記録と可視化
  - 服薬管理：服薬記録、服薬予定、服薬漏れアラート
  - 申し送り・引継ぎ：シフト間の引継ぎ事項、未確認アラート
  - ヒヤリハット・事故報告：発生状況、対応、再発防止策の記録
  - 勤務管理：勤務時間記録、夜勤・日跨ぎ対応、実働時間計算
  - **5年保存・アクセス制御・アクセス記録**
  - Webアプリケーション（レスポンシブ対応）：タブレット・PCで利用可能
  - シングル施設利用：一つの施設・事業所での利用を想定

- **対象外**（将来フェーズで検討）:
  - 介護報酬請求システムとの連携
  - 利用者家族向けポータル
  - 外部医療機関との電子カルテ連携
  - 音声入力機能
  - モバイルネイティブアプリ（iOS/Android専用アプリ）
  - マルチテナントSaaS（複数施設の統合管理）

## 2. 法令前提（サービス提供記録・個別支援計画・保存・安全管理）

> 障害者総合支援法・介護保険法に基づくサービス提供記録の要件を満たす。

### 2.1 DR-001: サービス提供記録の必須項目

- **概要**: 法定記録要件（提供日時/利用者/記録者/具体内容/心身状況/伝達事項）を満たす
- **根拠**:
  - サービス提供記録には提供日・時間、利用者、記録者、具体的な支援内容、心身の状況、伝達事項が必須
  - 個別支援計画との不整合が返還リスクとなる
- **受け入れ基準**:
  - [ ] Given 支援記録作成、When 必須項目（提供日時/利用者/記録者/内容/心身状況/伝達事項）を入力、Then 記録が保存される
  - [ ] Given 必須項目不足、When 保存、Then エラー表示され保存されない
  - [ ] Given 支援記録一覧、When 記録者名・提供日時を表示、Then 法定要件を満たす
- **優先度**: Must
- **実装状況**: 一部実装済み（recipientId, userId, recordDate, content, category）、心身状況・伝達事項フィールドは未実装

### 2.2 DR-002: 個別支援計画との整合性（Plan↔Do）

- **概要**: 支援記録は個別支援計画に基づくものであることを証明できる
- **根拠**:
  - 計画に基づかない提供は返還リスクとなる
  - 計画と記録の整合性が実地指導・減算の観点で重要
- **受け入れ基準**:
  - [ ] Given 支援記録作成、When 個別支援計画項目を選択（`planItemRefs`）、Then 紐付けが保存される
  - [ ] Given 支援記録一覧、When 計画項目紐付けを表示、Then 計画に基づく支援であることが確認できる
  - [ ] Given 計画未紐付け記録、When 週次レビュー、Then 抜け漏れがレポートされる
- **優先度**: Must
- **実装状況**: スキーマ実装済み（`planItemRefs`）、UI未接続

### 2.3 DR-003: 5年保存（記録の保持）

- **概要**: サービス提供記録は提供した日から5年間保存する
- **根拠**:
  - 障害者総合支援法・介護保険法により「提供した日から5年間保存」が明記されている
- **受け入れ基準**:
  - [ ] Given 記録作成、When 5年以内、Then 記録が保持される
  - [ ] Given バックアップ運用、When 月次バックアップ、Then 5年保存が運用で保証される
  - [ ] Given 削除要求、When 5年以内の記録、Then 論理削除のみ許可される
- **優先度**: Must
- **実装状況**: スキーマに `deletedAt` 実装済み、物理削除防止は運用ルールで担保

### 2.4 DR-004: アクセス制御・アクセス記録

- **概要**: 個人情報の適切な取扱い（役割ベース権限・アクセス記録）
- **根拠**:
  - 医療・介護領域の個人情報の適切取扱い（ガイダンス/Q&A）
- **受け入れ基準**:
  - [ ] Given ユーザーロール（支援員/リーダー/管理者）、When データアクセス、Then 権限に応じた閲覧/編集制御がされる
  - [ ] Given アクセス記録、When 誰が/いつ/誰のデータを閲覧・編集、Then アクセスログが記録される
  - [ ] Given 月次監査、When アクセスログを確認、Then 不正アクセスを検知できる
- **優先度**: Must
- **実装状況**: NextAuth.jsで認証済み、役割ベース権限・アクセス記録は未実装

### 2.5 DR-005: Safety（ヒヤリハット・事故報告）

- **概要**: ヒヤリハット・事故を記録し、再発防止に活用する
- **根拠**:
  - 安全管理体制の義務化（障害福祉サービス等）
- **受け入れ基準**:
  - [ ] Given 事象発生、When incident起票（発生状況/要因/対応/再発防止策）、Then 報告が保存される
  - [ ] Given incident、When 状態更新（Open→対応中→収束）、Then 進捗が追跡できる
  - [ ] Given 月次振り返り、When incident集計・分析、Then 再発防止策が計画に反映される
- **優先度**: Must
- **実装状況**: スキーマ実装済み（`incidents`）、UI未実装

## 3. UX要件（Recipient Hub：即確認 + 深掘り）

> 紙ファイルの「表紙」相当の即確認性をデジタルで実現する。

### 3.1 UX-001: Recipient Hub（利用者サマリー常時表示 + タブ深掘り）

- **概要**: 利用者詳細画面で即確認項目（注意事項/ADL/服薬・禁忌/連絡先）を常時表示し、タブで深掘り
- **根拠**:
  - 紙ファイルでは表紙に注意事項・ADL・服薬・連絡先が記載され、支援員が勤務開始前・支援中・申し送り前に即確認する
  - デジタルではページ遷移が障壁となるため、サマリー埋め込み + タブ深掘りのハイブリッドUXを採用
- **受け入れ基準**:
  - [ ] Given 利用者詳細画面、When ページ表示、Then サマリーカード（注意事項/ADL/服薬・禁忌/連絡先）が常時表示される
  - [ ] Given サマリーカード、When クリック、Then 該当タブへジャンプし詳細を確認できる
  - [ ] Given タブ（基本情報/アセスメント/支援計画/支援記録/Safety）、When タブ切替、Then サマリーは表示されたまま
  - [ ] Given 重要事項（誤嚥/転倒/てんかん/逸走）、When サマリーカード、Then 強調表示（色・アイコン）される
- **優先度**: Must
- **実装状況**: 未実装（利用者詳細画面は既存だがサマリーカード・タブ構造は未実装）

#### 3.1.1 サマリーカード構成（最小セット）

1. **注意事項カード**
   - 誤嚥リスク/転倒リスク/てんかん/逸走リスク/その他重要事項
   - 強調表示（赤アイコン/太字）

2. **ADLカード**
   - 移動/食事/排泄/入浴/更衣の自立度（自立/一部介助/全介助）
   - アイコンで視覚化

3. **服薬・禁忌カード**
   - 定期服薬リスト（薬剤名/用法/用量）
   - アレルギー/禁忌（強調表示）

4. **連絡先カード**
   - 緊急連絡先（氏名/続柄/電話番号）
   - 主治医/病院（名前/電話番号）

#### 3.1.2 タブ構成

- **基本情報**: 氏名/生年月日/性別/障害区分/障害支援区分/緊急連絡先/主治医
- **アセスメント**: ADL/コミュニケーション/認知/行動/医療的ケア
- **個別支援計画**: 計画項目リスト/目標/支援内容/期間
- **支援記録（業務日誌）**: 日々の支援記録/バイタル/服薬記録
- **Safety**: Open incident一覧/過去のヒヤリハット・事故報告

### 3.2 UX-002: Safetyタブ（Open incident可視化）

- **概要**: 利用者ごとのOpen incident（未収束の事故/ヒヤリハット）を強調表示
- **受け入れ基準**:
  - [ ] Given Safetyタブ、When Open incidentあり、Then 件数バッジが表示される
  - [ ] Given Open incident一覧、When クリック、Then incident詳細（発生状況/対応/再発防止策）が確認できる
  - [ ] Given incident収束、When 状態更新、Then Openから除外される
- **優先度**: High
- **実装状況**: 未実装

### 3.3 UX-003: Plan↔Do紐付けUI

- **概要**: 支援記録作成時に個別支援計画項目を選択できる
- **受け入れ基準**:
  - [ ] Given 支援記録作成、When 計画項目選択（複数選択可）、Then `planItemRefs` に保存される
  - [ ] Given 支援記録一覧、When 計画項目タグ表示、Then 計画に基づく支援であることが視覚的に確認できる
  - [ ] Given 計画項目なし、When 保存、Then 警告表示（任意項目）
- **優先度**: Must
- **実装状況**: スキーマ実装済み、UI未接続

## 4. 機能要件（CRUD・検索・バイタル・申し送り）

> 以降の機能要件は **要件ID**（FR-xxx）で管理し、設計・テスト・リリース計画と必ず紐付ける。
> 受け入れ基準は「チェック可能な文」になっていること（曖昧語：適切に/なるべく/できるだけ、は禁止）。

### 4.1 必須機能（MVP）

#### 4.1.1 FR-001: 利用者管理（CRUD）

- **概要**: 重度障害者（利用者）の基本情報を登録・管理できる
- **ユーザーストーリー**:
  - As a 支援者, I want to 利用者の基本情報を登録・管理したい, so that 適切な支援を提供できる
- **受け入れ基準**:
  - [ ] Given ログイン済み、When 利用者情報を入力して保存、Then 利用者が作成され一覧に反映される
  - [ ] Given 既存利用者、When 情報を編集して保存、Then 更新内容が保持される
  - [ ] Given 既存利用者、When 削除を実行、Then 論理削除され（deletedAt）、通常表示から除外される
  - [ ] Given 入力不正、When 保存、Then Zodバリデーションエラーが表示され保存されない
  - [ ] Given 利用者詳細、When アレルギー・既往歴を表示、Then 支援者が注意事項を確認できる
- **優先度**: Must
- **実装状況**: 実装済み（CRUD、CSV取込/出力、検索）
- **データ項目**: 氏名、生年月日、性別、障害区分、障害支援区分、緊急連絡先、主治医、アレルギー、既往歴

#### 4.1.2 FR-002: 支援記録（業務日誌）CRUD

- **概要**: 日々の支援内容を記録できる
- **ユーザーストーリー**:
  - As a 支援者, I want to 日々の支援内容を記録したい, so that 利用者の状態を把握し、引継ぎを円滑にできる
- **受け入れ基準**:
  - [ ] Given 利用者選択、When 支援カテゴリ（食事/排泄/入浴/医療的ケア等）と内容を入力、Then 支援記録が作成される
  - [ ] Given 支援記録、When 記録日時・記録者・内容を表示、Then 時系列で確認できる
  - [ ] Given 支援記録、When 編集、Then 更新履歴が保持される
  - [ ] Given テンプレート選択、When 定型文を挿入、Then 入力が効率化される
  - [ ] Given 支援記録作成、When 計画項目選択（`planItemRefs`）、Then 計画に基づく支援であることが記録される
- **優先度**: Must
- **実装状況**: 未実装
- **カテゴリ**: 食事、排泄、入浴、更衣、医療的ケア、コミュニケーション、余暇活動

#### 4.1.3 FR-003: バイタルサイン記録・可視化

- **概要**: バイタルサイン（体温、血圧、脈拍等）を記録し、グラフで可視化できる
- **ユーザーストーリー**:
  - As a 支援者, I want to バイタルサインを記録・可視化したい, so that 利用者の健康状態の変化に早期に気づける
- **受け入れ基準**:
  - [ ] Given 利用者選択、When バイタル測定値を入力、Then 記録が保存される
  - [ ] Given バイタル履歴、When グラフ表示（日次/週次/月次）、Then 推移を視覚的に確認できる
  - [ ] Given 異常値、When 閾値を超えた、Then 異常値アラートが表示される
  - [ ] Given バイタル測定、When 測定日時・測定者・備考を記録、Then 正確な記録が残る
- **優先度**: High
- **実装状況**: 未実装
- **測定項目**: 体温、血圧（収縮期/拡張期）、脈拍、SpO2、体重

#### 4.1.4 FR-004: 服薬管理

- **概要**: 服薬記録を管理し、服薬漏れを防ぐ
- **ユーザーストーリー**:
  - As a 支援者, I want to 服薬記録を管理したい, so that 服薬ミス・服薬漏れを防げる
- **受け入れ基準**:
  - [ ] Given 利用者、When 服薬実施、Then 服薬日時・薬剤名・実施者が記録される
  - [ ] Given 服薬予定、When 予定一覧を表示、Then 服薬すべきタイミングが分かる
  - [ ] Given 服薬漏れ、When 未実施、Then アラートが表示される
  - [ ] Given 拒薬・誤薬、When 状態を記録、Then 特記事項が残る
- **優先度**: High
- **実装状況**: 未実装

#### 4.1.5 FR-005: 申し送り・引継ぎ

- **概要**: シフト間の申し送り事項を確実に伝達できる
- **ユーザーストーリー**:
  - As a 支援者, I want to 申し送り事項を記録・確認したい, so that シフト間で情報が漏れずに伝わる
- **受け入れ基準**:
  - [ ] Given 申し送り作成、When 内容・優先度・期限を入力、Then 申し送りが登録される
  - [ ] Given 未確認申し送り、When 一覧表示、Then 強調表示される
  - [ ] Given 申し送り確認、When 確認ボタン押下、Then 確認者・確認日時が記録される
  - [ ] Given 期限切れ、When 期限超過、Then アラート表示される
- **優先度**: High
- **実装状況**: 未実装

#### 4.1.6 FR-006: ヒヤリハット・事故報告（incident）

- **概要**: ヒヤリハット・事故を記録し、再発防止に活用できる
- **ユーザーストーリー**:
  - As a 支援者, I want to ヒヤリハット・事故を記録したい, so that 分析し再発防止策を立てられる
- **受け入れ基準**:
  - [ ] Given 事象発生、When 発生状況・要因・対応・再発防止策を記録、Then 報告が保存される
  - [ ] Given 重要度レベル、When レベル0〜5を設定、Then 重大度に応じた対応ができる
  - [ ] Given 報告一覧、When 事象別・利用者別に集計、Then 統計分析ができる
  - [ ] Given ヒヤリハット、When 発生件数推移をグラフ表示、Then 傾向を把握できる
  - [ ] Given incident、When 状態更新（Open→対応中→収束）、Then 進捗が追跡できる
- **優先度**: Must
- **実装状況**: スキーマ実装済み、UI未実装
- **レベル定義**: レベル0（気づき）〜レベル5（死亡）

#### 4.1.7 FR-007: 勤務管理（夜勤・日跨ぎ対応）

- **概要**: 支援者の勤務時間を記録し、実働時間を計算できる
- **ユーザーストーリー**:
  - As a 支援者, I want to 勤務時間を記録したい, so that 正確な労働時間管理ができる
- **受け入れ基準**:
  - [ ] Given 勤務開始、When 開始時刻を記録、Then 勤務が開始される
  - [ ] Given 勤務終了、When 終了時刻を記録、Then 実働時間が自動計算される
  - [ ] Given 休憩時間、When 複数回の休憩を記録、Then 実働時間から減算される
  - [ ] Given 日跨ぎ勤務、When 2/15 15:30 ～ 2/16 9:30、Then 正しく計算される（基準日: 2/15）
  - [ ] Given 勤怠統計、When 週次/月次集計、Then 総実働時間・勤務日数が表示される
- **優先度**: High
- **実装状況**: 未実装

#### 4.1.8 FR-011: ガイド記録（外出支援記録）管理

- **概要**: 移動支援・通院等介助等の外出支援記録を管理できる
- **ユーザーストーリー**:
  - As a 支援者, I want to 外出支援の記録を作成・提出したい, so that サービス提供実績として管理できる
- **受け入れ基準**:
  - [x] Given 利用者選択、When ガイド記録を作成（DRAFT）、Then 下書き保存される
  - [x] Given DRAFT状態、When 編集、Then 更新できる
  - [x] Given DRAFT状態、When 提出、Then SUBMITTED状態に遷移しServiceRecordが自動生成される
  - [x] Given SUBMITTED状態、When 編集、Then 403エラーが表示される（差戻し必須）
  - [x] Given SUBMITTED状態、When 管理者が承認、Then APPROVED状態に遷移しServiceRecord.isApproved=true
  - [x] Given SUBMITTED状態、When 管理者が差戻し、Then DRAFT状態に戻り再編集可能
  - [ ] Given ガイド記録一覧、When 状態バッジ表示、Then 状態が視覚的に確認できる
  - [ ] Given DRAFT状態、When 編集・提出ボタン表示、Then 操作可能
  - [ ] Given SUBMITTED状態、When 承認待ちバッジ表示＋編集ボタン非表示、Then 状態が明確
  - [ ] Given APPROVED状態、When 承認済みバッジ表示、Then 確定状態が明確
- **優先度**: Must
- **実装状況**: バックエンド実装済み（スキーマ・ルーター完了）、UI未実装
- **NOTE**:
  - 同行援護（AccompanyingSupport）は現状非対応（将来拡張として予約）
  - 現在のserviceKind運用範囲: MobilitySupport（移動支援） / HospitalAssist（通院等介助） / Other（その他：Shopping|Leisure）
  - ServiceRecordのserviceTypeは現状 "MobilitySupport" 固定（将来的にserviceKindフィールド追加予定）

#### ワークフロー状態

| 状態 | 説明 | 可能な操作 | 次の状態 | UI表示 |
|------|------|-----------|---------|--------|
| DRAFT | 下書き | 編集、削除、提出 | SUBMITTED | 編集・提出ボタン表示 |
| SUBMITTED | 提出済み（承認待ち） | 承認、差戻し | APPROVED, DRAFT | 承認待ちバッジ、編集ボタン非表示 |
| APPROVED | 承認済み | 閲覧のみ | - | 承認済みバッジ |

#### ServiceRecord自動生成ルール

GuideRecordがSUBMITTED状態に遷移した際に以下の処理を実行：

- **トランザクション処理**:
  1. GuideRecordのstatusをSUBMITTEDに更新、submittedAt/submittedByを記録
  2. ServiceRecordをupsert（guideRecordIdで一意）して自動生成

- **データ同期ルール**:
  - `startedAt/endedAt` → `serviceDate/startTime/endTime`
  - duration（分）を自動計算: `Math.round((endedAt - startedAt) / (1000 * 60))`
  - `destination` → `destination`
  - `purpose` → `purpose`
  - `supportContent` → `serviceDetail`
  - `userCondition` → `userCondition`
  - `notes` → `incidents`
  - `guideRecordId` を必ず保存（紐付け管理）

- **バリデーション**:
  - endedAtが未入力の場合は提出不可（エラーメッセージ: "終了日時が入力されていません"）
  - statusがDRAFT以外の場合は提出不可

#### 承認処理

GuideRecordがAPPROVED状態に遷移した際に以下の処理を実行：

- **トランザクション処理**:
  1. GuideRecordのstatusをAPPROVEDに更新、approvedAt/approvedByを記録
  2. 関連ServiceRecordのisApproved=true、approvedAt/approvedByを同期

- **バリデーション**:
  - statusがSUBMITTED以外の場合は承認不可

#### 差戻し処理

GuideRecordをDRAFT状態に戻す際：

- statusをDRAFTに更新
- submittedAt/submittedByをnullにリセット
- 差戻し理由（reason）は任意だが保存推奨（将来的に監査ログに記録）

### 4.2 追加機能（Phase 2以降）

#### 4.2.1 FR-008: 個別支援計画管理（CRUD）

- **概要**: 個別支援計画を登録し、計画に基づく支援を記録できる
- **優先度**: Medium
- **実装状況**: スキーマ実装済み（`supportPlans`, `planItems`）、UI未実装

#### 4.2.2 FR-009: 検索・フィルタ機能

- **概要**: 支援記録・バイタル・ヒヤリハットを検索・絞り込みできる
- **優先度**: Medium
- **実装状況**: 一部実装済み（利用者一覧の名前・フリガナ検索）

#### 4.2.3 FR-010: CSVエクスポート

- **概要**: 記録データをCSV形式でエクスポートできる
- **優先度**: Low
- **実装状況**: 一部実装済み（利用者・アセスメントのCSV出力/取込）

## 5. 非機能要件

> 非機能要件は運用で検証できる形（指標・閾値・測定方法）で記載する。

### 5.0 SLO/SLI（運用品質の合意）

- **SLI**: 応答時間（p50/p95）、エラー率、可用性、ジョブ遅延、外部API失敗率など
- **SLO**: 例）月間可用性 99.9% / p95 応答 < 500ms（主要API）/ エラー率 < 0.1%
- **エラーバジェット**: SLO未達時の機能開発凍結・改善優先の判断基準を定義する

### 5.0.1 測定方法

- 監視ツール（例：Sentry/Datadog/OpenTelemetry 等）で取得するメトリクスと対象エンドポイントを明記する

### 5.1 NFR-001: パフォーマンス

- **受け入れ基準**:
  - [ ] Given 主要画面、When 初期読み込み、Then 3秒以内に表示される
  - [ ] Given Core Web Vitals、When 測定、Then LCP < 2.5s, FID < 100ms, CLS < 0.1
  - [ ] Given tRPCクエリ、When 利用者一覧取得、Then p95応答 < 500ms
- **優先度**: High
- **実装状況**: 未測定

### 5.2 NFR-002: セキュリティ

- **受け入れ基準**:
  - [ ] HTTPS通信の強制
  - [ ] XSS対策の実装
  - [ ] CSRF対策の実装
  - [ ] 適切な認証・認可の実装（職員アカウント管理）
  - [ ] 個人情報（利用者情報）の暗号化
  - [ ] アクセスログの記録（誰がいつ何を閲覧・編集したか）
  - [ ] 権限管理（閲覧・編集権限の分離：支援員/リーダー/管理者）
  - [ ] セッション管理（タイムアウト設定）
- **優先度**: Must
- **実装状況**: 一部実装済み（NextAuth.js認証）、アクセスログ・権限管理は未実装

### 5.3 NFR-003: アクセシビリティ

- **受け入れ基準**:
  - [ ] WCAG 2.1 Level AA準拠
  - [ ] キーボード操作のサポート
  - [ ] スクリーンリーダー対応
  - [ ] 大きめのフォントサイズ（現場での視認性）
  - [ ] タッチ操作に適したボタンサイズ（タブレット利用を想定）
- **優先度**: Medium
- **実装状況**: 未実装

### 5.4 NFR-004: ブラウザ対応

- Chrome (最新版 & 1つ前のバージョン)
- Firefox (最新版 & 1つ前のバージョン)
- Safari (最新版 & 1つ前のバージョン)
- Edge (最新版)

### 5.5 NFR-005: レスポンシブデザイン

- モバイル: 375px以上
- タブレット: 768px以上
- デスクトップ: 1024px以上

### 5.6 NFR-006: 可用性

- **受け入れ基準**:
  - [ ] Given 月間稼働率、When 測定、Then 99.9%以上
  - [ ] Given 計画メンテナンス、When 月次、Then 1回以内
- **優先度**: High
- **実装状況**: 未測定

## 6. 技術要件

### 6.1 技術スタック

- **フロントエンド**: Next.js 16 (App Router), React 19, TypeScript 5
- **スタイリング**: Tailwind CSS 4
- **UIコンポーネント**: shadcn/ui, Radix UI
- **状態管理**: Zustand（軽量でシンプル、TypeScriptフレンドリー、Devtools対応）
- **データフェッチング**: Next.js fetch（RSC/Route Handler/Server Actions） + TanStack Query（クライアント操作のキャッシュ/再試行/楽観的更新）
  - 原則：初期表示/プリフェッチは Next.js 側、操作（CRUD/AI）起点のサーバーデータ状態は TanStack Query で統一
  - tRPC の呼び出しは Server 側（RSC/Route Handler）と Client 側（TanStack Query）で役割分担する
- **フォーム**: React Hook Form（軽量、パフォーマンス優秀、業界標準）
- **バリデーション**: Zod（TypeScriptファースト、型推論優秀、tRPC/React Hook Form連携）
- **バックエンド**: tRPC（型安全なAPI、エンドツーエンドTypeScript、学習コスト低）
- **データベース**: PostgreSQL（リレーショナルDB、JSONB対応、全文検索、Neon Serverless Postgres）
- **ORM**: Prisma（型安全、自動生成TypeScript型、マイグレーション管理、tRPC連携）
- **認証**: NextAuth.js (Auth.js v5)（Next.js統合、OAuth/Email/Credentials対応、カスタマイズ性高）
- **テスト**: Vitest + React Testing Library（高速、Jest互換、モダン）
- **E2Eテスト**: Playwright（高速、複数ブラウザ対応、パラレル実行）
- **デプロイ**: Vercel（Next.js最適化、簡単デプロイ、Edge Functions、Postgres/Blob統合）

### 6.2 開発環境

- Node.js: v20以上
- パッケージマネージャー: pnpm
- エディタ: cursor推奨
- Git: バージョン管理

### 6.3 コード品質

- ESLint: コード静的解析
- Prettier: コードフォーマット
- TypeScript: 型安全性の確保
- テスト: Vitest + React Testing Library
- E2Eテスト: Playwright

## 7. データ要件

### 7.1 主要なデータモデル

#### 7.1.1 User（職員アカウント）

```typescript
interface User {
  id: string;
  email: string;
  name: string | null; // 職員名
  role: string; // Staff/Lead/Manager（支援員/リーダー/サビ管・管理者）
  emailVerified: Date | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

- **管理**: NextAuth.js (Auth.js v5) が自動管理
- **関連**: User 1 - N CareRecord/VitalSign/Medication/Handover/Incident/WorkRecord

#### 7.1.2 CareRecipient（利用者）

```typescript
interface CareRecipient {
  id: string;
  userId: string; // 施設・事業所のユーザーID
  name: string;
  nameKana: string | null;
  birthDate: Date;
  gender: string; // Male/Female/Other
  disabilityType: string[]; // Physical/Intellectual/Mental
  supportLevel: number | null; // 障害支援区分 1-6
  emergencyContact: string | null;
  doctor: string | null;
  hospital: string | null;
  allergies: string | null;
  medicalHistory: string | null; // TEXT
  notes: string | null; // TEXT
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null; // 論理削除
}
```

- **関連**:
  - User 1 - N CareRecipient
  - CareRecipient 1 - N CareRecord/VitalSign/Medication/Handover/Incident
  - CareRecipient 1 - 1 Assessment
  - CareRecipient 1 - N SupportPlan

#### 7.1.3 Assessment（アセスメント）

```typescript
interface Assessment {
  id: string;
  recipientId: string; // UNIQUE
  // ADL
  mobility: string | null; // 移動
  eating: string | null; // 食事
  excretion: string | null; // 排泄
  bathing: string | null; // 入浴
  dressing: string | null; // 更衣
  // コミュニケーション
  communication: string | null;
  comprehension: string | null;
  // 認知・行動
  cognition: string | null;
  behavior: string | null;
  // 医療的ケア
  medicalCare: string | null;
  // その他
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
```

#### 7.1.4 SupportPlan（個別支援計画）

```typescript
interface SupportPlan {
  id: string;
  recipientId: string;
  title: string;
  startDate: Date;
  endDate: Date;
  status: string; // Draft/Active/Expired
  createdAt: Date;
  updatedAt: Date;
}
```

#### 7.1.5 PlanItem（計画項目）

```typescript
interface PlanItem {
  id: string;
  planId: string;
  category: string; // Goal/Support/Medical
  content: string; // TEXT
  createdAt: Date;
}
```

#### 7.1.6 CareRecord（支援記録）

```typescript
interface CareRecord {
  id: string;
  recipientId: string;
  userId: string; // 記録者
  recordDate: Date; // 記録日時
  category: string; // Meal/Excretion/Bath/Medical/Communication/Activity
  content: string; // TEXT
  notes: string | null; // TEXT
  planItemRefs: string[]; // PlanItem.id の配列（Plan↔Do紐付け）
  // 食事記録用
  mealAmount: string | null; // 全量/半量/少量
  mealTexture: string | null; // 常食/刻み/ミキサー
  // 排泄記録用
  excretionType: string | null; // Urine/Feces
  excretionForm: string | null; // 正常/軟便/下痢/便秘
  // 入浴記録用
  bathType: string | null; // 入浴/シャワー/清拭
  createdAt: Date;
  updatedAt: Date;
}
```

- **関連**:
  - CareRecipient 1 - N CareRecord
  - User 1 - N CareRecord
  - CareRecord N - N PlanItem（`planItemRefs`）

#### 7.1.7 VitalSign（バイタルサイン）

```typescript
interface VitalSign {
  id: string;
  recipientId: string;
  userId: string; // 測定者
  measuredAt: Date;
  temperature: number | null; // 体温（℃）
  systolic: number | null; // 収縮期血圧（mmHg）
  diastolic: number | null; // 拡張期血圧（mmHg）
  pulse: number | null; // 脈拍（回/分）
  spo2: number | null; // SpO2（%）
  weight: number | null; // 体重（kg）
  notes: string | null; // TEXT
  createdAt: Date;
}
```

- **関連**:
  - CareRecipient 1 - N VitalSign
  - User 1 - N VitalSign

#### 7.1.8 Medication（服薬記録）

```typescript
interface Medication {
  id: string;
  recipientId: string;
  userId: string; // 実施者
  medicatedAt: Date; // 服薬日時
  medicationName: string;
  dosage: string;
  method: string | null; // Oral/Injection/Tube
  status: string; // Completed/Refused/Error
  notes: string | null; // TEXT
  createdAt: Date;
}
```

- **関連**:
  - CareRecipient 1 - N Medication
  - User 1 - N Medication

#### 7.1.9 Handover（申し送り）

```typescript
interface Handover {
  id: string;
  recipientId: string | null; // NULL = 全体への申し送り
  userId: string; // 記録者
  content: string; // TEXT
  priority: string; // High/Normal/Low
  dueDate: Date | null; // 対応期限
  confirmedBy: string | null; // 確認者ID
  confirmedAt: Date | null;
  createdAt: Date;
}
```

- **関連**:
  - CareRecipient 1 - N Handover（任意）
  - User 1 - N Handover

#### 7.1.10 Incident（ヒヤリハット・事故報告）

```typescript
interface Incident {
  id: string;
  recipientId: string;
  userId: string; // 報告者
  occurredAt: Date; // 発生日時
  discoveredBy: string; // 発見者名
  location: string; // 発生場所
  incidentType: string; // Fall/Medication/Wandering/Injury/Other
  severityLevel: number; // 0-5
  status: string; // Open/InProgress/Resolved
  situation: string; // TEXT - 発生状況
  cause: string | null; // TEXT - 発生要因
  response: string | null; // TEXT - 対応内容
  prevention: string | null; // TEXT - 再発防止策
  reportedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

- **関連**:
  - CareRecipient 1 - N Incident
  - User 1 - N Incident

#### 7.1.11 WorkRecord（勤務記録）

```typescript
interface WorkRecord {
  id: string;
  userId: string;
  workDate: Date; // 勤務日（基準日）
  startTime: Date; // 勤務開始時刻
  endTime: Date; // 勤務終了時刻
  workHours: number; // 実働時間（自動計算）
  notes: string | null; // TEXT
  createdAt: Date;
  updatedAt: Date;
}
```

- **関連**:
  - User 1 - N WorkRecord
  - WorkRecord 1 - N BreakTime

#### 7.1.12 BreakTime（休憩時間）

```typescript
interface BreakTime {
  id: string;
  workRecordId: string;
  startTime: Date;
  endTime: Date;
  createdAt: Date;
}
```

- **関連**:
  - WorkRecord 1 - N BreakTime

#### 7.1.13 GuideRecord（ガイド記録）

```typescript
interface GuideRecord {
  id: string;
  recipientId: string;
  userId: string; // 記録者
  startedAt: Date; // 開始日時
  endedAt: Date | null; // 終了日時
  destination: string | null; // 行き先
  purpose: string | null; // 目的
  transport: string[]; // 交通手段（複数選択可）
  supportContent: string | null; // 支援内容
  userCondition: string | null; // 利用者状況
  cashHandled: boolean; // 金銭取扱い有無
  handedAmount: number | null; // 預かり金額
  returnedAmount: number | null; // 返却金額
  cashNote: string | null; // 金銭管理備考
  notes: string | null; // 備考

  // ワークフロー状態
  status: GuideRecordStatus; // DRAFT/SUBMITTED/APPROVED
  submittedAt: Date | null;
  submittedBy: string | null;
  approvedAt: Date | null;
  approvedBy: string | null;

  createdAt: Date;
  updatedAt: Date;
}

enum GuideRecordStatus {
  DRAFT = "DRAFT",
  SUBMITTED = "SUBMITTED",
  APPROVED = "APPROVED"
}
```

- **概要**: 移動支援・通院等介助等の外出支援記録
- **状態遷移**: DRAFT（下書き） → SUBMITTED（提出済み） → APPROVED（承認済み）
- **関連**:
  - CareRecipient 1 - N GuideRecord
  - User 1 - N GuideRecord
  - GuideRecord 1 - 1 ServiceRecord（guideRecordId経由）

#### 7.1.14 ServiceRecord（サービス提供実績）

```typescript
interface ServiceRecord {
  id: string;
  recipientId: string;
  userId: string;
  serviceType: string; // MobilitySupport/HospitalAssist等
  serviceDate: Date;
  startTime: Date;
  endTime: Date;
  duration: number; // 実施時間（分）
  destination: string | null;
  purpose: string | null;
  serviceDetail: string; // 支援内容詳細
  userCondition: string | null;
  incidents: string | null;
  isApproved: boolean;
  approvedAt: Date | null;
  approvedBy: string | null;
  guideRecordId: string | null; // GuideRecordとの紐付け（UNIQUE）
  createdAt: Date;
  updatedAt: Date;
}
```

- **概要**: サービス提供の実績記録（GuideRecordから自動生成）
- **関連**:
  - CareRecipient 1 - N ServiceRecord
  - User 1 - N ServiceRecord
  - ServiceRecord 1 - 1 GuideRecord（逆参照、guideRecordId経由）

### 7.2 データ関連性

```
User (1) ──< (N) CareRecipient
User (1) ──< (N) CareRecord
User (1) ──< (N) VitalSign
User (1) ──< (N) Medication
User (1) ──< (N) Handover
User (1) ──< (N) Incident
User (1) ──< (N) WorkRecord
User (1) ──< (N) GuideRecord
User (1) ──< (N) ServiceRecord

CareRecipient (1) ──< (N) CareRecord
CareRecipient (1) ──< (N) VitalSign
CareRecipient (1) ──< (N) Medication
CareRecipient (1) ──< (N) Handover（任意）
CareRecipient (1) ──< (N) Incident
CareRecipient (1) ─── (1) Assessment
CareRecipient (1) ──< (N) SupportPlan
CareRecipient (1) ──< (N) GuideRecord
CareRecipient (1) ──< (N) ServiceRecord

SupportPlan (1) ──< (N) PlanItem
CareRecord (N) ──< (N) PlanItem（planItemRefs配列）

WorkRecord (1) ──< (N) BreakTime

GuideRecord (1) ─── (1) ServiceRecord（guideRecordId, UNIQUE制約）
```

### 7.3 データ保持・削除方針

- **論理削除**: CareRecipient, Assessment は deletedAt を使用し、物理削除はしない（個人情報保護・監査対応）
- **カスケード削除**:
  - CareRecipient 削除時 → 関連する CareRecord/VitalSign/Medication/Handover/Incident はカスケード削除
  - WorkRecord 削除時 → BreakTime はカスケード削除
- **個人情報保護**: 利用者情報は暗号化して保存、アクセスログの記録
- **監査証跡**: 重要な記録（ヒヤリハット、服薬記録）は改ざん防止のため作成後の編集を制限
- **5年保存**: サービス提供記録（CareRecord/VitalSign/Medication）は提供した日から5年間保存

## 8. UI/UX要件

### 8.1 デザインシステム

- カラーパレット: [TBD]
- タイポグラフィ: [TBD]
- スペーシング: Tailwindのデフォルト設定を使用
- コンポーネントライブラリ: shadcn/ui

### 8.2 画面遷移図

[Mermaidやツールで作成した画面遷移図を挿入]

### 8.3 ワイヤーフレーム

[Figma / Sketch / Adobe XDのリンク]

## 9. 外部連携要件

### 9.1 API連携

- [ ] [外部サービス名1]: [目的]
- [ ] [外部サービス名2]: [目的]

### 9.2 サードパーティサービス

- [ ] 分析ツール: Google Analytics / Plausible
- [ ] エラートラッキング: Sentry / Bugsnag
- [ ] ログ管理: [TBD]

## 10. 制約事項

### 10.1 技術的制約

- [制約1]
- [制約2]

### 10.2 ビジネス的制約

- 予算: [金額]
- スケジュール: [期限]
- リソース: [人数・役割]

### 10.3 法的制約

- [ ] 個人情報保護法の遵守（利用者の個人情報・医療情報の取り扱い）
- [ ] 障害者総合支援法の記録要件準拠
- [ ] 介護保険法の記録保存要件準拠（該当する場合）
- [ ] 医療的ケアに関する記録保持義務
- [ ] アクセシビリティ法規制の準拠

## 11. テスト要件

### 11.0 トレーサビリティ（要件→テスト）

- すべてのMust要件（FR/NFR/DR/UX/INT）は、少なくとも1つのテストケースに紐付く
- 重大インシデントが起きた場合は、再発防止としてテストを追加し、要件IDにリンクする

### 11.0.1 回帰テスト方針

- 主要ユーザーフローはE2Eで自動化し、リリース前に必ず実行する
- 変更影響が大きい領域はスモークテストを常設し、PR単位で実行する

### 11.1 テスト種類

- [ ] 単体テスト（カバレッジ80%以上）
- [ ] 統合テスト
- [ ] E2Eテスト（主要フロー）
- [ ] パフォーマンステスト
- [ ] セキュリティテスト
- [ ] ユーザビリティテスト

### 11.2 テスト環境

- 開発環境: localhost
- ステージング環境: [URL]
- 本番環境: [URL]

## 12. リリース計画

### 12.1 Phase 1 - MVP

#### 12.1.1 法令遵守（Must）

- [ ] DR-001: サービス提供記録の必須項目
- [ ] DR-002: 個別支援計画との整合性（Plan↔Do）
- [ ] DR-003: 5年保存
- [ ] DR-004: アクセス制御・アクセス記録
- [ ] DR-005: Safety（ヒヤリハット・事故報告）

#### 12.1.2 UX（Must）

- [ ] UX-001: Recipient Hub（サマリー常時表示 + タブ深掘り）
- [ ] UX-002: Safetyタブ（Open incident可視化）
- [ ] UX-003: Plan↔Do紐付けUI

#### 12.1.3 機能（Must/High）

- [x] FR-001: 利用者管理（CRUD） — 実装済み
- [ ] FR-002: 支援記録（業務日誌）CRUD
- [ ] FR-003: バイタルサイン記録・可視化
- [ ] FR-004: 服薬管理
- [ ] FR-005: 申し送り・引継ぎ
- [ ] FR-006: ヒヤリハット・事故報告（incident）
- [ ] FR-007: 勤務管理（夜勤・日跨ぎ対応）
- [ ] FR-011: ガイド記録（外出支援記録）管理 — バックエンド実装済み（2026-02-21）、UI未実装
  - [x] スキーマ実装（GuideRecordStatus enum, workflow fields）
  - [x] tRPCルーター実装（submit/approve/backToDraft mutations）
  - [x] ServiceRecord自動生成機能
  - [ ] UI実装（状態バッジ、ボタン制御）
- [ ] ダッシュボード（今日の予定、未確認申し送り、最近のヒヤリハット）

### 12.2 Phase 2（追加機能）

- [ ] FR-008: 個別支援計画管理（CRUD）
- [ ] FR-009: 検索・フィルタ機能
- [ ] FR-010: CSVエクスポート
- [ ] 統計・分析機能の強化（ヒヤリハット分析、バイタル推移分析）
- [ ] テンプレート機能（定型文の登録・利用）

### 12.3 Phase 3（将来的な拡張）

- [ ] 介護報酬請求システムとの連携
- [ ] 利用者家族向けポータル（支援記録の共有）
- [ ] 音声入力対応
- [ ] スマートフォンアプリ化
- [ ] 複数事業所の統合管理（マルチテナント対応）
- [ ] AI による支援内容の分析・提案

## 13. 運用・保守要件

### 13.1 監視

- [ ] アップタイム監視
- [ ] パフォーマンス監視
- [ ] エラー監視
- [ ] ログ監視

### 13.1.1 アラート設計

- アラートは「行動につながる」ものだけを発報（ノイズ削減）
- 重大度（SEV）定義：SEV1〜SEV3 の基準と初動SLA（例：SEV1は15分以内に対応開始）

### 13.1.2 インシデント対応

- 連絡体制（On-call/当番/エスカレーション）を定義
- 事後対応：Postmortem（原因/影響/再発防止）を作成し、要件・テスト・監視の改善に反映

### 13.1.3 Runbook（運用手順）

- 主要アラートごとにRunbookを用意（確認手順/切り分け/暫定対応/恒久対応）

### 13.2 バックアップ

- データベース: 日次バックアップ、最低30日間保持（法定保存期間に準拠）
- 利用者情報・支援記録: 法定保存期間（5年間）に基づく長期保管
- ヒヤリハット・事故報告: 永久保存（再発防止・監査対応）
- 定期的なバックアップテスト（復元テスト）の実施

### 13.3 アップデート戦略

- 依存関係の更新: 月1回
- セキュリティパッチ: 即時適用
- メジャーバージョンアップ: 四半期ごとに検討

## 14. ドキュメント要件

### 14.1 必要なドキュメント

- [ ] API仕様書
- [ ] データベース設計書
- [ ] ユーザーマニュアル
- [ ] 運用マニュアル
- [ ] セットアップガイド
- [ ] トラブルシューティングガイド

## 15. 成功指標（KPI）

### 15.1 ビジネスKPI

- [ ] 記録時間の削減: 従来比50%削減（紙の記録からの移行）
- [ ] 申し送り漏れの削減: 月間0件（未確認アラート機能による）
- [ ] ヒヤリハット報告件数: 前年比20%増（報告しやすさの向上）
- [ ] バイタル異常値の早期発見: 異常値発生から24時間以内の対応率100%
- [ ] ユーザー満足度: 利用者（支援者）満足度 80%以上

### 15.2 技術KPI

- [ ] ページロード時間: < 3秒（タブレット利用を想定）
- [ ] エラー率: < 0.1%（記録漏れを防ぐため）
- [ ] 可用性: 99.9%以上（24時間365日対応）
- [ ] テストカバレッジ: > 80%（重要な記録機能の品質保証）

## 16. リスク管理

### 16.1 想定されるリスク

| リスク                     | 影響度 | 発生確率 | 対策                                               | 担当     |
| -------------------------- | ------ | -------- | -------------------------------------------------- | -------- |
| 個人情報漏洩               | High   | Low      | 暗号化、アクセスログ、権限管理の徹底               | TL       |
| システム障害による記録不能 | High   | Medium   | 高可用性設計、バックアップ体制、紙の代替手段の用意 | TL/SRE   |
| 誤記録・記録漏れ           | High   | Medium   | バリデーション強化、必須項目チェック、アラート機能 | Dev      |
| 現場の抵抗（紙からの移行） | Medium | High     | 丁寧な研修、段階的な移行、操作性の改善             | PO       |
| 法定記録要件の不備         | High   | Low      | 法規制の調査、専門家（社労士・弁護士）への相談     | PO/Legal |
| バイタル異常値の見落とし   | High   | Medium   | 異常値アラート機能、グラフ可視化、通知機能         | Dev      |
| 夜勤時のシステム不具合     | High   | Low      | 24時間サポート体制、オンコールエンジニアの配置     | SRE      |

## 17. 承認

| 役割                 | 氏名 | 承認日 | 署名 |
| -------------------- | ---- | ------ | ---- |
| プロジェクトオーナー |      |        |      |
| テックリード         |      |        |      |
| デザインリード       |      |        |      |

---

**ドキュメントオーナー**: [PO/TL]
**最終更新**: 2026-02-21
**ステータス**: Draft（運用フロー表ベースで5階層再構成）

> 参照ルール：設計書（ADR/Architecture）・テストケース・Runbook から本書の要件IDへリンクし、仕様の分散を防ぐ。

---

## 付録A: 用語集

- **利用者**: 支援を受ける重度障害者
- **支援者**: 介護職員、看護師、相談支援専門員等
- **支援員（Staff）**: 現場で即確認・記録入力を行う職員
- **リーダー（Lead）**: 申し送り取りまとめ、日誌品質チェック、軽微な事故対応を行う職員
- **サビ管/管理者（Manager）**: サービス管理責任者・施設長。計画の承認・整合確認、事故の最終判断、監査/実地指導対応を行う
- **支援記録**: 日々の支援内容を記録したもの（業務日誌）
- **バイタルサイン**: 体温、血圧、脈拍、SpO2等の生体情報
- **ヒヤリハット**: 事故には至らなかったが、ヒヤリとした出来事（レベル0）
- **incident**: ヒヤリハット・事故報告の総称（レベル0〜5）
- **申し送り**: シフト間で伝達すべき情報
- **障害支援区分**: 障害の程度を示す区分（1〜6、6が最重度）
- **医療的ケア**: 吸引、経管栄養、導尿等の医療行為
- **実働時間**: 勤務時間から休憩時間を除いた時間
- **Plan↔Do**: 個別支援計画（Plan）と支援記録（Do）の紐付け。`planItemRefs` で実現
- **Recipient Hub**: 利用者サマリー常時表示 + タブ深掘りのハイブリッドUX

## 付録B: 運用フロー表（RACI + タイムライン）

> この表は `引き継ぎ用` ファイルに記載された運用フローを要約したもの。
> 詳細は `引き継ぎ用` ファイルを参照。

### 役割（最小セット）

- **支援員（Staff）**: 現場で即確認・記録入力
- **リーダー（Lead）**: 申し送り取りまとめ、日誌品質チェック、軽微な事故対応
- **サビ管/管理者（Manager）**: 計画の承認・整合確認、事故の最終判断、監査/実地指導対応

RACI: R=実行責任 / A=最終責任 / C=相談・レビュー / I=共有

### タイムライン×やること

#### 1. 即確認（注意事項/ADL/服薬・禁忌/連絡先）

| タイミング   | 主な行動                                     | R      | A             | C             | I |
| ------------ | -------------------------------------------- | ------ | ------------- | ------------- | - |
| 勤務開始前   | 利用者サマリー確認（注意事項・ADL・禁忌等）  | 支援員 | リーダー      | サビ管/管理者 | — |
| 支援中（都度）| 重要事項の再確認（誤嚥/転倒/てんかん等）    | 支援員 | リーダー      | —             | — |
| 申し送り前   | 直近の変化点確認（体調変化・服薬・拒否）    | 支援員 | リーダー      | —             | — |

#### 2. 記録（提供日時・具体内容・心身状況・伝達事項）

| タイミング | 記録内容                                  | R      | A        | C             | I             |
| ---------- | ----------------------------------------- | ------ | -------- | ------------- | ------------- |
| 支援中     | ケア記録（排泄/食事/服薬/バイタル等）     | 支援員 | リーダー | —             | —             |
| 勤務終わり | 日誌の整合（抜け/矛盾/時刻）              | 支援員 | リーダー | —             | サビ管/管理者 |
| 日次（締め）| 日誌レビュー/品質チェック                | リーダー | リーダー | サビ管/管理者 | 支援員        |

#### 3. 説明責任（Plan↔Do：planItemRefs）

| 行動           | R             | A             | C             | I      |
| -------------- | ------------- | ------------- | ------------- | ------ |
| 記録入力時     | 支援員        | リーダー      | サビ管/管理者 | —      |
| 週次レビュー   | リーダー      | サビ管/管理者 | —             | 支援員 |
| 計画更新時     | サビ管/管理者 | サビ管/管理者 | リーダー      | 支援員 |

#### 4. 保存・安全管理（5年保存・アクセス制御・アクセス記録）

| タイミング | 行動                                     | R             | A             | C        | I      |
| ---------- | ---------------------------------------- | ------------- | ------------- | -------- | ------ |
| 常時       | 役割ベース権限で閲覧/編集制御             | サビ管/管理者 | サビ管/管理者 | リーダー | 支援員 |
| 常時       | アクセス記録（誰が/いつ/誰のデータを）   | サビ管/管理者 | サビ管/管理者 | —        | —      |
| 月次       | バックアップ/保存の運用確認               | サビ管/管理者 | サビ管/管理者 | リーダー | —      |

#### 5. Safety（ヒヤリ/事故）

| タイミング   | 行動                                  | R             | A             | C             | I      |
| ------------ | ------------------------------------- | ------------- | ------------- | ------------- | ------ |
| 事故発生時   | incident起票（初動）                  | 支援員        | リーダー      | サビ管/管理者 | —      |
| 当日         | 状態更新（Open→対応中→収束）          | リーダー      | リーダー      | サビ管/管理者 | 支援員 |
| 週次/月次    | 振り返り・再発防止（必要ならPlanへ反映）| サビ管/管理者 | サビ管/管理者 | リーダー      | 支援員 |

## 付録C: 画面遷移図

[将来的に Mermaid 等で作成]

## 付録D: データベーススキーマ（Prisma）

詳細は `prisma/schema.prisma` を参照してください。
