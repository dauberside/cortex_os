# 重度障害者支援 業務日誌・記録システム - 要件定義書

> この要件定義書は「作って終わり」ではなく、運用しながら更新される"生きた仕様"として扱う。

## 0. ドキュメント運用ガバナンス（持続的運営の仕組み）

### 0.1 目的と適用範囲

- 本書は 重度障害者支援システム の **要件の唯一の正**（Single Source of Truth）として扱う
- 設計書・実装・テスト・運用手順は、本書の要件IDと紐付けて管理する

### 0.2 ロールと責任（RACI）

| 領域                                   | Responsible（実行） | Accountable（最終責任） | Consulted（相談）    | Informed（共有） |
| -------------------------------------- | ------------------- | ----------------------- | -------------------- | ---------------- |
| 要件追加・変更提案                     | PO / TL             | PO                      | Design / QA / SRE    | Team             |
| 非機能要件（性能/可用性/セキュリティ） | TL / SRE            | TL                      | PO / QA              | Team             |
| データ要件（PII/保持/削除）            | TL                  | TL                      | PO / Legal（必要時） | Team             |
| UI/UX要件                              | Design              | Design Lead             | PO / TL              | Team             |
| 変更レビュー/承認                      | TL / PO             | PO                      | Stakeholders         | Team             |

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

| 日付       | Decision-ID | 決定事項                                                                          | 理由                                                                                                | 影響範囲                                                       | 参加者                  |
| ---------- | ----------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ----------------------- |
| 2026-02-16 | DEC-001     | プロジェクト方針：重度障害者支援 業務日誌・記録システム                             | 福祉・介護現場の業務効率化、支援の質向上、安全管理強化を実現                                          | プロジェクト全体、機能要件、UI/UX設計                          | PO（兼任）              |
| 2026-02-16 | DEC-002     | 技術スタック：tRPC + Prisma + PostgreSQL                                          | 型安全性重視、エンドツーエンドTypeScript、開発効率とスケーラビリティのバランス                      | バックエンド設計、API設計、DB設計                              | TL（兼任）, Dev（兼任） |
| 2026-02-16 | DEC-003     | 状態管理：Zustand採用                                                             | 軽量、シンプル、TypeScriptフレンドリー、グローバル状態管理に適する                                  | フロントエンド設計、データフロー                               | TL（兼任）, Dev（兼任） |
| 2026-02-16 | DEC-004     | 認証：NextAuth.js (Auth.js v5)採用                                                | Next.js統合、無料、カスタマイズ性高、職員アカウント管理に適する                                      | ユーザー管理、セキュリティ設計                                 | TL（兼任）, Dev（兼任） |
| 2026-02-16 | DEC-005     | デプロイ：Vercel採用                                                              | Next.js最適化、簡単デプロイ、Postgres/Blob統合、開発体験優秀                                        | インフラ設計、運用コスト                                       | TL（兼任）, Dev（兼任） |
| 2026-02-16 | DEC-006     | MVP範囲：シングル施設、Webアプリのみ                                              | 初期開発の集中、コア機能の検証優先、複雑性の削減                                                    | 機能要件、リリース計画                                         | PO（兼任）, TL（兼任）  |
| 2026-02-16 | DEC-007     | データ取得戦略：初期表示は Next.js fetch（RSC）、動的操作は TanStack Query を併用 | 初期表示の高速化（RSC/キャッシュ）と、CRUD操作の再試行・キャッシュ・楽観的更新を両立するため          | FR-001〜（CRUD/検索）, NFR（性能/エラー率）, テスト（回帰）     | TL（兼任）, Dev（兼任） |
| 2026-02-16 | DEC-008     | フォーム管理：React Hook Form採用                                                 | 再レンダリングが少なく性能が良い。Zodと統合しやすく知見が多い                                       | FR-001〜（作成/編集）, UX（入力体験）                          | TL（兼任）, Dev（兼任） |
| 2026-02-16 | DEC-009     | バリデーション：Zod採用                                                           | TypeScript親和性が高く、tRPC/RHFでスキーマ共有しやすい                                              | FR-001〜（入力検証）, NFR（セキュリティ）                      | TL（兼任）, Dev（兼任） |
| 2026-02-16 | DEC-010     | テスト：Vitest + React Testing Library採用                                        | 高速でPR単位の回帰を回しやすい。RTLでユーザー操作ベースのテストが書ける                             | テスト要件（回帰）, FR-001〜                                   | TL（兼任）, Dev（兼任） |
| 2026-02-16 | DEC-011     | E2E：Playwright採用                                                               | 並列/トレース等が強く、主要ユーザーフローの回帰に向く                                               | リリースゲート（回帰）, FR-001〜                               | TL（兼任）, Dev（兼任） |
| 2026-02-16 | DEC-012     | データ設計：利用者情報と支援記録を分離                                             | 個人情報保護、論理削除対応、監査証跡の保持                                                          | データベース設計、セキュリティ、プライバシー保護                 | TL（兼任）, Dev（兼任） |

