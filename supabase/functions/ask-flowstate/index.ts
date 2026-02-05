import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_EMBED_URL = "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent";
const GEMINI_CHAT_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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
            // We continue even if search fails, to at least say "I don't know" or answer from general knowledge if configured
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
                    .select("title, type, content, tags")
                    .eq("id", result.entity_id)
                    .single();
                if (data) {
                    title = data.title;
                    metadata = data;
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

            // Build context string
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
            citations: citations.slice(0, 5), // Top 5 citations
            confidence: avgSimilarity,
        };

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
