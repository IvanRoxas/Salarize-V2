'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import toast from 'react-hot-toast';
import { X, User, Users, Shield, Briefcase, Calculator, Code, Monitor, Wrench, Headphones, Truck, Lightbulb, PenTool } from 'lucide-react';
import { createPositionAction } from '@/app/actions/position';

const ICONS = [
  { name: 'User', component: User },
  { name: 'Users', component: Users },
  { name: 'Shield', component: Shield },
  { name: 'Briefcase', component: Briefcase },
  { name: 'Calculator', component: Calculator },
  { name: 'Code', component: Code },
  { name: 'Monitor', component: Monitor },
  { name: 'Wrench', component: Wrench },
  { name: 'Headphones', component: Headphones },
  { name: 'Truck', component: Truck },
  { name: 'Lightbulb', component: Lightbulb },
  { name: 'PenTool', component: PenTool },
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`w-full py-2.5 px-6 text-sm bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-lg shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer ${pending ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {pending ? 'Creating...' : 'Create Position'}
    </button>
  );
}

export default function CreatePositionModal({ departments, onClose }: { departments: any[], onClose: () => void }) {
  const [selectedIcon, setSelectedIcon] = useState('Briefcase');

  const handleCreate = async (formData: FormData) => {
    const result = await createPositionAction(formData);
    if (result.success) {
      toast.success(result.message);
      onClose();
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-violet-50 px-6 py-4 border-b border-violet-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 text-lg">New Job Position</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <form action={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Job Title</label>
              <input 
                type="text" 
                name="title" 
                required 
                placeholder="e.g. Senior Software Engineer"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none cursor-pointer" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
              <select 
                name="department_id" 
                required 
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none cursor-pointer"
              >
                <option value="">Assign to Department...</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>

            <div className="border-t border-slate-100 pt-4 mt-2">
              <h4 className="text-sm font-bold text-slate-800 mb-3">Compensation Boundaries</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Min Salary (₱)</label>
                  <input 
                    type="number" 
                    name="min_salary" 
                    step="0.01"
                    min="0"
                    required 
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none cursor-pointer" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Base Salary (₱)</label>
                  <input 
                    type="number" 
                    name="base_salary" 
                    step="0.01"
                    min="0"
                    required 
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none cursor-pointer" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Max Salary (₱)</label>
                  <input 
                    type="number" 
                    name="max_salary" 
                    step="0.01"
                    min="0"
                    required 
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none cursor-pointer" 
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="block text-sm font-medium text-slate-700">Position Icon</label>
              <div className="grid grid-cols-6 gap-2">
                {ICONS.map((icon) => {
                  const IconComponent = icon.component;
                  return (
                    <button
                      key={icon.name}
                      type="button"
                      onClick={() => setSelectedIcon(icon.name)}
                      className={`p-2 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                        selectedIcon === icon.name 
                          ? 'bg-violet-100 text-violet-600 ring-2 ring-violet-500 ring-offset-1' 
                          : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
              <input type="hidden" name="icon" value={selectedIcon} />
            </div>

            <div className="pt-4">
              <SubmitButton />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
