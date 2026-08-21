import { motion } from "framer-motion";

interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  align?: "left" | "center";
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
}: SectionHeaderProps) {
  const centered = align === "center";

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55 }}
      className={centered ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}
    >
      <p className="mb-3 text-xs font-semibold uppercase text-primary">
        {eyebrow}
      </p>
      <h2 className="font-display text-4xl font-bold leading-tight text-white md:text-6xl">
        {title}
      </h2>
      <p className="mt-5 text-base leading-relaxed text-muted-foreground md:text-lg">
        {description}
      </p>
    </motion.div>
  );
}
