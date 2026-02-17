/**
 * WhyDrawer — 8A.7 Explainable Insights UI
 *
 * Reusable slide-out Sheet panel that displays structured evidence
 * behind any AI insight, with a "Flag as Incorrect" feedback mechanism.
 */

import { useState } from "react";
import {
  Zap,
  SmilePlus,
  HelpCircle,
  AlertTriangle,
  Flag,
  Check,
  X,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useSession } from "@/context/SessionContext";
import { logSession } from "@/lib/sessionLogger";
import { toast } from "sonner";

export interface WhyEvidence {
  insightType:
    | "project_state"
    | "sentiment"
    | "creative_block"
    | "collaboration_conflict";
  title: string;
  subtitle?: string;
  confidence: number;
  detectedAt: string;
  explanation: string;

  evidenceGroups: Array<{
    title: string;
    items: Array<{
      label: string;
      value: string;
      highlight?: boolean;
      quote?: string;
      sourceLabel?: string;
    }>;
  }>;

  entityType?: string;
  entityId?: string;
}

const insightConfig: Record<
  WhyEvidence["insightType"],
  { icon: typeof Zap; color: string; bg: string }
> = {
  project_state: {
    icon: Zap,
    color: "text-[var(--primary)]",
    bg: "bg-[color-mix(in_srgb,var(--primary)_15%,transparent)]",
  },
  sentiment: {
    icon: SmilePlus,
    color: "text-[var(--accent)]",
    bg: "bg-[color-mix(in_srgb,var(--accent)_15%,transparent)]",
  },
  creative_block: {
    icon: HelpCircle,
    color: "text-[var(--warning)]",
    bg: "bg-[color-mix(in_srgb,var(--warning)_15%,transparent)]",
  },
  collaboration_conflict: {
    icon: AlertTriangle,
    color: "text-[var(--warning)]",
    bg: "bg-[color-mix(in_srgb,var(--warning)_15%,transparent)]",
  },
};

interface WhyDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evidence: WhyEvidence | null;
}

export default function WhyDrawer({
  open,
  onOpenChange,
  evidence,
}: WhyDrawerProps) {
  const { session } = useSession();
  const [flagState, setFlagState] = useState<
    "idle" | "confirming" | "flagged"
  >("idle");

  if (!evidence) return null;

  const config = insightConfig[evidence.insightType];
  const Icon = config.icon;

  async function handleFlag() {
    if (!session?.user.id || !evidence) return;

    setFlagState("flagged");

    logSession({
      userId: session.user.id,
      eventType: "insight_flagged",
      content: `Flagged ${evidence.insightType} insight as incorrect: "${evidence.title}"`,
      entityType: evidence.entityType,
      entityId: evidence.entityId,
      metadata: {
        insightType: evidence.insightType,
        title: evidence.title,
        subtitle: evidence.subtitle,
        confidence: evidence.confidence,
        explanation: evidence.explanation,
        evidenceGroups: evidence.evidenceGroups,
      },
    });

    toast.success("Feedback recorded — thanks!");
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) setFlagState("idle");
        onOpenChange(nextOpen);
      }}
    >
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-2.5">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${config.bg}`}
            >
              <Icon className={`h-5 w-5 ${config.color}`} />
            </div>
            <div className="min-w-0">
              <SheetTitle className="text-base">{evidence.title}</SheetTitle>
              <SheetDescription className="flex items-center gap-1.5">
                {evidence.subtitle && (
                  <>
                    <span className="truncate">{evidence.subtitle}</span>
                    <span>·</span>
                  </>
                )}
                <span>{Math.round(evidence.confidence * 100)}% confidence</span>
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Explanation */}
        <div className="px-4">
          <p className="text-sm text-foreground leading-relaxed">
            {evidence.explanation}
          </p>
        </div>

        {/* Evidence Groups */}
        <div className="space-y-4 px-4 pb-4">
          {evidence.evidenceGroups.map((group, gi) => (
            <div key={gi} className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group.title}
              </h4>
              <ul className="space-y-2">
                {group.items.map((item, ii) => (
                  <li
                    key={ii}
                    className="rounded-md border border-border bg-muted/30 p-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`text-xs ${
                          item.highlight
                            ? "font-semibold text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {item.label}
                      </span>
                      <span
                        className={`text-xs text-right ${
                          item.highlight
                            ? "font-semibold text-foreground"
                            : "text-foreground"
                        }`}
                      >
                        {item.value}
                      </span>
                    </div>
                    {item.quote && (
                      <p className="mt-1.5 border-l-2 border-border pl-2 text-[11px] italic text-muted-foreground">
                        "{item.quote}"
                      </p>
                    )}
                    {item.sourceLabel && (
                      <p className="mt-1 text-[10px] text-muted-foreground/60">
                        Source: {item.sourceLabel}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <SheetFooter className="border-t border-border">
          {/* Flag button */}
          {flagState === "idle" && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-red-500"
              onClick={() => setFlagState("confirming")}
            >
              <Flag className="h-3.5 w-3.5" />
              Flag as Incorrect
            </Button>
          )}
          {flagState === "confirming" && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Are you sure?</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-xs text-red-500 hover:bg-red-500/10"
                onClick={handleFlag}
              >
                <Check className="h-3 w-3" />
                Confirm
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
                onClick={() => setFlagState("idle")}
              >
                <X className="h-3 w-3" />
                Cancel
              </Button>
            </div>
          )}
          {flagState === "flagged" && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-xs text-muted-foreground"
              disabled
            >
              <Flag className="h-3.5 w-3.5" />
              Flagged
            </Button>
          )}

          {/* Timestamp */}
          <p className="text-[10px] text-muted-foreground/50">
            Detected: {new Date(evidence.detectedAt).toLocaleString()}
          </p>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
