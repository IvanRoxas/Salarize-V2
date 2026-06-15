'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import { loginAction } from '@/app/actions/auth';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`w-full mt-6 bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 text-white font-semibold py-3.5 rounded-xl shadow-[0_4px_14px_0_rgba(109,40,217,0.39)] hover:shadow-[0_6px_20px_rgba(109,40,217,0.23)] hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 transition-all duration-300 flex items-center justify-center ${pending ? 'opacity-70 cursor-wait shadow-none hover:translate-y-0 hover:shadow-none' : ''}`}
    >
      {pending ? 'Authenticating...' : 'Sign In'}
    </button>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  
  const handleLogin = async (formData: FormData) => {
    const res = await loginAction(formData);
    if (res.success) {
      toast.success(res.message);
      router.push('/');
    } else {
      toast.error(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background glowing ambient orbs */}
      <div className="absolute top-1/4 left-1/4 w-[30rem] h-[30rem] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[25rem] h-[25rem] bg-indigo-600/10 rounded-full blur-[80px] pointer-events-none"></div>
      
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-[0_8px_40px_rgb(0,0,0,0.5)] border border-white/20 w-full max-w-md p-8 relative z-10 hover:shadow-[0_15px_50px_rgba(109,40,217,0.15)] transition-shadow duration-500">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Salarize</h1>
          <p className="text-slate-500 text-sm mt-2 font-medium">Automated Payroll & Management</p>
        </div>

        <form action={handleLogin} className="space-y-5">
          <div className="group">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 transition-colors group-focus-within:text-purple-600">Username</label>
            <input
              type="text"
              name="username"
              required
              placeholder="Username"
              className="w-full bg-slate-50/50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-4 focus:ring-purple-600/10 focus:border-purple-500 hover:border-purple-300 outline-none transition-all duration-300 shadow-sm"
            />
          </div>
          
          <div className="group">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 transition-colors group-focus-within:text-purple-600">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                placeholder="Password"
                className="w-full bg-slate-50/50 border border-slate-200 text-slate-900 rounded-xl pl-4 pr-11 py-3 text-sm focus:bg-white focus:ring-4 focus:ring-purple-600/10 focus:border-purple-500 hover:border-purple-300 outline-none transition-all duration-300 shadow-sm"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <SubmitButton />
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs font-medium text-slate-400 tracking-wide">
            Technological Institute of the Philippines
          </p>
        </div>
      </div>
    </div>
  );
}
