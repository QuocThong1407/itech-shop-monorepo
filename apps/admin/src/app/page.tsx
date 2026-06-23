import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { fetchDashboardData } from "../features/dashboard/api";
import DashboardPageContent from "../features/dashboard/dashboard-page-content";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  if (!accessToken) {
    redirect(`/login?next=${encodeURIComponent("/admin")}`);
  }

  try {
    const data = await fetchDashboardData(accessToken);
    return <DashboardPageContent data={data} />;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message === "UNAUTHORIZED" || message.includes("Invalid token")) {
      redirect(`/login?next=${encodeURIComponent("/admin")}`);
    }

    throw error;
  }
}
