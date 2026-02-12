import { useEffect, useState } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useSession } from "../context/SessionContext";
import supabase from "../supabase";

const AuthProtectedRoute = () => {
  const { session } = useSession();
  const location = useLocation();
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    if (!session?.user.id) return;

    let cancelled = false;
    let attempts = 0;

    // Safety timeout — never show spinner for more than 3 seconds
    const timeout = setTimeout(() => {
      if (!cancelled) setOnboarded(true);
    }, 3000);

    const check = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("onboarded_at")
          .eq("id", session!.user.id)
          .single();
        if (cancelled) return;
        if (error && attempts < 2) {
          attempts++;
          setTimeout(check, 500);
        } else {
          setOnboarded(error ? true : !!data?.onboarded_at);
        }
      } catch {
        if (!cancelled) setOnboarded(true);
      }
    };
    check();

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [session?.user.id]);

  if (!session) {
    return <Navigate to="/" replace />;
  }

  // Still checking onboarding status
  if (onboarded === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // Redirect to onboarding if not completed (unless already there)
  if (!onboarded && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  // If onboarded and trying to visit /onboarding, redirect to dashboard
  if (onboarded && location.pathname === "/onboarding") {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet context={{ setOnboarded }} />;
};

export default AuthProtectedRoute;
