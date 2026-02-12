import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "Do I need a credit card to start?",
    a: "No credit card required! Your 14-day trial is completely free. You can continue on our free plan afterward or upgrade anytime. We believe in letting you experience FlowState's value before any commitment.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Absolutely. Cancel anytime with no questions asked. Your data remains yours—you can export it whenever you need. We're confident you'll love FlowState, but we respect your freedom to choose.",
  },
  {
    q: "Is FlowState compatible with my DAW?",
    a: "FlowState is DAW-agnostic and designed to fit alongside any DAW workflow (Logic Pro, Ableton, FL Studio, Pro Tools, Reaper, and more) by organizing the language and decisions around your sessions.",
  },
  {
    q: "Can FlowState remember what we decided in past sessions?",
    a: "Yes. FlowState builds a private, personal session memory from your notes and voice transcripts so you can ask things like 'What did we decide about the hook last week?' and get answers with summaries, quotes, and timestamps.",
  },
  {
    q: "How do I trust the AI insights?",
    a: "Every insight includes a 'Why?' explanation that shows the exact notes, transcript snippets, and timestamps it used—so you can verify decisions and stay in control. No black-box magic.",
  },
  {
    q: "Is my creative work private and secure?",
    a: "Yes. Your projects are encrypted and private by default. We never share your creative work with anyone. Full GDPR and SOC 2 compliance. Your artistic vision is sacred to us.",
  },
  {
    q: "Can I collaborate with my team?",
    a: "Yes! Invite bandmates, producers, and collaborators to your projects. Real-time collaboration with semantic feedback organization. Everyone stays aligned on the creative vision.",
  },
  {
    q: "What happens to my data if I cancel?",
    a: "After cancellation, you'll have 30 days to export your data. We provide easy export tools for all your projects, notes, and files. After 30 days, your data is permanently deleted from our servers.",
  },
];

export default function FAQSection() {
  return (
    <section id="faq" className="relative overflow-hidden py-20 sm:py-28 section-deep studio-grain blend-both">
      {/* Ambient blob */}
      <div className="absolute -top-1/4 -left-1/3 h-[400px] w-[400px] rounded-full bg-accent/4 blur-3xl pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Everything you need to know about FlowState.
          </p>
        </div>

        <Accordion type="single" collapsible className="mt-12">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger className="text-left text-base font-medium">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
