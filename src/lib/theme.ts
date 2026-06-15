import { Building, Users, Monitor, Shield, Layers, Code, Calculator, Cpu, Globe, Briefcase } from 'lucide-react';

export const IconMap: Record<string, any> = {
  Building, Users, Monitor, Shield, Layers, Code, Calculator, Cpu, Globe, Briefcase
};

export const ColorMap: Record<string, { border: string, hover: string, text: string, bg: string, btnTextHover: string, btnBgHover: string, btnRingHover: string }> = {
  violet: { border: 'border-t-violet-500', hover: 'hover:border-violet-300', text: 'text-violet-600', bg: 'bg-violet-50', btnTextHover: 'hover:text-violet-600', btnBgHover: 'hover:bg-violet-50', btnRingHover: 'hover:ring-violet-400' },
  emerald: { border: 'border-t-emerald-500', hover: 'hover:border-emerald-300', text: 'text-emerald-600', bg: 'bg-emerald-50', btnTextHover: 'hover:text-emerald-600', btnBgHover: 'hover:bg-emerald-50', btnRingHover: 'hover:ring-emerald-400' },
  amber: { border: 'border-t-amber-500', hover: 'hover:border-amber-300', text: 'text-amber-600', bg: 'bg-amber-50', btnTextHover: 'hover:text-amber-600', btnBgHover: 'hover:bg-amber-50', btnRingHover: 'hover:ring-amber-400' },
  rose: { border: 'border-t-rose-500', hover: 'hover:border-rose-300', text: 'text-rose-600', bg: 'bg-rose-50', btnTextHover: 'hover:text-rose-600', btnBgHover: 'hover:bg-rose-50', btnRingHover: 'hover:ring-rose-400' },
  blue: { border: 'border-t-blue-500', hover: 'hover:border-blue-300', text: 'text-blue-600', bg: 'bg-blue-50', btnTextHover: 'hover:text-blue-600', btnBgHover: 'hover:bg-blue-50', btnRingHover: 'hover:ring-blue-400' },
  slate: { border: 'border-t-slate-500', hover: 'hover:border-slate-300', text: 'text-slate-600', bg: 'bg-slate-50', btnTextHover: 'hover:text-slate-600', btnBgHover: 'hover:bg-slate-50', btnRingHover: 'hover:ring-slate-400' },
};

export const HexColorMap: Record<string, string> = {
  violet: '#8b5cf6',
  emerald: '#10b981',
  amber: '#f59e0b',
  rose: '#ef4444',
  blue: '#3b82f6',
  slate: '#64748b'
};
