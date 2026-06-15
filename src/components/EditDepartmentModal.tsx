'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import toast from 'react-hot-toast';
import { X, Trash2, Building, Users, Monitor, Shield, Layers, Code, Calculator, Cpu, Globe, Briefcase } from 'lucide-react';
import { updateDepartmentAction, deleteDepartmentAction } from '@/app/actions/department';
import ConfirmModal from '@/components/ConfirmModal';

const ICONS = [
  { name: 'Building', component: Building },
  { name: 'Users', component: Users },
  { name: 'Monitor', component: Monitor },
  { name: 'Shield', component: Shield },
  { name: 'Layers', component: Layers },
  { name: 'Code', component: Code },
  { name: 'Calculator', component: Calculator },
  { name: 'Cpu', component: Cpu },
  { name: 'Globe', component: Globe },
  { name: 'Briefcase', component: Briefcase },
];

const COLORS = [
  { name: 'violet', bg: 'bg-violet-500', ring: 'ring-violet-500' },
  { name: 'emerald', bg: 'bg-emerald-500', ring: 'ring-emerald-500' },
  { name: 'amber', bg: 'bg-amber-500', ring: 'ring-amber-500' },
  { name: 'rose', bg: 'bg-rose-500', ring: 'ring-rose-500' },
  { name: 'blue', bg: 'bg-blue-500', ring: 'ring-blue-500' },
  { name: 'slate', bg: 'bg-slate-500', ring: 'ring-slate-500' },
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`w-full sm:flex-1 py-2.5 px-6 text-sm bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer ${pending ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {pending ? 'Saving...' : 'Save Changes'}
    </button>
  );
}

export default function EditDepartmentModal({
  department,
  role,
  onClose,
}: {
  department: any;
  role: string;
  onClose: () => void;
}) {
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState(department.icon || 'Building');
  const [selectedColor, setSelectedColor] = useState(department.color || 'violet');

  const handleUpdate = async (formData: FormData) => {
    formData.append('id', department.id);
    const result = await updateDepartmentAction(formData);
    if (result.success) {
      toast.success(result.message);
      onClose();
    } else {
      toast.error(result.message);
    }
  };

  const handleDelete = async () => {
    setShowConfirm(false);
    const result = await deleteDepartmentAction(department.id);
    if (result.success) {
      toast.success(result.message);
      onClose();
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden relative z-[9999] animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-violet-100 flex justify-between items-center bg-violet-50">
          <h3 className="font-bold text-slate-800 text-lg">Edit Department</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          <form action={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Department Name</label>
              <input 
                type="text" 
                name="name" 
                defaultValue={department.name}
                required 
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none cursor-pointer" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea 
                name="description" 
                defaultValue={department.description || ''}
                rows={3}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 outline-none cursor-pointer resize-none" 
              />
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700">Department Icon</label>
              <div className="grid grid-cols-5 gap-2">
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
                      <IconComponent className="w-5 h-5" />
                    </button>
                  );
                })}
              </div>
              <input type="hidden" name="icon" value={selectedIcon} />
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700">Theme Color</label>
              <div className="flex gap-3">
                {COLORS.map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => setSelectedColor(color.name)}
                    className={`w-8 h-8 rounded-full ${color.bg} transition-all cursor-pointer ${
                      selectedColor === color.name ? `ring-2 ${color.ring} ring-offset-2 scale-110` : 'hover:scale-110'
                    }`}
                  />
                ))}
              </div>
              <input type="hidden" name="color" value={selectedColor} />
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <SubmitButton />
              
              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={() => setShowConfirm(true)}
                  className="w-full sm:w-auto py-2.5 px-4 text-sm border border-red-200 text-red-600 hover:bg-red-50 font-semibold rounded-lg transition-colors flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {showConfirm && (
        <ConfirmModal
          title="Delete Department"
          message={`Are you sure you want to delete the department "${department.name}" permanently? This cannot be undone.`}
          confirmText="Delete"
          onConfirm={handleDelete}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}
