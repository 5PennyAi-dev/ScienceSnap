import React from 'react';
import { ScientificFact } from '../types';
import { ArrowRight, BookOpen } from 'lucide-react';

interface FactCardProps {
  fact: ScientificFact;
  onSelect: (fact: ScientificFact) => void;
  index: number;
  labels: {
    factLabel: string;
    createBtn: string;
  };
}

export const FactCard: React.FC<FactCardProps> = ({ fact, onSelect, index, labels }) => {
  // Colorful themes for cards
  const themes = [
    { border: 'hover:border-fuchsia-400', shadow: 'hover:shadow-fuchsia-500/30', badge: 'text-fuchsia-300' },
    { border: 'hover:border-cyan-400', shadow: 'hover:shadow-cyan-500/30', badge: 'text-cyan-300' },
    { border: 'hover:border-yellow-400', shadow: 'hover:shadow-yellow-500/30', badge: 'text-yellow-300' },
    { border: 'hover:border-purple-400', shadow: 'hover:shadow-purple-500/30', badge: 'text-purple-300' },
  ];

  const theme = themes[index % themes.length];

  return (
    <div 
      className={`bg-indigo-900/30 backdrop-blur-sm border border-white/10 rounded-2xl flex flex-col h-full transition-all duration-300 group relative overflow-hidden hover:-translate-y-1 hover:bg-indigo-900/50 shadow-lg ${theme.border} ${theme.shadow}`}
    >
      {/* Decoration Blob */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors"></div>
      
      <div className="p-6 flex flex-col h-full relative z-10">
        <div className="flex justify-between items-center mb-4">
          <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${theme.badge}`}>
             <BookOpen className="w-3 h-3" />
             {fact.domain}
          </span>
          <span className="text-xs font-mono text-white/30 font-bold">#{String(index + 1).padStart(2, '0')}</span>
        </div>
        
        <h3 className="text-xl font-bold text-white mb-3 font-space leading-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-300 transition-all">
          {fact.title}
        </h3>
        
        <p className="text-indigo-200/80 text-sm leading-relaxed mb-6 line-clamp-4 flex-grow">
          {fact.text}
        </p>

        <button 
            onClick={() => onSelect(fact)}
            className="w-full py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-white hover:bg-white hover:text-indigo-900 transition-all flex items-center justify-between group-hover:border-transparent hover:shadow-lg"
        >
          {labels.createBtn}
          <ArrowRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-all transform -translate-x-2 group-hover:translate-x-0" />
        </button>
      </div>
    </div>
  );
};