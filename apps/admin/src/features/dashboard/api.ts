import { cookies } from "next/headers";
import type {
  ActivityReport,
  ApiEnvelope,
  CategoryStats,
  DashboardData,
  OrderList,
  ProductList,
  RevenueReport,
  TopMember,
  UsersStats,
} from "./types";
import { startDate } from "./helpers";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api";

async function readJson<T>(path: string, accessToken: string): Promise<T> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((item) => `${item.name}=${item.value}`)
    .join("; ");

  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(cookieHeader ? { cookie: cookieHeader } : {}),
    },
  });

  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (response.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message || `Request failed with ${response.status}`);
  }

  return payload.data;
}

async function readCompleteList(
  resource: "products" | "orders",
  accessToken: string,
  baseQuery = "",
): Promise<ProductList | OrderList> {
  const prefix = baseQuery ? `${baseQuery}&` : "";
  const seed = await readJson<ProductList | OrderList>(
    `/${resource}?${prefix}page=1&limit=1`,
    accessToken,
  );

  const total = Math.max(seed.pagination?.total || 0, 1);
  const limit = Math.min(total, 5000);

  if (limit === 1) {
    return seed;
  }

  return readJson<ProductList | OrderList>(
    `/${resource}?${prefix}page=1&limit=${limit}`,
    accessToken,
  );
}

export async function fetchDashboardData(accessToken: string): Promise<DashboardData> {
  const dashboardRangeStart = startDate(3650);
  const dashboardRangeEnd = startDate(0);

  const [
    usersStats,
    productList,
    orderList,
    revenueReport,
    activityReport,
    topMembers,
    categoryStats,
  ] = await Promise.all([
    readJson<UsersStats>("/users/stats", accessToken),
    readCompleteList("products", accessToken),
    readCompleteList("orders", accessToken),
    readJson<RevenueReport>(
      `/reports/revenue?startDate=${dashboardRangeStart}&endDate=${dashboardRangeEnd}&groupBy=month`,
      accessToken,
    ),
    readJson<ActivityReport>(
      `/reports/activity?startDate=${startDate(30)}&endDate=${startDate(0)}`,
      accessToken,
    ),
    readJson<TopMember[]>("/memberships/top-spent?limit=5", accessToken),
    readJson<CategoryStats>("/categories/stats", accessToken),
  ]);

  return {
    usersStats,
    productList: productList as ProductList,
    orderList: orderList as OrderList,
    revenueReport,
    activityReport,
    topMembers,
    categoryStats,
  };
}
