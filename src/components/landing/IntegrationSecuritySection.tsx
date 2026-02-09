import { type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Fingerprint,
  Users,
  BadgeCheck,
  CheckCircle,
} from "lucide-react";
import {
  AbletonIcon,
  LogicProIcon,
  ProToolsIcon,
  FLStudioIcon,
  SlackIcon,
  DiscordIcon,
  GoogleDriveIcon,
  DropboxIcon,
  NotionIcon,
  SpotifyIcon,
  SoundCloudIcon,
  TrelloIcon,
} from "./IntegrationIcons";

const integrations: { name: string; category: string; icon: ReactNode; color: string }[] = [
  { name: "Ableton Live", category: "DAW", icon: <AbletonIcon className="h-7 w-7" />, color: "#000000" },
  { name: "Logic Pro", category: "DAW", icon: <LogicProIcon className="h-7 w-7" />, color: "#333333" },
  { name: "Pro Tools", category: "DAW", icon: <ProToolsIcon className="h-7 w-7" />, color: "#7ACB10" },
  { name: "FL Studio", category: "DAW", icon: <FLStudioIcon className="h-7 w-7" />, color: "#F2720C" },
  { name: "Slack", category: "Communication", icon: <SlackIcon className="h-7 w-7" />, color: "#4A154B" },
  { name: "Discord", category: "Communication", icon: <DiscordIcon className="h-7 w-7" />, color: "#5865F2" },
  { name: "Google Drive", category: "Storage", icon: <GoogleDriveIcon className="h-7 w-7" />, color: "#4285F4" },
  { name: "Dropbox", category: "Storage", icon: <DropboxIcon className="h-7 w-7" />, color: "#0061FF" },
  { name: "Notion", category: "Productivity", icon: <NotionIcon className="h-7 w-7" />, color: "#000000" },
  { name: "Spotify", category: "Distribution", icon: <SpotifyIcon className="h-7 w-7" />, color: "#1ED760" },
  { name: "SoundCloud", category: "Distribution", icon: <SoundCloudIcon className="h-7 w-7" />, color: "#FF5500" },
  { name: "Trello", category: "Productivity", icon: <TrelloIcon className="h-7 w-7" />, color: "#0052CC" },
];

const complianceBadges = [
  { label: "SOC 2", description: "Type II Certified" },
  { label: "GDPR", description: "Fully Compliant" },
  { label: "ISO 27001", description: "Certified" },
  { label: "CCPA", description: "Compliant" },
];

const securityFeatures = [
  { icon: Sparkles, text: "Your work stays private with end-to-end encryption" },
  { icon: Fingerprint, text: "Easy sign-in with SSO and your existing accounts" },
  { icon: Users, text: "Control who sees what with team permissions" },
  { icon: BadgeCheck, text: "Regularly audited so your stems stay safe" },
];

function IntegrationCard({ name, category, icon, color }: { name: string; category: string; icon: ReactNode; color: string }) {
  return (
    <div className="group flex shrink-0 flex-col items-center justify-center rounded-xl border border-border/50 bg-background/80 px-5 py-4 text-center shadow-sm transition-all hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground grayscale transition-all group-hover:grayscale-0"
        style={{ color }}
      >
        {icon}
      </div>
      <span className="mt-2 whitespace-nowrap text-xs font-medium text-foreground">
        {name}
      </span>
      <span className="text-[10px] text-muted-foreground">{category}</span>
    </div>
  );
}

export default function IntegrationSecuritySection() {
  // Double the list for seamless looping
  const tickerItems = [...integrations, ...integrations];

  return (
    <section id="integrations" className="bg-muted/30 py-20 sm:py-28 studio-grain relative blend-both">
      {/* Integrations — full-width scrolling ticker */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Works With Your Setup
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            FlowState plugs into your DAW, cloud storage, and communication
            tools — so you never leave your session to update a spreadsheet.
          </p>
        </motion.div>
      </div>

      <div className="relative mt-10 overflow-hidden">
        {/* Fade edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-80 bg-gradient-to-r from-muted/50 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-80 bg-gradient-to-l from-muted/50 to-transparent" />

        {/* Scrolling track */}
        <div className="flex w-max animate-[scroll_30s_linear_infinite] gap-4 hover:[animation-play-state:paused]">
          {tickerItems.map((item, i) => (
            <IntegrationCard key={`${item.name}-${i}`} name={item.name} category={item.category} icon={item.icon} color={item.color} />
          ))}
        </div>
      </div>

      <div className="mt-6 text-center">
        <a
          href="#"
          className="text-sm font-medium text-primary hover:underline"
        >
          View All 20+ Integrations →
        </a>
      </div>

      {/* Security — static, centered below */}
      <div className="mx-auto mt-20 max-w-4xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Built for Creative Professionals
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Your creative work deserves the best protection. We handle the
            technical stuff so you can focus on making music.
          </p>
        </motion.div>

        {/* Compliance badges */}
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {complianceBadges.map((badge, i) => (
            <motion.div
              key={badge.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
              className="flex flex-col items-center rounded-xl border border-border/50 bg-background/80 p-4 text-center shadow-sm"
            >
              <BadgeCheck className="h-6 w-6 text-primary" />
              <span className="mt-2 text-sm font-bold text-foreground">
                {badge.label}
              </span>
              <span className="text-xs text-muted-foreground">
                {badge.description}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Security features list */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {securityFeatures.map((feature, i) => (
            <motion.div
              key={feature.text}
              initial={{ opacity: 0, x: 12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
              className="flex items-start gap-3"
            >
              <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <span className="text-sm text-foreground">{feature.text}</span>
            </motion.div>
          ))}
        </div>

        <div className="mt-6 text-center">
          <a
            href="#"
            className="text-sm font-medium text-primary hover:underline"
          >
            View Security Documentation →
          </a>
        </div>
      </div>
    </section>
  );
}
