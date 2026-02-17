import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * ai-usage-stats — 8A.8 Monitor API Usage and Costs
 *
 * Returns aggregated AI feature usage stats over a configurable time window.
 * Queries session_logs for AI-related event types and provides:
 *   - Total calls per function / event type
 *   - Per-user breakdowns
 *   - Daily trend (last 7 days)
 *
 * Input (query params):
 *   ?days=7          — lookback window (default 7, max 90)
 *   ?userId=<uuid>   — optional filter to a single user
 *
 * Requires service-role or authenticated admin call.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const AI_EVENT_TYPES = [
  "api_usage",
  "creative_block_intervention",
  "creative_block_feedback",
  "insight_flagged",
];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const days = Math.min(Number(url.searchParams.get("days")) || 7, 90);
    const userIdFilter = url.searchParams.get("userId");

    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceISO = since.toISOString();

    // 1. Total calls by event type
    let eventQuery = supabase
      .from("session_logs")
      .select("event_type, created_at, user_id, metadata")
      .in("event_type", AI_EVENT_TYPES)
      .gte("created_at", sinceISO)
      .order("created_at", { ascending: false })
      .limit(5000);

    if (userIdFilter) {
      eventQuery = eventQuery.eq("user_id", userIdFilter);
    }

    const { data: logs, error: logsError } = await eventQuery;

    if (logsError) {
      return new Response(
        JSON.stringify({ error: logsError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Aggregate by event type
    const byEventType: Record<string, number> = {};
    const byFunction: Record<string, number> = {};
    const byUser: Record<string, number> = {};
    const byDay: Record<string, number> = {};

    for (const log of logs ?? []) {
      // By event type
      byEventType[log.event_type] = (byEventType[log.event_type] || 0) + 1;

      // By function name (from api_usage metadata)
      if (log.event_type === "api_usage" && log.metadata) {
        const meta = log.metadata as Record<string, unknown>;
        const fn = (meta.function_name as string) || "unknown";
        byFunction[fn] = (byFunction[fn] || 0) + 1;
      }

      // By user
      if (log.user_id) {
        byUser[log.user_id] = (byUser[log.user_id] || 0) + 1;
      }

      // By day
      const day = log.created_at?.slice(0, 10) ?? "unknown";
      byDay[day] = (byDay[day] || 0) + 1;
    }

    // 2. Counts from other AI-related tables for broader picture
    const [embeddingsCount, stateDetections, sentimentAnalyses] =
      await Promise.all([
        supabase
          .from("embeddings")
          .select("id", { count: "exact", head: true }),
        supabase
          .from("projects")
          .select("id", { count: "exact", head: true })
          .not("ai_state", "is", null),
        supabase
          .from("collaborator_notes")
          .select("id", { count: "exact", head: true })
          .eq("sentiment_status", "analyzed"),
      ]);

    const stats = {
      period: { days, since: sinceISO },
      totalEvents: (logs ?? []).length,
      byEventType,
      byFunction,
      byUser,
      dailyTrend: Object.entries(byDay)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({ date, count })),
      totals: {
        embeddings: embeddingsCount.count ?? 0,
        projectsWithAiState: stateDetections.count ?? 0,
        analyzedSentiments: sentimentAnalyses.count ?? 0,
      },
    };

    return new Response(JSON.stringify(stats), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("ai-usage-stats error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to get usage stats",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
