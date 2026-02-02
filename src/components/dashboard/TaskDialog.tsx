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
import type { Task } from "@/types/database";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  due_date: z.string().optional(),
  project_id: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  projectId?: string;
  onSuccess: () => void;
}

export default function TaskDialog({
  open,
  onOpenChange,
  task,
  projectId,
  onSuccess,
}: TaskDialogProps) {
  const { session } = useSession();
  const isEdit = !!task;

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
      status: "todo",
      priority: "medium",
      due_date: "",
      project_id: projectId ?? "",
    },
  });

  useEffect(() => {
    if (open) {
      reset(
        task
          ? {
              title: task.title,
              description: task.description ?? "",
              status: task.status,
              priority: task.priority,
              due_date: task.due_date ?? "",
              project_id: task.project_id,
            }
          : {
              title: "",
              description: "",
              status: "todo",
              priority: "medium",
              due_date: "",
              project_id: projectId ?? "",
            }
      );
    }
  }, [open, task, projectId, reset]);

  async function onSubmit(data: FormData) {
    if (!session?.user.id) return;

    const payload = {
      title: data.title,
      description: data.description || null,
      status: data.status || "todo",
      priority: data.priority || "medium",
      due_date: data.due_date || null,
    };

    if (isEdit && task) {
      await supabase.from("tasks").update(payload).eq("id", task.id);
    } else {
      await supabase.from("tasks").insert({
        ...payload,
        project_id: data.project_id || projectId!,
        created_by: session.user.id,
      });
    }

    onOpenChange(false);
    onSuccess();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Task" : "New Task"}</DialogTitle>
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
            <Textarea
              id="description"
              rows={3}
              {...register("description")}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                {...register("status")}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                {...register("priority")}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div>
            <Label htmlFor="due_date">Due Date</Label>
            <Input id="due_date" type="date" {...register("due_date")} />
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
                  : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
