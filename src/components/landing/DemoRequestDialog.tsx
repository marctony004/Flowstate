import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle } from "lucide-react";

const demoSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Invalid email address"),
  company: z.string().optional(),
  useCase: z.string().min(1, "Please select a use case"),
  message: z.string().optional(),
});

type DemoFormData = z.infer<typeof demoSchema>;

interface DemoRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DemoRequestDialog({ open, onOpenChange }: DemoRequestDialogProps) {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DemoFormData>({
    resolver: zodResolver(demoSchema),
    defaultValues: { name: "", email: "", company: "", useCase: "", message: "" },
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onSubmit = async (_data: DemoFormData) => {
    // Simulate API call
    await new Promise((r) => setTimeout(r, 800));
    setSubmitted(true);
  };

  const handleClose = (value: boolean) => {
    if (!value) {
      setSubmitted(false);
      reset();
    }
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {submitted ? (
          <div className="flex flex-col items-center py-8 text-center">
            <CheckCircle className="h-12 w-12 text-[var(--success)]" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">Demo Request Received</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              We'll be in touch within 24 hours to schedule your personalized demo.
            </p>
            <Button className="mt-6" onClick={() => handleClose(false)}>
              Close
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Schedule a Demo</DialogTitle>
              <DialogDescription>
                See how FlowState can streamline your creative workflow. Fill out the form and we'll reach out to schedule a personalized walkthrough.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="mt-2 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="demo-name">Name *</Label>
                <Input id="demo-name" placeholder="Your name" {...register("name")} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="demo-email">Email *</Label>
                <Input id="demo-email" type="email" placeholder="you@example.com" {...register("email")} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="demo-company">Company / Project</Label>
                <Input id="demo-company" placeholder="Optional" {...register("company")} />
              </div>
              <div className="space-y-1.5">
                <Label>Use Case *</Label>
                <Select onValueChange={(v: string) => setValue("useCase", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your primary use case" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="music-production">Music Production</SelectItem>
                    <SelectItem value="band-collaboration">Band / Group Collaboration</SelectItem>
                    <SelectItem value="label-management">Label / Studio Management</SelectItem>
                    <SelectItem value="freelance-production">Freelance Production</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.useCase && <p className="text-xs text-destructive">{errors.useCase.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="demo-message">Anything else?</Label>
                <Textarea id="demo-message" placeholder="Tell us about your workflow..." rows={3} {...register("message")} />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Request Demo"}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
