import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/context/SessionContext";
import supabase from "@/supabase";
import { toast } from "sonner";

const roles = [
  { value: "musician", label: "Musician" },
  { value: "producer", label: "Producer" },
  { value: "artist", label: "Artist" },
  { value: "songwriter", label: "Songwriter" },
  { value: "engineer", label: "Engineer" },
  { value: "other", label: "Other" },
];

export default function OnboardingPage() {
  const { session } = useSession();
  const navigate = useNavigate();
  const { setOnboarded } = useOutletContext<{ setOnboarded: (v: boolean) => void }>();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    display_name:
      session?.user.user_metadata?.full_name ??
      session?.user.email?.split("@")[0] ??
      "",
    role: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  async function handleComplete() {
    if (!session?.user.id) return;
    if (!form.display_name.trim()) {
      toast.error("Please enter a display name");
      return;
    }
    if (!form.role) {
      toast.error("Please select a role");
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: form.display_name.trim(),
        role: form.role,
        timezone: form.timezone || null,
        onboarded_at: new Date().toISOString(),
      })
      .eq("id", session.user.id);

    setSaving(false);

    if (error) {
      toast.error("Something went wrong. Please try again.");
      return;
    }

    setOnboarded(true);
    toast.success("Welcome to FlowState!");
    navigate("/dashboard", { replace: true });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
            <span className="text-xl font-bold text-primary-foreground">F</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome to FlowState
          </h1>
          <p className="mt-2 text-muted-foreground">
            Let's set up your profile to get started
          </p>
        </div>

        {/* Progress */}
        <div className="flex gap-2">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                s <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-6 rounded-xl border border-border bg-card p-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                What should we call you?
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                This is how you'll appear to collaborators.
              </p>
            </div>
            <div>
              <Label htmlFor="display_name">Display Name</Label>
              <Input
                id="display_name"
                value={form.display_name}
                onChange={(e) =>
                  setForm({ ...form, display_name: e.target.value })
                }
                placeholder="Your name or alias"
              />
            </div>
            <Button
              className="w-full"
              onClick={() => {
                if (!form.display_name.trim()) {
                  toast.error("Please enter a display name");
                  return;
                }
                setStep(2);
              }}
            >
              Continue
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 rounded-xl border border-border bg-card p-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                What's your primary role?
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                This helps us personalize your experience.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {roles.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setForm({ ...form, role: r.value })}
                  className={`rounded-lg border p-3 text-sm font-medium transition-all ${
                    form.role === r.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep(1)}
              >
                Back
              </Button>
              <Button
                className="flex-1"
                onClick={handleComplete}
                disabled={saving || !form.role}
              >
                {saving ? "Setting up..." : "Get Started"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
