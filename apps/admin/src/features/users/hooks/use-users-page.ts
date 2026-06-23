"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createUser,
  deleteUser,
  fetchUsers,
  fetchUserStats,
  updateUser,
} from "../api";
import {
  defaultPagination,
  emptyStats,
  initialFormState,
  roleTabs,
} from "../constants";
import type {
  ModalMode,
  Pagination,
  StatsResponse,
  UserFormState,
  UserRecord,
  UserRole,
} from "../types";

export function useUsersPage() {
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
  const [formState, setFormState] = useState<UserFormState>(initialFormState);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const currentRoleLabel = useMemo(() => {
    const tab = roleTabs.find((item) => item.value === role);
    return tab?.label ?? "Customers";
  }, [role]);

  const loadStats = async () => {
    try {
      const response = await fetchUserStats();
      setStats(response);
    } catch (err) {
      console.error("Failed to load stats:", err);
    }
  };

  const loadUsers = async (nextPage = 1) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchUsers({
        page: nextPage,
        limit: defaultPagination.limit,
        role,
        query,
      });
      setUsers(response.users ?? []);
      setPagination(response.pagination ?? defaultPagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadStats();
  }, []);

  useEffect(() => {
    void loadUsers(1);
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

        await createUser({
          username: formState.username,
          email: formState.email,
          password: formState.password,
          role: formState.role,
        });
      }

      if (modalMode === "edit" && selectedUser) {
        await updateUser(selectedUser.id, {
          username: formState.username,
          role: formState.role,
        });
      }

      closeModal();
      await Promise.all([loadStats(), loadUsers(pagination.page)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save user.");
    } finally {
      setSaving(false);
    }
  };

  const submitDeleteUser = async () => {
    if (!confirmDeleteId) return;

    setSaving(true);
    setError(null);

    try {
      await deleteUser(confirmDeleteId);
      await Promise.all([loadStats(), loadUsers(pagination.page)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user.");
    } finally {
      setSaving(false);
      setConfirmDeleteId(null);
    }
  };

  return {
    state: {
      loading,
      users,
      stats,
      pagination,
      role,
      search,
      query,
      selectedUser,
      modalMode,
      saving,
      error,
      formState,
      confirmDeleteId,
      currentRoleLabel,
    },
    actions: {
      setRole,
      setSearch,
      setQuery,
      setSelectedUser,
      setModalMode,
      setError,
      setFormState,
      setConfirmDeleteId,
      setPagination,
      loadUsers,
      loadStats,
      openView,
      openEdit,
      openAdd,
      closeModal,
      submitUser,
      submitDeleteUser,
    },
  };
}
