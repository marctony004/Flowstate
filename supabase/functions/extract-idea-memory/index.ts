import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB limit for Gemini inline data

interface ExtractRequest {
  ideaId: string;
  fileUrl: string;
  fileType: string;
  userId: string;
  ideaTitle: string;
  ideaContent: string | null;
}

function getMimeCategory(
  mimeType: string
): "image" | "audio" | "video" | "pdf" | "unknown" {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType === "application/pdf") return "pdf";
  return "unknown";
}

function getSourceType(
  category: string
): "image" | "voice" | "video" | "document" | "text" {
  switch (category) {
    case "image":
      return "image";
    case "audio":
      return "voice";
    case "video":
      return "video";
    case "pdf":
      return "document";
    default:
      return "text";
  }
}

function buildPrompt(category: string): string {
  const base = `Analyze this file and return a JSON object with the following fields:
- "rawTranscript": string or null — full text transcript, OCR text, or spoken words extracted from the file
- "summary": string — a concise 1-3 sentence summary of the content
- "keyConcepts": string[] — 3-8 key concepts, topics, or themes found in the content
- "extractedDates": string[] — any dates, deadlines, or time references mentioned (ISO format when possible)
- "detectedTasks": string[] — any action items, to-dos, or tasks mentioned

Return ONLY valid JSON, no markdown fences, no explanation.`;

  switch (category) {
    case "image":
      return `${base}\n\nThis is an image. Use OCR to extract any visible text. Describe the visual content in the summary. Identify any handwritten notes, whiteboard content, or visual ideas.`;
    case "audio":
      return `${base}\n\nThis is an audio recording. Transcribe the spoken words into rawTranscript. Summarize the key points discussed. Extract any mentioned dates, deadlines, or action items.`;
    case "video":
      return `${base}\n\nThis is a video. Transcribe any spoken words into rawTranscript. Describe both visual and audio content in the summary. Extract any on-screen text.`;
    case "pdf":
      return `${base}\n\nThis is a PDF document. Extract the full text into rawTranscript. Summarize the document's purpose and key points.`;
    default:
      return base;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let ideaId: string | undefined;

  try {
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY not configured");
    }

    const body: ExtractRequest = await req.json();
    ideaId = body.ideaId;

    if (!body.ideaId || !body.fileUrl || !body.fileType || !body.userId) {
      return new Response(
        JSON.stringify({
          error: "ideaId, fileUrl, fileType, and userId are required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Set status to processing
    await supabase
      .from("ideas")
      .update({ memory_status: "processing" })
      .eq("id", body.ideaId);

    // Download file
    const fileResponse = await fetch(body.fileUrl);
    if (!fileResponse.ok) {
      throw new Error(`Failed to download file: ${fileResponse.status}`);
    }

    const fileBuffer = await fileResponse.arrayBuffer();

    // File size guard
    if (fileBuffer.byteLength > MAX_FILE_SIZE) {
      throw new Error(
        `File too large (${(fileBuffer.byteLength / 1024 / 1024).toFixed(1)}MB). Maximum is 15MB.`
      );
    }

    // Base64 encode
    const base64Data = btoa(
      new Uint8Array(fileBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ""
      )
    );

    const category = getMimeCategory(body.fileType);
    if (category === "unknown") {
      throw new Error(`Unsupported file type: ${body.fileType}`);
    }

    const prompt = buildPrompt(category);

    // Call Gemini 2.0 Flash multimodal API
    const geminiResponse = await fetch(
      `${GEMINI_URL}?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType: body.fileType,
                    data: base64Data,
                  },
                },
                { text: prompt },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 4096,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("Gemini error:", errorText);
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    const rawText =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Parse JSON from response — strip markdown fences if present
    const jsonStr = rawText
      .replace(/^```(?:json)?\s*/, "")
      .replace(/\s*```$/, "")
      .trim();
    const parsed = JSON.parse(jsonStr);

    // Build memory object with metadata
    const memory = {
      rawTranscript: parsed.rawTranscript || null,
      summary: parsed.summary || "No summary available",
      keyConcepts: Array.isArray(parsed.keyConcepts)
        ? parsed.keyConcepts
        : [],
      extractedDates: Array.isArray(parsed.extractedDates)
        ? parsed.extractedDates
        : [],
      detectedTasks: Array.isArray(parsed.detectedTasks)
        ? parsed.detectedTasks
        : [],
      sourceType: getSourceType(category),
      extractedAt: new Date().toISOString(),
      modelUsed: "gemini-2.0-flash",
    };

    // Update idea with memory
    await supabase
      .from("ideas")
      .update({ memory, memory_status: "ready" })
      .eq("id", body.ideaId);

    // Re-embed with enriched content
    const enrichedParts = [body.ideaTitle];
    if (body.ideaContent) enrichedParts.push(body.ideaContent);
    if (memory.rawTranscript) enrichedParts.push(memory.rawTranscript);
    if (memory.summary) enrichedParts.push(`Summary: ${memory.summary}`);
    if (memory.keyConcepts.length > 0)
      enrichedParts.push(`Concepts: ${memory.keyConcepts.join(", ")}`);

    const enrichedContent = enrichedParts.join(". ");

    // Fire-and-forget re-embedding
    try {
      await supabase.functions.invoke("generate-embedding", {
        body: {
          entityType: "idea",
          entityId: body.ideaId,
          content: enrichedContent,
          userId: body.userId,
        },
      });
    } catch (embedError) {
      console.error("Re-embedding failed (non-fatal):", embedError);
    }

    return new Response(
      JSON.stringify({ success: true, memory_status: "ready" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Extract idea memory error:", error);

    // Set status to failed
    if (ideaId) {
      await supabase
        .from("ideas")
        .update({ memory_status: "failed" })
        .eq("id", ideaId);
    }

    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : "Failed to extract memory",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
