/**
 * _shared/nlp-helpers.ts — NLP Edge Function Base Template (8A.8)
 *
 * Reusable utilities for all AI/NLP edge functions:
 *   - CORS headers & preflight handling
 *   - Supabase service-role client factory
 *   - Gemini API wrapper (chat + embeddings)
 *   - JSON response parsing with markdown fence stripping
 *   - Structured error responses
 *   - API usage logging
 */

import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------

export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/** Return early from OPTIONS preflight requests. */
export function handleCors(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  return null;
}

// ---------------------------------------------------------------------------
// Supabase
// ---------------------------------------------------------------------------

let _supabase: SupabaseClient | null = null;

/** Lazily create a Supabase client using the service-role key. */
export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    _supabase = createClient(url, key);
  }
  return _supabase;
}

// ---------------------------------------------------------------------------
// Gemini API
// ---------------------------------------------------------------------------

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

function getGeminiKey(): string {
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) throw new Error("GEMINI_API_KEY not configured");
  return key;
}

export interface GeminiChatOptions {
  /** Model name — defaults to "gemini-1.5-flash" */
  model?: string;
  /** System-level instructions prepended to the conversation */
  systemPrompt?: string;
  /** The user message (prompt) to send */
  prompt: string;
  /** Sampling temperature (0–1). Lower = more deterministic. Default 0.3 */
  temperature?: number;
  /** Max tokens in the response. Default 500 */
  maxOutputTokens?: number;
}

export interface GeminiChatResult {
  /** Raw text from the first candidate */
  rawText: string;
  /** Parsed JSON if the response contained valid JSON, otherwise null */
  json: unknown | null;
}

/**
 * Call the Gemini chat (generateContent) endpoint.
 * Returns the raw text + an attempt to parse JSON from the response.
 */
export async function geminiChat(opts: GeminiChatOptions): Promise<GeminiChatResult> {
  const key = getGeminiKey();
  const model = opts.model ?? "gemini-1.5-flash";
  const url = `${GEMINI_BASE}/${model}:generateContent?key=${key}`;

  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

  if (opts.systemPrompt) {
    contents.push({ role: "user", parts: [{ text: opts.systemPrompt }] });
    contents.push({ role: "model", parts: [{ text: "Understood." }] });
  }

  contents.push({ role: "user", parts: [{ text: opts.prompt }] });

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: opts.temperature ?? 0.3,
        maxOutputTokens: opts.maxOutputTokens ?? 500,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Gemini ${model} error:`, errorText);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  return {
    rawText,
    json: parseGeminiJson(rawText),
  };
}

export interface GeminiEmbeddingOptions {
  /** Model name — defaults to "text-embedding-004" */
  model?: string;
  /** The text to embed */
  content: string;
}

/**
 * Generate an embedding vector via Gemini's embedContent endpoint.
 * Returns the raw float array.
 */
export async function geminiEmbed(opts: GeminiEmbeddingOptions): Promise<number[]> {
  const key = getGeminiKey();
  const model = opts.model ?? "text-embedding-004";
  const url = `${GEMINI_BASE}/${model}:embedContent?key=${key}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: `models/${model}`,
      content: { parts: [{ text: opts.content }] },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini embedding error: ${response.status}`);
  }

  const data = await response.json();
  return data.embedding?.values ?? [];
}

// ---------------------------------------------------------------------------
// JSON Parsing
// ---------------------------------------------------------------------------

/**
 * Strip markdown code fences and parse JSON from a Gemini text response.
 * Returns null if parsing fails.
 */
export function parseGeminiJson(raw: string): unknown | null {
  try {
    const cleaned = raw
      .replace(/```json?\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Response Helpers
// ---------------------------------------------------------------------------

/** Return a JSON success response with CORS headers. */
export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Return a JSON error response with CORS headers. */
export function errorResponse(
  message: string,
  status = 500
): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Top-level error handler for edge functions.
 * Catches unknown errors and returns a structured 500 response.
 */
export function handleError(error: unknown, fallbackMessage: string): Response {
  console.error(fallbackMessage, error);
  const message =
    error instanceof Error ? error.message : fallbackMessage;
  return errorResponse(message, 500);
}

// ---------------------------------------------------------------------------
// API Usage Logging
// ---------------------------------------------------------------------------

/**
 * Log an AI API call for monitoring purposes.
 * Fire-and-forget — never blocks or throws.
 */
export function logApiUsage(params: {
  functionName: string;
  userId?: string;
  model: string;
  inputTokensEstimate?: number;
  cached?: boolean;
  durationMs?: number;
}): void {
  try {
    const supabase = getSupabase();
    supabase
      .from("session_logs")
      .insert({
        user_id: params.userId ?? null,
        event_type: "api_usage",
        content: `AI API call: ${params.functionName} (${params.model})`,
        metadata: {
          function_name: params.functionName,
          model: params.model,
          input_tokens_estimate: params.inputTokensEstimate,
          cached: params.cached ?? false,
          duration_ms: params.durationMs,
          timestamp: new Date().toISOString(),
        },
      })
      .then(({ error }) => {
        if (error) console.error("[logApiUsage] insert failed:", error);
      });
  } catch (err) {
    console.error("[logApiUsage] unexpected error:", err);
  }
}
