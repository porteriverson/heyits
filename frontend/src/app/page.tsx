import Link from "next/link";
import PublicNav from "@/components/public-nav";

export default function Home() {
  return (
    <>
      <PublicNav />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Gradient orbs */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-accent/6 blur-3xl" />
          <div className="absolute top-[30%] right-[10%] w-[300px] h-[300px] rounded-full bg-yellow/8 blur-3xl" />
          <div className="absolute bottom-[20%] left-[15%] w-[250px] h-[250px] rounded-full bg-accent/5 blur-2xl" />
        </div>

        <div
          className="max-w-3xl mx-auto px-6 text-center"
          style={{ animation: "heroFadeIn 0.8s ease-out" }}
        >
          <div className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full border border-accent/20 bg-accent-light text-accent text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-accent" />
            Journaling made effortless
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.1]">
            heyits...{" "}
            <span className="bg-gradient-to-r from-accent via-accent-dark to-yellow bg-clip-text text-transparent">
              journaling
            </span>
            <br />
            you&apos;ll ACTUALLY do
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-muted max-w-xl mx-auto leading-relaxed">
            A daily SMS prompt. A quick text back. That&apos;s your journal
            entry. No apps to open, no blank pages to stare at.
          </p>

          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-8 py-3.5 text-white font-semibold text-base hover:bg-accent-dark transition shadow-lg shadow-accent/25 hover:shadow-xl hover:shadow-accent/30"
            >
              Get Started
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                />
              </svg>
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-8 py-3.5 text-foreground font-semibold text-base hover:border-accent/40 transition"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-24 px-6">
        <div
          className="max-w-5xl mx-auto"
          style={{ animation: "fadeSlideUp 0.6s ease-out" }}
        >
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Why heyits works
            </h2>
            <p className="mt-4 text-muted text-lg max-w-2xl mx-auto">
              Most journaling apps fail because they ask too much. We flipped
              the script.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8">
            <div className="bg-card rounded-2xl p-8 border border-border hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5 transition-all">
              <div className="w-12 h-12 rounded-xl bg-accent-light flex items-center justify-center mb-5">
                <svg
                  className="w-6 h-6 text-accent"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Zero friction</h3>
              <p className="text-muted text-sm leading-relaxed">
                You already text every day. Just reply to your daily prompt and
                you&apos;ve journaled. No app to open, no login to remember.
              </p>
            </div>

            <div className="bg-card rounded-2xl p-8 border border-border hover:border-yellow/40 hover:shadow-lg hover:shadow-yellow/5 transition-all">
              <div className="w-12 h-12 rounded-xl bg-yellow-light flex items-center justify-center mb-5">
                <svg
                  className="w-6 h-6 text-yellow-dark"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">AI-powered prompts</h3>
              <p className="text-muted text-sm leading-relaxed">
                Every prompt is personalized to your life — optionally connected
                to your calendar so your reflections stay relevant.
              </p>
            </div>

            <div className="bg-card rounded-2xl p-8 border border-border hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5 transition-all">
              <div className="w-12 h-12 rounded-xl bg-accent-light flex items-center justify-center mb-5">
                <svg
                  className="w-6 h-6 text-accent"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Built for your schedule
              </h3>
              <p className="text-muted text-sm leading-relaxed">
                Pick the time that works for you. Morning coffee, lunch break,
                or before bed — your prompt arrives right on time.
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link
              href="/about"
              className="text-accent font-medium hover:underline underline-offset-4 transition"
            >
              Learn more about how heyits works &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-footer-bg text-footer-text py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-10">
            <div>
              <div className="flex items-center gap-2 text-xl font-bold">
                <span className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white text-sm font-bold">
                  h
                </span>
                <span>heyits</span>
              </div>
              <p className="mt-3 text-sm text-footer-muted max-w-xs">
                Your daily journal, delivered by text. Build a journaling habit
                in 30 seconds a day.
              </p>
            </div>

            <div className="flex gap-16">
              <div>
                <h4 className="text-sm font-semibold mb-4 text-footer-text">
                  Product
                </h4>
                <div className="flex flex-col gap-2.5">
                  <Link
                    href="/about"
                    className="text-sm text-footer-muted hover:text-white transition"
                  >
                    About
                  </Link>
                  <Link
                    href="/support"
                    className="text-sm text-footer-muted hover:text-white transition"
                  >
                    Support
                  </Link>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-4 text-footer-text">
                  Account
                </h4>
                <div className="flex flex-col gap-2.5">
                  <Link
                    href="/login"
                    className="text-sm text-footer-muted hover:text-white transition"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="text-sm text-footer-muted hover:text-white transition"
                  >
                    Sign Up
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-sm text-footer-muted">
              &copy; {new Date().getFullYear()} heyits. All rights reserved.
            </span>
            <div className="flex items-center gap-1">
              <span className="text-sm text-footer-muted">Made with</span>
              <span className="text-yellow">&#9733;</span>
              <span className="text-sm text-footer-muted">
                for journalers everywhere
              </span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
