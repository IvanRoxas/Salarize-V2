'use client';

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import { logoutAction } from "@/app/actions/auth";

export default function AdminProfile({ username, role }: { username: string; role: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsOpen(false);
    const result = await logoutAction();
    if (result.success) {
      toast.success("Logged out successfully.");
      router.push('/login');
    }
  };

  const getInitial = (name: string) => name ? name.charAt(0).toUpperCase() : 'A';
  const displayRole = role?.replace('_', ' ') || 'Administrator';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 hover:bg-violet-700 rounded-lg p-3 transition-colors cursor-pointer active:scale-95 text-white"
      >
        <div className="hidden sm:block text-right">
          <p className="text-[15px] font-bold leading-tight capitalize">{displayRole}</p>
          <p className="text-xs text-violet-200 font-medium">{username || 'AdminSalarize'}</p>
        </div>
        <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-white text-sm backdrop-blur-sm">
          {getInitial(username)}
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-[100]">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-800 capitalize">{displayRole}</p>
            <p className="text-xs text-slate-500">{username || 'AdminSalarize'}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
}
