import { NextResponse } from 'next/server'
import { askClaude } from '@/lib/claude'
import { extractQuestions } from '@/lib/benchmark'

const CONCURRENT_LIMIT = 10

async function runInBatches<T>(items: T[], batchSize: number, fn: (item: T) => Promise<unknown>): Promise<unknown[]> {
  const results: unknown[] = []
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const batchResults = await Promise.all(batch.map(fn))
    results.push(...batchResults)
  }
  return results
}

export async function POST(req: Request) {
  const { jsonContent, toonContent, repeatCount = 1 } = await req.json() as {
    jsonContent?: string
    toonContent?: string
    repeatCount?: number
  }
  if (!jsonContent || !toonContent) {
    return NextResponse.json({ error: 'jsonContent and toonContent required' }, { status: 400 })
  }

  const questions = extractQuestions(jsonContent, 10)
  const formats: [string, string][] = [['json', jsonContent], ['toon', toonContent]]

  const tasks: Array<{ format: string; content: string; question: string }> = []
  for (let r = 0; r < repeatCount; r++) {
    for (const question of questions) {
      for (const [format, content] of formats) {
        tasks.push({ format, content, question })
      }
    }
  }

  const results = await runInBatches(tasks, CONCURRENT_LIMIT, async (task) => {
    const result = await askClaude(task.content, task.question)
    return { format: task.format, question: task.question, ...result }
  })

  const jsonRuns = results.filter(r => (r as { format: string }).format === 'json')
  const toonRuns = results.filter(r => (r as { format: string }).format === 'toon')

  const agg = (runs: typeof results) => {
    if (!runs.length) return null
    const r = runs as Array<{ inputTokens: number; outputTokens: number; totalTokens: number; latencyMs: number }>
    return {
      avgInputTokens: Math.round(r.reduce((s, x) => s + x.inputTokens, 0) / r.length),
      avgOutputTokens: Math.round(r.reduce((s, x) => s + x.outputTokens, 0) / r.length),
      avgTotalTokens: Math.round(r.reduce((s, x) => s + x.totalTokens, 0) / r.length),
      avgLatencyMs: Math.round(r.reduce((s, x) => s + x.latencyMs, 0) / r.length),
      count: r.length,
    }
  }

  return NextResponse.json({
    runs: results,
    summary: {
      json: agg(jsonRuns),
      toon: agg(toonRuns),
    },
  })
}