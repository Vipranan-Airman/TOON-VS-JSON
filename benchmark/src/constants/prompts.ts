export const SYSTEM_PROMPT =
  'Answer questions based only on the provided document. Be concise.'

export const userPrompt = (content: string, question: string): string =>
  `${content}\n\n---\nQ: ${question}`

export const questionFromTitle = (title: string): string =>
  `What does the document say about "${title}"?`
