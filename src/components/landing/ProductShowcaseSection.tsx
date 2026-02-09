import { motion } from "framer-motion";
import { Mic, Layers, Sparkles, Users, Play, Square, Circle, StickyNote, Download, ArrowRight, Lightbulb } from "lucide-react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import SessionTimeline from "./SessionTimeline";
import type { TimelineClip, TimelineMarker } from "./SessionTimeline";

const showcaseClips: TimelineClip[] = [
  { label: "Intro pad", track: 0, startPercent: 0, widthPercent: 14, color: "accent" },
  { label: "Verse 1", track: 0, startPercent: 16, widthPercent: 18, color: "primary" },
  { label: "Chorus", track: 0, startPercent: 36, widthPercent: 20, color: "accent" },
  { label: "Bridge", track: 0, startPercent: 58, widthPercent: 14, color: "premium" },
  { label: "Outro", track: 0, startPercent: 74, widthPercent: 16, color: "primary" },
  { label: "Lead vocal", track: 1, startPercent: 14, widthPercent: 24, color: "warning" },
  { label: "Harmony", track: 1, startPercent: 40, widthPercent: 16, color: "warning" },
  { label: "Ad-libs", track: 1, startPercent: 60, widthPercent: 22, color: "spark" },
  { label: "Drum pattern", track: 2, startPercent: 0, widthPercent: 30, color: "success" },
  { label: "Bass line", track: 2, startPercent: 32, widthPercent: 26, color: "success" },
  { label: "FX hits", track: 2, startPercent: 62, widthPercent: 18, color: "accent" },
];

const showcaseMarkers: TimelineMarker[] = [
  { positionPercent: 16, label: "V1" },
  { positionPercent: 36, label: "CHR" },
  { positionPercent: 58, label: "BRG" },
];

const feedbackItems = [
  {
    initials: "JT",
    name: "Jake Torres",
    time: "2h ago",
    comment: "Make the chorus punchier",
    action: "Boost 2-4kHz on vocal bus + tighten drum transients",
    evidence: [
      "Referenced 'punchy' in 3 previous sessions",
      "Chorus vocal sits 2dB below the reference mix",
      "Drum attack is 12ms slower than the reference",
    ],
  },
  {
    initials: "MS",
    name: "Maya Sharma",
    time: "5h ago",
    comment: "The bridge feels empty",
    action: "Layer a pad under the bridge + widen the reverb tail",
    evidence: [
      "Bridge has 40% fewer active stems than adjacent sections",
      "Similar arrangement in Session 2 used a synth pad fill",
    ],
  },
  {
    initials: "CK",
    name: "Chloe Kim",
    time: "1d ago",
    comment: "Vocal needs more warmth on verse 1",
    action: "Add 1.5dB shelf at 200Hz on lead vocal, verse 1 region only",
    evidence: [
      "'Warmth' correlated with low-mid presence in past notes",
      "Reference track has +2dB in 150-300Hz range on vocals",
    ],
  },
];

const highlights = [
  {
    icon: Mic,
    text: "Drop voice memos, stems, or references mid-session",
  },
  {
    icon: Layers,
    text: "See every take, revision, and mix note in one timeline",
  },
  {
    icon: Sparkles,
    text: "AI that speaks your language — hooks, verses, bounces, not tickets",
  },
];

export default function ProductShowcaseSection() {
  return (
    <section id="product-showcase" className="py-20 sm:py-28 studio-surface">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            See FlowState in Action
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            From rough takes to final bounce — see how a full session comes
            together inside FlowState.
          </p>
        </div>

        {/* Session view + feedback panel */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto mt-12 max-w-6xl"
        >
          <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
            {/* Timeline panel */}
            <div className="overflow-hidden rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm shadow-lg">
              {/* App chrome bar */}
              <div className="flex items-center justify-between border-b border-border/40 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-spark/60" />
                    <div className="h-3 w-3 rounded-full bg-warning/60" />
                    <div className="h-3 w-3 rounded-full bg-success/60" />
                  </div>
                  <span className="ml-2 text-xs font-medium text-muted-foreground">
                    Midnight Sessions — Final Mix
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1 rounded bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    <StickyNote className="h-2.5 w-2.5" /> Notes
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1 rounded bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    <Download className="h-2.5 w-2.5" /> Exports
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  <span className="text-[11px]">3 collaborators</span>
                </div>
              </div>
              {/* Session info + transport bar */}
              <div className="flex items-center justify-between border-b border-border/30 px-4 py-1.5 bg-muted/20">
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span className="font-mono">140 BPM</span>
                  <span className="font-mono">Key: F#m</span>
                  <span className="font-mono">03:42</span>
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
              <div className="p-4">
                <SessionTimeline
                  clips={showcaseClips}
                  markers={showcaseMarkers}
                  trackCount={3}
                  size="md"
                  showRuler
                  showPlayhead
                  animateIn
                />
              </div>
            </div>

            {/* Feedback → Action panel */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="overflow-hidden rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm shadow-lg"
            >
              <div className="border-b border-border/40 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-accent" />
                  <span className="text-xs font-semibold text-foreground">
                    Feedback → Action
                  </span>
                  <Badge variant="secondary" className="ml-auto text-[9px] px-1.5 py-0">
                    AI
                  </Badge>
                </div>
              </div>

              <div className="px-3 py-2">
                <Accordion type="multiple" className="w-full">
                  {feedbackItems.map((item, i) => (
                    <AccordionItem key={i} value={`item-${i}`} className="border-b-border/20">
                      {/* Comment */}
                      <div className="pt-3 pb-1">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[9px] font-semibold text-primary">
                            {item.initials}
                          </div>
                          <span className="text-[11px] font-medium text-foreground">{item.name}</span>
                          <span className="text-[10px] text-muted-foreground">{item.time}</span>
                        </div>
                        <p className="mt-1.5 ml-8 text-xs text-foreground/80">
                          "{item.comment}"
                        </p>
                      </div>

                      {/* AI action */}
                      <div className="ml-8 mt-1.5 flex items-start gap-1.5 rounded-md bg-accent/5 border border-accent/10 px-2.5 py-2">
                        <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-accent" />
                        <span className="text-[11px] leading-snug text-foreground/90">
                          {item.action}
                        </span>
                      </div>

                      {/* Why? collapsible */}
                      <AccordionTrigger className="ml-8 py-1.5 text-[10px] text-accent hover:no-underline">
                        Why?
                      </AccordionTrigger>
                      <AccordionContent className="ml-8 pb-2">
                        <div className="space-y-1">
                          {item.evidence.map((e, j) => (
                            <div key={j} className="flex items-start gap-1.5">
                              <Lightbulb className="mt-0.5 h-2.5 w-2.5 shrink-0 text-muted-foreground" />
                              <span className="text-[10px] leading-snug text-muted-foreground">
                                {e}
                              </span>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Feature highlights */}
        <div className="mx-auto mt-12 grid max-w-3xl gap-6 sm:grid-cols-3">
          {highlights.map((h) => (
            <div key={h.text} className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <h.icon className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {h.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