### 0.8 変更履歴（Changelog）

| バージョン | 日付       | 変更概要                                | 変更者 | 承認者 |
| ---------- | ---------- | --------------------------------------- | ------ | ------ |
| 1.0        | 2026-02-14 | 初版（テンプレート）                     | [名前] | [名前] |
| 2.0        | 2026-02-16 | 重度障害者支援システムへ要件定義を変更   | Claude | 未承認 |

## 1. プロジェクト概要

### 1.1 プロジェクト名

重度障害者支援 業務日誌・記録システム

### 1.2 目的

福祉・介護分野における重度障害者支援の業務日誌・記録システムを構築します。
日々の支援記録、バイタルサイン、ヒヤリハット、申し送り事項などを一元管理し、
利用者のQOL向上と支援の質の向上を目指します。

**主要な価値提供**:

- 支援記録の一元管理（日々の支援内容を簡単に記録）
- バイタルサインの可視化（グラフで推移を確認）
- 安全管理の強化（ヒヤリハット・事故報告の記録と分析）
- 情報共有の効率化（申し送り事項の確実な伝達）
- 個別支援計画との連携（計画に基づく支援の実施記録）

### 1.3 対象ユーザー

- **プライマリユーザー**: 福祉・介護現場の支援者
  - 介護職員、看護師、相談支援専門員等
  - 重度障害者への日常的な支援を行う職員
  - シフト勤務（夜勤・日跨ぎ勤務含む）を行う職員
- **セカンダリユーザー**: 管理者・責任者
  - 施設長、サービス管理責任者
  - ヒヤリハット分析や統計データを必要とする管理職

### 1.4 スコープ

- **対象範囲**（MVP）:
  - 利用者（重度障害者）管理：基本情報、障害区分、緊急連絡先、アレルギー情報
  - 支援記録（業務日誌）：食事、排泄、入浴、医療的ケア、コミュニケーション記録
  - バイタルサイン記録：体温、血圧、脈拍、SpO2、体重等の記録と可視化
  - 服薬管理：服薬記録、服薬予定、服薬漏れアラート
  - 申し送り・引継ぎ：シフト間の引継ぎ事項、未確認アラート
  - ヒヤリハット・事故報告：発生状況、対応、再発防止策の記録
  - 勤務管理：勤務時間記録、夜勤・日跨ぎ対応、実働時間計算
  - Webアプリケーション（レスポンシブ対応）：タブレット・PCで利用可能
  - シングル施設利用：一つの施設・事業所での利用を想定

- **対象外**（将来フェーズで検討）:
  - 介護報酬請求システムとの連携
  - 利用者家族向けポータル
  - 外部医療機関との電子カルテ連携
  - 音声入力機能
  - モバイルネイティブアプリ（iOS/Android専用アプリ）
  - マルチテナントSaaS（複数施設の統合管理）

