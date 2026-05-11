export default function GlowOrb() {
  return (
    <>
      <div className="pointer-events-none absolute left-0 top-24 h-56 w-[58rem] -rotate-12 bg-gradient-to-r from-primary/10 via-accent/6 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute right-0 bottom-10 h-48 w-[48rem] rotate-6 bg-gradient-to-r from-secondary/10 via-primary/5 to-transparent blur-3xl" />
    </>
  );
}
