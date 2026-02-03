import { useState, useMemo } from "react";
import { Link, Navigate } from "react-router-dom";
import { useSession } from "../../context/SessionContext";
import supabase from "../../supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, Circle } from "lucide-react";

function getPasswordStrength(password: string) {
  const checks = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "Uppercase letter", met: /[A-Z]/.test(password) },
    { label: "Lowercase letter", met: /[a-z]/.test(password) },
    { label: "Number", met: /\d/.test(password) },
    { label: "Special character", met: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.met).length;
  return { checks, score };
}

const strengthLabels = ["", "Weak", "Fair", "Good", "Strong", "Excellent"];
const strengthColors = ["", "bg-destructive", "bg-[var(--warning)]", "bg-[var(--warning)]", "bg-[var(--success)]", "bg-[var(--success)]"];

const SignUpPage = () => {
  const { session } = useSession();
  const [status, setStatus] = useState("");
  const [formValues, setFormValues] = useState({
    email: "",
    password: "",
  });

  const strength = useMemo(() => getPasswordStrength(formValues.password), [formValues.password]);

  if (session) return <Navigate to="/dashboard" />;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues({ ...formValues, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (strength.score < 3) {
      alert("Please choose a stronger password.");
      return;
    }
    setStatus("Creating account...");
    const { error } = await supabase.auth.signUp({
      email: formValues.email,
      password: formValues.password,
    });
    if (error) {
      alert(error.message);
    }
    setStatus("");
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <Button variant="ghost" asChild className="mb-4 self-start sm:self-center">
        <Link to="/">&#9664; Home</Link>
      </Button>
      <form
        className="w-full max-w-md space-y-4 rounded-lg border border-border bg-card p-8 shadow-lg"
        onSubmit={handleSubmit}
      >
        <h1 className="text-center text-2xl font-bold tracking-tight text-primary">
          Sign Up
        </h1>
        <p className="text-center text-xs text-muted-foreground">
          Demo app, please don't use your real email or password
        </p>
        <div className="space-y-3">
          <Input
            name="email"
            onChange={handleInputChange}
            type="email"
            placeholder="Email"
          />
          <Input
            name="password"
            onChange={handleInputChange}
            type="password"
            placeholder="Password"
          />
          {formValues.password && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex h-1.5 flex-1 gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`h-full flex-1 rounded-full transition-colors ${
                        i <= strength.score ? strengthColors[strength.score] : "bg-muted"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  {strengthLabels[strength.score]}
                </span>
              </div>
              <ul className="space-y-1">
                {strength.checks.map((check) => (
                  <li key={check.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {check.met ? (
                      <CheckCircle className="h-3 w-3 text-[var(--success)]" />
                    ) : (
                      <Circle className="h-3 w-3" />
                    )}
                    {check.label}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-3">
          <Button type="submit" disabled={strength.score < 3 && formValues.password.length > 0}>
            Create Account
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                  redirectTo: `${window.location.origin}/auth/callback`,
                },
              })
            }
          >
            Sign up with Google
          </Button>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          By creating an account, you agree to our{" "}
          <a href="#" className="text-primary underline-offset-4 hover:underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="text-primary underline-offset-4 hover:underline">
            Privacy Policy
          </a>
          .
        </p>
        <p className="text-center text-sm">
          <Link
            className="text-primary underline-offset-4 hover:underline"
            to="/auth/sign-in"
          >
            Already have an account? Sign In
          </Link>
        </p>
        {status && (
          <p className="text-center text-sm text-muted-foreground">{status}</p>
        )}
      </form>
    </main>
  );
};

export default SignUpPage;