## 2. 機能要件

> 以降の機能要件は **要件ID**（FR-xxx）で管理し、設計・テスト・リリース計画と必ず紐付ける。
> 受け入れ基準は「チェック可能な文」になっていること（曖昧語：適切に/なるべく/できるだけ、は禁止）。

#### 要件IDルール（例）

- FR-xxx: 機能要件（Functional Requirement）
- NFR-xxx: 非機能要件（Non-Functional Requirement）
- DR-xxx: データ要件（Data Requirement）
- UX-xxx: UI/UX要件
- INT-xxx: 外部連携要件（Integration）

### 2.1 必須機能（MVP）

#### 2.1.1 FR-001: 利用者管理（CRUD）

- **概要**: 重度障害者（利用者）の基本情報を登録・管理できる
- **ユーザーストーリー**:
  - As a 支援者, I want to 利用者の基本情報を登録・管理したい, so that 適切な支援を提供できる
- **受け入れ基準**:
  - [ ] Given ログイン済み、When 利用者情報を入力して保存、Then 利用者が作成され一覧に反映される
  - [ ] Given 既存利用者、When 情報を編集して保存、Then 更新内容が保持される
  - [ ] Given 既存利用者、When 削除を実行、Then 論理削除され（deletedAt）、通常表示から除外される
  - [ ] Given 入力不正、When 保存、Then Zodバリデーションエラーが表示され保存されない
  - [ ] Given 利用者詳細、When アレルギー・既往歴を表示、Then 支援者が注意事項を確認できる
- **優先度**: High
- **実装状況**: 未実装
- **データ項目**: 氏名、生年月日、性別、障害区分、障害支援区分、緊急連絡先、主治医、アレルギー、既往歴

#### 2.1.2 FR-002: 支援記録（業務日誌）CRUD

- **概要**: 日々の支援内容を記録できる
- **ユーザーストーリー**:
  - As a 支援者, I want to 日々の支援内容を記録したい, so that 利用者の状態を把握し、引継ぎを円滑にできる
- **受け入れ基準**:
  - [ ] Given 利用者選択、When 支援カテゴリ（食事/排泄/入浴/医療的ケア等）と内容を入力、Then 支援記録が作成される
  - [ ] Given 支援記録、When 記録日時・記録者・内容を表示、Then 時系列で確認できる
  - [ ] Given 支援記録、When 編集、Then 更新履歴が保持される
  - [ ] Given テンプレート選択、When 定型文を挿入、Then 入力が効率化される
- **優先度**: High
- **実装状況**: 未実装
- **カテゴリ**: 食事、排泄、入浴、更衣、医療的ケア、コミュニケーション、余暇活動

#### 2.1.3 FR-003: バイタルサイン記録・可視化

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

#### 2.1.4 FR-004: 服薬管理

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

#### 2.1.5 FR-005: 申し送り・引継ぎ

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

#### 2.1.6 FR-006: ヒヤリハット・事故報告

- **概要**: ヒヤリハット・事故を記録し、再発防止に活用できる
- **ユーザーストーリー**:
  - As a 支援者, I want to ヒヤリハット・事故を記録したい, so that 分析し再発防止策を立てられる
- **受け入れ基準**:
  - [ ] Given 事象発生、When 発生状況・要因・対応・再発防止策を記録、Then 報告が保存される
  - [ ] Given 重要度レベル、When レベル0〜5を設定、Then 重大度に応じた対応ができる
  - [ ] Given 報告一覧、When 事象別・利用者別に集計、Then 統計分析ができる
  - [ ] Given ヒヤリハット、When 発生件数推移をグラフ表示、Then 傾向を把握できる
- **優先度**: High
- **実装状況**: 未実装
- **レベル定義**: レベル0（気づき）〜レベル5（死亡）

