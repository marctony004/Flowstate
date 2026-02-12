import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, MessageSquare, CheckCircle, Play, Square, Circle, StickyNote, Download } from "lucide-react";
import BlurText from "@/components/reactbits/BlurText";
import SessionTimeline from "./SessionTimeline";
import type { TimelineClip } from "./SessionTimeline";

const heroClips: TimelineClip[] = [
  { label: "Hook idea", track: 0, startPercent: 2, widthPercent: 18, color: "accent" },
  { label: "Verse sketch", track: 0, startPercent: 24, widthPercent: 22, color: "primary" },
  { label: "Vocal take 3", track: 1, startPercent: 5, widthPercent: 20, color: "warning" },
  { label: "Client note: punchier", track: 1, startPercent: 30, widthPercent: 26, color: "spark" },
  { label: "Beat loop A", track: 2, startPercent: 0, widthPercent: 28, color: "success" },
  { label: "Bridge idea", track: 2, startPercent: 32, widthPercent: 18, color: "accent" },
  { label: "Mix ref", track: 0, startPercent: 52, widthPercent: 16, color: "premium" },
  { label: "Chorus draft", track: 1, startPercent: 60, widthPercent: 24, color: "primary" },
  { label: "FX chain", track: 2, startPercent: 55, widthPercent: 20, color: "warning" },
];

const evidence = [
  { icon: Lightbulb, text: "Voice memo auto-tagged as 'hook idea'" },
  { icon: MessageSquare, text: "Mix notes linked to chorus section" },
  { icon: CheckCircle, text: "3 next steps pulled from session notes" },
];

const stats = [
  { value: "2,000+", label: "producers & artists" },
  { value: "50k+", label: "sessions tracked" },
  { value: "3x", label: "faster to final bounce" },
];

export default function HeroSection() {
  return (
    <section className="relative min-h-screen overflow-hidden pt-28 pb-20 sm:pt-36 sm:pb-28 lg:pt-44 lg:pb-36 studio-grain blend-bottom">
      {/* Background gradient blobs */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
        <div className="absolute -top-1/4 -right-1/4 h-[600px] w-[600px] rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute -bottom-1/4 -left-1/4 h-[500px] w-[500px] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-warning/5 blur-3xl" />
      </div>

      {/* Subtle waveform background pattern */}
      <div className="absolute inset-0 z-0 waveform-bg" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left column — text content */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge
              variant="secondary"
              className="mb-6 inline-flex text-xs font-medium"
            >
              Used by independent musicians & producers
            </Badge>

            <BlurText
              text="Capture Ideas. Organize Feedback. Finish Tracks."
              className="text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem] xl:text-5xl"
              delay={100}
              animateBy="words"
              direction="bottom"
            />

            <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
              Voice memos, mix notes, half-finished stems — FlowState organizes your sessions and surfaces what to do next, so you bounce tracks instead of excuses.
            </p>

            {/* Micro-proof stats */}
            <div className="mt-8 flex gap-8">
              {stats.map((s) => (
                <div key={s.label}>
                  <div className="text-2xl font-bold text-foreground">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>

            {/* CTA buttons */}
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button size="lg" asChild className="w-full sm:w-auto">
                <Link to="/auth/sign-up">Start Free Trial</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() =>
                  document
                    .getElementById("product-showcase")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Watch Demo
              </Button>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              Free &middot; No credit card required &middot; 14-day trial
            </p>
          </motion.div>

          {/* Right column — DAW session visual */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            {/* Fake app window chrome */}
            <div className="rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm shadow-xl overflow-hidden">
              {/* Title bar */}
              <div className="flex items-center gap-2 border-b border-border/40 px-4 py-2.5">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-spark/60" />
                  <div className="h-3 w-3 rounded-full bg-warning/60" />
                  <div className="h-3 w-3 rounded-full bg-success/60" />
                </div>
                <span className="ml-2 text-xs font-medium text-muted-foreground">
                  Summer EP — Session 4
                </span>
                <div className="ml-auto flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    <StickyNote className="h-2.5 w-2.5" /> Notes
                  </span>
                  <span className="inline-flex items-center gap-1 rounded bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    <Download className="h-2.5 w-2.5" /> Exports
                  </span>
                </div>
              </div>
              {/* Session info + transport bar */}
              <div className="flex items-center justify-between border-b border-border/30 px-4 py-1.5 bg-muted/20">
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span className="font-mono">128 BPM</span>
                  <span className="font-mono">Key: Am</span>
                  <span className="font-mono">02:14</span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-spark animate-pulse" />
                    <span className="text-spark font-medium">REC</span>
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground/60 hover:text-muted-foreground" aria-label="Stop" tabIndex={-1}>
                    <Square className="h-2.5 w-2.5" />
                  </button>
                  <button className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground/60 hover:text-muted-foreground" aria-label="Play" tabIndex={-1}>
                    <Play className="h-2.5 w-2.5" />
                  </button>
                  <button className="flex h-5 w-5 items-center justify-center rounded text-spark/50 hover:text-spark" aria-label="Record" tabIndex={-1}>
                    <Circle className="h-2.5 w-2.5" />
                  </button>
                </div>
              </div>

              {/* Timeline */}
              <div className="p-3">
                <SessionTimeline
                  clips={heroClips}
                  trackCount={3}
                  size="lg"
                  showRuler
                  showPlayhead
                  animateIn
                />
              </div>
            </div>

            {/* Floating evidence drawer */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="absolute -bottom-6 -left-4 sm:-left-8 w-64 rounded-lg border border-border/50 bg-card/90 backdrop-blur-md p-3 shadow-lg"
            >
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Why FlowState?
              </div>
              <div className="space-y-2">
                {evidence.map((e) => (
                  <div key={e.text} className="flex items-start gap-2">
                    <e.icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                    <span className="text-[11px] leading-snug text-foreground/80">
                      {e.text}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
