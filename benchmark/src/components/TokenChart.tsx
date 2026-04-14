'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

type S = { avgInputTokens: number; avgOutputTokens: number; avgTotalTokens: number; avgLatencyMs: number; count: number } | null

export default function TokenChart({ summary }: { summary: { json: S; toon: S } }) {
  if (!summary.json && !summary.toon) return null
  const data = [
    { name: 'Avg Input Tok', JSON: summary.json?.avgInputTokens ?? 0, TOON: summary.toon?.avgInputTokens ?? 0 },
    { name: 'Avg Total Tok', JSON: summary.json?.avgTotalTokens ?? 0, TOON: summary.toon?.avgTotalTokens ?? 0 },
    { name: 'Latency (ms)', JSON: summary.json?.avgLatencyMs ?? 0, TOON: summary.toon?.avgLatencyMs ?? 0 },
  ]
  return (
    <div className="border rounded p-4">
      <h2 className="text-sm font-semibold mb-3">Token &amp; Latency Comparison</h2>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data}>
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
