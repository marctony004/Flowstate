import supabase from "@/supabase";
import type { Json } from "@/types/database";

export type NotificationType =
  | "task_assigned"
  | "member_invited"
  | "collaborator_added"
  | "ai_action";

interface SendNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message?: string;
  entityType?: string;
  entityId?: string;
  actorId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Send a notification to a user.
 * Fire-and-forget — never blocks the calling code.
 */
export async function sendNotification({
  userId,
  type,
  title,
  message,
  entityType,
  entityId,
  actorId,
  metadata,
}: SendNotificationParams): Promise<void> {
  try {
    await supabase.from("notifications").insert({
      user_id: userId,
      type,
      title,
      message: message ?? null,
      entity_type: entityType ?? null,
      entity_id: entityId ?? null,
      actor_id: actorId ?? null,
      metadata: (metadata as Json) ?? null,
    });
  } catch (error) {
    // Silently fail — notifications should never block the main operation
    console.error("Failed to send notification:", error);
  }
}
