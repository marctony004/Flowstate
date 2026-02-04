import { useState, useEffect, useCallback, useRef } from "react";
import { Sparkles, Calendar, FolderOpen, User, Flag, Check, X, Cpu, Cog } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { parseNaturalLanguageTask, type ParsedTask } from "@/lib/nlpTaskParser";
import { parseTaskWithAI } from "@/lib/nlpTaskService";

interface NLTaskInputProps {
  onTaskParsed: (parsed: ParsedTask & { projectMatchId?: string }) => void;
  onCancel?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  projectId?: string;
  projects?: { id: string; title: string }[];
}

export default function NLTaskInput({
  onTaskParsed,
  onCancel,
  placeholder = 'Try: "Finish vocals by Friday" or "Mix track 3 for @maya next week"',
  autoFocus = true,
  projectId,
  projects = [],
}: NLTaskInputProps) {
  const [input, setInput] = useState("");
  const [parsed, setParsed] = useState<(ParsedTask & { projectMatchId?: string; usedAI?: boolean }) | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounced AI parsing
  useEffect(() => {
    if (!input.trim()) {
      setParsed(null);
      setShowPreview(false);
      return;
    }

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Show local parse immediately for responsiveness
    const localResult = parseNaturalLanguageTask(input);
    setParsed({ ...localResult, usedAI: false });
    setShowPreview(true);

    // Then try AI parsing with debounce
    const timer = setTimeout(async () => {
      if (projects.length > 0) {
        setIsParsing(true);
        abortControllerRef.current = new AbortController();
        try {
          const aiResult = await parseTaskWithAI(input, projects);
          setParsed(aiResult);
        } catch (err) {
          // Keep local result on error
          console.warn("AI parsing failed:", err);
        } finally {
          setIsParsing(false);
        }
      }
    }, 500); // Longer debounce for AI calls

    return () => {
      clearTimeout(timer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [input, projects]);

  const handleSubmit = useCallback(() => {
    if (parsed && parsed.title) {
      onTaskParsed(parsed);
      setInput("");
      setParsed(null);
      setShowPreview(false);
    }
  }, [parsed, onTaskParsed]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "Escape") {
      onCancel?.();
    }
  };

  const priorityColors = {
    high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    low: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Sparkles className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="pl-10 pr-4"
        />
      </div>

      {/* Parsed Preview */}
      {showPreview && parsed && parsed.title && (
        <div className="rounded-lg border border-border bg-muted/50 p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                Parsed Task Preview
              </span>
              {isParsing ? (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <Cog className="h-3 w-3 animate-spin" />
                  Analyzing...
                </Badge>
              ) : parsed.usedAI ? (
                <Badge variant="default" className="gap-1 text-xs bg-primary/80">
                  <Cpu className="h-3 w-3" />
                  AI
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <Cog className="h-3 w-3" />
                  Local
                </Badge>
              )}
            </div>
            <Badge variant="outline" className="text-xs">
              {Math.round(parsed.confidence * 100)}% confidence
            </Badge>
          </div>

          <div className="space-y-2">
            {/* Title */}
            <div className="text-sm font-medium text-foreground">
              {parsed.title}
            </div>

            {/* Extracted fields */}
            <div className="flex flex-wrap gap-2">
              {parsed.dueDate && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <Calendar className="h-3 w-3" />
                  {parsed.dueDateText || parsed.dueDate}
                </Badge>
              )}
              {parsed.projectHint && !projectId && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <FolderOpen className="h-3 w-3" />
                  {parsed.projectHint}
                </Badge>
              )}
              {parsed.assigneeHint && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <User className="h-3 w-3" />
                  @{parsed.assigneeHint}
                </Badge>
              )}
              {parsed.priority && (
                <Badge className={`gap-1 text-xs ${priorityColors[parsed.priority]}`}>
                  <Flag className="h-3 w-3" />
                  {parsed.priority}
                </Badge>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex justify-end gap-2">
            {onCancel && (
              <Button variant="ghost" size="sm" onClick={onCancel}>
                <X className="mr-1 h-3 w-3" />
                Cancel
              </Button>
            )}
            <Button size="sm" onClick={handleSubmit}>
              <Check className="mr-1 h-3 w-3" />
              Create Task
            </Button>
          </div>
        </div>
      )}

      {/* Help text */}
      {!showPreview && (
        <p className="text-xs text-muted-foreground">
          Type naturally! Include dates like "by Friday" or "next week", mention projects with "for [project name]",
          and tag people with @name.
        </p>
      )}
    </div>
  );
}
