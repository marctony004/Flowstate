/**
 * AskFlowState - AI Voice Assistant Side Panel
 *
 * A docked side panel AI assistant that can:
 * - Answer questions about your projects, ideas, and tasks
 * - Accept voice input (speech-to-text)
 * - Respond with voice output (text-to-speech)
 * - Show citations from your data
 * - Collapse to minimize while keeping context
 * - Persist chat history to Supabase
 * - Per-message edit/resend and delete (user messages only)
 * - Local-only clear with restore, and permanent DB delete
 */

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  Mic,
  Send,
  Loader2,
  Sparkles,
  Lightbulb,
  CheckSquare,
  FolderKanban,
  ExternalLink,
  MessageSquare,
  X,
  PanelRightClose,
  PanelRightOpen,
  Trash2,
  Plus,
  Pencil,
  RotateCcw,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/context/SessionContext";
import { useVapiAssistant, VapiStatus } from "@/hooks/useVapiAssistant";
import supabase from "@/supabase";
import { cn } from "@/lib/utils";
import { sendNotification } from "@/lib/notifications";
import { useSessionMemory } from "@/stores/sessionMemoryStore";
import { getChatClearedAt, clearChatClearedAt } from "@/lib/chatClearStorage";
import ClearChatDialog from "./ClearChatDialog";
import type { Json } from "@/types/database";
import { toast } from "sonner";

interface Citation {
  entityType: string;
  entityId: string;
  title: string;
  excerpt: string;
  similarity: number;
}

interface ActionPerformed {
  type: string;
  entityType?: string;
  action?: string;
  title: string;
  id: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  actions?: ActionPerformed[];
  timestamp: Date;
}

interface AskFlowStateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAction?: (entityType: string) => void;
}

const entityIcons: Record<string, typeof Lightbulb> = {
  idea: Lightbulb,
  task: CheckSquare,
  project: FolderKanban,
};

