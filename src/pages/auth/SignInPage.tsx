import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useSession } from "../../context/SessionContext";
import supabase from "../../supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SignInPage = () => {
  const { session } = useSession();
  if (session) return <Navigate to="/dashboard" />;

  const [status, setStatus] = useState("");
  const [formValues, setFormValues] = useState({
    email: "",
    password: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues({ ...formValues, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("Logging in...");
    const { error } = await supabase.auth.signInWithPassword({
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
          Sign In
        </h1>
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
        </div>
        <div className="flex flex-col gap-3">
          <Button type="submit">Login</Button>
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
            Sign in with Google
          </Button>
        </div>
        <p className="text-center text-sm">
          <Link
            className="text-primary underline-offset-4 hover:underline"
            to="/auth/sign-up"
          >
            Don't have an account? Sign Up
          </Link>
        </p>
        {status && (
          <p className="text-center text-sm text-muted-foreground">{status}</p>
        )}
      </form>
    </main>
  );
};

export default SignInPage;
