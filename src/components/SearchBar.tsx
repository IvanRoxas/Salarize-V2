"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, FormEvent } from 'react';

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/employees?q=${encodeURIComponent(query.trim())}`);
    } else {
      router.push('/employees');
    }
  };

  return (
    <form onSubmit={handleSearch} className="flex-1 max-w-lg mx-8 w-full">
      <div className="relative">
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search employees or departments..." 
          className="w-full bg-slate-100 border-none rounded-lg pl-10 pr-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-emerald-custom)] transition"
        />
        <svg 
          className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
    </form>
  );
}
