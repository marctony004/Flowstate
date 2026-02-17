/**
 * Session Logger — 8A.3 Personal Creative Memory
 *
 * Captures key user events (entity creation, task completion, etc.) as
 * session_logs rows with embeddings for semantic recall. Fire-and-forget
 * pattern — never blocks the main operation.
 */

import supabase from "@/supabase";
import type { Json } from "@/types/database";

export type SessionEventType =
  | "entity_created"
  | "entity_updated"
  | "task_completed"
  | "idea_captured"
  | "collaborator_feedback"
  | "milestone_reached"
  | "project_status_changed"
  | "creative_block_intervention"
  | "creative_block_feedback"
  | "insight_flagged"
  | "api_usage";

interface LogSessionParams {
  userId: string;
  eventType: SessionEventType;
  content: string;
  projectId?: string | null;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Log a session event with an embedding for future semantic recall.
 * Fire-and-forget: errors are caught and logged, never thrown.
 */
export async function logSession({
  userId,
  eventType,
  content,
  projectId,
  entityType,
  entityId,
  metadata,
}: LogSessionParams): Promise<void> {
  try {
    // Insert log row (embedding is generated asynchronously below)
    const { data: row, error } = await supabase
      .from("session_logs")
      .insert({
        user_id: userId,
        event_type: eventType,
        content,
        project_id: projectId ?? null,
        entity_type: entityType ?? null,
        entity_id: entityId ?? null,
        metadata: (metadata as unknown as Json) ?? {},
      })
      .select("id")
      .single();

    if (error) {
      console.error("[sessionLogger] insert failed:", error);
      return;
    }

    // Fire-and-forget embedding generation via edge function
    if (row?.id) {
      supabase.functions
        .invoke("generate-embedding", {
          body: {
            entityType: "session_log",
            entityId: row.id,
            content,
          },
        })
        .catch((err) => {
          console.error("[sessionLogger] embedding generation failed:", err);
        });
    }
  } catch (err) {
    console.error("[sessionLogger] unexpected error:", err);
  }
}

/**
 * Helper: build a human-readable session log content string for an entity event.
 */
export function buildSessionContent(
  action: "created" | "updated" | "completed" | "status_changed",
  entityType: string,
  title: string,
  details?: Record<string, unknown>
): string {
  const parts = [`${entityType} ${action}: "${title}"`];

  if (details) {
    if (details.genre) parts.push(`Genre: ${details.genre}`);
    if (details.priority) parts.push(`Priority: ${details.priority}`);
    if (details.status) parts.push(`Status: ${details.status}`);
    if (details.tags && Array.isArray(details.tags)) {
      parts.push(`Tags: ${details.tags.join(", ")}`);
    }
    if (details.description) {
      const desc = String(details.description);
      parts.push(`Description: ${desc.length > 200 ? desc.slice(0, 200) + "..." : desc}`);
    }
  }

  return parts.join(". ");
}
