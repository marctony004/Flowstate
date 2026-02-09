import { useState } from "react";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import BenefitsSection from "@/components/landing/BenefitsSection";
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
import DemoRequestDialog from "@/components/landing/DemoRequestDialog";

export default function LandingPage() {
  const [demoOpen, setDemoOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <BenefitsSection />
        <HowItWorksSection />
        <SocialProofSection />
        <ProductShowcaseSection />
        <ROICalculatorSection />
        <PricingSection />
        <IntegrationSecuritySection />
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
