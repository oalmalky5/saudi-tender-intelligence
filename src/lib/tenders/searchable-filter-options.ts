export type SearchableFilterOption = {
  label: string;
  value: string;
};

export function uniqueSearchableFilterOptions(
  options: SearchableFilterOption[],
): SearchableFilterOption[] {
  return [...new Map(options.map((option) => [option.value, option])).values()];
}
