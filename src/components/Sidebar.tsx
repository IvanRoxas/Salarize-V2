"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, CreditCard } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const navLinks = [
    { name: "Dashboard", href: "/", icon: <LayoutDashboard className="w-5 h-5 mr-3" /> },
    { name: "Employees", href: "/employees", icon: <Users className="w-5 h-5 mr-3" /> },
    { name: "Manage Salaries", href: "/salary", icon: <CreditCard className="w-5 h-5 mr-3" /> },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-slate-900 text-slate-300 flex flex-col z-50">
      <div className="h-16 flex items-center px-8 border-b border-slate-800 mb-4">
        <h1 className="text-2xl font-bold tracking-tight text-white">Salarize</h1>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[var(--color-emerald-custom)]/10 text-[var(--color-emerald-custom)] border-l-4 border-[var(--color-emerald-custom)]"
                  : "border-l-4 border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-100"
              }`}
            >
              {link.icon}
              {link.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
