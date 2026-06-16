'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import { loginAction, requestAccessAction, verify2FAAction } from '@/app/actions/auth';
import toast from 'react-hot-toast';
import { Eye, EyeOff, ShieldCheck, ArrowLeft, DollarSign } from 'lucide-react';

function SubmitButton({ step }: { step: 'login' | 'signup' | '2fa' }) {
  const { pending } = useFormStatus();
  
  let label = 'Sign In';
  if (step === 'signup') label = 'Request Access';
  if (step === '2fa') label = 'Verify Code';

  let pendingLabel = 'Authenticating...';
  if (step === 'signup') pendingLabel = 'Submitting...';
  if (step === '2fa') pendingLabel = 'Verifying...';

  return (
    <button
      type="submit"
      disabled={pending}
      className={`w-full mt-6 bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 text-white font-semibold py-3.5 rounded-xl shadow-[0_4px_14px_0_rgba(109,40,217,0.39)] hover:shadow-[0_6px_20px_rgba(109,40,217,0.23)] hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 transition-all duration-300 flex items-center justify-center ${pending ? 'opacity-70 cursor-wait shadow-none hover:translate-y-0 hover:shadow-none' : ''}`}
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<'login' | 'signup' | '2fa'>('login');
  
  const handleSubmit = async (formData: FormData) => {
    if (step === 'signup') {
      const res = await requestAccessAction(formData);
      if (res.success) {
        toast.success(res.message, { duration: 5000 });
        setStep('login');
      } else {
        toast.error(res.message);
      }
    } else if (step === 'login') {
      const res = await loginAction(formData);
      if (res.requires2FA) {
        // Mock 2FA Delivery
        toast.success(
          (t) => (
            <div className="flex flex-col">
              <span className="font-bold text-sm">2FA Code Sent!</span>
              <span className="text-xs mt-1">Code: <strong className="text-purple-600 text-base">{res.mockCode}</strong></span>
            </div>
          ),
          { duration: 10000 }
        );
        setStep('2fa');
      } else if (res.success) {
        // Fallback if 2FA wasn't triggered
        toast.success(res.message);
        router.push('/');
      } else {
        toast.error(res.message);
      }
    } else if (step === '2fa') {
      const res = await verify2FAAction(formData);
      if (res.success) {
        toast.success(res.message);
        router.push('/');
      } else {
        toast.error(res.message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Deep purple ambient background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-900 to-slate-900 pointer-events-none"></div>
      
      {/* Background glowing ambient orbs */}
      <div className="absolute top-1/4 left-1/4 w-[35rem] h-[35rem] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-violet-600/20 rounded-full blur-[100px] pointer-events-none"></div>
      
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-[0_8px_40px_rgb(0,0,0,0.5)] border border-purple-100 w-full max-w-lg p-10 relative z-10 hover:shadow-[0_15px_50px_rgba(109,40,217,0.2)] transition-shadow duration-500">
        
        {step === '2fa' ? (
          <div className="text-center mb-10 fade-in">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-purple-50 shadow-inner">
              <ShieldCheck className="w-8 h-8 text-purple-700" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Two-Step Verification</h1>
            <p className="text-slate-500 text-sm mt-3 font-medium px-4">
              Enter the 6-digit authentication code that was sent to your trusted device.
            </p>
          </div>
        ) : (
          <div className="text-center mb-10 fade-in">
            <div className="w-16 h-16 bg-violet-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_4px_14px_0_rgba(109,40,217,0.39)]">
              <DollarSign className="w-9 h-9" strokeWidth={2.5} />
            </div>
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-violet-600 tracking-tight">Salarize</h1>
            <p className="text-slate-500 text-[15px] mt-2 font-medium">Enterprise Payroll and Management</p>
          </div>
        )}

        {/* Toggle Pills (hidden during 2FA) */}
        {step !== '2fa' && (
          <div className="flex bg-purple-50/60 p-1.5 rounded-xl mb-8 fade-in border border-purple-100 shadow-inner relative">
            <button
              type="button"
              onClick={() => setStep('login')}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 z-10 active:scale-95 ${
                step === 'login' 
                  ? 'bg-white text-purple-700 shadow-[0_2px_10px_rgba(109,40,217,0.15)] border border-purple-200/50' 
                  : 'text-slate-500 hover:text-purple-700 hover:bg-white/50'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setStep('signup')}
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 z-10 active:scale-95 ${
                step === 'signup' 
                  ? 'bg-white text-purple-700 shadow-[0_2px_10px_rgba(109,40,217,0.15)] border border-purple-200/50' 
                  : 'text-slate-500 hover:text-purple-700 hover:bg-white/50'
              }`}
            >
              Request Access
            </button>
          </div>
        )}

        {step === 'signup' && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm text-left fade-in">
            A system administrator must approve your account and assign a role before you can sign in.
          </div>
        )}

        <form action={handleSubmit} className="space-y-5 relative">
          
          {step === '2fa' ? (
            <div className="group fade-in animate-in slide-in-from-right-4 duration-300">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 transition-colors group-focus-within:text-purple-600">
                Authentication Code
              </label>
              <input
                type="text"
                name="code"
                required
                maxLength={6}
                placeholder="123456"
                className="w-full bg-slate-50/50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 text-center tracking-[0.5em] text-2xl font-bold focus:bg-white focus:ring-4 focus:ring-purple-600/10 focus:border-purple-500 hover:border-purple-300 outline-none transition-all duration-300 shadow-sm"
              />
            </div>
          ) : (
            <div className="fade-in animate-in slide-in-from-left-4 duration-300 space-y-5">
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
            </div>
          )}

          <SubmitButton step={step} />

          {step === '2fa' && (
            <button 
              type="button" 
              onClick={() => setStep('login')}
              className="w-full mt-4 flex items-center justify-center space-x-2 text-sm font-medium text-slate-500 hover:text-purple-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Login</span>
            </button>
          )}
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
