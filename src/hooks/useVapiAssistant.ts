import { useEffect, useState, useRef } from "react";
import Vapi from "@vapi-ai/web";

const VAPI_PUBLIC_KEY =
  import.meta.env.VITE_VAPI_PUBLIC_KEY || "YOUR_VAPI_PUBLIC_KEY_HERE";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";

export enum VapiStatus {
  LOADING = "loading",
  IDLE = "idle",
  CONNECTING = "connecting",
  ACTIVE = "active",
  ERROR = "error",
}

/**
 * Build an inline Vapi assistant config that constrains the voice assistant
 * to ONLY respond using data from our RAG pipeline (via vapi-actions edge function).
 */
function buildAssistantConfig(userId: string) {
  const serverUrl = `${SUPABASE_URL}/functions/v1/vapi-actions?user_id=${userId}`;

  return {
    name: "FlowState",
    firstMessage:
      "Hey! I'm FlowState, your creative assistant. What can I help you with?",
    model: {
      provider: "openai" as const,
      model: "gpt-4o-mini" as const,
      temperature: 0.4,
      messages: [
        {
          role: "system" as const,
          content: `You are FlowState, a voice assistant for musicians and producers. You help them manage their creative workspace.

CRITICAL RULES:
1. ALWAYS call query_workspace BEFORE answering any question about the user's projects, tasks, ideas, deadlines, or schedule.
2. ONLY state facts that come from tool results. If query_workspace returns no relevant results, say "I don't have any info on that in your workspace yet."
3. NEVER fabricate or guess project names, task details, due dates, or any workspace data.
4. Keep responses SHORT and conversational — this is voice, not text. 1-3 sentences max.
5. You CAN create ideas, tasks, and projects when the user asks — use the appropriate tool.
6. When the user asks something completely unrelated to their workspace (like general trivia), briefly say you're focused on their FlowState workspace and suggest what you can help with.
7. If query results are loosely related but not an exact match, you can mention them as "related items" but don't overstate their relevance.`,
        },
      ],
      tools: [
        {
          type: "function" as const,
          function: {
            name: "query_workspace",
            description:
              "Search the user's FlowState workspace for projects, tasks, ideas, and other data. MUST be called before answering any question about the user's work, schedule, or deadlines.",
            parameters: {
              type: "object" as const,
              properties: {
                query: {
                  type: "string" as const,
                  description: "Natural language search query about the user's workspace",
                },
              },
              required: ["query"],
            },
          },
          server: { url: serverUrl },
          messages: [
            {
              type: "request-start" as const,
              content: "Let me check your workspace...",
            },
          ],
        },
        {
          type: "function" as const,
          function: {
            name: "create_idea",
            description: "Save a new idea in the user's workspace",
            parameters: {
              type: "object" as const,
              properties: {
                title: {
                  type: "string" as const,
                  description: "Idea title",
                },
                content: {
                  type: "string" as const,
                  description: "Idea details or description",
                },
                tags: {
                  type: "array" as const,
                  items: { type: "string" },
                  description: "Tags like genre, mood, instrument",
                },
              },
              required: ["title"],
            },
          },
          server: { url: serverUrl },
          messages: [
            {
              type: "request-start" as const,
              content: "Saving that idea...",
            },
            {
              type: "request-complete" as const,
              content: "Idea saved!",
            },
          ],
        },
        {
          type: "function" as const,
          function: {
            name: "create_task",
            description: "Create a new task in the user's workspace",
            parameters: {
              type: "object" as const,
              properties: {
                title: {
                  type: "string" as const,
                  description: "Task title",
                },
                description: {
                  type: "string" as const,
                  description: "Task details",
                },
                priority: {
                  type: "string" as const,
                  enum: ["low", "medium", "high"],
                  description: "Priority level",
                },
              },
              required: ["title"],
            },
          },
          server: { url: serverUrl },
          messages: [
            {
              type: "request-start" as const,
              content: "Creating that task...",
            },
            {
              type: "request-complete" as const,
              content: "Task created!",
            },
          ],
        },
        {
          type: "function" as const,
          function: {
            name: "create_project",
            description: "Start a new project in the user's workspace",
            parameters: {
              type: "object" as const,
              properties: {
                name: {
                  type: "string" as const,
                  description: "Project name",
                },
                description: {
                  type: "string" as const,
                  description: "Project description",
                },
                genre: {
                  type: "string" as const,
                  description: "Musical genre if mentioned",
                },
              },
              required: ["name"],
            },
          },
          server: { url: serverUrl },
          messages: [
            {
              type: "request-start" as const,
              content: "Setting up that project...",
            },
            {
              type: "request-complete" as const,
              content: "Project created!",
            },
          ],
        },
      ],
    },
    voice: {
      provider: "11labs" as const,
      voiceId: import.meta.env.VITE_VAPI_VOICE_ID || "21m00Tcm4TlvDq8ikWAM",
    },
  };
}

