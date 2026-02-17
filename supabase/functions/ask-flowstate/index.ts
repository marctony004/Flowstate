import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_EMBED_URL = "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent";
const GEMINI_CHAT_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// --- Rate Limiting ---
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 15;           // 15 requests per minute per user

interface RateBucket {
    timestamps: number[];
}

const rateLimitMap = new Map<string, RateBucket>();

function checkRateLimit(userId: string): { allowed: boolean; retryAfterMs: number } {
    const now = Date.now();
    let bucket = rateLimitMap.get(userId);

    if (!bucket) {
        bucket = { timestamps: [] };
        rateLimitMap.set(userId, bucket);
    }

    // Prune timestamps outside window
    bucket.timestamps = bucket.timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

    if (bucket.timestamps.length >= RATE_LIMIT_MAX) {
        const oldest = bucket.timestamps[0];
        return { allowed: false, retryAfterMs: RATE_LIMIT_WINDOW_MS - (now - oldest) };
    }

    bucket.timestamps.push(now);
    return { allowed: true, retryAfterMs: 0 };
}

// Periodically clean stale buckets (every 5 min)
setInterval(() => {
    const now = Date.now();
    for (const [userId, bucket] of rateLimitMap) {
        bucket.timestamps = bucket.timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
        if (bucket.timestamps.length === 0) rateLimitMap.delete(userId);
    }
}, 300_000);

// --- Response Cache ---
const CACHE_TTL_MS = 120_000; // 2 minute TTL

interface CacheEntry {
    response: AskResponse;
    createdAt: number;
}

const responseCache = new Map<string, CacheEntry>();

function getCacheKey(userId: string, question: string): string {
    // Normalize: lowercase, trim, collapse whitespace
    const normalized = question.toLowerCase().trim().replace(/\s+/g, " ");
    return `${userId}:${normalized}`;
}

function getCachedResponse(key: string): AskResponse | null {
    const entry = responseCache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.createdAt > CACHE_TTL_MS) {
        responseCache.delete(key);
        return null;
    }
    return entry.response;
}

function setCachedResponse(key: string, response: AskResponse): void {
    responseCache.set(key, { response, createdAt: Date.now() });
    // Evict old entries if cache grows too large
    if (responseCache.size > 200) {
        const now = Date.now();
        for (const [k, v] of responseCache) {
            if (now - v.createdAt > CACHE_TTL_MS) responseCache.delete(k);
        }
    }
}

// --- Types ---

interface AskRequest {
    question: string;
    userId: string;
    conversationHistory?: { role: "user" | "assistant"; content: string }[];
}

interface Citation {
    entityType: string;
    entityId: string;
    title: string;
    excerpt: string;
    similarity: number;
}

