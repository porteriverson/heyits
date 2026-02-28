import Link from "next/link";
import PublicNav from "@/components/public-nav";

export default function AboutPage() {
  return (
    <>
      <PublicNav />

      <main className="pt-32 pb-24 px-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
            Journaling shouldn&apos;t feel
            <br />
            like <span className="text-accent">homework</span>
          </h1>

          <div className="mt-10 space-y-6 text-muted text-lg leading-relaxed">
            <p>
              You&apos;ve probably tried journaling before. Maybe you bought a
              nice notebook, downloaded an app, or told yourself &ldquo;this
              time I&apos;ll stick with it.&rdquo; And for a few days, you did.
              Then life got busy, the habit slipped, and that journal gathered
              dust.
            </p>

            <p>
              That&apos;s not a willpower problem — it&apos;s a friction
              problem. Traditional journaling asks you to carve out time, find
              the right tool, stare at a blank page, and somehow produce
              something meaningful. That&apos;s a lot of steps between you and a
              simple reflection.
            </p>

            <p className="text-foreground font-medium text-xl">
              heyits removes every barrier between you and your thoughts.
            </p>

            <p>
              Here&apos;s how it works: every day, at the time you choose, you
              get a text message with a thoughtful prompt. Not generic
              &ldquo;what are you grateful for&rdquo; questions — prompts
              crafted by AI that actually know what&apos;s going on in your
              life. Connected your calendar? Your prompt might ask how that big
              meeting went or what you&apos;re looking forward to this weekend.
            </p>

            <p>
              You reply with a text. That&apos;s it. That&apos;s your journal
              entry. No app to open, no account to log into in the moment, no
              blank page staring back at you. Just the texting interface you
              already use a hundred times a day.
            </p>
          </div>

          <div className="mt-16 bg-accent-light rounded-2xl p-8 sm:p-10 border border-accent/10">
            <h2 className="text-2xl font-bold mb-6">
              What makes heyits different
            </h2>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <span className="text-accent font-bold text-lg mt-0.5">
                  01
                </span>
                <div>
                  <span className="font-semibold text-foreground">
                    It meets you where you are.
                  </span>
                  <span className="text-muted">
                    {" "}
                    You don&apos;t go to your journal — it comes to you, via the
                    messaging app you already have open.
                  </span>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-accent font-bold text-lg mt-0.5">
                  02
                </span>
                <div>
                  <span className="font-semibold text-foreground">
                    Prompts that actually matter.
                  </span>
                  <span className="text-muted">
                    {" "}
                    Our AI doesn&apos;t recycle the same generic questions. It
                    learns your rhythm and asks things worth reflecting on.
                  </span>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-accent font-bold text-lg mt-0.5">
                  03
                </span>
                <div>
                  <span className="font-semibold text-foreground">
                    30 seconds is enough.
                  </span>
                  <span className="text-muted">
                    {" "}
                    A quick text reply captures more than you&apos;d think. Over
                    time, those small moments build into a rich personal record.
                  </span>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-accent font-bold text-lg mt-0.5">
                  04
                </span>
                <div>
                  <span className="font-semibold text-foreground">
                    Your story, on your terms.
                  </span>
                  <span className="text-muted">
                    {" "}
                    Choose your time, your vibe, even your journaling
                    companion&apos;s name. It&apos;s your practice, personalized.
                  </span>
                </div>
              </li>
            </ul>
          </div>

          <div className="mt-16 text-center">
            <p className="text-muted text-lg mb-6">
              Ready to build a journaling habit that actually sticks?
            </p>
            <Link
              href="/signup"
              className="inline-block rounded-xl bg-accent px-8 py-4 text-white font-semibold text-lg hover:bg-accent-dark transition shadow-lg shadow-accent/25"
            >
              Get Started
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-border py-12 px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-bold text-lg">heyits</span>
          <div className="flex items-center gap-6 text-sm text-muted">
            <Link href="/" className="hover:text-foreground transition">
              Home
            </Link>
            <Link href="/support" className="hover:text-foreground transition">
              Support
            </Link>
            <Link href="/login" className="hover:text-foreground transition">
              Login
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
