import { useState, useEffect, useRef } from "react";
import {
  HelpCircle,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Target,
  Zap,
  Eye,
  Plus,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/context/SessionContext";
import supabase from "@/supabase";
import { logSession } from "@/lib/sessionLogger";
import { toast } from "sonner";
import WhyDrawer, { type WhyEvidence } from "./WhyDrawer";

interface Suggestion {
  id: string;
  type: "question" | "reframe" | "constraint" | "micro-task" | "perspective";
  content: string;
  reasoning: string;
  relatedEntityName?: string;
  actionable?: {
    taskTitle: string;
    taskDescription: string;
  };
}

interface BlockAnalysis {
  blockerType: "creative" | "technical" | "motivational" | "scope" | "unknown";
  stuckDuration: string;
  stalledAreas: string[];
}

interface StuckInterventionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectTitle: string;
  onTaskCreated?: () => void;
}

const SUGGESTION_CONFIG: Record<
  Suggestion["type"],
  { icon: typeof HelpCircle; color: string; bg: string }
> = {
  question: {
    icon: HelpCircle,
    color: "text-[var(--accent)]",
    bg: "bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]",
  },
  reframe: {
    icon: RefreshCw,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  constraint: {
    icon: Target,
    color: "text-[var(--warning)]",
    bg: "bg-[color-mix(in_srgb,var(--warning)_10%,transparent)]",
  },
  "micro-task": {
    icon: Zap,
    color: "text-[var(--success)]",
    bg: "bg-[color-mix(in_srgb,var(--success)_10%,transparent)]",
  },
  perspective: {
    icon: Eye,
    color: "text-[var(--primary)]",
    bg: "bg-[color-mix(in_srgb,var(--primary)_10%,transparent)]",
  },
};

const BLOCKER_LABELS: Record<BlockAnalysis["blockerType"], string> = {
  creative: "Creative Block",
  technical: "Technical Blocker",
  motivational: "Motivation Dip",
  scope: "Scope Paralysis",
  unknown: "General Block",
};

const LOADING_MESSAGES = [
  "Looking at your tasks...",
  "Checking recent activity...",
  "Finding creative approaches...",
  "Crafting personalized suggestions...",
];

function buildBlockAnalysisEvidence(
  analysis: BlockAnalysis,
  projectTitle: string,
  projectId: string
): WhyEvidence {
  const stalledItems = (analysis.stalledAreas ?? []).map((area) => ({
    label: area,
    value: "",
    highlight: true,
  }));

  return {
    insightType: "creative_block",
    title: `Why ${BLOCKER_LABELS[analysis.blockerType]}?`,
    subtitle: projectTitle,
    confidence: 0.8,
    detectedAt: new Date().toISOString(),
    explanation: `This project was classified as experiencing a ${BLOCKER_LABELS[analysis.blockerType].toLowerCase()} based on task activity, recent progress, and project context.`,
    evidenceGroups: [
      {
        title: "Block Type",
        items: [
          {
            label: "Classification",
            value: BLOCKER_LABELS[analysis.blockerType],
            highlight: true,
          },
        ],
      },
      ...(analysis.stuckDuration
        ? [
            {
              title: "Duration",
              items: [{ label: "Stuck for", value: analysis.stuckDuration }],
            },
          ]
        : []),
      ...(stalledItems.length > 0
        ? [{ title: "Stalled Areas", items: stalledItems }]
        : []),
    ],
    entityType: "project",
    entityId: projectId,
  };
}

type Step = "context" | "loading" | "results";

export default function StuckInterventionDialog({
  open,
  onOpenChange,
  projectId,
  projectTitle,
  onTaskCreated,
}: StuckInterventionDialogProps) {
  const { session } = useSession();
  const [step, setStep] = useState<Step>("context");
  const [userContext, setUserContext] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [analysis, setAnalysis] = useState<BlockAnalysis | null>(null);
  const [interventionLogId, setInterventionLogId] = useState<string | null>(
    null
  );
  const [feedback, setFeedback] = useState<Record<string, boolean | null>>({});
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [creatingTaskId, setCreatingTaskId] = useState<string | null>(null);
  const [whyOpen, setWhyOpen] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset when dialog opens/closes
  useEffect(() => {
    if (!open) {
      // Small delay to avoid flash on close
      const timer = setTimeout(() => {
        setStep("context");
        setUserContext("");
        setSuggestions([]);
        setAnalysis(null);
        setInterventionLogId(null);
        setFeedback({});
        setLoadingMsgIndex(0);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Rotate loading messages
  useEffect(() => {
    if (step === "loading") {
      intervalRef.current = setInterval(() => {
        setLoadingMsgIndex((i) => (i + 1) % LOADING_MESSAGES.length);
      }, 2000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [step]);

  async function fetchSuggestions() {
    if (!session?.user.id) return;
    setStep("loading");
    setLoadingMsgIndex(0);

    try {
      const { data, error } = await supabase.functions.invoke(
        "creative-block-help",
        {
          body: {
            projectId,
            userId: session.user.id,
            userContext: userContext.trim() || undefined,
          },
        }
      );

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setSuggestions(data.suggestions ?? []);
      setAnalysis(data.analysis ?? null);
      setInterventionLogId(data.interventionLogId ?? null);
      setStep("results");
    } catch (err) {
      console.error("Failed to get creative block help:", err);
      toast.error("Failed to analyze project. Please try again.");
      setStep("context");
    }
  }

  async function handleFeedback(suggestion: Suggestion, helpful: boolean) {
    if (!session?.user.id) return;

    setFeedback((prev) => ({ ...prev, [suggestion.id]: helpful }));

    logSession({
      userId: session.user.id,
      eventType: "creative_block_feedback",
      content: `${helpful ? "Helpful" : "Not helpful"}: ${suggestion.type} suggestion for "${projectTitle}"`,
      projectId,
      entityType: "project",
      entityId: projectId,
      metadata: {
        interventionLogId,
        suggestionId: suggestion.id,
        suggestionType: suggestion.type,
        helpful,
        suggestionContent: suggestion.content,
      },
    });
  }

  async function handleCreateTask(suggestion: Suggestion) {
    if (!suggestion.actionable || !session?.user.id) return;
    setCreatingTaskId(suggestion.id);

    try {
      const { error } = await supabase.from("tasks").insert({
        project_id: projectId,
        created_by: session.user.id,
        title: suggestion.actionable.taskTitle,
        description: suggestion.actionable.taskDescription,
        status: "todo",
        priority: "medium",
      });

      if (error) throw error;
      toast.success("Task created!");
      onTaskCreated?.();
    } catch (err) {
      console.error("Failed to create task:", err);
      toast.error("Failed to create task");
    } finally {
      setCreatingTaskId(null);
    }
  }

  function handleDone() {
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        {/* Step 1: Context */}
        {step === "context" && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--warning)_15%,transparent)]">
                  <HelpCircle className="h-5 w-5 text-[var(--warning)]" />
                </div>
                <div>
                  <DialogTitle>What's got you stuck?</DialogTitle>
                  <DialogDescription>
                    We'll analyze <span className="font-medium text-foreground">{projectTitle}</span> and suggest ways to get moving.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <Textarea
                placeholder="e.g., Can't get the vocals right, lost motivation, too many ideas..."
                value={userContext}
                onChange={(e) => setUserContext(e.target.value)}
                className="min-h-[80px] resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Optional — helps us give more targeted suggestions.
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={fetchSuggestions}>
                Skip — Analyze Project
              </Button>
              <Button onClick={fetchSuggestions}>
                <Sparkles className="mr-1.5 h-4 w-4" />
                Get Unstuck
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Step 2: Loading */}
        {step === "loading" && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="relative mb-6">
              <div className="h-12 w-12 animate-spin rounded-full border-2 border-[var(--warning)] border-t-transparent" />
              <Sparkles className="absolute top-1/2 left-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 text-[var(--warning)]" />
            </div>
            <p className="text-sm font-medium text-foreground transition-all">
              {LOADING_MESSAGES[loadingMsgIndex]}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Analyzing {projectTitle}...
            </p>
          </div>
        )}

        {/* Step 3: Results */}
        {step === "results" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[var(--warning)]" />
                Here's what might help
              </DialogTitle>
            </DialogHeader>

            {/* Analysis header */}
            {analysis && (
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/30 p-3">
                <Badge variant="outline" className="text-xs">
                  {BLOCKER_LABELS[analysis.blockerType]}
                </Badge>
                {analysis.stuckDuration && (
                  <span className="text-xs text-muted-foreground">
                    {analysis.stuckDuration}
                  </span>
                )}
                {analysis.stalledAreas?.map((area) => (
                  <Badge key={area} variant="secondary" className="text-xs">
                    {area}
                  </Badge>
                ))}
                <button
                  onClick={() => setWhyOpen(true)}
                  className="ml-auto text-xs font-medium text-[var(--accent)] hover:underline"
                >
                  Why?
                </button>
              </div>
            )}

            {analysis && (
              <WhyDrawer
                open={whyOpen}
                onOpenChange={setWhyOpen}
                evidence={buildBlockAnalysisEvidence(analysis, projectTitle, projectId)}
              />
            )}

            {/* Suggestion cards */}
            <div className="space-y-3">
              {suggestions.map((suggestion) => {
                const config = SUGGESTION_CONFIG[suggestion.type];
                const Icon = config.icon;
                const feedbackValue = feedback[suggestion.id];

                return (
                  <div
                    key={suggestion.id}
                    className="rounded-lg border border-border p-4 space-y-2"
                  >
                    {/* Type badge + content */}
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${config.bg}`}
                      >
                        <Icon className={`h-3.5 w-3.5 ${config.color}`} />
                      </div>
                      <div className="flex-1 space-y-1">
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${config.color}`}
                        >
                          {suggestion.type}
                        </Badge>
                        <p className="text-sm text-foreground">
                          {suggestion.content}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {suggestion.reasoning}
                        </p>
                        {suggestion.relatedEntityName && (
                          <Badge variant="secondary" className="text-[10px]">
                            {suggestion.relatedEntityName}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pl-10">
                      <button
                        onClick={() => handleFeedback(suggestion, true)}
                        className={`rounded-md p-1.5 transition-colors ${
                          feedbackValue === true
                            ? "bg-[color-mix(in_srgb,var(--success)_15%,transparent)] text-[var(--success)]"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        }`}
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleFeedback(suggestion, false)}
                        className={`rounded-md p-1.5 transition-colors ${
                          feedbackValue === false
                            ? "bg-red-500/10 text-red-500"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        }`}
                      >
                        <ThumbsDown className="h-3.5 w-3.5" />
                      </button>
                      {suggestion.actionable && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="ml-auto h-7 text-xs"
                          disabled={creatingTaskId === suggestion.id}
                          onClick={() => handleCreateTask(suggestion)}
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          Create Task
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <DialogFooter>
              <Button onClick={handleDone}>Done</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
