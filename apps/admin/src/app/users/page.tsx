"use client";

import { useEffect, useMemo, useState } from "react";

type UserRole = "CUSTOMER" | "SELLER" | "ADMIN";

type UserRecord = {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  emailVerified: string | null;
  isOAuth?: boolean;
  createdAt: string;
  updatedAt: string;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type UsersResponse = {
  users: UserRecord[];
  pagination: Pagination;
};

type StatsResponse = {
  total: number;
  customers: number;
  sellers: number;
  admins: number;
};

type ModalMode = "view" | "edit" | "add" | null;

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api";

const defaultPagination: Pagination = {
  page: 1,
  limit: 8,
  total: 0,
  totalPages: 0,
};

const roleTabs: Array<{ label: string; value: "ALL" | UserRole }> = [
  { label: "All users", value: "ALL" },
  { label: "Customers", value: "CUSTOMER" },
  { label: "Sellers", value: "SELLER" },
  { label: "Admins", value: "ADMIN" },
];

const roleMeta: Record<UserRole, { tone: string; label: string }> = {
  CUSTOMER: { tone: "bg-sky-50 text-sky-700 ring-sky-200", label: "Customer" },
  SELLER: { tone: "bg-amber-50 text-amber-700 ring-amber-200", label: "Seller" },
  ADMIN: { tone: "bg-rose-50 text-rose-700 ring-rose-200", label: "Admin" },
};

const emptyStats: StatsResponse = {
  total: 0,
  customers: 0,
  sellers: 0,
  admins: 0,
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function initialFormState() {
  return {
    username: "",
    email: "",
    password: "",
    role: "CUSTOMER" as UserRole,
  };
}

function roleClass(role: UserRole) {
  return roleMeta[role].tone;
}

async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (response.status === 401) {
    window.location.assign(`/login?next=${encodeURIComponent("/users")}`);
    throw new Error("Unauthorized");
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message || `Request failed with ${response.status}`);
  }

  return payload.data as T;
}

function statCard({
  title,
  value,
  note,
  tone,
}: {
  title: string;
  value: string | number;
  note: string;
  tone: string;
}) {
  return (
    <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>
          Live
        </span>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{note}</p>
    </article>
  );
}

