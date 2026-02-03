import { useState } from "react";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import BenefitsSection from "@/components/landing/BenefitsSection";
import SocialProofSection from "@/components/landing/SocialProofSection";
import ProductShowcaseSection from "@/components/landing/ProductShowcaseSection";
import ROICalculatorSection from "@/components/landing/ROICalculatorSection";
import PricingSection from "@/components/landing/PricingSection";
import IntegrationSecuritySection from "@/components/landing/IntegrationSecuritySection";
import FAQSection from "@/components/landing/FAQSection";
import FinalCTASection from "@/components/landing/FinalCTASection";
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
        <SocialProofSection />
        <ProductShowcaseSection />
        <ROICalculatorSection />
        <PricingSection />
        <IntegrationSecuritySection />
        <FAQSection />
        <FinalCTASection onScheduleDemo={() => setDemoOpen(true)} />
      </main>
      <Footer />
      <DemoRequestDialog open={demoOpen} onOpenChange={setDemoOpen} />
    </div>
  );
}
