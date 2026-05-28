"use client";

import { ArrowRight, Lock, Mail, Search, ShieldCheck, Sparkles } from "lucide-react";
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
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden border-r border-white/10 bg-zinc-950 lg:block">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-cyan-400 to-amber-400" />
          <div className="flex h-full flex-col justify-between px-10 py-10">
            <Link href="/" className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-white">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-400/30 bg-emerald-400/10">
                <Search className="h-4 w-4 text-emerald-300" />
              </span>
              DealScout
            </Link>

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

            <div className="grid gap-3 text-sm text-zinc-300">
              <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <Sparkles className="h-5 w-5 text-cyan-300" />
                AI scoring keeps your strongest listings at the top.
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <ShieldCheck className="h-5 w-5 text-emerald-300" />
                Saved searches, usage, and billing stay tied to your account.
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-md">
            <Link href="/" className="mb-8 inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-white lg:hidden">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-400/30 bg-emerald-400/10">
                <Search className="h-4 w-4 text-emerald-300" />
              </span>
              DealScout
            </Link>

        <form
          onSubmit={onSubmit}
          className="rounded-xl border border-white/10 bg-zinc-900/80 p-6 shadow-2xl shadow-black/30 sm:p-8"
        >
          <div className="mb-7">
            <p className="text-sm font-medium text-emerald-300">Welcome back</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Sign in to DealScout</h1>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Open your dashboard and get straight back to the searches that matter.
            </p>
          </div>
          <label className="mt-6 block text-sm font-medium text-zinc-300">
            Email
            <span className="mt-2 flex h-12 items-center gap-3 rounded-lg border border-white/10 bg-black/40 px-3 transition-colors focus-within:border-emerald-400/80">
              <Mail className="h-4 w-4 text-zinc-500" />
              <input
                name="email"
                type="email"
                required
                className="h-full min-w-0 flex-1 bg-transparent text-zinc-100 outline-none placeholder:text-zinc-600"
                placeholder="you@example.com"
              />
            </span>
          </label>
          <label className="mt-4 block text-sm font-medium text-zinc-300">
            Password
            <span className="mt-2 flex h-12 items-center gap-3 rounded-lg border border-white/10 bg-black/40 px-3 transition-colors focus-within:border-emerald-400/80">
              <Lock className="h-4 w-4 text-zinc-500" />
              <input
                name="password"
                type="password"
                required
                className="h-full min-w-0 flex-1 bg-transparent text-zinc-100 outline-none placeholder:text-zinc-600"
                placeholder="Your password"
              />
            </span>
          </label>
          {error ? (
            <p className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </button>
          <p className="mt-5 text-center text-sm text-zinc-400">
            No account?{" "}
            <Link href="/register" className="font-medium text-emerald-300 hover:text-emerald-200">
              Create one
            </Link>
          </p>
        </form>
          </div>
      </section>
      </div>
    </main>
  );
}