export default function AskFlowState({ open, onOpenChange, onAction }: AskFlowStateProps) {
  const { session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Per-message edit state
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [sendingEditId, setSendingEditId] = useState<string | null>(null);
  const editInputRef = useRef<HTMLTextAreaElement>(null);

  // Per-message delete state
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Hover state
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);

  // Clear chat dialog
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  // Local clear state
  const userId = session?.user.id;
  const [localClearedAt, setLocalClearedAt] = useState<string | null>(null);

  // Check local clear flag on mount / userId change
  useEffect(() => {
    if (userId) {
      setLocalClearedAt(getChatClearedAt(userId));
    }
  }, [userId]);

  // Vapi Assistant — pass onAction so voice-created entities trigger brain map ping
  const {
    status: vapiStatus,
    isSpeechActive,
    toggleCall,
  } = useVapiAssistant(session?.user.id || "", onAction);

  const isVapiActive = vapiStatus === VapiStatus.ACTIVE || vapiStatus === VapiStatus.CONNECTING;

  // Context-aware suggestions from session memory
  const recentActions = useSessionMemory((s) => s.recentActions);
  const suggestions = useMemo(
    () => useSessionMemory.getState().getSuggestions(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [recentActions],
  );

  // Load chat history from database on first open
  useEffect(() => {
    if (!open || historyLoaded || !userId) return;

    // If locally cleared, don't fetch — show empty state
    if (localClearedAt) {
      setHistoryLoaded(true);
      return;
    }

    async function loadHistory() {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: true })
        .limit(50);

      if (data && data.length > 0) {
        const restored: Message[] = data.map((row) => ({
          id: row.id,
          role: row.role as "user" | "assistant",
          content: row.content,
          citations: row.citations ? (row.citations as unknown as Citation[]) : undefined,
          timestamp: new Date(row.created_at),
        }));
        setMessages(restored);
      }
      setHistoryLoaded(true);
    }

    loadHistory();
  }, [open, historyLoaded, userId, localClearedAt]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (open && !isCollapsed) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, isCollapsed]);

  // Focus edit textarea when editing starts
  useEffect(() => {
    if (editingMessageId) {
      setTimeout(() => editInputRef.current?.focus(), 50);
    }
  }, [editingMessageId]);

  // Save a message to the database (fire-and-forget)
  const persistMessage = useCallback(
    async (msg: Message) => {
      if (!userId) return;
      try {
        await supabase.from("chat_messages").insert({
          id: msg.id,
          user_id: userId,
          role: msg.role,
          content: msg.content,
          citations: msg.citations ? (msg.citations as unknown as Json) : null,
        });
      } catch {
        // Silent fail — don't block chat
      }
    },
    [userId]
  );

  // Core send logic — used by both normal send and edit+resend
  const doSend = useCallback(async (content: string) => {
    if (!content.trim() || !userId || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Persist user message
    persistMessage(userMessage);

    try {
      // Build conversation history for context
      const conversationHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const { data, error } = await supabase.functions.invoke("ask-flowstate", {
        body: {
          question: userMessage.content,
          userId,
          conversationHistory,
        },
      });

      if (error) throw error;

      // Handle rate limit response (edge function returns 429)
      if (data?.error && data?.retryAfterMs) {
        const waitSec = Math.ceil(data.retryAfterMs / 1000);
        const rateLimitMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `You're sending messages too quickly. Please wait ${waitSec}s and try again.`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, rateLimitMsg]);
        setIsLoading(false);
        return;
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.answer,
        citations: data.citations,
        actions: data.actions && data.actions.length > 0 ? data.actions : undefined,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Persist assistant message
      persistMessage(assistantMessage);

      // Notify parent about performed actions (triggers brain map node ping)
      if (data.actions && data.actions.length > 0) {
        for (const action of data.actions) {
          const entityType = action.entityType || action.type?.replace(/^create_/, "") || "idea";
          if (onAction) onAction(entityType);
          sendNotification({
            userId,
            type: "ai_action",
            title: `AI created ${entityType}: ${action.title}`,
            message: `FlowState assistant created a new ${entityType} for you.`,
            entityType,
            entityId: action.id,
          });
        }
      }

    } catch (err) {
      console.error("Ask FlowState error:", err);
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Sorry, I encountered an error: ${err instanceof Error ? err.message : String(err)}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [userId, isLoading, messages, persistMessage, onAction]);

  // Handle sending a message from input
  const sendMessage = useCallback(async () => {
    if (!inputValue.trim()) return;
    const content = inputValue.trim();
    setInputValue("");
    // If locally cleared, remove the flag since user is actively chatting
    if (localClearedAt && userId) {
      clearChatClearedAt(userId);
      setLocalClearedAt(null);
    }
    await doSend(content);
  }, [inputValue, doSend, localClearedAt, userId]);

  // Handle key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Toggle voice input (Vapi)
  const toggleListening = () => {
    toggleCall();
  };

  // ── Per-message: Edit + Resend ──

  function startEdit(message: Message) {
    setEditingMessageId(message.id);
    setEditContent(message.content);
  }

  function cancelEdit() {
    setEditingMessageId(null);
    setEditContent("");
    setSendingEditId(null);
  }

  async function handleResend() {
    if (!editContent.trim() || sendingEditId || isLoading) return;
    const originalId = editingMessageId;
    setSendingEditId(originalId);
    setEditingMessageId(null);

    // If locally cleared, remove the flag
    if (localClearedAt && userId) {
      clearChatClearedAt(userId);
      setLocalClearedAt(null);
    }

    await doSend(editContent.trim());
    setSendingEditId(null);
    setEditContent("");
  }

  function handleEditKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleResend();
    }
    if (e.key === "Escape") {
      cancelEdit();
    }
  }

  // ── Per-message: Delete single user message ──

  async function handleDeleteMessage(messageId: string) {
    if (!userId) return;
    setDeletingMessageId(messageId);

    // Optimistically remove from local state
    const previousMessages = messages;
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    setConfirmDeleteId(null);

    try {
      const { error } = await supabase
        .from("chat_messages")
        .delete()
        .eq("id", messageId)
        .eq("user_id", userId);

      if (error) throw error;
      toast.success("Message deleted");
    } catch (err) {
      console.error("Failed to delete message:", err);
      // Revert optimistic removal
      setMessages(previousMessages);
      toast.error("Failed to delete message");
    } finally {
      setDeletingMessageId(messageId);
      setTimeout(() => setDeletingMessageId(null), 0);
    }
  }

  // ── Clear chat dialog callback ──

  function handleChatCleared(type: "local" | "permanent") {
    if (type === "local") {
      setLocalClearedAt(getChatClearedAt(userId!) ?? new Date().toISOString());
      setMessages([]);
    } else {
      setLocalClearedAt(null);
      setMessages([]);
    }
    setHistoryLoaded(true);
  }

  // ── Restore locally cleared chat ──

  function handleRestoreChat() {
    if (!userId) return;
    clearChatClearedAt(userId);
    setLocalClearedAt(null);
    setMessages([]);
    setHistoryLoaded(false); // will trigger re-fetch on next effect cycle
    toast.success("Chat history restored");
  }

  // Close panel
  const handleClose = () => {
    setInputValue("");
    setIsCollapsed(false);
    setEditingMessageId(null);
    setEditContent("");
    onOpenChange(false);
  };

  if (!open) return null;

  // Collapsed state - just show a thin bar with expand button
  if (isCollapsed) {
    return (
      <div className="fixed right-0 top-0 h-full w-12 bg-card border-l border-border flex flex-col items-center py-4 z-50 animate-[expandFromButton_0.25s_ease-out_forwards] origin-bottom-right">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(false)}
          className="mb-2"
        >
          <PanelRightOpen className="h-5 w-5" />
        </Button>
        <div className="flex-1 flex items-center">
          <div className="flex flex-col items-center gap-1">
            <span className="flex items-end gap-[2px] h-5">
              <span className="w-[2px] bg-primary rounded-full animate-[equalize_2.8s_ease-in-out_infinite]" style={{ height: '40%' }} />
              <span className="w-[2px] bg-primary rounded-full animate-[equalize_2.2s_ease-in-out_infinite]" style={{ height: '70%', animationDelay: '0.5s' }} />
              <span className="w-[2px] bg-primary rounded-full animate-[equalize_2.5s_ease-in-out_infinite]" style={{ height: '100%', animationDelay: '0.3s' }} />
              <span className="w-[2px] bg-primary rounded-full animate-[equalize_2s_ease-in-out_infinite]" style={{ height: '60%', animationDelay: '0.8s' }} />
            </span>
          </div>
        </div>
        {messages.length > 0 && (
          <Badge variant="secondary" className="text-xs px-1.5">
            {messages.length}
          </Badge>
        )}
      </div>
    );
  }

  // Determine what to show in message area
  const isLocallyCleared = !!localClearedAt;
  const showEmptyState = messages.length === 0 && !isLoading;

  return (
    <div className="fixed right-0 top-0 h-full w-full max-w-md bg-card border-l border-border flex flex-col z-50 shadow-xl animate-[expandFromButton_0.35s_ease-out_forwards] origin-bottom-right">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border animate-[staggerFadeUp_0.3s_ease-out_forwards]" style={{ animationDelay: '0.2s', opacity: 0 }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
              {/* Equalizer bars logo */}
              <span className="flex items-end gap-[2px] h-4">
                <span className="w-[2px] bg-primary-foreground rounded-full animate-[equalize_2.8s_ease-in-out_infinite]" style={{ height: '40%' }} />
                <span className="w-[2px] bg-primary-foreground rounded-full animate-[equalize_2.2s_ease-in-out_infinite]" style={{ height: '70%', animationDelay: '0.5s' }} />
                <span className="w-[2px] bg-primary-foreground rounded-full animate-[equalize_2.5s_ease-in-out_infinite]" style={{ height: '100%', animationDelay: '0.3s' }} />
                <span className="w-[2px] bg-primary-foreground rounded-full animate-[equalize_2s_ease-in-out_infinite]" style={{ height: '60%', animationDelay: '0.8s' }} />
                <span className="w-[2px] bg-primary-foreground rounded-full animate-[equalize_3s_ease-in-out_infinite]" style={{ height: '30%', animationDelay: '0.4s' }} />
              </span>
            </div>
            <div>
              <h2 className="text-base font-semibold">Ask FlowState</h2>
              <p className="text-xs text-muted-foreground">
                Your AI creative assistant
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {(messages.length > 0 || isLocallyCleared) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setClearDialogOpen(true)}
                className="h-8 w-8 text-muted-foreground hover:text-red-500"
                title="Clear chat history"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(true)}
              className="h-8 w-8"
            >
              <PanelRightClose className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 animate-[staggerFadeUp_0.3s_ease-out_forwards]" style={{ animationDelay: '0.3s', opacity: 0 }}>
        {/* Locally cleared empty state */}
        {isLocallyCleared && showEmptyState ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <EyeOff className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">
              Chat cleared locally
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Your messages are still saved. Restore to see them again.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRestoreChat}
              className="gap-2"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Restore Chat
            </Button>
          </div>
        ) : showEmptyState ? (
          /* Normal empty state */
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-sm font-medium text-foreground mb-2">
              Hey! I'm your creative assistant.
            </p>
            <p className="text-xs text-muted-foreground max-w-sm">
              Try: "What did we talk about last time?" or "Add an idea called
              Midnight Groove" or "What tasks are due this week?"
            </p>
            <p className="text-xs text-muted-foreground/60 mt-2">
              Tap the mic for voice mode
            </p>
            {suggestions.length > 0 && (
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => {
                      setInputValue(s.prompt);
                      inputRef.current?.focus();
                    }}
                    className="rounded-full border border-border/50 bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Message list */
          messages.map((message) => {
            const isUser = message.role === "user";
            const isEditing = editingMessageId === message.id;
            const isHovered = hoveredMessageId === message.id;
            const isConfirmingDelete = confirmDeleteId === message.id;
            const showActions = isUser && (isHovered || isConfirmingDelete) && !isEditing && !isLoading;

            return (
              <div
                key={message.id}
                className={cn(
                  "group relative flex gap-3",
                  isUser ? "justify-end" : "justify-start"
                )}
                onMouseEnter={() => setHoveredMessageId(message.id)}
                onMouseLeave={() => {
                  setHoveredMessageId(null);
                  setConfirmDeleteId(null);
                }}
              >
                {/* Assistant avatar */}
                {!isUser && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                  </div>
                )}

                <div className="relative max-w-[85%]">
                  {/* Per-message action buttons for user messages */}
                  {showActions && (
                    <div className="absolute -left-16 top-1 flex items-center gap-0.5 z-10">
                      <button
                        onClick={() => startEdit(message)}
                        className="rounded-md p-1 text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
                        title="Edit & Resend"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      {!isConfirmingDelete ? (
                        <button
                          onClick={() => setConfirmDeleteId(message.id)}
                          className="rounded-md p-1 text-muted-foreground/60 transition-colors hover:bg-red-500/10 hover:text-red-500"
                          title="Delete message"
                          disabled={!!deletingMessageId}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDeleteMessage(message.id)}
                          className="rounded-md px-1.5 py-0.5 text-[10px] font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
                          disabled={!!deletingMessageId}
                        >
                          Delete?
                        </button>
                      )}
                    </div>
                  )}

                  {/* Message bubble */}
                  {isEditing ? (
                    /* Inline edit mode */
                    <div className="rounded-lg border border-primary/50 bg-primary/5 p-2">
                      <textarea
                        ref={editInputRef}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        onKeyDown={handleEditKeyDown}
                        rows={Math.min(editContent.split("\n").length + 1, 6)}
                        className="w-full min-w-[200px] resize-none rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <div className="mt-1.5 flex justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={cancelEdit}
                          className="h-7 text-xs"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleResend}
                          disabled={!editContent.trim() || editContent.trim() === message.content || isLoading || !!sendingEditId}
                          className="h-7 text-xs gap-1"
                        >
                          {sendingEditId === message.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Send className="h-3 w-3" />
                          )}
                          Resend
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "rounded-lg px-3 py-2",
                        isUser
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                      {/* Actions performed */}
                      {message.actions && message.actions.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-border/50">
                          <div className="flex flex-wrap gap-1">
                            {message.actions.map((action, idx) => {
                              const eType = action.entityType || action.type?.replace(/^create_/, "") || "project";
                              const Icon = entityIcons[eType] || FolderKanban;
                              return (
                                <Badge
                                  key={idx}
                                  className="gap-1 text-xs border"
                                  style={{
                                    backgroundColor: "rgba(34, 197, 94, 0.12)",
                                    color: "rgb(34, 197, 94)",
                                    borderColor: "rgba(34, 197, 94, 0.25)",
                                    animation: `actionPing 0.5s ease-out ${idx * 0.1}s both`,
                                  }}
                                >
                                  <Plus className="h-3 w-3" />
                                  <Icon className="h-3 w-3" />
                                  {action.title}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Citations */}
                      {message.citations && message.citations.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-border/50">
                          <p className="text-xs font-medium mb-1.5 opacity-70">
                            Sources:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {message.citations.map((citation, idx) => {
                              const Icon =
                                entityIcons[citation.entityType] || FolderKanban;
                              return (
                                <Badge
                                  key={idx}
                                  variant="secondary"
                                  className="gap-1 text-xs cursor-pointer hover:bg-accent"
                                  onClick={() => {
                                    console.log("Navigate to:", citation);
                                  }}
                                >
                                  <Icon className="h-3 w-3" />
                                  {citation.title}
                                  <ExternalLink className="h-2.5 w-2.5 opacity-50" />
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* User avatar */}
                {isUser && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary">
                    <span className="text-xs font-semibold text-primary-foreground">
                      {session?.user.email?.charAt(0).toUpperCase() || "U"}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="bg-muted rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">
                  Thinking...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-border p-3 animate-[staggerFadeUp_0.3s_ease-out_forwards]" style={{ animationDelay: '0.4s', opacity: 0 }}>
        {/* Context-aware suggestion chips (during active conversation) */}
        {suggestions.length > 0 && messages.length > 0 && !isLoading && !isVapiActive && (
          <div className="flex gap-1.5 overflow-x-auto pb-2">
            {suggestions.map((s) => (
              <button
                key={s.label}
                onClick={() => {
                  setInputValue(s.prompt);
                  inputRef.current?.focus();
                }}
                className="shrink-0 rounded-full border border-border/40 px-2.5 py-1 text-[11px] text-muted-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        {/* Voice feedback */}
        {isVapiActive && (
          <div className="mb-2 flex items-center gap-2 text-sm text-primary">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
            </span>
            {vapiStatus === VapiStatus.CONNECTING ? "Connecting..." : "Voice Mode Active"}
            {vapiStatus === VapiStatus.ACTIVE && isSpeechActive && (
              <span className="text-muted-foreground italic text-xs ml-2"> (Speaking)</span>
            )}
          </div>
        )}

        <div className="flex items-end gap-2">
          <div className="relative flex-1">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isVapiActive
                  ? "Voice mode active..."
                  : "Ask about your projects, ideas, or tasks..."
              }
              rows={1}
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
              disabled={isLoading || isVapiActive}
            />
          </div>

          {/* Voice input button */}
          <Button
            variant={isVapiActive ? "default" : "outline"}
            size="icon"
            onClick={toggleListening}
            disabled={isLoading || vapiStatus === VapiStatus.LOADING}
            className={cn("h-9 w-9", isVapiActive && "bg-green-500 hover:bg-green-600")}
            title={isVapiActive ? "Stop Voice Mode" : "Start Voice Mode"}
          >
            {isVapiActive ? (
              <Mic className="h-4 w-4 animate-pulse" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>

          {/* Send button */}
          <Button
            onClick={sendMessage}
            disabled={!inputValue.trim() || isLoading}
            size="icon"
            className="h-9 w-9"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Clear Chat Dialog */}
      <ClearChatDialog
        open={clearDialogOpen}
        onOpenChange={setClearDialogOpen}
        onCleared={handleChatCleared}
      />
    </div>
  );
}
