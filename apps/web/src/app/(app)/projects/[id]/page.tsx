import type { Metadata } from "next";

import { ProjectDetailsView } from "@/components/projects/ProjectDetailsView";
import { requireDashboardUser } from "@/lib/dashboard-auth";

export const metadata: Metadata = {
  title: "Project Details | TaskFlow",
};

type ProjectDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProjectDetailsPage({
  params,
}: ProjectDetailsPageProps) {
  const [{ id }, user] = await Promise.all([params, requireDashboardUser()]);

  return <ProjectDetailsView currentUser={user} projectId={id} />;
}
