import type { Metadata } from "next";

import { DashboardLayout } from "@/components/DashboardLayout";
import { ProjectMembersView } from "@/components/projects/ProjectMembersView";
import { requireDashboardUser } from "@/lib/dashboard-auth";

export const metadata: Metadata = {
  title: "Project Members | TaskFlow",
};

type ProjectMembersPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProjectMembersPage({
  params,
}: ProjectMembersPageProps) {
  const [{ id }, user] = await Promise.all([params, requireDashboardUser()]);

  return (
    <DashboardLayout user={user}>
      <ProjectMembersView projectId={id} />
    </DashboardLayout>
  );
}
