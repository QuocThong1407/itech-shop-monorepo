export type UserRole = "CUSTOMER" | "SELLER" | "ADMIN";

export type UserRecord = {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  emailVerified: string | null;
  isOAuth?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type UsersResponse = {
  users: UserRecord[];
  pagination: Pagination;
};

export type StatsResponse = {
  total: number;
  customers: number;
  sellers: number;
  admins: number;
};

export type ModalMode = "view" | "edit" | "add" | null;

export type UserFormState = {
  username: string;
  email: string;
  password: string;
  role: UserRole;
};
