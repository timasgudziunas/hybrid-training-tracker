"use client";

import { useEffect, useRef, useState } from "react";
import { updateAthleteSettings } from "./actions";
import type { AthleteSettings } from "@/lib/settings/athlete-settings";

const SAVED_MESSAGE_MS = 1500;

/**
 * A single labeled on/off row inside a settings card. Generic on purpose
 * (CLAUDE.md non-negotiable 14: reduce decisions, keep the UI simple) so a
 * new setting is a one-line addition to SettingsForm below, not a new
 * component.
 *
 * The switch is drawn at phone-native size (about 48 x 28) so it does not
 * dominate a narrow screen; the whole row is the tap target, so nothing is
 * lost in reachability.
 */
function SettingToggleRow({
  label,
  description,
  checked,
  onChange,
  pending,
  error,
  saved,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  pending: boolean;
  error: string | null;
  saved: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5 px-5 py-4">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={pending}
        onClick={() => onChange(!checked)}
        className="flex w-full items-center justify-between gap-4 text-left disabled:opacity-50"
      >
        <span className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-ink-primary">{label}</span>
          <span className="text-xs text-ink-tertiary">{description}</span>
        </span>
        <span
          aria-hidden="true"
          className={`flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors ${
            checked ? "border-accent bg-accent" : "border-line-default bg-surface-2"
          }`}
        >
          <span
            className={`h-5 w-5 rounded-full bg-white shadow-card transition-transform ${
              checked ? "translate-x-[22px]" : "translate-x-1"
            }`}
          />
        </span>
      </button>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
      {!error && saved ? <p className="text-xs text-ink-tertiary">Saved</p> : null}
    </div>
  );
}

export default function SettingsForm({ initial }: { initial: AthleteSettings }) {
  const [settings, setSettings] = useState<AthleteSettings>(initial);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
    };
  }, []);

  async function handleShowRirChange(next: boolean) {
    if (pending) return;

    const previous = settings.showRir;
    setSettings((current) => ({ ...current, showRir: next }));
    setPending(true);
    setError(null);
    setSaved(false);

    const result = await updateAthleteSettings({ showRir: next });

    setPending(false);

    if (!result.ok) {
      setSettings((current) => ({ ...current, showRir: previous }));
      setError(result.reason);
      return;
    }

    setSettings(result.data);
    setSaved(true);
    if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
    savedTimeoutRef.current = setTimeout(() => setSaved(false), SAVED_MESSAGE_MS);
  }

  return (
    <div className="flex flex-col divide-y divide-line-hairline rounded-2xl border border-line-hairline bg-surface-1 shadow-card">
      <SettingToggleRow
        label="Show RIR during set entry"
        description="Reps in reserve selector on every set. Turn it off if you take every set to failure."
        checked={settings.showRir}
        onChange={handleShowRirChange}
        pending={pending}
        error={error}
        saved={saved}
      />
    </div>
  );
}
