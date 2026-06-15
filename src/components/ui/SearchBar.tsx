'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useRef, useState } from 'react';
import { Search } from 'lucide-react';

export default function SearchBar() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const [term, setTerm] = useState(searchParams.get('query') || '');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearch = (value: string) => {
    setTerm(value);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (value) {
        params.set('query', value);
      } else {
        params.delete('query');
      }
      replace(`${pathname}?${params.toString()}`);
    }, 300);
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <Search className="w-5 h-5 text-slate-400" />
      </div>
      <input
        type="text"
        className="bg-white border border-slate-300 text-slate-800 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-10 p-2.5 transition-colors shadow-sm"
        placeholder="Search personnel by name or email..."
        value={term}
        onChange={(e) => handleSearch(e.target.value)}
      />
    </div>
  );
}
