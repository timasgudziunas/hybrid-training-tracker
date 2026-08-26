/**
 * Parses the owner-facing paste format (see PROGRAM_FORMAT.md at the repo
 * root) into a ResolvedProgram. Pure and deterministic: never throws, only
 * returns line-numbered errors/warnings. This is the ONLY place program text
 * turns into program data — app/program/actions.ts calls it server-side
 * before ever writing to `training_programs`, and lib/program/sample-program.ts
 * calls it at module load to build the built-in sample from its own
 * paste-format source text.
 *
 * Design summary:
 * - Line-oriented state machine: top-level (`# Title`), day (`## Weekday[:
 *   Name]`), section (`### Name (type[, optional])`), exercise (`- ...`),
 *   and qualitative sub-item (deeper-indented `- ...`) lines.
 * - Absent weekdays become plain rest days. A pasted Sunday day is always
 *   coerced to rest with a warning (CLAUDE.md non-negotiables 11/20).
 * - Exercise identity: id = slugify(name), so the same typed name always
 *   resolves to the same id across re-pastes. Each name is also matched
 *   against lib/program/exercise-catalog.ts by normalized name; a match
 *   attaches that catalog entry's muscles/guidance, keeping the parsed id
 *   and name. No match still works via a minimal generated Exercise.
 */

import { EXERCISE_CATALOG } from './exercise-catalog';
import type {
  Exercise,
  PrescribedExercise,
  Prescription,
  ResolvedProgram,
  RestCategory,
  SectionType,
  TrainingDayTemplate,
  Weekday,
  WorkoutSection,
  WorkoutTemplate,
} from './program-types';

export interface ParseProgramResult {
  /** Present only when there are zero errors. */
  program?: ResolvedProgram;
  errors: string[];
  warnings: string[];
}

