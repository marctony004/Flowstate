import { motion } from "framer-motion";
import { Play, Zap, BarChart3, Shield } from "lucide-react";

const highlights = [
  {
    icon: Zap,
    text: "Capture ideas in seconds with voice, text, or file upload",
  },
  {
    icon: BarChart3,
    text: "Visual project dashboards that show real progress",
  },
  {
    icon: Shield,
    text: "Your data stays private — encrypted and secure",
  },
];

export default function ProductShowcaseSection() {
  return (
    <section id="how-it-works" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            See FlowState in Action
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Watch how creators use FlowState to go from scattered ideas to
            finished projects.
          </p>
        </div>

        {/* Video placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          id="product-showcase"
          className="mx-auto mt-12 max-w-4xl"
        >
          <div className="relative aspect-video overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-primary/5 via-card to-accent/5 shadow-lg">
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                className="flex h-16 w-16 items-center justify-center rounded-full bg-primary shadow-lg transition-transform hover:scale-110"
                aria-label="Play demo video"
              >
                <Play className="h-7 w-7 fill-primary-foreground text-primary-foreground" />
              </button>
            </div>
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
