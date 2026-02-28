"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

export default function Nav({ email }: { email: string }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <nav className="border-b border-border">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <a href="/dashboard" className="font-bold text-lg">
          heyits
        </a>
        <div className="flex items-center gap-4">
          <span className="text-xs text-muted">{email}</span>
          <button
            onClick={handleLogout}
            className="text-xs text-muted hover:text-foreground transition"
          >
            Log out
          </button>
        </div>
      </div>
    </nav>
  );
}
