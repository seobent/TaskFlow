import type { Metadata } from "next";

import { ProjectMembersView } from "@/components/projects/ProjectMembersView";

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
  const { id } = await params;

  return <ProjectMembersView projectId={id} />;
}
