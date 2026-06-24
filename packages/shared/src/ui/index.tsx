"use client";

import * as React from "react";
import { createPortal } from "react-dom";

export type BadgeTone = "neutral" | "success" | "warning" | "danger";

export type BadgeProps = React.PropsWithChildren<{
  tone?: BadgeTone;
  className?: string;
}>;

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-zinc-100 text-zinc-700 ring-zinc-200",
  success: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  warning: "bg-amber-100 text-amber-700 ring-amber-200",
  danger: "bg-rose-100 text-rose-700 ring-rose-200",
};

export function Badge({
  tone = "neutral",
  className = "",
  children,
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export type StatusBadgeProps = React.PropsWithChildren<{
  tone?: BadgeTone;
  className?: string;
  dotClassName?: string;
  withDot?: boolean;
}>;

export function StatusBadge({
  tone = "neutral",
  className = "",
  dotClassName = "",
  withDot = false,
  children,
}: StatusBadgeProps) {
  return (
    <Badge tone={tone} className={`gap-2 px-3 py-1 text-xs font-semibold ${className}`}>
      {withDot ? <span className={`h-2 w-2 rounded-full bg-current ${dotClassName}`} /> : null}
      {children}
    </Badge>
  );
}

export type AlertBannerProps = {
  tone?: BadgeTone;
  message: React.ReactNode;
  className?: string;
};

const alertToneClasses: Record<BadgeTone, string> = {
  neutral: "border-slate-200 bg-slate-50 text-slate-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  danger: "border-rose-200 bg-rose-50 text-rose-700",
};

export function AlertBanner({
  tone = "neutral",
  message,
  className = "",
}: AlertBannerProps) {
  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${alertToneClasses[tone]} ${className}`}>
      {message}
    </div>
  );
}

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
export type ButtonSize = "sm" | "md" | "icon";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

const buttonVariantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-slate-950 text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)] hover:bg-slate-800",
  secondary:
    "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
  danger: "bg-rose-600 border border-rose-200 text-rose-700 shadow-[0_14px_30px_rgba(225,29,72,0.18)] hover:bg-rose-700",
  ghost: "bg-slate-100 text-slate-700 hover:bg-slate-200",
};

const buttonSizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-sm",
  icon: "h-11 w-11",
};

export function Button({
  variant = "secondary",
  size = "md",
  fullWidth = false,
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center rounded-2xl font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${buttonVariantClasses[variant]} ${buttonSizeClasses[size]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    />
  );
}

export type IconButtonProps = ButtonProps & {
  srLabel?: string;
};

export function IconButton({ srLabel, children, className = "", ...props }: IconButtonProps) {
  return (
    <Button size="icon" className={className} {...props}>
      {srLabel ? <span className="sr-only">{srLabel}</span> : null}
      {children}
    </Button>
  );
}

export type LogoutButtonProps = {
  backendBaseUrl?: string;
  redirectTo?: string;
  label?: string;
  className?: string;
};

export function LogoutButton({
  backendBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api",
  redirectTo = "/login",
  label = "Sign out",
  className = "",
}: LogoutButtonProps) {
  const [loading, setLoading] = React.useState(false);

  const handleLogout = async () => {
    setLoading(true);

    try {
      await fetch(`${backendBaseUrl}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      window.location.assign(redirectTo);
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className={`inline-flex items-center justify-center rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {loading ? "Signing out..." : label}
    </button>
  );
}

export type StatCardProps = {
  title: string;
  value: string | number;
  note?: string;
  accentClassName?: string;
  className?: string;
  titleClassName?: string;
  valueClassName?: string;
  noteClassName?: string;
};

export function StatCard({
  title,
  value,
  note,
  accentClassName = "bg-sky-500",
  className = "",
  titleClassName = "",
  valueClassName = "",
  noteClassName = "",
}: StatCardProps) {
  return (
    <article
      className={`rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)] ${className}`}
    >
      <p
        className={`text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 ${titleClassName}`}
      >
        {title}
      </p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <p className={`text-3xl font-semibold tracking-tight text-slate-950 ${valueClassName}`}>
            {value}
          </p>
          {note ? <p className={`mt-1 text-sm text-slate-500 ${noteClassName}`}>{note}</p> : null}
        </div>
        <div className={`h-3 w-3 rounded-full ${accentClassName}`} />
      </div>
    </article>
  );
}

export type SurfaceCardProps = React.PropsWithChildren<{
  className?: string;
}>;

export function SurfaceCard({ className = "", children }: SurfaceCardProps) {
  return (
    <article
      className={`rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)] ${className}`}
    >
      {children}
    </article>
  );
}

export type PageIntroProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
  aside?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  eyebrowClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
};

export function PageIntro({
  eyebrow,
  title,
  description,
  actions,
  aside,
  children,
  className = "",
  contentClassName = "",
  eyebrowClassName = "",
  titleClassName = "",
  descriptionClassName = "",
}: PageIntroProps) {
  const layoutClassName = aside
    ? "grid gap-6 lg:grid-cols-[1.4fr_0.9fr]"
    : "flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between";

  return (
    <section
      className={`overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] ${className}`}
    >
      <div className={aside ? layoutClassName : contentClassName || layoutClassName}>
        <div className={aside ? `space-y-4 ${contentClassName}` : `max-w-3xl ${contentClassName}`}>
          <p
            className={`text-[11px] font-semibold uppercase tracking-[0.24em] text-[#008ECC] ${eyebrowClassName}`}
          >
            {eyebrow}
          </p>
          <div>
            <h2
              className={`mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl ${titleClassName}`}
            >
              {title}
            </h2>
            <p className={`mt-3 text-sm leading-6 text-slate-600 ${descriptionClassName}`}>
              {description}
            </p>
          </div>
          {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
        </div>
        {aside ? <div>{aside}</div> : null}
      </div>
      {children}
    </section>
  );
}

