import type { ReactNode } from "react";
import type { SafeUser } from "@taskflow/shared";

import { DashboardNav } from "@/components/DashboardNav";
import { Navbar } from "@/components/Navbar";

type DashboardLayoutProps = {
  children: ReactNode;
  user: SafeUser;
};

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-surface">
      <Navbar user={user} />
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[220px_1fr] lg:px-10">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <DashboardNav />
        </aside>
        <main>{children}</main>
      </div>
    </div>
  );
}
