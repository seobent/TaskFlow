"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/projects", label: "Projects" },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2 overflow-x-auto rounded-md border border-ink/10 bg-white p-2 shadow-sm lg:flex-col lg:overflow-visible">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));

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
