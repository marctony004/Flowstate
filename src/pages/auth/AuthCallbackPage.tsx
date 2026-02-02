import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import supabase from "../../supabase";

const AuthCallbackPage = () => {
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      setError("No authorization code found in URL.");
      return;
    }

    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        setError(error.message);
      } else {
        navigate("/dashboard", { replace: true });
      }
    });
  }, [searchParams, navigate]);

  if (error) {
    return (
      <main className="main-container">
        <h1 className="header-text">Authentication Error</h1>
        <p>{error}</p>
      </main>
    );
  }

  return (
    <main className="main-container">
      <p>Signing you in...</p>
    </main>
  );
};

export default AuthCallbackPage;
