import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import supabase from "../../supabase";

const AuthCallbackPage = () => {
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const code = searchParams.get("code");

    if (code) {
      // PKCE code exchange flow
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          setError(error.message);
        } else {
          navigate("/dashboard", { replace: true });
        }
      });
    } else if (window.location.hash) {
      // Implicit flow — supabase-js auto-detects hash tokens via onAuthStateChange.
      // Just wait briefly then redirect.
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event) => {
        if (event === "SIGNED_IN") {
          subscription.unsubscribe();
          navigate("/dashboard", { replace: true });
        }
      });
      return () => subscription.unsubscribe();
    } else {
      setError("No authorization code found in URL.");
    }
  }, [searchParams, navigate]);

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4">
        <section className="w-full max-w-md space-y-4 rounded-lg border border-border bg-card p-8 shadow-lg">
          <h1 className="text-center text-2xl font-bold tracking-tight text-destructive">
            Authentication Error
          </h1>
          <p className="text-center text-sm text-muted-foreground">{error}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Signing you in...</p>
      </div>
    </main>
  );
};

export default AuthCallbackPage;
