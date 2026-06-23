"use client";

import { ConfirmDialog, MetricsGrid, PageIntro, StatCard } from "@itech/shared";
import { roleMeta } from "./constants";
import UserModal from "./components/user-modal";
import UsersListSection from "./components/users-list-section";
import { useUsersPage } from "./hooks/use-users-page";

export default function UsersPageClient() {
  const { state, actions } = useUsersPage();

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="User management"
        title="Organize accounts, roles, and access in a cleaner admin panel."
        description="This screen follows the spirit of the old React admin page, but presents users in a more modern structure with stronger spacing, clearer hierarchy, and faster filters."
        className="shadow-[0_24px_80px_rgba(15,23,42,0.06)]"
        contentClassName="space-y-4"
        titleClassName="mt-0"
        descriptionClassName="text-base leading-7"
        actions={
          <span className="text-sm text-slate-500">
            Manage customers, sellers, and admins from one workspace
          </span>
        }
      />

      <MetricsGrid className="sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total users"
          value={state.stats.total.toLocaleString("vi-VN")}
          note="All marketplace accounts in the database"
          accentClassName="bg-slate-400"
        />
        <StatCard
          title="Customers"
          value={state.stats.customers.toLocaleString("vi-VN")}
          note="Primary storefront audience"
          accentClassName="bg-sky-500"
        />
        <StatCard
          title="Sellers"
          value={state.stats.sellers.toLocaleString("vi-VN")}
          note="Merchant accounts for catalog and inventory"
          accentClassName="bg-amber-500"
        />
        <StatCard
          title="Admins"
          value={state.stats.admins.toLocaleString("vi-VN")}
          note="Back-office operators and supervisors"
          accentClassName="bg-rose-500"
        />
      </MetricsGrid>

      <UsersListSection
        role={state.role}
        setRole={actions.setRole}
        search={state.search}
        setSearch={actions.setSearch}
        onSubmitSearch={() => actions.setQuery(state.search)}
        onOpenAdd={actions.openAdd}
        error={state.error}
        loading={state.loading}
        users={state.users}
        onOpenView={actions.openView}
        onOpenEdit={actions.openEdit}
        onRequestDelete={actions.setConfirmDeleteId}
        pagination={state.pagination}
        currentRoleLabel={state.currentRoleLabel}
        onPageChange={(page) => void actions.loadUsers(page)}
        resetPagination={() => actions.setPagination({
          page: 1,
          limit: 8,
          total: 0,
          totalPages: 0,
        })}
      />

      <UserModal
        modalMode={state.modalMode}
        selectedUser={state.selectedUser}
        formState={state.formState}
        saving={state.saving}
        onClose={actions.closeModal}
        onSubmit={() => void actions.submitUser()}
        onFormChange={actions.setFormState}
      />

      <ConfirmDialog
        open={Boolean(state.confirmDeleteId)}
        eyebrow="Confirm deletion"
        title="Delete this user?"
        description="This action will remove the user and related records from the system. It cannot be undone."
        confirmLabel={state.saving ? "Deleting..." : "Delete user"}
        loading={state.saving}
        onCancel={() => actions.setConfirmDeleteId(null)}
        onConfirm={() => void actions.submitDeleteUser()}
      />
    </div>
  );
}
