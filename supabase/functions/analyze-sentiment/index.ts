import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * analyze-sentiment — 8A.5 Sentiment Analysis on Collaborator Feedback
 *
 * Analyzes a collaborator note's text fields to classify overall sentiment
 * as: positive | neutral | negative | mixed
 *
 * Input: { collaboratorNoteId, userId }
 * Output: { sentiment, confidence, tone, keyThemes, suggestions, analyzedAt }
 */

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_CHAT_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

type Sentiment = "positive" | "neutral" | "negative" | "mixed";

interface AnalyzeRequest {
  collaboratorNoteId: string;
  userId: string;
}

interface SentimentResult {
  sentiment: Sentiment;
  confidence: number;
  tone: string;
  keyThemes: string[];
  suggestions: string[];
  analyzedAt: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY not configured");
    }

    const { collaboratorNoteId, userId }: AnalyzeRequest = await req.json();

    if (!collaboratorNoteId || !userId) {
      return new Response(
        JSON.stringify({ error: "collaboratorNoteId and userId are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the collaborator note and verify ownership
    const { data: note, error: noteError } = await supabase
      .from("collaborator_notes")
      .select("*")
      .eq("id", collaboratorNoteId)
      .eq("owner_id", userId)
      .single();

    if (noteError || !note) {
      return new Response(
        JSON.stringify({ error: "Collaborator note not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Mark as analyzing
    await supabase
      .from("collaborator_notes")
      .update({ sentiment_status: "analyzing" })
      .eq("id", collaboratorNoteId);

    // Concatenate all text fields for analysis
    const textParts: string[] = [];
    if (note.notes) textParts.push(`Notes: ${note.notes}`);
    if (note.strengths) textParts.push(`Strengths: ${note.strengths}`);
    if (note.working_style) textParts.push(`Working Style: ${note.working_style}`);
    if (note.communication_pref) textParts.push(`Communication Preference: ${note.communication_pref}`);
    if (note.rating) textParts.push(`Rating: ${note.rating}/5`);

    const combinedText = textParts.join("\n");

    if (!combinedText.trim()) {
      // Nothing to analyze
      await supabase
        .from("collaborator_notes")
        .update({ sentiment_status: "pending" })
        .eq("id", collaboratorNoteId);
      return new Response(
        JSON.stringify({ error: "No text content to analyze" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Ask Gemini to classify sentiment
    const prompt = `You are a sentiment analyzer for collaborator feedback in a music production project management tool called FlowState.

Analyze the following collaborator notes and classify the overall sentiment.

COLLABORATOR FEEDBACK:
${combinedText}

Respond with ONLY a JSON object (no markdown, no code fences) in this exact format:
{
  "sentiment": "one of: positive, neutral, negative, mixed",
  "confidence": 0.0 to 1.0,
  "tone": "A brief 2-5 word description of the emotional tone (e.g., 'appreciative and enthusiastic', 'frustrated but hopeful', 'matter-of-fact')",
  "keyThemes": ["theme 1", "theme 2", "theme 3"],
  "suggestions": ["Optional suggestion for improving the collaboration"]
}

Guidelines:
- "positive": Overall favorable impression, praise, enthusiasm, satisfaction
- "neutral": Factual, descriptive, neither positive nor negative
- "negative": Dissatisfaction, frustration, concerns, criticism
- "mixed": Contains both significant positive and negative elements
- keyThemes should be 2-4 short phrases summarizing the main topics
- suggestions should be 0-2 actionable tips for the collaboration (empty array if none apply)`;

    const chatResponse = await fetch(
      `${GEMINI_CHAT_URL}?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 500,
          },
        }),
      }
    );

    if (!chatResponse.ok) {
      const errorText = await chatResponse.text();
      console.error("Gemini error:", errorText);
      throw new Error(`Gemini API error: ${chatResponse.status}`);
    }

    const chatData = await chatResponse.json();
    const rawText =
      chatData.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Parse the JSON response
    let parsed: {
      sentiment: Sentiment;
      confidence: number;
      tone: string;
      keyThemes: string[];
      suggestions: string[];
    };

    try {
      const cleaned = rawText.replace(/```json?\s*/g, "").replace(/```\s*/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse Gemini response:", rawText);
      // Fallback: use rating-based heuristic
      parsed = heuristicFallback(note.rating, combinedText);
    }

    // Validate sentiment value
    const validSentiments: Sentiment[] = ["positive", "neutral", "negative", "mixed"];
    if (!validSentiments.includes(parsed.sentiment)) {
      parsed = heuristicFallback(note.rating, combinedText);
    }

    const now = new Date();
    const result: SentimentResult = {
      sentiment: parsed.sentiment,
      confidence: Math.max(0, Math.min(1, parsed.confidence)),
      tone: parsed.tone || "unclassified",
      keyThemes: Array.isArray(parsed.keyThemes) ? parsed.keyThemes.slice(0, 4) : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 2) : [],
      analyzedAt: now.toISOString(),
    };

    // Persist to collaborator_notes
    await supabase
      .from("collaborator_notes")
      .update({
        sentiment_analysis: result as unknown as Record<string, unknown>,
        sentiment_status: "analyzed",
      })
      .eq("id", collaboratorNoteId);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("analyze-sentiment error:", error);

    // Try to mark as failed if we have the note ID
    try {
      const { collaboratorNoteId } = await req.clone().json();
      if (collaboratorNoteId) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        await supabase
          .from("collaborator_notes")
          .update({ sentiment_status: "failed" })
          .eq("id", collaboratorNoteId);
      }
    } catch {
      // ignore secondary error
    }

    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : "Failed to analyze sentiment",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

/** Heuristic fallback when Gemini response can't be parsed */
function heuristicFallback(
  rating: number | null,
  _text: string
): {
  sentiment: Sentiment;
  confidence: number;
  tone: string;
  keyThemes: string[];
  suggestions: string[];
} {
  if (rating && rating >= 4) {
    return {
      sentiment: "positive",
      confidence: 0.5,
      tone: "favorable",
      keyThemes: ["high rating"],
      suggestions: [],
    };
  }
  if (rating && rating <= 2) {
    return {
      sentiment: "negative",
      confidence: 0.5,
      tone: "unfavorable",
      keyThemes: ["low rating"],
      suggestions: ["Consider discussing concerns directly"],
    };
  }
  return {
    sentiment: "neutral",
    confidence: 0.4,
    tone: "matter-of-fact",
    keyThemes: ["general feedback"],
    suggestions: [],
  };
}
