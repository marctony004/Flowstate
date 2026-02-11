import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_EMBED_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ─── RAG: query_workspace ────────────────────────────────────────────
async function handleQueryWorkspace(
  query: string,
  userId: string,
  supabase: any
): Promise<string> {
  if (!query || !GEMINI_API_KEY)
    return "Search is unavailable right now. Try again later.";

  // 1. Generate embedding
  let queryEmbedding: number[] = [];
  try {
    const res = await fetch(`${GEMINI_EMBED_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "models/gemini-embedding-001",
        content: { parts: [{ text: query }] },
        outputDimensionality: 768,
      }),
    });
    if (res.ok) {
      const d = await res.json();
      queryEmbedding = d.embedding?.values || [];
    }
  } catch {
    /* continue */
  }

  if (queryEmbedding.length === 0)
    return "I couldn't process that query. Could you rephrase?";

  // 2. Semantic search
  const { data: searchResults } = await supabase.rpc("search_embeddings", {
    query_embedding: `[${queryEmbedding.join(",")}]`,
    match_threshold: 0.1,
    match_count: 8,
    filter_user_id: userId,
    filter_entity_types: ["idea", "task", "project"],
  });

  if (!searchResults || searchResults.length === 0)
    return "I didn't find anything in your workspace matching that. You might not have any items related to this yet.";

  // 3. Enrich results
  const items: string[] = [];
  for (const r of searchResults) {
    if (r.entity_type === "idea") {
      const { data } = await supabase
        .from("ideas")
        .select("title, content, type, tags")
        .eq("id", r.entity_id)
        .single();
      if (data)
        items.push(
          `[IDEA] "${data.title}" - ${data.content || "No details"}${data.tags?.length ? ` (Tags: ${data.tags.join(", ")})` : ""}`
        );
    } else if (r.entity_type === "task") {
      const { data } = await supabase
        .from("tasks")
        .select(
          "title, description, status, priority, due_date, projects(title)"
        )
        .eq("id", r.entity_id)
        .single();
      if (data)
        items.push(
          `[TASK] "${data.title}" - Status: ${data.status}, Priority: ${data.priority}${data.due_date ? `, Due: ${data.due_date}` : ""}${(data.projects as any)?.title ? ` (Project: ${(data.projects as any).title})` : ""}${data.description ? `. ${data.description}` : ""}`
        );
    } else if (r.entity_type === "project") {
      const { data } = await supabase
        .from("projects")
        .select("title, description, status, genre")
        .eq("id", r.entity_id)
        .single();
      if (data)
        items.push(
          `[PROJECT] "${data.title}" - Status: ${data.status}${data.genre ? `, Genre: ${data.genre}` : ""}${data.description ? `. ${data.description}` : ""}`
        );
    }
  }

  return items.length > 0
    ? `Here's what's in the user's workspace:\n${items.join("\n")}`
    : "No matching items found in the workspace.";
}

// ─── Action: create_idea ─────────────────────────────────────────────
async function handleCreateIdea(
  args: any,
  userId: string,
  supabase: any
): Promise<string> {
  const { data, error } = await supabase
    .from("ideas")
    .insert({
      owner_id: userId,
      title:
        args.title ||
        args.content?.substring(0, 50) ||
        "Untitled Idea",
      content: args.content || args.title || null,
      type: args.type || "voice",
      tags: args.tags || null,
    })
    .select("id, title")
    .single();

  if (error) return `Failed to create idea: ${error.message}`;

  // Fire-and-forget: embedding + activity log
  try {
    await supabase.functions.invoke("generate-embedding", {
      body: {
        entityType: "idea",
        entityId: data.id,
        content: `${data.title} ${args.content || ""}`,
        userId,
      },
    });
  } catch {
    /* silent */
  }
  await supabase.from("activity_log").insert({
    user_id: userId,
    action: "create",
    entity_type: "idea",
    entity_id: data.id,
    metadata: { title: data.title, source: "vapi-voice" },
  });

  return `Created idea "${data.title}" successfully.`;
}

// ─── Action: create_task ─────────────────────────────────────────────
async function handleCreateTask(
  args: any,
  userId: string,
  supabase: any
): Promise<string> {
  let projectId = args.project_id;
  if (!projectId) {
    const { data: proj } = await supabase
      .from("projects")
      .select("id")
      .eq("owner_id", userId)
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .limit(1);
    projectId = proj?.[0]?.id;
  }
  if (!projectId)
    return "No active project found. Please create a project first.";

  const { data: posData } = await supabase
    .from("tasks")
    .select("position")
    .eq("created_by", userId)
    .order("position", { ascending: false })
    .limit(1);
  const nextPos = (posData?.[0]?.position ?? -1) + 1;

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      created_by: userId,
      project_id: projectId,
      title: args.title || "Untitled Task",
      description: args.description || null,
      priority: args.priority || "medium",
      due_date: args.due_date || null,
      status: "todo",
      position: nextPos,
    })
    .select("id, title")
    .single();

  if (error) return `Failed to create task: ${error.message}`;

  try {
    await supabase.functions.invoke("generate-embedding", {
      body: {
        entityType: "task",
        entityId: data.id,
        content: `${data.title} ${args.description || ""}`,
        userId,
      },
    });
  } catch {
    /* silent */
  }
  await supabase.from("activity_log").insert({
    user_id: userId,
    action: "create",
    entity_type: "task",
    entity_id: data.id,
    project_id: projectId,
    metadata: { title: data.title, source: "vapi-voice" },
  });

  return `Created task "${data.title}" successfully.`;
}

