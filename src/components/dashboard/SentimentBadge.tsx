/**
 * SentimentBadge — 8A.5 Sentiment Analysis on Collaborator Feedback
 *
 * Displays AI-analyzed sentiment with color-coded badge and popover details.
 * Mirrors ProjectStateBadge architecture.
 */

import { useState } from "react";
import {
  SmilePlus,
  Minus,
  Frown,
  ArrowUpDown,
  RefreshCw,
  Sparkles,
  Info,
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

type Sentiment = "positive" | "neutral" | "negative" | "mixed";

interface SentimentData {
  sentiment: Sentiment;
  confidence: number;
  tone: string;
  keyThemes: string[];
  suggestions: string[];
  analyzedAt: string;
}

interface SentimentBadgeProps {
  collaboratorNoteId: string;
  collaboratorName?: string;
  sentimentAnalysis: Json | null;
  sentimentStatus: string;
  onAnalyzed?: () => void;
}

const sentimentConfig: Record<
  Sentiment,
  { label: string; icon: typeof SmilePlus; color: string; bg: string }
> = {
  positive: {
    label: "Positive",
    icon: SmilePlus,
    color: "text-[var(--success)]",
    bg: "bg-[var(--success)]/10",
  },
  neutral: {
    label: "Neutral",
    icon: Minus,
    color: "text-muted-foreground",
    bg: "bg-muted/50",
  },
  negative: {
    label: "Negative",
    icon: Frown,
    color: "text-[var(--warning)]",
    bg: "bg-[var(--warning)]/10",
  },
  mixed: {
    label: "Mixed",
    icon: ArrowUpDown,
    color: "text-[var(--accent)]",
    bg: "bg-[var(--accent)]/10",
  },
};

function buildSentimentEvidence(
  data: SentimentData,
  collaboratorName?: string,
  collaboratorNoteId?: string
): WhyEvidence {
  const config = sentimentConfig[data.sentiment] ?? sentimentConfig.neutral;

  const toneItems: WhyEvidence["evidenceGroups"][number]["items"] = [
    { label: "Overall tone", value: data.tone, highlight: true },
    { label: "Confidence", value: `${Math.round(data.confidence * 100)}%` },
  ];

  const themeItems = (data.keyThemes ?? []).map((theme) => ({
    label: theme,
    value: "",
  }));

  const suggestionItems = (data.suggestions ?? []).map((suggestion) => ({
    label: suggestion,
    value: "",
  }));

  return {
    insightType: "sentiment",
    title: `Why ${config.label}?`,
    subtitle: collaboratorName,
    confidence: data.confidence,
    detectedAt: data.analyzedAt,
    explanation: `The tone of your notes about this collaborator was analyzed as ${data.tone.toLowerCase()}.`,
    evidenceGroups: [
      { title: "Tone Analysis", items: toneItems },
      ...(themeItems.length > 0
        ? [{ title: "Key Themes", items: themeItems }]
        : []),
      ...(suggestionItems.length > 0
        ? [{ title: "Suggestions", items: suggestionItems }]
        : []),
    ],
    entityType: "collaborator_note",
    entityId: collaboratorNoteId,
  };
}

export default function SentimentBadge({
  collaboratorNoteId,
  collaboratorName,
  sentimentAnalysis,
  sentimentStatus,
  onAnalyzed,
}: SentimentBadgeProps) {
  const { session } = useSession();
  const [analyzing, setAnalyzing] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);

  const data = sentimentAnalysis as unknown as SentimentData | null;
  const isAnalyzing = analyzing || sentimentStatus === "analyzing";

  async function analyze() {
    if (!session?.user.id || analyzing) return;
    setAnalyzing(true);
    try {
      const { error } = await supabase.functions.invoke("analyze-sentiment", {
        body: { collaboratorNoteId, userId: session.user.id },
      });
      if (error) throw error;
      onAnalyzed?.();
    } catch (err) {
      console.error("Failed to analyze sentiment:", err);
    } finally {
      setAnalyzing(false);
    }
  }

  // No analysis yet — show analyze button
  if (!data || sentimentStatus === "pending" || sentimentStatus === "failed") {
    return (
      <button
        onClick={analyze}
        disabled={isAnalyzing}
        className="flex items-center gap-1.5 rounded-full border border-dashed border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
      >
        {isAnalyzing ? (
          <RefreshCw className="h-3 w-3 animate-spin" />
        ) : (
          <Sparkles className="h-3 w-3" />
        )}
        {isAnalyzing ? "Analyzing..." : "Analyze"}
      </button>
    );
  }

  const config = sentimentConfig[data.sentiment] ?? sentimentConfig.neutral;
  const Icon = config.icon;

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
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center gap-2">
              <Icon className={`h-4 w-4 ${config.color}`} />
              <span className={`text-sm font-semibold ${config.color}`}>
                {config.label}
              </span>
              <span className="ml-auto text-[10px] text-muted-foreground">
                {Math.round(data.confidence * 100)}% confidence
              </span>
            </div>

            {/* Tone */}
            <p className="text-xs text-foreground leading-relaxed">
              <span className="font-medium">Tone:</span> {data.tone}
            </p>

            {/* Key Themes */}
            {data.keyThemes && data.keyThemes.length > 0 && (
              <div>
                <p className="mb-1 text-[11px] font-medium text-foreground">
                  Key Themes
                </p>
                <ul className="space-y-1">
                  {data.keyThemes.map((theme, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-1.5 text-[11px] text-muted-foreground"
                    >
                      <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
                      {theme}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggestions */}
            {data.suggestions && data.suggestions.length > 0 && (
              <div>
                <p className="mb-1 text-[11px] font-medium text-foreground">
                  Suggestions
                </p>
                <ul className="space-y-1">
                  {data.suggestions.map((suggestion, i) => (
                    <li
                      key={i}
                      className="text-[11px] text-muted-foreground italic"
                    >
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 border-t border-border pt-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
                onClick={analyze}
                disabled={isAnalyzing}
              >
                <RefreshCw className={`h-3 w-3 ${isAnalyzing ? "animate-spin" : ""}`} />
                {isAnalyzing ? "Analyzing..." : "Re-analyze"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-xs text-[var(--accent)]"
                onClick={() => setWhyOpen(true)}
              >
                Why?
              </Button>
            </div>

            {/* Timestamp */}
            <p className="text-[10px] text-muted-foreground/50">
              Last analyzed: {new Date(data.analyzedAt).toLocaleString()}
            </p>
          </div>
        </PopoverContent>
      </Popover>
      <WhyDrawer
        open={whyOpen}
        onOpenChange={setWhyOpen}
        evidence={buildSentimentEvidence(data, collaboratorName, collaboratorNoteId)}
      />
    </>
  );
}
