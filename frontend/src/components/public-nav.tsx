import Link from "next/link";

export default function PublicNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-footer-bg/95 backdrop-blur-md border-b border-white/10">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-bold tracking-tight text-white"
        >
          <span className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white text-sm font-bold">
            h
          </span>
          <span>heyits</span>
        </Link>

        <div className="hidden sm:flex items-center gap-8">
          <Link
            href="/about"
            className="text-sm text-white/60 hover:text-white transition"
          >
            About
          </Link>
          <Link
            href="/support"
            className="text-sm text-white/60 hover:text-white transition"
          >
            Support
          </Link>
          <Link
            href="/login"
            className="text-sm text-white/60 hover:text-white transition"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="text-sm font-semibold text-footer-bg bg-yellow hover:bg-yellow-dark px-5 py-2 rounded-full transition shadow-sm"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}
