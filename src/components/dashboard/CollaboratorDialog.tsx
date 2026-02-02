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
import type { CollaboratorNote } from "@/types/database";

const schema = z.object({
  collaborator_id: z.string().min(1, "Collaborator ID is required"),
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

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      collaborator_id: "",
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
              collaborator_id: collaborator.collaborator_id,
              strengths: collaborator.strengths ?? "",
              working_style: collaborator.working_style ?? "",
              communication_pref: collaborator.communication_pref ?? "",
              rating: collaborator.rating?.toString() ?? "",
              notes: collaborator.notes ?? "",
            }
          : {
              collaborator_id: "",
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
      strengths: data.strengths || null,
      working_style: data.working_style || null,
      communication_pref: data.communication_pref || null,
      rating: data.rating ? Number(data.rating) || null : null,
      notes: data.notes || null,
    };

    if (isEdit && collaborator) {
      await supabase
        .from("collaborator_notes")
        .update(payload)
        .eq("id", collaborator.id);
    } else {
      await supabase.from("collaborator_notes").insert({
        ...payload,
        collaborator_id: data.collaborator_id,
        owner_id: session.user.id,
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
            <Label htmlFor="collaborator_id">
              Collaborator Email / ID *
            </Label>
            <Input
              id="collaborator_id"
              {...register("collaborator_id")}
              disabled={isEdit}
            />
            {errors.collaborator_id && (
              <p className="mt-1 text-xs text-red-500">
                {errors.collaborator_id.message}
              </p>
            )}
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
