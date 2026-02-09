import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function ClosingNoteSection() {
  return (
    <section className="relative py-20 sm:py-28 bg-muted/30 blend-both">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative z-10 mx-auto max-w-xl px-4 text-center sm:px-6"
      >
        <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Keep your next idea safe.
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
          Start your first session in under 60 seconds.
        </p>
        <Button size="lg" asChild className="mt-8">
          <Link to="/auth/sign-up">Start Free Trial</Link>
        </Button>
        <p className="mt-4 text-xs text-muted-foreground">
          Free &middot; No credit card &middot; Cancel anytime
        </p>
      </motion.div>
    </section>
  );
}
