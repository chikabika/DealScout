"use client";

import { ArrowRight, ChevronLeft, Lock, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      redirect: false,
      callbackUrl,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password.");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

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

            {/* Content (sits above the gradient layers) */}
            <div className="relative flex h-full flex-col justify-between px-10 py-10">
              <div className="max-w-xl">
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-emerald-300">
                  Deal flow command center
                </p>
                <h1 className="mt-5 text-5xl font-semibold leading-tight tracking-tight text-white">
                  Find the fresh listings before everyone else does.
                </h1>
                <p className="mt-5 max-w-lg text-base leading-7 text-zinc-400">
                  Sign in to review tracked searches, scan new matches, and keep your best opportunities moving.
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

                {/* Feature bullets */}
                <div className="grid gap-3 text-sm text-zinc-300">
                  <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm">
                    <Sparkles className="h-5 w-5 shrink-0 text-cyan-300" />
                    AI scoring keeps your strongest listings at the top.
                  </div>
                  <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm">
                    <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-300" />
                    Saved searches, usage, and billing stay tied to your account.
                  </div>
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

                {/* Logo */}
                <div className="mb-8 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
                    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="white" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2L2 7l10 5 10-5-10-5z" />
                      <path d="M2 17l10 5 10-5" />
                      <path d="M2 12l10 5 10-5" />
                    </svg>
                  </div>
                  <span className="text-lg font-bold tracking-tight text-white">
                    CarDeal<span className="text-emerald-400">Alerts</span>
                  </span>
                </div>

                {/* Form card */}
                <form
                  onSubmit={onSubmit}
                  className="rounded-2xl border border-white/10 bg-zinc-900/60 p-7 shadow-2xl shadow-black/40 backdrop-blur-sm sm:p-9"
                >
                  <div className="mb-7">
                    <p className="text-sm font-medium text-emerald-300">Welcome back</p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
                      Sign in
                    </h1>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">
                      Open your dashboard and get straight back to the searches that matter.
                    </p>
                  </div>

                  {/* Email */}
                  <label className="mt-6 block text-sm font-medium text-zinc-300">
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

                  {/* Password */}
                  <label className="mt-4 block text-sm font-medium text-zinc-300">
                    Password
                    <span className="mt-2 flex h-12 items-center gap-3 rounded-lg border border-zinc-700/60 bg-zinc-800/50 px-3 transition-all duration-200 focus-within:border-emerald-400 focus-within:bg-zinc-800/80 focus-within:ring-2 focus-within:ring-emerald-500/30">
                      <Lock className="h-4 w-4 shrink-0 text-zinc-500" />
                      <input
                        name="password"
                        type="password"
                        required
                        className="h-full min-w-0 flex-1 bg-transparent text-zinc-100 outline-none placeholder:text-zinc-600"
                        placeholder="Your password"
                      />
                    </span>
                  </label>

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
                        Signing in…
                      </>
                    ) : (
                      <>
                        Sign in
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>

                  <p className="mt-5 text-center text-sm text-zinc-400">
                    No account?{" "}
                    <Link
                      href="/register"
                      className="font-medium text-emerald-300 transition-colors hover:text-emerald-200"
                    >
                      Create one
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
