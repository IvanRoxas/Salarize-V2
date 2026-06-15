"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";

const IDLE_TIMEOUT_MS = 180000; // 3 minutes
const WARNING_DURATION_MS = 30000; // 30 seconds

export default function SessionTimeout() {
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(WARNING_DURATION_MS / 1000);
  
  const idleTimer = useRef<NodeJS.Timeout | null>(null);
  const warningInterval = useRef<NodeJS.Timeout | null>(null);

  const resetIdleTimer = () => {
    if (showWarning) return; // Do not reset if warning is already showing

    if (idleTimer.current) clearTimeout(idleTimer.current);
    
    idleTimer.current = setTimeout(() => {
      setShowWarning(true);
      setRemainingTime(WARNING_DURATION_MS / 1000);
    }, IDLE_TIMEOUT_MS);
  };

  const handleLogout = async () => {
    await logoutAction();
    router.push('/login');
  };

  const handleStaySignedIn = () => {
    setShowWarning(false);
    resetIdleTimer();
  };

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click', 'scroll'];
    
    events.forEach(event => document.addEventListener(event, resetIdleTimer));
    resetIdleTimer();

    return () => {
      events.forEach(event => document.removeEventListener(event, resetIdleTimer));
      if (idleTimer.current) clearTimeout(idleTimer.current);
      if (warningInterval.current) clearInterval(warningInterval.current);
    };
  }, [showWarning]);

  useEffect(() => {
    if (showWarning) {
      warningInterval.current = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            if (warningInterval.current) clearInterval(warningInterval.current);
            handleLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (warningInterval.current) clearInterval(warningInterval.current);
    }

    return () => {
      if (warningInterval.current) clearInterval(warningInterval.current);
    };
  }, [showWarning]);

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-xl shadow-xl border border-slate-200 max-w-sm w-full text-center">
        <h3 className="text-xl font-bold text-slate-800 mb-2">Security Alert</h3>
        <p className="text-slate-600 mb-4">
          Session expiring due to inactivity in <span className="font-bold text-red-600">{remainingTime}s</span>.
        </p>
        <button
          onClick={handleStaySignedIn}
          className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          Stay Signed In
        </button>
      </div>
    </div>
  );
}
