import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="space-y-2">
          <h1 className="text-5xl font-bold tracking-tight">heyits</h1>
          <p className="text-muted text-lg">
            Your daily journal, delivered by text.
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-muted max-w-xs mx-auto">
            Get a thoughtful prompt every day via SMS. Reply to journal.
            That&apos;s it.
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <Link
            href="/signup"
            className="block w-full rounded-lg bg-accent px-4 py-3 text-center text-white font-medium hover:opacity-90 transition"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="block w-full rounded-lg border border-border px-4 py-3 text-center font-medium hover:bg-accent-light transition"
          >
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}
