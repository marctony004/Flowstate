import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import type { Idea } from "@/types/database";
import type { IdeaMemory } from "@/types/ideaMemory";
import {
  Brain,
  Calendar,
  CheckSquare,
  FileText,
  Image,
  Mic,
  Film,
  Sparkles,
} from "lucide-react";

interface IdeaMemoryPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  idea: Idea | null;
}

const sourceIcons: Record<string, typeof FileText> = {
  image: Image,
  voice: Mic,
  video: Film,
  document: FileText,
  text: FileText,
};

export default function IdeaMemoryPanel({
  open,
  onOpenChange,
  idea,
}: IdeaMemoryPanelProps) {
  if (!idea?.memory) return null;

  const memory = idea.memory as unknown as IdeaMemory;
  const SourceIcon = sourceIcons[memory.sourceType] ?? FileText;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]/10">
              <Brain className="h-4 w-4 text-[var(--accent)]" />
            </div>
            <div className="min-w-0 flex-1">
              <SheetTitle className="truncate">{idea.title}</SheetTitle>
              <SheetDescription>Extracted memory</SheetDescription>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Badge variant="outline" className="gap-1">
              <SourceIcon className="h-3 w-3" />
              {memory.sourceType}
            </Badge>
            <Badge variant="secondary" className="gap-1 text-[10px]">
              <Sparkles className="h-3 w-3" />
              {memory.modelUsed}
            </Badge>
          </div>
        </SheetHeader>

        <div className="space-y-5 px-4 pb-6">
          {/* Summary */}
          <section>
            <h4 className="mb-2 text-sm font-semibold text-foreground">
              Summary
            </h4>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {memory.summary}
            </p>
          </section>

          {/* Key Concepts */}
          {memory.keyConcepts.length > 0 && (
            <section>
              <h4 className="mb-2 text-sm font-semibold text-foreground">
                Key Concepts
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {memory.keyConcepts.map((concept) => (
                  <Badge
                    key={concept}
                    variant="secondary"
                    className="bg-[var(--accent)]/10 text-[var(--accent)]"
                  >
                    {concept}
                  </Badge>
                ))}
              </div>
            </section>
          )}

          {/* Extracted Dates */}
          {memory.extractedDates.length > 0 && (
            <section>
              <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <Calendar className="h-3.5 w-3.5" />
                Dates & Deadlines
              </h4>
              <ul className="space-y-1">
                {memory.extractedDates.map((date, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--warning)]" />
                    {date}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Detected Tasks */}
          {memory.detectedTasks.length > 0 && (
            <section>
              <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <CheckSquare className="h-3.5 w-3.5" />
                Detected Tasks
              </h4>
              <ul className="space-y-1.5">
                {memory.detectedTasks.map((task, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--success)]" />
                    {task}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Raw Transcript */}
          {memory.rawTranscript && (
            <Accordion type="single" collapsible>
              <AccordionItem value="transcript" className="border-none">
                <AccordionTrigger className="py-2 text-sm font-semibold">
                  Raw Transcript
                </AccordionTrigger>
                <AccordionContent>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                    {memory.rawTranscript}
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}

          {/* Extraction timestamp */}
          <p className="pt-2 text-[10px] text-muted-foreground/60">
            Extracted {new Date(memory.extractedAt).toLocaleString()}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
