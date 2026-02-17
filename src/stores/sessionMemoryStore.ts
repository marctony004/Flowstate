import { create } from "zustand";
import supabase from "@/supabase";
import type { Json } from "@/types/database";

/* ── Relevance scoring ── */
export type RelevanceScores = Record<string, number>; // nodeId → 0..1

/* ── Context-aware suggestions ── */
export interface Suggestion {
  label: string;  // Short chip text
  prompt: string; // Full input text when clicked
}

/* ── Persisted memory types ── */
interface EntityWeight {
  weight: number;
  lastInteraction: string;  // ISO timestamp
  focusCount: number;
}

interface AttentionPattern {
  totalFocuses: number;
  avgSessionScore: number;
  peakScore: number;
}

interface PersistedMemory {
  entityWeights: Record<string, EntityWeight>;
  attentionPatterns: Record<string, AttentionPattern>;
}

const SUGGESTION_MAP: Record<string, Suggestion[]> = {
  ideas: [
    { label: "Link idea to project", prompt: "Link one of my recent ideas to a project" },
    { label: "Expand latest idea", prompt: "Help me expand my most recent idea" },
  ],
  projects: [
    { label: "Project status", prompt: "What's the status of my active projects?" },
    { label: "New project", prompt: "Help me start a new project" },
  ],
  tasks: [
    { label: "Due this week", prompt: "What tasks are due this week?" },
    { label: "Prioritize tasks", prompt: "Help me prioritize my open tasks" },
  ],
  collaborators: [
    { label: "Pending feedback", prompt: "Do I have any pending feedback from collaborators?" },
    { label: "Share a project", prompt: "Help me share a project with a collaborator" },
  ],
};

const ENTITY_NODE_MAP: Record<string, string> = {
  project: "projects",
  idea: "ideas",
  task: "tasks",
  collaborator: "collaborators",
};

const ACTION_WEIGHTS: Record<string, number> = {
  ENTITY_CREATE: 3,
  ENTITY_EDIT: 2,
  INSPECTOR_OPEN: 1.5,
  NODE_FOCUS: 1,
  NODE_DISMISS: 0,
};

/* ── Persistence constants ── */
const SESSION_WEIGHT_ALPHA = 0.7;      // 70% session, 30% long-term
const LONG_TERM_HALF_LIFE_DAYS = 30;   // 30-day decay for stored weights
const FLUSH_DEBOUNCE_MS = 30_000;      // Write every 30s max

/* ── Action types ── */
export type SessionActionType =
  | "NODE_FOCUS"
  | "NODE_DISMISS"
  | "INSPECTOR_OPEN"
  | "ENTITY_CREATE"
  | "ENTITY_EDIT";

export interface SessionAction {
  type: SessionActionType;
  nodeId?: string;
  entityType?: string;
  entityId?: string;
  timestamp: number;
}

export interface SessionContext {
  activeNode: string | null;
  recentActions: SessionAction[];
  touchedEntities: Set<string>;
  lastInteraction: number;
  focusHistory: string[];
}

interface SessionMemoryStore extends SessionContext {
  setActiveNode: (id: string | null) => void;
  pushAction: (
    type: SessionActionType,
    payload?: { nodeId?: string; entityType?: string; entityId?: string },
  ) => void;
  getContext: () => SessionContext;
  getRecentNodes: () => string[];
  computeRelevance: () => RelevanceScores;
  getSuggestions: () => Suggestion[];
  clearSession: () => void;
  // Persistence
  _userId: string | null;
  _persistedMemory: PersistedMemory | null;
  _hydrated: boolean;
  _flushTimer: ReturnType<typeof setTimeout> | null;
  hydrateFromSupabase: (userId: string) => Promise<void>;
  flushMemory: () => Promise<void>;
  _scheduleFlush: () => void;
}

const initialState: SessionContext = {
  activeNode: null,
  recentActions: [],
  touchedEntities: new Set<string>(),
  lastInteraction: Date.now(),
  focusHistory: [],
};

