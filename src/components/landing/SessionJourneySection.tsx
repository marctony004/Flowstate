import { motion } from "framer-motion";

const milestones = [
  { label: "Idea", color: "var(--accent)" },
  { label: "Draft", color: "var(--primary)" },
  { label: "Feedback", color: "var(--warning)" },
  { label: "Mix", color: "var(--spark)" },
  { label: "Master", color: "var(--premium)" },
  { label: "Released", color: "var(--success)" },
];

/** Tiny decorative waveform inside each clip block */
function MiniWave({ color }: { color: string }) {
  return (
    <svg
      className="absolute inset-0 h-full w-full opacity-[0.10]"
      preserveAspectRatio="none"
      viewBox="0 0 80 20"
      aria-hidden
    >
      {Array.from({ length: 20 }).map((_, i) => {
        const h = 3 + Math.sin(i * 1.1) * 5 + Math.cos(i * 2.3) * 3;
        return (
          <rect
            key={i}
            x={i * 4}
            y={10 - h / 2}
            width={2}
            height={h}
            rx={0.5}
            fill={color}
          />
        );
      })}
    </svg>
  );
}

export default function SessionJourneySection() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28 section-deep">
      {/* Background matching hero */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
      <div className="absolute -top-1/4 -right-1/4 h-[500px] w-[500px] rounded-full bg-accent/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-1/4 -left-1/4 h-[400px] w-[400px] rounded-full bg-primary/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Section title */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground mb-3">
            Session Journey
          </p>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            From first take to final release
          </h2>
        </motion.div>

        {/* Timeline strip */}
        <div className="relative">
          {/* Connecting line */}
          <div className="absolute left-0 right-0 top-1/2 h-px bg-gradient-to-r from-transparent via-border to-transparent -translate-y-1/2" />

          {/* Milestone blocks */}
          <div className="relative grid grid-cols-3 gap-3 sm:grid-cols-6 sm:gap-4">
            {milestones.map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, scaleX: 0 }}
                whileInView={{ opacity: 1, scaleX: 1 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{
                  duration: 0.5,
                  delay: i * 0.1,
                  ease: [0.22, 1, 0.36, 1],
                }}
                style={{ transformOrigin: "left center" }}
              >
                {/* Clip block */}
                <div
                  className="relative h-14 sm:h-16 rounded-lg border border-border/50 overflow-hidden cursor-default transition-transform duration-200 hover:scale-[1.03]"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${m.color} 20%, transparent)`,
                  }}
                >
                  <MiniWave color={m.color} />

                  {/* Dot connector */}
                  <div
                    className="absolute top-1/2 -left-1.5 h-2.5 w-2.5 rounded-full border-2 border-background -translate-y-1/2 hidden sm:block"
                    style={{ backgroundColor: m.color }}
                  />
                </div>

                {/* Label */}
                <p
                  className="mt-2.5 text-center text-[11px] sm:text-xs font-medium tracking-wide"
                  style={{ color: m.color }}
                >
                  {m.label}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Subtle animated playhead */}
          <motion.div
            className="absolute top-0 bottom-0 w-px rounded-full hidden sm:block"
            style={{
              background: `linear-gradient(to bottom, transparent, var(--success), transparent)`,
              opacity: 0.3,
            }}
            initial={{ left: "0%" }}
            whileInView={{ left: "100%" }}
            viewport={{ once: true }}
            transition={{ duration: 3, delay: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>
    </section>
  );
}
