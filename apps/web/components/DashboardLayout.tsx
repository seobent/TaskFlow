import type { ReactNode } from "react";
import type { SafeUser } from "@taskflow/shared";

import { Navbar } from "@/components/Navbar";

type DashboardLayoutProps = {
  children: ReactNode;
  user: SafeUser;
};

const navItems = ["Dashboard", "Projects", "Issues", "Teams"];

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-surface">
      <Navbar user={user} />
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[220px_1fr] lg:px-10">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <nav className="flex gap-2 overflow-x-auto rounded-md border border-ink/10 bg-white p-2 shadow-sm lg:flex-col lg:overflow-visible">
            {navItems.map((item, index) => (
              <span
                className={[
                  "whitespace-nowrap rounded px-3 py-2 text-sm font-semibold",
                  index === 0 ? "bg-ink text-white" : "text-ink/65",
                ]
                  .filter(Boolean)
                  .join(" ")}
                key={item}
              >
                {item}
              </span>
            ))}
          </nav>
        </aside>
        <main>{children}</main>
      </div>
    </div>
  );
}