export type PanelHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: React.ReactNode;
  className?: string;
};

export function PanelHeader({
  title,
  description,
  eyebrow,
  actions,
  className = "",
}: PanelHeaderProps) {
  return (
    <div className={`flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between ${className}`}>
      <div>
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#008ECC]">
            {eyebrow}
          </p>
        ) : null}
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export type InfoFieldProps = {
  label: string;
  value: React.ReactNode;
  helper?: React.ReactNode;
  className?: string;
};

export function InfoField({
  label,
  value,
  helper,
  className = "",
}: InfoFieldProps) {
  return (
    <div className={`rounded-2xl bg-slate-50 px-4 py-3 ${className}`}>
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <div className="mt-2 text-sm font-semibold text-slate-900">{value}</div>
      {helper ? <div className="mt-1 text-xs text-slate-500">{helper}</div> : null}
    </div>
  );
}

export type MetricsGridProps = React.PropsWithChildren<{
  className?: string;
}>;

export function MetricsGrid({ className = "", children }: MetricsGridProps) {
  return <section className={`grid gap-4 md:grid-cols-2 xl:grid-cols-4 ${className}`}>{children}</section>;
}

export type FilterToolbarProps = React.PropsWithChildren<{
  className?: string;
}>;

export function FilterToolbar({ className = "", children }: FilterToolbarProps) {
  return (
    <div
      className={`flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between ${className}`}
    >
      {children}
    </div>
  );
}

export type FormFieldProps = React.PropsWithChildren<{
  label?: string;
  hint?: string;
  error?: string;
  className?: string;
  labelClassName?: string;
}>;

export function FormField({
  label,
  hint,
  error,
  className = "",
  labelClassName = "",
  children,
}: FormFieldProps) {
  return (
    <label className={`grid gap-2 ${className}`}>
      {label ? (
        <span className={`text-sm font-semibold text-slate-700 ${labelClassName}`}>{label}</span>
      ) : null}
      {children}
      {error ? (
        <span className="text-xs font-medium text-rose-600">{error}</span>
      ) : hint ? (
        <span className="text-xs text-slate-500">{hint}</span>
      ) : null}
    </label>
  );
}

type BaseFieldProps = {
  className?: string;
  invalid?: boolean;
};

const baseFieldClassName =
  "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:bg-white";

export type TextInputProps = React.InputHTMLAttributes<HTMLInputElement> & BaseFieldProps;

