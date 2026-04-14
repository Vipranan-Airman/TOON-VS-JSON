'use client'
import { useState } from 'react'
import UploadForm from '@/components/UploadForm'
import TokenChart from '@/components/TokenChart'
import ResultsTable from '@/components/ResultsTable'

type S = { avgInputTokens: number; avgOutputTokens: number; avgTotalTokens: number; avgLatencyMs: number; count: number } | null
type Run = { format: string; question: string; inputTokens: number; outputTokens: number; totalTokens: number; latencyMs: number; answer: string }
type Results = { runs: Run[]; summary: { json: S; toon: S } }

export default function Home() {
  const [results, setResults] = useState<Results | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleRun(jsonContent: string, toonContent: string, repeatCount: number) {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/benchmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonContent, toonContent, repeatCount }),
      })
      if (!res.ok) throw new Error(((await res.json()) as { error?: string }).error ?? 'Failed')
      const data = await res.json() as Results
      setResults(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const { json, toon } = results?.summary ?? {}
  const winner = json && toon ? (json.avgTotalTokens <= toon.avgTotalTokens ? 'JSON' : 'TOON') : null
  const savings = json && toon
    ? Math.round((1 - Math.min(json.avgTotalTokens, toon.avgTotalTokens) / Math.max(json.avgTotalTokens, toon.avgTotalTokens)) * 100)
    : 0

  return (
    <main className='max-w-5xl mx-auto p-6 space-y-6'>
      <div>
        <h1 className='text-xl font-bold'>TOON vs JSON Benchmark</h1>
        <p className='text-sm text-gray-500 mt-1'>Compare Claude Sonnet 4.6 token usage across formats.</p>
      </div>

      <UploadForm onRun={handleRun} loading={loading} />

      {error && <div className='p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700'>{error}</div>}

      {winner && (
        <div className='p-3 bg-green-50 border border-green-200 rounded text-sm'>
          Winner: <strong>{winner}</strong>
          {savings > 0 && <span className='ml-1 text-gray-600'>({savings}% fewer tokens)</span>}
          <span className='ml-3 text-gray-500'>JSON avg: {json?.avgTotalTokens} | TOON avg: {toon?.avgTotalTokens} | Runs: {json?.count}/{toon?.count}</span>
        </div>
      )}

      {results && <><TokenChart summary={results.summary} /><ResultsTable runs={results.runs} /></>}
    </main>
  )
}