import { UserRole } from "@taskflow/shared";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireDashboardUser } from "@/lib/dashboard-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin | TaskFlow",
};

export default async function AdminPage() {
  const user = await requireDashboardUser();

  if (user.role !== UserRole.Admin) {
    redirect("/dashboard");
  }

  redirect("/dashboard/admin/users");
}
