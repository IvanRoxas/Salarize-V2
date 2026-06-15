'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Briefcase, 
  LayoutDashboard, 
  Users, 
  ShieldAlert, 
  FileArchive,
  UserPlus,
  Shield
} from "lucide-react";

export default function RoleBasedSidebar({ role }: { role: string }) {
  const pathname = usePathname();

  const getLinks = () => {
    switch (role) {
      case 'SUPER_ADMIN':
        return [
          { href: '/', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
          { href: '/personnel', label: 'Manage Employees', icon: <Users className="w-5 h-5" /> },
          { href: '/departments', label: 'Departments', icon: <Briefcase className="w-5 h-5" /> },
          { href: '/admins', label: 'System Roles', icon: <Shield className="w-5 h-5" /> },
          { href: '/audit-logs', label: 'Security Logs', icon: <ShieldAlert className="w-5 h-5" /> },
        ];
      case 'HR_MANAGER':
        return [
          { href: '/', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
          { href: '/personnel', label: 'Manage Employees', icon: <Users className="w-5 h-5" /> },
          { href: '/payroll', label: 'Salary and Operations', icon: <Briefcase className="w-5 h-5" /> },
          { href: '/departments', label: 'Departments', icon: <Briefcase className="w-5 h-5" /> },
        ];
      case 'AUDITOR':
        return [
          { href: '/', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
          { href: '/audit-logs', label: 'Security Logs', icon: <ShieldAlert className="w-5 h-5" /> },
          { href: '/archives', label: 'System Archives', icon: <FileArchive className="w-5 h-5" /> },
        ];
      default:
        return [
          { href: '/', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> }
        ];
    }
  };

  const links = getLinks();

  return (
    <nav className="flex-1 px-4 space-y-2">
      {links.map((link) => {
        const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== '/');
        return (
          <Link 
            key={link.href} 
            href={link.href} 
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-semibold transition-colors ${
              isActive 
                ? 'bg-violet-600 text-white shadow-md' 
                : 'hover:bg-slate-700 text-slate-300'
            }`}
          >
            {link.icon}
            <span>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
