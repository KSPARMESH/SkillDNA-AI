export function buildFullTextSearch(query?: string) {
  if (!query || query.trim() === '') return undefined;
  const cleanQuery = query.trim().split(/\s+/).join(' & ');
  return {
    search: cleanQuery,
  };
}
