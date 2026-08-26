/**
 * Skill progression chains, stored once as data (config over code).
 * Referenced by Exercise.progressionChainId for exercises whose
 * progressionType is 'progression-chain'.
 */

import type { ProgressionChain } from './program-types';

/**
 * L-sit progression, exactly as named in TRAINING_SYSTEM.md §6:
 * "tuck support, tuck L-sit, one-leg L-sit, full L-sit."
 */
export const L_SIT_PROGRESSION: ProgressionChain = {
  id: 'l-sit-progression',
  name: 'L-Sit Progression',
  levels: [
    { id: 'tuck-support', name: 'Tuck Support', order: 1 },
    { id: 'tuck-l-sit', name: 'Tuck L-Sit', order: 2 },
    { id: 'one-leg-l-sit', name: 'One-Leg L-Sit', order: 3 },
    { id: 'full-l-sit', name: 'Full L-Sit', order: 4 },
  ],
};

/**
 * Planche progression. TRAINING_SYSTEM.md §3/§8 only ever names one current
 * step, "Planche Leans," progressed by "gradually increasing forward lean"
 * (a continuous cue, not discrete named levels the way L-sit is specified).
 * Unlike L-sit, the program does not yet enumerate further named planche
 * levels (e.g. tuck/straddle/full planche) — inventing them would be
 * coaching content the source doc doesn't contain. This chain is
 * intentionally minimal and should gain levels only when TRAINING_SYSTEM.md
 * specifies them.
 */
export const PLANCHE_PROGRESSION: ProgressionChain = {
  id: 'planche-progression',
  name: 'Planche Progression',
  levels: [
    {
      id: 'planche-lean',
      name: 'Planche Lean',
      order: 1,
      description: 'Progressed by gradually increasing forward lean, per TRAINING_SYSTEM.md §3.',
    },
  ],
};
