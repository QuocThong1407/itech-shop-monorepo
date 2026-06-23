"use client";

import {
  Button,
  DetailSection,
  FormField,
  KeyValueGrid,
  ModalShell,
  SelectInput,
  TextInput,
} from "@itech/shared";
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
          <DetailSection title="Profile details" className="p-0 shadow-none border-0 bg-transparent">
            <KeyValueGrid
              items={[
                { label: "Username", value: selectedUser.username },
                { label: "Email", value: selectedUser.email },
                { label: "Role", value: selectedUser.role },
                {
                  label: "Status",
                  value: selectedUser.emailVerified ? "Verified" : "Unverified",
                },
                { label: "Created at", value: formatDateTime(selectedUser.createdAt) },
                { label: "Updated at", value: formatDateTime(selectedUser.updatedAt) },
              ]}
            />
          </DetailSection>
        ) : modalMode ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Username">
                <TextInput
                  value={formState.username}
                  onChange={(event) =>
                    onFormChange((current) => ({
                      ...current,
                      username: event.target.value,
                    }))
                  }
                  className="bg-slate-50 focus:bg-white"
                  placeholder="Enter username"
                />
              </FormField>

              <FormField label="Email">
                <TextInput
                  value={formState.email}
                  onChange={(event) =>
                    onFormChange((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  disabled={modalMode === "edit"}
                  className="bg-slate-50 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                  placeholder="Enter email"
                />
              </FormField>

              {modalMode === "add" ? (
                <FormField label="Password">
                  <TextInput
                    type="password"
                    value={formState.password}
                    onChange={(event) =>
                      onFormChange((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                    className="bg-slate-50 focus:bg-white"
                    placeholder="Enter password"
                  />
                </FormField>
              ) : null}

              <FormField label="Role">
                <SelectInput
                  value={formState.role}
                  onChange={(event) =>
                    onFormChange((current) => ({
                      ...current,
                      role: event.target.value as UserRole,
                    }))
                  }
                  className="bg-slate-50 focus:bg-white"
                >
                  <option value="CUSTOMER">Customer</option>
                  <option value="SELLER">Seller</option>
                  <option value="ADMIN">Admin</option>
                </SelectInput>
              </FormField>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="primary" disabled={saving} onClick={onSubmit}>
                {saving
                  ? "Saving..."
                  : modalMode === "add"
                    ? "Create user"
                    : "Save changes"}
              </Button>
            </div>
          </>
        ) : null}
      </div>
    </ModalShell>
  );
}