export default function UsersPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [stats, setStats] = useState<StatsResponse>(emptyStats);
  const [pagination, setPagination] = useState<Pagination>(defaultPagination);
  const [role, setRole] = useState<"ALL" | UserRole>("CUSTOMER");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formState, setFormState] = useState(initialFormState);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const currentRoleLabel = useMemo(() => {
    const tab = roleTabs.find((item) => item.value === role);
    return tab?.label ?? "Customers";
  }, [role]);

  const fetchStats = async () => {
    try {
      const response = await apiJson<StatsResponse>("/users/stats");
      setStats(response);
    } catch (err) {
      console.error("Failed to load stats:", err);
    }
  };

  const fetchUsers = async (nextPage = 1) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("page", String(nextPage));
      params.set("limit", String(defaultPagination.limit));

      if (role !== "ALL") {
        params.set("role", role);
      }

      if (query.trim()) {
        params.set("search", query.trim());
      }

      const response = await apiJson<UsersResponse>(`/users?${params.toString()}`);
      setUsers(response.users ?? []);
      setPagination(response.pagination ?? defaultPagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchStats();
  }, []);

  useEffect(() => {
    void fetchUsers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, query]);

  const openView = (user: UserRecord) => {
    setSelectedUser(user);
    setModalMode("view");
  };

  const openEdit = (user: UserRecord) => {
    setSelectedUser(user);
    setFormState({
      username: user.username ?? "",
      email: user.email ?? "",
      password: "",
      role: user.role,
    });
    setModalMode("edit");
  };

  const openAdd = () => {
    setSelectedUser(null);
    setFormState(initialFormState());
    setModalMode("add");
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedUser(null);
    setSaving(false);
  };

  const submitUser = async () => {
    setSaving(true);
    setError(null);

    try {
      if (modalMode === "add") {
        if (!formState.username || !formState.email || !formState.password) {
          throw new Error("Please fill username, email and password.");
        }

        await apiJson("/users", {
          method: "POST",
          body: JSON.stringify({
            username: formState.username,
            email: formState.email,
            password: formState.password,
            role: formState.role,
          }),
        });
      }

      if (modalMode === "edit" && selectedUser) {
        await apiJson(`/users/${selectedUser.id}`, {
          method: "PUT",
          body: JSON.stringify({
            username: formState.username,
            role: formState.role,
          }),
        });
      }

      closeModal();
      await Promise.all([fetchStats(), fetchUsers(pagination.page)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save user.");
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (id: string) => {
    const confirmed = window.confirm(
      "Delete this user permanently? Related auth/profile data will also be removed.",
    );
    if (!confirmed) return;

    setSaving(true);
    setError(null);

    try {
      await apiJson(`/users/${id}`, { method: "DELETE" });
      await Promise.all([fetchStats(), fetchUsers(pagination.page)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user.");
    } finally {
      setSaving(false);
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.06)]">
        <div className="px-6 py-6 xl:px-8 xl:py-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-[#008ECC] ring-1 ring-sky-200">
              User management
            </span>
            <span className="text-sm text-slate-500">
              Manage customers, sellers, and admins from one workspace
            </span>
          </div>

          <div className="mt-4 max-w-3xl space-y-4">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Organize accounts, roles, and access in a cleaner admin panel.
            </h2>
            <p className="text-base leading-7 text-slate-600">
              This screen follows the spirit of the old React admin page, but presents users in a
              more modern structure with stronger spacing, clearer hierarchy, and faster filters.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCard({
          title: "Total users",
          value: stats.total.toLocaleString("vi-VN"),
          note: "All marketplace accounts in the database",
          tone: "bg-slate-100 text-slate-600 ring-slate-200",
        })}
        {statCard({
          title: "Customers",
          value: stats.customers.toLocaleString("vi-VN"),
          note: "Primary storefront audience",
          tone: "bg-sky-50 text-sky-700 ring-sky-200",
        })}
        {statCard({
          title: "Sellers",
          value: stats.sellers.toLocaleString("vi-VN"),
          note: "Merchant accounts for catalog and inventory",
          tone: "bg-amber-50 text-amber-700 ring-amber-200",
        })}
        {statCard({
          title: "Admins",
          value: stats.admins.toLocaleString("vi-VN"),
          note: "Back-office operators and supervisors",
          tone: "bg-rose-50 text-rose-700 ring-rose-200",
        })}
      </section>

      <section className="w-full">
        <article className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.05)] sm:p-6">
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {roleTabs.map((tab) => {
                const active = role === tab.value;
                return (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => {
                      setRole(tab.value);
                      setPagination(defaultPagination);
                    }}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      active
                        ? "bg-slate-900 text-white shadow-[0_12px_24px_rgba(15,23,42,0.18)]"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <form
                className="flex items-center gap-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  setQuery(search);
                }}
              >
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search username or email"
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 sm:w-72"
                />
                <button
                  type="submit"
                  className="h-11 rounded-2xl bg-[#008ECC] px-4 text-sm font-semibold text-white transition hover:bg-[#0075aa]"
                >
                  Search
                </button>
              </form>

              <button
                type="button"
                onClick={openAdd}
                className="h-11 rounded-2xl border border-slate-900 bg-slate-900 px-4 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(15,23,42,0.18)] transition hover:bg-slate-800"
              >
                Add user
              </button>
            </div>
          </div>

          {error ? (
            <div className="mt-5 rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[900px] border-separate border-spacing-y-3">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.2em] text-slate-400">
                  <th className="px-4 py-2 font-medium">User</th>
                  <th className="px-4 py-2 font-medium">Email</th>
                  <th className="px-4 py-2 font-medium">Role</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Created</th>
                  <th className="px-4 py-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-400">
                      Loading users...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-400">
                      No users found for the current filter.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="rounded-[1.25rem] bg-slate-50/80">
                      <td className="rounded-l-[1.25rem] px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`grid h-11 w-11 place-items-center rounded-2xl text-sm font-semibold text-white shadow-[0_10px_24px_rgba(15,23,42,0.12)] ${
                              user.role === "ADMIN"
                                ? "bg-gradient-to-br from-rose-500 to-rose-600"
                                : user.role === "SELLER"
                                  ? "bg-gradient-to-br from-amber-500 to-orange-500"
                                  : "bg-gradient-to-br from-sky-500 to-[#008ECC]"
                            }`}
                          >
                            {(user.username || "U").slice(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-950">{user.username}</p>
                            <p className="text-xs text-slate-500">ID: {user.id.slice(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">{user.email}</td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ring-1 ${roleClass(
                            user.role,
                          )}`}
                        >
                          {roleMeta[user.role].label}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ring-1 ${
                            user.emailVerified
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                              : "bg-amber-50 text-amber-700 ring-amber-200"
                          }`}
                        >
                          {user.emailVerified ? "Verified" : "Unverified"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-500">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="rounded-r-[1.25rem] px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openView(user)}
                            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => openEdit(user)}
                            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(user.id)}
                            className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 transition hover:bg-rose-100"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Showing <span className="font-medium text-slate-900">{users.length}</span> of{" "}
              <span className="font-medium text-slate-900">{pagination.total}</span> users in{" "}
              <span className="font-medium text-slate-900">{currentRoleLabel}</span>
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1 || loading}
                onClick={() => void fetchUsers(Math.max(1, pagination.page - 1))}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-slate-500">
                Page {pagination.page} of {pagination.totalPages || 1}
              </span>
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages || loading}
                onClick={() => void fetchUsers(pagination.page + 1)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </article>
      </section>

      {modalMode ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4">
          <div className="w-full max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_30px_100px_rgba(15,23,42,0.18)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[#008ECC]">
                  {modalMode === "add" ? "Add user" : modalMode === "edit" ? "Edit user" : "User detail"}
                </p>
                <h3 className="mt-1 text-2xl font-semibold text-slate-950">
                  {modalMode === "add"
                    ? "Create a new account"
                    : modalMode === "edit"
                      ? "Update account information"
                      : selectedUser?.username ?? "User profile"}
                </h3>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <div className="mt-6">
              {modalMode === "view" && selectedUser ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    ["Username", selectedUser.username],
                    ["Email", selectedUser.email],
                    ["Role", selectedUser.role],
                    ["Status", selectedUser.emailVerified ? "Verified" : "Unverified"],
                    ["Created at", formatDate(selectedUser.createdAt)],
                    ["Updated at", formatDate(selectedUser.updatedAt)],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-[1.25rem] border border-slate-200 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
                      <p className="mt-2 text-sm font-semibold text-slate-950">{value}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Username</span>
                    <input
                      value={formState.username}
                      onChange={(event) =>
                        setFormState((current) => ({ ...current, username: event.target.value }))
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-400 focus:bg-white"
                      placeholder="Enter username"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Email</span>
                    <input
                      value={formState.email}
                      onChange={(event) =>
                        setFormState((current) => ({ ...current, email: event.target.value }))
                      }
                      disabled={modalMode === "edit"}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                      placeholder="Enter email"
                    />
                  </label>

                  {modalMode === "add" ? (
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">Password</span>
                      <input
                        type="password"
                        value={formState.password}
                        onChange={(event) =>
                          setFormState((current) => ({ ...current, password: event.target.value }))
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-400 focus:bg-white"
                        placeholder="Enter password"
                      />
                    </label>
                  ) : null}

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Role</span>
                    <select
                      value={formState.role}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          role: event.target.value as UserRole,
                        }))
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-slate-400 focus:bg-white"
                    >
                      <option value="CUSTOMER">Customer</option>
                      <option value="SELLER">Seller</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </label>
                </div>
              )}
            </div>

            {modalMode !== "view" ? (
              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void submitUser()}
                  className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(15,23,42,0.18)] transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving..." : modalMode === "add" ? "Create user" : "Save changes"}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {confirmDeleteId ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4">
          <div className="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_30px_100px_rgba(15,23,42,0.18)]">
            <p className="text-sm font-semibold text-[#008ECC]">Confirm deletion</p>
            <h3 className="mt-1 text-2xl font-semibold text-slate-950">Delete this user?</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              This action will remove the user and related records from the system. It cannot be
              undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void deleteUser(confirmDeleteId)}
                className="rounded-2xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(244,63,94,0.22)] transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Deleting..." : "Delete user"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
