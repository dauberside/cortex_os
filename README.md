# Cortex OS

AI統合型の思考支援システム - 個人の知的生産性を最大化するための統合プラットフォーム

## 概要

Cortex OSは、知識管理、AI対話、ワークフロー自動化、ビジュアル思考マップを統合し、思考プロセスの可視化と情報整理を支援します。

## Tech Stack

### Frontend

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui + Radix UI
- **State Management**: Zustand
- **Data Fetching**: Next.js fetch + TanStack Query
- **Form**: React Hook Form
- **Validation**: Zod

### Backend

- **API**: tRPC
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: NextAuth.js (Auth.js v5)

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
- PostgreSQL

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

Edit `.env` and configure your environment variables.

4. Setup database:

```bash
pnpm prisma migrate dev
pnpm prisma generate
```

5. Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm lint:fix` - Fix ESLint errors
- `pnpm format` - Format code with Prettier
- `pnpm format:check` - Check code formatting
- `pnpm typecheck` - Run TypeScript type checking
- `pnpm test` - Run tests in watch mode
- `pnpm test:ui` - Run tests with UI
- `pnpm test:run` - Run tests once

## Project Structure

```
cortex_os/
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   │   └── ui/           # shadcn/ui components
│   ├── lib/              # Utilities and helpers
│   └── __tests__/        # Test files
├── prisma/               # Database schema and migrations
├── public/               # Static assets
├── .github/workflows/    # GitHub Actions CI/CD
├── REQUIREMENTS.md       # Project requirements (Japanese)
└── package.json
```

## Documentation

- [Requirements (要件定義書)](./REQUIREMENTS.md)

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [tRPC](https://trpc.io)
- [Prisma](https://www.prisma.io)
- [NextAuth.js](https://next-auth.js.org)
