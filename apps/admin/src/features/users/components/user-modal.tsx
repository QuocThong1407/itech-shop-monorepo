"use client";

import { ModalShell } from "@itech/shared";
import { formatDateTime } from "../../../lib/admin-api";
import type { ModalMode, UserFormState, UserRecord, UserRole } from "../types";

type UserModalProps = {
  modalMode: ModalMode;
  selectedUser: UserRecord | null;
  formState: UserFormState;
  saving: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onFormChange: (updater: (current: UserFormState) => UserFormState) => void;
};

export default function UserModal({
  modalMode,
  selectedUser,
  formState,
  saving,
  onClose,
  onSubmit,
  onFormChange,
}: UserModalProps) {
  const open = Boolean(modalMode);

  return (
    <ModalShell
      open={open}
      title={
        modalMode === "add"
          ? "Create a new account"
          : modalMode === "edit"
            ? "Update account information"
            : selectedUser?.username ?? "User profile"
      }
      subtitle={
        modalMode === "add"
          ? "Add a new user to the marketplace."
          : modalMode === "edit"
            ? "Edit username and role assignment."
            : "Inspect user profile information."
      }
      onClose={onClose}
      widthClass="max-w-2xl"
      eyebrow={
        modalMode === "add"
          ? "Add user"
          : modalMode === "edit"
            ? "Edit user"
            : "User detail"
      }
    >
      <div className="p-6">
        {modalMode === "view" && selectedUser ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["Username", selectedUser.username],
              ["Email", selectedUser.email],
              ["Role", selectedUser.role],
              ["Status", selectedUser.emailVerified ? "Verified" : "Unverified"],
              ["Created at", formatDateTime(selectedUser.createdAt)],
              ["Updated at", formatDateTime(selectedUser.updatedAt)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[1.25rem] border border-slate-200 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">{value}</p>
              </div>
            ))}
          </div>
        ) : modalMode ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Username</span>
                <input
                  value={formState.username}
                  onChange={(event) =>
                    onFormChange((current) => ({
                      ...current,
                      username: event.target.value,
                    }))
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
                    onFormChange((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
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
                      onFormChange((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
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
                    onFormChange((current) => ({
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

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={onSubmit}
                className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(15,23,42,0.18)] transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : modalMode === "add"
                    ? "Create user"
                    : "Save changes"}
              </button>
            </div>
          </>
        ) : null}
      </div>
    </ModalShell>
  );
}
