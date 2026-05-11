import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <div className="glass rounded-2xl p-10 w-full max-w-md mx-4 text-center">
        <AlertCircle className="h-10 w-10 text-primary mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-3">404 — Page Not Found</h1>
        <p className="text-sm text-muted-foreground">
          This route doesn't exist. Navigate back to the main system.
        </p>
        <a
          href="/"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-black transition hover:opacity-90"
        >
          Return Home
        </a>
      </div>
    </div>
  );
}
