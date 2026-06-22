import type { Pagination, StatsResponse, UserFormState, UserRole } from "./types";

export const defaultPagination: Pagination = {
  page: 1,
  limit: 8,
  total: 0,
  totalPages: 0,
};

export const roleTabs: Array<{ label: string; value: "ALL" | UserRole }> = [
  { label: "All users", value: "ALL" },
  { label: "Customers", value: "CUSTOMER" },
  { label: "Sellers", value: "SELLER" },
  { label: "Admins", value: "ADMIN" },
];

export const roleMeta: Record<UserRole, { tone: string; label: string }> = {
  CUSTOMER: { tone: "bg-sky-50 text-sky-700 ring-sky-200", label: "Customer" },
  SELLER: { tone: "bg-amber-50 text-amber-700 ring-amber-200", label: "Seller" },
  ADMIN: { tone: "bg-rose-50 text-rose-700 ring-rose-200", label: "Admin" },
};

export const emptyStats: StatsResponse = {
  total: 0,
  customers: 0,
  sellers: 0,
  admins: 0,
};

export function initialFormState(): UserFormState {
  return {
    username: "",
    email: "",
    password: "",
    role: "CUSTOMER",
  };
}