#### 2.1.7 FR-007: 勤務管理（夜勤・日跨ぎ対応）

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

### 2.2 追加機能（Phase 2以降）

#### 2.2.1 FR-008: 個別支援計画管理

- **概要**: 個別支援計画を登録し、計画に基づく支援を記録できる
- **優先度**: Medium
- **実装状況**: 未実装

#### 2.2.2 FR-009: 検索・フィルタ機能

- **概要**: 支援記録・バイタル・ヒヤリハットを検索・絞り込みできる
- **優先度**: Medium
- **実装状況**: 未実装

#### 2.2.3 FR-010: CSVエクスポート

- **概要**: 記録データをCSV形式でエクスポートできる
- **優先度**: Low
- **実装状況**: 未実装

## 3. 非機能要件

> 非機能要件は運用で検証できる形（指標・閾値・測定方法）で記載する。

### 3.0 SLO/SLI（運用品質の合意）

- **SLI**: 応答時間（p50/p95）、エラー率、可用性、ジョブ遅延、外部API失敗率など
- **SLO**: 例）月間可用性 99.9% / p95 応答 < 500ms（主要API）/ エラー率 < 0.1%
- **エラーバジェット**: SLO未達時の機能開発凍結・改善優先の判断基準を定義する

### 3.0.1 測定方法

- 監視ツール（例：Sentry/Datadog/OpenTelemetry 等）で取得するメトリクスと対象エンドポイントを明記する

### 3.1 パフォーマンス

- ページ初期読み込み: 3秒以内
- Core Web Vitals目標:
  - LCP (Largest Contentful Paint): < 2.5s
  - FID (First Input Delay): < 100ms
  - CLS (Cumulative Layout Shift): < 0.1

### 3.2 セキュリティ

- [ ] HTTPS通信の強制
- [ ] XSS対策の実装
- [ ] CSRF対策の実装
- [ ] 適切な認証・認可の実装（職員アカウント管理）
- [ ] 個人情報（利用者情報）の暗号化
- [ ] アクセスログの記録（誰がいつ何を閲覧・編集したか）
- [ ] 権限管理（閲覧・編集権限の分離）
- [ ] セッション管理（タイムアウト設定）

### 3.3 アクセシビリティ

- WCAG 2.1 Level AA準拠
- キーボード操作のサポート
- スクリーンリーダー対応
- 大きめのフォントサイズ（現場での視認性）
- タッチ操作に適したボタンサイズ（タブレット利用を想定）

### 3.4 ブラウザ対応

- Chrome (最新版 & 1つ前のバージョン)
- Firefox (最新版 & 1つ前のバージョン)
- Safari (最新版 & 1つ前のバージョン)
- Edge (最新版)

### 3.5 レスポンシブデザイン

- モバイル: 375px以上
- タブレット: 768px以上
- デスクトップ: 1024px以上

### 3.6 可用性

- 稼働率: 99.9%以上
- 計画メンテナンス: 月1回以内

## 4. 技術要件

### 4.1 技術スタック

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
- **データベース**: PostgreSQL（リレーショナルDB、JSONB対応、全文検索、Vercel Postgres）
- **ORM**: Prisma（型安全、自動生成TypeScript型、マイグレーション管理、tRPC連携）
- **認証**: NextAuth.js (Auth.js v5)（Next.js統合、OAuth/Email/Credentials対応、カスタマイズ性高）
- **テスト**: Vitest + React Testing Library（高速、Jest互換、モダン）
- **E2Eテスト**: Playwright（高速、複数ブラウザ対応、パラレル実行）
- **デプロイ**: Vercel（Next.js最適化、簡単デプロイ、Edge Functions、Postgres/Blob統合）

### 4.2 開発環境

- Node.js: v20以上
- パッケージマネージャー: pnpm
- エディタ: cursor推奨
- Git: バージョン管理

### 4.3 コード品質

