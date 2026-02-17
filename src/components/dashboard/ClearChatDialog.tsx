/**
 * ClearChatDialog — Two-option modal for clearing chat history.
 *
 * Option A: Clear from Workspace (local only) — hides messages in UI via localStorage.
 * Option B: Delete Everywhere (permanent) — deletes from database with type-DELETE confirmation.
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EyeOff, Trash2, AlertTriangle, Loader2, RotateCcw } from "lucide-react";
import { useSession } from "@/context/SessionContext";
import supabase from "@/supabase";
import { toast } from "sonner";
import {
  getChatClearedAt,
  setChatClearedAt,
  clearChatClearedAt,
} from "@/lib/chatClearStorage";

interface ClearChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after either option succeeds so the chat UI can update. */
  onCleared: (type: "local" | "permanent") => void;
}

export default function ClearChatDialog({
  open,
  onOpenChange,
  onCleared,
}: ClearChatDialogProps) {
  const { session } = useSession();
  const userId = session?.user.id;

  const [step, setStep] = useState<"choose" | "confirm-delete">("choose");
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting] = useState(false);

  const isLocallyCleared = userId ? !!getChatClearedAt(userId) : false;

  function handleClose(nextOpen: boolean) {
    if (!nextOpen) {
      // Reset state on close
      setStep("choose");
      setDeleteInput("");
      setDeleting(false);
    }
    onOpenChange(nextOpen);
  }

  // Option A — local only
  function handleLocalClear() {
    if (!userId) return;
    setChatClearedAt(userId);
    toast.success("Chat cleared locally");
    onCleared("local");
    handleClose(false);
  }

  // Restore (undo Option A)
  function handleRestore() {
    if (!userId) return;
    clearChatClearedAt(userId);
    toast.success("Chat history restored");
    onCleared("local"); // triggers re-fetch
    handleClose(false);
  }

  // Option B — permanent delete
  async function handlePermanentDelete() {
    if (!userId || deleteInput !== "DELETE") return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("chat_messages")
        .delete()
        .eq("user_id", userId);

      if (error) throw error;

      // Also clear local flag since DB is now empty
      clearChatClearedAt(userId);

      toast.success("Chat deleted everywhere");
      onCleared("permanent");
      handleClose(false);
    } catch (err) {
      console.error("Failed to delete chat history:", err);
      toast.error("Failed to delete chat history. Please try again.");
      // Keep modal open so user can retry
      setDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {step === "choose" && (
          <>
            <DialogHeader>
              <DialogTitle>Clear Chat History</DialogTitle>
              <DialogDescription>
                Choose how you'd like to clear your conversation with FlowState AI.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 pt-2">
              {/* Option A — local clear */}
              <button
                onClick={handleLocalClear}
                disabled={isLocallyCleared}
                className="group flex w-full items-start gap-3 rounded-lg border border-border p-4 text-left transition-colors hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <EyeOff className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground group-hover:text-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Clear from Workspace
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Hides chat on this device. Doesn't delete anything.
                  </p>
                </div>
              </button>

              {/* Restore option (only if locally cleared) */}
              {isLocallyCleared && (
                <button
                  onClick={handleRestore}
                  className="group flex w-full items-start gap-3 rounded-lg border border-border p-4 text-left transition-colors hover:bg-muted/50"
                >
                  <RotateCcw className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-primary">
                      Restore Chat
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Show previously hidden chat messages again.
                    </p>
                  </div>
                </button>
              )}

              {/* Option B — permanent delete */}
              <button
                onClick={() => setStep("confirm-delete")}
                className="group flex w-full items-start gap-3 rounded-lg border border-red-500/30 p-4 text-left transition-colors hover:bg-red-500/5"
              >
                <Trash2 className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                <div>
                  <p className="text-sm font-medium text-red-500">
                    Delete Everywhere
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Permanently removes all chat messages from the database.
                  </p>
                </div>
              </button>
            </div>
          </>
        )}

        {step === "confirm-delete" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-500">
                <AlertTriangle className="h-5 w-5" />
                Confirm Permanent Deletion
              </DialogTitle>
              <DialogDescription>
                This permanently deletes your entire chat history with FlowState AI
                and can't be undone. Messages will be removed from all devices.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div>
                <label
                  htmlFor="delete-confirm"
                  className="mb-1.5 block text-sm font-medium text-foreground"
                >
                  Type <span className="font-bold text-red-500">DELETE</span> to confirm
                </label>
                <Input
                  id="delete-confirm"
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  placeholder="Type DELETE"
                  autoComplete="off"
                  autoFocus
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setStep("choose");
                    setDeleteInput("");
                  }}
                  disabled={deleting}
                >
                  Back
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handlePermanentDelete}
                  disabled={deleteInput !== "DELETE" || deleting}
                >
                  {deleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete Everywhere"
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
