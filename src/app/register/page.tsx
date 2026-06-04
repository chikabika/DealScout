"use client";

import { ArrowRight, Check, ChevronLeft, Lock, Mail, Search, User } from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

// ─── Password strength helper ─────────────────────────────────────────────────

type StrengthLevel = "none" | "weak" | "fair" | "strong";

function getPasswordStrength(pw: string): {
  level: StrengthLevel;
  bars: number;
  label: string;
} {
  if (pw.length === 0) return { level: "none", bars: 0, label: "" };
  if (pw.length < 8)   return { level: "weak",   bars: 1, label: "Too short" };
  const variety = [
    /[A-Z]/.test(pw),
    /[0-9]/.test(pw),
    /[^a-zA-Z0-9]/.test(pw),
  ].filter(Boolean).length;
  if (variety >= 2)    return { level: "strong", bars: 3, label: "Strong" };
  return                      { level: "fair",   bars: 2, label: "Fair" };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: String(formData.get("name") ?? ""),
        email,
        password,
      }),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(data?.error ?? "Unable to create account.");
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/dashboard",
    });

    setLoading(false);

    if (result?.error) {
      setError("Account created, but automatic sign-in failed. Please sign in once.");
      return;
    }

    router.push("/onboarding/plan");
    router.refresh();
  }

  const strength = getPasswordStrength(password);

  const barColor =
    strength.level === "strong" ? "bg-emerald-500"
    : strength.level === "fair" ? "bg-amber-500"
    : "bg-red-500";

  const labelColor =
    strength.level === "strong" ? "text-emerald-400"
    : strength.level === "fair" ? "text-amber-400"
    : "text-zinc-500";

  return (
    <>
      <style>{`
        @keyframes orbDrift1 {
          0%, 100% { transform: translateX(0px) translateY(0px) scale(1); }
          33%       { transform: translateX(44px) translateY(-32px) scale(1.06); }
          66%       { transform: translateX(-22px) translateY(22px) scale(0.97); }
        }
        @keyframes orbDrift2 {
          0%, 100% { transform: translateX(0px) translateY(0px) scale(1); }
          40%       { transform: translateX(-36px) translateY(38px) scale(1.09); }
          75%       { transform: translateX(28px) translateY(-16px) scale(0.94); }
        }
        @keyframes orbDrift3 {
          0%, 100% { transform: translateX(0px) translateY(0px) scale(1); }
          50%       { transform: translateX(26px) translateY(22px) scale(1.05); }
        }
        /* Kill browser autofill yellow/blue background */
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 1000px #1c1c1f inset !important;
          -webkit-text-fill-color: #f4f4f5 !important;
          caret-color: #f4f4f5;
          transition: background-color 9999s ease-in-out 0s;
        }
      `}</style>

      <main className="min-h-screen bg-zinc-950 text-zinc-100">
        <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">

          {/* ── Left: marketing panel ── */}
          <section className="relative hidden overflow-hidden border-r border-white/10 bg-zinc-950 lg:block">
            {/* Subtle grid texture */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.016)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.016)_1px,transparent_1px)] bg-[size:60px_60px]" />

            {/* Animated gradient orbs */}
            <div
              className="absolute -left-24 top-1/4 h-80 w-80 rounded-full bg-emerald-500 opacity-[0.13] blur-3xl"
              style={{ animation: "orbDrift1 9s ease-in-out infinite" }}
            />
            <div
              className="absolute -right-16 top-[38%] h-[26rem] w-[26rem] rounded-full bg-cyan-400 opacity-[0.07] blur-3xl"
              style={{ animation: "orbDrift2 13s ease-in-out infinite", animationDelay: "-4s" }}
            />
            <div
              className="absolute bottom-[22%] left-[36%] h-64 w-64 rounded-full bg-emerald-400 opacity-[0.10] blur-3xl"
              style={{ animation: "orbDrift3 11s ease-in-out infinite", animationDelay: "-7s" }}
            />

            {/* Top accent line */}
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-cyan-400 to-amber-400" />

            {/* Content */}
            <div className="relative flex h-full flex-col justify-between px-10 py-10">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-white"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-400/30 bg-emerald-400/10">
                  <Search className="h-4 w-4 text-emerald-300" />
                </span>
                DealScout
              </Link>

              <div className="max-w-xl">
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-emerald-300">
                  Start scouting in minutes
                </p>
                <h1 className="mt-5 text-5xl font-semibold leading-tight tracking-tight text-white">
                  Create your dashboard and start tracking real opportunities.
                </h1>
                <p className="mt-5 max-w-lg text-base leading-7 text-zinc-400">
                  Build saved searches, monitor new listings, and let DealScout surface the strongest deals.
                </p>
              </div>

              <div className="space-y-5">
                {/* Social proof stat chips */}
                <div className="flex flex-wrap gap-2">
                  {[
                    { emoji: "🚗", text: "50,000+ listings scanned daily" },
                    { emoji: "⚡", text: "Alerts in under 5 minutes" },
                    { emoji: "🔥", text: "AI-scored deals" },
                  ].map((chip) => (
                    <div
                      key={chip.text}
                      className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-300 backdrop-blur-sm"
                    >
                      <span>{chip.emoji}</span>
                      {chip.text}
                    </div>
                  ))}
                </div>

                {/* How it works — 3 steps */}
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-500">
                    How it works
                  </p>
                  <ol className="space-y-3.5">
                    {[
                      { n: 1, text: "Create a search" },
                      { n: 2, text: "We scan 24/7 across all marketplaces" },
                      { n: 3, text: "Get alerted on the best deals instantly" },
                    ].map(({ n, text }) => (
                      <li key={n} className="flex items-center gap-3 text-sm text-zinc-300">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-semibold text-emerald-400">
                          {n}
                        </span>
                        {text}
                        {n < 3 && (
                          <span className="ml-auto text-zinc-700">
                            <Check className="h-3.5 w-3.5 text-emerald-700/50" />
                          </span>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          </section>

          {/* ── Right: form panel ── */}
          <section className="flex min-h-screen flex-col bg-zinc-950">
            {/* Back to home link */}
            <div className="px-6 pt-6">
              <Link
                href="/"
                className="inline-flex items-center gap-1 text-xs text-zinc-500 transition-colors duration-200 hover:text-zinc-300"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Back to home
              </Link>
            </div>

            {/* Vertically centered form */}
            <div className="flex flex-1 items-center justify-center px-5 py-8 sm:px-8">
              <div className="w-full max-w-md">

                {/* Mobile branding + tagline */}
                <div className="mb-8 lg:hidden">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-white"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-400/30 bg-emerald-400/10">
                      <Search className="h-4 w-4 text-emerald-300" />
                    </span>
                    DealScout
                  </Link>
                  <p className="mt-1.5 text-sm text-zinc-500">
                    Find car deals before everyone else.
                  </p>
                </div>

                {/* Form card */}
                <form
                  onSubmit={onSubmit}
                  className="rounded-2xl border border-white/10 bg-zinc-900/60 p-7 shadow-2xl shadow-black/40 backdrop-blur-sm sm:p-9"
                >
                  {/* In-card branding mark */}
                  <div className="mb-6 flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-400/30 bg-emerald-400/10">
                      <Search className="h-3.5 w-3.5 text-emerald-300" />
                    </span>
                    <span className="text-sm font-semibold tracking-tight text-zinc-300">
                      DealScout
                    </span>
                  </div>

                  <div className="mb-7">
                    <p className="text-sm font-medium text-emerald-300">New account</p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
                      Join DealScout
                    </h1>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">
                      Create an account once. We will sign you in and send you straight to the dashboard.
                    </p>
                  </div>

                  {/* Name */}
                  <label className="mt-6 block text-sm font-medium text-zinc-300">
                    Name
                    <span className="mt-2 flex h-12 items-center gap-3 rounded-lg border border-zinc-700/60 bg-zinc-800/50 px-3 transition-all duration-200 focus-within:border-emerald-400 focus-within:bg-zinc-800/80 focus-within:ring-2 focus-within:ring-emerald-500/30">
                      <User className="h-4 w-4 shrink-0 text-zinc-500" />
                      <input
                        name="name"
                        type="text"
                        className="h-full min-w-0 flex-1 bg-transparent text-zinc-100 outline-none placeholder:text-zinc-600"
                        placeholder="Salah"
                      />
                    </span>
                  </label>

                  {/* Email */}
                  <label className="mt-4 block text-sm font-medium text-zinc-300">
                    Email
                    <span className="mt-2 flex h-12 items-center gap-3 rounded-lg border border-zinc-700/60 bg-zinc-800/50 px-3 transition-all duration-200 focus-within:border-emerald-400 focus-within:bg-zinc-800/80 focus-within:ring-2 focus-within:ring-emerald-500/30">
                      <Mail className="h-4 w-4 shrink-0 text-zinc-500" />
                      <input
                        name="email"
                        type="email"
                        required
                        className="h-full min-w-0 flex-1 bg-transparent text-zinc-100 outline-none placeholder:text-zinc-600"
                        placeholder="you@example.com"
                      />
                    </span>
                  </label>

                  {/* Password + strength indicator */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-zinc-300">
                      Password
                      <span className="mt-2 flex h-12 items-center gap-3 rounded-lg border border-zinc-700/60 bg-zinc-800/50 px-3 transition-all duration-200 focus-within:border-emerald-400 focus-within:bg-zinc-800/80 focus-within:ring-2 focus-within:ring-emerald-500/30">
                        <Lock className="h-4 w-4 shrink-0 text-zinc-500" />
                        <input
                          name="password"
                          type="password"
                          minLength={8}
                          required
                          onChange={(e) => setPassword(e.target.value)}
                          className="h-full min-w-0 flex-1 bg-transparent text-zinc-100 outline-none placeholder:text-zinc-600"
                          placeholder="At least 8 characters"
                        />
                      </span>
                    </label>

                    {/* Strength indicator — only shown after user starts typing */}
                    {strength.level !== "none" && (
                      <div className="mt-2.5 flex items-center gap-3">
                        <div className="flex gap-1">
                          {[1, 2, 3].map((bar) => (
                            <div
                              key={bar}
                              className={`h-1 w-8 rounded-full transition-colors duration-300 ${
                                bar <= strength.bars ? barColor : "bg-zinc-800"
                              }`}
                            />
                          ))}
                        </div>
                        {strength.label && (
                          <span className={`text-xs font-medium transition-colors duration-200 ${labelColor}`}>
                            {strength.label}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Error */}
                  {error ? (
                    <p className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                      {error}
                    </p>
                  ) : null}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 text-sm font-semibold text-zinc-950 shadow-lg shadow-emerald-900/30 transition-all duration-200 hover:from-emerald-400 hover:to-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <svg
                          className="h-4 w-4 animate-spin"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path strokeLinecap="round" d="M12 3a9 9 0 1 0 9 9" />
                        </svg>
                        Creating account…
                      </>
                    ) : (
                      <>
                        Create account
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>

                  <p className="mt-5 text-center text-sm text-zinc-400">
                    Already have an account?{" "}
                    <Link
                      href="/login"
                      className="font-medium text-emerald-300 transition-colors hover:text-emerald-200"
                    >
                      Sign in
                    </Link>
                  </p>
                </form>

              </div>
            </div>
          </section>

        </div>
      </main>
    </>
  );
}
