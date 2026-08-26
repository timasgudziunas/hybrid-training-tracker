import HistoryEntry from "./history-entry";

type CheckinRow = {
  checkin_date: string;
  weight_lbs: number;
  photo_path: string | null;
};

export default function CheckinHistory({
  rows,
  photoUrls,
}: {
  rows: CheckinRow[];
  photoUrls: Map<string, string>;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-zinc-500">No entries yet.</p>;
  }

  return (
    <ul className="flex flex-col divide-y divide-zinc-900">
      {rows.map((row) => (
        <HistoryEntry
          key={row.checkin_date}
          date={row.checkin_date}
          weightLbs={row.weight_lbs}
          hasPhoto={Boolean(row.photo_path)}
          photoUrl={(row.photo_path ? photoUrls.get(row.photo_path) : undefined) ?? null}
        />
      ))}
    </ul>
  );
}
