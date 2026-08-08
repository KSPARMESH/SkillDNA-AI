export type SortOrder = 'asc' | 'desc';

export interface SortOption {
  field: string;
  order: SortOrder;
}

export function buildSortQuery(sorts?: SortOption[]) {
  if (!sorts || sorts.length === 0) {
    return { createdAt: 'desc' as SortOrder };
  }
  const sortObj: Record<string, SortOrder> = {};
  for (const s of sorts) {
    sortObj[s.field] = s.order;
  }
  return sortObj;
}