- ESLint: コード静的解析
- Prettier: コードフォーマット
- TypeScript: 型安全性の確保
- テスト: Vitest + React Testing Library
- E2Eテスト: Playwright

## 5. データ要件

### 5.1 主要なデータモデル

#### 5.1.1 User（職員アカウント）

```typescript
interface User {
  id: string;
  email: string;
  name: string | null; // 職員名
  role: string; // Staff/Nurse/Manager
  emailVerified: Date | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

- **管理**: NextAuth.js (Auth.js v5) が自動管理
- **関連**: User 1 - N CareRecord/VitalSign/Medication/Handover/Incident/WorkRecord

#### 5.1.2 CareRecipient（利用者）

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

#### 5.1.3 CareRecord（支援記録）

```typescript
interface CareRecord {
  id: string;
  recipientId: string;
  userId: string; // 記録者
  recordDate: Date; // 記録日時
  category: string; // Meal/Excretion/Bath/Medical/Communication/Activity
  content: string; // TEXT
  notes: string | null; // TEXT
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

#### 5.1.4 VitalSign（バイタルサイン）

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

#### 5.1.5 Medication（服薬記録）

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

#### 5.1.6 Handover（申し送り）

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

#### 5.1.7 Incident（ヒヤリハット・事故報告）

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
  situation: string; // TEXT - 発生状況
  cause: string | null; // TEXT - 発生要因
  response: string | null; // TEXT - 対応内容
  prevention: string | null; // TEXT - 再発防止策
  reportedAt: Date;
}
```

- **関連**:
  - CareRecipient 1 - N Incident
  - User 1 - N Incident

#### 5.1.8 WorkRecord（勤務記録）

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

#### 5.1.9 BreakTime（休憩時間）

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

### 5.2 データ関連性

```
User (1) ──< (N) CareRecipient
User (1) ──< (N) CareRecord
User (1) ──< (N) VitalSign
User (1) ──< (N) Medication
User (1) ──< (N) Handover
User (1) ──< (N) Incident
User (1) ──< (N) WorkRecord

CareRecipient (1) ──< (N) CareRecord
CareRecipient (1) ──< (N) VitalSign
CareRecipient (1) ──< (N) Medication
CareRecipient (1) ──< (N) Handover（任意）
CareRecipient (1) ──< (N) Incident

