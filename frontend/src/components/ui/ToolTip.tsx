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
      {/* LA CORRECCIÓN CLAVE: Añadimos z-10 para que "flote" por encima de su contenedor */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs
                      bg-gray-800 text-white text-xs rounded-md py-1.5 px-3
                      opacity-0 group-hover:opacity-100 transition-opacity duration-300
                      pointer-events-none z-10">
        {text}
        {/* MEJORA VISUAL: Añadimos una flecha con bordes de CSS */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 
                       border-x-4 border-x-transparent 
                       border-t-4 border-t-gray-800">
        </div>
      </div>
    </div>
  );
};

export default Tooltip;