export const useVapiAssistant = (
  userId: string,
  onAction?: (entityType: string) => void,
) => {
  const [status, setStatus] = useState<VapiStatus>(VapiStatus.IDLE);
  const [isSpeechActive, setIsSpeechActive] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [messages, setMessages] = useState<any[]>([]);
  const vapiRef = useRef<Vapi | null>(null);
  const onActionRef = useRef(onAction);
  onActionRef.current = onAction;

  useEffect(() => {
    const vapi = new Vapi(VAPI_PUBLIC_KEY);
    vapiRef.current = vapi;

    // Map tool names to entity types for brain-map pings
    const toolToEntity: Record<string, string> = {
      create_idea: "idea",
      create_task: "task",
      create_project: "project",
    };

    // Event listeners
    const onCallStart = () => setStatus(VapiStatus.ACTIVE);
    const onCallEnd = () => {
      setStatus(VapiStatus.IDLE);
      setIsSpeechActive(false);
      setVolumeLevel(0);
    };
    const onSpeechStart = () => setIsSpeechActive(true);
    const onSpeechEnd = () => setIsSpeechActive(false);
    const onVolumeLevel = (volume: number) => setVolumeLevel(volume);
    const onError = (error: any) => {
      console.error("Vapi error:", error);
      setStatus(VapiStatus.ERROR);
    };

    const onMessage = (message: any) => {
      if (
        message.type === "transcript" &&
        message.transcriptType === "final"
      ) {
        setMessages((prev) => [
          ...prev,
          {
            role: message.role,
            content: message.transcript,
            timestamp: new Date().toISOString(),
          },
        ]);
      }

      // Detect completed tool calls for create actions → trigger brain map ping
      // "tool-calls-result" fires AFTER the server responds (entity is in DB)
      // "tool-calls" fires BEFORE (entity may not exist yet) — use delay as fallback
      if (message.type === "tool-calls-result") {
        // Result message — entity is already created, fire immediately
        const toolCalls = message.toolCallList || message.toolCalls || [];
        for (const tc of toolCalls) {
          const name = tc.name || tc.function?.name;
          const entityType = toolToEntity[name];
          if (entityType && onActionRef.current) {
            onActionRef.current(entityType);
          }
        }
      } else if (message.type === "tool-calls") {
        // Request message — server hasn't finished yet, delay to let DB insert complete
        const toolCalls = message.toolCallList || message.toolCalls || [];
        for (const tc of toolCalls) {
          const name = tc.name || tc.function?.name;
          const entityType = toolToEntity[name];
          if (entityType && onActionRef.current) {
            setTimeout(() => {
              if (onActionRef.current) onActionRef.current(entityType);
            }, 2500);
          }
        }
      }
      // Also handle function-call message type (older Vapi format)
      if (message.type === "function-call") {
        const name = message.functionCall?.name || message.name;
        const entityType = toolToEntity[name];
        if (entityType && onActionRef.current) {
          setTimeout(() => {
            if (onActionRef.current) onActionRef.current(entityType);
          }, 2500);
        }
      }
    };

    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("volume-level", onVolumeLevel);
    vapi.on("message", onMessage);
    vapi.on("error", onError);

    return () => {
      vapi.stop();
      vapi.removeAllListeners();
      vapiRef.current = null;
    };
  }, []);

  const toggleCall = async () => {
    const vapi = vapiRef.current;
    if (!vapi) return;

    if (status === VapiStatus.ACTIVE || status === VapiStatus.CONNECTING) {
      vapi.stop();
    } else {
      setStatus(VapiStatus.CONNECTING);
      try {
        // Use inline assistant config — constrains voice to RAG-only responses
        await vapi.start(buildAssistantConfig(userId) as any);
      } catch (err) {
        console.error("Failed to start Vapi call", err);
        setStatus(VapiStatus.ERROR);
      }
    }
  };

  return {
    status,
    isSpeechActive,
    volumeLevel,
    messages,
    toggleCall,
    vapi: vapiRef.current,
  };
};
