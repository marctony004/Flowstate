# Shared NLP Helpers

Reusable utilities for FlowState's AI/NLP edge functions.

## `nlp-helpers.ts`

### CORS
- `corsHeaders` — standard CORS headers object
- `handleCors(req)` — returns preflight response for OPTIONS, or null

### Supabase
- `getSupabase()` — lazily creates a service-role Supabase client

### Gemini API
- `geminiChat(opts)` — calls Gemini `generateContent` endpoint
  - Options: `model`, `systemPrompt`, `prompt`, `temperature`, `maxOutputTokens`
  - Returns `{ rawText, json }` — json is auto-parsed from the response
- `geminiEmbed(opts)` — calls Gemini `embedContent` endpoint
  - Returns float array (embedding vector)

### Parsing
- `parseGeminiJson(raw)` — strips markdown fences and parses JSON, returns null on failure

### Responses
- `jsonResponse(body, status)` — JSON response with CORS headers
- `errorResponse(message, status)` — error JSON response with CORS headers
- `handleError(error, fallbackMessage)` — top-level catch handler

### Usage Logging
- `logApiUsage(params)` — fire-and-forget insert to `session_logs` with `event_type: "api_usage"`

## Edge Functions Using These Patterns

| Function | Model | Purpose |
|----------|-------|---------|
| `ask-flowstate` | gemini-1.5-flash + text-embedding-004 | RAG chat with semantic search |
| `detect-project-state` | gemini-1.5-flash | Project health classification |
| `analyze-sentiment` | gemini-1.5-flash | Collaborator feedback sentiment |
| `creative-block-help` | gemini-1.5-flash | Creative block suggestions |
| `ai-usage-stats` | — | Usage monitoring (no AI calls) |

## Conventions

- **Temperature**: 0.3 for classification/analysis, 0.7 for creative/generative
- **Fallbacks**: All functions have heuristic fallbacks when Gemini parsing fails
- **Error handling**: 400 for bad input, 404 for missing entity, 500 for server errors
- **API key**: `GEMINI_API_KEY` stored in Supabase secrets
