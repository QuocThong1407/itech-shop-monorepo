import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  if (!accessToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", "/reports/activity");
    return Response.redirect(loginUrl.toString(), 302);
  }

  const url = new URL(request.url);
  const search = url.searchParams.toString();
  const backendResponse = await fetch(
    `${API_BASE_URL}/reports/activity?${search}&format=excel`,
    {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        cookie: cookieStore
          .getAll()
          .map((item) => `${item.name}=${item.value}`)
          .join("; "),
      },
    },
  );

  if (backendResponse.status === 401) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", "/reports/activity");
    return Response.redirect(loginUrl.toString(), 302);
  }

  const headers = new Headers(backendResponse.headers);
  if (!headers.get("content-disposition")) {
    headers.set("content-disposition", 'attachment; filename="activity_report.xlsx"');
  }

  return new Response(backendResponse.body, {
    status: backendResponse.status,
    headers,
  });
}
