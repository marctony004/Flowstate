/**
 * NLP Task Parser Service
 *
 * Calls the Supabase Edge Function to parse natural language tasks using Gemini AI.
 * Falls back to the local rule-based parser if the Edge Function fails.
 */

import supabase from "@/supabase";
import { parseNaturalLanguageTask, type ParsedTask } from "./nlpTaskParser";

interface Project {
  id: string;
  title: string;
}

interface EdgeFunctionResponse {
  title: string;
  dueDate: string | null;
  dueDateText: string | null;
  projectMatch: { id: string; title: string } | null;
  assigneeHint: string | null;
  priority: "low" | "medium" | "high" | null;
  confidence: number;
}

interface ErrorResponse {
  error: string;
  fallback?: boolean;
}

/**
 * Parse a natural language task using the Gemini-powered Edge Function.
 * Falls back to local parsing if the Edge Function fails.
 */
export async function parseTaskWithAI(
  input: string,
  projects: Project[]
): Promise<ParsedTask & { projectMatchId?: string; usedAI: boolean }> {
  try {
    const { data, error } = await supabase.functions.invoke<EdgeFunctionResponse | ErrorResponse>(
      "parse-task-nl",
      {
        body: {
          input,
          projects,
          currentDate: new Date().toISOString().split("T")[0],
        },
      }
    );

    if (error) {
      console.warn("Edge Function error, falling back to local parser:", error);
      return { ...parseNaturalLanguageTask(input), usedAI: false };
    }

    if (!data || "error" in data) {
      console.warn("Edge Function returned error:", data);
      return { ...parseNaturalLanguageTask(input), usedAI: false };
    }

    // Convert Edge Function response to ParsedTask format
    return {
      title: data.title,
      dueDate: data.dueDate,
      dueDateText: data.dueDateText,
      projectHint: data.projectMatch?.title || null,
      projectMatchId: data.projectMatch?.id || undefined,
      assigneeHint: data.assigneeHint,
      priority: data.priority,
      confidence: data.confidence,
      usedAI: true,
    };
  } catch (err) {
    console.warn("Failed to call Edge Function, falling back to local parser:", err);
    return { ...parseNaturalLanguageTask(input), usedAI: false };
  }
}

/**
 * Check if the Edge Function is available and configured.
 */
export async function checkAIParserAvailable(): Promise<boolean> {
  try {
    const { error } = await supabase.functions.invoke("parse-task-nl", {
      body: { input: "test", projects: [] },
    });
    return !error;
  } catch {
    return false;
  }
}
