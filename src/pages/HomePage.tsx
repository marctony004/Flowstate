import { Link } from "react-router-dom";
import supabase from "../supabase";
import { useSession } from "../context/SessionContext";
import { Button } from "@/components/ui/button";

const HomePage = () => {
  const { session } = useSession();
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <section className="w-full max-w-md space-y-6 rounded-lg border border-border bg-card p-8 shadow-lg">
        <div className="text-center">
          <Link to="/" className="text-3xl font-bold tracking-tight text-primary hover:underline">
            FlowState
          </Link>
          <p className="mt-1 text-sm text-muted-foreground">
            Your Creative Intelligence OS
          </p>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Current User: {session?.user.email || "None"}
        </p>

        <div className="flex flex-col gap-3">
          {session ? (
            <Button onClick={() => supabase.auth.signOut()}>Sign Out</Button>
          ) : (
            <Button asChild>
              <Link to="/auth/sign-in">Sign In</Link>
            </Button>
          )}
          <Button variant="secondary" asChild>
            <Link to="/protected">Protected Page</Link>
          </Button>
          {session && (
            <Button variant="outline" asChild>
              <Link to="/dashboard">Dashboard</Link>
            </Button>
          )}
        </div>
      </section>
    </main>
  );
};

export default HomePage;
