import { redirect } from "next/navigation";

type LegacyDashboardProjectPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function LegacyDashboardProjectPage({
  params,
}: LegacyDashboardProjectPageProps) {
  const { id } = await params;

  redirect(`/projects/${id}`);
}
