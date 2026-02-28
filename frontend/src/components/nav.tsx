"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

export default function Nav({ name, email }: { name: string; email: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);

  const displayName = name.trim() || email.split("@")[0];

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const navLink = (href: string, label: string) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        className={`text-sm transition ${
          active ? "text-white font-medium" : "text-white/60 hover:text-white"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-footer-bg/95 backdrop-blur-md border-b border-white/10">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-xl font-bold tracking-tight text-white"
        >
          <span className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white text-sm font-bold">
            h
          </span>
          <span>heyits</span>
        </Link>

        <div className="flex items-center gap-6">
          {navLink("/dashboard", "Journal")}
          {navLink("/profile", "Settings")}
          <span className="text-xs text-white/40 hidden sm:block">
            {displayName}
          </span>
          <button
            onClick={handleLogout}
            className="text-sm font-semibold text-footer-bg bg-yellow hover:bg-yellow-dark px-5 py-2 rounded-full transition shadow-sm cursor-pointer"
          >
            Log out
          </button>
        </div>
      </div>
    </nav>
  );
}
