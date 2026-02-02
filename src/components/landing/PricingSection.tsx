import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const tiers = [
  {
    name: "Starter",
    price: "$9",
    period: "/month",
    description: "For solo creators getting organized.",
    features: [
      "5 active projects",
      "Basic idea capture",
      "Task management",
      "Mobile app access",
      "1 GB storage",
    ],
    cta: "Start Free Trial",
    highlighted: false,
  },
  {
    name: "Professional",
    price: "$29",
    period: "/month",
    description: "For serious creators and small teams.",
    features: [
      "Unlimited projects",
      "AI-powered insights",
      "Collaborator profiles",
      "Advanced analytics",
      "25 GB storage",
      "Priority support",
    ],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For labels, studios, and large teams.",
    features: [
      "Everything in Professional",
      "Custom integrations",
      "Dedicated account manager",
      "SSO & advanced security",
      "Unlimited storage",
      "SLA guarantee",
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
  return (
    <section id="pricing" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Start free for 14 days. No credit card required.
          </p>
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
              className={`relative rounded-2xl border p-8 ${
                tier.highlighted
                  ? "scale-[1.02] border-primary bg-card shadow-xl"
                  : "border-border/50 bg-card shadow-sm"
              }`}
            >
              {tier.highlighted && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
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
                  {tier.price}
                </span>
                <span className="text-muted-foreground">{tier.period}</span>
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
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
