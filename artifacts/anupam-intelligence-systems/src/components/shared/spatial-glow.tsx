export default function SpatialGlow() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      <div className="absolute -left-[18vw] top-[8vh] h-72 w-[68vw] max-w-5xl -rotate-12 bg-gradient-to-r from-primary/[0.075] via-accent/[0.035] to-transparent blur-3xl" />
      <div className="absolute -right-[20vw] bottom-[10vh] h-72 w-[64vw] max-w-5xl rotate-12 bg-gradient-to-r from-secondary/[0.055] via-primary/[0.04] to-transparent blur-3xl" />
    </div>
  );
}
