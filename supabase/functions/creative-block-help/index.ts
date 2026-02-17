import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * creative-block-help — 8A.6 Creative Block Intervention
 *
 * Analyzes a project's data and generates personalized suggestions
 * to help users overcome creative blocks.
 *
 * Input: { projectId, userId, userContext?: string }
 * Output: { suggestions, analysis, interventionLogId }
 */

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_CHAT_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface BlockHelpRequest {
  projectId: string;
  userId: string;
  userContext?: string;
}

type SuggestionType =
  | "question"
  | "reframe"
  | "constraint"
  | "micro-task"
  | "perspective";

interface Suggestion {
  id: string;
  type: SuggestionType;
  content: string;
  reasoning: string;
  relatedEntityName?: string;
  actionable?: {
    taskTitle: string;
    taskDescription: string;
  };
}

interface BlockAnalysis {
  blockerType:
    | "creative"
    | "technical"
    | "motivational"
    | "scope"
    | "unknown";
  stuckDuration: string;
  stalledAreas: string[];
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

    const { projectId, userId, userContext }: BlockHelpRequest =
      await req.json();

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
    const [
      projectRes,
      tasksRes,
      ideasRes,
      milestonesRes,
      activityRes,
      pastInterventionsRes,
      pastFeedbackRes,
    ] = await Promise.all([
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
        .select(
          "id, title, status, priority, due_date, completed_at, created_at, updated_at"
        )
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
      supabase
        .from("session_logs")
        .select("metadata, created_at")
        .eq("event_type", "creative_block_intervention")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("session_logs")
        .select("metadata, created_at")
        .eq("event_type", "creative_block_feedback")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    if (projectRes.error || !projectRes.data) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const project = projectRes.data;
    const tasks = tasksRes.data ?? [];
    const ideas = ideasRes.data ?? [];
    const milestones = milestonesRes.data ?? [];
    const activities = activityRes.data ?? [];
    const pastInterventions = pastInterventionsRes.data ?? [];
    const pastFeedback = pastFeedbackRes.data ?? [];

    // Compute heuristic signals
    const now = new Date();
    const totalTasks = tasks.length;
    const doneTasks = tasks.filter((t) => t.status === "done").length;
    const inProgressTasks = tasks.filter((t) => t.status === "in_progress");
    const taskCompletionRate = totalTasks > 0 ? doneTasks / totalTasks : 0;

    const overdueTasks = tasks.filter(
      (t) => t.due_date && t.status !== "done" && new Date(t.due_date) < now
    );

    // Stalled tasks: in_progress and not updated in >5 days
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
    const stalledTasks = inProgressTasks.filter(
      (t) => new Date(t.updated_at) < fiveDaysAgo
    );

    // Days since last activity
    const lastActivityDate =
      activities.length > 0
        ? new Date(activities[0].created_at)
        : new Date(project.updated_at);
    const daysSinceLastActivity = Math.floor(
      (now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Recent activity density (last 7 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentActivityCount = activities.filter(
      (a) => new Date(a.created_at) > sevenDaysAgo
    ).length;

    // Build structured summary for Gemini
    const summary = {
      project: {
        title: project.title,
        description: project.description,
        genre: project.genre,
        dueDate: project.due_date,
      },
      tasks: {
        total: totalTasks,
        done: doneTasks,
        inProgress: inProgressTasks.length,
        completionRate: Math.round(taskCompletionRate * 100),
        overdue: overdueTasks.map((t) => ({
          title: t.title,
          dueDate: t.due_date,
        })),
        stalled: stalledTasks.map((t) => ({
          title: t.title,
          daysSinceUpdate: Math.floor(
            (now.getTime() - new Date(t.updated_at).getTime()) /
              (1000 * 60 * 60 * 24)
          ),
        })),
      },
      ideas: ideas.map((i) => ({ title: i.title, type: i.type })),
      milestones: milestones.map((m) => ({
        title: m.title,
        completed: !!m.completed_at,
        dueDate: m.due_date,
      })),
      activity: {
        daysSinceLastActivity,
        last7DaysCount: recentActivityCount,
      },
      pastFeedback: pastFeedback.map((f) => {
        const meta = f.metadata as Record<string, unknown> | null;
        return {
          helpful: meta?.helpful,
          suggestionType: meta?.suggestionType,
        };
      }),
    };

    const prompt = `You are a creative coach for musicians and producers using a project management app called FlowState. A user has clicked "I'm Stuck" on their project. Your job is to provide **project-specific** suggestions — not generic advice.

${userContext ? `The user says: "${userContext}"` : "The user didn't provide specific context about what's blocking them."}

PROJECT DATA:
${JSON.stringify(summary, null, 2)}

${
  pastFeedback.length > 0
    ? `PAST FEEDBACK ON INTERVENTIONS:
${JSON.stringify(
  pastFeedback.map((f) => f.metadata),
  null,
  2
)}
Consider what types of suggestions the user found helpful or unhelpful.`
    : ""
}

Generate 3-5 suggestions to help the user get unstuck. Each suggestion must be one of these types:
- **question**: A thought-provoking question that reframes the problem
- **reframe**: A new way to look at their current situation
- **constraint**: A creative constraint that limits scope and sparks creativity
- **micro-task**: A small, specific task completable in <15 minutes (MUST include at least one)
- **perspective**: A shift in mindset or approach

IMPORTANT RULES:
- Reference actual task names, idea titles, and milestone names from the project data
- At least one suggestion MUST be a "micro-task" type
- For micro-task suggestions, include an "actionable" object with taskTitle and taskDescription
- Each suggestion must have a "reasoning" that explains WHY this specific suggestion applies to THIS project
- Do not give generic advice like "take a break" or "listen to music for inspiration"

Respond with ONLY a JSON object (no markdown, no code fences) in this exact format:
{
  "suggestions": [
    {
      "type": "micro-task",
      "content": "The specific suggestion text",
      "reasoning": "Why this applies to this project specifically",
      "relatedEntityName": "Name of the related task/idea/milestone if applicable",
      "actionable": { "taskTitle": "Short task title", "taskDescription": "Brief description" }
    }
  ],
  "analysis": {
    "blockerType": "one of: creative, technical, motivational, scope, unknown",
    "stuckDuration": "human-readable estimate like '~8 days'",
    "stalledAreas": ["area1", "area2"]
  }
}`;

    let suggestions: Suggestion[] = [];
    let analysis: BlockAnalysis = {
      blockerType: "unknown",
      stuckDuration: `~${daysSinceLastActivity} days`,
      stalledAreas: stalledTasks.map((t) => t.title),
    };

    try {
      const chatResponse = await fetch(
        `${GEMINI_CHAT_URL}?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1500,
            },
          }),
        }
      );

      if (!chatResponse.ok) {
        const errorText = await chatResponse.text();
        console.error("Gemini HTTP error:", chatResponse.status, errorText);
        throw new Error(`Gemini API error: ${chatResponse.status}`);
      }

      const chatData = await chatResponse.json();
      const rawText =
        chatData.candidates?.[0]?.content?.parts?.[0]?.text || "";

      if (!rawText) {
        console.error("Gemini returned empty response. Candidates:", JSON.stringify(chatData.candidates));
        throw new Error("Empty Gemini response");
      }

      // Parse the JSON response (strip code fences if present)
      const cleaned = rawText
        .replace(/```json?\s*/g, "")
        .replace(/```\s*/g, "")
        .trim();
      const parsed = JSON.parse(cleaned);

      // Assign UUIDs to suggestions
      suggestions = (parsed.suggestions || []).map(
        (s: Omit<Suggestion, "id">) => ({
          ...s,
          id: crypto.randomUUID(),
        })
      );

      if (parsed.analysis) {
        analysis = parsed.analysis;
      }

      console.log("Gemini success:", suggestions.length, "suggestions");
    } catch (geminiError) {
      console.error("Gemini failed, using heuristic fallback:", geminiError);
      // Heuristic fallback based on computed signals
      suggestions = heuristicFallback(
        project,
        stalledTasks,
        ideas,
        tasks,
        daysSinceLastActivity,
        userContext
      );
    }

    // Ensure we always return at least one suggestion
    if (suggestions.length === 0) {
      suggestions = heuristicFallback(
        project,
        stalledTasks,
        ideas,
        tasks,
        daysSinceLastActivity,
        userContext
      );
    }

    // Insert session_log for this intervention
    const { data: logRow, error: logError } = await supabase
      .from("session_logs")
      .insert({
        user_id: userId,
        event_type: "creative_block_intervention",
        content: `Creative block intervention for project "${project.title}"${userContext ? `: ${userContext}` : ""}`,
        project_id: projectId,
        entity_type: "project",
        entity_id: projectId,
        metadata: {
          suggestionCount: suggestions.length,
          suggestionTypes: suggestions.map((s) => s.type),
          blockerType: analysis.blockerType,
          userContext: userContext || null,
        },
      })
      .select("id")
      .single();

    if (logError) {
      console.error("Failed to log intervention:", logError);
    }

    return new Response(
      JSON.stringify({
        suggestions,
        analysis,
        interventionLogId: logRow?.id ?? null,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("creative-block-help error:", error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate creative block suggestions",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

/** Heuristic fallback when Gemini fails */
function heuristicFallback(
  project: { title: string; description: string | null; genre: string | null },
  stalledTasks: { id: string; title: string; updated_at: string }[],
  ideas: { id: string; title: string; type: string }[],
  allTasks: { id: string; title: string; status: string; priority: string }[],
  daysSinceActivity: number,
  userContext?: string
): Suggestion[] {
  const suggestions: Suggestion[] = [];

  // Suggestion 1: Address stalled task
  if (stalledTasks.length > 0) {
    const stalled = stalledTasks[0];
    const daysSinceUpdate = Math.floor(
      (Date.now() - new Date(stalled.updated_at).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    suggestions.push({
      id: crypto.randomUUID(),
      type: "micro-task",
      content: `Spend just 10 minutes making any small progress on "${stalled.title}" — even a rough draft or placeholder.`,
      reasoning: `This task hasn't been touched in ${daysSinceUpdate} days. A quick, low-pressure pass can break the inertia.`,
      relatedEntityName: stalled.title,
      actionable: {
        taskTitle: `Quick 10-min pass on: ${stalled.title}`,
        taskDescription:
          "Just 10 minutes, no pressure for perfection. Any progress counts.",
      },
    });
  }

  // Suggestion 2: Connect an unlinked idea
  if (ideas.length > 0) {
    const idea = ideas[0];
    suggestions.push({
      id: crypto.randomUUID(),
      type: "perspective",
      content: `Look at your idea "${idea.title}" — could any part of it solve what's blocking you right now?`,
      reasoning: `Sometimes existing ideas hold the key to getting unstuck. This idea might offer a fresh angle.`,
      relatedEntityName: idea.title,
    });
  }

  // Suggestion 3: Pick the simplest open task
  const openTasks = allTasks.filter((t) => t.status !== "done");
  const simplestTask =
    openTasks.find((t) => t.priority === "low") || openTasks[0];
  if (simplestTask) {
    suggestions.push({
      id: crypto.randomUUID(),
      type: "constraint",
      content: `Pick "${simplestTask.title}" and give yourself exactly 15 minutes to make progress. When the timer goes off, stop — no matter what.`,
      reasoning: `Time-boxing removes the pressure of completing something perfectly. ${daysSinceActivity > 3 ? `It's been ${daysSinceActivity} days since your last activity — even small progress counts.` : "Small wins build momentum."}`,
      relatedEntityName: simplestTask.title,
      actionable: {
        taskTitle: `15-min sprint: ${simplestTask.title}`,
        taskDescription:
          "Time-boxed to 15 minutes. Any progress is a win.",
      },
    });
  }

  // If project has no tasks/ideas at all, provide starter suggestions
  if (suggestions.length === 0) {
    const genre = project.genre ? ` ${project.genre}` : "";

    suggestions.push({
      id: crypto.randomUUID(),
      type: "micro-task",
      content: `Open "${project.title}" and create 3 quick tasks — just rough titles, no details needed. Think: what are the first 3 things this${genre} project needs?`,
      reasoning: `Your project doesn't have any tasks yet. Breaking it down into small pieces makes it feel less overwhelming and gives you a clear starting point.`,
      relatedEntityName: project.title,
      actionable: {
        taskTitle: `Brain dump: 3 rough tasks for ${project.title}`,
        taskDescription:
          "Just write 3 task titles — rough and imperfect is fine. You can refine later.",
      },
    });

    suggestions.push({
      id: crypto.randomUUID(),
      type: "question",
      content: `If "${project.title}" was finished tomorrow, what's the one thing that would make you most proud about it?`,
      reasoning: `Starting from the end result can help clarify what matters most and where to focus your energy first.`,
      relatedEntityName: project.title,
    });

    suggestions.push({
      id: crypto.randomUUID(),
      type: "constraint",
      content: `Set a 15-minute timer and work on only the very first sound or element of "${project.title}". Don't think about the whole project — just the opening.`,
      reasoning: `${userContext ? `You mentioned: "${userContext}". ` : ""}Creative constraints and time-boxing help bypass perfectionism and get momentum going.`,
      relatedEntityName: project.title,
      actionable: {
        taskTitle: `15-min sprint: first element of ${project.title}`,
        taskDescription:
          "Just the opening sound/element. Timer stops at 15 minutes, no matter what.",
      },
    });
  }

  // Ensure we have at least one micro-task
  if (!suggestions.some((s) => s.type === "micro-task") && suggestions.length > 0) {
    suggestions[0] = { ...suggestions[0], type: "micro-task" };
  }

  return suggestions;
}
