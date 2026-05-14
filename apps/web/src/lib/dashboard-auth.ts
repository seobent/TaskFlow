import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AUTH_COOKIE_NAME, getCurrentUserFromToken } from "@/lib/auth";

export async function requireDashboardUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const user = await getCurrentUserFromToken(token);

  if (!user) {
    redirect("/login");
  }

  return user;
}
