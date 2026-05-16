import { redirect } from "next/navigation";

export default function LegacyDashboardNewProjectPage() {
  redirect("/projects/new");
}
