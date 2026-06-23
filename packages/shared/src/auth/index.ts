export const APP_ROLES = ["ADMIN", "SELLER", "CUSTOMER"] as const;
export type AppRole = (typeof APP_ROLES)[number];

export type AuthUser = {
  id: string;
  email: string;
  username: string;
  role: AppRole;
  avatarUrl?: string | null;
};

export const AUTH_STORAGE_KEYS = {
  accessToken: "itech.accessToken",
  refreshToken: "itech.refreshToken",
  user: "itech.user",
} as const;

export const AUTH_COOKIE_NAMES = {
  accessToken: "accessToken",
  authRole: "authRole",
  authUser: "authUser",
} as const;

export const APP_BASE_PATHS: Record<AppRole, string> = {
  ADMIN: "/admin",
  SELLER: "/seller",
  CUSTOMER: "/customer",
};

export function isAppRole(value: string): value is AppRole {
  return APP_ROLES.includes(value as AppRole);
}

export function getStoredAuthUser(storage?: Storage | null) {
  if (!storage) {
    return null;
  }

  const rawUser = storage.getItem(AUTH_STORAGE_KEYS.user);
  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as AuthUser;
  } catch {
    return null;
  }
}

export function getAppHomePath(role: AppRole) {
  return APP_BASE_PATHS[role];
}

export function getRoleFromPath(pathname: string): AppRole | null {
  const normalized = pathname.toLowerCase();
  if (normalized.startsWith("/admin")) return "ADMIN";
  if (normalized.startsWith("/seller")) return "SELLER";
  if (normalized.startsWith("/customer")) return "CUSTOMER";
  return null;
}

export function normalizeAuthRole(role: string | null | undefined): AppRole | null {
  if (!role) return null;
  const upper = role.toUpperCase();
  return isAppRole(upper) ? upper : null;
}