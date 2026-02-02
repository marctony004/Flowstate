import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function FinalCTASection() {
  return (
    <section className="relative overflow-hidden bg-primary py-20 sm:py-28">
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-[var(--premium)] opacity-90" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8"
      >
        <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl lg:text-5xl">
          Ready to Transform Your Creative Workflow?
        </h2>
        <p className="mt-6 text-lg leading-relaxed text-primary-foreground/80">
          Join 2,000+ creators who stopped fighting disorganization and started
          finishing projects. Your 14-day free trial is waiting.
        </p>
        <Button
          size="lg"
          variant="secondary"
          className="mt-8"
          asChild
        >
          <Link to="/auth/sign-up">Start Free Trial</Link>
        </Button>
        <p className="mt-4 text-sm text-primary-foreground/60">
          Free &middot; No credit card required &middot; Cancel anytime
        </p>
      </motion.div>
    </section>
  );
}
