import { useSession } from "../context/SessionContext";
import supabase from "../supabase";
import { Button } from "@/components/ui/button";

const DashboardPage = () => {
  const { session } = useSession();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <section className="w-full max-w-md space-y-6 rounded-lg border border-border bg-card p-8 shadow-lg">
        <h1 className="text-center text-2xl font-bold tracking-tight text-primary">
          Dashboard
        </h1>
        <p className="text-center text-sm text-muted-foreground">
          {session?.user.email}
        </p>
        <Button className="w-full" onClick={() => supabase.auth.signOut()}>
          Sign Out
        </Button>
      </section>
    </main>
  );
};

export default DashboardPage;
