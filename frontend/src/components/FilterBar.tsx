import React from 'react';
import { Search, X, Flame, AlertCircle, Clock } from 'lucide-react';
import type { UrgencyLevel } from '../types/wire';

export const CATEGORIES = [
  'Wszystkie',
  'Polityka',
  'Gospodarka',
  'Świat',
  'Sport',
  'Bezpieczeństwo',
];

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedUrgency: string;
  onUrgencyChange: (urgency: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedUrgency,
  onUrgencyChange,
  selectedCategory,
  onCategoryChange,
}) => {
  const urgencyOptions: { id: string; label: string; icon?: React.ReactNode; colorClass: string }[] = [
    { id: 'ALL', label: 'Wszystkie', colorClass: 'text-slate-300' },
    {
      id: 'FLASH',
      label: 'FLASH',
      icon: <Flame className="w-3 h-3 fill-red-500 text-red-500" />,
      colorClass: 'text-red-400',
    },
    {
      id: 'URGENT',
      label: 'Pilne',
      icon: <AlertCircle className="w-3 h-3 text-amber-500" />,
      colorClass: 'text-amber-400',
    },
    {
      id: 'ROUTINE',
      label: 'Standard',
      icon: <Clock className="w-3 h-3 text-sky-400" />,
      colorClass: 'text-sky-300',
    },
  ];

  return (
    <div className="bg-slate-900/60 border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[220px] max-w-md">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Szukaj w tytule, leadzie lub sygnaturze..."
          className="w-full pl-8 pr-7 py-1.5 bg-slate-950/70 border border-slate-700/80 rounded text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-red-500 transition"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Urgency Pill Toggles */}
      <div className="flex items-center gap-1 bg-slate-950/60 p-0.5 rounded border border-slate-800">
        {urgencyOptions.map((opt) => {
          const isActive = selectedUrgency === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onUrgencyChange(opt.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-medium transition cursor-pointer ${
                isActive
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 border border-transparent'
              }`}
            >
              {opt.icon}
              <span className={isActive ? 'font-bold' : ''}>{opt.label}</span>
            </button>
          );
        })}
      </div>

      {/* Category Filter Chips / Select */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
        <span className="text-[11px] font-mono text-slate-500 hidden sm:inline uppercase">
          Kategoria:
        </span>
        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-300 font-mono focus:outline-none focus:border-red-500"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat === 'Wszystkie' ? 'ALL' : cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
