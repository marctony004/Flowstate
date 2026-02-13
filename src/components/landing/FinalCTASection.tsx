import { useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import StarBorder from "@/components/reactbits/StarBorder";
import { Clock, CreditCard, XCircle, Sparkles } from "lucide-react";

function Noise({ patternAlpha = 14, patternRefreshInterval = 3 }: { patternAlpha?: number; patternRefreshInterval?: number }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    let frame = 0;
    let id = 0;
    const S = 512;
    const resize = () => { canvas.width = S; canvas.height = S; };
    const draw = () => {
      const img = ctx.createImageData(S, S);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = Math.random() * 255;
        d[i] = v; d[i + 1] = v; d[i + 2] = v; d[i + 3] = patternAlpha;
      }
      ctx.putImageData(img, 0, 0);
    };
    const loop = () => { if (frame % patternRefreshInterval === 0) draw(); frame++; id = requestAnimationFrame(loop); };
    resize(); loop();
    return () => { cancelAnimationFrame(id); };
  }, [patternAlpha, patternRefreshInterval]);
  return <canvas ref={ref} className="pointer-events-none absolute inset-0 w-full h-full" style={{ imageRendering: "pixelated" }} />;
}

export default function FinalCTASection({ onScheduleDemo }: { onScheduleDemo?: () => void }) {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28 blend-both">
      {/* Grid + spotlight + noise background */}
      <div className="absolute inset-0 bg-background" />
      {/* Spotlight glow — brand primary */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_560px_at_50%_50%,#3F51B533,transparent_70%)]" />
      {/* Grid lines with radial fade mask */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#64748b1a_1px,transparent_1px),linear-gradient(to_bottom,#64748b1a_1px,transparent_1px)] bg-[size:22px_22px] [mask-image:radial-gradient(ellipse_90%_70%_at_50%_50%,#000_60%,transparent_100%)] [-webkit-mask-image:radial-gradient(ellipse_90%_70%_at_50%_50%,#000_60%,transparent_100%)]" />
      {/* Noise grain */}
      <Noise patternAlpha={12} patternRefreshInterval={3} />

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
