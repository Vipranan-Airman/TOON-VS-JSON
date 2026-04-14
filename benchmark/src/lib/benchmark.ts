import { askClaude } from './claude'

export function extractQuestions(jsonContent: string, count = 20): string[] {
  const data: unknown = JSON.parse(jsonContent)
  const titles: string[] = []
  const items = Array.isArray(data) ? data : [data]
  for (const item of items as Array<{ sections?: Array<{ title?: string }> }>) {
    for (const s of item.sections ?? []) {
      if (s.title) titles.push(s.title)
      if (titles.length >= count) break
    }
    if (titles.length >= count) break
  }
  const questions: string[] = []
  for (let i = 0; i < count; i++) {
    questions.push(`What does the document say about \"${titles[i % titles.length]}\"?`)
  }
  return questions
}