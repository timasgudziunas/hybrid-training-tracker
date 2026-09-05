"use client";

import Link from "next/link";
import { useState } from "react";

/**
 * App-wide navigation (R8 integration pass). Every destination — Today,
 * History, Library, Program, Body, Review, Settings — is reachable
 * from every page within two taps, without cluttering the gym-time
 * experience: mobile keeps only the two most-used items inline (Today,
 * History) plus a "More" disclosure for the rest; desktop shows everything
 * inline, since there's room and no gym-time urgency.
 *
 * Deliberately not rendered on /workout/active (the active workout stays
 * immersive) or /unlock.
 */
const PRIMARY_ITEMS = [
  { href: "/", label: "Today", key: "today" },
  { href: "/history", label: "History", key: "history" },
] as const;

const MORE_ITEMS = [
  { href: "/exercises", label: "Library", key: "exercises" },
  { href: "/program", label: "Program", key: "program" },
  { href: "/body", label: "Body", key: "body" },
  { href: "/review", label: "Review", key: "review" },
  { href: "/settings", label: "Settings", key: "settings" },
] as const;

const ALL_ITEMS = [...PRIMARY_ITEMS, ...MORE_ITEMS];

type NavItem = (typeof ALL_ITEMS)[number];
export type NavKey = NavItem["key"];

function NavLink({ item, active, onClick }: { item: NavItem; active: NavKey; onClick?: () => void }) {
  const isActive = item.key === active;
  return (
    <Link
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      onClick={onClick}
      className={`text-sm font-medium transition-colors ${
        isActive ? "text-ink-primary" : "text-ink-tertiary hover:text-ink-secondary"
      }`}
    >
      {item.label}
    </Link>
  );
}

export default function SiteHeader({ active }: { active: NavKey }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const activeIsInMore = MORE_ITEMS.some((item) => item.key === active);

  return (
    <header className="flex flex-col">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-ink-secondary transition-colors hover:text-ink-primary"
        >
          Hybrid Training
        </Link>

        {/* Desktop: every destination inline, no disclosure needed. */}
        <nav className="hidden items-center gap-5 sm:flex">
          {ALL_ITEMS.map((item) => (
            <NavLink key={item.key} item={item} active={active} />
          ))}
        </nav>

        {/* Mobile: the three primary destinations plus a "More" toggle. */}
        <nav className="flex items-center gap-4 sm:hidden">
          {PRIMARY_ITEMS.map((item) => (
            <NavLink key={item.key} item={item} active={active} />
          ))}
          <button
            type="button"
            onClick={() => setMoreOpen((open) => !open)}
            aria-expanded={moreOpen}
            aria-controls="site-header-more-panel"
            className={`text-sm font-medium transition-colors ${
              moreOpen || activeIsInMore ? "text-ink-primary" : "text-ink-tertiary hover:text-ink-secondary"
            }`}
          >
            More
          </button>
        </nav>
      </div>

      {/* Height-animated disclosure panel, same mechanism as the workout
          screen's "Help me feel it" (see globals.css .disclosure-panel). */}
      <div id="site-header-more-panel" className={`disclosure-panel sm:hidden ${moreOpen ? "is-open" : ""}`}>
        <div>
          <nav className="flex flex-col gap-4 border-t border-line-hairline pt-4 mt-4">
            {MORE_ITEMS.map((item) => (
              <NavLink key={item.key} item={item} active={active} onClick={() => setMoreOpen(false)} />
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
