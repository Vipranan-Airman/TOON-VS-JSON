import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'
import { fromEnv } from '@aws-sdk/credential-providers'
import { SYSTEM_PROMPT, userPrompt } from '@/constants/prompts'

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: fromEnv(),
})

export type ClaudeResult = {
  answer: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  latencyMs: number
}

export async function askClaude(content: string, question: string): Promise<ClaudeResult> {
  const start = Date.now()

  const payload = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 256,
    temperature: 0,
    system: SYSTEM_PROMPT,
    messages: [
      { role: 'user', content: userPrompt(content, question) }
    ]
  }

  const command = new InvokeModelCommand({
    modelId: process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-5-sonnet-20241022',
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify(payload),
  })

  const response = await client.send(command)
  const result = JSON.parse(new TextDecoder().decode(response.body))

  const answer = result.content?.[0]?.text || ''
  
  return {
    answer,
    inputTokens: result.usage?.input_tokens || 0,
    outputTokens: result.usage?.output_tokens || 0,
    totalTokens: (result.usage?.input_tokens || 0) + (result.usage?.output_tokens || 0),
    latencyMs: Date.now() - start,
  }
}