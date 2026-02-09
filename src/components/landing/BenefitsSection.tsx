import { motion } from "framer-motion";
import { Mic, Users, Rocket } from "lucide-react";
import GlareHover from "@/components/reactbits/GlareHover";
import GradientText from "@/components/reactbits/GradientText";

const benefits = [
  {
    icon: Mic,
    title: "Capture Ideas Without Losing Them",
    description:
      "Hum a melody, record a rough take, or drop a reference track. FlowState tags and organizes every idea by session and section, so nothing gets buried in your voice memos.",
    color: "text-[var(--accent)]",
    bg: "bg-[var(--accent)]/10",
  },
  {
    icon: Users,
    title: "Understand Your Collaborators Instantly",
    description:
      "Mix notes from your engineer, revision requests from the label, feedback from collaborators — it all flows into one place, linked to the right session and section.",
    color: "text-[var(--primary)]",
    bg: "bg-[var(--primary)]/10",
  },
  {
    icon: Rocket,
    title: "Finish Projects That Matter",
    description:
      "Stop abandoning half-finished tracks. FlowState shows you what's left — unresolved revisions, missing stems, pending approvals — so you bounce your best work on time.",
    color: "text-[var(--warning)]",
    bg: "bg-[var(--warning)]/10",
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

export default function BenefitsSection() {
  return (
    <section id="features" className="py-20 sm:py-28 studio-grain relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            <GradientText colors={["#3F51B5", "#00BCD4", "#3F51B5"]} animationSpeed={5}>
              Everything You Need to Stay in Flow
            </GradientText>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Three ways FlowState keeps your sessions moving forward.
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((b, i) => (
            <motion.div
              key={b.title}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={fadeUp}
            >
              <GlareHover
                width="100%"
                height="100%"
                background="transparent"
                borderRadius="1rem"
                borderColor="hsl(var(--border) / 0.5)"
                glareColor="#3F51B5"
                glareOpacity={0.15}
                className="!shadow-sm transition-shadow hover:!shadow-md"
                style={{ border: "1px solid hsl(var(--border) / 0.5)" }}
              >
                <div className="p-8">
                  <div
                    className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl ${b.bg}`}
                  >
                    <b.icon className={`h-6 w-6 ${b.color}`} />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">
                    {b.title}
                  </h3>
                  <p className="mt-3 leading-relaxed text-muted-foreground">
                    {b.description}
                  </p>
                </div>
              </GlareHover>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
