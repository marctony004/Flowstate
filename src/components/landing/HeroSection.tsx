import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import BlurText from "@/components/reactbits/BlurText";
import Aurora from "@/components/reactbits/Aurora";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28 lg:py-36">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left: Copy */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center lg:text-left"
          >
            <Badge
              variant="secondary"
              className="mb-6 inline-flex text-xs font-medium"
            >
              Trusted by 2,000+ Independent Musicians & Producers
            </Badge>

            <BlurText
              text="Transform Creative Chaos Into Unstoppable Momentum"
              className="text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl"
              delay={100}
              animateBy="words"
              direction="bottom"
            />

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              FlowState is the creative intelligence platform that helps
              musicians, producers, and artists capture ideas, understand
              collaborators, and finish projects — without the organizational
              overwhelm.
            </p>

            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row lg:items-start">
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

          {/* Right: Hero visual placeholder */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative mx-auto w-full max-w-lg lg:mx-0"
          >
            <div className="absolute inset-0 -z-10 overflow-hidden rounded-2xl opacity-60">
              <Aurora
                colorStops={["#3F51B5", "#00BCD4", "#3F51B5"]}
                amplitude={1.2}
                blend={0.6}
                speed={0.5}
              />
            </div>
            <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-primary/10 via-accent/10 to-success/10 p-8 shadow-2xl">
              <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                <div className="flex gap-3">
                  <div className="h-12 w-12 rounded-xl bg-primary/20" />
                  <div className="h-12 w-12 rounded-xl bg-accent/20" />
                  <div className="h-12 w-12 rounded-xl bg-success/20" />
                </div>
                <div className="space-y-2">
                  <div className="mx-auto h-3 w-48 rounded-full bg-foreground/10" />
                  <div className="mx-auto h-3 w-36 rounded-full bg-foreground/10" />
                  <div className="mx-auto h-3 w-40 rounded-full bg-foreground/10" />
                </div>
                <div className="mt-4 grid w-full grid-cols-3 gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-16 rounded-lg bg-foreground/5"
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
