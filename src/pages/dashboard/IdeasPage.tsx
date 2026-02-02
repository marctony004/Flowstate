import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Search,
  Lightbulb,
  FileText,
  Mic,
  Image,
  Film,
  Star,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/context/SessionContext";
import supabase from "@/supabase";
import type { Idea } from "@/types/database";
import IdeaDialog from "@/components/dashboard/IdeaDialog";
import DeleteDialog from "@/components/dashboard/DeleteDialog";
import { toast } from "sonner";

const typeIcons: Record<string, typeof FileText> = {
  text: FileText,
  voice: Mic,
  image: Image,
  video: Film,
};

export default function IdeasPage() {
  const { session } = useSession();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editIdea, setEditIdea] = useState<Idea | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Idea | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchIdeas = useCallback(async () => {
    if (!session?.user.id) return;
    const { data } = await supabase
      .from("ideas")
      .select("*")
      .eq("owner_id", session.user.id)
      .order("created_at", { ascending: false });
    setIdeas(data ?? []);
    setLoading(false);
  }, [session?.user.id]);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  async function toggleFavorite(idea: Idea) {
    const { error } = await supabase
      .from("ideas")
      .update({ is_favorite: !idea.is_favorite })
      .eq("id", idea.id);
    if (!error) fetchIdeas();
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("ideas").delete().eq("id", deleteTarget.id);
    setDeleting(false);
    setDeleteOpen(false);
    setDeleteTarget(null);
    if (error) { toast.error("Failed to delete idea"); return; }
    toast.success("Idea deleted");
    fetchIdeas();
  }

  const filtered = ideas.filter((idea) => {
    const matchesSearch = idea.title
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || idea.type === typeFilter;
    return matchesSearch && matchesType;
  });

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
          <h1 className="text-2xl font-bold text-foreground">Ideas</h1>
          <p className="mt-1 text-muted-foreground">
            Capture and organize your creative ideas
          </p>
        </div>
        <Button
          onClick={() => {
            setEditIdea(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Idea
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search ideas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex gap-2">
          {["all", "text", "voice", "image", "video"].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                typeFilter === t
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Ideas Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
          <Lightbulb className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="mb-2 text-lg font-medium text-foreground">
            {search ? "No matching ideas" : "No ideas yet"}
          </p>
          <p className="mb-6 text-sm text-muted-foreground">
            {search
              ? "Try adjusting your search or filters."
              : "Capture your first idea — text, voice, image, or video."}
          </p>
          {!search && (
            <Button
              onClick={() => {
                setEditIdea(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Capture Idea
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((idea) => {
            const Icon = typeIcons[idea.type] ?? FileText;
            return (
              <div
                key={idea.id}
                className="group rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-md"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--warning)]/10">
                    <Icon className="h-5 w-5 text-[var(--warning)]" />
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditIdea(idea);
                        setDialogOpen(true);
                      }}
                      className="rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-foreground group-hover:opacity-100"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setDeleteTarget(idea);
                        setDeleteOpen(true);
                      }}
                      className="rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-red-500/10 hover:text-red-500 group-hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => toggleFavorite(idea)}
                      className="text-muted-foreground hover:text-[var(--warning)]"
                    >
                      <Star
                        className={`h-4 w-4 ${idea.is_favorite ? "fill-[var(--warning)] text-[var(--warning)]" : ""}`}
                      />
                    </button>
                  </div>
                </div>
                <h3 className="mb-1 text-base font-semibold text-foreground">
                  {idea.title}
                </h3>
                {idea.content && (
                  <p className="mb-3 line-clamp-3 text-sm text-muted-foreground">
                    {idea.content}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  {idea.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-accent/50 px-2 py-0.5 text-xs text-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  {new Date(idea.created_at).toLocaleDateString()}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <IdeaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        idea={editIdea}
        onSuccess={fetchIdeas}
      />

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        entityName="Idea"
        loading={deleting}
      />
    </div>
  );
}
