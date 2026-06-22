"use client";

import { useState } from "react";

const MODES = [
  { value: "instant", label: "Instant alerts", description: "Email sent as soon as matching listings are found (Pro and Dealer plans)." },
  { value: "daily", label: "Daily digest", description: "One summary email per day with all new listings found in the last 24 hours." },
  { value: "off", label: "Off", description: "No email notifications. You can still view deals in the dashboard." },
] as const;

type Mode = typeof MODES[number]["value"];

export default function NotificationSettings({ current }: { current: string }) {
  const [selected, setSelected] = useState<Mode>((current as Mode) ?? "instant");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function save(mode: Mode) {
    setSelected(mode);
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const res = await fetch("/api/user/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Could not save preference. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-3">
        {MODES.map((m) => {
          const active = selected === m.value;
          return (
            <button
              key={m.value}
              type="button"
              disabled={saving}
              onClick={() => save(m.value)}
              className={`rounded-xl border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                active
                  ? "border-emerald-500/50 bg-emerald-500/10"
                  : "border-white/10 bg-zinc-800/40 hover:border-white/20"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${active ? "bg-emerald-400" : "bg-zinc-600"}`}
                />
                <span className={`text-sm font-medium ${active ? "text-emerald-300" : "text-zinc-200"}`}>
                  {m.label}
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-zinc-500">{m.description}</p>
            </button>
          );
        })}
      </div>
      {saved && <p className="mt-3 text-xs text-emerald-400">Notification preference saved.</p>}
      {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
    </div>
  );
}