export const useSessionMemory = create<SessionMemoryStore>()((set, get) => ({
  ...initialState,

  // Persistence state
  _userId: null,
  _persistedMemory: null,
  _hydrated: false,
  _flushTimer: null,

  setActiveNode: (id) =>
    set({
      activeNode: id,
      lastInteraction: Date.now(),
    }),

  pushAction: (type, payload) => {
    set((state) => {
      const action: SessionAction = {
        type,
        ...payload,
        timestamp: Date.now(),
      };

      const recentActions = [...state.recentActions, action].slice(-20);

      // Track touched entities
      const touchedEntities = new Set(state.touchedEntities);
      if (payload?.entityId) touchedEntities.add(payload.entityId);
      if (payload?.nodeId) touchedEntities.add(payload.nodeId);

      // Update focus history — deduplicate by moving re-focused node to end
      let focusHistory = [...state.focusHistory];
      if (type === "NODE_FOCUS" && payload?.nodeId) {
        focusHistory = focusHistory.filter((id) => id !== payload.nodeId);
        focusHistory.push(payload.nodeId);
      }

      return {
        recentActions,
        touchedEntities,
        focusHistory,
        lastInteraction: Date.now(),
        activeNode:
          type === "NODE_FOCUS"
            ? (payload?.nodeId ?? state.activeNode)
            : type === "NODE_DISMISS"
              ? null
              : state.activeNode,
      };
    });
    // Schedule a persistence flush after each action
    get()._scheduleFlush();
  },

  getContext: () => {
    const { activeNode, recentActions, touchedEntities, lastInteraction, focusHistory } = get();
    return { activeNode, recentActions, touchedEntities, lastInteraction, focusHistory };
  },

  getRecentNodes: () => {
    const { recentActions } = get();
    const seen = new Set<string>();
    const result: string[] = [];
    for (const a of recentActions) {
      if (a.nodeId && !seen.has(a.nodeId)) {
        seen.add(a.nodeId);
        result.push(a.nodeId);
      }
    }
    return result;
  },

  computeRelevance: () => {
    const { recentActions, _persistedMemory, _hydrated } = get();
    const now = Date.now();

    // ── Session scores ──
    const rawSession: Record<string, number> = {};
    for (const action of recentActions) {
      const nodeId =
        action.nodeId ??
        (action.entityType ? ENTITY_NODE_MAP[action.entityType] : undefined);
      if (!nodeId) continue;

      const weight = ACTION_WEIGHTS[action.type] ?? 0;
      if (weight === 0) continue;

      const ageSec = (now - action.timestamp) / 1000;
      const score = weight * Math.exp(-ageSec / 300);
      rawSession[nodeId] = (rawSession[nodeId] ?? 0) + score;
    }

    // Normalize session scores to 0..1
    const maxSession = Math.max(...Object.values(rawSession), 0);
    const sessionScores: RelevanceScores = {};
    if (maxSession > 0) {
      for (const [id, val] of Object.entries(rawSession)) {
        sessionScores[id] = val / maxSession;
      }
    }

    // If not hydrated or no persisted memory, return session-only scores
    if (!_hydrated || !_persistedMemory) {
      return sessionScores;
    }

    // ── Long-term scores ──
    const rawLongTerm: Record<string, number> = {};
    for (const [nodeId, ew] of Object.entries(_persistedMemory.entityWeights)) {
      if (ew.weight > 0) {
        rawLongTerm[nodeId] = ew.weight;
      }
    }

    const maxLongTerm = Math.max(...Object.values(rawLongTerm), 0);
    const longTermScores: RelevanceScores = {};
    if (maxLongTerm > 0) {
      for (const [id, val] of Object.entries(rawLongTerm)) {
        longTermScores[id] = val / maxLongTerm;
      }
    }

    // ── Blend ──
    const allNodes = new Set([
      ...Object.keys(sessionScores),
      ...Object.keys(longTermScores),
    ]);

    const blended: RelevanceScores = {};
    for (const nodeId of allNodes) {
      const s = sessionScores[nodeId] ?? 0;
      const lt = longTermScores[nodeId] ?? 0;
      blended[nodeId] = SESSION_WEIGHT_ALPHA * s + (1 - SESSION_WEIGHT_ALPHA) * lt;
    }

    return blended;
  },

  getSuggestions: () => {
    const scores = get().computeRelevance();
    const entries = Object.entries(scores)
      .filter(([, score]) => score > 0.1)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    const suggestions: Suggestion[] = [];
    for (const [nodeId] of entries) {
      const pool = SUGGESTION_MAP[nodeId];
      if (pool?.[0]) suggestions.push(pool[0]);
    }
    return suggestions;
  },

  clearSession: () => {
    // Cancel pending flush timer but preserve persisted state
    const timer = get()._flushTimer;
    if (timer) clearTimeout(timer);
    set({
      ...initialState,
      touchedEntities: new Set<string>(),
      _flushTimer: null,
    });
  },

  /* ── Persistence methods ── */

  hydrateFromSupabase: async (userId: string) => {
    const state = get();
    // Idempotent — skip if already hydrated for this user
    if (state._hydrated && state._userId === userId) return;

    try {
      set({ _userId: userId });

      const { data, error } = await supabase
        .from("project_memory")
        .select("entity_weights, attention_patterns, updated_at")
        .eq("user_id", userId)
        .single();

      if (error) {
        // PGRST116 = row not found — normal for new users
        if (error.code === "PGRST116") {
          set({
            _persistedMemory: { entityWeights: {}, attentionPatterns: {} },
            _hydrated: true,
          });
          return;
        }
        // Any other error — degrade gracefully
        console.warn("[SessionMemory] Hydration failed, using empty memory:", error.message);
        set({
          _persistedMemory: { entityWeights: {}, attentionPatterns: {} },
          _hydrated: true,
        });
        return;
      }

      // Apply long-term decay to stored weights
      const entityWeights = (data.entity_weights as unknown as Record<string, EntityWeight>) ?? {};
      const attentionPatterns = (data.attention_patterns as unknown as Record<string, AttentionPattern>) ?? {};
      const updatedAt = new Date(data.updated_at).getTime();
      const daysSinceUpdate = (Date.now() - updatedAt) / (1000 * 60 * 60 * 24);
      const decayFactor = Math.exp(-daysSinceUpdate * Math.LN2 / LONG_TERM_HALF_LIFE_DAYS);

      for (const key of Object.keys(entityWeights)) {
        entityWeights[key] = {
          ...entityWeights[key],
          weight: entityWeights[key].weight * decayFactor,
        };
      }

      set({
        _persistedMemory: { entityWeights, attentionPatterns },
        _hydrated: true,
      });

      // Register beforeunload listener for final flush
      const handleUnload = () => {
        get().flushMemory();
      };
      window.addEventListener("beforeunload", handleUnload);
    } catch (err) {
      console.warn("[SessionMemory] Hydration error:", err);
      set({
        _persistedMemory: { entityWeights: {}, attentionPatterns: {} },
        _hydrated: true,
      });
    }
  },

  flushMemory: async () => {
    const state = get();
    if (!state._userId || !state._hydrated) return;

    try {
      // Aggregate current session actions into per-node scores
      const now = Date.now();
      const sessionNodeScores: Record<string, { score: number; focusCount: number }> = {};

      for (const action of state.recentActions) {
        const nodeId =
          action.nodeId ??
          (action.entityType ? ENTITY_NODE_MAP[action.entityType] : undefined);
        if (!nodeId) continue;

        const weight = ACTION_WEIGHTS[action.type] ?? 0;
        if (weight === 0) continue;

        const ageSec = (now - action.timestamp) / 1000;
        const score = weight * Math.exp(-ageSec / 300);

        if (!sessionNodeScores[nodeId]) {
          sessionNodeScores[nodeId] = { score: 0, focusCount: 0 };
        }
        sessionNodeScores[nodeId].score += score;
        if (action.type === "NODE_FOCUS") {
          sessionNodeScores[nodeId].focusCount += 1;
        }
      }

      // Merge additively with persisted entity weights
      const entityWeights = { ...(state._persistedMemory?.entityWeights ?? {}) };
      const attentionPatterns = { ...(state._persistedMemory?.attentionPatterns ?? {}) };

      for (const [nodeId, sessionData] of Object.entries(sessionNodeScores)) {
        const existing = entityWeights[nodeId];
        const newWeight = (existing?.weight ?? 0) + sessionData.score;
        const newFocusCount = (existing?.focusCount ?? 0) + sessionData.focusCount;

        entityWeights[nodeId] = {
          weight: newWeight,
          lastInteraction: new Date().toISOString(),
          focusCount: newFocusCount,
        };

        // Update attention patterns
        const existingPattern = attentionPatterns[nodeId];
        const totalFocuses = (existingPattern?.totalFocuses ?? 0) + sessionData.focusCount;
        const prevAvg = existingPattern?.avgSessionScore ?? 0;
        const prevPeak = existingPattern?.peakScore ?? 0;
        // Running average: blend previous average with session score
        const sessionNormalized = sessionData.score;
        const avgSessionScore = totalFocuses > 0
          ? (prevAvg * (existingPattern?.totalFocuses ?? 0) + sessionNormalized) / totalFocuses
          : sessionNormalized;

        attentionPatterns[nodeId] = {
          totalFocuses,
          avgSessionScore,
          peakScore: Math.max(prevPeak, sessionNormalized),
        };
      }

      // Update local state immediately (even if write fails)
      const updatedMemory: PersistedMemory = { entityWeights, attentionPatterns };
      set({ _persistedMemory: updatedMemory });

      // Upsert to Supabase (fire-and-forget)
      await supabase
        .from("project_memory")
        .upsert(
          {
            user_id: state._userId,
            entity_weights: entityWeights as unknown as Json,
            attention_patterns: attentionPatterns as unknown as Json,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        );
    } catch (err) {
      console.warn("[SessionMemory] Flush failed:", err);
    }
  },

  _scheduleFlush: () => {
    const state = get();
    if (!state._hydrated || !state._userId) return;

    if (state._flushTimer) clearTimeout(state._flushTimer);

    const timer = setTimeout(() => {
      get().flushMemory();
    }, FLUSH_DEBOUNCE_MS);

    set({ _flushTimer: timer });
  },
}));

/* ── Dev console access ── */
if (typeof window !== "undefined") {
  (window as unknown as Record<string, unknown>).__sessionMemory = {
    getContext: () => useSessionMemory.getState().getContext(),
    getRecentNodes: () => useSessionMemory.getState().getRecentNodes(),
    computeRelevance: () => useSessionMemory.getState().computeRelevance(),
    getSuggestions: () => useSessionMemory.getState().getSuggestions(),
    clearSession: () => useSessionMemory.getState().clearSession(),
    getStore: () => useSessionMemory.getState(),
    flushMemory: () => useSessionMemory.getState().flushMemory(),
    hydrateFromSupabase: (userId: string) => useSessionMemory.getState().hydrateFromSupabase(userId),
  };
}
