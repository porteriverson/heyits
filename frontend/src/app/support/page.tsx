"use client";

import { useState } from "react";
import Link from "next/link";
import PublicNav from "@/components/public-nav";

export default function SupportPage() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <>
      <PublicNav />

      <main className="pt-32 pb-24 px-6">
        <div className="max-w-xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Get in touch
          </h1>
          <p className="mt-4 text-muted text-lg">
            Have a question, found a bug, or just want to say hi? We&apos;d
            love to hear from you.
          </p>

          {submitted ? (
            <div
              className="mt-10 bg-accent-light rounded-2xl p-8 text-center border border-accent/10"
              style={{ animation: "scaleIn 0.3s ease-out" }}
            >
              <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-7 h-7 text-accent"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m4.5 12.75 6 6 9-13.5"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2">Message received</h2>
              <p className="text-muted">
                Thanks for reaching out! We&apos;ll get back to you as soon as
                we can.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-10 space-y-5">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium mb-1.5"
                >
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-card"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium mb-1.5"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-card"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="subject"
                  className="block text-sm font-medium mb-1.5"
                >
                  Subject
                </label>
                <select
                  id="subject"
                  required
                  className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-card"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Choose a topic
                  </option>
                  <option value="general">General question</option>
                  <option value="bug">Report a bug</option>
                  <option value="feature">Feature request</option>
                  <option value="account">Account issue</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium mb-1.5"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  required
                  rows={5}
                  className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent bg-card resize-none"
                  placeholder="Tell us what's on your mind..."
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-accent px-4 py-3 text-white font-semibold hover:bg-accent-dark transition"
              >
                Send Message
              </button>
            </form>
          )}
        </div>
      </main>

      <footer className="border-t border-border py-12 px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-bold text-lg">heyits</span>
          <div className="flex items-center gap-6 text-sm text-muted">
            <Link href="/" className="hover:text-foreground transition">
              Home
            </Link>
            <Link href="/about" className="hover:text-foreground transition">
              About
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
