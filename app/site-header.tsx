import Link from "next/link";

const NAV_ITEMS = [
  { href: "/", label: "Today", key: "today" },
  { href: "/program", label: "Program", key: "program" },
  { href: "/body", label: "Body", key: "body" },
] as const;

/** One consistent header/nav treatment across Today / Program / Body
 * (design brief, R2 rework). A plain server component: each page already
 * knows which of the three it is. */
export default function SiteHeader({ active }: { active: (typeof NAV_ITEMS)[number]["key"] }) {
  return (
    <header className="flex items-center justify-between">
      <Link
        href="/"
        className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-ink-secondary transition-colors hover:text-ink-primary"
      >
        Hybrid Training
      </Link>
      <nav className="flex items-center gap-5">
        {NAV_ITEMS.map((item) => {
          const isActive = item.key === active;
          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`text-sm font-medium transition-colors ${
                isActive ? "text-ink-primary" : "text-ink-tertiary hover:text-ink-secondary"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
