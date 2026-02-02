import { motion } from "framer-motion";
import { Star } from "lucide-react";
import CountUp from "@/components/reactbits/CountUp";
import SpotlightCard from "@/components/reactbits/SpotlightCard";
import GradientText from "@/components/reactbits/GradientText";

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

// Split testimonials into columns for scrolling marquee
const col1 = [...testimonials, ...testimonials];
const col2 = [...testimonials.slice().reverse(), ...testimonials.slice().reverse()];
const col3 = [
  testimonials[1], testimonials[0], testimonials[2],
  testimonials[1], testimonials[0], testimonials[2],
];

function TestimonialCard({ t }: { t: typeof testimonials[0] }) {
  return (
    <SpotlightCard
      className="rounded-xl border border-border/50 bg-card p-6 shadow-sm"
      spotlightColor="rgba(63, 81, 181, 0.15)"
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
          <div className="text-sm font-semibold text-foreground">{t.name}</div>
          <div className="text-xs text-muted-foreground">{t.role}</div>
        </div>
      </div>
    </SpotlightCard>
  );
}

function ScrollColumn({
  items,
  duration,
  className = "",
}: {
  items: typeof testimonials;
  duration: number;
  className?: string;
}) {
  return (
    <div className={`overflow-hidden ${className}`}>
      <motion.div
        animate={{ translateY: "-50%" }}
        transition={{
          duration,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-6 pb-6"
      >
        {items.map((t, i) => (
          <TestimonialCard key={`${t.name}-${i}`} t={t} />
        ))}
      </motion.div>
    </div>
  );
}

export default function SocialProofSection() {
  return (
    <section className="bg-secondary/30 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            <GradientText colors={["#3F51B5", "#00BCD4", "#8BC34A", "#3F51B5"]} animationSpeed={6}>
              Loved by Creators Worldwide
            </GradientText>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Join thousands of musicians and producers who transformed their
            workflow.
          </p>
        </div>

        {/* Metrics */}
        <div className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary sm:text-4xl">
              <CountUp to={2000} separator="," />+
            </div>
            <div className="mt-1 text-sm text-muted-foreground">Creators</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary sm:text-4xl">
              <CountUp to={50000} separator="," />+
            </div>
            <div className="mt-1 text-sm text-muted-foreground">Projects</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary sm:text-4xl">
              <CountUp to={94} />%
            </div>
            <div className="mt-1 text-sm text-muted-foreground">Retention</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary sm:text-4xl">
              <CountUp to={4.9} />/5
            </div>
            <div className="mt-1 text-sm text-muted-foreground">Rating</div>
          </div>
        </div>

        {/* Scrolling Testimonial Columns */}
        <div className="relative mt-16 max-h-[600px] overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)]">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <ScrollColumn items={col1} duration={25} />
            <ScrollColumn items={col2} duration={30} className="hidden sm:block" />
            <ScrollColumn items={col3} duration={22} className="hidden lg:block" />
          </div>
        </div>
      </div>
    </section>
  );
}
