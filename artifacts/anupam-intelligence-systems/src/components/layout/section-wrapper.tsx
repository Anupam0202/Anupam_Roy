import { cn } from "@/lib/utils";

export default function SectionWrapper({
  children,
  className,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("relative py-20 md:py-32", className)}>
      <div className="mx-auto w-[92%] max-w-7xl">{children}</div>
    </section>
  );
}
