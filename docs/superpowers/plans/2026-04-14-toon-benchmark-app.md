# TOON Benchmark App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a minimal local-first web app that benchmarks Claude Sonnet 4.6 performance on identical questions answered from JSON vs TOON formatted documents, tracking token usage and latency.

**Architecture:** Next.js 14 App Router with two API routes (`POST /api/benchmark`, `GET /api/results`), Prisma + SQLite for storing per-call metrics, and a single-page dashboard with Recharts. Questions are extracted deterministically from the uploaded JSON (no extra API calls), then run sequentially against both formats.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Prisma + SQLite, Recharts, `@anthropic-ai/sdk`

---

## File Map

| Path | Responsibility |
|------|---------------|
| `benchmark/prisma/schema.prisma` | SQLite schema — single `BenchmarkRun` table |
| `benchmark/src/constants/prompts.ts` | All prompt strings + question generator |
| `benchmark/src/lib/prisma.ts` | Prisma client singleton |
| `benchmark/src/lib/claude.ts` | Single `askClaude()` wrapper returning tokens + latency |
| `benchmark/src/lib/benchmark.ts` | `extractQuestions()` + `runBenchmark()` orchestrator |
| `benchmark/src/app/api/benchmark/route.ts` | POST — validates input, runs benchmark, returns sessionId |
| `benchmark/src/app/api/results/route.ts` | GET — returns all runs + per-format aggregates |
| `benchmark/src/components/UploadForm.tsx` | Two textareas + repeat count + run button |
| `benchmark/src/components/TokenChart.tsx` | Recharts bar chart for avg token comparison |
| `benchmark/src/components/ResultsTable.tsx` | Scrollable table of per-run metrics |
| `benchmark/src/app/layout.tsx` | Minimal HTML shell |
| `benchmark/src/app/page.tsx` | Composes all components, fetches results |
| `benchmark/.env.example` | `ANTHROPIC_API_KEY` + `DATABASE_URL` |
| `benchmark/README.md` | Setup instructions |

---

## Task 1: Scaffold Next.js project

**Files:**
- Create: `benchmark/package.json`
- Create: `benchmark/next.config.js`
- Create: `benchmark/tsconfig.json`
- Create: `benchmark/tailwind.config.js`
- Create: `benchmark/postcss.config.js`

- [ ] **Step 1: Create the benchmark directory and package.json**

```bash
mkdir -p /Users/nancypravin/Airman/TOON-VS-JSON/benchmark
cd /Users/nancypravin/Airman/TOON-VS-JSON/benchmark
```

Create `benchmark/package.json`:
```json
{
  "name": "toon-benchmark",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "db:push": "prisma db push",
    "db:studio": "prisma studio"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.36.0",
    "@prisma/client": "^5.22.0",
    "next": "14.2.5",
    "react": "^18",
    "react-dom": "^18",
    "recharts": "^2.12.7"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "prisma": "^5.22.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5"
  }
}
```

- [ ] **Step 2: Create config files**

Create `benchmark/next.config.js`:
```js
/** @type {import('next').NextConfig} */
const nextConfig = {}
module.exports = nextConfig
```

Create `benchmark/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "es2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

Create `benchmark/tailwind.config.js`:
```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: { extend: {} },
  plugins: [],
}
```

Create `benchmark/postcss.config.js`:
```js
module.exports = {
  plugins: { tailwindcss: {}, autoprefixer: {} },
}
```

- [ ] **Step 3: Install dependencies**

```bash
cd /Users/nancypravin/Airman/TOON-VS-JSON/benchmark
npm install
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 4: Commit**

```bash
cd /Users/nancypravin/Airman/TOON-VS-JSON
git add benchmark/package.json benchmark/next.config.js benchmark/tsconfig.json benchmark/tailwind.config.js benchmark/postcss.config.js
git commit -m "feat: scaffold Next.js benchmark app"
```

---

## Task 2: Prisma schema + SQLite setup

**Files:**
- Create: `benchmark/prisma/schema.prisma`
- Create: `benchmark/.env`
- Create: `benchmark/.env.example`

- [ ] **Step 1: Create Prisma schema**

