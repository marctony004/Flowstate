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
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/context/SessionContext";
import supabase from "@/supabase";
import { toast } from "sonner";
import { logActivity } from "@/lib/activityLogger";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  role: z.string().min(1),
});

type FormData = z.infer<typeof schema>;

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onSuccess: () => void;
}

export default function InviteMemberDialog({
  open,
  onOpenChange,
  projectId,
  onSuccess,
}: InviteMemberDialogProps) {
  const { session } = useSession();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", role: "member" },
  });

  useEffect(() => {
    if (open) reset({ email: "", role: "member" });
  }, [open, reset]);

  async function onSubmit(data: FormData) {
    if (!session?.user.id) return;

    // Look up user_id by email
    const { data: uid, error: lookupError } = await supabase.rpc(
      "get_user_id_by_email",
      { email_input: data.email }
    );

    if (lookupError || !uid) {
      toast.error("No user found with that email. They must sign up first.");
      return;
    }

    if (uid === session.user.id) {
      toast.error("You're already the project owner.");
      return;
    }

    // Check if already a member
    const { data: existing } = await supabase
      .from("project_members")
      .select("id")
      .eq("project_id", projectId)
      .eq("user_id", uid)
      .limit(1);

    if (existing && existing.length > 0) {
      toast.error("This user is already a member of this project.");
      return;
    }

    const { error } = await supabase.from("project_members").insert({
      project_id: projectId,
      user_id: uid,
      role: data.role,
    });

    if (error) {
      toast.error("Failed to add member");
      return;
    }

    toast.success(`Invited ${data.email} as ${data.role}`);
    logActivity({
      userId: session.user.id,
      action: "create",
      entityType: "collaborator",
      projectId,
      metadata: { email: data.email, role: data.role },
    });

    onOpenChange(false);
    onSuccess();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Add a collaborator to this project by their email address.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="inv-email">Email</Label>
            <Input
              id="inv-email"
              type="email"
              placeholder="collaborator@example.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="inv-role">Role</Label>
            <select
              id="inv-role"
              {...register("role")}
              className="flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="member">Member</option>
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
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
              {isSubmitting ? "Inviting..." : "Invite Member"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
