# TOON vs JSON Benchmark

Compare Claude Sonnet 4.6 token usage and latency when processing the same content in JSON vs TOON format.

## How It Works

### 1. Data Formats

**JSON Format** (verbose):
```json
{
  sections: [
    { title: string, content: string },
    ...
  ]
}
```

**TOON Format** (compact):
```
sections[12]{title,content}:
  Section Name,The content here...
```

### 2. Benchmark Flow

```
STEP 1: Load JSON and TOON content (from public folder or paste)

STEP 2: Extract 20 question templates from JSON section titles
  e.g., What does the document say about Introduction?

STEP 3: For each repeat (default 5):
  For each question (20):
    - Send JSON query to Claude via AWS Bedrock
    - Send TOON query to Claude via AWS Bedrock
    - Record tokens and latency for each

STEP 4: Calculate averages and determine winner
```

### 3. What Gets Measured

| Metric | Description |
|--------|-------------|
| Input Tokens | Tokens sent to Claude (document + question) |
| Output Tokens | Tokens in Claude's response |
| Total Tokens | Input + Output |
| Latency (ms) | Time from request to response |

## Setup

```bash
cd benchmark
npm install
```

### Environment Variables

Create `.env`:
```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
BEDROCK_MODEL_ID=us.anthropic.claude-sonnet-4-6
```

### Run

```bash
npm run dev
```

Open http://localhost:3000

## Usage

1. The app auto-loads `operational-procedures.json` and `.toon` from the public folder
2. Set repeat count (default 5)
3. Click **Run Benchmark**

**Total API calls** = 20 questions × repeats × 2 formats. Default = 200 calls (~5-10 min depending on latency).

## API

**POST `/api/benchmark`**

Request:
```json
{
  jsonContent: string,
  toonContent: string,
  repeatCount: number
}
```

Response:
```json
{
  runs: [...],
  summary: {
    json: { avgInputTokens, avgOutputTokens, avgTotalTokens, avgLatencyMs, count },
    toon: { avgInputTokens, avgOutputTokens, avgTotalTokens, avgLatencyMs, count }
  }
}
```

## Why This Matters

- **JSON** is the standard data format but verbose
- **TOON** is a more compact syntax
- If TOON uses fewer tokens, it could reduce API costs and improve response times

## Example Output

```
Winner: TOON (15% fewer tokens)
JSON avg: 1,500 tokens | TOON avg: 1,275 tokens | Runs: 100/100
```

## Notes

- `temperature: 0`, `max_tokens: 256` for deterministic compact responses
- Results are calculated in-memory (no database)
- Uses AWS Bedrock to invoke Claude Sonnet 4.6