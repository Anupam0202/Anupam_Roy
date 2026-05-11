export default function LiveStatus() {
  return (
    <div className="glass absolute right-4 top-4 flex items-center gap-2 rounded-full px-3 py-2 text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
      <div className="relative flex h-2 w-2 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
      </div>
      OK
    </div>
  );
}
