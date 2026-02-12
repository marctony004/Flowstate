import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Brain, Rocket } from "lucide-react";
import GradientText from "@/components/reactbits/GradientText";
import SessionTimeline from "./SessionTimeline";
import type { TimelineClip } from "./SessionTimeline";

// Timeline clip datasets that tell a visual story per step
const captureClips: TimelineClip[] = [
  { label: "Voice memo", track: 0, startPercent: 5, widthPercent: 30, color: "accent" },
  { label: "Lyric draft", track: 1, startPercent: 15, widthPercent: 35, color: "warning" },
  { label: "Beat sketch", track: 0, startPercent: 50, widthPercent: 28, color: "primary" },
];

const understandClips: TimelineClip[] = [
  { label: "Chorus hook", track: 0, startPercent: 3, widthPercent: 32, color: "accent" },
  { label: "Verse 1", track: 0, startPercent: 40, widthPercent: 28, color: "primary" },
  { label: "Feedback: louder", track: 1, startPercent: 20, widthPercent: 35, color: "spark" },
];

const forwardClips: TimelineClip[] = [
  { label: "Track complete", track: 0, startPercent: 2, widthPercent: 40, color: "success" },
  { label: "Master ready", track: 1, startPercent: 10, widthPercent: 35, color: "success" },
  { label: "Released", track: 0, startPercent: 55, widthPercent: 30, color: "premium" },
];

const steps = [
  {
    icon: Mic,
    title: "Capture",
    description:
      "Hum a hook, drop a voice memo, or jot down lyrics mid-session. FlowState grabs every take and reference without breaking your flow.",
    callout: "Voice memos + stems + references",
    color: "var(--accent)",
    colorClass: "text-[var(--accent)]",
    bg: "bg-[var(--accent)]/10",
    border: "border-[var(--accent)]/30",
    clips: captureClips,
    details: [
      "Auto-tag ideas by type — hook, verse, beat, reference",
      "Record voice memos directly in-app",
      "Drag & drop stems, bounces, and files",
    ],
  },
  {
    icon: Brain,
    title: "Understand",
    description:
      "Mix notes, revision requests, and vague feedback like 'make it warmer' — FlowState connects it all to the right session and section.",
    callout: "Mix notes + revisions + feedback",
    color: "var(--primary)",
    colorClass: "text-[var(--primary)]",
    bg: "bg-[var(--primary)]/10",
    border: "border-[var(--primary)]/30",
    clips: understandClips,
    details: [
      "AI links feedback to exact sections and takes",
      "Collaborator profiles show working preferences",
      "Semantic search across all sessions and notes",
    ],
  },
  {
    icon: Rocket,
    title: "Move Forward",
    description:
      "See exactly what's left before a bounce: unresolved revisions, missing stems, and final approvals — surfaced only when you're ready.",
    callout: "Milestones + bounce readiness",
    color: "var(--warning)",
    colorClass: "text-[var(--warning)]",
    bg: "bg-[var(--warning)]/10",
    border: "border-[var(--warning)]/30",
    clips: forwardClips,
    details: [
      "Milestone tracking with completion progress",
      "Automated 'bounce readiness' checklist",
      "Clear next steps surfaced from session context",
    ],
  },
];

export default function HowItWorksSection() {
  const [active, setActive] = useState(0);
  const step = steps[active];

  return (
    <section id="how-it-works" className="py-20 sm:py-28 blend-both">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            <GradientText colors={["#3F51B5", "#00BCD4", "#8BC34A", "#3F51B5"]} animationSpeed={6}>
              How FlowState Works
            </GradientText>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            From scattered takes to a finished bounce in three steps.
          </p>
        </div>

        {/* Tabs */}
        <div className="mt-12 flex justify-center">
          <div className="inline-flex rounded-xl border border-border/50 bg-card/50 p-1.5 backdrop-blur-sm">
            {steps.map((s, i) => (
              <button
                key={s.title}
                onClick={() => setActive(i)}
                className={`relative flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all ${
                  i === active
                    ? "text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {i === active && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-lg bg-background border border-border/50"
                    transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                  />
                )}
                <span className="relative flex items-center gap-2">
                  <s.icon className="h-4 w-4" style={i === active ? { color: s.color } : undefined} />
                  {s.title}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              className="grid items-center gap-10 lg:grid-cols-2"
            >
              {/* Left: Visual */}
              <div className={`card-elevated rounded-xl ${step.bg} p-4 sm:p-6`}>
                <div className="rounded-lg border border-border/30 bg-background/80 p-3 backdrop-blur-sm">
                  <SessionTimeline
                    clips={step.clips}
                    trackCount={2}
                    size="lg"
                    showRuler
                    showPlayhead
                    animateIn
                  />
                </div>
                <div className={`mt-4 inline-block rounded-full px-4 py-1.5 text-xs font-medium ${step.bg} ${step.colorClass}`}>
                  {step.callout}
                </div>
              </div>

              {/* Right: Text */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${step.bg}`}>
                    <step.icon className={`h-6 w-6 ${step.colorClass}`} />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">{step.title}</h3>
                </div>
                <p className="text-lg leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
                <ul className="mt-6 space-y-3">
                  {step.details.map((detail, i) => (
                    <motion.li
                      key={detail}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 + 0.2 }}
                      className="flex items-start gap-3"
                    >
                      <div
                        className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: step.color }}
                      />
                      <span className="text-sm text-foreground/80">{detail}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
