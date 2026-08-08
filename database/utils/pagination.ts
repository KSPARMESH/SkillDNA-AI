export interface PaginationOptions {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    totalItems?: number;
    currentPage?: number;
    totalPages?: number;
    pageSize: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextCursor?: string;
  };
}

export function getOffsetPagination(options: PaginationOptions) {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 20));
  const skip = (page - 1) * limit;

  return { skip, take: limit, page, limit };
}
