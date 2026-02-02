import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useSession } from "@/context/SessionContext";
import supabase from "@/supabase";
import type { Idea } from "@/types/database";
import { toast } from "sonner";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().optional(),
  type: z.string().optional(),
  tags: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface IdeaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  idea?: Idea | null;
  onSuccess: () => void;
}

export default function IdeaDialog({
  open,
  onOpenChange,
  idea,
  onSuccess,
}: IdeaDialogProps) {
  const { session } = useSession();
  const isEdit = !!idea;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", content: "", type: "text", tags: "" },
  });

  useEffect(() => {
    if (open) {
      reset(
        idea
          ? {
              title: idea.title,
              content: idea.content ?? "",
              type: idea.type,
              tags: idea.tags?.join(", ") ?? "",
            }
          : { title: "", content: "", type: "text", tags: "" }
      );
    }
  }, [open, idea, reset]);

  async function onSubmit(data: FormData) {
    if (!session?.user.id) return;

    const tags = data.tags
      ? data.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : null;

    const payload = {
      title: data.title,
      content: data.content || null,
      type: data.type || "text",
      tags,
    };

    if (isEdit && idea) {
      const { error } = await supabase.from("ideas").update(payload).eq("id", idea.id);
      if (error) { toast.error("Failed to update idea"); return; }
      toast.success("Idea updated");
    } else {
      const { error } = await supabase
        .from("ideas")
        .insert({ ...payload, owner_id: session.user.id });
      if (error) { toast.error("Failed to capture idea"); return; }
      toast.success("Idea captured");
    }

    onOpenChange(false);
    onSuccess();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Idea" : "New Idea"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input id="title" {...register("title")} />
            {errors.title && (
              <p className="mt-1 text-xs text-red-500">
                {errors.title.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="type">Type</Label>
            <select
              id="type"
              {...register("type")}
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none"
            >
              <option value="text">Text</option>
              <option value="voice">Voice</option>
              <option value="image">Image</option>
              <option value="video">Video</option>
            </select>
          </div>
          <div>
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              rows={4}
              placeholder="Describe your idea..."
              {...register("content")}
            />
          </div>
          <div>
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              placeholder="comma separated, e.g. melody, hook, chorus"
              {...register("tags")}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : isEdit
                  ? "Save Changes"
                  : "Capture Idea"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
