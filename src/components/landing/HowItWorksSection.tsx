import { motion } from "framer-motion";
import { Mic, Brain, Rocket } from "lucide-react";
import GradientText from "@/components/reactbits/GradientText";

const steps = [
  {
    number: "01",
    icon: Mic,
    title: "Capture",
    description:
      "Talk it out or type it in. FlowState captures voice notes, lyric drafts, and messy thoughts without forcing structure.",
    callout: "Auto-transcription + idea tagging",
    color: "text-[var(--accent)]",
    bg: "bg-[var(--accent)]/10",
    border: "border-[var(--accent)]/30",
  },
  {
    number: "02",
    icon: Brain,
    title: "Understand",
    description:
      "FlowState translates creative language into project context—what's decided, what's unresolved, and what keeps repeating.",
    callout: "Semantic organization + collaboration clarity",
    color: "text-[var(--success)]",
    bg: "bg-[var(--success)]/10",
    border: "border-[var(--success)]/30",
  },
  {
    number: "03",
    icon: Rocket,
    title: "Move Forward",
    description:
      "When it's time to execute, FlowState automatically surfaces clear next steps—tasks, due dates, and milestones—without breaking creative flow.",
    callout: "Adaptive task visibility + explainable insights",
    color: "text-[var(--warning)]",
    bg: "bg-[var(--warning)]/10",
    border: "border-[var(--warning)]/30",
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
            From chaotic ideas to shipped projects in three simple steps.
          </p>
        </div>

        {/* Desktop: Horizontal Timeline */}
        <div className="mt-16 hidden lg:block">
          <div className="relative">
            {/* Connecting line */}
            <div className="absolute left-0 right-0 top-16 h-0.5 bg-gradient-to-r from-[var(--accent)] via-[var(--success)] to-[var(--warning)]" />

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
                  {/* Step number circle */}
                  <div className={`relative z-10 mx-auto flex h-32 w-32 items-center justify-center rounded-full border-2 ${step.border} ${step.bg}`}>
                    <step.icon className={`h-12 w-12 ${step.color}`} />
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
                <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-background`}>
                  <step.icon className={`h-7 w-7 ${step.color}`} />
                </div>
                <div>
                  <span className={`text-xs font-bold ${step.color}`}>{step.number}</span>
                  <h3 className="mt-1 text-lg font-semibold text-foreground">
                    {step.title}
                  </h3>
                </div>
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
