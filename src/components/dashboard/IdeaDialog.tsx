import { useEffect, useState, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
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
import { Upload, X, Loader2 } from "lucide-react";
import { logActivity } from "@/lib/activityLogger";
import { useEmbedding } from "@/hooks/useEmbedding";

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
  const { embedIdea } = useEmbedding();
  const isEdit = !!idea;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", content: "", type: "text", tags: "" },
  });

  const watchedType = useWatch({ control, name: "type" });
  const showFileInput = ["voice", "image", "video", "document"].includes(watchedType ?? "");

  useEffect(() => {
    if (open) {
      setFile(null);
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

  async function uploadFile(userId: string): Promise<{
    file_url: string;
    file_type: string;
    file_size_bytes: number;
  } | null> {
    if (!file) return null;
    const path = `${userId}/${crypto.randomUUID()}-${file.name}`;
    setUploading(true);
    const { error } = await supabase.storage
      .from("idea-files")
      .upload(path, file);
    setUploading(false);
    if (error) {
      toast.error("File upload failed");
      return null;
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from("idea-files").getPublicUrl(path);
    return {
      file_url: publicUrl,
      file_type: file.type,
      file_size_bytes: file.size,
    };
  }

  async function onSubmit(data: FormData) {
    if (!session?.user.id) return;

    const tags = data.tags
      ? data.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
      : null;

    const payload: Record<string, unknown> = {
      title: data.title,
      content: data.content || null,
      type: data.type || "text",
      tags,
    };

    // Upload file if one was selected
    if (file) {
      const fileData = await uploadFile(session.user.id);
      if (!fileData) return;
      Object.assign(payload, fileData);
    }

    if (isEdit && idea) {
      const { error } = await supabase.from("ideas").update(payload).eq("id", idea.id);
      if (error) { toast.error("Failed to update idea"); return; }
      toast.success("Idea updated");
      logActivity({
        userId: session.user.id,
        action: "update",
        entityType: "idea",
        entityId: idea.id,
        metadata: { title: data.title },
      });

      // Regenerate embedding with updated content
      embedIdea(idea.id, {
        title: data.title,
        content: data.content,
        type: data.type,
        tags: tags ?? undefined,
      });

      // Fire-and-forget: extract memory from newly uploaded file
      if (file && payload.file_url && payload.file_type) {
        supabase.functions
          .invoke("extract-idea-memory", {
            body: {
              ideaId: idea.id,
              fileUrl: payload.file_url,
              fileType: payload.file_type,
              userId: session.user.id,
              ideaTitle: data.title,
              ideaContent: data.content || null,
            },
          })
          .catch(() => {});
        toast.info("Extracting content from your file...", {
          description: "Summary and transcript will appear shortly.",
        });
      }
    } else {
      const { data: newIdea, error } = await supabase
        .from("ideas")
        .insert({ ...payload, owner_id: session.user.id })
        .select("id")
        .single();
      if (error) { toast.error("Failed to capture idea"); return; }
      toast.success("Idea captured");
      logActivity({
        userId: session.user.id,
        action: "create",
        entityType: "idea",
        entityId: newIdea?.id,
        metadata: { title: data.title },
      });

      // Generate embedding in background
      if (newIdea?.id) {
        embedIdea(newIdea.id, {
          title: data.title,
          content: data.content,
          type: data.type,
          tags: tags ?? undefined,
        });

        // Fire-and-forget: extract memory from uploaded file
        if (file && payload.file_url && payload.file_type) {
          supabase.functions
            .invoke("extract-idea-memory", {
              body: {
                ideaId: newIdea.id,
                fileUrl: payload.file_url,
                fileType: payload.file_type,
                userId: session.user.id,
                ideaTitle: data.title,
                ideaContent: data.content || null,
              },
            })
            .catch(() => {});
          toast.info("Extracting content from your file...", {
            description: "Summary and transcript will appear shortly.",
          });
        }
      }
    }

    onOpenChange(false);
    onSuccess();
  }

  const acceptMap: Record<string, string> = {
    voice: "audio/*",
    image: "image/*",
    video: "video/*",
    document: "application/pdf",
  };

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
              <option value="document">Document</option>
            </select>
          </div>

          {/* File upload for non-text types */}
          {showFileInput && (
            <div>
              <Label>File</Label>
              {isEdit && idea?.file_url && !file && (
                <p className="mb-2 text-xs text-muted-foreground">
                  Current file:{" "}
                  <a
                    href={idea.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    {idea.file_url.split("/").pop()}
                  </a>
                </p>
              )}
              {file ? (
                <div className="flex items-center gap-2 rounded-md border border-border bg-accent/30 px-3 py-2 text-sm">
                  <span className="flex-1 truncate">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(0)} KB
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border px-3 py-4 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
                >
                  <Upload className="h-4 w-4" />
                  Choose file
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept={acceptMap[watchedType ?? ""] ?? ""}
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setFile(f);
                }}
              />
            </div>
          )}

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
            <Button type="submit" disabled={isSubmitting || uploading}>
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : isSubmitting ? (
                "Saving..."
              ) : isEdit ? (
                "Save Changes"
              ) : (
                "Capture Idea"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
