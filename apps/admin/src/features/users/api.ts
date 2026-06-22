import { apiJson } from "../../lib/admin-api";
import type { StatsResponse, UsersResponse, UserRole } from "./types";

export function fetchUserStats() {
  return apiJson<StatsResponse>("/users/stats");
}

export function fetchUsers(params: {
  page: number;
  limit: number;
  role: "ALL" | UserRole;
  query: string;
}) {
  const searchParams = new URLSearchParams();
  searchParams.set("page", String(params.page));
  searchParams.set("limit", String(params.limit));

  if (params.role !== "ALL") {
    searchParams.set("role", params.role);
  }

  if (params.query.trim()) {
    searchParams.set("search", params.query.trim());
  }

  return apiJson<UsersResponse>(`/users?${searchParams.toString()}`);
}

export function createUser(payload: {
  username: string;
  email: string;
  password: string;
  role: UserRole;
}) {
  return apiJson("/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateUser(
  userId: string,
  payload: {
    username: string;
    role: UserRole;
  },
) {
  return apiJson(`/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteUser(userId: string) {
  return apiJson(`/users/${userId}`, {
    method: "DELETE",
  });
}
