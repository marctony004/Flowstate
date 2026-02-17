import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * detect-project-state — 8A.4 Semantic Project State Detection
 *
 * Analyzes a project's tasks, ideas, activity, and milestones to determine
 * its semantic state: evolving | stuck | ready-to-ship | on-hold | conceptually-complete
 *
 * Input: { projectId, userId }
 * Output: { state, confidence, explanation, signals }
 */

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_CHAT_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

type ProjectState =
  | "evolving"
  | "stuck"
  | "ready-to-ship"
  | "on-hold"
  | "conceptually-complete";

interface DetectRequest {
  projectId: string;
  userId: string;
}

interface ProjectStateResult {
  state: ProjectState;
  confidence: number;
  explanation: string;
  signals: string[];
  detectedAt: string;
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

    const { projectId, userId }: DetectRequest = await req.json();

    if (!projectId || !userId) {
      return new Response(
        JSON.stringify({ error: "projectId and userId are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Gather project data in parallel
    const [projectRes, tasksRes, ideasRes, milestonesRes, activityRes] =
      await Promise.all([
        supabase
          .from("projects")
          .select(
            "id, title, description, status, genre, bpm, key_signature, due_date, completed_at, created_at, updated_at"
          )
          .eq("id", projectId)
          .eq("owner_id", userId)
          .single(),
        supabase
          .from("tasks")
          .select("id, title, status, priority, due_date, completed_at, created_at, updated_at")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("ideas")
          .select("id, title, type, created_at, updated_at")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false })
          .limit(30),
        supabase
          .from("milestones")
          .select("id, title, completed_at, due_date, created_at")
          .eq("project_id", projectId)
          .order("position"),
        supabase
          .from("activity_log")
          .select("action, entity_type, created_at")
          .eq("project_id", projectId)
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

    if (projectRes.error || !projectRes.data) {
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const project = projectRes.data;
    const tasks = tasksRes.data ?? [];
    const ideas = ideasRes.data ?? [];
    const milestones = milestonesRes.data ?? [];
    const activities = activityRes.data ?? [];

    // Compute heuristic signals
    const now = new Date();
    const totalTasks = tasks.length;
    const doneTasks = tasks.filter((t) => t.status === "done").length;
    const todoTasks = tasks.filter((t) => t.status === "todo").length;
    const inProgressTasks = tasks.filter((t) => t.status === "in_progress").length;
    const taskCompletionRate = totalTasks > 0 ? doneTasks / totalTasks : 0;

    const completedMilestones = milestones.filter((m) => m.completed_at).length;
    const totalMilestones = milestones.length;

    // Activity recency — days since last activity
    const lastActivityDate = activities.length > 0
      ? new Date(activities[0].created_at)
      : new Date(project.updated_at);
    const daysSinceLastActivity = Math.floor(
      (now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Days since project creation
    const projectAgeDays = Math.floor(
      (now.getTime() - new Date(project.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Recent activity density (activities in last 7 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentActivityCount = activities.filter(
      (a) => new Date(a.created_at) > sevenDaysAgo
    ).length;

    // Overdue tasks
    const overdueTasks = tasks.filter(
      (t) => t.due_date && t.status !== "done" && new Date(t.due_date) < now
    ).length;

    // Build structured summary for Gemini
    const summary = {
      project: {
        title: project.title,
        description: project.description,
        manualStatus: project.status,
        genre: project.genre,
        dueDate: project.due_date,
        createdAt: project.created_at,
        ageDays: projectAgeDays,
      },
      tasks: {
        total: totalTasks,
        done: doneTasks,
        inProgress: inProgressTasks,
        todo: todoTasks,
        completionRate: Math.round(taskCompletionRate * 100),
        overdue: overdueTasks,
      },
      ideas: {
        total: ideas.length,
        recentCount: ideas.filter((i) => new Date(i.created_at) > sevenDaysAgo).length,
      },
      milestones: {
        total: totalMilestones,
        completed: completedMilestones,
      },
      activity: {
        totalRecent50: activities.length,
        last7Days: recentActivityCount,
        daysSinceLastActivity,
      },
    };

    // Ask Gemini to classify the state
    const prompt = `You are a project state classifier for a music production/creative project management tool called FlowState.

Analyze the following project data and classify its state into exactly ONE of these categories:

- **evolving**: Active development, regular commits/activity, tasks being completed, new ideas flowing
- **stuck**: Has tasks but no recent progress, overdue items, stale activity, potential creative block
- **ready-to-ship**: Most tasks done (>80%), milestones completed, project feels complete
- **on-hold**: Explicitly set to on-hold or paused, or very low activity for extended period with incomplete work
- **conceptually-complete**: All tasks done, no pending work, the creative vision has been fully realized

PROJECT DATA:
${JSON.stringify(summary, null, 2)}

Respond with ONLY a JSON object (no markdown, no code fences) in this exact format:
{
  "state": "one of: evolving, stuck, ready-to-ship, on-hold, conceptually-complete",
  "confidence": 0.0 to 1.0,
  "explanation": "One sentence explaining why this state was chosen, written for the user (e.g., 'Your project has strong momentum with 3 tasks completed this week.')",
  "signals": ["signal 1", "signal 2", "signal 3"]
}

The signals array should contain 2-4 short factual observations that support your classification.`;

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
      state: ProjectState;
      confidence: number;
      explanation: string;
      signals: string[];
    };

    try {
      // Strip any markdown code fences if present
      const cleaned = rawText.replace(/```json?\s*/g, "").replace(/```\s*/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse Gemini response:", rawText);
      // Fallback: use heuristic-only detection
      parsed = heuristicFallback(summary);
    }

    // Validate the state value
    const validStates: ProjectState[] = [
      "evolving",
      "stuck",
      "ready-to-ship",
      "on-hold",
      "conceptually-complete",
    ];
    if (!validStates.includes(parsed.state)) {
      parsed.state = "evolving"; // safe default
      parsed.confidence = Math.min(parsed.confidence, 0.5);
    }

    const result: ProjectStateResult = {
      state: parsed.state,
      confidence: Math.max(0, Math.min(1, parsed.confidence)),
      explanation: parsed.explanation || "State detected based on project activity.",
      signals: Array.isArray(parsed.signals) ? parsed.signals.slice(0, 4) : [],
      detectedAt: now.toISOString(),
    };

    // Persist to projects.ai_state
    await supabase
      .from("projects")
      .update({ ai_state: result as unknown as Record<string, unknown> })
      .eq("id", projectId);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("detect-project-state error:", error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : "Failed to detect project state",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

/** Heuristic fallback when Gemini response can't be parsed */
function heuristicFallback(summary: {
  project: { manualStatus: string; ageDays: number };
  tasks: {
    total: number;
    done: number;
    completionRate: number;
    overdue: number;
  };
  activity: { daysSinceLastActivity: number; last7Days: number };
}): {
  state: ProjectState;
  confidence: number;
  explanation: string;
  signals: string[];
} {
  const { tasks, activity, project } = summary;

  // Manual on-hold
  if (project.manualStatus === "on_hold") {
    return {
      state: "on-hold",
      confidence: 0.9,
      explanation: "Project is manually set to on-hold.",
      signals: ["Manual status: on-hold"],
    };
  }

  // Conceptually complete
  if (tasks.total > 0 && tasks.completionRate === 100) {
    return {
      state: "conceptually-complete",
      confidence: 0.85,
      explanation: "All tasks are completed.",
      signals: [`${tasks.done}/${tasks.total} tasks done`],
    };
  }

  // Ready to ship
  if (tasks.total > 0 && tasks.completionRate >= 80) {
    return {
      state: "ready-to-ship",
      confidence: 0.7,
      explanation: `${tasks.completionRate}% of tasks completed — project is nearly done.`,
      signals: [`${tasks.done}/${tasks.total} tasks done`],
    };
  }

  // Stuck
  if (activity.daysSinceLastActivity > 14 && tasks.total > 0 && tasks.completionRate < 80) {
    return {
      state: "stuck",
      confidence: 0.65,
      explanation: `No activity for ${activity.daysSinceLastActivity} days with incomplete tasks.`,
      signals: [
        `${activity.daysSinceLastActivity} days since last activity`,
        `${tasks.overdue} overdue tasks`,
      ],
    };
  }

  // Default: evolving
  return {
    state: "evolving",
    confidence: 0.6,
    explanation: "Project is actively being developed.",
    signals: [`${activity.last7Days} activities in the last 7 days`],
  };
}
