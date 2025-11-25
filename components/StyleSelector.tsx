import React, { useState, useRef, useEffect } from 'react';
import { ArtStyle } from '../types';
import { Palette, Box, FileDigit, Tent, Droplet, Zap, Coffee, Cpu } from 'lucide-react';

interface StyleSelectorProps {
  selectedStyle: ArtStyle;
  onSelect: (style: ArtStyle) => void;
  labels: {
    styleLabel: string;
    [key: string]: string;
  };
}

export const StyleSelector: React.FC<StyleSelectorProps> = ({ selectedStyle, onSelect, labels }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const styles: { id: ArtStyle; icon: React.ReactNode; labelKey: string; color: string }[] = [
    { id: 'DEFAULT', icon: <Palette className="w-4 h-4" />, labelKey: 'styleDefault', color: 'text-indigo-300' },
    { id: 'PIXEL', icon: <FileDigit className="w-4 h-4" />, labelKey: 'stylePixel', color: 'text-green-400' },
    { id: 'CLAY', icon: <Box className="w-4 h-4" />, labelKey: 'styleClay', color: 'text-orange-400' },
    { id: 'ORIGAMI', icon: <Tent className="w-4 h-4" />, labelKey: 'styleOrigami', color: 'text-yellow-400' },
    { id: 'WATERCOLOR', icon: <Droplet className="w-4 h-4" />, labelKey: 'styleWatercolor', color: 'text-blue-400' },
    { id: 'CYBERPUNK', icon: <Cpu className="w-4 h-4" />, labelKey: 'styleCyberpunk', color: 'text-cyan-400' },
    { id: 'VINTAGE', icon: <Coffee className="w-4 h-4" />, labelKey: 'styleVintage', color: 'text-amber-700' },
    { id: 'NEON', icon: <Zap className="w-4 h-4" />, labelKey: 'styleNeon', color: 'text-fuchsia-400' },
  ];

  const activeStyle = styles.find(s => s.id === selectedStyle) || styles[0];

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-full transition-all flex items-center gap-2 border ${
          selectedStyle !== 'DEFAULT' 
            ? 'bg-white text-indigo-950 border-transparent shadow-md' 
            : 'bg-indigo-900/50 text-indigo-300 border-white/10 hover:text-white'
        }`}
        title={labels.styleLabel}
      >
        {activeStyle.icon}
        {selectedStyle !== 'DEFAULT' && <span className="text-xs font-bold hidden xl:inline">{labels[activeStyle.labelKey]}</span>}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-indigo-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 animate-fade-in-up">
          <div className="p-2 grid gap-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 px-2 py-1">{labels.styleLabel}</p>
            {styles.map((style) => (
              <button
                key={style.id}
                onClick={() => {
                  onSelect(style.id);
                  setIsOpen(false);
                }}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                  selectedStyle === style.id
                    ? 'bg-white/10 text-white'
                    : 'text-indigo-200 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className={style.color}>{style.icon}</span>
                {labels[style.labelKey]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};