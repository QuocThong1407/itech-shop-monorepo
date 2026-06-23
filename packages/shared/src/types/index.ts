export type EntityId = string;

export type ApiError = {
  message: string;
  code?: string;
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PagedResult<TKey extends string, T> = {
  [K in TKey]: T[];
} & { pagination: Pagination };

export type PaginatedResponse<T> = {
  data: T[];
  pagination: Pagination;
};

export type Money = {
  amount: number;
  currency: "VND" | "USD";
};
