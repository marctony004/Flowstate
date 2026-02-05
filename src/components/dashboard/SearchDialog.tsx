import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Lightbulb,
  CheckSquare,
  FolderKanban,
  Loader2,
  Sparkles,
  Command,
} from "lucide-react";
import { useSession } from "@/context/SessionContext";
import { semanticSearch, type SearchResult } from "@/lib/semanticSearch";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const entityIcons = {
  idea: Lightbulb,
  task: CheckSquare,
  project: FolderKanban,
};

const entityColors = {
  idea: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  task: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  project: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

export default function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const { session } = useSession();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
      setHasSearched(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!query.trim() || !session?.user.id) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setHasSearched(true);
      abortControllerRef.current = new AbortController();

      try {
        const searchResults = await semanticSearch(query, session.user.id, {
          limit: 10,
          threshold: 0.25,
        });
        setResults(searchResults);
        setSelectedIndex(0);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [query, session?.user.id]);

  // Navigate to result
  const navigateToResult = useCallback(
    (result: SearchResult) => {
      onOpenChange(false);

      switch (result.entityType) {
        case "idea":
          navigate("/dashboard/ideas");
          break;
        case "task":
          if (result.metadata?.project_id) {
            navigate(`/dashboard/projects/${result.metadata.project_id}`);
          } else {
            navigate("/dashboard/tasks");
          }
          break;
        case "project":
          navigate(`/dashboard/projects/${result.entityId}`);
          break;
      }
    },
    [navigate, onOpenChange]
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && results[selectedIndex]) {
        e.preventDefault();
        navigateToResult(results[selectedIndex]);
      } else if (e.key === "Escape") {
        onOpenChange(false);
      }
    },
    [results, selectedIndex, navigateToResult, onOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 p-0 overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center border-b border-border px-4">
          {isSearching ? (
            <Loader2 className="h-5 w-5 shrink-0 text-muted-foreground animate-spin" />
          ) : (
            <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
          )}
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search by meaning... (e.g., 'upbeat vocal ideas')"
            className="border-0 bg-transparent px-4 py-6 text-base focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <Badge variant="secondary" className="shrink-0 gap-1">
            <Sparkles className="h-3 w-3" />
            AI
          </Badge>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto">
          {!hasSearched && !query && (
            <div className="p-8 text-center">
              <Sparkles className="mx-auto h-8 w-8 text-primary/50 mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">
                Semantic Search
              </p>
              <p className="text-xs text-muted-foreground">
                Search by meaning, not just keywords.
                <br />
                Try "chill lo-fi ideas" or "unfinished vocal tracks"
              </p>
            </div>
          )}

          {hasSearched && !isSearching && results.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              <p className="text-sm">No results found for "{query}"</p>
              <p className="text-xs mt-1">
                Try different words or create embeddings first
              </p>
            </div>
          )}

          {results.length > 0 && (
            <ul className="py-2">
              {results.map((result, index) => {
                const Icon = entityIcons[result.entityType];
                const colorClass = entityColors[result.entityType];
                const isSelected = index === selectedIndex;

                return (
                  <li key={`${result.entityType}-${result.entityId}`}>
                    <button
                      onClick={() => navigateToResult(result)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors ${
                        isSelected
                          ? "bg-accent"
                          : "hover:bg-accent/50"
                      }`}
                    >
                      <div
                        className={`mt-0.5 rounded-md p-1.5 ${colorClass}`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-foreground truncate">
                            {result.metadata?.title || "Untitled"}
                          </span>
                          <Badge variant="outline" className="text-[10px] shrink-0">
                            {Math.round(result.similarity * 100)}%
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {result.content}
                        </p>
                        {result.metadata?.status && (
                          <Badge
                            variant="secondary"
                            className="mt-1 text-[10px]"
                          >
                            {result.metadata.status}
                          </Badge>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-4 py-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px]">
                ↑
              </kbd>
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px]">
                ↓
              </kbd>
              <span className="ml-1">Navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px]">
                ↵
              </kbd>
              <span className="ml-1">Open</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px]">
                esc
              </kbd>
              <span className="ml-1">Close</span>
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Command className="h-3 w-3" />
            <span>K to search anytime</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook to register global Cmd+K shortcut
 */
export function useSearchShortcut(onOpen: () => void) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpen();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onOpen]);
}
