import { HttpStatusCode, ApiErrorCode } from '../enums/api.enum';

export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: HttpStatusCode;
  message: string;
  data?: T;
  meta?: Record<string, any>;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  statusCode: HttpStatusCode;
  errorCode: ApiErrorCode;
  message: string;
  errors?: Array<{ field: string; message: string }>;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    totalItems: number;
    currentPage: number;
    totalPages: number;
    pageSize: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