Create `benchmark/prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model BenchmarkRun {
  id           Int      @id @default(autoincrement())
  sessionId    String
  format       String
  question     String
  inputTokens  Int
  outputTokens Int
  totalTokens  Int
  latencyMs    Int
  rawOutput    String
  qualityScore Float?
  createdAt    DateTime @default(now())
}
```

- [ ] **Step 2: Create .env and .env.example**

Create `benchmark/.env`:
```
DATABASE_URL="file:./dev.db"
ANTHROPIC_API_KEY="your-api-key-here"
```

Create `benchmark/.env.example`:
```
DATABASE_URL="file:./dev.db"
ANTHROPIC_API_KEY="your-api-key-here"
```

- [ ] **Step 3: Push schema to SQLite**

```bash
cd /Users/nancypravin/Airman/TOON-VS-JSON/benchmark
npx prisma db push
```

Expected output:
```
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": SQLite database "dev.db" at "file:./dev.db"
✓ Generated Prisma Client
The SQLite database "dev.db" from "file:./dev.db" was successfully created.
```

- [ ] **Step 4: Add .env and dev.db to .gitignore**

Create `benchmark/.gitignore`:
```
node_modules/
.next/
.env
prisma/dev.db
prisma/dev.db-journal
```

- [ ] **Step 5: Commit**

```bash
cd /Users/nancypravin/Airman/TOON-VS-JSON
git add benchmark/prisma/schema.prisma benchmark/.env.example benchmark/.gitignore
git commit -m "feat: add Prisma SQLite schema for benchmark runs"
```

---

## Task 3: Prompt constants

**Files:**
- Create: `benchmark/src/constants/prompts.ts`

- [ ] **Step 1: Create the constants file**

Create `benchmark/src/constants/prompts.ts`:
```ts
export const SYSTEM_PROMPT =
  'Answer questions based only on the provided document. Be concise.'

export const userPrompt = (content: string, question: string): string =>
  `${content}\n\n---\nQ: ${question}`

export const questionFromTitle = (title: string): string =>
  `What does the document say about "${title}"?`
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/nancypravin/Airman/TOON-VS-JSON/benchmark
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/nancypravin/Airman/TOON-VS-JSON
git add benchmark/src/constants/prompts.ts
git commit -m "feat: add prompt template constants"
```

---

## Task 4: Prisma client singleton + Claude wrapper

**Files:**
- Create: `benchmark/src/lib/prisma.ts`
- Create: `benchmark/src/lib/claude.ts`

- [ ] **Step 1: Create Prisma singleton**

Create `benchmark/src/lib/prisma.ts`:
```ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

- [ ] **Step 2: Create Claude API wrapper**

Create `benchmark/src/lib/claude.ts`:
```ts
import Anthropic from '@anthropic-ai/sdk'
import { SYSTEM_PROMPT, userPrompt } from '@/constants/prompts'

const client = new Anthropic()

export type ClaudeResult = {
  answer: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  latencyMs: number
}

export async function askClaude(
  content: string,
  question: string
): Promise<ClaudeResult> {
  const start = Date.now()
  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 256,
    temperature: 0,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt(content, question) }],
  })
  const latencyMs = Date.now() - start
  const answer =
    msg.content[0].type === 'text' ? msg.content[0].text : ''
  return {
    answer,
    inputTokens: msg.usage.input_tokens,
    outputTokens: msg.usage.output_tokens,
    totalTokens: msg.usage.input_tokens + msg.usage.output_tokens,
    latencyMs,
  }
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/nancypravin/Airman/TOON-VS-JSON/benchmark
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
cd /Users/nancypravin/Airman/TOON-VS-JSON
git add benchmark/src/lib/prisma.ts benchmark/src/lib/claude.ts
git commit -m "feat: add Prisma singleton and Claude API wrapper"
```

---

## Task 5: Benchmark runner logic

**Files:**
- Create: `benchmark/src/lib/benchmark.ts`

- [ ] **Step 1: Create the benchmark runner**

Create `benchmark/src/lib/benchmark.ts`:
```ts
import { prisma } from './prisma'
import { askClaude } from './claude'
import { questionFromTitle } from '@/constants/prompts'

