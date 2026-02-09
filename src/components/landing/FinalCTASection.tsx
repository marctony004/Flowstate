import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import StarBorder from "@/components/reactbits/StarBorder";
import { Clock, CreditCard, XCircle, Sparkles } from "lucide-react";

export default function FinalCTASection({ onScheduleDemo }: { onScheduleDemo?: () => void }) {
  return (
    <section className="relative overflow-hidden bg-primary py-20 sm:py-28 studio-grain section-deep">
      {/* Decorative gradient overlay - warmer, more creative */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-accent/30 opacity-90" />

      {/* Blend edges into neighbors */}
      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#1a1a2e]/80 to-transparent z-[2] pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background/40 to-transparent z-[2] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8"
      >
        <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl lg:text-5xl">
          Ready to Finish What You Started?
        </h2>
        <p className="mt-6 text-lg leading-relaxed text-primary-foreground/80">
          Join 2,000+ producers and artists who stopped losing ideas and started
          shipping tracks. Your 14-day free trial is waiting.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <StarBorder
            as="div"
            color="#00BCD4"
            speed="5s"
            thickness={2}
            className="rounded-xl"
          >
            <Button
              size="lg"
              variant="secondary"
              asChild
              className="rounded-[18px]"
            >
              <Link to="/auth/sign-up">Start Free Trial</Link>
            </Button>
          </StarBorder>
          <Button
            size="lg"
            variant="outline"
            className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            onClick={onScheduleDemo}
          >
            Schedule a Demo
          </Button>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-primary-foreground/70">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="text-sm">14-day trial</span>
          </div>
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="text-sm">No credit card</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            <span className="text-sm">Cancel anytime</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm">First session in 5 min</span>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
