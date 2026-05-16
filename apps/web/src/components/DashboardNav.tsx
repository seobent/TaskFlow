"use client";

import type { SafeUser } from "@taskflow/shared";
import { UserRole } from "@taskflow/shared";
import Link from "next/link";
import { usePathname } from "next/navigation";

const baseNavItems: DashboardNavItem[] = [
  { exact: true, href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/projects", label: "Projects" },
];

const adminNavItems: DashboardNavItem[] = [
  { href: "/dashboard/users", label: "Users" },
];

type DashboardNavProps = {
  user: SafeUser;
};

type DashboardNavItem = {
  exact?: boolean;
  href: string;
  label: string;
};

export function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname();
  const navItems =
    user.role === UserRole.Admin
      ? [...baseNavItems, ...adminNavItems]
      : baseNavItems;

  return (
    <nav className="flex gap-2 overflow-x-auto rounded-md border border-ink/10 bg-white p-2 shadow-sm lg:flex-col lg:overflow-visible">
      {navItems.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            aria-current={isActive ? "page" : undefined}
            className={[
              "whitespace-nowrap rounded px-3 py-2 text-sm font-semibold transition",
              isActive
                ? "bg-ink text-white"
                : "text-ink/65 hover:bg-ink/5 hover:text-ink",
            ]
              .filter(Boolean)
              .join(" ")}
            href={item.href}
            key={item.href}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