export function extractQuestions(jsonContent: string, count = 20): string[] {
  const data: unknown = JSON.parse(jsonContent)
  const titles: string[] = []
  const items = Array.isArray(data) ? data : [data]

  for (const item of items as Array<{ sections?: Array<{ title?: string }> }>) {
    for (const section of item.sections ?? []) {
      if (section.title) titles.push(section.title)
      if (titles.length >= count) break
    }
    if (titles.length >= count) break
  }

  // Cycle if fewer than count titles
  const questions: string[] = []
  for (let i = 0; i < count; i++) {
    questions.push(questionFromTitle(titles[i % titles.length]))
  }
  return questions
}

export async function runBenchmark(params: {
  sessionId: string
  jsonContent: string
  toonContent: string
  repeatCount: number
}): Promise<void> {
  const { sessionId, jsonContent, toonContent, repeatCount } = params
  const questions = extractQuestions(jsonContent)
  const formats: Array<[string, string]> = [
    ['json', jsonContent],
    ['toon', toonContent],
  ]

  for (let r = 0; r < repeatCount; r++) {
    for (const question of questions) {
      for (const [format, content] of formats) {
        const result = await askClaude(content, question)
        await prisma.benchmarkRun.create({
          data: {
            sessionId,
            format,
            question,
            inputTokens: result.inputTokens,
            outputTokens: result.outputTokens,
            totalTokens: result.totalTokens,
            latencyMs: result.latencyMs,
            rawOutput: result.answer,
          },
        })
      }
    }
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/nancypravin/Airman/TOON-VS-JSON/benchmark
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/nancypravin/Airman/TOON-VS-JSON
git add benchmark/src/lib/benchmark.ts
git commit -m "feat: add benchmark runner with deterministic question extraction"
```

---

## Task 6: API routes

**Files:**
- Create: `benchmark/src/app/api/benchmark/route.ts`
- Create: `benchmark/src/app/api/results/route.ts`

- [ ] **Step 1: Create the benchmark POST route**

Create `benchmark/src/app/api/benchmark/route.ts`:
```ts
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { runBenchmark } from '@/lib/benchmark'

export async function POST(req: Request) {
  const body = await req.json() as {
    jsonContent?: string
    toonContent?: string
    repeatCount?: number
  }
  const { jsonContent, toonContent, repeatCount = 5 } = body

  if (!jsonContent || !toonContent) {
    return NextResponse.json({ error: 'jsonContent and toonContent required' }, { status: 400 })
  }

  const sessionId = randomUUID()
  await runBenchmark({ sessionId, jsonContent, toonContent, repeatCount })
  return NextResponse.json({ sessionId })
}
```

- [ ] **Step 2: Create the results GET route**

Create `benchmark/src/app/api/results/route.ts`:
```ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function aggregate(runs: Array<{
  inputTokens: number
  outputTokens: number
  totalTokens: number
  latencyMs: number
}>) {
  const n = runs.length
  if (!n) return null
  return {
    avgInputTokens: Math.round(runs.reduce((s, r) => s + r.inputTokens, 0) / n),
    avgOutputTokens: Math.round(runs.reduce((s, r) => s + r.outputTokens, 0) / n),
    avgTotalTokens: Math.round(runs.reduce((s, r) => s + r.totalTokens, 0) / n),
    avgLatencyMs: Math.round(runs.reduce((s, r) => s + r.latencyMs, 0) / n),
    count: n,
  }
}

export async function GET() {
  const runs = await prisma.benchmarkRun.findMany({
    orderBy: { createdAt: 'desc' },
    take: 500,
  })

  return NextResponse.json({
    runs,
    summary: {
      json: aggregate(runs.filter(r => r.format === 'json')),
      toon: aggregate(runs.filter(r => r.format === 'toon')),
    },
  })
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/nancypravin/Airman/TOON-VS-JSON/benchmark
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
cd /Users/nancypravin/Airman/TOON-VS-JSON
git add benchmark/src/app/api/benchmark/route.ts benchmark/src/app/api/results/route.ts
git commit -m "feat: add benchmark and results API routes"
```

---

## Task 7: Frontend components

**Files:**
- Create: `benchmark/src/components/UploadForm.tsx`
- Create: `benchmark/src/components/TokenChart.tsx`
- Create: `benchmark/src/components/ResultsTable.tsx`

- [ ] **Step 1: Create UploadForm component**

Create `benchmark/src/components/UploadForm.tsx`:
```tsx
'use client'
import { useState } from 'react'

type Props = {
  onRun: (jsonContent: string, toonContent: string, repeatCount: number) => void
  loading: boolean
}

export default function UploadForm({ onRun, loading }: Props) {
  const [jsonContent, setJsonContent] = useState('')
  const [toonContent, setToonContent] = useState('')
  const [repeatCount, setRepeatCount] = useState(5)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!jsonContent.trim() || !toonContent.trim()) return
    onRun(jsonContent, toonContent, repeatCount)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">JSON content</label>
          <textarea
            className="w-full h-48 p-2 border rounded font-mono text-xs resize-y"
            placeholder="Paste JSON document..."
            value={jsonContent}
            onChange={e => setJsonContent(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">TOON content</label>
          <textarea
            className="w-full h-48 p-2 border rounded font-mono text-xs resize-y"
            placeholder="Paste TOON document..."
            value={toonContent}
            onChange={e => setToonContent(e.target.value)}
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">
          Repeat count:
          <input
            type="number"
            min={1}
            max={20}
            value={repeatCount}
            onChange={e => setRepeatCount(Number(e.target.value))}
            className="ml-2 w-16 border rounded px-2 py-1 text-sm"
          />
        </label>
        <button
          type="submit"
          disabled={loading || !jsonContent.trim() || !toonContent.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded text-sm disabled:opacity-50"
        >
          {loading ? 'Running...' : 'Run Benchmark'}
        </button>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Create TokenChart component**

Create `benchmark/src/components/TokenChart.tsx`:
```tsx
'use client'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

type Summary = {
  avgInputTokens: number
  avgOutputTokens: number
  avgTotalTokens: number
  avgLatencyMs: number
  count: number
} | null

type Props = {
  summary: { json: Summary; toon: Summary }
}

export default function TokenChart({ summary }: Props) {
  if (!summary.json && !summary.toon) return null

  const data = [
    {
      name: 'Avg Input Tokens',
      JSON: summary.json?.avgInputTokens ?? 0,
      TOON: summary.toon?.avgInputTokens ?? 0,
    },
    {
      name: 'Avg Total Tokens',
      JSON: summary.json?.avgTotalTokens ?? 0,
      TOON: summary.toon?.avgTotalTokens ?? 0,
    },
    {
      name: 'Avg Latency (ms)',
      JSON: summary.json?.avgLatencyMs ?? 0,
      TOON: summary.toon?.avgLatencyMs ?? 0,
    },
  ]

  return (
    <div className="border rounded p-4">
      <h2 className="text-sm font-semibold mb-3">Token &amp; Latency Comparison</h2>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="JSON" fill="#6366f1" />
          <Bar dataKey="TOON" fill="#f59e0b" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 3: Create ResultsTable component**

Create `benchmark/src/components/ResultsTable.tsx`:
```tsx
type Run = {
  id: number
  sessionId: string
  format: string
  question: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  latencyMs: number
  qualityScore: number | null
  createdAt: string
}

type Props = { runs: Run[] }

export default function ResultsTable({ runs }: Props) {
  if (!runs.length) return <p className="text-sm text-gray-500">No runs yet.</p>

  return (
    <div className="border rounded overflow-auto max-h-96">
      <table className="text-xs w-full">
        <thead className="bg-gray-50 sticky top-0">
          <tr>
            {['Format', 'Question', 'Input tok', 'Output tok', 'Total tok', 'Latency (ms)', 'Quality'].map(h => (
              <th key={h} className="px-3 py-2 text-left font-medium text-gray-600 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {runs.map(run => (
            <tr key={run.id} className="border-t hover:bg-gray-50">
              <td className="px-3 py-1.5">
                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                  run.format === 'toon' ? 'bg-yellow-100 text-yellow-800' : 'bg-indigo-100 text-indigo-800'
                }`}>{run.format.toUpperCase()}</span>
              </td>
              <td className="px-3 py-1.5 max-w-xs truncate" title={run.question}>{run.question}</td>
              <td className="px-3 py-1.5">{run.inputTokens}</td>
              <td className="px-3 py-1.5">{run.outputTokens}</td>
              <td className="px-3 py-1.5 font-medium">{run.totalTokens}</td>
              <td className="px-3 py-1.5">{run.latencyMs}</td>
              <td className="px-3 py-1.5 text-gray-400">{run.qualityScore ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
cd /Users/nancypravin/Airman/TOON-VS-JSON
git add benchmark/src/components/
git commit -m "feat: add UploadForm, TokenChart, ResultsTable components"
```

---

## Task 8: App layout and main page

**Files:**
- Create: `benchmark/src/app/globals.css`
- Create: `benchmark/src/app/layout.tsx`
- Create: `benchmark/src/app/page.tsx`

- [ ] **Step 1: Create globals.css**

Create `benchmark/src/app/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 2: Create layout**

Create `benchmark/src/app/layout.tsx`:
```tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TOON vs JSON Benchmark',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900 antialiased">{children}</body>
    </html>
  )
}
```

- [ ] **Step 3: Create main page**

Create `benchmark/src/app/page.tsx`:
```tsx
'use client'
import { useState, useEffect, useCallback } from 'react'
import UploadForm from '@/components/UploadForm'
import TokenChart from '@/components/TokenChart'
import ResultsTable from '@/components/ResultsTable'

type Summary = {
  avgInputTokens: number
  avgOutputTokens: number
  avgTotalTokens: number
  avgLatencyMs: number
  count: number
} | null

type Run = {
  id: number
  sessionId: string
  format: string
  question: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  latencyMs: number
  qualityScore: number | null
  createdAt: string
}

type Results = {
  runs: Run[]
  summary: { json: Summary; toon: Summary }
}

export default function Home() {
  const [results, setResults] = useState<Results | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchResults = useCallback(async () => {
    const res = await fetch('/api/results')
    const data = await res.json() as Results
    setResults(data)
  }, [])

  useEffect(() => { void fetchResults() }, [fetchResults])

  async function handleRun(jsonContent: string, toonContent: string, repeatCount: number) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/benchmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonContent, toonContent, repeatCount }),
      })
      if (!res.ok) {
        const body = await res.json() as { error?: string }
        throw new Error(body.error ?? 'Benchmark failed')
      }
      await fetchResults()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const { json, toon } = results?.summary ?? {}
  const winner =
    json && toon
      ? json.avgTotalTokens <= toon.avgTotalTokens
        ? 'JSON'
        : 'TOON'
      : null

  const savings =
    json && toon && winner === 'TOON'
      ? Math.round((1 - toon.avgTotalTokens / json.avgTotalTokens) * 100)
      : json && toon && winner === 'JSON'
      ? Math.round((1 - json.avgTotalTokens / toon.avgTotalTokens) * 100)
      : 0

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold">TOON vs JSON Benchmark</h1>
        <p className="text-sm text-gray-500 mt-1">
          Compare Claude Sonnet 4.6 token usage on identical questions across formats.
        </p>
      </div>

      <UploadForm onRun={handleRun} loading={loading} />

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {error}
        </div>
      )}

      {winner && (
        <div className="p-3 bg-green-50 border border-green-200 rounded text-sm">
          Token efficiency winner: <strong>{winner}</strong>
          {savings > 0 && <span className="ml-1 text-gray-600">({savings}% fewer tokens)</span>}
          <span className="ml-3 text-gray-500">
            JSON avg: {json?.avgTotalTokens ?? '—'} | TOON avg: {toon?.avgTotalTokens ?? '—'} | 
            Runs: {json?.count ?? 0} JSON / {toon?.count ?? 0} TOON
          </span>
        </div>
      )}

      {results && (
        <>
          <TokenChart summary={results.summary} />
          <ResultsTable runs={results.runs} />
        </>
      )}
    </main>
  )
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /Users/nancypravin/Airman/TOON-VS-JSON/benchmark
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
cd /Users/nancypravin/Airman/TOON-VS-JSON
git add benchmark/src/app/
git commit -m "feat: add app layout and main dashboard page"
```

---

## Task 9: README and env config

**Files:**
- Create: `benchmark/README.md`

- [ ] **Step 1: Create README**

Create `benchmark/README.md`:
```markdown
# TOON vs JSON Benchmark

Minimal local benchmark comparing Claude Sonnet 4.6 token usage on JSON vs TOON formatted documents.

## Setup

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Copy env file and add your API key:
   \`\`\`bash
   cp .env.example .env
   # Edit .env and set ANTHROPIC_API_KEY
   \`\`\`

3. Initialize database:
   \`\`\`bash
   npm run db:push
   \`\`\`

4. Start dev server:
   \`\`\`bash
   npm run dev
   \`\`\`

5. Open http://localhost:3000

## Usage

1. Paste your JSON document in the left textarea
2. Paste the equivalent TOON document in the right textarea
3. Set repeat count (default 5 — each repeat runs all 20 questions)
4. Click **Run Benchmark**

The benchmark extracts up to 20 section titles from the JSON and asks retrieval questions against both formats. Each API call uses `temperature: 0` and `max_tokens: 256` for deterministic, compact responses.

## Notes

- Total API calls per run = 20 questions × repeatCount × 2 formats
- Default 5 repeats = 200 API calls (~1–5 min depending on network)
- Reduce repeat count for faster/cheaper test runs
- Results persist in `prisma/dev.db` across restarts
- Quality score field is for manual grading (nullable, not auto-computed)
```

- [ ] **Step 2: Commit**

```bash
cd /Users/nancypravin/Airman/TOON-VS-JSON
git add benchmark/README.md
git commit -m "docs: add benchmark app README with setup instructions"
```

---

## Task 10: Smoke test end-to-end

**No new files — verify the app runs.**

- [ ] **Step 1: Start dev server**

```bash
cd /Users/nancypravin/Airman/TOON-VS-JSON/benchmark
npm run dev
```

Expected output:
```
▲ Next.js 14.x.x
- Local: http://localhost:3000
✓ Ready in Xs
```

- [ ] **Step 2: Verify results endpoint returns empty state**

```bash
curl http://localhost:3000/api/results
```

Expected:
```json
{"runs":[],"summary":{"json":null,"toon":null}}
```

- [ ] **Step 3: Verify benchmark endpoint validates input**

```bash
curl -X POST http://localhost:3000/api/benchmark \
  -H "Content-Type: application/json" \
  -d '{}'
```

Expected:
```json
{"error":"jsonContent and toonContent required"}
```

- [ ] **Step 4: Open browser and verify UI renders**

Visit http://localhost:3000

Expected: Page loads with two textareas, repeat count input, and Run Benchmark button.

- [ ] **Step 5: Final commit**

```bash
cd /Users/nancypravin/Airman/TOON-VS-JSON
git add -A
git commit -m "feat: complete TOON vs JSON benchmark app"
```

---

## Self-Review

### Spec Coverage

| Requirement | Task |
|-------------|------|
| Upload/paste JSON + TOON | Task 7 — UploadForm two textareas |
| Run against Claude Sonnet 4.6 | Task 4 — claude.ts, model hardcoded |
| Identical prompt for both formats | Task 3 — shared `userPrompt()` constant |
| 20 quiz questions | Task 5 — `extractQuestions()` with count=20 |
| Configurable repeat count (default 5) | Task 7 — UploadForm input, Task 6 — API default |
| Store format, tokens, latency, raw output, timestamp | Task 2 — Prisma schema |
| Avg token usage by format | Task 6 — results route `aggregate()` |
| Avg latency by format | Task 6 — results route `aggregate()` |
| Per-run comparison table | Task 7 — ResultsTable |
| Bar chart for token comparison | Task 7 — TokenChart |
| Winner summary | Task 8 — page.tsx winner banner |
| Efficiency score | Schema has `qualityScore` nullable; banner shows token winner |
| Temperature = 0 | Task 4 — claude.ts |
| Prompts in constants file | Task 3 — prompts.ts |
| SQLite via Prisma | Task 2 |
| Next.js + Tailwind + Recharts | Task 1 |

### No Placeholders
Checked — all steps contain complete code. No TBDs.

### Type Consistency
- `BenchmarkRun` fields match between schema (Task 2), `prisma.benchmarkRun.create` (Task 5), and `Run` type in page.tsx (Task 8) ✓
- `Summary` type in page.tsx matches `aggregate()` return shape in results route ✓
- `askClaude` returns `ClaudeResult` matching fields written to DB ✓
