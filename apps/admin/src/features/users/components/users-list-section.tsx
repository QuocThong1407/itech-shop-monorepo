"use client";

import { formatDateTime } from "../../../lib/admin-api";
import { defaultPagination, roleMeta, roleTabs } from "../constants";
import type { Pagination, UserRecord, UserRole } from "../types";

type UsersListSectionProps = {
  role: "ALL" | UserRole;
  setRole: (value: "ALL" | UserRole) => void;
  search: string;
  setSearch: (value: string) => void;
  onSubmitSearch: () => void;
  onOpenAdd: () => void;
  error: string | null;
  loading: boolean;
  users: UserRecord[];
  onOpenView: (user: UserRecord) => void;
  onOpenEdit: (user: UserRecord) => void;
  onRequestDelete: (userId: string) => void;
  pagination: Pagination;
  currentRoleLabel: string;
  onPageChange: (page: number) => void;
  resetPagination: () => void;
};

function roleClass(role: UserRole) {
  return roleMeta[role].tone;
}

export default function UsersListSection({
  role,
  setRole,
  search,
  setSearch,
  onSubmitSearch,
  onOpenAdd,
  error,
  loading,
  users,
  onOpenView,
  onOpenEdit,
  onRequestDelete,
  pagination,
  currentRoleLabel,
  onPageChange,
  resetPagination,
}: UsersListSectionProps) {
  return (
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
                    resetPagination();
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
                onSubmitSearch();
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
              onClick={onOpenAdd}
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
                      {formatDateTime(user.createdAt)}
                    </td>
                    <td className="rounded-r-[1.25rem] px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onOpenView(user)}
                          className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenEdit(user)}
                          className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => onRequestDelete(user.id)}
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
              onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
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
              onClick={() => onPageChange(pagination.page + 1)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </article>
    </section>
  );
}
