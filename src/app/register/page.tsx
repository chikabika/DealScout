"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: String(formData.get("name") ?? ""),
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
      }),
    });

    setLoading(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(data?.error ?? "Unable to create account.");
      return;
    }

    router.push("/login");
  }

  return (
    <main className="grid min-h-screen bg-zinc-950 text-zinc-100 lg:grid-cols-[280px_1fr]">
      <aside className="border-b border-white/10 bg-black px-6 py-8 lg:border-b-0 lg:border-r">
        <Link href="/" className="text-xl font-semibold tracking-tight">
          DealScout
        </Link>
        <div className="mt-10 rounded-md border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-zinc-400">
          Create your account before adding saved searches and alert rules.
        </div>
      </aside>
      <section className="flex items-center justify-center px-6 py-12">
        <form
          onSubmit={onSubmit}
          className="w-full max-w-md rounded-lg border border-white/10 bg-zinc-900/70 p-6 shadow-2xl shadow-black/30"
        >
          <h1 className="text-2xl font-semibold tracking-tight">
            Create account
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Start tracking local deals with saved searches.
          </p>
          <label className="mt-6 block text-sm font-medium text-zinc-300">
            Name
            <input
              name="name"
              type="text"
              className="mt-2 h-11 w-full rounded-md border border-white/10 bg-black px-3 text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-emerald-400"
              placeholder="Salah"
            />
          </label>
          <label className="mt-4 block text-sm font-medium text-zinc-300">
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
              minLength={8}
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
            {loading ? "Creating..." : "Create account"}
          </button>
          <p className="mt-5 text-center text-sm text-zinc-400">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-emerald-300">
              Sign in
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
