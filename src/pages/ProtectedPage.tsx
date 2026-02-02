import { Link } from "react-router-dom";
import { useSession } from "../context/SessionContext";
import { Button } from "@/components/ui/button";

const ProtectedPage = () => {
  const { session } = useSession();
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <Button variant="ghost" asChild className="mb-4 self-start sm:self-center">
        <Link to="/">&#9664; Home</Link>
      </Button>
      <section className="w-full max-w-md space-y-6 rounded-lg border border-border bg-card p-8 shadow-lg">
        <h1 className="text-center text-2xl font-bold tracking-tight text-primary">
          Protected Page
        </h1>
        <p className="text-center text-sm text-muted-foreground">
          Current User: {session?.user.email || "None"}
        </p>
      </section>
    </main>
  );
};

export default ProtectedPage;
