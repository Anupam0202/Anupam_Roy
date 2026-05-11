const metadata = [
  "LangGraph", "LangChain", "RAG Pipelines", "PostgreSQL",
  "ITSM APIs", "Ticketing APIs", "Gemini API", "Vector Search", "Python",
  "FastAPI", "Docker", "AWS", "GCP", "Azure",
];

export default function SystemMetadata() {
  return (
    <div className="glass mt-16 rounded-[1.5rem] md:rounded-[2rem] p-8">
      <p className="text-xs uppercase tracking-[0.3em] text-primary">
        INFRASTRUCTURE STACK
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        {metadata.map((item) => (
          <div
            key={item}
            className="rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm text-muted-foreground backdrop-blur-xl transition hover:border-primary/30 hover:text-white cursor-default"
            data-testid={`metadata-${item.toLowerCase().replace(/\s+/g, "-")}`}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
