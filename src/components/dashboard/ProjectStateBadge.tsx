/**
 * ProjectStateBadge — 8A.4 Semantic Project State Detection
 *
 * Displays the AI-detected project state with color-coded badge,
 * "Why this state?" tooltip, and optional manual override.
 */

import { useState } from "react";
import {
  Zap,
  Pause,
  Rocket,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Info,
  ChevronDown,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import supabase from "@/supabase";
import { useSession } from "@/context/SessionContext";
import type { Json } from "@/types/database";
import WhyDrawer, { type WhyEvidence } from "./WhyDrawer";

type ProjectState =
  | "evolving"
  | "stuck"
  | "ready-to-ship"
  | "on-hold"
  | "conceptually-complete";

interface AiStateData {
  state: ProjectState;
  confidence: number;
  explanation: string;
  signals?: string[];
  detectedAt: string;
  overriddenBy?: string;
}

interface ProjectStateBadgeProps {
  projectId: string;
  projectTitle?: string;
  aiState: AiStateData | null;
  onStateUpdated?: () => void;
  compact?: boolean;
}

const stateConfig: Record<
  ProjectState,
  { label: string; icon: typeof Zap; color: string; bg: string }
> = {
  evolving: {
    label: "Evolving",
    icon: Zap,
    color: "text-[var(--success)]",
    bg: "bg-[var(--success)]/10",
  },
  stuck: {
    label: "Stuck",
    icon: AlertTriangle,
    color: "text-[var(--warning)]",
    bg: "bg-[var(--warning)]/10",
  },
  "ready-to-ship": {
    label: "Ready to Ship",
    icon: Rocket,
    color: "text-[var(--accent)]",
    bg: "bg-[var(--accent)]/10",
  },
  "on-hold": {
    label: "On Hold",
    icon: Pause,
    color: "text-muted-foreground",
    bg: "bg-muted/50",
  },
  "conceptually-complete": {
    label: "Complete",
    icon: CheckCircle2,
    color: "text-primary",
    bg: "bg-primary/10",
  },
};

function buildProjectStateEvidence(
  aiState: AiStateData,
  projectTitle?: string
): WhyEvidence {
  const config = stateConfig[aiState.state] ?? stateConfig.evolving;

  const signalItems = (aiState.signals ?? []).map((signal) => ({
    label: signal,
    value: "",
    highlight: true,
  }));

  const detectionItems: WhyEvidence["evidenceGroups"][number]["items"] = [
    {
      label: "Confidence",
      value: `${Math.round(aiState.confidence * 100)}%`,
    },
    {
      label: "Detected at",
      value: new Date(aiState.detectedAt).toLocaleString(),
    },
  ];
  if (aiState.overriddenBy) {
    detectionItems.push({
      label: "Override status",
      value: "Manually overridden",
      highlight: true,
    });
  }

  return {
    insightType: "project_state",
    title: `Why ${config.label}?`,
    subtitle: projectTitle,
    confidence: aiState.confidence,
    detectedAt: aiState.detectedAt,
    explanation: aiState.explanation,
    evidenceGroups: [
      ...(signalItems.length > 0
        ? [{ title: "Key Signals", items: signalItems }]
        : []),
      { title: "Detection Info", items: detectionItems },
    ],
    entityType: "project",
  };
}

export default function ProjectStateBadge({
  projectId,
  projectTitle,
  aiState,
  onStateUpdated,
  compact = false,
}: ProjectStateBadgeProps) {
  const { session } = useSession();
  const [detecting, setDetecting] = useState(false);
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);

  async function detectState() {
    if (!session?.user.id || detecting) return;
    setDetecting(true);
    try {
      const { error } = await supabase.functions.invoke("detect-project-state", {
        body: { projectId, userId: session.user.id },
      });
      if (error) throw error;
      onStateUpdated?.();
    } catch (err) {
      console.error("Failed to detect project state:", err);
    } finally {
      setDetecting(false);
    }
  }

  async function overrideState(newState: ProjectState) {
    if (!session?.user.id) return;
    const overrideData: AiStateData = {
      state: newState,
      confidence: 1.0,
      explanation: "Manually set by user.",
      signals: [],
      detectedAt: new Date().toISOString(),
      overriddenBy: session.user.id,
    };
    await supabase
      .from("projects")
      .update({ ai_state: overrideData as unknown as Json })
      .eq("id", projectId);
    setOverrideOpen(false);
    onStateUpdated?.();
  }

  // No state detected yet — show detect button
  if (!aiState) {
    return (
      <button
        onClick={detectState}
        disabled={detecting}
        className="flex items-center gap-1.5 rounded-full border border-dashed border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
      >
        {detecting ? (
          <RefreshCw className="h-3 w-3 animate-spin" />
        ) : (
          <Zap className="h-3 w-3" />
        )}
        {detecting ? "Analyzing..." : "Detect State"}
      </button>
    );
  }

  const config = stateConfig[aiState.state] ?? stateConfig.evolving;
  const Icon = config.icon;

  const whyEvidence = aiState
    ? (() => { const e = buildProjectStateEvidence(aiState, projectTitle); e.entityId = projectId; return e; })()
    : null;

  if (compact) {
    return (
      <>
        <Popover>
          <PopoverTrigger asChild>
            <button
              className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${config.color} ${config.bg} transition-opacity hover:opacity-80`}
            >
              <Icon className="h-3 w-3" />
              {config.label}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" side="bottom" align="start">
            <StateDetails
              aiState={aiState}
              config={config}
              detecting={detecting}
              onDetect={detectState}
              overrideOpen={overrideOpen}
              setOverrideOpen={setOverrideOpen}
              onOverride={overrideState}
              onWhyClick={() => setWhyOpen(true)}
            />
          </PopoverContent>
        </Popover>
        <WhyDrawer open={whyOpen} onOpenChange={setWhyOpen} evidence={whyEvidence} />
      </>
    );
  }

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <button
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${config.color} ${config.bg} transition-opacity hover:opacity-80`}
          >
            <Icon className="h-3.5 w-3.5" />
            {config.label}
            <Info className="h-3 w-3 opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-4" side="bottom" align="start">
          <StateDetails
            aiState={aiState}
            config={config}
            detecting={detecting}
            onDetect={detectState}
            overrideOpen={overrideOpen}
            setOverrideOpen={setOverrideOpen}
            onOverride={overrideState}
            onWhyClick={() => setWhyOpen(true)}
          />
        </PopoverContent>
      </Popover>
      <WhyDrawer open={whyOpen} onOpenChange={setWhyOpen} evidence={whyEvidence} />
    </>
  );
}

