import type { ReactNode } from "react";

import { DashboardLayout } from "@/components/DashboardLayout";
import { requireDashboardUser } from "@/lib/dashboard-auth";

export const dynamic = "force-dynamic";

export default async function DashboardRouteLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const user = await requireDashboardUser();

  return <DashboardLayout user={user}>{children}</DashboardLayout>;
}
