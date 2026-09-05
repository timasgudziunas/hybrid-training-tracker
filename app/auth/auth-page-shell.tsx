import type { ReactNode } from "react";

/** Shared centered frame for the sign-in and sign-up screens. */
export default function AuthPageShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-10">
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="font-display text-xs font-semibold uppercase tracking-[0.28em] text-ink-tertiary">
          Hybrid Training Tracker
        </p>
        <h1 className="font-display text-2xl font-bold text-ink-primary">{title}</h1>
      </div>
      {children}
    </div>
  );
}
