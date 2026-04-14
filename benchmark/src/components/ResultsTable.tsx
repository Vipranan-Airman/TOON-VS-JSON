type Run = {
  format: string
  question: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  latencyMs: number
  answer: string
}

export default function ResultsTable({ runs }: { runs: Run[] }) {
  if (!runs.length) return <p className='text-sm text-gray-500'>No runs yet.</p>
  return (
    <div className='border rounded overflow-auto max-h-96'>
      <table className='text-xs w-full'>
        <thead className='bg-gray-50 sticky top-0'>
          <tr>{['Format','Question','In tok','Out tok','Total tok','ms'].map(h =>
            <th key={h} className='px-3 py-2 text-left font-medium text-gray-600 whitespace-nowrap'>{h}</th>
          )}</tr>
        </thead>
        <tbody>
          {runs.map((r, i) => (
            <tr key={i} className='border-t hover:bg-gray-50'>
              <td className='px-3 py-1.5'>
                <span className={`px-1.5 py-0.5 rounded font-medium ${r.format === 'toon' ? 'bg-yellow-100 text-yellow-800' : 'bg-indigo-100 text-indigo-800'}`}>
                  {r.format.toUpperCase()}
                </span>
              </td>
              <td className='px-3 py-1.5 max-w-xs truncate' title={r.question}>{r.question}</td>
              <td className='px-3 py-1.5'>{r.inputTokens}</td>
              <td className='px-3 py-1.5'>{r.outputTokens}</td>
              <td className='px-3 py-1.5 font-medium'>{r.totalTokens}</td>
              <td className='px-3 py-1.5'>{r.latencyMs}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}