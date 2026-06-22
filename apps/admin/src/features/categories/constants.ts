import type { CategoryFormState, CategoryStatsResponse, Pagination } from "./types";

export const defaultPagination: Pagination = {
  page: 1,
  limit: 8,
  total: 0,
  totalPages: 0,
};

export const emptyStats: CategoryStatsResponse = {
  total: 0,
  topCategories: [],
  allCategories: [],
};

export function initialFormState(): CategoryFormState {
  return {
    name: "",
    description: "",
    image: null,
    preview: "",
  };
}
