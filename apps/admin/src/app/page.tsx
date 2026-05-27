import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Badge } from "@itech/shared";

export const dynamic = "force-dynamic";

type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data: T;
};

type UsersStats = {
  total: number;
  customers: number;
  sellers: number;
  admins: number;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type ProductList = {
  products: Array<{
    id: string;
    name: string;
    price: number;
    stockQuantity: number;
    images?: string[];
    createdAt: string;
    updatedAt: string;
  }>;
  pagination: Pagination;
};

type OrderList = {
  orders: Array<{
    id: string;
    orderDate: string;
    status: string;
    createdAt: string;
    Customer?: {
      User?: { id: string; username: string; email: string } | null;
    } | null;
    Payment?: Array<{
      amount: number;
      method: string;
      status: string;
    }> | null;
  }>;
  pagination: Pagination;
};

type RevenueReport = {
  summary: {
    totalIncome: number;
    totalRefund: number;
    netRevenue: number;
  };
  rows: Array<{
    period: string;
    income: number;
    refund: number;
    netRevenue: number;
  }>;
  details: {
    totalCompletedPayments: number;
    totalApprovedReturns: number;
    totalApprovedCancellations: number;
  };
};

type ActivityReport = {
  summary: {
    totalActiveUsers: number;
    newUsers: number;
    newOrders: number;
    newReviews: number;
    newUsersByRole: Record<string, number>;
  };
  statistics: {
    totalCustomers: number;
    totalSellers: number;
    totalAdmins: number;
  };
};

type TopMember = {
  rank: number;
  id: string;
  membership: string;
  spent: number;
  Customer?: {
    User?: {
      username: string;
      email: string;
    } | null;
  } | null;
};

type CategoryStats = {
  total: number;
  topCategories: Array<{
    id: string;
    name: string;
    productCount: number;
  }>;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api";

const currency = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

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

  const payload = (await response
    .json()
    .catch(() => null)) as ApiEnvelope<T> | null;

  if (response.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  if (!response.ok || !payload?.success) {
    throw new Error(
      payload?.message || `Request failed with ${response.status}`,
    );
  }

  return payload.data;
}

function startDate(daysAgo: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

function formatShortDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

function formatStatus(status: string) {
  return status ? status.replaceAll("_", " ").toUpperCase() : "UNKNOWN";
}

function statusClass(status: string) {
  switch (status?.toUpperCase()) {
    case "DELIVERED":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "SHIPPED":
      return "bg-sky-50 text-sky-700 ring-sky-200";
    case "CONFIRMED":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "CANCELLED":
      return "bg-rose-50 text-rose-700 ring-rose-200";
    default:
      return "bg-slate-100 text-slate-600 ring-slate-200";
  }
}

function buildOrderStatusRing(orders: OrderList["orders"]) {
  const counts = orders.reduce<Record<string, number>>((acc, order) => {
    const key = order.status?.toUpperCase() || "UNKNOWN";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const entries = Object.entries(counts);
  const total = entries.reduce((sum, [, count]) => sum + count, 0) || 1;
  const colors: Record<string, string> = {
    DELIVERED: "#10b981",
    SHIPPED: "#0ea5e9",
    CONFIRMED: "#f59e0b",
    PENDING: "#94a3b8",
    CANCELLED: "#f43f5e",
    UNKNOWN: "#cbd5e1",
  };

  const segments = entries.reduce<
    { color: string; start: number; end: number }[]
  >((acc, [status, count]) => {
    const start = acc.length ? acc[acc.length - 1].end : 0;
    const width = (count / total) * 100;
    acc.push({
      color: colors[status] || colors.UNKNOWN,
      start,
      end: start + width,
    });
    return acc;
  }, []);

  const gradient =
    segments.length > 0
      ? `conic-gradient(${segments
          .map(
            (segment) => `${segment.color} ${segment.start}% ${segment.end}%`,
          )
          .join(", ")})`
      : "conic-gradient(#e2e8f0 0 100%)";

  return { counts, total, gradient };
}

async function fetchDashboardData(accessToken: string) {
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
    readJson<ProductList>("/products?limit=1", accessToken),
    readJson<OrderList>("/orders?page=1&limit=2000", accessToken),
    readJson<RevenueReport>(
      `/reports/revenue?startDate=${startDate(30)}&endDate=${startDate(0)}&groupBy=day`,
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
    productList,
    orderList,
    revenueReport,
    activityReport,
    topMembers,
    categoryStats,
  };
}

export default async function AdminHomePage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  if (!accessToken) {
    redirect(`/login?next=${encodeURIComponent("/admin")}`);
  }

  let data: Awaited<ReturnType<typeof fetchDashboardData>>;

  try {
    data = await fetchDashboardData(accessToken);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message === "UNAUTHORIZED" || message.includes("Invalid token")) {
      redirect(`/login?next=${encodeURIComponent("/admin")}`);
    }

    throw error;
  }

  const {
    counts: orderStatusCounts,
    total: orderStatusTotal,
    gradient,
  } = buildOrderStatusRing(data.orderList.orders);

  const totalRevenue = data.revenueReport.summary.netRevenue;
  const maxRevenue = Math.max(
    ...data.revenueReport.rows.map((row) => row.netRevenue),
    1,
  );
  const recentOrders = data.orderList.orders.slice(0, 5);
  const recentRevenueRows = data.revenueReport.rows.slice(-8);
  const lowStockCount = data.productList.products.filter(
    (product) => product.stockQuantity <= 10,
  ).length;

  const metrics = [
    {
      label: "Revenue",
      value: emptyMoney(totalRevenue),
      note: `${data.revenueReport.summary.totalIncome.toLocaleString("vi-VN")} income / ${data.revenueReport.summary.totalRefund.toLocaleString("vi-VN")} refund`,
      tone: "emerald",
    },
    {
      label: "Orders",
      value: data.orderList.pagination.total.toLocaleString("vi-VN"),
      note: `${data.activityReport.summary.newOrders.toLocaleString("vi-VN")} new orders in 30 days`,
      tone: "sky",
    },
    {
      label: "Products",
      value: data.productList.pagination.total.toLocaleString("vi-VN"),
      note: `${lowStockCount.toLocaleString("vi-VN")} low-stock items in the loaded set`,
      tone: "amber",
    },
    {
      label: "Users",
      value: data.usersStats.total.toLocaleString("vi-VN"),
      note: `${data.usersStats.customers.toLocaleString("vi-VN")} customers / ${data.usersStats.sellers.toLocaleString("vi-VN")} sellers`,
      tone: "violet",
    },
  ] as const;

  const quickNotes = [
    {
      title: "Revenue report",
      value: `${data.revenueReport.rows.length} points`,
      note: "30-day period grouped by day",
    },
    {
      title: "Activity report",
      value: `${data.activityReport.statistics.totalCustomers} customers`,
      note: "User activity snapshot from backend",
    },
    {
      title: "Top spent",
      value: `${data.topMembers.length} members`,
      note: "Membership ranking feed",
    },
    {
      title: "Orders feed",
      value: `${data.orderList.pagination.total} total`,
      note: "Recent orders pulled live",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.06)]">
        <div className="px-6 py-6 xl:px-8 xl:py-8">
          <div className="flex flex-wrap items-center gap-3">
            <Badge
              tone="neutral"
              className="bg-sky-50 text-[#008ECC] ring-sky-200"
            >
              Admin dashboard
            </Badge>
            <span className="text-sm text-slate-500">
              Live data from users, orders, revenue, and membership services
            </span>
          </div>

          <div className="mt-4 max-w-3xl space-y-4">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Real-time control over sales, inventory, and customer health.
            </h2>
            <p className="text-base leading-7 text-slate-600">
              This dashboard now reads from the backend directly, so the cards,
              orders, top customers, and revenue trend reflect actual project
              data instead of placeholders.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <article
            key={metric.label}
            className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)]"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-slate-500">
                {metric.label}
              </p>
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                  metric.tone === "emerald"
                    ? "bg-emerald-50 text-emerald-700"
                    : metric.tone === "sky"
                      ? "bg-sky-50 text-sky-700"
                      : metric.tone === "amber"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-violet-50 text-violet-700"
                }`}
              >
                Live
              </span>
            </div>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              {metric.value}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {metric.note}
            </p>
          </article>
        ))}
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(180deg,_rgba(0,142,204,0.08)_0%,_rgba(255,255,255,0.95)_100%)] p-5 shadow-[0_18px_60px_rgba(15,23,42,0.05)] sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#008ECC]">
              Revenue trend
            </p>
            <h3 className="mt-1 text-xl font-semibold text-slate-950">
              Last 30 days
            </h3>
          </div>
          <Badge tone="success">
            {data.revenueReport.summary.netRevenue >= 0 ? "Profit" : "Loss"}
          </Badge>
        </div>

        <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-[0_16px_50px_rgba(15,23,42,0.06)]">
          <div className="flex h-64 items-end gap-2">
            {recentRevenueRows.length > 0 ? (
              recentRevenueRows.map((row) => {
                const height = Math.max((row.netRevenue / maxRevenue) * 100, 8);
                return (
                  <div
                    key={row.period}
                    className="flex flex-1 flex-col items-center gap-2"
                  >
                    <div className="flex h-44 items-end">
                      <div
                        className="w-full rounded-t-2xl bg-[linear-gradient(180deg,_#7dd3fc_0%,_#008ECC_100%)] shadow-[0_12px_30px_rgba(0,142,204,0.18)]"
                        style={{ height: `${height}%` }}
                        title={`${row.period}: ${emptyMoney(row.netRevenue)}`}
                      />
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {formatShortDate(row.period)}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="grid h-full w-full place-items-center text-sm text-slate-400">
                No revenue data available
              </div>
            )}
          </div>
        </div>
      </section>

      <section id="analytics" className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="flex flex-col h-full rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.05)]">
          <div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#008ECC]">
                  Order status
                </p>
                <h3 className="mt-1 text-xl font-semibold text-slate-950">
                  Fulfillment balance
                </h3>
              </div>
              <Badge
                tone="neutral"
                className="bg-slate-100 text-slate-600 ring-slate-200"
              >
                {orderStatusTotal.toLocaleString("vi-VN")} orders loaded
              </Badge>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center py-4">
            <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="flex items-center justify-center">
                <div className="relative h-56 w-56">
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{ background: gradient }}
                  />
                  <div className="absolute inset-6 rounded-full bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]" />
                  <div className="absolute inset-0 grid place-items-center text-center">
                    <div>
                      <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
                        Orders
                      </p>
                      <p className="mt-2 text-3xl font-semibold text-slate-950">
                        {orderStatusTotal.toLocaleString("vi-VN")}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Current dataset
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {Object.entries(orderStatusCounts).map(([status, count]) => {
                  const percentage = ((count / orderStatusTotal) * 100).toFixed(
                    1,
                  );
                  return (
                    <div key={status}>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700">
                          {formatStatus(status)}
                        </span>
                        <span className="text-slate-500">
                          {count.toLocaleString("vi-VN")} ({percentage}%)
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100">
                        <div
                          className={
                            status.toUpperCase() === "DELIVERED"
                              ? "h-2 rounded-full bg-emerald-500"
                              : status.toUpperCase() === "SHIPPED"
                                ? "h-2 rounded-full bg-sky-500"
                                : status.toUpperCase() === "CONFIRMED"
                                  ? "h-2 rounded-full bg-amber-500"
                                  : status.toUpperCase() === "CANCELLED"
                                    ? "h-2 rounded-full bg-rose-500"
                                    : "h-2 rounded-full bg-slate-400"
                          }
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                Income
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {emptyMoney(data.revenueReport.summary.totalIncome)}
              </p>
            </div>
            <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                Refund
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {emptyMoney(data.revenueReport.summary.totalRefund)}
              </p>
            </div>
            <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                Net
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {emptyMoney(data.revenueReport.summary.netRevenue)}
              </p>
            </div>
            <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                Points
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {data.revenueReport.rows.length.toLocaleString("vi-VN")}
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(180deg,_#ffffff_0%,_#f8fbff_100%)] p-6 shadow-[0_18px_60px_rgba(15,23,42,0.05)]">
          <p className="text-sm font-semibold text-[#008ECC]">
            Activity summary
          </p>
          <h3 className="mt-1 text-xl font-semibold text-slate-950">
            Backend report snapshot
          </h3>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              {
                label: "Active users",
                value: data.activityReport.summary.totalActiveUsers,
                tone: "sky",
              },
              {
                label: "New users",
                value: data.activityReport.summary.newUsers,
                tone: "emerald",
              },
              {
                label: "New orders",
                value: data.activityReport.summary.newOrders,
                tone: "amber",
              },
              {
                label: "New reviews",
                value: data.activityReport.summary.newReviews,
                tone: "violet",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]"
              >
                <p className="text-sm font-medium text-slate-500">
                  {item.label}
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                  {Number(item.value).toLocaleString("vi-VN")}
                </p>
                <span
                  className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                    item.tone === "sky"
                      ? "bg-sky-50 text-sky-700"
                      : item.tone === "emerald"
                        ? "bg-emerald-50 text-emerald-700"
                        : item.tone === "amber"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-violet-50 text-violet-700"
                  }`}
                >
                  Live
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-[1.5rem] bg-[linear-gradient(135deg,_rgba(0,142,204,0.12),_rgba(14,165,233,0.05))] p-5">
            <p className="text-sm font-semibold text-slate-900">User mix</p>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {Object.entries({
                customers: data.usersStats.customers,
                sellers: data.usersStats.sellers,
                admins: data.usersStats.admins,
              }).map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl bg-white p-4 text-center shadow-sm"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    {label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">
                    {Number(value).toLocaleString("vi-VN")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.05)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#008ECC]">
                Recent orders
              </p>
              <h3 className="mt-1 text-xl font-semibold text-slate-950">
                Latest activity
              </h3>
            </div>
            <span className="text-sm text-slate-500">
              Fetched from `/api/orders`
            </span>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[760px] border-separate border-spacing-y-3">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.2em] text-slate-400">
                  <th className="px-4 py-2 font-medium">Order</th>
                  <th className="px-4 py-2 font-medium">Customer</th>
                  <th className="px-4 py-2 font-medium">Amount</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="rounded-[1.25rem] bg-slate-50/80"
                    >
                      <td className="rounded-l-[1.25rem] px-4 py-4 font-medium text-slate-900">
                        {order.id}
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {order.Customer?.User?.username ||
                          order.Customer?.User?.email ||
                          "Guest"}
                      </td>
                      <td className="px-4 py-4 font-medium text-slate-900">
                        {currency.format(
                          Number(order.Payment?.[0]?.amount ?? 0),
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ring-1 ${statusClass(
                            order.status,
                          )}`}
                        >
                          {formatStatus(order.status)}
                        </span>
                      </td>
                      <td className="rounded-r-[1.25rem] px-4 py-4 text-slate-500">
                        {formatShortDate(order.orderDate || order.createdAt)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-10 text-center text-sm text-slate-400"
                    >
                      No order data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.05)]">
          <div>
            <p className="text-sm font-semibold text-[#008ECC]">
              Top customers
            </p>
            <h3 className="mt-1 text-xl font-semibold text-slate-950">
              Highest lifetime spend
            </h3>
          </div>

          <div className="mt-6 space-y-4">
            {data.topMembers.length > 0 ? (
              data.topMembers.map((member) => (
                <article
                  key={member.id}
                  className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[linear-gradient(135deg,_#0f172a_0%,_#1d4ed8_100%)] text-sm font-semibold text-white shadow-[0_10px_24px_rgba(15,23,42,0.18)]">
                          {member.rank}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-950">
                            {member.Customer?.User?.username || "Unknown user"}
                          </p>
                          <p className="text-sm text-slate-500">
                            {member.Customer?.User?.email || "No email"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <Badge tone="success">{member.membership}</Badge>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                      Lifetime spend
                    </span>
                    <span className="text-lg font-semibold text-slate-950">
                      {currency.format(Number(member.spent ?? 0))}
                    </span>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                No membership data available.
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.05)]">
          <p className="text-sm font-semibold text-[#008ECC]">Category stats</p>
          <h3 className="mt-1 text-xl font-semibold text-slate-950">
            Catalog health
          </h3>

          <div className="mt-6 grid gap-4">
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5">
              <p className="text-sm font-medium text-slate-500">
                Total categories
              </p>
              <div className="mt-3 flex items-end justify-between gap-4">
                <p className="text-4xl font-semibold tracking-tight text-slate-950">
                  {data.categoryStats.total.toLocaleString("vi-VN")}
                </p>
                <Badge
                  tone="neutral"
                  className="bg-sky-50 text-[#008ECC] ring-sky-200"
                >
                  Catalog overview
                </Badge>
              </div>
            </div>

            {data.categoryStats.topCategories.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {data.categoryStats.topCategories.map((category, index) => (
                  <div
                    key={category.id}
                    className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-700">
                          {category.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Top category #{index + 1}
                        </p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        {category.productCount.toLocaleString("vi-VN")} products
                      </span>
                    </div>

                    <div className="mt-4 h-2 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-[linear-gradient(90deg,_#0f172a_0%,_#008ECC_100%)]"
                        style={{
                          width: `${Math.min(20 + category.productCount * 6, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                No category statistics available.
              </div>
            )}
          </div>
        </article>

        <article className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(180deg,_#ffffff_0%,_#f8fbff_100%)] p-6 shadow-[0_18px_60px_rgba(15,23,42,0.05)]">
          <p className="text-sm font-semibold text-[#008ECC]">Quick notes</p>
          <h3 className="mt-1 text-xl font-semibold text-slate-950">
            What the API gives us
          </h3>

          <div className="mt-6 space-y-3">
            {quickNotes.map((item) => (
              <div
                key={item.title}
                className="rounded-[1.25rem] border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      {item.title}
                    </p>
                    <p className="mt-1 text-xl font-semibold text-slate-950">
                      {item.value}
                    </p>
                  </div>
                  <Badge
                    tone="neutral"
                    className="bg-slate-100 text-slate-600 ring-slate-200"
                  >
                    Live
                  </Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {item.note}
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

function emptyMoney(value: number | null | undefined) {
  return currency.format(Number(value ?? 0));
}
