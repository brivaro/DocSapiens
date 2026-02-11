import React from 'react';
import { Robot } from 'phosphor-react';

const WelcomePlaceholder: React.FC = () => {
  return (
    <div className="text-center h-full flex flex-col justify-center items-center gap-4 animate-fade-in">
      <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center border border-gray-700 shadow-lg">
        <Robot size={48} weight="light" className="text-blue-500" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">DocSapiens Chat</h2>
        <div className="inline-block mt-2 py-2 px-6 bg-gray-800 rounded-full shadow-md border border-gray-700">
           <p className="typewriter-text text-gray-300 font-medium">Selecciona el contexto y pregunta...</p>
        </div>
      </div>
    </div>
  );
};

export default WelcomePlaceholder;