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
import type { Project } from "@/types/database";
import { toast } from "sonner";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  genre: z.string().optional(),
  bpm: z.string().optional(),
  key_signature: z.string().optional(),
  due_date: z.string().optional(),
  status: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project | null;
  onSuccess: () => void;
}

export default function ProjectDialog({
  open,
  onOpenChange,
  project,
  onSuccess,
}: ProjectDialogProps) {
  const { session } = useSession();
  const isEdit = !!project;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      genre: "",
      bpm: "",
      key_signature: "",
      due_date: "",
      status: "active",
    },
  });

  useEffect(() => {
    if (open) {
      reset(
        project
          ? {
              title: project.title,
              description: project.description ?? "",
              genre: project.genre ?? "",
              bpm: project.bpm?.toString() ?? "",
              key_signature: project.key_signature ?? "",
              due_date: project.due_date ?? "",
              status: project.status,
            }
          : {
              title: "",
              description: "",
              genre: "",
              bpm: "",
              key_signature: "",
              due_date: "",
              status: "active",
            }
      );
    }
  }, [open, project, reset]);

  async function onSubmit(data: FormData) {
    if (!session?.user.id) return;

    const payload = {
      title: data.title,
      description: data.description || null,
      genre: data.genre || null,
      bpm: data.bpm ? Number(data.bpm) || null : null,
      key_signature: data.key_signature || null,
      due_date: data.due_date || null,
      status: data.status || "active",
    };

    if (isEdit && project) {
      const { error } = await supabase.from("projects").update(payload).eq("id", project.id);
      if (error) { toast.error("Failed to update project"); return; }
      toast.success("Project updated");
    } else {
      const { error } = await supabase
        .from("projects")
        .insert({ ...payload, owner_id: session.user.id });
      if (error) { toast.error("Failed to create project"); return; }
      toast.success("Project created");
    }

    onOpenChange(false);
    onSuccess();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Project" : "New Project"}</DialogTitle>
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
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={3} {...register("description")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="genre">Genre</Label>
              <Input
                id="genre"
                placeholder="e.g. Hip-Hop, Pop"
                {...register("genre")}
              />
            </div>
            <div>
              <Label htmlFor="bpm">BPM</Label>
              <Input
                id="bpm"
                type="number"
                placeholder="120"
                {...register("bpm")}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="key_signature">Key</Label>
              <Input
                id="key_signature"
                placeholder="e.g. C Major"
                {...register("key_signature")}
              />
            </div>
            <div>
              <Label htmlFor="due_date">Due Date</Label>
              <Input id="due_date" type="date" {...register("due_date")} />
            </div>
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              {...register("status")}
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none"
            >
              <option value="active">Active</option>
              <option value="planning">Planning</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
            </select>
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
                  : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
