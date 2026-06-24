"use client";

import {
  AlertBanner,
  Button,
  EmptyState,
  SearchInput,
  StatusBadge,
  TableCard,
  TableShell,
  TabPills,
} from "@itech/shared";
import { formatDateTime } from "../../../lib/admin-api";
import { roleMeta, roleTabs } from "../constants";
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
      <TableCard className="w-full">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <TabPills
              items={roleTabs.map((tab) => ({ key: tab.value, label: tab.label }))}
              activeKey={role}
              onChange={(value) => {
                setRole(value as "ALL" | UserRole);
                resetPagination();
              }}
              className="justify-start"
              activeClassName="border border-slate-900 bg-slate-900 text-white shadow-none"
              inactiveClassName="border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:justify-end">
            <form
              className="flex flex-col gap-3 sm:flex-row sm:items-center"
              onSubmit={(event) => {
                event.preventDefault();
                onSubmitSearch();
              }}
            >
              <SearchInput
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search username or email"
                className="w-full bg-slate-50 placeholder:text-slate-400 sm:w-72"
              />
              <Button
                type="submit"
                variant="secondary"
                className="border-slate-200 bg-white text-slate-700 shadow-none hover:bg-slate-50"
              >
                Search
              </Button>
            </form>

            <Button onClick={onOpenAdd} variant="primary" className="border border-slate-900 shadow-none">
              Add user
            </Button>
          </div>
        </div>

        {error ? (
          <div className="px-5 pt-5">
            <AlertBanner tone="danger" message={error} />
          </div>
        ) : null}

        <TableShell className="mt-5" innerClassName="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-[0.2em] text-slate-400">
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12">
                    <EmptyState title="Loading users..." className="border-0 bg-transparent py-0" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12">
                    <EmptyState
                      title="No users found for the current filter."
                      className="border-0 bg-transparent py-0"
                    />
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="bg-white">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`grid h-11 w-11 place-items-center rounded-2xl text-sm font-semibold text-white ${
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
                      <StatusBadge className={roleClass(user.role)}>
                        {roleMeta[user.role].label}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ring-1 ${
                          user.emailVerified
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                            : "bg-amber-50 text-amber-700 ring-amber-200"
                        }`}
                      >
                        {user.emailVerified ? "Verified" : "Unverified"}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-500">
                      {formatDateTime(user.createdAt)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="rounded-full border-slate-200 px-3 py-2 text-xs shadow-none"
                          onClick={() => onOpenView(user)}
                        >
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="rounded-full border-slate-200 px-3 py-2 text-xs shadow-none"
                          onClick={() => onOpenEdit(user)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          className="rounded-full border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 shadow-none hover:bg-rose-100"
                          onClick={() => onRequestDelete(user.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </TableShell>

        <div className="mt-5 flex flex-col gap-3 px-5 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Showing <span className="font-medium text-slate-900">{users.length}</span> of{" "}
            <span className="font-medium text-slate-900">{pagination.total}</span> users in{" "}
            <span className="font-medium text-slate-900">{currentRoleLabel}</span>
          </p>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              size="md"
              variant="secondary"
              disabled={pagination.page <= 1 || loading}
              onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
              className="rounded-full shadow-none"
            >
              Previous
            </Button>
            <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
              Page {pagination.page} of {pagination.totalPages || 1}
            </span>
            <Button
              size="md"
              variant="secondary"
              disabled={pagination.page >= pagination.totalPages || loading}
              onClick={() => onPageChange(pagination.page + 1)}
              className="rounded-full shadow-none"
            >
              Next
            </Button>
          </div>
        </div>
      </TableCard>
    </section>
  );
}
