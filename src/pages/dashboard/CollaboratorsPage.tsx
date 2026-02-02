import { useEffect, useState } from "react";
import { Users, Plus, Search, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/context/SessionContext";
import supabase from "@/supabase";
import type { CollaboratorNote } from "@/types/database";

interface CollaboratorWithProfile extends CollaboratorNote {
  profile?: {
    display_name: string;
    avatar_url: string | null;
    role: string;
  };
}

export default function CollaboratorsPage() {
  const { session } = useSession();
  const [collaborators, setCollaborators] = useState<
    CollaboratorWithProfile[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!session?.user.id) return;

    async function fetchCollaborators() {
      const { data } = await supabase
        .from("collaborator_notes")
        .select("*")
        .eq("owner_id", session!.user.id)
        .order("updated_at", { ascending: false });

      setCollaborators(data ?? []);
      setLoading(false);
    }

    fetchCollaborators();
  }, [session?.user.id]);

  const filtered = collaborators.filter((c) =>
    (c.strengths ?? "").toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Collaborators</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your creative network
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Collaborator
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search collaborators..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Collaborators Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
          <Users className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="mb-2 text-lg font-medium text-foreground">
            {search ? "No matching collaborators" : "No collaborators yet"}
          </p>
          <p className="mb-6 text-sm text-muted-foreground">
            {search
              ? "Try adjusting your search."
              : "Add collaborators to track your creative network."}
          </p>
          {!search && (
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Collaborator
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((collab) => (
            <div
              key={collab.id}
              className="rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-md"
            >
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--accent)]/10 text-sm font-bold text-[var(--accent)]">
                  {collab.collaborator_id.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    Collaborator
                  </p>
                  {collab.working_style && (
                    <p className="truncate text-xs text-muted-foreground">
                      {collab.working_style}
                    </p>
                  )}
                </div>
                {collab.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-[var(--warning)] text-[var(--warning)]" />
                    <span className="text-xs font-medium text-foreground">
                      {collab.rating}
                    </span>
                  </div>
                )}
              </div>
              {collab.strengths && (
                <p className="mb-2 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">
                    Strengths:
                  </span>{" "}
                  {collab.strengths}
                </p>
              )}
              {collab.notes && (
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {collab.notes}
                </p>
              )}
              {collab.communication_pref && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Prefers: {collab.communication_pref}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
