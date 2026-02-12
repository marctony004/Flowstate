import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import StarBorder from "@/components/reactbits/StarBorder";
import { Clock, CreditCard, XCircle, Sparkles } from "lucide-react";

export default function FinalCTASection({ onScheduleDemo }: { onScheduleDemo?: () => void }) {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28 section-deep blend-both">
      {/* Background matching hero */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
      <div className="absolute -top-1/4 -left-1/4 h-[500px] w-[500px] rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-1/4 -right-1/4 h-[400px] w-[400px] rounded-full bg-accent/10 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8"
      >
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
          Ready to Finish What You Started?
        </h2>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
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
            className="border-border/50 text-foreground hover:bg-foreground/10"
            onClick={onScheduleDemo}
          >
            Schedule a Demo
          </Button>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-muted-foreground">
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