WorkRecord (1) ──< (N) BreakTime
```

### 5.3 データ保持・削除方針

- **論理削除**: CareRecipient は deletedAt を使用し、物理削除はしない（個人情報保護・監査対応）
- **カスケード削除**:
  - CareRecipient 削除時 → 関連する CareRecord/VitalSign/Medication/Handover/Incident はカスケード削除
  - WorkRecord 削除時 → BreakTime はカスケード削除
- **個人情報保護**: 利用者情報は暗号化して保存、アクセスログの記録
- **監査証跡**: 重要な記録（ヒヤリハット、服薬記録）は改ざん防止のため作成後の編集を制限

## 6. UI/UX要件

### 6.1 デザインシステム

- カラーパレット: [TBD]
- タイポグラフィ: [TBD]
- スペーシング: Tailwindのデフォルト設定を使用
- コンポーネントライブラリ: shadcn/ui

### 6.2 画面遷移図

[Mermaidやツールで作成した画面遷移図を挿入]

### 6.3 ワイヤーフレーム

[Figma / Sketch / Adobe XDのリンク]

## 7. 外部連携要件

### 7.1 API連携

- [ ] [外部サービス名1]: [目的]
- [ ] [外部サービス名2]: [目的]

### 7.2 サードパーティサービス

- [ ] 分析ツール: Google Analytics / Plausible
- [ ] エラートラッキング: Sentry / Bugsnag
- [ ] ログ管理: [TBD]

## 8. 制約事項

### 8.1 技術的制約

- [制約1]
- [制約2]

### 8.2 ビジネス的制約

- 予算: [金額]
- スケジュール: [期限]
- リソース: [人数・役割]

### 8.3 法的制約

- [ ] 個人情報保護法の遵守（利用者の個人情報・医療情報の取り扱い）
- [ ] 障害者総合支援法の記録要件準拠
- [ ] 介護保険法の記録保存要件準拠（該当する場合）
- [ ] 医療的ケアに関する記録保持義務
- [ ] アクセシビリティ法規制の準拠

## 9. テスト要件

### 9.0 トレーサビリティ（要件→テスト）

- すべてのMust要件（FR/NFR/DR/UX/INT）は、少なくとも1つのテストケースに紐付く
- 重大インシデントが起きた場合は、再発防止としてテストを追加し、要件IDにリンクする

### 9.0.1 回帰テスト方針

- 主要ユーザーフローはE2Eで自動化し、リリース前に必ず実行する
- 変更影響が大きい領域はスモークテストを常設し、PR単位で実行する

### 9.1 テスト種類

- [ ] 単体テスト（カバレッジ80%以上）
- [ ] 統合テスト
- [ ] E2Eテスト（主要フロー）
- [ ] パフォーマンステスト
- [ ] セキュリティテスト
- [ ] ユーザビリティテスト

### 9.2 テスト環境

- 開発環境: localhost
- ステージング環境: [URL]
- 本番環境: [URL]

## 10. リリース計画

### 10.1 Phase 1 - MVP（目標: 5-6時間）

- [ ] FR-001: 利用者管理（CRUD）
- [ ] FR-002: 支援記録（業務日誌）CRUD
- [ ] FR-003: バイタルサイン記録・可視化
- [ ] FR-004: 服薬管理
- [ ] FR-005: 申し送り・引継ぎ
- [ ] FR-006: ヒヤリハット・事故報告
- [ ] FR-007: 勤務管理（夜勤・日跨ぎ対応）
- [ ] ダッシュボード（今日の予定、未確認申し送り、最近のヒヤリハット）

### 10.2 Phase 2（追加機能）

- [ ] FR-008: 個別支援計画管理
- [ ] FR-009: 検索・フィルタ機能
- [ ] FR-010: CSVエクスポート
- [ ] 統計・分析機能の強化（ヒヤリハット分析、バイタル推移分析）
- [ ] テンプレート機能（定型文の登録・利用）

### 10.3 Phase 3（将来的な拡張）

- [ ] 介護報酬請求システムとの連携
- [ ] 利用者家族向けポータル（支援記録の共有）
- [ ] 音声入力対応
- [ ] スマートフォンアプリ化
- [ ] 複数事業所の統合管理（マルチテナント対応）
- [ ] AI による支援内容の分析・提案

## 11. 運用・保守要件

### 11.1 監視

- [ ] アップタイム監視
- [ ] パフォーマンス監視
- [ ] エラー監視
- [ ] ログ監視

### 11.1.1 アラート設計

- アラートは「行動につながる」ものだけを発報（ノイズ削減）
- 重大度（SEV）定義：SEV1〜SEV3 の基準と初動SLA（例：SEV1は15分以内に対応開始）

### 11.1.2 インシデント対応

- 連絡体制（On-call/当番/エスカレーション）を定義
- 事後対応：Postmortem（原因/影響/再発防止）を作成し、要件・テスト・監視の改善に反映

### 11.1.3 Runbook（運用手順）

- 主要アラートごとにRunbookを用意（確認手順/切り分け/暫定対応/恒久対応）

### 11.2 バックアップ

- データベース: 日次バックアップ、最低30日間保持（法定保存期間に準拠）
- 利用者情報・支援記録: 法定保存期間（5年間）に基づく長期保管
- ヒヤリハット・事故報告: 永久保存（再発防止・監査対応）
- 定期的なバックアップテスト（復元テスト）の実施

### 11.3 アップデート戦略

- 依存関係の更新: 月1回
- セキュリティパッチ: 即時適用
- メジャーバージョンアップ: 四半期ごとに検討

## 12. ドキュメント要件

### 12.1 必要なドキュメント

- [ ] API仕様書
- [ ] データベース設計書
- [ ] ユーザーマニュアル
- [ ] 運用マニュアル
- [ ] セットアップガイド
- [ ] トラブルシューティングガイド

## 13. 成功指標（KPI）

### 13.1 ビジネスKPI

- [ ] 記録時間の削減: 従来比50%削減（紙の記録からの移行）
- [ ] 申し送り漏れの削減: 月間0件（未確認アラート機能による）
- [ ] ヒヤリハット報告件数: 前年比20%増（報告しやすさの向上）
- [ ] バイタル異常値の早期発見: 異常値発生から24時間以内の対応率100%
- [ ] ユーザー満足度: 利用者（支援者）満足度 80%以上

### 13.2 技術KPI

- [ ] ページロード時間: < 3秒（タブレット利用を想定）
- [ ] エラー率: < 0.1%（記録漏れを防ぐため）
- [ ] 可用性: 99.9%以上（24時間365日対応）
- [ ] テストカバレッジ: > 80%（重要な記録機能の品質保証）

## 14. リスク管理

### 14.1 想定されるリスク

| リスク                       | 影響度 | 発生確率 | 対策                                                   | 担当     |
| ---------------------------- | ------ | -------- | ------------------------------------------------------ | -------- |
| 個人情報漏洩                 | High   | Low      | 暗号化、アクセスログ、権限管理の徹底                   | TL       |
| システム障害による記録不能   | High   | Medium   | 高可用性設計、バックアップ体制、紙の代替手段の用意     | TL/SRE   |
| 誤記録・記録漏れ             | High   | Medium   | バリデーション強化、必須項目チェック、アラート機能     | Dev      |
| 現場の抵抗（紙からの移行）   | Medium | High     | 丁寧な研修、段階的な移行、操作性の改善                 | PO       |
| 法定記録要件の不備           | High   | Low      | 法規制の調査、専門家（社労士・弁護士）への相談         | PO/Legal |
| バイタル異常値の見落とし     | High   | Medium   | 異常値アラート機能、グラフ可視化、通知機能             | Dev      |
| 夜勤時のシステム不具合       | High   | Low      | 24時間サポート体制、オンコールエンジニアの配置         | SRE      |

## 15. 承認

| 役割                 | 氏名 | 承認日 | 署名 |
| -------------------- | ---- | ------ | ---- |
| プロジェクトオーナー |      |        |      |
| テックリード         |      |        |      |
| デザインリード       |      |        |      |

---

**ドキュメントオーナー**: [PO/TL]
**最終更新**: 2026-02-16
**ステータス**: Draft（重度障害者支援システムへ変更）

> 参照ルール：設計書（ADR/Architecture）・テストケース・Runbook から本書の要件IDへリンクし、仕様の分散を防ぐ。

---

## 付録A: 用語集

- **利用者**: 支援を受ける重度障害者
- **支援者**: 介護職員、看護師、相談支援専門員等
- **支援記録**: 日々の支援内容を記録したもの（業務日誌）
- **バイタルサイン**: 体温、血圧、脈拍、SpO2等の生体情報
- **ヒヤリハット**: 事故には至らなかったが、ヒヤリとした出来事（レベル0）
- **申し送り**: シフト間で伝達すべき情報
- **障害支援区分**: 障害の程度を示す区分（1〜6、6が最重度）
- **医療的ケア**: 吸引、経管栄養、導尿等の医療行為
- **実働時間**: 勤務時間から休憩時間を除いた時間

## 付録B: 画面遷移図

[将来的に Mermaid 等で作成]

## 付録C: データベーススキーマ（Prisma）

詳細は `PROPOSAL_CARE_JOURNAL.md` を参照してください。
