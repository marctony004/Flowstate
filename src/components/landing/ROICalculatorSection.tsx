import { useState } from "react";
import { motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calculator, Mail, CheckCircle } from "lucide-react";

export default function ROICalculatorSection() {
  const [projects, setProjects] = useState(10);
  const [hours, setHours] = useState(5);
  const [rate, setRate] = useState(50);
  const [reportEmail, setReportEmail] = useState("");
  const [reportSent, setReportSent] = useState(false);

  const efficiencyGain = 0.4;
  const monthlySaved = Math.round(projects * hours * rate * efficiencyGain);
  const yearlySaved = monthlySaved * 12;
  const hoursSaved = Math.round(projects * hours * efficiencyGain);

  return (
    <section className="bg-secondary/30 py-20 sm:py-28 section-deep blend-both">
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Calculate Your ROI
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            See how much time and money FlowState can save you every month.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto mt-12 max-w-4xl"
        >
          <div className="grid gap-8 rounded-2xl border border-border/50 bg-card p-8 shadow-sm lg:grid-cols-2">
            {/* Sliders */}
            <div className="space-y-8">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <Label className="text-sm font-medium">Active Projects</Label>
                  <span className="text-sm font-semibold text-primary">
                    {projects}
                  </span>
                </div>
                <Slider
                  value={[projects]}
                  onValueChange={([v]) => setProjects(v)}
                  min={1}
                  max={50}
                  step={1}
                />
              </div>
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <Label className="text-sm font-medium">
                    Hours/Week on Organization
                  </Label>
                  <span className="text-sm font-semibold text-primary">
                    {hours}h
                  </span>
                </div>
                <Slider
                  value={[hours]}
                  onValueChange={([v]) => setHours(v)}
                  min={1}
                  max={40}
                  step={1}
                />
              </div>
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <Label className="text-sm font-medium">
                    Your Hourly Rate
                  </Label>
                  <span className="text-sm font-semibold text-primary">
                    ${rate}
                  </span>
                </div>
                <Slider
                  value={[rate]}
                  onValueChange={([v]) => setRate(v)}
                  min={10}
                  max={200}
                  step={5}
                />
              </div>
            </div>

            {/* Results */}
            <div className="flex flex-col items-center justify-center rounded-xl bg-primary/5 p-8 text-center">
              <Calculator className="mb-4 h-8 w-8 text-primary" />
              <div className="text-sm font-medium text-muted-foreground">
                Estimated Monthly Savings
              </div>
              <div className="mt-1 text-4xl font-bold text-primary sm:text-5xl">
                ${monthlySaved.toLocaleString()}
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                {hoursSaved} hours saved/month &middot; $
                {yearlySaved.toLocaleString()}/year
              </div>
              <Button className="mt-6" asChild>
                <a href="#pricing">See Pricing</a>
              </Button>
            </div>
          </div>

          {/* ROI Report Email Capture */}
          <div className="mt-6 rounded-xl border border-border/50 bg-card p-6 text-center">
            {reportSent ? (
              <div className="flex items-center justify-center gap-2 text-sm text-[var(--success)]">
                <CheckCircle className="h-4 w-4" />
                <span>Your personalized ROI report is on its way!</span>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-center gap-2 text-sm font-medium text-foreground">
                  <Mail className="h-4 w-4 text-primary" />
                  Get a detailed ROI report sent to your inbox
                </div>
                <form
                  className="mx-auto mt-3 flex max-w-md gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (reportEmail) setReportSent(true);
                  }}
                >
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={reportEmail}
                    onChange={(e) => setReportEmail(e.target.value)}
                    required
                    className="flex-1"
                  />
                  <Button type="submit">Send Report</Button>
                </form>
                <p className="mt-2 text-xs text-muted-foreground">
                  No spam. Unsubscribe anytime.
                </p>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
