# CodeCoach

CodeCoach is an AI-assisted coding interview workspace built for real-time problem solving. It combines a LeetCode-style interface, a persistent coding session, a built-in AI coach, and a runnable execution engine in one product.

The goal is simple: give candidates a place to practice interview problems while getting fast, contextual feedback on code quality, runtime choices, and interview red flags without leaving the editor.

## Why This Project Matters

This project is meant to demonstrate full-stack product engineering, not just UI work.

It includes:
- a custom problem workspace built with Next.js App Router
- Monaco-based code editing with language-aware starter templates
- AI chat and debounced code analysis
- problem/test-case storage with Prisma + PostgreSQL
- auth, solved-problem tracking, and session persistence
- runnable code execution against seeded interview problems
- CI/CD, dependency review, code scanning, and protected branch workflows

## Core Product Features

### Interview workspace
- Three-panel layout for problems, coding, and coaching
- Monaco editor with `vs-dark`
- Language switching across Python, JavaScript, Java, and C++
- Draft persistence per session, problem, and language
- Session persistence across refreshes

### AI coaching
- Chat-based interview assistance tied to the current problem and code
- Separate real-time code analysis banner for complexity and interview feedback
- Local-first AI support through Ollama
- Optional OpenAI support through environment configuration

### Problem solving flow
- Seeded interview-style problems:
  - Two Sum
  - Valid Parentheses
  - Best Time to Buy and Sell Stock
- Visible test-case execution through the run engine
- Result states for accepted, wrong answer, compile error, and runtime error
- Cleaner error UX with expandable runner details

### User accounts and progress
- Email/password auth
- Google sign-in support
- Solved-problem tracking
- Persistent solved badges across sessions for authenticated users

### Engineering and platform work
- Prisma schema with relational models for problems, sessions, auth, solved progress, and test cases
- Local development stack with PostgreSQL
- GitHub Actions CI/CD foundation with lint, tests, build, migration smoke checks, and dependency review

## Tech Stack

| Layer | Stack |
| --- | --- |
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS |
| Editor | Monaco via `@monaco-editor/react` |
| Backend | Next.js Route Handlers |
| Database | PostgreSQL + Prisma ORM |
| AI | Ollama by default, optional OpenAI |
| Code Execution | Local runner on macOS, Piston-compatible execution path |
| Auth | Custom cookie sessions + Google OAuth |
| Testing | Vitest |

## Architecture Overview

### Frontend
- [app/page.tsx](/Users/ekin/Desktop/projects/codista/app/page.tsx)
- [components/codecoach-workspace.tsx](/Users/ekin/Desktop/projects/codista/components/codecoach-workspace.tsx)
- [components/monaco-editor-panel.tsx](/Users/ekin/Desktop/projects/codista/components/monaco-editor-panel.tsx)

The UI is built as a client-driven workspace that coordinates:
- problem loading
- editor state
- AI chat state
- code analysis state
- run results
- auth state
- solved progress

### API routes
- [app/api/problems/route.ts](/Users/ekin/Desktop/projects/codista/app/api/problems/route.ts)
- [app/api/problems/[slug]/route.ts](/Users/ekin/Desktop/projects/codista/app/api/problems/[slug]/route.ts)
- [app/api/chat/route.ts](/Users/ekin/Desktop/projects/codista/app/api/chat/route.ts)
- [app/api/chat/history/route.ts](/Users/ekin/Desktop/projects/codista/app/api/chat/history/route.ts)
- [app/api/analyze/route.ts](/Users/ekin/Desktop/projects/codista/app/api/analyze/route.ts)
- [app/api/run/route.ts](/Users/ekin/Desktop/projects/codista/app/api/run/route.ts)
- [app/api/auth/login/route.ts](/Users/ekin/Desktop/projects/codista/app/api/auth/login/route.ts)
- [app/api/auth/register/route.ts](/Users/ekin/Desktop/projects/codista/app/api/auth/register/route.ts)
- [app/api/auth/google/route.ts](/Users/ekin/Desktop/projects/codista/app/api/auth/google/route.ts)
- [app/api/auth/google/callback/route.ts](/Users/ekin/Desktop/projects/codista/app/api/auth/google/callback/route.ts)

### Data layer
- [prisma/schema.prisma](/Users/ekin/Desktop/projects/codista/prisma/schema.prisma)
- [prisma/seed.ts](/Users/ekin/Desktop/projects/codista/prisma/seed.ts)

Key models:
- `Problem`
- `TestCase`
- `ChatMessage`
- `Session`
- `User`
- `AuthSession`
- `SolvedProblem`

## What I Focused On Technically

- Building a product-shaped interface instead of a generic CRUD app
- Keeping AI analysis separate from chat so coaching feels lightweight and useful
- Designing persistence around real usage patterns:
  - chat survives refresh
  - code survives refresh
  - language choice survives refresh
  - solved progress survives across sessions for logged-in users
- Handling rough real-world edges like:
  - invalid AI responses
  - missing local AI runtime
  - runner crashes
  - stale dev assets
  - auth/session recovery

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy [`.env.example`](/Users/ekin/Desktop/projects/codista/.env.example) to `.env` and fill in the values you want to use.

Minimum local setup:

```env
DATABASE_URL="postgresql://your_username@localhost:5432/codecoach"
AI_PROVIDER="ollama"
OLLAMA_BASE_URL="http://127.0.0.1:11434"
OLLAMA_MODEL="qwen2.5-coder:3b"
```

### 3. Start PostgreSQL

Create the database if needed:

```bash
createdb codecoach
```

Apply the schema and seed problems:

```bash
npx prisma db push
npx prisma generate
npm run seed
```

### 4. Start AI locally with Ollama

Install Ollama from [ollama.com/download](https://ollama.com/download), then pull a coding model:

```bash
ollama pull qwen2.5-coder:3b
```

### 5. Optional: enable Google sign-in

Add these to `.env`:

```env
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"
```

In Google Cloud, configure:
- Authorized JavaScript origin: `http://localhost:3000`
- Authorized redirect URI: `http://localhost:3000/api/auth/google/callback`

### 6. Optional: configure OpenAI instead of Ollama

```env
AI_PROVIDER="openai"
OPENAI_API_KEY="your_openai_api_key"
OPENAI_MODEL="gpt-4o"
```

### 7. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Code Execution Notes

CodeCoach supports execution for the seeded problems and languages, but the local execution path differs by environment.

- On macOS, the app prefers a local runner for better reliability during development
- A Piston-compatible execution path also exists for self-hosted or Linux-style environments
- Current seeded problems run against visible test cases stored in the database

## Available Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run test
npm run typecheck
npm run seed
```

## Quality / CI

The repo includes a stronger-than-average portfolio CI baseline:
- linting
- tests
- production build verification
- Prisma validation/generation
- migration smoke checks
- dependency review
- CodeQL/code scanning support

## Current Scope

What this project currently does well:
- interactive interview workspace
- AI coaching in context
- persistent sessions and drafts
- authenticated solved tracking
- local-first developer setup

What could be extended next:
- hidden test cases and full submit flow
- richer judge infrastructure across all languages
- collaborative sessions
- replay/session analytics
- production deployment infrastructure

## Notes

- `.env` is ignored by Git, so secrets should stay local or in your deployment platform
- If you switch AI providers, restart the dev server so the server runtime picks up the new env vars
- If Next dev gets into a stale state locally, clearing `.next` and restarting usually fixes it
