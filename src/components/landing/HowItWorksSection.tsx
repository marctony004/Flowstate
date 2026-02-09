import { motion } from "framer-motion";
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
    number: "01",
    icon: Mic,
    title: "Capture",
    description:
      "Hum a hook, drop a voice memo, or jot down lyrics mid-session. FlowState grabs every take and reference without breaking your flow.",
    callout: "Voice memos + stems + references",
    color: "text-[var(--accent)]",
    bg: "bg-[var(--accent)]/10",
    border: "border-[var(--accent)]/30",
    clips: captureClips,
  },
  {
    number: "02",
    icon: Brain,
    title: "Understand",
    description:
      "Mix notes, revision requests, and vague feedback like 'make it warmer' — FlowState connects it all to the right session and section.",
    callout: "Mix notes + revisions + feedback",
    color: "text-[var(--primary)]",
    bg: "bg-[var(--primary)]/10",
    border: "border-[var(--primary)]/30",
    clips: understandClips,
  },
  {
    number: "03",
    icon: Rocket,
    title: "Move Forward",
    description:
      "See exactly what's left before a bounce: unresolved revisions, missing stems, and final approvals — surfaced only when you're ready.",
    callout: "Milestones + bounce readiness",
    color: "text-[var(--warning)]",
    bg: "bg-[var(--warning)]/10",
    border: "border-[var(--warning)]/30",
    clips: forwardClips,
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.15 },
  }),
};

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 sm:py-28">
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

        {/* Desktop: Horizontal Timeline */}
        <div className="mt-16 hidden lg:block">
          <div className="relative">
            {/* Connecting line */}
            <div className="absolute left-0 right-0 top-[68px] h-0.5 bg-gradient-to-r from-[var(--accent)] via-[var(--primary)] to-[var(--warning)]" />

            <div className="grid grid-cols-3 gap-8">
              {steps.map((step, i) => (
                <motion.div
                  key={step.title}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-50px" }}
                  variants={fadeUp}
                  className="relative"
                >
                  {/* Timeline strip replacing the circle indicator */}
                  <div className={`relative z-10 mx-auto w-full max-w-[280px] overflow-hidden rounded-lg border ${step.border} ${step.bg} p-2`}>
                    <SessionTimeline
                      clips={step.clips}
                      trackCount={2}
                      size="sm"
                      showRuler={false}
                      showPlayhead={false}
                      animateIn
                    />
                  </div>

                  {/* Content */}
                  <div className="mt-8 text-center">
                    <span className={`text-sm font-bold ${step.color}`}>{step.number}</span>
                    <h3 className="mt-2 text-xl font-semibold text-foreground">
                      {step.title}
                    </h3>
                    <p className="mt-3 leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                    <div className={`mt-4 inline-block rounded-full px-4 py-1.5 text-xs font-medium ${step.bg} ${step.color}`}>
                      {step.callout}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile: Stacked Cards */}
        <div className="mt-12 space-y-6 lg:hidden">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={fadeUp}
              className={`rounded-xl border ${step.border} ${step.bg} p-6`}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-background">
                  <step.icon className={`h-7 w-7 ${step.color}`} />
                </div>
                <div>
                  <span className={`text-xs font-bold ${step.color}`}>{step.number}</span>
                  <h3 className="mt-1 text-lg font-semibold text-foreground">
                    {step.title}
                  </h3>
                </div>
              </div>
              {/* Small timeline strip inside mobile card */}
              <div className="mt-4 rounded-md border border-border/20 bg-background/50 p-1.5">
                <SessionTimeline
                  clips={step.clips}
                  trackCount={2}
                  size="sm"
                  showRuler={false}
                  showPlayhead={false}
                  animateIn
                />
              </div>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                {step.description}
              </p>
              <div className={`mt-4 inline-block rounded-full bg-background px-3 py-1 text-xs font-medium ${step.color}`}>
                {step.callout}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
