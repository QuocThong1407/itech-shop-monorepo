import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE_NAMES, getAppHomePath, normalizeAuthRole } from "@itech/shared/auth";

export default async function HomePage() {
  const cookieStore = await cookies();
  const role = normalizeAuthRole(cookieStore.get(AUTH_COOKIE_NAMES.authRole)?.value);

  if (role) {
    redirect(getAppHomePath(role));
  }

  redirect("/login");
}
