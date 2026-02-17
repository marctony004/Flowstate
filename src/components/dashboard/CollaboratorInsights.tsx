/**
 * CollaboratorInsights — 8A.5 Surface Disagreements & Conflicts
 *
 * Analyzes sentiment data across all collaborators to detect:
 * - Friction points (negative/mixed sentiment collaborators)
 * - Contradictory themes (same topic, different sentiments)
 * - Overall network health
 */

import { useState } from "react";
import { AlertTriangle, TrendingUp, ShieldAlert, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { CollaboratorNote } from "@/types/database";
import type { Json } from "@/types/database";
import WhyDrawer, { type WhyEvidence } from "./WhyDrawer";

interface SentimentData {
  sentiment: "positive" | "neutral" | "negative" | "mixed";
  confidence: number;
  tone: string;
  keyThemes: string[];
  suggestions: string[];
}

interface Conflict {
  type: "friction" | "contradiction" | "trend";
  severity: "low" | "medium" | "high";
  message: string;
  collaborators: string[];
}

interface CollaboratorInsightsProps {
  collaborators: CollaboratorNote[];
}

function extractSentiment(sa: Json | null): SentimentData | null {
  if (!sa || typeof sa !== "object") return null;
  const obj = sa as Record<string, unknown>;
  if (!obj.sentiment) return null;
  return obj as unknown as SentimentData;
}

function detectConflicts(collaborators: CollaboratorNote[]): Conflict[] {
  const analyzed = collaborators
    .map((c) => ({
      name: c.collaborator_id,
      data: extractSentiment(c.sentiment_analysis),
    }))
    .filter((c) => c.data !== null) as {
    name: string;
    data: SentimentData;
  }[];

  if (analyzed.length < 2) return [];

  const conflicts: Conflict[] = [];

  // 1. Friction points — collaborators with negative or mixed sentiment
  const negative = analyzed.filter(
    (c) => c.data.sentiment === "negative" || c.data.sentiment === "mixed"
  );
  if (negative.length > 0 && negative.length < analyzed.length) {
    const positiveCount = analyzed.filter(
      (c) => c.data.sentiment === "positive"
    ).length;
    if (positiveCount > 0) {
      conflicts.push({
        type: "friction",
        severity: negative.length > 1 ? "high" : "medium",
        message: `${negative.map((c) => c.name).join(" and ")} ${
          negative.length === 1 ? "has" : "have"
        } ${
          negative.length === 1
            ? negative[0].data.sentiment
            : "negative/mixed"
        } sentiment while ${positiveCount} ${
          positiveCount === 1
            ? "collaborator is"
            : "collaborators are"
        } positive — possible tension in your network.`,
        collaborators: negative.map((c) => c.name),
      });
    }
  }

  // 2. Contradictory themes — same theme, different sentiments
  const themeMap = new Map<
    string,
    { sentiment: string; collaborator: string }[]
  >();
  for (const c of analyzed) {
    for (const theme of c.data.keyThemes) {
      const normalized = theme.toLowerCase().trim();
      if (!themeMap.has(normalized)) themeMap.set(normalized, []);
      themeMap.get(normalized)!.push({
        sentiment: c.data.sentiment,
        collaborator: c.name,
      });
    }
  }

  for (const [theme, entries] of themeMap) {
    if (entries.length < 2) continue;
    const sentiments = new Set(entries.map((e) => e.sentiment));
    const hasPositive =
      sentiments.has("positive") || sentiments.has("neutral");
    const hasNegative = sentiments.has("negative") || sentiments.has("mixed");
    if (hasPositive && hasNegative) {
      const names = [...new Set(entries.map((e) => e.collaborator))];
      conflicts.push({
        type: "contradiction",
        severity: "medium",
        message: `"${theme}" appears with conflicting sentiment across ${names.join(
          " and "
        )} — consider aligning expectations.`,
        collaborators: names,
      });
    }
  }

  // 3. Negative trend — majority of collaborators have concerning sentiment
  if (negative.length > analyzed.length / 2) {
    conflicts.push({
      type: "trend",
      severity: "high",
      message: `${negative.length} of ${analyzed.length} analyzed collaborators show negative or mixed sentiment — your creative network may need attention.`,
      collaborators: negative.map((c) => c.name),
    });
  }

  return conflicts;
}

const severityConfig = {
  low: {
    border: "border-[var(--accent)]/30",
    bg: "bg-[color-mix(in_srgb,var(--accent)_5%,transparent)]",
    text: "text-[var(--accent)]",
  },
  medium: {
    border: "border-[var(--warning)]/30",
    bg: "bg-[color-mix(in_srgb,var(--warning)_5%,transparent)]",
    text: "text-[var(--warning)]",
  },
  high: {
    border: "border-red-500/30",
    bg: "bg-red-500/5",
    text: "text-red-500",
  },
};

const typeIcons = {
  friction: ShieldAlert,
  contradiction: AlertTriangle,
  trend: TrendingUp,
};

const conflictTypeLabels: Record<Conflict["type"], string> = {
  friction: "Friction Point",
  contradiction: "Contradictory Themes",
  trend: "Negative Trend",
};

function buildConflictEvidence(
  conflict: Conflict,
  collaborators: CollaboratorNote[]
): WhyEvidence {
  const involvedItems = conflict.collaborators.map((name) => {
    const collab = collaborators.find((c) => c.collaborator_id === name);
    const sentiment = collab ? extractSentiment(collab.sentiment_analysis) : null;
    return {
      label: name,
      value: sentiment ? `${sentiment.sentiment} (${Math.round(sentiment.confidence * 100)}%)` : "Not analyzed",
      highlight: sentiment?.sentiment === "negative" || sentiment?.sentiment === "mixed",
    };
  });

  return {
    insightType: "collaboration_conflict",
    title: `Why ${conflictTypeLabels[conflict.type]}?`,
    confidence: 0.75,
    detectedAt: new Date().toISOString(),
    explanation: conflict.message,
    evidenceGroups: [
      { title: "Involved Collaborators", items: involvedItems },
      {
        title: "Conflict Details",
        items: [
          { label: "Type", value: conflictTypeLabels[conflict.type] },
          { label: "Severity", value: conflict.severity, highlight: conflict.severity === "high" },
        ],
      },
    ],
  };
}

export default function CollaboratorInsights({
  collaborators,
}: CollaboratorInsightsProps) {
  const [whyOpen, setWhyOpen] = useState(false);
  const [whyEvidence, setWhyEvidence] = useState<WhyEvidence | null>(null);

  const analyzed = collaborators.filter((c) => {
    const sa = extractSentiment(c.sentiment_analysis);
    return sa !== null;
  });

  if (analyzed.length < 2) return null;

  const conflicts = detectConflicts(collaborators);
  if (conflicts.length === 0) return null;

  // Compute network health
  const sentiments = analyzed.map(
    (c) => extractSentiment(c.sentiment_analysis)!.sentiment
  );
  const positiveCount = sentiments.filter((s) => s === "positive").length;
  const healthPercent = Math.round((positiveCount / sentiments.length) * 100);

  function openWhy(conflict: Conflict) {
    setWhyEvidence(buildConflictEvidence(conflict, collaborators));
    setWhyOpen(true);
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--warning)_15%,transparent)]">
            <AlertTriangle className="h-4 w-4 text-[var(--warning)]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Network Insights
            </h3>
            <p className="text-xs text-muted-foreground">
              Conflicts and patterns across {analyzed.length} analyzed
              collaborators
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {healthPercent}% positive
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {conflicts.map((conflict, i) => {
          const config = severityConfig[conflict.severity];
          const Icon = typeIcons[conflict.type];
          return (
            <div
              key={i}
              className={`rounded-lg border p-3 ${config.border} ${config.bg}`}
            >
              <div className="flex items-start gap-2">
                <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${config.text}`} />
                <div className="flex-1 space-y-1.5">
                  <p className="text-xs text-foreground leading-relaxed">
                    {conflict.message}
                  </p>
                  <div className="flex flex-wrap items-center gap-1">
                    {conflict.collaborators.map((name) => (
                      <Badge
                        key={name}
                        variant="secondary"
                        className="text-[10px]"
                      >
                        {name}
                      </Badge>
                    ))}
                    <Badge variant="outline" className={`text-[10px] ${config.text}`}>
                      {conflict.type}
                    </Badge>
                    <button
                      onClick={() => openWhy(conflict)}
                      className="ml-auto text-[10px] font-medium text-[var(--accent)] hover:underline"
                    >
                      Why?
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <WhyDrawer open={whyOpen} onOpenChange={setWhyOpen} evidence={whyEvidence} />
    </div>
  );
}
