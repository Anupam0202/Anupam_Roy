import RevealMask from "@/components/motion/reveal-mask";

export default function SectionHeading({
  eyebrow,
  title,
  description,
  centered = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  centered?: boolean;
}) {
  return (
    <div className={`max-w-3xl ${centered ? "mx-auto text-center" : ""}`}>
      <p className="mb-4 text-sm uppercase tracking-[0.3em] text-primary">
        {eyebrow}
      </p>
      <RevealMask>
        <h2 className="font-display text-4xl font-bold md:text-6xl text-white">
          {title}
        </h2>
      </RevealMask>
      <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
