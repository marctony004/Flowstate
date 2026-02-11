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
 */

import { useState, useCallback, useRef, useEffect } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/context/SessionContext";
import { useVapiAssistant, VapiStatus } from "@/hooks/useVapiAssistant";
import supabase from "@/supabase";
import { cn } from "@/lib/utils";
import type { Json } from "@/types/database";

interface Citation {
  entityType: string;
  entityId: string;
  title: string;
  excerpt: string;
  similarity: number;
}

interface ActionPerformed {
  type: string;
  entityType: string;
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
}

const entityIcons: Record<string, typeof Lightbulb> = {
  idea: Lightbulb,
  task: CheckSquare,
  project: FolderKanban,
};

export default function AskFlowState({ open, onOpenChange }: AskFlowStateProps) {
  const { session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Vapi Assistant
  const {
    status: vapiStatus,
    isSpeechActive,
    toggleCall,
  } = useVapiAssistant(session?.user.id || "");

  const isVapiActive = vapiStatus === VapiStatus.ACTIVE || vapiStatus === VapiStatus.CONNECTING;


  // Load chat history from database on first open
  useEffect(() => {
    if (!open || historyLoaded || !session?.user.id) return;

    async function loadHistory() {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("user_id", session!.user.id)
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
  }, [open, historyLoaded, session?.user.id]);

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

  // Save a message to the database (fire-and-forget)
  const persistMessage = useCallback(
    async (msg: Message) => {
      if (!session?.user.id) return;
      try {
        await supabase.from("chat_messages").insert({
          id: msg.id,
          user_id: session.user.id,
          role: msg.role,
          content: msg.content,
          citations: msg.citations ? (msg.citations as unknown as Json) : null,
        });
      } catch {
        // Silent fail — don't block chat
      }
    },
    [session?.user.id]
  );

  // Handle sending a message
  const sendMessage = useCallback(async () => {
    if (!inputValue.trim() || !session?.user.id || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
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
          userId: session.user.id,
          conversationHistory,
        },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.answer,
        citations: data.citations,
        actions: data.actions,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Persist assistant message
      persistMessage(assistantMessage);

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
  }, [
    inputValue,
    session?.user.id,
    isLoading,
    messages,
    persistMessage,
  ]);

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

  // Clear chat history
  const clearHistory = async () => {
    if (!session?.user.id) return;
    setMessages([]);
    try {
      await supabase.from("chat_messages").delete().eq("user_id", session.user.id);
    } catch {
      // Silent fail
    }
  };

  // Close panel
  const handleClose = () => {
    setInputValue("");
    setIsCollapsed(false);
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
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={clearHistory}
                className="h-8 w-8 text-muted-foreground hover:text-red-500"
                title="Clear chat history"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            {/* Voice output toggle removed as Vapi handles it */}
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
        {messages.length === 0 ? (
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
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.role === "assistant" && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[85%] rounded-lg px-3 py-2",
                  message.role === "user"
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
                        const Icon =
                          entityIcons[action.entityType] || FolderKanban;
                        return (
                          <Badge
                            key={idx}
                            className="gap-1 text-xs bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/20"
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
                              // TODO: Navigate to entity
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
              {message.role === "user" && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary">
                  <span className="text-xs font-semibold text-primary-foreground">
                    {session?.user.email?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
              )}
            </div>
          ))
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

        {/* Speaking indicator removed / replaced by Vapi status */}
      </div>
    </div>
  );
}
