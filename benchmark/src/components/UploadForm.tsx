'use client'
import { useState, useEffect } from 'react'

type Props = { onRun: (json: string, toon: string, repeats: number) => void; loading: boolean }

export default function UploadForm({ onRun, loading }: Props) {
  const [json, setJson] = useState('')
  const [toon, setToon] = useState('')
  const [repeats, setRepeats] = useState(5)
  const [loadingSample, setLoadingSample] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/operational-procedures.json').then(r => r.text()),
      fetch('/operational-procedures.toon').then(r => r.text()),
    ]).then(([j, t]) => { setJson(j); setToon(t) }).finally(() => setLoadingSample(false))
  }, [])

  const isReady = json.trim() && toon.trim()

  return (
    <form onSubmit={e => { e.preventDefault(); onRun(json, toon, repeats) }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">JSON content {loadingSample && '(loading...)'}</label>
          <textarea className="w-full h-48 p-2 border rounded font-mono text-xs resize-y"
            placeholder="Paste JSON..." value={json} onChange={e => setJson(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">TOON content {loadingSample && '(loading...)'}</label>
          <textarea className="w-full h-48 p-2 border rounded font-mono text-xs resize-y"
            placeholder="Paste TOON..." value={toon} onChange={e => setToon(e.target.value)} />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">
          Repeats:
          <input type="number" min={1} max={20} value={repeats}
            onChange={e => setRepeats(Number(e.target.value))}
            className="ml-2 w-16 border rounded px-2 py-1 text-sm" />
        </label>
        <button type="submit" disabled={loading || !isReady}
          className="px-4 py-2 bg-blue-600 text-white rounded text-sm disabled:opacity-50">
          {loading ? 'Running…' : 'Run Benchmark'}
        </button>
      </div>
    </form>
  )
}
