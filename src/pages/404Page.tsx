import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const NotFoundPage: React.FC = () => {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <section className="w-full max-w-md space-y-6 rounded-lg border border-border bg-card p-8 text-center shadow-lg">
        <h1 className="text-5xl font-bold text-primary">404</h1>
        <p className="text-lg text-muted-foreground">Page Not Found</p>
        <Button asChild className="w-full">
          <Link to="/">Go back to Home</Link>
        </Button>
      </section>
    </main>
  );
};

export default NotFoundPage;
