import supabase from "@/supabase";
import type { Json } from "@/types/database";

export type ActivityAction = "create" | "update" | "delete";
export type EntityType = "project" | "idea" | "task" | "collaborator";

interface LogActivityParams {
  userId: string;
  action: ActivityAction;
  entityType: EntityType;
  entityId?: string;
  projectId?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Log an activity to the activity_log table.
 * This function is fire-and-forget to avoid slowing down the main operation.
 */
export async function logActivity({
  userId,
  action,
  entityType,
  entityId,
  projectId,
  metadata,
}: LogActivityParams): Promise<void> {
  try {
    await supabase.from("activity_log").insert({
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId ?? null,
      project_id: projectId ?? null,
      metadata: (metadata as Json) ?? null,
    });
  } catch (error) {
    // Silently fail - activity logging should not block the main operation
    console.error("Failed to log activity:", error);
  }
}
