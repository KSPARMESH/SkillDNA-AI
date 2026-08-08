import { getOffsetPagination, PaginationOptions } from './pagination';
import { buildSortQuery, SortOption } from './sorting';

export interface QueryParams extends PaginationOptions {
  sorts?: SortOption[];
  search?: string;
}

export function buildPrismaQuery(params: QueryParams) {
  const { skip, take, page, limit } = getOffsetPagination(params);
  const orderBy = buildSortQuery(params.sorts);

  return {
    skip,
    take,
    orderBy,
    page,
    limit,
  };
}