export function TextInput({ className = "", invalid = false, ...props }: TextInputProps) {
  return (
    <input
      className={`${baseFieldClassName} ${
        invalid
          ? "border-rose-300 focus:border-rose-400 focus:ring-1 focus:ring-rose-100"
          : "focus:border-slate-400 focus:ring-1 focus:ring-slate-100"
      } ${className}`}
      {...props}
    />
  );
}

export type TextAreaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & BaseFieldProps;

export function TextArea({ className = "", invalid = false, ...props }: TextAreaProps) {
  return (
    <textarea
      className={`${baseFieldClassName} min-h-[120px] resize-y ${
        invalid
          ? "border-rose-300 focus:border-rose-400 focus:ring-1 focus:ring-rose-100"
          : "focus:border-slate-400 focus:ring-1 focus:ring-slate-100"
      } ${className}`}
      {...props}
    />
  );
}

export type SelectInputProps = React.SelectHTMLAttributes<HTMLSelectElement> & BaseFieldProps;

export function SelectInput({ className = "", invalid = false, children, ...props }: SelectInputProps) {
  return (
    <select
      className={`${baseFieldClassName} ${
        invalid
          ? "border-rose-300 focus:border-rose-400 focus:ring-1 focus:ring-rose-100"
          : "focus:border-slate-400 focus:ring-1 focus:ring-slate-100"
      } ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export type SearchInputProps = React.InputHTMLAttributes<HTMLInputElement> & BaseFieldProps;

export function SearchInput({ className = "", invalid = false, ...props }: SearchInputProps) {
  return (
    <TextInput
      type="search"
      invalid={invalid}
      className={`h-11 lg:max-w-md ${className}`}
      {...props}
    />
  );
}

export type StatusOption = {
  value: string;
  label: string;
};

export type StatusSelectProps = Omit<SelectInputProps, "children"> & {
  options: StatusOption[];
  toneClassName?: string;
};

export function StatusSelect({
  options,
  className = "",
  toneClassName = "",
  ...props
}: StatusSelectProps) {
  return (
    <SelectInput
      className={`h-10 px-3 py-2 font-semibold ${toneClassName} ${className}`}
      {...props}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </SelectInput>
  );
}

export type TabOption = {
  key: string;
  label: string;
};

export type TabPillsProps = {
  items: TabOption[];
  activeKey: string;
  onChange: (key: string) => void;
  className?: string;
  actions?: React.ReactNode;
  activeClassName?: string;
  inactiveClassName?: string;
};

export function TabPills({
  items,
  activeKey,
  onChange,
  className = "",
  actions,
  activeClassName = "bg-slate-950 text-white shadow-[0_10px_24px_rgba(15,23,42,0.14)]",
  inactiveClassName = "bg-slate-100 text-slate-600 hover:bg-slate-200",
}: TabPillsProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {items.map((item) => {
        const active = activeKey === item.key;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              active ? activeClassName : inactiveClassName
            }`}
          >
            {item.label}
          </button>
        );
      })}
      {actions ? <div className="ml-auto flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export type TableCardProps = React.PropsWithChildren<{
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  headerClassName?: string;
}>;

