import React, { type ReactNode } from 'react';
import { Question } from 'phosphor-react';

interface Props {
  text: string;
  children?: ReactNode;
}

const Tooltip: React.FC<Props> = ({ text, children }) => {
  return (
    <div className="relative flex items-center group">
      {/* El contenido que activa el tooltip */}
      {children || <Question size={14} className="text-gray-400 cursor-help" />}
      
      {/* El tooltip que aparece al hacer hover */}
      {/* FIX: Z-Index muy alto y posicionamiento ajustado */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px]
                      bg-gray-900 text-gray-200 text-xs rounded-lg py-2 px-3
                      opacity-0 group-hover:opacity-100 transition-opacity duration-200
                      pointer-events-none z-[9999] shadow-xl border border-gray-700 text-center leading-relaxed">
        {text}
        {/* Flecha */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 
                       border-x-4 border-x-transparent 
                       border-t-4 border-t-gray-700">
        </div>
      </div>
    </div>
  );
};

export default Tooltip;