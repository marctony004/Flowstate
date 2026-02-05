/**
 * Hook for managing entity embeddings
 *
 * Provides utilities for generating embeddings when content changes.
 * Embeddings are generated in the background after entity creation/update.
 */

import { useCallback } from "react";
import {
  generateEmbedding,
  buildSearchableContent,
} from "@/lib/semanticSearch";

type EntityType = "idea" | "task" | "project";

/**
 * Hook that provides embedding generation utilities
 */
export function useEmbedding() {
  /**
   * Generate embedding for an entity after creation/update
   * This runs in the background and doesn't block the UI
   */
  const embedEntity = useCallback(
    async (
      entityType: EntityType,
      entityId: string,
      entity: Record<string, unknown>
    ) => {
      const content = buildSearchableContent(entityType, entity);
      if (!content.trim()) {
        console.warn(`No content to embed for ${entityType} ${entityId}`);
        return;
      }

      // Run embedding generation in background
      generateEmbedding(entityType, entityId, content).then((success) => {
        if (success) {
          console.log(`Embedding generated for ${entityType} ${entityId}`);
        } else {
          console.warn(`Failed to generate embedding for ${entityType} ${entityId}`);
        }
      });
    },
    []
  );

  /**
   * Convenience method for embedding an idea
   */
  const embedIdea = useCallback(
    (
      ideaId: string,
      idea: { title?: string; content?: string; type?: string; tags?: string[] }
    ) => {
      embedEntity("idea", ideaId, idea);
    },
    [embedEntity]
  );

  /**
   * Convenience method for embedding a task
   */
  const embedTask = useCallback(
    (
      taskId: string,
      task: {
        title?: string;
        description?: string;
        status?: string;
        priority?: string;
      }
    ) => {
      embedEntity("task", taskId, task);
    },
    [embedEntity]
  );

  /**
   * Convenience method for embedding a project
   */
  const embedProject = useCallback(
    (
      projectId: string,
      project: {
        title?: string;
        description?: string;
        genre?: string;
        status?: string;
      }
    ) => {
      embedEntity("project", projectId, project);
    },
    [embedEntity]
  );

  return {
    embedEntity,
    embedIdea,
    embedTask,
    embedProject,
  };
}