export function TableCard({
  title,
  description,
  actions,
  className = "",
  bodyClassName = "",
  headerClassName = "",
  children,
}: TableCardProps) {
  return (
    <section
      className={`overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)] ${className}`}
    >
      {title || description || actions ? (
        <div className={`border-b border-slate-200 px-5 py-5 ${headerClassName}`}>
          <PanelHeader title={title || ""} description={description} actions={actions} />
        </div>
      ) : null}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

export type TableShellProps = React.PropsWithChildren<{
  className?: string;
  innerClassName?: string;
}>;

export function TableShell({
  className = "",
  innerClassName = "",
  children,
}: TableShellProps) {
  return (
    <div className={`px-5 pb-5 ${className}`}>
      <div className={`overflow-hidden rounded-[1.5rem] border border-slate-200 ${innerClassName}`}>
        {children}
      </div>
    </div>
  );
}

export type TablePaginationProps = {
  page: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
  className?: string;
  previousLabel?: string;
  nextLabel?: string;
};

export function TablePagination({
  page,
  totalPages,
  onPrevious,
  onNext,
  className = "",
  previousLabel = "Previous",
  nextLabel = "Next",
}: TablePaginationProps) {
  return (
    <div className={`flex items-center justify-between gap-3 ${className}`}>
      <Button className="!rounded-full !shadow-none" variant="secondary" size="md" onClick={onPrevious} disabled={page <= 1}>
        {previousLabel}
      </Button>
      <span className="inline-flex items-center justify-center rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
        Page {page} of {totalPages}
      </span>
      <Button className="!rounded-full !shadow-none" variant="secondary" size="md" onClick={onNext} disabled={page >= totalPages}>
        {nextLabel}
      </Button>
    </div>
  );
}

export type DetailSectionProps = React.PropsWithChildren<{
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}>;

export function DetailSection({
  title,
  description,
  actions,
  className = "",
  bodyClassName = "",
  children,
}: DetailSectionProps) {
  return (
    <SurfaceCard className={`${className}`}>
      <PanelHeader title={title} description={description} actions={actions} />
      <div className={bodyClassName ? `mt-4 ${bodyClassName}` : "mt-4"}>{children}</div>
    </SurfaceCard>
  );
}

export type KeyValueListItem = {
  label: string;
  value: React.ReactNode;
  helper?: React.ReactNode;
};

export type KeyValueGridProps = {
  items: KeyValueListItem[];
  className?: string;
  itemClassName?: string;
  columnsClassName?: string;
};

export function KeyValueGrid({
  items,
  className = "",
  itemClassName = "",
  columnsClassName = "grid gap-3 md:grid-cols-2",
}: KeyValueGridProps) {
  return (
    <div className={`${columnsClassName} ${className}`}>
      {items.map((item) => (
        <InfoField
          key={item.label}
          label={item.label}
          value={item.value}
          helper={item.helper}
          className={itemClassName}
        />
      ))}
    </div>
  );
}

export type ModalShellProps = React.PropsWithChildren<{
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  widthClass?: string;
  eyebrow?: string;
}>;

export function ModalShell({
  open,
  title,
  subtitle,
  onClose,
  children,
  widthClass = "max-w-6xl",
  eyebrow = "Workspace",
}: ModalShellProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!open) return null;
  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 overflow-y-auto"
      style={{
        zIndex: 1000,
        isolation: "isolate",
        backgroundColor: "rgba(2, 6, 23, 0.45)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
    >
      <div className="flex min-h-full items-start justify-center p-4 sm:items-center">
        <div
          className={`my-4 flex h-[92vh] w-full ${widthClass} flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.22)]`}
        >
          <div className="border-b border-slate-200 px-6 py-5">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#008ECC]">
                  {eyebrow}
                </p>
                <h3 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
                  {title}
                </h3>
                {subtitle ? (
                  <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export type ConfirmDialogProps = {
  open: boolean;
  eyebrow?: string;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmClassName?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  children?: React.ReactNode;
};

export function ConfirmDialog({
  open,
  eyebrow = "Confirmation",
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmClassName = "bg-rose-600 hover:bg-rose-700 text-white",
  onConfirm,
  onCancel,
  loading = false,
  children,
}: ConfirmDialogProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!open) return null;
  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 grid place-items-center p-4"
      style={{
        zIndex: 1100,
        isolation: "isolate",
        backgroundColor: "rgba(2, 6, 23, 0.45)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
    >
      <div className="w-full max-w-lg rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_30px_100px_rgba(15,23,42,0.22)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#008ECC]">
          {eyebrow}
        </p>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
          {title}
        </h3>
        <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
        {children ? <div className="mt-4">{children}</div> : null}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="h-11 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`h-11 rounded-2xl px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${confirmClassName}`}
          >
            {loading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export type EmptyStateProps = {
  title: string;
  description?: string;
  className?: string;
};

export function EmptyState({
  title,
  description,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center ${className}`}
    >
      <p className="text-sm font-medium text-slate-900">{title}</p>
      {description ? (
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      ) : null}
    </div>
  );
}
