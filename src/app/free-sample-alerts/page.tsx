"use client";

import { ArrowRight, Bell, ChevronLeft, Mail, MapPin, User } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";

const BUYER_TYPES = [
  "Dealer",
  "Car flipper",
  "Personal buyer",
  "Export buyer",
  "Mechanic / rebuilder",
  "Other",
];

const DISTANCE_OPTIONS = [
  "25 miles",
  "50 miles",
  "100 miles",
  "200 miles",
  "Nationwide",
];

export default function FreeSampleAlertsPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    startTimeRef.current = Date.now();
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    const fd = new FormData(e.currentTarget);

    // Honeypot
    if (fd.get("website")) {
      setStatus("success");
      return;
    }

    const payload = {
      fullName: String(fd.get("fullName") ?? "").trim(),
      email: String(fd.get("email") ?? "").trim(),
      cityOrZip: String(fd.get("cityOrZip") ?? "").trim(),
      buyerType: String(fd.get("buyerType") ?? "").trim(),
      vehiclesWanted: String(fd.get("vehiclesWanted") ?? "").trim(),
      maxBudget: String(fd.get("maxBudget") ?? "").trim(),
      searchDistance: String(fd.get("searchDistance") ?? "").trim(),
      notes: String(fd.get("notes") ?? "").trim(),
      submittedAt: startTimeRef.current,
      website: "", // honeypot always empty from real users
    };

    try {
      const res = await fetch("/api/free-sample-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json() as { success: boolean; message?: string };
      if (data.success) {
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMsg(data.message ?? "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Network error. Please check your connection and try again.");
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Nav */}
      <nav className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-dark.svg" alt="CarDealAlerts" className="h-9 w-auto" />
          </Link>
          <Link href="/login" className="text-sm text-zinc-400 hover:text-zinc-200">Log in</Link>
        </div>
      </nav>

      <div className="mx-auto max-w-2xl px-5 py-16 sm:px-6">
        {/* Back link */}
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300"
        >
          <ChevronLeft size={14} />
          Back to home
        </Link>

        {/* Header */}
        <div className="mb-8 flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10">
            <Bell className="text-emerald-300" size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">
              Get 3 Free Used-Car Deal Alerts for Your Market
            </h1>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Tell us what type of vehicles you are looking for, and we will send a few real sample alerts so you can see how CarDealAlerts could help.
            </p>
          </div>
        </div>

        {status === "success" ? (
          <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/5 p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400/10">
              <Bell className="text-emerald-300" size={28} />
            </div>
            <h2 className="text-xl font-semibold text-white">Request received!</h2>
            <p className="mt-3 text-zinc-400">
              Thanks — your request was received. We&apos;ll review your market and send a few sample alerts soon.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-white/15 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Back to home
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="rounded-2xl border border-white/10 bg-zinc-900/60 p-7 sm:p-9">
            {/* Honeypot (hidden from real users) */}
            <input name="website" type="text" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />

            <div className="space-y-5">
              {/* Full Name */}
              <label className="block text-sm font-medium text-zinc-300">
                Full Name <span className="text-red-400">*</span>
                <span className="mt-2 flex h-12 items-center gap-3 rounded-lg border border-zinc-700/60 bg-zinc-800/50 px-3 transition-all focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-500/30">
                  <User size={16} className="shrink-0 text-zinc-500" />
                  <input
                    name="fullName"
                    type="text"
                    required
                    className="h-full min-w-0 flex-1 bg-transparent text-zinc-100 outline-none placeholder:text-zinc-600"
                    placeholder="Jane Smith"
                  />
                </span>
              </label>

              {/* Email */}
              <label className="block text-sm font-medium text-zinc-300">
                Email Address <span className="text-red-400">*</span>
                <span className="mt-2 flex h-12 items-center gap-3 rounded-lg border border-zinc-700/60 bg-zinc-800/50 px-3 transition-all focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-500/30">
                  <Mail size={16} className="shrink-0 text-zinc-500" />
                  <input
                    name="email"
                    type="email"
                    required
                    className="h-full min-w-0 flex-1 bg-transparent text-zinc-100 outline-none placeholder:text-zinc-600"
                    placeholder="you@example.com"
                  />
                </span>
              </label>

              {/* City or ZIP */}
              <label className="block text-sm font-medium text-zinc-300">
                City or ZIP Code <span className="text-red-400">*</span>
                <span className="mt-2 flex h-12 items-center gap-3 rounded-lg border border-zinc-700/60 bg-zinc-800/50 px-3 transition-all focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-500/30">
                  <MapPin size={16} className="shrink-0 text-zinc-500" />
                  <input
                    name="cityOrZip"
                    type="text"
                    required
                    className="h-full min-w-0 flex-1 bg-transparent text-zinc-100 outline-none placeholder:text-zinc-600"
                    placeholder="Charlotte, NC or 28201"
                  />
                </span>
              </label>

              {/* Buyer Type */}
              <label className="block text-sm font-medium text-zinc-300">
                Buyer Type <span className="text-red-400">*</span>
                <select
                  name="buyerType"
                  required
                  defaultValue=""
                  className="mt-2 h-12 w-full rounded-lg border border-zinc-700/60 bg-zinc-800/50 px-3 text-zinc-100 outline-none transition-all focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/30"
                >
                  <option value="" disabled className="text-zinc-600">Select your buyer type…</option>
                  {BUYER_TYPES.map((t) => (
                    <option key={t} value={t} className="bg-zinc-900">{t}</option>
                  ))}
                </select>
              </label>

              {/* Vehicles Wanted */}
              <label className="block text-sm font-medium text-zinc-300">
                Vehicles Wanted <span className="text-red-400">*</span>
                <textarea
                  name="vehiclesWanted"
                  required
                  rows={3}
                  className="mt-2 w-full rounded-lg border border-zinc-700/60 bg-zinc-800/50 px-3 py-3 text-zinc-100 outline-none transition-all focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/30 placeholder:text-zinc-600"
                  placeholder="Example: Toyota Tacoma, Honda Civic, pickup trucks, SUVs under $20k"
                />
              </label>

              <div className="border-t border-white/10 pt-4">
                <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-500">Optional details</p>

                {/* Max Budget */}
                <label className="block text-sm font-medium text-zinc-300">
                  Max Budget
                  <input
                    name="maxBudget"
                    type="text"
                    className="mt-2 h-12 w-full rounded-lg border border-zinc-700/60 bg-zinc-800/50 px-3 text-zinc-100 outline-none transition-all focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/30 placeholder:text-zinc-600"
                    placeholder="Example: $15,000"
                  />
                </label>

                {/* Search Distance */}
                <label className="mt-4 block text-sm font-medium text-zinc-300">
                  Search Distance
                  <select
                    name="searchDistance"
                    defaultValue=""
                    className="mt-2 h-12 w-full rounded-lg border border-zinc-700/60 bg-zinc-800/50 px-3 text-zinc-100 outline-none transition-all focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/30"
                  >
                    <option value="" className="text-zinc-600 bg-zinc-900">No preference</option>
                    {DISTANCE_OPTIONS.map((d) => (
                      <option key={d} value={d} className="bg-zinc-900">{d}</option>
                    ))}
                  </select>
                </label>

                {/* Notes */}
                <label className="mt-4 block text-sm font-medium text-zinc-300">
                  Notes
                  <textarea
                    name="notes"
                    rows={3}
                    className="mt-2 w-full rounded-lg border border-zinc-700/60 bg-zinc-800/50 px-3 py-3 text-zinc-100 outline-none transition-all focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/30 placeholder:text-zinc-600"
                    placeholder="Any title, mileage, year, or condition preferences?"
                  />
                </label>
              </div>
            </div>

            {errorMsg && (
              <p className="mt-5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "loading" ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" d="M12 3a9 9 0 1 0 9 9" />
                  </svg>
                  Sending request…
                </>
              ) : (
                <>
                  Request Free Sample Alerts
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            <p className="mt-4 text-xs text-zinc-600">
              By submitting this form, you agree to be contacted by CarDealAlerts with sample alerts and product information.
            </p>
          </form>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-8 text-center text-xs text-zinc-600">
        <p>© {new Date().getFullYear()} CarDealAlerts. All rights reserved.</p>
        <div className="mt-2 flex justify-center gap-4">
          <Link href="/terms" className="hover:text-zinc-400">Terms</Link>
          <Link href="/privacy" className="hover:text-zinc-400">Privacy</Link>
          <Link href="/contact" className="hover:text-zinc-400">Contact</Link>
        </div>
      </footer>
    </div>
  );
}
