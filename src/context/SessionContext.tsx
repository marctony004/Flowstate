import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import supabase from "../supabase";
import LoadingPage from "../pages/LoadingPage";
import { Session } from "@supabase/supabase-js";
import type { Profile } from "@/types/database";

interface SessionContextValue {
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue>({
  session: null,
  profile: null,
  isAdmin: false,
  refreshProfile: async () => {},
});

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
};

type Props = { children: React.ReactNode };
export const SessionProvider = ({ children }: Props) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const resolvedRef = useRef(false);

  const finishLoading = useCallback(() => {
    if (!resolvedRef.current) {
      resolvedRef.current = true;
      setIsLoading(false);
    }
  }, []);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      setProfile(data);
    } catch {
      setProfile(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user.id) {
      await fetchProfile(session.user.id);
    }
  }, [session?.user.id, fetchProfile]);

  useEffect(() => {
    // Safety timeout — never show spinner for more than 4 seconds
    const timeout = setTimeout(finishLoading, 4000);

    // onAuthStateChange fires INITIAL_SESSION synchronously before
    // getSession resolves — use it as the primary initialisation path.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      // Fire-and-forget profile fetch — do NOT block finishLoading on it
      if (newSession?.user.id) {
        fetchProfile(newSession.user.id);
      } else {
        setProfile(null);
      }
      finishLoading();
    });

    // Fallback: if onAuthStateChange hasn't fired yet (shouldn't happen
    // in v2.39+ but keeps older clients safe), getSession resolves it.
    supabase.auth
      .getSession()
      .then(({ data: { session: s } }) => {
        if (!resolvedRef.current) {
          setSession(s);
          if (s?.user.id) fetchProfile(s.user.id);
          finishLoading();
        }
      })
      .catch(finishLoading);

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isAdmin = profile?.is_admin === true;

  return (
    <SessionContext.Provider value={{ session, profile, isAdmin, refreshProfile }}>
      {isLoading ? <LoadingPage /> : children}
    </SessionContext.Provider>
  );
};
