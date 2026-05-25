export type EntityId = string;

export type ApiError = {
  message: string;
  code?: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};

export type Money = {
  amount: number;
  currency: "VND" | "USD";
};
