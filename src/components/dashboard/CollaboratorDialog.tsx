import { useEffect, useState } from "react";
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
import type { CollaboratorNote } from "@/types/database";
import { toast } from "sonner";
import { logActivity } from "@/lib/activityLogger";
import { sendNotification } from "@/lib/notifications";

const schema = z.object({
  collaborator_email: z.string().email("Valid email is required"),
  project_id: z.string().optional(),
  task_id: z.string().optional(),
  strengths: z.string().optional(),
  working_style: z.string().optional(),
  communication_pref: z.string().optional(),
  rating: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface CollaboratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collaborator?: CollaboratorNote | null;
  onSuccess: () => void;
}

export default function CollaboratorDialog({
  open,
  onOpenChange,
  collaborator,
  onSuccess,
}: CollaboratorDialogProps) {
  const { session } = useSession();
  const isEdit = !!collaborator;
  const [projects, setProjects] = useState<{ id: string; title: string }[]>([]);
  const [tasks, setTasks] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    if (!session?.user.id || !open) return;
    supabase
      .from("projects")
      .select("id, title")
      .eq("owner_id", session.user.id)
      .order("title")
      .then(({ data }) => setProjects(data ?? []));
    supabase
      .from("tasks")
      .select("id, title")
      .eq("created_by", session.user.id)
      .order("title")
      .then(({ data }) => setTasks(data ?? []));
  }, [open, session?.user.id]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      collaborator_email: "",
      project_id: "",
      task_id: "",
      strengths: "",
      working_style: "",
      communication_pref: "",
      rating: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset(
        collaborator
          ? {
            collaborator_email: "",
            project_id: collaborator.project_id ?? "",
            task_id: collaborator.task_id ?? "",
            strengths: collaborator.strengths ?? "",
            working_style: collaborator.working_style ?? "",
            communication_pref: collaborator.communication_pref ?? "",
            rating: collaborator.rating?.toString() ?? "",
            notes: collaborator.notes ?? "",
          }
          : {
            collaborator_email: "",
            project_id: "",
            task_id: "",
            strengths: "",
            working_style: "",
            communication_pref: "",
            rating: "",
            notes: "",
          }
      );
    }
  }, [open, collaborator, reset]);

  async function onSubmit(data: FormData) {
    if (!session?.user.id) return;

    const payload = {
      project_id: data.project_id || null,
      task_id: data.task_id || null,
      strengths: data.strengths || null,
      working_style: data.working_style || null,
      communication_pref: data.communication_pref || null,
      rating: data.rating ? Number(data.rating) || null : null,
      notes: data.notes || null,
    };

    if (isEdit && collaborator) {
      const { error } = await supabase
        .from("collaborator_notes")
        .update(payload)
        .eq("id", collaborator.id);
      if (error) { toast.error("Failed to update collaborator"); return; }
      toast.success("Collaborator updated");
      logActivity({
        userId: session.user.id,
        action: "update",
        entityType: "collaborator",
        entityId: collaborator.id,
        metadata: { collaborator_id: collaborator.collaborator_id },
      });
    } else {
      // Look up the collaborator's user ID by email
      const { data: userId, error: lookupError } = await supabase
        .rpc("get_user_id_by_email", { email_input: data.collaborator_email });

      if (lookupError || !userId) {
        toast.error("No user found with that email");
        return;
      }

      const { data: newCollab, error } = await supabase.from("collaborator_notes").insert({
        ...payload,
        collaborator_id: userId,
        owner_id: session.user.id,
      }).select("id").single();
      if (error) { toast.error("Failed to add collaborator"); return; }
      toast.success("Collaborator added");
      logActivity({
        userId: session.user.id,
        action: "create",
        entityType: "collaborator",
        entityId: newCollab?.id,
        metadata: { collaborator_email: data.collaborator_email },
      });

      // Notify the collaborator
      sendNotification({
        userId: userId as string,
        type: "collaborator_added",
        title: "You've been added as a collaborator",
        message: "Someone added you as a collaborator.",
        entityType: "collaborator",
        entityId: newCollab?.id,
        actorId: session.user.id,
      });
    }

    onOpenChange(false);
    onSuccess();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Collaborator" : "Add Collaborator"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="collaborator_email">
              Collaborator Email *
            </Label>
            <Input
              id="collaborator_email"
              type="email"
              placeholder="user@example.com"
              {...register("collaborator_email")}
              disabled={isEdit}
            />
            {errors.collaborator_email && (
              <p className="mt-1 text-xs text-red-500">
                {errors.collaborator_email.message}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="project_id">Project</Label>
              <select
                id="project_id"
                {...register("project_id")}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none"
              >
                <option value="">None</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="task_id">Task</Label>
              <select
                id="task_id"
                {...register("task_id")}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none"
              >
                <option value="">None</option>
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="working_style">Working Style</Label>
              <Input
                id="working_style"
                placeholder="e.g. Detail-oriented"
                {...register("working_style")}
              />
            </div>
            <div>
              <Label htmlFor="communication_pref">Communication</Label>
              <Input
                id="communication_pref"
                placeholder="e.g. Slack, Email"
                {...register("communication_pref")}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="strengths">Strengths</Label>
            <Input
              id="strengths"
              placeholder="e.g. Mixing, Vocals, Lyrics"
              {...register("strengths")}
            />
          </div>
          <div>
            <Label htmlFor="rating">Rating (1-5)</Label>
            <Input
              id="rating"
              type="number"
              min={1}
              max={5}
              {...register("rating")}
            />
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              rows={3}
              placeholder="Additional notes..."
              {...register("notes")}
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
                  : "Add Collaborator"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
