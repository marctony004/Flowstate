import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "Do I need a credit card to start?",
    a: "No. You can start your 14-day free trial without entering any payment information. We'll remind you before the trial ends so you can decide if FlowState is right for you.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Absolutely. There are no long-term contracts. You can cancel your subscription at any time from your account settings, and you'll retain access until the end of your billing period.",
  },
  {
    q: "Is FlowState compatible with my DAW?",
    a: "FlowState works alongside any DAW — Ableton, Logic Pro, FL Studio, Pro Tools, and more. It's a companion tool for organizing your creative workflow, not a plugin that requires DAW integration.",
  },
  {
    q: "How does FlowState keep my data private?",
    a: "Your data is encrypted at rest and in transit. We never share your creative work or personal information with third parties. You own your data, and you can export or delete it at any time.",
  },
  {
    q: "Can I collaborate with my team?",
    a: "Yes! The Professional plan supports team collaboration with shared projects, collaborator profiles, and real-time updates. Enterprise plans include advanced team management and permissions.",
  },
  {
    q: "What happens to my data if I cancel?",
    a: "After cancellation, you'll have 30 days to export your data. We provide easy export tools for all your projects, notes, and files. After 30 days, your data is permanently deleted from our servers.",
  },
];

export default function FAQSection() {
  return (
    <section id="faq" className="py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
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
