export type TrendPoint = { date: string; value: number };

const WIDTH = 400;
const HEIGHT = 180;
const PADDING = { top: 14, right: 14, bottom: 24, left: 40 };
const GRID_LINES = 3;

// Hardcoded to match the design tokens in app/globals.css: SVG presentation
// attributes don't reliably resolve CSS custom properties, so these mirror
// --color-line-hairline / --color-ink-tertiary / --color-accent-strong
// directly, same approach as app/body/weight-trend-chart.tsx.
const GRID_COLOR = "rgba(255, 255, 255, 0.08)";
const AXIS_TEXT_COLOR = "#8a8781";
const LINE_COLOR = "#4d78ea";
const POINT_COLOR = "#7aa0f4";

/**
 * Generic single-series line chart over time: hand-rolled SVG, no charting
 * library, styled like app/body/weight-trend-chart.tsx. Used for every
 * benchmark trend and the bodyweight trend so all progress charts read as
 * one system. A single series never needs a legend (dataviz skill); the
 * card title above the chart names it.
 */
export default function TrendChart({
  data,
  ariaLabel,
  formatLatest,
  formatAxisValue,
  caption,
}: {
  data: TrendPoint[];
  ariaLabel: string;
  formatLatest: (value: number) => string;
  formatAxisValue: (value: number) => string;
  caption?: string;
}) {
  if (data.length === 0) {
    return <p className="text-sm text-ink-tertiary">No measurements yet.</p>;
  }

  const latest = data[data.length - 1];

  if (data.length === 1) {
    return (
      <div className="flex flex-col gap-1">
        <p className="font-display text-4xl font-bold tabular-nums text-ink-primary">{formatLatest(latest.value)}</p>
        <p className="text-xs text-ink-tertiary">{latest.date}. One measurement so far.</p>
      </div>
    );
  }

  const values = data.map((point) => point.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;
  const yMin = minValue - range * 0.1;
  const yMax = maxValue + range * 0.1;

  const plotWidth = WIDTH - PADDING.left - PADDING.right;
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;

  const xFor = (index: number) => PADDING.left + (index / (data.length - 1)) * plotWidth;
  const yFor = (value: number) => PADDING.top + plotHeight - ((value - yMin) / (yMax - yMin)) * plotHeight;

  const points = data.map((point, i) => `${xFor(i)},${yFor(point.value)}`).join(" ");

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-display text-4xl font-bold tabular-nums text-ink-primary">{formatLatest(latest.value)}</p>
        <p className="text-xs text-ink-tertiary">{latest.date}</p>
      </div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label={ariaLabel}>
        {Array.from({ length: GRID_LINES + 1 }).map((_, i) => {
          const y = PADDING.top + (plotHeight / GRID_LINES) * i;
          const value = yMax - ((yMax - yMin) / GRID_LINES) * i;
          return (
            <g key={i}>
              <line x1={PADDING.left} x2={WIDTH - PADDING.right} y1={y} y2={y} stroke={GRID_COLOR} strokeWidth={1} />
              <text x={PADDING.left - 6} y={y + 3} textAnchor="end" fontSize={9} fill={AXIS_TEXT_COLOR}>
                {formatAxisValue(value)}
              </text>
            </g>
          );
        })}

        <polyline
          points={points}
          fill="none"
          stroke={LINE_COLOR}
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {data.map((point, i) => (
          <circle key={`${point.date}-${i}`} cx={xFor(i)} cy={yFor(point.value)} r={3} fill={POINT_COLOR} />
        ))}

        <text x={PADDING.left} y={HEIGHT - 6} fontSize={9} fill={AXIS_TEXT_COLOR}>
          {data[0].date}
        </text>
        <text x={WIDTH - PADDING.right} y={HEIGHT - 6} fontSize={9} fill={AXIS_TEXT_COLOR} textAnchor="end">
          {data[data.length - 1].date}
        </text>
      </svg>
      {caption ? <p className="text-[11px] text-ink-tertiary">{caption}</p> : null}
    </div>
  );
}
