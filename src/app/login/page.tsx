"use client";

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
    <main className="grid min-h-screen bg-zinc-950 text-zinc-100 lg:grid-cols-[280px_1fr]">
      <aside className="border-b border-white/10 bg-black px-6 py-8 lg:border-b-0 lg:border-r">
        <Link href="/" className="text-xl font-semibold tracking-tight">
          DealScout
        </Link>
        <div className="mt-10 rounded-md border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-zinc-400">
          Sign in to manage saved searches, scan listings, and prepare alerts.
        </div>
      </aside>
      <section className="flex items-center justify-center px-6 py-12">
        <form
          onSubmit={onSubmit}
          className="w-full max-w-md rounded-lg border border-white/10 bg-zinc-900/70 p-6 shadow-2xl shadow-black/30"
        >
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Log in with your DealScout credentials.
          </p>
          <label className="mt-6 block text-sm font-medium text-zinc-300">
            Email
            <input
              name="email"
              type="email"
              required
              className="mt-2 h-11 w-full rounded-md border border-white/10 bg-black px-3 text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-emerald-400"
              placeholder="you@example.com"
            />
          </label>
          <label className="mt-4 block text-sm font-medium text-zinc-300">
            Password
            <input
              name="password"
              type="password"
              required
              className="mt-2 h-11 w-full rounded-md border border-white/10 bg-black px-3 text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-emerald-400"
              placeholder="At least 8 characters"
            />
          </label>
          {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="mt-6 h-11 w-full rounded-md bg-emerald-400 px-4 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
          <p className="mt-5 text-center text-sm text-zinc-400">
            No account?{" "}
            <Link href="/register" className="font-medium text-emerald-300">
              Create one
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
