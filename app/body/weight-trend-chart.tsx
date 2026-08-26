type ChartRow = { checkin_date: string; weight_lbs: number };

const WIDTH = 600;
const HEIGHT = 220;
const PADDING = { top: 16, right: 16, bottom: 28, left: 40 };
const GRID_LINES = 4;

// Hardcoded to match the design tokens in globals.css: SVG presentation
// attributes don't reliably resolve CSS custom properties, so these mirror
// --color-line-hairline / --color-ink-tertiary / --color-accent directly.
const GRID_COLOR = "rgba(255, 255, 255, 0.08)";
const AXIS_TEXT_COLOR = "#8a8781";
const LINE_COLOR = "#4d78ea";
const POINT_COLOR = "#7aa0f4";

export default function WeightTrendChart({ data }: { data: ChartRow[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-ink-tertiary">No entries in the last 90 days.</p>;
  }

  if (data.length === 1) {
    return (
      <p className="text-sm text-ink-tertiary">
        One entry so far: {data[0].weight_lbs.toFixed(1)} lbs on {data[0].checkin_date}.
      </p>
    );
  }

  const weights = data.map((row) => row.weight_lbs);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const range = maxWeight - minWeight || 1;
  const yMin = Math.floor(minWeight - range * 0.1);
  const yMax = Math.ceil(maxWeight + range * 0.1);

  const plotWidth = WIDTH - PADDING.left - PADDING.right;
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;

  const xFor = (index: number) => PADDING.left + (index / (data.length - 1)) * plotWidth;
  const yFor = (weight: number) =>
    PADDING.top + plotHeight - ((weight - yMin) / (yMax - yMin)) * plotHeight;

  const points = data.map((row, i) => `${xFor(i)},${yFor(row.weight_lbs)}`).join(" ");

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="w-full"
      role="img"
      aria-label="Bodyweight trend over the last 90 days"
    >
      {Array.from({ length: GRID_LINES + 1 }).map((_, i) => {
        const y = PADDING.top + (plotHeight / GRID_LINES) * i;
        const value = yMax - ((yMax - yMin) / GRID_LINES) * i;
        return (
          <g key={i}>
            <line x1={PADDING.left} x2={WIDTH - PADDING.right} y1={y} y2={y} stroke={GRID_COLOR} strokeWidth={1} />
            <text x={PADDING.left - 8} y={y + 3} textAnchor="end" fontSize={10} fill={AXIS_TEXT_COLOR}>
              {value.toFixed(0)}
            </text>
          </g>
        );
      })}

      <polyline points={points} fill="none" stroke={LINE_COLOR} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      {data.map((row, i) => (
        <circle key={row.checkin_date} cx={xFor(i)} cy={yFor(row.weight_lbs)} r={3} fill={POINT_COLOR} />
      ))}

      <text x={PADDING.left} y={HEIGHT - 6} fontSize={10} fill={AXIS_TEXT_COLOR}>
        {data[0].checkin_date}
      </text>
      <text x={WIDTH - PADDING.right} y={HEIGHT - 6} fontSize={10} fill={AXIS_TEXT_COLOR} textAnchor="end">
        {data[data.length - 1].checkin_date}
      </text>
    </svg>
  );
}
