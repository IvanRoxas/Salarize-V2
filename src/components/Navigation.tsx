"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const pathname = usePathname();

  const navLinks = [
    { name: "Dashboard", href: "/" },
    { name: "Employees", href: "/employees" },
    { name: "Manage Salaries", href: "/salary" },
  ];

  return (
    <div className="bg-white shadow-sm rounded-xl px-6 py-2 flex space-x-8 border border-slate-200">
      {navLinks.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.name}
            href={link.href}
            className={`font-semibold py-3 border-b-2 transition-colors text-sm ${
              isActive
                ? "border-[var(--color-emerald-custom)] text-[var(--color-emerald-custom)]"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {link.name}
          </Link>
        );
      })}
    </div>
  );
}
