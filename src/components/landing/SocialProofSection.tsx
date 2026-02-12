import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import CountUp from "@/components/reactbits/CountUp";
import SpotlightCard from "@/components/reactbits/SpotlightCard";
import GradientText from "@/components/reactbits/GradientText";

const testimonials = [
  // Leo Rodriguez — 3 quotes
  {
    name: "Leo Rodriguez",
    role: "Producer & Beatmaker",
    initials: "LR",
    quote:
      "I used to lose hook ideas across 10 apps. Now every take, stem, and voice memo lives in one session — and I actually finish beats.",
    stars: 5,
  },
  {
    name: "Leo Rodriguez",
    role: "Producer & Beatmaker",
    initials: "LR",
    quote:
      "FlowState cut my revision rounds in half. I pull up a session and instantly see every mix note and what's left before the bounce.",
    stars: 5,
  },
  {
    name: "Leo Rodriguez",
    role: "Producer & Beatmaker",
    initials: "LR",
    quote:
      "The session timeline is basically how my brain works. Seeing all my loops and sketches laid out made finishing tracks feel obvious.",
    stars: 5,
  },
  // Maya Sharma — 3 quotes
  {
    name: "Maya Sharma",
    role: "Mixing Engineer",
    initials: "MS",
    quote:
      "Collaborator profiles are a game-changer. I know what each artist needs before they walk into my studio. Revision rounds dropped 60%.",
    stars: 5,
  },
  {
    name: "Maya Sharma",
    role: "Mixing Engineer",
    initials: "MS",
    quote:
      "No more 'can you make it warmer?' with zero context. FlowState links every mix note to the exact section so I nail it on the first pass.",
    stars: 5,
  },
  {
    name: "Maya Sharma",
    role: "Mixing Engineer",
    initials: "MS",
    quote:
      "I bounced 3 final masters last week without a single 'wait, which version?' moment. That alone is worth it.",
    stars: 5,
  },
  // Chloe Kim — 3 quotes
  {
    name: "Chloe Kim",
    role: "Singer-Songwriter",
    initials: "CK",
    quote:
      "Went from 12 unfinished songs to releasing my EP in 3 months. FlowState gave me structure without killing the vibe.",
    stars: 5,
  },
  {
    name: "Chloe Kim",
    role: "Singer-Songwriter",
    initials: "CK",
    quote:
      "I hum ideas into my phone constantly. FlowState turns those 2am voice memos into tagged hooks I can actually find later.",
    stars: 5,
  },
  {
    name: "Chloe Kim",
    role: "Singer-Songwriter",
    initials: "CK",
    quote:
      "My label sends revision notes and I see them right next to the chorus they're about. No more digging through email threads.",
    stars: 5,
  },
];

// Build 3 columns with different orderings to avoid adjacent repeats
const col1 = [
  testimonials[0], testimonials[3], testimonials[6],
  testimonials[0], testimonials[3], testimonials[6],
];
const col2 = [
  testimonials[4], testimonials[7], testimonials[1],
  testimonials[4], testimonials[7], testimonials[1],
];
const col3 = [
  testimonials[8], testimonials[2], testimonials[5],
  testimonials[8], testimonials[2], testimonials[5],
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
          <TestimonialCard key={`${t.name}-${t.quote.slice(0, 20)}-${i}`} t={t} />
        ))}
      </motion.div>
    </div>
  );
}

// Featured testimonials for carousel — one per person, their best quote
const featured = [testimonials[0], testimonials[3], testimonials[6]];

function FeaturedCarousel() {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => setCurrent((p) => (p + 1) % featured.length), []);
  const prev = useCallback(() => setCurrent((p) => (p - 1 + featured.length) % featured.length), []);

  // Auto-advance every 6 seconds
  useEffect(() => {
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [next]);

  const t = featured[current];

  return (
    <div className="relative mt-14 mx-auto max-w-2xl">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.35 }}
          className="rounded-xl border border-border/50 bg-card/80 p-8 text-center backdrop-blur-sm"
        >
          <div className="mb-3 flex justify-center gap-0.5">
            {Array.from({ length: t.stars }).map((_, s) => (
              <Star
                key={s}
                className="h-5 w-5 fill-[var(--warning)] text-[var(--warning)]"
              />
            ))}
          </div>
          <p className="text-lg leading-relaxed text-foreground">
            "{t.quote}"
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {t.initials}
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold text-foreground">{t.name}</div>
              <div className="text-xs text-muted-foreground">{t.role}</div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation arrows */}
      <button
        onClick={prev}
        className="absolute -left-4 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-border/50 bg-card/80 text-muted-foreground backdrop-blur-sm transition-colors hover:text-foreground hover:border-border sm:-left-12"
        aria-label="Previous testimonial"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        onClick={next}
        className="absolute -right-4 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full border border-border/50 bg-card/80 text-muted-foreground backdrop-blur-sm transition-colors hover:text-foreground hover:border-border sm:-right-12"
        aria-label="Next testimonial"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {/* Dots */}
      <div className="mt-4 flex justify-center gap-2">
        {featured.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2 rounded-full transition-all ${
              i === current ? "w-6 bg-primary" : "w-2 bg-border"
            }`}
            aria-label={`Go to testimonial ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function SocialProofSection() {
  return (
    <section className="bg-secondary/30 py-20 sm:py-28 studio-surface relative blend-both">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            <GradientText colors={["#3F51B5", "#00BCD4", "#8BC34A", "#3F51B5"]} animationSpeed={6}>
              Loved by Creators Worldwide
            </GradientText>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Join thousands of musicians and producers who stopped losing ideas
            and started shipping tracks.
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
            <div className="mt-1 text-sm text-muted-foreground">Sessions</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary sm:text-4xl">
              <CountUp to={94} />%
            </div>
            <div className="mt-1 text-sm text-muted-foreground">Retention</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary sm:text-4xl">
              <CountUp to={120} />k+
            </div>
            <div className="mt-1 text-sm text-muted-foreground">Hours Saved</div>
          </div>
        </div>

        {/* Featured Testimonial Carousel */}
        <FeaturedCarousel />

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
