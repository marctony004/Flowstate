import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import supabase from "../../supabase";

const AuthCallbackPage = () => {
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    let navigated = false;
    const go = () => {
      if (!navigated) {
        navigated = true;
        navigate("/dashboard", { replace: true });
      }
    };

    const code = searchParams.get("code");

    if (code) {
      // PKCE code exchange flow
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          setError(error.message);
        } else {
          go();
        }
      });
    } else {
      // Implicit flow or hash-based tokens — supabase-js auto-detects.
      // Listen for session events (SIGNED_IN or INITIAL_SESSION with valid session).
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
          subscription.unsubscribe();
          go();
        }
      });

      // Also poll getSession — catches cases where events already fired
      const checkSession = async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            subscription.unsubscribe();
            go();
          }
        } catch {
          // ignore — timeout will catch it
        }
      };
      checkSession();
      // Retry once more after 1s in case hash is still being processed
      const retry = setTimeout(checkSession, 1000);

      // Timeout fallback — if nothing happens in 5s, show error
      const timeout = setTimeout(() => {
        if (!navigated) {
          setError("Authentication timed out. Please try signing in again.");
        }
      }, 5000);

      return () => {
        subscription.unsubscribe();
        clearTimeout(timeout);
        clearTimeout(retry);
      };
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
