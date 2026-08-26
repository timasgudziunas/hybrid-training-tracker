/** Capitalizes the first letter of a lowercase string-literal-union value
 * (e.g. a Weekday or SectionType) for display. Not a general text utility —
 * scoped to labeling those small closed vocabularies. */
export function capitalizeLabel(value: string): string {
  return value.length === 0 ? value : value[0].toUpperCase() + value.slice(1);
}
