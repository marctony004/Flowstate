import { useState, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import BenefitsSection from "@/components/landing/BenefitsSection";
import ComparisonSection from "@/components/landing/ComparisonSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import SocialProofSection from "@/components/landing/SocialProofSection";
import ProductShowcaseSection from "@/components/landing/ProductShowcaseSection";
import ROICalculatorSection from "@/components/landing/ROICalculatorSection";
import PricingSection from "@/components/landing/PricingSection";
import IntegrationSecuritySection from "@/components/landing/IntegrationSecuritySection";
import FAQSection from "@/components/landing/FAQSection";
import SessionJourneySection from "@/components/landing/SessionJourneySection";
import FinalCTASection from "@/components/landing/FinalCTASection";
import ManifestoSection from "@/components/landing/ManifestoSection";
import ClosingNoteSection from "@/components/landing/ClosingNoteSection";
import Footer from "@/components/landing/Footer";
import WaveDivider from "@/components/landing/WaveDivider";
import DemoRequestDialog from "@/components/landing/DemoRequestDialog";

/** Parallax wrapper — shifts content slightly as user scrolls */
function Parallax({ children, offset = 40 }: { children: React.ReactNode; offset?: number }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [offset, -offset]);

  return (
    <div ref={ref}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
}

export default function LandingPage() {
  const [demoOpen, setDemoOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <WaveDivider variant="soft" />
        <Parallax offset={30}>
          <BenefitsSection />
        </Parallax>
        <WaveDivider variant="double" flip />
        <HowItWorksSection />
        <WaveDivider variant="sharp" />
        <Parallax offset={25}>
          <SocialProofSection />
        </Parallax>
        <WaveDivider variant="soft" flip />
        <ProductShowcaseSection />
        <ROICalculatorSection />
        <WaveDivider variant="double" />
        <ComparisonSection />
        <WaveDivider variant="soft" flip />
        <Parallax offset={20}>
          <PricingSection />
        </Parallax>
        <IntegrationSecuritySection />
        <WaveDivider variant="sharp" flip />
        <FAQSection />
        <SessionJourneySection />
        <FinalCTASection onScheduleDemo={() => setDemoOpen(true)} />
        <ManifestoSection />
        <ClosingNoteSection />
      </main>
      <Footer />
      <DemoRequestDialog open={demoOpen} onOpenChange={setDemoOpen} />
    </div>
  );
}
