import { cookies } from "next/headers";
export { formatReportDate, formatReportMoney } from "./report-format";

type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data: T;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api";

export function startDate(daysAgo: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

export async function readReportJson<T>(path: string): Promise<T> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  if (!accessToken) {
    throw new Error("UNAUTHORIZED");
  }

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

  const payload = (await response.json().catch(() => null)) as
    | ApiEnvelope<T>
    | null;

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
