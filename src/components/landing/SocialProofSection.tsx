import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Leo Rodriguez",
    role: "Producer & Beatmaker",
    initials: "LR",
    quote:
      "FlowState changed how I manage my sessions. I used to lose track of ideas across 10 different apps. Now everything lives in one place and I actually finish beats.",
    stars: 5,
  },
  {
    name: "Maya Sharma",
    role: "Mixing Engineer",
    initials: "MS",
    quote:
      "The collaborator profiles are a game-changer. I know exactly what each artist needs before they walk into my studio. My revision rounds dropped by 60%.",
    stars: 5,
  },
  {
    name: "Chloe Kim",
    role: "Singer-Songwriter",
    initials: "CK",
    quote:
      "I went from 12 unfinished songs to releasing my EP in 3 months. FlowState gave me the structure I needed without killing my creativity.",
    stars: 5,
  },
];

const metrics = [
  { value: "2,000+", label: "Creators" },
  { value: "50,000+", label: "Projects" },
  { value: "94%", label: "Retention" },
  { value: "4.9/5", label: "Rating" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1 },
  }),
};

export default function SocialProofSection() {
  return (
    <section className="bg-secondary/30 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Loved by Creators Worldwide
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Join thousands of musicians and producers who transformed their
            workflow.
          </p>
        </div>

        {/* Metrics */}
        <div className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-4">
          {metrics.map((m) => (
            <div key={m.label} className="text-center">
              <div className="text-3xl font-bold text-primary sm:text-4xl">
                {m.value}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {m.label}
              </div>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={fadeUp}
              className="rounded-xl border border-border/50 bg-card p-6 shadow-sm"
            >
              <div className="mb-3 flex gap-0.5">
                {Array.from({ length: t.stars }).map((_, s) => (
                  <Star
                    key={s}
                    className="h-4 w-4 fill-[var(--warning)] text-[var(--warning)]"
                  />
                ))}
              </div>
              <p className="leading-relaxed text-foreground">"{t.quote}"</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {t.initials}
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    {t.name}
                  </div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
