
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterPillProps {
  label: string;
  value: string;
  options: FilterOption[] | string[];
  onSelect: (value: string) => void;
  allLabel?: string;
}

export const FilterPill: React.FC<FilterPillProps> = ({ 
  label, 
  value, 
  options, 
  onSelect,
  allLabel = "All"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Normalize options to object array
  const normalizedOptions: FilterOption[] = options.map(opt => 
    typeof opt === 'string' ? { label: opt, value: opt } : opt
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = value !== 'All';
  const displayValue = value === 'All' ? allLabel : normalizedOptions.find(o => o.value === value)?.label || value;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all border ${
          isActive || isOpen
            ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
            : 'bg-white/5 text-indigo-300 border-white/10 hover:bg-white/10 hover:text-white'
        }`}
      >
        <span className={isActive ? 'text-indigo-200' : 'opacity-70'}>{label}:</span>
        <span className="truncate max-w-[100px]">{displayValue}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-48 bg-slate-900 border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="max-h-60 overflow-y-auto py-1">
            <button
                onClick={() => {
                  onSelect('All');
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-xs font-bold flex items-center justify-between hover:bg-white/5 ${
                  value === 'All' ? 'text-fuchsia-400' : 'text-gray-400'
                }`}
            >
                {allLabel}
                {value === 'All' && <Check className="w-3 h-3" />}
            </button>
            <div className="h-px bg-white/5 my-1"></div>
            {normalizedOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onSelect(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-xs font-medium flex items-center justify-between hover:bg-white/5 ${
                  value === opt.value ? 'text-white' : 'text-indigo-200'
                }`}
              >
                {opt.label}
                {value === opt.value && <Check className="w-3 h-3 text-fuchsia-400" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
