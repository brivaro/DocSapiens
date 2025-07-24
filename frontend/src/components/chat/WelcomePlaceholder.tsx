import React from 'react';
import { Robot } from 'phosphor-react';

const WelcomePlaceholder: React.FC = () => {
  return (
    <div className="text-center text-gray-500 h-full flex flex-col justify-center items-center gap-4">
      <Robot size={48} weight="light" className="text-blue-500" />
      <div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">DocSapiens Chat</h2>
        {/* Este div aplica la animación de escritura */}
        <div className="inline-block mt-2 py-2 px-4 bg-white rounded-lg shadow-md">
           <p className="typewriter-text text-gray-500">Select your context and ask a question to begin...</p>
        </div>
      </div>
    </div>
  );
};

export default WelcomePlaceholder;