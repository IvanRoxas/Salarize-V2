"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";

const IDLE_TIMEOUT_MS = 180000; // 3 minutes
const WARNING_DURATION_MS = 30000; // 30 seconds
const STORAGE_KEY = 'salarize_last_activity';

export default function SessionTimeout() {
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(WARNING_DURATION_MS / 1000);
  
  const showWarningRef = useRef(false);
  const idleTimer = useRef<NodeJS.Timeout | null>(null);
  const warningInterval = useRef<NodeJS.Timeout | null>(null);
  const lastUpdate = useRef(0);

  useEffect(() => {
    showWarningRef.current = showWarning;
  }, [showWarning]);

  const scheduleIdleCheck = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    
    const lastActivityStr = localStorage.getItem(STORAGE_KEY);
    const lastActivity = lastActivityStr ? parseInt(lastActivityStr, 10) : Date.now();
    const timeSinceLastActivity = Date.now() - lastActivity;
    const remainingIdleTime = IDLE_TIMEOUT_MS - timeSinceLastActivity;

    if (remainingIdleTime <= 0) {
      setShowWarning(true);
      setRemainingTime(WARNING_DURATION_MS / 1000);
    } else {
      idleTimer.current = setTimeout(scheduleIdleCheck, remainingIdleTime);
    }
  }, []);

  const handleActivity = useCallback(() => {
    if (showWarningRef.current) return;
    const now = Date.now();
    // Throttle to 1 second
    if (now - lastUpdate.current > 1000) {
      localStorage.setItem(STORAGE_KEY, now.toString());
      lastUpdate.current = now;
      scheduleIdleCheck();
    }
  }, [scheduleIdleCheck]);

  const handleLogout = async () => {
    await logoutAction();
    router.push('/login');
  };

  const handleStaySignedIn = () => {
    setShowWarning(false);
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
    scheduleIdleCheck();
  };

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
    }
    
    const events = ['mousemove', 'keydown', 'click', 'scroll'];
    events.forEach(event => document.addEventListener(event, handleActivity));
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        if (showWarningRef.current) {
          setShowWarning(false);
        }
        scheduleIdleCheck();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    scheduleIdleCheck();

    return () => {
      events.forEach(event => document.removeEventListener(event, handleActivity));
      window.removeEventListener('storage', handleStorageChange);
      if (idleTimer.current) clearTimeout(idleTimer.current);
      if (warningInterval.current) clearInterval(warningInterval.current);
    };
  }, [handleActivity, scheduleIdleCheck]);

  useEffect(() => {
    if (showWarning) {
      warningInterval.current = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            if (warningInterval.current) clearInterval(warningInterval.current);
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

  useEffect(() => {
    if (showWarning && remainingTime === 0) {
      handleLogout();
    }
  }, [remainingTime, showWarning]);

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
