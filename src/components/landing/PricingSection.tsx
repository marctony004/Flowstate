import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import GradientText from "@/components/reactbits/GradientText";

const tiers = [
  {
    name: "Starter",
    monthlyPrice: "$9",
    annualPrice: "$7",
    period: "/month",
    description: "For solo creators getting organized.",
    features: [
      "5 active projects",
      "Unlimited idea capture",
      "Feedback from up to 3 collaborators",
      "Basic AI insights",
      "Email support",
    ],
    cta: "Start Free Trial",
    highlighted: false,
  },
  {
    name: "Professional",
    monthlyPrice: "$29",
    annualPrice: "$24",
    period: "/month",
    description: "For serious creators and small teams.",
    features: [
      "Unlimited projects",
      "Unlimited collaborators",
      "Advanced AI: semantic search & session recall",
      "Explainable insights with \"Why?\" evidence",
      "Real-time collaboration",
      "Priority email & chat support",
    ],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    monthlyPrice: "Custom",
    annualPrice: "Custom",
    period: "",
    description: "For labels, studios, and large teams.",
    features: [
      "Everything in Professional",
      "Custom integrations (DAW plugins, studio software)",
      "Dedicated account manager",
      "SSO & advanced security",
      "Advanced analytics & reporting",
      "SLA & uptime guarantees",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1 },
  }),
};

export default function PricingSection() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="relative overflow-hidden py-20 sm:py-28 bg-secondary/20 studio-grain blend-both">
      {/* Ambient blobs */}
      <div className="absolute -top-1/4 left-1/3 h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-1/4 -right-1/4 h-[400px] w-[400px] rounded-full bg-accent/4 blur-3xl pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            <GradientText colors={["#3F51B5", "#00BCD4", "#3F51B5"]} animationSpeed={5}>
              Simple, Transparent Pricing
            </GradientText>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Start free for 14 days. No credit card required.
          </p>

          <div className="mt-6 flex items-center justify-center gap-3">
            <span
              className={`text-sm font-medium ${!annual ? "text-foreground" : "text-muted-foreground"}`}
            >
              Monthly
            </span>
            <Switch checked={annual} onCheckedChange={setAnnual} />
            <span
              className={`text-sm font-medium ${annual ? "text-foreground" : "text-muted-foreground"}`}
            >
              Annual
            </span>
            {annual && (
              <Badge variant="secondary" className="text-xs font-medium text-[var(--success)]">
                Save 17%
              </Badge>
            )}
          </div>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={fadeUp}
              className={`group relative rounded-2xl p-8 transition-shadow duration-300 ${
                tier.highlighted
                  ? "scale-[1.02] bg-card/80 shadow-xl"
                  : "border border-border/50 bg-card/50"
              }`}
            >
              {/* Animated gradient border for highlighted card */}
              {tier.highlighted && (
                <>
                  <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-[shimmer_3s_linear_infinite]" />
                  <div className="absolute inset-0 rounded-2xl bg-card/95" />
                </>
              )}

              <div className="relative">
                {tier.highlighted && (
                  <Badge className="absolute -top-11 left-1/2 -translate-x-1/2">
                    Most Popular
                  </Badge>
                )}
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-foreground">
                    {tier.name}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {tier.description}
                  </p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-foreground">
                    {annual ? tier.annualPrice : tier.monthlyPrice}
                  </span>
                  <span className="text-muted-foreground">
                    {tier.period}
                    {annual && tier.period ? " (billed annually)" : ""}
                  </span>
                </div>
                <ul className="mb-8 space-y-3">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--success)]" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={tier.highlighted ? "default" : "outline"}
                  asChild
                >
                  <Link to="/auth/sign-up">{tier.cta}</Link>
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
