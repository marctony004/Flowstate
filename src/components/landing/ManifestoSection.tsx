import { motion } from "framer-motion";

const lines = [
  "Every unfinished track is a conversation you walked away from.",
  "The hook you hummed at 2 a.m. deserves to be heard.",
  "Structure doesn't kill the vibe — silence does.",
  "Finish what you started. The world is waiting to press play.",
];

export default function ManifestoSection() {
  return (
    <section className="py-28 sm:py-36 lg:py-44 blend-both">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="space-y-8 sm:space-y-10 text-center">
          {lines.map((line, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{
                duration: 0.6,
                delay: i * 0.15,
                ease: [0.22, 1, 0.36, 1],
              }}
              className={
                i === lines.length - 1
                  ? "text-2xl font-bold leading-relaxed tracking-tight text-foreground sm:text-3xl lg:text-4xl"
                  : "text-xl leading-relaxed tracking-tight text-muted-foreground sm:text-2xl lg:text-3xl"
              }
            >
              {line}
            </motion.p>
          ))}
        </div>
      </div>
    </section>
  );
}
