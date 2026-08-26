import { L_SIT_PROGRESSION, PLANCHE_PROGRESSION } from "@/lib/program/progression-chains";
import type { ProgressionChain } from "@/lib/program/program-types";

const PROGRESSION_CHAINS: Record<string, ProgressionChain> = {
  [L_SIT_PROGRESSION.id]: L_SIT_PROGRESSION,
  [PLANCHE_PROGRESSION.id]: PLANCHE_PROGRESSION,
};

/**
 * Renders a skill progression chain (L-sit, planche) as its ordered level
 * list, sourced only from lib/program/progression-chains.ts. Renders
 * nothing when the chain id is unrecognized, so the page can fall back to
 * its own plain-text message.
 */
export default function ProgressionChainLevels({ chainId }: { chainId: string }) {
  const chain = PROGRESSION_CHAINS[chainId];
  if (!chain) return null;

  const orderedLevels = [...chain.levels].sort((a, b) => a.order - b.order);

  return (
    <ol className="flex flex-col divide-y divide-line-hairline">
      {orderedLevels.map((level) => (
        <li key={level.id} className="flex flex-col gap-0.5 py-2.5">
          <span className="flex items-baseline gap-2">
            <span className="font-display text-xs font-semibold tabular-nums text-ink-tertiary">{level.order}</span>
            <span className="text-sm font-medium text-ink-primary">{level.name}</span>
          </span>
          {level.description ? <p className="pl-6 text-xs text-ink-secondary">{level.description}</p> : null}
        </li>
      ))}
    </ol>
  );
}
