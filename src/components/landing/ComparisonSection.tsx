import { motion } from "framer-motion";
import { X, Check } from "lucide-react";
import GradientText from "@/components/reactbits/GradientText";

const rows = [
  {
    label: "Idea capture",
    without: "Scattered across Notes, Voice Memos, and 12 chat threads",
    with: "One place — voice, text, files — auto-tagged by session",
  },
  {
    label: "Revision feedback",
    without: "'Make it warmer' with zero context or section reference",
    with: "Every note linked to the exact section and take",
  },
  {
    label: "Project status",
    without: "No idea what's done, what's pending, or who's blocking",
    with: "Real-time progress with milestones and task tracking",
  },
  {
    label: "Finding past decisions",
    without: "Scroll through months of texts: 'What did we decide?'",
    with: "Ask FlowState AI — instant recall with citations",
  },
  {
    label: "Collaboration",
    without: "Email chains, WeTransfer links, version confusion",
    with: "Shared workspace with roles, permissions, and activity feed",
  },
  {
    label: "Finishing tracks",
    without: "50+ unfinished projects collecting dust",
    with: "Clear next steps surfaced automatically — bounce-ready",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.08 },
  }),
};

export default function ComparisonSection() {
  return (
    <section className="py-20 sm:py-28 blend-both">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            <GradientText colors={["#3F51B5", "#00BCD4", "#3F51B5"]} animationSpeed={5}>
              Before & After FlowState
            </GradientText>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            See how your workflow transforms.
          </p>
        </motion.div>

        {/* Table */}
        <div className="mt-14">
        <div className="grid grid-cols-[1fr_1fr_1fr] gap-4 text-sm font-semibold sm:gap-6">
          <div className="text-muted-foreground" />
          <div className="rounded-t-lg border border-b-0 border-red-500/20 bg-red-500/5 px-4 py-3 text-center text-red-400">
            Without FlowState
          </div>
          <div className="rounded-t-lg border border-b-0 border-[var(--success)]/20 bg-[var(--success)]/5 px-4 py-3 text-center text-[var(--success)]">
            With FlowState
          </div>
        </div>

        {/* Rows */}
        <div className="grid grid-cols-[1fr_1fr_1fr] gap-4 sm:gap-6">
          {rows.map((row, i) => (
            <motion.div
              key={row.label}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-30px" }}
              variants={fadeUp}
              className="col-span-3 grid grid-cols-subgrid"
            >
              {/* Label */}
              <div className="flex items-center border-b border-border/30 py-4 pr-2">
                <span className="text-sm font-medium text-foreground">{row.label}</span>
              </div>

              {/* Without */}
              <div className="flex items-start gap-2.5 border border-t-0 border-red-500/10 bg-red-500/[0.03] px-4 py-4">
                <X className="mt-0.5 h-4 w-4 shrink-0 text-red-400/70" />
                <span className="text-sm leading-relaxed text-muted-foreground">{row.without}</span>
              </div>

              {/* With */}
              <div className="flex items-start gap-2.5 border border-t-0 border-[var(--success)]/10 bg-[var(--success)]/[0.03] px-4 py-4">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--success)]" />
                <span className="text-sm leading-relaxed text-foreground/80">{row.with}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom rounded corners */}
        <div className="grid grid-cols-[1fr_1fr_1fr] gap-4 sm:gap-6">
          <div />
          <div className="h-3 rounded-b-lg border border-t-0 border-red-500/20 bg-red-500/5" />
          <div className="h-3 rounded-b-lg border border-t-0 border-[var(--success)]/20 bg-[var(--success)]/5" />
        </div>
        </div>
      </div>
    </section>
  );
}
