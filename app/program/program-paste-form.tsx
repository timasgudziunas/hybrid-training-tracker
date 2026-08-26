"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ResolvedProgram } from "@/lib/program/program-types";
import { previewProgram, saveProgram } from "./actions";
import ProgramWeekPreview from "./program-week-preview";

type PreviewState =
  | { status: "idle" }
  | { status: "previewed"; program?: ResolvedProgram; errors: string[]; warnings: string[] };

export default function ProgramPasteForm() {
  const router = useRouter();
  const [sourceText, setSourceText] = useState("");
  const [preview, setPreview] = useState<PreviewState>({ status: "idle" });
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPreviewing, startPreviewTransition] = useTransition();
  const [isSaving, startSaveTransition] = useTransition();

  function handlePreview() {
    setSaveError(null);
    setSaved(false);
    startPreviewTransition(async () => {
      const result = await previewProgram(sourceText);
      if (result.ok) {
        setPreview({ status: "previewed", program: result.data.program, errors: result.data.errors, warnings: result.data.warnings });
      } else {
        setPreview({ status: "previewed", errors: [result.reason], warnings: [] });
      }
    });
  }

  function handleActivate() {
    setSaveError(null);
    startSaveTransition(async () => {
      const result = await saveProgram(sourceText);
      if (result.ok) {
        setSaved(true);
        router.refresh();
      } else {
        setSaveError(result.reason);
      }
    });
  }

  const canActivate = preview.status === "previewed" && Boolean(preview.program) && preview.errors.length === 0;

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-2">
        <span className="text-[11px] font-medium uppercase tracking-widest text-ink-tertiary">Paste your program</span>
        <textarea
          value={sourceText}
          onChange={(e) => {
            setSourceText(e.target.value);
            setPreview({ status: "idle" });
            setSaved(false);
          }}
          rows={14}
          placeholder="# Program Name&#10;&#10;## Monday: Upper Body&#10;### Strength (strength)&#10;- Hack Squat: 3 x 6-10"
          spellCheck={false}
          className="rounded-xl border border-line-default bg-surface-2 p-4 font-mono text-sm leading-relaxed text-ink-primary shadow-well transition-colors focus:border-accent focus:outline-none"
        />
      </label>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handlePreview}
          disabled={isPreviewing || sourceText.trim().length === 0}
          className="h-12 rounded-xl border border-line-default px-4 text-sm font-medium text-ink-secondary transition-colors active:bg-surface-2 disabled:opacity-50"
        >
          {isPreviewing ? "Checking..." : "Preview"}
        </button>
        <button
          type="button"
          onClick={handleActivate}
          disabled={!canActivate || isSaving}
          className="h-12 rounded-xl bg-accent px-4 text-sm font-semibold text-accent-ink transition-colors active:bg-accent-strong disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Activate this program"}
        </button>
      </div>

      {saved ? <p className="text-sm text-success">Program saved and activated.</p> : null}
      {saveError ? <p className="text-sm text-danger">{saveError}</p> : null}

      {preview.status === "previewed" ? (
        <div className="flex flex-col gap-4">
          {preview.errors.length > 0 ? (
            <div className="flex flex-col gap-1.5 rounded-xl border border-danger/30 bg-danger-soft p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-danger">
                {preview.errors.length} {preview.errors.length === 1 ? "error" : "errors"}, could not be saved
              </p>
              <ul className="flex flex-col gap-1 text-sm text-ink-primary">
                {preview.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {preview.warnings.length > 0 ? (
            <div className="flex flex-col gap-1.5 rounded-xl border border-warning/30 bg-warning-soft p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-warning">
                {preview.warnings.length} {preview.warnings.length === 1 ? "warning" : "warnings"}
              </p>
              <ul className="flex flex-col gap-1 text-sm text-ink-primary">
                {preview.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {preview.program ? (
            <div className="rounded-2xl border border-line-hairline bg-surface-1 p-4 shadow-card sm:p-5">
              <p className="mb-4 font-display text-xs font-semibold uppercase tracking-[0.2em] text-ink-tertiary">
                Preview: {preview.program.name}
              </p>
              <ProgramWeekPreview program={preview.program} />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