function StateDetails({
  aiState,
  config,
  detecting,
  onDetect,
  overrideOpen,
  setOverrideOpen,
  onOverride,
  onWhyClick,
}: {
  aiState: AiStateData;
  config: (typeof stateConfig)[ProjectState];
  detecting: boolean;
  onDetect: () => void;
  overrideOpen: boolean;
  setOverrideOpen: (open: boolean) => void;
  onOverride: (state: ProjectState) => void;
  onWhyClick: () => void;
}) {
  const Icon = config.icon;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${config.color}`} />
        <span className={`text-sm font-semibold ${config.color}`}>
          {config.label}
        </span>
        <span className="ml-auto text-[10px] text-muted-foreground">
          {Math.round(aiState.confidence * 100)}% confidence
        </span>
      </div>

      <p className="text-xs text-foreground leading-relaxed">
        {aiState.explanation}
      </p>

      {aiState.signals && aiState.signals.length > 0 && (
        <ul className="space-y-1">
          {aiState.signals.map((signal, i) => (
            <li
              key={i}
              className="flex items-start gap-1.5 text-[11px] text-muted-foreground"
            >
              <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
              {signal}
            </li>
          ))}
        </ul>
      )}

      {aiState.overriddenBy && (
        <p className="text-[10px] text-muted-foreground/70 italic">
          Manually overridden
        </p>
      )}

      <div className="flex items-center gap-2 border-t border-border pt-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 px-2 text-xs"
          onClick={onDetect}
          disabled={detecting}
        >
          <RefreshCw className={`h-3 w-3 ${detecting ? "animate-spin" : ""}`} />
          {detecting ? "Analyzing..." : "Re-analyze"}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 px-2 text-xs text-[var(--accent)]"
          onClick={onWhyClick}
        >
          Why?
        </Button>

        <div className="relative ml-auto">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
            onClick={() => setOverrideOpen(!overrideOpen)}
          >
            Override
            <ChevronDown className="h-3 w-3" />
          </Button>
          {overrideOpen && (
            <div className="absolute right-0 top-full z-10 mt-1 w-44 rounded-lg border border-border bg-popover p-1 shadow-md">
              {(
                Object.keys(stateConfig) as ProjectState[]
              ).map((state) => {
                const sc = stateConfig[state];
                const StateIcon = sc.icon;
                return (
                  <button
                    key={state}
                    onClick={() => onOverride(state)}
                    className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs hover:bg-accent ${
                      aiState.state === state
                        ? "bg-accent font-medium"
                        : ""
                    }`}
                  >
                    <StateIcon className={`h-3.5 w-3.5 ${sc.color}`} />
                    {sc.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground/50">
        Last analyzed: {new Date(aiState.detectedAt).toLocaleString()}
      </p>
    </div>
  );
}
