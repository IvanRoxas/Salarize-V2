'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, ArrowLeft } from 'lucide-react';

export default function PendingPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(15);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          router.push('/login');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-900/20 via-slate-900 to-slate-900 pointer-events-none"></div>
      
      {/* Glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-[35rem] h-[35rem] bg-amber-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-orange-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-[0_8px_40px_rgb(0,0,0,0.5)] border border-amber-100 w-full max-w-xl p-10 relative z-10 text-center animate-in fade-in zoom-in duration-500">
        
        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-amber-100/50 shadow-inner">
          <Clock className="w-10 h-10 text-amber-500" />
        </div>
        
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-3">Account Pending Approval</h1>
        
        <p className="text-slate-500 mb-8 text-base font-medium px-4 leading-relaxed">
          Your authentication is still underway. A System Administrator must review your request and assign your role before you can access Salarize.
        </p>

        <div className="text-sm font-bold text-amber-700 mb-8 bg-amber-50/80 py-4 px-6 rounded-2xl border border-amber-200 shadow-sm inline-flex items-center space-x-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
          </span>
          <span>Redirecting to login in {countdown} seconds...</span>
        </div>

        <button 
          onClick={() => router.push('/login')}
          className="w-full flex items-center justify-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3.5 rounded-xl transition-all hover:shadow-sm active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Return to Login Now</span>
        </button>

      </div>
    </div>
  );
}
