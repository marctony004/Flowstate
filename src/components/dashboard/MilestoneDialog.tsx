import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/context/SessionContext";
import supabase from "@/supabase";
import { toast } from "sonner";
import { logActivity } from "@/lib/activityLogger";
import type { Milestone } from "@/types/database";

const schema = z.object({
  title: z.string().min(1, "Title is required").max(120),
  description: z.string().max(500).optional(),
  due_date: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface MilestoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  milestone?: Milestone | null;
  projectId: string;
  onSuccess: () => void;
}

export default function MilestoneDialog({
  open,
  onOpenChange,
  milestone,
  projectId,
  onSuccess,
}: MilestoneDialogProps) {
  const { session } = useSession();
  const isEdit = !!milestone;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (open) {
      reset({
        title: milestone?.title ?? "",
        description: milestone?.description ?? "",
        due_date: milestone?.due_date?.slice(0, 10) ?? "",
      });
    }
  }, [open, milestone, reset]);

  async function onSubmit(data: FormData) {
    if (!session?.user.id) return;

    if (isEdit && milestone) {
      const { error } = await supabase
        .from("milestones")
        .update({
          title: data.title,
          description: data.description || null,
          due_date: data.due_date || null,
        })
        .eq("id", milestone.id);

      if (error) {
        toast.error("Failed to update milestone");
        return;
      }
      toast.success("Milestone updated");
      logActivity({
        userId: session.user.id,
        action: "update",
        entityType: "project",
        entityId: milestone.id,
        projectId,
        metadata: { title: data.title },
      });
    } else {
      // Get max position
      const { data: existing } = await supabase
        .from("milestones")
        .select("position")
        .eq("project_id", projectId)
        .order("position", { ascending: false })
        .limit(1);

      const nextPos = (existing?.[0]?.position ?? -1) + 1;

      const { error } = await supabase.from("milestones").insert({
        project_id: projectId,
        title: data.title,
        description: data.description || null,
        due_date: data.due_date || null,
        position: nextPos,
      });

      if (error) {
        toast.error("Failed to create milestone");
        return;
      }
      toast.success("Milestone created");
      logActivity({
        userId: session.user.id,
        action: "create",
        entityType: "project",
        entityId: projectId,
        projectId,
        metadata: { title: data.title },
      });
    }

    onOpenChange(false);
    onSuccess();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Milestone" : "New Milestone"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="ms-title">Title</Label>
            <Input
              id="ms-title"
              placeholder="e.g. Final mix complete"
              {...register("title")}
            />
            {errors.title && (
              <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="ms-desc">Description (optional)</Label>
            <Input
              id="ms-desc"
              placeholder="What does this milestone represent?"
              {...register("description")}
            />
          </div>

          <div>
            <Label htmlFor="ms-due">Due date (optional)</Label>
            <Input id="ms-due" type="date" {...register("due_date")} />
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
                  : "Create Milestone"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
