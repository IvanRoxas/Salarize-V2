'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-slate-200">
      <div className="text-sm text-slate-500">
        Page <span className="font-medium text-slate-800">{currentPage}</span> of{' '}
        <span className="font-medium text-slate-800">{totalPages}</span>
      </div>
      <div className="flex space-x-3">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center space-x-1 px-4 py-2 text-sm font-semibold text-violet-600 bg-violet-50 border border-violet-100 rounded-full hover:bg-violet-100 hover:border-violet-200 disabled:opacity-50 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed transition-all duration-200 shadow-sm cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center space-x-1 px-4 py-2 text-sm font-semibold text-violet-600 bg-violet-50 border border-violet-100 rounded-full hover:bg-violet-100 hover:border-violet-200 disabled:opacity-50 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed transition-all duration-200 shadow-sm cursor-pointer"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
