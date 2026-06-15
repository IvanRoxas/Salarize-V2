import React from 'react';

export function Table({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="w-full overflow-auto bg-white rounded-xl shadow-sm border border-slate-200">
      <table className={`w-full text-sm text-left text-slate-700 border-collapse ${className}`}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <thead className={`bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200 sticky top-0 z-10 ${className}`}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <tbody className={`divide-y divide-slate-100 ${className}`}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <tr className={`hover:bg-slate-50 transition-colors ${className}`}>
      {children}
    </tr>
  );
}

export function TableHead({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-6 py-3 font-semibold ${className}`}>
      {children}
    </th>
  );
}

export function TableCell({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={`px-6 py-4 align-middle ${className}`}>
      {children}
    </td>
  );
}
