import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, User, Camera, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useSession } from "@/context/SessionContext";
import supabase from "@/supabase";
import { toast } from "sonner";

// Validation schema
const profileSchema = z.object({
  display_name: z
    .string()
    .min(2, "Display name must be at least 2 characters")
    .max(50, "Display name must be less than 50 characters"),
  bio: z
    .string()
    .max(500, "Bio must be less than 500 characters")
    .optional()
    .or(z.literal("")),
  avatar_url: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
  timezone: z.string().optional().or(z.literal("")),
  role: z.enum(["creator", "producer", "engineer", "songwriter", "artist", "other"]),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const roleOptions = [
  { value: "creator", label: "Creator" },
  { value: "producer", label: "Producer" },
  { value: "engineer", label: "Engineer" },
  { value: "songwriter", label: "Songwriter" },
  { value: "artist", label: "Artist" },
  { value: "other", label: "Other" },
];

const timezoneOptions = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HT)" },
  { value: "Europe/London", label: "London (GMT)" },
  { value: "Europe/Paris", label: "Paris (CET)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST)" },
  { value: "UTC", label: "UTC" },
];

export default function SettingsPage() {
  const { session, profile, refreshProfile } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [notifPrefs, setNotifPrefs] = useState({
    task_assigned: true,
    member_invited: true,
    collaborator_added: true,
    ai_action: true,
  });

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      display_name: "",
      bio: "",
      avatar_url: "",
      timezone: "",
      role: "creator",
    },
  });

  // Load profile data — also clear loading if profile is null (fetch failed / still pending)
  useEffect(() => {
    if (profile) {
      form.reset({
        display_name: profile.display_name || "",
        bio: profile.bio || "",
        avatar_url: profile.avatar_url || "",
        timezone: profile.timezone || "",
        role: (profile.role as ProfileFormValues["role"]) || "creator",
      });
      setAvatarPreview(profile.avatar_url);
      if (profile.notification_preferences && typeof profile.notification_preferences === "object") {
        const prefs = profile.notification_preferences as Record<string, boolean>;
        setNotifPrefs((prev) => ({ ...prev, ...prefs }));
      }
      setLoading(false);
    }
  }, [profile, form]);

  // Safety timeout — never show spinner for more than 4 seconds even if profile hasn't loaded
  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 4000);
    return () => clearTimeout(timeout);
  }, []);

  // Watch avatar URL for preview
  const watchedAvatarUrl = form.watch("avatar_url");
  useEffect(() => {
    if (watchedAvatarUrl && watchedAvatarUrl !== avatarPreview) {
      // Validate URL before setting preview
      try {
        new URL(watchedAvatarUrl);
        setAvatarPreview(watchedAvatarUrl);
      } catch {
        // Invalid URL, don't update preview
      }
    } else if (!watchedAvatarUrl) {
      setAvatarPreview(null);
    }
  }, [watchedAvatarUrl]);

  async function onSubmit(data: ProfileFormValues) {
    if (!session?.user.id) return;
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: data.display_name,
        bio: data.bio || null,
        avatar_url: data.avatar_url || null,
        timezone: data.timezone || null,
        role: data.role,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.user.id);

    setSaving(false);

    if (error) {
      toast.error("Failed to save profile");
      console.error(error);
      return;
    }

    toast.success("Profile saved successfully");
    // Refresh profile in context so changes appear everywhere
    await refreshProfile();
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your profile and preferences
        </p>
      </div>

      {/* Profile Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-6 text-lg font-semibold text-foreground">Profile</h2>

            {/* Avatar Section */}
            <div className="mb-6 flex items-start gap-6">
              <div className="relative">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-primary">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      className="h-full w-full object-cover"
                      onError={() => setAvatarPreview(null)}
                    />
                  ) : (
                    <User className="h-10 w-10" />
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 rounded-full bg-card p-1 shadow-sm">
                  <Camera className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="flex-1">
                <FormField
                  control={form.control}
                  name="avatar_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Avatar URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com/avatar.jpg"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter a URL to an image for your profile picture
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4">
              {/* Display Name */}
              <FormField
                control={form.control}
                name="display_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Your name" {...field} />
                    </FormControl>
                    <FormDescription>
                      This is how you'll appear throughout the app
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Role */}
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Creative Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roleOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      What best describes your creative work
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Bio */}
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us about yourself and your creative journey..."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {field.value?.length || 0}/500 characters
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Timezone */}
              <FormField
                control={form.control}
                name="timezone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timezone</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your timezone" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {timezoneOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Used for scheduling and time displays
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={saving} className="mt-2">
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </form>
      </Form>

      {/* Account Info */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Account</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span className="text-foreground">{session?.user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Plan</span>
            <span className="font-medium text-primary capitalize">
              {profile?.plan ?? "free"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Member since</span>
            <span className="text-foreground">
              {profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString()
                : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          Choose which notifications you'd like to receive.
        </p>
        <div className="space-y-4">
          {([
            { key: "task_assigned" as const, label: "Task assigned to you", description: "When someone assigns a task to you" },
            { key: "member_invited" as const, label: "Invited to a project", description: "When you're added as a project member" },
            { key: "collaborator_added" as const, label: "Collaborator added", description: "When a new collaborator is added" },
            { key: "ai_action" as const, label: "AI assistant actions", description: "When FlowState AI creates items for you" },
          ]).map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
              <Switch
                checked={notifPrefs[item.key]}
                onCheckedChange={async (checked) => {
                  const updated = { ...notifPrefs, [item.key]: checked };
                  setNotifPrefs(updated);
                  if (session?.user.id) {
                    const { error } = await supabase
                      .from("profiles")
                      .update({ notification_preferences: updated })
                      .eq("id", session.user.id);
                    if (error) {
                      toast.error("Failed to update notification preferences");
                      setNotifPrefs(notifPrefs);
                    }
                  }
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-xl border border-red-500/30 bg-card p-6">
        <h2 className="mb-2 text-lg font-semibold text-red-500">Danger Zone</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Sign out of your account on this device.
        </p>
        <Button
          variant="outline"
          className="border-red-500/50 text-red-500 hover:bg-red-500/10"
          onClick={() => supabase.auth.signOut()}
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
}