// ─── Action: create_project ──────────────────────────────────────────
async function handleCreateProject(
  args: any,
  userId: string,
  supabase: any
): Promise<string> {
  const { data, error } = await supabase
    .from("projects")
    .insert({
      owner_id: userId,
      title: args.name || args.title || "Untitled Project",
      description: args.description || null,
      genre: args.genre || null,
      bpm: args.bpm || null,
      key_signature: args.key_signature || null,
      status: "active",
    })
    .select("id, title")
    .single();

  if (error) return `Failed to create project: ${error.message}`;

  try {
    await supabase.functions.invoke("generate-embedding", {
      body: {
        entityType: "project",
        entityId: data.id,
        content: `${data.title} ${args.description || ""}`,
        userId,
      },
    });
  } catch {
    /* silent */
  }
  await supabase.from("activity_log").insert({
    user_id: userId,
    action: "create",
    entity_type: "project",
    entity_id: data.id,
    metadata: { title: data.title, source: "vapi-voice" },
  });

  return `Created project "${data.title}" successfully.`;
}

// ─── Main Handler ────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json();

    // Extract user_id from URL query params or call metadata
    const url = new URL(req.url);
    const userId =
      url.searchParams.get("user_id") ||
      body.message?.call?.metadata?.user_id ||
      body.call?.metadata?.user_id;

    console.log("Vapi action received, userId:", userId, "type:", body.message?.type);

    const message = body.message;

    if (message?.type === "tool-calls") {
      // Handle both Vapi payload formats (toolCallList / toolCalls)
      const toolCalls = message.toolCallList || message.toolCalls || [];
      const results = [];

      for (const toolCall of toolCalls) {
        const id = toolCall.id;
        const name = toolCall.name || toolCall.function?.name;
        const args =
          toolCall.arguments ||
          (typeof toolCall.function?.arguments === "string"
            ? JSON.parse(toolCall.function.arguments)
            : toolCall.function?.arguments) ||
          {};

        if (!userId) {
          results.push({
            toolCallId: id,
            result: "Error: Could not identify user.",
          });
          continue;
        }

        console.log(`Executing tool: ${name}`, args);
        let result: string;

        if (name === "query_workspace") {
          result = await handleQueryWorkspace(args.query, userId, supabase);
        } else if (name === "create_idea") {
          result = await handleCreateIdea(args, userId, supabase);
        } else if (name === "create_task") {
          result = await handleCreateTask(args, userId, supabase);
        } else if (name === "create_project") {
          result = await handleCreateProject(args, userId, supabase);
        } else {
          result = `Unknown tool: ${name}`;
        }

        results.push({ toolCallId: id, result });
      }

      return new Response(JSON.stringify({ results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ message: "Unhandled message type." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Vapi Action Error:", error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "Internal Server Error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