const ALL_WEEKDAYS: Weekday[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

const WEEKDAY_ALIASES: Record<string, Weekday> = {
  monday: 'monday',
  mon: 'monday',
  tuesday: 'tuesday',
  tue: 'tuesday',
  tues: 'tuesday',
  wednesday: 'wednesday',
  wed: 'wednesday',
  thursday: 'thursday',
  thu: 'thursday',
  thur: 'thursday',
  thurs: 'thursday',
  friday: 'friday',
  fri: 'friday',
  saturday: 'saturday',
  sat: 'saturday',
  sunday: 'sunday',
  sun: 'sunday',
};

const SECTION_TYPES: SectionType[] = [
  'warmup',
  'speed',
  'power',
  'calisthenics',
  'strength',
  'core',
  'mobility',
  'recovery',
  'cardio',
];

const REST_CATEGORY_ALIASES: Record<string, RestCategory> = {
  'heavy compound': 'heavy-compound',
  'heavy-compound': 'heavy-compound',
  'moderate compound': 'moderate-compound',
  'moderate-compound': 'moderate-compound',
  isolation: 'isolation',
  sprint: 'sprint',
  sprinting: 'sprint',
  jump: 'jump',
  jumps: 'jump',
  'calisthenics skill': 'calisthenics-skill',
  'calisthenics-skill': 'calisthenics-skill',
  calisthenics: 'calisthenics-skill',
  skill: 'calisthenics-skill',
};

const DEFAULT_REST_DESCRIPTION = 'No workout scheduled. Rest or easy movement only.';
const SUNDAY_REST_DESCRIPTION =
  'No required workout. No guilt-driven conditioning. No requirement to close rings or maintain a streak. Walking and ordinary life activity are fine.';

function slugifyExerciseName(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'exercise';
}

function normalizeForCatalogMatch(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

const CATALOG_BY_NORMALIZED_NAME = new Map<string, Exercise>();
for (const exercise of EXERCISE_CATALOG) {
  CATALOG_BY_NORMALIZED_NAME.set(normalizeForCatalogMatch(exercise.name), exercise);
}

function restTemplateFor(weekday: Weekday): WorkoutTemplate {
  return {
    restDay: true,
    id: weekday,
    weekday,
    name: 'Rest',
    description: weekday === 'sunday' ? SUNDAY_REST_DESCRIPTION : DEFAULT_REST_DESCRIPTION,
  };
}

interface PerSideDetection {
  perSide: boolean;
  cleaned: string;
}

const PER_SIDE_PATTERN = /\b(each side|per side|per leg|each leg)\b/i;

function detectPerSide(text: string): PerSideDetection {
  const match = PER_SIDE_PATTERN.exec(text);
  if (!match) return { perSide: false, cleaned: text };
  return { perSide: true, cleaned: (text.slice(0, match.index) + text.slice(match.index + match[0].length)).trim() };
}

const APPROX_MINUTES_PATTERN = /\(?~\s*(\d+)(?:\s*-\s*(\d+))?\s*min(?:utes)?\)?/i;

function extractApproxMinutes(description: string): {
  description: string;
  approxMinMinutes?: number;
  approxMaxMinutes?: number;
} {
  const match = APPROX_MINUTES_PATTERN.exec(description);
  if (!match) return { description: description.trim() };
  const min = Number.parseInt(match[1], 10);
  const max = match[2] !== undefined ? Number.parseInt(match[2], 10) : min;
  const cleaned = (description.slice(0, match.index) + description.slice(match.index + match[0].length))
    .replace(/\s+/g, ' ')
    .trim();
  return { description: cleaned, approxMinMinutes: min, approxMaxMinutes: max };
}

const DISTANCE_PATTERN = /^(\d+)\s*[x×]\s*(\d+(?:\.\d+)?)\s*m(?:eters?)?\b/i;
const SECONDS_PATTERN = /^(\d+)\s*[x×]\s*(\d+)(?:\s*-\s*(\d+))?\s*s(?:ec(?:onds)?)?\b/i;
const REPS_PATTERN = /^(\d+)\s*[x×]\s*(\d+)(?:\s*-\s*(\d+))?(?:\s*reps?)?\b/i;
const HOLD_KEYWORD_PATTERN = /\bhold\b/i;

/** Parses the core "sets x ..." text of a prescription. Always succeeds:
 * anything that doesn't match a structured shape becomes a qualitative
 * description (with optional approx-minutes annotation stripped out). */
function parseCorePrescription(rawText: string): Prescription {
  const { perSide, cleaned } = detectPerSide(rawText);

  const distanceMatch = DISTANCE_PATTERN.exec(cleaned);
  if (distanceMatch) {
    return {
      type: 'distance',
      sets: Number.parseInt(distanceMatch[1], 10),
      meters: Number.parseFloat(distanceMatch[2]),
      timed: true,
    };
  }

  const secondsMatch = SECONDS_PATTERN.exec(cleaned);
  if (secondsMatch) {
    const sets = Number.parseInt(secondsMatch[1], 10);
    const min = Number.parseInt(secondsMatch[2], 10);
    const max = secondsMatch[3] !== undefined ? Number.parseInt(secondsMatch[3], 10) : min;
    const isHold = HOLD_KEYWORD_PATTERN.test(cleaned);
    return isHold
      ? { type: 'hold', sets, minSeconds: min, maxSeconds: max, ...(perSide ? { perSide: true } : {}) }
      : { type: 'duration', sets, minSeconds: min, maxSeconds: max, ...(perSide ? { perSide: true } : {}) };
  }

  const repsMatch = REPS_PATTERN.exec(cleaned);
  if (repsMatch) {
    const sets = Number.parseInt(repsMatch[1], 10);
    const min = Number.parseInt(repsMatch[2], 10);
    const max = repsMatch[3] !== undefined ? Number.parseInt(repsMatch[3], 10) : min;
    return { type: 'repetitions', sets, minReps: min, maxReps: max, ...(perSide ? { perSide: true } : {}) };
  }

  const { description, approxMinMinutes, approxMaxMinutes } = extractApproxMinutes(rawText.trim());
  return {
    type: 'qualitative',
    description,
    ...(approxMinMinutes !== undefined ? { approxMinMinutes, approxMaxMinutes } : {}),
  };
}

interface ParserState {
  errors: string[];
  warnings: string[];
  programName: string | null;
  templates: Partial<Record<Weekday, WorkoutTemplate>>;
  exercisesById: Map<string, Exercise>;
}

function resolveExerciseId(name: string, state: ParserState): string {
  const id = slugifyExerciseName(name);
  if (!state.exercisesById.has(id)) {
    const catalogMatch = CATALOG_BY_NORMALIZED_NAME.get(normalizeForCatalogMatch(name));
    if (catalogMatch) {
      state.exercisesById.set(id, { ...catalogMatch, id, name: name.trim() });
    } else {
      state.exercisesById.set(id, {
        id,
        name: name.trim(),
        category: 'strength',
        primaryMuscles: [],
        secondaryMuscles: [],
        progressionType: 'none',
      });
    }
  }
  return id;
}

function normalizeRestCategory(raw: string): RestCategory | null {
  const key = raw.trim().toLowerCase();
  return REST_CATEGORY_ALIASES[key] ?? REST_CATEGORY_ALIASES[key.replace(/-/g, ' ')] ?? null;
}

const ULTIMATE_FLAG_PATTERN = /^\+\s*ultimate practice later\b/i;
const TARGET_DURATION_PATTERN = /^(?:target duration|duration)\s*:\s*(\d+)/i;
const DAY_HEADER_PATTERN = /^##\s+([A-Za-z]+)\s*(?::\s*(.*))?$/;
const SECTION_HEADER_PATTERN = /^###\s+(.+)$/;
const SECTION_TYPE_PATTERN = /^(.*?)\s*\(([^)]*)\)\s*$/;
const SECTION_NOTE_PATTERN = /^\s*>\s?(.*)$/;
const BULLET_PATTERN = /^(\s*)-\s+(.*)$/;
const TITLE_PATTERN = /^#\s+(.+)$/;

interface DayBlock {
  weekday: Weekday;
  headerLine: number;
  name: string;
  description: string[];
  targetDurationMinutes?: number;
  ultimatePracticeLater: boolean;
  sections: WorkoutSection[];
}

function finalizeDay(block: DayBlock): TrainingDayTemplate {
  return {
    restDay: false,
    id: block.weekday,
    weekday: block.weekday as Exclude<Weekday, 'sunday'>,
    name: block.name,
    description: block.description.length > 0 ? block.description.join(' ') : undefined,
    targetDurationMinutes: block.targetDurationMinutes,
    ultimatePracticeLater: block.ultimatePracticeLater,
    sections: block.sections,
  };
}

/**
 * Splits an exercise-name part on " / " or " or " (case-insensitive) into a
 * primary name plus at most one alternative — an in-program "or" choice
 * pair, e.g. "Face Pull / Reverse Cable Fly" or "Face Pull or Reverse Cable
 * Fly". Extra segments beyond two are dropped with a warning.
 */
function splitChoiceNames(namePart: string, lineNumber: number, warnings: string[]): string[] {
  const parts = namePart
    .split(/\s+\/\s+|\s+or\s+/i)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  if (parts.length > 2) {
    warnings.push(
      `Line ${lineNumber}: "${namePart}" lists more than two choices; only the first two were used.`
    );
    return parts.slice(0, 2);
  }
  return parts;
}

export function parseProgramText(text: string): ParseProgramResult {
  const state: ParserState = {
    errors: [],
    warnings: [],
    programName: null,
    templates: {},
    exercisesById: new Map(),
  };

  const lines = text.replace(/\r\n/g, '\n').split('\n');

  let currentDay: DayBlock | null = null;
  let currentSection: WorkoutSection | null = null;
  let skippingInvalidDay = false;
  let skippingSundayBody = false;
  let sundayHeaderLine: number | null = null;
  let exerciseBaselineIndent: number | null = null;
  let lastExercise: PrescribedExercise | null = null;
  let lastExerciseQualitative: Extract<Prescription, { type: 'qualitative' }> | null = null;

  function closeSection() {
    if (currentDay && currentSection) {
      currentDay.sections.push(currentSection);
    }
    currentSection = null;
    exerciseBaselineIndent = null;
    lastExercise = null;
    lastExerciseQualitative = null;
  }

  function closeDay() {
    closeSection();
    if (currentDay) {
      if (state.templates[currentDay.weekday]) {
        state.errors.push(
          `Line ${currentDay.headerLine}: ${currentDay.weekday} is defined more than once; only the first definition is kept.`
        );
      } else {
        state.templates[currentDay.weekday] = finalizeDay(currentDay);
      }
    }
    currentDay = null;
    if (skippingSundayBody && sundayHeaderLine !== null) {
      state.warnings.push(
        `Line ${sundayHeaderLine}: Sunday is always a complete rest day; the pasted Sunday session was ignored.`
      );
    }
    skippingSundayBody = false;
    sundayHeaderLine = null;
  }

  for (let index = 0; index < lines.length; index += 1) {
    const lineNumber = index + 1;
    const rawLine = lines[index];
    const trimmed = rawLine.trim();

    if (trimmed.length === 0) continue;

    // --- Top-level title, only recognized outside any day block ---
    if (!currentDay && !skippingInvalidDay && !skippingSundayBody) {
      const titleMatch = TITLE_PATTERN.exec(trimmed);
      if (titleMatch && !DAY_HEADER_PATTERN.test(trimmed)) {
        if (state.programName === null) {
          state.programName = titleMatch[1].trim();
        } else {
          state.warnings.push(`Line ${lineNumber}: a second program title was ignored; the first title is kept.`);
        }
        continue;
      }
    }

    // --- Day header ---
    const dayHeaderMatch = DAY_HEADER_PATTERN.exec(trimmed);
    if (dayHeaderMatch) {
      closeDay();
      skippingInvalidDay = false;
      skippingSundayBody = false;

      const weekdayWord = dayHeaderMatch[1].toLowerCase();
      const weekday = WEEKDAY_ALIASES[weekdayWord];
      if (!weekday) {
        state.errors.push(
          `Line ${lineNumber}: unrecognized weekday "${dayHeaderMatch[1]}" in day header. Expected a weekday name like Monday or Tuesday.`
        );
        skippingInvalidDay = true;
        continue;
      }

      if (weekday === 'sunday') {
        skippingSundayBody = true;
        sundayHeaderLine = lineNumber;
        continue;
      }

      const dayName = dayHeaderMatch[2]?.trim() || `${weekday[0].toUpperCase()}${weekday.slice(1)} Workout`;
      currentDay = {
        weekday,
        headerLine: lineNumber,
        name: dayName,
        description: [],
        ultimatePracticeLater: false,
        sections: [],
      };
      continue;
    }

    if (skippingInvalidDay || skippingSundayBody) {
      continue;
    }

    if (!currentDay) {
      // Stray text before any day header (besides a title) is ignored.
      continue;
    }

    // --- Ultimate-practice flag: recognized anywhere within a day block ---
    if (ULTIMATE_FLAG_PATTERN.test(trimmed)) {
      currentDay.ultimatePracticeLater = true;
      continue;
    }

    // --- Section header ---
    const sectionHeaderMatch = SECTION_HEADER_PATTERN.exec(trimmed);
    if (sectionHeaderMatch) {
      closeSection();
      const body = sectionHeaderMatch[1].trim();
      const typeMatch = SECTION_TYPE_PATTERN.exec(body);

      let sectionName = body;
      let typeToken = '';
      let optional = false;

      if (typeMatch) {
        sectionName = typeMatch[1].trim();
        const parenBody = typeMatch[2].split(',').map((p) => p.trim());
        typeToken = (parenBody[0] ?? '').toLowerCase();
        optional = parenBody.slice(1).some((p) => p.toLowerCase() === 'optional');
      } else {
        state.errors.push(
          `Line ${lineNumber}: section "${body}" is missing a type in parentheses, e.g. "${body} (strength)".`
        );
      }

      let sectionType: SectionType = 'strength';
      if (typeMatch) {
        if (SECTION_TYPES.includes(typeToken as SectionType)) {
          sectionType = typeToken as SectionType;
        } else {
          state.errors.push(
            `Line ${lineNumber}: unknown section type "${typeToken}" in section "${sectionName}". Expected one of: ${SECTION_TYPES.join(', ')}.`
          );
        }
      }

      currentSection = {
        id: `${currentDay.weekday}-${sectionName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`,
        name: sectionName,
        order: currentDay.sections.length + 1,
        type: sectionType,
        optional: optional || undefined,
        notes: [],
        exercises: [],
      };
      continue;
    }

    if (!currentSection) {
      const preSectionDurationMatch = TARGET_DURATION_PATTERN.exec(trimmed);
      if (preSectionDurationMatch) {
        currentDay.targetDurationMinutes = Number.parseInt(preSectionDurationMatch[1], 10);
      } else {
        currentDay.description.push(trimmed);
      }
      continue;
    }

    // --- Section note (blockquote-style) ---
    const noteMatch = SECTION_NOTE_PATTERN.exec(rawLine);
    if (noteMatch) {
      (currentSection.notes ??= []).push(noteMatch[1].trim());
      continue;
    }

    // --- Bullet: exercise line or qualitative sub-item ---
    const bulletMatch = BULLET_PATTERN.exec(rawLine);
    if (bulletMatch) {
      const indent = bulletMatch[1].length;
      const content = bulletMatch[2].trim();

      const isSubItem = exerciseBaselineIndent !== null && indent > exerciseBaselineIndent;
      if (isSubItem) {
        if (lastExerciseQualitative) {
          (lastExerciseQualitative.items ??= []).push(content);
        } else if (lastExercise) {
          state.warnings.push(
            `Line ${lineNumber}: sub-items are only supported for descriptive exercises; ignored here.`
          );
        }
        continue;
      }

      exerciseBaselineIndent = indent;

      const colonIndex = content.indexOf(':');
      if (colonIndex === -1) {
        state.errors.push(
          `Line ${lineNumber}: exercise line must have the form "Name: prescription" (no colon found in "${content}").`
        );
        lastExercise = null;
        lastExerciseQualitative = null;
        continue;
      }

      const namePart = content.slice(0, colonIndex).trim();
      const afterColon = content.slice(colonIndex + 1).trim();
      if (namePart.length === 0) {
        state.errors.push(`Line ${lineNumber}: exercise line is missing a name before the colon.`);
        continue;
      }

      const names = splitChoiceNames(namePart, lineNumber, state.warnings);
      if (names.length === 0) {
        state.errors.push(`Line ${lineNumber}: exercise line has no usable exercise name.`);
        continue;
      }

      const segments = afterColon.split('|').map((s) => s.trim());
      const prescriptionText = segments[0] ?? '';
      let restCategory: RestCategory | undefined;
      const notes: string[] = [];

      for (const segment of segments.slice(1)) {
        const restMatch = /^rest\s*:\s*(.+)$/i.exec(segment);
        const notesMatch = /^notes?\s*:\s*(.+)$/i.exec(segment);
        if (restMatch) {
          const normalized = normalizeRestCategory(restMatch[1]);
          if (normalized) {
            restCategory = normalized;
          } else {
            state.errors.push(
              `Line ${lineNumber}: unknown rest category "${restMatch[1].trim()}". Expected one of: heavy compound, moderate compound, isolation, sprint, jump, calisthenics skill.`
            );
          }
        } else if (notesMatch) {
          for (const note of notesMatch[1].split(';')) {
            const trimmedNote = note.trim();
            if (trimmedNote.length > 0) notes.push(trimmedNote);
          }
        } else if (segment.length > 0) {
          state.warnings.push(`Line ${lineNumber}: unrecognized clause "${segment}" was ignored.`);
        }
      }

      const prescription = parseCorePrescription(prescriptionText);
      const primaryId = resolveExerciseId(names[0], state);
      const alternativeIds = names.slice(1).map((n) => resolveExerciseId(n, state));

      const prescribedExercise: PrescribedExercise = {
        exerciseId: primaryId,
        order: currentSection.exercises.length + 1,
        prescription,
        ...(alternativeIds.length > 0 ? { alternativeExerciseIds: alternativeIds } : {}),
        ...(restCategory ? { restCategory } : {}),
        ...(notes.length > 0 ? { notes } : {}),
      };

      currentSection.exercises.push(prescribedExercise);
      lastExercise = prescribedExercise;
      lastExerciseQualitative = prescription.type === 'qualitative' ? prescription : null;
      continue;
    }

    // Any other line inside a section that isn't a note or an exercise
    // bullet. A stray target-duration line is tolerated here too, since the
    // format is meant to be forgiving about where day-level lines land.
    const strayDurationMatch = TARGET_DURATION_PATTERN.exec(trimmed);
    if (strayDurationMatch) {
      currentDay.targetDurationMinutes = Number.parseInt(strayDurationMatch[1], 10);
      continue;
    }

    state.warnings.push(
      `Line ${lineNumber}: unrecognized line inside section "${currentSection.name}", ignored: "${trimmed}"`
    );
  }

  closeDay();

  for (const weekday of ALL_WEEKDAYS) {
    if (!state.templates[weekday]) {
      state.templates[weekday] = restTemplateFor(weekday);
    }
  }
  // Sunday is never anything but rest, regardless of what was parsed.
  state.templates.sunday = restTemplateFor('sunday');

  const exercises: Record<string, Exercise> = {};
  for (const [id, exercise] of state.exercisesById) {
    exercises[id] = exercise;
  }

  if (state.errors.length > 0) {
    return { errors: state.errors, warnings: state.warnings };
  }

  const templates = state.templates as Record<Weekday, WorkoutTemplate>;

  const program: ResolvedProgram = {
    name: state.programName ?? 'Untitled Program',
    templates,
    exercises,
  };

  return { program, errors: state.errors, warnings: state.warnings };
}
