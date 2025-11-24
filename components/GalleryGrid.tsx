import React from 'react';
import { InfographicItem } from '../types';
import { Rocket } from 'lucide-react';

interface GalleryGridProps {
  items: InfographicItem[];
  onItemClick: (item: InfographicItem) => void;
  emptyMessage: string;
}

export const GalleryGrid: React.FC<GalleryGridProps> = ({ items, onItemClick, emptyMessage }) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-24 bg-indigo-900/20 rounded-3xl border border-dashed border-white/10 flex flex-col items-center">
        <div className="w-16 h-16 bg-indigo-800/50 rounded-full flex items-center justify-center mb-4">
            <Rocket className="w-8 h-8 text-indigo-400" />
        </div>
        <p className="text-indigo-300 font-bold text-lg">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {items.map((item) => (
        <div 
          key={item.id}
          className="group cursor-pointer flex flex-col gap-3 p-3 rounded-2xl hover:bg-white/5 transition-all duration-300 hover:-translate-y-1"
          onClick={() => onItemClick(item)}
        >
          <div className="relative aspect-[3/4] rounded-xl bg-slate-800 overflow-hidden border border-white/10 shadow-lg group-hover:shadow-purple-500/20 transition-all">
             <img 
                src={item.imageUrl} 
                alt={item.fact.title}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {/* Hover Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
          
          <div className="px-1">
            <h4 className="text-white font-bold text-sm truncate font-space group-hover:text-cyan-300 transition-colors">{item.fact.title}</h4>
            <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider truncate">{item.fact.domain}</p>
          </div>
        </div>
      ))}
    </div>
  );
};