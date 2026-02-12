/**
 * Semantic Search Service
 *
 * Provides vector-based semantic search using Gemini embeddings.
 * Searches across ideas, tasks, and projects by meaning, not just keywords.
 */

import supabase from "@/supabase";

export interface SearchResult {
  entityType: "idea" | "task" | "project";
  entityId: string;
  content: string;
  similarity: number;
  metadata?: {
    title?: string;
    type?: string;
    status?: string;
    priority?: string;
    genre?: string;
    project_id?: string;
  };
}

interface SemanticSearchResponse {
  results: SearchResult[];
  count: number;
  fallback?: boolean;
}

interface GenerateEmbeddingResponse {
  success?: boolean;
  skipped?: boolean;
  dimensions?: number;
  error?: string;
}

/**
 * Perform semantic search across user's content
 */
export async function semanticSearch(
  query: string,
  userId: string,
  options?: {
    entityTypes?: ("idea" | "task" | "project")[];
    limit?: number;
    threshold?: number;
  }
): Promise<SearchResult[]> {
  try {
    const { data, error } = await supabase.functions.invoke<SemanticSearchResponse>(
      "semantic-search",
      {
        body: {
          query,
          userId,
          entityTypes: options?.entityTypes || ["idea", "task", "project"],
          limit: options?.limit || 10,
          threshold: options?.threshold || 0.3,
        },
      }
    );

    if (error) {
      console.error("Semantic search error:", error);
      return [];
    }

    return data?.results || [];
  } catch (err) {
    console.error("Semantic search failed:", err);
    return [];
  }
}

/**
 * Generate and store embedding for an entity
 */
export async function generateEmbedding(
  entityType: "idea" | "task" | "project",
  entityId: string,
  content: string
): Promise<boolean> {
  try {
    if (!content.trim()) {
      console.warn("Skipping empty content for embedding");
      return false;
    }

    const { data, error } = await supabase.functions.invoke<GenerateEmbeddingResponse>(
      "generate-embedding",
      {
        body: {
          entityType,
          entityId,
          content,
        },
      }
    );

    if (error) {
      console.error("Generate embedding error:", error);
      return false;
    }

    return data?.success || data?.skipped || false;
  } catch (err) {
    console.error("Generate embedding failed:", err);
    return false;
  }
}

/**
 * Generate embeddings for multiple entities in batch
 */
export async function generateEmbeddingsBatch(
  entities: Array<{
    entityType: "idea" | "task" | "project";
    entityId: string;
    content: string;
  }>
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  // Process in parallel with concurrency limit
  const batchSize = 5;
  for (let i = 0; i < entities.length; i += batchSize) {
    const batch = entities.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map((entity) =>
        generateEmbedding(entity.entityType, entity.entityId, entity.content)
      )
    );
    results.forEach((result) => {
      if (result) success++;
      else failed++;
    });
  }

  return { success, failed };
}

/**
 * Build searchable content string for an entity
 */
export function buildSearchableContent(
  entityType: "idea" | "task" | "project",
  entity: Record<string, unknown>
): string {
  const parts: string[] = [];

  if (entityType === "idea") {
    if (entity.title) parts.push(entity.title as string);
    if (entity.content) parts.push(entity.content as string);
    if (entity.type) parts.push(`Type: ${entity.type}`);
    if (Array.isArray(entity.tags) && entity.tags.length > 0) {
      parts.push(`Tags: ${entity.tags.join(", ")}`);
    }
    // Include extracted memory fields when available
    if (entity.memory && typeof entity.memory === "object") {
      const mem = entity.memory as Record<string, unknown>;
      if (mem.rawTranscript) parts.push(mem.rawTranscript as string);
      if (mem.summary) parts.push(`Summary: ${mem.summary}`);
      if (Array.isArray(mem.keyConcepts) && mem.keyConcepts.length > 0) {
        parts.push(`Concepts: ${(mem.keyConcepts as string[]).join(", ")}`);
      }
    }
  } else if (entityType === "task") {
    if (entity.title) parts.push(entity.title as string);
    if (entity.description) parts.push(entity.description as string);
    if (entity.status) parts.push(`Status: ${entity.status}`);
    if (entity.priority) parts.push(`Priority: ${entity.priority}`);
  } else if (entityType === "project") {
    if (entity.title) parts.push(entity.title as string);
    if (entity.description) parts.push(entity.description as string);
    if (entity.genre) parts.push(`Genre: ${entity.genre}`);
    if (entity.status) parts.push(`Status: ${entity.status}`);
  }

  return parts.join(". ");
}