interface AskResponse {
    answer: string;
    citations: Citation[];
    confidence: number;
    cached?: boolean;
}

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        if (!GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY not configured");
        }

        const { question, userId, conversationHistory = [] }: AskRequest = await req.json();

        if (!question || !userId) {
            return new Response(
                JSON.stringify({ error: "question and userId are required" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Rate limit check
        const rateCheck = checkRateLimit(userId);
        if (!rateCheck.allowed) {
            return new Response(
                JSON.stringify({
                    error: "Rate limit exceeded. Please wait a moment before asking another question.",
                    retryAfterMs: rateCheck.retryAfterMs,
                }),
                {
                    status: 429,
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                        "Retry-After": String(Math.ceil(rateCheck.retryAfterMs / 1000)),
                    },
                }
            );
        }

        // Cache check (only for queries without conversation history — contextual follow-ups shouldn't cache)
        const cacheKey = getCacheKey(userId, question);
        if (conversationHistory.length === 0) {
            const cached = getCachedResponse(cacheKey);
            if (cached) {
                return new Response(
                    JSON.stringify({ ...cached, cached: true }),
                    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
                );
            }
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Step 1: Generate embedding for the question
        const embedResponse = await fetch(`${GEMINI_EMBED_URL}?key=${GEMINI_API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "models/text-embedding-004",
                content: { parts: [{ text: question }] },
            }),
        });

        if (!embedResponse.ok) {
            throw new Error(`Embedding error: ${embedResponse.status}`);
        }

        const embedData = await embedResponse.json();
        const queryEmbedding = embedData.embedding?.values;

        if (!queryEmbedding) {
            throw new Error("Failed to generate question embedding");
        }

        // Step 2: Semantic search for relevant context
        const embeddingStr = `[${queryEmbedding.join(",")}]`;
        const { data: searchResults, error: searchError } = await supabase.rpc(
            "search_embeddings",
            {
                query_embedding: embeddingStr,
                match_threshold: 0.25,
                match_count: 8,
                filter_user_id: userId,
                filter_entity_types: ["idea", "task", "project"],
            }
        );

        if (searchError) {
            console.error("Search error:", searchError);
        }

        // Step 3: Enrich results with metadata
        const citations: Citation[] = [];
        const contextParts: string[] = [];

        for (const result of searchResults || []) {
            let title = "Untitled";
            let metadata: Record<string, unknown> = {};

            if (result.entity_type === "idea") {
                const { data } = await supabase
                    .from("ideas")
                    .select("title, type, content, tags, memory, memory_status")
                    .eq("id", result.entity_id)
                    .single();
                if (data) {
                    title = data.title;
                    if (data.memory_status === "ready" && data.memory) {
                        const mem = data.memory as Record<string, unknown>;
                        const enriched: Record<string, unknown> = {
                            title: data.title,
                            type: data.type,
                            content: data.content,
                            tags: data.tags,
                        };
                        if (mem.summary) enriched.summary = mem.summary;
                        if (mem.rawTranscript) {
                            const transcript = mem.rawTranscript as string;
                            enriched.transcript = transcript.length > 500
                                ? transcript.substring(0, 500) + "..."
                                : transcript;
                        }
                        if (Array.isArray(mem.keyConcepts) && mem.keyConcepts.length > 0)
                            enriched.concepts = mem.keyConcepts;
                        if (Array.isArray(mem.extractedDates) && mem.extractedDates.length > 0)
                            enriched.dates = mem.extractedDates;
                        if (Array.isArray(mem.detectedTasks) && mem.detectedTasks.length > 0)
                            enriched.detectedTasks = mem.detectedTasks;
                        metadata = enriched;
                    } else {
                        metadata = data;
                    }
                }
            } else if (result.entity_type === "task") {
                const { data } = await supabase
                    .from("tasks")
                    .select("title, description, status, priority, due_date")
                    .eq("id", result.entity_id)
                    .single();
                if (data) {
                    title = data.title;
                    metadata = data;
                }
            } else if (result.entity_type === "project") {
                const { data } = await supabase
                    .from("projects")
                    .select("title, description, status, genre, due_date")
                    .eq("id", result.entity_id)
                    .single();
                if (data) {
                    title = data.title;
                    metadata = data;
                }
            }

            citations.push({
                entityType: result.entity_type,
                entityId: result.entity_id,
                title,
                excerpt: result.content.substring(0, 200),
                similarity: result.similarity,
            });

            contextParts.push(
                `[${result.entity_type.toUpperCase()}: ${title}]\n${JSON.stringify(metadata, null, 2)}`
            );
        }

        // Step 4: Build prompt with context
        const contextStr = contextParts.length > 0
            ? contextParts.join("\n\n---\n\n")
            : "No relevant information found in the database.";

        const systemPrompt = `You are FlowState AI, a helpful assistant for a music producer/creative professional. You help them manage their projects, ideas, and tasks.

IMPORTANT RULES:
1. Answer ONLY based on the context provided below from the user's database
2. If the context doesn't contain relevant information, say "I don't have information about that in your projects, ideas, or tasks."
3. Do NOT make up information or use outside knowledge
4. Be conversational and friendly, but concise
5. When referencing specific items, mention them by name so the user knows the source
6. If asked about deadlines or status, be specific with dates and current state

CONTEXT FROM USER'S DATABASE:
${contextStr}`;

        const messages = [
            { role: "user", parts: [{ text: systemPrompt }] },
            ...conversationHistory.map((msg) => ({
                role: msg.role === "user" ? "user" : "model",
                parts: [{ text: msg.content }],
            })),
            { role: "user", parts: [{ text: question }] },
        ];

        // Step 5: Generate response with Gemini
        const chatResponse = await fetch(`${GEMINI_CHAT_URL}?key=${GEMINI_API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: messages,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1000,
                },
            }),
        });

        if (!chatResponse.ok) {
            const errorText = await chatResponse.text();
            console.error("Gemini chat error:", errorText);
            throw new Error(`Chat error: ${chatResponse.status}`);
        }

        const chatData = await chatResponse.json();
        const answer = chatData.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response.";

        // Calculate confidence based on search results
        const avgSimilarity = citations.length > 0
            ? citations.reduce((sum, c) => sum + c.similarity, 0) / citations.length
            : 0;

        const response: AskResponse = {
            answer,
            citations: citations.slice(0, 5),
            confidence: avgSimilarity,
        };

        // Cache the response for repeated queries
        if (conversationHistory.length === 0) {
            setCachedResponse(cacheKey, response);
        }

        return new Response(
            JSON.stringify(response),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error) {
        console.error("Ask FlowState error:", error);
        return new Response(
            JSON.stringify({ error: error instanceof Error ? error.message : "Failed to process question" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
