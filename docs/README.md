# 重度障害者支援 業務日誌・記録システム

障害福祉サービス事業所向けの統合管理システム - 利用者支援記録、業務日誌、勤怠管理、アセスメント、個別支援計画を一元管理

## 概要

本システムは、障害福祉サービス事業所における日々の支援記録、業務日誌、勤怠管理、利用者情報管理を統合し、支援の質の向上と業務効率化を実現します。法令遵守（サービス提供記録の5年保存等）とUX最適化を両立した設計になっています。

## 主な機能

### 利用者管理 (Care Recipients)
- 利用者基本情報・フェイスシート管理
- アセスメント記録
- 個別支援計画の作成・管理
- サービス利用記録

### 支援記録・業務日誌
- 日々の支援記録（DailyLog）
- サービス提供記録（ServiceRecord）
- 業務日誌の作成・承認フロー
- 申し送り事項管理

### 勤怠管理 (Attendance)
- 夜勤・日跨ぎ勤務対応
- 出退勤記録・休憩時間管理
- 実働時間の自動計算
- 月次集計

### インシデント管理
- ヒヤリハット・事故報告
- 再発防止策の記録
- インシデント分析

### 権限管理 (RBAC)
- ロールベースアクセス制御
- 事業所単位の権限管理
- 監査ログ機能

## Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui + Radix UI
- **State Management**: Zustand
- **Data Fetching**: Next.js fetch (RSC) + TanStack Query
- **Form**: React Hook Form
- **Validation**: Zod

### Backend
- **API**: tRPC
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: NextAuth.js (Auth.js v5)
- **File Storage**: Cloudinary

### Development Tools
- **Testing**: Vitest + React Testing Library
- **E2E Testing**: Playwright
- **Linting**: ESLint
- **Formatting**: Prettier
- **CI/CD**: GitHub Actions
- **Deployment**: Vercel

### Package Manager
- **pnpm**

## Getting Started

### Prerequisites

- Node.js 20 or higher
- pnpm
- PostgreSQL 16 or higher

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd cortex_os
```

2. Install dependencies:

```bash
pnpm install
```

3. Setup environment variables:

```bash
cp .env.example .env
```

Edit `.env` and configure the following:
- Database connection (PostgreSQL)
- NextAuth.js settings (NEXTAUTH_SECRET, NEXTAUTH_URL)
- Cloudinary credentials (optional, for file uploads)

4. Setup database:

```bash
# Run migrations
pnpm db:migrate

# Generate Prisma Client
pnpm db:generate

# (Optional) Seed initial data
pnpm db:seed
```

5. Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) (or [https://localhost:3443](https://localhost:3443) for HTTPS) with your browser.

## Available Scripts

### Development
- `pnpm dev` - Start development server with HTTPS
- `pnpm dev:http` - Start development server (HTTP only)
- `pnpm dev:local` - Start development server (localhost only)

### Build & Deploy
- `pnpm build` - Build for production
- `pnpm start` - Start production server

### Code Quality
- `pnpm lint` - Run ESLint
- `pnpm lint:fix` - Fix ESLint errors
- `pnpm format` - Format code with Prettier
- `pnpm format:check` - Check code formatting
- `pnpm typecheck` - Run TypeScript type checking
- `pnpm ci` - Run all checks (format, lint, typecheck, test)

### Testing
- `pnpm test` - Run tests in watch mode
- `pnpm test:ui` - Run tests with UI
- `pnpm test:run` - Run tests once

### Database
- `pnpm db:generate` - Generate Prisma Client
- `pnpm db:push` - Push schema changes to database
- `pnpm db:migrate` - Run database migrations
- `pnpm db:studio` - Open Prisma Studio with HTTPS
- `pnpm db:studio:http` - Open Prisma Studio (HTTP only)
- `pnpm db:seed` - Seed initial data
- `pnpm db:seed:users` - Create admin users
- `pnpm db:seed:test` - Run test seed SQL

## Project Structure

```
cortex_os/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/                # API routes
│   │   ├── attendance/         # 勤怠管理
│   │   ├── audit-logs/         # 監査ログ
│   │   ├── auth/               # 認証
│   │   ├── dashboard/          # ダッシュボード
│   │   ├── incidents/          # インシデント管理
│   │   ├── recipients/         # 利用者管理
│   │   ├── service-records/    # サービス記録
│   │   └── units/              # 事業所管理
│   ├── components/             # React components
│   │   └── ui/                 # shadcn/ui components
│   ├── server/                 # Server-side code
│   │   ├── api/                # tRPC routers
│   │   ├── auth.ts             # NextAuth.js config
│   │   └── db.ts               # Prisma client
│   ├── lib/                    # Utilities and helpers
│   └── types/                  # TypeScript types
├── prisma/                     # Database schema and migrations
│   ├── schema.prisma           # Prisma schema
│   ├── migrations/             # Migration files
│   └── seed.ts                 # Seed script
├── docs/                       # Documentation
│   ├── requirements/           # 要件定義
│   ├── design/                 # 設計文書
│   ├── implementation/         # 実装計画
│   ├── testing/                # テスト計画
│   ├── operations/             # 運用ガイド
│   └── AI_STANDARD_INSTRUCTIONS.md
├── .github/
│   ├── pull_request_template.md
│   └── workflows/              # GitHub Actions
├── scripts/                    # Utility scripts
└── package.json
```

## Documentation

### 要件定義・設計
- [要件定義書](./docs/requirements/REQUIREMENTS.md) - システム全体の要件定義
- [AI標準実装指示文](./docs/AI_STANDARD_INSTRUCTIONS.md) - AI実装時の標準ルール
- [PRテンプレート](./.github/pull_request_template.md) - L1実装時チェックリスト

### 機能別要件
- [フェイスシート要件](./docs/requirements/REQUIREMENTS_FACE_SHEET.md)
- [アセスメントシート要件](./docs/requirements/REQUIREMENTS_ASSESSMENT_SHEET.md)
- [業務日誌要件](./docs/requirements/REQUIREMENTS_UNIT_JOURNAL.md)
- [ガイド記録要件](./docs/requirements/REQUIREMENTS_GUIDE_RECORD.md)

### 実装・運用
- [実装計画](./docs/implementation/)
- [テスト計画](./docs/testing/)
- [運用ガイド](./docs/operations/)

## Contributing

PRを作成する際は、以下を確認してください:

1. **L1実装時チェックリスト** (.github/pull_request_template.md) を満たすこと
2. **AI標準実装指示文** (docs/AI_STANDARD_INSTRUCTIONS.md) に従うこと
3. テストを実行し、型チェック・lintを通すこと (`pnpm ci`)

## License

Private - All Rights Reserved

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [tRPC](https://trpc.io)
- [Prisma](https://www.prisma.io)
- [NextAuth.js](https://next-auth.js.org)
